import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { euros } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Stats {
  clients: number; freelances: number; bannis: number;
  cmd_en_cours: number; cmd_validees: number;
  sequestre: number; gmv: number; revenus: number;
  retraits_attente_n: number; retraits_attente_montant: number;
  flagues: number; avis: number; support_unread: number;
}

export default async function AdminHome() {
  const { data } = await supabaseAdmin().rpc('admin_stats');
  const s = (data as Stats) ?? ({} as Stats);

  return (
    <>
      <h1 className="admin-h1">Tableau de bord</h1>

      {/* Alertes : ce qui demande une action */}
      <div className="admin-alerts">
        <Link href="/admin/retraits" className={`admin-alert${s.retraits_attente_n ? ' hot' : ''}`}>
          <div className="n">{s.retraits_attente_n ?? 0}</div>
          <div className="l">Retraits à envoyer<br /><strong>{euros(s.retraits_attente_montant ?? 0)}</strong></div>
        </Link>
        <Link href="/admin/support" className={`admin-alert${s.support_unread ? ' hot' : ''}`}>
          <div className="n">{s.support_unread ?? 0}</div>
          <div className="l">Messages de support<br />non lus</div>
        </Link>
        <Link href="/admin/moderation" className={`admin-alert${s.flagues ? ' hot' : ''}`}>
          <div className="n">{s.flagues ?? 0}</div>
          <div className="l">Messages flagués<br />à examiner</div>
        </Link>
        <Link href="/admin/litiges" className="admin-alert">
          <div className="n">{s.cmd_en_cours ?? 0}</div>
          <div className="l">Commandes en cours<br />(litiges possibles)</div>
        </Link>
      </div>

      <h2 className="admin-h2">Finances</h2>
      <div className="admin-kpis">
        <Link href="/admin/litiges" className="admin-kpi link"><div className="v">{euros(s.revenus ?? 0)}</div><div className="k">Revenus (commission) →</div></Link>
        <Link href="/admin/litiges" className="admin-kpi link"><div className="v">{euros(s.gmv ?? 0)}</div><div className="k">Volume validé (GMV) →</div></Link>
        <Link href="/admin/litiges" className="admin-kpi link"><div className="v">{euros(s.sequestre ?? 0)}</div><div className="k">En séquestre →</div></Link>
        <Link href="/admin/litiges" className="admin-kpi link"><div className="v">{s.cmd_validees ?? 0}</div><div className="k">Commandes validées →</div></Link>
      </div>

      <h2 className="admin-h2">Communauté <span className="admin-hint-inline">(clique pour voir les données)</span></h2>
      <div className="admin-kpis">
        <Link href="/admin/utilisateurs" className="admin-kpi link"><div className="v">{s.clients ?? 0}</div><div className="k">Clients →</div></Link>
        <Link href="/admin/utilisateurs" className="admin-kpi link"><div className="v">{s.freelances ?? 0}</div><div className="k">Freelances →</div></Link>
        <Link href="/admin/avis" className="admin-kpi link"><div className="v">{s.avis ?? 0}</div><div className="k">Avis →</div></Link>
        <Link href="/admin/utilisateurs" className="admin-kpi link"><div className="v">{s.bannis ?? 0}</div><div className="k">Comptes bannis →</div></Link>
      </div>
    </>
  );
}
