import legacy from './legacy.js';
import {appHTML} from './ui.js';
import {customerHTML} from './customer.js';
import {panelHTML} from './panel.js';
import {api,errorResponse,tick} from './server.js';
import {must} from './domain.js';
import {identity} from './auth.js';
import {fontResponse} from './fonts.js';
import {webhook,baleWebhook} from './telegram.js';
import {favicon,baseCSS} from './design.js';
import {sharePage} from './share.js';
import {consultShare,consultShareImage} from './consult.js';
import {landingHTML,servicePages,pricingHTML} from './landing.js';
import {packsTag} from './regularpage.js';
import {isBiz,bizOrigin,mainOrigin} from './hosts.js';
import {CODE_RE} from './rewards.js';
import {directSalon} from './customers.js';
import {refCookie} from './rewards.js';
import {iphonePage} from './payapp.js';
const htmlHeaders={'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",'Permissions-Policy':'camera=(self), geolocation=(), microphone=()'};
// Only real pages are served the app shell; everything else is a 404, never a blank app page.
const pages=[/^\/admin\/?$/,/^\/admin\/[a-z0-9-]{1,64}\/?$/,/^\/s\/[a-z0-9-]{1,64}\/?$/,/^\/i\/[a-z0-9-]{1,64}\/?$/,/^\/panel\/?$/,/^\/pay\/?$/,/^\/signin-with-chatgpt(\/.*)?$/,/^\/share\/[a-f0-9]{64}(\/img)?\/?$/];
const notFound='<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#e8edeb"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><title>صفحه پیدا نشد | آینه</title><style>'+baseCSS+'.nf{min-height:100vh;display:grid;place-items:center;padding:32px 20px;text-align:center}.nf main{display:grid;justify-items:center;gap:18px;max-width:420px}.nf .mirror{width:150px}.nf .mirror__glass{aspect-ratio:3/4}.nf h1{font-family:var(--display);font-weight:800;font-size:32px}.nf p{color:var(--muted);line-height:2}</style></head><body class="nf"><main><div class="mirror"><div class="mirror__glass"></div></div><h1>این صفحه پیدا نشد</h1><p>نشانی اشتباه است یا صفحهٔ سالن برداشته شده. لینک اختصاصی سالن را دوباره باز کنید.</p><a class="btn btn--primary" href="/">صفحهٔ اصلی آینه</a></main></body></html>';
// Link previews (Telegram, WhatsApp, Instagram, iMessage) read these tags, so each salon page
// carries its own name, description and cover instead of the generic Ayneh ones.
const attr=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RESERVED_SUBS=new Set(['www','api','admin','panel','pay','app','mail','ftp','cdn','static','assets','business']);
/* Two sides of one worker (owner's decision, Nov 2026): the customers' site is the main domain
   (ayneh-salon.site), the salons' site is business.<main> (business.ayneh-salon.site). Both are
   served here; the API, panel, owner console and payment app answer on both, so no login, shared
   link or webhook breaks. Pages of the other side redirect there (301) with their query intact. */
const moved=(to)=>new Response(null,{status:301,headers:{Location:to,'Cache-Control':'public,max-age=3600'}});

function subdomainOf(u,env){
 const host=u.hostname.toLowerCase();
 const roots=['ayneh-salon.site'];
 try{const h=new URL(env.APP_ORIGIN||'').hostname.toLowerCase().replace(/^www\./,'');if(h&&!roots.includes(h)&&h!=='localhost'&&!/^\d+\.\d+\.\d+\.\d+$/.test(h)&&!h.endsWith('.run.app'))roots.push(h)}catch{}
 for(const r of roots){
  if(host.endsWith('.'+r)){
   const sub=host.slice(0,-(r.length+1));
   if(/^[a-z][a-z0-9-]{1,45}[a-z0-9]$/.test(sub)&&!RESERVED_SUBS.has(sub))return sub;
  }
 }
 return '';
}
async function salonPage(u,env,forcedSlug=''){
 const slug=forcedSlug||u.pathname.split('/')[2];let salon=null;
 let failed=!env.DB;try{salon=env.DB?await env.DB.prepare('SELECT slug,name,profile FROM salons WHERE slug=?').bind(slug).first():null}catch{failed=true}
 // A database hiccup still serves the page (it shows its own error); only a missing salon is a 404.
 if(!salon)return failed||slug==='demo'?customerHTML:null;
 let p={};try{p=JSON.parse(salon.profile||'{}')}catch{}
 const origin=env.APP_ORIGIN||u.origin,url=forcedSlug?(u.origin+'/'):(origin+'/s/'+salon.slug);
 const title=salon.name+' | مو، ناخن و مژهٔ بعدی‌ات را روی عکس خودت ببین';
 const desc=(p.bio?String(p.bio).slice(0,150)+' ':'')+'مدل مو، طرح ناخن یا مژه را روی عکس خودت امتحان کن و برای سالن بفرست.';
 const img=p.cover||p.logo?(forcedSlug?u.origin:origin)+'/api/s/'+salon.slug+'/media/'+(p.cover||p.logo):'';
 const tags='<title>'+attr(title)+'</title>\n<meta name="ayneh-slug" content="'+attr(salon.slug)+'">\n<meta name="description" content="'+attr(desc)+'">\n<meta property="og:title" content="'+attr(title)+'">\n<meta property="og:description" content="'+attr(desc)+'">\n<meta property="og:type" content="website">\n<meta property="og:url" content="'+attr(url)+'">\n<meta property="og:site_name" content="آینه">\n<meta property="og:locale" content="fa_IR">\n'+(img?'<meta property="og:image" content="'+attr(img)+'">\n<meta property="og:image:alt" content="'+attr(salon.name)+'">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="'+attr(img)+'">\n':'<meta name="twitter:card" content="summary">\n')+'<link rel="canonical" href="'+attr(url)+'">';
 return customerHTML.replace(/<meta name="description"[^>]*>\n?/,'').replace(/<meta property="og:[a-z:]+"[^>]*>\n?/g,'').replace(/<title>[^<]*<\/title>/,tags).replace('</body>',()=>packsTag+'</body>');
}
/* The customers' studio («/» on the main domain): the direct salon's own try-on page, which runs
   in studio mode (customer.js: wallet, no salon) — one page, one scroll, no frame. */
async function studioPage(u,env,slug){
 const M=mainOrigin(u,env),B=bizOrigin(u,env);
 const title='آینه | روی عکس خودت ببین چی بهت میاد';
 const desc='مدل مو، رنگ مو، ناخن و مژه را قبل از رفتن به آرایشگاه روی عکس خودتان ببینید. بدون نصب؛ ۲ عکس اول هدیه است.';
 const tags='<title>'+title+'</title>\n<meta name="ayneh-slug" content="'+attr(slug)+'">\n<meta name="description" content="'+desc+'">\n<link rel="canonical" href="'+M+'/">\n<meta property="og:title" content="'+title+'">\n<meta property="og:description" content="'+desc+'">\n<meta property="og:type" content="website">\n<meta property="og:url" content="'+M+'/">\n<meta property="og:site_name" content="آینه">\n<meta property="og:image" content="'+M+'/landing/og.jpg">\n<meta name="ayneh-biz" content="'+attr(B)+'">\n<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:'آینه',url:M+'/',applicationCategory:'LifestyleApplication',inLanguage:'fa-IR',offers:{'@type':'Offer',price:'0',priceCurrency:'IRR',description:'۲ عکس اول رایگان'}})+'</script>';
 return customerHTML.replace(/<meta name="description"[^>]*>\n?/,'').replace(/<meta property="og:[a-z:]+"[^>]*>\n?/g,'').replace(/<title>[^<]*<\/title>/,tags).replace('</body>',()=>packsTag+'</body>');
}
const PAY_LOGO='<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" style="border-radius:22px;display:block;margin:0 auto;box-shadow:0 10px 26px rgba(6,143,108,.3)" viewBox="0 0 108 108"> <defs> <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#17B48B"/><stop offset="1" stop-color="#045A46"/> </linearGradient> <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#1FC59A"/><stop offset="1" stop-color="#077257"/> </linearGradient> </defs> <rect width="108" height="108" fill="url(#bg)"/> <g transform="rotate(-14 54 54)"> <ellipse cx="54" cy="44" rx="19.5" ry="23" fill="#FFFFFF"/> <ellipse cx="54" cy="44" rx="14.6" ry="18.1" fill="url(#glass)"/> <ellipse cx="54" cy="44" rx="17.1" ry="20.6" fill="none" stroke="#0A7A5E" stroke-opacity="0.25" stroke-width="0.9"/> <path d="M43.4,37.5 C44.6,32.4 48.4,28.8 53,28" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="2.2" stroke-linecap="round"/> <path d="M46.4,45 L51.8,50.4 L62.4,39.4" fill="none" stroke="#FFFFFF" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/> <path d="M49.2,66.2 C51,67.6 57,67.6 58.8,66.2 L57.6,71.4 L50.4,71.4 Z" fill="#FFFFFF"/> <path d="M51,71 L57,71 L56.2,87.6 C56.1,89.2 55.2,90.2 54,90.2 C52.8,90.2 51.9,89.2 51.8,87.6 Z" fill="#FFFFFF"/> <circle cx="54" cy="77.2" r="1.3" fill="#0A7A5E" fill-opacity="0.35"/> </g> <path d="M79,24 L80.5,28.3 L84.8,29.8 L80.5,31.3 L79,35.6 L77.5,31.3 L73.2,29.8 L77.5,28.3 Z" fill="#FFE3A3"/> <path d="M30.5,62 L31.3,64.2 L33.5,65 L31.3,65.8 L30.5,68 L29.7,65.8 L27.5,65 L29.7,64.2 Z" fill="#FFFFFF" fill-opacity="0.7"/> </svg> ';
function appPage(ready,ver=''){
 const steps=['فایل را دانلود و نصب کنید. اگر اندروید پرسید، «اجازه از این منبع» را روشن کنید.','اپ «آینه‌پی» را باز کنید و کد ۶ رقمی را از پنل مدیر (پرداخت و پنل) وارد کنید.','سه دکمهٔ «اجازه بده» را بزنید. تمام؛ واریزها خودکار تأیید می‌شوند.'];
 return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#FCF3EB"><link rel="icon" href="/favicon.ico" sizes="48x48"><title>آینه‌پی | اپ تأیید خودکار واریز</title><style>@font-face{font-family:Vazirmatn;src:url(/fonts/vazirmatn-arabic.woff2) format("woff2");font-weight:100 900}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#FCF3EB;color:#0A202A;font-family:Vazirmatn,system-ui,sans-serif;padding:24px}main{max-width:440px;width:100%;display:grid;gap:18px;text-align:center}.logo{width:76px;height:76px;margin:0 auto;border-radius:22px;background:linear-gradient(155deg,#0A8F6C,#0A6B54);display:grid;place-items:center;color:#fff;font-size:34px;font-weight:900;box-shadow:0 10px 26px rgba(6,143,108,.3)}h1{margin:0;font-size:26px}p{margin:0;color:#4A5C5C;line-height:1.9}.btn{display:block;padding:16px;border-radius:999px;background:#068F6C;color:#fff;font-weight:800;font-size:17px;text-decoration:none;box-shadow:0 8px 20px rgba(6,143,108,.3)}.btn[aria-disabled=true]{background:#9BB5AC;box-shadow:none}ol{text-align:start;background:#fff;border-radius:20px;padding:18px 36px 18px 18px;margin:0;line-height:2;color:#12333C;border:1px solid #EDE0D2}small{color:#5D6B68}</style></head><body><main>'+PAY_LOGO+'<h1>آینه‌پی</h1><p>پیامک واریز بلو را می‌خواند و سفارش آینه را خودکار تأیید می‌کند.</p>'+(ready?'<a class="btn" href="/app/ayneh-pay.apk" download>دانلود اپ اندروید</a>'+(ver?'<small>نسخهٔ '+attr(ver)+'</small>':''):'<a class="btn" aria-disabled="true">اپ در حال آماده‌سازی است؛ چند دقیقهٔ دیگر سر بزنید</a>')+'<ol>'+steps.map(s=>'<li>'+s+'</li>').join('')+'</ol><a class="btn" style="background:#fff;color:#0A6B54;box-shadow:none;border:1px solid #BFE3D6" href="/app/i">آیفون دارید؟ نسخهٔ آیفون</a></main></body></html>';
}
export default {
 async fetch(request,env){try{const u=new URL(request.url);
  if(u.pathname==='/api/internal/tick'){must(request.method==='POST','متد مجاز نیست',405);must(env.JOB_TOKEN&&request.headers.get('Authorization')==='Bearer '+env.JOB_TOKEN,'دسترسی مجاز نیست',403);return Response.json(await tick(env,u.origin));}
  const oldApi=['/api/config','/api/create','/api/status','/api/views'].includes(u.pathname);if(u.pathname==='/legacy'||oldApi){const who=await identity(request,env);must(who&&(who.via==='password'||who.email===env.OWNER_EMAIL),'این استودیو فقط برای مدیر پروژه است',403);return legacy.fetch(request,env);}
  if(u.pathname==='/api/telegram/webhook')return await webhook(request,env);
  if(u.pathname.startsWith('/api/bale/webhook/'))return await baleWebhook(request,env,decodeURIComponent(u.pathname.slice(18)));
  if(u.pathname.startsWith('/api/'))return await api(request,env);
  if(u.pathname==='/favicon.svg')return new Response(favicon,{headers:{'Content-Type':'image/svg+xml','Cache-Control':'public,max-age=86400'}});
  if(u.pathname.startsWith('/fonts/')){const f=fontResponse(u.pathname.slice(7));if(f)return f;}
  const sub=subdomainOf(u,env);
  if(sub){
   if(/^\/(?:admin|panel)\/?$/.test(u.pathname))return new Response(panelHTML.replace('</head>','<meta name="ayneh-user" content="'+attr(sub)+'"><meta name="ayneh-biz" content="'+attr(bizOrigin(u,env))+'"></head>'),{headers:{...htmlHeaders,'X-Robots-Tag':'noindex'}});
   if(u.pathname==='/'||u.pathname===''){const html=await salonPage(u,env,sub);return html?new Response(html,{headers:{...htmlHeaders,'X-Frame-Options':'SAMEORIGIN','Content-Security-Policy':htmlHeaders['Content-Security-Policy'].replace("frame-ancestors 'none'","frame-ancestors 'self'")}}):new Response(notFound,{status:404,headers:htmlHeaders});}
  }
  // /pay is the checkout's own address (shared links and the QR on a receipt); the landing
  // page carries the same sheet inline, so both land on the same server-side order.
  if(/^\/panel\/?$/.test(u.pathname))return new Response(panelHTML.replace('</head>','<meta name="ayneh-biz" content="'+attr(bizOrigin(u,env))+'"></head>'),{headers:{...htmlHeaders,'X-Robots-Tag':'noindex'}});
  if(/^\/pay\/?$/.test(u.pathname)&&isBiz(u))return new Response(pricingHTML.replaceAll('__ORIGIN__',bizOrigin(u,env)).replaceAll('__MAIN__',mainOrigin(u,env)).replaceAll('__CANON__','/pricing'),{headers:{...htmlHeaders,'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  if(u.pathname==='/salon-preview')return new Response(customerHTML,{headers:{...htmlHeaders,'X-Frame-Options':'SAMEORIGIN','X-Robots-Tag':'noindex','Content-Security-Policy':htmlHeaders['Content-Security-Policy'].replace("frame-ancestors 'none'","frame-ancestors 'self'")}});
  /* The landing page is the one thing the owner keeps reloading while we work on it, and a
     five-minute max-age with an hour of stale-while-revalidate meant a phone could show a
     build from an hour ago while the server was already serving the new one. The page is not
     an asset: let the browser revalidate it every time, cheaply (304 via ETag below). */
  /* ?ref=CODE on a public page keeps the referral in a first-party cookie (worker/rewards.js). */
  // Search engines: the public pages only; panels, the owner console, the API and salon pages stay out.
  const biz=isBiz(u),M=mainOrigin(u,env),B=bizOrigin(u,env);
  const page=(html,canon,extra={})=>new Response(html.replaceAll('__ORIGIN__',B).replaceAll('__MAIN__',M).replaceAll('__CANON__',canon),{headers:{...htmlHeaders,'Cache-Control':'no-cache',...refCookie(u,request),...extra}});
  /* Search engines: each side lists its own public pages; panels, the console, the API and salon pages stay out. */
  if(u.pathname==='/robots.txt')return new Response('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /panel\nDisallow: /pay\nDisallow: /new\nDisallow: /s/\nDisallow: /share/\nDisallow: /app\n\nSitemap: '+(biz?B:M)+'/sitemap.xml\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public,max-age=3600'}});
  if(u.pathname==='/sitemap.xml'){const o=biz?B:M,list=biz?['/','/hair','/color','/nails','/lashes','/salon-panel','/sample','/pricing']:['/'];return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+list.map(p=>'<url><loc>'+o+p+'</loc></url>').join('\n')+'\n</urlset>\n',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public,max-age=3600'}});}
  /* «خرید اشتراک و اعتبار» (pricing v2): on both hosts, so a salon panel signed in on either one
     buys with its own cookie and no form; the canonical address is the salons' site. */
  if(/^\/pricing\/?$/.test(u.pathname))return page(pricingHTML,'/pricing',{'Cache-Control':'no-store'});
  const svc=u.pathname.match(/^\/(hair|color|nails|lashes|salon-panel|sample)\/?$/);
  if(biz){
   /* business.: the salon home, the service pages and the plan checkout. */
   if(u.pathname==='/')return page(landingHTML,'/');
   if(/^\/salons\/?$/.test(u.pathname))return moved('/'+u.search);
   if(svc)return page(servicePages[svc[1]==='salon-panel'?'salon':svc[1]],'/'+svc[1]);
   if(u.pathname==='/new')return page(landingHTML,'/',{'Cache-Control':'no-store','X-Robots-Tag':'noindex'});
   /* The customer side lives on the main domain; a salon page embedded on these pages (?embed=1) stays. */
   if(/^\/(?:studio|try)\/?$/.test(u.pathname))return moved(M+'/'+u.search);
   if(/^\/(?:s|i)\//.test(u.pathname)&&!/[?&]embed=1(?:&|$)/.test(u.search))return moved(M+u.pathname+u.search);
  }else{
   /* Plan referral links (?ref=R…) handed out before the split point here: they belong to the salons' site,
      where plans are bought and where the referral cookie must be set. */
   if(u.pathname==='/'&&CODE_RE.test(String(u.searchParams.get('ref')||'').toUpperCase()))return moved(B+'/'+u.search);
   /* The main domain is the customers' site: «/» is their studio. */
   if(u.pathname==='/'){must(env.DB,'پایگاه داده هنوز آماده نیست',503);const d=await directSalon(env.DB);const html=await studioPage(u,env,d.slug);return new Response(html,{headers:{...htmlHeaders,'Cache-Control':'no-cache',...refCookie(u,request)}});}
   if(/^\/(?:studio|try)\/?$/.test(u.pathname))return moved('/'+u.search);
   /* «ورود یا ثبت‌نام»: the studio page in its sign-in screen (customer.js accountMode). */
   const acct=u.pathname.match(/^\/(login|signup|profile)\/?$/);
   if(acct){must(env.DB,'پایگاه داده هنوز آماده نیست',503);const d=await directSalon(env.DB);const title={login:'ورود',signup:'ثبت‌نام',profile:'پروفایل من'}[acct[1]];return new Response((await studioPage(u,env,d.slug)).replace(/<title>[^<]*<\/title>/,'<title>'+title+' | آینه</title>').replace('<link rel="canonical" href="'+M+'/">','<link rel="canonical" href="'+M+'/'+acct[1]+'"><meta name="robots" content="noindex">'),{headers:{...htmlHeaders,'Cache-Control':'no-cache'}});}
   /* Salon pages moved to business.; old links, ads and ?ref= links keep working. */
   if(/^\/salons\/?$/.test(u.pathname))return moved(B+'/'+u.search);
   if(svc||u.pathname==='/new'||/^\/pay\/?$/.test(u.pathname))return moved(B+u.pathname+u.search);
  }
  /* Hit when a preview is holding an old copy and no amount of reloading helps: a URL that
     has never existed cannot be cached, so /new serves the current build under a fresh path.
     It carries no robots policy change — it is the same page, just honest about being new. */
  /* The owner's Android payment app (android/): the APK is a static file built by deploy.yml
     (public/app/ayneh-pay.apk, served before the worker); this is its download page. */
  if(/^\/app\/i\/?$/.test(u.pathname))return new Response(iphonePage,{headers:{...htmlHeaders,'X-Robots-Tag':'noindex','Referrer-Policy':'no-referrer'}});
  if(/^\/app\/?$/.test(u.pathname)){let ver='';try{const r=env.ASSETS?await env.ASSETS.fetch(new Request(u.origin+'/app/version.txt')):null;if(r&&r.ok)ver=(await r.text()).trim().slice(0,20)}catch{}return new Response(appPage(!!ver,ver),{headers:{...htmlHeaders,'X-Robots-Tag':'noindex'}});}
  if(!pages.some(r=>r.test(u.pathname)))return new Response(notFound,{status:404,headers:htmlHeaders});
  if(/^\/i\/[a-z0-9-]{1,64}\/?$/.test(u.pathname)){const html=await sharePage(u,env);return new Response(html||notFound,{status:html?200:404,headers:htmlHeaders});}
 /* The consultant's one-time link for the stylist (worker/consult.js): GET only shows the
    «باز کردن برگه» landing (previews/refreshes never consume it), the POST opens and burns it;
    dead after the grace window or 72 hours; never indexed, never cached. */
 if(/^\/share\/[a-f0-9]{64}\/?$/.test(u.pathname)){const r=await consultShare(u,env,request.method);return new Response(r.html||notFound,{status:r.status,headers:{...htmlHeaders,'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});}
 if(/^\/share\/[a-f0-9]{64}\/img\/?$/.test(u.pathname))return consultShareImage(u,env);
  if(/^\/s\/[a-z0-9-]{1,64}\/?$/.test(u.pathname)){const html=await salonPage(u,env);return html?new Response(html,{headers:{...htmlHeaders,'X-Frame-Options':'SAMEORIGIN','Content-Security-Policy':htmlHeaders['Content-Security-Policy'].replace("frame-ancestors 'none'","frame-ancestors 'self'")}}):new Response(notFound,{status:404,headers:htmlHeaders});}
  return new Response(appHTML,{headers:htmlHeaders});
 }catch(e){return errorResponse(e)}},
 async scheduled(event,env,ctx){ctx.waitUntil(tick(env,env.APP_ORIGIN||''))}
};
