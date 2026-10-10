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
export const BARQ_VERSION = "1.4.7";

const STABLE =
  "https://github.com/ehessan1974-maker/browser/releases/download/stable";

/* المرآة داخل الموقع نفسه — سير Pages ينسخ أصول الإصدار إلى out/downloads
   وقت النشر. ميزتها: نفس نطاق الموقع الذي يفتح حتى حيث يكون نطاق أصول
   جيت هاب (release-assets.githubusercontent.com) محجوباً أو متقطعاً. */
const MIRROR = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/downloads`;
const GITHUB_FALLBACK = {
  label: "لو تعطّل رابط الموقع — تنزيل من مستودع جيت هاب مباشرة",
};

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
    url: `${MIRROR}/barq-android.apk`,
    alts: [
      {
        ...GITHUB_FALLBACK,
        file: "barq-android.apk (من جيت هاب)",
        size: "‎18KB",
        url: `${STABLE}/barq-android.apk`,
      },
    ],
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
    url: `${MIRROR}/Barq-Setup-${BARQ_VERSION}-x64.exe`,
    secondary: {
      label: "تنزيل نسخة 32-bit — للأجهزة القديمة (ويندوز 10/11)",
      file: `Barq-Setup-${BARQ_VERSION}-ia32.exe`,
      size: "‎~73MB",
      url: `${MIRROR}/Barq-Setup-${BARQ_VERSION}-ia32.exe`,
    },
    alts: [
      {
        label: "نسخة محمولة بدون تثبيت — ويندوز 7 أو 10 (32 بت)",
        file: `Barq-Setup-win7-${BARQ_VERSION}-ia32.zip`,
        size: "‎~85MB",
        url: `${MIRROR}/Barq-Setup-win7-${BARQ_VERSION}-ia32.zip`,
      },
      {
        label: "مثبّت ويندوز 7 — 32 بت",
        file: `Barq-Setup-win7-${BARQ_VERSION}-ia32.exe`,
        size: "‎~62MB",
        url: `${MIRROR}/Barq-Setup-win7-${BARQ_VERSION}-ia32.exe`,
      },
      {
        ...GITHUB_FALLBACK,
        file: `Barq-Setup-${BARQ_VERSION}-ia32.exe (من جيت هاب)`,
        size: "‎~73MB",
        url: `${STABLE}/Barq-Setup-${BARQ_VERSION}-ia32.exe`,
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
    url: `${MIRROR}/Barq-${BARQ_VERSION}.dmg`,
    alts: [
      {
        ...GITHUB_FALLBACK,
        file: `Barq-${BARQ_VERSION}.dmg (من جيت هاب)`,
        size: "‎‎~94MB",
        url: `${STABLE}/Barq-${BARQ_VERSION}.dmg`,
      },
    ],
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
    url: `${MIRROR}/Barq-${BARQ_VERSION}.AppImage`,
    alts: [
      {
        ...GITHUB_FALLBACK,
        file: `Barq-${BARQ_VERSION}.AppImage (من جيت هاب)`,
        size: "‎‎~104MB",
        url: `${STABLE}/Barq-${BARQ_VERSION}.AppImage`,
      },
    ],
  },
];

export const androidPlatform: Platform = platforms[0];

export const androidInstallSteps: readonly string[] = [
  "حمّل ملف APK من زر التحميل أعلاه",
  "افتح الملف واسمح بالتثبيت من «مصادر غير معروفة» — مرة واحدة فقط",
  "اضغط تثبيت، ثم افتح برق وابدأ التصفح بسرعة برق",
];

/* بصمات SHA-256 حقيقية — محسوبة من ملفات release المستقر v1.4.7 (بعد آخر إعادة رفع clobber للسيرات) */
export const checksums: { os: string; hash: string }[] = [
  {
    os: "Android — barq-android.apk",
    hash: "aaf253b844dd501c4648878ecdeb7184e74a89f2c261b55b4d42f92be2136be0",
  },
  {
    os: `Windows x64 — Barq-Setup-${BARQ_VERSION}-x64.exe`,
    hash: "5bbed0830c543cae5a9732d04b6035d348f4e56b914a275086005155ff114c63",
  },
  {
    os: `Windows 32-bit — Barq-Setup-${BARQ_VERSION}-ia32.exe`,
    hash: "1be0fb20881b91de3203ba8ac78b73577fc2e5983911a13f9d568c21ebcf1fe9",
  },
  {
    os: `Windows 7 — Barq-Setup-win7-${BARQ_VERSION}-ia32.exe`,
    hash: "604af8f04a980478d0eb882de54f1620a6716a57c4a76b2c68934c79ce3e9a87",
  },
  {
    os: `macOS — Barq-${BARQ_VERSION}.dmg`,
    hash: "f01a9fc4f8b22e7a489fbe4e4d053ad8055ccb4e5631e9a75b145da24ab5748f",
  },
  {
    os: `Linux — Barq-${BARQ_VERSION}.AppImage`,
    hash: "45586a27fb9977ff0ae046843b4871d8b3ab6c26e9444bd3c945ada7518531ae",
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
