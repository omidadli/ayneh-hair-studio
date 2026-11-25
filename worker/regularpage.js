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
.ap-x{border:0;background:transparent;font-size:24px;line-height:1;color:var(--ink);cursor:pointer;width:44px;height:44px;min-width:44px;border-radius:50%!important;display:grid;place-items:center;padding:0}
.ap [hidden],.ap-pay [hidden]{display:none!important}
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
.ap-steps li::before{counter-increment:s;content:counter(s,persian);position:absolute;inset-inline-start:12px;top:12px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--accent,#0f5e4d);color:#fff;font-size:13px;font-weight:800}
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
.ap-bal{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:var(--r);background:var(--surface);border:1px solid var(--line);font-size:14px;color:var(--ink-2)}
.ap-bal b{margin-inline-start:auto;font-size:15px;color:var(--ink)}
.ap-opts{display:grid;gap:8px}
.ap-opt{display:flex;align-items:center;gap:12px;width:100%;min-height:60px;padding:10px 14px;border-radius:var(--r);border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;text-align:start;cursor:pointer;position:relative}
.ap-opt.is-on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
.ap-opt__dot{flex:0 0 20px;width:20px;height:20px;border-radius:50%;border:2px solid var(--line-2,#c9c2b8);display:grid;place-items:center}
.ap-opt.is-on .ap-opt__dot{border-color:var(--accent)}
.ap-opt.is-on .ap-opt__dot::after{content:'';width:10px;height:10px;border-radius:50%;background:var(--accent)}
.ap-opt__main{flex:1;min-width:0;display:grid}
.ap-opt__main b{font-size:15.5px;font-weight:800}
.ap-opt__main small{font-size:12.5px;color:var(--muted)}
.ap-opt__price{font-size:14px;font-weight:700;color:var(--ink);white-space:nowrap}
.ap-opt__tag{font-style:normal;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;background:#F4E6CC;color:#6B4A0E}
.ap-opt:focus-visible{outline:3px solid #054b3c;outline-offset:2px}
.ap-stepper{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px;border-radius:var(--r);background:var(--surface-2,#f6f1ea);font-size:14px;color:var(--ink-2)}
.ap-stepper__ctl{display:flex;align-items:center;gap:12px}
.ap-stepper__ctl b{min-width:28px;text-align:center;font-size:17px;color:var(--ink)}
.ap-step{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--surface);font:inherit;font-size:20px;color:var(--ink);cursor:pointer}
.ap-step[disabled]{opacity:.4;cursor:not-allowed}
.ap-back{justify-self:start}
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
  /* One clean choice: three packs as a list, «مبلغ دلخواه» as a stepper in whole images, one pay button. */
  function list(d){
   var opts=d.topups.map(function(p){return p.toman}),best=opts.length>1?opts[1]:opts[0],sel=best,custom=Math.max(d.min,d.image_price*3);
   var own=d.own&&d.own.coins||0;
   var rows=el('div',{class:'ap-opts',role:'radiogroup','aria-label':'مبلغ شارژ'});
   var payBtn=el('button',{class:'btn btn--primary btn--block btn--lg',type:'button'});
   function row(t,isCustom){
    var w=worth(d,t),on=isCustom?sel==='custom':sel===t;
    var r=el('button',{class:'ap-opt'+(on?' is-on':''),type:'button',role:'radio','aria-checked':String(on),onclick:function(){sel=isCustom?'custom':t;draw()}},[
     el('span',{class:'ap-opt__dot','aria-hidden':'true'}),
     el('span',{class:'ap-opt__main'},[el('b',{text:fa(w.images)+' عکس'}),el('small',{text:isCustom&&sel!=='custom'?'تعداد عکس را خودت انتخاب کن':(w.gift?fa(w.images-w.gift)+' عکس + '+fa(w.gift)+' عکس جایزه':'')+(w.gift?'، ':'')+fa(w.coins)+' سکه'+(d.consult_coins?' · یا '+fa(Math.floor(w.coins/d.consult_coins))+' تحلیل چهره':'')})]),
     !isCustom&&t===best?el('i',{class:'ap-opt__tag',text:'پرطرفدار'}):null,
     isCustom&&sel!=='custom'?null:el('span',{class:'ap-opt__price',text:fa(t/1000)+' هزار تومان'})]);
    return r;
   }
   function stepper(){
    var minus=el('button',{class:'ap-step',type:'button','aria-label':'یک عکس کمتر',text:'−',onclick:function(){custom=Math.max(d.min,custom-d.step);draw()}});
    var plus=el('button',{class:'ap-step',type:'button','aria-label':'یک عکس بیشتر',text:'+',onclick:function(){custom=Math.min(d.max,custom+d.step);draw()}});
    minus.disabled=custom<=d.min;plus.disabled=custom>=d.max;
    return el('div',{class:'ap-stepper'},[el('span',{text:'تعداد عکس'}),el('div',{class:'ap-stepper__ctl'},[minus,el('b',{text:fa(custom/d.image_price)}),plus])]);
   }
   function draw(){
    var list=opts.map(function(t){return row(t,false)});
    var cr=row(custom,true);cr.querySelector('.ap-opt__main b').textContent='مقدار دلخواه';
    list.push(cr);if(sel==='custom')list.push(stepper());
    rows.replaceChildren.apply(rows,list);
    var t=sel==='custom'?custom:sel;payBtn.textContent='پرداخت '+fa(t)+' تومان';payBtn.onclick=function(){choose(t,payBtn)};
   }
   draw();
   box.replaceChildren(el('div',{class:'ap'},[
    el('div',{class:'ap-bal'},[coinSVG(),el('span',{text:'موجودی کیف'}),el('b',{text:fa(own)+' سکه'})]),
    rows,payBtn,
    el('p',{class:'ap-note',text:'هر عکس '+fa(d.image_coins)+' سکه'+(d.consult_coins?' · هر تحلیل چهره '+fa(d.consult_coins)+' سکه (اولین تحلیل رایگان)':'')+' · سکه منقضی نمی‌شود · اگر ساخت عکسی خراب شود، سکه‌اش برمی‌گردد.'}),err,
    opts.referral&&d.referral?el('div',{class:'ap-ref'},[el('p',{text:'آرایشگر یا آرایشگاه‌دار می‌شناسید؟ لینک خودتان را به او بدهید؛ اگر پلن آینه بگیرد، '+fa(d.referral.images*d.image_coins)+' سکه هدیه می‌گیرید.'}),el('code',{text:d.referral.link}),copyBtn('کپی لینک',d.referral.link)]):null]));
  }
  function pay(o){
   if(o.status==='paid'){done(o.coins||o.count);return}
   if(o.status==='expired'||o.status==='cancelled'){try{localStorage.removeItem(KEY)}catch(e){}start();return}
   var left=el('span',{}),msg=el('p',{class:'ap-note'});
   var back=el('button',{class:'btn btn--ghost btn--sm ap-back',type:'button',text:'تغییر مبلغ',onclick:function(){try{localStorage.removeItem(KEY)}catch(e){}stop();start()}});
   function show(){msg.textContent='تأیید خودکار است؛ معمولاً چند ثانیه بعد از واریز.'}
   var t=setInterval(function(){var s=Math.max(0,Math.round((o.expires_at-Date.now())/1000));left.textContent=o.status==='open'?(Math.floor(s/60)+':'+String(s%60).padStart(2,'0')):'';},1000);
   var p=setInterval(function(){api('/api/c/order/'+o.id).then(function(r){o=Object.assign(o,r);if(r.status==='paid'){stop();done(o.coins||o.count)}else if(r.status==='expired'||r.status==='cancelled'){stop();try{localStorage.removeItem(KEY)}catch(e){}fail('مهلت این سفارش تمام شد؛ اگر واریز کرده‌اید با کد پیگیری به پشتیبانی خبر بدهید.');start(true)}else show()}).catch(function(){})},5000);
   function stop(){clearInterval(t);clearInterval(p)}
   window.__apStop=stop;
   /* Order of a bank app: the card, then the exact amount, then wait here. Every number has its own copy button. */
   var card=o.card?o.card.replace(/\D/g,''):'';
   box.replaceChildren(el('div',{class:'ap-pay'},[
    el('div',{class:'ap-paysum'},[el('span',{},[coinSVG(),document.createTextNode(fa(o.coins||o.count)+' سکه')]),el('b',{text:fa(o.amount)+' تومان'})]),
    el('ol',{class:'ap-steps'},[
     el('li',{},[el('b',{text:'به این کارت'}),card?el('div',{class:'ap-cardrow'},[el('div',{class:'ap-card',dir:'ltr',text:card.replace(/(\d{4})(?=\d)/g,'$1 ')}),copyBtn('کپی شماره کارت',card)]):el('p',{class:'notice notice--warn',text:'پرداخت هنوز آماده نیست؛ کمی بعد دوباره سر بزنید.'}),o.card_owner?el('small',{class:'ap-note',text:'به نام '+o.card_owner+'؛ قبل از تأیید در اپ بانکت، اسم گیرنده را چک کن.'}):null]),
     el('li',{},[el('b',{text:'دقیقاً همین مبلغ را بزنید'}),el('div',{class:'ap-amount'},[el('span',{text:fa(o.amount*10)+' ریال'}),copyBtn('کپی به ریال',String(o.amount*10))]),el('div',{class:'ap-amount ap-amount--alt'},[el('span',{text:'معادل '+fa(o.amount)+' تومان'})]),o.amount%1000?el('small',{class:'ap-note',text:'مبلغ را گرد نکنید؛ همین عدد واریز شما را خودکار شناسایی می‌کند.'}):null]),
     el('li',{},[el('b',{text:'منتظر تأیید بمانید'}),el('div',{class:'ap-wait'},[el('span',{class:'ap-spin','aria-hidden':'true'}),el('span',{},['در انتظار واریز · ',left])]),msg])
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
  var sheet=el('div',{class:'ap-sheet',role:'dialog','aria-modal':'true','aria-label':'شارژ سکه'},[el('div',{class:'ap-sheet__panel'},[el('div',{class:'ap-sheet__head'},[el('h2',{text:'شارژ کیف سکه'}),el('button',{class:'ap-x',type:'button','aria-label':'بستن',text:'×',onclick:function(){close()}})]),body])]);
  function close(){if(window.__apStop)window.__apStop();sheet.remove()}
  sheet.addEventListener('click',function(e){if(e.target===sheet)close()});
  document.body.append(sheet);mount(body,{referral:!!document.querySelector('meta[name="ayneh-biz"]')&&!document.body.classList.contains('is-studio'),onCredited:credited});
 }
 function button(){return el('button',{class:'btn btn--soft btn--sm',type:'button',text:'عکس بیشتر می‌خواهید؟ شارژ سکه',onclick:open})}
 window.AynehPacks={mount:mount,open:open,out:open,button:button,me:me,visitor:visitor,coinSVG:coinSVG};
})();
`;

/* The sheet on every salon page (index.js adds it). Inert until the page runs out of images. */
export const packsTag = '<style>' + packsCSS + '</style><script>' + packsJS + '</script>';

