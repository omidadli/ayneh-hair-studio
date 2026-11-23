// Phase 1 — the beauty consultant: analysis caps + cache, ranked suggestions from the
// service's own catalog, guest-unsaved flow, signed-in storage and the one-time share link.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';
import {database,memoryBucket} from '../scripts/local-adapter.mjs';import app from '../worker/index.js';
import {customerHTML} from '../worker/customer.js';
import {QUESTIONS,ANALYSIS_FIELDS,RELEVANT,cleanAnalysis,suggest} from '../worker/consult.js';
import {styles} from '../worker/legacy.js';
import {COLOR_STYLES,NAIL_STYLES,LASH_STYLES,LINE_KEYS} from '../worker/lines.js';

const origin='https://test.example';
const migrations=readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort();
function fixture(){const DB=database();for(const f of migrations)DB.sql.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));return {DB,BUCKET:memoryBucket(),OWNER_EMAIL:'owner@test',JOB_TOKEN:'job-test',TRUST_PLATFORM_IDENTITY:'true'};}
const OWNER={user:'owner-a',email:'owner@test'};
async function call(env,path,body,{cookie='',user='owner-a',email='owner@test'}={}){const headers={origin,'oai-authenticated-user-id':user,'oai-authenticated-user-email':email,cookie};let payload;if(body!==undefined){if(body instanceof Uint8Array){payload=body}else{headers['content-type']='application/json';payload=JSON.stringify(body)}}const res=await app.fetch(new Request(origin+path,{method:body===undefined?'GET':'POST',headers,body:payload}),env);let d;try{d=await res.json()}catch{d=null}return {status:res.status,data:d,headers:res.headers,cookie:res.headers.get('set-cookie')?.split(';')[0]};}
/* Every test salon IS the direct studio salon: the consultant card (and its paid vision
   routes) exist only there, so the fixture flips the row it just created instead of making a
   second one — every slug path below keeps working unchanged. */
async function salon(env,slug='salon-a'){const r=await call(env,'/api/salons',{slug,name:'سالن '+slug},OWNER);assert.equal(r.status,200,JSON.stringify(r));
 const u=await env.DB.prepare('UPDATE salons SET id=?,owner_id=? WHERE id=?').bind('ayneh-direct','direct',r.data.id).run();
 assert.equal(u.meta.changes,1,'the salon becomes the direct studio salon');return {id:'ayneh-direct',slug};}
async function guest(env,s){const r=await call(env,'/api/s/'+s.slug+'/session',{});assert.equal(r.status,200);return {cookie:r.cookie};}
/* Unique bytes per call (PNG magic kept, tail random): identical bytes would hit the photo-hash
   cache and skip the very counters a test is trying to spend. */
const png=()=>{const b=new Uint8Array(150);b.set([137,80,78,71,13,10,26,10]);crypto.getRandomValues(b.subarray(8));return b};
async function upload(env,s,g,kind='original',data){const r=await call(env,'/api/s/'+s.slug+'/upload?kind='+kind,data||png(),g);assert.equal(r.status,200,JSON.stringify(r));return r.data.id;}
const otpBody=(extra={})=>({first_name:'سارا',last_name:'محمدی',phone:'۰۹۱۲۱۲۳۴۵۶۷',...extra});
/* A verified customer without touching the network: MELIPAYAMAK_TOKEN=dev-mock answers locally. */
async function verified(env,s,phone='۰۹۱۲۱۲۳۴۵۶۷'){const g=await guest(env,s);env.MELIPAYAMAK_TOKEN='dev-mock';const sent=await call(env,'/api/s/'+s.slug+'/otp/send',otpBody({phone}),g);assert.equal(sent.status,200,JSON.stringify(sent));const ok=await call(env,'/api/s/'+s.slug+'/otp/verify',{code:'12345'},g);assert.equal(ok.status,200,JSON.stringify(ok));return g;}
/* The KIE vision chat stand-in: records each body, answers with the given JSON content. */
function mockVision(content){const calls=[];const previous=globalThis.fetch;globalThis.fetch=async(url,init)=>{const u=String(url);if(u.includes('api.kie.ai')&&u.includes('/v1/chat/completions')){calls.push(JSON.parse(init.body));return Response.json({choices:[{message:{content}}]})}return previous(url,init)};return {calls,restore(){globalThis.fetch=previous}};}
const MODEL_JSON=JSON.stringify({face_shape:'round',hair_texture:'wavy',hair_length:'long',hair_density:'high',skin_undertone:'warm',hair_color:'black',confidence:{face_shape:0.92,hair_texture:0.8,hair_length:0.88,hair_density:0.7,skin_undertone:0.3,hair_color:0.95}});

test('analysis fields and the six skippable questions are one source of truth for every surface',()=>{
 assert.equal(QUESTIONS.length,6);
 for(const q of QUESTIONS){assert.ok(q.label&&q.options.length>=3);assert.equal(new Set(q.options.map(o=>o[0])).size,q.options.length)}
 assert.deepEqual(Object.keys(RELEVANT).sort(),[...LINE_KEYS].sort());
 for(const line of LINE_KEYS)assert.ok(RELEVANT[line].length>=1&&RELEVANT[line].length<=6,line);
 // The embedded client copy is present and the placeholder is replaced.
 assert.match(customerHTML,/نمی‌دونی چی بهت میاد\؟ تحلیلش کنیم/);
 assert.match(customerHTML,/\['consult','مشاوره‌ها'\]/);
 assert.match(customerHTML,/روی عکسم بساز/);
 assert.doesNotMatch(customerHTML,/__CONSULT__/);
});

test('cleanAnalysis accepts the model shape and the client echo, and never trusts either',()=>{
 const flat=cleanAnalysis(JSON.parse(MODEL_JSON),'hair');
 assert.deepEqual(flat.fields.hair_color,'black');
 assert.ok(flat.low.includes('skin_undertone'),'a 0.3 confidence is asked, not used');
 assert.equal(flat.confidence.face_shape,0.92);
 const nested=cleanAnalysis({fields:{face_shape:'OVAL',hair_color:'neon',bogus:'x'},confidence:{face_shape:2,hair_color:0.9}},'hair');
 assert.equal(nested.fields.face_shape,'oval','case is normalised');
 assert.ok(!('hair_color' in nested.fields),'an unknown enum value is dropped, not stored');
 assert.ok(!('bogus' in nested.fields));
 assert.equal(nested.confidence.face_shape,1,'confidence is clamped');
 assert.deepEqual(cleanAnalysis(null,'hair').fields,{});
 // Per line: a nails photo only keeps the undertone.
 const nails=cleanAnalysis(JSON.parse(MODEL_JSON),'nails');
 assert.deepEqual(Object.keys(nails.fields),['skin_undertone']);
});

test('suggestions are 3–6 ranked picks from that service’s catalog, each with a reason and a limit',()=>{
 const catalogs={hair:styles.map(s=>s[0]),color:COLOR_STYLES.map(c=>c[0]),nails:NAIL_STYLES.map(n=>n[0]),lashes:LASH_STYLES.map(l=>l[0])};
 for(const line of LINE_KEYS){
  const r=suggest(line,{fields:{}},{});
  assert.equal(r.line,line);
  assert.ok(r.picks.length>=3&&r.picks.length<=6,line+' → '+r.picks.length);
  for(const p of r.picks){
   assert.equal(typeof p.index,'number');
   assert.equal(p.name,catalogs[line][p.index],'the pick comes from this service’s own catalog');
   assert.ok(p.why&&p.why.length>5,'«چرا به تو میاد»');
   assert.ok(p.limit&&p.limit.length>5,'«محدودیت اجرا»');
  }
  const again=suggest(line,{fields:{}},{});
  assert.deepEqual(r.picks,again.picks,'deterministic: the same answers give the same order');
 }
 // Answers move the ranking.
 const calm=suggest('hair',{fields:{face_shape:'round'}},{care:'low',length:'shorter',boldness:'same'});
 const bold=suggest('hair',{fields:{face_shape:'round'}},{care:'high',length:'longer',boldness:'big',occasion:'wedding'});
 assert.notDeepEqual(calm.picks.map(p=>p.name),bold.picks.map(p=>p.name),'different answers, different picks');
 assert.ok(calm.picks[0].why.length>5&&bold.picks[0].limit.length>5);
 assert.throws(()=>suggest('nope',{fields:{}},{}),/بخش معتبر نیست/);
});

test('the consultant card and the three-step sheet are on the studio page, with no forbidden words',()=>{
 const script=customerHTML.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)[1];
 new Function(script); // parses
 assert.doesNotMatch(script,/appointment|services|staff|kavenegar/i);
 assert.match(script,/openConsult/);
 assert.match(script,/consult\/analyze/);
 assert.match(script,/consult\/suggest/);
});

test('a guest analyses through the caps and cache; without a key or over the cap nothing is invented',async()=>{
 const e=fixture(),s=await salon(e),g=await guest(e,s);
 const photo=await upload(e,s,g);
 // No key: the route falls back to the questionnaire — no fabricated fields, no limits spent.
 const noKey=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo,line:'hair'},g);
 assert.equal(noKey.status,200,JSON.stringify(noKey));
 assert.equal(noKey.data.ok,false);assert.equal(noKey.data.fallback,'questionnaire');assert.ok(!noKey.data.fields);
 assert.equal(e.DB.sql.prepare('SELECT count(*) n FROM ai_cache').get().n,0);
 e.KIE_API_KEY='mock';
 const kv=mockVision(MODEL_JSON);
 try{
  const first=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo,line:'hair'},g);
  assert.equal(first.status,200,JSON.stringify(first));
  assert.equal(first.data.ok,true);assert.equal(first.data.cached,false);
  assert.equal(first.data.fields.hair_color,'black');
  assert.ok(first.data.low.includes('skin_undertone'),'the unsure field comes back to be asked');
  assert.equal(kv.calls.length,1);
  assert.equal(e.DB.sql.prepare('SELECT count(*) n FROM ai_cache').get().n,1,'the result is cached');
  // Same photo again: free, no second provider call, no cap spent.
  const again=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo,line:'hair'},g);
  assert.equal(again.data.cached,true);assert.equal(kv.calls.length,1);
  // A guest gets one analysis a day: a different photo is refused with a clear Persian message.
  const other=await upload(e,s,g);
  const over=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:other,line:'hair'},g);
  assert.equal(over.status,429,JSON.stringify(over));
  assert.match(over.data.error,/تحلیل عکس امروز تمام شد/);
  assert.equal(kv.calls.length,1,'the cap is checked before we pay');
 }finally{kv.restore()}
 // Someone else's photo is not analysable.
 const g2=await guest(e,s);
 const foreign=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo,line:'hair'},g2);
 assert.equal(foreign.status,403,JSON.stringify(foreign));
 // A reference photo is not «her own».
 const ref=await upload(e,s,g,'reference');
 assert.equal((await call(e,'/api/s/salon-a/consult/analyze',{photo_id:ref,line:'hair'},g)).status,404);
});

test('the consultant’s paid routes are closed everywhere except the direct studio salon',async()=>{
 const e=fixture();
 const r=await call(e,'/api/salons',{slug:'salon-b',name:'سالن ب'},OWNER);
 assert.equal(r.status,200,JSON.stringify(r));
 const s={id:r.data.id,slug:'salon-b'},g=await guest(e,s);
 const photo=await upload(e,s,g);
 e.KIE_API_KEY='mock';
 const kv=mockVision(MODEL_JSON);
 try{
  const an=await call(e,'/api/s/salon-b/consult/analyze',{photo_id:photo,line:'hair'},g);
  assert.equal(an.status,404,JSON.stringify(an));
  assert.match(an.data.error,/استودیوی آینه/);
  const sg=await call(e,'/api/s/salon-b/consult/suggest',{line:'hair',analysis:{},answers:{}},g);
  assert.equal(sg.status,404,JSON.stringify(sg));
  assert.match(sg.data.error,/استودیوی آینه/);
  assert.equal(kv.calls.length,0,'a closed salon can never reach the provider');
 }finally{kv.restore()}
 // The ungated profile routes keep their own answers — 401, never the gate’s 404.
 const save=await call(e,'/api/s/salon-b/consult',{line:'hair',photo_id:photo,analysis:{source:'self',fields:{face_shape:'round'}},answers:{}},g);
 assert.equal(save.status,401,JSON.stringify(save));
 assert.equal((await call(e,'/api/s/salon-b/consults',undefined,g)).status,401);
});

test('a failed vision call gives the paid slot back — the same photo can be retried',async()=>{
 const e=fixture(),s=await salon(e),g=await guest(e,s);
 const photo=await upload(e,s,g);
 e.KIE_API_KEY='mock';
 let kv=mockVision('این متن JSON نیست');
 try{
  const bad=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo,line:'hair'},g);
  assert.equal(bad.status,200,JSON.stringify(bad));
  assert.equal(bad.data.ok,false);assert.equal(bad.data.fallback,'questionnaire');
  assert.equal(kv.calls.length,1);
 }finally{kv.restore()}
 kv=mockVision(MODEL_JSON);
 try{
  const good=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo,line:'hair'},g);
  assert.equal(good.status,200,JSON.stringify(good));
  assert.equal(good.data.ok,true);assert.equal(good.data.cached,false);
  assert.equal(good.data.fields.hair_color,'black');
  assert.equal(kv.calls.length,1,'a fresh provider call — the refunded slot let the retry through at all');
 }finally{kv.restore()}
});

test('one network gets at most 10 paid analyses a day — a farm cannot loop them',async()=>{
 const e=fixture(),s=await salon(e);
 e.KIE_API_KEY='mock';
 const kv=mockVision(MODEL_JSON);
 try{
  for(let i=0;i<10;i++){
   const g=await guest(e,s),photo=await upload(e,s,g);
   const r=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo,line:'hair',v:i.toString(16).padStart(16,'0')},g);
   assert.equal(r.status,200,`guest ${i}: `+JSON.stringify(r));
   assert.equal(r.data.ok,true);
  }
  assert.equal(kv.calls.length,10);
  const g=await guest(e,s),photo=await upload(e,s,g);
  const over=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo,line:'hair',v:'f'.repeat(16)},g);
  assert.equal(over.status,429,JSON.stringify(over));
  assert.match(over.data.error,/از این شبکه/);
  assert.equal(kv.calls.length,10,'the network cap refuses before paying');
 }finally{kv.restore()}
});

test('the cache keys on the photo bytes — the same picture is never paid for twice',async()=>{
 const e=fixture(),s=await salon(e),g=await guest(e,s);
 const bytes=png();
 const photo1=await upload(e,s,g,'original',bytes);
 const photo2=await upload(e,s,g,'original',bytes);
 assert.notEqual(photo1,photo2,'two uploads, two ids');
 e.KIE_API_KEY='mock';
 const kv=mockVision(MODEL_JSON);
 try{
  const first=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo1,line:'hair'},g);
  assert.equal(first.status,200,JSON.stringify(first));
  assert.equal(first.data.cached,false);assert.equal(kv.calls.length,1);
  const again=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo2,line:'hair'},g);
  assert.equal(again.status,200,JSON.stringify(again));
  assert.equal(again.data.cached,true);assert.equal(kv.calls.length,1,'identical bytes hit the cache');
  assert.equal(e.DB.sql.prepare('SELECT count(*) n FROM ai_cache').get().n,1);
 }finally{kv.restore()}
});

test('the consultant card and its paid vision exist only on hair and colour — never nails or lashes',async()=>{
 // Client: the card is absent on both lines and analyze never calls the API for them.
 assert.match(customerHTML,/L!=='nails'&&L!=='lashes'\)box\.append\(consultCard\(\)\)/);
 assert.match(customerHTML,/consult\.line==='nails'\|\|consult\.line==='lashes'/);
 // Server: those lines answer the questionnaire fallback and touch neither provider nor counters.
 const e=fixture(),s=await salon(e),g=await guest(e,s);
 const photo=await upload(e,s,g);
 const before=e.DB.sql.prepare('SELECT count(*) n FROM limits').get().n;
 e.KIE_API_KEY='mock';
 const kv=mockVision(MODEL_JSON);
 try{
  for(const line of ['nails','lashes']){
   const r=await call(e,'/api/s/salon-a/consult/analyze',{photo_id:photo,line},g);
   assert.equal(r.status,200,JSON.stringify(r));
   assert.equal(r.data.ok,false);assert.equal(r.data.fallback,'questionnaire');
  }
  assert.equal(kv.calls.length,0,'no vision run, no charge');
 }finally{kv.restore()}
 assert.equal(e.DB.sql.prepare('SELECT count(*) n FROM limits').get().n,before,'no counter was spent');
 assert.equal(e.DB.sql.prepare('SELECT count(*) n FROM ai_cache').get().n,0);
});

test('each pick shows its own distinct matched reason; an unmatched pick gets its tag’s line',()=>{
 // Unmatched (empty answers): every card's reason names its own tag — never one generic line.
 const catalogs={hair:styles,color:COLOR_STYLES,nails:NAIL_STYLES,lashes:LASH_STYLES};
 for(const line of LINE_KEYS){
  const r=suggest(line,{fields:{}},{});
  for(const p of r.picks){
   const tag=catalogs[line][p.index][2];
   assert.ok(p.why.includes(tag),line+' → fallback must name «'+tag+'»: '+p.why);
   assert.ok(p.why.length>5);
  }
 }
 // Matched: no two cards of the same result show the same reason.
 const r=suggest('hair',{fields:{face_shape:'round',hair_length:'short',hair_texture:'wavy',hair_density:'high'}},{length:'shorter',care:'low',occasion:'daily',boldness:'same'});
 const whys=r.picks.map(p=>p.why);
 assert.equal(new Set(whys).size,whys.length,'distinct matched reasons: '+JSON.stringify(whys));
});

test('only a consult-built result on the analysed photo attaches to the save and the poll',()=>{
 // The marker is set by «روی عکسم بساز»…
 assert.match(customerHTML,/state\.fromConsult=photo/);
 // …and cleared by any other pick and by a new photo (pickLook, handleFile, changePhoto).
 assert.ok((customerHTML.match(/fromConsult=null/g)||[]).length>=3,'pickLook/handleFile/changePhoto clear the marker');
 // Both attach paths require marker plus the analysed photo.
 assert.match(customerHTML,/if\(res&&L\.fromConsult===consult\.photo\)body\.result_id=res/);
 assert.match(customerHTML,/lineRef\(line\)\.fromConsult===consult\.photo/);
});

test('«روی عکسم بساز» lands on the catalog card and flashes it',()=>{
 assert.match(customerHTML,/state\.tab='catalog';state\.filter='همه';state\.q='';\s*pickLook\(/);
 assert.match(customerHTML,/flashPickedCard\(\)/);
 assert.match(customerHTML,/classList\.add\('is-flash'\)/);
 assert.match(customerHTML,/\.style-card\.is-flash\{/);
});

test('the docs describe the consultant honestly — mocked, never claimed live',()=>{
 const readme=readFileSync(new URL('../README.md',import.meta.url),'utf8');
 const agents=readFileSync(new URL('../AGENTS.md',import.meta.url),'utf8');
 assert.match(readme,/## Beauty consultant/);
 assert.match(readme,/mocked vision endpoint/);
 assert.match(readme,/live KIE vision for this feature has not been exercised/);
 assert.match(agents,/worker\/consult\.js/);
 assert.match(agents,/do not claim live KIE vision/);
});

test('suggestions are open to guests; saving a consultation needs a verified mobile',async()=>{
 const e=fixture(),s=await salon(e),g=await guest(e,s);
 const sugg=await call(e,'/api/s/salon-a/consult/suggest',{line:'hair',analysis:{fields:{face_shape:'round',hair_length:'long'}},answers:{care:'low',occasion:'wedding'}},g);
 assert.equal(sugg.status,200,JSON.stringify(sugg));
 assert.ok(sugg.data.picks.length>=3&&sugg.data.picks.length<=6);
 const bad=await call(e,'/api/s/salon-a/consult/suggest',{line:'nope',analysis:{},answers:{}},g);
 assert.equal(bad.status,400,JSON.stringify(bad));
 // Guest save: refused, and nothing is stored.
 const photo=await upload(e,s,g);
 const save=await call(e,'/api/s/salon-a/consult',{line:'hair',photo_id:photo,analysis:{source:'self',fields:{face_shape:'round'}},answers:{}},g);
 assert.equal(save.status,401,JSON.stringify(save));
 assert.equal(e.DB.sql.prepare('SELECT count(*) n FROM consultations').get().n,0);
 assert.equal((await call(e,'/api/s/salon-a/consults',undefined,g)).status,401,'the list needs a signed-in customer');
});

test('a signed-in customer stores, lists and reopens her consultation; others see nothing',async()=>{
 const e=fixture(),s=await salon(e),g=await verified(e,s);
 const photo=await upload(e,s,g);
 const body={line:'hair',photo_id:photo,analysis:{source:'self',fields:{face_shape:'round',hair_length:'long',hair_color:'black',not_a_field:'x'},confidence:{}},answers:{care:'low',occasion:'wedding',bogus:'zz'}};
 const save=await call(e,'/api/s/salon-a/consult',body,g);
 assert.equal(save.status,200,JSON.stringify(save));
 assert.ok(save.data.id&&save.data.picks.length>=3&&save.data.picks.length<=6);
 const row=e.DB.sql.prepare('SELECT * FROM consultations WHERE id=?').get(save.data.id);
 assert.equal(row.owner,'+989121234567');
 const stored=JSON.parse(row.analysis_json);
 assert.ok(!('not_a_field' in stored.fields),'unknown fields are dropped server-side too');
 const storedAnswers=JSON.parse(row.answers_json);
 assert.ok(!('bogus' in storedAnswers),'unknown answers are dropped too');
 assert.equal(storedAnswers.occasion,'wedding');
 assert.equal(JSON.parse(row.picks_json).length,save.data.picks.length,'picks are recomputed and stored server-side');
 const list=await call(e,'/api/s/salon-a/consults',undefined,g);
 assert.equal(list.status,200,JSON.stringify(list));
 assert.equal(list.data.consultations.length,1);
 assert.equal(list.data.consultations[0].top,save.data.picks[0].name);
 const detail=await call(e,'/api/s/salon-a/consults/'+save.data.id,undefined,g);
 assert.equal(detail.status,200,JSON.stringify(detail));
 assert.equal(detail.data.line,'hair');
 assert.equal(detail.data.analysis.fields.face_shape,'round');
 assert.equal(detail.data.answers.care,'low');
 // Another customer cannot read it — an unverified session is refused outright…
 const other=await guest(e,s);
 assert.equal((await call(e,'/api/s/salon-a/consults/'+save.data.id,undefined,other)).status,401);
 assert.equal((await call(e,'/api/s/salon-a/consults',undefined,other)).status,401);
 // …and a different signed-in mobile gets a plain 404, never her data.
 const other2=await verified(e,s,'۰۹۳۵۱۱۱۲۲۳۳');
 assert.equal((await call(e,'/api/s/salon-a/consults/'+save.data.id,undefined,other2)).status,404);
 const otherList=await call(e,'/api/s/salon-a/consults',undefined,other2);
 assert.equal(otherList.status,200,JSON.stringify(otherList));
 assert.equal(otherList.data.consultations.length,0,'her list is empty, not the first customer’s');
 // Method gate: GET on the save route, POST on the list route.
 assert.equal((await call(e,'/api/s/salon-a/consult',undefined,g)).status,405);
 assert.equal((await call(e,'/api/s/salon-a/consults',{},g)).status,405);
});

test('the one-time share link shows the stylist everything and dies after its window',async()=>{
 const e=fixture(),s=await salon(e),g=await verified(e,s);
 const photo=await upload(e,s,g);
 const save=await call(e,'/api/s/salon-a/consult',{line:'color',photo_id:photo,analysis:{source:'vision',fields:{skin_undertone:'warm',hair_color:'brown'},confidence:{skin_undertone:0.9,hair_color:0.8},low:[]},answers:{boldness:'big',occasion:'party'}},g);
 assert.equal(save.status,200,JSON.stringify(save));
 const id=save.data.id;
 const share=await call(e,'/api/s/salon-a/consults/'+id+'/share',{},g);
 assert.equal(share.status,200,JSON.stringify(share));
 assert.match(share.data.path,/^\/share\/[a-f0-9]{64}$/,'a 64-hex one-time token');
 const token=share.data.path.split('/')[2];
 // GET is only a landing: previews and refreshes see no content and never burn the link.
 const land=await app.fetch(new Request(origin+'/share/'+token),e);
 assert.equal(land.status,200);
 assert.equal(land.headers.get('Cache-Control'),'no-store');
 assert.equal(land.headers.get('X-Robots-Tag'),'noindex');
 const landHtml=await land.text();
 assert.match(landHtml,/باز کردن برگه/);
 assert.ok(!landHtml.includes(save.data.picks[0].name),'a crawler sees no content');
 assert.equal(e.DB.sql.prepare('SELECT share_used_at FROM consultations WHERE id=?').get(id).share_used_at,null,'GET does not consume');
 // The POST behind the button consumes and shows everything.
 const opened=await app.fetch(new Request(origin+'/share/'+token,{method:'POST'}),e);
 assert.equal(opened.status,200);
 const html=await opened.text();
 assert.ok(html.includes(save.data.picks[0].name),'the picks are on the page');
 assert.match(html,/ته‌رنگ پوست/);assert.match(html,/تحلیل/);
 assert.ok(!html.includes('+989121234567')&&!html.includes('09121234567'),'never the customer’s mobile');
 assert.ok(!html.includes('salon-a'),'not internal ids');
 assert.ok(e.DB.sql.prepare('SELECT share_used_at FROM consultations WHERE id=?').get(id).share_used_at,'POST consumes the link');
 // robots.txt keeps share pages out of crawls.
 const robots=await (await app.fetch(new Request(origin+'/robots.txt'),e)).text();
 assert.match(robots,/Disallow: \/share\//);
 // Wrong token: 404, not a hint that it ever existed.
 const wrong=await app.fetch(new Request(origin+'/share/'+'f'.repeat(64)),e);
 assert.equal(wrong.status,404);
 // Inside the grace window the page (and its image) still load; after it, the link is dead.
 const used=await app.fetch(new Request(origin+'/share/'+token),e);
 assert.equal(used.status,200,'a refresh inside the grace window works');
 e.DB.prepare('UPDATE consultations SET share_used_at=? WHERE id=?').bind(Date.now()-16*60000,id).run();
 const dead=await app.fetch(new Request(origin+'/share/'+token),e);
 assert.equal(dead.status,410);
 assert.match(await dead.text(),/یک‌بار مصرف/);
 // Re-sharing hands out a fresh token, resets the window, and the old token says 410 — never 404.
 const again=await call(e,'/api/s/salon-a/consults/'+id+'/share',{},g);
 assert.equal(again.status,200,JSON.stringify(again));
 assert.notEqual(again.data.path.split('/')[2],token);
 const superseded=await app.fetch(new Request(origin+'/share/'+token),e);
 assert.equal(superseded.status,410,'the replaced token is gone, not silently missing');
 assert.match(await superseded.text(),/لینک تازه‌تری/);
 const fresh=await app.fetch(new Request(origin+again.data.path),e);
 assert.equal(fresh.status,200);
 assert.match(await fresh.text(),/باز کردن برگه/);
 // An expired link says so, a fresh one works.
 e.DB.prepare('UPDATE consultations SET share_expires=? WHERE id=?').bind(Date.now()-1,id).run();
 assert.equal((await app.fetch(new Request(origin+again.data.path),e)).status,410);
 const third=await call(e,'/api/s/salon-a/consults/'+id+'/share',{},g);
 const thirdPage=await app.fetch(new Request(origin+third.data.path,{method:'POST'}),e);
 assert.equal(thirdPage.status,200);
 // Other customers cannot mint a link for someone else's consultation.
 const other=await guest(e,s);
 assert.equal((await call(e,'/api/s/salon-a/consults/'+id+'/share',{},other)).status,404);
});

test('her own answers are labelled hers — never a photo analysis — on the share page',async()=>{
 const e=fixture(),s=await salon(e),g=await verified(e,s);
 const photo=await upload(e,s,g);
 // All fields self → one block titled «مشخصات (پاسخ مشتری)», no «تحلیل عکس» anywhere.
 const self=await call(e,'/api/s/salon-a/consult',{line:'hair',photo_id:photo,analysis:{source:'self',fields:{face_shape:'round',hair_length:'long'},confidence:{}},answers:{}},g);
 assert.equal(self.status,200,JSON.stringify(self));
 const sh1=await call(e,'/api/s/salon-a/consults/'+self.data.id+'/share',{},g);
 const html1=await (await app.fetch(new Request(origin+sh1.data.path,{method:'POST'}),e)).text();
 assert.match(html1,/مشخصات \(پاسخ مشتری\)/);
 assert.ok(!html1.includes('<h2>تحلیل عکس</h2>'),'an all-self consultation never claims photo analysis');
 // Vision with one overridden field → two blocks, each field under its true source.
 const mixed=await call(e,'/api/s/salon-a/consult',{line:'hair',photo_id:photo,analysis:{source:'vision',fields:{face_shape:'oval',hair_length:'short'},confidence:{face_shape:0.9,hair_length:0.8},low:[],self_keys:['hair_length']},answers:{}},g);
 assert.equal(mixed.status,200,JSON.stringify(mixed));
 const stored=JSON.parse(e.DB.sql.prepare('SELECT analysis_json FROM consultations WHERE id=?').get(mixed.data.id).analysis_json);
 assert.deepEqual(stored.self_keys,['hair_length']);
 const sh2=await call(e,'/api/s/salon-a/consults/'+mixed.data.id+'/share',{},g);
 const html2=await (await app.fetch(new Request(origin+sh2.data.path,{method:'POST'}),e)).text();
 assert.match(html2,/<h2>تحلیل عکس<\/h2>/);
 assert.match(html2,/<h2>پاسخ مشتری<\/h2>/);
 const vis=html2.split('<h2>تحلیل عکس</h2>')[1].split('</section>')[0];
 assert.ok(vis.includes('فرم صورت')&&!vis.includes('طول مو'),'the overridden field is not under the analysis');
 const cus=html2.split('<h2>پاسخ مشتری</h2>')[1].split('</section>')[0];
 assert.ok(cus.includes('طول مو'),'her override sits under her answer');
 // The profile detail (client) reads the same self_keys marker.
 assert.match(customerHTML,/مشخصات \(پاسخ مشتری\)/);
 assert.match(customerHTML,/self_keys/);
});

test('the fallback form lets her skip any field and «بعدی» is never blocked',()=>{
 // A «نمی‌دونم» chip per field…
 assert.match(customerHTML,/نمی‌دونم/);
 // …and Next carries no missing-field disable (only the busy guard).
 assert.match(customerHTML,/text:'بعدی: پرسش‌نامه',disabled:!!consult\.busy/);
 assert.doesNotMatch(customerHTML,/بعدی: پرسش‌نامه',disabled:!!miss/);
});

test('the built result attaches to the consultation and travels through the share image',async()=>{
 const e=fixture(),s=await salon(e),g=await verified(e,s);
 const photo=await upload(e,s,g);
 const save=await call(e,'/api/s/salon-a/consult',{line:'hair',photo_id:photo,analysis:{source:'self',fields:{face_shape:'oval'}},answers:{}},g);
 assert.equal(save.status,200,JSON.stringify(save));
 const id=save.data.id;
 // A simulation result of her own session (as the generate route would store).
 const simId=crypto.randomUUID(),key='sim/'+simId+'.png';
 const simBytes=png();
 e.BUCKET.put(key,simBytes);
 const sid=e.DB.sql.prepare('SELECT id FROM sessions WHERE verified_phone IS NOT NULL').get().id;
 e.DB.prepare('INSERT INTO media(id,salon_id,session_id,kind,object_key,mime,created_at) VALUES(?,?,?,?,?,?,?)').bind(simId,s.id,sid,'simulation',key,'image/png',Date.now()).run();
 // A foreign simulation is refused.
 const other=await guest(e,s);
 const otherSid=e.DB.sql.prepare('SELECT id FROM sessions WHERE verified_phone IS NULL ORDER BY created_at DESC').get().id;
 const foreignSim=crypto.randomUUID();
 e.DB.prepare('INSERT INTO media(id,salon_id,session_id,kind,object_key,mime,created_at) VALUES(?,?,?,?,?,?,?)').bind(foreignSim,s.id,otherSid,'simulation','sim/'+foreignSim+'.png','image/png',Date.now()).run();
 assert.equal((await call(e,'/api/s/salon-a/consults/'+id+'/result',{result_id:foreignSim},g)).status,403);
 assert.equal((await call(e,'/api/s/salon-a/consults/'+id+'/result',{result_id:simId},other)).status,404,'not her consultation');
 const attach=await call(e,'/api/s/salon-a/consults/'+id+'/result',{result_id:simId},g);
 assert.equal(attach.status,200,JSON.stringify(attach));
 assert.equal(e.DB.sql.prepare('SELECT result_id FROM consultations WHERE id=?').get(id).result_id,simId);
 const detail=await call(e,'/api/s/salon-a/consults/'+id,undefined,g);
 assert.equal(detail.data.result_id,simId,'the detail shows the built image');
 // Before the share exists there is no image route; after it, the image is private and no-store.
 const share=await call(e,'/api/s/salon-a/consults/'+id+'/share',{},g);
 const token=share.data.path.split('/')[2];
 const img=await app.fetch(new Request(origin+'/share/'+token+'/img'),e);
 assert.equal(img.status,200);
 assert.equal(img.headers.get('Content-Type'),'image/png');
 assert.match(img.headers.get('Cache-Control'),/no-store/);
 assert.deepEqual(new Uint8Array(await img.arrayBuffer()),simBytes,'the actual bytes come from the bucket');
 assert.equal((await app.fetch(new Request(origin+'/share/'+'a'.repeat(64)+'/img'),e)).status,410);
});

test('consult events are tracked without any personal data',async()=>{
 const e=fixture(),s=await salon(e),g=await guest(e,s);
 for(const kind of ['consult','consult_save']){
  const r=await call(e,'/api/s/salon-a/track',{kind,v:'visitor1234567890',meta:'hair'},g);
  assert.equal(r.status,200,JSON.stringify(r));
 }
 assert.equal((await call(e,'/api/s/salon-a/track',{kind:'consult_x',v:'v',meta:''},g)).status,400);
 const rows=e.DB.sql.prepare("SELECT kind,meta FROM events_log WHERE kind LIKE 'consult%'").all();
 assert.equal(rows.length,2);
 for(const r of rows)assert.ok(!/\d{9,}/.test(r.meta)&&!r.meta.includes('+'),'no phone or ids in event meta');
});

test('cleanup purges stale analysis cache but keeps recent entries',async()=>{
 const {tick}=await import('../worker/server.js');
 const e=fixture(),s=await salon(e);
 e.DB.prepare('INSERT INTO ai_cache(key,value,created_at) VALUES(?,?,?)').bind('old','{}',Date.now()-31*86400000).run();
 e.DB.prepare('INSERT INTO ai_cache(key,value,created_at) VALUES(?,?,?)').bind('fresh','{}',Date.now()-86400000).run();
 await tick(e,origin);
 const keys=e.DB.sql.prepare('SELECT key FROM ai_cache').all().map(r=>r.key);
 assert.deepEqual(keys,['fresh'],'a month-old analysis is dropped, a recent one stays');
});
