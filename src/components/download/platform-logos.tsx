/* Platform brand logos (Simple Icons paths, MIT) — shared across download surfaces */

type LogoProps = { className?: string };

export function AndroidLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9996.4482.9996.9993 0 .5511-.4485.9997-.9996.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0223 3.503C16.1261 8.3785 14.3952 7.8508 12.507 7.8508s-3.6191.5276-5.1367 1.4991L5.348 5.8469a.4161.4161 0 0 0-.5677-.1521.4157.4157 0 0 0-.1521.5676l1.9973 3.4592C3.4374 11.2085.8479 14.5179.4491 18.4849h24.1018c-.3988-3.967-2.9883-7.2764-6.6688-9.1635" />
    </svg>
  );
}

export function WindowsLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M0 3.449 9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699m10.949-9.6H24V24l-12.9-1.801Z" />
    </svg>
  );
}

export function AppleLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.702" />
    </svg>
  );
}

export type LogoKind = "android" | "windows" | "apple" | "terminal";

export function PlatformLogo({
  kind,
  className,
}: {
  kind: LogoKind;
  className?: string;
}) {
  if (kind === "android") return <AndroidLogo className={className} />;
  if (kind === "windows") return <WindowsLogo className={className} />;
  if (kind === "apple") return <AppleLogo className={className} />;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
