/* worker/color.js — Phase 2: pro hair colour (customer side).
   The approximate hair-condition assessment is a vision call through worker/ai.js with the same
   caps and byte-hash cache as the beauty consultant: the success slot is reserved atomically
   before the call, refunded on every failure, the attempt counter never, the network counter
   only when nothing was billed, and a timeout counts as billed. The result is always labelled
   «تخمینی» (approximate) — it is a suggestion for her and her colourist, never a diagnosis.
   The correction plan and the formula draft rules are pure functions: deterministic, testable,
   and honest about being a draft that a specialist must confirm. */
import {must,Problem,uid,hash,limited,phone} from './domain.js';
import {COLOR_STYLES} from './lines.js';
import {visionJSON,chatJSON} from './ai.js';
import {bucketFor} from './storage.js';
import {isDirect} from './customers.js';

const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;

const J=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
const parse=s=>{try{return JSON.parse(s||'{}')}catch{return {}}};

/* The two condition questions (skippable, single-choice) that feed the porosity estimate
   together with the photo. One source of truth for the sheet and the tests. */
export const CONDITION_QUESTIONS=[
 {key:'coloured',label:'قبلاً موهات رنگ شده؟',options:[['no','نه'],['once','یک بار'],['often','چندان بار']]},
 {key:'wash',label:'بعد از شست‌وشو موهات چطور می‌ماند؟',options:[['normal','نرمال می‌ماند'],['dry','زود خشک می‌شود'],['fade','رنگ زود می‌پرد']]}
];
export const CONDITION_PROBLEMS=[
 ['uneven','رنگ یک‌نواخت نیست'],['fade','رنگ زود می‌پرد'],['root','ریشه زود ظهور می‌دهد'],
 ['streak','رگه می‌شود'],['inconsistent','رنگ ناهمگون است'],['bleached','دکلره شده']
];
const PROMPT_V='v1';
/* One network (IP) may push at most this many condition attempts a day for a guest — the same
   idea as the consultant's NET_DAILY and the demo counter. */
const NET_DAILY=10;
/* Cache key component: SHA-256 of the photo BYTES, so the same picture is never paid twice. */
const hashBytes=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
const SYSTEM='You are a hair-colour assessment engine of Ayneh, a Persian salon try-on app. Analyse the photo and reply with ONE JSON object only — no markdown, no commentary. Schema: {"base_level": an integer 1-10 (1 = very light hair, 10 = very dark hair), "gray_percent": an integer 0-100 (share of grey hair), "porosity": "low|medium|high", "confidence": {each of the three keys: a number 0.0-1.0}}. Rules: this is a styling suggestion only, never a medical or diagnostic judgement; do not guess age or health; if a feature is not visible in the photo, still return the JSON but give that field a confidence of 0.05; confidence below 0.6 means you are unsure and the customer will be asked.';
const USER='Assess the hair in this photo: its base colour level, how much grey there is, and its approximate porosity.';

/* Validate the model's JSON: clamp the numbers, keep the porosity enum, list the unsure fields. */
export function cleanCondition(raw){
 const src=raw&&typeof raw==='object'?raw:{};
 const out={base_level:null,gray_percent:null,porosity:null,confidence:{},low:[]};
 const bl=Math.round(Number(src.base_level));
 if(Number.isFinite(bl))out.base_level=Math.max(1,Math.min(10,bl));
 const gp=Math.round(Number(src.gray_percent));
 if(Number.isFinite(gp))out.gray_percent=Math.max(0,Math.min(100,gp));
 const po=String(src.porosity||'').trim().toLowerCase();
 if(['low','medium','high'].includes(po))out.porosity=po;
 for(const k of ['base_level','gray_percent','porosity']){
  let c=Number(src.confidence&&src.confidence[k]);
  if(!Number.isFinite(c))c=0.5;c=Math.max(0,Math.min(1,c));
  out.confidence[k]=c;
  if(c<0.6)out.low.push(k);
 }
 return out;
}
/* The porosity estimate combines the photo with her two answers: previous colouring and how the
   hair behaves after washing raise it. The adjustment is a transparent rule, never a guess
   presented as a photo result. */
export function porosityFrom(photo,answers){
 const rank={low:1,medium:2,high:3};
 let r=rank[photo]||2;
 const a=answers||{};
 if(a.coloured==='often')r+=1;
 if(a.wash==='dry'||a.wash==='fade')r+=1;
 return r>=3?'high':r===2?'medium':'low';
}
function cleanConditionAnswers(raw){
 const out={};if(!raw||typeof raw!=='object')return out;
 for(const q of CONDITION_QUESTIONS){const v=raw[q.key];if(typeof v==='string'&&q.options.some(o=>o[0]===v))out[q.key]=v}
 return out;
}

/* ---------- the correction plan: deterministic rules, always a suggestion with a warning ---------- */
const STEP={
 strip:{title:'پاک‌کردن (دکلره)',text:'موها را از رنگ و ته‌رنگ قبلی پاک می‌کنید تا یک پایه‌ی یک‌دست بمانند؛ این مرحله برای تغییر به رنگِ روشن‌تر یاإصلاح رگه‌ها است.'},
 deposit:{title:'پیگمنت‌گذاری',text:'رنگ هدف را با اکسیدان مناسب روی پایه‌ی آماده گذاشت؛ رنگ هدف مستقیماً روی مو نشسته و ریشه یک‌دست می‌شود.'},
 tone:{title:'تونر',text:'برای هم‌رنگی و برطرف کردن ته‌رنگ نامطلوب، تونرِ مناسب به مو می‌گذارید؛ این مرحله رنگ را یک‌دست و براق می‌کند.'},
 root:{title:'ریشه‌سازی',text:'فقط ناحیهٔ ریشه را با رنگ تجدید می‌کنید؛ ساقه و سر از رنگ فعلی سركت می‌ماند، تا ریشه زود ظهور نگیرد.'},
 gloss:{title:'براق‌کردن',text:'در مرحلهٔ آخر، براق‌کننده یا Olen بر مو می‌گذارید تا رنگ یک‌دست، براق و پایدار بماند.'}
};
const tagOf=name=>{const c=COLOR_STYLES.find(x=>x[0]===String(name||'').trim());return c?c[2]:null};
/* «رنگ فعلی/مشکل → هدف»: every plan is a suggestion, and every plan ends with the same
   warning — it never replaces a specialist's in-person judgement. */
export function correctionPlan(current,problem,goal){
 const cur=tagOf(current),goalTag=tagOf(goal);
 const prob=String(problem||'');
 const steps=[];
 const add=k=>{if(!steps.some(s=>s.key===k))steps.push({key:k,...STEP[k]})};
 if(prob==='bleached'){add('deposit');add('tone');add('gloss')}
 else if(prob==='root'){add('root');add('tone')}
 else if(prob==='streak'){add('strip');add('tone');add('gloss')}
 else if(prob==='fade'){add('tone');add('gloss')}
 else if(cur==='تیره'&&goalTag&&['روشن و بلوند','فانتزی'].includes(goalTag)){add('strip');add('tone');add('gloss')}
 else if(cur==='قهوه‌ای'&&goalTag==='روشن و بلوند'){add('strip');add('tone');add('gloss')}
 else if(goalTag==='تیره'&&cur&&cur!=='تیره'){add('deposit');add('tone');add('gloss')}
 else {add('deposit');add('tone');add('gloss')}
 return {
  draft:true,
  current:current||'',
  problem:prob,
  goal:goal||'',
  steps,
  warning:'این برنامهٔ اصلاح، پیشنهادی تخمینی است و جای مشورت حضوری با رنگ‌کار را نمی‌گیرد؛ اجرای ناصحیح می‌تواند به مو آسیب بزند.'
 };
}

/* ---------- the formula draft: rules first, the model completes it, always a draft ---------- */
export const OXIDANTS=['3','6','9','12'];
export const RATIOS=['1:1','1:1.5','1:2'];
/* A rule-based starting point from the base level alone — the model call fills in the brand,
   the shade codes and the amounts, and the stylist confirms everything by hand. */
export function ruleDraftFormula(baseLevel,target){
 const bl=Math.max(1,Math.min(10,Math.round(Number(baseLevel)||5)));
 const oxidant=bl<=3?'6':bl<=6?'9':bl===7?'9':'12';
 const ratio=bl<=3?'1:1':bl<=6?'1:1':bl===7?'1:1.5':'1:2';
 return {
  brand:'',code:'',
  amounts:[{name:String(target||'').trim()||'رنگ هدف',amount:'۶۰ گرم'}],
  oxidant_percent:oxidant,oxidant_ratio:ratio,
  pause_root:20,pause_shaft:30,pause_top:15,
  note:'پیش‌نویس بر اساس سطح پایه؛ برند، کدِ شید، مقدار و زمان مکث باید با رنگ‌کار تأیید شوند.'
 };
}
const FORMULA_SYSTEM='You are a hair-colour formula assistant for Ayneh, a Persian salon app. Given a hair base level (1-10, 1 very light, 10 very dark) and a target hair colour, propose a starting colouring formula. Reply with ONE JSON object only — no markdown, no commentary. Schema: {"brand": "a plausible hair-colour brand name", "code": "a plausible shade code for the target colour", "amounts": [{"name": "shade name", "amount": "grams, e.g. 60 gr"}], "oxidant_percent": "3|6|9|12", "oxidant_ratio": "1:1|1:1.5|1:2", "pause_root": minutes 5-60, "pause_shaft": minutes 5-60, "pause_top": minutes 5-60, "note": "one Persian sentence on what to watch for"}. Higher base levels need stronger oxidant. This is a draft for a professional to confirm — never present it as a final formula.';
export function formulaPromptUser(baseLevel,target,current){
 return 'Base level: '+baseLevel+'. Target colour: '+String(target||'').trim()+(current?'; current colour: '+String(current).trim():'')+'. Propose the starting formula as JSON.';
}
/* Merge the model's draft over the rule draft: known fields only, numbers clamped, enums
   checked. Whatever the model omits or gets wrong, the rule default stays. The result is
   always marked a draft — the stylist confirms it by hand. */
export function cleanFormulaDraft(raw,rule,target){
 const src=raw&&typeof raw==='object'?raw:{};
 const out={...rule,brand:String(src.brand||'').trim().slice(0,40),code:String(src.code||'').trim().slice(0,20)};
 if(Array.isArray(src.amounts))out.amounts=src.amounts.slice(0,8).map(a=>({name:String(a&&a.name||'').trim().slice(0,60),amount:String(a&&a.amount||'').trim().slice(0,30)})).filter(a=>a.name);
 if(!out.amounts.length)out.amounts=rule.amounts;
 if(OXIDANTS.includes(String(src.oxidant_percent)))out.oxidant_percent=String(src.oxidant_percent);
 if(RATIOS.includes(String(src.oxidant_ratio)))out.oxidant_ratio=String(src.oxidant_ratio);
 for(const k of ['pause_root','pause_shaft','pause_top']){const n=Math.round(Number(src[k]));if(Number.isFinite(n))out[k]=Math.max(5,Math.min(60,n))}
 const note=String(src.note||'').trim().slice(0,200);
 out.note=note?note+'؛ '+rule.note:rule.note;
 out.target_color=String(target||'').trim().slice(0,60);
 out.draft=true;
 return out;
}
/* Stored formula rows are validated the same way on the way in (panel side). */
export function validateFormulaInput(b){
 const target=String(b.target_color||'').trim().slice(0,60);
 must(target.length>=2,'یک رنگ هدف بنویسید',400);
 must(COLOR_STYLES.some(c=>c[0]===target)||target.length<=60,'رنگ هدف معتبر نیست',400);
 const customer_phone=phone(String(b.customer_phone||''));
 const oxidant=String(b.oxidant_percent||'');must(OXIDANTS.includes(oxidant),'نوع اکسیدان معتبر نیست',400);
 const ratio=String(b.oxidant_ratio||'');must(RATIOS.includes(ratio),'نسبت اکسیدان معتبر نیست',400);
 const amounts=(Array.isArray(b.amounts)?b.amounts:[]).slice(0,8).map(a=>({name:String(a&&a.name||'').trim().slice(0,60),amount:String(a&&a.amount||'').trim().slice(0,30)})).filter(a=>a.name);
 const num=k=>{const n=Math.round(Number(b[k]));return Number.isFinite(n)?Math.max(0,Math.min(120,n)):null};
 return {
  customer_phone,target_color:target,current_color:String(b.current_color||'').trim().slice(0,60),
  brand:String(b.brand||'').trim().slice(0,40),code:String(b.code||'').trim().slice(0,20),
  amounts,oxidant_percent:oxidant,oxidant_ratio:ratio,
  pause_root:num('pause_root'),pause_shaft:num('pause_shaft'),pause_top:num('pause_top'),
  note:String(b.note||'').trim().slice(0,300),
  source:b.source==='manual'?'manual':'suggestion'
 };
}

/* ---------- routes (called from server.js api() after the session is resolved) ---------- */
async function ownPhoto(db,s,id){
 must(/^[a-f0-9-]{36}$/.test(String(id||'')),'عکس معتبر نیست',400);
 const m=await db.prepare('SELECT * FROM media WHERE id=? AND salon_id=?').bind(id,s.salon_id).first();
 must(m&&m.kind==='original','عکس پیدا نشد',404);
 const linked=m.session_id===s.id||(s.verified_phone&&m.session_id&&await db.prepare('SELECT 1 FROM sessions WHERE id=? AND salon_id=? AND verified_phone=?').bind(m.session_id,s.salon_id,s.verified_phone).first());
 must(linked,'عکس متعلق به این حساب نیست',403);
 return m;
}

export async function colorApi(req,env,{u,route,salon,s,clientIp}){
 const db=env.DB,phone=s.verified_phone;
 /* The condition assessment is a paid photo analysis and lives only on the direct studio
    salon — nowhere else can it spend. The correction planner and the formula cards are
    manager-console tools; owner auth is enforced in server.js before dispatch. */
 if(route==='color/analyze')must(isDirect(salon),'این بخش فقط در استودیوی آینه فعال است',404);
 if(route==='color/analyze'&&req.method==='POST'){
  const b=await req.json().catch(()=>({}));
  if(b.line!=='color')return J({ok:false,fallback:'questionnaire',reason:'line'});
  const m=await ownPhoto(db,s,b.photo_id);
  /* Caps follow the customer, not the salon: a signed-in one by phone, a guest by browser id
     plus the hashed network. Cache hits are free and skip every counter. */
  const v=/^[a-f0-9]{16,32}$/.test(String(b.v||''))?String(b.v):'';
  const who=phone?'colorcond:p:'+phone:'colorcond:g:'+(v||s.id)+':'+await hash(clientIp||'unknown');
  const object=await bucketFor(env).get(m.object_key);
  must(object,'عکس در دسترس نیست',410);
  const bytes=new Uint8Array(await object.arrayBuffer());
  const answers=cleanConditionAnswers(b.answers);
  const r=await visionJSON(env,db,{cacheKey:'colorcond:'+PROMPT_V+':'+await hashBytes(bytes),system:SYSTEM,user:USER,image:{mime:m.mime,bytes},
   tryLimit:{key:who+':try',max:phone?60:3,message:'چند بار تلاش کردی؛ کمی بعد دوباره امتحان کن'},
   okLimit:{key:who+':ok',max:phone?30:1,message:'تخمین وضعیت موهای امروز تمام شد؛ فردا دوباره امتحان کن یا وارد حساب شو.'},
   netLimit:phone?null:{key:'colorcond-net:'+(clientIp||'unknown'),max:NET_DAILY,message:'از این شبکه امروز چندین تخمین زده شد؛ فردا دوباره امتحان کن.'}});
  if(!r.ok){
   /* No key, over a cap or a failed call: never invent a photo analysis. Her own answers still
      give the porosity estimate (and only when she actually answered — never a bare default). */
   return J({ok:false,fallback:'questionnaire',reason:r.reason,answers,porosity:Object.keys(answers).length?porosityFrom(null,answers):null});
  }
  const c=cleanCondition(r.value);
  if(c.base_level===null&&c.gray_percent===null&&!c.porosity)return J({ok:false,fallback:'questionnaire',reason:'invalid'});
  return J({ok:true,base_level:c.base_level,gray_percent:c.gray_percent,porosity:porosityFrom(c.porosity,answers),confidence:c.confidence,low:c.low,answers,cached:!!r.cached,estimate:true});
 }
 if(route==='color/correct'&&req.method==='POST'){
  await limited(db,'color-correct:'+s.id,200,'چند بار تلاش کردی؛ کمی بعد دوباره امتحان کن');
  const b=await req.json().catch(()=>({}));
  return J(correctionPlan(String(b.current||'').trim().slice(0,60),String(b.problem||'').trim().slice(0,40),String(b.goal||'').trim().slice(0,60)));
 }
 if(route==='color/formula-suggest'&&req.method==='POST'){
  await limited(db,'color-formula:'+(phone||s.id)+':'+s.salon_id,30,'امروز فرمول زیادی درخواست دادی؛ فردا دوباره');
  const b=await req.json().catch(()=>({}));
  const bl=Math.max(1,Math.min(10,Math.round(Number(b.base_level)||5)));
  const target=String(b.target_color||'').trim().slice(0,60);
  must(target.length>=2,'یک رنگ هدف بنویسید',400);
  const rule=ruleDraftFormula(bl,target);
  /* The model completes the rule draft; without a key or on any failure the rule draft stands
     on its own — a result is never invented, and it is always labelled a draft. */
  const r=await chatJSON(env,db,{cacheKey:'colorformula:'+PROMPT_V+':'+bl+':'+await hash(target+'|'+String(b.current_color||'')),
   system:FORMULA_SYSTEM,user:formulaPromptUser(bl,target,b.current_color),
   tryLimit:{key:'colorformula-try:'+(phone||s.id),max:phone?60:10,message:'چند بار تلاش کردی؛ کمی بعد دوباره امتحان کن'},
   okLimit:{key:'colorformula-ok:'+(phone||s.id),max:phone?30:5,message:'فرمول‌های امروز تمام شد؛ فردا دوباره امتحان کن'},
   netLimit:{key:'colorformula-net:'+(clientIp||'unknown'),max:NET_DAILY,message:'از این شبکه امروز چندین فرمول درخواست شد؛ فردا دوباره امتحان کن.'}});
  const draft=r.ok?cleanFormulaDraft(r.value,rule,target):{...rule,target_color:target,draft:true};
  return J({draft:true,formula:draft,source:r.ok?(r.cached?'cache':'model'):'rules'});
 }
 /* The stylist's formula cards: one per customer phone per salon. The manager console owns
    them (owner session, enforced in server.js before dispatch), scoped to the active salon. */
 if(route==='color/formulas'&&req.method==='GET'){
  const rows=await all(db,'SELECT * FROM color_formulas WHERE salon_id=? ORDER BY created_at DESC',s.salon_id);
  return J({formulas:rows.map(r=>({id:r.id,customer_phone:r.customer_phone,target_color:r.target_color,current_color:r.current_color||'',brand:r.brand||'',code:r.code||'',amounts:parse(r.amounts),oxidant_percent:r.oxidant_percent,oxidant_ratio:r.oxidant_ratio,pause_root:r.pause_root,pause_shaft:r.pause_shaft,pause_top:r.pause_top,note:r.note||'',source:r.source,created_at:r.created_at}))});
 }
 if(route==='color/formulas'&&req.method==='POST'){
  must(isDirect(salon)||s.staff=='1','این بخش فقط در استودیوی آینه فعال است',404);
  const b=await req.json().catch(()=>({}));
  if(b.delete){must(/^[a-f0-9-]{36}$/.test(String(b.id||'')),'فرمول معتبر نیست',400);const n=await db.prepare('DELETE FROM color_formulas WHERE id=? AND salon_id=?').bind(b.id,s.salon_id).run();must(n.meta.changes,'فرمول پیدا نشد',404);return J({ok:true})}
  const v=validateFormulaInput(b);
  const existing=await one(db,'SELECT id FROM color_formulas WHERE salon_id=? AND customer_phone=?',s.salon_id,v.customer_phone);
  if(existing){
   await db.prepare('UPDATE color_formulas SET target_color=?,current_color=?,brand=?,code=?,amounts=?,oxidant_percent=?,oxidant_ratio=?,pause_root=?,pause_shaft=?,pause_top=?,note=?,source=? WHERE id=?')
    .bind(v.target_color,v.current_color,v.brand,v.code,JSON.stringify(v.amounts),v.oxidant_percent,v.oxidant_ratio,v.pause_root,v.pause_shaft,v.pause_top,v.note,v.source,existing.id).run();
   return J({ok:true,formula:{...v,id:existing.id}});
  }
  await db.prepare('INSERT INTO color_formulas(id,salon_id,customer_phone,target_color,current_color,brand,code,amounts,oxidant_percent,oxidant_ratio,pause_root,pause_shaft,pause_top,note,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
   .bind(uid(),s.salon_id,v.customer_phone,v.target_color,v.current_color,v.brand,v.code,JSON.stringify(v.amounts),v.oxidant_percent,v.oxidant_ratio,v.pause_root,v.pause_shaft,v.pause_top,v.note,v.source,Date.now()).run();
  return J({ok:true});
 }
 if(route==='color'||route.startsWith('color/'))throw new Problem(405,'متد مجاز نیست');
 throw new Problem(404,'مسیر یافت نشد');
}
