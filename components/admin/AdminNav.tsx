'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const TABS: [string, string][] = [
  ['/admin', 'Tableau de bord'],
  ['/admin/retraits', 'Retraits'],
  ['/admin/litiges', 'Commandes & litiges'],
  ['/admin/validations', 'Validations'],
  ['/admin/moderation', 'Modération'],
  ['/admin/avis', 'Avis'],
  ['/admin/utilisateurs', 'Utilisateurs'],
  ['/admin/support', 'Support'],
  ['/admin/communication', 'Communication'],
  ['/admin/export', 'Export'],
  ['/admin/reglages', 'Réglages'],
  ['/admin/journal', 'Journal'],
];

function isActive(href: string, pathname: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

export default function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current =
    TABS.find(([href]) => href === pathname) ||
    TABS.filter(([href]) => href !== '/admin').find(([href]) => pathname.startsWith(href)) ||
    TABS[0];

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <>
      {/* Desktop : barre horizontale */}
      <nav className="admin-nav admin-nav-desktop">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className={isActive(href, pathname) ? 'active' : ''}>
            {label}
          </Link>
        ))}
      </nav>

      {/* Mobile : menu déroulant compact */}
      <div className="admin-nav-mobile" ref={ref}>
        <button className="admin-nav-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span>{current[1]}</span>
          <span className="chev">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="admin-nav-dropdown">
            {TABS.map(([href, label]) => (
              <Link key={href} href={href} className={isActive(href, pathname) ? 'active' : ''}>
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
