'use client';

// Ouvre le chat de support global (SupportWidget) via un évènement window.
export default function OpenSupportButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent('open-support'))}
    >
      {children}
    </button>
  );
}
