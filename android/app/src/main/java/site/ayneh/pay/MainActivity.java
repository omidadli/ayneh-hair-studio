package site.ayneh.pay;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.text.InputFilter;
import android.text.InputType;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * «آینه‌پی»: connect with the 6-digit code, grant the few permissions, then watch every Blu
 * deposit with the buyer's details. One screen, built in code (no libraries), RTL, light/dark.
 */
public class MainActivity extends Activity {
    private static final int REQ_PERMS = 11;

    /* Semantic colour tokens, one set per theme (never raw colours in the views). */
    private int BG, SURFACE, SURFACE2, INK, SOFT, MUTED, LINE, PRIMARY, PRIMARY_DEEP, WASH, ON_WASH,
            WARN, WARN_BG, ERR, ERR_BG, NEUTRAL_BG, RIPPLE;
    private boolean dark;

    private LinearLayout root;
    private String pairError = "", typed = "", filter = "all";
    private boolean busy = false;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        tokens();
        Sender.ensureChannel(this);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        if (!dark) getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BG);
        scroll.setFitsSystemWindows(true);
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        root.setPadding(dp(16), dp(12), dp(16), dp(32));
        scroll.addView(root, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        setContentView(scroll);
    }

    private void tokens() {
        dark = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        if (dark) {
            BG = 0xFF0E1512; SURFACE = 0xFF17211D; SURFACE2 = 0xFF1E2A25; INK = 0xFFEFF5F2; SOFT = 0xFFC3D0CA; MUTED = 0xFF93A39C;
            LINE = 0xFF2A3833; PRIMARY = 0xFF14A37E; PRIMARY_DEEP = 0xFF0A6B54; WASH = 0xFF173A30; ON_WASH = 0xFF8FE3C6;
            WARN = 0xFFFFC37A; WARN_BG = 0xFF3A2A12; ERR = 0xFFFF9D94; ERR_BG = 0xFF3D1D1B; NEUTRAL_BG = 0xFF26312D; RIPPLE = 0x33FFFFFF;
        } else {
            BG = 0xFFF7F2EC; SURFACE = 0xFFFFFFFF; SURFACE2 = 0xFFFBF7F2; INK = 0xFF0A202A; SOFT = 0xFF3E5150; MUTED = 0xFF5D6B68;
            LINE = 0xFFEADFD3; PRIMARY = 0xFF068F6C; PRIMARY_DEEP = 0xFF045A46; WASH = 0xFFE4F4EE; ON_WASH = 0xFF0A6B54;
            WARN = 0xFF9A5200; WARN_BG = 0xFFFFF1E0; ERR = 0xFFB42318; ERR_BG = 0xFFFDE8E8; NEUTRAL_BG = 0xFFEEF0EF; RIPPLE = 0x1F068F6C;
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        Store.setListener(this::render);
        render();
        if (Store.paired(this)) { Sender.schedule(this); refreshConfig(); }
        if (listenerOn()) {
            try { NotificationListenerService.requestRebind(new ComponentName(this, BankNotifications.class)); } catch (Exception ignored) { }
        }
    }

    @Override
    protected void onPause() {
        Store.setListener(null);
        super.onPause();
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        render();
    }

    /* ======================= screens ======================= */

    private void render() {
        root.removeAllViews();
        if (!Store.paired(this)) { pairScreen(); return; }
        boolean listen = listenerOn();
        boolean sms = has(Manifest.permission.RECEIVE_SMS);
        boolean notes = Build.VERSION.SDK_INT < 33 || has("android.permission.POST_NOTIFICATIONS");
        boolean battery = batteryFree();
        hero(listen && battery);
        if (Store.authFailed(this)) authCard();
        if (!listen || !notes || !battery) setupCard(listen, sms, notes, battery);
        listSection();
        footer();
    }

    /** The emerald header: logo, live status and today's numbers. */
    private void hero(boolean ready) {
        List<JSONObject> list = Store.entries(this);
        long sum = 0; int count = 0, review = 0;
        for (JSONObject e : list) {
            String s = e.optString("status");
            if ("paid".equals(s) && Fa.today(e.optLong("at"))) { count++; sum += paidOf(e); }
            if ("none".equals(s) || "many".equals(s) || "closed".equals(s) || "error".equals(s)) review++;
        }
        LinearLayout h = vbox();
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[]{0xFF17B48B, 0xFF045A46});
        g.setCornerRadius(dp(28));
        h.setBackground(g);
        h.setPadding(dp(20), dp(18), dp(20), dp(20));
        h.setElevation(dp(4));

        LinearLayout top = hbox();
        top.setGravity(Gravity.CENTER_VERTICAL);
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.logo_badge);
        logo.setContentDescription("آینه‌پی");
        top.addView(logo, new LinearLayout.LayoutParams(dp(48), dp(48)));
        LinearLayout t = vbox();
        t.setPadding(dp(12), 0, dp(12), 0);
        t.addView(text("آینه‌پی", 22, Color.WHITE, true));
        t.addView(text("تأیید خودکار واریزهای آینه", 13, 0xD9FFFFFF, false));
        top.addView(t, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        top.addView(iconButton(R.drawable.ic_refresh, Color.WHITE, 0x26FFFFFF, "تازه‌سازی", v -> {
            Sender.schedule(this);
            new Thread(() -> { Sender.flush(getApplicationContext()); Store.changed(); }).start();
            Toast.makeText(this, "به‌روز شد", Toast.LENGTH_SHORT).show();
        }));
        h.addView(top);

        LinearLayout pill = hbox();
        pill.setGravity(Gravity.CENTER_VERTICAL);
        pill.setBackground(round(0x26FFFFFF, 99, 0));
        pill.setPadding(dp(12), dp(7), dp(12), dp(7));
        View dot = new View(this);
        dot.setBackground(round(ready ? 0xFF7CF5C9 : 0xFFFFC37A, 99, 0));
        pill.addView(dot, new LinearLayout.LayoutParams(dp(8), dp(8)));
        TextView st = text(ready ? "فعال · اعلان‌های واریز بلو را می‌پاید" : "برای شروع، مراحل زیر را کامل کنید", 13, Color.WHITE, true);
        st.setPadding(dp(8), 0, 0, 0);
        pill.addView(st);
        LinearLayout.LayoutParams pp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        pp.setMargins(0, dp(14), 0, 0);
        h.addView(pill, pp);

        LinearLayout stats = hbox();
        stats.setPadding(0, dp(16), 0, 0);
        stats.addView(heroStat(Fa.money(sum), "تومان تأییدشدهٔ امروز"), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.4f));
        stats.addView(divider(0x33FFFFFF), new LinearLayout.LayoutParams(dp(1), ViewGroup.LayoutParams.MATCH_PARENT));
        stats.addView(heroStat(Fa.digits(String.valueOf(count)), "واریز امروز"), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        stats.addView(divider(0x33FFFFFF), new LinearLayout.LayoutParams(dp(1), ViewGroup.LayoutParams.MATCH_PARENT));
        stats.addView(heroStat(Fa.digits(String.valueOf(review)), "نیاز به بررسی"), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        h.addView(stats);
        root.addView(h, matchWrap(0, 0, 0, dp(16)));
    }

    private View heroStat(String value, String label) {
        LinearLayout b = vbox();
        b.setPadding(dp(10), 0, dp(10), 0);
        b.addView(text(value, 22, Color.WHITE, true));
        b.addView(text(label, 12, 0xCCFFFFFF, false));
        return b;
    }

    private void pairScreen() {
        LinearLayout h = vbox();
        h.setGravity(Gravity.CENTER_HORIZONTAL);
        h.setPadding(dp(8), dp(28), dp(8), dp(20));
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.logo_badge);
        logo.setContentDescription("آینه‌پی");
        logo.setElevation(dp(6));
        h.addView(logo, new LinearLayout.LayoutParams(dp(88), dp(88)));
        TextView title = text("آینه‌پی", 28, INK, true);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(14), 0, dp(4));
        h.addView(title, matchWrap(0, 0, 0, 0));
        TextView sub = text("واریزهای کارت‌به‌کارت آینه را خودکار تأیید می‌کند.", 15, MUTED, false);
        sub.setGravity(Gravity.CENTER);
        h.addView(sub, matchWrap(0, 0, 0, 0));
        root.addView(h, matchWrap(0, 0, 0, dp(8)));

        LinearLayout c = card();
        c.addView(text("اتصال به سایت", 18, INK, true));
        c.addView(step(1, "در پنل مدیر سایت، بخش «پرداخت و پنل» را باز کنید."));
        c.addView(step(2, "«ساخت کد اتصال اپ» را بزنید."));
        c.addView(step(3, "کد ۶ رقمی را این‌جا بنویسید."));
        TextView label = text("کد اتصال", 14, SOFT, true);
        label.setPadding(0, dp(18), 0, dp(8));
        c.addView(label);
        final EditText code = new EditText(this);
        code.setInputType(InputType.TYPE_CLASS_NUMBER);
        code.setFilters(new InputFilter[]{new InputFilter.LengthFilter(6)});
        code.setGravity(Gravity.CENTER);
        code.setTextSize(TypedValue.COMPLEX_UNIT_SP, 30);
        code.setLetterSpacing(0.45f);
        code.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        code.setTextColor(INK);
        code.setHintTextColor(MUTED);
        code.setHint("······");
        code.setText(typed);
        code.setSelection(typed.length());
        /* Keep what is typed: a deposit arriving meanwhile redraws the screen. */
        code.addTextChangedListener(new android.text.TextWatcher() {
            public void beforeTextChanged(CharSequence a, int b, int c2, int d) { }
            public void onTextChanged(CharSequence a, int b, int c2, int d) { }
            public void afterTextChanged(android.text.Editable e) { typed = e.toString().trim(); }
        });
        code.setContentDescription("کد اتصال ۶ رقمی");
        code.setTextDirection(View.TEXT_DIRECTION_LTR);
        code.setBackground(round(SURFACE2, 18, pairError.isEmpty() ? LINE : ERR));
        code.setPadding(dp(12), dp(16), dp(12), dp(16));
        c.addView(code, matchWrap(0, 0, 0, 0));
        if (!pairError.isEmpty()) {
            TextView err = text(pairError, 13, ERR, true);
            err.setPadding(0, dp(8), 0, 0);
            c.addView(err);
        }
        View go = button(busy ? "در حال اتصال…" : "وصل شو", true, R.drawable.ic_link, v -> { typed = code.getText().toString().trim(); connect(typed); });
        go.setEnabled(!busy);
        go.setAlpha(busy ? 0.6f : 1f);
        c.addView(go, matchWrap(0, dp(18), 0, 0));
        root.addView(c, matchWrap(0, 0, 0, dp(14)));
    }

    private View step(int n, String s) {
        LinearLayout r = hbox();
        r.setGravity(Gravity.CENTER_VERTICAL);
        r.setPadding(0, dp(12), 0, 0);
        TextView num = text(Fa.digits(String.valueOf(n)), 13, ON_WASH, true);
        num.setGravity(Gravity.CENTER);
        num.setBackground(round(WASH, 99, 0));
        r.addView(num, new LinearLayout.LayoutParams(dp(28), dp(28)));
        TextView t = text(s, 14, SOFT, false);
        t.setPadding(dp(12), 0, 0, 0);
        r.addView(t, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        return r;
    }

    private void authCard() {
        LinearLayout c = card();
        c.setBackground(round(ERR_BG, 22, 0));
        LinearLayout top = hbox();
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.addView(iconCircle(R.drawable.ic_alert, ERR, SURFACE));
        TextView t = text("اتصال اپ باطل شده", 17, ERR, true);
        t.setPadding(dp(12), 0, 0, 0);
        top.addView(t);
        c.addView(top);
        TextView s = text("توکن پرداخت در سایت عوض شده. یک کد اتصال تازه از پنل مدیر بگیرید؛ واریزهای در صف بعد از اتصال فرستاده می‌شوند.", 14, SOFT, false);
        s.setPadding(0, dp(10), 0, 0);
        c.addView(s);
        c.addView(button("اتصال دوباره", true, R.drawable.ic_link, v -> { Store.unpair(this); render(); }), matchWrap(0, dp(14), 0, 0));
        root.addView(c, matchWrap(0, 0, 0, dp(14)));
    }

    private void setupCard(boolean listen, boolean sms, boolean notes, boolean battery) {
        int total = Build.VERSION.SDK_INT >= 33 ? 3 : 2;
        int done = (listen ? 1 : 0) + (battery ? 1 : 0) + (Build.VERSION.SDK_INT >= 33 && notes ? 1 : 0);
        LinearLayout c = card();
        LinearLayout head = hbox();
        head.setGravity(Gravity.CENTER_VERTICAL);
        head.addView(text("راه‌اندازی، فقط یک بار", 18, INK, true), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        TextView count = text(Fa.digits(done + " از " + total), 13, ON_WASH, true);
        count.setBackground(round(WASH, 99, 0));
        count.setPadding(dp(12), dp(5), dp(12), dp(5));
        head.addView(count);
        c.addView(head);
        LinearLayout bar = hbox();
        bar.setBackground(round(NEUTRAL_BG, 99, 0));
        View fill = new View(this);
        fill.setBackground(round(PRIMARY, 99, 0));
        bar.addView(fill, new LinearLayout.LayoutParams(0, dp(6), Math.max(0.0001f, done)));
        bar.addView(new View(this), new LinearLayout.LayoutParams(0, dp(6), Math.max(0.0001f, total - done)));
        c.addView(bar, matchWrap(0, dp(12), 0, dp(4)));
        c.addView(permRow(R.drawable.ic_message, "خواندن اعلان‌های واریز بلو", "در صفحهٔ بعد «آینه‌پی» را روشن کنید. فقط اعلان‌های اپ بلو خوانده می‌شود.", listen, v -> openListenerSettings()));
        if (Build.VERSION.SDK_INT >= 33)
            c.addView(permRow(R.drawable.ic_bell, "اعلان روی گوشی", "با هر واریز تأییدشده یا نیازمند بررسی خبرتان می‌کند.", notes, v -> ask("android.permission.POST_NOTIFICATIONS")));
        c.addView(permRow(R.drawable.ic_battery, "همیشه روشن", "تا اندروید اپ را در پس‌زمینه نبندد. در شیائومی «Autostart» را هم روشن کنید.", battery, v -> askBattery()));
        if (!sms)
            c.addView(permRow(R.drawable.ic_message, "پیامک بانک (اختیاری)", "فقط برای بانکی که واریز را با پیامک خبر می‌دهد.", false, v -> ask(Manifest.permission.RECEIVE_SMS)));
        root.addView(c, matchWrap(0, 0, 0, dp(14)));
    }

    private View permRow(int icon, String title, String sub, boolean ok, View.OnClickListener act) {
        LinearLayout r = hbox();
        r.setGravity(Gravity.CENTER_VERTICAL);
        r.setPadding(0, dp(14), 0, 0);
        r.addView(iconCircle(ok ? R.drawable.ic_check : icon, ok ? Color.WHITE : ON_WASH, ok ? PRIMARY : WASH));
        LinearLayout t = vbox();
        t.setPadding(dp(12), 0, dp(10), 0);
        t.addView(text(title, 15, INK, true));
        t.addView(text(sub, 12, MUTED, false));
        r.addView(t, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        if (!ok) {
            TextView b = (TextView) button("اجازه بده", true, 0, act);
            b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            b.setMinHeight(dp(44));
            b.setPadding(dp(16), dp(8), dp(16), dp(8));
            r.addView(b);
        }
        return r;
    }

    private void listSection() {
        List<JSONObject> all = Store.entries(this);
        TextView head = text("واریزها", 19, INK, true);
        head.setPadding(dp(4), dp(6), dp(4), dp(10));
        root.addView(head);
        LinearLayout seg = hbox();
        seg.setBackground(round(NEUTRAL_BG, 99, 0));
        seg.setPadding(dp(4), dp(4), dp(4), dp(4));
        seg.addView(segItem("all", "همه"), new LinearLayout.LayoutParams(0, dp(44), 1f));
        seg.addView(segItem("paid", "تأییدشده"), new LinearLayout.LayoutParams(0, dp(44), 1f));
        seg.addView(segItem("review", "نیاز به بررسی"), new LinearLayout.LayoutParams(0, dp(44), 1f));
        root.addView(seg, matchWrap(0, 0, 0, dp(12)));

        List<JSONObject> list = new ArrayList<>();
        for (JSONObject e : all) {
            String s = e.optString("status");
            boolean rev = "none".equals(s) || "many".equals(s) || "closed".equals(s) || "error".equals(s) || "ignored".equals(s) || "pending".equals(s);
            if ("all".equals(filter) || ("paid".equals(filter) && "paid".equals(s)) || ("review".equals(filter) && rev)) list.add(e);
        }
        if (list.isEmpty()) { emptyState(all.isEmpty()); return; }
        for (JSONObject e : list) root.addView(entryCard(e), matchWrap(0, 0, 0, dp(12)));
    }

    private View segItem(String key, String label) {
        boolean on = key.equals(filter);
        TextView t = text(label, 14, on ? INK : MUTED, on);
        t.setGravity(Gravity.CENTER);
        t.setBackground(ripple(on ? SURFACE : Color.TRANSPARENT, 99));
        if (on) t.setElevation(dp(1));
        t.setClickable(true);
        t.setFocusable(true);
        t.setContentDescription("فیلتر " + label);
        t.setOnClickListener(v -> { filter = key; render(); });
        return t;
    }

    private void emptyState(boolean nothingYet) {
        LinearLayout c = card();
        c.setGravity(Gravity.CENTER_HORIZONTAL);
        c.setPadding(dp(20), dp(28), dp(20), dp(28));
        c.addView(iconCircle(R.drawable.ic_inbox, ON_WASH, WASH));
        TextView t = text(nothingYet ? "هنوز واریزی نیامده" : "در این فیلتر چیزی نیست", 16, INK, true);
        t.setGravity(Gravity.CENTER);
        t.setPadding(0, dp(12), 0, dp(4));
        c.addView(t, matchWrap(0, 0, 0, 0));
        TextView s = text(nothingYet ? "اولین اعلان واریز بلو همین‌جا با مشخصات خریدار دیده می‌شود." : "فیلتر «همه» را بزنید.", 14, MUTED, false);
        s.setGravity(Gravity.CENTER);
        c.addView(s, matchWrap(0, 0, 0, 0));
        root.addView(c, matchWrap(0, 0, 0, dp(12)));
    }

    private View entryCard(JSONObject e) {
        String s = e.optString("status");
        int fg, bg, icon;
        String chip;
        switch (s) {
            case "paid": chip = "تأیید شد"; fg = ON_WASH; bg = WASH; icon = R.drawable.ic_check; break;
            case "none": chip = "سفارشی پیدا نشد"; fg = WARN; bg = WARN_BG; icon = R.drawable.ic_alert; break;
            case "many": chip = "نیاز به بررسی"; fg = WARN; bg = WARN_BG; icon = R.drawable.ic_alert; break;
            case "closed": chip = "تأیید نشد"; fg = ERR; bg = ERR_BG; icon = R.drawable.ic_x; break;
            case "error": chip = "خطا"; fg = ERR; bg = ERR_BG; icon = R.drawable.ic_x; break;
            case "duplicate": chip = "تکراری"; fg = MUTED; bg = NEUTRAL_BG; icon = R.drawable.ic_check; break;
            case "ignored": chip = "واریز نبود"; fg = MUTED; bg = NEUTRAL_BG; icon = R.drawable.ic_message; break;
            default: chip = "در صف ارسال"; fg = MUTED; bg = NEUTRAL_BG; icon = R.drawable.ic_clock;
        }
        LinearLayout c = card();
        LinearLayout top = hbox();
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.addView(iconCircle(icon, fg, bg));
        LinearLayout mid = vbox();
        mid.setPadding(dp(12), 0, dp(8), 0);
        long rial = e.optLong("amount");
        mid.addView(text(rial > 0 ? Fa.money(rial / 10) + " تومان" : "مبلغ نامشخص", 19, INK, true));
        mid.addView(text(Fa.when(e.optLong("at")), 12, MUTED, false));
        top.addView(mid, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        TextView ch = text(chip, 12, fg, true);
        ch.setBackground(round(bg, 99, 0));
        ch.setPadding(dp(12), dp(6), dp(12), dp(6));
        top.addView(ch);
        c.addView(top);

        if (("paid".equals(s) || "closed".equals(s)) && !e.optString("ref").isEmpty()) {
            LinearLayout box = vbox();
            box.setBackground(round(SURFACE2, 16, LINE));
            box.setPadding(dp(14), dp(6), dp(14), dp(6));
            info(box, R.drawable.ic_user, "خریدار", e.optString("buyer"), null);
            info(box, R.drawable.ic_store, "سالن / مزون", e.optString("salon"), null);
            final String phone = e.optString("phone");
            info(box, R.drawable.ic_phone, "موبایل", Fa.digits(phone), phone.isEmpty() ? null : v -> {
                try { startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phone))); } catch (Exception ignored) { }
            });
            info(box, R.drawable.ic_tag, "سرویس", e.optString("service").isEmpty() ? e.optString("label") : e.optString("service"), null);
            if (paidOf(e) > 0) info(box, R.drawable.ic_wallet, "مبلغ پرداختی", Fa.money(paidOf(e)) + " تومان", null);
            info(box, R.drawable.ic_hash, "کد سفارش", e.optString("ref"), null);
            c.addView(box, matchWrap(0, dp(14), 0, 0));
        }
        String note;
        switch (s) {
            case "paid": note = "سفارش خودکار تأیید شد و پنل خریدار باز شد."; break;
            case "none": note = "سفارش بازی با این مبلغ نبود. اگر پول مشتری است، در پنل مدیر بررسی کنید."; break;
            case "many": note = "این مبلغ با چند سفارش یکی بود؛ در پنل مدیر تأیید کنید."; break;
            case "closed": note = e.optString("msg"); break;
            case "duplicate": note = "این اعلان قبلاً ثبت شده بود."; break;
            case "ignored": note = "این پیام بلو واریز شناخته نشد. اگر واریز بود، از همین کارت عکس بفرستید."; break;
            case "error": note = e.optString("msg"); break;
            default: note = "منتظر اینترنت؛ خودش فرستاده می‌شود.";
        }
        if (!note.isEmpty()) {
            TextView n = text(note, 13, SOFT, false);
            n.setPadding(0, dp(12), 0, 0);
            c.addView(n);
        }
        if ("none".equals(s) || "ignored".equals(s) || "many".equals(s)) {
            TextView raw = text(e.optString("text").replaceAll("\n⏱\\d+$", ""), 12, MUTED, false);
            raw.setTextIsSelectable(true);
            raw.setBackground(round(SURFACE2, 12, LINE));
            raw.setPadding(dp(12), dp(10), dp(12), dp(10));
            c.addView(raw, matchWrap(0, dp(10), 0, 0));
        }
        return c;
    }

    private void info(LinearLayout box, int icon, String k, String v, View.OnClickListener tap) {
        if (v == null || v.isEmpty()) return;
        LinearLayout r = hbox();
        r.setGravity(Gravity.CENTER_VERTICAL);
        r.setMinimumHeight(dp(44));
        ImageView i = new ImageView(this);
        i.setImageResource(icon);
        i.setColorFilter(tap == null ? MUTED : PRIMARY, PorterDuff.Mode.SRC_IN);
        i.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        r.addView(i, new LinearLayout.LayoutParams(dp(18), dp(18)));
        TextView a = text(k, 13, MUTED, false);
        a.setPadding(dp(10), 0, 0, 0);
        r.addView(a, new LinearLayout.LayoutParams(dp(118), ViewGroup.LayoutParams.WRAP_CONTENT));
        TextView b = text(v, 14, tap == null ? INK : PRIMARY, true);
        b.setTextIsSelectable(tap == null);
        r.addView(b, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        if (tap != null) {
            r.setBackground(ripple(Color.TRANSPARENT, 12));
            r.setClickable(true);
            r.setFocusable(true);
            r.setContentDescription("تماس با " + v);
            r.setOnClickListener(tap);
        }
        box.addView(r);
    }

    private void footer() {
        LinearLayout row = hbox();
        row.addView(button("بررسی اتصال", false, R.drawable.ic_link, v -> ping()), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        row.addView(new View(this), new LinearLayout.LayoutParams(dp(10), 1));
        row.addView(button("قطع اتصال", false, R.drawable.ic_logout, v -> new AlertDialog.Builder(this)
                .setTitle("قطع اتصال")
                .setMessage("اتصال این گوشی به سایت آینه قطع شود؟ بعد از قطع، واریزها خودکار تأیید نمی‌شوند.")
                .setPositiveButton("قطع کن", (d, w) -> { Store.unpair(this); render(); })
                .setNegativeButton("انصراف", null).show()), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        root.addView(row, matchWrap(0, dp(8), 0, 0));
        TextView ver = text("نسخهٔ " + Fa.digits(versionName()), 12, MUTED, false);
        ver.setGravity(Gravity.CENTER);
        root.addView(ver, matchWrap(0, dp(16), 0, 0));
    }

    /* ======================= actions ======================= */

    private void refreshConfig() {
        new Thread(() -> {
            try {
                Api.Result r = Api.post(Store.origin(this) + "/api/pay/ping", Store.key(this), new JSONObject());
                if (r.code == 401) Store.setAuthFailed(getApplicationContext(), true);
                else if (r.ok()) {
                    Store.setSenders(getApplicationContext(), r.body.optJSONArray("senders"));
                    Store.setApps(getApplicationContext(), r.body.optJSONArray("apps"));
                    if (Store.authFailed(this)) Store.setAuthFailed(getApplicationContext(), false);
                }
            } catch (Exception ignored) { }
        }).start();
    }

    private void connect(String code) {
        if (busy) return;
        if (!code.matches("\\d{6}")) { pairError = "کد ۶ رقمی را کامل بنویسید."; render(); return; }
        busy = true; pairError = ""; render();
        new Thread(() -> {
            String err = "";
            try {
                Api.Result r = Api.post(Api.DEFAULT_ORIGIN + "/api/pay/pair", null, new JSONObject().put("code", code));
                if (r.ok() && !r.body.optString("key").isEmpty()) {
                    String origin = r.body.optString("origin", Api.DEFAULT_ORIGIN);
                    Store.setSenders(getApplicationContext(), r.body.optJSONArray("senders"));
                    Store.pair(getApplicationContext(), origin.isEmpty() ? Api.DEFAULT_ORIGIN : origin, r.body.optString("key"));
                } else err = r.error();
            } catch (Exception ex) { err = "به اینترنت وصل نیستید یا سایت در دسترس نیست."; }
            final String e = err;
            runOnUiThread(() -> {
                busy = false; pairError = e;
                render();
                if (e.isEmpty()) {
                    Sender.schedule(this);
                    if (Build.VERSION.SDK_INT >= 33 && !has("android.permission.POST_NOTIFICATIONS")) {
                        Store.markAsked(this, "android.permission.POST_NOTIFICATIONS");
                        requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_PERMS);
                    }
                }
            });
        }).start();
    }

    private void ping() {
        new Thread(() -> {
            String msg;
            try {
                Api.Result r = Api.post(Store.origin(this) + "/api/pay/ping", Store.key(this), new JSONObject());
                if (r.code == 401) { Store.setAuthFailed(getApplicationContext(), true); msg = r.error(); }
                else if (r.ok()) {
                    Store.setAuthFailed(getApplicationContext(), false);
                    Store.setSenders(getApplicationContext(), r.body.optJSONArray("senders"));
                    msg = !r.body.optBoolean("card") ? "اتصال سالم است، ولی شمارهٔ کارت در پنل مدیر ثبت نشده."
                            : listenerOn() ? "اتصال سالم است و اعلان‌های بلو پاییده می‌شود." : "اتصال سالم است، ولی دسترسی اعلان‌ها خاموش است.";
                } else msg = r.error();
            } catch (Exception ex) { msg = "به اینترنت وصل نیستید یا سایت در دسترس نیست."; }
            final String m = msg;
            runOnUiThread(() -> Toast.makeText(this, m, Toast.LENGTH_LONG).show());
        }).start();
    }

    /** First time: Android's own dialog. After a refusal Android stops showing it, so open the app's settings. */
    private void ask(String perm) {
        if (Store.askedBefore(this, perm) && !shouldShowRequestPermissionRationale(perm)) {
            try {
                startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
                return;
            } catch (Exception ignored) { }
        }
        Store.markAsked(this, perm);
        requestPermissions(new String[]{perm}, REQ_PERMS);
    }

    private boolean listenerOn() {
        String on = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        return on != null && on.contains(getPackageName() + "/");
    }

    private void openListenerSettings() {
        try {
            if (Build.VERSION.SDK_INT >= 30) {
                Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS);
                i.putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, new ComponentName(this, BankNotifications.class).flattenToString());
                startActivity(i);
                return;
            }
        } catch (Exception ignored) { }
        try { startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)); } catch (Exception ignored) { }
    }

    private void askBattery() {
        try {
            startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName())));
        } catch (Exception e) {
            try { startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)); } catch (Exception ignored) { }
        }
    }

    private boolean batteryFree() {
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        return pm == null || pm.isIgnoringBatteryOptimizations(getPackageName());
    }

    private boolean has(String perm) { return checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED; }

    private String versionName() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
    }

    private static long paidOf(JSONObject e) {
        long p = e.optLong("paid");
        return p > 0 ? p : e.optLong("amount") / 10;
    }

    /* ======================= view kit ======================= */

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    private GradientDrawable round(int color, int radiusDp, int stroke) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(radiusDp));
        if (stroke != 0) g.setStroke(dp(1), stroke);
        return g;
    }

    /** Pressed feedback without moving anything: a ripple over the same shape. */
    private Drawable ripple(int color, int radiusDp) { return ripple(color, radiusDp, 0); }

    private Drawable ripple(int color, int radiusDp, int stroke) {
        return new RippleDrawable(ColorStateList.valueOf(RIPPLE), round(color, radiusDp, stroke), round(Color.WHITE, radiusDp, 0));
    }

    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setLineSpacing(0, 1.3f);
        t.setTextDirection(View.TEXT_DIRECTION_RTL);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private View button(String s, boolean primary, int icon, View.OnClickListener tap) {
        int fg = primary ? Color.WHITE : (dark ? ON_WASH : PRIMARY_DEEP);
        TextView b = text(s, 16, fg, true);
        b.setGravity(Gravity.CENTER);
        b.setMinHeight(dp(52));
        b.setPadding(dp(18), dp(12), dp(18), dp(12));
        b.setBackground(ripple(primary ? PRIMARY : SURFACE, 99, primary ? 0 : (dark ? LINE : 0xFFBFE3D6)));
        if (icon != 0) {
            Drawable d = getDrawable(icon);
            if (d != null) {
                d = d.mutate();
                d.setTint(fg);
                d.setBounds(0, 0, dp(18), dp(18));
                b.setCompoundDrawablesRelative(d, null, null, null);
                b.setCompoundDrawablePadding(dp(8));
            }
        }
        b.setClickable(true);
        b.setFocusable(true);
        if (primary) b.setElevation(dp(2));
        b.setOnClickListener(tap);
        return b;
    }

    private View iconButton(int icon, int tint, int bg, String label, View.OnClickListener tap) {
        ImageView i = new ImageView(this);
        i.setImageResource(icon);
        i.setColorFilter(tint, PorterDuff.Mode.SRC_IN);
        i.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        i.setPadding(dp(12), dp(12), dp(12), dp(12));
        i.setBackground(new RippleDrawable(ColorStateList.valueOf(0x40FFFFFF), round(bg, 99, 0), round(Color.WHITE, 99, 0)));
        i.setContentDescription(label);
        i.setClickable(true);
        i.setFocusable(true);
        i.setOnClickListener(tap);
        i.setLayoutParams(new LinearLayout.LayoutParams(dp(48), dp(48)));
        return i;
    }

    private View iconCircle(int icon, int tint, int bg) {
        ImageView i = new ImageView(this);
        i.setImageResource(icon);
        i.setColorFilter(tint, PorterDuff.Mode.SRC_IN);
        i.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        i.setPadding(dp(10), dp(10), dp(10), dp(10));
        i.setBackground(round(bg, 99, 0));
        i.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        i.setLayoutParams(new LinearLayout.LayoutParams(dp(42), dp(42)));
        return i;
    }

    private View divider(int color) {
        View v = new View(this);
        v.setBackgroundColor(color);
        return v;
    }

    private LinearLayout card() {
        LinearLayout c = vbox();
        c.setBackground(round(SURFACE, 22, LINE));
        c.setPadding(dp(18), dp(16), dp(18), dp(16));
        c.setElevation(dp(1));
        return c;
    }

    private LinearLayout vbox() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        return l;
    }

    private LinearLayout hbox() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.HORIZONTAL);
        return l;
    }

    private LinearLayout.LayoutParams matchWrap(int l, int t, int r, int b) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        p.setMargins(l, t, r, b);
        return p;
    }
}
