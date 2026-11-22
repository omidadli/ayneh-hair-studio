// The coin sheet (top-up) shared by the customers' studio and every salon page.
// The studio («/» on the main domain, worker/customer.js in studio mode) opens it from the wallet;
// a salon page opens it once her free images there are used. Amounts are only displayed here:
// the server (worker/customerprices.js) computes the coins.

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
.ap-pack b{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.ap-coin{display:inline-flex;width:20px;height:20px}.ap-coin svg{width:100%;height:100%}
.ap-pack--gift{border-color:#E9B949}
.ap-pack--best{box-shadow:0 0 0 2px #E9B949 inset}
.ap-gift{position:absolute;top:-10px;inset-inline-end:10px;font-style:normal;font-size:11.5px;font-weight:800;padding:2px 9px;border-radius:999px;background:#F4E6CC;color:#6B4A0E;border:1px solid #E9B949}
.ap-unit{font-size:13px;color:var(--muted)}
.ap-more input{width:96px}
@media (max-width:520px){.ap-packs{grid-template-columns:1fr;gap:14px}.ap-pack{grid-template-columns:1fr auto;align-items:center;column-gap:10px}.ap-pack span{text-align:end}}
.ap-copy{display:flex;flex-wrap:wrap;gap:8px}
.ap-paysum{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-radius:var(--r);background:#FBF0D9;border:1px solid #EAD39D;color:#5B3F0C}
.ap-paysum span{display:inline-flex;align-items:center;gap:6px;font-weight:800}
.ap-paysum b{font-size:19px}
.ap-steps{list-style:none;margin:0;padding:0;display:grid;gap:12px;counter-reset:s}
.ap-steps li{position:relative;display:grid;gap:8px;padding:12px 14px 12px 14px;padding-inline-start:46px;border-radius:var(--r);border:1px solid var(--line);background:var(--surface,#fff)}
.ap-steps li::before{counter-increment:s;content:counter(s);position:absolute;inset-inline-start:12px;top:12px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--accent,#0f5e4d);color:#fff;font-size:13px;font-weight:800}
.ap-cardrow,.ap-amount{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
.ap-amount span{font-size:18px;font-weight:800;color:var(--ink)}
.ap-amount--alt span{font-size:14px;font-weight:600;color:var(--muted)}
.ap-wait{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--ink)}
.ap-spin{width:16px;height:16px;border-radius:50%;border:2px solid var(--line);border-top-color:var(--accent,#0f5e4d);animation:apspin .9s linear infinite}
@keyframes apspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ap-spin{animation:none}}
.ap-row--ref{font-size:13px}
.ap-done{display:grid;justify-items:center;gap:6px;text-align:center;padding:18px 12px;border-radius:var(--r);background:#E9F6F0}
.ap-done .ap-coin{width:44px;height:44px}.ap-done b{font-size:17px}.ap-done span{font-size:13.5px;color:var(--muted)}
.ap-ref{display:grid;gap:8px;padding:12px 14px;border-radius:var(--r);background:var(--surface-2,#f6f1ea);font-size:13.5px}
.ap-ref code{direction:ltr;text-align:start;font:12.5px ui-monospace,Menlo,monospace;word-break:break-all;background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 10px}
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
  /* Images for an amount, the same rule as the server (customerprices.js coinsFor); display only. */
  function worth(d,t){var img=Math.floor(t/d.image_price),gift=Math.floor(t/d.gift_every);return {images:img+gift,gift:gift,coins:(img+gift)*d.image_coins}}
  function list(d){
   var best=d.topups.length>1?d.topups[1].toman:0;
   var packs=el('div',{class:'ap-packs'},d.topups.map(function(p){var w=worth(d,p.toman);var b=el('button',{class:'ap-pack'+(w.gift?' ap-pack--gift':'')+(p.toman===best?' ap-pack--best':''),type:'button',onclick:function(){choose(p.toman,b)}},[
     w.gift?el('i',{class:'ap-gift',text:fa(w.gift)+' عکس هدیه'}):null,
     el('b',{},[coinSVG(),document.createTextNode(fa(w.images)+' عکس')]),
     el('span',{text:fa(p.toman/1000)+' هزار تومان · '+fa(w.coins)+' سکه'+(w.gift?' · هر عکس '+fa(Math.round(p.toman/w.images/1000))+' هزار':'')})]);return b}));
   var step=d.step/1000,n=el('input',{type:'number',min:String(d.min/1000),max:String(d.max/1000),step:String(step),value:String(d.min/1000*3),inputmode:'numeric','aria-label':'مبلغ شارژ به هزار تومان'});
   var total=el('output',{});
   var val=function(){return Math.floor(Number(n.value)||0)*1000};
   var ok=function(t){return t>=d.min&&t<=d.max&&t%d.step===0};
   var upd=function(){var t=val();if(!ok(t)){total.textContent='مضربی از '+fa(step)+' هزار تومان، از '+fa(d.min/1000)+' تا '+fa(d.max/1000)+' هزار';return}var w=worth(d,t);total.textContent=fa(w.images)+' عکس'+(w.gift?' (با '+fa(w.gift)+' عکس هدیه)':'')+' · '+fa(w.coins)+' سکه'};n.addEventListener('input',upd);upd();
   var more=el('div',{class:'ap-more'},[el('label',{},['مبلغ دلخواه',n,el('span',{class:'ap-unit',text:'هزار تومان'})]),total,el('button',{class:'btn btn--primary btn--sm',type:'button',text:'شارژ',onclick:function(e){var t=val();if(!ok(t)){fail('مبلغ را مضربی از '+fa(step)+' هزار تومان (قیمت یک عکس)، بین '+fa(d.min/1000)+' تا '+fa(d.max/1000)+' هزار تومان بنویسید.');return}choose(t,e.target)}})]);
   box.replaceChildren(el('div',{class:'ap'},[packs,more,el('p',{class:'ap-note',text:'هر عکس '+fa(d.image_coins)+' سکه ('+fa(d.image_price)+' تومان). به ازای هر '+fa(d.gift_every/1000)+' هزار تومان شارژ، ۱ عکس هدیه می‌گیرید. سکه‌ای که می‌خرید هیچ‌وقت منقضی نمی‌شود و اگر ساخت عکسی خراب شود، سکه‌اش برمی‌گردد.'}),err,opts.referral&&d.referral?el('div',{class:'ap-ref'},[el('p',{text:'آرایشگر یا آرایشگاه‌دار می‌شناسید؟ لینک خودتان را به او بدهید؛ اگر پلن آینه بگیرد، '+fa(d.referral.images*d.image_coins)+' سکه هدیه می‌گیرید.'}),el('code',{text:d.referral.link}),copyBtn('کپی لینک',d.referral.link)]):null]));
  }
  function pay(o){
   if(o.status==='paid'){done(o.coins||o.count);return}
   if(o.status==='expired'||o.status==='cancelled'){try{localStorage.removeItem(KEY)}catch(e){}start();return}
   var left=el('span',{}),msg=el('p',{class:'ap-note'});
   var back=el('button',{class:'btn btn--ghost btn--sm',type:'button',text:'تغییر مبلغ شارژ',onclick:function(){try{localStorage.removeItem(KEY)}catch(e){}stop();start()}});
   function show(){msg.textContent='پرداخت خودکار و معمولاً چند ثانیه بعد از واریز تأیید می‌شود و سکه‌ها همان لحظه به کیفتان اضافه می‌شود. اگر پول از حسابتان کم شده، دوباره واریز نکنید؛ اگر تا ۱۰ دقیقه تأیید نشد، کد پیگیری را برای پشتیبانی آینه بفرستید.'}
   var t=setInterval(function(){var s=Math.max(0,Math.round((o.expires_at-Date.now())/1000));left.textContent=o.status==='open'?(Math.floor(s/60)+':'+String(s%60).padStart(2,'0')):'';},1000);
   var p=setInterval(function(){api('/api/c/order/'+o.id).then(function(r){o=Object.assign(o,r);if(r.status==='paid'){stop();done(o.coins||o.count)}else if(r.status==='expired'||r.status==='cancelled'){stop();try{localStorage.removeItem(KEY)}catch(e){}fail('مهلت این سفارش تمام شد؛ اگر واریز کرده‌اید با کد پیگیری به پشتیبانی خبر بدهید.');start(true)}else show()}).catch(function(){})},5000);
   function stop(){clearInterval(t);clearInterval(p)}
   /* Order of a bank app: the card, then the exact amount, then wait here. Every number has its own copy button. */
   var card=o.card?o.card.replace(/\D/g,''):'';
   box.replaceChildren(el('div',{class:'ap-pay'},[
    el('div',{class:'ap-paysum'},[el('span',{},[coinSVG(),document.createTextNode(fa(o.coins||o.count)+' سکه')]),el('b',{text:fa(o.amount)+' تومان'})]),
    el('ol',{class:'ap-steps'},[
     el('li',{},[el('b',{text:'به این کارت'}),card?el('div',{class:'ap-cardrow'},[el('div',{class:'ap-card',dir:'ltr',text:card.replace(/(\d{4})(?=\d)/g,'$1 ')}),copyBtn('کپی شماره کارت',card)]):el('p',{class:'notice notice--warn',text:'پرداخت هنوز آماده نیست؛ کمی بعد دوباره سر بزنید.'}),o.card_owner?el('small',{class:'ap-note',text:'به نام '+o.card_owner+'؛ قبل از تأیید در اپ بانکت، اسم گیرنده را چک کن.'}):null]),
     el('li',{},[el('b',{text:'دقیقاً همین مبلغ را بزنید'}),el('div',{class:'ap-amount'},[el('span',{text:fa(o.amount*10)+' ریال'}),copyBtn('کپی به ریال',String(o.amount*10))]),el('div',{class:'ap-amount ap-amount--alt'},[el('span',{text:fa(o.amount)+' تومان'}),copyBtn('کپی به تومان',String(o.amount))]),el('small',{class:'ap-note',text:(o.amount%1000?'این مبلغ عمداً کمی کمتر از '+fa(Math.ceil(o.amount/1000)*1000)+' تومان است تا واریز شما بدون رسید و خودکار شناسایی شود؛ آن را گرد نکنید. ':'')+'بیشتر بانک‌ها مبلغ را به ریال می‌خواهند.'})]),
     el('li',{},[el('b',{text:'همین صفحه را باز بگذارید'}),el('div',{class:'ap-wait'},[el('span',{class:'ap-spin','aria-hidden':'true'}),el('span',{},['در انتظار واریز · ',left])]),msg])
    ]),
    el('div',{class:'ap-row ap-row--ref'},[el('span',{text:'کد پیگیری'}),el('b',{dir:'ltr',text:o.ref})]),
    back,err
   ]));show();
  }
  function done(n){try{localStorage.removeItem(KEY)}catch(e){}box.replaceChildren(el('div',{class:'ap-done'},[coinSVG(),el('b',{text:n?fa(n)+' سکه به کیفتان اضافه شد.':'سکه‌ها به کیف شما اضافه شد.'}),el('span',{text:'حالا برگردید و عکس بعدی را بسازید.'})]));if(opts.onCredited)opts.onCredited()}
  function start(keepErr){if(!keepErr)err.hidden=true;me(!!opts.referral).then(list).catch(function(x){box.replaceChildren(el('p',{class:'notice notice--warn',text:x.message}))})}
  var pending='';try{pending=localStorage.getItem(KEY)||''}catch(e){}
  if(/^[a-f0-9-]{36}$/.test(pending))api('/api/c/order/'+pending).then(pay).catch(function(){start()});else start();
 }
 var framed=null;try{if(window.parent!==window&&window.parent.AynehTry)framed=window.parent.AynehTry}catch(e){}
 function credited(){try{window.dispatchEvent(new Event('ayneh:credited'))}catch(e){}}
 function open(){
  if(framed){framed.out();return}
  var body=el('div',{});
  var sheet=el('div',{class:'ap-sheet',role:'dialog','aria-modal':'true','aria-label':'شارژ سکه'},[el('div',{class:'ap-sheet__panel'},[el('div',{class:'ap-sheet__head'},[el('h2',{text:'شارژ کیف سکه'}),el('button',{class:'ap-x',type:'button','aria-label':'بستن',text:'×',onclick:function(){sheet.remove()}})]),body])]);
  sheet.addEventListener('click',function(e){if(e.target===sheet)sheet.remove()});
  document.body.append(sheet);mount(body,{referral:!!document.querySelector('meta[name="ayneh-biz"]'),onCredited:credited});
 }
 function button(){return el('button',{class:'btn btn--soft btn--sm',type:'button',text:'عکس بیشتر می‌خواهید؟ شارژ سکه',onclick:open})}
 window.AynehPacks={mount:mount,open:open,out:open,button:button,me:me,visitor:visitor,coinSVG:coinSVG};
})();
`;

/* The sheet on every salon page (index.js adds it). Inert until the page runs out of images. */
export const packsTag = '<style>' + packsCSS + '</style><script>' + packsJS + '</script>';

