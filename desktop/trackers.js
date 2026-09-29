// برق — قائمة حظر المتعقبات والملاحظات الإعلانية (نسخة بداية)
// تُطابق بنطاق المضيف: host === domain || host.endsWith("." + domain)
// لا تُحظر طلبات mainFrame أبدًا — الصفحات نفسها تُحمّل دائمًا.
"use strict";

const blockedHosts = [
  // Google Ads / Analytics / DoubleClick
  "doubleclick.net", "googlesyndication.com", "googleadservices.com",
  "google-analytics.com", "googletagmanager.com", "googletagservices.com",
  "adservice.google.com", "pagead2.googlesyndication.com", "analytics.google.com",
  "adm.google.com", "app-measurement.com", "firebaseio.com",

  // Social trackers
  "connect.facebook.net", "facebook.net", "graph.facebook.com",
  "analytics.twitter.com", "static.ads-twitter.com", "ads-twitter.com",
  "analytics.tiktok.com", "ads.tiktok.com", "business-api.tiktok.com",
  "tr.snapchat.com", "sc-static.net",
  "ct.pinterest.com", "ads.pinterest.com", "log.pinterest.com",
  "snap.licdn.com", "px.ads.linkedin.com", "linkedin.com/px",
  "ads.reddit.com", "events.redditmedia.com", "pixel.redditmedia.com",
  "events.reddit.com",

  // Big ad networks
  "adnxs.com", "adsystem.com", "amazon-adsystem.com", "criteo.com",
  "criteo.net", "pubmatic.com", "rubiconproject.com", "openx.net",
  "casalemedia.com", "bidswitch.net", "smartadserver.com", "adform.net",
  "taboola.com", "outbrain.com", "sharethrough.com", "teads.tv",
  "yieldmo.com", "indexww.com", "gumgum.com", "media.net",
  "33across.com", "adsafeprotected.com", "moatads.com", "doubleverify.com",
  "ads-yahoo.com", "advertising.com", "adtechus.com", "zedo.com",
  "adroll.com", "mathtag.com", "bluekai.com", "crwdcntrl.net",
  "agkn.com", "tapad.com", "id5-sync.com", "adsco.re",
  "servenobid.com", "adnxs-simple.com", "rlcdn.com", "demdex.net",
  "omtrdc.net", "everesttech.net", "yahoo.co.jp/ads", "amtads.com",

  // Analytics / session recording
  "hotjar.com", "hotjar.io", "mixpanel.com", "segment.com", "segment.io",
  "amplitude.com", "chartbeat.com", "chartbeat.net", "quantserve.com",
  "scorecardresearch.com", "comscore.com", "newrelic.com", "nr-data.net",
  "fullstory.com", "logrocket.com", "logrocket.io", "clarity.ms",
  "mouseflow.com", "crazyegg.com", "inspectlet.com", "luckyorange.com",
  "statcounter.com", "addthis.com", "clicky.com", "woopra.com",
  "kissmetrics.com", "kissmetrics.io", "heap.io", "heapanalytics.com",
  "matomo.cloud", "plausible.io", "posthog.com", "branch.io",
  "appsflyer.com", "adjust.com", "kochava.com", "tenjin.io",
  "sentry-cdn.com", "bugsnag.com", "trackjs.com", "errorception.com",

  // Data brokers / identity graphs
  "exelator.com", "eyeota.net", "krxd.net", "liadm.com",
  "bombora.com", "6sc.co", "6sense.com", "clearbit.co",
  "clearbitjs.com", "ubilabs.net", "adsnative.com", "liftsphere.com",

  // Misc ads / pixels
  "pixel.mathtag.com", "s.amazon-adsystem.com", "aax.amazon-adsystem.com",
  "af.marvelloustracks.com", "pxl.kspp.org", "ads.pinterest.com",
  "cdn.taboola.com", "ads.outbrain.com", "widgets.outbrain.com",
  "ads.taboola.com", "trc.taboola.com", "match.taboola.com",
  "ib.adnxs.com", "s.adroll.com", "d.adroll.com", "x.adroll.com",
  "pixel.advertising.com", "ads.yahoo.com", "gemini.yahoo.com",
  "securepubads.g.doubleclick.net", "tpc.googlesyndication.com",
  "static.doubleclick.net", "survey.g.doubleclick.net",
  "cm.g.doubleclick.net", "stats.g.doubleclick.net",
  "ade.googlesyndication.com", "partner.googleadservices.com",
  "bam.nr-data.net", "js-agent.newrelic.com", "api.amplitude.com",
  "cdn.amplitude.com", "api.segment.io", "cdn.segment.com",
  "cdn.mxpnl.com", "api.mixpanel.com", "static.hotjar.com",
  "script.hotjar.com", "events.hotjar.io", "hj.lytics.io",
  "snap.licdn.com", "plausiblecdn.com", "a.quora.com", "q.quora.com",
  "ads.quora.com", "quora.com/qpixel", "s.pinimg.com/web-ads",
  "ads-twitter.com", "static.ads-twitter.com", "ads.pinterest.com",
  "events.pinterest.com", "tr.snapchat.com", "app.adjust.com",
  "sdtag.newrelic.com", "b.clarity.ms", "c.clarity.ms",
  "verify.clarity.ms", "rel.clarity.ms", "script.crazyegg.com",
  "t.insightexpressai.com", "d.turn.com", "data.pixelswap.net",
  "tags.rd.linksynergy.com", "serve.ads.tiktok.com", "analytics.tiktok.com",
  "log.byteoversea.com", "mon.snssdk.com", "applog.tiktok.com",
  "ads.unitychina.cn", "ads.unity3d.com", "app-measurement.com.a",
  "firebase-settings.crashlytics.com", "sdk.split.io", "events.split.io",
];

module.exports = { blockedHosts };
