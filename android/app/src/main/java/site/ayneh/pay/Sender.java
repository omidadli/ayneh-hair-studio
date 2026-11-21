package site.ayneh.pay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

import java.util.List;

/** Sends queued deposits to the site (POST /api/pay/sms) and records what the site decided. */
final class Sender {
    private static final int JOB_ID = 7401;
    private static final Object LOCK = new Object();
    static final String CHANNEL = "deposits_ok";

    static void schedule(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js == null) return;
        JobInfo job = new JobInfo.Builder(JOB_ID, new ComponentName(c, SendJob.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setBackoffCriteria(15000, JobInfo.BACKOFF_POLICY_EXPONENTIAL)
                .setPersisted(true)
                .build();
        js.schedule(job);
    }

    /** Returns true when something is still waiting and the job should run again. */
    static boolean flush(Context c) {
        synchronized (LOCK) {
            if (!Store.paired(c)) return false;
            boolean again = false;
            List<JSONObject> list = Store.entries(c);
            for (int i = list.size() - 1; i >= 0; i--) {
                JSONObject e = list.get(i);
                if (!"pending".equals(e.optString("status"))) continue;
                String id = e.optString("id");
                try {
                    JSONObject body = new JSONObject().put("text", e.optString("text"));
                    Api.Result r = Api.post(Store.origin(c) + "/api/pay/sms", Store.key(c), body);
                    if (r.code == 401) {
                        if (!Store.authFailed(c)) notifyReview(c, 0, "اتصال آینه‌پی باطل شده؛ در اپ «اتصال دوباره» را بزنید تا واریزها تأیید شوند.");
                        Store.setAuthFailed(c, true);
                        return false;
                    }
                    if (Store.authFailed(c)) Store.setAuthFailed(c, false);
                    if (r.code >= 500 || r.code == 429) { again = true; continue; }
                    JSONObject f = new JSONObject();
                    JSONObject b = r.body;
                    f.put("sent_at", System.currentTimeMillis());
                    if (!r.ok()) {
                        f.put("status", "error").put("msg", r.error());
                    } else if (b.optBoolean("ignored")) {
                        f.put("status", "ignored");
                    } else if (b.optBoolean("duplicate")) {
                        f.put("status", "duplicate");
                    } else if (b.optBoolean("matched")) {
                        f.put("status", "paid").put("ref", b.optString("ref")).put("name", b.optString("name")).put("label", b.optString("label"))
                                .put("buyer", b.optString("buyer")).put("salon", b.optString("salon")).put("phone", b.optString("phone"))
                                .put("service", b.optString("service")).put("paid", b.optLong("paid"));
                        notifyPaid(c, e, b);
                    } else if (b.optBoolean("many")) {
                        f.put("status", "many");
                        notifyReview(c, e.optLong("amount") / 10, "این مبلغ با چند سفارش یکی است؛ در پنل مدیر تأیید کنید.");
                    } else if (b.has("error")) {
                        notifyReview(c, e.optLong("amount") / 10, b.optString("error"));
                        f.put("status", "closed").put("msg", b.optString("error")).put("ref", b.optString("ref")).put("name", b.optString("name"))
                                .put("buyer", b.optString("buyer")).put("salon", b.optString("salon")).put("phone", b.optString("phone"))
                                .put("service", b.optString("service")).put("paid", b.optLong("paid"));
                    } else {
                        f.put("status", "none");
                        notifyReview(c, e.optLong("amount") / 10, "سفارش بازی با این مبلغ نبود. اگر پول مشتری است، در پنل مدیر بررسی کنید.");
                    }
                    if (b.has("amount") && b.optLong("amount") > 0) f.put("amount", b.optLong("amount") * 10);
                    Store.update(c, id, f);
                } catch (Exception ex) {
                    again = true; // no internet or a timeout: try again later
                }
            }
            return again;
        }
    }

    static final String CHANNEL_CHECK = "deposits_check";

    static void ensureChannel(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (nm.getNotificationChannel("deposits") != null) nm.deleteNotificationChannel("deposits"); // the old, quieter channel
        if (nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "واریزهای تأییدشده", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("هر واریزی که خودکار تأیید و پنلش باز شد");
            ch.enableLights(true);
            ch.setLightColor(0xFF068F6C);
            nm.createNotificationChannel(ch);
        }
        if (nm.getNotificationChannel(CHANNEL_CHECK) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_CHECK, "واریزهای نیازمند بررسی", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("واریزی که سفارشش پیدا نشد یا تأیید نشد");
            nm.createNotificationChannel(ch);
        }
    }

    private static android.graphics.Bitmap logo(Context c) {
        try {
            android.graphics.drawable.Drawable d = c.getDrawable(R.drawable.logo_badge);
            int px = (int) (64 * c.getResources().getDisplayMetrics().density);
            android.graphics.Bitmap b = android.graphics.Bitmap.createBitmap(px, px, android.graphics.Bitmap.Config.ARGB_8888);
            android.graphics.Canvas cv = new android.graphics.Canvas(b);
            d.setBounds(0, 0, px, px);
            d.draw(cv);
            return b;
        } catch (Exception e) { return null; }
    }

    /** A confirmed deposit: amount, buyer, salon, service and mobile, with «تماس» and «باز کردن». */
    static void notifyPaid(Context c, JSONObject e, JSONObject b) {
        try {
            ensureChannel(c);
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            long toman = b.optLong("paid") > 0 ? b.optLong("paid") : e.optLong("amount") / 10;
            String buyer = b.optString("buyer"), salon = b.optString("salon"), phone = b.optString("phone");
            String head = buyer.isEmpty() ? salon : (salon.isEmpty() ? buyer : buyer + " · " + salon);
            StringBuilder big = new StringBuilder();
            if (!buyer.isEmpty()) big.append("خریدار: ").append(buyer).append('\n');
            if (!salon.isEmpty()) big.append("سالن / مزون: ").append(salon).append('\n');
            if (!phone.isEmpty()) big.append("موبایل: ").append(Fa.digits(phone)).append('\n');
            if (!b.optString("service").isEmpty()) big.append("سرویس: ").append(b.optString("service")).append('\n');
            big.append("مبلغ: ").append(Fa.money(toman)).append(" تومان");
            if (!b.optString("ref").isEmpty()) big.append(" · کد ").append(b.optString("ref"));
            int id = (int) (System.currentTimeMillis() % 1000000);
            PendingIntent open = PendingIntent.getActivity(c, id, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder nb = new Notification.Builder(c, CHANNEL)
                    .setSmallIcon(R.drawable.ic_stat)
                    .setLargeIcon(logo(c))
                    .setColor(0xFF068F6C)
                    .setContentTitle("واریز " + Fa.money(toman) + " تومان تأیید شد")
                    .setContentText(head.isEmpty() ? "سفارش خودکار باز شد" : head)
                    .setStyle(new Notification.BigTextStyle().bigText(big.toString()))
                    .setCategory(Notification.CATEGORY_STATUS)
                    .setGroup("ayneh-deposits")
                    .setContentIntent(open)
                    .setAutoCancel(true);
            if (!phone.isEmpty()) {
                PendingIntent call = PendingIntent.getActivity(c, id + 1, new Intent(Intent.ACTION_DIAL, android.net.Uri.parse("tel:" + phone)), PendingIntent.FLAG_IMMUTABLE);
                nb.addAction(new Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(c, R.drawable.ic_phone), "تماس با خریدار", call).build());
            }
            nb.addAction(new Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(c, R.drawable.ic_inbox), "باز کردن آینه‌پی", open).build());
            nm.notify(id, nb.build());
        } catch (Exception ignored) { }
    }

    /** A deposit the site could not match: the owner should look at it. */
    static void notifyReview(Context c, long toman, String why) {
        try {
            ensureChannel(c);
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            int id = (int) (System.currentTimeMillis() % 1000000);
            PendingIntent open = PendingIntent.getActivity(c, id, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
            Notification n = new Notification.Builder(c, CHANNEL_CHECK)
                    .setSmallIcon(R.drawable.ic_stat)
                    .setLargeIcon(logo(c))
                    .setColor(0xFFB86A00)
                    .setContentTitle(toman > 0 ? "واریز " + Fa.money(toman) + " تومان نیاز به بررسی دارد" : "یک واریز نیاز به بررسی دارد")
                    .setContentText(why)
                    .setStyle(new Notification.BigTextStyle().bigText(why))
                    .setGroup("ayneh-deposits")
                    .setContentIntent(open)
                    .setAutoCancel(true)
                    .build();
            nm.notify(id, n);
        } catch (Exception ignored) { }
    }
}
