import type { Metadata } from "next";
import { DownloadView } from "@/components/download/download-view";

export const metadata: Metadata = {
  title: "تحميل برق لأندرويد — APK مجاني متوافق مع أندرويد 4.0+",
  description:
    "حمّل متصفح برق لأندرويد: أقل من 8MB، يفتح الصفحات في 85ms، ويحجب أكثر من 3,500 متعقّب. متوافق مع أندرويد 4.0 فما فوق — مجاني ومفتوح المصدر، مع نسخ لويندوز وماك ولينكس.",
  alternates: {
    canonical: "/download",
  },
  openGraph: {
    title: "حمّل برق — متصفح خفيف لأندرويد (4.0+)",
    description:
      "أقل من 8MB · يفتح الصفحات في 85ms · يحجب 3,500+ متعقّب · مجاني ومفتوح المصدر. متوافق مع أندرويد 4.0 فما فوق ونسخ سطح المكتب.",
    type: "website",
    url: "/download",
    images: [
      {
        // Resolved against metadataBase (…/browser) — Next joins the pathname
        // automatically, so a plain root path yields /browser/og-download.png.
        url: "/og-download.png",
        width: 1200,
        height: 630,
        alt: "حمّل برق — متصفح خفيف للسرعة والخصوصية",
      },
    ],
  },
};

export default function DownloadPage() {
  return <DownloadView />;
}
