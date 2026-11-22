// The regular customer's page (/try) and the image-pack sheet it shares with salon pages.
//
// /try: a woman who arrives without a salon link tries hairstyle, hair colour, nails and lashes
// on her own photo. The try-on itself is the real customer page of the direct salon, embedded
// (the same code path every salon page uses, so every server rule still applies). Around it:
// her free images, the packs once they are used, and her own referral link.
//
// On a salon page the same packs open in a sheet once her free images for a service are used
// (no referral card there); «درخواست نوبت» / sending to the salon stays where it was.
// Copy is the owner's plan wording; amounts are only displayed here, the server computes them.
import {baseCSS, markSVG} from './design.js';
import {REFERRAL_IMAGES, IMAGE_COINS} from './customerprices.js';

const packsCSS = String.raw`
.ap{display:grid;gap:12px}
.ap-packs{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.ap-pack{display:grid;gap:2px;justify-items:start;text-align:start;padding:14px 16px;border-radius:var(--r);border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;cursor:pointer;min-height:var(--tap)}
.ap-pack b{font-family:var(--display);font-size:18px;font-weight:800}
.ap-pack span{font-size:13px;color:var(--muted)}
.ap-pack:hover{border-color:var(--accent)}
.ap-pack:focus-visible{outline:3px solid #054b3c;outline-offset:3px}
.ap-more{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 14px;border-radius:var(--r);border:1px dashed var(--line);background:var(--surface-2)}
.ap-more label{display:flex;gap:8px;align-items:center;font-size:14px}
.ap-more input{width:84px;min-height:44px;border:1px solid var(--line);border-radius:var(--r-sm);padding:0 10px;font:inherit;text-align:center;background:#fff;color:var(--ink)}
.ap-more output{font-size:13px;color:var(--muted)}
.ap-pay{display:grid;gap:10px;padding:16px;border-radius:var(--r);background:var(--surface);border:1px solid var(--line-2)}
.ap-row{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:space-between;font-size:14px}
.ap-row b{font-weight:800}
.ap-card{direction:ltr;text-align:start;font:700 18px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.08em;word-break:break-all}
.ap-note{font-size:12.5px;color:var(--muted);line-height:1.9}
.ap-sheet{position:fixed;inset:0;z-index:80;display:grid;align-items:end;justify-items:center;background:rgba(35,23,15,.45)}
.ap-sheet__panel{width:min(560px,100%);max-height:92vh;overflow:auto;background:var(--glass);border-radius:var(--r-lg) var(--r-lg) 0 0;padding:18px 16px calc(18px + var(--safe-b));display:grid;gap:12px}
.ap-sheet__head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.ap-sheet__head h2{font-family:var(--display);font-size:18px}
.ap-x{border:0;background:transparent;font-size:26px;line-height:1;color:var(--ink);cursor:pointer;min-width:var(--tap);min-height:var(--tap)}
.ap [hidden]{display:none!important}
.ap-pack{position:relative}
.ap-pack b{display:inline-flex;align-items:center;gap:6px}
.ap-coin{display:inline-flex;width:20px;height:20px}.ap-coin svg{width:100%;height:100%}
.ap-pack--gift{border-color:#E9B949}
.ap-gift{position:absolute;top:-10px;inset-inline-end:10px;font-style:normal;font-size:11.5px;font-weight:800;padding:2px 9px;border-radius:999px;background:#F4E6CC;color:#6B4A0E;border:1px solid #E9B949}
.ap-unit{font-size:13px;color:var(--muted)}
.ap-more input{width:96px}
@media (max-width:520px){.ap-packs{grid-template-columns:1fr;gap:14px}.ap-pack{grid-template-columns:1fr auto;align-items:center;column-gap:10px}.ap-pack span{text-align:end}}
.ap-copy{display:flex;flex-wrap:wrap;gap:8px}
/* The same glass material as the rest of the site, for every control in the sheet: two
   bodies (light and emerald) drawn from one recipe — translucent fill, the blur, the
   glossy top edge, the soft shadow and the diagonal sheen. */
:root{
  --glass-blur:blur(14px) saturate(160%);
  --glass-bg-l:rgba(255,255,255,.55);--glass-top-l:rgba(255,255,255,.34);--glass-edge-l:rgba(255,255,255,.78);
  --glass-sheen-l:linear-gradient(105deg,rgba(255,255,255,0) 6%,rgba(255,255,255,.55) 30%,rgba(255,255,255,0) 56%,rgba(255,255,255,.22) 100%);
  --glass-bg-p:rgba(4,54,42,.86);--glass-top-p:rgba(255,255,255,.1);--glass-edge-p:rgba(255,255,255,.42);
  --glass-sheen-p:linear-gradient(105deg,rgba(255,255,255,0) 4%,rgba(255,255,255,.12) 26%,rgba(255,255,255,0) 50%,rgba(255,255,255,.06) 100%);
}
.btn,.ap-pack,.ap-x{
  --glass-bg:var(--glass-bg-l);--glass-top:var(--glass-top-l);--glass-edge:var(--glass-edge-l);--glass-sheen:var(--glass-sheen-l);
  position:relative;isolation:isolate;background-color:var(--glass-bg);
  background-image:linear-gradient(180deg,var(--glass-top) 0%,rgba(255,255,255,0) 48%,rgba(10,32,42,.05) 100%);
  border:1px solid var(--glass-edge);-webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(10,32,42,.06),0 6px 16px rgba(10,32,42,.13);
}
.btn::after,.ap-pack::after,.ap-x::after{content:"";position:absolute;z-index:-1;inset:0;border-radius:inherit;pointer-events:none;background:var(--glass-sheen)}
/* the primary action, at rest: emerald glass with a white label */
.btn--primary,.btn--build{--glass-bg:var(--glass-bg-p);--glass-top:var(--glass-top-p);--glass-edge:var(--glass-edge-p);--glass-sheen:var(--glass-sheen-p);color:#fff;text-shadow:0 1px 1px rgba(3,45,36,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -1px 0 rgba(3,45,36,.3),0 8px 20px rgba(6,143,108,.26)}
.btn--soft{--glass-bg:rgba(211,233,230,.9);color:var(--accent-ink)}
.btn:hover,.ap-pack:hover,.ap-x:hover{filter:brightness(1.05)}
.btn:active,.ap-pack:active,.ap-x:active{transform:translateY(1px) scale(.98);filter:brightness(.96)}
.btn[disabled],.ap-pack[disabled]{opacity:.5;cursor:not-allowed;transform:none;filter:grayscale(.3)}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .btn,.ap-pack,.ap-x{background-image:none;background-color:#fff;color:var(--ink-2);text-shadow:none}
  .btn--primary,.btn--build{background-color:var(--accent);color:#fff}
  .btn--soft{background-color:var(--accent-soft);color:var(--accent-ink)}
}
`;

// window.AynehPacks: mount(box,{referral,onCredited}), open(), out(), button(). Inside the /try
// frame it hands everything to the page around it (window.parent.AynehTry).
export const packsJS = String.raw`
(function(){
 if(window.AynehPacks)return;
 var fa=function(n){return new Intl.NumberFormat('fa-IR').format(n)};
 function el(tag,attrs,kids){var e=document.createElement(tag);attrs=attrs||{};Object.keys(attrs).forEach(function(k){var v=attrs[k];if(v===undefined||v===null||v===false)return;if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v)});(kids||[]).forEach(function(c){if(c!==null&&c!==undefined&&c!==false)e.append(c)});return e}
 function api(path,body){var init={credentials:'same-origin'};if(body!==undefined){init.method='POST';init.headers={'Content-Type':'application/json'};init.body=JSON.stringify(body)}return fetch(path,init).then(function(r){return r.json().catch(function(){return {}}).then(function(d){if(!r.ok)throw new Error(d.error||'خطای ارتباط؛ دوباره امتحان کنید');return d})})}
 function visitor(){var v='';try{v=localStorage.getItem('ayneh-v')||''}catch(e){}if(!/^[a-f0-9]{32}$/.test(v)){v=Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(16)),function(b){return b.toString(16).padStart(2,'0')}).join('');try{localStorage.setItem('ayneh-v',v)}catch(e){}}return v}
 var KEY='ayneh-pack-order';
 function coinSVG(){var d=document.createElement('span');d.className='ap-coin';d.setAttribute('aria-hidden','true');d.innerHTML='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#E9B949" stroke="#B9822E" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="#B9822E" stroke-width="1.3"/><path d="M12 8.6v6.8M9.6 10.4 12 8.6l2.4 1.8" fill="none" stroke="#8A5A14" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';return d}
 function copyBtn(label,text){return el('button',{class:'btn btn--soft btn--sm',type:'button',text:label,onclick:function(e){var b=e.currentTarget;(navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).then(function(){b.textContent='کپی شد ✓';setTimeout(function(){b.textContent=label},1800)},function(){b.textContent=text})}})}
 function me(ref){return api('/api/c/me?v='+visitor()+(ref?'&ref=1':''))}
 function mount(box,opts){
  opts=opts||{};var err=el('p',{class:'notice notice--warn',hidden:true});
  function fail(m){err.textContent=m;err.hidden=false}
  function choose(toman,btn){
   err.hidden=true;if(btn)btn.disabled=true;
   api('/api/c/order',{toman:toman,v:visitor()}).then(function(o){try{localStorage.setItem(KEY,o.id)}catch(e){}pay(o)}).catch(function(x){fail(x.message);if(btn)btn.disabled=false});
  }
  /* Coins for an amount, the same rule as the server (customerprices.js coinsFor); display only. */
  function coins(d,t){var base=Math.floor(t/d.coin_toman),pct=0;for(var i=0;i<d.bonus.length;i++)if(t>=d.bonus[i][0]){pct=d.bonus[i][1];break}return {coins:base+Math.floor(base*pct/100),pct:pct}}
  function list(d){
   var packs=el('div',{class:'ap-packs'},d.topups.map(function(p){var b=el('button',{class:'ap-pack'+(p.pct?' ap-pack--gift':''),type:'button',onclick:function(){choose(p.toman,b)}},[
     p.pct?el('i',{class:'ap-gift',text:fa(p.pct)+'٪ سکهٔ هدیه'}):null,
     el('b',{},[coinSVG(),document.createTextNode(fa(p.coins)+' سکه')]),
     el('span',{text:fa(p.toman/1000)+' هزار تومان · '+fa(Math.floor(p.coins/d.image_coins))+' عکس'})]);return b}));
   var n=el('input',{type:'number',min:String(d.min/1000),max:String(d.max/1000),step:'10',value:String(d.min/1000*3),inputmode:'numeric','aria-label':'مبلغ شارژ به هزار تومان'});
   var total=el('output',{});
   var val=function(){return Math.floor(Number(n.value)||0)*1000};
   var upd=function(){var t=val();if(t<d.min||t>d.max){total.textContent='بین '+fa(d.min/1000)+' تا '+fa(d.max/1000)+' هزار تومان';return}var c=coins(d,t);total.textContent=fa(c.coins)+' سکه'+(c.pct?' (با '+fa(c.pct)+'٪ هدیه)':'')+' · '+fa(Math.floor(c.coins/d.image_coins))+' عکس'};n.addEventListener('input',upd);upd();
   var more=el('div',{class:'ap-more'},[el('label',{},['مبلغ دلخواه',n,el('span',{class:'ap-unit',text:'هزار تومان'})]),total,el('button',{class:'btn btn--primary btn--sm',type:'button',text:'شارژ',onclick:function(e){var t=val();if(t<d.min||t>d.max){fail('مبلغ را بین '+fa(d.min/1000)+' تا '+fa(d.max/1000)+' هزار تومان بنویسید.');return}choose(t,e.target)}})]);
   box.replaceChildren(el('div',{class:'ap'},[packs,more,el('p',{class:'ap-note',text:'هر عکس '+fa(d.image_coins)+' سکه ('+fa(d.image_price)+' تومان). کمترین شارژ '+fa(d.min/1000)+' هزار تومان است. سکه‌ای که می‌خرید هیچ‌وقت منقضی نمی‌شود و اگر ساخت عکسی خراب شود، سکه‌اش برمی‌گردد.'}),err]));
  }
  function pay(o){
   if(o.status==='paid'){done();return}
   if(o.status==='expired'||o.status==='cancelled'){try{localStorage.removeItem(KEY)}catch(e){}start();return}
   var left=el('span',{}),msg=el('p',{class:'ap-note'});
   var back=el('button',{class:'btn btn--ghost btn--sm',type:'button',text:'تغییر مبلغ شارژ',onclick:function(){try{localStorage.removeItem(KEY)}catch(e){}stop();start()}});
   function show(){msg.textContent='مبلغ را دقیقاً به این کارت واریز کنید. پرداخت شما خودکار تأیید می‌شود و سکه‌ها همان لحظه به کیف شما اضافه می‌شود؛ همین صفحه را باز نگه دارید.'}
   var t=setInterval(function(){var s=Math.max(0,Math.round((o.expires_at-Date.now())/1000));left.textContent=o.status==='open'?(Math.floor(s/60)+':'+String(s%60).padStart(2,'0')):'';},1000);
   var p=setInterval(function(){api('/api/c/order/'+o.id).then(function(r){o=Object.assign(o,r);if(r.status==='paid'){stop();done()}else if(r.status==='expired'||r.status==='cancelled'){stop();try{localStorage.removeItem(KEY)}catch(e){}fail('مهلت این سفارش تمام شد؛ اگر واریز کرده‌اید با کد پیگیری به پشتیبانی خبر بدهید.');start(true)}else show()}).catch(function(){})},5000);
   function stop(){clearInterval(t);clearInterval(p)}
   box.replaceChildren(el('div',{class:'ap-pay'},[
    el('div',{class:'ap-row'},[el('span',{text:'شارژ'}),el('b',{text:fa(o.coins||o.count)+' سکه'})]),
    el('div',{class:'ap-row'},[el('span',{text:'مبلغ'}),el('b',{text:fa(o.amount)+' تومان'})]),
    el('div',{class:'ap-row'},[el('span',{text:'به ریال'}),el('b',{text:fa(o.amount*10)+' ریال'})]),
    el('div',{class:'ap-copy'},[copyBtn('کپی به ریال',String(o.amount*10)),copyBtn('کپی به تومان',String(o.amount))]),
    el('p',{class:'ap-note',text:'بیشتر بانک‌ها مبلغ را به ریال می‌خواهند؛ همین عدد را دقیقاً و بدون گرد کردن واریز کنید.'}),
    el('div',{class:'ap-row'},[el('span',{text:'کد پیگیری'}),el('b',{dir:'ltr',text:o.ref})]),
    o.card?el('div',{},[el('div',{class:'ap-card',text:o.card.replace(/(\d{4})(?=\d)/g,'$1 ')}),o.card_owner?el('div',{class:'ap-note',text:'به نام '+o.card_owner}):null]):el('p',{class:'notice notice--warn',text:'پرداخت هنوز آماده نیست؛ کمی بعد دوباره سر بزنید.'}),
    el('div',{class:'ap-row'},[el('span',{text:'مهلت واریز'}),left]),
    msg,back,err
   ]));show();
  }
  function done(){try{localStorage.removeItem(KEY)}catch(e){}box.replaceChildren(el('p',{class:'notice notice--ok',text:'سکه‌ها به کیف شما اضافه شد.'}));if(opts.onCredited)opts.onCredited()}
  function start(keepErr){if(!keepErr)err.hidden=true;me(false).then(list).catch(function(x){box.replaceChildren(el('p',{class:'notice notice--warn',text:x.message}))})}
  var pending='';try{pending=localStorage.getItem(KEY)||''}catch(e){}
  if(/^[a-f0-9-]{36}$/.test(pending))api('/api/c/order/'+pending).then(pay).catch(function(){start()});else start();
 }
 var framed=null;try{if(window.parent!==window&&window.parent.AynehTry)framed=window.parent.AynehTry}catch(e){}
 function credited(){try{window.dispatchEvent(new Event('ayneh:credited'))}catch(e){}}
 function open(){
  if(framed){framed.out();return}
  var body=el('div',{});
  var sheet=el('div',{class:'ap-sheet',role:'dialog','aria-modal':'true','aria-label':'شارژ سکه'},[el('div',{class:'ap-sheet__panel'},[el('div',{class:'ap-sheet__head'},[el('h2',{text:'عکس بیشتر می‌خواهید؟ کیف سکه‌تان را شارژ کنید.'}),el('button',{class:'ap-x',type:'button','aria-label':'بستن',text:'×',onclick:function(){sheet.remove()}})]),body])]);
  sheet.addEventListener('click',function(e){if(e.target===sheet)sheet.remove()});
  document.body.append(sheet);mount(body,{referral:false,onCredited:credited});
 }
 function button(){return el('button',{class:'btn btn--soft btn--sm',type:'button',text:'عکس بیشتر می‌خواهید؟ شارژ سکه',onclick:open})}
 window.AynehPacks={mount:mount,open:open,out:open,button:button,me:me,visitor:visitor,coinSVG:coinSVG};
})();
`;

/* The sheet on every salon page (index.js adds it). Inert until the page runs out of images. */
export const packsTag = '<style>' + packsCSS + '</style><script>' + packsJS + '</script>';

const tryCSS = String.raw`
/* «استودیو»: the customer's own page, in the landing's cream + emerald (same tokens as /salons). */
:root{--glass:#FCF3EB;--glass-2:#F6E7DB;--surface:#FFFFFF;--surface-2:#F8F0E8;--ink:#0A202A;--ink-2:#12333C;--muted:#5D6B68;--line:#E2D0BE;--line-2:#EDE0D2;
 --accent:#068F6C;--accent-ink:#0A6B54;--accent-soft:#E4F4EE;--accent-ring:rgba(6,143,108,.3);--gold:#E9B949;--gold-ink:#6B4A0E;--gold-soft:#F4E6CC}
.tr{max-width:820px;margin:0 auto;padding:14px 16px 40px;display:grid;gap:18px}
.tr-bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;background:linear-gradient(180deg,var(--glass) 70%,rgba(252,243,235,0))}
.tr-brand{display:flex;gap:8px;align-items:center;font-weight:800;color:var(--ink);text-decoration:none;min-height:44px}
.tr-brand svg{width:24px;height:36px}
.tr-bar__end{display:flex;gap:8px;align-items:center}
.tr-pill{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border-radius:999px;background:var(--surface);border:1px solid var(--gold);color:var(--gold-ink);font-weight:800;font-size:14.5px;cursor:pointer;box-shadow:0 4px 14px rgba(10,32,42,.08)}
.tr-pill .ap-coin{width:20px;height:20px}
.tr-pro{font-size:13px;color:var(--muted);text-decoration:underline;text-underline-offset:4px;min-height:44px;display:inline-flex;align-items:center}
.tr-hero{display:grid;gap:8px}
.tr-hero h1{font-family:var(--display);font-weight:800;font-size:clamp(24px,6vw,36px);line-height:1.45}
.tr-hero p{color:var(--ink-2);font-size:16px}
.tr-gift{display:inline-flex;align-items:center;gap:8px;justify-self:start;padding:8px 14px;border-radius:999px;background:var(--gold-soft);color:var(--gold-ink);font-weight:700;font-size:14px;border:1px solid var(--gold)}
.tr-wallet{display:grid;grid-template-columns:auto 1fr auto;gap:6px 14px;align-items:center;padding:16px;border-radius:var(--r-lg);background:linear-gradient(135deg,#0A6B54,#068F6C);color:#fff;box-shadow:0 18px 40px -22px rgba(6,107,84,.7)}
.tr-wallet .ap-coin{width:44px;height:44px;grid-row:span 2}
.tr-wallet b{font-family:var(--display);font-size:26px;line-height:1.2}
.tr-wallet small{font-size:13px;opacity:.9}
.tr-wallet .btn{grid-row:span 2;background:#fff;color:var(--accent-ink);border:0}
.tr-bar2{grid-column:1/-1;height:8px;border-radius:999px;background:rgba(255,255,255,.22);overflow:hidden}
.tr-bar2 i{display:block;height:100%;width:0;border-radius:inherit;background:var(--gold);transition:width .5s var(--ease)}
.tr-next{grid-column:1/-1;font-size:13px;opacity:.95}
.tr-h2{font-family:var(--display);font-size:19px;font-weight:800}
.tr-svc{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.tr-svc button{display:grid;gap:6px;padding:6px 6px 10px;min-height:44px;border-radius:var(--r);border:2px solid transparent;background:var(--surface);color:var(--ink);font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 6px 18px -10px rgba(10,32,42,.35);transition:transform .15s var(--ease),border-color .15s}
.tr-svc button img{width:100%;height:auto;aspect-ratio:3/4;object-fit:cover;border-radius:calc(var(--r) - 6px);background:var(--surface-2)}
.tr-svc button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-soft)}
.tr-svc button:active{transform:scale(.98)}
.tr-frame{border-radius:var(--r-lg);overflow:hidden;background:var(--surface);box-shadow:var(--lift);scroll-margin-top:72px}
.tr-frame iframe{display:block;width:100%;height:760px;border:0;background:transparent}
.tr-card{display:grid;gap:10px;padding:18px 16px;border-radius:var(--r-lg);background:var(--surface);border:1px solid var(--line-2);scroll-margin-top:72px}
.tr-card h2{font-family:var(--display);font-size:19px;font-weight:800}
.tr-card p{color:var(--ink-2)}
.tr-ref{background:var(--surface-2)}
.tr-ref .tr-link{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.tr-ref code{direction:ltr;text-align:start;flex:1 1 220px;background:#fff;border:1px solid var(--line);border-radius:var(--r-sm);padding:9px 12px;font:13px ui-monospace,Menlo,monospace;word-break:break-all;color:var(--ink)}
.tr-foot{max-width:820px;margin:0 auto;padding:0 16px 32px;font-size:12.5px;color:var(--muted);line-height:1.9}
.tr .btn--sm{min-height:44px}
.tr :focus-visible{outline:3px solid #054b3c;outline-offset:3px}
.tr [hidden]{display:none!important}
@media (min-width:700px){.tr-svc button img{aspect-ratio:1/1}}
@media (prefers-reduced-motion:reduce){.tr *{transition:none!important}}
`;

const tryJS = String.raw`
(function(){
 var $=function(s){return document.querySelector(s)};
 var fa=function(n){return new Intl.NumberFormat('fa-IR').format(n)};
 var frame=$('#trFrame'),packs=$('#trPacks'),box=$('#trPackBox'),mounted=false,last=0,SLUG=frame.getAttribute('data-slug');
 document.querySelectorAll('[data-coin]').forEach(function(n){n.prepend(AynehPacks.coinSVG())});
 function credited(){try{frame.contentWindow.dispatchEvent(new Event('ayneh:credited'))}catch(e){}refresh(true)}
 function showPacks(out){
  $('#trOutTitle').textContent=out?'عکس‌های هدیه‌ات تموم شد.':'کیف سکه‌ات رو شارژ کن';packs.hidden=false;
  if(!mounted){mounted=true;AynehPacks.mount(box,{referral:false,onCredited:function(){mounted=false;credited()}})}
  packs.scrollIntoView({behavior:'smooth',block:'start'});
 }
 window.AynehTry={out:function(){showPacks(true)}};
 /* Service cards pick the line inside the try-on below (its own ?l= switch). */
 var cur='';try{cur=localStorage.getItem('ayneh-line-'+SLUG)||''}catch(e){}
 document.querySelectorAll('.tr-svc button').forEach(function(b){
  if(b.dataset.line===cur)b.setAttribute('aria-pressed','true');
  b.addEventListener('click',function(){document.querySelectorAll('.tr-svc button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
   frame.src='/s/'+SLUG+'?embed=1&l='+b.dataset.line;$('#trFrameWrap').scrollIntoView({behavior:'smooth',block:'start'})});
 });
 function refresh(force){
  if(!force&&Date.now()-last<4000)return;last=Date.now();
  AynehPacks.me(true).then(function(d){
   var free=d.free.left,coins=d.own.coins||0,per=d.image_coins||25,imgs=Math.floor(coins/per);
   $('#trCoins').textContent=fa(coins)+' سکه';$('#trWalletCoins').textContent=fa(coins)+' سکه';
   $('#trWalletSub').textContent=imgs>0?'برای '+fa(imgs)+' عکس دیگه':'هر عکس '+fa(per)+' سکه';
   var rest=coins%per;$('#trBar').style.width=(imgs>0?100:Math.round(rest/per*100))+'%';
   $('#trNext').textContent=imgs>0?'آماده‌ای! هر عکس '+fa(per)+' سکه از کیفت کم می‌کنه.':(coins>0?fa(per-rest)+' سکهٔ دیگه تا عکس بعدی':'با شارژ ۱۰۰ هزار تومان ۵۰ سکه (۲ عکس) می‌گیری.');
   var g=$('#trGift');if(free>0){g.hidden=false;$('#trGiftText').textContent=fa(free)+' عکس هدیه داری؛ رایگان امتحان کن'}else g.hidden=true;
   $('#trLeft').textContent='بدون نصب. فقط یه سلفی لازمه.';
   if(free+imgs<=0&&!mounted)showPacks(true);
   if(d.referral){$('#trRef').hidden=false;$('#trRefLink').textContent=d.referral.link}
  }).catch(function(){});
 }
 $('#trCoinsBtn').addEventListener('click',function(){showPacks(false)});
 $('#trTop').addEventListener('click',function(){showPacks(false)});
 $('#trCopy').addEventListener('click',function(e){var t=$('#trRefLink').textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){e.target.textContent='کپی شد'},function(){e.target.textContent='لینک را نگه دارید و بفرستید'})});
 window.addEventListener('message',function(e){if(e.origin!==location.origin||!e.data)return;if(e.data.aynehDemoHeight){frame.style.height=Math.max(520,Math.min(4000,Number(e.data.aynehDemoHeight)||0))+'px';refresh(false)}});
 try{localStorage.setItem('ayneh-side','customer')}catch(e){}
 AynehPacks.visitor();refresh(true);
 if(location.hash==='#topup')setTimeout(function(){showPacks(false)},300);
})();
`;

const attr = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

const SERVICES = [['hair', 'مدل مو', 'demo-style-after.webp'], ['color', 'رنگ مو', 'demo-color-after.webp'], ['nails', 'ناخن', 'demo-nails-after.webp'], ['lashes', 'مژه', 'demo-lashes-after.webp']];

/* «استودیو» (/studio): the customer's page. The try-on itself is the direct salon's real
   customer page, embedded (every server rule still applies); around it her coins, the four
   services, the top-up sheet and her referral link. */
export function tryHTML(slug) {
  return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#FCF3EB"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><link rel="canonical" href="/studio">'
    + '<title>استودیوی آینه | مدل جدیدت رو روی عکس خودت ببین</title><meta name="description" content="مدل مو، رنگ مو، ناخن و مژه را روی عکس خودتان ببینید. بدون نصب. ۲ عکس اول هدیه است.">'
    + '<style>' + baseCSS + packsCSS + tryCSS + '</style></head><body>'
    + '<main class="tr">'
    + '<div class="tr-bar"><a class="tr-brand" href="/"><span aria-hidden="true">' + markSVG + '</span>آینه</a><span class="tr-bar__end"><a class="tr-pro" href="/salons">آرایشگر هستید؟</a><button id="trCoinsBtn" class="tr-pill" type="button" data-coin aria-label="کیف سکه"><span id="trCoins">۰ سکه</span></button></span></div>'
    + '<section class="tr-hero"><h1>مدل جدیدت رو روی عکس خودت ببین.</h1><p id="trLeft" aria-live="polite">بدون نصب. فقط یه سلفی لازمه.</p><span id="trGift" class="tr-gift" data-coin hidden><span id="trGiftText"></span></span></section>'
    + '<section class="tr-wallet" aria-label="کیف سکه"><span data-coin></span><b id="trWalletCoins">۰ سکه</b><button id="trTop" class="btn btn--sm" type="button">شارژ کیف</button><small id="trWalletSub"></small><span class="tr-bar2" aria-hidden="true"><i id="trBar"></i></span><span id="trNext" class="tr-next" aria-live="polite"></span></section>'
    + '<section><h2 class="tr-h2">امروز کدوم رو امتحان کنیم؟</h2></section>'
    + '<div class="tr-svc">' + SERVICES.map(([k, t, img]) => '<button type="button" data-line="' + k + '" aria-pressed="false"><img src="/landing/' + img + '" alt="" loading="lazy" width="200" height="250">' + t + '</button>').join('') + '</div>'
    + '<div id="trFrameWrap" class="tr-frame"><iframe id="trFrame" data-slug="' + attr(slug) + '" src="/s/' + attr(slug) + '?embed=1" title="امتحان روی عکس خودتان" allow="camera"></iframe></div>'
    + '<section id="trPacks" class="tr-card" hidden><h2 id="trOutTitle">کیف سکه‌ات رو شارژ کن</h2><p>هر عکس ۲۵ سکه است. هرچی بیشتر شارژ کنی، سکهٔ هدیهٔ بیشتری می‌گیری.</p><div id="trPackBox"></div></section>'
    + '<section id="trRef" class="tr-card tr-ref" hidden><p>آرایشگر یا آرایشگاه‌دار می‌شناسید؟ لینک شما را به او بدهید؛ اگر پلن آینه بگیرد، ' + (REFERRAL_IMAGES * IMAGE_COINS).toLocaleString('fa-IR') + ' سکه هدیه می‌گیرید.</p><div class="tr-link"><code id="trRefLink"></code><button id="trCopy" class="btn btn--soft btn--sm" type="button">کپی لینک</button></div></section>'
    + '</main>'
    + '<footer class="tr-foot">نتیجه یک نمونهٔ نمایشی است؛ برای انتخاب قبل از نوبت. عکس شما فقط برای ساخت نمونه استفاده می‌شود؛ نسخهٔ فشردهٔ آن برای ساخت تصویر به سرویس تصویر ارسال می‌شود.</footer>'
    + '<script>' + packsJS + tryJS + '</script></body></html>';
}
