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
export const BARQ_VERSION = "1.4.5";

const STABLE =
  "https://github.com/ehessan1974-maker/browser/releases/download/stable";

export const platforms: Platform[] = [
  {
    key: "android",
    osLatin: "Android",
    os: "أندرويد",
    logo: "android",
    file: "barq-android.apk",
    size: "‎16KB",
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

/* بصمات SHA-256 حقيقية — محسوبة من ملفات release المستقر v1.4.5 */
export const checksums: { os: string; hash: string }[] = [
  {
    os: "Android — barq-android.apk",
    hash: "a0aaf099a74ed97932ee49c52b20f6b4f79dacf5be3b23c9abada90db3c61868",
  },
  {
    os: `Windows x64 — Barq-Setup-${BARQ_VERSION}-x64.exe`,
    hash: "2fc827203d8b6717e706c77a95bad69a07a9fbd5376207294efc02a1ab3c4e3e",
  },
  {
    os: `Windows 32-bit — Barq-Setup-${BARQ_VERSION}-ia32.exe`,
    hash: "dbd602aa3e04580becd4c6929c83b8664e9d27c826b446843f134c4ba2199794",
  },
  {
    os: `Windows 7 — Barq-Setup-win7-${BARQ_VERSION}-ia32.exe`,
    hash: "35a3a696b53947be72c03fddb2b049eb3f7a75192256a48f41a5acf8cefb4404",
  },
  {
    os: `macOS — Barq-${BARQ_VERSION}.dmg`,
    hash: "749f82d099fe8f32f760be4fc4d330b28a12b527a00258eacf86dabb6d0228ca",
  },
  {
    os: `Linux — Barq-${BARQ_VERSION}.AppImage`,
    hash: "aa4d584f4fb4e3579d09295a2bf35082387ed92982d3d676db8386c5acba4f3c",
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
