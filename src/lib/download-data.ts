/* Shared download data — used by the landing section and the /download page */

export type PlatformKey = "android" | "windows" | "macos" | "linux";

export type Platform = {
  key: PlatformKey;
  osLatin: string;
  os: string;
  logo: "android" | "windows" | "apple" | "terminal";
  file: string;
  size: string;
  req: string;
  arch: string;
  /** الرابط الحقيقي للملف — يُنزَّل فعلياً عند الضغط */
  url: string;
  /** زر ثانٍ حقيقي (مثل 32-bit لويندوز) يظهر تحت الزر الرئيسي */
  secondary?: { label: string; file: string; size: string; url: string };
  /** نسخ إضافية (ويندوز 7...) — روابط صغيرة تحت الأزرار */
  alts?: { label: string; file: string; size: string; url: string }[];
  featured?: boolean;
};

/** الإصدار الحالي المنشور على release المستقر — يتحدث مع كل إصدار جديد */
export const BARQ_VERSION = "1.4.6";

const STABLE =
  "https://github.com/ehessan1974-maker/browser/releases/download/stable";

export const platforms: Platform[] = [
  {
    key: "android",
    osLatin: "Android",
    os: "أندرويد",
    logo: "android",
    file: "barq-android.apk",
    size: "‎18KB",
    req: "أندرويد 4.0 فما فوق",
    arch: "APK · كل المعالجات",
    url: `${STABLE}/barq-android.apk`,
    featured: true,
  },
  {
    key: "windows",
    osLatin: "Windows",
    os: "ويندوز",
    logo: "windows",
    file: `Barq-Setup-${BARQ_VERSION}-x64.exe`,
    size: "‎‎~78MB",
    req: "Windows 10/11 — 64 بت",
    arch: "x64 · مثبّت",
    url: `${STABLE}/Barq-Setup-${BARQ_VERSION}-x64.exe`,
    secondary: {
      label: "تنزيل نسخة 32-bit — للأجهزة القديمة (ويندوز 10/11)",
      file: `Barq-Setup-${BARQ_VERSION}-ia32.exe`,
      size: "‎~73MB",
      url: `${STABLE}/Barq-Setup-${BARQ_VERSION}-ia32.exe`,
    },
    alts: [
      {
        label: "نسخة محمولة بدون تثبيت — ويندوز 7 أو 10 (32 بت)",
        file: `Barq-Setup-win7-${BARQ_VERSION}-ia32.zip`,
        size: "‎~85MB",
        url: `${STABLE}/Barq-Setup-win7-${BARQ_VERSION}-ia32.zip`,
      },
      {
        label: "مثبّت ويندوز 7 — 32 بت",
        file: `Barq-Setup-win7-${BARQ_VERSION}-ia32.exe`,
        size: "‎~62MB",
        url: `${STABLE}/Barq-Setup-win7-${BARQ_VERSION}-ia32.exe`,
      },
    ],
  },
  {
    key: "macos",
    osLatin: "macOS",
    os: "ماك",
    logo: "apple",
    file: `Barq-${BARQ_VERSION}.dmg`,
    size: "‎‎~94MB",
    req: "macOS 12 أو أحدث",
    arch: "Apple Silicon · صورة تثبيت",
    url: `${STABLE}/Barq-${BARQ_VERSION}.dmg`,
  },
  {
    key: "linux",
    osLatin: "Linux",
    os: "لينكس",
    logo: "terminal",
    file: `Barq-${BARQ_VERSION}.AppImage`,
    size: "‎‎~104MB",
    req: "Ubuntu 20.04+ أو ما يعادلها",
    arch: "x64 · AppImage",
    url: `${STABLE}/Barq-${BARQ_VERSION}.AppImage`,
  },
];

export const androidPlatform: Platform = platforms[0];

export const androidInstallSteps: readonly string[] = [
  "حمّل ملف APK من زر التحميل أعلاه",
  "افتح الملف واسمح بالتثبيت من «مصادر غير معروفة» — مرة واحدة فقط",
  "اضغط تثبيت، ثم افتح برق وابدأ التصفح بسرعة برق",
];

/* بصمات SHA-256 حقيقية — محسوبة من ملفات release المستقر v1.4.6 */
export const checksums: { os: string; hash: string }[] = [
  {
    os: "Android — barq-android.apk",
    hash: "29b4709d8cb79c5162d0ed77b6dca4750399ca7e62c014bdb54765f207fa13fe",
  },
  {
    os: `Windows x64 — Barq-Setup-${BARQ_VERSION}-x64.exe`,
    hash: "1594c3dbefcc09e4cece7af2c7a3c7f92bf2d7f977fb8eb1f3e660064ed87024",
  },
  {
    os: `Windows 32-bit — Barq-Setup-${BARQ_VERSION}-ia32.exe`,
    hash: "dc27ed95e86b96aaf1961d7a48f0b943f5d4107a898c57b0bb54c803399901fb",
  },
  {
    os: `Windows 7 — Barq-Setup-win7-${BARQ_VERSION}-ia32.exe`,
    hash: "09e57ea75ac61a8578f36ddcd7c31c6d5cabe5b9669daf3cf32dcdb22fd04085",
  },
  {
    os: `macOS — Barq-${BARQ_VERSION}.dmg`,
    hash: "276e6c434a9e2459731fd3aaf4f2a2ff2fb2b807c35cfc0c7de2149fabdafda4",
  },
  {
    os: `Linux — Barq-${BARQ_VERSION}.AppImage`,
    hash: "6a954d1cb78efecf61936fdf3275a65e1f247f3e7a114e2a456e61c85186bd92",
  },
];

/* أوامر حقيقية للتحقق من البصمة والتشغيل — تُعرض في نافذة الطرفية بالصفحة */
export const packageManagers: {
  cmd: string;
  note: string;
  highlight?: boolean;
}[] = [
  {
    cmd: `certutil -hashfile Barq-Setup-${BARQ_VERSION}-ia32.exe SHA256`,
    note: "ويندوز — تحقّق من البصمة",
    highlight: true,
  },
  {
    cmd: `shasum -a 256 Barq-${BARQ_VERSION}.dmg`,
    note: "macOS — تحقّق من البصمة",
  },
  {
    cmd: `sha256sum Barq-${BARQ_VERSION}.AppImage`,
    note: "لينكس — تحقّق من البصمة",
  },
  {
    cmd: `chmod +x Barq-${BARQ_VERSION}.AppImage && ./Barq-${BARQ_VERSION}.AppImage`,
    note: "لينكس — تشغيل مباشر",
  },
];
