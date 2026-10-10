package com.ehessan1974.barq;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;

/**
 * برق — متصفح مستقل لأندرويد (4.0+).
 *
 * إصلاح 1.4.5 — الأجهزة الضعيفة (مثل Galaxy J5 بأندرويد 5.1):
 * كان التطبيق يفتح على الموقع البعيد مباشرة فيتعلق دقائق على الأجهزة
 * القديمة (WebView قديم + ذاكرة 1.5GB + تحميل Next.js كامل).
 * الآن يفتح التطبيق فوراً على صفحة HTML محلية داخل التطبيق نفسه
 * (assets/barq.html — النسخة الخفيفة) بلا أي انتظار ولا إنترنت،
 * والنسخة الكاملة من الواجهة تبقى رابطاً اختيارياً من داخل الصفحة.
 * مع صفحة خطأ محلية عند فشل أي تحميل بدل الشاشة المعلقة.
 *
 * ويستقبل روابط barq:// و App Links فيفتح التطبيق نفسه
 * بدون المرور بأي متصفح آخر.
 *
 * 1.4.6 — إشعار التحديث من داخل البرنامج: عند كل فتح يجلب التطبيق بصمت
 * ملف version.json الصغير (~100 بايت) من موقع برق، فإن وجد إصداراً
 * أحدث أظهر رسالة عربية بزر «تحديث الآن» يفتح رابط APK الأحدث.
 * صمت تام عند أي خطأ أو انقطاع إنترنت — لا إزعاج أبداً.
 */
public class MainActivity extends Activity {

    /** الصفحة المحلية — تفتح خلال لحظات على أي جهاز حتى بلا إنترنت */
    private static final String LOCAL_HOME = "file:///android_asset/barq.html";
    /** النسخة الكاملة من الواجهة — رابط اختياري من داخل الصفحة المحلية */
    private static final String FULL_SITE =
            "https://ehessan1974-maker.github.io/browser/";
    /** ملف الإصدار الأحدث — يستضيفه موقع برق، يُحدّث مع كل إصدار */
    private static final String VERSION_URL =
            "https://ehessan1974-maker.github.io/browser/version.json";

    private WebView web;
    private String loadedUrl = "";

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setBuiltInZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);

        web.setBackgroundColor(0xFF0C1210);
        web.setWebViewClient(new BarqClient());
        setContentView(web);

        web.loadUrl(resolveTarget(getIntent() != null ? getIntent().getData() : null));

        startUpdateCheck();
    }

    /* -------- 1.4.6 — إشعار التحديث من داخل البرنامج -------- */

    /** يبدأ فحص الإصدار في خيط خلفية — لا يمسّ إطلاق الصفحة المحلية إطلاقاً */
    private void startUpdateCheck() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                String[] upd = fetchUpdateInfo(); // [الإصدار, رابط APK] أو null
                if (upd == null) return; // بلا إنترنت أو أي خطأ — صمت تام
                if (compareVersions(upd[0], BuildConfig.VERSION_NAME) > 0) {
                    showUpdateDialog(upd[0], upd[1]);
                }
            }
        }, "barq-update-check").start();
    }

    /** يجلب version.json ويعيد [الإصدار, رابط APK] — أو null عند أي فشل */
    private String[] fetchUpdateInfo() {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(VERSION_URL).openConnection();
            c.setConnectTimeout(6000);
            c.setReadTimeout(6000);
            c.setRequestProperty("Cache-Control", "no-cache");
            if (c.getResponseCode() != 200) return null;
            BufferedReader r = new BufferedReader(
                    new InputStreamReader(c.getInputStream(), "UTF-8"));
            StringBuilder b = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) b.append(line);
            r.close();
            JSONObject o = new JSONObject(b.toString());
            String v = o.optString("version", "");
            String apk = o.optString("apk", "");
            if (v.length() == 0) return null;
            return new String[]{v, apk};
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) try { c.disconnect(); } catch (Exception ignored) {}
        }
    }

    /** مقارنة إصدارات "1.4.6" نمطياً: >0 إذا a أحدث من b */
    private static int compareVersions(String a, String b) {
        String[] pa = a.split("\\.");
        String[] pb = b.split("\\.");
        int n = Math.max(pa.length, pb.length);
        for (int i = 0; i < n; i++) {
            int x = i < pa.length ? parseIntSafe(pa[i]) : 0;
            int y = i < pb.length ? parseIntSafe(pb[i]) : 0;
            if (x != y) return x - y;
        }
        return 0;
    }

    private static int parseIntSafe(String s) {
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return 0; }
    }

    /** رسالة التحديث — من داخل البرنامج نفسه */
    private void showUpdateDialog(final String version, final String apkUrl) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (isFinishing()) return;
                if (Build.VERSION.SDK_INT >= 17 && isDestroyed()) return;
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("⚡ تحديث جديد لبرق")
                        .setMessage("يتوفر تحديث جديد لبرق — الإصدار " + version
                                + "\nحجم التنزيل صغير جداً وسيبدأ عبر متصفح الهاتف مباشرة.")
                        .setPositiveButton("تحديث الآن",
                                new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface d, int w) {
                                try {
                                    startActivity(new Intent(
                                            Intent.ACTION_VIEW, Uri.parse(apkUrl)));
                                } catch (Exception ignored) {}
                            }
                        })
                        .setNegativeButton("لاحقاً", null)
                        .show();
            }
        });
    }

    private String resolveTarget(Uri data) {
        if (data == null) return LOCAL_HOME;
        String scheme = data.getScheme();
        if ("barq".equalsIgnoreCase(scheme)) {
            // barq://open أو barq://<مسار داخلي> — نفتح الصفحة المحلية
            return LOCAL_HOME;
        }
        if ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme)) {
            // App Link موثّق — اعرض الصفحة داخل برق مباشرة
            return data.toString();
        }
        return LOCAL_HOME;
    }

    /** صفحة خطأ محلية — بدل الشاشة المعلقة أو السوداء عند فشل التحميل */
    private void showErrorPage(String failedUrl) {
        String safe = failedUrl == null ? "" : failedUrl
                .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        String html = "<!doctype html><html lang=\"ar\" dir=\"rtl\"><head>"
                + "<meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
                + "<style>body{background:#0c1210;color:#e7f0ec;font-family:sans-serif;"
                + "display:table-cell;width:100%;height:100%;vertical-align:middle;text-align:center;padding:24px}"
                + "html{display:table;width:100%;height:100%}"
                + "h1{color:#34d399;font-size:22px}p{color:#93a8a0;font-size:14px;line-height:2;margin-top:10px}"
                + "code{color:#6f877e;font-size:11px;word-break:break-all}"
                + "a{display:inline-block;margin-top:22px;padding:12px 30px;border-radius:999px;"
                + "background:rgba(52,211,153,.15);border:1px solid rgba(52,211,153,.5);"
                + "color:#34d399;text-decoration:none;font-weight:bold}</style></head><body>"
                + "<h1>&#9889; تعذّر تحميل الصفحة</h1>"
                + "<p>تحقق من اتصال الإنترنت ثم أعد المحاولة<br>"
                + "<code>" + safe + "</code></p>"
                + "<a href=\"" + LOCAL_HOME + "\">الرجوع لصفحة برق البداية</a>"
                + "</body></html>";
        loadedUrl = "";
        web.loadDataWithBaseURL(LOCAL_HOME, html, "text/html", "utf-8", null);
    }

    private class BarqClient extends WebViewClient {

        // الصيغة القديمة تُستدعى على أندرويد < 6 — وأيضاً للإطار الرئيسي على الجدد
        @Override
        public void onReceivedError(WebView v, int errorCode, String description, String failingUrl) {
            if (Build.VERSION.SDK_INT < 23
                    && failingUrl != null && failingUrl.equals(loadedUrl)) {
                showErrorPage(failingUrl);
            }
        }

        // الصيغة الجديدة على أندرويد 6+ — الإطار الرئيسي فقط
        @Override
        public void onReceivedError(WebView v, WebResourceRequest request, WebResourceError error) {
            if (Build.VERSION.SDK_INT >= 23 && request != null && request.isForMainFrame()) {
                showErrorPage(String.valueOf(request.getUrl()));
            }
        }

        // تتبع عنوان الإطار الرئيسي — لتمييز فشل التحميل الأصلي عن فشل موارد ثانوية
        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            loadedUrl = url == null ? "" : url;
            super.onPageStarted(view, url, favicon);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            // كل الروابط تُفتح داخل برق نفسه — لا متصفح خارجي
            return false;
        }
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
