/* worker/ai.js — the single door to the KIE provider (env.KIE_API_KEY). Every model call in
   the app goes through this module: image jobs (create/record/upload) and the vision chat used
   by the beauty consultant. Rate limits and result caching live here so no route can talk to
   the provider directly and forget them. No key is ever written to code or logs. */
import {must,Problem,limited,hash,uid} from './domain.js';
import {bucketFor} from './storage.js';

/* Image model per salon: 'pro' (Nano Banana Pro, best quality, default) or 'fast' (Nano Banana 2.1). */
export const IMAGE_MODELS={pro:'nano-banana-pro',fast:'nano-banana-2-1'};
const FALLBACK_MODEL='nano-banana-2';
/* Vision chat (OpenAI-compatible, model chosen by the URL path; docs.kie.ai → Chat Models).
   Gemini 3.5 Flash (openai) is obsolete on KIE — 3.6 / 3.8 Flash stay. */
/* KIE's chat models (docs.kie.ai/market/gemini): tried in order until one answers; the one that
   worked is remembered for this worker instance. Images go by a provider-hosted URL (KIE's file
   upload), since the chat endpoints document URL input only. */
const VISION_MODELS=['gemini-3-flash','gemini-2.5-flash','gemini-3.1-pro'];
const visionUrls=m=>['https://api.kie.ai/'+m+'/v1/chat/completions','https://api.kie.ai/api/v1/'+m+'/v1/chat/completions'];
let visionPick=null;

async function provider(env,path,body){must(env.KIE_API_KEY,'تولید واقعی هنوز متصل نشده است',503);const res=await fetch('https://api.kie.ai'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+env.KIE_API_KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await res.json();must(res.ok&&d.code===200,'سرویس تصویر درخواست را نپذیرفت',502);return d.data;}

/* A definite rejection of the chosen model (e.g. not enabled on the account) falls back to the
   previous model; network failures are not retried so a paid task is never created twice. */
export async function createImageTask(env,cfg,input){const model=IMAGE_MODELS[cfg.image_model]||IMAGE_MODELS.pro;try{return {...await provider(env,'/api/v1/jobs/createTask',{model,input}),model}}catch(e){if(!(e instanceof Problem)||e.status!==502||model===FALLBACK_MODEL)throw e;return {...await provider(env,'/api/v1/jobs/createTask',{model:FALLBACK_MODEL,input}),model:FALLBACK_MODEL}}}

export async function recordInfo(env,taskId){return provider(env,'/api/v1/jobs/recordInfo?taskId='+encodeURIComponent(taskId));}

function toBase64(bytes){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(binary);}

export async function uploadProvider(env,m){const object=await bucketFor(env).get(m.object_key);must(object,'عکس در دسترس نیست',410);const bytes=new Uint8Array(await object.arrayBuffer());const res=await fetch('https://kieai.redpandaai.co/api/file-base64-upload',{method:'POST',headers:{Authorization:'Bearer '+env.KIE_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({base64Data:'data:'+m.mime+';base64,'+toBase64(bytes),uploadPath:'ayneh',fileName:uid()+'.jpg'})});const d=await res.json();must(d.success&&d.data?.downloadUrl,'ارسال عکس انجام نشد',502);return d.data.downloadUrl;}

/* Vision → JSON for the consultant. `cacheKey` (hash of the photo bytes + prompt version) makes
   a re-analysis of the same picture free and skips every cap. Costs are guarded BEFORE the
   provider is paid: the daily success slot (`okLimit`) is reserved atomically — limited()
   increments and rejects in one step, so concurrent requests cannot both slip through.
   Refund rules on failure: `okLimit` always comes back (she paid for a result and did not get
   one); `tryLimit` NEVER comes back — it counts attempts, billed or not, so a model that
   answers non-JSON cannot loop forever; `netLimit` comes back only when the request clearly
   never reached a billed answer (a fetch error or an HTTP non-2xx) — a 2xx with junk or a
   timeout was billed and keeps its slot. `tryLimit` also protects the provider key and
   `netLimit` bounds a whole network per day (the DEMO_IP_DAILY idea).
   A paid, successful result is never discarded:
   no limit runs after the value exists and the cache write is best-effort. Returns
   {ok:true,value,cached} or {ok:false,reason} — the caller falls back to the questionnaire and
   never invents a result. KIE reports errors as HTTP 200 with {code,msg}, so the body is
   checked before choices; the call itself is bounded by a 25-second timeout. */
export async function visionJSON(env,db,{cacheKey,system,user,image,tryLimit,okLimit,netLimit}){
 if(cacheKey){const hit=await db.prepare('SELECT value FROM ai_cache WHERE key=?').bind(cacheKey).first();if(hit){try{return {ok:true,value:JSON.parse(hit.value),cached:true}}catch{}}}
 if(!env.KIE_API_KEY)return {ok:false,reason:'no-key'};
 /* Give a reserved slot back: `limited` stores hash(key), one count per reserve. Storage errors
    during the refund are swallowed so they never mask the original failure. */
 const refund=async key=>{try{if(key)await db.prepare('UPDATE limits SET count=CASE WHEN count>0 THEN count-1 ELSE 0 END WHERE key=?').bind(await hash(key)).run()}catch{}};
 /* Reserve the success slot BEFORE the call. A rejected reserve undoes its own increment, so
    the counter only ever holds slots that were actually granted. */
 if(okLimit){
  try{await limited(db,okLimit.key,okLimit.max,okLimit.message||'تحلیل عکس امروز تمام شد؛ فردا دوباره امتحان کن یا وارد حساب شو.')}
  catch(e){await refund(okLimit.key);throw e}
 }
 try{
  if(tryLimit)await limited(db,tryLimit.key,tryLimit.max,tryLimit.message||'چند بار تلاش کردی؛ کمی بعد دوباره امتحان کن');
  if(netLimit)await limited(db,netLimit.key,netLimit.max,netLimit.message||'از این شبکه امروز چندین تحلیل زده شد؛ فردا دوباره امتحان کن.');
 }catch(e){if(okLimit)await refund(okLimit.key);throw e}
 /* Refund helpers — the rules are in the header comment above. */
 const refundOk=async()=>{if(okLimit)await refund(okLimit.key)};
 const refundNet=async()=>{if(netLimit)await refund(netLimit.key)};
 let url=image.url||'data:'+(image.mime||'image/jpeg')+';base64,'+toBase64(image.bytes);
 const body=m=>JSON.stringify({model:m,stream:false,include_thoughts:false,reasoning_effort:'low',messages:[{role:'system',content:system},{role:'user',content:[{type:'text',text:user},{type:'image_url',image_url:{url}}]}]});
 const order=visionPick?[visionPick]:VISION_MODELS.flatMap(m=>visionUrls(m).map(u=>({m,u})));
 let d=null,detail='';
 try{
  for(const c of order){
   const res=await fetch(c.u,{method:'POST',headers:{Authorization:'Bearer '+env.KIE_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(40000),body:body(c.m)});
   const j=await res.json().catch(()=>null);
   const ok=res.ok&&j&&(!j.code||j.code===200)&&j.choices&&j.choices[0];
   if(ok){d=j;visionPick=c;break}
   detail=(c.m+' '+res.status+' '+String(j&&(j.msg||j.message||(j.error&&j.error.message))||'')).slice(0,160);
   console.error('vision',detail);
  }
 }catch(e){
  if(e instanceof Problem)throw e;
  await refundOk();
  if(!(e&&e.name==='TimeoutError'))await refundNet();
  return {ok:false,reason:e&&e.name==='TimeoutError'?'timeout':'invalid'};
 }
 try{
  if(!d){await refundOk();await refundNet();return {ok:false,reason:'provider',detail}}
  const content=d&&d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content;
  if(typeof content!=='string'||!content.trim()){await refundOk();return {ok:false,reason:'empty'}}
  const first=content.indexOf('{'),last=content.lastIndexOf('}');
  if(first<0||last<=first){await refundOk();return {ok:false,reason:'invalid'}}
  let value;
  try{value=JSON.parse(content.slice(first,last+1))}catch{await refundOk();return {ok:false,reason:'invalid'}}
  // paid — never discarded from here on
  if(cacheKey){try{await db.prepare('INSERT INTO ai_cache(key,value,created_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,created_at=excluded.created_at').bind(cacheKey,JSON.stringify(value),Date.now()).run()}catch{}}
  return {ok:true,value,cached:false};
 }catch(e){
  /* Unexpected internal failure after an answered request: only the success slot goes back. */
  if(e instanceof Problem)throw e;
  await refundOk();
  return {ok:false,reason:'invalid'};
 }
}
