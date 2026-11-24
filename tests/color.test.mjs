// Phase 2 — pro hair colour: the manager console's formula cards and correction planner,
// the customer's condition assessment, and every cap/edge on the way. The console calls
// the salon-scoped URLs exactly as worker/ui.js builds them (/api/s/<slug>/color/...), so
// these tests hit those exact paths — a top-level /api/color/* path must never be routed.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';
import {database,memoryBucket} from '../scripts/local-adapter.mjs';import app from '../worker/index.js';
import {cleanCondition,porosityFrom,correctionPlan,ruleDraftFormula,CONDITION_QUESTIONS,CONDITION_PROBLEMS,validateFormulaInput} from '../worker/color.js';
import {isDirect} from '../worker/customers.js';
import {linePrompt,PLACEMENT_KEYS} from '../worker/lines.js';
import {chatJSON} from '../worker/ai.js';
import {hash} from '../worker/domain.js';

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

test('the colour placement reaches the image prompt',()=>{
 // The placement the customer picks on the colour line is validated against the pattern list
 // and passed into the prompt builder; the prompt names the placement in English for the model.
 assert.ok(PLACEMENT_KEYS.length>=6,'there are placement patterns to pick');
 for(const key of PLACEMENT_KEYS){
  const p=linePrompt('color','catalog','بلوند',{},'بلوند',key);
  assert.ok(p.includes('COLOUR PLACEMENT'),'the prompt carries a COLOUR PLACEMENT line for '+key);
 }
 // A placement that is not in the list is ignored: the prompt has no placement line.
 assert.ok(!linePrompt('color','catalog','بلوند',{},'بلوند',null).includes('COLOUR PLACEMENT'));
});

test('brand shades: owner lists and saves, and javascript: links are rejected',async()=>{
 const e=fixture();const s=await salon(e);
 // An empty list to start.
 const empty=await call(e,'/api/owner/shades',undefined,OWNER);
 assert.equal(empty.status,200,JSON.stringify(empty));assert.deepEqual(empty.data.shades,[]);
 assert.ok(Array.isArray(empty.data.colors)&&empty.data.colors.length>0,'the catalog colours are offered');
 // Save a shade with a shop link.
 const saved=await call(e,'/api/owner/shades',{color:'بلوند شامپاینی',brand:'کیکول',code:'771',note:'روشن',link:'https://example.com/buy'},OWNER);
 assert.equal(saved.status,200,JSON.stringify(saved));
 assert.equal(saved.data.shades.length,1);assert.equal(saved.data.shades[0].brand,'کیکول');
 assert.equal(saved.data.shades[0].link,'https://example.com/buy');
 // Re-saving the same colour replaces it (one row per colour).
 const again=await call(e,'/api/owner/shades',{color:'بلوند شامپاینی',brand:'کیکول',code:'882',link:'https://example.com/other'},OWNER);
 assert.equal(again.data.shades.length,1,'re-saving the same colour keeps one row');
 assert.equal(again.data.shades[0].code,'882');
 // A colour outside the catalog is refused.
 const bad=await call(e,'/api/owner/shades',{color:'رنگ ناشناس',brand:'کیکول',code:'1'},OWNER);
 assert.equal(bad.status,400);
 // javascript: (and any non-http) shop links are rejected, never stored.
 for(const link of ['javascript:alert(1)','data:text/html,<x>','ftp://example.com/x']){
  const r=await call(e,'/api/owner/shades',{color:'قهوه‌ای اسپرسو',brand:'کیکول',code:'1',link},OWNER);
  assert.equal(r.status,400,'rejected '+link);
 }
 const after=await call(e,'/api/owner/shades',undefined,OWNER);
 assert.ok(after.data.shades.every(sh=>!sh.link||/^https?:/.test(sh.link)),'no non-http link was stored');
 // A customer session cannot touch the owner shades.
 const g=await guest(e,s);
 const denied=await call(e,'/api/owner/shades',undefined,g);
 assert.ok(denied.status===401||denied.status===403,'a customer session is refused');
});

test('chatJSON refunds the success slot when the provider call fails',async()=>{
 const e=fixture();
 const okKey='test-ok',tryKey='test-try';
 const okLimit={key:okKey,max:1},tryLimit={key:tryKey,max:3};
 // A provider that answers with a non-2xx: the paid success slot must be refunded.
 const mv=mockVision(null);
 e.KIE_API_KEY='kie-test';
 globalThis.fetch=async()=>{throw new Error('network down')};
 try{
  const r=await chatJSON(e,e.DB,{cacheKey:'k1',system:'s',user:'u',tryLimit,okLimit});
  assert.equal(r.ok,false);
  assert.equal((await e.DB.prepare('SELECT count FROM limits WHERE key=?').bind(await hash(okKey)).first()).count,0,'the success slot is refunded');
  assert.equal((await e.DB.prepare('SELECT count FROM limits WHERE key=?').bind(await hash(tryKey)).first()).count,1,'the attempt counter is not refunded');
 }finally{mv.restore()}
});

test('the browser colour step runs: the client bundle renders placement and the condition sheet',async()=>{
 // Blocker 1: placementRow used the server-side PLACEMENT_KEYS and condStep2 used
 // CONDITION_QUESTIONS — both absent from the browser bundle, so the page threw
 // "PLACEMENT_KEYS is not defined". Execute the real client bundle in a minimal DOM
 // and drive the colour step: it must render from LINES.placements and CONSULT.c.q.
 const src=readFileSync(new URL('../worker/customer.js',import.meta.url),'utf8');
 const start=src.indexOf('const clientJS=String.raw`');
 const backtick=src.indexOf('`',start+25);
 let js=src.slice(backtick+1,src.indexOf('`;',backtick));
 js=js.replace(/__STYLES__/g,()=>'{}').replace(/__LINES__/g,()=>JSON.stringify({label:{color:'رنگ مو'},photo:{},placements:[['full','کل مو'],['root','ریشه'],['balayage','بالیاژ']]}))
  .replace(/__MARK__/g,()=>'{}').replace(/__CONSULT__/g,()=>JSON.stringify({q:[],f:{},r:[],c:{q:CONDITION_QUESTIONS,p:CONDITION_PROBLEMS}}));
 // Expose the internals the test drives, without touching the boot path.
 js+='\n;globalThis.__aynehTest={placementRow,condDraw,condStep1,condStep2,condStep3,state,LINES,CONSULT,el,h,setCond:function(o){cond=o},setCondPanel:function(o){condPanel=o}};';

 function mkEl(tag){
  const e={tagName:String(tag||'').toUpperCase(),children:[],attrs:{},style:{},dataset:{},_t:'',_h:'',_c:'',
   classList:{add(){},remove(){},contains(){return false},toggle(){}},
   setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},
   addEventListener(){},removeEventListener(){},append(...cs){this.children.push(...cs.filter(c=>c!==null&&c!==undefined&&c!==false))},
   replaceChildren(...cs){this.children=cs.filter(c=>c!==null&&c!==undefined&&c!==false)},
   remove(){},click(){},focus(){},scrollIntoView(){},querySelector(){return null},querySelectorAll(){return []},
   get textContent(){return this._t},set textContent(v){this._t=String(v)},
   get innerHTML(){return this._h},set innerHTML(v){this._h=String(v)},
   get className(){return this._c},set className(v){this._c=String(v)},
   hidden:false,disabled:false,checked:false,required:false,value:''};
  return e;
 }
 const textOf=node=>{let out='';const walk=n=>{if(!n)return;if(n._t)out+=n._t;if(n._h)out+=n._h;(n.children||[]).forEach(walk)};walk(node);return out};

 const docEl=mkEl('html'),body=mkEl('body');
 const document={createElement:mkEl,createTextNode:t=>({_t:String(t),children:[]}),
  querySelector(){return null},querySelectorAll(){return []},addEventListener(){},removeEventListener(){},
  documentElement:docEl,body,title:'',head:mkEl('head')};
 const location={search:'',pathname:'/s/test-salon',origin:'https://test.example'};
 const localStorage={getItem(){return null},setItem(){},removeItem(){}};
 const window={addEventListener(){},removeEventListener(){},__AYN_DRAFT:null,AynehPacks:null};
 const prev={fetch:globalThis.fetch,document:globalThis.document,location:globalThis.location,localStorage:globalThis.localStorage,window:globalThis.window,history:globalThis.history,navigator:globalThis.navigator,requestAnimationFrame:globalThis.requestAnimationFrame};
 globalThis.document=document;globalThis.location=location;globalThis.localStorage=localStorage;globalThis.window=window;
 globalThis.history={replaceState(){}};
 Object.defineProperty(globalThis,'navigator',{value:{userAgent:'node'},configurable:true,writable:true});
 globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);
 globalThis.fetch=()=>Promise.reject(new Error('no network in the smoke test'));
 try{
  // Execute the real client bundle. boot() calls api('public') which rejects; showFatal
  // no-ops because #main is absent, so boot returns without throwing.
  new Function(js)();
  const T=globalThis.__aynehTest;
  assert.ok(T,'the client bundle exposed its internals');
  assert.ok(Array.isArray(T.LINES.placements)&&T.LINES.placements.length>0,'LINES.placements is the browser source');
  assert.ok(Array.isArray(T.CONSULT.c.q)&&T.CONSULT.c.q.length>0,'CONSULT.c.q is the browser source');

  // The placement row renders one chip per pattern from LINES.placements (not PLACEMENT_KEYS).
  T.state.line='color';
  const pr=T.placementRow();
  assert.equal(pr.tagName,'DIV');
  const prText=textOf(pr);
  for(const p of T.LINES.placements)assert.ok(prText.includes(p[1]),'the placement chip «'+p[1]+'» is rendered');

  // The condition sheet renders its three steps from CONSULT.c.q (not CONDITION_QUESTIONS).
  const panel=mkEl('div');
  T.setCondPanel(panel);
  T.setCond({step:1,photo:'photo-1',cond:null,answers:{},busy:false,note:'',tried:false});
  T.condDraw();
  assert.ok(panel.children.length>0,'condition step 1 renders');
  assert.ok(textOf(panel).includes('شروع تخمین'),'step 1 shows the start button');
  T.setCond({step:2,photo:'photo-1',cond:null,answers:{},busy:false,note:'',tried:false});
  T.condDraw();
  const qText=textOf(panel);
  for(const q of T.CONSULT.c.q)assert.ok(qText.includes(q.label),'the question «'+q.label+'» is rendered in step 2');
  for(const q of T.CONSULT.c.q)for(const o of q.options)assert.ok(qText.includes(o[1]),'the option «'+o[1]+'» is rendered');
  T.setCond({step:3,photo:'photo-1',cond:{base_level:6,gray_percent:20,porosity:'medium',confidence:{}},answers:{},busy:false,note:'',tried:false});
  T.condDraw();
  assert.ok(textOf(panel).includes('تخمینی'),'step 3 keeps the estimate label');
  // Let the async boot() IIFE settle (its api('public') rejects and showFatal no-ops)
  // before the globals below are torn down.
  await new Promise(r=>setTimeout(r,20));
 }finally{
  globalThis.fetch=prev.fetch;globalThis.document=prev.document;globalThis.location=prev.location;
  globalThis.localStorage=prev.localStorage;globalThis.window=prev.window;globalThis.history=prev.history;
  Object.defineProperty(globalThis,'navigator',{value:prev.navigator,configurable:true,writable:true});globalThis.requestAnimationFrame=prev.requestAnimationFrame;
  delete globalThis.__aynehTest;
 }
});

test('the formula card renders through the real el()/h() helpers with no [object] leakage',async()=>{
 // Item 2: the muted line used el('small',{children:[...]}) (el() has no children option →
 // empty) and the amounts array was nested as a child of a child (→ [object HTMLSpanElement]).
 // Execute the real ui.js client bundle in a minimal DOM and render the card with a sample row.
 const src=readFileSync(new URL('../worker/ui.js',import.meta.url),'utf8');
 const start=src.indexOf('const clientJS=String.raw`');
 const backtick=src.indexOf('`',start+25);
 let js=src.slice(backtick+1,src.indexOf('`;',backtick));
 js=js.replace(/__MARK__/g,()=>'{}').replace(/__CSS__/g,()=>'').replace(/__STYLES__/g,()=>'{}');
 js+='\n;globalThis.__uiTest={formulaCard,el,h};';

 function mkEl(tag){
  const e={tagName:String(tag||'').toUpperCase(),children:[],attrs:{},style:{},dataset:{},_t:'',_h:'',_c:'',
   classList:{add(){},remove(){},contains(){return false},toggle(){}},
   setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},
   addEventListener(){},removeEventListener(){},append(...cs){this.children.push(...cs.filter(c=>c!==null&&c!==undefined&&c!==false))},
   replaceChildren(...cs){this.children=cs.filter(c=>c!==null&&c!==undefined&&c!==false)},
   remove(){},click(){},focus(){},scrollIntoView(){},querySelector(){return null},querySelectorAll(){return []},
   get textContent(){return this._t},set textContent(v){this._t=String(v)},
   get innerHTML(){return this._h},set innerHTML(v){this._h=String(v)},
   get className(){return this._c},set className(v){this._c=String(v)},
   hidden:false,disabled:false,checked:false,required:false,value:''};
  return e;
 }
 const textOf=node=>{let out='';const walk=n=>{if(!n)return;if(n._t)out+=n._t;if(n._h)out+=n._h;(n.children||[]).forEach(walk)};walk(node);return out};
 const app=mkEl('div');
 const document={createElement:mkEl,createTextNode:t=>({_t:String(t),children:[]}),
  querySelector(sel){return sel==='#app'?app:(String(sel).charAt(0)==='#'?mkEl():null)},querySelectorAll(){return []},addEventListener(){},removeEventListener(){},
  documentElement:mkEl('html'),body:mkEl('body'),title:'',head:mkEl('head')};
 const prev={fetch:globalThis.fetch,document:globalThis.document,location:globalThis.location,localStorage:globalThis.localStorage,window:globalThis.window,history:globalThis.history,navigator:globalThis.navigator,requestAnimationFrame:globalThis.requestAnimationFrame};
 globalThis.document=document;
 globalThis.location={search:'',pathname:'/admin/test-salon',origin:'https://test.example'};
 globalThis.localStorage={getItem(){return null},setItem(){},removeItem(){}};
 globalThis.window={addEventListener(){},removeEventListener(){},innerWidth:800,innerHeight:600};
 globalThis.history={replaceState(){}};
 Object.defineProperty(globalThis,'navigator',{value:{userAgent:'node'},configurable:true,writable:true});
 globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);
 const formula={id:'f1',customer_phone:'۰۹۱۲',target_color:'بلوند',current_color:'قهوه‌ای',brand:'کیکول',code:'771',
  amounts:[{name:'بلوند',amount:'60'},{name:'پلاس',amount:'40'}],oxidant_percent:'6',oxidant_ratio:'1:1.5',
  pause_root:20,pause_shaft:30,pause_top:10,note:'یادداشت نمونه',source:'suggestion'};
 globalThis.fetch=url=>{const u=String(url);if(u.includes('/color/formulas'))return Promise.resolve({ok:true,json:()=>Promise.resolve({formulas:[formula]})});return Promise.reject(new Error('no network'))};
 try{
  new Function(js)();
  const U=globalThis.__uiTest;
  assert.ok(U,'the ui bundle exposed its internals');
  const card=U.formulaCard();
  await new Promise(r=>setTimeout(r,20)); // let the async load() settle
  const text=textOf(card);
  assert.ok(!text.includes('[object'),'no [object ...] leakage in the rendered card');
  assert.ok(text.includes('کیکول')&&text.includes('771'),'the brand and code render');
  assert.ok(text.includes('اکسیدان')&&text.includes('6٪')&&text.includes('1:1.5'),'the oxidant line renders');
  assert.ok(text.includes('منبع')&&text.includes('پیشنهاد'),'the source label renders');
  assert.ok(text.includes('بلوند — 60')&&text.includes('پلاس — 40'),'the amounts chips render');
  assert.ok(text.includes('مکث')&&text.includes('ریشه 20'),'the pause line renders');
  assert.ok(text.includes('یادداشت نمونه'),'the note renders');
 }finally{
  globalThis.fetch=prev.fetch;globalThis.document=prev.document;globalThis.location=prev.location;
  globalThis.localStorage=prev.localStorage;globalThis.window=prev.window;globalThis.history=prev.history;
  Object.defineProperty(globalThis,'navigator',{value:prev.navigator,configurable:true,writable:true});
  globalThis.requestAnimationFrame=prev.requestAnimationFrame;
  delete globalThis.__uiTest;
 }
});

test('skip_vision: the condition sheet asks for answers-only porosity after a photo failure',async()=>{
 // Item 4: after the photo analysis has failed once, the browser sends skip_vision — the server
 // computes porosity from the answers alone: no AI call, no counters, and the sheet shows step 3.
 const e=fixture();const s=await salon(e);const g=await guest(e,s);const photo=await upload(e,s,g);
 const answers={coloured:'often',wash:'fade'};
 const mv=mockVision(JSON.stringify({base_level:6,gray_percent:20,porosity:'medium',confidence:{}}));
 try{e.KIE_API_KEY='kie-test';
  // A normal call with a key succeeds and reserves a success slot.
  const ok=await call(e,'/api/s/'+s.slug+'/color/analyze',{line:'color',photo_id:photo,answers},g);
  assert.equal(ok.data.ok,true);
  // skip_vision: no AI call, no new counters, porosity from the answers only.
  const before=mv.calls.length;
  const tryBefore=(await e.DB.prepare("SELECT COUNT(*) c FROM limits WHERE key LIKE 'colorcond%:try'").all()).results[0].c;
  const skip=await call(e,'/api/s/'+s.slug+'/color/analyze',{line:'color',photo_id:photo,answers,skip_vision:true},g);
  assert.equal(skip.status,200,JSON.stringify(skip));
  assert.equal(skip.data.ok,false);
  assert.equal(skip.data.reason,'skip');
  assert.equal(skip.data.porosity,porosityFrom(null,answers),'porosity comes from the answers alone');
  assert.equal(mv.calls.length,before,'skip_vision does not call the vision provider');
  // skip_vision returns before any counter is reserved: the try count is unchanged.
  const tryAfter=(await e.DB.prepare("SELECT COUNT(*) c FROM limits WHERE key LIKE 'colorcond%:try'").all()).results[0].c;
  assert.equal(tryAfter,tryBefore,'skip_vision reserves no try counter');
 }finally{mv.restore()}
});
