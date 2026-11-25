import os, re, base64, json, hashlib, shutil
os.makedirs('out', exist_ok=True)
# Run from design/landing: python3 build.py
# Writes out/v2.html (relative paths, live preview), out/artifact.html (single file)
# and ../../worker/landing.js (the page the worker serves at "/").
#
# Step 24 replaced the espresso/brass landing with the reference rebuild. The page
# is now assembled from exactly three sources — src/page.html (shell: head, header,
# six sections, footer), src/plans.html (price panels) and src/site.css — plus the
# studio's own stylesheet and scripts, which are still live inside #salon-example.
NL = chr(10)
R = lambda p: open(p, encoding='utf8').read()
W = lambda p, s: open(p, 'w', encoding='utf8').write(s)

# ---------------- static assets ----------------
# Everything the new page references, synced into public/landing/ so the worker
# and the static preview read the same bytes.
DEMOS = ['demo-%s-%s.webp' % (s, k) for s in ('style', 'color', 'lashes', 'nails') for k in ('before', 'after')]
SYNC = re.compile(r'(hero\.webp|hero-stopmotion-poster\.webp|salon-film-0[1-5]\.webp|(?:hair|lashes|nails)-end\.webp|%s|estedad\.woff2|look-s\d\d\.webp|(?:hero|look-s\d\d)-hd\.webp|film-bg-[1-5]\.webp|sample-(?:hair|color|nails|lashes)-(?:before|after)\.webp|ayneh-logo-lg\.webp|hero-mix-[0-3]\.webp|salon-cover\.webp)$' % '|'.join(re.escape(d) for d in DEMOS))
for asset in os.listdir('assets'):
    if SYNC.match(asset):
        shutil.copyfile('assets/' + asset, '../../public/landing/' + asset)

W('../../worker/brand.js', 'export const brandMark=' + json.dumps(R('assets/ayneh-mark.svg'), ensure_ascii=False) + ';' + NL
  + 'export const favicon=' + json.dumps(R('assets/ayneh-favicon.svg'), ensure_ascii=False) + ';' + NL)
shutil.copyfile('assets/ayneh-favicon.svg', '../../public/favicon.svg')

# ---------------- styles ----------------
# site.css is the new visual system and owns every base rule. trial.css is scoped
# to the studio block only (see the guard below), so no legacy selector can leak.
css = R('src/site.css') + NL + R('src/studio.css') + NL + R('src/copy.css') + NL + R('src/pricing.css')
assert '.site-header{' in css, 'site.css must own the header'

# ---------------- plans (the owner's price sheet) ----------------
# The ONLY place a price can enter the shipped pages. Same three plans on every service page.
# This table also generates worker/prices.js (what the checkout charges and how many image
# credits a confirmed plan grants), so the page and the server can never disagree.
# amount / was: TOMAN. months: plan length. credits: gift images granted on confirmation.
PLANS = [
    {'key': 'essential', 'name': 'پایه', 'months': 1, 'amount': 2900000, 'was': 0, 'credits': 20, 'badge': '',
     'features': ['صفحهٔ اختصاصی شما', 'گالری نمونه‌کار', 'امتحان مدل با عکس دلخواه مشتری', 'دریافت درخواست مشتری', 'اتصال پیام‌رسان', '۲۰ عکس هدیه']},
    {'key': 'pro', 'name': 'حرفه‌ای', 'months': 3, 'amount': 6000000, 'was': 8700000, 'credits': 75, 'badge': '',
     'features': ['همهٔ امکانات پلن پایه', '۷۵ عکس هدیه', 'نوبت‌دهی و پیگیری', 'گزارش عملکرد ساده']},
    {'key': 'signature', 'name': 'کامل', 'months': 6, 'amount': 10000000, 'was': 17400000, 'credits': 180, 'badge': 'پیشنهاد آینه',
     'features': ['همهٔ امکانات پلن حرفه‌ای', '۱۸۰ عکس هدیه', 'گزارش عملکرد کامل', 'آرشیو مشتریان', 'پشتیبانی ویژه']},
]
# «پنل آرایشگاه» (owner's decision): every service (hairstyle, hair colour, nails, lashes) for the
# whole salon, for up to SALON_SEATS users (the manager is one of them). Each user beyond that
# costs seat_amount toman for the WHOLE period, whatever its length. The checkout charges
# amount + max(0, users − seats) × seat_amount, computed on the server from prices.js only.
#   tier: the features it opens (worker/plans.js) — the single-service plan of the same length
#         (1 month = ESSENTIAL, 3 = PRO, 6 = SIGNATURE). Assumption until the owner says otherwise.
#   credits: gift images = the same-length single-service plan × SALON_CREDIT_FACTOR (2): one
#         salon page serves every service for several users, so twice the images of one
#         specialist (20/75/180 → 40/150/360). The top-up price after that is the same.
# These have no card in the shared price section below (the landing pages are drawn elsewhere);
# they only feed worker/prices.js, so the page and the server still read one table.
SALON_SEATS, SALON_CREDIT_FACTOR = 3, 2
SALON_PLANS = [
    {'key': 'salon1', 'name': 'پنل آرایشگاه ۱ ماهه', 'months': 1, 'amount': 5000000, 'seat_amount': 2000000, 'tier': 'essential'},
    {'key': 'salon3', 'name': 'پنل آرایشگاه ۳ ماهه', 'months': 3, 'amount': 10000000, 'seat_amount': 1500000, 'tier': 'pro'},
    {'key': 'salon6', 'name': 'پنل آرایشگاه ۶ ماهه', 'months': 6, 'amount': 15000000, 'seat_amount': 1000000, 'tier': 'signature'},
]
for _p in PLANS:
    _p.update(tier=_p.get('tier', _p['key']), seats=0, seat_amount=0)
for _p in SALON_PLANS:
    _p.update(was=0, seats=SALON_SEATS, credits=next(x['credits'] for x in PLANS if x['months'] == _p['months']) * SALON_CREDIT_FACTOR)
# After the gift credit runs out: every TOPUP images cost TOPUP_AMOUNT toman.
TOPUP_IMAGES, TOPUP_AMOUNT = 10, 200000
# The checkout window the customer sees and the server enforces (worker/orders.js).
PRICE_MINUTES = 10

# ---------------- pricing v2: per service (owner's decision, Nov 2026; final numbers) ----------------
# The plans above (PLANS / SALON_PLANS) are no longer sold on any page: no salon bought one, so
# their keys stay in worker/prices.js only so older orders and tests still read (sold: false).
# What is sold now, all in TOMAN, all drawn on /pricing («خرید اشتراک و اعتبار») from these tables:
#  PATH 1 «فقط ساخت تصویر»: image credits for one service, any count at `single`, or a pack.
#         Only the try-on images; no page, bot, booking or reports (worker/plans.js tier 'images').
#  PATH 2 «اشتراک ماهانه»: a monthly subscription per service (or the whole salon, by staff size)
#         that opens every panel feature, plus subscriber image packs (cheaper per image).
# Credits are per service (credit_ledger.line) and never expire. No free images before payment.
LINE_ORDER = ['hair', 'color', 'nails', 'lashes']
IMAGE_PRICES = {
    'hair': {'single': 50000, 'packs': {5: 238000, 10: 450000, 20: 850000}},   # 5 × 50,000 × 95% = 237,500 → shown 238,000
    'color': {'single': 60000, 'packs': {5: 285000, 10: 540000, 20: 1020000}},
    'nails': {'single': 40000, 'packs': {5: 190000, 10: 360000, 20: 680000}},
    'lashes': {'single': 40000, 'packs': {5: 190000, 10: 360000, 20: 680000}},
}
PACK_SAVE = {5: 5, 10: 10, 20: 15}  # % saved against `single` × count (shown on each pack)
for _k, _v in IMAGE_PRICES.items():
    for _n, _a in _v['packs'].items():
        assert abs(_v['single'] * _n * (100 - PACK_SAVE[_n]) / 100 - _a) <= 500, 'pack saving off: %s %d' % (_k, _n)
CUSTOM_MAX = 500  # largest custom count in one order
SUBS = [  # months: 1 (monthly, no auto-renewal). seats 0 = one specialist, no user cap.
    {'key': 'sub_hair', 'line': 'hair', 'amount': 1490000, 'seats': 0},
    {'key': 'sub_color', 'line': 'color', 'amount': 2900000, 'seats': 0},
    {'key': 'sub_nails', 'line': 'nails', 'amount': 990000, 'seats': 0},
    {'key': 'sub_lashes', 'line': 'lashes', 'amount': 990000, 'seats': 0},
    {'key': 'sub_salon3', 'line': 'all', 'amount': 4900000, 'seats': 3},
    {'key': 'sub_salon8', 'line': 'all', 'amount': 7900000, 'seats': 8},
    {'key': 'sub_salon20', 'line': 'all', 'amount': 12900000, 'seats': 20},
]
SUB_PACKS = {  # subscriber image packs, per service: the more images, the cheaper each
    'hair': {50: 1700000, 100: 3000000, 200: 5400000},
    'color': {50: 2000000, 100: 3500000, 200: 6000000},
    'nails': {50: 1300000, 100: 2200000, 200: 3800000},
    'lashes': {50: 1300000, 100: 2200000, 200: 3800000},
}
for _k, _v in SUB_PACKS.items():
    _each = [a // n for n, a in sorted(_v.items())]
    assert _each == sorted(_each, reverse=True) and _each[0] < IMAGE_PRICES[_k]['single'], 'subscriber packs must get cheaper: ' + _k
# Half of a one-service subscription comes back as images of its own service at the single price.
SUB_GIFT_IMAGES = {x['line']: (x['amount'] // 2) // IMAGE_PRICES[x['line']]['single'] for x in SUBS if x['line'] != 'all'}
# Tier names (owner, Nov 2026): one-service subscriptions by their image pack; salons by size.
STYLIST_TIERS = {50: 'آرایشگر مبتدی', 100: 'آرایشگر حرفه‌ای', 200: 'آرایشگر فوق حرفه‌ای'}
SALON_TIERS = {3: 'سالن کم‌مشتری', 8: 'سالن رو به رشد', 20: 'سالن پر از مشتری'}
SUB_NAMES = {'hair': 'اشتراک مدل مو', 'color': 'اشتراک رنگ مو', 'nails': 'اشتراک ناخن', 'lashes': 'اشتراک مژه'}
_FA = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')
for _s in SUBS:
    _s['name'] = SUB_NAMES[_s['line']] if _s['line'] != 'all' else 'اشتراک آرایشگاه تا ' + str(_s['seats']).translate(_FA) + ' نفر'


def fa_int(n):
    return str(n).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))


def millions(toman):
    """2900000 → ۲٫۹ ; 10000000 → ۱۰ (the price sheet writes «۲.۹ میلیون تومان»)."""
    m = toman / 1000000
    s = ('%g' % m)
    return fa_int(s).replace('.', '٫')


# Plain-words notes under the owner's bullet wording (the wording itself stays exactly as on
# the price sheet). Keyed by the bullet; a gift-credit bullet matches by prefix.
PLAN_NOTES = {
    'صفحهٔ اختصاصی شما': 'یه لینک به اسم خودتون برای بیو اینستاگرام',
    'گالری نمونه‌کار': 'نمونه‌کارهاتون رو هر وقت بخواید از پنل اضافه می‌کنید',
    'امتحان مدل با عکس دلخواه مشتری': 'مشتری می‌تونه عکس مدلی که جای دیگه پسندیده رو هم بذاره',
    'دریافت درخواست مشتری': 'همراه با عکس و مدل انتخابی مشتری، مستقیم توی پنلتون',
    'اعتبار هدیه': 'با هر عکسی که برای مشتری ساخته می‌شه یکی کم می‌شه؛ عکس‌های ناموفق حساب نمی‌شن',
    'اتصال پیام‌رسان': 'درخواست‌ها مستقیم توی تلگرام هم براتون میاد',
    'نوبت‌دهی و پیگیری': 'نوبت رو شما ثبت می‌کنید؛ تأیید و با یک لمس، پیام آمادهٔ تأیید و یادآوری توی واتس‌اپ برای مشتری می‌ره',
    'گزارش عملکرد ساده': 'آمار بازدید، امتحان مدل، درخواست و نوبت‌های هر ماه',
    'گزارش عملکرد کامل': 'به‌همراه مدل‌های پرطرفدار، آمار هر همکار و سرعت پاسخ‌گویی',
    'آرشیو مشتریان': 'فهرست کامل مشتری‌ها با جستجو و خروجی اکسل',
    'پشتیبانی ویژه': 'پیام مستقیم از داخل پنل، با پاسخ‌گویی سریع‌تر',
}


def plan_note(f):
    n = PLAN_NOTES.get(f) or next((v for k, v in PLAN_NOTES.items() if f.startswith(k)), '')
    return '<span>' + f + ('<small>' + n + '</small>' if n else '') + '</span>'


TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3.5V6M16 3.5V6" stroke-linecap="round"/></svg>'
CROWN = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-2 10H5Z"/></svg>'


def per_person(toman, n):
    """«۱٫۷» for 5,000,000 / 3 — rounded to one decimal; the caller adds «حدود» when it is not exact."""
    m = round(toman / n / 1000000, 1)
    return fa_int('%g' % m).replace('.', '٫'), m * 1000000 * n == toman


def plan_card(p, service):
    """One single-service card inside a service tab. The buy button names its own service, so the
    checkout charges the right line whatever page the visitor is on."""
    lead = ' plan--lead' if p['badge'] else ''
    badge = ('<span class="plan__badge">' + CROWN + p['badge'] + '</span>') if p['badge'] else ''
    was = ('<p class="plan__was"><s>' + millions(p['was']) + ' میلیون تومان</s></p>') if p['was'] else '<p class="plan__was" aria-hidden="true">&nbsp;</p>'
    meta_parts = []
    if p['months'] > 1:
        pm, exact = per_person(p['amount'], p['months'])
        meta_parts.append(('ماهی ' if exact else 'حدود ماهی ') + pm + ' میلیون')
    if p['was'] > p['amount']:
        meta_parts.append(millions(p['was'] - p['amount']) + ' میلیون صرفه‌جویی')
    meta = ('<p class="plan__meta">' + ' <b>·</b> '.join(meta_parts) + '</p>') if meta_parts else ''
    feats = ''.join('<li>' + TICK + plan_note(f) + '</li>' for f in p['features'])
    return (
        '<article class="plan' + lead + '" data-plan="' + p['key'] + '">' + badge
        + '<h3 lang="en" dir="ltr">' + p['name'] + '</h3>'
        + '<p class="plan__months">' + CAL + fa_int(p['months']) + ' ماهه</p>'
        + '<div class="plan__price" data-price-box="' + p['key'] + '">' + was
        + '<p class="plan__amount" data-price="' + p['key'] + '"><b>' + (millions(p['amount']) + '</b> میلیون تومان' if p['amount'] >= 1000000 else fa_int(p['amount'] // 1000) + '</b> هزار تومان') + '</p>' + meta + '</div>'
        + '<ul>' + feats + '</ul>'
        + '<a class="btn plan__buy" href="#pay" data-buy="' + p['key'] + '" data-service="' + service + '" data-title="' + SERVICE_TITLES[service]
        + '" data-months="' + str(p['months']) + '" data-state="open" data-amount="' + str(p['amount']) + '">خرید</a>'
        + '<p class="plan__state" data-for="' + p['key'] + '" hidden></p>'
        + '</article>')


def salon_card(p):
    """One «پنل آرایشگاه» card. Every figure on it (price, per-person share, gift images, the
    price of each user beyond SALON_SEATS) is computed here from SALON_PLANS."""
    badge = SALON_BADGES.get(p['key'], '')
    each, exact = per_person(p['amount'], p['seats'])
    tier = next(x['name'] for x in PLANS if x['key'] == p['tier'])
    smeta = ''
    if p['months'] > 1:
        pm, pexact = per_person(p['amount'], p['months'])
        smeta = '<p class="plan__meta">' + ('ماهی ' if pexact else 'حدود ماهی ') + pm + ' میلیون برای کل سالن</p>'
    feats = ['هر چهار خدمت: مدل مو، رنگ مو، ناخن و مژه',
             'تا ' + fa_int(p['seats']) + ' کاربر؛ مدیر هم یکی از آن‌هاست',
             'لینک اختصاصی برای هر همکار',
             'اعتبار هدیه ' + fa_int(p['credits']) + ' عکس',
             'امکانات <span lang="en" dir="ltr">' + tier + '</span> برای کل سالن']
    return (
        '<article class="plan plan--salon' + (' plan--lead' if badge else '') + '" data-plan="' + p['key'] + '">'
        + (('<span class="plan__badge">' + CROWN + badge + '</span>') if badge else '')
        + '<h3>پنل آرایشگاه ' + fa_int(p['months']) + ' ماهه</h3>'
        + '<p class="plan__months">' + CAL + fa_int(p['months']) + ' ماهه</p>'
        + '<div class="plan__price" data-price-box="' + p['key'] + '">'
        + '<p class="plan__amount" data-price="' + p['key'] + '"><b>' + millions(p['amount']) + '</b> میلیون تومان</p>'
        + '<p class="plan__each">برای ' + fa_int(p['seats']) + ' نفر: نفری ' + ('' if exact else 'حدود ') + each + ' میلیون تومان</p>' + smeta + '</div>'
        + '<ul>' + ''.join('<li>' + TICK + '<span>' + f + '</span></li>' for f in feats) + '</ul>'
        + '<a class="btn plan__buy" href="#pay" data-buy="' + p['key'] + '" data-service="all" data-title="' + SERVICE_TITLES['all']
        + '" data-months="' + str(p['months']) + '" data-state="open" data-amount="' + str(p['amount'])
        + '" data-seats="' + str(p['seats']) + '" data-seat-amount="' + str(p['seat_amount']) + '">خرید</a>'
        + '<p class="plan__state" data-for="' + p['key'] + '" hidden></p>'
        + '<p class="plan__extra">نفر ' + ORDINAL[p['seats'] + 1] + ' به بعد: هر نفر ' + millions(p['seat_amount']) + ' میلیون تومان برای کل دوره</p>'
        + '</article>')


# The title the checkout line uses: «پلن مدل مو · ۳ ماهه». Single-service plans take the
# service's name; «پنل آرایشگاه» orders are service 'all'. Shared with worker/prices.js.
SERVICE_TITLES = {'hair': 'مدل مو', 'color': 'رنگ مو', 'nails': 'ناخن', 'lashes': 'مژه', 'all': 'آرایشگاه'}
ORDINAL = {2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم'}
# Badges on the salon tab. The whole tab is «به‌صرفه‌ترین برای ۲ نفر به بعد»: it is true only
# while every salon plan costs less than two single-service plans of the same length (asserted).
SALON_BADGES = {'salon6': 'پیشنهاد آینه'}
SALON_VALUE = 'به‌صرفه‌ترین برای ۲ نفر به بعد'
for _p in SALON_PLANS:
    _single = next(x for x in PLANS if x['months'] == _p['months'])
    assert _p['amount'] < 2 * _single['amount'], 'the «۲ نفر به بعد» badge would be false for ' + _p['key']
PLAN_TABS = ['hair', 'color', 'nails', 'lashes']


def plans_panel(tabs, selected):
    """One panel. The four service tabs share ONE panel of the three single-service cards (the same
    plans, the same prices): its buy buttons carry the selected service, and src/copy.js rewrites
    data-service / data-title when another service tab is picked, so the checkout always charges
    the line the visitor chose. Drawing the cards four times would only repeat identical markup.
    The salon tab has its own panel. The selected tab is visible in the HTML itself."""
    if tabs == ['salon']:
        hide = '' if selected == 'salon' else ' hidden'
        body = ('<p class="psalon"><span class="psalon__badge">' + SALON_VALUE + '</span>'
                '<span>هر چهار خدمت برای کل سالن، تا ' + fa_int(SALON_SEATS) + ' کاربر.</span></p>'
                + '<div class="plans">' + ''.join(salon_card(p) for p in SALON_PLANS) + '</div>')
        pid = 'salon'
    else:
        service = selected if selected in tabs else tabs[0]
        hide = '' if selected in tabs else ' hidden'
        body = '<div class="plans">' + ''.join(plan_card(p, service) for p in PLANS) + '</div>'
        pid = 'single'
    return ('<div class="plans-panel" id="plans-' + pid + '" role="tabpanel" aria-labelledby="ptab-' + (selected if selected in tabs else tabs[0])
            + '" data-plans-panel="' + ' '.join(tabs) + '"' + hide + '>' + body + '</div>')


PLAN_NOTE = ('<p class="plan-note" id="plan-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5" stroke-linecap="round"/></svg>'
             + '<span>بعد از تموم شدن عکس‌های هدیه، هر ' + fa_int(TOPUP_IMAGES) + ' عکس ' + fa_int(TOPUP_AMOUNT // 1000) + ' هزار تومانه</span></p>')


def plans_block(tabs, selected):
    single = [k for k in tabs if k in PLAN_TABS]
    return ((plans_panel(single, selected) if single else '') + (plans_panel(['salon'], selected) if 'salon' in tabs else '')
            + PLAN_NOTE)


plans = '<!--PLANPANELS-->'  # filled per page by make_pages (pricing_for)
assert all(p['amount'] > 0 for p in PLANS + SALON_PLANS)
plans_js = ''.join("  %s: {name: '%s', title: '%s', months: %d, amount: %d, was: %d, credits: %d, tier: '%s', seats: %d, seat_amount: %d, sold: false},\n"
                   % (p['key'], p['name'], SERVICE_TITLES['all'] if p['seats'] else '', p['months'], p['amount'], p['was'], p['credits'], p['tier'], p['seats'], p['seat_amount'])
                   for p in PLANS + SALON_PLANS)
plans_js += ''.join("  %s: {name: '%s', title: '%s', months: 1, amount: %d, was: 0, credits: 0, tier: 'full', seats: %d, seat_amount: 0, sold: true, line: '%s'},\n"
                    % (s['key'], s['name'], s['name'].replace('اشتراک ', ''), s['amount'], s['seats'], s['line'])
                    for s in SUBS)
_obj = lambda d: '{' + ', '.join('%s: %s' % (k, v) for k, v in d.items()) + '}'
prices_v2 = ('// Pricing v2 (owner\'s decision, Nov 2026). Path 1 «فقط ساخت تصویر»: per service, one image at' + NL
             + '// `single` or a pack {count: amount}; any custom count costs count × single (a count equal to a' + NL
             + '// pack size costs the pack). Path 2: the sub_* plans above (monthly) and SUB_PACKS for subscribers.' + NL
             + 'export const IMAGE_PRICES = ' + _obj({k: _obj({'single': v['single'], 'packs': _obj(v['packs'])}) for k, v in IMAGE_PRICES.items()}) + ';' + NL
             + 'export const PACK_SAVE = ' + _obj(PACK_SAVE) + ';' + NL
             + 'export const SUB_PACKS = ' + _obj({k: _obj(v) for k, v in SUB_PACKS.items()}) + ';' + NL
             + 'export const CUSTOM_MAX = %d;' % CUSTOM_MAX + NL
             + 'export const SUB_KEYS = ' + json.dumps([s['key'] for s in SUBS]).replace('"', "'") + ';' + NL)
W('../../worker/prices.js',
  '// The plan table — GENERATED by design/landing/build.py from PLANS, the same table that draws' + NL
  + '// the price cards on every service page. Never edit by hand: change build.py and rebuild.' + NL
  + '//' + NL
  + '// amount / was: TOMAN. months: plan length. credits: gift images granted on confirmation.' + NL
  + '// tier: the features it opens (worker/plans.js). seats: users included (0 = no cap); each user' + NL
  + '// beyond seats costs seat_amount toman for the whole period (the «پنل آرایشگاه» plans).' + NL
  + 'export const PRICE_MINUTES = %d;' % PRICE_MINUTES + NL
  + 'export const PLANS = {' + NL + plans_js + '};' + NL
  + '// title: the checkout line «پلن <title> · ۳ ماهه»; empty = the service\'s own title below.' + NL
  + 'export const SERVICE_TITLES = ' + json.dumps(SERVICE_TITLES, ensure_ascii=False).replace('"', "'") + ';' + NL
  + '// After the gift credit runs out: every TOPUP.images images cost TOPUP.amount toman.' + NL
  + 'export const TOPUP = {images: %d, amount: %d};' % (TOPUP_IMAGES, TOPUP_AMOUNT) + NL
  + prices_v2)


# ---------------- studio (live salon-page builder) ----------------
# src/trial.html is the studio markup. It is preview-only: nothing inside it is uploaded
# and its last step hands the visitor to the price panels.
studio = '<!-- 9. Build your own salon page (live preview) -->' + NL + R('src/trial.html')

# ---------------- page assembly ----------------
h = R('src/page.html')
# The payment sheet sits right after the studio: the price panels above open it, and it never
# renders until a priced plan is picked (see src/pay.js). One replace: the STUDIO marker can
# only be consumed once.
h = h.replace('<!--PLANS-->', plans).replace('<!--STUDIO-->', studio + NL + R('src/pay.html'))
assert '<!--PLANS-->' not in h and '<!--STUDIO-->' not in h
assert 'id="pay"' in h and 'id="payForm"' in h, 'the payment sheet must ship'
# One support number everywhere: the landing must print the one in worker/support.js.
SUPPORT_TEL = re.search(r"SUPPORT_TEL = '(\d+)'", R('../../worker/support.js')).group(1)
assert set(re.findall(r'tel:(\d+)', h)) == {SUPPORT_TEL}, 'landing support number differs from worker/support.js'

# ---------------- the pages: home, four services, the salon panel, the demo ----------------
# page.html is the shell (head, header, footer, the pricing section) and every other section is
# a partial in src/. Each page below is the shell with its own list of sections cut out of them.
# All public copy lives in those partials and in the tables here; the PLANS block above only
# draws the price cards and never decides what a page says.
SERVICES = {
    'hair': {
        'label': 'مدل مو', 'path': '/hair', 'pair': 'style', 'line': 'hair',
        'title': 'برای متخصصان مدل مو',
        'desc': 'مشتری مدل مو رو روی عکس خودش می‌بینه و مطمئن‌تر درخواست می‌ده. نمونه، پلن‌ها و روش کار.',
        'eyebrow': 'برای متخصصان مدل مو',
        'h1': 'مشتری می‌پرسه «این مدل بهم میاد؟»', 'accent': '',
        'lead': 'با آینه جوابش رو قبل از کوتاهی، روی عکس خودش می‌بینه و با خیال راحت وقت می‌گیره.',
        'f2': 'مدل رو می‌بینه', 'req': 'درخواست مدل مو',
        'demo_title': 'مدل مو رو روی عکس خودتون امتحان کنید.',
        'card': 'مدل مو رو قبل از کوتاهی روی چهرهٔ خودش می‌بینه.',
        'ben_title': 'آینه برای کار مدل مو چه کمکی می‌کنه؟', 'ben_sub': 'مشتری با انتخاب مشخص و بدون تردید سراغتون میاد.',
        'benefits': ['مشتری قبل از اومدن، مدل مو رو روی چهرهٔ خودش می‌بینه.',
                     'درخواستش با مدل انتخاب‌شده مستقیم به پنل یا ربات شما می‌رسه.',
                     'دیگه نیاز به توضیح طولانی نیست؛ مدل از قبل مشخصه.'],
        'sample_title': 'یه نمونهٔ قبل و بعد مدل مو',
        'cta_title': 'مدل مو رو همین الان روی عکس خودتون ببینید.',
    },
    'color': {
        'label': 'رنگ مو', 'path': '/color', 'pair': 'color', 'line': 'color',
        'title': 'برای متخصصان رنگ مو',
        'desc': 'مشتری رنگ مو رو قبل از شروع روی موهای خودش می‌بینه و مطمئن‌تر درخواست می‌ده. نمونه، پلن‌ها و روش کار.',
        'eyebrow': 'برای متخصصان رنگ مو',
        'h1': 'دیگه نمی‌شنوید «این اون رنگی نبود که فکر می‌کردم!»', 'accent': '',
        'lead': 'با آینه مشتری قبل از رنگ کردن، نتیجه رو روی موهای خودش می‌بینه و مطمئن انتخاب می‌کنه.',
        'f2': 'رنگ رو می‌بینه', 'req': 'درخواست رنگ مو',
        'demo_title': 'رنگ مو رو روی عکس خودتون امتحان کنید.',
        'card': 'رنگ مو رو قبل از رنگ کردن روی موهای خودش می‌بینه.',
        'ben_title': 'آینه برای کار رنگ مو چه کمکی می‌کنه؟', 'ben_sub': 'تردید و بحث «این نبود» قبل از شروع کار تموم می‌شه.',
        'benefits': ['مشتری رنگ دلخواهش رو قبل از شروع روی موهای خودش می‌بینه.',
                     'رنگ نهایی رو با هم روی تصویر دقیق انتخاب می‌کنید.',
                     'درخواست مشتری همراه با رنگ انتخاب‌شده مستقیم براتون می‌رسه.'],
        'sample_title': 'یه نمونهٔ قبل و بعد رنگ مو',
        'cta_title': 'رنگ مو رو همین الان روی عکس خودتون ببینید.',
    },
    'nails': {
        'label': 'ناخن', 'path': '/nails', 'pair': 'nails', 'line': 'nails',
        'title': 'برای متخصصان ناخن',
        'desc': 'مشتری طرح ناخن رو روی دست خودش می‌بینه و مطمئن‌تر درخواست می‌ده. نمونه، پلن‌ها و روش کار.',
        'eyebrow': 'برای متخصصان ناخن',
        'h1': 'مشتری عکس یه طرح از اینستاگرام نشونتون می‌ده ولی مطمئن نیست به دستش بیاد؟', 'accent': '',
        'lead': 'با آینه طرح رو قبل از کار روی دست خودش می‌بینه و بدون شک انتخاب می‌کنه.',
        'f2': 'طرح رو می‌بینه', 'req': 'درخواست طرح ناخن',
        'demo_title': 'طرح ناخن رو روی دست خودتون امتحان کنید.',
        'card': 'طرح ناخن رو قبل از کار روی دست خودش می‌بینه.',
        'ben_title': 'آینه برای کار ناخن چه کمکی می‌کنه؟', 'ben_sub': 'انتخاب طرح دیگه حدسی و زمان‌بر نیست.',
        'benefits': ['طرح ناخن رو قبل از کار روی دست خودش می‌بینه.',
                     'خیلی سریع‌تر و مطمئن‌تر تصمیم می‌گیره.',
                     'درخواستش همراه با طرح انتخاب‌شده مستقیم براتون می‌رسه.'],
        'sample_title': 'یه نمونهٔ قبل و بعد طرح ناخن',
        'cta_title': 'طرح ناخن رو همین الان روی دست خودتون ببینید.',
    },
    'lashes': {
        'label': 'مژه', 'path': '/lashes', 'pair': 'lashes', 'line': 'lashes',
        'title': 'برای متخصصان مژه',
        'desc': 'مشتری حالت مژه رو قبل از نوبت روی چشم خودش می‌بینه و مطمئن‌تر درخواست می‌ده. نمونه، پلن‌ها و روش کار.',
        'eyebrow': 'برای متخصصان مژه',
        'h1': 'مشتری از حجم و فرم مژه می‌ترسه و نمی‌تونه تصمیم بگیره؟', 'accent': '',
        'lead': 'با آینه حالت مژه رو قبل از نوبت روی چشم خودش می‌بینه و با خیال راحت وقت می‌گیره.',
        'f2': 'حالت رو می‌بینه', 'req': 'درخواست حالت مژه',
        'demo_title': 'حالت مژه رو روی عکس خودتون امتحان کنید.',
        'card': 'فرم و حجم مژه رو قبل از نوبت روی چشم خودش می‌بینه.',
        'ben_title': 'آینه برای کار مژه چه کمکی می‌کنه؟', 'ben_sub': 'نگرانی مشتری قبل از نوبت کاملاً برطرف می‌شه.',
        'benefits': ['حالت و حجم مژه رو قبل از نوبت روی چشم خودش می‌بینه.',
                     'تردید دربارهٔ فرم و پرپشتی مژه قبل از کار از بین می‌ره.',
                     'درخواستش با حالت انتخاب‌شده مستقیم براتون می‌رسه.'],
        'sample_title': 'یه نمونهٔ قبل و بعد مژه',
        'cta_title': 'حالت مژه رو همین الان روی عکس خودتون ببینید.',
    },
}
# The REAL before/after of each service ("نمونهٔ ساخته‌شده با آینه"). Filled only with a real,
# approved pair — {'before': 'assets/….webp', 'after': 'assets/….webp'}. While a service has no
# entry its page simply has no sample section; nothing is invented to fill the gap.
REAL_SAMPLES = {k: {'before': f'assets/sample-{k}-before.webp', 'after': f'assets/sample-{k}-after.webp'} for k in ('hair', 'color', 'nails', 'lashes')}  # owner's illustrative pairs, labelled «نمونهٔ نمایشی»
HINTS = {  # the first-chip hint under the demo's title; tryon.js writes the same texts on click
    'hair': 'یه عکس روبه‌رو با صورت کامل، بدون کلاه و عینک آفتابی، توی نور طبیعی.',
    'color': 'عکسی که موهاتون کامل و واضح توش دیده شه؛ نور زرد لامپ رنگ رو عوض می‌کنه.',
    'nails': 'پشت دست، انگشت‌ها کنار هم و همهٔ ناخن‌ها توی قاب، توی نور روز.',
    'lashes': 'از نزدیک و روبه‌رو، هر دو چشم باز و کامل توی قاب، بدون عینک.',
}
LINE_TITLE = {'hair': 'مدل مو', 'color': 'رنگ مو', 'nails': 'ناخن', 'lashes': 'مژه'}
LINE_PAIR = {'hair': 'style', 'color': 'color', 'nails': 'nails', 'lashes': 'lashes'}
HOME_NOTE = 'نمونهٔ نمایشی'
SERVICE_NOTE = 'نمونهٔ نمایشی؛ برای انتخاب قبل از نوبت.'
SALON_HERO = {
    'title': 'پنل آرایشگاه',
    'desc': 'پنل آرایشگاه: هر چهار خدمت برای ۳، ۸ یا ۲۰ نفر، لینک اختصاصی برای هر همکار. نمونه، قیمت‌ها و روش کار.',
    'eyebrow': 'پنل آرایشگاه',
    'h1': 'هر همکار، مشتری‌های خودش؛ همه توی یه صفحهٔ حرفه‌ای.',
    'lead': 'با آینه، کل تیمتون دقیقاً همون تصویری رو می‌بینه که مشتری انتخاب کرده.',
}
CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.6 2.6L16 9.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
# Three of the hairstyle models, shown on the second hero frame of every hairstyle hero.
PICKS = ('<span class="loop__picks" aria-hidden="true">'
         + ''.join('<img src="assets/look-s%s.webp" width="40" height="50" loading="lazy" alt="">' % n for n in ('02', '07', '12')) + '</span>')
SPARK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3 2.4 5.4L20 10.5l-5.6 2.1L12 18l-2.4-5.4L4 10.5l5.6-2.1Z"/></svg>'


def section(src, sid):
    """One <section id=…>…</section> from a source with no nested sections."""
    m = re.search(r'[ \t]*(?:<!--[^\n]*-->\s*)*<section id="' + re.escape(sid) + r'"[\s\S]*?</section>\n?', src)
    assert m, 'section ' + sid
    return m.group(0)


def keep_buttons(html, attr, keep):
    """Drop the tab buttons for other services; hide the tab row when one is left."""
    return re.sub(r'\s*<button type="button" class="[^"]*" ' + attr + r'="(\w+)"[\s\S]*?</button>',
                  lambda m: m.group(0) if m.group(1) in keep else '', html)


def nav(items):
    # The first in-page item starts underlined; the scrollspy moves it with the reader.
    return ''.join('<a href="%s">%s</a>' % (h_, t) for h_, t in items)


def mobile(items):
    return (''.join('<a href="%s">%s<span aria-hidden="true">←</span></a>' % (h_, t) for h_, t in items)
            + '<a class="btn" href="#salon-example">ساخت پیش‌نمایش رایگان</a>'
            + '<a class="mobile-menu__panel" href="/panel">ورود به پنل سالن‌داران<span aria-hidden="true">←</span></a>')


def shell(h, main, items, home=False, service='', title='', desc='', tab=''):
    """Swap the <main>, the menus and the head texts of the full page."""
    out = re.sub(r'<main id="main">[\s\S]*?</main>', lambda m: '<main id="main">\n' + main + '\n</main>', h, count=1)
    out = re.sub(r'(<nav class="nav" aria-label="ناوبری اصلی">)[\s\S]*?(</nav>)', lambda m: m.group(1) + nav(items) + m.group(2), out, count=1)
    out = re.sub(r'(<nav id="mobile-menu"[^>]*>)[\s\S]*?(</nav>)', lambda m: m.group(1) + mobile(items) + m.group(2), out, count=1)
    if not home:
        out = out.replace('<a class="brand" href="#intro" aria-label="آینه، بازگشت به ابتدای صفحه">', '<a class="brand" href="/" aria-label="آینه، صفحهٔ اصلی">', 1)
    if service:
        out = out.replace('<body>', '<body data-service="' + service + '">', 1)
    if title:
        out = re.sub(r'<title>.*?</title>', '<title>' + title + ' | آینه</title>', out, count=1)
        out = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + title, out, count=1)
    if desc:
        out = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + desc, out, count=1)
        out = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + desc, out, count=1)
    if tab:
        out = out.replace('<section id="services" class="section section--soft pricing"', '<section id="services" data-default-tab="' + tab + '" class="section section--soft pricing"', 1)
    # An in-page link to a section this page does not carry goes to the home page.
    ids = set(re.findall(r'\bid="([\w-]+)"', out))
    out = re.sub(r'href="#([\w-]+)"', lambda m: m.group(0) if m.group(1) in ids else 'href="/#' + m.group(1) + '"', out)
    return out


def make_pages(full):
    src = full
    home_src, service_src, salon_src = R('src/home.html'), R('src/service.html'), R('src/salon.html')
    topup = lambda t: t.replace('{{TOPUP_IMAGES}}', fa_int(TOPUP_IMAGES)).replace('{{TOPUP_PRICE}}', fa_int(TOPUP_AMOUNT // 1000))
    pricing_src, faq = section(src, 'services'), topup(section(home_src, 'faq'))
    assert all(SERVICE_TITLES[k] == LINE_TITLE[k] == SERVICES[k]['label'] for k in SERVICES), 'one name per service'

    def pricing_for(tabs, selected):
        """The price section with one panel per tab (src/copy.js switches them). The page's own
        tab is selected in the HTML; with a single tab the row stays hidden."""
        out = pricing_src.replace('<!--PLANPANELS-->', plans_block(tabs, selected))
        for k in ['hair', 'color', 'nails', 'lashes', 'salon']:
            m = re.search(r'\s*<button type="button" role="tab" id="ptab-' + k + r'"[^>]*>([^<]*)</button>', out)
            btn = m.group(0)
            assert m.group(1) == SERVICE_TITLES['all' if k == 'salon' else k], 'tab label is the checkout title: ' + k
            if k in PLAN_TABS:
                out = out.replace(btn, btn.replace('aria-controls="plans-' + k + '"', 'aria-controls="plans-single"'), 1)
                btn = btn.replace('aria-controls="plans-' + k + '"', 'aria-controls="plans-single"')
            if k not in tabs:
                out = out.replace(btn, '', 1)
            elif k == selected:
                out = out.replace(btn, btn.replace('aria-selected="false" tabindex="-1"', 'aria-selected="true" tabindex="0"'), 1)
        if len(tabs) > 1:
            out = out.replace('<div class="ptabs" data-ptabs hidden>', '<div class="ptabs" data-ptabs>', 1)
        assert '<!--PLANPANELS-->' not in out and out.count('data-plans-panel="') == bool(set(tabs) & set(PLAN_TABS)) + ('salon' in tabs)
        return out
    pricing = teaser('home')  # pricing v2: the cards live on /pricing (pricing_main)
    chat_tpl = R('src/chat.html')
    chat = lambda pair, req: chat_tpl.replace('{{PAIR}}', pair).replace('{{REQ}}', req)

    def hero(pair, eyebrow, h1, accent, lead, f2, req, note, cls='', perks=''):
        return (R('src/hero.html').replace('{{HERO_CLASS}}', cls).replace('{{EYEBROW}}', eyebrow)
                .replace('{{H1}}', h1).replace('{{ACCENT}}', accent).replace('{{LEAD}}', lead)
                .replace('{{HERO_PERKS}}', perks)
                .replace('{{MAIN_BTN}}', 'روی عکس خودم امتحان کنم').replace('{{PAIR}}', pair)
                .replace('{{F2}}', f2).replace('{{NOTE}}', note).replace('{{CHAT}}', chat(pair, req))
                .replace('{{PICKS}}', PICKS if pair == 'style' else ''))

    def demo(lines, title, sub, first, foot=True):
        d = R('src/tryon.html')
        if first in ('nails', 'lashes'):
            d = d.replace('با عکس روبه‌رو و پرنور', 'با عکس واضح و پرنور')
        if len(lines) == 1:
            d = keep_buttons(d, 'data-line', lines)
            d = d.replace('<div class="tryon__lines"', '<div class="tryon__lines" hidden', 1)
        if not title:  # the /try page already opens with its own title and three steps
            d = re.sub(r'\s*<div class="head">[\s\S]*?</div>', '', d, count=1)
        if not foot:
            d = re.sub(r'\s*<small>عکس شما فقط برای ساخت نمونه و دیدنِ سالن استفاده می‌شود\.</small>', '', d, count=1)
            d = re.sub(r'\s*<div class="tryon__foot">[\s\S]*?</div>\s*(?=</div>\s*</div>\s*</section>)', '', d, count=1)
        return (d.replace('{{DEMO_TITLE}}', title).replace('{{DEMO_SUB}}', sub)
                .replace('{{FIRST_PAIR}}', LINE_PAIR[first]).replace('{{FIRST_LABEL}}', LINE_TITLE[first])
                .replace('{{FIRST_HINT}}', HINTS[first]))

    def cta(title):
        return (section(home_src, 'cta').replace('{{CTA_TITLE}}', title)
                .replace('{{CTA_SUB}}', 'بدون نصب، روی گوشی.'))

    def card(key, s):
        p, lab = s['pair'], s['label']
        return (
            '        <article class="sample-card">\n'
            '          <div class="compare" aria-label="نمونهٔ نمایشی قبل و بعد: %s">\n'
            '            <img class="compare__img compare__img--before" src="assets/demo-%s-before.webp" width="450" height="600" loading="lazy" decoding="async" alt="">\n'
            '            <img class="compare__img compare__img--after" src="assets/demo-%s-after.webp" width="450" height="600" loading="lazy" decoding="async" alt="">\n'
            '            <span class="compare__badge">نمونهٔ نمایشی</span>\n'
            '            <span class="compare__tag compare__tag--before">قبل</span>\n'
            '            <span class="compare__tag compare__tag--after">بعد</span>\n'
            '            <span class="compare__divider" aria-hidden="true"></span>\n'
            '            <span class="compare__knob compare__knob--sm" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 8 5 12l4 4m6-8 4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>\n'
            '            <input class="compare__range" type="range" min="0" max="100" value="50" dir="rtl" aria-label="جابه‌جا کردن خط مقایسهٔ %s">\n'
            '          </div>\n'
            '          <div class="sample-card__body"><b>%s</b><p>%s</p><a class="btn" href="%s">امتحان و قیمت</a></div>\n'
            '        </article>') % (lab, p, p, lab, lab, s['card'], s['path'])

    def glance_card(key, s):
        return ('        <a class="glance__card" href="%s"><img src="assets/demo-%s-after.webp" width="450" height="600" loading="lazy" decoding="async" alt="نمونهٔ نمایشی: %s روی عکس مشتری">'
                '<span><b>%s</b><small>%s</small></span></a>') % (s['path'], s['pair'], s['label'], s['label'], s['card'])

    # ---- home ----
    # The home hero shows one woman in three combined looks (hairstyle + colour + lashes + nails),
    # so a visitor sees at once that every service is covered (owner's decision). 5 frames, 15 s.
    def svc(h):
        # Home hero: every service gets two frames (before / after), 8 frames, 3 s each = 24 s.
        names = {'style': 'مدل مو', 'color': 'رنگ مو', 'lashes': 'مژه', 'nails': 'ناخن'}
        figs = []
        for pair in ('style', 'color', 'lashes', 'nails'):
            for kind, cap in (('before', 'عکس مشتری'), ('after', 'نتیجهٔ نمایشی')):
                n = len(figs)
                pri = ' fetchpriority="high"' if n == 0 else ''
                figs.append(('<figure class="loop__f loop__s%d"><img src="assets/demo-%s-%s.webp" width="450" height="600" loading="eager"%s decoding="async" alt="نمونهٔ نمایشی: %s، %s">'
                             '<figcaption>%s: %s</figcaption></figure>') % (n, pair, kind, pri, names[pair], cap, names[pair], cap))
        h = re.sub(r'(<div class="loop__screen">)[\s\S]*?(</div>\s*<button class="loop__toggle"[\s\S]*?</button>\s*<ol class="loop__dots")', lambda m: m.group(1) + ''.join(figs) + m.group(2), h, count=1)
        h = h.replace('hero-stage loop"', 'hero-stage loop loop--svc"').replace('سه قاب پشت‌سرهم', 'هشت قاب پشت‌سرهم')
        return h.replace('<li></li><li></li><li></li>', '<li></li>' * 8)
    def mix(h):
        f1 = re.search(r'<figure class="loop__f loop__f--1">[\s\S]*?</figure>', h).group(0)
        f2 = re.search(r'<figure class="loop__f loop__f--2">[\s\S]*?</figure>', h).group(0)
        f3 = re.search(r'<figure class="loop__f loop__f--3">', h).group(0)
        cap1 = re.search(r'<figcaption>[\s\S]*?</figcaption>', f1).group(0)
        new1 = ('<figure class="loop__f loop__f--1">\n                <img src="assets/hero-mix-0.webp" width="450" height="600" fetchpriority="high" decoding="async" alt="نمونهٔ نمایشی از عکس مشتری">\n                ' + cap1 + '\n              </figure>')
        looks = ['مدل مو، رنگ، مژه و ناخن', 'مدل و رنگ دیگر، مژه و ناخن دیگر', 'یک ترکیب دیگر']
        new2 = ''.join(
            '\n              <figure class="loop__f loop__f--m%d">\n                <img src="assets/hero-mix-%d.webp" width="450" height="600" decoding="async" alt="نمونهٔ نمایشی: ترکیب مدل مو، رنگ مو، مژه و ناخن روی عکس مشتری">\n                <figcaption>%s%s</figcaption>\n              </figure>' % (i, i, SPARK, looks[i - 1])
            for i in (1, 2, 3))
        h = h.replace(f1, new1).replace(f2, new2.strip()).replace(f3, '<figure class="loop__f loop__f--3 loop__f--m4">')
        h = h.replace('hero-stage loop"', 'hero-stage loop loop--mix"').replace('سه قاب پشت‌سرهم', 'پنج قاب پشت‌سرهم')
        return h.replace('<li></li><li></li><li></li>', '<li></li><li></li><li></li><li></li><li></li>')
    def stopmotion_hero(h):
        stage = (
            '<div class="hero-stage hero-stage--video" role="group" aria-label="نمایش زندهٔ آینه: امتحان چهار خدمت روی عکس واقعی">'
            '<div class="hero-stage__bar">'
            '<div class="hero-stage__chips" role="tablist" aria-label="خدمت‌های داخل نمایش">'
            '<button type="button" role="tab" class="hero-stage__chip is-active" data-seek="0" data-end="4.28" aria-selected="true">مدل مو</button>'
            '<button type="button" role="tab" class="hero-stage__chip" data-seek="4.28" data-end="8.64" aria-selected="false">رنگ مو</button>'
            '<button type="button" role="tab" class="hero-stage__chip" data-seek="8.64" data-end="12.96" aria-selected="false">مژه</button>'
            '<button type="button" role="tab" class="hero-stage__chip" data-seek="12.96" data-end="19" aria-selected="false">ناخن</button>'
            '</div>'
            '</div>'
            '<div class="phone-showcase">'
            '<div class="phone-frame">'
            '<span class="phone-frame__speaker" aria-hidden="true"></span>'
            '<video class="hero-video" src="/assets/aistudio/stopmotion_2406fb10.mp4" poster="assets/hero-stopmotion-poster.webp" width="640" height="1386" autoplay muted loop playsinline preload="auto"></video>'
            '</div>'
            '<div class="hero-stage__prog" aria-hidden="true"><span class="hero-stage__fill"></span></div>'
            '</div>'
            '</div>'
        )
        out = re.sub(r'<div class="hero-stage loop"[\s\S]*?</p>\s*</div>(?=\s*</div>\s*</div>)', stage, h, count=1)
        assert 'hero-stage--video' in out, 'hero stage replaced'
        return out
    home_studio = re.sub(r'\s*<ol class="sb-steps"[\s\S]*?</ol>', '', studio, count=1)
    assert 'sb-steps' not in home_studio and 'پیش‌نمایش وب‌سایت خودتون رو ببینید' in home_studio
    home_perks = (
        '          <ul class="hero-perks" aria-label="مزایای آینه">\n'
        '            <li class="hero-perk"><span class="hero-perk__ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M3 9h18M7.5 14h5" stroke-linecap="round"/></svg></span><div><b>وب‌سایت اختصاصی به نام شما</b><span>با مشخصات و نمونه‌کارهای خودتون.</span></div></li>\n'
        '            <li class="hero-perk"><span class="hero-perk__ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" stroke-linecap="round"/><circle cx="10" cy="8.5" r="3.5"/><path d="M19 8v6M16 11h6" stroke-linecap="round"/></svg></span><div><b>جذب مشتری جدید با هر عکس</b><span>اسم و لوگوی شما روی خروجی ثبت می‌شه.</span></div></li>\n'
        '            <li class="hero-perk"><span class="hero-perk__ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3.5V6.5M16 3.5V6.5M8.5 13l2.2 2.2 4.8-4.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><b>رزرو راحت‌تر، مشتری بیشتر</b><span>مشتری با انتخاب قطعی سراغتون میاد.</span></div></li>\n'
        '          </ul>\n'
    )
    home_main = (
        stopmotion_hero(hero('style', '', 'با آینه دیگه نیازی به حدس زدن نیست!', 'شما دقیقا میدونید کدوم مدل به مشتریانتون میاد',
             'مشتری‌هاتون هر مدلی رو قبل از نوبت روی چهره و دست خودشون می‌بینن و بدون تردید ازتون وقت می‌گیرن.',
             'مدل رو می‌بینه', 'درخواست مدل مو', HOME_NOTE, perks=home_perks))
        + demo(list(LINE_TITLE), 'خودتون <em>امتحان کنید!</em>', 'عکستون رو بذارید و همین الان مدل رو روی چهرهٔ خودتون ببینید.', 'hair', foot=False)
        + section(home_src, 'choose').replace('{{CARDS}}', NL.join(card(k, s) for k, s in SERVICES.items()))
        + section(home_src, 'flow')
        + home_studio
        + pricing + R('src/pay.html') + faq
    )
    home_nav = [('#choose', 'خدمات'), ('#services', 'تعرفه‌ها'), ('#faq', 'سؤالات')]
    other_nav = [('/#choose', 'خدمات'), ('#services', 'تعرفه‌ها'), ('/#faq', 'سؤالات')]
    pages = {'home': shell(full, home_main, home_nav, home=True, tab='hair')}

    # ---- the four service pages, one template ----
    for key, s in SERVICES.items():
        back = '          <a class="hero-back" href="/"><span aria-hidden="true">→</span> آینه · همهٔ خدمات</a>\n          <span class="eyebrow">' + s['eyebrow'] + '</span>\n'
        real = REAL_SAMPLES.get(key)
        sample = (section(service_src, 'sample').replace('{{SAMPLE_TITLE}}', s['sample_title'])
                  .replace('{{REAL_BEFORE}}', real['before']).replace('{{REAL_AFTER}}', real['after'])) if real else ''
        ben = section(service_src, 'benefits')
        ben = (ben.replace('{{BEN_TITLE}}', s['ben_title']).replace('{{BEN_SUB}}', s['ben_sub']).replace('{{PAIR}}', s['pair']).replace('{{LABEL}}', s['label'])
               .replace('{{BENEFITS}}', NL.join('            <li>' + CHECK + b + '</li>' for b in s['benefits'])))
        play = ''
        if key == 'hair':
            # The mirror on a sample face stays on the hairstyle page only, as the first of two tabs.
            play = ('<div class="try-switch band" id="trySwitch" role="tablist" aria-label="دو راه امتحان" hidden>'
                    '<button type="button" role="tab" data-try="play" aria-selected="true">روی چهرهٔ نمونه <small>بدون عکس</small></button>'
                    '<button type="button" role="tab" data-try="demo" aria-selected="false">روی عکس خودتون <small>با عکس شما</small></button></div>\n') + R('src/play.html')
        main = (hero(s['pair'], back, s['h1'], s['accent'], s['lead'], s['f2'], s['req'], SERVICE_NOTE, ' hero--service')
                + play + demo([s['line']], s['demo_title'], 'بدون نصب، روی گوشی.', s['line'])
                + sample + ben + studio + teaser(key) + R('src/pay.html') + cta(s['cta_title']))
        pages[key] = shell(full, main, other_nav, service=key, title=s['title'], desc=s['desc'], tab=key)

    # ---- the salon panel ----
    S = SALON_HERO
    back = '          <a class="hero-back" href="/"><span aria-hidden="true">→</span> آینه · همهٔ خدمات</a>\n          <span class="eyebrow">' + S['eyebrow'] + '</span>\n'
    salon_pricing = teaser('salon')
    salon_main = (
        hero('style', back, S['h1'], '', S['lead'], 'مدل رو می‌بینه', 'درخواست مدل مو', HOME_NOTE, ' hero--service')
        + section(salon_src, 'glance').replace('{{GLANCE}}', NL.join(glance_card(k, s) for k, s in SERVICES.items()))
        + section(salon_src, 'team')
        + demo(list(LINE_TITLE), 'خودتون <em>امتحان کنید!</em>', 'عکستون رو بذارید و همین الان مدل رو روی چهرهٔ خودتون ببینید.', 'hair')
        + studio + section(salon_src, 'bundle') + salon_pricing + R('src/pay.html')
        + cta('کل تیمتون روی یه تصویر دقیق با مشتری هماهنگ می‌شه.')
    )
    pages['salon'] = shell(full, salon_main, other_nav, service='salon', title=S['title'], desc=S['desc'], tab='salon')

    # ---- ساخت نمونه: the demo on a page of its own (for links from reels and the service pages) ----
    try_main = R('src/try.html') + demo(list(LINE_TITLE), '', '', 'hair')
    pages['sample'] = shell(full, try_main, [('/#choose', 'خدمات'), ('/#services', 'تعرفه‌ها'), ('/#faq', 'سؤالات')],
                         title='ساخت نمونه', desc='خدمت را انتخاب کنید، عکس روبه‌رو و روشن بگذارید و مدل را روی خودتان ببینید؛ یک نمونه برای انتخاب قبل از نوبت.')
    for k, v in pages.items():
        assert v.count('<main id="main">') == 1, k
        assert 'id="demo"' in v and 'id="h1"' in v, k
    for k in ['home', *SERVICES, 'salon']:
        assert 'id="services"' in pages[k] and 'id="pay"' in pages[k] and 'id="salon-example"' in pages[k], k
    assert 'id="choose"' in pages['home'] and 'id="faq"' in pages['home']
    for k in [*SERVICES, 'salon', 'sample']:
        assert 'id="choose"' not in pages[k] and 'id="faq"' not in pages[k], k
    for old in ('۱۹ مدل', '۷ رنگ'):
        assert all(old not in v for v in pages.values()), old
    return pages




# ---------------- /pricing «خرید اشتراک و اعتبار» (pricing v2) ----------------
# One page for both paths, drawn only from IMAGE_PRICES / SUBS / SUB_PACKS above. Every buy button
# carries what to buy (kind, line, count / sub / pack) — never an amount the server would trust:
# worker/orders.js quote() prices it again from worker/prices.js. src/pricing.js switches the
# service tabs, runs the calculator and knows a signed-in panel; src/pay.js is the same checkout.
def toman(n):
    return format(int(n), ',').replace(',', '٬').translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))


V2_TABS = LINE_ORDER + ['salon']
V2_LABEL = {'hair': 'مدل مو', 'color': 'رنگ مو', 'nails': 'ناخن', 'lashes': 'مژه', 'salon': 'آرایشگاه'}
# What a subscription adds over «فقط ساخت تصویر» — only features the code has today (worker/plans.js
# FEATURES: page, gallery, inbox, bot, booking, report_simple/full, archive, priority_support; the
# team links are worker/referral.js, salon subscription only). The beauty consultant runs only on
# Ayneh's own studio, so it is not listed. Bale removed (Nov 2026); WhatsApp = wa.me messages.
V2_FEATURES = [
    ('ساخت تصویر روی عکس مشتری', True, True),
    ('صفحهٔ اختصاصی با نمونه‌کارهای شما', False, True),
    ('اعتبار تصویر به اندازهٔ نصف مبلغ اشتراک', False, True),
    ('درخواست مشتری در پنل و ربات تلگرام', False, True),
    ('ثبت نوبت با پیام آمادهٔ تأیید و یادآوری در واتس‌اپ', False, True),
    ('اشتراک آرایشگاه: سقف اعتبار هر همکار و خرید اعتبار اضافه برایش', False, True),
    ('گزارش عملکرد و آرشیو مشتریان با خروجی اکسل', False, True),
    ('پشتیبانی ویژه از داخل پنل', False, True),
]
ARROW = '<span aria-hidden="true">←</span>'


def v2_buy(label, title, amount, cls='btn', **data):
    attrs = ''.join(' data-%s="%s"' % (k.replace('_', '-'), v) for k, v in data.items())
    return ('<button type="button" class="%s pr-buy" data-buy="v2" data-title="%s" data-amount="%d"%s>%s</button>'
            % (cls, title, amount, attrs, label))


def v2_images(line):
    p, lab = IMAGE_PRICES[line], V2_LABEL[line]
    cards = []
    for n, a in sorted(p['packs'].items()):
        cards.append(
            '<article class="plan pr-card">'
            + '<h3>' + fa_int(n) + ' عکس</h3>'
            + '<div class="plan__price"><p class="plan__amount"><b>' + toman(a) + '</b> تومان</p>'
            + '<p class="pr-each">هر عکس ' + toman(a // n) + ' تومان</p></div>'
            + '<p class="pr-save">' + fa_int(PACK_SAVE[n]) + '٪ ارزان‌تر از تکی</p>'
            + v2_buy('خرید', fa_int(n) + ' عکس ' + lab, a, kind='images', line=line, count=n)
            + '</article>')
    custom = ('<div class="pr-custom" data-custom="' + line + '">'
              '<label for="prCount-' + line + '">تعداد دلخواه <small>هر عکس ' + toman(p['single']) + ' تومان</small></label>'
              '<div class="pr-step"><button type="button" class="pr-step__btn" data-step="-1" aria-label="یکی کمتر">−</button>'
              '<input id="prCount-' + line + '" type="number" inputmode="numeric" min="1" max="' + str(CUSTOM_MAX) + '" value="1" dir="ltr">'
              '<button type="button" class="pr-step__btn" data-step="1" aria-label="یکی بیشتر">+</button></div>'
              '<b class="pr-custom__sum" aria-live="polite">' + toman(p['single']) + ' تومان</b>'
              + v2_buy('خرید', fa_int(1) + ' عکس ' + lab, p['single'], cls='btn btn--ghost', kind='images', line=line, count=1, single=p['single'], packs=json.dumps(p['packs']).replace('"', '&quot;'))
              + '</div>')
    return ('<div class="pr-path" data-path="images">'
            '<div class="pr-path__head"><span class="pr-num" aria-hidden="true">۱</span><div>'
            '<h2>فقط ساخت تصویر</h2>'
            '<p>بدون اشتراک: فقط ساخت تصویر «' + lab + '» روی عکس مشتری. صفحهٔ اختصاصی، ربات، نوبت‌دهی و گزارش ندارد. اعتبارش هیچ‌وقت منقضی نمی‌شود.</p>'
            '</div></div>'
            '<div class="plans pr-cards">' + ''.join(cards) + '</div>' + custom + '</div>')


def v2_sub(line):
    sub = next(x for x in SUBS if x['line'] == line)
    lab, packs = V2_LABEL[line], SUB_PACKS[line]
    # No «subscription only» (owner, Nov 2026): every subscription comes with images, and half its
    # price comes back as image credit on top (worker/credits.js applyOrder).
    gift = SUB_GIFT_IMAGES[line]
    opts = [(n, sub['amount'] + a, STYLIST_TIERS[n], 'اشتراک + ' + fa_int(n) + ' عکس · هر عکس ' + toman(a // n) + ' تومان') for n, a in sorted(packs.items())]
    cards = []
    for n, total, name, each in opts:
        title = sub['name'] + ' + بستهٔ ' + fa_int(n) + ' عکس'
        top = n == max(packs)
        cards.append(
            '<article class="plan pr-card' + (' plan--lead' if top else '') + '">'
            + ('<span class="plan__badge">' + CROWN + 'به‌صرفه‌تر برای کار زیاد</span>' if top else '')
            + '<h3>' + name + '</h3>'
            + '<div class="plan__price"><p class="plan__amount"><b>' + toman(total) + '</b> تومان</p>'
            + '<p class="pr-each">' + each + '</p></div>'
            + '<ul><li>' + TICK + '<span>' + fa_int(n) + ' عکس + ' + fa_int(gift) + ' عکس هدیه (نصف مبلغ اشتراک)</span></li>'
            + '<li>' + TICK + '<span>همهٔ امکانات پنل، یک ماه</span></li>'
            + ('<li>' + TICK + '<span><b>جذب مشتری و تبلیغات شما</b> به کاربران عادی آینه</span></li>' if top else '') + '</ul>'
            + v2_buy('خرید', title, total, kind='sub', sub=sub['key'], pack=n)
            + '</article>')
    alone = ''.join(
        '<article class="plan pr-card pr-card--mini"><h3>بستهٔ ' + fa_int(n) + ' عکس</h3>'
        '<div class="plan__price"><p class="plan__amount"><b>' + toman(a) + '</b> تومان</p><p class="pr-each">هر عکس ' + toman(a // n) + ' تومان</p></div>'
        + v2_buy('خرید', 'بستهٔ ' + fa_int(n) + ' عکس ' + lab, a, kind='pack', line=line, pack=n) + '</article>'
        for n, a in sorted(packs.items()))
    return ('<div class="pr-path pr-path--sub" data-path="sub">'
            '<div class="pr-path__head"><span class="pr-num" aria-hidden="true">۲</span><div>'
            '<h2>اشتراک ماهانه</h2>'
            '<p>«' + sub['name'] + '» ماهی <b>' + toman(sub['amount']) + ' تومان</b>: همهٔ امکانات پنل برای «' + lab + '»، و عکس‌ها در بسته‌های مشترکان ارزان‌تر. هر چه بستهٔ بزرگ‌تر، هر عکس ارزان‌تر.</p>'
            '</div></div>'
            '<div class="pr-subscriber" data-subscriber="' + line + '" hidden><p class="pr-subscriber__note">اشتراک شما فعال است؛ بستهٔ عکس را جدا بخرید:</p>'
            '<div class="plans pr-cards pr-cards--3">' + alone + '</div></div>'
            '<div class="plans pr-cards pr-cards--3">' + ''.join(cards) + '</div>'
            '<p class="pr-fine">مشترک‌ها بسته‌های ۵، ۱۰ و ۲۰ عکسیِ «فقط ساخت تصویر» را هم می‌توانند بخرند. تمدید خودکار ندارد.</p></div>')


def v2_salon():
    salon_subs = [x for x in SUBS if x['line'] == 'all']
    pack_opts = '<option value="">بدون بستهٔ اضافه</option>' + ''.join(
        '<option value="%s:%d" data-add="%d">%s عکس %s · %s تومان</option>' % (k, n, a, fa_int(n), V2_LABEL[k], toman(a))
        for k in LINE_ORDER for n, a in sorted(SUB_PACKS[k].items()))
    cards = []
    for x in salon_subs:
        sid = 'prPack-' + x['key']
        top = x is salon_subs[-1]
        cards.append(
            '<article class="plan pr-card' + (' plan--lead' if top else '') + '">'
            + ('<span class="plan__badge">' + CROWN + 'بیشترین مشتری</span>' if top else '')
            + '<h3>' + SALON_TIERS[x['seats']] + '</h3><p class="pr-each">تا ' + fa_int(x['seats']) + ' نفر</p>'
            + '<div class="plan__price"><p class="plan__amount"><b>' + toman(x['amount']) + '</b> تومان</p><p class="pr-each">در ماه، برای کل سالن</p></div>'
            + '<ul><li>' + TICK + '<span>هر چهار خدمت: مدل مو، رنگ مو، ناخن و مژه</span></li>'
            + '<li>' + TICK + '<span>' + fa_int(x['seats']) + ' کاربر با خود مدیر؛ لینک اختصاصی برای هر همکار</span></li>'
            + '<li>' + TICK + '<span>' + toman(x['amount'] // 2) + ' تومان اعتبار تصویر هدیه (نصف مبلغ) برای هر خدمتی</span></li>'
            + ('<li>' + TICK + '<span><b>جذب مشتری و تبلیغات شما</b> به کاربران عادی آینه</span></li>' if top else '') + '</ul>'
            + '<label class="pr-pick" for="' + sid + '"><span>بستهٔ عکس همراه <small>اختیاری</small></span><select id="' + sid + '">' + pack_opts + '</select></label>'
            + v2_buy('خرید', x['name'], x['amount'], kind='sub', sub=x['key'], pack_select=sid)
            + '</article>')
    alone = ''.join(
        '<div class="pr-subscriber__row"><b>' + V2_LABEL[k] + '</b>' + ''.join(
            v2_buy(fa_int(n) + ' عکس · ' + toman(a), 'بستهٔ ' + fa_int(n) + ' عکس ' + V2_LABEL[k], a, cls='btn btn--ghost btn--sm', kind='pack', line=k, pack=n)
            for n, a in sorted(SUB_PACKS[k].items())) + '</div>' for k in LINE_ORDER)
    path1 = ('<div class="pr-path" data-path="images"><div class="pr-path__head"><span class="pr-num" aria-hidden="true">۱</span><div>'
             '<h2>فقط ساخت تصویر</h2><p>بدون اشتراک، برای هر خدمت جدا. خدمت را انتخاب کنید تا بسته‌هایش را ببینید:</p></div></div>'
             '<div class="pr-goto">' + ''.join('<button type="button" class="btn btn--ghost btn--sm" data-goto="%s">%s <small>هر عکس از %s تومان</small></button>'
                                               % (k, V2_LABEL[k], toman(min(a_ // n for n, a_ in IMAGE_PRICES[k]['packs'].items()))) for k in LINE_ORDER) + '</div></div>')
    return (path1 + '<div class="pr-path pr-path--sub" data-path="sub">'
            '<div class="pr-path__head"><span class="pr-num" aria-hidden="true">۲</span><div>'
            '<h2>اشتراک ماهانهٔ آرایشگاه</h2>'
            '<p>همهٔ امکانات پنل برای هر چهار خدمت و کل تیم. عکس‌ها را برای هر خدمت جدا، با قیمت مشترکان می‌خرید.</p>'
            '</div></div>'
            '<div class="pr-subscriber" data-subscriber="all" hidden><p class="pr-subscriber__note">اشتراک شما فعال است؛ بستهٔ عکس هر خدمت را جدا بخرید:</p>' + alone + '</div>'
            '<div class="plans pr-cards">' + ''.join(cards) + '</div>'
            '<p class="pr-fine">تمدید خودکار ندارد.</p></div>')


def v2_compare():
    rows = ''.join('<tr><th scope="row">%s</th><td>%s</td><td class="is-lead">%s</td></tr>'
                   % (f, '<span class="pr-yes">' + TICK + '<span class="sr-only">دارد</span></span>' if a else '<span class="pr-no">—<span class="sr-only">ندارد</span></span>',
                      '<span class="pr-yes">' + TICK + '<span class="sr-only">دارد</span></span>' if b else '—') for f, a, b in V2_FEATURES)
    rows += ('<tr><th scope="row">قیمت هر عکس</th><td data-cmp="images">—</td><td class="is-lead" data-cmp="sub">—</td></tr>'
             '<tr data-cmp-salon hidden><th scope="row">همکاران</th><td>—</td><td class="is-lead">لینک اختصاصی برای هر همکار</td></tr>')
    return ('<div class="pr-compare"><h2 class="pr-h">با اشتراک چه چیزی اضافه می‌گیرم؟</h2>'
            '<div class="pcompare"><table><caption class="sr-only">مقایسهٔ فقط ساخت تصویر و اشتراک ماهانه</caption>'
            '<thead><tr><th scope="col"></th><th scope="col">فقط ساخت تصویر</th><th scope="col" class="is-lead">اشتراک ماهانه</th></tr></thead>'
            '<tbody>' + rows + '</tbody></table></div></div>')


CALC = ('<div class="pr-calc" id="prCalc"><h2 class="pr-h">ماهی چند عکس می‌سازی؟</h2>'
        '<div class="pr-calc__in"><input id="prCalcN" type="range" min="5" max="300" step="5" value="40" aria-label="تعداد عکس در ماه">'
        '<output id="prCalcOut" for="prCalcN">۴۰ عکس</output></div>'
        '<div class="pr-calc__res"><p data-calc="images"><span>فقط ساخت تصویر</span><b>—</b></p><p data-calc="sub"><span>اشتراک ماهانه با عکس‌ها</span><b>—</b></p></div>'
        '<p class="pr-calc__verdict" id="prCalcVerdict" aria-live="polite"></p>'
        '<p class="pr-fine">ارزان‌ترین ترکیب بسته‌ها برای همین تعداد حساب شده؛ مبلغ نهایی را سرور از جدول قیمت حساب می‌کند.</p></div>')


def pricing_main():
    tabs = ''.join('<button type="button" role="tab" id="prtab-%s" data-ptab="%s" aria-controls="prpanel-%s" aria-selected="%s" tabindex="%s">%s</button>'
                   % (k, k, k, 'true' if k == 'hair' else 'false', '0' if k == 'hair' else '-1', V2_LABEL[k]) for k in V2_TABS)
    panels = ''.join('<div class="pr-panel" id="prpanel-%s" role="tabpanel" aria-labelledby="prtab-%s" data-panel="%s"%s>%s</div>'
                     % (k, k, k, '' if k == 'hair' else ' hidden', (v2_images(k) + v2_sub(k)) if k != 'salon' else v2_salon()) for k in V2_TABS)
    data = {'images': IMAGE_PRICES, 'subs': {x['line']: x['amount'] for x in SUBS if x['line'] != 'all'}, 'subPacks': SUB_PACKS}
    how = ('<div class="plan-how"><h3>بعد از پرداخت چی می‌شه؟</h3><ol>'
           '<li><span>۱</span><div><b>کارت‌به‌کارت می‌کنید</b><p>مبلغ و شمارهٔ کارت همین‌جا نشون داده می‌شه و ۱۰ دقیقه برای واریز وقت دارید.</p></div></li>'
           '<li><span>۲</span><div><b>پرداخت خودکار تأیید می‌شه</b><p>نیازی به ارسال فیش یا منتظر موندن برای تأیید نیست.</p></div></li>'
           '<li><span>۳</span><div><b>اعتبار یا اشتراک فوراً فعال می‌شه</b><p>اگه اولین خریدتونه، لینک صفحه و اطلاعات ورود به پنل همین‌جا نمایش داده می‌شه.</p></div></li>'
           '</ol></div>')
    return ('<section id="pricing" class="section pricing pr" aria-labelledby="h1">\n<div class="band">'
            '<div class="head"><span class="eyebrow">خرید اشتراک و اعتبار</span>'
            '<h1 id="h1" class="h2">هر عکس رو جدا بخرید، یا با اشتراک <em>ارزون‌تر</em>.</h1>'
            '<p class="sub">خدمتتون رو انتخاب کنید؛ پرداخت کارت‌به‌کارته، خودکار تأیید می‌شه و تمدید خودکار نداره.</p></div>'
            '<p class="pr-signed" id="prSigned" hidden></p>'
            '<div class="pr-free" id="prFree"><p><b>هنوز ثبت‌نام نکرده‌اید؟</b> با نام و موبایل ثبت‌نام کنید و <b>۳ تصویر رایگان</b> روی عکس مشتری‌هایتان بسازید.</p>'
            '<button type="button" class="btn" id="prFreeBtn">ثبت‌نام رایگان</button></div>'
            '<p class="pr-free pr-free--out" id="prFreeOut" hidden></p>'
            '<div class="pr-signup" id="prSignup" hidden role="dialog" aria-modal="true" aria-labelledby="prSignupH"><form class="pr-signup__card" id="prSignupForm" novalidate>'
            '<button type="button" class="pr-close" id="prSignupX" aria-label="بستن">×</button>'
            '<h2 id="prSignupH">ثبت‌نام رایگان · ۳ تصویر</h2>'
            '<p class="pr-signup__sub">بعد از ثبت‌نام، صفحهٔ شما ساخته می‌شود و ۳ تصویر رایگان دارید.</p>'
            '<label><span>نام سالن یا نام کاری شما</span><input id="prSuName" autocomplete="organization" maxlength="60" required></label>'
            '<label><span>موبایل</span><input id="prSuPhone" inputmode="tel" autocomplete="tel" placeholder="0912..." maxlength="14" required></label>'
            '<label id="prSuCodeBox" hidden><span>کد پیامک‌شده</span><input id="prSuCode" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></label>'
            '<p class="pay-err" id="prSuErr" role="alert"></p>'
            '<button type="submit" class="btn btn--lg pr-signup__go" id="prSuGo">ثبت‌نام و گرفتن ۳ تصویر رایگان</button>'
            '<p class="pr-signup__note">با ثبت‌نام، تماس از طرف آینه را می‌پذیرید. خرید بعدی هم روی همین شماره فعال می‌شود.</p>'
            '</form></div>'
            '<div class="ptabs pr-tabs"><p class="ptabs__q" id="prQ">خدمت شما کدومه؟</p><div class="ptabs__row" role="tablist" aria-labelledby="prQ">' + tabs + '</div></div>'
            + panels + v2_compare() + CALC + how
            + '<script>window.__PR=' + json.dumps(data, separators=(',', ':')) + ';</script>'
            + '</div>\n</section>\n')


def teaser(key):
    """The price section of every business page now points to /pricing (with its own service)."""
    if key == 'salon':
        lo = min(x['amount'] for x in SUBS if x['line'] == 'all')
        a = '<li><b>اشتراک آرایشگاه</b><span>هر چهار خدمت برای ۳، ۸ یا ۲۰ نفر؛ از ماهی ' + toman(lo) + ' تومان</span></li>'
        b = '<li><b>بستهٔ عکس هر خدمت</b><span>با قیمت مشترکان؛ هر عکس از ' + toman(min(a_ // n for v in SUB_PACKS.values() for n, a_ in v.items())) + ' تومان</span></li>'
        href, lab = '/pricing?s=salon', 'آرایشگاه'
    else:
        lines = [key] if key in IMAGE_PRICES else LINE_ORDER
        single = min(IMAGE_PRICES[k]['single'] for k in lines)
        sub = min(x['amount'] for x in SUBS if x['line'] in lines)
        a = '<li><b>فقط ساخت تصویر</b><span>بدون اشتراک؛ هر عکس ' + ('' if key in IMAGE_PRICES else 'از ') + toman(single) + ' تومان، بسته‌ها تا ۱۵٪ ارزان‌تر</span></li>'
        b = '<li><b>اشتراک ماهانه</b><span>همهٔ امکانات پنل؛ ' + ('' if key in IMAGE_PRICES else 'از ') + 'ماهی ' + toman(sub) + ' تومان، عکس‌ها ارزان‌تر</span></li>'
        href, lab = '/pricing?s=' + (key if key in IMAGE_PRICES else 'hair'), V2_LABEL.get(key, '')
    return ('<section id="services" class="section section--soft pricing" aria-labelledby="h-plans">\n    <div class="band">'
            '<div class="head"><span class="eyebrow">تعرفه‌ها</span><h2 id="h-plans" class="h2">دو راه، <em>هر کدوم به‌صرفه‌تره</em></h2>'
            '<p class="sub">پرداخت کارت‌به‌کارته و تمدید خودکار نداره.</p></div>'
            '<ul class="pr-teaser">' + a + b + '</ul>'
            '<p class="pr-teaser__cta"><a class="btn btn--lg" href="' + href + '">خرید اشتراک و اعتبار' + (' ' + lab if lab and key != 'home' else '') + ' ' + ARROW + '</a></p>'
            '</div>\n  </section>\n')

PAGES = make_pages(h)

# /pricing: the shell with the pricing section and the same checkout sheet; no sticky demo bar
# (one primary action per moment) and only the scripts this page runs.
PRICING_PAGE = shell(h, pricing_main() + R('src/pay.html'), [('/#choose', 'خدمات'), ('#pricing', 'تعرفه‌ها'), ('/#faq', 'سؤالات')],
                     title='خرید اشتراک و اعتبار', desc='فقط ساخت تصویر یا اشتراک ماهانه، برای مدل مو، رنگ مو، ناخن، مژه یا کل آرایشگاه؛ قیمت هر عکس و هر اشتراک، و خرید در سه قدم.')
PRICING_PAGE = re.sub(r'<div id="stickyCta"[\s\S]*?</div>\n', '', PRICING_PAGE, count=1).replace('<body>', '<body data-page="pricing">', 1)
assert PRICING_PAGE.count('<h1') == 1 and 'id="pay"' in PRICING_PAGE and 'stickyCta' not in PRICING_PAGE
for _k in LINE_ORDER:  # every price on the page is the sheet's
    assert all(toman(a) in PRICING_PAGE for a in [IMAGE_PRICES[_k]['single'], *IMAGE_PRICES[_k]['packs'].values(), *SUB_PACKS[_k].values()]), _k
assert not re.search('[يك]', re.sub(r'<(script|style)>[\s\S]*?</\1>', '', PRICING_PAGE)), 'Persian letters only'


# ---------------- shared finishing: styles, logos, build stamp, scripts ----------------
def finish(h, only=None):
    FONT = '@font-face{font-family:"Estedad";src:url("assets/estedad.woff2") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}'
    h = re.sub(r'<style>.*?</style>', lambda m: '<style>' + NL + FONT + NL + css + NL + '</style>', h, count=1, flags=re.S)
    assert h.count('<!--AYNEH_MARK-->') == 2
    mark = R('assets/ayneh-mark.svg')
    # Reuse the header's embedded logo image in the footer via SVG <use>, and drop the
    # redundant duplicate xlink:href copy of the exact same base64 WebP (modern browsers use href).
    head_mark = re.sub(r'\s+xlink:href="[^"]*"', '', mark.replace(' xmlns:xlink="http://www.w3.org/1999/xlink"', ''))
    head_mark = head_mark.replace('aynDisc', 'aynDiscHeader').replace('<image ', '<image id="aynMarkImg" ', 1)
    foot_mark = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 112" role="img" aria-label="آینه"><use href="#aynMarkImg"/></svg>'
    h = h.replace('<!--AYNEH_MARK-->', head_mark, 1)
    h = h.replace('<!--AYNEH_MARK-->', foot_mark, 1)
    # A build stamp in the <head>, as a meta tag rather than a comment: ship_minify strips
    # comments, and the landing page is cacheable for a few minutes, so without a marker that
    # survives the build neither the owner nor I can tell a stale copy from the deployed one.
    import hashlib
    STAMP = hashlib.sha256(h.encode('utf-8')).hexdigest()[:12]
    h = h.replace('<head>', '<head><meta name="ayneh-build" content="' + STAMP + '">', 1)
    assert 'ayneh-build' in h
    # A one-line self-report at the very end of the page: "this copy is build X, from Y". When the
    # owner says "nothing changed" and the server is serving the new build, this is what separates
    # "a stale tab is still open" from "the deploy never happened" without opening devtools.
    h = h.replace('</body>', '<script>window.__AYNEH_BUILD=' + repr(STAMP).replace("'", '"') + ';</script>' + NL + '</body>')
    # A build tag, bottom corner, tiny — shown only with ?build or on /new, never to visitors. It exists for exactly one conversation — "nothing
    # changed in the preview" — and it answers it on screen instead of in devtools. It names the
    # build, and it says how long this copy has been open, because a tab left open from before a
    # change keeps showing the page it loaded.
    h = h.replace('</body>', '''<div id="aynehBuildTag" aria-hidden="true" style="position:fixed;inset-inline-start:6px;bottom:6px;z-index:60;font:600 10px/1.4 ui-monospace,Menlo,monospace;direction:ltr;color:#0A202A;background:rgba(252,243,235,.92);border:1px solid rgba(10,32,42,.14);border-radius:7px;padding:3px 6px;pointer-events:none;letter-spacing:.02em"></div><script>(function(){var d=document.getElementById('aynehBuildTag'),t=Date.now();if(!/[?&]build(=|&|$)/.test(location.search)&&location.pathname!=='/new'){d.remove();return}function tick(){var m=Math.floor((Date.now()-t)/60000);d.textContent=window.__AYNEH_BUILD+' · '+(m<1?'just loaded':m+'m open')}tick();setInterval(tick,20000)})();</script>''' + NL + '</body>')


    # followup.js and lead.js retired with the demo-request form: the page now has exactly two
    # actions — look at the samples, or buy a panel — so there is no request to send and no
    # follow-up message to show.
    SCRIPTS = ['funnel.js', 'story.js', 'tryon.js', 'play.js', 'draft.js', 'portrait.js',
               'hair-color.js', 'try.js', 'reveal.js', 'cinema2.js',
               'builder.js', 'refine.js', 'pay.js', 'cta.js', 'try-switch.js', 'copy.js']
    # Hair-colour maths and the photo handoff are used by the studio. hero.js, scenes.js,
    # and cinema.js drove the retired film sections. cta.js owns the mobile sticky action,
    # keeping it clear of the film, the salon-page builder, duplicate CTAs, and open dialogs.
    for name in (only or SCRIPTS):
        assert os.path.exists('src/' + name), name
    # play.js / try-switch.js / portrait.js / hair-color.js drive the sample-face mirror, which only the hairstyle page carries.
    scripts = ''.join('<script>' + NL + R('src/' + n) + NL + '</script>' + NL for n in (only or SCRIPTS)
                      if 'id="play"' in h or n not in ('play.js', 'try-switch.js', 'portrait.js', 'hair-color.js'))
    h = h.replace('</body>', scripts + '</body>')

    return h, STAMP

h, STAMP = finish(PAGES['home'])
W('out/v2.html', h.replace('__ORIGIN__', ''))

# ---------------- single-file artifact ----------------
def b64(f, m):
    return 'data:%s;base64,%s' % (m, base64.b64encode(open('assets/' + f, 'rb').read()).decode())

a = h.replace('__ORIGIN__', '').replace('assets/estedad.woff2', b64('estedad.woff2', 'font/woff2'))
# Every image the page points at must be inlined, or the single-file preview
# (opened from disk) shows empty boxes.
INLINE = ['hero', 'hero-stopmotion-poster', 'salon-film-01', 'salon-film-03'] + [d[:-5] for d in DEMOS] \
    + [m.group(1) for f in os.listdir('assets')
       for m in [re.match(r'(look-s\d\d)\.webp$', f)] if m]
for f in INLINE:
    a = a.replace('assets/%s.webp' % f, b64(f + '.webp', 'image/webp'))
a = re.sub(r'<link rel="preload"[^>]*>' + NL, '', a)
a = re.sub(r'<meta name="robots"[^>]*>(<!--.*?-->)?' + NL, '', a)
a = re.sub(r'<link rel="icon"[^>]*>' + NL, '', a)
a = a.replace('</title>', '</title><link rel="icon" type="image/svg+xml" href="' + b64('ayneh-favicon.svg', 'image/svg+xml') + '">', 1)
head = re.search(r'<title>.*?</style>', a, re.S).group(0).replace('.site-header{position:sticky;top:0;', '.site-header{position:sticky;top:env(safe-area-inset-top,0px);')
body = re.search(r'<body>(.*)</body>', a, re.S).group(1)
out = head + NL + '<div dir="rtl" lang="fa" class="page">' + body + '</div>' + NL
out = out.replace('</style>', 'body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:40;background:#FCF3EB}' + NL + '</style>', 1)
W('out/artifact.html', out)
# The same page as one file that opens straight from disk, with its build id printed in the
# corner. The artifact above starts at <title> (it is meant to be pasted into a host), so the
# head marker is lost there; this copy keeps it and exists so "is the preview the new page?"
# can be answered by opening a file, with no server and no cache in the way.
_solo = a.replace('<body>', '<body data-ayneh-build="' + STAMP + '">', 1) if '<body>' in a else a
W('out/preview-single.html', _solo)

# ---------------- worker variant ----------------
def to_worker(h):
    p = re.sub(r'(?<![/a-zA-Z0-9_-])assets/', '/landing/', h)
    p = p.replace('/landing/estedad.woff2', '/fonts/estedad-arabic.woff2')
    faces = ('@font-face{font-family:"Vazirmatn";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/vazirmatn-arabic.woff2) format("woff2");unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200F,U+2010-2011,U+204F,U+FB50-FDFF,U+FE70-FEFC}' + NL
             + '@font-face{font-family:"Vazirmatn";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/vazirmatn-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-200B,U+2012-206F,U+20AC,U+2122,U+2212}' + NL
             + '@font-face{font-family:"Estedad";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/estedad-arabic.woff2) format("woff2");unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200F,U+FB50-FDFF,U+FE70-FEFC}')
    p = re.sub(r'@font-face\{font-family:"Estedad"[^\n]*\}', lambda m: faces, p, count=1)
    assert '"Estedad","Vazirmatn"' in p, 'font stack keeps the app grid fonts'
    p = re.sub(r'<meta name="robots"[^>]*>(<!--.*?-->)?' + NL, '', p)
    assert '`' not in p and '${' not in p, 'template literal unsafe'


    return p

def ship_minify(html):
    def css(m):
        c = re.sub(r'/\*.*?\*/', '', m.group(1), flags=re.S)
        c = re.sub(r'\s+', ' ', c)
        for a_, b_ in (('{ ', '{'), (' {', '{'), (' }', '}'), ('} ', '}'), (' ;', ';'), ('; ', ';'), (': ', ':'), (' ,', ','), (', ', ',')):
            c = c.replace(a_, b_)
        return '<style>' + c.replace(';}', '}').strip() + '</style>'
    def js(m):
        t = re.sub(r'(?m)^[ \t]*/\*.*?\*/[ \t]*\n', '', m.group(1), flags=re.S)
        t = re.sub(r'(?m)^[ \t]*//[^\n]*\n', '', t)
        t = re.sub(r'(?m)^[ \t]+', '', t)
        t = re.sub(r'\n{2,}', '\n', t)
        return '<script>' + t.strip() + '</script>'
    html = re.sub(r'<style>(.*?)</style>', css, html, flags=re.S)
    html = re.sub(r'<script>(.*?)</script>', js, html, flags=re.S)
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    html = re.sub(r'>\s*\n\s*<', '><', html)
    html = re.sub(r'\n[ \t]+', '\n', html)
    html = re.sub(r'[ \t]+\n', '\n', html)
    return re.sub(r'\n{2,}', '\n', html)

WORKER = {k: ship_minify(to_worker(finish(v)[0] if k != 'home' else h)) for k, v in PAGES.items()}
PRICING_WORKER = ship_minify(to_worker(finish(PRICING_PAGE, ['funnel.js', 'pay.js', 'pricing.js'])[0]))
# These pages are the salons' site (business.<domain>); the customers' site is the main domain.
# The owner wants each side on its own: no link from here to the customers' side (Nov 2026).

W('../../worker/landing.js', '// Public pages of business.<domain>: "/" (salon home), the service pages /hair, /color, /nails, /lashes, /salon-panel and /sample (owner console lives at /admin).' + NL
  + '// GENERATED by design/landing/build.py from one design source; images in public/landing/.' + NL
  + 'export const landingHTML=`' + WORKER['home'].replace(chr(92), chr(92) * 2) + '`;' + NL
  + 'export const servicePages={' + ','.join(k + ':`' + v.replace(chr(92), chr(92) * 2) + '`' for k, v in WORKER.items() if k != 'home') + '};' + NL
  + '// /pricing «خرید اشتراک و اعتبار» (pricing v2) and the /pay checkout address.' + NL
  + 'export const pricingHTML=`' + PRICING_WORKER.replace(chr(92), chr(92) * 2) + '`;' + NL)
print(len(out), {k: len(v) for k, v in WORKER.items()})
