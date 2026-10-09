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
  /** Real installer URL on the stable GitHub release */
  url: string;
  /** نسخ ثانوية (مثل 32-bit أو ويندوز 7) — روابط صغيرة تحت زر التنزيل */
  alts?: { label: string; file: string; size: string; url: string }[];
  featured?: boolean;
};

/** الإصدار الحالي المنشور على release المستقر — يتحدث مع كل إصدار جديد */
export const BARQ_VERSION = "1.4.4";

const STABLE =
  "https://github.com/ehessan1974-maker/browser/releases/download/stable";

export const platforms: Platform[] = [
  {
    key: "android",
    osLatin: "Android",
    os: "أندرويد",
    logo: "android",
    file: "barq-android.apk",
    size: "‎12KB",
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
    alts: [
      {
        label: "نسخة 32-bit لويندوز 10/11 — الأنسب للأجهزة القديمة",
        file: `Barq-Setup-${BARQ_VERSION}-ia32.exe`,
        size: "‎~73MB",
        url: `${STABLE}/Barq-Setup-${BARQ_VERSION}-ia32.exe`,
      },
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

/* بصمات SHA-256 حقيقية — محسوبة من ملفات release المستقر v1.4.4 */
export const checksums: { os: string; hash: string }[] = [
  {
    os: "Android — barq-android.apk",
    hash: "1c2aee3bd7565dc4e267a8d53ae05d0c7e5ada48c2a01532df7a0261c145aba1",
  },
  {
    os: `Windows x64 — Barq-Setup-${BARQ_VERSION}-x64.exe`,
    hash: "42ce49a5efcd794e4e33d55ca92e9d2f8e613789c3250bd0ba684a24be0a7252",
  },
  {
    os: `Windows 32-bit — Barq-Setup-${BARQ_VERSION}-ia32.exe`,
    hash: "13164c59eda68aba3a697a37abc9451a3726c32dc764612c6720dc9110e42534",
  },
  {
    os: `Windows 7 — Barq-Setup-win7-${BARQ_VERSION}-ia32.exe`,
    hash: "8efd04686a3e05bef1cf7a3a6f6a571209b5d993c303789a1cc6589c965f69c2",
  },
  {
    os: `macOS — Barq-${BARQ_VERSION}.dmg`,
    hash: "ac2e5b486343c7ef3c79f530b4f23c5cd627ca5836dba36fe95773e939aa447f",
  },
  {
    os: `Linux — Barq-${BARQ_VERSION}.AppImage`,
    hash: "34be269f65f386fc73e745753efc0f82beb1e018f5501537c83bebfb2ec24f60",
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
