package com.ehessan1974.barq;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * برق — متصفح مستقل لأندرويد (4.0+).
 * يستضيف واجهة برق مباشرة، ويستقبل روابط barq:// و App Links
 * فيفتح التطبيق نفسه بدون المرور بأي متصفح آخر.
 */
public class MainActivity extends Activity {

    private static final String HOME =
            "https://ehessan1974-maker.github.io/browser/";

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setBuiltInZoomControls(false);
        web.setWebViewClient(new WebViewClient());
        web.setBackgroundColor(0xFF0C1210);

        setContentView(web);

        web.loadUrl(resolveTarget(getIntent() != null ? getIntent().getData() : null));
    }

    private String resolveTarget(Uri data) {
        if (data == null) return HOME;
        String scheme = data.getScheme();
        if ("barq".equalsIgnoreCase(scheme)) {
            // barq://open أو barq://<مسار داخلي> — نفتح الواجهة الرئيسية
            return HOME;
        }
        if ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme)) {
            // App Link موثّق — اعرض الصفحة داخل برق مباشرة
            return data.toString();
        }
        return HOME;
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
