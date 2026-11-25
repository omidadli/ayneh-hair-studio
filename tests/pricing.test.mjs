// Pricing v2 (owner's decision, Nov 2026): per-service image credits («فقط ساخت تصویر»), monthly
// subscriptions with subscriber packs, per-line spending, image-only gating and the /pricing page.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';
import {database,memoryBucket} from '../scripts/local-adapter.mjs';import app from '../worker/index.js';
import {PLANS,IMAGE_PRICES,SUB_PACKS,PACK_SAVE,SUB_KEYS,CUSTOM_MAX} from '../worker/prices.js';
import {pricingHTML} from '../worker/landing.js';
import {amountMode} from '../worker/paysms.js';
amountMode.roundFirst=true;

const origin='https://test.example';
const migrations=readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort();
function fixture(){const DB=database();for(const f of migrations)DB.sql.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));return {DB,BUCKET:memoryBucket(),OWNER_EMAIL:'owner@test',JOB_TOKEN:'job-test',TRUST_PLATFORM_IDENTITY:'true',KIE_API_KEY:'mock'};}
const OWNER={user:'owner-a',email:'owner@test'};
async function call(env,path,body,{cookie='',user='',email=''}={}){const headers={origin,'oai-authenticated-user-id':user,'oai-authenticated-user-email':email,cookie};let payload;if(body!==undefined){if(body instanceof Uint8Array){payload=body}else{headers['content-type']='application/json';payload=JSON.stringify(body)}}const res=await app.fetch(new Request(origin+path,{method:body===undefined?'GET':'POST',headers,body:payload}),env);let d;try{d=await res.json()}catch{d=null}return {status:res.status,data:d,cookie:res.headers.get('set-cookie')?.split(';')[0]};}
const png=()=>{const b=new Uint8Array(150);b.set([137,80,78,71,13,10,26,10]);return b};
const confirm=(e,id)=>call(e,'/api/owner/orders/'+id+'/confirm',{},OWNER);
/* The panel as seen `days` from now (a fresh login: panel sessions last 30 days). */
async function meLater(e,key,days){const real=Date.now;Date.now=()=>real()+days*86400000;
 try{const l=await call(e,'/api/panel/login',{key});return (await call(e,'/api/panel/me',undefined,{cookie:l.cookie})).data}finally{Date.now=real}}
const buyer=(extra={})=>({name:'استودیو نیلوفر',phone:'09121112233',...extra});
async function bought(e,body,ph='09121112233'){
 const o=await call(e,'/api/buy',buyer({phone:ph,...body}));assert.equal(o.status,200,JSON.stringify(o));
 const c=await confirm(e,o.data.id);assert.equal(c.status,200,JSON.stringify(c));
 const login=await call(e,'/api/panel/login',{key:o.data.access_key});assert.equal(login.status,200,JSON.stringify(login));
 const row=e.DB.sql.prepare('SELECT s.id,s.slug,s.settings FROM orders o JOIN salons s ON s.id=o.salon_id WHERE o.id=?').get(o.data.id);
 return {...row,cookie:login.cookie,order:o.data};
}
function mockProvider(){const prev=globalThis.fetch;let n=0;globalThis.fetch=async(url,opts)=>{const u=String(url);
 if(u.includes('file-base64-upload'))return Response.json({success:true,data:{downloadUrl:'https://provider.example/'+crypto.randomUUID()+'.jpg'}});
 if(u.includes('createTask'))return Response.json({code:200,data:{taskId:'task'+(++n)}});
 if(u.includes('recordInfo'))return Response.json({code:200,data:{state:'success',resultJson:JSON.stringify({resultUrls:['https://provider.example/out.png']})}});
 if(u.startsWith('https://provider.example/'))return new Response(png());
 return prev(url,opts)};return {restore(){globalThis.fetch=prev}};}
async function guestGen(e,slug,line){
 const s=await call(e,'/api/s/'+slug+'/session',{});const g={cookie:s.cookie};
 const up=await call(e,'/api/s/'+slug+'/upload?kind=original',png(),g);assert.equal(up.status,200,JSON.stringify(up));
 return call(e,'/api/s/'+slug+'/generate',{image_consent:true,idem:crypto.randomUUID(),line,original_id:up.data.id,style:0,v:crypto.randomUUID().replace(/-/g,'').slice(0,20)},g);
}

test('the price sheet: path-1 packs, subscriptions and subscriber packs are the owner\'s final numbers',()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(IMAGE_PRICES).map(([k,v])=>[k,[v.single,v.packs[5],v.packs[10],v.packs[20]]])),
  {hair:[50000,238000,450000,850000],color:[60000,285000,540000,1020000],nails:[40000,190000,360000,680000],lashes:[40000,190000,360000,680000]});
 assert.deepEqual(PACK_SAVE,{5:5,10:10,20:15});
 assert.deepEqual(Object.fromEntries(SUB_KEYS.map(k=>[k,PLANS[k].amount])),{sub_hair:1490000,sub_color:2900000,sub_nails:990000,sub_lashes:990000,sub_salon3:4900000,sub_salon8:7900000,sub_salon20:12900000});
 assert.deepEqual(SUB_KEYS.map(k=>PLANS[k].seats),[0,0,0,0,3,8,20]);
 for(const k of SUB_KEYS){assert.equal(PLANS[k].months,1);assert.equal(PLANS[k].credits,0,'no free images with a subscription');assert.equal(PLANS[k].tier,'full');assert.equal(PLANS[k].sold,true)}
 for(const k of ['essential','pro','signature','salon1','salon3','salon6'])assert.equal(PLANS[k].sold,false,'old plans are kept but not sold: '+k);
 assert.deepEqual(SUB_PACKS,{hair:{50:1700000,100:3000000,200:5400000},color:{50:2000000,100:3500000,200:6000000},nails:{50:1300000,100:2200000,200:3800000},lashes:{50:1300000,100:2200000,200:3800000}});
});

test('the order amount is computed only on the server from the sheet; the browser cannot set it',async()=>{
 let e=fixture();
 const cases=[[{kind:'images',line:'hair',count:5},238000],[{kind:'images',line:'color',count:20},1020000],[{kind:'images',line:'nails',count:7},280000],
  [{kind:'images',line:'lashes',count:'۱۰'},360000],[{kind:'sub',sub:'sub_color'},2900000],[{kind:'sub',sub:'sub_hair',pack:50},1490000+1700000],
  [{kind:'sub',sub:'sub_salon8',line:'nails',pack:200},7900000+3800000],[{kind:'sub',sub:'sub_salon20'},12900000]];
 let i=0;for(const [body,amount] of cases){
  e=fixture();const r=await call(e,'/api/buy',buyer({phone:'0912000000'+(i++),...body,amount:1,price:1,total:1}));
  assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.amount,amount,JSON.stringify(body));
  assert.equal(e.DB.sql.prepare('SELECT amount FROM orders WHERE id=?').get(r.data.id).amount,amount*10,'stored in rials');
 }
 e=fixture();
 for(const bad of [{kind:'images',line:'hair',count:0},{kind:'images',line:'hair',count:CUSTOM_MAX+1},{kind:'images',line:'beard',count:5},{kind:'sub',sub:'essential'},{kind:'sub',sub:'sub_hair',pack:30},{kind:'sub',sub:'sub_salon3',pack:50},{kind:'free'}]){
  const r=await call(e,'/api/buy',buyer({phone:'09123334455',...bad}));assert.ok(r.status>=400&&r.status<500,JSON.stringify(bad)+' '+r.status);
 }
 e=fixture();
 // a subscriber pack alone needs a running subscription
 assert.equal((await call(e,'/api/buy',buyer({phone:'09125556677',kind:'pack',line:'hair',pack:50}))).status,409);
 // only the minimum fields: a name and a mobile
 assert.equal((await call(e,'/api/buy',{kind:'images',line:'hair',count:5,phone:'09125556677'})).status,400);
 assert.equal((await call(e,'/api/buy',{kind:'images',line:'hair',count:5,name:'سالن'})).status,400);
 // the old plans are not sold any more (a switch in app_settings, off by default), nor to a v2 salon
 assert.equal((await call(e,'/api/order',{plan:'essential',service:'hair',salon:'سالن',name:'سارا',phone:'09126667788',consent:true})).status,410);
 // subscriptions are not sold through the old plan checkout
 assert.equal((await call(e,'/api/order',{plan:'sub_hair',service:'hair',salon:'سالن',name:'سارا',phone:'09126667788',consent:true})).status,409);
});

test('image-only buyers get credits for one line only, never expiring, and none of the panel features',async()=>{
 const e=fixture();const m=mockProvider();
 try{
  const s=await bought(e,{kind:'images',line:'hair',count:5});
  const settings=JSON.parse(s.settings);assert.equal(settings.plan.key,'images');assert.deepEqual(settings.lines,['hair']);assert.ok(!settings.plan.until,'no end date');
  const ledger=e.DB.sql.prepare('SELECT delta,line FROM credit_ledger WHERE salon_id=?').all(s.id);assert.deepEqual(ledger.map(r=>[r.delta,r.line]),[[5,'hair']],'no signup gift, credits on their line');
  const me=(await call(e,'/api/panel/me',undefined,{cookie:s.cookie})).data;
  assert.deepEqual(me.features,[],'image-only: no page, bot, booking or report');
  assert.equal(me.pricing.image_only,true);assert.equal(me.pricing.lines.hair.left,5);assert.equal(me.pricing.lines.nails.left,0);
  assert.deepEqual(me.checklist.items.map(i=>i.key),['try','share'],'only the steps an image-only salon has');
  for(const [path,body] of [['/api/panel/requests',undefined],['/api/panel/bookings',undefined],['/api/panel/report',undefined],['/api/panel/profile',{bio:'x'}]]){
   const r=await call(e,path,body,{cookie:s.cookie});assert.equal(r.status,403,path+' '+JSON.stringify(r.data));assert.match(r.data.error,/اشتراک ماهانه/);
  }
  const pub=(await call(e,'/api/s/'+s.slug+'/public')).data;assert.equal(pub.telegram,false,'no requests to an image-only salon');assert.deepEqual(pub.lines,['hair']);
  // a hair credit is spent by a hair image; nails is not offered and not paid
  const ok=await guestGen(e,s.slug,'hair');assert.equal(ok.status,200,JSON.stringify(ok));
  assert.equal((await guestGen(e,s.slug,'nails')).status,403);
  const after=(await call(e,'/api/panel/me',undefined,{cookie:s.cookie})).data.pricing.lines;assert.equal(after.hair.left,4);assert.equal(after.hair.used,1);
  // far in the future the credits are still there (they never expire)
  const late=await meLater(e,s.order.access_key,400);assert.equal(late.credits.expired,false);assert.equal(late.pricing.lines.hair.left,4);
 }finally{m.restore()}
});

test('per-line spending: a hair credit cannot be spent on nails; an empty line stops with a plain message',async()=>{
 const e=fixture();const m=mockProvider();
 try{
  const s=await bought(e,{kind:'images',line:'nails',count:1});
  const more=await call(e,'/api/panel/buy',{kind:'images',line:'hair',count:5},{cookie:s.cookie});assert.equal(more.status,200,JSON.stringify(more));
  assert.equal(more.data.same_key,true,'signed in: same panel, no new key');
  e.DB.sql.exec("INSERT INTO app_settings(key,value,updated_at) VALUES('legacy_plans','1',0)");
  assert.equal((await call(e,'/api/panel/topup',{packs:1},{cookie:s.cookie})).status,409,'no cheap legacy top-up for a v2 salon');
  assert.equal((await call(e,'/api/panel/renew',{plan:'signature'},{cookie:s.cookie})).status,409,'no legacy plan for a v2 salon');assert.equal(more.data.amount,238000);
  await confirm(e,more.data.id);
  const settings=JSON.parse(e.DB.sql.prepare('SELECT settings FROM salons WHERE id=?').get(s.id).settings);assert.deepEqual(settings.lines,['hair','nails'],'the new line is offered');
  assert.equal((await guestGen(e,s.slug,'nails')).status,200);
  const stop=await guestGen(e,s.slug,'nails');assert.equal(stop.status,402,'nails is empty even though hair has 5');assert.match(stop.data.error,/متوقف/);
  const lines=(await call(e,'/api/panel/me',undefined,{cookie:s.cookie})).data.pricing.lines;assert.equal(lines.hair.left,5);assert.equal(lines.nails.left,0);
  // a failed image never costs a credit
  e.DB.sql.prepare("UPDATE generations SET state='fail' WHERE salon_id=?").run(s.id);
  assert.equal((await call(e,'/api/panel/me',undefined,{cookie:s.cookie})).data.pricing.lines.nails.left,1);
 }finally{m.restore()}
});

test('a subscription opens every feature for a month; bought with its first pack in one order; after it ends, images stay',async()=>{
 const e=fixture();
 const s=await bought(e,{kind:'sub',sub:'sub_color',pack:100});
 assert.equal(s.order.amount,2900000+3500000);assert.match(s.order.plan_name,/اشتراک رنگ مو \+ بستهٔ ۱۰۰ عکس رنگ مو/);
 const me=(await call(e,'/api/panel/me',undefined,{cookie:s.cookie})).data;
 for(const f of ['page','gallery','inbox','bot','booking','report_simple','report_full','archive'])assert.ok(me.features.includes(f),f);
 assert.equal(me.pricing.active,true);assert.equal(me.pricing.lines.color.left,100+24,'the pack + half the subscription (1,450,000 ÷ 60,000)');assert.equal(me.pricing.lines.hair.left,0);
 assert.deepEqual(JSON.parse(e.DB.sql.prepare('SELECT settings FROM salons WHERE id=?').get(s.id).settings).lines,['color']);
 // a subscriber pack for the same line, at the subscriber price; another line's subscriber pack is refused
 const p=await call(e,'/api/panel/buy',{kind:'pack',line:'color',pack:50},{cookie:s.cookie});assert.equal(p.status,200);assert.equal(p.data.amount,2000000);
 assert.equal((await call(e,'/api/panel/buy',{kind:'pack',line:'nails',pack:50},{cookie:s.cookie})).status,409);
 // small path-1 packs stay open to subscribers
 assert.equal((await call(e,'/api/panel/buy',{kind:'images',line:'color',count:5},{cookie:s.cookie})).data.amount,285000);
 // a retried confirmation never extends the month twice
 const until=JSON.parse(e.DB.sql.prepare('SELECT settings FROM salons WHERE id=?').get(s.id).settings).plan.until;
 await confirm(e,s.order.id);assert.equal(JSON.parse(e.DB.sql.prepare('SELECT settings FROM salons WHERE id=?').get(s.id).settings).plan.until,until);
 const late=await meLater(e,s.order.access_key,40);assert.deepEqual(late.features,[],'ended: back to image-only');assert.equal(late.pricing.lines.color.left,124,'credits stay');assert.equal(late.credits.expired,false);
});

test('salon subscription: every line, its staff size as the user cap, packs per chosen service',async()=>{
 const e=fixture();
 const s=await bought(e,{kind:'sub',sub:'sub_salon8',line:'lashes',pack:50});
 const settings=JSON.parse(s.settings);assert.equal(settings.plan.seats,8);assert.deepEqual(settings.lines,['hair','color','nails','lashes']);
 const me=(await call(e,'/api/panel/me',undefined,{cookie:s.cookie})).data;assert.equal(me.seats.cap,8);assert.equal(me.pricing.lines.lashes.left,50+98,'pack + 3,950,000 toman ÷ 40,000');assert.equal(me.pricing.lines.hair.left,79,'3,950,000 ÷ 50,000, for any service');assert.equal(me.pricing.pool.left,3950000);
 for(const line of ['hair','nails'])assert.equal((await call(e,'/api/panel/buy',{kind:'pack',line,pack:100},{cookie:s.cookie})).status,200,line);
 // going down to one service while the salon subscription runs is a support call
 assert.equal((await call(e,'/api/panel/buy',{kind:'sub',sub:'sub_hair'},{cookie:s.cookie})).status,409);
});

test('a returning buyer (same mobile) keeps the same salon; image credits then a subscription',async()=>{
 const e=fixture();
 const a=await bought(e,{kind:'images',line:'hair',count:10});
 const b=await bought(e,{kind:'sub',sub:'sub_nails'});
 assert.equal(a.id,b.id,'same salon');
 const settings=JSON.parse(e.DB.sql.prepare('SELECT settings FROM salons WHERE id=?').get(a.id).settings);
 assert.deepEqual(settings.lines,['hair','nails'],'the bought image line stays offered');assert.equal(settings.plan.key,'sub_nails');
 const me=(await call(e,'/api/panel/me',undefined,{cookie:b.cookie})).data;assert.equal(me.pricing.lines.hair.left,10);assert.equal(me.pricing.lines.nails.left,12,'half of 990,000 at 40,000 each');assert.ok(me.features.includes('booking'));
});

test('/pricing: two paths, four services + salon, honest copy and a 3-click checkout',async()=>{
 const e=fixture();
 const res=await app.fetch(new Request('https://business.test.example/pricing?s=nails'),e);assert.equal(res.status,200);const html=await res.text();
 assert.equal(html,pricingHTML.replaceAll('__ORIGIN__','https://business.test.example').replaceAll('__MAIN__','https://test.example').replaceAll('__CANON__','/pricing'));
 assert.ok(html.includes('<title>خرید اشتراک و اعتبار | آینه</title>'));
 for(const t of ['فقط ساخت تصویر','اشتراک ماهانه','با اشتراک چه چیزی اضافه می‌گیرم','ماهی چند عکس می‌سازی؟'])assert.ok(html.includes(t),t);
 for(const k of ['hair','color','nails','lashes','salon'])assert.match(html,new RegExp('data-ptab="'+k+'"'),k);
 // every price on the page is from the sheet (Persian digits)
 const fa=n=>n.toLocaleString('fa-IR');
 for(const [k,v] of Object.entries(IMAGE_PRICES))for(const a of [v.single,...Object.values(v.packs)])assert.ok(html.includes(fa(a)),k+' '+a);
 for(const k of SUB_KEYS)assert.ok(html.includes(fa(PLANS[k].amount)),k);
 for(const v of Object.values(SUB_PACKS))for(const a of Object.values(v))assert.ok(html.includes(fa(a)),String(a));
 // the checkout asks only for a name and a mobile, and never for a card number
 const sheet=(html.match(/<section id="pay"[\s\S]*?<\/section>/)||[''])[0];
 assert.ok(sheet.includes('id="payName"')&&sheet.includes('id="payPhone"'));
 assert.doesNotMatch(html,/name="card"|شمارهٔ کارت خود|cvv2|رمز دوم/i);
 assert.doesNotMatch(html,/whk_|pay_webhook_key|Bearer /,'no payment token in the page');
 // honest copy: no countdown or scarcity, no Arabic letters, no consultant claim (it exists only on Ayneh's own studio)
 const visible=html.replace(/<script>[\s\S]*?<\/script>/g,'').replace(/<style>[\s\S]*?<\/style>/g,'');
 assert.doesNotMatch(visible,/[يك]/,'no Arabic ye/kaf');
 assert.doesNotMatch(visible,/فقط امروز|ظرفیت محدود|تخفیف ویژهٔ امروز|مشاور زیبایی/);
 for(const src of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]))assert.doesNotThrow(()=>new Function(src));
 // the main domain serves it too (the panel links here with its own cookie); /pay is the same checkout
 assert.equal((await app.fetch(new Request(origin+'/pricing'),e)).status,200);
 assert.ok((await (await app.fetch(new Request('https://business.test.example/pay'),e)).text()).includes('id="pricing"'));
 // every business page's price section links here with its own service
 const {servicePages,landingHTML}=await import('../worker/landing.js');
 assert.ok(landingHTML.includes('href="/pricing?s=hair"'));
 for(const [k,s] of [['hair','hair'],['color','color'],['nails','nails'],['lashes','lashes'],['salon','salon']])assert.ok(servicePages[k].includes('href="/pricing?s='+s+'"'),k);
 assert.doesNotMatch(landingHTML+Object.values(servicePages).join(''),/data-buy="(essential|pro|signature|salon[136])"/,'the old plans are no longer sold on any page');
});

test('free signup: 3 images, then a purchase with the signup cookie goes to the same mobile and page without a form, and the paid order says what was switched on',async()=>{
 const e=fixture();e.KIE_API_KEY='mock';const p=mockProvider();
 try{
  const su=await call(e,'/api/trial',{name:'استودیو مهتاب',phone:'09125556677',line:'nails',consent:true});
  assert.equal(su.status,200,JSON.stringify(su));assert.equal(su.data.images,3);assert.equal(su.data.line,'nails');assert.equal(su.data.token,undefined);
  assert.match(su.cookie||'',/^ayneh_trial=[a-f0-9]{48}$/);const ck={cookie:su.cookie},slug=su.data.path.slice(3);
  const me=await call(e,'/api/trial/me',undefined,ck);assert.equal(me.data.trial.phone,'0912***6677','only a masked mobile');assert.equal(me.data.trial.images_left,3);assert.equal(me.data.trial.line,'nails');
  assert.equal((await call(e,'/api/trial/me')).data.trial,null,'no cookie, nobody');
  for(let i=0;i<3;i++)assert.equal((await guestGen(e,slug,'nails')).status,200);
  const out=await guestGen(e,slug,'nails');assert.equal(out.status,402);assert.equal(out.data.code,'trial_empty');
  // The same browser buys: name and mobile come from the signup, not from the request.
  const o=await call(e,'/api/buy',{kind:'images',line:'nails',count:10,name:'someone else',phone:'09120000000'},ck);
  assert.equal(o.status,200,JSON.stringify(o));
  const row=e.DB.sql.prepare('SELECT phone,note FROM orders WHERE id=?').get(o.data.id);assert.equal(row.phone,'+989125556677');assert.match(row.note,/^trial:/);
  // A stranger cannot point an order at someone's signup page.
  const x=await call(e,'/api/buy',{kind:'images',line:'nails',count:5,name:'غریبه',phone:'09123334455',trial_salon:row.note.slice(6)});
  assert.equal(e.DB.sql.prepare('SELECT note FROM orders WHERE id=?').get(x.data.id).note,'');
  const c=await confirm(e,o.data.id);assert.equal(c.status,200,JSON.stringify(c));
  const salon=e.DB.sql.prepare('SELECT s.id,s.slug,s.settings FROM orders o JOIN salons s ON s.id=o.salon_id WHERE o.id=?').get(o.data.id);
  assert.equal(salon.slug,slug,'the same page');assert.equal(JSON.parse(salon.settings).trial,undefined,'no longer a trial');
  assert.ok(e.DB.sql.prepare('SELECT converted_at FROM trials WHERE salon_id=?').get(salon.id).converted_at);
  const paid=await call(e,'/api/order/'+o.data.id);const a=paid.data.activated;
  assert.equal(a.phone,'0912***6677');assert.equal(a.images,10);assert.equal(a.line_label,'ناخن');assert.deepEqual(a.lines.map(l=>[l.line,l.left]),[['nails',10]]);
  // The paid page now spends the salon's credit (the free images stay free).
  assert.equal((await guestGen(e,slug,'nails')).status,200);
  assert.equal((await call(e,'/api/trial/me',undefined,ck)).data.trial.converted,true);
  // A mobile with a paid panel cannot sign up for free images again.
  assert.equal((await call(e,'/api/trial',{name:'دوباره',phone:'09125556677',consent:true})).status,409);
 }finally{p.restore()}
});

test('the free-signup popup and the success summary ship in the pages',()=>{
 assert.ok(pricingHTML.includes('id="prFreeBtn"')&&pricingHTML.includes('ثبت‌نام رایگان'),'signup on /pricing');
 assert.ok(pricingHTML.includes('/api/trial/me')&&pricingHTML.includes('__AYN_TRIAL'),'buying for the signed-up mobile');
 assert.ok(pricingHTML.includes('پرداخت شما با موفقیت تأیید شد'),'the success popup');
});

test('members\' credit shares: the manager caps a member, her customers stop at the cap, credit bought for her raises it',async()=>{
 const e=fixture(),pv=mockProvider();
 try{
  const s=await bought(e,{kind:'sub',sub:'sub_salon3'});
  const mid=crypto.randomUUID();
  e.DB.sql.prepare("INSERT INTO team(id,salon_id,name,specialty,ref_code,active,created_at) VALUES(?,?,?,?,?,1,?)").run(mid,s.id,'مریم','کوتاهی','sm2r3m4n',Date.now());
  const visitor='ab'.repeat(10);
  e.DB.sql.prepare("INSERT INTO ref_visitors(salon_id,visitor,tag,staff_id,parent_visitor,gen,came_with,created_at) VALUES(?,?,?,?,NULL,1,'',?)").run(s.id,visitor,'vq2w3e4r',mid,Date.now());
  const gen=async()=>{const ss=await call(e,'/api/s/'+s.slug+'/session',{});const g={cookie:ss.cookie};
   const up=await call(e,'/api/s/'+s.slug+'/upload?kind=original',png(),g);
   return call(e,'/api/s/'+s.slug+'/generate',{image_consent:true,idem:crypto.randomUUID(),line:'hair',original_id:up.data.id,style:0,v:visitor},g)};
  let me=(await call(e,'/api/panel/me',undefined,{cookie:s.cookie})).data;
  assert.equal(me.pricing.pool.granted,2450000,'half of 4,900,000');
  assert.deepEqual(me.pricing.staff.map(m=>[m.name,m.cap]),[['مریم',null]]);
  const cap=await call(e,'/api/panel/staff-credit',{staff:mid,cap:'50000'},{cookie:s.cookie});
  assert.equal(cap.status,200,JSON.stringify(cap));assert.equal(cap.data.left,50000);
  const a=await gen();assert.equal(a.status,200,JSON.stringify(a));
  assert.equal(e.DB.sql.prepare('SELECT staff_id FROM generations WHERE id=?').get(a.data.id).staff_id,mid,'the image is hers');
  const b=await gen();assert.equal(b.status,402,JSON.stringify(b));assert.match(b.data.error,/سهم/);
  // she buys 5 hair images from her own link: no form, the salon's order, her share
  const info=await call(e,'/api/staff-credit/'+mid);assert.equal(info.status,200);assert.equal(info.data.member.name,'مریم');assert.equal(info.data.sub,'all');
  assert.ok([400,409].includes((await call(e,'/api/buy',{staff:mid,kind:'sub',sub:'sub_hair'})).status),'no subscription for a member');
  const o=await call(e,'/api/buy',{staff:mid,kind:'pack',line:'hair',pack:50});assert.equal(o.status,200,JSON.stringify(o));
  assert.equal(e.DB.sql.prepare('SELECT staff_id,salon_id FROM orders WHERE id=?').get(o.data.id).salon_id,s.id);
  await confirm(e,o.data.id);
  me=(await call(e,'/api/panel/me',undefined,{cookie:s.cookie})).data;
  const m=me.pricing.staff[0];assert.equal(m.extra,50*50000);assert.equal(m.left,50000+50*50000-50000);
  assert.equal((await gen()).status,200,'her share is open again');
  // the manager buys for her from the panel too
  const p=await call(e,'/api/panel/buy',{staff:mid,kind:'images',line:'nails',count:5},{cookie:s.cookie});assert.equal(p.status,200,JSON.stringify(p));
  assert.equal(e.DB.sql.prepare('SELECT staff_id FROM orders WHERE id=?').get(p.data.id).staff_id,mid);
 }finally{pv.restore()}
});

test('tiers (owner, Nov 2026): no «فقط اشتراک»; stylist and salon tier names; the top tier lists the salon to Ayneh\'s customers',async()=>{
 assert.doesNotMatch(pricingHTML,/فقط اشتراک/);
 for(const t of ['آرایشگر مبتدی','آرایشگر حرفه‌ای','آرایشگر فوق حرفه‌ای','سالن کم‌مشتری','سالن رو به رشد','سالن پر از مشتری','جذب مشتری و تبلیغات شما'])assert.ok(pricingHTML.includes(t),t);
 const e=fixture();
 const s=await bought(e,{kind:'sub',sub:'sub_salon20'});
 const f=await call(e,'/api/featured');assert.deepEqual(f.data.salons.map(x=>x.slug),[s.slug]);
 const e2=fixture();await bought(e2,{kind:'sub',sub:'sub_hair',pack:50});assert.equal((await call(e2,'/api/featured')).data.salons.length,0,'only the top tier');
});

test('monthly capacity is real: each new subscribing salon takes a place, a full month refuses new subscriptions, renewals pass',async()=>{
 const e=fixture();
 e.DB.sql.prepare("INSERT INTO app_settings(key,value,updated_at) VALUES('monthly_capacity','2',0)").run();
 assert.deepEqual((await call(e,'/api/capacity')).data,{total:2,left:2});
 const a=await bought(e,{kind:'sub',sub:'sub_hair',pack:50},'09121110001');
 assert.equal((await call(e,'/api/capacity')).data.left,1);
 await bought(e,{kind:'images',line:'hair',count:5},'09121110002');
 assert.equal((await call(e,'/api/capacity')).data.left,1,'image credits never take a place');
 await bought(e,{kind:'sub',sub:'sub_nails',pack:50},'09121110003');
 assert.equal((await call(e,'/api/capacity')).data.left,0);
 const full=await call(e,'/api/buy',buyer({phone:'09121110004',kind:'sub',sub:'sub_color',pack:50}));assert.equal(full.status,409);assert.match(full.data.error,/ظرفیت/);
 assert.equal((await call(e,'/api/buy',buyer({phone:'09121110004',kind:'images',line:'color',count:5}))).status,200,'image credits stay open');
 assert.equal((await call(e,'/api/panel/buy',{kind:'sub',sub:'sub_hair',pack:100},{cookie:a.cookie})).status,200,'a running subscriber renews');
});
