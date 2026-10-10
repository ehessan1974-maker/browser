package com.ehessan1974.barq;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

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
 */
public class MainActivity extends Activity {

    /** الصفحة المحلية — تفتح خلال لحظات على أي جهاز حتى بلا إنترنت */
    private static final String LOCAL_HOME = "file:///android_asset/barq.html";
    /** النسخة الكاملة من الواجهة — رابط اختياري من داخل الصفحة المحلية */
    private static final String FULL_SITE =
            "https://ehessan1974-maker.github.io/browser/";

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
