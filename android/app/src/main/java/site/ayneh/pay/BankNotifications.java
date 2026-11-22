package site.ayneh.pay;

import android.app.Notification;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

/**
 * Blu (and other bank apps) announce a deposit as an app notification, not an SMS. Only
 * notifications posted by the bank app's own package are read (any app can title a
 * notification «بلو», but none can post as com.samanpr.blu), and only deposit wording is kept.
 */
public class BankNotifications extends NotificationListenerService {
    static final String BLU_PACKAGE = "com.samanpr.blu";

    /* Android does not replay what arrived while the listener was off: read what is still shown. */
    @Override
    public void onListenerConnected() {
        try {
            StatusBarNotification[] shown = getActiveNotifications();
            if (shown != null) for (StatusBarNotification sbn : shown) onNotificationPosted(sbn);
        } catch (Exception ignored) { }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !Store.isBankApp(this, sbn.getPackageName())) return;
        Notification n = sbn.getNotification();
        if (n == null) return;
        /* A group summary repeats a child notification: the child is enough. */
        if ((n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        Bundle x = n.extras;
        String title = str(x.getCharSequence(Notification.EXTRA_TITLE));
        CharSequence big = x.getCharSequence(Notification.EXTRA_BIG_TEXT);
        String body = big != null && big.length() > 0 ? big.toString() : str(x.getCharSequence(Notification.EXTRA_TEXT));
        String text = (title + "\n" + body).trim();
        /* Every Blu message that carries a number goes to the site: a deposit is confirmed there,
           anything else is listed as «واریز نبود» with its wording, so an unexpected format shows
           up instead of silently vanishing. */
        if (!Store.toLatin(text).matches("(?s).*\\d.*")) return;
        /* The same notification is often re-posted (updated, re-alerted): count it once. */
        String seenKey = sbn.getKey() + "|" + text.hashCode();
        SharedPreferences p = getSharedPreferences("aynehpay_seen", MODE_PRIVATE);
        if (p.getBoolean(seenKey, false)) return;
        /* The same words re-posted under another key within two minutes are the same deposit
           (the balance line makes two real deposits read differently). */
        String textKey = "t|" + text.hashCode();
        long last = p.getLong(textKey, 0);
        if (last > 0 && Math.abs(sbn.getPostTime() - last) < 120000) return;
        if (p.getAll().size() > 400) p.edit().clear().apply();
        p.edit().putBoolean(seenKey, true).putLong(textKey, sbn.getPostTime()).apply();
        /* Two deposits of the same amount can read the same; the post time keeps them apart on the
           site (it holds no digits followed by «ریال», so the amount reading is unchanged). */
        long at = sbn.getPostTime();
        Store.add(this, text + "\n⏱" + at, at);
        Sender.schedule(this);
    }

    /* Some phones (Xiaomi) drop the listener in the background: ask Android to reconnect it. */
    @Override
    public void onListenerDisconnected() {
        try { requestRebind(new android.content.ComponentName(this, BankNotifications.class)); } catch (Exception ignored) { }
    }

    private static String str(CharSequence c) { return c == null ? "" : c.toString(); }
}
