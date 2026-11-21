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

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !Store.isBankApp(this, sbn.getPackageName())) return;
        Notification n = sbn.getNotification();
        if (n == null) return;
        Bundle x = n.extras;
        String title = str(x.getCharSequence(Notification.EXTRA_TITLE));
        CharSequence big = x.getCharSequence(Notification.EXTRA_BIG_TEXT);
        String body = big != null && big.length() > 0 ? big.toString() : str(x.getCharSequence(Notification.EXTRA_TEXT));
        String text = (title + "\n" + body).trim();
        if (!(text.contains("واریز") || text.contains("نشست"))) return;
        if (Store.amountOf(text) <= 0) return;
        /* The same notification is often re-posted (updated, re-alerted): count it once. */
        String seenKey = sbn.getKey() + "|" + text.hashCode();
        SharedPreferences p = getSharedPreferences("aynehpay_seen", MODE_PRIVATE);
        if (p.getBoolean(seenKey, false)) return;
        if (p.getAll().size() > 400) p.edit().clear().apply();
        p.edit().putBoolean(seenKey, true).apply();
        /* Two deposits of the same amount can read the same; the post time keeps them apart on the
           site (it holds no digits followed by «ریال», so the amount reading is unchanged). */
        long at = sbn.getPostTime();
        Store.add(this, text + "\n⏱" + at, at);
        Sender.schedule(this);
    }

    private static String str(CharSequence c) { return c == null ? "" : c.toString(); }
}
