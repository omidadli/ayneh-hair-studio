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
const VISION_MODEL='gemini-3-6-flash-openai';
const VISION_URL='https://api.kie.ai/'+VISION_MODEL+'/v1/chat/completions';

async function provider(env,path,body){must(env.KIE_API_KEY,'تولید واقعی هنوز متصل نشده است',503);const res=await fetch('https://api.kie.ai'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+env.KIE_API_KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await res.json();must(res.ok&&d.code===200,'سرویس تصویر درخواست را نپذیرفت',502);return d.data;}

/* A definite rejection of the chosen model (e.g. not enabled on the account) falls back to the
   previous model; network failures are not retried so a paid task is never created twice. */
export async function createImageTask(env,cfg,input){const model=IMAGE_MODELS[cfg.image_model]||IMAGE_MODELS.pro;try{return {...await provider(env,'/api/v1/jobs/createTask',{model,input}),model}}catch(e){if(!(e instanceof Problem)||e.status!==502||model===FALLBACK_MODEL)throw e;return {...await provider(env,'/api/v1/jobs/createTask',{model:FALLBACK_MODEL,input}),model:FALLBACK_MODEL}}}

export async function recordInfo(env,taskId){return provider(env,'/api/v1/jobs/recordInfo?taskId='+encodeURIComponent(taskId));}

function toBase64(bytes){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(binary);}

export async function uploadProvider(env,m){const object=await bucketFor(env).get(m.object_key);must(object,'عکس در دسترس نیست',410);const bytes=new Uint8Array(await object.arrayBuffer());const res=await fetch('https://kieai.redpandaai.co/api/file-base64-upload',{method:'POST',headers:{Authorization:'Bearer '+env.KIE_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({base64Data:'data:'+m.mime+';base64,'+toBase64(bytes),uploadPath:'ayneh',fileName:uid()+'.jpg'})});const d=await res.json();must(d.success&&d.data?.downloadUrl,'ارسال عکس انجام نشد',502);return d.data.downloadUrl;}

/* Vision → JSON for the consultant. `cacheKey` (hash of the photo bytes + prompt version) makes
   a re-analysis of the same photo free and skips both caps. Two per-customer daily caps guard
   a real provider call: `tryLimit` is spent on every attempt (protects the provider key), while
   `okLimit` is checked before we pay for a call and spent only when an analysis actually came
   back — a failed call never eats the customer's one free result. Returns {ok:true,value,cached}
   or {ok:false,reason} — the caller falls back to the questionnaire and never invents a result.
   KIE reports errors as HTTP 200 with {code,msg}, so the body is checked before choices. */
export async function visionJSON(env,db,{cacheKey,system,user,image,tryLimit,okLimit}){
 if(cacheKey){const hit=await db.prepare('SELECT value FROM ai_cache WHERE key=?').bind(cacheKey).first();if(hit){try{return {ok:true,value:JSON.parse(hit.value),cached:true}}catch{}}}
 if(!env.KIE_API_KEY)return {ok:false,reason:'no-key'};
 if(okLimit){
  const row=await db.prepare('SELECT count,expires_at FROM limits WHERE key=?').bind(await hash(okLimit.key)).first();
  if(row&&row.expires_at>=Date.now()&&row.count>=okLimit.max)throw new Problem(429,okLimit.message||'تحلیل عکس امروز تمام شد؛ فردا دوباره امتحان کن یا وارد حساب شو.');
 }
 if(tryLimit)await limited(db,tryLimit.key,tryLimit.max,tryLimit.message||'چند بار تلاش کردی؛ کمی بعد دوباره امتحان کن');
 const url='data:'+(image.mime||'image/jpeg')+';base64,'+toBase64(image.bytes);
 try{
  const res=await fetch(VISION_URL,{method:'POST',headers:{Authorization:'Bearer '+env.KIE_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:VISION_MODEL,stream:false,reasoning_effort:'low',messages:[{role:'system',content:system},{role:'user',content:[{type:'text',text:user},{type:'image_url',image_url:{url}}]}]})});
  const d=await res.json().catch(()=>null);
  if(!res.ok||(d&&d.code&&d.code!==200))return {ok:false,reason:'provider'};
  const content=d&&d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content;
  if(typeof content!=='string'||!content.trim())return {ok:false,reason:'empty'};
  const first=content.indexOf('{'),last=content.lastIndexOf('}');
  if(first<0||last<=first)return {ok:false,reason:'invalid'};
  const value=JSON.parse(content.slice(first,last+1));
  if(okLimit)await limited(db,okLimit.key,okLimit.max,okLimit.message||'تحلیل عکس امروز تمام شد؛ فردا دوباره امتحان کن یا وارد حساب شو.');
  if(cacheKey)await db.prepare('INSERT INTO ai_cache(key,value,created_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,created_at=excluded.created_at').bind(cacheKey,JSON.stringify(value),Date.now()).run();
  return {ok:true,value,cached:false};
 }catch(e){if(e instanceof Problem)throw e;return {ok:false,reason:'invalid'}}
}
