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

/* بصمات SHA-256 حقيقية — محسوبة من ملفات release المستقر v1.4.6 (بعد آخر إعادة رفع clobber للسيرات) */
export const checksums: { os: string; hash: string }[] = [
  {
    os: "Android — barq-android.apk",
    hash: "0505e379f0d4cf753072051d62d532626387202add5bff48f0f00ab85c99b8c9",
  },
  {
    os: `Windows x64 — Barq-Setup-${BARQ_VERSION}-x64.exe`,
    hash: "35fa6f9f3f63cfef3cc32e7bc92ee1055d2369c908378f2395abe193d3c3a896",
  },
  {
    os: `Windows 32-bit — Barq-Setup-${BARQ_VERSION}-ia32.exe`,
    hash: "d58810c2fd7e3289afdd7ac86aaff08f7031adf6b8e395ab31aed169ba13da2e",
  },
  {
    os: `Windows 7 — Barq-Setup-win7-${BARQ_VERSION}-ia32.exe`,
    hash: "25a6e5105b8a8dea7c267e9d8a7fe58267e5559bd39a9721e7acd2d96af7c2e3",
  },
  {
    os: `macOS — Barq-${BARQ_VERSION}.dmg`,
    hash: "41f04a32284fdc786d52f19c2391fe8316d7d9e36b46c7ca237df7223a33ff8e",
  },
  {
    os: `Linux — Barq-${BARQ_VERSION}.AppImage`,
    hash: "9320be5969385eab2ba57f87d7e8e59ce682447509ed4e45f46e9feb68e21d24",
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
