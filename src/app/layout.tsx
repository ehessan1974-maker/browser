import type { Metadata, Viewport } from "next";
import { Tajawal, Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "برق — متصفح خفيف للسرعة والخصوصية والأتمتة",
  description:
    "متصفح برق: تشغيل شبه فوري، تحميل صفحات في 85 مللي ثانية، استهلاك 30MB فقط من الذاكرة، وحجب تلقائي لأكثر من 3,500 متعقّب. مصمّم ليتكامل مع الأتمتة ووكلاء الذكاء الاصطناعي.",
  keywords: [
    "متصفح خفيف",
    "حظر المتعقبات",
    "خصوصية",
    "أتمتة",
    "وكلاء الذكاء الاصطناعي",
    "Barq",
    "lightweight browser",
    "tracker blocking",
  ],
  icons: {
    icon: "/barq.svg",
  },
  openGraph: {
    title: "برق — تصفّح أسرع. أخفّ. أكثر خصوصية.",
    description:
      "متصفح خفيف مصمّم للأتمتة ووكلاء الذكاء الاصطناعي: 85ms تحميل، 30MB ذاكرة، 3,500+ متعقّب محظور.",
    siteName: "برق",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1210",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${tajawal.variable} ${spaceGrotesk.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
