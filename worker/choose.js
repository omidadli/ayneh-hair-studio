// «/»: the first question (owner's decision, Nov 2026) — customer or salon. Nothing else is on
// this page. A customer goes to /studio (her own page), a hairdresser or salon to /salons (the
// business home that used to live at «/»). The last choice is remembered only to mark it.
import {fontFaces, markSVG} from './design.js';

const css = String.raw`
:root{--cream:#FCF3EB;--cream-3:#F6E7DB;--paper:#fff;--ink:#0A202A;--ink-2:#12333C;--muted:#5D6B68;--emerald:#068F6C;--emerald-deep:#0A6B54;--wash:#E4F4EE;--line:#EDE0D2;--gold:#E9B949;--gold-soft:#F4E6CC;--gold-ink:#6B4A0E;--ease:cubic-bezier(.22,.72,.22,1);--font:"Estedad","Vazirmatn",system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{background:radial-gradient(120% 80% at 100% 0,#F6E7DB 0,transparent 60%),radial-gradient(90% 70% at 0 100%,#E4F4EE 0,transparent 60%),var(--cream);color:var(--ink);font:400 16px/1.8 var(--font);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.ch{min-height:100svh;max-width:980px;margin:0 auto;padding:22px 18px calc(28px + env(safe-area-inset-bottom,0px));display:grid;align-content:center;gap:26px}
.ch-brand{display:flex;align-items:center;gap:10px;justify-content:center;font-weight:800;font-size:20px}
.ch-brand svg{width:30px;height:44px}
.ch-head{text-align:center;display:grid;gap:6px}
.ch-head h1{margin:0;font-weight:800;font-size:clamp(26px,6.4vw,40px);line-height:1.4}
.ch-head p{margin:0;color:var(--muted);font-size:16px}
.ch-cards{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:640px){.ch-cards{grid-template-columns:1fr}}
.ch-card{position:relative;display:grid;grid-template-rows:auto 1fr;overflow:hidden;border-radius:28px;background:var(--paper);border:2px solid transparent;box-shadow:0 22px 50px -28px rgba(10,32,42,.45);transition:transform .2s var(--ease),border-color .2s,box-shadow .2s;min-height:44px}
.ch-card:hover{transform:translateY(-3px);box-shadow:0 30px 60px -28px rgba(10,32,42,.5)}
.ch-card:active{transform:scale(.99)}
.ch-card:focus-visible{outline:3px solid #054b3c;outline-offset:4px}
.ch-card img{width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;object-position:50% 22%;background:var(--cream-3)}
@media (max-width:640px){.ch-card img{aspect-ratio:16/8}}
.ch-body{display:grid;gap:8px;align-content:start;padding:18px 20px 20px}
.ch-tag{justify-self:start;font-size:12.5px;font-weight:800;padding:3px 11px;border-radius:999px;background:var(--wash);color:var(--emerald-deep)}
.ch-card--pro .ch-tag{background:var(--cream-3);color:var(--ink-2)}
.ch-body h2{margin:0;font-size:22px;font-weight:800;line-height:1.45}
.ch-body p{margin:0;color:var(--ink-2);font-size:15px}
.ch-go{margin-top:6px;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 20px;border-radius:16px;background:var(--emerald);color:#fff;font-weight:800;font-size:16px}
.ch-card--pro .ch-go{background:var(--ink)}
.ch-gift{position:absolute;top:14px;inset-inline-start:14px;padding:5px 12px;border-radius:999px;background:var(--gold-soft);color:var(--gold-ink);border:1px solid var(--gold);font-weight:800;font-size:13px}
.ch-last{position:absolute;top:14px;inset-inline-end:14px;padding:4px 10px;border-radius:999px;background:rgba(10,32,42,.78);color:#fff;font-size:12px;font-weight:700}
.ch-card[data-last] {border-color:var(--emerald)}
.ch-foot{text-align:center;font-size:13px;color:var(--muted)}
.ch [hidden]{display:none!important}
@media (prefers-reduced-motion:reduce){.ch-card{transition:none}}
`;

const js = String.raw`
(function(){var q=location.search;var side='';try{side=localStorage.getItem('ayneh-side')||''}catch(e){}
document.querySelectorAll('.ch-card').forEach(function(a){
 /* ?ref=… (a referral link) travels with the choice; the cookie was set by this response too. */
 if(q)a.href=a.getAttribute('href')+q;
 if(a.dataset.side===side){a.setAttribute('data-last','');a.querySelector('.ch-last').hidden=false}
 a.addEventListener('click',function(){try{localStorage.setItem('ayneh-side',a.dataset.side)}catch(e){}});
});})();
`;

export const chooseHTML = '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#FCF3EB">'
  + '<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">'
  + '<title>آینه | قبل از آرایشگاه، مدل جدیدت رو ببین</title><meta name="description" content="آینه: مدل مو، رنگ، ناخن و مژه را قبل از رفتن به آرایشگاه روی عکس خودتان ببینید. برای آرایشگرها: صفحهٔ اختصاصی و امتحان مدل برای مشتری‌ها.">'
  + '<link rel="canonical" href="__ORIGIN__/"><meta property="og:title" content="آینه"><meta property="og:description" content="قبل از آرایشگاه، مدل جدیدت رو روی عکس خودت ببین."><meta property="og:image" content="__ORIGIN__/landing/hero.webp">'
  + '<style>' + fontFaces + css + '</style></head><body><main class="ch">'
  + '<div class="ch-brand"><span aria-hidden="true">' + markSVG + '</span>آینه</div>'
  + '<header class="ch-head"><h1>سلام! شما کدومید؟</h1><p>انتخاب کنید تا صفحهٔ مخصوص خودتون باز بشه.</p></header>'
  + '<nav class="ch-cards" aria-label="انتخاب مسیر">'
  + '<a class="ch-card" href="/studio" data-side="customer"><span class="ch-gift">۲ عکس اول هدیه</span><span class="ch-last" hidden>انتخاب قبلی شما</span><img src="/landing/demo-style-after.webp" alt="" width="640" height="400"><span class="ch-body"><span class="ch-tag">مشتری هستم</span><h2>می‌خوام مدل جدیدم رو ببینم</h2><p>مدل مو، رنگ مو، ناخن و مژه رو روی عکس خودت ببین؛ قبل از اینکه بری آرایشگاه.</p><span class="ch-go">بزن بریم <span aria-hidden="true">←</span></span></span></a>'
  + '<a class="ch-card ch-card--pro" href="/salons" data-side="salon"><span class="ch-last" hidden>انتخاب قبلی شما</span><img src="/landing/hero.webp" alt="" width="640" height="400"><span class="ch-body"><span class="ch-tag">آرایشگر یا آرایشگاه‌دار هستم</span><h2>برای کسب‌وکارم پنل آینه می‌خوام</h2><p>صفحهٔ اختصاصی، امتحان مدل برای مشتری‌هاتون و دریافت درخواست مستقیم توی پنل.</p><span class="ch-go">دیدن پنل‌ها <span aria-hidden="true">←</span></span></span></a>'
  + '</nav><p class="ch-foot">بعداً هم از بالای هر صفحه می‌تونید جابه‌جا بشید.</p></main><script>' + js + '</script></body></html>';
