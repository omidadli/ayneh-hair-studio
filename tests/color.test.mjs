// Phase 2 — pro hair colour: the manager console's formula cards and correction planner,
// the customer's condition assessment, and every cap/edge on the way. The console calls
// the salon-scoped URLs exactly as worker/ui.js builds them (/api/s/<slug>/color/...), so
// these tests hit those exact paths — a top-level /api/color/* path must never be routed.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';
import {database,memoryBucket} from '../scripts/local-adapter.mjs';import app from '../worker/index.js';
import {cleanCondition,porosityFrom,correctionPlan,ruleDraftFormula,CONDITION_QUESTIONS,CONDITION_PROBLEMS,validateFormulaInput} from '../worker/color.js';
import {isDirect} from '../worker/customers.js';

const origin='https://test.example';
const migrations=readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort();
function fixture(){const DB=database();for(const f of migrations)DB.sql.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));return {DB,BUCKET:memoryBucket(),OWNER_EMAIL:'owner@test',JOB_TOKEN:'job-test',TRUST_PLATFORM_IDENTITY:'true'};}
const OWNER={user:'owner-a',email:'owner@test'};
async function call(env,path,body,{cookie='',user='',email='',headers:extra={}}={}){const headers={origin,'oai-authenticated-user-id':user,'oai-authenticated-user-email':email,cookie,...extra};let payload;if(body!==undefined){if(body instanceof Uint8Array){payload=body}else{headers['content-type']='application/json';payload=JSON.stringify(body)}}const res=await app.fetch(new Request(origin+path,{method:body===undefined?'GET':'POST',headers,body:payload}),env);let d;try{d=await res.json()}catch{d=null}return {status:res.status,data:d,cookie:res.headers.get('set-cookie')?.split(';')[0]};}
// The console's salon page is the direct studio salon (the formula cards only exist there),
// so the fixture flips the row it just created — every /api/s/<slug>/color/... path keeps working.
async function salon(env,slug='salon-a'){const r=await call(env,'/api/salons',{slug,name:'سالن '+slug},OWNER);assert.equal(r.status,200,JSON.stringify(r));
 const u=await env.DB.prepare('UPDATE salons SET id=?,owner_id=? WHERE id=?').bind('ayneh-direct','direct',r.data.id).run();
 assert.equal(u.meta.changes,1,'the salon becomes the direct studio salon');return {id:'ayneh-direct',slug};}
async function guest(env,s){const r=await call(env,'/api/s/'+s.slug+'/session',{});assert.equal(r.status,200);return {cookie:r.cookie};}
const png=()=>{const b=new Uint8Array(150);b.set([137,80,78,71,13,10,26,10]);crypto.getRandomValues(b.subarray(8));return b};
async function upload(env,s,g,kind='original'){const r=await call(env,'/api/s/'+s.slug+'/upload?kind='+kind,png(),g);assert.equal(r.status,200,JSON.stringify(r));return r.data.id;}
// A stand-in for the KIE vision endpoint: records each body, answers with the given content.
function mockVision(content){const calls=[];const previous=globalThis.fetch;globalThis.fetch=async(url,init)=>{const u=String(url);if(u.includes('api.kie.ai')&&u.includes('/v1/chat/completions')){calls.push(JSON.parse(init.body));return Response.json({choices:[{message:{content}}]})}return previous(url,init)};return {calls,restore(){globalThis.fetch=previous}};}

test('the console calls the salon-scoped colour URLs; no top-level /api/color route exists',()=>{
 // The console's api() helper builds /api/s/<slug>/color/... — the exact paths these tests hit.
 const src=readFileSync(new URL('../worker/ui.js',import.meta.url),'utf8');
 const client=src.slice(src.indexOf('const clientJS=String.raw`')+21,src.indexOf('`;',src.indexOf('const clientJS=String.raw`')));
 assert.match(client,/api\('\/api\/s\/'\+slug\+'\/color\/formulas'/);
 assert.match(client,/api\('\/api\/s\/'\+slug\+'\/color\/formula-suggest'/);
 assert.match(client,/api\('\/api\/s\/'\+slug\+'\/color\/correct'/);
 assert.doesNotMatch(client,/api\('\/api\/color\//,'the console never calls a bare /api/color path');
 assert.doesNotMatch(src,/['"`]\/api\/color\//,'no top-level /api/color route is defined anywhere');
});

test('the console colour tools are owner-gated: a customer session gets 403 on all three',async()=>{const e=fixture();const s=await salon(e);const g=await guest(e,s);
 // The console's stylist tools must never run on a customer session — owner only.
 for(const path of ['/api/s/'+s.slug+'/color/formulas','/api/s/'+s.slug+'/color/formula-suggest','/api/s/'+s.slug+'/color/correct']){
  const r=await call(e,path,{target_color:'تیره'},g);
  assert.ok([401,403].includes(r.status),path+' must refuse a customer session: '+JSON.stringify(r));
 }
 // And without any identity at all they are refused too.
 for(const path of ['/api/s/'+s.slug+'/color/formulas','/api/s/'+s.slug+'/color/formula-suggest','/api/s/'+s.slug+'/color/correct']){
  const r=await call(e,path,{target_color:'تیره'});
  assert.equal(r.status,401,path+' must refuse an anonymous caller: '+JSON.stringify(r));
 }
});

test('formula cards: the console lists, saves, updates and deletes through the exact salon URLs',async()=>{const e=fixture();const s=await salon(e);
 // GET — the console's load(): owner-gated, salon-scoped, empty at first.
 const list=await call(e,'/api/s/'+s.slug+'/color/formulas',undefined,OWNER);
 assert.equal(list.status,200,JSON.stringify(list));assert.deepEqual(list.data.formulas,[]);
 // A stranger cannot read the cards.
 assert.equal((await call(e,'/api/s/'+s.slug+'/color/formulas',undefined,{user:'stranger',email:'x@y'})).status,403);
 // Save — the console's «ذخیره فرمول»: one card per customer phone, keyed on salon + phone.
 const save=await call(e,'/api/s/'+s.slug+'/color/formulas',{customer_phone:'09121234567',target_color:'روشن و بلوند',current_color:'قهوه‌ای',brand:'کیکول',code:'771',amounts:[{name:'بلوند',amount:'60'},{name:'روشن‌کننده',amount:'30'}],oxidant_percent:'6',oxidant_ratio:'1:1',pause_root:20,pause_shaft:30,pause_top:15,note:'تست',source:'manual'},OWNER);
 assert.equal(save.status,200,JSON.stringify(save));assert.equal(save.data.ok,true);
 const after=await call(e,'/api/s/'+s.slug+'/color/formulas',undefined,OWNER);
 assert.equal(after.data.formulas.length,1);
 const f=after.data.formulas[0];assert.equal(f.customer_phone,'+989121234567');assert.equal(f.target_color,'روشن و بلوند');assert.equal(f.oxidant_percent,'6');assert.equal(f.oxidant_ratio,'1:1');
 assert.deepEqual(f.amounts,[{name:'بلوند',amount:'60'},{name:'روشن‌کننده',amount:'30'}]);assert.equal(f.source,'manual');
 // Updating the same phone replaces the row (one card per customer).
 const upd=await call(e,'/api/s/'+s.slug+'/color/formulas',{customer_phone:'۰۹۱۲۱۲۳۴۵۶۷',target_color:'تیره',brand:'کیکول',code:'771',amounts:[{name:'قهوه‌ای',amount:'۸۰'}],oxidant_percent:'9',oxidant_ratio:'1:2',pause_root:30,pause_shaft:40,pause_top:20,source:'manual'},OWNER);
 assert.equal(upd.status,200,JSON.stringify(upd));assert.equal(upd.data.formula.id,f.id,'the same card is updated, not duplicated');
 const after2=await call(e,'/api/s/'+s.slug+'/color/formulas',undefined,OWNER);
 assert.equal(after2.data.formulas.length,1);assert.equal(after2.data.formulas[0].target_color,'تیره');assert.equal(after2.data.formulas[0].oxidant_percent,'9');
 // Delete — the console's «حذف».
 const del=await call(e,'/api/s/'+s.slug+'/color/formulas',{delete:true,id:f.id},OWNER);
 assert.equal(del.status,200,JSON.stringify(del));assert.equal(del.data.ok,true);
 const after3=await call(e,'/api/s/'+s.slug+'/color/formulas',undefined,OWNER);
 assert.deepEqual(after3.data.formulas,[]);
 // Deleting a missing card 404s; a malformed id 400s.
 assert.equal((await call(e,'/api/s/'+s.slug+'/color/formulas',{delete:true,id:f.id},OWNER)).status,404);
 assert.equal((await call(e,'/api/s/'+s.slug+'/color/formulas',{delete:true,id:'nope'},OWNER)).status,400);
});

test('formula input validation: phone, oxidant, ratio, amounts and target colour',()=>{
 const ok=validateFormulaInput({customer_phone:'۰۹۱۲۱۲۳۴۵۶۷',target_color:'روشن و بلوند',oxidant_percent:'6',oxidant_ratio:'1:1',amounts:[{name:'بلوند',amount:'60'}]});
 assert.equal(ok.customer_phone,'+989121234567');assert.equal(ok.source,'suggestion');
 assert.throws(()=>validateFormulaInput({customer_phone:'123',target_color:'روشن و بلوند',oxidant_percent:'6',oxidant_ratio:'1:1'}),/معتبر نیست/);
 assert.throws(()=>validateFormulaInput({customer_phone:'۰۹۱۲۱۲۳۴۵۶۷',target_color:'x',oxidant_percent:'6',oxidant_ratio:'1:1'}),/رنگ هدف/);
 assert.throws(()=>validateFormulaInput({customer_phone:'۰۹۱۲۱۲۳۴۵۶۷',target_color:'روشن و بلوند',oxidant_percent:'5',oxidant_ratio:'1:1'}),/اکسیدان/);
 assert.throws(()=>validateFormulaInput({customer_phone:'۰۹۱۲۱۲۳۴۵۶۷',target_color:'روشن و بلوند',oxidant_percent:'6',oxidant_ratio:'2:1'}),/نسبت/);
 // Pause minutes are clamped, not rejected.
 assert.equal(validateFormulaInput({customer_phone:'۰۹۱۲۱۲۳۴۵۶۷',target_color:'تیره',oxidant_percent:'6',oxidant_ratio:'1:1',pause_root:999}).pause_root,120);
});

test('formula-suggest: the console gets a rule draft, always labelled a draft',async()=>{const e=fixture();const s=await salon(e);
 // Without a KIE key the rule draft stands on its own — never an invented result.
 const r=await call(e,'/api/s/'+s.slug+'/color/formula-suggest',{base_level:7,target_color:'روشن و بلوند',current_color:'قهوه‌ای'},OWNER);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.data.draft,true);assert.equal(r.data.source,'rules');
 assert.equal(r.data.formula.target_color,'روشن و بلوند');
 assert.equal(r.data.formula.oxidant_percent,'9','base level 7 needs 9% oxidant');
 // base_level is clamped into 1–10; a missing target colour is rejected.
 const clamp=await call(e,'/api/s/'+s.slug+'/color/formula-suggest',{base_level:42,target_color:'تیره'},OWNER);
 assert.equal(clamp.data.formula.oxidant_percent,'12','a clamped base level of 10 needs 12% oxidant');
 assert.equal((await call(e,'/api/s/'+s.slug+'/color/formula-suggest',{base_level:5,target_color:'x'},OWNER)).status,400);
 // With a key, the model completes the draft and the source is reported.
 const mv=mockVision(JSON.stringify({brand:'کیکول',code:'771',oxidant_percent:'6',oxidant_ratio:'1:1.5',pause_root:20,note:'مدل'}));
 try{e.KIE_API_KEY='kie-test';
  const model=await call(e,'/api/s/'+s.slug+'/color/formula-suggest',{base_level:5,target_color:'دودی'},OWNER);
  assert.equal(model.status,200,JSON.stringify(model));assert.equal(model.data.draft,true);
  assert.equal(model.data.source,'model');assert.equal(model.data.formula.brand,'کیکول');assert.equal(model.data.formula.code,'771');
  assert.equal(model.data.formula.pause_root,20);
  // The same inputs hit the cache: free, same value, source 'cache'.
  const cached=await call(e,'/api/s/'+s.slug+'/color/formula-suggest',{base_level:5,target_color:'دودی'},OWNER);
  assert.equal(cached.data.source,'cache');assert.equal(cached.data.formula.brand,'کیکول');
  assert.equal(mv.calls.length,1,'the second call is served from the cache');
 }finally{mv.restore()}
});

test('correction planner: the console gets a rule-based plan, always a draft',async()=>{const e=fixture();const s=await salon(e);
 const r=await call(e,'/api/s/'+s.slug+'/color/correct',{current:'قهوه‌ای تیره',problem:'streak',goal:'روشن و بلوند'},OWNER);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.data.draft,true);assert.ok(r.data.warning);
 assert.equal(r.data.current,'قهوه‌ای تیره');assert.equal(r.data.problem,'streak');
 assert.ok(Array.isArray(r.data.steps)&&r.data.steps.length>0);
 for(const st of r.data.steps)assert.ok(st.title&&st.text);
 // Every known problem key produces a plan; an empty request still answers honestly.
 for(const [key] of CONDITION_PROBLEMS){const p=await call(e,'/api/s/'+s.slug+'/color/correct',{current:'رنگ',problem:key,goal:'تیره'},OWNER);assert.equal(p.status,200);assert.equal(p.data.draft,true)}
 const bare=await call(e,'/api/s/'+s.slug+'/color/correct',{},OWNER);
 assert.equal(bare.status,200);assert.equal(bare.data.draft,true);assert.ok(Array.isArray(bare.data.steps));
});

test('condition assessment: direct studio only, guest caps, cached, always an estimate',async()=>{
 // A salon that is not the direct studio gets 404 — the paid analysis lives only there.
 const e0=fixture();const plain=await call(e0,'/api/salons',{slug:'plain-a',name:'سالن عادی'},OWNER);assert.equal(plain.status,200);
 const pg=await guest(e0,{slug:'plain-a'});
 const notDirect=await call(e0,'/api/s/plain-a/color/analyze',{line:'color',photo_id:'x'},pg);
 assert.equal(notDirect.status,404);assert.match(notDirect.data.error,/استودیوی آینه/);
 // On the direct studio, without a key the customer gets the questionnaire fallback, never a fake analysis.
 const e=fixture();const s=await salon(e,'salon-a');const g=await guest(e,s);const photo=await upload(e,s,g);
 const noKey=await call(e,'/api/s/'+s.slug+'/color/analyze',{line:'color',photo_id:photo},g);
 assert.equal(noKey.status,200,JSON.stringify(noKey));
 assert.equal(noKey.data.ok,false);assert.equal(noKey.data.fallback,'questionnaire');assert.equal(noKey.data.reason,'no-key');
 assert.equal(noKey.data.porosity,null,'no answers → no porosity estimate');
 // A non-colour line falls back without touching the photo.
 const wrongLine=await call(e,'/api/s/'+s.slug+'/color/analyze',{line:'hair',photo_id:photo},g);
 assert.equal(wrongLine.data.ok,false);assert.equal(wrongLine.data.fallback,'questionnaire');assert.equal(wrongLine.data.reason,'line');
 // With a key: a successful analysis is an estimate, cached, and the answers feed the porosity.
 const mv=mockVision(JSON.stringify({base_level:6,gray_percent:20,porosity:'medium',confidence:{base_level:0.9,gray_percent:0.8,porosity:0.7}}));
 try{e.KIE_API_KEY='kie-test';
  const ok=await call(e,'/api/s/'+s.slug+'/color/analyze',{line:'color',photo_id:photo,answers:{coloured:'often',wash:'fade'}},g);
  assert.equal(ok.status,200,JSON.stringify(ok));
  assert.equal(ok.data.ok,true);assert.equal(ok.data.estimate,true);assert.equal(ok.data.base_level,6);assert.equal(ok.data.gray_percent,20);
  assert.equal(ok.data.porosity,porosityFrom('medium',{coloured:'often',wash:'fade'}));
  assert.deepEqual(ok.data.low,[]);
  // The same photo is served from the cache: free, same values, no second provider call.
  const cached=await call(e,'/api/s/'+s.slug+'/color/analyze',{line:'color',photo_id:photo},g);
  assert.equal(cached.data.ok,true);assert.equal(cached.data.cached,true);assert.equal(cached.data.base_level,6);
  assert.equal(mv.calls.length,1,'the second analysis is served from the cache');
  // The guest success cap is one a day: the next different photo is refused outright (429).
  const photo2=await upload(e,s,g);
  const capped=await call(e,'/api/s/'+s.slug+'/color/analyze',{line:'color',photo_id:photo2},g);
  assert.equal(capped.status,429,JSON.stringify(capped));
 }finally{mv.restore()}
 // A photo that is not the customer's own is refused.
 const g2=await guest(e,s);const other=await upload(e,s,g2);
 const notOwn=await call(e,'/api/s/'+s.slug+'/color/analyze',{line:'color',photo_id:other},g);
 assert.equal(notOwn.status,403);assert.match(notOwn.data.error,/تعلق/);
});

test('condition cleaning and porosity rules are pure and clamped',()=>{
 const c=cleanCondition({base_level:42,gray_percent:-5,porosity:'HIGH',confidence:{base_level:0.9,gray_percent:0.1,porosity:0.2}});
 assert.equal(c.base_level,10);assert.equal(c.gray_percent,0);assert.equal(c.porosity,'high');
 assert.deepEqual(c.low.sort(),['gray_percent','porosity']);
 assert.equal(porosityFrom('low',{}),'low');
 assert.equal(porosityFrom(null,{coloured:'often',wash:'fade'}),'high');
 assert.equal(porosityFrom(null,{}),'medium','no photo and no answers → the neutral default');
 assert.equal(correctionPlan('قهوه‌ای','root','تیره').draft,true);
 assert.equal(ruleDraftFormula(5,'تیره').oxidant_percent,'9','base level 5 → 9% oxidant');
});
