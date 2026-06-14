import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const TABS: [string, string][] = [
  ['/admin', 'Tableau de bord'],
  ['/admin/retraits', 'Retraits'],
  ['/admin/litiges', 'Commandes & litiges'],
  ['/admin/moderation', 'Modération'],
  ['/admin/avis', 'Avis'],
  ['/admin/utilisateurs', 'Utilisateurs'],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Invisible et inaccessible aux non-admins : 404 pur (aucun indice que ça existe).
  const session = await requireAdmin();
  if (!session) notFound();

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="container admin-topbar-inner">
          <span className="admin-logo">⚡ Admin · recrutefreelance</span>
          <nav className="admin-nav">
            {TABS.map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="admin-exit">
            ← Retour au site
          </Link>
        </div>
      </div>
      <div className="container admin-content">{children}</div>
    </div>
  );
}
