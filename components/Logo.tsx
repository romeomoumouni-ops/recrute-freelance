type IconProps = { size?: number; className?: string };

/** Icône : deux cercles reliés (lien / mise en relation), noir #0d0d0d.
 *  Format large (ratio 256:120) — `size` = hauteur, largeur déduite. */
export function BrandIcon({ size = 24, className }: IconProps) {
  const ratio = 256 / 120;
  return (
    <svg
      width={Math.round(size * ratio)}
      height={size}
      viewBox="0 0 256 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <g fill="none" stroke="#0D0D0D" strokeWidth={16} strokeLinecap="round">
        <circle cx="60" cy="60" r="24" />
        <circle cx="196" cy="60" r="24" />
        <path d="M84 60 C110 60 128 76 146 76 C164 76 172 60 172 60" />
      </g>
    </svg>
  );
}

/** Lockup : icône + wordmark « recrutefreelance ». À placer dans un lien .brand. */
export default function Logo({ iconSize = 24 }: { iconSize?: number }) {
  return (
    <>
      <BrandIcon size={iconSize} className="brand-icon" />
      <span className="brand-word">
        recrute<span>freelance</span>
      </span>
    </>
  );
}
