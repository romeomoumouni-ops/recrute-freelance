import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { dateCourte, heureCourte } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Début de la journée en heure d'Afrique de l'Ouest (WAT, UTC+1, sans DST).
function debutJourWAT(): string {
  const now = new Date();
  const wat = new Date(now.getTime() + 60 * 60 * 1000);
  const watMidnight = Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate(), 0, 0, 0);
  return new Date(watMidnight - 60 * 60 * 1000).toISOString(); // repasse en UTC
}

export default async function AdminValidations() {
  const sb = supabaseAdmin();
  const debutJour = debutJourWAT();
  const debut7j = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [aujourdhui, semaine, total, enAttente, recentsRes] = await Promise.all([
    sb.from('Profile').select('userId', { count: 'exact', head: true }).gte('dateValidationAuto', debutJour),
    sb.from('Profile').select('userId', { count: 'exact', head: true }).gte('dateValidationAuto', debut7j),
    sb.from('Profile').select('userId', { count: 'exact', head: true }).not('dateValidationAuto', 'is', null),
    sb.from('Profile').select('userId', { count: 'exact', head: true }).eq('statutValidation', 'EN_ATTENTE'),
    sb
      .from('Profile')
      .select('userId, titre, dateValidationAuto, user:User(prenom, email)')
      .not('dateValidationAuto', 'is', null)
      .order('dateValidationAuto', { ascending: false })
      .limit(20),
  ]);

  const nbAujourdhui = aujourdhui.count ?? 0;
  const nbSemaine = semaine.count ?? 0;
  const nbTotal = total.count ?? 0;
  const nbEnAttente = enAttente.count ?? 0;

  type Recent = {
    userId: string;
    titre: string | null;
    dateValidationAuto: string | null;
    user: { prenom: string | null; email: string | null } | null;
  };
  const recents = (recentsRes.data as unknown as Recent[]) ?? [];

  return (
    <>
      <h1 className="admin-h1">Demandes de validation</h1>
      <p className="admin-sub">
        Les profils freelances complets sont désormais <strong>approuvés automatiquement</strong> dès leur
        soumission. Voici le nombre d’approbations automatiques.
      </p>

      {/* Décompte */}
      <div className="admin-alerts" style={{ marginTop: 4 }}>
        <div className={`admin-alert${nbAujourdhui ? ' hot' : ''}`} style={{ cursor: 'default' }}>
          <div className="n">{nbAujourdhui}</div>
          <div className="l">Approuvés automatiquement<br />aujourd’hui</div>
        </div>
        <div className="admin-alert" style={{ cursor: 'default' }}>
          <div className="n">{nbSemaine}</div>
          <div className="l">Approuvés automatiquement<br />(7 derniers jours)</div>
        </div>
        <div className="admin-alert" style={{ cursor: 'default' }}>
          <div className="n">{nbTotal}</div>
          <div className="l">Total approuvés<br />automatiquement</div>
        </div>
      </div>

      {nbEnAttente > 0 && (
        <p className="admin-sub" style={{ marginTop: 16 }}>
          ⚠️ {nbEnAttente} profil(s) encore en attente (cas anciens). Ils seront traités automatiquement à
          leur prochaine soumission.
        </p>
      )}

      {/* Liste récente des auto-approbations */}
      <h2 className="admin-h1" style={{ fontSize: 18, marginTop: 28 }}>
        Dernières approbations automatiques
      </h2>
      {recents.length === 0 ? (
        <div className="admin-empty">Aucune approbation automatique pour l’instant.</div>
      ) : (
        <div className="admin-cards">
          {recents.map((r) => (
            <div className="admin-card" key={r.userId}>
              <div className="admin-card-main">
                <strong>{r.user?.prenom ?? '—'}</strong>
                <div className="admin-meta">
                  {r.titre || 'Sans titre'} · {r.user?.email ?? '—'}
                  {r.dateValidationAuto && (
                    <> · approuvé le {dateCourte(r.dateValidationAuto)} {heureCourte(r.dateValidationAuto)}</>
                  )}
                </div>
                <div className="admin-meta" style={{ marginTop: 8 }}>
                  <Link href={`/admin/utilisateurs/${r.userId}`} className="inline-ic">
                    Fiche complète →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
