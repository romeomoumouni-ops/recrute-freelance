type IconProps = { size?: number; className?: string };

/** Monogramme « R » noir (#0d0d0d). */
export function BrandIcon({ size = 30, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        fill="#0d0d0d"
        d="M120 80h150c68 0 122 54 122 122 0 48-27 89-67 109l67 121h-92l-58-105h-38v105h-84V80zm84 75v97h61c26 0 47-22 47-49s-21-48-47-48h-61z"
      />
      <path fill="#0d0d0d" d="M118 432l117-117 59 59-117 58z" />
    </svg>
  );
}

/** Lockup : icône + wordmark « recrutefreelance ». À placer dans un lien .brand. */
export default function Logo({ iconSize = 30 }: { iconSize?: number }) {
  return (
    <>
      <BrandIcon size={iconSize} className="brand-icon" />
      <span className="brand-word">
        recrute<span>freelance</span>
      </span>
    </>
  );
}
