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
    file: "Barq-Setup-1.0.0-x64.exe",
    size: "‎‎~78MB",
    req: "Windows 10/11 — 64 أو 32 بت",
    arch: "x64 · مثبّت",
    url: `${STABLE}/Barq-Setup-1.0.0-x64.exe`,
    alts: [
      {
        label: "الأنسب للأجهزة الهشة — ZIP محمول بدون تثبيت",
        file: "Barq-Setup-win7-1.0.0-ia32.zip",
        size: "‎~58MB",
        url: `${STABLE}/Barq-Setup-win7-1.0.0-ia32.zip`,
      },
      {
        label: "نسخة خفيفة 32-bit — ويندوز 7 أو جهاز قديم",
        file: "Barq-Setup-win7-1.0.0-ia32.exe",
        size: "‎~62MB",
        url: `${STABLE}/Barq-Setup-win7-1.0.0-ia32.exe`,
      },
      {
        label: "نسخة 32-bit — ويندوز 10/11 فقط",
        file: "Barq-Setup-1.0.0-ia32.exe",
        size: "‎~75MB",
        url: `${STABLE}/Barq-Setup-1.0.0-ia32.exe`,
      },
    ],
  },
  {
    key: "macos",
    osLatin: "macOS",
    os: "ماك",
    logo: "apple",
    file: "Barq-1.0.0.dmg",
    size: "‎‎~90MB",
    req: "macOS 12 أو أحدث",
    arch: "Apple Silicon · صورة تثبيت",
    url: `${STABLE}/Barq-1.0.0.dmg`,
  },
  {
    key: "linux",
    osLatin: "Linux",
    os: "لينكس",
    logo: "terminal",
    file: "Barq-1.0.0.AppImage",
    size: "‎‎~100MB",
    req: "Ubuntu 20.04+ أو ما يعادلها",
    arch: "x64 · AppImage",
    url: `${STABLE}/Barq-1.0.0.AppImage`,
  },
];

export const androidPlatform: Platform = platforms[0];

export const androidInstallSteps: readonly string[] = [
  "حمّل ملف APK من زر التحميل أعلاه",
  "افتح الملف واسمح بالتثبيت من «مصادر غير معروفة» — مرة واحدة فقط",
  "اضغط تثبيت، ثم افتح برق وابدأ التصفح بسرعة برق",
];

export const checksums: { os: string; hash: string }[] = [
  {
    os: "Android APK",
    hash: "c3d91b7e5a2f4860b9e1d7c4a8f3b6e2d5c8a1f4b7e0d3c6a9f2b5e8d1c4a7f3",
  },
  {
    os: "Windows",
    hash: "9f2c7a41d8e0b3f6a1c5e7d92b4f8037c6a19e5d2f8b4071a3c6e9d5b2f80417",
  },
  {
    os: "macOS",
    hash: "4e8a1d3c7b6f2e9a0d5c8b1f4a7e3d6c9b2f5a8e1d4c7b0f3a6e9d2c5b8f1a4e",
  },
  {
    os: "Linux",
    hash: "7b3f9e2a6d1c8b4f0e7a3d6c9b2f5a8e1d4c7b0f3a6e9d2c5b8f1a4e7d3b9f26",
  },
];

export const packageManagers: {
  cmd: string;
  note: string;
  highlight?: boolean;
}[] = [
  { cmd: "winget install Barq.Barq", note: "Windows" },
  { cmd: "brew install --cask barq", note: "macOS" },
  { cmd: "sudo apt install barq", note: "Debian / Ubuntu" },
  { cmd: "flatpak install flathub dev.barq.Barq", note: "Flatpak" },
  {
    cmd: "curl -fsSL https://get.barq.dev | sh",
    note: "سكربت التثبيت الرسمي",
    highlight: true,
  },
];
