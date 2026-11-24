import {must,phone,text,uid,digits,hash,limited,Problem} from './domain.js';
import {LINE_KEYS} from './lines.js';
import {notifyOwner} from './alerts.js';
import {smsReady,sendOtp} from './sms.js';

// Free signup for a beauty professional (owner's decision, Nov 2026): name + mobile (verified by
// SMS when SMS is configured) gives a page with TRIAL_IMAGES free images. When they are used up the
// page shows the «بسته یا اشتراک» popup that opens /pricing; a purchase there goes to the same
// mobile and the same page (cookie «ayneh_trial», see trialByToken) and turns it into a paid salon.
// Both limits are enforced here on the server, never in the page.
export const TRIAL_HOURS=24*90,TRIAL_IMAGES=3;
export const TRIAL_EMPTY='تصویرهای رایگان شما تمام شد؛ برای ساخت تصویرهای بیشتر بسته یا اشتراک بخرید';
export const BRANDS=['#B9975B','#8E3050','#5E6B3A','#2E5468'];
const run=(db,sql,...a)=>db.prepare(sql).bind(...a).run();
const one=(db,sql,...a)=>db.prepare(sql).bind(...a).first();

export const trialOf=(db,salonId)=>one(db,'SELECT * FROM trials WHERE salon_id=?',salonId);
export const trialLive=t=>!!t&&(!!t.converted_at||Date.now()<t.expires_at);
export function trialPublic(t){if(!t)return null;return {expires_at:t.expires_at,expired:!trialLive(t),images_limit:t.images_limit,images_left:Math.max(0,t.images_limit-t.images_used),brand:t.brand||'',line:t.line||''};}

// Takes one image from the trial's budget, atomically. Called before any paid request is created.
export async function spendTrialImage(db,t){
 if(!t)return;
 must(trialLive(t),'مهلت صفحهٔ رایگان تمام شده است؛ برای ادامه بسته یا اشتراک بخرید',410);
 const r=await run(db,'UPDATE trials SET images_used=images_used+1 WHERE id=? AND images_used<images_limit AND expires_at>?',t.id,Date.now());
 if(!r.meta.changes){const e=new Problem(402,TRIAL_EMPTY);e.code='trial_empty';throw e}
}

const rand=()=>Array.from(crypto.getRandomValues(new Uint8Array(4)),x=>x.toString(16).padStart(2,'0')).join('');

/* The signed-up professional behind the «ayneh_trial» cookie (a random token; only its hash is
   stored). Used by /pricing so a purchase goes to the same mobile and page without a form. */
export async function trialByToken(db,token){
 if(!/^[a-f0-9]{48}$/.test(String(token||'')))return null;
 return one(db,'SELECT t.*,s.slug,s.name AS salon_name FROM trials t JOIN salons s ON s.id=t.salon_id WHERE t.buy_token_hash=?',await hash('trial-buy:'+token));
}
export const maskPhone=tel=>{const d=String(tel||'').replace(/^\+98/,'0');return d.length===11?d.slice(0,4)+'***'+d.slice(7):d;};
async function newToken(db,trialId){
 const token=Array.from(crypto.getRandomValues(new Uint8Array(24)),x=>x.toString(16).padStart(2,'0')).join('');
 await run(db,'UPDATE trials SET buy_token_hash=? WHERE id=?',await hash('trial-buy:'+token),trialId);
 return token;
}

// POST /api/trial body: {name,salon,phone,line,consent,code}. Creates the salon, its trial row
// and the lead for the project owner in one go, and returns the page address plus the token the
// server puts in the HttpOnly cookie (never in the page). The same verified mobile signing up
// again on another device gets its own page back (only when the mobile was verified by SMS).
export async function createTrial(db,env,origin,b){
 must(b.consent===true,'برای ساخت صفحه، تأیید تماس لازم است');
 const name=text(String(b.name||''),60)||'مدیر سالن',salon=text(String(b.salon||b.name||''),80),city=text(String(b.city||''),40),note=text(String(b.note||''),300),chosen=text(String(b.chosen||''),90);
 must(salon.length>=2,'نام سالن یا نام کاری خود را بنویسید');
 const tel=phone(b.phone),brand=BRANDS.includes(b.brand)?b.brand:BRANDS[0],line=LINE_KEYS.includes(b.line)?b.line:'';
 must(!await one(db,"SELECT 1 FROM orders WHERE phone=? AND kind IN ('plan','images','pack') AND status='paid'",tel),'این شماره پنل فعال دارد؛ از «ورود به پنل» وارد شوید.',409);
 const existing=await one(db,'SELECT t.*,s.slug FROM trials t JOIN salons s ON s.id=t.salon_id WHERE t.phone=?',tel);
 must(!existing||smsReady(env),'برای این شماره قبلاً ثبت‌نام شده است؛ با پشتیبانی آینه تماس بگیرید.',409);
 // With SMS configured the mobile is confirmed first, so nobody spends a trial on someone else's number.
 if(smsReady(env)){
  const key='trial:'+tel,given=digits(String(b.code||'')).replace(/\s/g,'');
  if(!given){
   const prev=await one(db,'SELECT created_at FROM otps WHERE session_id=? ORDER BY created_at DESC LIMIT 1',key);
   must(!prev||Date.now()-prev.created_at>=60000,'برای گرفتن دوبارهٔ کد یک دقیقه صبر کنید',429);
   await limited(db,'trial-otp:'+tel,3,'برای این شماره امروز چند بار کد فرستاده شده؛ فردا دوباره امتحان کنید');
   const code=await sendOtp(env,tel),oid=uid(),now=Date.now();
   await run(db,'DELETE FROM otps WHERE session_id=?',key);
   await run(db,'INSERT INTO otps(id,session_id,phone,first_name,last_name,code_hash,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)',oid,key,tel,name,salon,await hash(oid+':'+code),now+10*60000,now);
   return {code_sent:true,resend_in:60};
  }
  must(/^\d{3,12}$/.test(given),'کد پیامک‌شده را درست وارد کنید');
  const o=await one(db,'SELECT * FROM otps WHERE session_id=? ORDER BY created_at DESC LIMIT 1',key);
  must(o,'اول کد تأیید بگیرید');must(o.expires_at>Date.now(),'کد منقضی شده؛ کد تازه بگیرید',410);
  const spent=await run(db,'UPDATE otps SET attempts=attempts+1 WHERE id=? AND attempts<5',o.id);
  must(spent.meta.changes,'تعداد تلاش‌ها تمام شد؛ کد تازه بگیرید',429);
  must(await hash(o.id+':'+given)===o.code_hash,'کد درست نیست');
  await run(db,'DELETE FROM otps WHERE session_id=?',key);
 }
 /* A verified returning mobile: its own page, a fresh cookie, no second set of free images. */
 if(existing){
  const token=await newToken(db,existing.id);
  return {ok:true,returning:true,path:'/s/'+existing.slug,url:(env.APP_ORIGIN||origin)+'/s/'+existing.slug,images:existing.images_limit,images_left:Math.max(0,existing.images_limit-existing.images_used),line:existing.line||'',token};
 }
 const id=uid(),salonId=uid(),slug='t-'+rand(),now=Date.now(),expires=now+TRIAL_HOURS*3600000;
 await db.batch([
  db.prepare('INSERT INTO salons(id,slug,owner_id,name,created_at,profile,settings) VALUES(?,?,?,?,?,?,?)').bind(salonId,slug,'trial',salon,now,JSON.stringify(city?{address:city}:{}),JSON.stringify({generation_enabled:true,reference_verified:true,trial:true})),
  db.prepare('INSERT INTO trials(id,salon_id,name,phone,brand,created_at,expires_at,images_limit,line) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,salonId,name,tel,brand,now,expires,TRIAL_IMAGES,line),
  db.prepare('INSERT INTO inquiries(id,name,salon,city,phone,note,chosen,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(uid(),name,salon,city,tel,note,'ثبت‌نام رایگان '+slug+(chosen?' · '+chosen:''),now)
 ]);
 const url=(env.APP_ORIGIN||origin)+'/s/'+slug;
 await notifyOwner(env,{kind:'trial',level:'good',text:'ثبت‌نام رایگان «'+salon+'»'+(line?' ('+line+')':'')+' انجام شد',detail:'👤 '+name+'\n📞 '+tel+'\n🔗 '+url+'\n🎁 '+TRIAL_IMAGES+' تصویر رایگان'+(chosen?'\n✨ '+chosen:'')+(note?'\n📝 '+note:'')});
 return {ok:true,path:'/s/'+slug,url,expires_at:expires,images:TRIAL_IMAGES,images_left:TRIAL_IMAGES,line,token:await newToken(db,id)};
}
