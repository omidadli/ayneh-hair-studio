import {draftScript} from './draft.js';
import {styles} from './legacy.js';
import {NAIL_STYLES,LASH_STYLES,COLOR_STYLES,COLOR_SWATCHES,LINE_OPTIONS,LINE_COLORS,LINE_POPULAR,LINE_FILTERS,LINE_PHOTO,LINE_LABEL} from './lines.js';
import {QUESTIONS,ANALYSIS_FIELDS,RELEVANT} from './consult.js';
const lineJSON=(line,list)=>({styles:list.map(x=>[x[0],x[1],x[2]]),filters:LINE_FILTERS[line],options:(LINE_OPTIONS[line]||[]).map(o=>({key:o.key,label:o.label,items:o.items.map(i=>i[0])})),colors:(LINE_COLORS[line]||[]).map(c=>[c[0],c[1]]),popular:LINE_POPULAR[line]||[]});
const LINES_JSON=JSON.stringify({label:LINE_LABEL,photo:LINE_PHOTO,color:{...lineJSON('color',COLOR_STYLES),swatches:COLOR_SWATCHES},nails:lineJSON('nails',NAIL_STYLES),lashes:lineJSON('lashes',LASH_STYLES)});
import {baseCSS,markSVG} from './design.js';

const customerCSS=String.raw`
/* ---------- hero: full-width cover, logo on its edge, the name on one line ---------- */
.hero{position:relative;padding:14px 0 22px}
.hero__bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
.brand{display:inline-flex;align-items:center;gap:8px;color:var(--ink-2);font-size:13px;font-weight:600}
.brand svg{width:22px;height:32px}
.icon-btn{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center;color:var(--ink);transition:background-color .14s var(--ease),border-color .14s var(--ease)}
.icon-btn:hover{border-color:#b3c0bb}
.icon-btn svg{width:20px;height:20px}
.cover{position:relative;aspect-ratio:16/7;border-radius:var(--r-lg);background:var(--glass-2);box-shadow:var(--lift)}
.cover__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit}
.cover::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(180deg,rgba(255,255,255,.08),transparent 40%,rgba(20,14,10,.18));pointer-events:none}
.cover__glow{position:absolute;inset:0;border-radius:inherit;overflow:hidden;background:radial-gradient(60% 90% at 88% 0,rgba(255,255,255,.7),transparent 70%),radial-gradient(55% 80% at 8% 110%,rgba(214,166,92,.45),transparent 70%),radial-gradient(120% 140% at 85% 0,#cfe6e2 0,#a9cbc6 38%,#7fb0aa 70%,#5f9690 100%)}
.cover__logo{position:absolute;z-index:2;inset-inline-start:18px;bottom:-34px;width:74px;height:74px;border-radius:50%;object-fit:cover;border:4px solid var(--glass);background:var(--surface);box-shadow:0 10px 24px -12px rgba(35,23,15,.55)}
.cover__logo--ayneh{object-fit:contain;padding:8px;background:#fff}
.cover__logo--letter{display:grid;place-items:center;font-family:var(--display);font-weight:800;font-size:32px;color:var(--accent-ink);background:var(--surface)}
.hero__body{display:grid;gap:16px;padding:44px 4px 0}
.hero__text{min-width:0}
.hero__name{font-family:var(--display);font-weight:800;font-size:clamp(28px,8.4vw,52px);line-height:1.25;color:var(--ink);white-space:nowrap;overflow:hidden}
.hero__name.is-wrapped{white-space:normal;overflow-wrap:anywhere}
.hero__chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.hchip{display:inline-flex;align-items:center;gap:6px;max-width:100%;min-height:34px;padding:5px 12px;border:1px solid var(--line-2);border-radius:999px;background:var(--surface);color:var(--ink-2);font:inherit;font-size:12.5px;font-weight:600;text-decoration:none;cursor:default}
a.hchip,button.hchip{cursor:pointer}a.hchip:hover,button.hchip:hover{border-color:var(--line)}
.hchip__ico{display:inline-grid;color:var(--accent)}.hchip__ico svg{width:15px;height:15px}
.hchip__txt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62vw}
.hero__cta .btn{width:100%}
.btn--lg{min-height:54px;font-size:16px;padding-inline:26px}
@media(min-width:760px){
 .hero{padding:20px 0 30px}
 .cover{aspect-ratio:auto;height:280px}
 .cover__logo{width:104px;height:104px;bottom:-46px;inset-inline-start:30px;border-width:5px}
 .cover__logo--letter{font-size:44px}
 .hero__body{grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:28px;padding:16px 6px 0;padding-inline-start:156px;min-height:84px}
 .hero__cta .btn{width:auto}
 .hchip__txt{max-width:44ch}
}
/* ---------- steps: a three-part sequence ---------- */
.steps{position:sticky;top:0;z-index:30;background:rgba(232,237,235,.86);backdrop-filter:saturate(1.4) blur(14px);-webkit-backdrop-filter:saturate(1.4) blur(14px);border-bottom:1px solid var(--line-2)}
.steps__list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:10px 18px}
.steps__item{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 6px;border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;text-align:start;position:relative;border-radius:12px}
.steps__item::after{content:"";position:absolute;inset-inline:6px;bottom:2px;height:3px;border-radius:3px;background:var(--line)}
.steps__item.is-done::after{background:var(--accent)}
.steps__item.is-active::after{background:var(--ink)}
.steps__item.is-active{color:var(--ink)}
.steps__num{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;border:1.5px solid var(--line);color:var(--ink-2);font-size:12.5px;font-weight:700;flex:none;background:var(--surface)}
.steps__item.is-active .steps__num{background:var(--ink);border-color:var(--ink);color:#fff}
.steps__item.is-done .steps__num{background:var(--accent);border-color:var(--accent);color:#fff}
.steps__label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ---------- layout ---------- */
.layout{display:grid;grid-template-columns:minmax(0,1fr);gap:20px;padding:20px 0 28px}
@media(min-width:960px){.layout{grid-template-columns:minmax(0,1fr) 340px;gap:28px;align-items:start}.side{position:sticky;top:84px}}
.side{display:grid;gap:20px;min-width:0}
.flow{padding:22px 18px 24px;scroll-margin-top:84px}
@media(min-width:600px){.flow{padding:28px 30px 30px}}
.flow__head{margin-bottom:18px}
.flow__title{font-family:var(--display);font-weight:800;font-size:26px}
.flow__sub{font-size:13.5px;color:var(--muted);margin-top:4px;max-width:58ch;line-height:1.85}
.flow__nav{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap}
.flow__nav .btn--primary{flex:1;min-width:180px}
.dock.is-in{animation:dockIn .28s cubic-bezier(.2,.8,.2,1)}
@keyframes dockIn{from{transform:translateY(110%)}}
@media (prefers-reduced-motion:reduce){.dock.is-in{animation:none}}

/* ---------- step 1: the empty mirror ---------- */
.shoot{display:grid;gap:22px}
@media(min-width:700px){.shoot{grid-template-columns:260px minmax(0,1fr);align-items:center;gap:30px}}
.upload{position:relative;display:grid;place-items:center;align-content:center;gap:10px;width:min(100%,280px);margin:0 auto;aspect-ratio:3/4;padding:24px 18px;border:2px dashed #a9b8b2;border-radius:var(--arch);background:linear-gradient(170deg,#f6f9f8,#e3eae7);text-align:center;cursor:pointer;transition:border-color .15s var(--ease),background .15s var(--ease)}
.upload:hover,.upload.is-drag{border-color:var(--accent);background:linear-gradient(170deg,#f2f8f7,#d8ebe7)}
.upload__icon{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:#fff;box-shadow:0 12px 24px -12px rgba(7,76,77,.8)}
.upload__icon svg{width:27px;height:27px}
.upload strong{font-size:15px;line-height:1.6}
.upload__hint{font-size:12.5px;color:var(--muted);max-width:24ch;line-height:1.75}
.shoot__side{display:grid;gap:16px}
.shoot__btns{display:grid;gap:10px}
@media(min-width:420px){.shoot__btns{grid-template-columns:1fr 1fr}}
.tips{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.tip{display:flex;gap:11px;align-items:flex-start;font-size:13.5px;color:var(--ink-2);line-height:1.7}
.tip svg{width:18px;height:18px;flex:none;margin-top:3px;color:var(--accent)}
.tip b{font-weight:700;color:var(--ink)}
.photo{width:min(100%,320px);margin:0 auto}
.photo .mirror__glass{aspect-ratio:3/4}
.photo__bar{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:12px;font-size:13.5px;font-weight:600;color:var(--ink-2)}
.photo__bar span{display:inline-flex;align-items:center;gap:6px}
.photo__bar span svg{width:18px;height:18px;color:var(--accent)}
.upl{position:absolute;inset:0;display:grid;align-content:end;justify-items:center;gap:10px;padding:20px;background:linear-gradient(180deg,transparent 45%,rgba(8,32,32,.62));color:#fff;font-weight:700;font-size:14.5px}
.upl__scan{position:absolute;inset-inline:0;top:-35%;height:35%;background:linear-gradient(180deg,transparent,rgba(255,255,255,.5),transparent);animation:scan 1.5s ease-in-out infinite}
.upl__bar{width:70%;height:4px;border-radius:2px;background:rgba(255,255,255,.3);overflow:hidden}.upl__bar i{display:block;width:40%;height:100%;border-radius:2px;background:#fff;animation:slide 1.1s ease-in-out infinite}
@keyframes scan{to{top:100%}}@keyframes slide{0%{transform:translateX(160%)}100%{transform:translateX(-260%)}}
.photo__badge{position:absolute;inset:0;margin:auto;width:76px;height:76px;border-radius:50%;display:grid;place-items:center;background:var(--ok);color:#fff;box-shadow:0 0 0 8px rgba(255,255,255,.55),0 14px 30px -10px rgba(0,0,0,.45);animation:pop .55s var(--ease) both}
.photo__badge svg{width:38px;height:38px}
@keyframes pop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}
.photo__auto{height:4px;border-radius:2px;background:#dfe6e3;overflow:hidden;margin-top:14px}.photo__auto i{display:block;height:100%;width:0;background:var(--accent);animation:fill 1.8s linear forwards}
@keyframes fill{to{width:100%}}
.selfie{display:flex;align-items:center;gap:10px;padding:8px 10px;margin:0 0 14px;border-radius:16px;background:var(--glass)}
.selfie img{width:40px;height:52px;object-fit:cover;border-radius:20px 20px 6px 6px;flex:none}
.selfie div{display:grid;gap:2px}.selfie b{display:flex;align-items:center;gap:5px;font-size:13.5px}.selfie b svg{width:16px;height:16px;color:var(--ok)}.selfie span{font-size:12px;color:var(--muted)}
.selfie .btn{margin-inline-start:auto}
.pc-by{display:block;font-size:12px;color:var(--muted);margin-top:2px}
.steps__top{display:flex;justify-content:center;padding-top:10px}
.linesw{display:inline-grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px;border-radius:999px;background:var(--glass);box-shadow:inset 0 1px 2px rgba(0,0,0,.06);width:min(100%,500px)}
.linesw__btn{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:6px 8px;white-space:nowrap;border:0;border-radius:999px;background:transparent;color:var(--ink-2);font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:background .2s var(--ease),color .2s var(--ease),box-shadow .2s var(--ease)}
.linesw__btn svg{width:22px;height:22px;padding:3px;border-radius:50%;background:linear-gradient(145deg,#fff8ed,#e5cda4);color:#165d4b;box-shadow:inset 0 1px 2px #fff,0 3px 6px rgba(66,45,22,.25)}
.linesw__btn:hover{color:var(--ink)}
.linesw__btn{position:relative}
.linesw__btn.is-busy::after,.linesw__btn.is-ready::after{content:'';position:absolute;top:6px;left:8px;width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px #fff}
.linesw__btn.is-busy::after{animation:lsPulse 1.2s ease-in-out infinite}
@keyframes lsPulse{50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){.linesw__btn.is-busy::after{animation:none}}
.linesw__btn.is-on{color:#fff}
.linesw__btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.opt{margin-top:16px}.opt .lbl{margin-bottom:6px}
.opt-row{flex-wrap:wrap}
@media (prefers-reduced-motion:reduce){.linesw__btn{transition:none}}
#invite{margin:22px 0 0}
.invite{position:relative;overflow:hidden;display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;width:100%;padding:20px;border:0;border-radius:var(--r-lg);background:radial-gradient(120% 140% at 100% 0,#16716f 0,#0c4f50 55%,#083a3b 100%);color:#fff;text-align:start;font:inherit;cursor:pointer;box-shadow:0 22px 40px -24px rgba(7,60,60,.9);transition:transform .2s var(--ease)}
.invite:hover{transform:translateY(-2px)}.invite:focus-visible{outline:3px solid var(--honey);outline-offset:3px}
.invite::after{content:"";position:absolute;inset:auto -40px -60px auto;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(214,166,92,.35),transparent 70%);pointer-events:none}
.invite__pics{position:relative;width:112px;height:92px;flex:none}
.invite__pics img,.invite__pics span{position:absolute;bottom:0;width:52px;height:68px;object-fit:cover;border-radius:26px 26px 8px 8px;border:3px solid rgba(255,255,255,.9);background:#cfdcd8;box-shadow:0 8px 16px -8px rgba(0,0,0,.5)}
.invite__pics :nth-child(1){inset-inline-start:6px;transform:rotate(8deg)}.invite__pics :nth-child(2){inset-inline-start:30px;bottom:14px;z-index:1;width:56px;height:74px}.invite__pics :nth-child(3){inset-inline-start:56px;transform:rotate(-8deg)}
.invite__txt{display:grid;gap:6px;position:relative;z-index:1}
.invite__txt b{font-family:var(--display);font-weight:800;font-size:19px;line-height:1.5}
.invite__txt > span{font-size:13.5px;line-height:1.9;color:rgba(255,255,255,.85)}
.invite__cta{justify-self:start;display:inline-flex;align-items:center;gap:8px;margin-top:6px;padding:10px 16px;border-radius:999px;background:var(--honey);color:#2a1a08;font-weight:800;font-size:14px}
.invite__cta svg{width:18px;height:18px}
@media (max-width:420px){.invite{grid-template-columns:1fr;justify-items:start}.invite__pics{height:84px}}
.share__prev{display:flex;gap:12px;align-items:center;padding:12px;border-radius:16px;background:var(--glass);margin:4px 0 16px}
.share__prev img,.share__prev .share__logo{width:46px;height:46px;border-radius:12px;object-fit:cover;flex:none;background:var(--accent);display:grid;place-items:center;color:#fff;font-weight:800}
.share__prev div{display:grid;gap:2px;min-width:0}.share__prev b{font-size:14.5px}.share__prev span{font-size:12px;color:var(--muted);direction:ltr;text-align:end;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.share__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.share__opt{display:grid;justify-items:center;gap:8px;padding:14px 6px;border-radius:16px;color:var(--ink);font:inherit;font-size:13px;font-weight:700;text-decoration:none;cursor:pointer;transition:background .15s var(--ease),transform .15s var(--ease)}
.share__opt:hover{filter:brightness(1.04)}
.share__ic{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;color:#fff}.share__ic svg{width:24px;height:24px}
.share__note{margin-top:14px;font-size:12.5px;color:var(--muted);line-height:1.9;text-align:center}
@media (prefers-reduced-motion:reduce){.invite,.share__opt{transition:none}.invite:hover,.share__opt:hover{transform:none}}
@media (prefers-reduced-motion:reduce){.upl__scan,.upl__bar i,.photo__badge{animation:none}.photo__auto i{animation:none;width:100%}}

.collapse{border-top:1px solid var(--line-2);padding-top:12px;font-size:13px;color:var(--muted)}
.collapse summary{cursor:pointer;font-weight:600;color:var(--ink-2);list-style:none;display:flex;align-items:center;gap:7px}
.collapse summary::-webkit-details-marker{display:none}
.collapse summary svg{width:17px;height:17px;color:var(--accent)}
.collapse p{margin-top:8px;line-height:1.95}

/* ---------- step 2: choosing a look ---------- */
.seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;background:var(--glass);padding:4px;border-radius:16px;margin-bottom:18px}
.seg button{min-height:42px;border:0;background:transparent;border-radius:12px;font-size:13px;font-weight:600;color:var(--ink-2);padding:0 6px;transition:background-color .14s var(--ease),color .14s var(--ease)}
.seg button[aria-selected="true"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px rgba(35,23,15,.12)}
.look-search{position:relative;margin:0 0 12px}
.look-search__in{width:100%;min-height:48px;padding:0 44px 0 14px;border:1.5px solid var(--line,#e2d0be);border-radius:14px;background:#fff;font:inherit;font-size:15px;color:var(--ink)}
.look-search__in:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.look-search__ico{position:absolute;inset-inline-start:14px;top:50%;width:18px;height:18px;margin-top:-9px;color:var(--accent);pointer-events:none}
.look-search__ico svg{width:18px;height:18px}
.custom-look{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:12px 14px;border:1.5px dashed var(--accent);border-radius:16px;background:color-mix(in srgb,var(--accent) 7%,#fff);color:var(--ink);font:inherit;text-align:start;cursor:pointer}
.custom-look.is-on{border-style:solid;background:color-mix(in srgb,var(--accent) 14%,#fff)}
.custom-look b{display:block;font-size:15px}.custom-look small{display:block;color:var(--ink-2);font-size:12.5px;margin-top:2px}
.custom-look__ico{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--accent);color:#fff}.custom-look__ico svg{width:20px;height:20px}
.filters{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:14px;scrollbar-width:none}
.filters::-webkit-scrollbar{display:none}
.filters .chip{flex:none}
.looks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media(min-width:600px){.looks{grid-template-columns:repeat(3,minmax(0,1fr))}}
.style-card{display:grid;gap:2px;align-content:start;min-height:84px;padding:14px 14px 12px;border:1.5px solid var(--line-2);background:var(--surface-2);border-radius:var(--r);text-align:start;transition:border-color .14s var(--ease),background-color .14s var(--ease)}
.style-card:hover{border-color:var(--line)}
.style-card.is-on{border-color:var(--ink);background:#fff;box-shadow:0 0 0 3px rgba(35,23,15,.08)}
.style-card.is-flash{animation:cardFlash1.2s var(--ease)}
@keyframes cardFlash{0%{box-shadow:0 0 0 0 rgba(35,23,15,.5)}60%{box-shadow:0 0 0 10px rgba(35,23,15,.14)}100%{box-shadow:0 0 0 0 rgba(35,23,15,0)}}
@media (prefers-reduced-motion:reduce){.style-card.is-flash{animation:none;outline:2px solid var(--ink);outline-offset:3px}}
.style-card__name{font-family:var(--display);font-weight:800;font-size:19px;color:var(--ink);line-height:1.35}
.style-card__en{font-size:12px;color:var(--muted);direction:ltr;text-align:end}
.style-card__tag{font-size:12px;color:var(--accent-ink);font-weight:600;margin-top:4px}
.rail{display:grid;grid-auto-flow:column;grid-auto-columns:138px;gap:12px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x mandatory;scrollbar-width:thin}
.port-card{scroll-snap-align:start;border:0;background:transparent;padding:0;text-align:start}
.port-card .mirror{padding:5px;transition:box-shadow .14s var(--ease)}
.port-card .mirror__glass{aspect-ratio:3/4}
.port-card span.pc-name{display:block;padding:8px 4px 0;font-size:13px;color:var(--ink-2);font-weight:600}
.port-card.is-on .mirror{box-shadow:0 0 0 3px var(--accent),var(--lift)}
.port-card.is-on span.pc-name{color:var(--accent-ink)}
.picked{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding:10px 12px 10px 10px;border-radius:14px;background:var(--accent-soft);color:var(--accent-ink);font-size:13.5px;font-weight:600}
.picked .btn{min-height:34px}
.ref-photo{width:min(100%,240px);margin:14px auto 0}
.ref-photo .mirror__glass{aspect-ratio:3/4}

/* ---------- step 3: result ---------- */
.summary{display:flex;gap:12px;align-items:center;padding:10px;border-radius:16px;background:var(--surface-2);border:1px solid var(--line-2)}
.summary img{width:52px;height:66px;object-fit:cover;border-radius:999px 999px 8px 8px;background:var(--glass-2)}
.summary__meta{font-size:12.5px;color:var(--muted)}
.summary b{display:block;font-size:14px;color:var(--ink)}
.stage{width:min(100%,360px);margin:18px auto 0}
.stage .mirror__glass{aspect-ratio:3/4;display:grid;place-items:center}
.stage__empty{position:relative;z-index:1;color:var(--muted);font-size:13px;text-align:center;padding:24px;max-width:22ch;line-height:1.9}
.compare-wrap{width:min(100%,400px);margin:18px auto 0}
.compare{position:relative;aspect-ratio:3/4;overflow:hidden;border-radius:999px 999px calc(var(--r) - 5px) calc(var(--r) - 5px);background:var(--glass-2);touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:ew-resize;direction:ltr}
.compare img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}
.compare__after{position:absolute;inset:0;clip-path:inset(0 var(--x,50%) 0 0)}
.compare__handle{position:absolute;top:0;bottom:0;left:calc(100% - var(--x,50%));width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.1),0 0 12px rgba(0,0,0,.25);pointer-events:none}
.compare__grip{position:absolute;inset-inline:0;margin-inline:auto;top:calc(58% - 23px);width:46px;height:46px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:var(--lift);color:var(--ink);transition:transform .15s var(--ease)}
.compare.is-dragging .compare__grip{transform:scale(1.12)}
.compare.is-animating .compare__after{transition:clip-path .28s var(--ease)}
.compare.is-animating .compare__handle{transition:left .28s var(--ease)}
.compare__grip svg{width:22px;height:22px}
.compare__range{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;inset-inline-start:0}
.compare:has(.compare__range:focus-visible){outline:3px solid var(--accent-ring);outline-offset:3px}
.compare__tag{position:absolute;bottom:12px;z-index:2;background:rgba(250,251,250,.94);padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700;color:var(--ink-2);pointer-events:none}
.compare__tag--before{right:12px}
.compare__tag--after{left:12px}
.compare__hint{text-align:center;font-size:12.5px;color:var(--muted);margin-top:10px}
.progress{display:grid;gap:10px;margin-top:18px}
.progress__bar{height:6px;border-radius:999px;background:var(--glass-2);overflow:hidden}
.progress__fill{height:100%;width:8%;border-radius:999px;background:var(--accent);transition:width .6s var(--ease)}
.rate-line{display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px solid var(--line-2)}
.rating{display:flex;gap:4px}
.rating button{width:42px;height:42px;border-radius:50%;border:0;background:transparent;font-size:22px;color:#c3ccc8;transition:color .14s var(--ease),transform .14s var(--ease)}
.rating button:hover{transform:scale(1.1)}
.rating button.is-on{color:var(--honey)}
.result-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}

/* ---------- side: portfolio, contact, requests ---------- */
.sidecard{padding:20px}
.sidecard h2{font-family:var(--display);font-weight:800;font-size:21px;margin-bottom:14px}
.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 12px}
@media(min-width:560px) and (max-width:959px){.gallery{grid-template-columns:repeat(3,minmax(0,1fr))}}
.pcard{border:0;padding:0;background:transparent;text-align:start}
.pcard .mirror{padding:5px}
.pcard .mirror__glass{aspect-ratio:4/5}
.pcard h3{font-size:13.5px;margin-top:8px}
.pcard p{font-size:12px;color:var(--muted)}
.pcard:hover .mirror{box-shadow:0 0 0 2px var(--accent),var(--lift)}
.meta-list{display:grid;gap:2px}
.meta-list a,.meta-list span.mi{display:flex;gap:12px;align-items:flex-start;color:var(--ink-2);line-height:1.75;font-size:13.5px;padding:9px 0;border-bottom:1px solid var(--line-2)}
.meta-list>:last-child{border-bottom:0}
.meta-list a:hover{color:var(--accent-ink)}
.meta-list svg{width:18px;height:18px;flex:none;margin-top:3px;color:var(--accent)}
.manager{display:flex;align-items:center;gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid var(--line-2);font-size:13px;color:var(--ink-2)}
.manager img{width:46px;height:46px;border-radius:50%;object-fit:cover}
.foot{text-align:center;font-size:12px;color:var(--muted);padding:6px 6px 0;line-height:1.9;max-width:44ch;margin:0 auto}

/* ---------- dock ---------- */
.dock{position:fixed;inset-inline:0;bottom:0;z-index:40;padding:12px 14px calc(12px + var(--safe-b));background:linear-gradient(180deg,rgba(232,237,235,0),rgba(232,237,235,.92) 40%);pointer-events:none}
.dock__inner{pointer-events:auto;max-width:620px;margin:0 auto;display:flex;gap:8px;align-items:center;background:var(--ink);border-radius:20px;padding:7px;box-shadow:var(--float)}
.dock__hint{font-size:13px;color:rgba(255,255,255,.72);padding-inline-start:12px;flex:1;min-width:0;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dock .btn--primary{flex:none}
.dock .btn--primary[disabled]{opacity:.55}
@media(max-width:560px){.dock__hint{display:none}.dock .btn--primary{flex:1}}
/* ---------- the same glass material: one recipe for every control on this page ----------
   Two bodies (light and emerald) from one recipe, exactly like the public pages: a
   translucent fill that blurs what is behind it, a glossy top edge, a soft shadow and a
   diagonal sheen. «بساز» is the emerald body, so it reads as the primary action at rest. */
:root{
  --glass-blur:blur(14px) saturate(160%);
  --glass-bg-l:rgba(255,255,255,.55);--glass-top-l:rgba(255,255,255,.34);--glass-edge-l:rgba(255,255,255,.78);
  --glass-sheen-l:linear-gradient(105deg,rgba(255,255,255,0) 6%,rgba(255,255,255,.55) 30%,rgba(255,255,255,0) 56%,rgba(255,255,255,.22) 100%);
  --glass-bg-p:rgba(4,54,42,.86);--glass-top-p:rgba(255,255,255,.1);--glass-edge-p:rgba(255,255,255,.42);
  --glass-sheen-p:linear-gradient(105deg,rgba(255,255,255,0) 4%,rgba(255,255,255,.12) 26%,rgba(255,255,255,0) 50%,rgba(255,255,255,.06) 100%);
}
.btn,.chip,.linesw__btn,.share__opt,.base__opt,.icon-btn,button.hchip,a.hchip{
  --glass-bg:var(--glass-bg-l);--glass-top:var(--glass-top-l);--glass-edge:var(--glass-edge-l);--glass-sheen:var(--glass-sheen-l);
  position:relative;isolation:isolate;
  background-color:var(--glass-bg);
  background-image:linear-gradient(180deg,var(--glass-top) 0%,rgba(255,255,255,0) 48%,rgba(10,32,42,.05) 100%);
  border:1px solid var(--glass-edge);
  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(10,32,42,.06),0 6px 16px rgba(10,32,42,.13);
}
.btn::after,.chip::after,.linesw__btn::after,.share__opt::after,.base__opt::after,.icon-btn::after,
  button.hchip::after,a.hchip::after{
  content:"";position:absolute;z-index:-1;inset:0;border-radius:inherit;pointer-events:none;background:var(--glass-sheen);
}
/* the primary action, at rest: emerald glass with a white label */
.btn--primary,.btn--build,.chip[aria-pressed="true"],.chip.is-on,.linesw__btn.is-on{
  --glass-bg:var(--glass-bg-p);--glass-top:var(--glass-top-p);--glass-edge:var(--glass-edge-p);--glass-sheen:var(--glass-sheen-p);
  color:#fff;text-shadow:0 1px 1px rgba(3,45,36,.35);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -1px 0 rgba(3,45,36,.3),0 8px 20px rgba(6,143,108,.26);
}
.btn:hover,.chip:hover,.linesw__btn:hover,.share__opt:hover,.base__opt:hover,.icon-btn:hover{filter:brightness(1.05)}
.btn:active,.chip:active,.linesw__btn:active,.share__opt:active,.base__opt:active,.icon-btn:active{transform:translateY(1px) scale(.98);filter:brightness(.96)}
.btn[disabled],.chip[disabled],.linesw__btn[disabled],.share__opt[disabled],.base__opt[disabled]{opacity:.5;cursor:not-allowed;transform:none;filter:grayscale(.3)}
/* the dock is a dark bar, so its controls wear the material over the dark, not over the cream */
.dock .btn--ghost{--glass-bg:rgba(255,255,255,.08);--glass-top:rgba(255,255,255,.06);--glass-edge:rgba(255,255,255,.22);color:#fff}
.dock .btn--ghost:hover{border-color:rgba(255,255,255,.4)}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .btn,.chip,.linesw__btn,.share__opt,.base__opt,.icon-btn,button.hchip,a.hchip{background-image:none;background-color:#fff;color:var(--ink-2);text-shadow:none}
  .btn--primary,.btn--build,.chip[aria-pressed="true"],.chip.is-on,.linesw__btn.is-on{background-color:var(--accent);color:#fff}
  .dock .btn--ghost{background-color:transparent;color:#fff}
}
@media(min-width:960px){body:not(.is-studio) .dock{display:none}body.is-studio .dock{left:50%;right:auto;width:min(520px,100%);transform:translateX(-50%);background:none}}



.hero__tools{display:flex;gap:8px;align-items:center}
.help-btn{width:42px;height:42px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);font-weight:700;font-size:17px;display:grid;place-items:center}
.help-btn:hover{border-color:#b3c0bb}
/* tour */
.tour{position:fixed;inset:0;z-index:100;animation:tourIn .25s var(--ease)}
.tour.is-leaving{opacity:0;transition:opacity .2s var(--ease)}
@keyframes tourIn{from{opacity:0}to{opacity:1}}
/* placed by script in viewport coordinates, so these three keep physical edges */
.tour__spot{position:fixed;left:0;top:0;width:0;height:0;border-radius:20px;box-shadow:0 0 0 200vmax rgba(24,16,10,.66),0 0 0 3px rgba(255,255,255,.9) inset;pointer-events:none;transition:transform .38s var(--ease),width .38s var(--ease),height .38s var(--ease)}
.tour--welcome .tour__spot{transform:translate(50vw,50vh);box-shadow:0 0 0 200vmax rgba(24,16,10,.72)}
.tour__card{position:fixed;left:0;top:0;width:min(360px,calc(100vw - 24px));background:var(--surface);border-radius:22px;padding:18px 18px 16px;box-shadow:var(--float);outline:none;transition:transform .38s var(--ease)}
.tour--welcome .tour__card{left:50%;top:50%;transform:translate(-50%,-50%);width:min(400px,calc(100vw - 32px));padding:26px 22px 20px;text-align:center;transition:none}
.tour__mirror{position:relative;width:96px;aspect-ratio:3/4;margin:0 auto 16px;border-radius:999px 999px 14px 14px;background:linear-gradient(170deg,#f4f7f6,#d6dfdb);box-shadow:0 0 0 6px var(--surface),0 0 0 7px var(--line),var(--lift);overflow:hidden;display:grid;place-items:center}
.tour__mark{width:42%;position:relative;z-index:1}
.tour__mark svg{width:100%;height:auto;display:block}
.tour__shine{position:absolute;inset:-20% -60%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.85) 50%,transparent 60%);transform:translateX(-60%);animation:shine 1.6s .3s var(--ease) both}
@keyframes shine{to{transform:translateX(60%)}}
.tour__title{font-family:var(--display);font-weight:800;font-size:21px;line-height:1.4}
.tour--welcome .tour__title{font-size:26px}
.tour__text{font-size:14px;line-height:1.95;color:var(--ink-2);margin-top:6px}
.tour__path{list-style:none;margin:18px 0 20px;padding:0;display:grid;grid-template-columns:repeat(3,1fr);position:relative}
.tour__path::before{content:"";position:absolute;top:21px;inset-inline:16%;height:2px;background:var(--line)}
.tour__path li{display:grid;justify-items:center;gap:7px;position:relative;font-size:12.5px}
.tour__path span{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:#fff;box-shadow:0 0 0 5px var(--surface)}
.tour__path li:nth-child(2) span{background:var(--ink)}
.tour__path li:nth-child(3) span{background:var(--honey)}
.tour__path svg{width:20px;height:20px}
.tour__actions{display:grid;gap:8px}
.tour__skip{border-color:transparent}
.tour__top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.tour__dots{display:flex;gap:5px}
.tour__dots span{width:7px;height:7px;border-radius:9px;background:var(--line);transition:width .25s var(--ease),background-color .25s}
.tour__dots .is-on{width:20px;background:var(--accent)}
.tour__dots .is-done{background:var(--accent-soft)}
.tour__x{width:34px;height:34px;border:0;border-radius:50%;background:var(--glass);color:var(--ink-2);font-size:19px;line-height:1}
.tour__nav{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px}
.tour__count{font-size:12px;color:var(--muted)}
.tour--still,.tour--still *{animation:none!important;transition:none!important}
body.is-touring{overflow:hidden}
.flowcol{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;min-width:0;align-content:start}.flowcol>section{min-width:0}
/* demo before/after */
.compare--demo{cursor:default;pointer-events:none}
.demo{flex:none}
.demo--small{width:118px;padding:4px}
.demo .compare__tag{font-size:12px;padding:1px 8px;bottom:8px}
.demo .compare__tag--before{right:8px;left:auto}.demo .compare__tag--after{left:8px;right:auto}
.demo-row{display:flex;gap:14px;align-items:center;margin:0 0 18px;padding:10px 14px 10px 10px;border-radius:20px;background:var(--glass)}
.demo-row__text{display:grid;gap:3px;font-size:13px;line-height:1.85;color:var(--ink-2)}
.demo-row__text b{font-family:var(--display);font-weight:800;font-size:17px;color:var(--ink)}
.tour__demo{width:150px;margin:0 auto 16px}
/* after sending */
.sent__follow{display:grid;gap:8px;width:100%;margin-top:4px;padding:14px;border-radius:18px;background:var(--glass)}
.sent__hint{font-size:13px;color:var(--ink-2);line-height:1.85}
/* your request card */
.mine{padding:16px 18px;box-shadow:inset 0 3px 0 var(--accent),var(--lift)}
.mine--booked{box-shadow:inset 0 3px 0 var(--ok),var(--lift)}.mine--declined{box-shadow:inset 0 3px 0 var(--honey),var(--lift)}
.mine__head{display:flex;gap:12px;align-items:center}
.mine__icon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--glass);font-size:20px;flex:none}
.mine__head b{display:block;font-size:15px}
.mine__meta{font-size:12.5px;color:var(--muted)}
.mine__steps{list-style:none;margin:14px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);position:relative}
.mine__steps::before{content:"";position:absolute;top:6px;inset-inline:16%;height:2px;background:var(--line)}
.mine__steps li{display:grid;justify-items:center;gap:6px;position:relative;font-size:12px;color:var(--muted)}
.mine__steps li span{width:14px;height:14px;border-radius:50%;background:var(--line);box-shadow:0 0 0 4px var(--surface)}
.mine__steps li.is-on{color:var(--ink)}.mine__steps li.is-on span{background:var(--accent)}
.mine__note{font-size:13px;color:var(--ink-2);margin-top:12px;line-height:1.85}
.mine__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
/* 360 viewer */
.spin-wrap{width:min(100%,330px);margin:4px auto 0;padding:6px}
.spin{position:relative;aspect-ratio:3/4;border-radius:999px 999px 13px 13px;overflow:hidden;background:linear-gradient(170deg,#f4f7f6,#d6dfdb);touch-action:pan-y;user-select:none;-webkit-user-select:none;outline:none}
.spin:focus-visible{box-shadow:0 0 0 3px var(--accent-ring)}
.spin.is-ready{cursor:grab}.spin.is-ready:active{cursor:grabbing}
.spin__layer{position:absolute;inset:0;background-repeat:no-repeat;background-size:300% 100%;opacity:0;transition:opacity .35s ease}
.spin__layer.is-on{opacity:1}
.spin__loading{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:14px;padding:20px;text-align:center;transition:opacity .35s var(--ease);perspective:700px}
.spin.is-ready .spin__loading{opacity:0}
.spin__orbit{width:58%;aspect-ratio:3/4;border-radius:999px 999px 12px 12px;overflow:hidden;box-shadow:var(--float);animation:sway 3.2s ease-in-out infinite;transform-style:preserve-3d}
.spin__orbit img{width:100%;height:100%;object-fit:cover}
@keyframes sway{0%,100%{transform:rotateY(-24deg)}50%{transform:rotateY(24deg)}}
.spin__ring{position:absolute;inset-inline:0;margin-inline:auto;top:44%;width:84%;aspect-ratio:1;transform:translateY(-50%) rotateX(74deg);border-radius:50%;border:2px dashed rgba(12,107,107,.35);animation:orbit 6s linear infinite;pointer-events:none}
@keyframes orbit{to{transform:translateY(-50%) rotateX(74deg) rotate(360deg)}}
.spin__tip{font-size:13px;color:var(--ink-2);min-height:1.8em}
.spin__track{width:62%;height:4px;border-radius:9px;background:rgba(35,23,15,.1);overflow:hidden}
.spin__bar{display:block;height:100%;width:2%;background:var(--accent);border-radius:9px;transition:width .4s linear}
.spin__controls{margin-top:12px;display:grid;gap:12px}.spin__controls[hidden]{display:none}
.spin__row{display:flex;align-items:center;gap:12px;justify-content:center}
.spin__dial{position:relative;width:34px;height:34px;border-radius:50%;border:2px solid var(--line);--r:0deg}
.spin__dial::before{content:"";position:absolute;inset-inline:0;margin-inline:auto;top:-6px;width:2px;height:6px;background:var(--muted);border-radius:2px}
.spin__dot{position:absolute;inset:0;transform:rotate(var(--r));transition:transform .2s var(--ease)}
.spin__dot::after{content:"";position:absolute;inset-inline:0;margin-inline:auto;top:2px;width:8px;height:8px;border-radius:50%;background:var(--accent)}
.spin__angle{min-width:58px;font-weight:700;font-size:14px;text-align:center}
.spin__thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:260px;margin:0 auto;width:100%}
.spin__thumb{aspect-ratio:3/4;border-radius:999px 999px 6px 6px;border:2px solid transparent;background-size:300% 100%;background-repeat:no-repeat;padding:0;opacity:.6;transition:opacity .15s,border-color .15s}
.spin__thumb.is-on{border-color:var(--accent);opacity:1}
.spin__note{text-align:center;margin-top:10px}
.layout--solo{grid-template-columns:minmax(0,1fr)!important;max-width:760px;margin:0 auto}
.about-btn{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 15px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font-weight:600;font-size:13.5px}
.about-btn:hover{border-color:#b3c0bb}
.about-btn svg{width:18px;height:18px;color:var(--accent)}
.hero__tag{margin-top:6px;font-size:14.5px;line-height:1.9;color:var(--ink-2);max-width:52ch}
.about__bio{font-size:14.5px;line-height:2;color:var(--ink-2);margin-bottom:16px}
.about__quick{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:12px}
.sidecard__lead{font-size:13px;color:var(--muted);margin:-8px 0 14px}
.style-card{padding:0;overflow:hidden;min-height:0}
.style-card__art{display:block;aspect-ratio:4/5;background:linear-gradient(170deg,#eef2f0,#d6dfdb);overflow:hidden}
.style-card__art img{width:100%;height:100%;object-fit:cover;transition:transform .3s var(--ease)}
.style-card:hover .style-card__art img{transform:scale(1.03)}
.style-card__art.is-missing{aspect-ratio:auto;height:6px}
.style-card__body{display:grid;gap:0;padding:10px 12px 12px}
.style-card__name{font-size:16px}
.style-card.is-on .style-card__art{box-shadow:inset 0 -4px 0 var(--ink)}
.color{margin-top:20px;padding-top:18px;border-top:1px solid var(--line-2)}
.color__box{position:relative}
.color__box input{display:block;width:100%;min-height:var(--tap);padding:11px 14px;padding-inline-end:44px;border:1px solid var(--line);border-radius:var(--r-sm);background:#fff;color:var(--ink)}
.color__box input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-ring)}
.color__clear{position:absolute;inset-inline-end:6px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:0;border-radius:50%;background:var(--glass);color:var(--ink-2);font-size:19px;line-height:1}
.color__list{position:absolute;inset-inline:0;top:calc(100% + 6px);z-index:20;margin:0;padding:6px;list-style:none;background:var(--surface);border:1px solid var(--line-2);border-radius:16px;box-shadow:var(--float);max-height:300px;overflow:auto}
.color__list li{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer;font-size:14px}
.color__list li:hover,.color__list li.is-active{background:var(--glass)}
.color__list .color__free{color:var(--muted);font-size:13px;cursor:default}
.swatch{width:26px;height:26px;border-radius:50%;flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}
.color .hint{display:block;font-size:12px;color:var(--muted);margin-top:6px;line-height:1.7}
.send-note{display:flex;gap:9px;align-items:flex-start;margin-top:12px;font-size:13px;line-height:1.85;color:var(--muted)}
.send-note svg{width:17px;height:17px;flex:none;margin-top:3px;color:var(--accent)}
.outbox{display:flex;gap:14px;align-items:center;padding:12px;border-radius:16px;background:var(--glass);margin-bottom:14px}
.outbox b{display:block;font-size:14.5px;line-height:1.6}
.outbox p{font-size:13px;color:var(--ink-2);line-height:1.8;margin-top:2px}
.outbox__thumbs{display:flex;flex:none}
.outbox__thumbs img{width:46px;height:60px;object-fit:cover;border-radius:999px 999px 8px 8px;border:3px solid var(--surface);background:var(--glass-2)}
.outbox__thumbs img+img{margin-inline-start:-14px}
.how{margin:0 0 18px;padding:0;list-style:none;counter-reset:how;display:grid;gap:8px}
.how li{counter-increment:how;display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.8;color:var(--ink-2)}
.how li::before{content:counter(how,persian);width:24px;height:24px;flex:none;border-radius:50%;display:grid;place-items:center;background:var(--ink);color:#fff;font-size:12px;font-weight:700;margin-top:1px}
.sent{display:grid;justify-items:center;gap:12px;text-align:center;padding:10px 0 4px}
.sent__mark{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--ok-soft);color:var(--ok)}
.sent__mark svg{width:32px;height:32px}
.sent h2{font-family:var(--display);font-weight:800;font-size:24px}
.sent p{color:var(--ink-2);line-height:1.95;max-width:40ch}
.fatal{display:grid;gap:14px;justify-items:start;padding:28px;margin:40px auto;max-width:460px}
.fatal h1{font-family:var(--display);font-weight:800;font-size:26px}

/* ---------- the chosen look is unmistakable: accent frame, tick and a small lift ---------- */
.looks .style-card{position:relative;transition:border-color .15s var(--ease),box-shadow .15s var(--ease),transform .15s var(--ease)}
.looks .style-card.is-on{border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent),0 14px 26px -16px rgba(7,76,77,.75);transform:translateY(-2px)}
.looks .style-card.is-on .style-card__art{box-shadow:none}
.looks .style-card.is-on .style-card__name{color:var(--accent-ink)}
.looks .style-card.is-on::after{content:"";position:absolute;top:8px;inset-inline-start:8px;z-index:2;width:30px;height:30px;border-radius:50%;background:var(--accent) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center/18px no-repeat;box-shadow:0 0 0 3px #fff,0 4px 10px rgba(0,0,0,.25);animation:pop .35s var(--ease) both}
@media (prefers-reduced-motion:reduce){.looks .style-card{transition:none}.looks .style-card.is-on{transform:none}.looks .style-card.is-on::after{animation:none}}
/* ---------- sticky header: services above, a slim stepper below on its own strip ---------- */
.steps{background:rgba(232,237,235,.94);border-bottom:0;box-shadow:0 8px 18px -16px rgba(35,23,15,.5)}
.steps__top{padding:10px 0 10px}
.steps__topin{display:flex;justify-content:center}
.linesw{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0;background:transparent;box-shadow:none;border-radius:0;width:min(100%,520px)}
.linesw__btn{min-height:46px;border-radius:14px;color:var(--ink-2)}
.linesw__btn:hover{color:var(--ink);border-color:var(--line)}
.linesw__btn.is-on{color:#fff}
.linesw__btn.is-on svg{color:#fff}
.steps__bottom{background:var(--surface);border-top:1px solid var(--line-2);border-bottom:1px solid var(--line-2)}
.steps__list{display:flex;align-items:center;gap:8px;padding:6px 18px;grid-template-columns:none;max-width:560px;margin-inline:auto}
.steps__item{flex:none;min-height:44px;padding:0 2px;gap:6px;font-size:12.5px;font-weight:600;color:var(--muted);border-radius:10px}
.steps__item::after{display:none}
.steps__num{width:22px;height:22px;font-size:12px;border-width:1.5px}
.steps__line{flex:1;height:2px;min-width:14px;border-radius:2px;background:var(--line)}
.steps__line.is-done{background:var(--accent)}
.steps__label{overflow:visible;white-space:nowrap}
@media(max-width:479px){
 .linesw{gap:6px}
 .linesw__btn{min-height:54px;border-radius:14px}
}
/* ---------- toasts sit low, above the fixed bar, never over the service tabs; a tap closes them ---------- */
.toast{top:auto;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);transform:translateY(12px);pointer-events:auto;cursor:pointer;font-size:13.5px;line-height:1.8}
/* ---------- images that are still loading: a soft shimmer, then a fade-in ---------- */
.style-card__art,.port-card .mirror__glass,.base__opt img{background-image:linear-gradient(100deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 70%);background-size:220% 100%;background-color:#dfe7e4;animation:shimmer 1.3s linear infinite}
.style-card__art--sw{background-image:none;animation:none}
@keyframes shimmer{from{background-position:120% 0}to{background-position:-120% 0}}
img[loading="lazy"]{opacity:0;transition:opacity .35s var(--ease)}
img[loading="lazy"].is-in{opacity:1}
.style-card__art.is-in,.port-card .mirror__glass.is-in{animation:none;background-image:none}
@media (prefers-reduced-motion:reduce){.style-card__art,.port-card .mirror__glass{animation:none}img[loading="lazy"]{transition:none}}
/* ---------- four services on a phone: icon above the word ---------- */
@media(max-width:479px){
 .linesw{border-radius:18px;width:100%}
 .linesw__btn{flex-direction:column;gap:2px;min-height:52px;padding:6px 2px;border-radius:14px;font-size:12.5px}
 .linesw__btn svg{width:20px;height:20px}
}
/* ---------- step 2: the photo just arrived ---------- */
.selfie--fresh{animation:fresh 1.6s var(--ease) both}
.selfie--fresh img{animation:pop .55s var(--ease) both}
@keyframes fresh{0%{background:var(--ok-soft);box-shadow:0 0 0 3px rgba(43,106,64,.25)}100%{background:var(--glass);box-shadow:0 0 0 0 rgba(43,106,64,0)}}
.fine-print{font-size:12px;color:var(--muted);line-height:1.85;margin-top:10px;text-align:center}
.upload--ref{aspect-ratio:auto;min-height:220px;border-radius:var(--r-lg)}
/* ---------- hair colour: on the new hairstyle or the original photo ---------- */
.base-wrap{margin:0 0 16px}
.base{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
.base__opt{display:flex;align-items:center;gap:10px;padding:8px;border-radius:16px;text-align:start;font:inherit;color:var(--ink);cursor:pointer;min-width:0}
.base__opt img{width:46px;height:58px;object-fit:cover;border-radius:22px 22px 8px 8px;flex:none}
.base__opt span{display:grid;gap:2px;min-width:0}.base__opt b{font-size:13px;line-height:1.5}.base__opt small{font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.base__opt.is-on{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-ring)}
.basehint{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;margin:0 0 16px;border-radius:16px;background:var(--honey-soft);font-size:12.5px;line-height:1.8;color:var(--ink-2)}
.basehint>span:first-child{display:inline-grid;color:var(--honey)}.basehint svg{width:20px;height:20px}
.basehint>span:nth-child(2){flex:1;min-width:180px}
.style-card__art--sw.is-missing{aspect-ratio:4/5;height:auto}
.style-card__dot{position:absolute;inset-inline-end:8px;bottom:8px;width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)}
.build--color .build__fx,.looks .style-card__art{position:relative}
/* ---------- after a hairstyle: try a colour on it ---------- */
.next-line{display:flex;align-items:center;gap:12px;width:100%;margin-top:16px;padding:12px 14px;border:1.5px dashed #c9a46a;border-radius:18px;background:linear-gradient(100deg,#fbf3e4,#f6ead2);text-align:start;font:inherit;color:var(--ink);cursor:pointer;transition:transform .15s var(--ease)}
.next-line:hover{transform:translateY(-1px)}
.next-line__ico{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--honey);color:#fff;flex:none}.next-line__ico svg{width:22px;height:22px}
.next-line b{display:block;font-size:14px}.next-line small{font-size:12px;color:var(--muted)}
.next-line__go{margin-inline-start:auto;display:inline-grid;color:var(--honey)}.next-line__go svg{width:20px;height:20px}
/* ---------- building: a small scene for each service ---------- */
.build-wrap{display:grid;gap:16px;margin-top:16px}
@media(min-width:640px){.build-wrap{grid-template-columns:minmax(0,300px) minmax(0,1fr);align-items:center;gap:26px}}
.build{width:min(100%,320px);margin:0 auto}
.build .mirror__glass{position:relative;aspect-ratio:3/4;overflow:hidden;background:#20302e}
.build__photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.55) brightness(.72);animation:breathe 4s ease-in-out infinite}
@keyframes breathe{50%{transform:scale(1.035)}}
.build__scan{position:absolute;inset-inline:0;top:-30%;height:30%;background:linear-gradient(180deg,transparent,rgba(255,255,255,.28),transparent);animation:scan 2.4s ease-in-out infinite}
.build__fx{position:absolute;inset:0;pointer-events:none}
.fx{position:absolute;width:64px;height:64px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35))}
.build__pct{position:absolute;inset-inline:0;bottom:14px;display:flex;justify-content:center;align-items:baseline;gap:2px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.45)}
.build__pct b{font-family:var(--display);font-weight:800;font-size:40px;line-height:1}.build__pct span{font-size:20px;font-weight:700}
.build__spark{position:absolute;color:#ffe9b8;font-size:18px;animation:twinkle 1.8s ease-in-out infinite;text-shadow:0 0 10px rgba(255,220,150,.9)}
.build__spark--1{top:14%;inset-inline-start:16%}.build__spark--2{top:38%;inset-inline-end:12%;animation-delay:.6s;font-size:14px}.build__spark--3{top:62%;inset-inline-start:22%;animation-delay:1.2s;font-size:22px}
@keyframes twinkle{0%,100%{opacity:0;transform:scale(.4) rotate(0)}50%{opacity:1;transform:scale(1) rotate(25deg)}}
/* hair: scissors snipping across the hair, little cut ends falling */
.fx--scissors{top:12%;inset-inline-start:10%;animation:snipPath 3.6s ease-in-out infinite alternate}
.fx__b1,.fx__b2{transform-origin:33px 32px}
.fx__b1{animation:bladeA .32s ease-in-out infinite alternate}.fx__b2{animation:bladeB .32s ease-in-out infinite alternate}
@keyframes bladeA{to{transform:rotate(-14deg)}}@keyframes bladeB{to{transform:rotate(14deg)}}
@keyframes snipPath{0%{transform:translate(0,0) rotate(8deg)}50%{transform:translate(-60px,22px) rotate(-6deg)}100%{transform:translate(-150px,6px) rotate(4deg)}}
.fx__bit{position:absolute;top:24%;width:14px;height:3px;border-radius:3px;background:#e9d3b6;opacity:0;animation:fall 2.2s ease-in infinite}
.fx__bit:nth-of-type(1){inset-inline-start:28%}.fx__bit:nth-of-type(2){inset-inline-start:48%;animation-delay:.5s}.fx__bit:nth-of-type(3){inset-inline-start:64%;animation-delay:1s}.fx__bit:nth-of-type(4){inset-inline-start:38%;animation-delay:1.5s}
@keyframes fall{0%{opacity:0;transform:translateY(0) rotate(0)}15%{opacity:1}100%{opacity:0;transform:translateY(150px) rotate(220deg)}}
/* colour: a brush painting a wash of the chosen colour down the hair */
.fx__wash{position:absolute;inset:0;background:linear-gradient(180deg,var(--wash) 0,var(--wash) 55%,transparent 80%);mix-blend-mode:color;opacity:.85;clip-path:inset(0 0 100% 0);animation:wash 3.4s var(--ease) infinite}
@keyframes wash{0%{clip-path:inset(0 0 100% 0)}70%,100%{clip-path:inset(0 0 22% 0)}}
.fx--brush{top:4%;inset-inline-start:8%;animation:brushPath 1.7s ease-in-out infinite alternate}
@keyframes brushPath{0%{transform:translate(0,0) rotate(6deg)}100%{transform:translate(-150px,70px) rotate(-10deg)}}
/* nails: a polish bottle bobbing and a brush gliding */
.fx--bottle{bottom:24%;inset-inline-start:12%;animation:bob 1.4s ease-in-out infinite alternate}
@keyframes bob{to{transform:translateY(-10px) rotate(-6deg)}}
.fx--wand{top:30%;inset-inline-end:14%;animation:stroke 1.1s ease-in-out infinite alternate}
@keyframes stroke{0%{transform:translate(0,0) rotate(0)}100%{transform:translate(40px,26px) rotate(12deg)}}
/* lashes: an eye blinking while its lashes grow one by one */
.fx--eye{width:120px;height:75px;top:26%;inset-inline:0;margin-inline:auto}
.fx__lid{transform-origin:40px 30px;animation:blink 3.2s ease-in-out infinite}
@keyframes blink{0%,44%,56%,100%{transform:scaleY(1)}50%{transform:scaleY(.08)}}
.fx__lash path{stroke-dasharray:14;stroke-dashoffset:14;animation:grow 3.2s ease-out infinite}
.fx__lash path:nth-child(2){animation-delay:.15s}.fx__lash path:nth-child(3){animation-delay:.3s}.fx__lash path:nth-child(4){animation-delay:.45s}.fx__lash path:nth-child(5){animation-delay:.6s}.fx__lash path:nth-child(6){animation-delay:.75s}
@keyframes grow{0%{stroke-dashoffset:14}30%,85%{stroke-dashoffset:0}100%{stroke-dashoffset:0;opacity:0}}
.build__side{display:grid;gap:12px}
.build__title{font-family:var(--display);font-weight:800;font-size:19px}
.build__steps{list-style:none;display:grid;gap:8px;margin:0;padding:0}
.build__steps li{display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--muted)}
.build__steps li span{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--line);display:grid;place-items:center;flex:none;background:var(--surface)}
.build__steps li span svg{width:13px;height:13px}
.build__steps li.is-done{color:var(--ink-2)}.build__steps li.is-done span{background:var(--accent);border-color:var(--accent);color:#fff}
.build__steps li.is-on{color:var(--ink);font-weight:700}.build__steps li.is-on span{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-ring);animation:ping 1.2s ease-in-out infinite}
@keyframes ping{50%{box-shadow:0 0 0 7px rgba(12,107,107,.08)}}
@media (prefers-reduced-motion:reduce){
 .build__photo,.build__scan,.build__spark,.fx,.fx__b1,.fx__b2,.fx__bit,.fx__wash,.fx__lid,.fx__lash path,.build__steps li.is-on span,.selfie--fresh,.selfie--fresh img{animation:none}
 .fx__wash{clip-path:inset(0 0 40% 0)}.fx__lash path{stroke-dashoffset:0}.fx__bit{display:none}
}
/* Shared clay finish for customer-page service and action icons. */
:is(.upload__icon,.custom-look__ico,.next-line__ico,.linesw__btn svg){
 color:#054b3c;border:1px solid rgba(255,255,255,.92);
 background:linear-gradient(151deg,rgba(255,255,255,.62),rgba(255,255,255,.06) 46%,rgba(7,66,55,.05)),radial-gradient(120% 92% at 26% 10%,#fff 0 10%,rgba(255,255,255,.34) 42%,transparent 66%),linear-gradient(151deg,#fff 0%,#f2fbf7 32%,#d3eddf 68%,#a9dbc8 100%);
 box-shadow:inset 2px 2px 3px rgba(255,255,255,.9),inset -2px -3px 5px rgba(7,66,55,.16),0 2px 0 #8dbca9,0 8px 16px rgba(6,90,70,.18);
}
:is(.upload__icon,.custom-look__ico,.next-line__ico) svg,.linesw__btn svg{filter:drop-shadow(0 1px 0 rgba(255,255,255,.95)) drop-shadow(0 2px 2px rgba(11,59,50,.2))}
.linesw__btn.is-on svg{color:#054b3c}
.btn--sm,.picked .btn,a.hchip,button.hchip{min-height:44px}
:focus-visible{outline:3px solid #054b3c;outline-offset:3px}
.linesw__btn:focus-visible,.compare:has(.compare__range:focus-visible),.spin:focus-visible{outline:3px solid #054b3c;outline-offset:3px}


/* ---------- studio mode (the customers' home, main domain) ---------- */
.head--studio{padding-bottom:18px}
.head--studio .hero__bar{margin-bottom:6px;min-height:52px}
.brand--studio{font-size:17px;font-weight:800;color:var(--ink);text-decoration:none;min-height:44px}
.brand--studio svg{width:24px;height:34px}
.coin-pill{display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:0 14px 0 12px;border-radius:999px;border:1.5px solid #E2BC63;background:var(--surface);color:#5B3F0C;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(20,30,28,.08)}
.coin-pill__ico,.wallet__coin{display:inline-flex}.coin-pill__ico svg{width:20px;height:20px}
.coin-pill:active{transform:scale(.97)}
.studio{display:grid;gap:12px;padding-top:6px}
.studio__title{font-family:var(--display);font-weight:800;font-size:clamp(25px,6.8vw,40px);line-height:1.4;color:var(--ink);text-wrap:balance}
.studio__tag{font-size:15px;line-height:1.9;color:var(--ink-2);max-width:52ch}
.studio__cta{justify-self:stretch}
@media (min-width:720px){.studio__cta{justify-self:start;min-width:280px}}
.wallet{display:grid;gap:8px}
.wallet__gift{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:#FBF0D9;border:1px solid #EAD39D;color:#5B3F0C}
.wallet__gift-ico{flex:0 0 38px;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#fff;color:#A8741B}
.wallet__gift-ico svg{width:22px;height:22px}
.wallet__gift b{display:block;font-size:15px}
.wallet__gift small{display:block;font-size:12.5px;color:#7A5A1E;line-height:1.7}
.wallet__main{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:var(--surface);border:1px solid var(--line)}
.wallet__coin svg{width:38px;height:38px}
.wallet__txt{flex:1;min-width:0}
.wallet__txt b{display:block;font-size:16px;color:var(--ink)}
.wallet__txt small{display:block;font-size:12.5px;color:var(--muted);line-height:1.7}
.wallet__top{flex:0 0 auto;min-height:44px}
.wallet__bar{height:6px;border-radius:999px;background:var(--line);overflow:hidden}
.wallet__bar i{display:block;height:100%;background:#E2BC63;border-radius:inherit}
.dock__wallet svg{width:24px;height:24px}
.proof{margin:2px 0 0;display:grid;gap:6px}
.proof__pair{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;max-width:420px}
.proof__img{position:relative;display:block;border-radius:18px;overflow:hidden;aspect-ratio:3/4;max-height:230px;background:var(--glass-2);box-shadow:0 10px 26px -14px rgba(10,32,42,.45)}
.proof__img img{width:100%;height:100%;object-fit:cover;object-position:50% 25%;display:block}
.proof__img i{position:absolute;bottom:8px;inset-inline-start:8px;font-style:normal;font-size:12px;font-weight:800;padding:2px 10px;border-radius:999px;background:rgba(10,32,42,.72);color:#fff}
.proof__img i.is-after{background:var(--accent)}
.proof__arrow{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--surface);color:var(--accent);box-shadow:0 4px 12px rgba(10,32,42,.12)}
.proof__arrow svg{width:16px;height:16px}
.proof figcaption{font-size:12px;color:var(--muted)}
.flow .compare:not(.compare--demo){max-height:calc(100vh - 220px);margin-inline:auto}
@media(min-width:960px){.flow .compare:not(.compare--demo){width:min(100%,calc((100vh - 220px) * .75))}}
.compare--hero{aspect-ratio:4/5;width:min(100%,calc(min(52vh,500px) * .8));justify-self:center;border-radius:var(--r-lg,24px)}
.trend__lines{margin:0}
.compare--hero img{object-fit:cover;object-position:50% 22%}

.album{display:grid;gap:10px;margin-top:4px}
.album__head{display:flex;align-items:center;gap:10px}
.album__head h2{font-family:var(--display);font-size:18px;font-weight:800;color:var(--ink)}
.album__head>span{font-size:13px;color:var(--muted);flex:1}
.album__strip{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:4px;scrollbar-width:none}
.album__strip::-webkit-scrollbar{display:none}
.album__item{flex:0 0 96px;scroll-snap-align:start;display:grid;gap:4px;padding:0;border:0;background:none;cursor:pointer;text-align:center;font-size:12px;color:var(--ink-2);font-weight:600}
.album__item img{width:96px;height:128px;object-fit:cover;border-radius:14px;background:var(--glass-2);box-shadow:0 6px 16px -10px rgba(10,32,42,.5)}
.look__img{width:100%;max-height:62vh;object-fit:contain;border-radius:16px;background:var(--glass-2)}
.look__actions{display:grid;gap:8px;margin-top:12px}
.look__pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.look__pair figure{margin:0;display:grid;gap:4px}
.look__pair img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:14px}
.look__pair figcaption{font-size:12px;color:var(--muted);text-align:center}
.look__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:60vh;overflow:auto}
.look__pick{display:grid;gap:4px;padding:4px;border-radius:14px;border:2px solid transparent;background:var(--surface);font-size:12px;color:var(--ink-2);cursor:pointer}
.look__pick img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:10px}
.look__pick.is-on{border-color:var(--accent)}
.acct-chip{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font-weight:700;font-size:14px;text-decoration:none}
.acct-chip svg{width:18px;height:18px;color:var(--accent)}
.acct-chip--in{background:var(--accent-soft,#E4F1EC);border-color:transparent}
.acct-chip span{max-width:9ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.head--account .wrap{max-width:480px}
.account{display:grid;grid-template-columns:minmax(0,1fr)!important;gap:14px;justify-items:stretch;margin:10px auto 0;max-width:480px;width:100%;padding:26px 20px 22px;text-align:center}
.account__avatar{justify-self:center;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--accent-soft,#E4F1EC);color:var(--accent)}
.account__avatar svg{width:30px;height:30px}
.account__title{font-family:var(--display);font-size:26px;font-weight:800;color:var(--ink)}
.account__sub{color:var(--ink-2);font-size:15px;line-height:1.9}
.account .wallet{text-align:start}
.account__out{color:var(--muted)}
.signin{display:grid;gap:12px;text-align:start}
.signin__form{display:grid;gap:12px}
.signin__form .field input{font-size:17px;min-height:52px}
.signin__code{letter-spacing:.5em;text-align:center;font-size:22px!important;font-weight:800}
.signin__new{font-size:14px;font-weight:700;color:var(--accent-ink,var(--accent))}
.signin__names{display:grid;gap:10px}
.signin__names[hidden]{display:none}
.signin__sent{font-size:14.5px;color:var(--ink-2)}
.signin__row{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.signin__row .btn{background:none!important;border:0!important;box-shadow:none!important;color:var(--accent);font-weight:700;padding-inline:4px}
.signin__row .btn::after{display:none}
.signin__row .btn[disabled]{color:var(--muted);opacity:1}
.signin__perks{list-style:none;margin:4px 0 0;padding:14px 0 0;border-top:1px solid var(--line);display:grid;gap:10px;text-align:start}
.signin__perks li{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--ink-2)}
.signin__perk-ico{flex:0 0 32px;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--glass-2,#F3EEE6);color:var(--accent)}
.signin__perk-ico svg{width:20px;height:20px}
.signin-sheet .signin__perks{margin-top:8px}

@media (min-width:900px){
 .studio{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);grid-template-areas:"title proof" "tag proof" "wallet proof" "cta proof";column-gap:48px;align-items:start;align-content:start}
 .studio>.studio__title{grid-area:title;font-size:44px}.studio>.studio__tag{grid-area:tag}.studio>.wallet{grid-area:wallet}.studio>.studio__cta{grid-area:cta}.studio>.album,.studio>.trend{grid-column:1/-1;margin-top:18px}
 .studio>.proof{grid-area:proof;align-self:center}.proof__pair{max-width:none}.proof__img{max-height:340px}
}
/* While the start button is on screen the dock would repeat it (and cover it on small phones). */
body.cta-on-screen #dock{transform:translateY(130%);opacity:0;pointer-events:none}
#dock{transition:transform .25s var(--ease,ease),opacity .2s}
@media (prefers-reduced-motion:reduce){#dock{transition:none}}
.btn .coin-pill__ico svg{width:20px;height:20px}


/* ---------- profile, saves and likes (studio) ---------- */
.signin__pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.signin__alt{font-size:14px;color:var(--ink-2);text-align:center}
.signin__alt a{color:var(--accent);font-weight:700}
.signin__miss{display:grid;gap:10px;text-align:start}
.signin__miss[hidden]{display:none}
.profile{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;max-width:560px;margin:10px auto 0;width:100%}
.profile>*,.profile__sec>*{min-width:0}
.profile__sec{grid-template-columns:minmax(0,1fr)}
.profile__id{display:flex;align-items:center;gap:14px;padding:18px}
.profile__avatar{flex:0 0 60px;width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:#fff;font-family:var(--display);font-size:26px;font-weight:800}
.profile__who{flex:1;min-width:0}
.profile__who h1{font-family:var(--display);font-size:21px;font-weight:800;color:var(--ink);line-height:1.4}
.profile__who p{font-size:13.5px;color:var(--muted);line-height:1.8}
.profile__stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.profile__stat{display:grid;gap:2px;text-align:center;padding:14px 8px;border-radius:16px;background:var(--surface);border:1px solid var(--line)}
.profile__stat b *{font:inherit}
.profile__stat b{font-family:var(--display);font-size:22px;font-weight:800;color:var(--ink)}
.profile__stat span{font-size:12.5px;color:var(--muted)}
.profile__sec{padding:16px;display:grid;gap:12px}
.profile__sechead{display:flex;align-items:center;justify-content:space-between;gap:8px}
.profile__link{display:flex;align-items:center;gap:8px}
.profile__link code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:12.5px ui-monospace,Menlo,monospace;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:9px 10px}
.profile__sec[hidden]{display:none}
.profile__sechead h2{font-family:var(--display);font-size:17px;font-weight:800;color:var(--ink)}
.profile__sec .seg{margin-bottom:0}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pgrid__item{display:grid;gap:4px;padding:0;border:0;background:none;text-align:center;font-size:11.5px;color:var(--ink-2);font-weight:600;text-decoration:none;cursor:pointer}
.pgrid__item>span{display:grid;gap:1px;line-height:1.5}.pgrid__item b{font-size:12px;color:var(--ink)}.pgrid__item small{font-size:11px;color:var(--muted);font-weight:500}
.pgrid__item img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:12px;background:var(--glass-2)}
.empty{display:grid;gap:6px;justify-items:center;text-align:center;padding:22px 8px}
.empty b{font-size:15px;color:var(--ink)}
.empty p{font-size:13.5px;color:var(--muted);line-height:1.8}
.ledger{list-style:none;margin:0;padding:0;display:grid}
.ledger li{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}
.ledger li:last-child{border-bottom:0}
.ledger__ico{flex:0 0 34px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--glass-2);color:var(--ink-2)}
.ledger__ico svg{width:20px;height:20px}
.ledger__txt{flex:1;min-width:0;display:grid}
.ledger__txt b{font-size:14px;color:var(--ink)}
.ledger__txt small{font-size:12px;color:var(--muted)}
.ledger__amt{font-size:15px;color:var(--ink-2)}
.ledger__amt.is-plus{color:var(--accent)}
.react-row{position:absolute;top:8px;inset-inline-start:8px;display:flex;gap:6px;z-index:2}
.react{min-width:36px;height:36px;padding:0 8px;border:0;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:3px;background:rgba(255,255,255,.92);color:var(--ink-2);box-shadow:0 2px 8px rgba(20,20,20,.14);cursor:pointer;font:inherit;font-size:12px;font-weight:700}
.react svg{width:18px;height:18px}
.react::before{content:'';position:absolute;inset:-4px}
.react{position:relative}
.react--like.is-on{color:#D2405B}.react--like.is-on svg{fill:currentColor}
.react--save.is-on{color:var(--accent)}.react--save.is-on svg{fill:currentColor}
.react__n:empty{display:none}

.trend{display:grid;gap:10px;margin-top:4px}
.trend[hidden]{display:none}
.trend__ico{display:inline-flex;width:20px;height:20px;color:#D9663B;vertical-align:-3px;margin-inline-end:4px}
.trend__ico svg{width:100%;height:100%}
.trend__strip{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:4px;scrollbar-width:none}
.trend__strip::-webkit-scrollbar{display:none}
.trend__wrap{position:relative;flex:0 0 128px;scroll-snap-align:start}
.trend__item{display:grid;gap:2px;width:100%;padding:0;border:0;background:none;text-align:start;cursor:pointer}
.trend__item img{width:128px;height:170px;object-fit:cover;border-radius:16px;background:var(--glass-2);box-shadow:0 6px 16px -10px rgba(10,32,42,.5)}
.trend__name{font-size:13px;font-weight:700;color:var(--ink);margin-top:4px;line-height:1.5}
.trend__line{font-size:11.5px;color:var(--muted)}
.trend__wrap .react-row{top:6px;inset-inline-start:auto;inset-inline-end:6px}
.trend__wrap .react{min-width:32px;height:32px}
.style-wrap{position:relative;display:grid}
.style-wrap>.style-card{height:100%}
.style-wrap>.react-row{inset-inline-start:auto;inset-inline-end:8px}
.style-card__hot{position:absolute;bottom:8px;inset-inline-start:8px;display:inline-flex;align-items:center;gap:3px;padding:2px 8px 2px 6px;border-radius:999px;background:rgba(255,255,255,.94);color:#B4502A;font-size:11px;font-weight:800}
.style-card__hot svg{width:13px;height:13px}
.own-ref{display:flex;align-items:center;gap:12px;width:100%;margin:10px 0 2px;padding:12px 14px;border:1.5px dashed var(--line-2);border-radius:var(--r);background:var(--surface);text-align:start;cursor:pointer;font:inherit;color:var(--ink)}
.own-ref:hover{border-color:var(--accent)}
.own-ref__ico{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--accent-soft,#E4F1EC);color:var(--accent)}
.own-ref__ico svg{width:22px;height:22px}
.own-ref b{display:block;font-size:14.5px}
.own-ref small{display:block;font-size:12.5px;color:var(--muted);line-height:1.7}
.own-ref>span:nth-child(2){flex:1;min-width:0}
.own-ref__go{color:var(--muted)}
.profile__phone{unicode-bidi:isolate;display:inline-block}
body.is-studio .result-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
body.is-studio .result-actions>*{width:100%;min-width:0;justify-content:center;white-space:normal;text-align:center}
body.is-studio .result-actions>:last-child:nth-child(odd){grid-column:1/-1}
.ico-back{display:inline-flex;transform:scaleX(-1)}.ico-back svg{width:18px;height:18px}.own-ref__go svg{width:18px;height:18px}
/* ---------- beauty consultant (phase 1): card in the studio, the 3-step sheet, saved list ---------- */
.consult-card{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 12px;padding:14px;border:1.5px solid var(--accent);border-radius:var(--r);background:var(--accent-soft,#E4F1EC);text-align:start;cursor:pointer;font:inherit;color:var(--ink)}
.consult-card:hover{border-color:var(--accent-ink)}
.consult-card__ico{flex:0 0 42px;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--surface);color:var(--accent)}
.consult-card__ico svg{width:22px;height:22px}
.consult-card>span:nth-child(2){flex:1;min-width:0}
.consult-card b{display:block;font-size:14.5px}
.consult-card small{display:block;font-size:12.5px;color:var(--muted);line-height:1.7}
.consult-card__go{color:var(--muted)}.consult-card__go svg{width:18px;height:18px}
.csheet .cphoto{display:flex;gap:12px;align-items:center;margin-bottom:14px}
.csheet .cphoto img{width:64px;height:80px;object-fit:cover;border-radius:12px;background:var(--surface-2)}
.csheet .cphoto b{display:block;font-size:14px}
.csheet .cphoto small{display:block;font-size:12.5px;color:var(--muted)}
.csteps{display:flex;gap:6px;margin-bottom:16px}
.cstep{flex:1;text-align:center;font-size:12px;padding:7px 2px;border-radius:var(--r-sm,#10px);background:var(--surface-2);color:var(--ink-3,#9c9186)}
.cstep.is-on{background:var(--accent-soft);color:var(--accent-ink);font-weight:600}
.csheet .consult-img{width:100%;border-radius:var(--r-lg);margin-top:8px;display:block}
.cfield{display:grid;gap:8px;padding:12px;border:1px solid var(--line);border-radius:var(--r);margin-bottom:10px;background:var(--surface)}
.cfield__top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.cfield__top b{font-size:13.5px}
.cconf{font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--accent-soft,#E4F1EC);color:var(--accent-ink,#0b5c46);white-space:nowrap}
.cconf.is-low{background:var(--warn-soft);color:var(--warn)}
.cfield__hint{font-size:12px;color:var(--muted);line-height:1.7}
.cchips{display:flex;flex-wrap:wrap;gap:6px}
.cpick{border:1px solid var(--line);border-radius:var(--r);padding:14px;margin-bottom:10px;background:var(--surface);display:grid;gap:6px}
.cpick>b{font-size:15.5px;font-weight:800}
.cpick .why{font-size:13.5px;line-height:1.8;color:var(--ink-2)}
.cpick .lim{font-size:13px;line-height:1.8;color:var(--warn);background:var(--warn-soft);border-radius:10px;padding:8px 10px}
.cpick .btn{margin-top:4px;justify-self:start}
.clist{display:grid;gap:8px}
.clist__row{display:flex;gap:12px;align-items:center;width:100%;padding:12px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);text-align:start;cursor:pointer;font:inherit;color:var(--ink)}
.clist__row:hover{border-color:var(--accent)}
.clist__row img{width:48px;height:60px;object-fit:cover;border-radius:10px;background:var(--surface-2);flex:0 0 auto}
.clist__row>.clist__txt{flex:1;min-width:0}
.clist__row b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.clist__row small{display:block;font-size:12px;color:var(--muted);margin-top:2px}
.clist__row .ico{color:var(--muted)}.clist__row .ico svg{width:18px;height:18px}
/* five profile tabs must stay readable at 390px */
.profile__sec .seg button{font-size:12.5px;padding:0 4px;white-space:normal;line-height:1.3}
`;

const clientJS=String.raw`
var STYLES=__STYLES__;
var LINES=__LINES__;
var MARK=__MARK__;
var CONSULT=__CONSULT__;
var EMBED=/[?&]embed=1(?:&|$)/.test(location.search);if(EMBED)document.body.classList.add('embedded-demo');
/* Embedded on the landing page: report the height of what is actually on screen, so the
   frame there can be exactly as tall as this page instead of putting one scrollbar inside
   another. Only while embedded, and only the height — nothing else leaves this page. */
if(EMBED){
 var aynFit=function(){
  var h=Math.ceil(document.documentElement.getBoundingClientRect().height||document.body.scrollHeight);
  if(h>200)try{parent.postMessage({aynehDemoHeight:h},location.origin)}catch(_){}
 };
 addEventListener('load',aynFit);
 if(window.ResizeObserver)new ResizeObserver(aynFit).observe(document.body);
 addEventListener('resize',aynFit,{passive:true});
}
var FROM_LANDING=/[?&]from=landing(?:&|$)/.test(location.search);
var STUDIO_PREVIEW=location.pathname==='/salon-preview';
var SLUG=STUDIO_PREVIEW?'sanaz-salon':((document.querySelector('meta[name="ayneh-slug"]')||{}).content||location.pathname.split('/').filter(Boolean)[1]||'');
var ICO={
 heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-9A5.2 5.2 0 0 1 12 6.2 5.2 5.2 0 0 1 21.2 11C19 15.6 12 20 12 20Z"/></svg>',
 bookmark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2-6.5 4.2v-16a1 1 0 0 1 1-1Z"/></svg>',
 edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
 fire:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21c4 0 7-2.7 7-6.6 0-3.7-2.6-5.9-4.2-8.9-.4 2-1.4 3.3-2.8 3.9C12 6.4 10.6 4.4 8.6 3c.3 3.4-1.5 5.3-2.7 7.2A7.4 7.4 0 0 0 5 14.4C5 18.3 8 21 12 21Z"/></svg>',
 camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a2 2 0 0 0 1.7-.9l.6-1a2 2 0 0 1 1.7-.9h2.6a2 2 0 0 1 1.7.9l.6 1a2 2 0 0 0 1.7.9h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg>',
 lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4.5" y="10" width="15" height="10" rx="2.6"/><path d="M8.5 10V7.8a3.5 3.5 0 0 1 7 0V10"/></svg>',
 phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3.5h2.2l1.6 4-2 1.3a12 12 0 0 0 6.4 6.4l1.3-2 4 1.6v2.2a2.5 2.5 0 0 1-2.7 2.5A16.5 16.5 0 0 1 4 6.2 2.5 2.5 0 0 1 6.5 3.5z"/></svg>',
 pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.2 2"/></svg>',
 instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1"/></svg>',
 globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.4 3.6 8.5S14.4 18.1 12 20.5c-2.4-2.4-3.6-5.4-3.6-8.5S9.6 5.9 12 3.5z"/></svg>',
 send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4 3.5 10.6l6.3 2.6 2.6 6.3z"/><path d="M20 4l-7.6 15.5"/></svg>',
 spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>',
 download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7.5 11 4.5 4.5L16.5 11"/><path d="M4.5 19.5h15"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
 info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.4"/></svg>',
 warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5 21 19.5H3z"/><path d="M12 10v4.5M12 17.2v.3"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.4 3.9-5.2 7.5-5.2s6.3 1.8 7.5 5.2"/></svg>',
 scissors:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="6.5" cy="6.5" r="2.5"/><path d="M8.7 8.3 20 19M8.7 15.7 20 5"/></svg>',
 sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>',
 gallery:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 15-4.6-4.4L7 19.5"/></svg>',
 orbit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="3.6"/><path d="M12 3.5c2 1.6 3.2 4.7 3.2 8.5s-1.2 6.9-3.2 8.5"/><path d="m18.6 13.8 2 1.6-2.3 1"/></svg>',
 drop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5C9.7 6.2 6 9.8 6 13.5a6 6 0 0 0 12 0c0-3.7-3.7-7.3-6-11Z"/><circle cx="9.4" cy="13.8" r="1" fill="currentColor" stroke="none"/></svg>',
 nails:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21v-9.5a4 4 0 0 1 8 0V21"/><path d="M10 11.5V9a2 2 0 0 1 4 0v2.5"/></svg>',
 lashes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13c2.5-3.2 5.5-4.8 9-4.8s6.5 1.6 9 4.8"/><path d="M3 13c2.5 3 5.5 4.5 9 4.5s6.5-1.5 9-4.5"/><circle cx="12" cy="13" r="2.4"/><path d="M6 9.6 4.8 7.6M9 8.5l-.6-2.2M12 8.2V6M15 8.5l.6-2.2M18 9.6l1.2-2"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H4M10 6l-6 6 6 6"/></svg>',};
var state={line:'hair',opts:{},ratio:'',pub:null,step:1,original:null,reference:null,refTitle:'',style:null,custom:'',q:'',tab:'salon',transfer:'both',color:'',result:null,gen:null,genState:null,busy:false,error:'',session:false,verified:false,idem:null,rating:0,me:null};
try{state.me=JSON.parse(localStorage.getItem('ayneh-me')||'null')}catch(e){}
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function fa(n){return new Intl.NumberFormat('fa-IR').format(n)}
function fmt(ms){if(!ms)return '';try{return new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'medium',timeStyle:'short'}).format(ms)}catch(e){return ''}}
function uuid(){var b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;var x=Array.prototype.map.call(b,function(v){return v.toString(16).padStart(2,'0')}).join('');return x.slice(0,8)+'-'+x.slice(8,12)+'-'+x.slice(12,16)+'-'+x.slice(16,20)+'-'+x.slice(20)}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function tehranDate(d){var p={};new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).forEach(function(x){p[x.type]=x.value});return p.year+'-'+p.month+'-'+p.day}
function el(tag,attrs,children){var e=document.createElement(tag);attrs=attrs||{};Object.keys(attrs).forEach(function(k){var v=attrs[k];if(v===undefined||v===null)return;if(k==='text')e.textContent=v;else if(k==='html')e.innerHTML=v;else if(k==='class')e.className=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else if(k==='checked'||k==='disabled'||k==='hidden'||k==='required')e[k]=!!v;else e.setAttribute(k,v)});(children||[]).forEach(function(c){if(c!==null&&c!==undefined&&c!==false)e.append(c)});return e}
function h(tag,text,cls){return el(tag,{class:cls||'',text:text})}
function media(id){return STUDIO_PREVIEW&&typeof id==='string'&&id.startsWith('blob:')?id:'/api/s/'+SLUG+'/media/'+id}
function api(path,body,raw){
 if(STUDIO_PREVIEW&&path!=='public')return Promise.reject(new Error('این صفحه پیش‌نمایش است.'));
 var init={};
 if(body!==undefined){init.method='POST';init.headers=raw?{}:{'Content-Type':'application/json'};init.body=raw?body:JSON.stringify(body)}
 return fetch('/api/s/'+SLUG+'/'+path,init).then(function(r){return r.json().catch(function(){return {}}).then(function(d){if(!r.ok)throw new Error(d.error||'خطای ارتباط با سرور');return d})})
}
function toast(msg,kind){
 var t=$('#toast');if(!t)return;
 t.textContent=msg;t.className='toast is-on'+(kind==='error'?' is-error':'');
 if(!t.__tap){t.__tap=1;t.addEventListener('click',function(){t.className='toast'})}
 clearTimeout(window.__tt);window.__tt=setTimeout(function(){t.className='toast'},kind==='error'?6000:3200);
}
function svg(name){return el('span',{html:ICO[name]||'',class:'ico'})}

/* ---------- lazy images fade in when they arrive (or show their frame if they fail) ---------- */
document.addEventListener('load',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&t.loading==='lazy'){t.classList.add('is-in');if(t.parentNode&&t.parentNode.classList)t.parentNode.classList.add('is-in')}},true);
document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&t.parentNode&&t.parentNode.classList)t.parentNode.classList.add('is-in')},true);
/* ---------- anonymous usage events (no name, phone or photo) ---------- */
var VISITOR=(function(){var v='';try{v=localStorage.getItem('ayneh-v')||''}catch(e){}if(!/^[a-f0-9]{32}$/.test(v)){v=Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(16)),function(b){return b.toString(16).padStart(2,'0')}).join('');try{localStorage.setItem('ayneh-v',v)}catch(e){}}return v})();
var tracked={};
function track(kind,meta,once){if(STUDIO_PREVIEW)return;if(once){if(tracked[kind+meta])return;tracked[kind+meta]=1}try{fetch('/api/s/'+SLUG+'/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:kind,v:VISITOR,meta:meta==null?'':String(meta)}),keepalive:true}).catch(function(){})}catch(e){}}

/* ---------- boot ---------- */
(async function boot(){
 if(STUDIO_PREVIEW){
  window.addEventListener('message',function(e){
   if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='ayneh-salon-draft')return;
   state.pub=e.data.page;
   applyBrand(e.data.brand);
   state.step=1;
   state.tab=hasLineWork(state.line)?'salon':'catalog';
   renderAll();
   parent.postMessage({type:'ayneh-salon-rendered',id:e.data.id},location.origin);
  });
  try{
   var sample=await api('public');
   if(state.pub||!sample.salon)return;
   state.pub=sample;
   state.tab=hasLineWork(state.line)?'salon':'catalog';
   renderAll();
  }catch(e){if(!state.pub?.salon)showFatal(e.message)}
  return;
 }
 try{state.pub=await api('public')}catch(e){showFatal(e.message);return}
 // Referral: who brought this visitor (kept by the server for good) and the tag for her own shares.
 var refIn=(location.search.match(/[?&]r=([a-z0-9]{1,20})/)||[])[1]||'';
 try{var rr=await Promise.race([api('ref',{v:VISITOR,r:refIn}),sleep(2500).then(function(){return null})]);if(rr){state.tag=rr.tag;state.mine=rr.mine||null}}catch(e){}
 if(refIn&&history.replaceState){try{history.replaceState(null,'',location.pathname)}catch(e){}}
 if(state.mine)state.pub.portfolio=(state.pub.portfolio||[]).slice().sort(function(a,b){return (b.maker===state.mine)-(a.maker===state.mine)});
 document.title=state.pub.direct?'آینه | روی عکس خودت ببین چی بهت میاد':state.pub.salon.name+' | آینه';
 if(state.pub.salon.profile?.brand)applyBrand(state.pub.salon.profile.brand);
 if(state.pub.trial)trialBar(state.pub.trial);
 if((state.pub.demo||FROM_LANDING)&&!$('.trialbar'))ownerReturnBar();
 var lq=(location.search.match(/[?&]l=(hair|color|nails|lashes)/)||[])[1];var lm=null;try{lm=localStorage.getItem('ayneh-line-'+SLUG)}catch(e){}
 var pendings={};['hair','color','nails','lashes'].forEach(function(k){try{var j=sessionStorage.getItem('ayneh-job-'+SLUG+'-'+k);if(j)pendings[k]=j}catch(e){}});
 if(!lq){var pk=Object.keys(pendings);if(pk.length&&!lm)lq=pk[0]}
 /* A salon that bought one service shows only that service's lines. */
 if(state.pub.lines&&state.pub.lines.length){var keep=state.pub.lines;LINE_LIST=LINE_LIST.filter(function(x){return keep.indexOf(x[0])>=0});Object.keys(LINES.label).forEach(function(k){if(keep.indexOf(k)<0)delete LINES.label[k]});if(lq&&keep.indexOf(lq)<0)lq=null;if(lm&&keep.indexOf(lm)<0)lm=null}
 state.line=lq||(LINES.label[lm]?lm:LINE_LIST[0][0]);document.body.setAttribute('data-line',state.line);
 // The landing page hands over the look the visitor picked: ?s=<hair style index>&c=<colour name>.
 var qs=(location.search.match(/[?&]s=(\d{1,2})/)||[])[1],qc=(location.search.match(/[?&]c=([^&]{1,240})/)||[])[1];
 /* The landing no longer pre-picks a look (owner's decision): she chooses it after her photo. */
 // Open on the salon's own work for this line when it has some, otherwise on the ready-made looks.
 state.tab=hasLineWork(state.line)?'salon':'catalog';
 if(studio()&&!Object.keys(pendings).length)restoreStudio();
 /* From the profile's saved looks (/?l=nails&pick=3): that look is already chosen. */
 var pk=(location.search.match(/[?&]pick=(\d{1,3})/)||[])[1];if(pk&&studio()&&itemOf(state.line+':'+pk)){state.style=+pk;state.tab='catalog'}
 renderAll();
 if(SLUG==='demo'&&/[?&]draft=1/.test(location.search)){try{var draft=await window.__AYN_DRAFT.take();if(draft&&draft.file){/* nothing is pre-chosen: after her photo she picks the look herself, then taps «بساز» */state.style=null;state.color='';if(EMBED){state.preview=URL.createObjectURL(draft.file);renderFlow();var continuePhoto=async function(){await handleFile(draft.file,'original');if(state.original){clearTimeout(state.advT);state.justUploaded=false;go(2)}};await ensureSession();if(state.verified||!state.pub.otp)continuePhoto();else openOtp(continuePhoto)}else handleFile(draft.file,'original')}}catch(e){toast('عکس را دوباره از گالری انتخاب کن','error')}}
 Object.keys(pendings).forEach(function(k){if(!LINES.label[k])return;var o=lineRef(k);o.gen=pendings[k];o.step=3;o.busy=true;o.genT0=Date.now()-8000;poll(pendings[k],true,k)});if(Object.keys(pendings).length){renderFlow();renderDock()}
 track('view',refIn?'share':'',true);
 renderInvite();
 maybeTour();
 loadMine();
})();

/* ---------- free trial strip: brand colour, time left, images left ---------- */
function applyBrand(brand){
 var root=document.documentElement;
 if(/^#[0-9a-f]{6}$/i.test(brand||'')){
  var n=parseInt(brand.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;
  var channels=[r,g,b],mix=function(k,to){return channels.map(function(c){return Math.round(c+(to-c)*k)})};
  var luminance=function(rgb){return rgb.map(function(c){c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)}).reduce(function(sum,c,i){return sum+c*[.2126,.7152,.0722][i]},0)};
  var whiteSafe=function(k){return 1.05/(luminance(mix(k,0))+.05)>=4.5};
  var actionMix=.18,inkMix=.45;
  while(actionMix<.94&&!whiteSafe(actionMix))actionMix+=.03;
  while(inkMix<.94&&!whiteSafe(inkMix))inkMix+=.03;
  var css=function(rgb){return 'rgb('+rgb.join(',')+')'};
  root.style.setProperty('--accent',css(mix(actionMix,0)));
  root.style.setProperty('--accent-ink',css(mix(inkMix,0)));
  root.style.setProperty('--accent-soft',css(mix(.82,255)));
  root.style.setProperty('--accent-ring','rgba('+r+','+g+','+b+',.3)');
 }
}
function trialBar(t){
 applyBrand(t.brand);
 var bar=el('div',{class:'trialbar',role:'status'}),fa=function(x){return String(x).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})};
 function paint(){var ms=t.expires_at-Date.now();if(t.expired||ms<=0){bar.textContent='مهلت صفحهٔ آزمایشی تمام شد. برای ادامه با آینه تماس بگیرید.';bar.classList.add('is-over');var main=$('#main');if(main&&!$('.trial-over')){main.replaceChildren(el('div',{class:'panel fatal trial-over'},[h('h1','مهلت صفحهٔ آزمایشی تمام شد'),h('p','این صفحه ۱۰ ساعت و ۵ تصویر برای امتحان داشت. برای نسخهٔ دائمی با آینه تماس بگیرید.','muted'),el('a',{class:'btn btn--primary',href:'/#salon-example',text:'درخواست نسخهٔ دائمی'})]))}return}
  var m=Math.ceil(ms/60000),hh=Math.floor(m/60),mm=m%60;bar.textContent='صفحهٔ آزمایشی · '+fa(hh)+' ساعت و '+fa(mm)+' دقیقه مانده · '+fa(t.images_left)+' تصویر از '+fa(t.images_limit)}
 paint();document.body.prepend(bar);setInterval(paint,30000);
 window.__trialLeft=function(){return api('public').then(function(p){if(p.trial){t.images_left=p.trial.images_left;t.expired=p.trial.expired;paint()}}).catch(function(){})};
}

function ownerReturnBar(){
 var bar=el('div',{class:'trialbar owner-return',role:'status'},[
  el('span',{class:'owner-return__note',text:'بازگشت به صفحهٔ آرایشگرها · اینجا نمونه‌ای از صفحه‌ای است که مشتری شما می‌بیند.'+(state.pub.demo?' یک نمونهٔ رایگان.':'')}),
  el('a',{class:'owner-return__cta',href:'/?utm_source=ayneh_demo&utm_medium=demo_return&utm_campaign=owner_preview#salon-example',text:'ساخت صفحهٔ من'})
 ]);document.body.prepend(bar);return bar;
}
function showFatal(msg){
 var main=$('#main');if(!main)return;
 main.replaceChildren(el('div',{class:'panel fatal'},[h('h1','این صفحه باز نشد'),h('p',msg,'muted'),el('a',{class:'btn btn--primary',href:'/',text:'بازگشت به آینه'})]));
 var dock=$('#dock');if(dock)dock.hidden=true;
}

/* ---------- header ---------- */
function heroTag(){return {nails:'طرح ناخن بعدی‌ات را روی عکس دست خودت ببین و برای ناخن‌کار بفرست.',lashes:'مدل مژهٔ بعدی‌ات را روی عکس خودت ببین و برای مژه‌کار بفرست.',color:'رنگ موی بعدی‌ات را روی عکس خودت ببین؛ حتی روی مدل موی جدیدت.'}[state.line]||'مدل موی بعدی‌ات را روی عکس خودت ببین و برای آرایشگر بفرست.'}
/* ---------- the customers' studio (main domain «/»): the direct salon's page, in studio mode ----------
   No salon here: the header is the customer's own — her coin wallet, a way to the salons' site and
   one start button. The four lines, the steps, the gallery and the dock below are the same page. */
var COIN='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#E9B949" stroke="#B9822E" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="#B9822E" stroke-width="1.3"/><path d="M12 8.6v6.8M9.6 10.4 12 8.6l2.4 1.8" fill="none" stroke="#8A5A14" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var GIFT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5S10.8 4 8.3 4a2.2 2.2 0 0 0 0 4.5H12zM12 8.5S13.2 4 15.7 4a2.2 2.2 0 0 1 0 4.5H12z"/></svg>';
function studio(){return !!(state.pub&&state.pub.direct&&!EMBED)}
function openWallet(){if(studio()&&state.pub&&state.pub.otp&&!state.verified){openSignin(function(){paintWallet(true);renderAll()},state.me&&state.me.phone?'login':'signup','کیف سکه مال حساب توست؛ حساب تازه ۲ عکس اول را رایگان دارد.');return}if(window.AynehPacks){track('wallet','open');window.AynehPacks.open()}}
var ctaWatch=null,studioAsked=false;
function watchCta(){
 if(!('IntersectionObserver' in window))return;
 if(ctaWatch)ctaWatch.disconnect();
 var c=document.querySelector('.studio__cta');if(!c)return;
 ctaWatch=new IntersectionObserver(function(es){document.body.classList.toggle('cta-on-screen',es[0].isIntersecting)},{threshold:.6});
 ctaWatch.observe(c);
}

/* ---------- sign-in («ورود یا ثبت‌نام»), studio only ----------
   One flow for both: her mobile, a texted code, and her name only the first time. No password.
   Her coins and images follow her mobile, so signing in on another phone brings them along.
   /login shows it as a page; «بساز» shows the same form in a sheet when she is not signed in. */
function accountPage(){var m=location.pathname.match(/^\/(login|signup|profile)\/?$/);return m?m[1]:''}
function accountMode(){return studio()&&!!accountPage()}
function accountChip(){
 if(state.verified){var nm=String((state.me&&state.me.name)||'').trim().split(/\s+/)[0]||'حساب من';var a=el('a',{class:'acct-chip acct-chip--in',href:'/profile','aria-label':'حساب من: '+nm,html:ICO.user});a.append(el('span',{text:nm}));return a}
 return el('a',{class:'acct-chip',href:'/login?next=/',html:ICO.user+'<span>ورود</span>'})
}
var CITIES=['تهران','مشهد','اصفهان','کرج','شیراز','تبریز','قم','اهواز','کرمانشاه','ارومیه','رشت','زاهدان','همدان','کرمان','یزد','اردبیل','بندرعباس','اراک','زنجان','سنندج','قزوین','خرم‌آباد','گرگان','ساری','بجنورد','بوشهر','بیرجند','ایلام','شهرکرد','یاسوج','سمنان','کاشان','نیشابور','سبزوار','آمل','بابل','دزفول','کیش','خارج از ایران'];
function nextPath(){var n=(location.search.match(/[?&]next=([^&#]*)/)||[])[1]||'';try{n=decodeURIComponent(n)}catch(e){return ''}if(!/^\/(?![\/\\])/.test(n)||/[\\\s]/.test(n))return '';try{var u=new URL(n,location.origin);return u.origin===location.origin?u.pathname+u.search:''}catch(e){return ''}}
/* Two forms, one look: «ورود» (mobile → code) and «ثبت‌نام» (name, family name, mobile, city → code).
   mode: 'login' | 'signup'. swap(mode, phone) moves to the other form keeping the typed mobile. */
function authForm(mode,done,swap,prefill){
 var box=el('div',{class:'signin'}),timer=null,last=null;
 var phoneWrap=wrapField('siPhone','شمارهٔ موبایل','tel',prefill||(state.me&&state.me.phone)||'','۰۹۱۲ ۱۲۳ ۴۵۶۷',{inputmode:'tel',autocomplete:'tel'});
 phoneWrap.querySelector('input').setAttribute('dir','ltr');
 var firstWrap=wrapField('siFirst','نام','text','','',{autocomplete:'given-name'}),lastWrap=wrapField('siLast','نام خانوادگی','text','','',{autocomplete:'family-name'});
 var cityWrap=wrapField('siCity','شهر محل زندگی','text','','مثلاً مشهد',{autocomplete:'address-level2'});
 var cin=cityWrap.querySelector('input');cin.setAttribute('list','siCities');
 var dl=el('datalist',{id:'siCities'},CITIES.map(function(c){return el('option',{value:c})}));
 var label=mode==='signup'?'ثبت‌نام و دریافت کد':'دریافت کد ورود';
 var send=el('button',{class:'btn btn--primary btn--block btn--lg',type:'submit',text:label});
 var fields=mode==='signup'?[el('div',{class:'signin__pair'},[firstWrap,lastWrap]),phoneWrap,cityWrap,dl]:[phoneWrap];
 var miss=el('div',{class:'notice notice--info signin__miss',hidden:true});
 var f1=el('form',{class:'signin__form',novalidate:'true'},fields.concat([miss,send]));
 function step1(){clearInterval(timer);box.replaceChildren(f1);setTimeout(function(){var i=(mode==='signup'?firstWrap:phoneWrap).querySelector('input');if(i&&!i.value)i.focus()},60)}
 f1.addEventListener('submit',function(e){
  e.preventDefault();miss.hidden=true;
  var num=normalizePhone(phoneWrap.querySelector('input').value),ok=true,body={phone:num};
  if(mode==='signup'){
   var first=firstWrap.querySelector('input').value.trim(),lastName=lastWrap.querySelector('input').value.trim(),city=cin.value.trim();
   ok=validate(firstWrap,function(){return first.length>=2},'نام را بنویس')&ok;
   ok=validate(lastWrap,function(){return lastName.length>=2},'نام خانوادگی را بنویس')&ok;
   body.first_name=first;body.last_name=lastName;body.city=city;body.signup=true;
  }else body.signin=true;
  ok=validate(phoneWrap,function(){return /^\+989\d{9}$/.test(num)},'شمارهٔ موبایل درست نیست؛ مثل ۰۹۱۲۱۲۳۴۵۶۷')&ok;
  if(mode==='signup')ok=validate(cityWrap,function(){return body.city.length>=2},'شهرت را بنویس')&ok;
  if(!ok)return;
  send.disabled=true;send.textContent='در حال فرستادن…';
  ensureSession().then(function(){return api('otp/send',body)}).then(function(d){
   send.disabled=false;send.textContent=label;
   if(d&&(d.need_signup||d.need_name)){
    miss.hidden=false;send.hidden=true;phoneWrap.querySelector('input').addEventListener('input',function(){miss.hidden=true;send.hidden=false},{once:true});miss.replaceChildren(el('span',{text:'این شماره هنوز حساب ندارد. با چند ثانیه ثبت‌نام، حسابت ساخته می‌شود.'}),el('button',{class:'btn btn--primary btn--sm',type:'button',text:'ثبت‌نام با همین شماره',onclick:function(){swap('signup',phoneWrap.querySelector('input').value)}}));
    return;
   }
   last={body:body,shown:'0'+num.slice(3)};step2();
  }).catch(function(err){send.disabled=false;send.textContent=label;toast(err.message,'error')});
 });
 function step2(){
  var codeWrap=wrapField('siCode','کد ۵ رقمی','text','','',{autocomplete:'one-time-code',inputmode:'numeric'});
  var input=codeWrap.querySelector('input');input.setAttribute('dir','ltr');input.classList.add('signin__code');
  var verify=el('button',{class:'btn btn--primary btn--block btn--lg',type:'submit',text:mode==='signup'?'تأیید و ساخت حساب':'ورود'});
  var again=el('button',{class:'btn btn--ghost btn--sm',type:'button',disabled:true,text:''});
  var edit=el('button',{class:'btn btn--ghost btn--sm',type:'button',text:'ویرایش شماره',onclick:step1});
  var f2=el('form',{class:'signin__form',novalidate:'true'},[el('p',{class:'signin__sent'},['کد به ',el('b',{dir:'ltr',text:fa0(last.shown).replace(/^(.{4})(.{3})(.+)$/,'$1 $2 $3')}),' پیامک شد.']),codeWrap,verify,el('div',{class:'signin__row'},[again,edit])]);
  box.replaceChildren(f2);
  var left=60;function tick(){if(!box.isConnected){clearInterval(timer);return}again.disabled=left>0;again.textContent=left>0?'ارسال دوباره تا '+fa(left)+' ثانیه':'ارسال دوبارهٔ کد';if(left>0)left--}
  clearInterval(timer);tick();timer=setInterval(tick,1000);setTimeout(function(){input.focus()},60);
  again.addEventListener('click',function(){again.disabled=true;api('otp/send',last.body).then(function(){left=60;toast('کد تازه فرستاده شد')}).catch(function(err){toast(err.message,'error')})});
  /* A full code submits itself (iOS fills it from the SMS). */
  input.addEventListener('input',function(){var v=normalizeDigits(input.value).replace(/\D/g,'');if(v.length>=5&&!verify.disabled)f2.requestSubmit?f2.requestSubmit():verify.click()});
  f2.addEventListener('submit',function(e){
   e.preventDefault();var code=normalizeDigits(input.value).replace(/\D/g,'');
   if(!validate(codeWrap,function(){return /^\d{3,12}$/.test(code)},'کد را همان‌طور که پیامک شده بنویس'))return;
   verify.disabled=true;verify.textContent='لطفاً صبر کن…';
   api('otp/verify',{code:code}).then(function(d){
    clearInterval(timer);state.verified=true;
    state.me=Object.assign({},state.me||{},{name:d.name,phone:'0'+String(d.phone).replace(/^\+98/,'')});
    try{localStorage.setItem('ayneh-me',JSON.stringify(state.me))}catch(err){}
    track('cta',mode);loadSaves(true);loadSession().catch(function(){}).then(function(){paintWallet(true);done(d)});
   }).catch(function(err){verify.disabled=false;verify.textContent=mode==='signup'?'تأیید و ساخت حساب':'ورود';toast(err.message,'error')});
  });
 }
 step1();
 return box;
}
function authSwitch(mode,go){
 return el('p',{class:'signin__alt'},mode==='login'?['حساب نداری؟ ',el('a',{href:'#',text:'ثبت‌نام کن',onclick:function(e){e.preventDefault();go('signup')}})]:['قبلاً ثبت‌نام کردی؟ ',el('a',{href:'#',text:'وارد شو',onclick:function(e){e.preventDefault();go('login')}})]);
}
function normalizeDigits(v){return String(v||'').replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)}).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)})}
var SIGNIN_PERKS=[['coin','سکه‌ها و عکس‌هات روی هر گوشی همراهت می‌مونه'],['lock','رمز نمی‌خواد؛ هر بار یه کد پیامکی'],['gift','۲ عکس اول رایگانه']];
function perks(mode){return el('ul',{class:'signin__perks'},SIGNIN_PERKS.filter(function(p){return mode!=='login'||p[0]!=='gift'}).map(function(p){return el('li',{},[el('span',{class:'signin__perk-ico',html:p[0]==='coin'?COIN:p[0]==='gift'?GIFT:ICO.lock}),el('span',{text:p[1]})])}))}
function openSignin(next,mode,why){
 var panel=el('div',{class:'sheet__panel signin-sheet'});
 function draw(m,ph){
  mode=m;
  panel.replaceChildren(
   el('div',{class:'sheet__head'},[h('h2',m==='signup'?'ثبت‌نام':'ورود'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]),
   h('p',why||(m==='signup'?'برای ساخت عکس، یک حساب رایگان بساز. رمز لازم نیست؛ یک کد پیامکی می‌گیری.':'با شمارهٔ موبایلت وارد شو؛ یک کد پیامکی برایت می‌فرستیم.'),'muted'),
   authForm(m,function(){closeSheet();renderHead();if(!next)toast(m==='signup'?'حسابت ساخته شد':'خوش اومدی');if(next)next()},draw,ph),
   authSwitch(m,function(x){draw(x)}),perks(m));
 }
 draw(mode||'login');
 openSheet(panel);
}
function renderAccount(){
 ['#steps','#flow','#side','#dock','#invite','#mine'].forEach(function(q){var n=$(q);if(n)n.hidden=true});
 document.body.classList.add('is-studio');
 var page=accountPage(),head=$('#head');head.classList.add('head--studio','head--account');
 var bar=el('div',{class:'hero__bar'},[el('a',{class:'brand brand--studio',href:'/','aria-label':'آینه، صفحهٔ اصلی',html:MARK+'<span>آینه</span>'}),el('div',{class:'hero__tools'},[el('a',{class:'btn btn--ghost btn--sm',href:'/',html:'<span class="ico-back">'+ICO.arrow+'</span><span>صفحهٔ اصلی</span>'})])]);
 var next=nextPath();
 var card=el('section',{class:'account panel','aria-busy':'true'},[el('div',{class:'skel',style:'width:64px;height:64px;border-radius:50%;justify-self:center'}),el('div',{class:'skel',style:'height:28px;width:55%;justify-self:center'}),el('div',{class:'skel',style:'height:52px;border-radius:14px'}),el('div',{class:'skel',style:'height:52px;border-radius:14px'})]);
 head.replaceChildren(el('div',{class:'wrap'},[bar,card]));
 var foot=$('#foot');if(foot)foot.textContent=STUDIO_PRIVACY;
 function to(path){history.replaceState(null,'',path+(next?'?next='+encodeURIComponent(next):''));renderAccount()}
 function authPage(m,ph){
  document.title=(m==='signup'?'ثبت‌نام':'ورود')+' | آینه';
  card.className='account panel';
  card.replaceChildren(
   el('span',{class:'account__avatar',html:ICO.user}),
   el('h1',{class:'account__title',text:m==='signup'?'ساخت حساب':'ورود به حساب'}),
   el('p',{class:'account__sub',text:m==='signup'?'نام، شماره و شهرت را بنویس؛ با یک کد پیامکی حسابت ساخته می‌شود.':'شمارهٔ موبایلت را بنویس تا کد ورود برایت پیامک شود.'}),
   state.pub.otp?authForm(m,function(){location.href=next||'/profile'},function(x,phone){history.replaceState(null,'','/'+x+(next?'?next='+encodeURIComponent(next):''));authPage(x,phone)},ph):el('p',{class:'notice notice--info',text:'ورود با شماره موبایل به‌زودی فعال می‌شود.'}),
   authSwitch(m,function(x){history.replaceState(null,'','/'+x+(next?'?next='+encodeURIComponent(next):''));authPage(x)}),
   perks(m));
 }
 ensureSession().then(function(){
  card.removeAttribute('aria-busy');
  if(page==='profile'){if(state.verified)profilePage(card);else to('/login')}
  else if(state.verified){location.replace(next||'/profile')}
  else authPage(page);
 }).catch(function(){card.removeAttribute('aria-busy');page==='profile'?to('/login'):authPage(page)});
}
/* «پروفایل من»: who she is, her coins, her album, saved looks and coin history — one place. */
function profilePage(card){
 document.title='پروفایل من | آینه';
 card.className='profile';
 card.replaceChildren(el('div',{class:'skel',style:'height:140px;border-radius:20px'}),el('div',{class:'skel',style:'height:90px;border-radius:20px'}));
 Promise.all([api('me'),loadSaves(true),new Promise(function(r){api('looks').then(function(d){looks=d.looks||[];r()}).catch(function(){r()})})]).then(function(r){
  var me=r[0];if(!me||!me.signed_in){location.replace('/login?next=/profile');return}
  var full=(me.first_name+' '+me.last_name).trim(),ini=(me.first_name||'?').slice(0,1);
  var since='';try{if(me.since){var d0=new Date(me.since);since=new Intl.DateTimeFormat('fa-IR',{month:'long'}).format(d0)+' '+new Intl.DateTimeFormat('fa-IR',{year:'numeric'}).format(d0).replace(/[^۰-۹]/g,'')}}catch(e){}
  var idCard=el('section',{class:'panel profile__id'},[
   el('span',{class:'profile__avatar',text:ini,'aria-hidden':'true'}),
   el('div',{class:'profile__who'},[el('h1',{text:full||'حساب من'}),el('p',{},[el('span',{dir:'ltr',class:'profile__phone',text:fa0(me.phone)}),me.city?'، '+me.city:'']),since?el('p',{text:'عضو از '+since}):null]),
   el('button',{class:'btn btn--ghost btn--sm',type:'button',html:ICO.edit?ICO.edit+'<span>ویرایش</span>':'ویرایش',onclick:function(){editProfile(me,function(){profilePage(card)})}})
  ]);
  var stats=el('div',{class:'profile__stats'},[
   stat(fa(me.made||0),'عکس ساخته‌شده'),stat(fa((saves.saved||[]).length),'ذخیره‌شده'),stat(fa((saves.liked||[]).length),'پسندیده')
  ]);
  var w=el('div',{class:'wallet',id:'wallet'});
  var walletBox=el('section',{class:'panel profile__sec'},[el('div',{class:'profile__sechead'},[el('h2',{text:'کیف سکه'})]),w]);
  var tabsBar=el('div',{class:'seg',role:'tablist'}),tabBody=el('div',{class:'profile__tab'});
  var TABS=[['album','آلبوم'],['saved','ذخیره‌ها'],['liked','پسندیده‌ها'],['consult','مشاوره‌ها'],['history','تراکنش‌ها']],cur='album';
  function drawTabs(){
   tabsBar.replaceChildren.apply(tabsBar,TABS.map(function(t){return el('button',{type:'button',role:'tab','aria-selected':String(cur===t[0]),text:t[1],onclick:function(){cur=t[0];drawTabs()}})}));
   if(cur==='album')tabBody.replaceChildren(looks&&looks.length?el('div',{class:'pgrid'},looks.map(function(l){return el('button',{class:'pgrid__item',type:'button',onclick:function(){openLook(l)}},[el('img',{src:media(l.image),alt:'',loading:'lazy'}),el('span',{},[el('b',{text:lookTitle(l)}),el('small',{text:LINES.label[l.line]+'، '+lookDate(l.at)})])])})):empty('هنوز عکسی نساختی','از استودیو یک مدل انتخاب کن و روی عکس خودت ببین.','/','رفتن به استودیو'));
   else if(cur==='saved'||cur==='liked'){var lk=cur==='liked',items=(lk?saves.liked:saves.saved||[]).map(itemOf).filter(Boolean);tabBody.replaceChildren(items.length?el('div',{class:'pgrid'},items.map(function(it){return el('a',{class:'pgrid__item',href:'/?l='+it.line+'&pick='+it.i},[el('img',{src:it.img,alt:'',loading:'lazy'}),el('span',{},[el('b',{text:it.name}),el('small',{text:LINES.label[it.line]})])])})):empty(lk?'هنوز مدلی نپسندیدی':'هنوز چیزی ذخیره نکردی',lk?'روی قلب کنار هر مدل بزن تا اینجا بماند.':'روی نشان ذخیره کنار هر مدل بزن تا اینجا بماند.','/','دیدن مدل‌ها'))}
   else if(cur==='consult'){
    tabBody.replaceChildren(el('p',{class:'muted',text:'در حال بارگذاری…'}));
    api('consults').then(function(d){
     if(cur!=='consult')return;
     var items=(d&&d.consultations)||[];
     if(!items.length){tabBody.replaceChildren(empty('هنوز مشاوره‌ای ذخیره نکردی','در استودیو «نمی‌دونی چی بهت میاد؟ تحلیلش کنیم» را بزن و پیشنهادها را ببین.','/','رفتن به استودیو'));return}
     tabBody.replaceChildren(el('div',{class:'clist'},items.map(function(c){
      return el('button',{class:'clist__row',type:'button',onclick:function(){openConsultDetail(c.id)}},[
       c.result_id?el('img',{src:media(c.result_id),alt:'',loading:'lazy'}):el('span',{class:'consult-card__ico',html:ICO.spark}),
       el('span',{class:'clist__txt'},[el('b',{text:c.top||LINES.label[c.line]}),el('small',{text:LINES.label[c.line]+'، '+lookDate(c.at)})]),
       el('span',{class:'ico',html:ICO.arrow})
      ]);
     })));
    }).catch(function(e){if(cur==='consult')tabBody.replaceChildren(el('p',{class:'hint',text:e.message}))});
   }
   else tabBody.replaceChildren(me.history&&me.history.length?el('ul',{class:'ledger'},me.history.map(function(x){var plus=x.coins>0;return el('li',{},[el('span',{class:'ledger__ico'+(plus?' is-plus':''),html:plus?COIN:ICO.spark}),el('span',{class:'ledger__txt'},[el('b',{text:x.views?'نمای ۳۶۰ درجه'+(x.kind==='gift'?' (هدیه)':''):x.kind==='gift'?'عکس هدیه، '+(LINES.label[x.line]||''):x.kind==='image'?'ساخت عکس، '+(LINES.label[x.line]||''):x.kind==='referral'?'هدیهٔ دعوت دوست':x.kind==='owner'?'هدیهٔ آینه':'شارژ کیف سکه'}),el('small',{text:lookDate(x.at)})]),el('b',{class:'ledger__amt'+(plus?' is-plus':''),dir:'ltr',text:x.kind==='gift'?'هدیه':(plus?'+':'−')+fa(Math.abs(x.coins))})])})):empty('هنوز تراکنشی نداری','هر عکسی که بسازی یا هر شارژی که انجام بدهی اینجا ثبت می‌شود.'));
  }
  function stat(v,l){return el('div',{class:'profile__stat'},[el('b',{html:v}),el('span',{text:l})])}
  function empty(t,sub,href,cta){return el('div',{class:'empty'},[el('b',{text:t}),el('p',{text:sub}),href?el('a',{class:'btn btn--soft btn--sm',href:href,text:cta}):null])}
  drawTabs();
  var out=el('button',{class:'btn btn--ghost btn--block account__out',type:'button',text:'خروج از حساب',onclick:function(e){var b=e.currentTarget;b.disabled=true;api('otp/logout',{}).then(function(){state.verified=false;state.me={};looks=null;saves={saved:[],liked:[]};try{localStorage.removeItem('ayneh-me')}catch(x){}walletData=null;location.href='/'}).catch(function(err){b.disabled=false;toast(err.message,'error')})}});
  var invite=el('section',{class:'panel profile__sec',hidden:true});
  if(window.AynehPacks)window.AynehPacks.me(true).then(function(d){if(!d||!d.referral)return;var link=d.referral.link;invite.hidden=false;invite.replaceChildren(el('div',{class:'profile__sechead'},[el('h2',{text:'آرایشگرت را دعوت کن'})]),el('p',{class:'muted',text:'لینک دعوتت را برای آرایشگرت بفرست؛ اگر او هم از آینه برای سالنش استفاده کند، '+fa(d.referral.images*d.image_coins)+' سکه هدیه می‌گیری.'}),el('button',{class:'btn btn--soft',type:'button',text:'کپی لینک دعوت',onclick:function(e){var b=e.currentTarget;(navigator.clipboard?navigator.clipboard.writeText(link):Promise.reject()).then(function(){b.textContent='لینک کپی شد'},function(){toast(link)})}}))}).catch(function(){});
  card.replaceChildren(idCard,stats,walletBox,el('section',{class:'panel profile__sec'},[tabsBar,tabBody]),invite,out);
  paintWallet(true);
 }).catch(function(e){toast(e.message,'error')});
}
function editProfile(me,done){
 var panel=el('div',{class:'sheet__panel signin-sheet'});
 var f=wrapField('pfFirst','نام','text',me.first_name,'',{autocomplete:'given-name'}),l=wrapField('pfLast','نام خانوادگی','text',me.last_name,'',{autocomplete:'family-name'}),c=wrapField('pfCity','شهر محل زندگی','text',me.city,'',{autocomplete:'address-level2'});
 c.querySelector('input').setAttribute('list','pfCities');
 var save=el('button',{class:'btn btn--primary btn--block btn--lg',type:'submit',text:'ذخیرهٔ تغییرات'});
 var form=el('form',{class:'signin__form',novalidate:'true'},[el('div',{class:'signin__pair'},[f,l]),c,el('datalist',{id:'pfCities'},CITIES.map(function(x){return el('option',{value:x})})),save]);
 form.addEventListener('submit',function(e){e.preventDefault();var b={first_name:f.querySelector('input').value.trim(),last_name:l.querySelector('input').value.trim(),city:c.querySelector('input').value.trim()};
  var ok=validate(f,function(){return b.first_name.length>=2},'نام را بنویس')&validate(l,function(){return b.last_name.length>=2},'نام خانوادگی را بنویس')&validate(c,function(){return b.city.length>=2},'شهرت را بنویس');if(!ok)return;
  save.disabled=true;api('me',b).then(function(d){state.me=Object.assign({},state.me||{},{name:d.name});try{localStorage.setItem('ayneh-me',JSON.stringify(state.me))}catch(x){}closeSheet();toast('ذخیره شد');done()}).catch(function(err){save.disabled=false;toast(err.message,'error')})});
 panel.append(el('div',{class:'sheet__head'},[h('h2','ویرایش اطلاعات'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]),el('p',{class:'muted',text:'شمارهٔ موبایل همان شماره‌ای است که با آن وارد شدی.'}),form);
 openSheet(panel);
}
/* ---------- saved and liked looks ---------- */
var saves={saved:[],liked:[]},savesAt=0;
function loadSaves(force){if(!state.verified){saves={saved:[],liked:[]};return Promise.resolve(saves)}if(!force&&Date.now()-savesAt<5000)return Promise.resolve(saves);savesAt=Date.now();return ensureSession().then(function(){return api('saves')}).then(function(d){saves={saved:d.saved||[],liked:d.liked||[]};return saves}).catch(function(){return saves})}
function isOn(kind,item){return (saves[kind==='like'?'liked':'saved']||[]).indexOf(item)>=0}
function toggleSave(kind,item,btn){
 /* Likes and saves live in her account: signed out, sign in first, then it is done for her. */
 if(!state.verified){openSignin(function(){loadSaves(true).then(function(){if(!isOn(kind,item))toggleSave(kind,item,btn);else if(btn){btn.classList.add('is-on');btn.setAttribute('aria-pressed','true')}renderAll()})},state.me&&state.me.phone?'login':'signup',kind==='like'?'پسندیدن مدل‌ها مخصوص حساب توست؛ پسندیده‌هایت در پروفایلت می‌مانند.':'ذخیرهٔ مدل‌ها مخصوص حساب توست؛ ذخیره‌ها در پروفایلت می‌مانند.');return}
 var list=saves[kind==='like'?'liked':'saved'],on=list.indexOf(item)<0;
 if(on)list.unshift(item);else list.splice(list.indexOf(item),1);
 if(btn){btn.classList.toggle('is-on',on);btn.setAttribute('aria-pressed',String(on))}
 if(kind==='like'&&trend.likes){trend.likes[item]=Math.max(0,(trend.likes[item]||0)+(on?1:-1));var n=btn&&btn.querySelector('.react__n');if(n)n.textContent=trend.likes[item]?fa(trend.likes[item]):''}
 if(kind==='save')toast(on?'ذخیره شد؛ در پروفایلت می‌بینی':'از ذخیره‌ها برداشته شد');
 ensureSession().then(function(){return api('saves',{kind:kind,item:item,on:on})}).catch(function(e){toast(e.message,'error')});
}
function itemOf(key){
 var m=String(key).match(/^(hair|color|nails|lashes):(\d+)$/);if(!m)return null;
 var line=m[1],i=+m[2],list=line==='hair'?STYLES:(LINES[line]&&LINES[line].styles);if(!list||!list[i])return null;
 return {line:line,i:i,name:list[i][0],img:'/catalog/'+(line==='hair'?'':line+'/')+String(i+1).padStart(2,'0')+'.webp'};
}
var trend={score:{},likes:{}},trendAt=0;
function loadTrend(){if(Date.now()-trendAt<60000)return Promise.resolve(trend);trendAt=Date.now();return api('trending').then(function(d){trend={score:d.score||{},likes:d.likes||{}};return trend}).catch(function(){return trend})}
function reactBtns(item){
 var like=el('button',{class:'react react--like'+(isOn('like',item)?' is-on':''),type:'button','aria-label':'پسندیدن','aria-pressed':String(isOn('like',item)),html:ICO.heart+'<span class="react__n">'+(trend.likes[item]?fa(trend.likes[item]):'')+'</span>'});
 var save=el('button',{class:'react react--save'+(isOn('save',item)?' is-on':''),type:'button','aria-label':'ذخیره','aria-pressed':String(isOn('save',item)),html:ICO.bookmark});
 like.addEventListener('click',function(e){e.stopPropagation();toggleSave('like',item,like)});
 save.addEventListener('click',function(e){e.stopPropagation();toggleSave('save',item,save)});
 return el('div',{class:'react-row'},[like,save]);
}

/* ---------- «آلبوم من» (studio): every finished image of hers, newest first ----------
   Free to look at, compare two side by side and save again; it follows her mobile once she signs in. */
var looks=null,looksAt=0;
function loadLooks(){if(!state.verified){looks=null;drawAlbum();return}if(Date.now()-looksAt<3000)return;looksAt=Date.now();api('looks').then(function(d){looks=d.looks||[];drawAlbum()}).catch(function(){})}
function lookDate(t){try{return new Intl.DateTimeFormat('fa-IR',{month:'long',day:'numeric'}).format(new Date(t))}catch(e){return ''}}
/* A look's own name: the catalog style, her typed words, or «از عکس خودت». */
function lookTitle(l){var it=l.style!==null&&l.style!==undefined?itemOf(l.line+':'+l.style):null;return it?it.name:l.text?l.text:/reference|style/.test(l.mode||'')?'مدل از عکس خودت':(LINES.label[l.line]||'')}
function lineLooks(){return (looks||[]).filter(function(l){return l.line===state.line})}
/* Home: the album of the service she is on (the profile shows them all). */
function drawAlbum(){
 var box=$('#album');if(!box)return;
 var mine=lineLooks();
 if(!state.verified||!mine.length){box.hidden=true;return}
 box.hidden=false;
 var strip=el('div',{class:'album__strip'},mine.slice(0,12).map(function(l){return el('button',{class:'album__item',type:'button','aria-label':lookTitle(l)+'، '+lookDate(l.at),onclick:function(){openLook(l)}},[el('img',{src:media(l.image),alt:'',loading:'lazy',decoding:'async'}),el('span',{text:lookTitle(l)})])}));
 box.replaceChildren(el('div',{class:'album__head'},[el('h2',{text:'آلبوم '+LINE_WORDS[state.line]}),el('span',{text:fa(mine.length)+' عکس'}),mine.length>1?el('button',{class:'btn btn--ghost btn--sm',type:'button',text:'مقایسه',onclick:function(){pickCompare(null)}}):null]),strip);
}
function openLook(l){
 var panel=el('div',{class:'sheet__panel look'});
 panel.append(el('div',{class:'sheet__head'},[h('h2',lookTitle(l)),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]),
  el('img',{class:'look__img',src:media(l.image),alt:'نتیجهٔ '+(LINES.label[l.line]||'')}),
  el('div',{class:'look__actions'},[downloadLink('btn btn--primary','دانلود عکس',l.image),(looks||[]).filter(function(x){return x.line===l.line}).length>1?el('button',{class:'btn btn--soft',type:'button',text:'مقایسه با یکی دیگه',onclick:function(){pickCompare(l)}}):null]));
 openSheet(panel);
}
function pickCompare(first){
 var panel=el('div',{class:'sheet__panel look'}),chosen=first?[first]:[],pool=(looks||[]).filter(function(x){return x.line===(first?first.line:state.line)});
 function draw(){
  if(chosen.length===2){
   panel.replaceChildren(el('div',{class:'sheet__head'},[h('h2','کدوم بیشتر بهت میاد؟'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]),
    el('div',{class:'look__pair'},chosen.map(function(l){return el('figure',{},[el('img',{src:media(l.image),alt:''}),el('figcaption',{text:lookTitle(l)})])})),
    el('div',{class:'look__actions'},[el('button',{class:'btn btn--soft',type:'button',text:'انتخاب دوباره',onclick:function(){chosen=[];draw()}})]));
   track('cta','compare');return;
  }
  panel.replaceChildren(el('div',{class:'sheet__head'},[h('h2',chosen.length?'یکی دیگه رو انتخاب کن':'دو تا عکس رو برای مقایسه انتخاب کن'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]),
   el('div',{class:'look__grid'},pool.map(function(l){var on=chosen.indexOf(l)>=0;return el('button',{class:'look__pick'+(on?' is-on':''),type:'button','aria-pressed':String(on),onclick:function(){if(!on){chosen.push(l);draw()}}},[el('img',{src:media(l.image),alt:'',loading:'lazy'}),el('span',{text:lookTitle(l)})])})));
 }
 draw();openSheet(panel);
}
function renderStudioHead(){
 document.body.classList.add('is-studio');
 var head=$('#head');head.classList.add('head--studio');
 var foot=$('#foot');if(foot)foot.textContent='نتیجه یک پیش‌نمایش پیشنهادی است و اجرای دقیق آرایشگر را تضمین نمی‌کند. '+STUDIO_PRIVACY;
 var pill=el('button',{class:'coin-pill',type:'button',onclick:openWallet,title:'کیف سکه'},[el('span',{class:'coin-pill__ico',html:COIN}),el('span',{id:'coinPill',text:'کیف سکه'})]);
 var bar=el('div',{class:'hero__bar'},[el('a',{class:'brand brand--studio',href:'/','aria-label':'آینه، صفحهٔ اصلی',html:MARK+'<span>آینه</span>'}),el('div',{class:'hero__tools'},[accountChip(),pill])]);
 var body=el('div',{class:'studio'},[
  el('h1',{class:'studio__title',text:'روی عکس خودت ببین چی بهت میاد'}),
  el('p',{class:'studio__tag',text:'مدل مو، رنگ مو، ناخن و مژه؛ قبل از اینکه بری آرایشگاه. بدون نصب، فقط با یه عکس.'}),
  studioProof(),
  el('div',{class:'wallet',id:'wallet','aria-live':'polite'},[el('div',{class:'skel',style:'height:56px;border-radius:16px'})]),
  /* One tap to the photo picker (the gesture opens it on iOS too); with a photo already in, straight to the choices. */
  el('button',{class:'btn btn--primary btn--lg studio__cta',type:'button',onclick:function(){track('cta','studio');if(state.original){go(2);return}go(1);var p=$('#pick');if(p)p.click()},html:ICO.camera+'<span>'+(state.original?'ادامه با همین عکس':'شروع با عکس خودم')+'</span>'}),
  el('section',{class:'trend',id:'trend','aria-label':'ترندهای این هفته'}),
  el('section',{class:'album',id:'album','aria-label':'آلبوم من',hidden:true})
 ]);
 head.replaceChildren(el('div',{class:'wrap'},[bar,body]));
 drawTrend();loadTrend().then(drawTrend);loadSaves().then(drawTrend);
 paintWallet(false);watchCta();
 /* Signed in on this browser before? Ask once, so her name and gift line are right from the start. */
 if(!state.session&&!studioAsked){studioAsked=true;loadSession().catch(function(){})}
 drawAlbum();
}

/* «ترند این هفته»: the looks tried and liked most lately, across every service (a curated start
   until there are enough tries). A tap opens that look in its own tab, ready for her photo. */
var TREND_SEED=['hair:1','hair:2','hair:8','hair:21','hair:25','hair:26','hair:14','hair:36','hair:4','hair:9','color:4','color:3','color:9','color:13','color:23','color:34','color:24','color:14','color:28','nails:7','nails:8','nails:4','nails:20','nails:29','nails:31','nails:21','nails:36','nails:5','lashes:5','lashes:4','lashes:7','lashes:11','lashes:15','lashes:16','lashes:1','lashes:12'];
function trendItems(line){
 var seen={},out=[];
 Object.keys(trend.score||{}).filter(function(k){return !line||k.indexOf(line+':')===0}).sort(function(a,b){return trend.score[b]-trend.score[a]}).concat(TREND_SEED.filter(function(k){return !line||k.indexOf(line+':')===0})).forEach(function(k){if(seen[k])return;var it=itemOf(k);if(!it||!LINES.label[it.line])return;seen[k]=1;out.push(it)});
 return out;
}
function drawTrend(){
 var box=$('#trend');if(!box)return;
 var L=state.line,items=trendItems(L).slice(0,12);if(!items.length){box.hidden=true;return}
 box.hidden=false;
 /* One service at a time: the same one as the service tabs right below. */
 box.replaceChildren(el('div',{class:'album__head'},[el('h2',{html:'<span class="trend__ico">'+ICO.fire+'</span>ترند '+LINE_WORDS[L]}),el('span',{text:'پرطرفدارترین‌های این هفته'})]),
  el('div',{class:'trend__strip'},items.map(function(it){var key=it.line+':'+it.i;
   var b=el('button',{class:'trend__item',type:'button','aria-label':it.name+' · '+LINES.label[it.line],onclick:function(){openTrend(it)}},[el('img',{src:it.img,alt:'',loading:'lazy',decoding:'async'}),el('span',{class:'trend__name',text:it.name})]);
   var w=el('div',{class:'trend__wrap'},[b,reactBtns(key)]);b.querySelector('img').addEventListener('error',function(){w.remove()});return w})));
}
function openTrend(it){
 track('cta','trend:'+it.line+':'+it.i);
 if(state.line!==it.line)switchLine(it.line,{silent:true});
 state.tab='catalog';state.filter='همه';state.q='';state.style=it.i;state.custom='';state.reference=null;state.refTitle='';
 if(state.original){go(2);setTimeout(scrollToBuild,80)}
 else{go(1);renderFlow();focusFlow();toast('عکست را بگذار تا «'+it.name+'» را روی خودت ببینی')}
}
/* Proof before the first tap: a real before/after of the chosen service (the landing's sample pair). */
var PROOF={hair:['style','مدل مو'],color:['color','رنگ مو'],nails:['nails','ناخن'],lashes:['lashes','مژه']};
function studioProof(){
 var p=PROOF[state.line]||PROOF.hair,src=function(k){return '/landing/demo-'+p[0]+'-'+k+'.webp'};
 var slider=compareSlider(src('before'),src('after'),['نمونه، قبل','نمونه، بعد از '+p[1]]);
 slider.classList.add('compare--hero');
 /* One gentle sweep so the slider explains itself; not with reduced motion. */
 return el('figure',{class:'proof'},[slider,el('figcaption',{text:'یک نمونه از '+p[1]+' با آینه · خط وسط را بکش'})]);
}
/* What «بساز» costs, on the button itself (studio): her gift first, then 25 coins. */
var giftOut=false;
function buildText(){if(!studio())return 'بساز';if(walletData&&state.verified){var fr=giftOut?0:(walletData.free?walletData.free.left:0),cn=walletData.own?walletData.own.coins||0:0;if(fr<=0&&cn<(walletData.image_coins||25))return 'شارژ کیف سکه'}return state.quota&&state.quota.free>0&&!giftOut?'بساز · هدیه':'بساز · ۲۵ سکه'}
var STUDIO_PRIVACY='عکست فقط برای ساختن نمونهٔ خودت استفاده می‌شود؛ نسخهٔ فشرده‌اش برای ساخت تصویر به سرویس تصویر فرستاده می‌شود. دسترسی عمومی ندارد و برای هیچ آرایشگاهی فرستاده نمی‌شود. نتیجه‌ها در آلبوم حساب خودت می‌مانند و فقط خودت می‌بینی؛ مگر اینکه خودت برای کسی بفرستی.';

var walletAt=0,walletData=null;
function paintWallet(force){
 if(!studio()||!window.AynehPacks)return;
 if(!force&&walletData&&Date.now()-walletAt<5000){drawWallet(walletData);return}
 window.AynehPacks.me(true).then(function(d){walletData=d;walletAt=Date.now();drawWallet(d)}).catch(function(){var w=$('#wallet');if(w)w.replaceChildren()});
}
function drawWallet(d){
 if(studio()&&!accountMode()&&state.step===2)setTimeout(renderDock,0);
 var w=$('#wallet'),pill=$('#coinPill');if(!w)return;
 var free=d.free&&!giftOut?d.free.left:0,coins=d.own?d.own.coins||0:0,per=d.image_coins||25,imgs=Math.floor(coins/per);
 /* A newcomer's pill shows what she has (her gift), never an empty «۰ سکه». */
 /* Signed out, the numbers belong to no one yet: a plain promise, real numbers after sign-in. */
 if(state.pub.otp&&!state.verified){if(pill)pill.textContent='کیف سکه';w.replaceChildren(el('div',{class:'wallet__gift'},[el('span',{class:'wallet__gift-ico',html:GIFT}),el('div',{},[el('b',{text:'۲ عکس اول رایگانه'}),el('small',{text:'برای حساب‌های تازه؛ ثبت‌نام فقط با شمارهٔ موبایل، بدون رمز. بعدش هر عکس '+fa(per)+' سکه ('+fa(d.image_price||50000)+' تومان).'})])]));return}
 if(pill)pill.textContent=coins<=0&&free>0?fa(free)+' عکس هدیه':fa(coins)+' سکه';
 var rows=[];
 if(free>0)rows.push(el('div',{class:'wallet__gift'},[el('span',{class:'wallet__gift-ico',html:GIFT}),el('div',{},[el('b',{text:free>=((d.free&&d.free.per)||2)?fa(free)+' عکس اول رایگانه':fa(free)+' عکس هدیه برایت مانده'}),el('small',{text:(state.pub.otp&&!state.verified?'فقط با تأیید شمارهٔ موبایل؛ بدون رمز. ':'')+'بعدش هر عکس '+fa(per)+' سکه ('+fa(d.image_price||50000)+' تومان).'})])]));
 var main=el('div',{class:'wallet__main'},[
  el('span',{class:'wallet__coin',html:COIN}),
  el('div',{class:'wallet__txt'},[el('b',{text:fa(coins)+' سکه'}),el('small',{text:imgs>0?('برای '+fa(imgs)+' عکس'+(free>0?' بعد از هدیه‌ها':'')):(coins>0?fa(per-coins%per)+' سکهٔ دیگه تا عکس بعدی':'هر عکس '+fa(per)+' سکه؛ '+fa(d.image_price||50000)+' تومان')})]),
  el('button',{class:'btn btn--soft btn--sm wallet__top',type:'button',onclick:openWallet,text:coins>0?'شارژ بیشتر':'شارژ کیف'})
 ]);
 /* A newcomer with her gift sees the gift, not an empty wallet: the coins card waits until she has coins or the gift is used. */
 if(coins>0||free<=0)rows.push(main);
 if(free<=0&&imgs<=0&&coins>0)rows.push(el('div',{class:'wallet__bar','aria-hidden':'true'},[el('i',{style:'width:'+Math.round(coins%per/per*100)+'%'})]));
 w.replaceChildren.apply(w,rows);
}
window.addEventListener('ayneh:credited',function(){paintWallet(true)});
function renderHead(){
 if(studio()){renderStudioHead();return}
 var s=state.pub.salon,p=s.profile||{},head=$('#head');
 var bar=el('div',{class:'hero__bar'},[el('span',{class:'brand',html:MARK+'<span>آینه</span>'}),el('div',{class:'hero__tools'},[el('button',{class:'help-btn',type:'button','aria-label':'راهنمای استفاده',onclick:startTour,text:'؟'}),el('button',{class:'about-btn',type:'button',onclick:openAbout,html:ICO.info+'<span>دربارهٔ سالن</span>'})])]);
 // Full-width cover with the round logo sitting on its edge; without a cover, a soft mirror-glass panel.
 var coverSrc=p.cover_url||(p.cover?media(p.cover):''),logoSrc=p.logo_url||(p.logo?media(p.logo):'');
 var cover=el('div',{class:'cover'+(coverSrc?'':' cover--plain')},[coverSrc?el('img',{class:'cover__img',src:coverSrc,alt:'',fetchpriority:'high'}):el('span',{class:'cover__glow','aria-hidden':'true'})]);
 var logo=logoSrc?el('img',{class:'cover__logo'+(p.logo_url?' cover__logo--ayneh':''),src:logoSrc,alt:'لوگوی '+s.name}):el('span',{class:'cover__logo cover__logo--letter','aria-hidden':'true',text:(s.name||'آ').trim().charAt(0)});
 cover.append(logo);
 var chips=el('div',{class:'hero__chips'});
 if(p.address)chips.append(el(p.map?'a':'button',{class:'hchip',href:p.map||null,target:p.map?'_blank':null,rel:p.map?'noopener noreferrer':null,type:p.map?null:'button',onclick:p.map?null:openAbout,title:p.address},[el('span',{class:'hchip__ico',html:ICO.pin}),el('span',{class:'hchip__txt',text:p.address})]));
 if(p.hours)chips.append(el('span',{class:'hchip'},[el('span',{class:'hchip__ico',html:ICO.clock}),el('span',{class:'hchip__txt',text:p.hours})]));
 var name=el('h1',{class:'hero__name',text:s.name});
 var body=el('div',{class:'hero__body'},[
  el('div',{class:'hero__text'},[name,el('p',{class:'hero__tag',text:heroTag()}),chips.childNodes.length?chips:null]),
  el('div',{class:'hero__cta'},[el('button',{class:'btn btn--primary btn--lg',type:'button',onclick:function(){go(state.original?2:1)},html:ICO.camera+'<span>شروع با عکس خودم</span>'})])
 ]);
 head.replaceChildren(el('div',{class:'wrap'},[bar,cover,body]));
 /* Embedded in /studio (the direct page) the studio already has its own title: only the start button stays. */
 head.classList.toggle('head--direct',!!(EMBED&&state.pub.direct));
 fitName(name);
}
// The salon name always sits on one line: the font shrinks to fit; only very long names wrap.
function fitName(n){
 function fit(){if(!n.isConnected)return;n.classList.remove('is-wrapped');n.style.fontSize='';var max=parseFloat(getComputedStyle(n).fontSize)||40,size=max;
  while(n.scrollWidth>n.clientWidth+1&&size>20){size-=1;n.style.fontSize=size+'px'}
  if(n.scrollWidth>n.clientWidth+1)n.classList.add('is-wrapped')}
 fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
 if(!fitName.on){fitName.on=1;var t=0;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(function(){var x=$('.hero__name');if(x)fitName(x)},120)})}
}

/* ---------- about the salon: every detail lives here ---------- */
function openAbout(){
 track('about');
 var s=state.pub.salon,p=s.profile||{};
 var panel=el('div',{class:'sheet__panel about'});
 panel.append(el('div',{class:'sheet__head'},[h('h2',s.name),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]));
 if(p.bio)panel.append(el('p',{class:'about__bio',text:p.bio}));
 var quick=el('div',{class:'about__quick'});
 if(p.phone)quick.append(el('a',{class:'btn btn--primary',href:'tel:'+p.phone,html:ICO.phone+'<span>تماس</span>'}));
 if(p.map)quick.append(el('a',{class:'btn btn--ghost',href:p.map,target:'_blank',rel:'noopener noreferrer',html:ICO.pin+'<span>مسیریابی</span>'}));
 if(quick.childNodes.length)panel.append(quick);
 var list=el('div',{class:'meta-list'});
 if(p.address)list.append(el(p.map?'a':'span',{class:'mi',href:p.map||null,target:p.map?'_blank':null,rel:'noopener noreferrer'},[el('span',{html:ICO.pin}),el('span',{text:p.address})]));
 if(p.hours)list.append(el('span',{class:'mi'},[el('span',{html:ICO.clock}),el('span',{text:p.hours})]));
 if(p.phone)list.append(el('a',{class:'mi',href:'tel:'+p.phone},[el('span',{html:ICO.phone}),el('span',{text:fa0(p.phone),dir:'ltr'})]));
 if(p.instagram)list.append(el('a',{class:'mi',href:p.instagram,target:'_blank',rel:'noopener noreferrer'},[el('span',{html:ICO.instagram}),el('span',{text:'اینستاگرام سالن'})]));
 if(p.telegram)list.append(el('a',{class:'mi',href:p.telegram,target:'_blank',rel:'noopener noreferrer'},[el('span',{html:ICO.send}),el('span',{text:'تلگرام سالن'})]));
 if(p.website)list.append(el('a',{class:'mi',href:p.website,target:'_blank',rel:'noopener noreferrer'},[el('span',{html:ICO.globe}),el('span',{text:'وب‌سایت'})]));
 if(!list.childNodes.length&&!p.bio)list.append(el('span',{class:'mi',text:'سالن هنوز اطلاعاتی ثبت نکرده است.'}));
 panel.append(list);
 if(p.manager)panel.append(el('div',{class:'manager'},[p.portrait?el('img',{src:media(p.portrait),alt:''}):null,el('span',{text:p.manager})]));
 openSheet(panel);
}


/* ---------- steps ---------- */
/* ---------- service lines: hairstyle, hair colour, nails, lashes ---------- */
// Each line keeps its own photo, choices and result; switching is one tap and loses nothing.
var LINE_FIELDS=['busy','rating','seen','step','original','preview','ratio','reference','refTitle','style','custom','q','tab','transfer','color','opts','result','gen','genState','views','viewsIdem','idem','filter','error','justUploaded','base','genBase','resultBase','genT0'];
var LINE_LIST=[['hair','مدل مو','scissors'],['color','رنگ مو','drop'],['nails','ناخن','nails'],['lashes','مژه','lashes']];
/* «مدل مو، رنگ مو، طرح ناخن یا مژه» — only the lines this salon offers. */
var LINE_WORDS={hair:'مدل مو',color:'رنگ مو',nails:'طرح ناخن',lashes:'مژه'};
function offerText(ez){var w=LINE_LIST.map(function(x){return LINE_WORDS[x[0]]});var s=w.length>1?w.slice(0,-1).join('، ')+' یا '+w[w.length-1]:w[0];if(ez)s+=/ه$/.test(s)?'ٔ':/[وا]$/.test(s)?'ی':'';return s}
var FACE=['hair','color','lashes'];
var lineStore={};
function hasLineWork(line){return (state.pub&&state.pub.portfolio||[]).some(function(p){return (p.published||p.try_on)&&(p.line||'hair')===line})}
function lineDefaults(to){return {busy:false,rating:0,seen:null,custom:'',q:'',step:1,original:null,preview:null,ratio:'',reference:null,refTitle:'',style:null,tab:hasLineWork(to)?'salon':'catalog',transfer:'both',color:'',opts:{},result:null,gen:null,genState:null,views:null,viewsIdem:null,idem:null,filter:'همه',error:'',justUploaded:false,base:'hair',genBase:null,resultBase:null,genT0:0,fromConsult:null}}
function LP(){return LINES.photo[state.line]||LINES.photo.hair}
function lineCat(){return state.line==='hair'?null:LINES[state.line]}
function catalogImg(i){return '/catalog/'+(state.line==='hair'?'':state.line+'/')+String(i+1).padStart(2,'0')+'.webp'}
function lookPrefix(){return {nails:'n:',lashes:'l:',color:'r:'}[state.line]||'c:'}
function lineRef(k){return k===state.line?state:(lineStore[k]||(lineStore[k]=lineDefaults(k)))}
function lineData(k){if(k===state.line){var o={};LINE_FIELDS.forEach(function(f){o[f]=state[f]});return o}return lineStore[k]||null}
// The newest hairstyle result made on this same photo: hair colour is tried on it by default.
function hairResult(){
 if(state.line!=='color'||!state.original)return null;
 var h=lineStore.hair;if(!h||!h.result||h.original!==state.original)return null;
 return {id:h.result,name:h.reference?(h.refTitle||'مدل دلخواه'):(h.style!==null?STYLES[h.style][0]:'مدل جدید')};
}
function baseId(){var h=hairResult();return h&&state.base!=='original'?h.id:null}
function switchLine(to,opts){
 if(to===state.line||!LINES.label[to])return;
 lineStore[state.line]=lineData(state.line);
 var from=state.line,next=Object.assign({},lineStore[to]||lineDefaults(to));
 // One face photo serves hairstyle, hair colour and lashes.
 if(FACE.indexOf(to)>=0&&!next.original){
  var src=FACE.map(lineData).filter(function(d){return d&&d.original})[0];
  if(src){Object.assign(next,{original:src.original,preview:src.preview,ratio:src.ratio,step:Math.max(next.step,2)});if(to==='lashes')setTimeout(function(){toast('از همان عکس صورتت استفاده کردیم؛ اگر عکس نزدیک‌تری از چشم‌هایت داری، عوضش کن')},300)}
 }
 if(opts&&opts.step)next.step=opts.step;
 if(to==='color'&&opts&&opts.onHair)next.base='hair';
 clearTimeout(state.advT);Object.assign(state,next);state.line=to;state.seen=state.result;
 try{localStorage.setItem('ayneh-line-'+SLUG,to)}catch(e){}
 if(!(opts&&opts.silent))track('line',to);
 document.body.setAttribute('data-line',to);
 var sb=$('#steps'),y0=sb?sb.getBoundingClientRect().top:0;
 renderAll();
 if(sb&&!(opts&&opts.scroll)){
  /* Bar stuck at the top (she was deep in the page): open the new tab at its start, under the bar. */
  if(y0<=2){var fl=$('#flow');if(fl){var bh=sb.getBoundingClientRect().height;window.scrollTo(0,Math.max(0,fl.getBoundingClientRect().top+window.pageYOffset-bh-8))}}
  else{var y1=sb.getBoundingClientRect().top;if(Math.abs(y1-y0)>2)window.scrollBy(0,y1-y0)}
 }
 if(!(opts&&opts.silent)&&from!==to&&opts&&opts.scroll)focusFlow();
}
/* Studio: her photo, choices and results per service survive a trip to the profile (this tab only). */
var KEEP=['original','ratio','result','resultBase','style','reference','refTitle','custom','base','gen','color','opts','filter','tab','seen','rating'];
function keepStudio(){if(!studio()||accountMode())return;try{var o={line:state.line,lines:{}};LINE_LIST.forEach(function(x){var d=lineData(x[0]);if(!d||!d.original)return;var k={};KEEP.forEach(function(f){k[f]=d[f]});k.step=d.result?3:2;o.lines[x[0]]=k});sessionStorage.setItem('ayneh-studio-'+SLUG,JSON.stringify(o))}catch(e){}}
window.addEventListener('pagehide',function(){keepStudio()});
function restoreStudio(){try{var o=JSON.parse(sessionStorage.getItem('ayneh-studio-'+SLUG)||'null');if(!o||!o.lines)return false;Object.keys(o.lines).forEach(function(k){if(!LINES.label[k])return;var d=Object.assign(lineDefaults(k),o.lines[k]);if(k===state.line)Object.assign(state,d);else lineStore[k]=d});return true}catch(e){return false}}
function renderAll(){if(accountMode()){renderAccount();return}keepStudio();renderHead();renderSteps();renderFlow();renderSide();renderDock()}
function lineSwitch(){
 var bar=el('div',{class:'linesw',role:'tablist','aria-label':'خدمت'});
 LINE_LIST.forEach(function(x){
  var on=state.line===x[0],d=lineData(x[0]),st=on?'':d&&d.busy?' is-busy':d&&d.result&&d.result!==d.seen?' is-ready':'';
  bar.append(el('button',{class:'linesw__btn'+(on?' is-on':'')+st,type:'button',role:'tab','data-line':x[0],'aria-selected':on?'true':'false',onclick:function(){switchLine(x[0])},html:ICO[x[2]]+'<span>'+x[1]+'</span>'}));
 });
 return bar;
}
// Two clearly different things: which service (big, coloured tiles) and where you are (a slim
// stepper on its own white strip).
function renderSteps(){
 var bar=$('#steps');bar.hidden=false;
 var list=el('div',{class:'steps__list wrap',role:'list','aria-label':'مراحل'});
 [['عکس تو',1],['انتخاب',2],['نتیجه',3]].forEach(function(x,k){
  var n=x[1];
  if(k)list.append(el('span',{class:'steps__line'+(state.step>=n?' is-done':''),'aria-hidden':'true'}));
  var cls='steps__item'+(state.step===n?' is-active':'')+(state.step>n?' is-done':'');
  var b=el('button',{class:cls,type:'button',role:'listitem','aria-current':state.step===n?'step':'false'},[
   el('span',{class:'steps__num',html:state.step>n?'✓':fa(n)}),
   el('span',{class:'steps__label',text:x[0]})
  ]);
  b.addEventListener('click',function(){go(n)});
  list.append(b);
 });
 bar.replaceChildren(el('div',{class:'steps__top'},[el('div',{class:'wrap steps__topin'},[lineSwitch()])]),el('div',{class:'steps__bottom'},[list]));
}
function go(n,quiet){
 if(n!==3&&state.busy&&state.gen){toast('صبر کن ساخت این عکس تمام شود؛ می‌توانی تب دیگری را امتحان کنی');return}
 if(n===2&&!state.original){toast('اول عکس خودت را اضافه کن');return}
 if(n!==1)state.justUploaded=false;clearTimeout(state.advT);
 state.step=n;renderSteps();renderFlow();renderDock();
 if(!quiet)focusFlow();
}
// Brings the top of the current step just under the sticky steps bar, and keeps it there while
// images above or inside it finish loading (unless the customer scrolls on her own meanwhile).
var userScrollAt=0;
['wheel','touchmove','keydown'].forEach(function(ev){window.addEventListener(ev,function(){userScrollAt=Date.now()},{passive:true})});
function focusFlow(){
 var f=$('#flow');if(!f)return;
 var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches,started=Date.now();
 function off(){var bar=$('#steps');return (bar&&!bar.hidden?bar.getBoundingClientRect().height:0)+12}
 function to(beh){var y=f.getBoundingClientRect().top+window.pageYOffset-off();window.scrollTo({top:Math.max(0,y),behavior:beh})}
 to(reduce?'auto':'smooth');
 clearTimeout(focusFlow.t1);clearTimeout(focusFlow.t2);
 function fix(){if(userScrollAt>started)return;var d=f.getBoundingClientRect().top-off();if(Math.abs(d)>24)to('auto')}
 focusFlow.t1=setTimeout(fix,650);focusFlow.t2=setTimeout(fix,1400);
}

/* ---------- flow (steps 1-3) ---------- */
function renderFlow(){
 var root=$('#flow');if(!root)return;
 // Hold the old height for a moment so the page never collapses and jumps to the banner below.
 root.style.minHeight=root.offsetHeight+'px';
 root.replaceChildren();
 requestAnimationFrame(function(){requestAnimationFrame(function(){root.style.minHeight=''})});
 if(state.step===1)root.append(stepPhoto());
 else if(state.step===2)root.append(stepModel());
 else root.append(stepResult());
}
function flowHead(title,sub){
 return el('div',{class:'flow__head'},[h('h2',title,'flow__title'),sub?h('p',sub,'flow__sub'):null]);
}
function openCamera(){var cam=el('input',{type:'file',accept:'image/*',capture:'user'});cam.style.display='none';cam.addEventListener('change',function(){handleFile(cam.files&&cam.files[0],'original');cam.remove()});document.body.append(cam);cam.click()}
function stepPhoto(){
 var box=el('div',{class:'panel flow'});
 if(!state.original&&state.preview){
  box.append(flowHead('دارم عکست را بارگذاری می‌کنم','چند ثانیه صبر کن؛ همین که آماده شد خبرت می‌کنم.'));
  box.append(el('div',{class:'photo'},[el('div',{class:'mirror'},[el('div',{class:'mirror__glass'},[el('img',{src:state.preview,alt:'عکس انتخابی تو'}),el('div',{class:'upl',role:'status'},[el('span',{class:'upl__scan'}),el('span',{text:'در حال بارگذاری…'}),el('span',{class:'upl__bar'},[el('i')])])])])]));
 }else if(!state.original){
  box.append(flowHead(LP().head,LP().sub));
  var input=el('input',{type:'file',accept:'image/jpeg,image/png,image/webp',id:'pick',class:'sr-only'});
  var drop=el('label',{class:'upload',for:'pick'},[
   el('span',{class:'upload__icon',html:ICO.camera}),
   el('strong',{text:LP().drop}),
   el('span',{class:'upload__hint',text:'از گالری انتخاب کن یا عکس را روی همین قاب رها کن'})
  ]);
  input.addEventListener('change',function(){handleFile(input.files&&input.files[0],'original')});
  ['dragenter','dragover'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add('is-drag')})});
  ['dragleave','drop'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove('is-drag')})});
  drop.addEventListener('drop',function(e){var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];handleFile(f,'original')});
  var side=el('div',{class:'shoot__side'},[
   el('ul',{class:'tips'},LP().tips.map(function(t){return el('li',{class:'tip'},[el('span',{html:ICO[t[0]]}),el('span',{},[el('b',{text:t[1]}),document.createTextNode(t[2])])])})),
   el('div',{class:'shoot__btns'},[
    el('button',{class:'btn btn--primary',type:'button',onclick:pickNow,html:ICO.gallery+'<span>انتخاب از گالری</span>'}),
    el('button',{class:'btn btn--ghost',type:'button',onclick:openCamera,html:ICO.camera+'<span>عکس با دوربین</span>'})
   ]),
   el('details',{class:'collapse'},[
    el('summary',{html:ICO.lock+'<span>عکسم کجا نگه‌داری می‌شود؟</span>'}),
    h('p',studio()?STUDIO_PRIVACY:'عکس شما فقط برای ساخت نمونه و دیدنِ سالن استفاده می‌شود؛ نسخهٔ فشردهٔ آن برای ساخت تصویر به سرویس تصویر ارسال می‌شود. عکس دسترسی عمومی ندارد و در سابقهٔ سالن نگه داشته می‌شود تا آرایشگرت بعداً هم آن را ببیند. نتیجه را فقط وقتی خودت دکمهٔ «از دوستم نظر بپرسم» را بزنی برای کسی می‌فرستی.')
   ])
  ]);
  box.append(input,el('div',{class:'demo-row'},[demoCompare('demo--small'),el('div',{class:'demo-row__text'},[h('b','این‌طوری می‌شود'),h('span',studio()?LP().demo.replace(/ و بعد برای \S+ می‌فرستی/,''):LP().demo)])]),el('div',{class:'shoot'},[drop,side]));
 }else{
  var fresh=state.justUploaded;
  box.append(flowHead(fresh?'عکست بارگذاری شد':'عکست آماده است',fresh?'الان می‌رویم سراغ انتخاب '+({color:'رنگ',nails:'طرح'}[state.line]||'مدل')+'…':LP().ready));
  box.append(el('div',{class:'photo'},[
   el('div',{class:'mirror'},[el('div',{class:'mirror__glass'},[el('img',{src:state.preview||media(state.original),alt:'عکس انتخابی تو'}),fresh?el('span',{class:'photo__badge','aria-hidden':'true',html:ICO.check}):null])]),
   fresh?el('div',{class:'photo__auto','aria-hidden':'true'},[el('i')]):null,
   el('div',{class:'photo__bar'},[
    el('span',{html:ICO.check+'<span>عکس انتخاب شد</span>'}),
    el('button',{class:'btn btn--ghost btn--sm',type:'button',onclick:changePhoto,text:'تغییر عکس'})
   ])
  ]));
  box.append(el('div',{class:'flow__nav'},[
   el('button',{class:'btn btn--primary',type:'button',onclick:function(){go(2)},text:'ادامه: انتخاب '+({color:'رنگ',nails:'طرح'}[state.line]||'مدل')})
  ]));
 }
 return box;
}
function pickedBar(text,onRemove){
 return el('div',{class:'picked'},[el('span',{text:text}),el('button',{class:'btn btn--ghost btn--sm',type:'button',onclick:onRemove,text:'حذف انتخاب'})]);
}
var TAB_LABEL={hair:['کارهای سالن','مدل‌های آماده','عکس مدل من'],color:['کارهای سالن','رنگ‌های آماده','عکس رنگ دلخواه'],nails:['کارهای سالن','طرح‌های آماده','عکس طرح من'],lashes:['کارهای سالن','مدل‌های آماده','عکس مدل من']};
var MODEL_HEAD={
 hair:['مدل مو را انتخاب کن','از کارهای همین سالن، مدل‌های آماده یا عکس مدلی که خودت پیدا کرده‌ای. فقط فرم و کوتاهی عوض می‌شود و رنگ موهایت همان می‌ماند؛ رنگ را در بخش «رنگ مو» امتحان کن.'],
 color:['رنگ مو را انتخاب کن','از کارهای همین سالن، رنگ‌های آماده یا عکس رنگی که دوست داری. مدل و کوتاهی موهایت دست نمی‌خورد؛ فقط رنگ عوض می‌شود.'],
 nails:['طرح و رنگ ناخن را انتخاب کن','از کارهای همین سالن، طرح‌های آماده یا عکس طرحی که خودت پیدا کرده‌ای. فرم، طول و رنگ را هم انتخاب کن.'],
 lashes:['مدل مژه را انتخاب کن','از کارهای همین سالن، مدل‌های آماده یا عکس مدلی که خودت پیدا کرده‌ای. حالت و طول را هم انتخاب کن.']
};
function pickLook(fn){fn();state.result=null;state.error='';state.fromConsult=null;renderFlow();renderDock()}
// Photo and look are in — the only thing left to do is «بساز», so that is what comes into
// view. The same for all four lines: hair, colour, nails and lashes. Nothing else is a step:
// the shape, length and colour rows are optional and never scrolled to on their own.
function chooseLook(fn){pickLook(fn);scrollToBuild()}
/* «بساز» lives in the flow on a wide screen and in the fixed dock on a phone: whichever one
   is on the page is the one to bring into view. */
function buildButton(){
 var f=$('#flow'),d=$('#dock');
 var inFlow=f?f.querySelector('.btn--build'):null;
 var inDock=d&&!d.hidden?d.querySelector('.btn--build'):null;
 var ok=function(b){return b&&b.getBoundingClientRect().width>0?b:null};
 return ok(inFlow)||ok(inDock);
}
function scrollToBuild(){
 var f=$('#flow');if(!f)return;
 var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches,beh=reduce?'auto':'smooth';
 var bar=$('#steps'),top=(bar&&!bar.hidden?bar.getBoundingClientRect().height:0)+12;
 var dock=$('#dock:not([hidden])'),bottom=(dock&&getComputedStyle(dock).position==='fixed'?dock.getBoundingClientRect().height:0)+16;
 var opt=f.querySelector('.opt'),nav=f.querySelector('.flow__nav'),picked=f.querySelector('.picked');
 requestAnimationFrame(function(){
  var btn=buildButton();
  if(btn&&hasChoice()){
   // Only move when the button is not already clear of the sticky bar and the dock.
   var y0=window.pageYOffset,vh=window.innerHeight,r=btn.getBoundingClientRect();
   var y=y0;
   if(r.bottom+window.pageYOffset+bottom>y0+vh)y=r.bottom+window.pageYOffset+bottom-vh;
   if(r.top+window.pageYOffset-top<y)y=r.top+window.pageYOffset-top;
   window.scrollTo({top:Math.max(0,y),behavior:beh});
   if(!btn.disabled){try{btn.focus({preventScroll:true})}catch(e){btn.focus()}}
   return;
  }
  // Only the photo is in: bring the next thing to do into view (the looks, or the search).
  var to;
  if(opt)to=opt.getBoundingClientRect().top+window.pageYOffset-top;
  else if(picked&&nav){var hint=f.querySelector('.build-hint')||nav,end=hint.getBoundingClientRect().bottom+window.pageYOffset;to=end-(window.innerHeight-bottom);
   var start=picked.getBoundingClientRect().top+window.pageYOffset-top;if(to>start)to=start}
  /* Nothing picked yet: the start of the choices (title, tabs, search), never the end of a long gallery. */
  else{var head=f.querySelector('.flow__head')||f.querySelector('.seg')||f;to=head.getBoundingClientRect().top+window.pageYOffset-top}
  if(to!=null)window.scrollTo({top:Math.max(0,to),behavior:beh});
 });
}
/* After «روی عکسم بساز» the chosen card is the thing to see: bring exactly that card
   (.style-card.is-on) into view and flash it, so the pick never gets lost in the grid. */
function flashPickedCard(){
 var f=$('#flow');if(!f)return;
 var card=f.querySelector('.style-card.is-on');
 if(!card){scrollToBuild();return}
 var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var bar=$('#steps'),top=(bar&&!bar.hidden?bar.getBoundingClientRect().height:0)+12;
 var dock=$('#dock:not([hidden])'),bottom=(dock&&getComputedStyle(dock).position==='fixed'?dock.getBoundingClientRect().height:0)+16;
 var r=card.getBoundingClientRect();
 var y=window.pageYOffset+r.top-top-Math.max(16,(window.innerHeight-bottom-top-Math.max(r.height,0))/2);
 window.scrollTo({top:Math.max(0,y),behavior:reduce?'auto':'smooth'});
 card.classList.add('is-flash');
 setTimeout(function(){card.classList.remove('is-flash')},reduce?1800:1500);
}
function stepModel(){
 var box=el('div',{class:'panel flow'}),L=state.line;
 if(state.original){
  var fresh=state.justArrived;state.justArrived=false;
  box.append(el('div',{class:'selfie'+(fresh?' selfie--fresh':'')},[el('img',{src:state.preview||media(state.original),alt:''}),el('div',{},[el('b',{html:ICO.check+'<span>'+(fresh?'عکست ثبت شد':'عکست آماده است')+'</span>'}),el('span',{text:(L==='nails'?'طرح':L==='color'?'رنگ':'مدل')+' انتخابی روی همین عکس امتحان می‌شود.'})]),el('button',{class:'btn btn--ghost btn--sm',type:'button',onclick:function(){changePhoto();go(1)},text:'تغییر'})]));
 }
 var own=hasLineWork(L);
 /* No work of a salon for this line (always so in the studio): no «کارهای سالن» tab, no word about it. */
 if(!own&&state.tab==='salon')state.tab='catalog';
 box.append(flowHead(MODEL_HEAD[L][0],L==='hair'&&state.pub.demo?'مدل مو و رنگ دلخواهت را انتخاب کن؛ هر دو روی همین عکس خودت ساخته می‌شوند.':own?MODEL_HEAD[L][1]:MODEL_HEAD[L][1].replace('از کارهای همین سالن، ','از ')));
 if(quotaLeft()===0&&!state.tourDemo){box.append(notice('warn',quotaOut()));if(studio()){}else if(window.AynehPacks)box.append(window.AynehPacks.button())}
 if(state.demoOut){box.append(notice('info','نمونهٔ رایگانتان را ساختید. برای عکس‌های بیشتر به استودیوی آینه بروید؛ ۲ عکس اول آنجا هم هدیه است.'));box.append(el('a',{class:'btn btn--primary btn--block',href:location.protocol+'//'+location.host.replace(/^business\./,'')+'/?l='+L,target:'_top',text:'ثبت‌نام و شارژ حساب'}))}
 /* The consultant analyses hair and colour only: a nails or lashes close-up says nothing about
    a hairstyle, so the card — and the paid vision behind it — is absent on both lines. */
 if(studio()&&!STUDIO_PREVIEW&&L!=='nails'&&L!=='lashes')box.append(consultCard());
 if(L==='color'){var bc=baseChooser();if(bc)box.append(bc)}
 var seg=el('div',{class:'seg',role:'tablist'});
 [['salon',0],['catalog',1],['upload',2]].filter(function(x){return x[0]!=='salon'||own}).forEach(function(x){
  var b=el('button',{type:'button',role:'tab','data-tab':x[0],'aria-selected':state.tab===x[0]?'true':'false',text:TAB_LABEL[L][x[1]]});
  b.addEventListener('click',function(){state.tab=x[0];renderFlow()});
  seg.append(b);
 });
 box.append(seg);
 if(state.tab==='salon'){
  var items=(state.pub.portfolio||[]).filter(function(p){return (p.published||p.try_on)&&(p.line||'hair')===L});
  if(!items.length)box.append(notice('info','سالن هنوز نمونه‌کاری در این بخش نگذاشته. از «'+TAB_LABEL[L][1]+'» یا «'+TAB_LABEL[L][2]+'» استفاده کن.'));
  else{
   // Same vertical grid as the ready-made looks.
   var grid0=el('div',{class:'looks looks--salon'});
   items.forEach(function(p){
    var imgs=[];try{imgs=JSON.parse(p.images||'[]')}catch(e){}
    if(!imgs.length)return;
    var on=state.reference===imgs[0];
    var pic0=el('img',{src:media(imgs[0]),alt:'',loading:'lazy',decoding:'async'}),art0=el('span',{class:'style-card__art'},[pic0]);
    pic0.addEventListener('error',function(){art0.classList.add('is-missing');pic0.remove()});
    var card=el('button',{class:'style-card'+(on?' is-on':''),type:'button','aria-pressed':on?'true':'false'},[
     art0,
     el('span',{class:'style-card__body'},[el('span',{class:'style-card__name',text:p.title}),el('span',{class:'style-card__tag',text:p.stylist?'کار '+p.stylist:(p.category||'کار سالن')})])
    ]);
    card.addEventListener('click',function(){track('look','s:'+p.title);chooseLook(function(){state.reference=imgs[0];state.refTitle=p.title;state.style=null;state.custom='';if(L==='color')state.color=''})});
    grid0.append(card);
   });
   box.append(grid0);
  }
  if(state.reference&&state.refTitle)box.append(pickedBar('کار انتخابی: '+state.refTitle,function(){pickLook(function(){state.reference=null;state.refTitle=''})}));
 }else if(state.tab==='catalog'){
  var cat=lineCat(),LIST=cat?cat.styles:STYLES;
  // Search the ready-made looks; anything not in the list can still be made from her own words.
  var SEARCH_PH={hair:'جستجوی مدل مو؛ مثلاً «لایه‌ای» یا «باب»',color:'جستجوی رنگ مو؛ مثلاً «فندقی» یا «بالیاژ»',nails:'جستجوی طرح ناخن؛ مثلاً «فرنچ» یا «کروم»',lashes:'جستجوی مدل مژه؛ مثلاً «والیوم» یا «کلاسیک»'}[L];
  var qIn=el('input',{class:'look-search__in',type:'search',value:state.q||'',placeholder:SEARCH_PH,'aria-label':SEARCH_PH,enterkeyhint:'search'});
  var qTimer=null;qIn.addEventListener('input',function(){clearTimeout(qTimer);qTimer=setTimeout(function(){state.q=qIn.value.slice(0,60);var pos=qIn.selectionStart;renderFlow();var n=$('.look-search__in');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}},250)});
  box.append(el('div',{class:'look-search'},[el('span',{class:'look-search__ico',html:ICO.search}),qIn]));
  if(studio()&&!(state.q||'').trim())box.append(el('button',{class:'own-ref',type:'button',onclick:function(){state.tab='upload';renderFlow();setTimeout(function(){var r=$('#pickref');if(r)r.click()},60)}},[el('span',{class:'own-ref__ico',html:ICO.gallery}),el('span',{},[el('b',{text:{hair:'مدلی جایی دیدی و خوشت اومد؟',color:'رنگی جایی دیدی و خوشت اومد؟',nails:'طرحی جایی دیدی و خوشت اومد؟',lashes:'مدل مژه‌ای جایی دیدی؟'}[L]}),el('small',{text:'عکسش را بگذار (اسکرین‌شات اینستاگرام هم می‌شود)؛ همان را روی خودت می‌سازیم.'})]),el('span',{class:'own-ref__go',html:ICO.arrow})]))
  var Q=(state.q||'').trim(),norm=function(t){return String(t).replace(/[\u200c\s]+/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک').toLowerCase()};
  if(Q.length>=2){
   var onC=state.custom===Q;
   var cc=el('button',{class:'custom-look'+(onC?' is-on':''),type:'button','aria-pressed':onC?'true':'false'},[el('span',{class:'custom-look__ico',html:ICO.spark}),el('span',{},[el('b',{text:'«'+Q+'» را روی عکس خودم بساز'}),el('small',{text:'اگر در نمونه‌ها نیست، همین نوشته ساخته می‌شود.'})])]);
   cc.addEventListener('click',function(){track('look','q:'+Q.slice(0,30));chooseLook(function(){state.custom=Q;state.style=null;state.reference=null;state.refTitle='';if(L==='color')state.color=''})});
   box.append(cc);
  }
  var filters=(cat?cat.filters:['همه','کوتاه','متوسط','بلند','چتری','فر','جمع']).slice();
  if(studio()){filters.splice(1,0,'ترند');if((saves.saved||[]).some(function(k){return k.indexOf(L+':')===0}))filters.splice(2,0,'ذخیره‌شده')}
  var fbar=el('div',{class:'filters'});
  filters.forEach(function(f){
   var on=(state.filter||'همه')===f;
   var c=el('button',{class:'chip',type:'button','aria-pressed':on?'true':'false',text:f});
   c.addEventListener('click',function(){state.filter=f;renderFlow()});
   fbar.append(c);
  });
  box.append(fbar);
  var grid=el('div',{class:'looks'});
  var shown=0;
  var F=state.filter||'همه',order=LIST.map(function(_,i){return i});
  if(F==='ترند'){order=trendItems(L).map(function(it){return it.i})}
  else if(F==='ذخیره‌شده'){order=order.filter(function(i){return isOn('save',L+':'+i)})}
  var hot={};trendItems(L).slice(0,3).forEach(function(it){hot[it.i]=1});
  order.forEach(function(i){var s=LIST[i];
   if(F!=='همه'&&F!=='ترند'&&F!=='ذخیره‌شده'&&s[2]!==F)return;
   if(Q.length>=1&&norm(s[0]+' '+s[1]+' '+s[2]).indexOf(norm(Q))<0)return;
   shown++;
   var on=state.style===i&&!state.reference;
   var pic=el('img',{src:catalogImg(i),alt:'',loading:'lazy',decoding:'async'});
   var art=el('span',{class:'style-card__art'},[pic]);
   if(L==='color'){var sw=cat.swatches[i].split(',');art.classList.add('style-card__art--sw');art.style.background=sw.length>1?'linear-gradient(180deg,'+sw[0]+' 0 35%,'+sw[1]+' 100%)':sw[0];art.append(el('span',{class:'style-card__dot',style:'background:'+(sw[1]||sw[0])}))}
   /* A look whose photo is not made yet stays hidden (hair colour still shows its swatch). */
   pic.addEventListener('error',function(){art.classList.add('is-missing');pic.remove();if(L!=='color'&&!on){var w=art.closest('.style-wrap')||art.closest('.style-card');if(w)w.remove()}});
   var card=el('button',{class:'style-card'+(on?' is-on':''),type:'button','aria-pressed':on?'true':'false'},[
    art,
    el('span',{class:'style-card__body'},[el('span',{class:'style-card__name',text:s[0]}),el('span',{class:'style-card__tag',text:s[2]})])
   ]);
   card.addEventListener('click',function(){track('look',lookPrefix()+i);if(L==='color')track('color',s[0]);chooseLook(function(){state.style=i;state.custom='';state.reference=null;state.refTitle='';if(L==='color')state.color=''})});
   if(studio()){if(hot[i])art.append(el('span',{class:'style-card__hot',html:ICO.fire+'<span>ترند</span>'}));grid.append(el('div',{class:'style-wrap'},[card,reactBtns(L+':'+i)]))}
   else grid.append(card);
  });
  box.append(grid);
  if(Q&&!shown)box.append(h('p','نمونهٔ آماده‌ای با این نام نداریم؛ دکمهٔ بالا همین را برایتان می‌سازد.','hint'));
  if(state.custom&&!state.reference)box.append(pickedBar('انتخاب شما: '+state.custom,function(){pickLook(function(){state.custom=''})}));
  if(state.style!==null&&!state.reference)box.append(pickedBar((L==='color'?'رنگ انتخابی: ':L==='nails'?'طرح انتخابی: ':'مدل انتخابی: ')+LIST[state.style][0],function(){pickLook(function(){state.style=null})}));
 }else{
  if(!state.reference||state.refTitle){
   var input2=el('input',{type:'file',accept:'image/jpeg,image/png,image/webp',id:'pickref',class:'sr-only'});
   var drop2=el('label',{class:'upload upload--ref',for:'pickref'},[
    el('span',{class:'upload__icon',html:ICO.gallery}),
    el('strong',{text:{nails:'عکس طرح دلخواهت',color:'عکس رنگ موی دلخواهت'}[L]||'عکس مدل دلخواهت'}),
    el('span',{class:'upload__hint',text:LP().ref})
   ]);
   input2.addEventListener('change',function(){state.custom='';handleFile(input2.files&&input2.files[0],'reference')});
   box.append(input2,drop2);
  }else{
   box.append(el('div',{class:'ref-photo mirror'},[el('div',{class:'mirror__glass'},[el('img',{src:media(state.reference),alt:'عکس مرجع'})])]));
   box.append(pickedBar(L==='color'?'عکس رنگ اضافه شد':'عکس مدل اضافه شد',function(){pickLook(function(){state.reference=null})}));
   box.append(h('p',LP().ref,'hint'));
  }
 }
 // Nail shape and length, lash mapping and length: chips that apply to every way of choosing.
 var cat2=lineCat();
 if(cat2&&cat2.options.length)cat2.options.forEach(function(o){
  var row=el('div',{class:'filters opt-row',role:'group','aria-label':o.label});
  o.items.forEach(function(it,j){var on=state.opts[o.key]===j;row.append(el('button',{class:'chip',type:'button','aria-pressed':on?'true':'false',text:it,onclick:function(){if(on)delete state.opts[o.key];else state.opts[o.key]=j;state.result=null;renderFlow();renderDock()}}))});
  box.append(el('div',{class:'opt'},[h('p',o.label+' (اختیاری)','lbl'),row]));
 });
 // Nails and lashes: a colour box for every way of choosing. Hair colour: a colour can also just be typed.
 if(L!=='hair'||state.pub.demo)box.append(colorPicker());
 if(state.reference&&!state.pub.reference&&state.pub.generation)box.append(notice('warn','ساخت تصویر از عکس مرجع یا کار سالن هنوز برای این سالن فعال نشده. می‌توانی از موارد آماده انتخاب کنی، یا همین را بدون شبیه‌سازی برای '+artist()+' بفرستی.'));
 var can=canGenerate()||!!state.tourDemo,ready=hasChoice()||!!state.tourDemo,left=quotaLeft();
 box.append(el('div',{class:'flow__nav'},[
  el('button',{class:'btn btn--ghost',type:'button',onclick:function(){go(1)},text:'بازگشت'}),
  /* Studio: «بساز» lives only in the fixed bar at the bottom, which appears once a look is picked. */
  studio()?null:el('button',{class:'btn btn--primary btn--build',type:'button',disabled:!ready,onclick:build,html:buildLabel(can)})
 ]));
 box.append(h('p',buildHint(ready,can,left),'fine-print build-hint'));
 return box;
}
function buildLabel(can){if(!can&&studio()&&quotaLeft()===0)return '<span class="coin-pill__ico">'+COIN+'</span><span>شارژ کیف سکه</span>';return can?ICO.spark+'<span>'+buildText()+'</span>':(quotaLeft()===0?ICO.send+'<span>فرستادن برای '+artist()+'</span>':'<span>ادامه: نتیجه</span>')}
function buildHint(ready,can,left){
 if(!ready)return missingReason().replace(/\.$/,'')+'؛ بعد «بساز» فعال می‌شود.';
 if(!can&&studio())return '';
 if(!can)return left===0&&state.pub.generation?'سهم ساخت «'+LINES.label[state.line]+'» برای تو تمام شده؛ همین انتخاب را بدون شبیه‌سازی برای '+artist()+' بفرست.':'';
 return (studio()?'با زدن «بساز» نسخهٔ فشردهٔ عکست برای ساخت تصویر به سرویس تصویر فرستاده می‌شود؛ برای هیچ آرایشگاهی فرستاده نمی‌شود.':'با زدن «بساز» نسخهٔ فشردهٔ عکست برای ساخت تصویر به سرویس تصویر فرستاده می‌شود؛ خود عکس فقط برای ساخت نمونه و دیدن سالن می‌ماند.')+(left!=null?(studio()?' '+fa(left)+' عکس دیگر می‌توانی بسازی.':' '+fa(left)+' ساخت دیگر در این بخش داری.'):'');
}
// Step 2 → 3 in one tap: «بساز» goes straight to building, no page in between.
function build(){
 if(studio()&&walletData&&state.verified){var fr=giftOut?0:(walletData.free?walletData.free.left:0),cn=walletData.own?walletData.own.coins||0:0;if(fr<=0&&cn<(walletData.image_coins||25)){openWallet();return}}
 if(state.busy){toast('صبر کن بارگذاری عکس تمام شود');return}
 if(!hasChoice()){toast(missingReason());return}
 if(!canGenerate()&&studio()&&quotaLeft()===0){openWallet();return}
 if(!canGenerate()){go(3);return}
 go(3);generate();
}
// Hair colour: on the new hairstyle (default) or on the original photo.
function baseChooser(){
 var hr=hairResult();
 if(!hr){
  if(!state.original)return null;
  return el('div',{class:'basehint'},[el('span',{html:ICO.scissors}),el('span',{text:'می‌خواهی رنگ را روی مدل موی جدیدت ببینی؟ اول در بخش «مدل مو» یک مدل بساز.'}),el('button',{class:'btn btn--ghost btn--sm',type:'button',onclick:function(){switchLine('hair',{scroll:true})},text:'رفتن به مدل مو'})]);
 }
 var wrap=el('div',{class:'base',role:'radiogroup','aria-label':'رنگ روی کدام عکس امتحان شود؟'});
 [['hair',hr.id,'روی مدل موی جدیدم','«'+hr.name+'»'],['original',state.original,'روی عکس اصلی خودم','موهای همین الانت']].forEach(function(x){
  var on=(state.base||'hair')===x[0];
  wrap.append(el('button',{class:'base__opt'+(on?' is-on':''),type:'button',role:'radio','aria-checked':on?'true':'false',onclick:function(){pickLook(function(){state.base=x[0]})}},[el('img',{src:x[0]==='original'&&state.preview?state.preview:media(x[1]),alt:''}),el('span',{},[el('b',{text:x[2]}),el('small',{text:x[3]})])]));
 });
 return el('div',{class:'base-wrap'},[h('p','رنگ روی کدام عکس امتحان شود؟','lbl'),wrap]);
}
/* ---------- colour box with suggestions ---------- */
var COLORS=[
 ['مشکی','#151515'],['مشکی کلاغی','#0f1420'],['مشکی آبی','#141a2c'],['قهوه‌ای تیره','#3b2518'],['قهوه‌ای متوسط','#5e3c25'],['قهوه‌ای روشن','#7a5233'],
 ['شکلاتی','#4b2b1c'],['شکلاتی تلخ','#33201a'],['شکلاتی گرم','#5a321e'],['موکا','#6a4a37'],['نسکافه‌ای','#8d6646'],['فندقی','#8b5a2b'],['قهوه‌ای دودی','#5a4a42'],['دودی زیتونی','#6b6450'],['زیتونی','#6b6a3f'],['شکلاتی دودی','#4a3a33'],['نسکافه‌ای دودی','#7d6a5a'],['قهوه‌ای سرد','#54443c'],
 ['کاراملی','#a86c34'],['عسلی','#b8803a'],['عسلی طلایی','#c99a45'],['بلوند عسلی','#c8913f'],['بلوند کاراملی','#b9864f'],['بلوند طلایی','#d8b064'],['بلوند شامپاینی','#e2cfa5'],
 ['بلوند بژ','#d4bc96'],['بلوند روشن','#ddc28c'],['بلوند خیلی روشن','#ecdcb4'],['بلوند تیره','#9e7a4a'],['بلوند دودی','#b6aa96'],['بلوند خاکستری','#c9c2b0'],['بلوند نقره‌ای','#dcd8cc'],
 ['بلوند یخی','#e8e6dd'],['پلاتینه','#ece8dc'],['بلوند توت‌فرنگی','#d79a72'],['بلوند رزگلد','#d9a19a'],
 ['مسی','#b5602f'],['مسی روشن','#c87a45'],['قرمز مسی','#a8462a'],['حنایی','#a4482a'],['دارچینی','#8f4f2c'],['ماهاگونی','#6e2f25'],['قرمز آتشین','#b0302a'],
 ['شرابی','#6b1f2e'],['آلبالویی','#7a1f2b'],['زرشکی','#6d1a2a'],['یاقوتی','#8b1d36'],['بادمجانی','#4a2438'],['بنفش','#5b3a78'],['یاسی','#b8a1d6'],
 ['رزگلد','#c98c7a'],['صورتی پاستلی','#e8b4c4'],['آبی دودی','#5a6e86'],['آبی نفتی','#23465c'],['نقره‌ای','#c4c4c2'],['خاکستری','#a9a9a6'],['سفید یخی','#ebebe8'],
 ['بالیاژ عسلی','#3b2518,#c8913f'],['بالیاژ کاراملی','#4b2b1c,#b9864f'],['بالیاژ شامپاینی','#5e3c25,#e2cfa5'],['بالیاژ سرد','#3b3430,#d6d2c6'],['بالیاژ مسی','#4b2b1c,#c87a45'],
 ['آمبره قهوه‌ای به بلوند','#3b2518,#ddc28c'],['آمبره شرابی','#33201a,#7a1f2b'],['آمبره دودی','#2b2622,#b6aa96'],['سامبره','#5e3c25,#b8803a'],
 ['هایلایت طلایی','#5e3c25,#d8b064'],['مش دودی','#4b4540,#b6aa96'],['مش عسلی','#5e3c25,#c8913f'],['بالیاژ دودی','#2b2622,#a59a8c'],['هایلایت نقره‌ای','#4b4540,#dcd8cc'],['لایت عسلی','#7a5233,#c8913f'],['لایت دودی','#5a4a42,#c9c2b0'],['بیبی لایت','#8b5a2b,#ddc28c']
];
var POPULAR=['دودی زیتونی','نسکافه‌ای','بالیاژ عسلی','شکلاتی','مش دودی','کاراملی','بلوند شامپاینی','شرابی'];
function normFa(s){return String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[‌\s]/g,'')}
function swatch(hex){var c=hex.split(',');return el('span',{class:'swatch',style:'background:'+(c.length>1?'linear-gradient(135deg,'+c[0]+' 0 45%,'+c[1]+' 55%)':c[0])})}
function colorPicker(){
 var wrap=el('div',{class:'color'});
 var input=el('input',{id:'color',type:'text',maxlength:'60',value:state.color||'',autocomplete:'off',role:'combobox','aria-autocomplete':'list','aria-expanded':'false','aria-controls':'color-list',placeholder:'مثلاً عسلی، شکلاتی، بالیاژ سرد'});
 var list=el('ul',{class:'color__list',id:'color-list',role:'listbox',hidden:true});
 var clear=el('button',{class:'color__clear',type:'button','aria-label':'پاک کردن رنگ',text:'×',hidden:!state.color});
 var active=-1,shown=[];
 function typed(){if(state.line==='color'&&state.color){var had=state.style!==null||state.reference;state.style=null;state.reference=null;state.refTitle='';if(had){renderDockSoon()}}}
 function pick(name){track('color',name);state.color=name;input.value=name;clear.hidden=false;close();state.result=null;typed();if(state.line==='color'){renderFlow();renderDock();scrollToBuild()}}
 function close(){list.hidden=true;input.setAttribute('aria-expanded','false');active=-1}
 function render(){
  var q=normFa(input.value);
  var own=lineCat()&&lineCat().colors.length,CL=own?lineCat().colors:COLORS,PP=own?lineCat().popular:POPULAR;
  shown=q?CL.filter(function(c){return normFa(c[0]).indexOf(q)>=0}).slice(0,8):PP.map(function(n){return CL.find(function(c){return c[0]===n})}).filter(Boolean);
  list.replaceChildren();
  shown.forEach(function(c,i){var li=el('li',{role:'option',id:'co-'+i,class:i===active?'is-active':'','aria-selected':i===active?'true':'false'},[swatch(c[1]),el('span',{text:c[0]})]);li.addEventListener('mousedown',function(e){e.preventDefault();pick(c[0])});list.append(li)});
  if(q&&!shown.length)list.append(el('li',{class:'color__free',text:'«'+input.value.trim()+'» همین‌طور که نوشتی فرستاده می‌شود'}));
  list.hidden=false;input.setAttribute('aria-expanded','true');
  if(active>=0)input.setAttribute('aria-activedescendant','co-'+active);else input.removeAttribute('aria-activedescendant');
 }
 input.addEventListener('focus',render);
 input.addEventListener('input',function(){state.color=input.value.trim();clear.hidden=!input.value;active=-1;state.result=null;typed();render();renderDockSoon()});
 input.addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(shown.length-1,active+1);render()}
  else if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(0,active-1);render()}
  else if(e.key==='Enter'&&active>=0&&shown[active]){e.preventDefault();pick(shown[active][0])}
  else if(e.key==='Escape')close();
 });
 input.addEventListener('blur',function(){setTimeout(close,120)});
 clear.addEventListener('click',function(){state.color='';input.value='';clear.hidden=true;input.focus();renderDockSoon()});
 var hint=state.tab==='upload'&&state.reference&&state.transfer!=='style'?'اگر رنگی بنویسی، به‌جای رنگ عکس مدل استفاده می‌شود.':state.tab==='salon'&&state.reference?'اگر رنگی بنویسی، مدل همان کار سالن می‌ماند و رنگ عوض می‌شود.':'خالی بماند یعنی رنگ فعلی موهایت حفظ شود.';
 if(state.line==='nails'||state.line==='lashes')hint=state.reference?'اگر رنگی بنویسی، طرح همان می‌ماند و رنگ عوض می‌شود.':'خالی بگذاری، رنگی که به مدل می‌آید انتخاب می‌شود.';
 if(state.line==='color')hint='رنگت در لیست نیست؟ اسمش را بنویس (مثلاً «قهوه‌ای سرد» یا «مش طلایی»)؛ همان‌طور که نوشتی ساخته می‌شود.';
 input.placeholder=state.line==='nails'?'مثلاً نود، قرمز، شیری':state.line==='lashes'?'مثلاً مشکی، قهوه‌ای':input.placeholder;
 if(state.line==='color'&&(state.style!==null||state.reference))input.value='';
 wrap.append(el('label',{class:'lbl',for:'color',text:state.line==='nails'?'رنگ ناخن (اختیاری)':state.line==='lashes'?'رنگ مژه (اختیاری)':'یا اسم رنگ را بنویس'}),el('div',{class:'color__box'},[input,clear,list]),el('span',{class:'hint',text:hint}));
 return wrap;
}

function renderDockSoon(){clearTimeout(renderDockSoon.t);renderDockSoon.t=setTimeout(function(){renderDock();var b=$('#flow .btn--build');if(b){var c=canGenerate(),r=hasChoice();b.innerHTML=buildLabel(c);b.disabled=!r;var hn=$('#flow .build-hint');if(hn)hn.textContent=buildHint(r,c,quotaLeft())}},60)}
function typedColor(){return state.line==='color'&&state.style===null&&!state.reference&&String(state.color||'').trim().length>=2}
function hasChoice(){return !!state.original&&(state.style!==null||!!state.reference||!!state.custom||typedColor())}
function canGenerate(){return hasChoice()&&!!state.pub.generation&&!state.paused&&(!state.reference||!!state.pub.reference)&&quotaLeft()!==0}
function missingReason(){
 if(!state.original)return 'اول عکس خودت را اضافه کن';
 if(quotaLeft()===0)return quotaOut();
 if(!state.pub.generation)return 'تولید شبیه‌سازی برای این سالن فعال نیست؛ می‌توانی درخواست بررسی بفرستی';
 if(state.reference&&!state.pub.reference)return 'انتقال عکس مرجع هنوز فعال نشده است';
 return {color:'یک رنگ انتخاب کن یا اسمش را بنویس',nails:'یک طرح انتخاب کن'}[state.line]||'یک مدل انتخاب کن';
}
// Before/after: the line sits exactly under the finger. Positions are physical (left→right)
// so RTL page direction never flips the drag. Drag moves 1:1, a tap moves the line there,
// and the hidden range keeps keyboard and screen-reader control.
function compareBlock(){
 var wrap=compareSlider(media(state.resultBase||state.original),media(state.result));
 return el('div',{},[el('div',{class:'mirror compare-wrap'},[wrap]),el('p',{class:'compare__hint',text:'خط را با انگشت بکش یا روی هر جای عکس بزن'})]);
}
/* A before/after slider (drag, tap, or arrow keys). Used for her result and for the studio's sample. */
function compareSlider(beforeSrc,afterSrc,alts){
 alts=alts||['قبل','بعد'];
 var wrap=el('div',{class:'compare'});
 wrap.append(el('img',{src:beforeSrc,alt:alts[0],draggable:'false'}));
 wrap.append(el('div',{class:'compare__after'},[el('img',{src:afterSrc,alt:alts[1],draggable:'false'})]));
 wrap.append(el('div',{class:'compare__handle'},[el('span',{class:'compare__grip',html:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8 5 12l4 4M15 8l4 4-4 4"/></svg>'})]));
 wrap.append(el('span',{class:'compare__tag compare__tag--before',text:'قبل'}));
 wrap.append(el('span',{class:'compare__tag compare__tag--after',text:'بعد'}));
 var range=el('input',{type:'range',min:'0',max:'100',value:'50',dir:'rtl',class:'compare__range','aria-label':'مقایسهٔ قبل و بعد؛ با کلیدهای جهت خط را جابه‌جا کن'});
 wrap.append(range);
 var x=50;
 function set(v,animate){x=Math.max(0,Math.min(100,v));wrap.classList.toggle('is-animating',!!animate);wrap.style.setProperty('--x',x+'%');range.value=String(Math.round(x))}
 set(50);
 var start=null;
 wrap.addEventListener('pointerdown',function(e){if(e.button>0)return;var r=wrap.getBoundingClientRect();start={px:e.clientX,x:x,w:r.width,left:r.left,moved:false,id:e.pointerId};wrap.classList.add('is-dragging')});
 wrap.addEventListener('pointermove',function(e){if(!start||e.pointerId!==start.id)return;var dx=e.clientX-start.px;if(!start.moved&&Math.abs(dx)<4)return;if(!start.moved){start.moved=true;try{wrap.setPointerCapture(e.pointerId)}catch(err){}}e.preventDefault();set(start.x-dx/start.w*100,false)});
 function end(e){if(!start)return;if(!start.moved&&e.type==='pointerup')set(100-(e.clientX-start.left)/start.w*100,true);start=null;wrap.classList.remove('is-dragging')}
 wrap.addEventListener('pointerup',end);wrap.addEventListener('pointercancel',end);
 range.addEventListener('input',function(){set(Number(range.value),false)});
 wrap.setTo=set;
 return wrap;
}
function ratingBlock(){
 var wrap=el('div',{class:'rate-line'});
 wrap.append(h('span',state.line==='nails'?'چقدر طبیعی شد؟':'چقدر شبیه خودت شد؟','tiny muted'));
 var stars=el('div',{class:'rating',role:'group','aria-label':'امتیاز به شباهت'});
 for(var i=1;i<=5;i++){
  (function(n){
   var b=el('button',{class:'rating__star'+(state.rating>=n?' is-on':''),type:'button','aria-label':fa(n)+' از ۵','aria-pressed':state.rating>=n?'true':'false',text:'★'});
   b.addEventListener('click',function(){state.rating=n;saveRating(n);renderFlow()});
   stars.append(b);
  })(i);
 }
 wrap.append(stars);
 return wrap;
}
function saveRating(n){try{localStorage.setItem('ayneh-rating-'+state.result,String(n))}catch(e){}track('rating',n+':'+(state.gen||''))}
function notice(kind,text){
 var map={info:ICO.info,warn:ICO.warn,danger:ICO.warn,ok:ICO.check};
 return el('div',{class:'notice notice--'+kind,style:'margin-top:14px'},[el('span',{html:map[kind]||ICO.info}),el('span',{text:text})]);
}
function field(id,label,hint,type,value,onInput,extra){
 var input=el('input',{id:id,type:type||'text',value:value||'',autocomplete:extra&&extra.autocomplete||'off',inputmode:extra&&extra.inputmode||null,placeholder:extra&&extra.placeholder||''});
 if(onInput)input.addEventListener('input',function(){onInput(input.value)});
 return el('label',{class:'field'},[el('span',{class:'lbl',text:label}),input,hint?el('span',{class:'hint',text:hint}):null]);
}
function filtersRow(opts,cur,onPick){
 var row=el('div',{class:'row'});
 opts.forEach(function(o){
  var b=el('button',{class:'chip'+(cur===o[0]?' is-on':''),type:'button','aria-pressed':cur===o[0]?'true':'false',text:o[1]});
  b.addEventListener('click',function(){onPick(o[0])});
  row.append(b);
 });
 return row;
}


function lookName(){
 var cat=lineCat(),L=state.line,LIST=cat?cat.styles:STYLES;
 var base=state.reference?(state.refTitle?'«'+state.refTitle+'» از کارهای سالن':({nails:'عکس طرح دلخواه',color:'عکس رنگ دلخواه'}[L]||'عکس مدل دلخواه')):(state.custom?state.custom:state.style!==null?LIST[state.style][0]:(typedColor()?state.color.trim():''));
 if(!base)return '';
 if(L==='hair')return base;
 if(L==='color'){var hr=hairResult();return 'رنگ مو: '+base+(hr&&state.base!=='original'?' روی مدل «'+hr.name+'»':'')}
 var extra=cat.options.map(function(o){return Number.isInteger(state.opts[o.key])?o.items[state.opts[o.key]]:''}).filter(Boolean).join('، ');
 return (L==='nails'?'ناخن: ':'مژه: ')+base+(extra?' ('+extra+')':'');
}
// The colour sent with a request: hair colour line = the chosen colour; nails and lashes = the colour box.
function colorLabel(){if(state.line==='hair')return '';if(state.line==='color')return state.reference?'':(state.style!==null?LINES.color.styles[state.style][0]:String(state.color||'').trim());return state.color||''}
function artist(){return {nails:'ناخن‌کار',lashes:'مژه‌کار',color:'رنگ‌کار'}[state.line]||'آرایشگر'}
function sendButton(){
 /* The studio has no salon to send to: keep the result, or top up when she is out of images. */
 if(studio())return state.result?downloadLink('btn btn--primary','دانلود عکس'):el('button',{class:'btn btn--primary',type:'button',onclick:openWallet,html:'<span class="coin-pill__ico">'+COIN+'</span><span>شارژ کیف سکه</span>'});
 return el('button',{class:'btn btn--primary',type:'button',onclick:openRequest,html:ICO.send+'<span>'+(state.result?'درخواست نوبت می‌دهم':'فرستادن برای '+artist())+'</span>'})}
// Building: a playful scene for each service in the mirror, the stage it is at and a live percentage.
var BUILD={
 hair:{title:'در حال کوتاهی و حالت‌دهی…',steps:['آماده‌سازی عکس','پیدا کردن صورت و خط مو','کوتاهی و فرم','جزئیات تار به تار','براشینگ آخر']},
 color:{title:'در حال رنگ کردن موها…',steps:['آماده‌سازی عکس','پیدا کردن موها','ترکیب رنگ','رنگ‌گذاری تار به تار','براق کردن']},
 nails:{title:'در حال لاک زدن ناخن‌ها…',steps:['آماده‌سازی عکس','پیدا کردن ناخن‌ها','فرم و سوهان','لاک و طرح','براق کردن']},
 lashes:{title:'در حال کاشت مژه…',steps:['آماده‌سازی عکس','پیدا کردن چشم‌ها','نقشهٔ مژه','کاشت تار به تار','فر و حالت']}
};
var FX={
 hair:'<svg class="fx fx--scissors" viewBox="0 0 64 64" aria-hidden="true"><g class="fx__b1"><circle cx="15" cy="47" r="8" fill="none" stroke="#fff" stroke-width="4"/><path d="M21 42 56 14" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g><g class="fx__b2"><circle cx="15" cy="17" r="8" fill="none" stroke="#fff" stroke-width="4"/><path d="M21 22 56 50" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g><circle cx="33" cy="32" r="3.2" fill="#f4e6cc"/></svg><i class="fx__bit"></i><i class="fx__bit"></i><i class="fx__bit"></i><i class="fx__bit"></i>',
 color:'<span class="fx__wash"></span><svg class="fx fx--brush" viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(-38 32 32)"><rect x="27" y="2" width="10" height="30" rx="5" fill="#fff"/><rect x="23.5" y="30" width="17" height="8" rx="2" fill="#e8d7c0"/><path d="M24 38h16l-1.5 15c-4.5 3.4-8.5 3.4-13 0Z" fill="var(--wash)" stroke="#fff" stroke-width="2"/></g></svg>',
 nails:'<svg class="fx fx--bottle" viewBox="0 0 64 64" aria-hidden="true"><rect x="25" y="3" width="14" height="19" rx="4" fill="#fff"/><rect x="17" y="21" width="30" height="38" rx="11" fill="var(--wash)" stroke="#fff" stroke-width="3"/><path d="M24 30v16" stroke="rgba(255,255,255,.75)" stroke-width="3.2" stroke-linecap="round"/></svg><svg class="fx fx--wand" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 54 44 20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M44 20c4-4 10-5 12-3s1 8-3 12c-3 3-7 2-9 0s-3-6 0-9Z" fill="var(--wash)" stroke="#fff" stroke-width="2.5"/></svg>',
 lashes:'<svg class="fx fx--eye" viewBox="0 0 80 50" aria-hidden="true"><g class="fx__lid"><path d="M6 30Q40 4 74 30Q40 52 6 30Z" fill="rgba(255,255,255,.92)"/><circle cx="40" cy="30" r="9.5" fill="#3b2a20"/><circle cx="43.5" cy="26.5" r="3" fill="#fff"/></g><g class="fx__lash" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M13 23 6 14"/><path d="M22 16 17 6"/><path d="M32 12 30 1"/><path d="M48 12 50 1"/><path d="M58 16 63 6"/><path d="M67 23 74 14"/></g></svg>'
};
function washColor(){
 if(state.line==='color'&&state.style!==null){var sw=LINES.color.swatches[state.style].split(',');return sw[sw.length-1]}
 var cl=(lineCat()&&lineCat().colors||COLORS).find(function(c){return normFa(c[0])===normFa(state.color)});
 if(cl)return cl[1].split(',').pop();
 return state.line==='nails'?'#d9506e':state.line==='color'?'#b8803a':'#c9a14a';
}
// Real builds take about 50–80 seconds: the curve reaches ~80% at a minute and keeps moving after.
function buildPct(){var t=Date.now()-(state.genT0||Date.now());return state.result?100:Math.min(97,Math.round(3+94*(1-Math.exp(-t/38000))))}
function buildNote(){var t=Date.now()-(state.genT0||Date.now());return t>85000?'هنوز در حال ساخت است؛ صفحه را نبند.':t>45000?'هنوز در حال ساخت است… چند لحظهٔ دیگر صبر کن.':'این صفحه را نبند؛ بدون نصب، روی گوشی.'}
function buildStage(){
 var L=state.line,B=BUILD[L]||BUILD.hair,pct=buildPct(),src=state.genBase?media(state.genBase):(state.original?media(state.original):'');
 var stage=el('div',{class:'stage mirror build build--'+L,style:'--wash:'+washColor()},[el('div',{class:'mirror__glass'},[
  src?el('img',{class:'build__photo',src:src,alt:''}):null,
  el('span',{class:'build__scan','aria-hidden':'true'}),
  el('div',{class:'build__fx',html:FX[L]||FX.hair}),
  el('span',{class:'build__spark build__spark--1','aria-hidden':'true',text:'✦'}),el('span',{class:'build__spark build__spark--2','aria-hidden':'true',text:'✦'}),el('span',{class:'build__spark build__spark--3','aria-hidden':'true',text:'✧'}),
  el('div',{class:'build__pct'},[el('b',{class:'build__num',text:fa(pct)}),el('span',{text:'٪'})])
 ])]);
 var at=Math.min(B.steps.length-1,Math.floor(pct/100*B.steps.length));
 var list=el('ol',{class:'build__steps'},B.steps.map(function(t,i){return el('li',{class:i<at?'is-done':i===at?'is-on':''},[el('span',{html:i<at?ICO.check:''}),el('b',{text:t})])}));
 return el('div',{class:'build-wrap',role:'status','aria-live':'polite'},[stage,el('div',{class:'build__side'},[h('p',B.title,'build__title'),el('div',{class:'progress'},[el('div',{class:'progress__bar'},[el('div',{class:'progress__fill',style:'width:'+pct+'%'})])]),list,h('p',buildNote(),'tiny muted build__note')])]);
}
// One name per saved photo: salon, service, date and time, and the result's own id.
function saveName(id){
 var d=new Date(),p={};try{new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(d).forEach(function(x){p[x.type]=x.value})}catch(e){}
 var stamp=(p.year||d.getFullYear())+(p.month||'')+(p.day||'')+'-'+String(p.hour||'').replace('24','00')+(p.minute||'')+(p.second||'');
 return ['ayneh',SLUG,{hair:'model-mo',color:'rang-mo',nails:'nakhon',lashes:'mozhe'}[state.line]||'mo',stamp,String(id||'').replace(/[^a-z0-9]/gi,'').slice(0,8)].join('-')+'.jpg';
}
// The saved or shared photo carries the salon's badge (logo and name) in the bottom-right corner,
// so a story made from it is a small ad for the salon. Made in the browser; the original stays clean.
function loadImg(src){return new Promise(function(res,rej){var i=new Image();i.decoding='async';i.onload=function(){res(i)};i.onerror=rej;i.src=src})}
function brandedBlob(id){
 var s=state.pub.salon,p=s.profile||{};
 return Promise.all([loadImg(media(id)),p.logo?loadImg(media(p.logo)).catch(function(){return null}):Promise.resolve(null)]).then(function(r){
  var img=r[0],logo=r[1],W=img.naturalWidth,H=img.naturalHeight,c=document.createElement('canvas');c.width=W;c.height=H;var g=c.getContext('2d');g.drawImage(img,0,0,W,H);
  // Only the salon's round logo, bottom right, on a thin white ring.
  var u=Math.min(W,H),pad=Math.round(u*.035),d=Math.round(u*.12),ring=Math.max(2,Math.round(d*.06)),cx=W-pad-d/2,cy=H-pad-d/2;
  g.save();g.shadowColor='rgba(0,0,0,.3)';g.shadowBlur=Math.round(u*.015);g.fillStyle='#fff';g.beginPath();g.arc(cx,cy,d/2+ring,0,Math.PI*2);g.fill();g.restore();
  if(logo){g.save();g.beginPath();g.arc(cx,cy,d/2,0,Math.PI*2);g.clip();var lw=logo.naturalWidth,lh=logo.naturalHeight,k=Math.max(d/lw,d/lh);g.drawImage(logo,cx-lw*k/2,cy-lh*k/2,lw*k,lh*k);g.restore()}
  else{g.fillStyle='#0c6b6b';g.beginPath();g.arc(cx,cy,d/2,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.font='800 '+Math.round(d*.46)+'px Estedad, Vazirmatn, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText((s.name||'آ').trim().charAt(0),cx,cy+d*.03)}
  // A small «آینه» mark, bottom left, so a saved or shared result says where it came from.
  var fs=Math.round(u*.034),tw;g.save();g.font='800 '+fs+'px Estedad, Vazirmatn, sans-serif';tw=g.measureText('آینه').width;
  var bx=pad,bh=Math.round(fs*1.7),bw=Math.round(tw+fs*1.4),by=H-pad-bh;
  g.fillStyle='rgba(12,107,107,.82)';g.beginPath();if(g.roundRect)g.roundRect(bx,by,bw,bh,bh/2);else g.rect(bx,by,bw,bh);g.fill();
  g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText('آینه',bx+bw/2,by+bh/2+fs*.04);g.restore();
  return new Promise(function(res){c.toBlob(function(b){res(b)},'image/jpeg',.92)});
 });
}
// Instagram story (1080×1920): the result itself, untouched — never re-generated, filtered or
// retouched, so her face stays exactly as the result shows it — framed on a soft blurred copy of
// itself. A salon or member page signs it with the salon's logo and name; Ayneh's own pages
// (direct, demo) with Ayneh's mark. Made in the browser; nothing is uploaded.
var STORY_CAP={hair:'مدل موی جدید من',color:'رنگ موی جدید من',nails:'طرح ناخن جدید من',lashes:'مژهٔ جدید من'};
function storyOwner(){var s=state.pub.salon||{},p=s.profile||{};return (state.pub.direct||state.pub.demo)?{name:'آینه',logo:'/landing/ayneh-logo-lg.webp',ayneh:true}:{name:s.name||'',logo:p.logo?media(p.logo):'',ayneh:false}}
function storyBlob(id){
 var o=storyOwner(),W=1080,H=1920;
 var fonts=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('800 52px Estedad'),document.fonts.load('500 30px Estedad')]).catch(function(){}):Promise.resolve();
 return Promise.all([loadImg(media(id)),o.logo?loadImg(o.logo).catch(function(){return null}):Promise.resolve(null),fonts]).then(function(r){
  var img=r[0],logo=r[1],iw=img.naturalWidth,ih=img.naturalHeight,c=document.createElement('canvas');c.width=W;c.height=H;var g=c.getContext('2d');
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  // background: the same photo, blurred and dimmed (only the backdrop; the photo itself is drawn clean below)
  var k=Math.max(W/iw,H/ih);g.save();g.filter='blur(46px) saturate(1.05)';g.drawImage(img,(W-iw*k)/2,(H-ih*k)/2,iw*k,ih*k);g.restore();
  var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(8,30,30,.72)');gr.addColorStop(.45,'rgba(8,30,30,.38)');gr.addColorStop(1,'rgba(8,30,30,.8)');g.fillStyle=gr;g.fillRect(0,0,W,H);
  // the result, whole, at its own proportions — no crop, no filter
  var maxW=880,maxH=1020,s2=Math.min(maxW/iw,maxH/ih),dw=Math.round(iw*s2),dh=Math.round(ih*s2),dx=Math.round((W-dw)/2),dy=Math.round(510+(maxH-dh)/2),rad=40,bd=10;
  function rr(x,y,w,h,r){g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h)}
  g.save();g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=60;g.shadowOffsetY=24;g.fillStyle='#fff';rr(dx-bd,dy-bd,dw+bd*2,dh+bd*2,rad+bd);g.fill();g.restore();
  g.save();g.filter='none';rr(dx,dy,dw,dh,rad);g.clip();g.drawImage(img,dx,dy,dw,dh);g.restore();
  // the signature: round logo on a white ring, the name under it
  // Instagram covers about 250px at the top and bottom of a story: everything stays inside.
  var cx=W/2,cy=320,d=140;
  g.save();g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=24;g.fillStyle='#fff';g.beginPath();g.arc(cx,cy,d/2+7,0,Math.PI*2);g.fill();g.restore();
  g.save();g.beginPath();g.arc(cx,cy,d/2,0,Math.PI*2);g.clip();
  if(logo){var lw=logo.naturalWidth,lh=logo.naturalHeight;if(o.ayneh){var q=Math.min(d*.78/lw,d*.78/lh);g.fillStyle='#fff';g.fillRect(cx-d/2,cy-d/2,d,d);g.drawImage(logo,cx-lw*q/2,cy-lh*q/2,lw*q,lh*q)}else{var q2=Math.max(d/lw,d/lh);g.drawImage(logo,cx-lw*q2/2,cy-lh*q2/2,lw*q2,lh*q2)}}
  else{g.fillStyle='#0c6b6b';g.fillRect(cx-d/2,cy-d/2,d,d);g.fillStyle='#fff';g.font='800 72px Estedad, Vazirmatn, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText((o.name||'آ').trim().charAt(0),cx,cy+4)}
  g.restore();
  g.direction='rtl';g.textAlign='center';g.textBaseline='alphabetic';g.fillStyle='#fff';g.font='800 48px Estedad, Vazirmatn, sans-serif';
  var nm=o.name;while(g.measureText(nm).width>W-160&&nm.length>4)nm=nm.slice(0,-2)+'…';g.fillText(nm,cx,cy+d/2+70);
  // caption and the honest note
  var by=dy+dh+bd+96;g.font='800 56px Estedad, Vazirmatn, sans-serif';g.fillText(STORY_CAP[state.line]||STORY_CAP.hair,cx,Math.min(by,1620));
  g.font='500 28px Estedad, Vazirmatn, sans-serif';g.fillStyle='rgba(255,255,255,.72)';g.fillText('نمونهٔ نمایشی',cx,Math.min(by+52,1668));
  return new Promise(function(res){c.toBlob(function(b){res(b)},'image/jpeg',.94)});
 });
}
var stories={};
function prepareStory(id){
 if(!id)return Promise.resolve(null);if(stories[id])return stories[id].p;
 var rec=stories[id]={};
 rec.p=storyBlob(id).then(function(b){if(!b)throw new Error('x');rec.name=saveName(id).replace(/\.jpg$/,'-story.jpg');rec.url=URL.createObjectURL(b);try{rec.file=new File([b],rec.name,{type:'image/jpeg'})}catch(e){}
  Array.prototype.forEach.call(document.querySelectorAll('a[data-story="'+id+'"]'),function(a){a.href=rec.url;a.setAttribute('download',rec.name)});return rec}).catch(function(){rec.failed=true;return rec});
 return rec.p;
}
function storyLink(cls){
 var id=state.result;
 var a=el('a',{class:cls,'data-story':id,href:'#',download:'',html:ICO.instagram+'<span>قالب استوری اینستاگرام</span>'});
 a.addEventListener('click',function(e){
  var r=stories[id];
  // on a phone the share sheet goes straight to Instagram; on a computer it downloads
  if(r&&r.file&&(IOS||/Android/.test(navigator.userAgent))&&navigator.canShare&&navigator.canShare({files:[r.file]})){e.preventDefault();track('save','story');navigator.share({files:[r.file]}).catch(function(){});return}
  if(r&&r.url){track('save','story');return}
  e.preventDefault();
  if(r&&r.failed){toast('ساخت قالب استوری ممکن نشد؛ «'+(studio()?'دانلود عکس':'ذخیره تصویر')+'» را بزنید.');return}
  toast('یک لحظه، استوری را آماده می‌کنم…');
  prepareStory(id).then(function(x){if(x&&x.url){a.href=x.url;a.setAttribute('download',x.name);a.click()}});
 });
 prepareStory(id);
 return a;
}
// The logo version is made as soon as a result appears, so a tap downloads at once (phones block a
// download or share that starts seconds after the tap).
var branded={};
function prepareBranded(id){
 if(!id||branded[id])return branded[id]&&branded[id].p;
 var rec=branded[id]={};
 rec.p=brandedBlob(id).then(function(blob){if(!blob)throw new Error('x');rec.name=saveName(id);rec.url=URL.createObjectURL(blob);try{rec.file=new File([blob],rec.name,{type:'image/jpeg'})}catch(e){}
  Array.prototype.forEach.call(document.querySelectorAll('a[data-dl="'+id+'"]'),function(a){a.href=rec.url;a.setAttribute('download',rec.name)});return rec}).catch(function(){rec.failed=true;return rec});
 return rec.p;
}
var IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function downloadLink(cls,label,forId){
 var id=forId||state.result,rec=branded[id];
 var a=el('a',{class:cls,'data-dl':id,href:rec&&rec.url||media(id),download:rec&&rec.name||saveName(id),html:ICO.download+'<span>'+label+'</span>'});
 a.addEventListener('click',function(e){
  var r=branded[id];
  // iPhone: the share sheet's «Save Image» puts it in Photos; elsewhere the link itself downloads.
  if(r&&r.file&&IOS&&navigator.canShare&&navigator.canShare({files:[r.file]})){e.preventDefault();track('save','share');navigator.share({files:[r.file]}).catch(function(){});return}
  if(r&&r.url){track('save','file');return}
  if(r&&r.failed){track('save','plain');return}
  e.preventDefault();toast('یک لحظه، دارم عکس را آماده می‌کنم…');
  prepareBranded(id).then(function(x){if(x&&x.url){a.href=x.url;a.setAttribute('download',x.name)}a.click()});
 });
 prepareBranded(id);
 return a;
}
function stepResult(){
 var box=el('div',{class:'panel flow'}),L=state.line;
 box.append(flowHead(state.result?({color:'خودت با رنگ جدید',nails:'ناخن‌هایت با طرح جدید',lashes:'خودت با مژهٔ جدید'}[L]||'خودت با مدل جدید'):state.busy?'دارم می‌سازم…':(studio()?'نتیجه':'نتیجه و ارسال'),'این تصویر یک شبیه‌سازی پیشنهادی است، نه تضمین اجرا. تصمیم نهایی با '+artist()+' است.'));
 var meta=L==='hair'?(state.pub.demo&&state.color?'رنگ: '+state.color:'رنگ موهایت همان می‌ماند'):L==='color'?(baseId()?'روی مدل موی جدیدت':'روی عکس اصلی‌ات'):(state.color?'رنگ: '+state.color:'رنگ: هماهنگ با طرح');
 box.append(el('div',{class:'summary'},[
  state.original?el('img',{src:media(state.original),alt:''}):null,
  el('div',{class:'grow'},[el('b',{text:(lookName()||'هنوز چیزی انتخاب نشده')}),el('div',{class:'summary__meta',text:meta})]),
  el('button',{class:'btn btn--ghost btn--sm',type:'button',onclick:function(){go(2)},text:'تغییر'})
 ]));
 if(state.error)box.append(notice('danger',state.error));
 if(state.busy&&!state.result){box.append(buildStage());startBuildClock()}
 if(state.result){
  box.append(compareBlock());
  box.append(h('p','این یک پیش‌نمایش است تا قبل از رفتن به آرایشگاه انتخابت را راحت‌تر کنی.','fine-print result-approx'));
  // The visitor demo (/sample): another sample (2 in all, worker/demo.js) or this service's plans.
  if(state.pub.demo){box.append(el('div',{class:'result-actions'},[
   el('a',{class:'btn btn--soft btn--sm',href:location.protocol+'//'+location.host.replace(/^business\./,'')+'/?l='+L,target:'_top',text:'ثبت‌نام و نمونهٔ بیشتر'}),
   el('a',{class:'btn btn--primary btn--sm',href:'/'+L,target:'_top',text:'این را برای مشتریان خودم می‌خواهم'}),
   downloadLink('btn btn--ghost btn--sm','ذخیره تصویر'),
   storyLink('btn btn--ghost btn--sm')
  ]))}else
  box.append(el('div',{class:'result-actions'},[
   L==='hair'?el('button',{class:'btn btn--soft btn--sm',type:'button',onclick:openViews,html:ICO.orbit+'<span>نمای ۳۶۰ درجه</span>'}):null,
   el('button',{class:'btn btn--soft btn--sm',type:'button',onclick:openAsk,html:SHARE_IC.chat+'<span>'+(studio()?'نظر دوستم':'از دوستم نظر بپرسم')+'</span>'}),
   studio()?null:downloadLink('btn btn--ghost btn--sm','ذخیره تصویر'),
   storyLink('btn btn--ghost btn--sm'),
   studio()?null:el('button',{class:'btn btn--ghost btn--sm',type:'button',onclick:function(){state.result=null;state.gen=null;state.idem=null;state.error='';state.busy=false;state.resultBase=null;go(2)},text:{nails:'یک طرح دیگر',color:'یک رنگ دیگر'}[L]||'یک مدل دیگر'})
  ]));
  // After a new hairstyle, the natural next step is its colour.
  if(L==='hair')box.append(el('button',{class:'next-line',type:'button',onclick:function(){track('color_on_hair');switchLine('color',{step:2,onHair:true,scroll:true})}},[el('span',{class:'next-line__ico',html:ICO.drop}),el('span',{},[el('b',{text:'رنگ مو را هم روی همین مدل امتحان کن'}),el('small',{text:'مدل همین می‌ماند و فقط رنگ عوض می‌شود.'})]),el('span',{class:'next-line__go',html:ICO.arrow})]));
  box.append(h('p',studio()?'عکسی که ذخیره می‌کنی، گوشهٔ پایینش نشان کوچک «آینه» را دارد.':'عکسی که ذخیره می‌کنی، گوشهٔ پایینش لوگوی «'+state.pub.salon.name+'» و نشان کوچک «آینه» را دارد.','fine-print'));
  box.append(ratingBlock());
  box.append(el('div',{class:'flow__nav'},[sendButton()]));
  box.append(sendNote());
 }else if(!state.busy){
  if(!canGenerate()){
   /* Out of images for this service: say exactly that (once), never «not active yet». */
   if(state.paused){}
   else if(quotaLeft()===0&&state.pub.generation){if(!/سهم امتحان/.test(state.error||''))box.append(notice('info',quotaOut()));if(window.AynehPacks&&!studio())box.append(window.AynehPacks.button())}
   else box.append(notice('info',!state.pub.generation?'این سالن پیش‌نمایش تصویری را فعال نکرده. عکس و انتخابت را برای '+artist()+' بفرست تا بررسی کند.':(!hasChoice()?missingReason()+'.':state.reference&&!state.pub.reference?'ساخت تصویر از عکس مدل خودت در این سالن فعال نیست. عکس و انتخابت را مستقیم برای '+artist()+' بفرست.':'ساخت تصویر از این انتخاب هنوز فعال نیست. عکس و انتخابت را مستقیم برای '+artist()+' بفرست.')));
   box.append(el('div',{class:'flow__nav'},[!hasChoice()&&state.original?el('button',{class:'btn btn--ghost',type:'button',onclick:function(){go(2)},text:'انتخاب'}):null,sendButton()]));
   box.append(sendNote());
  }else{
   box.append(el('div',{class:'stage mirror'},[el('div',{class:'mirror__glass'},[el('span',{class:'stage__empty',text:'نتیجه همین‌جا، در قاب آینه، ظاهر می‌شود'})])]));
   box.append(el('div',{class:'flow__nav'},[
    el('button',{class:'btn btn--primary',type:'button',onclick:generate,html:ICO.spark+'<span>'+buildText()+'</span>'}),
    studio()?null:el('button',{class:'btn btn--ghost',type:'button',onclick:openRequest,html:ICO.send+'<span>بدون شبیه‌سازی بفرست</span>'})
   ]));
   box.append(h('p',studio()?'با زدن «بساز» نسخهٔ فشردهٔ عکست برای ساخت تصویر به سرویس تصویر فرستاده می‌شود؛ برای هیچ آرایشگاهی فرستاده نمی‌شود.':'با زدن «بساز» نسخهٔ فشردهٔ عکست برای ساخت تصویر به سرویس تصویر فرستاده می‌شود؛ خود عکس فقط برای ساخت نمونه و دیدن سالن می‌ماند.','fine-print'));
  }
 }
 return box;
}
// Keeps the percentage and the stage moving smoothly between server checks.
function startBuildClock(){
 if(startBuildClock.t)return;
 startBuildClock.t=setInterval(function(){if(!state.busy||state.result||state.step!==3){clearInterval(startBuildClock.t);startBuildClock.t=0;return}updateProgress()},300);
}
function sendNote(){
 if(studio())return el('p',{class:'send-note'},[el('span',{html:ICO.lock}),el('span',{text:state.result?'این عکس فقط برای خودته. ذخیره‌اش کن و موقع نوبت به آرایشگرت نشونش بده.':'هر عکس ۲۵ سکه است؛ اگه ساخت عکسی خراب بشه، سکه‌اش برمی‌گرده.'})]);
 var name=state.pub.salon.name;
 return el('p',{class:'send-note'},[el('span',{html:ICO.send}),el('span',{text:state.pub.telegram?'عکس و مدلت با اسم و شماره‌ات برای «'+name+'» فرستاده می‌شود و خود سالن با تو تماس می‌گیرد.':'«'+name+'» هنوز ارسال آنلاین را فعال نکرده؛ با زدن این دکمه راه‌های تماس با سالن را می‌بینی.'})]);
}

/* ---------- side: the salon's own work ---------- */
// The salon's own work lives only in step 2, under «کارهای سالن»; nothing beside the flow.
function renderSide(){var side=$('#side');if(side){side.replaceChildren();side.hidden=true}var l=$('.layout');if(l)l.classList.add('layout--solo')}
function fa0(v){return String(v).replace(/^\+98/,'0').replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})}

/* ---------- dock ---------- */
function renderDock(){
 if(accountMode()){var dk=$('#dock');if(dk)dk.hidden=true;return}
 var dock=$('#dock');
 var inner=el('div',{class:'dock__inner'});
 var hint='',primary=null;
 /* Studio: one action at a time — the fixed bar is only «بساز» (step 2, a look picked); photo and result actions live in the page. */
 if(studio()&&state.step!==2){dock.hidden=true;dock.classList.remove('is-in');return}
 if(state.step===1){
  hint=state.original?'عکس آماده است':(state.line==='nails'?'برای شروع، عکس دستت را اضافه کن':'برای شروع، عکس خودت را اضافه کن');
  if(state.busy&&!state.original){hint='در حال بارگذاری عکس…';primary=el('button',{class:'btn btn--primary',type:'button',disabled:true,text:'در حال بارگذاری…'})}
  else primary=el('button',{class:'btn btn--primary',type:'button',onclick:function(){(state.original?go(2):pickNow())},html:(state.original?ICO.check:ICO.camera)+'<span>'+(state.original?'ادامه':'افزودن عکس')+'</span>'});
 }else if(state.step===2){
  var ready=hasChoice(),can=canGenerate();
  var out=quotaLeft()===0;
  hint=out?'سهم ساخت این بخش تمام شد':ready?(can?'آماده؛ بزن بساز':'آماده'):missingReason();
  if(studio()&&ready&&!out)hint=lookName()||hint;
  if(studio()&&!out&&!ready){dock.hidden=true;dock.classList.remove('is-in');return}
  if(studio()&&out){hint='عکس‌هات تموم شد';primary=sendButton()}
  else primary=el('button',{class:'btn btn--primary btn--build',type:'button',disabled:!ready,onclick:build,html:can?ICO.spark+'<span>'+buildText()+'</span>':out?ICO.send+'<span>فرستادن</span>':ICO.arrow+'<span>ادامه</span>'});
 }else{
  if(state.busy){hint='در حال ساخت…';primary=el('button',{class:'btn btn--primary',type:'button',disabled:true,text:'در حال ساخت…'})}
  else if(studio()&&(state.result||!canGenerate())){hint=state.result?'نتیجه آماده است':'عکس‌هات تموم شد';primary=sendButton()}
  else if(state.result||!canGenerate()){hint='فرستادن برای سالن';primary=el('button',{class:'btn btn--primary',type:'button',onclick:openRequest,html:ICO.send+'<span>'+(state.result?'درخواست نوبت می‌دهم':'فرستادن برای '+artist())+'</span>'})}
  else{hint='آمادهٔ ساخت';primary=el('button',{class:'btn btn--primary',type:'button',onclick:generate,html:ICO.spark+'<span>'+buildText()+'</span>'})}
 }
 inner.append.apply(inner,[el('div',{class:'dock__hint',text:hint}),studio()?null:el('button',{class:'btn btn--ghost',type:'button',onclick:openAbout,'aria-label':'دربارهٔ سالن',html:ICO.info}),primary].filter(Boolean));
 var wasHidden=dock.hidden;dock.replaceChildren(inner);dock.hidden=false;if(wasHidden&&studio()){dock.classList.remove('is-in');void dock.offsetWidth;dock.classList.add('is-in')}
 var cta=document.querySelector('.studio__cta span');if(cta)cta.textContent=state.original?'ادامه با همین عکس':'شروع با عکس خودم';
}

/* ---------- upload ---------- */
function handleFile(file,kind){
 if(STUDIO_PREVIEW){toast('این صفحه برای پیش‌نمایش چیدمان است. برای امتحان روی عکس، دموی سالن ساناز را باز کنید.');return Promise.resolve()}
 if(!file){toast('عکسی انتخاب نشد');return}
 if(['image/jpeg','image/png','image/webp'].indexOf(file.type)<0){toast('فقط JPG، PNG یا WebP','error');return}
 if(state.busy){toast('صبر کن کار فعلی این بخش تمام شود');return Promise.resolve()}
 var line=state.line,L=function(){return lineRef(line)};
 state.busy=true;renderDock();
 if(kind==='original'){try{if(state.preview)URL.revokeObjectURL(state.preview);state.preview=URL.createObjectURL(file)}catch(e){state.preview=null}state.original=null;state.justUploaded=false;clearTimeout(state.advT);if(state.step!==1){state.step=1;renderSteps()}renderFlow();focusFlow()}
 return Promise.resolve().then(function(){return Promise.all([compress(file),ensureSession()])}).then(function(r){
  return api('upload?kind='+kind,r[0],true);
 }).then(function(d){
  if(kind==='original'){track('photo',line);L().original=d.id;L().ratio=compress.ratio||'';L().result=null;L().fromConsult=null;L().error='';L().idem=null;L().justUploaded=true;
   /* quiet: scrollToBuild, not focusFlow, decides where we land — on «بساز» when a look is
      already chosen (she only changed her photo), on the looks when it is not. */
   L().advT=setTimeout(function(){if(line===state.line&&L().step===1&&L().justUploaded){state.justArrived=true;go(2,true);scrollToBuild()}},1600)}
  else{track('look','u');L().reference=d.id;L().refTitle='';L().style=null;L().result=null;L().fromConsult=null;L().error='';if(line==='color')L().color='';if(line===state.line)setTimeout(scrollToBuild,60)}
  if(line===state.line){renderFlow();renderSteps();renderDock()}
 }).catch(function(e){if(kind==='original'&&!L().original){L().preview=null;if(line===state.line)renderFlow()}toast(e.message,'error')}).then(function(){L().busy=false;if(line===state.line)renderDock()});
}
function changePhoto(){clearTimeout(state.advT);state.justUploaded=false;state.original=null;state.preview=null;state.result=null;state.fromConsult=null;renderFlow();renderSteps();renderDock()}
function nearestRatio(r){var R=[['1:1',1],['4:5',.8],['3:4',.75],['2:3',.667],['9:16',.5625],['5:4',1.25],['4:3',1.333],['3:2',1.5],['16:9',1.778]];var best=R[0];R.forEach(function(x){if(Math.abs(Math.log(x[1]/r))<Math.abs(Math.log(best[1]/r)))best=x});return best[0]}
function compress(file){
 return createImageBitmap(file).then(function(bitmap){
  compress.ratio=nearestRatio(bitmap.width/bitmap.height);
  if(bitmap.width<300||bitmap.height<300){bitmap.close();throw new Error('عکس خیلی کوچک است؛ حداقل ۳۰۰×۳۰۰ پیکسل')}
  var canvas=document.createElement('canvas');
  var scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
  var attempt=0;
  function step(){
   canvas.width=Math.max(300,Math.round(bitmap.width*scale));
   canvas.height=Math.max(300,Math.round(bitmap.height*scale));
   var ctx=canvas.getContext('2d');
   ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   if(attempt===0){
    var data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    var light=0,c=0;
    for(var i=0;i<data.length;i+=160){light+=(data[i]+data[i+1]+data[i+2])/3;c++}
    if(light/c<22){bitmap.close();throw new Error('عکس خیلی تاریک است؛ نور بهتری انتخاب کن')}
   }
   return new Promise(function(res){canvas.toBlob(res,'image/jpeg',attempt<2?0.85:0.75)}).then(function(blob){
    if(!blob){bitmap.close();throw new Error('تبدیل عکس ممکن نشد')}
    if(blob.size<=820*1024||attempt>=5){bitmap.close();return blob}
    attempt++;scale*=0.72;return step();
   });
  }
  return step();
 });
}

/* ---------- generation ---------- */
function generate(){
 var line=state.line,L=function(){return lineRef(line)},paint=function(){if(line===state.line){renderFlow();renderDock()}};
 if(L().busy)return;
 if(!canGenerate()){toast(missingReason());return}
 if(state.pub.otp&&!state.verified){
  ensureSession().then(function(){
   if(state.verified){generate();return}
   if(studio())openSignin(generate,state.me&&state.me.phone?'login':'signup');else openOtp(generate);
  }).catch(function(e){toast(e.message,'error')});
  return;
 }
 L().busy=true;L().error='';L().result=null;L().genT0=Date.now();L().genBase=baseId();paint();
 ensureSession().then(function(){
  L().idem=L().idem||uuid();
  var o=L(),col=line==='hair'?(state.pub.demo?o.color:''):line==='color'?(o.style===null&&!o.reference&&String(o.color||'').trim().length>=2?o.color.trim():''):o.color;
  // The page's own note under «بساز» says the photo is sent for the simulation; no extra checkbox.
  return api('generate',{apply_color:!!(state.pub.demo&&line==='hair'&&L().color),v:VISITOR,image_consent:true,idem:L().idem,line:line,opts:L().opts,ratio:L().ratio||undefined,original_id:L().original,base_id:line==='color'?(L().genBase||undefined):undefined,reference_id:L().reference||undefined,custom:L().custom&&!L().reference?L().custom:undefined,style:L().reference||L().custom?undefined:(L().style===null?undefined:L().style),color:col||undefined});
 }).then(function(job){
  track('generate',L().reference?(L().refTitle?'salon':'upload'):'catalog');
  spentQuota(line);
  L().gen=job.id;L().genState=job.state;L().step=3;
  try{sessionStorage.setItem('ayneh-job-'+SLUG+'-'+line,job.id)}catch(e){}
  paint();
  return poll(job.id,false,line);
 }).catch(function(e){
  L().busy=false;
  if(needsVerify(e.message)){state.verified=false;L().error='';paint();openOtp(generate);return}
  if(/سهم امتحان/.test(e.message)&&state.quota&&state.quota.left)state.quota.left[line]=0;
  /* Out of free images: offer the customer her own image packs (worker/regularpage.js). */
  if(/سهم امتحان|نمونهٔ رایگانتان تمام شد/.test(e.message)&&!state.pub.demo&&window.AynehPacks)window.AynehPacks.out();
  /* Studio: today's gift images from this internet are used up — every counter says so and the next step is the coin sheet. */
  if(studio()&&/از این اینترنت تمام/.test(e.message)){if(state.quota)state.quota.free=0;if(walletData&&walletData.free)walletData.free.left=0;giftOut=true;L().step=2;L().error='';paint();paintWallet(false);if(walletData)drawWallet(walletData);toast(e.message,'error');openWallet();return}
  if(state.pub.demo&&/ثبت‌نام کنید/.test(e.message))state.demoOut=true;
  /* The salon's images are paused (credits or plan): stop offering «بساز», offer sending. */
  if(/ساخت تصویر در این سالن فعلاً متوقف است/.test(e.message))state.paused=true;
  L().error=friendly(e.message);
  paint();
 });
}
function friendly(msg){
 if(/سقف استفاده/.test(msg))return 'سقف استفادهٔ امروز پر شده است؛ فردا دوباره امتحان کن.';
 if(/فعال نشده/.test(msg))return 'تولید شبیه‌سازی برای این سالن فعال نیست.';
 if(/وضعیت نامشخص/.test(msg))return 'ارسال به سرویس تصویر نامشخص ماند. برای جلوگیری از هزینهٔ دوباره، خودکار تکرار نمی‌شود؛ کمی بعد دوباره سر بزن.';
 if(/درخواست را نپذیرفت/.test(msg))return 'سرویس تصویر درخواست را نپذیرفت. کمی بعد دوباره تلاش کن.';
 return msg;
}
function pickNow(){var pick=$('#pick');if(pick)pick.click();else toast('اول عکس خودت را اضافه کن')}
function updateProgress(){
 var f=$('#flow');if(!f)return;
 var pct=buildPct(),B=BUILD[state.line]||BUILD.hair;
 var bar=f.querySelector('.progress__fill');if(bar)bar.style.width=pct+'%';
 var num=f.querySelector('.build__num');if(num)num.textContent=fa(pct);var note=f.querySelector('.build__note');if(note){var nt=buildNote();if(note.textContent!==nt)note.textContent=nt}
 var at=Math.min(B.steps.length-1,Math.floor(pct/100*B.steps.length));
 Array.prototype.forEach.call(f.querySelectorAll('.build__steps li'),function(li,i){var c=i<at?'is-done':i===at?'is-on':'';if(li.className!==c){li.className=c;li.firstChild.innerHTML=i<at?ICO.check:''}});
}
function poll(id,resumed,line){
 line=line||state.line;var L=function(){return lineRef(line)},paint=function(){if(line===state.line){renderFlow();renderDock()}else if(!accountMode())renderSteps()};
 var attempts=0;
 function tick(){
  attempts++;
  if(line===state.line)updateProgress();
  if(L().gen&&L().gen!==id)return;
  return api('generation/'+id).then(function(d){
   if(L().gen&&L().gen!==id)return;
   L().genState=d.state;
   if(d.state==='success'){
    track('result','',true);
    if(window.__trialLeft)window.__trialLeft();
    L().result=d.result_id;if(line===state.line)L().seen=d.result_id;setTimeout(keepStudio,0);L().resultBase=L().genBase||null;L().busy=false;L().idem=null;state.session=false;loadSession().catch(function(){});
    /* A saved consultant attaches the image she built from its picks — only when the build
       was started from the sheet (fromConsult marker) and is still the same photo she
       analysed. */
    if(consult&&consult.savedId&&consult.line===line&&consult.photo===lineRef(line).original&&lineRef(line).fromConsult===consult.photo)api('consults/'+consult.savedId+'/result',{result_id:d.result_id}).catch(function(){});
    try{sessionStorage.removeItem('ayneh-job-'+SLUG+'-'+line)}catch(e){}
    L().rating=(function(){try{return Number(localStorage.getItem('ayneh-rating-'+d.result_id)||0)}catch(e){return 0}})();
    paint();if(line===state.line)setTimeout(function(){var c=$('#flow .compare');if(c&&c.getBoundingClientRect().bottom>innerHeight){var bar=$('#steps'),off=bar?bar.getBoundingClientRect().height+12:12;scrollTo({top:c.getBoundingClientRect().top+pageYOffset-off,behavior:'smooth'})}},120);
    toast(line===state.line?'شبیه‌سازی آماده شد':LINES.label[line]+' آماده شد؛ در تب خودش ببین');renderSteps();
    return;
   }
   if(d.state==='fail'||d.state==='unknown'){
    track('gen_fail',d.state);
    /* A failed image is refunded on the server: take the real balance back from it. */
    loadSession().catch(function(){});
    L().busy=false;L().error=d.state==='fail'?'سرویس تصویر نتوانست خروجی بسازد. می‌توانی دوباره تلاش کنی.':friendly('وضعیت نامشخص');
    paint();return;
   }
   if(attempts>90){L().busy=false;L().error='هنوز آماده نشده؛ با بازکردن دوبارهٔ صفحه همان درخواست پیگیری می‌شود.';paint();return}
   return sleep(Math.min(4000,1400+attempts*160)).then(tick);
  }).catch(function(){
   if(attempts>8){L().busy=false;L().error='ارتباط با سرور قطع شد؛ بعداً دوباره سر بزن.';paint();return}
   return sleep(2200).then(tick);
  });
 }
 return tick();
}
/* ---------- 360° view: 8 estimated angles played as a drag-to-turn spin ---------- */
/* ---------- 360° view: 8 estimated angles, played like a turntable ---------- */
// Drag (with momentum), tap a thumbnail, use the arrow keys, or let it turn on its own.
// While the angles are being made, the result itself sways in 3D so the wait feels alive.
function openViews(ok){
 if(!state.gen)return;
 if(studio()&&ok!==true&&!state.views){var gift=state.quota&&state.quota.free>0&&!giftOut;var cp=el('div',{class:'sheet__panel'});cp.append(el('div',{class:'sheet__head'},[h('h2','نمای ۳۶۰ درجه'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]),h('p',(gift?'ساخت زاویه‌های دیگر یکی از عکس‌های هدیه‌ات را مصرف می‌کند.':'ساخت زاویه‌های دیگر ۲۵ سکه از کیفت کم می‌کند.')+' زاویه‌ها در همین صفحه نمایش داده می‌شوند؛ اگر می‌خواهی نگهشان داری، از هر زاویه اسکرین‌شات بگیر.','muted'),el('div',{class:'look__actions'},[el('button',{class:'btn btn--primary',type:'button',text:gift?'بساز · هدیه':'بساز · ۲۵ سکه',onclick:function(){closeSheet();setTimeout(function(){openViews(true)},220)}}),el('button',{class:'btn btn--ghost',type:'button',text:'نه، فعلاً',onclick:closeSheet})]));openSheet(cp);return}
 track('view360');
 var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Front = her own result photo (her real face); the other three come from one generated row.
 var ANG=['جلو','نیم‌رخ چپ','پشت سر','نیم‌رخ راست'],N=4;
 var panel=el('div',{class:'sheet__panel spin-panel'});
 panel.append(el('div',{class:'sheet__head'},[h('h2','از همهٔ زاویه‌ها'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]));
 var a=el('div',{class:'spin__layer'}),b=el('div',{class:'spin__layer'});
 var stage=el('div',{class:'spin',tabindex:'0',role:'img','aria-label':'نمای چرخشی مدل مو؛ برای چرخاندن بکش یا از کلیدهای جهت استفاده کن'},[a,b]);
 var tip=el('p',{class:'spin__tip',text:'دارم زاویه‌های دیگر را می‌سازم… بدون نصب، روی گوشی.'}),bar=el('span',{class:'spin__bar'});
 var loading=el('div',{class:'spin__loading'},[el('div',{class:'spin__orbit'},[el('img',{src:media(state.result),alt:''})]),el('span',{class:'spin__ring'}),tip,el('span',{class:'spin__track'},[bar])]);
 stage.append(loading);
 var angle=el('span',{class:'spin__angle',text:''});
 var dial=el('div',{class:'spin__dial','aria-hidden':'true'},[el('span',{class:'spin__dot'})]);
 var thumbs=el('div',{class:'spin__thumbs',role:'group','aria-label':'زاویه‌ها'});
 var play=el('button',{class:'btn btn--ghost btn--sm spin__play',type:'button',text:'⏸ توقف'});
 var controls=el('div',{class:'spin__controls',hidden:true},[el('div',{class:'spin__row'},[dial,angle,play]),thumbs]);
 panel.append(el('div',{class:'mirror spin-wrap'},[stage]),controls,h('p','جلو همان عکس خودت است؛ نیم‌رخ‌ها و پشت سر تخمینی‌اند و اسکن سه‌بعدی نیست.','tiny muted spin__note'));
 openSheet(panel);
 var frame=0,front=a,timer=null,spinTimer=null,tipTimer=null,progTimer=null,src='';
 function paint(layer,n){if(n===0){layer.style.backgroundImage='url('+media(state.result)+')';layer.style.backgroundSize='cover';layer.style.backgroundPosition='50% 30%'}else{layer.style.backgroundImage='url('+src+')';layer.style.backgroundSize='300% 100%';layer.style.backgroundPosition=((n-1)*50)+'% 0'}}
 function show(n,instant){
  frame=(n%N+N)%N;var back=front===a?b:a;paint(back,frame);
  if(instant||reduce){paint(front,frame)}else{back.classList.add('is-on');front.classList.remove('is-on');front=back}
  angle.textContent=ANG[frame];dial.style.setProperty('--r',(frame*90)+'deg');
  Array.prototype.forEach.call(thumbs.children,function(t,i){t.classList.toggle('is-on',i===frame);t.setAttribute('aria-pressed',i===frame?'true':'false')});
 }
 function auto(on){clearInterval(spinTimer);spinTimer=null;play.textContent=on?'⏸ توقف':'▶ چرخش';if(on&&!reduce)spinTimer=setInterval(function(){if(!panel.isConnected){cleanup();return}show(frame+1)},1100)}
 function cleanup(){clearInterval(spinTimer);clearInterval(tipTimer);clearInterval(progTimer);cancelAnimationFrame(timer)}
 play.addEventListener('click',function(){auto(!spinTimer)});
 var drag=null;
 stage.addEventListener('pointerdown',function(e){if(!src)return;auto(false);cancelAnimationFrame(timer);drag={x:e.clientX,f:frame,t:performance.now(),v:0,lx:e.clientX};try{stage.setPointerCapture(e.pointerId)}catch(err){}});
 stage.addEventListener('pointermove',function(e){if(!drag)return;var now=performance.now(),dt=Math.max(1,now-drag.t);drag.v=(drag.lx-e.clientX)/dt;drag.lx=e.clientX;drag.t=now;var f=drag.f+Math.round((drag.x-e.clientX)/56);if(f!==frame)show(f)});
 function release(){if(!drag)return;var v=drag.v;drag=null;if(reduce||Math.abs(v)<0.25)return;var acc=0,last=performance.now();
  (function coast(now){var dt=now-last;last=now;acc+=v*dt/56;v*=Math.pow(0.992,dt);if(Math.abs(acc)>=1){var s=acc>0?1:-1;show(frame+s);acc-=s}if(Math.abs(v)>0.05&&panel.isConnected)timer=requestAnimationFrame(coast)})(last)}
 stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
 stage.addEventListener('keydown',function(e){if(!src)return;if(e.key==='ArrowLeft'){auto(false);show(frame+1)}if(e.key==='ArrowRight'){auto(false);show(frame-1)}if(e.key===' '){e.preventDefault();auto(!spinTimer)}});
 function ready(id){
  src=media(id);
  thumbs.replaceChildren();for(var i=0;i<N;i++)(function(n){var t=el('button',{class:'spin__thumb',type:'button','aria-label':ANG[n]});paint(t,n);t.addEventListener('click',function(){auto(false);show(n)});thumbs.append(t)})(i);
  clearInterval(tipTimer);clearInterval(progTimer);bar.style.width='100%';
  stage.classList.add('is-ready');a.classList.add('is-on');controls.hidden=false;
  setTimeout(function(){loading.remove()},reduce?0:350);
  show(0,true);auto(true);
 }
 var tips=['دارم پشت سرت را می‌سازم…','نیم‌رخ چپ…','نیم‌رخ راست…','هماهنگ‌کردن نور و رنگ مو…','نیم‌رخ‌ها و پشت سر با هم ساخته می‌شوند؛ چند لحظه صبر کن…'],ti=0,started=Date.now();
 tipTimer=setInterval(function(){if(!panel.isConnected){cleanup();return}tip.textContent=tips[ti++%tips.length]},2400);
 progTimer=setInterval(function(){bar.style.width=Math.round(3+92*(1-Math.exp(-(Date.now()-started)/70000)))+'%'},400);
 if(state.views&&state.views.gen===state.gen){ready(state.views.id);return}
 if(quotaLeft('hair')===0){cleanup();tip.textContent='سهم امتحان «مدل مو» برای تو تمام شد؛ نمای ۳۶۰ هم یک تصویر از همین سهم است.';return}
 api('views',{v:VISITOR,parent:state.gen,idem:state.viewsIdem||(state.viewsIdem=uuid())}).then(function(job){
  spentQuota('hair');setTimeout(function(){paintWallet(true)},1500);var tries=0;
  function check(){if(!panel.isConnected)return;return api('generation/'+job.id).then(function(d){
   if(d.state==='success'){state.views={gen:state.gen,id:d.result_id};state.viewsIdem=null;ready(d.result_id);loadSession().catch(function(){});return}
   if(d.state==='fail'||d.state==='unknown'||++tries>90){cleanup();tip.textContent='ساخت زاویه‌ها ممکن نشد؛ کمی بعد دوباره امتحان کن.';state.viewsIdem=null;return}
   return sleep(3000).then(check);
  })}
  return check();
 }).catch(function(e){cleanup();tip.textContent=e.message});
}

/* ---------- demo before/after, shown before we ask for a photo ---------- */
// Uses /catalog/demo-before.webp and demo-after.webp (made by the catalog workflow); if they are
// missing, nothing is shown. The line sweeps by itself; reduced motion keeps it still.
function demoCompare(cls){
 var base='/catalog/'+(state.line==='hair'?'':state.line+'/'),pp=PROOF[state.line]||PROOF.hair,sb=studio()?'/landing/demo-'+pp[0]+'-before.webp':base+'demo-before.webp',sa=studio()?'/landing/demo-'+pp[0]+'-after.webp':base+'demo-after.webp';
 var wrap=el('div',{class:'compare compare--demo'},[el('img',{src:sb,alt:'نمونه: قبل',draggable:'false'}),el('div',{class:'compare__after'},[el('img',{src:sa,alt:'نمونه: بعد',draggable:'false'})]),el('div',{class:'compare__handle'}),el('span',{class:'compare__tag compare__tag--before',text:'قبل'}),el('span',{class:'compare__tag compare__tag--after',text:'بعد'})]);
 var box=el('div',{class:'mirror demo '+(cls||'')},[wrap]),fails=0;
 Array.prototype.forEach.call(wrap.querySelectorAll('img'),function(i){i.addEventListener('error',function(){if(++fails===1)box.remove()})});
 wrap.style.setProperty('--x',studio()?'50%':'62%');
 if(!studio()&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){var t0=performance.now(),seen=false,raf=0;
  function tick(now){if(!box.isConnected)return;wrap.style.setProperty('--x',(50+30*Math.sin((now-t0)/1100))+'%');raf=requestAnimationFrame(tick)}
  var io=window.IntersectionObserver?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){if(!seen){seen=true;track('demo','',true)}cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)}else cancelAnimationFrame(raf)})}):null;
  if(io)setTimeout(function(){io.observe(box)},0);else raf=requestAnimationFrame(tick);
 }
 return box;
}

/* ---------- "your request" card: what the salon did with it ---------- */
var MINE={new:['⏳','فرستاده شد؛ منتظر تماس سالن باش','sent'],called:['📞','سالن گفته با تو تماس گرفته','called'],booked:['🎉','نوبتت هماهنگ شد','booked'],declined:['✋','سالن گفت این مدل در سالن اجرا نمی‌شود','declined']};
function loadMine(){
 var flag=null;try{flag=localStorage.getItem('ayneh-sent-'+SLUG)}catch(e){}
 if(!flag&&!state.sentOnce)return;
 api('requests').then(function(d){renderMine(d)}).catch(function(){});
}
function renderMine(d){
 var box=$('#mine');if(!box)return;var r=(d.requests||[])[0];if(!r){box.hidden=true;return}
 var st=MINE[r.salon_status]||MINE.new,late=r.salon_status==='new'&&Date.now()-r.created_at>86400000;
 var steps=['فرستاده شد','سالن جواب داد','نوبت'],reached=r.salon_status==='booked'?3:(r.salon_status==='new'?1:2);
 var follow=null;try{follow=JSON.parse(localStorage.getItem('ayneh-follow-'+SLUG)||'null')}catch(e){}
 var tel=d.phone?String(d.phone).replace(/^\+98/,'0'):'';
 var actions=el('div',{class:'mine__actions'});
 if((late||r.salon_status==='called')&&tel)actions.append(el('a',{class:'btn btn--primary btn--sm',href:'tel:'+tel,html:ICO.phone+'<span>تماس با سالن</span>'}));
 if(r.salon_status==='declined')actions.append(el('button',{class:'btn btn--soft btn--sm',type:'button',onclick:function(){go(state.original?2:1)},text:'امتحان یک مدل دیگر'}));
 if(!r.followed&&follow&&r.salon_status==='new'){if(follow.telegram)actions.append(el('a',{class:'btn btn--ghost btn--sm',href:follow.telegram,target:'_blank',rel:'noopener',onclick:function(){track('follow','telegram')},text:'خبرم کن در تلگرام'}));if(follow.bale)actions.append(el('a',{class:'btn btn--ghost btn--sm',href:follow.bale,target:'_blank',rel:'noopener',onclick:function(){track('follow','bale')},text:'خبرم کن در بله'}))}
 box.replaceChildren(el('div',{class:'panel mine mine--'+st[2]},[
  el('div',{class:'mine__head'},[el('span',{class:'mine__icon','aria-hidden':'true',text:st[0]}),el('div',{},[h('b',late?'سالن هنوز جواب نداده':st[1]),h('span',(r.look?r.look+'، ':'')+fmt(r.created_at),'mine__meta')])]),
  el('ol',{class:'mine__steps'},steps.map(function(t,i){return el('li',{class:i<reached?'is-on':''},[el('span',{}),el('b',{text:t})])})),
  late?h('p','معمولاً سالن‌ها در یکی دو روز تماس می‌گیرند. اگر عجله داری، مستقیم زنگ بزن.','mine__note'):null,
  actions.childNodes.length?actions:null
 ]));
 box.hidden=false;
}

/* ---------- first-visit tour: welcome card, then a spotlight that glides between parts ---------- */
var TOUR_KEY='ayneh-tour-v2';
function pageGo(n){go(n)}
// The tour opens one service (hair colour) and walks through the three ways of choosing, then puts
// the page back exactly as it was.
function tourView(line,step,tab,style){
 var d=lineDefaults(line);Object.assign(state,d,{line:line,step:step,tab:tab||d.tab,filter:'همه',original:null,preview:null,style:style===undefined?null:style,tourDemo:true});
 document.body.setAttribute('data-line',line);renderAll();
}
function tourSteps(){
 var mobile=window.matchMedia('(max-width:959px)').matches;
 var L=function(){return state.line};
 return [
  {el:'.linesw',title:'چهار بخش، یک عکس',text:'«مدل مو»: کوتاهی و فرم جدید. «رنگ مو»: فقط رنگ عوض می‌شود. «ناخن»: طرح، فرم و رنگ ناخن روی عکس دستت. «مژه»: مدل کاشت مژه. هر وقت خواستی بین‌شان جابه‌جا شو؛ چیزی پاک نمی‌شود.'},
  {el:'.linesw [data-line="color"]',enter:function(){tourView('color',2,'salon')},title:'مثلاً «رنگ مو» را باز کنیم',text:'هر بخش سه راه برای انتخاب دارد. بیا با هم ببینیم.'},
  {el:'#flow .seg',enter:function(){tourView('color',2,'salon')},title:'سه راه انتخاب',text:'«کارهای سالن»، «'+TAB_LABEL.color[1]+'» و «'+TAB_LABEL.color[2]+'». هر کدام را بزنی، پایینش عوض می‌شود.'},
  {el:'#flow .seg [data-tab="salon"]',enter:function(){tourView('color',2,'salon')},title:'۱. کارهای همین سالن',text:hasLineWork('color')?'کارهای واقعی «'+state.pub.salon.name+'». روی هر کار بزن تا همان روی عکس خودت ساخته شود.':'کارهای واقعی سالن اینجا می‌آید. روی هر کار بزنی، همان روی عکس خودت ساخته می‌شود.'},
  {el:'#flow .looks .style-card',enter:function(){tourView('color',2,'catalog')},title:'۲. مدل‌های آماده',text:'رنگ‌ها و مدل‌های پرطرفدار امسال با عکس نمونه. با فیلترهای بالا سریع پیدا کن و یکی را بزن.'},
  {el:'#flow .upload--ref',enter:function(){tourView('color',2,'upload')},title:'۳. عکس مدلی که خودت داری',text:'عکسی از اینستاگرام یا گالری‌ات داری؟ اینجا بگذار. فقط رنگ یا مدلش برداشته می‌شود؛ صورت آن آدم نه.'},
  {el:'#flow .btn--build',enter:function(){tourView('color',2,'catalog',4)},title:'انتخاب کردی؟ «بساز»',text:'با یک دکمه ساخت شروع می‌شود و نتیجه را کنار عکس خودت می‌بینی. بعدش با یک دکمه برای '+'سالن می‌فرستی.'},
  {el:'#steps .steps__list',title:'همیشه می‌دانی کجایی',text:'عکس تو، انتخاب، نتیجه. روی هر قدم بزنی برمی‌گردی.'},
  {el:'.about-btn',title:'همه‌چیز دربارهٔ سالن',text:'آدرس، شماره، ساعت کاری و صفحه‌های سالن اینجاست.'},
  {el:mobile?'#dock .dock__inner':'.hero__cta .btn',title:'شروع کنیم؟',text:'اول عکس خودت را بگذار. بعد از دیدن نتیجه، با یک دکمه برای سالن فرستاده می‌شود و خود سالن با تو تماس می‌گیرد.',last:true}
 ].filter(Boolean);
}
function maybeTour(){if(SLUG==='demo'&&/[?&]draft=1/.test(location.search))return;/* inside /studio the page around explains the steps; a tour over a frame only confuses */if(state.pub&&state.pub.direct)return;try{if(localStorage.getItem(TOUR_KEY))return}catch(e){return}if(state.busy)return;setTimeout(startTour,700)}
function startTour(){
 if($('.tour'))return;
 var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 track('tour_start');
 var root=el('div',{class:'tour'+(reduce?' tour--still':''),role:'dialog','aria-modal':'true','aria-labelledby':'tour-title'});
 var spot=el('div',{class:'tour__spot','aria-hidden':'true'});
 var card=el('div',{class:'tour__card',tabindex:'-1'});
 root.append(spot,card);document.body.append(root);document.body.classList.add('is-touring');
 var steps=[],i=-1,lastFocus=document.activeElement;
 // Everything the tour changes, to put back when it ends.
 var saved={line:state.line,data:lineData(state.line),store:Object.assign({},lineStore),y:window.pageYOffset},changed=false;
 function restore(){state.tourDemo=false;if(!changed)return;lineStore=saved.store;Object.assign(state,saved.data);state.line=saved.line;document.body.setAttribute('data-line',saved.line);renderAll()}
 function done(how){track(how==='done'?'tour_done':'tour_skip');try{localStorage.setItem(TOUR_KEY,'1')}catch(e){}window.removeEventListener('resize',place);window.removeEventListener('keydown',keys);restore();root.classList.add('is-leaving');setTimeout(function(){root.remove();document.body.classList.remove('is-touring')},reduce?0:220);if(how==='done'){pageGo(state.original?2:1)}else if(changed)window.scrollTo({top:0});if(lastFocus&&lastFocus.focus)lastFocus.focus()}
 function keys(e){if(e.key==='Escape')done();else if(i>=0&&(e.key==='ArrowLeft'))go(i+1);else if(i>0&&e.key==='ArrowRight')go(i-1)}
 window.addEventListener('keydown',keys);
 function welcome(){
  root.classList.add('tour--welcome');
  card.replaceChildren(
   demoCompare('tour__demo')||null,
   el('h2',{id:'tour-title',class:'tour__title',text:'به آینه خوش آمدی'}),
   el('p',{class:'tour__text',text:'قبل از اینکه روی صندلی «'+state.pub.salon.name+'» بنشینی، '+offerText(1)+' بعدی‌ات را روی عکس خودت ببین. همین حالا نشانت می‌دهم چطور.'}),
   el('ol',{class:'tour__path'},[
    el('li',{},[el('span',{html:ICO.camera}),el('b',{text:'عکس تو'})]),
    el('li',{},[el('span',{html:ICO.scissors}),el('b',{text:'انتخاب'})]),
    el('li',{},[el('span',{html:ICO.spark}),el('b',{text:'بساز و بفرست'})])
   ]),
   el('div',{class:'tour__actions'},[
    el('button',{class:'btn btn--primary btn--block',type:'button',text:'نشانم بده',onclick:function(){root.classList.remove('tour--welcome');steps=tourSteps();go(0)}}),
    el('button',{class:'btn btn--ghost btn--block tour__skip',type:'button',text:'بلدم، شروع کنیم',onclick:done})
   ])
  );
  card.focus();
 }
 function go(n){
  if(n>=steps.length){done();return}
  var prev=i;i=n;var s=steps[i];
  if(s.enter){s.enter();changed=true}else if(changed){restore();changed=false}
  var target=$(s.el);if(!target){if(n<prev&&n>0)go(n-1);else go(n+1);return}
  target.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'});
  var dots=el('div',{class:'tour__dots','aria-label':'قدم '+fa(i+1)+' از '+fa(steps.length)},steps.map(function(_,k){return el('span',{class:k===i?'is-on':k<i?'is-done':''})}));
  card.replaceChildren(
   el('div',{class:'tour__top'},[dots,el('button',{class:'tour__x',type:'button','aria-label':'بستن راهنما',text:'×',onclick:done})]),
   el('h2',{id:'tour-title',class:'tour__title',text:s.title}),
   el('p',{class:'tour__text',text:s.text}),
   el('div',{class:'tour__nav'},[
    i>0?el('button',{class:'btn btn--ghost btn--sm',type:'button',text:'قبلی',onclick:function(){go(i-1)}}):el('button',{class:'btn btn--ghost btn--sm',type:'button',text:'رد شو',onclick:done}),
    el('span',{class:'tour__count',text:fa(i+1)+' از '+fa(steps.length)}),
    el('button',{class:'btn btn--primary btn--sm',type:'button',text:s.last?'شروع کنیم':'بعدی',onclick:function(){if(s.last)done('done');else go(i+1)}})
   ])
  );
  setTimeout(place,reduce?0:320);place();card.focus({preventScroll:true});
 }
 function place(){
  if(i<0)return;var t=$(steps[i].el);if(!t)return;var r=t.getBoundingClientRect(),pad=8,vw=window.innerWidth,vh=window.innerHeight;
  var x=Math.max(6,r.left-pad),y=Math.max(6,r.top-pad),w=Math.min(vw-12,r.width+pad*2),hgt=Math.min(vh-12,r.height+pad*2);
  spot.style.transform='translate('+x+'px,'+y+'px)';spot.style.width=w+'px';spot.style.height=hgt+'px';
  var cw=Math.min(360,vw-24),ch=card.offsetHeight||200,below=y+hgt+12,above=y-12-ch;
  var top=below+ch<vh-8?below:(above>8?above:Math.max(8,vh-ch-8));
  var left=Math.min(Math.max(12,x+w/2-cw/2),vw-cw-12);
  card.style.width=cw+'px';card.style.transform='translate('+left+'px,'+top+'px)';
 }
 window.addEventListener('resize',place);
 window.addEventListener('scroll',function(){if(document.body.contains(root))place()},{passive:true});
 welcome();
}

/* ---------- session ---------- */
function ensureSession(){
 if(state.session)return Promise.resolve();
 return loadSession().catch(function(){
  state.verified=false;
  return api('session',{}).then(function(){return loadSession().catch(function(){state.session=true})});
 });
}
// The session also says how many images this person has left in each service.
function loadSession(){return api('session?v='+VISITOR).then(function(d){state.session=true;applyVerified(d);if(studio()){loadLooks();if(state.verified&&!savesAt)loadSaves(true).then(function(){if(accountMode())return;drawTrend();if(state.step===2)renderFlow()})}if(d.quota){state.quota=d.quota;renderDockSoon();paintWallet(true);var f=$('#flow');if(f&&state.step===2&&!state.busy)renderFlow()}})}
function quotaLeft(line){return state.quota&&state.quota.left?state.quota.left[line||state.line]:null}
function spentQuota(line){if(state.quota&&state.quota.left&&state.quota.left[line]>0)state.quota.left[line]--;if(state.quota&&state.quota.free>0)state.quota.free--;paintWallet(true)}
window.addEventListener('ayneh:credited',function(){state.paused=false;loadSession().catch(function(){})});
function quotaOut(){
 /* The direct page (/try) has 3 free images in all, not per service, and no salon to send to. */
 if(state.quota&&state.quota.free!==undefined)return 'عکس‌های هدیه‌ات تموم شد. برای عکس بیشتر کیف سکه‌ات رو شارژ کن؛ هر عکس ۲۵ سکه است.';
 var others=LINE_LIST.filter(function(x){return x[0]!==state.line&&quotaLeft(x[0])!==0}).map(function(x){return '«'+x[1]+'»'});
 return 'سهم امتحان «'+LINES.label[state.line]+'» برای تو تمام شد ('+fa(state.quota.per)+' تصویر). '+(others.length?'هنوز می‌توانی '+others.join('، ')+' را امتحان کنی، یا همین نتیجه‌ها را برای سالن بفرستی.':'سهم امتحان همهٔ بخش‌ها تمام شده؛ می‌توانی همین نتیجه‌ها را برای سالن بفرستی تا با تو تماس بگیرند.');
}

/* ---------- phone verification (SMS code) ---------- */
function applyVerified(d){
 if(!d||!d.verified)return;
 state.verified=true;
 state.me=Object.assign({},state.me||{},{name:d.name||'',phone:d.phone?'0'+String(d.phone).replace(/^\+98/,''):''});
 /* The studio header was drawn before the session answered: show her name now. */
 var chip=document.querySelector('.head--studio .acct-chip');if(chip&&!accountMode())chip.replaceWith(accountChip());
}
function needsVerify(msg){return /را تأیید کن/.test(String(msg||''))}
function openOtp(next){
 var timer=null;
 function shut(){clearInterval(timer);closeSheet()}
 var panel=el('div',{class:'sheet__panel'});
 var head=el('div',{class:'sheet__head'},[h('h2','اول شماره‌ات را تأیید کن'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:shut})]);
 var me=state.me||{},bits=String(me.name||'').trim().split(/\s+/);
 var firstWrap=wrapField('otpFirst','نام','text',bits[0]||'','',{autocomplete:'given-name'});
 var lastWrap=wrapField('otpLast','نام خانوادگی','text',bits.slice(1).join(' '),'',{autocomplete:'family-name'});
 var phoneWrap=wrapField('otpPhone','شمارهٔ موبایل','tel',me.phone||'','۰۹۱۲۱۲۳۴۵۶۷',{inputmode:'tel',autocomplete:'tel'});
 var sendBtn=el('button',{class:'btn btn--primary btn--block',type:'submit',text:'ارسال کد تأیید'});
 var form=el('form',{novalidate:'true'},state.pub.demo?[phoneWrap,sendBtn]:[firstWrap,lastWrap,phoneWrap,sendBtn]);
 var last=null;
 panel.append(head,h('p','برای ساخت شبیه‌سازی، اول شمارهٔ موبایلت را تأیید می‌کنیم. یک کد پیامکی برایت می‌فرستیم. نام و شماره‌ات فقط برای همین سالن و پیگیری درخواستت استفاده می‌شود و در سابقهٔ سالن می‌ماند.','muted'),form);
 function codeStep(){
  var codeWrap=wrapField('otpCode','کد پیامک‌شده','text','','',{autocomplete:'one-time-code',inputmode:'numeric'});
  codeWrap.querySelector('input').setAttribute('dir','ltr');
  var verify=el('button',{class:'btn btn--primary btn--block',type:'submit',text:'تأیید'});
  var again=el('button',{class:'btn btn--ghost btn--block',type:'button',disabled:true,text:''});
  var f2=el('form',{novalidate:'true'},[codeWrap,verify,again]);
  panel.replaceChildren(head,h('p','کد به '+fa0(last.shown)+' پیامک شد. تا چند لحظهٔ دیگر می‌رسد.','muted'),f2);
  var left=60;
  function tickDown(){
   if(!panel.isConnected){clearInterval(timer);return}
   again.disabled=left>0;again.textContent=left>0?'ارسال دوبارهٔ کد تا '+fa(left)+' ثانیه دیگر':'ارسال دوبارهٔ کد';
   if(left>0)left--;
  }
  clearInterval(timer);tickDown();timer=setInterval(tickDown,1000);
  setTimeout(function(){var i=codeWrap.querySelector('input');if(i)i.focus()},50);
  again.addEventListener('click',function(){
   again.disabled=true;
   api('otp/send',last.body).then(function(){left=60;toast('کد تازه فرستاده شد')}).catch(function(err){toast(err.message,'error')});
  });
  f2.addEventListener('submit',function(e){
   e.preventDefault();
   var code=codeWrap.querySelector('input').value.trim();
   var ok=validate(codeWrap,function(){return /^[0-9۰-۹٠-٩]{3,12}$/.test(code)},'کد را همان‌طور که پیامک شده بنویس');
   if(!ok)return;
   verify.disabled=true;verify.textContent='در حال بررسی…';
   api('otp/verify',{code:code}).then(function(d){
    state.verified=true;
    state.me=Object.assign({},state.me||{},{name:d.name,phone:'0'+String(d.phone).replace(/^\+98/,'')});
    try{localStorage.setItem('ayneh-me',JSON.stringify(state.me))}catch(err){}
    shut();toast('شماره‌ات تأیید شد');
    if(next)next();
   }).catch(function(err){verify.disabled=false;verify.textContent='تأیید';toast(err.message,'error')});
  });
 }
 form.addEventListener('submit',function(e){
  e.preventDefault();
  var first=state.pub.demo?'مشتری':firstWrap.querySelector('input').value.trim(),lastName=state.pub.demo?'آینه':lastWrap.querySelector('input').value.trim();
  var okFirst=validate(firstWrap,function(){return first.length>=2},'نام را بنویس');
  var okLast=validate(lastWrap,function(){return lastName.length>=2},'نام خانوادگی را بنویس');
  var num=normalizePhone(phoneWrap.querySelector('input').value);
  var okPhone=validate(phoneWrap,function(){return /^\+989\d{9}$/.test(num)},'شمارهٔ موبایل درست نیست؛ مثل ۰۹۱۲۱۲۳۴۵۶۷');
  if(!okFirst||!okLast||!okPhone)return;
  sendBtn.disabled=true;sendBtn.textContent='در حال فرستادن…';
  ensureSession().then(function(){
   var body={first_name:first,last_name:lastName,phone:num};
   return api('otp/send',body).then(function(){last={body:body,shown:'0'+num.slice(3)};codeStep()});
  }).catch(function(err){sendBtn.disabled=false;sendBtn.textContent='ارسال کد تأیید';toast(err.message,'error')});
 });
 openSheet(panel);
}

/* ---------- send to the salon (Telegram) ---------- */
function openRequest(){
 track('send_open');
 if(!state.original){toast('اول عکس خودت را اضافه کن');go(1);return}
 var s=state.pub.salon,p=s.profile||{};
 var panel=el('div',{class:'sheet__panel'});
 panel.append(el('div',{class:'sheet__head'},[h('h2','فرستادن برای '+artist()),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]));
 if(!state.pub.telegram){
  panel.append(notice('info',state.pub.direct?'این صفحه به سالن خاصی وصل نیست. نتیجه را دانلود کن و به آرایشگر خودت نشان بده.':state.pub.demo?'سالن آینه برای نمایش است و درخواست نوبت دریافت نمی‌کند. نتیجه را دانلود کن. برای اینکه مشتری‌های خودت به سالن خودت درخواست بفرستند، پیش‌نمایش سالن خودت را بساز.':'«'+s.name+'» هنوز دریافت آنلاین را فعال نکرده. عکس نتیجه را دانلود کن و از یکی از این راه‌ها برای سالن بفرست.'));
  if(state.pub.demo)panel.append(el('a',{class:'btn btn--primary',href:'/?utm_source=ayneh_demo&utm_medium=demo_return&utm_campaign=owner_preview#salon-example',style:'margin-top:12px',text:'ساخت صفحهٔ من'}));
  var ways=el('div',{class:'about__quick',style:'margin-top:14px'});
  if(p.phone)ways.append(el('a',{class:'btn btn--primary',href:'tel:'+p.phone,html:ICO.phone+'<span>تماس با سالن</span>'}));
  if(p.telegram)ways.append(el('a',{class:'btn btn--ghost',href:p.telegram,target:'_blank',rel:'noopener noreferrer',html:ICO.send+'<span>تلگرام سالن</span>'}));
  if(p.instagram)ways.append(el('a',{class:'btn btn--ghost',href:p.instagram,target:'_blank',rel:'noopener noreferrer',html:ICO.instagram+'<span>اینستاگرام</span>'}));
  if(state.result)ways.append(downloadLink('btn btn--ghost','دانلود'));
  panel.append(ways);openSheet(panel);return;
 }
 // What goes, and where: said plainly before anything is typed.
 var thumbs=el('div',{class:'outbox__thumbs'},[
  el('img',{src:media(state.original),alt:'عکس تو'}),
  state.result?el('img',{src:media(state.result),alt:'نتیجه'}):null,
  state.reference&&!state.refTitle?el('img',{src:media(state.reference),alt:'عکس مدل'}):null
 ]);
 panel.append(el('div',{class:'outbox'},[thumbs,el('div',{},[
  h('b','برای «'+s.name+'» فرستاده می‌شود'),
  h('p',[state.result?'عکس خودت و نتیجهٔ شبیه‌سازی':'عکس خودت',lookName()?'انتخاب: '+lookName():'',(state.line==='nails'||state.line==='lashes')&&state.color?'رنگ: '+state.color:''].filter(Boolean).join('، ')+'، به همراه نام، شماره و توضیحت.')
 ])]));
 panel.append(el('ol',{class:'how'},[
  el('li',{text:'درخواستت همین الان به دست سالن می‌رسد.'}),
  el('li',{text:artist()+' عکس‌ها را می‌بیند و امکان اجرا را بررسی می‌کند.'}),
  el('li',{text:'خود سالن به شماره‌ات زنگ می‌زند؛ اگر آیدی تلگرام بدهی، شاید همان‌جا پیام بدهد.'})
 ]));
 var form=el('form',{novalidate:'true'});
 var nameWrap=wrapField('name','نام و نام خانوادگی','text',state.me&&state.me.name||'','',{autocomplete:'name'});
 var phoneWrap=wrapField('phone','شمارهٔ موبایل','tel',state.me&&state.me.phone||'','۰۹۱۲۱۲۳۴۵۶۷',{inputmode:'tel',autocomplete:'tel'});
 var tgWrap=wrapField('tgid','آیدی تلگرام (اختیاری)','text',state.me&&state.me.telegram||'','@username',{autocomplete:'off'});
 tgWrap.querySelector('input').setAttribute('dir','ltr');
 if(state.verified){nameWrap.querySelector('input').readOnly=true;phoneWrap.querySelector('input').readOnly=true}
 var note=el('textarea',{id:'rnote',maxlength:'1000',placeholder:'مثلاً سابقهٔ رنگ یا حنا، حساسیت پوستی، یا هر چیزی که آرایشگر باید بداند'});
 var submit=el('button',{class:'btn btn--primary btn--block',type:'submit',html:ICO.send+'<span>فرستادن</span>'});
 form.append(nameWrap,phoneWrap,tgWrap,el('label',{class:'field'},[el('span',{class:'lbl',text:'توضیح برای آرایشگر (اختیاری)'}),note]),
  submit,h('p','با فرستادن، عکس‌ها، اسم و شماره‌ات فقط برای همین سالن فرستاده می‌شود و در سابقهٔ سالن می‌ماند.','fine-print'));
 form.addEventListener('submit',function(e){
  e.preventDefault();
  var okName=validate(nameWrap,function(){return nameWrap.querySelector('input').value.trim().length>=3},'نام و نام خانوادگی‌ات را بنویس');
  var phoneVal=normalizePhone(phoneWrap.querySelector('input').value);
  var okPhone=validate(phoneWrap,function(){return /^\+989\d{9}$/.test(phoneVal)},'شمارهٔ موبایل درست نیست؛ مثل ۰۹۱۲۱۲۳۴۵۶۷');
  var tg=tgWrap.querySelector('input').value.trim().replace(/^@/,'').replace(/^https?:\/\/t\.me\//,'');
  var okTg=validate(tgWrap,function(){return !tg||/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tg)},'آیدی تلگرام فقط حروف انگلیسی، عدد و _ است');
  if(!okName||!okPhone||!okTg)return;
  submit.disabled=true;submit.textContent='در حال فرستادن…';
  state.me={name:nameWrap.querySelector('input').value.trim(),phone:phoneWrap.querySelector('input').value.trim(),telegram:tg};
  try{localStorage.setItem('ayneh-me',JSON.stringify(state.me))}catch(err){}
  ensureSession().then(function(){
   state.sendIdem=state.sendIdem||uuid();
   return api('leads',{data_consent:true,idem:state.sendIdem,name:state.me.name,phone:phoneVal,telegram:tg,note:note.value,original_id:state.original,reference_id:state.reference||undefined,preview_id:state.result||undefined,look:lookName(),color:colorLabel(),line:state.line,v:VISITOR});
  }).then(function(d){
   state.sendIdem=null;
   var follow=d.follow||{},fl=[];state.sentOnce=true;try{localStorage.setItem('ayneh-sent-'+SLUG,'1');localStorage.setItem('ayneh-follow-'+SLUG,JSON.stringify(follow))}catch(err){}
   if(follow.telegram)fl.push(el('a',{class:'btn btn--primary btn--block',href:follow.telegram,target:'_blank',rel:'noopener',onclick:function(){track('follow','telegram')},html:ICO.send+'<span>خبرم کن در تلگرام</span>'}));
   if(follow.bale)fl.push(el('a',{class:'btn btn--soft btn--block',href:follow.bale,target:'_blank',rel:'noopener',onclick:function(){track('follow','bale')},html:ICO.send+'<span>خبرم کن در بله</span>'}));
   setTimeout(loadMine,600);
   panel.replaceChildren(el('div',{class:'sent'},[
    el('span',{class:'sent__mark',html:ICO.check}),
    h('h2',d.delivered?'برای سالن فرستاده شد':d.waiting?'درخواستت ثبت شد':'در صف ارسال است'),
    h('p',d.delivered?'«'+s.name+'» عکس و مدلت را دریافت کرد. منتظر تماس سالن'+(tg?' یا پیامش در تلگرام':'')+' باش.':(d.waiting?'درخواستت ذخیره شد و به‌زودی به دست آرایشگرت در «'+s.name+'» می‌رسد. منتظر تماسش باش.':'تلگرام الان جواب نداد؛ درخواستت ذخیره شد و چند دقیقهٔ دیگر خودکار برای سالن فرستاده می‌شود.')),
    fl.length?el('div',{class:'sent__follow'},[h('p','می‌خواهی وقتی سالن جواب داد خبردار شوی؟ یک بار ربات را باز کن و Start بزن.','sent__hint')].concat(fl)):null,
    el('button',{class:fl.length?'btn btn--ghost btn--block':'btn btn--primary btn--block',type:'button',onclick:closeSheet,text:fl.length?'نه، ممنون':'باشه'})
   ]));
  }).catch(function(err){submit.disabled=false;submit.innerHTML=ICO.send+'<span>فرستادن</span>';if(needsVerify(err.message)){state.verified=false;openOtp(openRequest);return}toast(err.message,'error')});
 });
 panel.append(form);
 openSheet(panel);
}

function wrapField(id,label,type,value,placeholder,extra){
 var input=el('input',{id:id,type:type,value:value||'',placeholder:placeholder||'',autocomplete:extra&&extra.autocomplete||'off',inputmode:extra&&extra.inputmode||null,maxlength:id==='tgid'?'40':id==='phone'?'20':'100'});
 var err=el('span',{class:'err',text:''});
 return el('label',{class:'field','data-invalid':'false'},[el('span',{class:'lbl',text:label}),input,err]);
}
function validate(wrap,test,msg){
 var ok=test();
 wrap.setAttribute('data-invalid',ok?'false':'true');
 var e=wrap.querySelector('.err');if(e)e.textContent=ok?'':msg;
 return ok;
}
function normalizePhone(v){
 var s=String(v||'').replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)}).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).replace(/[\s()+-]/g,'');
 if(/^09\d{9}$/.test(s))return '+98'+s.slice(1);
 if(/^9\d{9}$/.test(s))return '+98'+s;
 if(/^00989\d{9}$/.test(s))return '+98'+s.slice(4);
 if(/^989\d{9}$/.test(s))return '+'+s;
 return s;
}

/* ---------- invite friends: banner at the bottom + share sheet ---------- */
// Shares the salon page itself with this visitor's own tag (?r=<tag>), so whoever opens it joins the
// same referral tree; the dashboard also counts visits that came from a shared link.
var SHARE_IC={
 share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.4M8.3 13.2l7.4 4.4"/></svg>',
 plane:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.4 3.6 2.9 10.8c-.9.4-.9 1.6.1 1.9l4.6 1.5 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.5c.7.5 1.6.1 1.8-.7l3-15.2c.2-1-.8-1.8-1.9-1.4zM9.6 14.2l8.2-7.3-6.5 8.4-.3 3.1z"/></svg>',
 chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9.2 9.3c.3 2.4 2.2 4.3 4.6 4.8l1-1.1 1.7.8-.4 1.6c-3.6.3-7.2-3.3-6.9-6.9l1.6-.4.8 1.7z" fill="currentColor" stroke="none"/></svg>',
 sms:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"/></svg>',
 cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.3 6.7h.01"/></svg>',
 link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
 more:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>'
};
function shareUrl(){if(STUDIO_PREVIEW)return 'https://ayneh-salon.site/s/'+state.pub.salon.slug;if(studio())return location.origin+'/'+(state.tag?'?r='+state.tag:'');return location.origin+'/s/'+SLUG+(state.tag?'?r='+state.tag:'')}
function shareText(){if(studio())return 'این رو ببین! توی «آینه» می‌تونی مدل مو، رنگ، ناخن و مژهٔ جدید رو روی عکس خودت ببینی؛ ۲ عکس اولش هدیه‌ست 👇';return 'این رو ببین! توی صفحهٔ «'+state.pub.salon.name+'» می‌تونی '+offerText(1)+' جدید رو روی عکس خودت امتحان کنی؛ رایگان و بدون نصب 👇'}
function renderInvite(){
 var box=$('#invite');if(!box||!state.pub)return;
 if(accountMode()){box.hidden=true;return}
 var pics=el('span',{class:'invite__pics','aria-hidden':'true'});
 ['03','09','15'].forEach(function(n){var i=el('img',{src:'/catalog/'+(state.line==='hair'?'':state.line+'/')+n+'.webp',alt:'',decoding:'async'});i.addEventListener('error',function(){i.replaceWith(el('span'))});pics.append(i)});
 var b=el('button',{class:'invite',type:'button',onclick:function(){track('share_open');openShare()}},[
  pics,
  el('span',{class:'invite__txt'},[
   h('b','دوستانت هم مدل بعدی‌شان را ببینند'),
   h('span',studio()?'لینک آینه را برایشان بفرست؛ ۲ عکس اول برای آن‌ها هم هدیه است و بدون نصب روی عکس خودشان امتحان می‌کنند.':'لینک صفحهٔ «'+state.pub.salon.name+'» را برایشان بفرست؛ رایگان و بدون نصب، روی عکس خودشان امتحان می‌کنند.'),
   el('span',{class:'invite__cta',html:SHARE_IC.share+'<span>فرستادن برای دوستان</span>'})
  ])
 ]);
 box.replaceChildren(b);box.hidden=false;
}
function copyText(t){
 if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(t);
 return new Promise(function(ok,no){var ta=el('textarea',{style:'position:fixed;opacity:0'});ta.value=t;document.body.append(ta);ta.select();try{document.execCommand('copy')?ok():no()}catch(e){no(e)}ta.remove()});
}
function openShare(){
 var url=shareUrl(),text=shareText(),both=text+'\n'+url,s=state.pub.salon,logo=state.pub.salon.profile&&state.pub.salon.profile.logo;
 var panel=el('div',{class:'sheet__panel'});
 panel.append(el('div',{class:'sheet__head'},[h('h2','برای کی بفرستیم؟'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]));
 panel.append(el('div',{class:'share__prev'},[logo?el('img',{src:media(logo),alt:''}):el('span',{class:'share__logo',text:String(s.name||'آ').trim().charAt(0)}),el('div',{},[h('b',s.name),h('span',url.replace(/^https?:\/\//,''))])]));
 function done(kind,msg){track('share',kind);if(msg)toast(msg)}
 function opt(kind,label,ic,bg,href,onclick){
  var a=href?el('a',{class:'share__opt',href:href,target:'_blank',rel:'noopener',onclick:function(){done(kind)}}):el('button',{class:'share__opt',type:'button',onclick:onclick});
  a.append(el('span',{class:'share__ic',style:'background:'+bg,html:ic}),el('span',{text:label}));return a;
 }
 var grid=el('div',{class:'share__grid'},[
  opt('telegram','تلگرام',SHARE_IC.plane,'#2a9fd8','https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text)),
  opt('whatsapp','واتساپ',SHARE_IC.chat,'#25a85a','https://wa.me/?text='+encodeURIComponent(both)),
  opt('sms','پیامک',SHARE_IC.sms,'#6a7a75','sms:?&body='+encodeURIComponent(both)),
  opt('instagram','اینستاگرام',SHARE_IC.cam,'linear-gradient(45deg,#f2a93b,#d6286f 55%,#7b3bc4)',null,function(){copyText(url).then(function(){done('instagram','لینک کپی شد؛ در دایرکت یا استوری اینستاگرام بگذار')},function(){toast(url)})}),
  opt('copy','کپی لینک',SHARE_IC.link,'var(--accent)',null,function(){copyText(both).then(function(){done('copy','متن و لینک کپی شد')},function(){toast(url)})}),
  navigator.share?opt('native','بله، ایتا و…',SHARE_IC.more,'#2f3b38',null,function(){navigator.share({title:s.name,text:text,url:url}).then(function(){done('native')},function(){})}):null
 ]);
 panel.append(grid,h('p','دوستت لینک را باز می‌کند و '+offerText()+' را روی عکس خودش امتحان می‌کند. فقط لینک صفحه فرستاده می‌شود، نه عکس تو.','share__note'));
 openSheet(panel);
}

// «از دوستم نظر بپرسم»: the result image, a ready question and the link of this same salon/member
// (the visitor's own tag keeps whoever opens it with the same member). Nothing leaves the phone until
// the customer taps one of the options; the image goes only through the phone's own share sheet.
var ASK_TEXT='کدوم مدل بیشتر بهم میاد؟';
function openAsk(){
 if(!state.result)return;
 track('share_open','ask');
 var url=shareUrl(),both=ASK_TEXT+'\n'+url,s=state.pub.salon,id=state.result,panel=el('div',{class:'sheet__panel'});
 panel.append(el('div',{class:'sheet__head'},[h('h2','از دوستت نظر بپرس'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]));
 panel.append(el('div',{class:'share__prev'},[el('img',{src:media(id),alt:''}),el('div',{},[h('b',ASK_TEXT),h('span',url.replace(/^https?:\/\//,''))])]));
 function done(kind,msg){track('share','ask_'+kind);if(msg)toast(msg)}
 function opt(kind,label,ic,bg,href,onclick){
  var a=href?el('a',{class:'share__opt',href:href,target:'_blank',rel:'noopener',onclick:function(){done(kind)}}):el('button',{class:'share__opt',type:'button',onclick:onclick});
  a.append(el('span',{class:'share__ic',style:'background:'+bg,html:ic}),el('span',{text:label}));return a;
 }
 function shareImage(){
  prepareBranded(id).then(function(rec){
   var file=rec&&rec.file;
   if(file&&navigator.canShare&&navigator.canShare({files:[file]}))return navigator.share({files:[file],text:both}).then(function(){done('image')},function(){});
   return copyText(both).then(function(){done('copy','متن و لینک کپی شد؛ عکس را با «'+(studio()?'دانلود عکس':'ذخیره تصویر')+'» جدا بفرست')},function(){toast(url)});
  });
 }
 var grid=el('div',{class:'share__grid'},[
  navigator.share?opt('image','عکس و پیام',SHARE_IC.more,'#2f3b38',null,shareImage):null,
  opt('telegram','تلگرام',SHARE_IC.plane,'#2a9fd8','https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(ASK_TEXT)),
  opt('whatsapp','واتساپ',SHARE_IC.chat,'#25a85a','https://wa.me/?text='+encodeURIComponent(both)),
  opt('instagram','اینستاگرام',SHARE_IC.cam,'linear-gradient(45deg,#f2a93b,#d6286f 55%,#7b3bc4)',null,function(){copyText(both).then(function(){done('instagram','پیام و لینک کپی شد؛ در دایرکت اینستاگرام بگذار')},function(){toast(url)})}),
  opt('copy','کپی لینک',SHARE_IC.link,'var(--accent)',null,function(){copyText(both).then(function(){done('copy','پیام و لینک کپی شد')},function(){toast(url)})})
 ].filter(Boolean));
 panel.append(grid,h('p',navigator.share?'«عکس و پیام» عکس نتیجه را با شیت اشتراک گوشی‌ات می‌فرستد؛ بقیهٔ دکمه‌ها فقط پیام و لینک را می‌فرستند.':'این دکمه‌ها پیام و لینک را می‌فرستند؛ خود عکس را با «'+(studio()?'دانلود عکس':'ذخیره تصویر')+'» بگیر و جدا بفرست. هیچ چیز خودکار فرستاده نمی‌شود.','share__note'));
 openSheet(panel);
}

/* ---------- consultant: card in the studio → 3-step sheet → save/share ---------- */
var consult=null,consultPanel=null;
function consultCard(){
 return el('button',{class:'consult-card',type:'button',onclick:function(){openConsult()}},[
  el('span',{class:'consult-card__ico',html:ICO.spark}),
  el('span',{},[el('b',{text:'نمی‌دونی چی بهت میاد؟ تحلیلش کنیم'}),el('small',{text:'عکست را تحلیل می‌کنیم، چند سؤال می‌پرسیم و ۳ تا ۶ پیشنهاد از همین بخش می‌دهیم.'})]),
  el('span',{class:'consult-card__go',html:ICO.arrow})
 ]);
}
function openConsult(){
 if(!state.original){toast('اول عکس خودت را اضافه کن');return}
 consult={step:1,line:state.line,photo:state.original,analysis:null,picked:{},skipped:{},answers:{},picks:null,savedId:null,busy:false,self:false,tried:false,note:''};
 track('consult',state.line);
 consultPanel=el('div',{class:'sheet__panel csheet'});
 openSheet(consultPanel);
 consultDraw();
}
function consultRel(){return CONSULT.r[consult.line]||[]}
function consultEffFields(){
 var out={},rel=consultRel(),f=(consult.analysis&&consult.analysis.fields)||{},low=(consult.analysis&&consult.analysis.low)||[];
 rel.forEach(function(k){
  if(consult.skipped&&consult.skipped[k])return;
  if(consult.picked[k]!=null){out[k]=consult.picked[k];return}
  var v=f[k];
  if(v&&low.indexOf(k)<0)out[k]=v;
 });
 return out;
}
function consultFieldDef(k){var out=null;CONSULT.f.forEach(function(x){if(x.key===k)out=x});return out}
function consultOptLabel(def,val){var out=val;((def&&def.options)||[]).forEach(function(o){if(o[0]===val)out=o[1]});return out}
function consultDraw(){
 var p=consultPanel;if(!p||!consult)return;
 p.replaceChildren();
 p.append(el('div',{class:'sheet__head'},[h('h2','نمی‌دونی چی بهت میاد؟ تحلیلش کنیم'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]));
 p.append(el('div',{class:'csteps'},[['تحلیل',1],['پرسش‌نامه',2],['پیشنهاد',3]].map(function(x){return el('span',{class:'cstep'+(consult.step>=x[1]?' is-on':''),text:x[0]})})));
 if(consult.step===1)consultStep1(p);
 else if(consult.step===2)consultStep2(p);
 else consultStep3(p);
}
function consultStep1(p){
 p.append(el('div',{class:'cphoto'},[el('img',{src:state.preview||media(consult.photo),alt:''}),el('div',{},[el('b',{text:'عکس خودت'}),el('small',{text:LINES.label[consult.line]})])]));
 if(consult.note)p.append(el('p',{class:'cfield__hint',text:consult.note}));
 if(!consult.analysis&&!consult.self){
  p.append(el('button',{class:'btn btn--primary btn--block',type:'button',disabled:!!consult.busy,text:consult.busy?'در حال تحلیل…':'شروع تحلیل',onclick:function(){consultAnalyze()}}));
  p.append(el('p',{class:'cfield__hint',text:'عکست را تحلیل می‌کنیم و ویژگی‌هایش را حدس می‌زنیم؛ هر فیلد کم‌اطمینان را خودت جواب می‌دهی. چیزی ذخیره نمی‌شود مگر خودت بخواهی.'}));
  return;
 }
 var rel=consultRel(),f=(consult.analysis&&consult.analysis.fields)||{},low=(consult.analysis&&consult.analysis.low)||[];
 rel.forEach(function(k){
  var def=consultFieldDef(k);if(!def)return;
  var pickedVal=consult.picked[k],modelVal=f[k];
  /* A low-confidence (or missing) field is never preselected: the sheet asks her, and the
     model's guess only travels as a hint. effFields() ignores it until she taps. */
  var isSkipped=!!(consult.skipped&&consult.skipped[k]);
  var isLow=pickedVal==null&&!isSkipped&&(low.indexOf(k)>=0||!modelVal);
  var v=pickedVal!=null?pickedVal:((isLow||isSkipped)?null:modelVal);
  var top=el('div',{class:'cfield__top'},[el('b',{text:def.label})]);
  if(isLow)top.append(el('span',{class:'cconf is-low',text:consult.self?'بدون تحلیل':'کم‌اطمینان'}));
  else if(v!=null){
   var conf=((consult.analysis&&consult.analysis.confidence)||{})[k];
   if(conf!=null)top.append(el('span',{class:'cconf',text:fa(Math.round(conf*100))+'٪'}));
  }
  var box=el('div',{class:'cfield'},[top]);
  if(isLow)box.append(el('span',{class:'cfield__hint',text:modelVal?('خودت انتخاب کن — پیشنهاد: '+consultOptLabel(def,modelVal)):'خودت انتخاب کن'}));
  var chips=el('div',{class:'cchips'});
  def.options.forEach(function(o){
   var on=v===o[0];
   var b=el('button',{class:'chip'+(on?' is-on':''),type:'button','aria-pressed':on?'true':'false',text:o[1]});
   b.addEventListener('click',function(){consult.picked[k]=o[0];if(consult.skipped)delete consult.skipped[k];consultDraw()});
   chips.append(b);
  });
  /* «نمی‌دونم» lets her skip a field; it simply stays out of the analysis. */
  var skipped=!!(consult.skipped&&consult.skipped[k]);
  var skip=el('button',{class:'chip'+(skipped?' is-on':''),type:'button','aria-pressed':skipped?'true':'false',text:'نمی‌دونم'});
  skip.addEventListener('click',function(){
   if(!consult.skipped)consult.skipped={};
   if(consult.skipped[k])delete consult.skipped[k];else{consult.skipped[k]=1;delete consult.picked[k]}
   consultDraw();
  });
  chips.append(skip);
  box.append(chips);
  p.append(box);
 });
 p.append(el('button',{class:'btn btn--primary btn--block',type:'button',text:'بعدی: پرسش‌نامه',disabled:!!consult.busy,onclick:function(){consult.step=2;consultDraw()}}));
}
function consultStep2(p){
 p.append(el('p',{class:'cfield__hint',text:'هر کدام را نخواستی رد کن؛ هرچه بیشتر بگویی، پیشنهادها دقیق‌تر می‌شود.'}));
 CONSULT.q.forEach(function(q){
  var box=el('div',{class:'cfield'},[el('div',{class:'cfield__top'},[el('b',{text:q.label})])]);
  var chips=el('div',{class:'cchips'}),cur=consult.answers[q.key];
  q.options.forEach(function(o){
   var on=cur===o[0];
   var b=el('button',{class:'chip'+(on?' is-on':''),type:'button','aria-pressed':on?'true':'false',text:o[1]});
   b.addEventListener('click',function(){
    if(consult.answers[q.key]===o[0])delete consult.answers[q.key];else consult.answers[q.key]=o[0];
    consultDraw();
   });
   chips.append(b);
  });
  box.append(chips);
  p.append(box);
 });
 p.append(el('button',{class:'btn btn--ghost btn--block',type:'button',text:'برگشت',onclick:function(){consult.step=1;consultDraw()}}));
 p.append(el('button',{class:'btn btn--primary btn--block',type:'button',disabled:!!consult.busy,text:consult.busy?'در حال محاسبه…':'پیشنهادها را ببین',onclick:function(){consultSuggest()}}));
}
function consultStep3(p){
 if(!consult.picks&&!consult.busy&&!consult.tried){
  consult.busy=true;consult.tried=true;consultDraw();
  consultSuggest();
  return;
 }
 if(!consult.picks&&consult.busy){
  p.append(el('p',{class:'muted',text:'داریم پیشنهادها را آماده می‌کنیم…'}));
  return;
 }
 if(consult.note&&!(consult.picks&&consult.picks.length))p.append(el('p',{class:'cfield__hint',text:consult.note}));
 if(consult.picks&&consult.picks.length){
  consult.picks.forEach(function(pk,i){
   p.append(el('div',{class:'cpick'},[
    el('b',{text:pk.name}),
    el('span',{class:'why',text:'چرا به تو میاد: '+pk.why}),
    el('span',{class:'lim',text:'محدودیت اجرا: '+pk.limit}),
    el('button',{class:'btn btn--soft btn--sm',type:'button',text:'روی عکسم بساز',onclick:function(){consultBuild(i)}})
   ]));
  });
 }else{
  p.append(el('p',{class:'muted',text:'پیشنهادی پیدا نشد؛ چند گزینه را عوض کن و دوباره ببین.'}));
  p.append(el('button',{class:'btn btn--soft btn--block',type:'button',text:'دوباره امتحان کن',onclick:function(){consult.picks=null;consult.tried=false;consult.note='';consultDraw()}}));
  p.append(el('button',{class:'btn btn--ghost btn--block',type:'button',text:'برگشت به پرسش‌نامه',onclick:function(){consult.step=2;consultDraw()}}));
  return;
 }
 p.append(el('button',{class:'btn btn--ghost btn--block',type:'button',text:'برگشت به پرسش‌نامه',onclick:function(){consult.step=2;consultDraw()}}));
 if(consult.savedId){
  p.append(notice('ok','ذخیره شد؛ در پروفایلت می‌بینی.'));
  p.append(el('button',{class:'btn btn--soft btn--block',type:'button',text:'لینک یک‌بارمصرف برای آرایشگر',onclick:function(){consultShareLink()}}));
 }else{
  p.append(el('button',{class:'btn btn--primary btn--block',type:'button',disabled:!!consult.busy,text:consult.busy?'در حال ذخیره…':'ذخیره در مشاوره‌های من',onclick:function(){consultSave()}}));
 }
}
function consultAnalyze(){
 if(!consult||consult.busy)return;
 /* Nails and lashes never run (nor charge) the vision — the card is hidden on both lines and
    a close-up of a hand or lashes is not a hairstyle analysis; the questionnaire is the answer. */
 if(consult.line==='nails'||consult.line==='lashes'){consult.self=true;consult.note='برای این بخش تحلیل عکس نداریم؛ خودت جواب بده.';consultDraw();return}
 consult.busy=true;consultDraw();
 ensureSession().then(function(){return api('consult/analyze',{photo_id:consult.photo,line:consult.line,v:VISITOR})})
 .then(function(d){
  consult.busy=false;
  if(d&&d.ok){consult.analysis={fields:d.fields||{},confidence:d.confidence||{},low:d.low||[]};consult.picked={};consult.note=d.cached?'تحلیل از قبل داشتیم؛ همان را می‌بینی.':''}
  else{consult.self=true;consult.note='تحلیل عکس در دسترس نیست؛ خودت جواب بده.'}
  consultDraw();
 })
 .catch(function(e){
  consult.busy=false;consult.self=true;
  consult.note=(e&&e.message)||'تحلیل عکس در دسترس نیست؛ خودت جواب بده.';
  consultDraw();
 });
}
function consultSuggest(){
 if(!consult)return;
 if(!consult.busy){consult.busy=true;consultDraw()}
 var body={line:consult.line,analysis:{fields:consultEffFields(),confidence:(consult.analysis&&consult.analysis.confidence)||{}},answers:consult.answers};
 ensureSession().then(function(){return api('consult/suggest',body)})
 .then(function(d){consult.busy=false;consult.picks=(d&&d.picks)||[];consult.step=3;consultDraw()})
 .catch(function(e){consult.busy=false;consult.picks=[];consult.note=(e&&e.message)||'';consult.step=3;consultDraw()});
}
function consultSave(){
 if(!consult)return;
 if(!state.verified){
  openSignin(function(){openSheet(consultPanel);consultDraw();consultSave()},state.me&&state.me.phone?'login':'signup','ذخیرهٔ مشاوره مخصوص حساب توست؛ در پروفایلت می‌ماند و لینکش را برای آرایشگرت می‌فرستی.');
  return;
 }
 if(consult.busy)return;
 consult.busy=true;consultDraw();
 /* self_keys marks the fields she answered herself (or all of them when there was no analysis)
    so the share page and the profile detail can call them her answer, never a photo analysis. */
 var eff=consultEffFields();
 var selfKeys=consult.self?Object.keys(eff):Object.keys(consult.picked||{}).filter(function(k){return eff[k]!=null});
 var body={line:consult.line,photo_id:consult.photo,analysis:{source:consult.self?'self':'vision',fields:eff,confidence:(consult.analysis&&consult.analysis.confidence)||{},low:(consult.analysis&&consult.analysis.low)||[],self_keys:selfKeys},answers:consult.answers};
 var L=lineRef(consult.line),res=L.result;
 /* Only a result built from this consultation's own pick (the fromConsult marker) on the
    very photo she analysed travels with the save — never an older image of the line. */
 if(res&&L.fromConsult===consult.photo)body.result_id=res;
 ensureSession().then(function(){return api('consult',body)})
 .then(function(d){
  consult.busy=false;consult.savedId=d.id;
  if(d.picks&&d.picks.length)consult.picks=d.picks;
  track('consult_save',consult.line);
  consultDraw();toast('ذخیره شد؛ در پروفایلت می‌بینی');
 })
 .catch(function(e){consult.busy=false;consultDraw();toast((e&&e.message)||'ذخیره نشد؛ دوباره امتحان کن','error')});
}
function consultShareLink(){
 if(!consult||!consult.savedId)return;
 var id=consult.savedId;
 ensureSession().then(function(){return api('consults/'+id+'/share',{})})
 .then(function(d){
  var url=location.origin+d.path;
  return copyText(url).then(function(){toast('لینک کپی شد؛ فقط یک بار باز می‌شود')},function(){toast(url)});
 })
 .catch(function(e){toast((e&&e.message)||'لینک ساخته نشد','error')});
}
function consultBuild(i){
 var pk=consult&&consult.picks&&consult.picks[i];if(!pk)return;
 var photo=consult.photo;
 closeSheet();
 track('look',lookPrefix()+pk.index);
 if(state.line==='color')track('color',pk.name);
 /* Land on the catalog with every filter and search cleared so the chosen card is on the
    page, then bring it into view and flash it. */
 state.tab='catalog';state.filter='همه';state.q='';
 pickLook(function(){
  state.style=pk.index;state.custom='';state.reference=null;state.refTitle='';
  if(state.line==='color')state.color='';
 });
 /* Only a build started from this button — carrying the photo she analysed — may later
    attach to the saved consultation; any other pick or a new photo clears the marker. */
 state.fromConsult=photo;
 flashPickedCard();
}
function openConsultDetail(id){
 var panel=el('div',{class:'sheet__panel csheet'});
 openSheet(panel);
 panel.replaceChildren(el('div',{class:'sheet__head'},[h('h2','مشاوره'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]),el('p',{class:'muted',text:'در حال بارگذاری…'}));
 api('consults/'+id).then(function(d){
  if(!panel.isConnected)return;
  panel.replaceChildren(el('div',{class:'sheet__head'},[h('h2','مشاورهٔ '+LINES.label[d.line]),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]));
  var rel=CONSULT.r[d.line]||[],fields=(d.analysis&&d.analysis.fields)||{};
  /* Honesty: her own answers are labelled hers, never a photo analysis; all-self → one title. */
  var selfSet={};((d.analysis&&d.analysis.self_keys)||[]).forEach(function(k){selfSet[k]=1});
  var rowOf=function(k){
   var def=consultFieldDef(k);
   return el('div',{class:'cfield__top'},[el('b',{text:def?def.label:k}),el('span',{class:'muted',text:consultOptLabel(def,fields[k])})]);
  };
  var present=rel.filter(function(k){return fields[k]});
  var visionRows=present.filter(function(k){return !selfSet[k]}),selfRows=present.filter(function(k){return !!selfSet[k]});
  var allSelf=(d.analysis&&d.analysis.source==='self')||(selfRows.length>0&&!visionRows.length);
  if(allSelf)panel.append(el('div',{class:'cfield'},[el('div',{class:'cfield__top'},[el('b',{text:'مشخصات (پاسخ مشتری)'})])].concat(present.map(rowOf))));
  else{
   if(visionRows.length)panel.append(el('div',{class:'cfield'},[el('div',{class:'cfield__top'},[el('b',{text:'تحلیل عکس'})])].concat(visionRows.map(rowOf))));
   if(selfRows.length)panel.append(el('div',{class:'cfield'},[el('div',{class:'cfield__top'},[el('b',{text:'پاسخ مشتری'})])].concat(selfRows.map(rowOf))));
  }
  var ans=d.answers||{},qrows=CONSULT.q.filter(function(q){return ans[q.key]}).map(function(q){
   return el('div',{class:'cfield__top'},[el('b',{text:q.label}),el('span',{class:'muted',text:consultOptLabel(q,ans[q.key])})]);
  });
  if(qrows.length)panel.append(el('div',{class:'cfield'},[el('div',{class:'cfield__top'},[el('b',{text:'پرسش‌نامه'})])].concat(qrows)));
  (d.picks||[]).forEach(function(pk){
   panel.append(el('div',{class:'cpick'},[
    el('b',{text:pk.name}),
    el('span',{class:'why',text:'چرا به تو میاد: '+pk.why}),
    el('span',{class:'lim',text:'محدودیت اجرا: '+pk.limit})
   ]));
  });
  if(d.result_id)panel.append(el('img',{class:'consult-img',src:media(d.result_id),alt:'نتیجهٔ ساخته‌شده'}));
  panel.append(el('button',{class:'btn btn--primary btn--block',type:'button',text:'لینک یک‌بارمصرف برای آرایشگر',onclick:function(e){
   var b=e.currentTarget;b.disabled=true;b.textContent='در حال ساخت لینک…';
   api('consults/'+id+'/share',{}).then(function(r){
    var url=location.origin+r.path;
    return copyText(url).then(function(){b.textContent='لینک کپی شد ✓';toast('لینک کپی شد؛ فقط یک بار باز می‌شود')},function(){b.disabled=false;b.textContent='لینک یک‌بارمصرف برای آرایشگر';toast(url)});
   }).catch(function(err){b.disabled=false;b.textContent='لینک یک‌بارمصرف برای آرایشگر';toast((err&&err.message)||'لینک ساخته نشد','error')});
  }}));
 }).catch(function(e){
  if(!panel.isConnected)return;
  panel.replaceChildren(el('div',{class:'sheet__head'},[h('h2','مشاوره'),el('button',{class:'sheet__x',type:'button','aria-label':'بستن',text:'×',onclick:closeSheet})]),el('p',{class:'hint',text:(e&&e.message)||'پیدا نشد'}));
 });
}

/* ---------- sheet ---------- */
function openSheet(node){
 var d=$('#sheet');
 d.replaceChildren(node);
 if(!d.open)d.showModal();
}
function closeSheet(){var d=$('#sheet');if(d&&d.open)d.close()}

document.addEventListener('click',function(e){
 if(e.target&&e.target.classList&&e.target.classList.contains('sheet'))closeSheet();
});
`;

const embeddedCSS='.embedded-demo .head--direct .hero__bar,.embedded-demo .head--direct .cover,.embedded-demo .head--direct .hero__text{display:none!important}.embedded-demo .head--direct .hero__body{padding-top:4px}.embedded-demo .head,.embedded-demo #steps,.embedded-demo #invite,.embedded-demo .trialbar,.embedded-demo footer{display:none!important}.embedded-demo main{padding-top:20px}.embedded-demo{background:#f6f0e7}.embedded-demo .panel{box-shadow:none}';
export {clientJS as customerJS};
export const customerHTML=String.raw`<!doctype html><html lang="fa" dir="rtl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#e8edeb">
<meta name="color-scheme" content="light">
<meta name="description" content="مدل و رنگ موی بعدی‌ات را روی عکس خودت ببین و برای بررسی به آرایشگر بفرست.">
<meta property="og:title" content="آینه | مشاورهٔ مدل و رنگ مو">
<meta property="og:description" content="مدل مو را انتخاب کن، عکس خودت را اضافه کن و نتیجه را برای بررسی به سالن بفرست.">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/vazirmatn-arabic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/estedad-arabic.woff2" as="font" type="font/woff2" crossorigin>
<title>آینه | مشاورهٔ مو</title>
<style>__CSS__.trialbar{position:sticky;top:0;z-index:30;padding:8px 14px;text-align:center;font-size:13px;font-weight:700;background:var(--accent-ink);color:#fff}.trialbar.is-over{background:var(--danger)}.trialbar.owner-return{display:flex;align-items:center;justify-content:center;gap:8px 14px;flex-wrap:wrap;background:#102c3b;padding:9px 14px;text-align:center}.owner-return__note{font-size:12.5px;font-weight:500;line-height:1.7;opacity:.95}.owner-return__cta{display:inline-flex;align-items:center;min-height:44px;flex:none;background:#fff;color:#102c3b;border-radius:999px;padding:6px 15px;font-size:12.5px;font-weight:800;text-decoration:none}.owner-return__cta:hover{background:#f0dcae}.owner-return__cta:focus-visible{outline:2px solid #fff;outline-offset:2px}</style>
</head><body>
<a class="skip" href="#main">پرش به محتوای اصلی</a>
<header class="hero" id="head"><div class="wrap"><div class="hero__bar"><div class="skel" style="width:70px;height:22px"></div></div><div class="skel cover"></div><div class="hero__body"><div><div class="skel" style="width:70%;height:38px"></div><div class="skel" style="width:52%;height:14px;margin-top:14px"></div></div></div></div></header>
<nav class="steps" id="steps" aria-label="مراحل" hidden></nav>
<main class="wrap" id="main">
 <div class="layout layout--solo">
  <div class="flowcol"><section id="mine" aria-live="polite" hidden></section>
  <section id="flow" aria-live="polite"><div class="panel flow"><div class="skel" style="height:26px;width:46%"></div><div class="skel" style="width:min(100%,280px);aspect-ratio:3/4;margin:20px auto 0;border-radius:999px 999px 18px 18px"></div></div></section></div>
  <aside class="side" id="side" hidden></aside>
 </div>
 <section id="invite" aria-label="معرفی به دوستان" hidden></section>
 <footer class="foot" id="foot" style="padding-bottom:130px">شبیه‌سازی پیشنهادی است و اجرای دقیق را تضمین نمی‌کند. عکس شما فقط برای ساخت نمونه و دیدنِ سالن استفاده می‌شود؛ نسخهٔ فشردهٔ آن برای ساخت تصویر به سرویس تصویر ارسال می‌شود. نمایش عمومی ندارد.</footer>
</main>
<div class="dock" id="dock" hidden></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<dialog class="sheet" id="sheet" aria-label="پنجره"></dialog>
<script>__JS__</script>
</body></html>`
 .replace('__CSS__',()=>baseCSS+customerCSS+embeddedCSS)
 .replace('__JS__',()=>draftScript+';'+clientJS.replace('__STYLES__',()=>JSON.stringify(styles)).replace('__LINES__',()=>LINES_JSON).replace('__MARK__',()=>JSON.stringify(markSVG)).replace('__CONSULT__',()=>JSON.stringify({q:QUESTIONS,f:ANALYSIS_FIELDS,r:RELEVANT})));
