/* worker/consult.js — Phase 1: the beauty consultant («مشاور زیبایی هوشمند»).
   The vision analysis goes through worker/ai.js (the only module that talks to KIE) with a
   daily cap and a result cache; when it is unavailable the customer answers the same fields
   herself — a result is never invented. The ranked suggestions are pure rules over that
   service's own catalog, each with a one-sentence reason and an execution limit. Guests see
   everything in the sheet; only a signed-in customer's consultation is stored (drizzle/0030)
   and only she can share it with her stylist through a one-time, 72-hour link. */
import {must,Problem,uid,token,hash,limited} from './domain.js';
import {LINE_KEYS,LINE_LABEL,COLOR_STYLES,NAIL_STYLES,LASH_STYLES} from './lines.js';
import {styles} from './legacy.js';
import {visionJSON} from './ai.js';
import {isDirect} from './customers.js';
import {bucketFor} from './storage.js';
import {baseCSS} from './design.js';

const J=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
const parse=s=>{try{return JSON.parse(s||'{}')}catch{return {}}};

/* The six style questions (skippable, single-choice) and the analysis fields with their
   Persian labels. One source of truth: the sheet, the saved record and the stylist's page
   all render from these. */
export const QUESTIONS=[
 {key:'care',label:'حوصلهٔ نگهداری مدل را داری؟',options:[['low','کم'],['mid','متوسط'],['high','زیاد']]},
 {key:'occasion',label:'بیشتر برای چه موقعیتی؟',options:[['daily','روزمره'],['work','کاری و اداری'],['party','مجلسی و مهمانی'],['wedding','عروسی']]},
 {key:'boldness',label:'چقدر جسارت تغییر داری؟',options:[['same','همین خوبه'],['mild','یکم متفاوت'],['big','اساسی عوض شه']]},
 {key:'length',label:'طول دلخواهت؟',options:[['shorter','کوتاه‌تر'],['same','همین‌اندازه'],['longer','بلندتر']]},
 {key:'scalp',label:'حساسیت پوست سر؟',options:[['none','ندارم'],['sometimes','گاهی دارم'],['often','زیاد دارم']]},
 {key:'budget',label:'بودجه‌ات چطوره؟',options:[['normal','معمولی'],['high','بالاتر'],['any','فرقی نداره']]}
];
export const ANALYSIS_FIELDS=[
 {key:'face_shape',label:'فرم صورت',options:[['oval','بیضی'],['round','گرد'],['heart','قلبی'],['square','مربعی'],['oblong','کشیده'],['diamond','الماسی']]},
 {key:'hair_texture',label:'بافت مو',options:[['straight','صاف'],['wavy','موج'],['curly','فر']]},
 {key:'hair_length',label:'طول مو',options:[['short','کوتاه'],['medium','متوسط'],['long','بلند']]},
 {key:'hair_density',label:'تراکم مو',options:[['low','کم‌پشت'],['medium','متوسط'],['high','پرپشت']]},
 {key:'skin_undertone',label:'ته‌رنگ پوست',options:[['warm','گرم'],['cool','سرد'],['neutral','خنثی']]},
 {key:'hair_color',label:'رنگ فعلی مو',options:[['black','مشکی'],['dark_brown','قهوه‌ای تیره'],['brown','قهوه‌ای'],['blonde','بلوند'],['gray','خاکستری'],['red','قرمز'],['other','سایر']]}
];
/* Which fields matter for which service — a hand photo for nails should not ask about face
   shape, and the questionnaire stays short where the analysis adds nothing. */
export const RELEVANT={hair:['face_shape','hair_texture','hair_length','hair_density','skin_undertone','hair_color'],color:['skin_undertone','hair_color','hair_texture','hair_length'],nails:['skin_undertone'],lashes:['face_shape','skin_undertone']};
const ENUMS=Object.fromEntries(ANALYSIS_FIELDS.map(f=>[f.key,new Set(f.options.map(o=>o[0]))]));
const PROMPT_V='v1';
/* One network (IP) may push at most this many vision attempts a day for a guest — the same
   idea as DEMO_IP_DAILY: a farm of free browser ids behind one address stops here. Signed-in
   customers are bounded by their phone key instead, so they carry no network counter. */
const NET_DAILY=10;
/* Cache key component: SHA-256 of the photo BYTES, so the same picture re-uploaded under a
   new media id is still free (domain hash() takes strings, not bytes). */
const hashBytes=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
const SYSTEM='You are a beauty-analysis engine of Ayneh, a Persian salon try-on app. Analyse the photo and reply with ONE JSON object only — no markdown, no commentary. Schema: {"face_shape":"oval|round|heart|square|oblong|diamond","hair_texture":"straight|wavy|curly","hair_length":"short|medium|long","hair_density":"low|medium|high","skin_undertone":"warm|cool|neutral","hair_color":"black|dark_brown|brown|blonde|gray|red|other","confidence":{each of those six keys: a number 0.0-1.0}}. Rules: styling advice only, never a medical or diagnostic judgement; do not guess age or health; if a feature is not visible in the photo (for example only a hand is shown), still return the JSON but give every invisible field a confidence of 0.05; confidence below 0.6 means you are unsure and the customer will be asked.';
const USER='Analyse this photo for a beauty consultation.';

/* Validate the model's JSON: keep only known enum values for the fields this line cares
   about, clamp confidence, and list the unsure ones so the sheet asks the customer. */
/* Two shapes arrive here: the model's flat JSON ({face_shape,confidence:{…}}) and the client's
   echo of a saved analysis ({fields:{…},confidence:{…}}) — both are re-validated, never trusted. */
export function cleanAnalysis(raw,line){
 const nested=raw&&raw.fields&&typeof raw.fields==='object';
 const src=nested?raw.fields:raw||{};
 const conf=nested?raw.confidence||{}:raw&&raw.confidence||{};
 const fields={},confidence={},low=[];
 for(const k of RELEVANT[line]||RELEVANT.hair){
  let v=src[k];if(typeof v==='string')v=v.trim().toLowerCase().replace(/[\s-]+/g,'_');
  if(typeof v!=='string'||!ENUMS[k].has(v))continue;
  fields[k]=v;
  let c=Number(conf[k]);
  if(!Number.isFinite(c))c=0.5;c=Math.max(0,Math.min(1,c));confidence[k]=c;
  if(c<0.6)low.push(k);
 }
 return {fields,confidence,low};
}
function cleanAnswers(raw){const out={};if(!raw||typeof raw!=='object')return out;for(const q of QUESTIONS){const v=raw[q.key];if(typeof v==='string'&&q.options.some(o=>o[0]===v))out[q.key]=v}return out}

/* ---------- ranked suggestions: deterministic rules over that service's own catalog ---------- */
const pick=(list,i)=>({index:i,name:list[i][0]});
/* Fallback «why»: a pick nothing matched still gets a line that names its own category AND
   the style itself — two unmatched cards of the same tag never show the same sentence. */
const fallbackWhy=(tag,byTag,name)=>{
 const base=(tag!=null&&byTag&&byTag[tag])||(tag?'با پاسخ‌هایت انتخاب متعادلی است برای «'+tag+'»':'با توجه به پاسخ‌هایت انتخاب متعادلی است');
 return name?base+' — «'+name+'»':base;
};
function top(list,scores,why,limit,byTag,n=4){
 /* Each card shows a DISTINCT matched reason: reasons are handed out in rank order and a
    reason already shown on an earlier pick is never repeated; with none left, the pick gets
    its tag's fallback line. */
 const used=new Set();
 return scores.map((score,i)=>({score,i})).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,n)
  .map(p=>{
   const pool=why[p.i]||[];
   let w='';for(const r of pool){if(r&&!used.has(r)){w=r;break}}
   if(!w)w=fallbackWhy(list[p.i]&&list[p.i][2],byTag,list[p.i]&&list[p.i][0]);
   used.add(w);
   return {...pick(list,p.i),why:w,limit:limit[p.i]};
  });
}
function suggestHair(a,ans){
 const len=(a&&a.hair_length)||null,face=(a&&a.face_shape)||null,tex=(a&&a.hair_texture)||null,dens=(a&&a.hair_density)||null;
 const score=[],why=[];
 const add=(i,s,w)=>{score[i]=(score[i]||0)+s;if(w&&(!why[i]||why[i].indexOf(w)<0))(why[i]=why[i]||[]).push(w)};
 styles.forEach((s,i)=>{score[i]=0;const tag=s[2];
  if(ans.length==='shorter'){if(tag==='کوتاه')add(i,3,'کوتاه‌تر شدن را انتخاب کردی');if(tag==='متوسط')add(i,1)}
  if(ans.length==='longer'){if(tag==='بلند')add(i,3,'بلندتر ماندن را انتخاب کردی');if(tag==='متوسط')add(i,1)}
  if(ans.length==='same'){if(len==='short'&&tag==='کوتاه')add(i,2,'با طول فعلی موهات جور درمی‌آید');if(len==='medium'&&tag==='متوسط')add(i,2,'با طول فعلی موهات جور درمی‌آید');if(len==='long'&&tag==='بلند')add(i,2,'با طول فعلی موهات جور درمی‌آید')}
  if(ans.care==='low'){if(tag==='کوتاه'||tag==='متوسط')add(i,1,'کم‌دردسرتر است و راحت‌تر حفظش می‌کنی');if(tag==='جمع')score[i]-=2;if(tag==='فر')score[i]-=1}
  if(ans.care==='high'){if(tag==='جمع'||tag==='فر')add(i,1,'حوصلهٔ نگهداری داری و این مدل وقت بیشتری می‌خواهد')}
  if(ans.occasion==='wedding'||ans.occasion==='party'){if(tag==='جمع')add(i,3,'برای عروسی و مجلس جلوهٔ بهتری دارد');if(tag==='بلند')add(i,1)}
  if(ans.occasion==='daily'||ans.occasion==='work'){if(tag==='کوتاه'||tag==='متوسط')add(i,1,'برای روزمره راحت‌تر است')}
  if(ans.boldness==='big'){if(tag==='فر')add(i,2,'جسارت تغییر داری و این مدل تغییر محسوسی می‌دهد');if(tag==='چتری')add(i,1)}
  if(ans.boldness==='same'){if(tag==='کوتاه'||tag==='متوسط')add(i,1,'همان حالت ملایم و آشنا را دارد')}
  if(face==='round'&&tag==='بلند')add(i,2,'صورت گرد را کشیده‌تر نشان می‌دهد');
  if(face==='heart'&&tag==='چتری')add(i,3,'با چتری، تعادل پیشانی بهتر می‌افتد');
  if(face==='square'&&tag==='فر')add(i,2,'گوشه‌های صورت را نرم‌تر نشان می‌دهد');
  if(face==='oblong'&&(tag==='چتری'||tag==='متوسط'))add(i,2,'کشیدگی صورت را متعادل می‌کند');
  if(face==='diamond'&&tag==='بلند')add(i,1,'حجم اطراف گونه را متعادل می‌کند');
  if(face==='oval'&&tag==='متوسط')add(i,1,'فرم بیضی صورت با این مدل جور درمی‌آید');
  if(tex==='curly'&&tag==='فر')add(i,2,'بافت فر خودت را قبول داری و با آن هم‌جهت است');
  if(dens==='low'&&(tag==='بلند'||tag==='متوسط'))score[i]+=1;
  if(dens==='high'&&(tag==='متوسط'||tag==='بلند'))add(i,1,'پرحجمی طبیعی موهات در این مدل دیده می‌شود');
 });
 const LIMIT={بلند:'با موی خیلی نازک حجم کمتری می‌گیرد',متوسط:'نتیجه به جنس موی خودت بستگی دارد',کوتاه:'بعد از چند هفته نیاز به اصلاح دارد',چتری:'چتری را هر چند هفته باید مرتب کنی',فر:'با شست‌وشوی زیاد فر باز می‌شود',جمع:'برای روزمره زیاد قابل استفاده نیست؛ بیشتر مناسبتی است'};
 const limit=styles.map((s,i)=>dens==='low'&&(s[2]==='بلند'||s[2]==='متوسط')?'برای موی خیلی نازک حجم کمتری می‌گیرد':LIMIT[s[2]]);
 const FB={کوتاه:'با پاسخ‌هایت، مدل «کوتاه» انتخاب خوبی است',متوسط:'با پاسخ‌هایت، مدل «متوسط» جور درمی‌آید',بلند:'با پاسخ‌هایت، مدل «بلند» انتخاب خوبی است',چتری:'با پاسخ‌هایت، «چتری» تعادل خوبی می‌سازد',فر:'با پاسخ‌هایت، «فر» انتخاب متعادلی است',جمع:'با پاسخ‌هایت، مدل «جمع» انتخاب خوبی است'};
 return top(styles,score,why,limit,FB);
}
function suggestColor(a,ans){
 const under=(a&&a.skin_undertone)||null,cur=(a&&a.hair_color)||null;
 const cats=[...new Set(COLOR_STYLES.map(c=>c[2]))];
 const score={},why={};
 const add=(cat,s,w)=>{score[cat]=(score[cat]||0)+s;if(w&&!why[cat])why[cat]=w};
 if(under==='warm'){add('قرمز و مسی',3,'ته‌رنگ گرم پوستت با رنگ‌های گرم می‌نشیند');add('قهوه‌ای',1)}
 if(under==='cool'){add('بالیاژ و مش',2,'ته‌رنگ سرد پوستت با رنگ‌های سرد و خنثی جور است');add('تیره',1)}
 if(under==='neutral'){add('قهوه‌ای',1,'ته‌رنگ خنثی پوستت با هر دو طیف جور درمی‌آید')}
 if(ans.boldness==='same'){add('تیره',2,'تغییر ملایمی است و آشنا به نظر می‌رسد');add('قهوه‌ای',2,'تغییر ملایمی است و آشنا به نظر می‌رسد')}
 if(ans.boldness==='big'){add('فانتزی',3,'جسارت تغییر داری و این رنگ تغییر شاخصی می‌دهد');add('بالیاژ و مش',2);add('روشن و بلوند',1)}
 if(ans.occasion==='wedding'||ans.occasion==='party'){add('بالیاژ و مش',2,'برای عروسی و مجلس درخشش بیشتری دارد');add('روشن و بلوند',1)}
 if(ans.occasion==='daily'||ans.occasion==='work'){add('تیره',1,'برای روزمره کمتر جلب توجه می‌کند');add('قهوه‌ای',1)}
 if(ans.care==='low'){add('تیره',1,'ریشهٔ تیره کمتر نیاز به ترمیم دارد')}
 const LIMIT={تیره:'تیره کردن موهای روشن ممکن است به دو مرحله نیاز دارد',قهوه‌ای:'نتیجه روی پایهٔ رنگ قبلی تو فرق می‌کند','روشن و بلوند':'به پایهٔ روشن نیاز دارد؛ روی موی تیره چند جلسه است','قرمز و مسی':'روی موهای قبلاً رنگ‌شده ممکن است دو رگه شود','بالیاژ و مش':'مرز ریشه و ساقه باید محو شود؛ به مهارت آرایشگر وابسته است',فانتزی:'با شست‌وشو سریع‌تر می‌پرد'};
 const list=COLOR_STYLES.map(c=>c[2]);
 const rows=list.map(cat=>({cat,score:score[cat]||0,why:why[cat]||''}));
 const seen=new Set(),order=[];
 rows.sort((x,y)=>y.score-x.score||cats.indexOf(x.cat)-cats.indexOf(y.cat)).forEach(r=>{if(!seen.has(r.cat)){seen.add(r.cat);order.push(r)}});
 const chosen=order.slice(0,4);
 const byCat={};chosen.forEach(r=>{byCat[r.cat]=(byCat[r.cat]||0)+1});
 /* Fill in rank order (not catalog order) so the sheet shows the best match first. */
 const usedCat={},out=[],usedWhy=new Set();
 const FB={تیره:'با پاسخ‌هایت، رنگ «تیره» انتخاب متعادلی است',قهوه‌ای:'با پاسخ‌هایت، رنگ «قهوه‌ای» جور درمی‌آید','روشن و بلوند':'با پاسخ‌هایت، «روشن و بلوند» انتخاب خوبی است','قرمز و مسی':'با پاسخ‌هایت، «قرمز و مسی» انتخاب متعادلی است','بالیاژ و مش':'با پاسخ‌هایت، «بالیاژ و مش» انتخاب خوبی است',فانتزی:'با پاسخ‌هایت، رنگ «فانتزی» انتخاب جسورانه‌ای است'};
 for(const r of chosen){
  const n=usedCat[r.cat]||0;usedCat[r.cat]=n+1;
  let seen=-1;
  for(let i=0;i<COLOR_STYLES.length;i++){if(COLOR_STYLES[i][2]!==r.cat)continue;if(seen++<n)continue;
   let lim=LIMIT[r.cat];
   if(r.cat==='روشن و بلوند'&&(cur==='black'||cur==='dark_brown'))lim='روشن کردن از سطح ۳ به ۸ چند جلسه است';
   if(r.cat==='تیره'&&(cur==='blonde'||cur==='gray'))lim='تیره کردن روی پایهٔ روشن ممکن است دو مرحله بخواهد';
   if(ans.scalp==='often')lim+='؛ نکتهٔ مراقبتی: اگر پوست سرت حساس است، قبل از رنگ با متخصص مشورت کن';
   /* Distinct matched reasons across the cards; a reason already shown (or nothing matched)
      falls back to this category's own line. */
   let w=(r.why&&r.why.length>5&&!usedWhy.has(r.why))?r.why:fallbackWhy(r.cat,FB,COLOR_STYLES[i][0]);
   usedWhy.add(w);
   out.push({...pick(COLOR_STYLES,i),why:w,limit:lim});
   break;
  }
 }
 return out;
}
function suggestNails(a,ans){
 const score=[],why=[];
 NAIL_STYLES.forEach((s,i)=>{score[i]=0;const cat=s[2];
  const add=(cond,w,pts)=>{if(cond){score[i]+=pts;if(w&&(!why[i]||why[i].indexOf(w)<0))(why[i]=why[i]||[]).push(w)}};
  add(ans.occasion==='wedding'||ans.occasion==='party','برای عروسی و مجلس پر زرق‌وبرقتر است',cat==='نگین'?3:cat==='براق'?2:0);
  add(ans.occasion==='daily'||ans.occasion==='work','برای روزمره ساده‌تر و کم‌دردسرتر است',cat==='ساده'?2:cat==='فرنچ'?1:0);
  add(ans.boldness==='same','همان سادگی آشنا را دارد',cat==='ساده'?2:cat==='فرنچ'?1:0);
  add(ans.boldness==='big','جسارت تغییر داری و این طرح توی چشم است',cat==='طرح‌دار'?3:cat==='نگین'?2:0);
  add(ans.care==='low','کمترین مراقبت را می‌خواهد',cat==='ساده'?2:0);
  add(ans.budget==='high'&&!ans.occasion,'وقت و هزینهٔ بیشتری برای طرح داری',cat==='نگین'?1:cat==='طرح‌دار'?1:0);
 });
 const LIMIT={ساده:'نتیجه به شکل ناخن خودت بستگی دارد',فرنچ:'با رشد ناخن، فرنچ جلو می‌آورد و تمدید لازم دارد',براق:'سطح براق خط و خش را بیشتر نشان می‌دهد',طرح‌دار:'با بلند شدن ناخن، طرح از وسط دیده می‌شود',نگین:'طرح‌های برجسته با برخورد زیاد زودتر جدا می‌شود'};
 const limit=NAIL_STYLES.map(s=>LIMIT[s[2]]||'نتیجه به شکل ناخن خودت بستگی دارد');
 const FB={ساده:'با پاسخ‌هایت، طرح «ساده» انتخاب متعادلی است',فرنچ:'با پاسخ‌هایت، «فرنچ» جور درمی‌آید',براق:'با پاسخ‌هایت، طرح «براق» انتخاب خوبی است',طرح‌دار:'با پاسخ‌هایت، «طرح‌دار» انتخاب جسورانه‌ای است',نگین:'با پاسخ‌هایت، طرح «نگین» انتخاب خوبی است'};
 return top(NAIL_STYLES,score,why,limit,FB);
}
function suggestLashes(a,ans){
 const face=(a&&a.face_shape)||null;
 const score=[],why=[];
 LASH_STYLES.forEach((s,i)=>{score[i]=0;const cat=s[2];
  const add=(cond,w,pts)=>{if(cond){score[i]+=pts;if(w&&(!why[i]||why[i].indexOf(w)<0))(why[i]=why[i]||[]).push(w)}};
  add(ans.boldness==='same','تغییر طبیعی و ملایمی دارد',cat==='طبیعی'?3:cat==='بدون کاشت'?1:0);
  add(ans.boldness==='big','جسارت تغییر داری و چشم‌ها را بازتر نشان می‌دهد',cat==='پرحجم'?3:0);
  add(ans.occasion==='daily'||ans.occasion==='work','برای روزمره سنگین نیست',cat==='طبیعی'?2:cat==='بدون کاشت'?1:0);
  add(ans.occasion==='wedding'||ans.occasion==='party','برای عروسی و مجلس جلوهٔ بیشتری دارد',cat==='پرحجم'?3:0);
  add(ans.care==='low','کمترین نگهداری را می‌خواهد',cat==='بدون کاشت'?2:0);
  add(face==='round'&&cat==='طبیعی','با فرم گرد صورت، چشم‌ها را کشیده‌تر نشان می‌دهد',1);
 });
 const LIMIT={طبیعی:'تفاوت کمی با حالت طبیعی خودت دارد',پرحجم:'روی مژهٔ کم‌پشت ممکن است زودتر سنگین شود','بدون کاشت':'حجم و طول کمتری نسبت به کاشت ایجاد می‌کند'};
 const limit=LASH_STYLES.map(s=>LIMIT[s[2]]||'نتیجه به مژهٔ خودت بستگی دارد');
 const FB={طبیعی:'با پاسخ‌هایت، مدل «طبیعی» انتخاب متعادلی است',پرحجم:'با پاسخ‌هایت، «پرحجم» جور درمی‌آید','بدون کاشت':'با پاسخ‌هایت، «بدون کاشت» انتخاب خوبی است'};
 return top(LASH_STYLES,score,why,limit,FB);
}
export function suggest(line,analysis,answers){
 must(LINE_KEYS.includes(line),'بخش معتبر نیست',400);
 const a=analysis&&analysis.fields?analysis.fields:null,ans=cleanAnswers(answers);
 if(line==='hair')return {line,picks:suggestHair(a,ans)};
 if(line==='color')return {line,picks:suggestColor(a,ans)};
 if(line==='nails')return {line,picks:suggestNails(a,ans)};
 return {line,picks:suggestLashes(a,ans)};
}

/* ---------- storage helpers: only her own uploads, never a published portfolio photo ---------- */
async function ownPhoto(db,s,id){
 must(/^[a-f0-9-]{36}$/.test(String(id||'')),'عکس معتبر نیست',400);
 const m=await db.prepare('SELECT * FROM media WHERE id=? AND salon_id=?').bind(id,s.salon_id).first();
 must(m&&m.kind==='original','عکس پیدا نشد',404);
 const linked=m.session_id===s.id||(s.verified_phone&&m.session_id&&await db.prepare('SELECT 1 FROM sessions WHERE id=? AND salon_id=? AND verified_phone=?').bind(m.session_id,s.salon_id,s.verified_phone).first());
 must(linked,'عکس متعلق به این حساب نیست',403);
 return m;
}
async function ownResult(db,s,id,photo,line){
 must(/^[a-f0-9-]{36}$/.test(String(id||'')),'عکس معتبر نیست',400);
 const m=await db.prepare('SELECT * FROM media WHERE id=? AND salon_id=?').bind(id,s.salon_id).first();
 must(m&&m.kind==='simulation','نتیجه پیدا نشد',404);
 const linked=m.session_id===s.id||(s.verified_phone&&m.session_id&&await db.prepare('SELECT 1 FROM sessions WHERE id=? AND salon_id=? AND verified_phone=?').bind(m.session_id,s.salon_id,s.verified_phone).first());
 must(linked,'این نتیجه متعلق به این حساب نیست',403);
 /* Same customer is not enough: the generation must be a build of THIS record's photo and
    line — a result of another photo (or another service) never travels with this record. */
 const gen=await db.prepare('SELECT 1 FROM generations WHERE result_id=? AND original_id=? AND line=?').bind(id,photo,line).first();
 must(gen,'این نتیجه برای همین عکس و همین بخش ساخته نشده است',404);
 return m;
}

/* ---------- routes (called from server.js api() after the session is resolved) ---------- */
export async function consultApi(req,env,{u,route,salon,s,clientIp}){
 const db=env.DB,phone=s.verified_phone;
 /* The consultant card lives only on the direct studio salon — the vision routes are not
    reachable (and can never spend) anywhere else. */
 if(route.startsWith('consult/'))must(isDirect(salon),'این بخش فقط در استودیوی آینه فعال است',404);
 if(route==='consult/analyze'&&req.method==='POST'){
  const b=await req.json().catch(()=>({}));
  const line=LINE_KEYS.includes(b.line)?b.line:'hair';
  const m=await ownPhoto(db,s,b.photo_id);
  /* Nails and lashes never run (nor charge) the vision: the card is hidden on both lines —
     a close-up of a hand or lashes is not a hairstyle analysis; the questionnaire is the
     answer, and no counter is touched. */
  if(line==='nails'||line==='lashes')return J({ok:false,fallback:'questionnaire',reason:'line'});
  /* Caps follow the customer, not the salon: a signed-in one by phone, a guest by browser id
     plus the hashed network — so a farm cannot reset the counter by opening another page,
     another browser session or another salon. Cache hits are free and skip every counter. */
  const v=/^[a-f0-9]{16,32}$/.test(String(b.v||''))?String(b.v):'';
  const who=phone?'consult:p:'+phone:'consult:g:'+(v||s.id)+':'+await hash(clientIp||'unknown');
  const object=await bucketFor(env).get(m.object_key);
  must(object,'عکس در دسترس نیست',410);
  const bytes=new Uint8Array(await object.arrayBuffer());
  const r=await visionJSON(env,db,{cacheKey:'consult:'+PROMPT_V+':'+await hashBytes(bytes),system:SYSTEM,user:USER,image:{mime:m.mime,bytes},
   tryLimit:{key:who+':try',max:phone?60:3,message:'چند بار تلاش کردی؛ کمی بعد دوباره امتحان کن'},
   okLimit:{key:who+':ok',max:phone?30:1,message:'تحلیل عکس امروز تمام شد؛ فردا دوباره امتحان کن یا وارد حساب شو.'},
   netLimit:phone?null:{key:'consult-net:'+(clientIp||'unknown'),max:NET_DAILY,message:'از این شبکه امروز چندین تحلیل زده شد؛ فردا دوباره امتحان کن.'}});
  if(!r.ok)return J({ok:false,fallback:'questionnaire',reason:r.reason});
  const a=cleanAnalysis(r.value,line);
  if(!Object.keys(a.fields).length)return J({ok:false,fallback:'questionnaire',reason:'invalid'});
  return J({ok:true,fields:a.fields,confidence:a.confidence,low:a.low,cached:!!r.cached});
 }
 if(route==='consult/suggest'&&req.method==='POST'){
  const b=await req.json().catch(()=>({}));
  await limited(db,'consult-suggest:'+s.id,200,'چند بار تلاش کردی؛ کمی بعد دوباره امتحان کن');
  return J(suggest(b.line,b.analysis,b.answers));
 }
 if(route==='consult'&&req.method==='POST'){
  must(phone,'برای ذخیرهٔ مشاوره وارد حساب شو',401);
  await limited(db,'consult-save:'+phone,50,'امروز مشاورهٔ زیادی ذخیره کردی');
  const b=await req.json().catch(()=>({}));
  must(LINE_KEYS.includes(b.line),'بخش معتبر نیست',400);
  const m=await ownPhoto(db,s,b.photo_id);
  const source=b.analysis&&b.analysis.source==='self'?'self':'vision';
  const a=source==='self'?{fields:(b.analysis&&b.analysis.fields)||{},confidence:{},low:[]}:cleanAnalysis(b.analysis,b.line);
  if(source==='self'){const f={};for(const k of RELEVANT[b.line]){const v=a.fields[k];if(typeof v==='string'&&ENUMS[k].has(v))f[k]=v}a.fields=f}
  /* Fields she answered herself (all of them when there was no analysis, or the ones she
     overrode) are stored so every surface can label them her answer, not a photo analysis. */
  const selfKeys=source==='self'?Object.keys(a.fields):(Array.isArray(b.analysis&&b.analysis.self_keys)?b.analysis.self_keys.filter(k=>Object.prototype.hasOwnProperty.call(a.fields,k)):[]);
  const answers=cleanAnswers(b.answers);
  const picks=suggest(b.line,{fields:a.fields},answers).picks;
  let resultId=null;
  if(b.result_id){resultId=(await ownResult(db,s,b.result_id,m.id,b.line)).id}
  const id=uid();
  await db.prepare('INSERT INTO consultations(id,salon_id,owner,line,photo_id,analysis_json,answers_json,picks_json,result_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
   .bind(id,salon.id,phone,b.line,m.id,JSON.stringify({source,fields:a.fields,confidence:a.confidence,low:a.low,self_keys:selfKeys}),JSON.stringify(answers),JSON.stringify(picks),resultId,Date.now()).run();
  return J({id,picks,result_id:resultId});
 }
 if(route==='consults'&&req.method==='GET'){
  must(phone,'وارد حساب شو',401);
  const rows=await db.prepare('SELECT id,line,picks_json,result_id,created_at FROM consultations WHERE salon_id=? AND owner=? ORDER BY created_at DESC LIMIT 50').bind(salon.id,phone).all();
  return J({consultations:(rows.results||[]).map(r=>({id:r.id,line:r.line,at:r.created_at,top:(parse(r.picks_json)[0]||{}).name||'',result_id:r.result_id}))});
 }
 if(route.startsWith('consults/')){
  const rest=route.slice(9),id=rest.split('/')[0];
  const row=await db.prepare('SELECT * FROM consultations WHERE id=? AND salon_id=?').bind(id,salon.id).first();
  if(rest.endsWith('/share')&&req.method==='POST'){
   must(phone&&row&&row.owner===phone,'مشاوره پیدا نشد',404);
   await limited(db,'consult-share:'+phone,30,'امروز چند لینک ساختی؛ فردا دوباره');
   const t=token();
   await db.prepare('UPDATE consultations SET share_hash_prev=share_hash,share_hash=?,share_expires=?,share_used_at=NULL WHERE id=?').bind(await hash(t),Date.now()+72*3600000,row.id).run();
   return J({path:'/share/'+t});
  }
  if(rest.endsWith('/result')&&req.method==='POST'){
   must(phone&&row&&row.owner===phone,'مشاوره پیدا نشد',404);
   const b=await req.json().catch(()=>({}));
   const m=await ownResult(db,s,b.result_id,row.photo_id,row.line);
   await db.prepare('UPDATE consultations SET result_id=? WHERE id=?').bind(m.id,row.id).run();
   return J({ok:true});
  }
  if(!rest.includes('/')&&req.method==='GET'){
   must(phone,'وارد حساب شو',401);
   must(row&&row.owner===phone,'مشاوره پیدا نشد',404);
   return J({id:row.id,line:row.line,at:row.created_at,analysis:parse(row.analysis_json),answers:parse(row.answers_json),picks:parse(row.picks_json),result_id:row.result_id});
  }
 }
 if(route==='consult'||route.startsWith('consult/')||route==='consults'||route.startsWith('consults/'))throw new Problem(405,'متد مجاز نیست');
 throw new Problem(404,'مسیر یافت نشد');
}

/* ---------- the stylist's page: /share/<64-hex> — one-time, 72 hours, noindex ---------- */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fieldLabel=key=>{const f=ANALYSIS_FIELDS.find(x=>x.key===key);return f?f.label:key};
const optionLabel=(defs,key,val)=>{const d=defs.find(x=>x.key===key);const o=d&&d.options.find(x=>x[0]===val);return o?o[1]:''};
const GRACE=15*60000;
/* The stylist's page: GET never consumes (previews and refreshes are safe) — it shows a
   landing with a «باز کردن برگه» button whose POST is the one act that consumes the link.
   A token replaced by a re-share answers 410 with a clear message, never a silent 404. */
export async function consultShare(u,env,method='GET'){
 const t=(u.pathname.split('/')[2]||'').toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(t))return {status:404,html:null};
 const th=await hash(t);
 const gone=msg=>({status:410,html:page(msg,'این لینک دیگر کار نمی‌کند')});
 let row=await env.DB.prepare('SELECT * FROM consultations WHERE share_hash=?').bind(th).first();
 if(!row){
  const prev=await env.DB.prepare('SELECT 1 FROM consultations WHERE share_hash_prev=?').bind(th).first();
  if(prev)return gone('مشتری لینک تازه‌تری ساخته است؛ این لینک دیگر کار نمی‌کند.');
  return {status:404,html:null};
 }
 const now=Date.now();
 if(!row.share_expires||row.share_expires<now)return gone('این لینک منقضی شده است؛ از مشتری بخواه لینک تازه بفرستد.');
 if(row.share_used_at&&now-row.share_used_at>GRACE)return gone('این لینک یک‌بار مصرف بود و تمام شده است؛ از مشتری بخواه لینک تازه بفرستد.');
 if(method!=='POST'&&!row.share_used_at){
  /* Link preview crawlers and refreshes land here: no content, no consumption. */
  return {status:200,html:page(null,null,'<section><h2>برگهٔ مشاوره</h2><p class="muted">این لینک یک‌بار مصرف است؛ با دکمهٔ زیر باز می‌شود و تا ۷۲ ساعت معتبر می‌ماند.</p><form class="openf" method="post" action="/share/'+t+'"><button class="btn btn--primary" type="submit">باز کردن برگه</button></form></section>')};
 }
 if(!row.share_used_at)await env.DB.prepare('UPDATE consultations SET share_used_at=? WHERE id=? AND share_used_at IS NULL').bind(now,row.id).run();
 const analysis=parse(row.analysis_json),answers=parse(row.answers_json),picks=parse(row.picks_json);
 /* Honesty: fields she answered herself are labelled her answer — never a photo analysis —
    and when every field is hers the whole block is titled that way. */
 const selfSet=new Set(Array.isArray(analysis.self_keys)?analysis.self_keys:[]);
 const rel=RELEVANT[row.line];
 const li=k=>'<li><span>'+esc(fieldLabel(k))+'</span><b>'+esc(optionLabel(ANALYSIS_FIELDS,k,analysis.fields&&analysis.fields[k])||'—')+'</b></li>';
 const visionKeys=rel.filter(k=>!selfSet.has(k)),selfFields=rel.filter(k=>selfSet.has(k));
 const valuedVision=visionKeys.filter(k=>analysis.fields&&analysis.fields[k]);
 const allSelf=analysis.source==='self'||(selfFields.length>0&&!valuedVision.length);
 const fieldsHtml=allSelf
  ? '<section><h2>مشخصات (پاسخ مشتری)</h2><ul class="kv">'+rel.map(li).join('')+'</ul></section>'
  : '<section><h2>تحلیل عکس</h2><ul class="kv">'+visionKeys.map(li).join('')+'</ul></section>'
    +(selfFields.length?'<section><h2>پاسخ مشتری</h2><ul class="kv">'+selfFields.map(li).join('')+'</ul></section>':'');
 const qs=QUESTIONS.filter(q=>answers[q.key]).map(q=>'<li><span>'+esc(q.label)+'</span><b>'+esc(optionLabel(QUESTIONS,q.key,answers[q.key]))+'</b></li>').join('');
 const cards=picks.map(p=>'<article class="pk"><h3>'+esc(p.name)+'</h3><p class="w">'+esc(p.why)+'</p><p class="l">'+esc(p.limit)+'</p></article>').join('');
 const img=row.result_id?'<img src="/share/'+t+'/img" alt="نتیجهٔ ساخته‌شده">':'<p class="muted">هنوز عکسی از این مشاوره ساخته نشده است.</p>';
 const date=new Intl.DateTimeFormat('fa-IR',{dateStyle:'long'}).format(new Date(row.created_at));
 return {status:200,html:page(null,null,'<p class="date">'+esc(date)+' · '+esc(LINE_LABEL[row.line]||'')+'</p>'+fieldsHtml+(qs?'<section><h2>پرسش‌نامه</h2><ul class="kv">'+qs+'</ul></section>':'')+'<section><h2>پیشنهادها</h2><div class="pks">'+cards+'</div></section><section><h2>نتیجهٔ تصویر</h2><div class="shot">'+img+'</div></section><footer>این پیشنهادها بر اساس عکس و پاسخ‌های مشتری ساخته شده و جای مشورت حضوری با آرایشگر را نمی‌گیرد؛ نکتهٔ مراقبتی است، تشخیص پزشکی نیست. این لینک یک‌بار مصرف است و تا ۷۲ ساعت معتبر می‌ماند.')};
}
export async function consultShareImage(u,env){
 const t=(u.pathname.split('/')[2]||'').toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(t))return new Response('not found',{status:404});
 const row=await env.DB.prepare('SELECT * FROM consultations WHERE share_hash=?').bind(await hash(t)).first();
 const now=Date.now();
 if(!row||!row.share_expires||row.share_expires<now||(row.share_used_at&&now-row.share_used_at>GRACE))return new Response('gone',{status:410});
 /* The image follows the page exactly: nothing before the POST opened the link, nothing
    after the grace window — a preview, refresh or crawler never gets the bytes early. */
 if(!row.share_used_at)return new Response('not found',{status:404});
 const m=row.result_id&&await env.DB.prepare('SELECT mime,object_key FROM media WHERE id=? AND salon_id=?').bind(row.result_id,row.salon_id).first();
 if(!m)return new Response('not found',{status:404});
 const object=await bucketFor(env).get(m.object_key);
 if(!object)return new Response('gone',{status:410});
 return new Response(object.body,{headers:{'Content-Type':m.mime||'image/jpeg','Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff',"Content-Security-Policy":"default-src 'none'"}});
}
function page(err,errTitle,body){
 return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#e8edeb"><link rel="icon" href="/favicon.ico" sizes="48x48"><title>برگهٔ مشاوره | آینه</title><style>'+baseCSS+
 '.wrap{max-width:640px;margin:0 auto;padding:28px 18px 48px;display:grid;gap:20px}h1{font-family:var(--display);font-size:26px;font-weight:800}h2{font-size:15px;font-weight:800;color:var(--muted);margin-bottom:10px}.date{color:var(--muted);font-size:13px;margin-top:-10px}section{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:18px}.kv{list-style:none;display:grid;gap:8px}.kv li{display:flex;justify-content:space-between;gap:12px;font-size:14px;background:var(--surface-2);border-radius:12px;padding:9px 12px}.kv span{color:var(--muted)}.pks{display:grid;gap:12px}.pk{border:1px solid var(--line);border-radius:var(--r);padding:14px;display:grid;gap:6px}.pk h3{font-size:15.5px;font-weight:800}.pk .w{font-size:13.5px;line-height:1.8}.pk .l{font-size:13px;line-height:1.8;color:var(--warn);background:var(--warn-soft);border-radius:10px;padding:8px 10px}.shot img{width:100%;border-radius:var(--r);display:block}footer{color:var(--muted);font-size:12.5px;line-height:2;text-align:center}.err{background:var(--warn-soft);border-radius:var(--r);padding:24px;text-align:center;display:grid;gap:8px}.err b{font-size:17px}.openf{display:grid;justify-items:center;margin-top:6px}</style></head><body><main class="wrap">'+
 '<h1>برگهٔ مشاورهٔ آینه</h1>'+(err?'<div class="err"><b>'+esc(errTitle)+'</b><p class="muted">'+esc(err)+'</p></div>':body)+'</main></body></html>';
}
