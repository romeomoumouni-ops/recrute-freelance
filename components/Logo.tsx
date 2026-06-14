type IconProps = { size?: number; className?: string };

/**
 * Monogramme « R » + flèche verte ascendante.
 * Noir #0d0d0d (jambage + boucle), vert émeraude #1a7f4e (flèche/progression).
 */
export function BrandIcon({ size = 30, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <g stroke="#0d0d0d" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
        {/* jambage vertical */}
        <path d="M18 12 V52" />
        {/* boucle haute du R */}
        <path d="M18 12 H33 C47 12 47 35 33 35 H25" />
      </g>
      {/* flèche verte ascendante = jambe du R */}
      <path
        d="M20 52 L32.5 32 L45 52"
        stroke="#1a7f4e"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Lockup complet : icône + « Recrute Freelance ». À placer dans un lien .brand. */
export default function Logo({ iconSize = 30 }: { iconSize?: number }) {
  return (
    <>
      <BrandIcon size={iconSize} className="brand-icon" />
      <span className="brand-word">
        <b>Recrute</b> Freelance
      </span>
    </>
  );
}
