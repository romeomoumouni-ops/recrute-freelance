import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { dateCourte, heureCourte, euros } from '@/lib/utils';
import { OPERATEUR_LABEL } from '@/lib/constants';
import AdminValidationActions from '@/components/admin/AdminValidationActions';

export const dynamic = 'force-dynamic';

export default async function AdminValidations() {
  const sb = supabaseAdmin();

  const { data: profiles } = await sb
    .from('Profile')
    .select(
      'userId, titre, bio, photoUrl, cvName, cvUrl, dateSoumission, services:Service(id,titre,description,prix,delaiJours,createdAt), portfolio:PortfolioItem(id,imageUrl,ordre), user:User(prenom, email, pays, telephoneMomo, operateurMomo, banni)'
    )
    .eq('statutValidation', 'EN_ATTENTE')
    .order('dateSoumission', { ascending: true });

  type Svc = { id: string; titre: string; description: string; prix: number; delaiJours: number; createdAt: string };
  type Pf = { id: string; imageUrl: string; ordre: number };
  type Row = {
    userId: string;
    titre: string | null;
    bio: string | null;
    photoUrl: string | null;
    cvName: string | null;
    cvUrl: string | null;
    dateSoumission: string | null;
    services: Svc[];
    portfolio: Pf[];
    user: { prenom: string; email: string; pays: string | null; telephoneMomo: string | null; operateurMomo: string | null; banni: boolean } | null;
  };
  const list = (profiles as unknown as Row[]) ?? [];

  return (
    <>
      <h1 className="admin-h1">Demandes de validation</h1>
      <p className="admin-sub">
        Freelances ayant complété tous les critères et soumis leur profil. Vérifiez le portfolio et les
        services, puis approuvez ou refusez. Une fois <strong>approuvé</strong>, le freelance devient
        visible dans « Trouver un freelance ».
      </p>

      {list.length === 0 ? (
        <div className="admin-empty">Aucune demande en attente. ✅</div>
      ) : (
        <div className="admin-cards">
          {list.map((p) => {
            const services = (p.services ?? []).slice().sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
            const portfolio = (p.portfolio ?? []).slice().sort((a, b) => a.ordre - b.ordre);
            return (
              <div className="admin-card hot" key={p.userId} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div className="admin-card-main">
                  {/* En-tête */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {p.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoUrl}
                        alt=""
                        style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    )}
                    <div>
                      <strong>{p.user?.prenom ?? '—'}</strong>{' '}
                      {p.user?.banni && <span className="status red">banni</span>}
                      <div className="admin-meta">
                        {p.titre || 'Sans titre'} · {p.user?.email}
                        {p.user?.pays ? ` · ${p.user.pays}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {p.bio && (
                    <div className="admin-meta" style={{ marginTop: 10, lineHeight: 1.5 }}>{p.bio}</div>
                  )}

                  {/* Portfolio */}
                  <div style={{ marginTop: 12 }}>
                    <div className="admin-meta" style={{ fontWeight: 700, marginBottom: 6 }}>
                      Portfolio ({portfolio.length})
                    </div>
                    {portfolio.length ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {portfolio.map((img) => (
                          <a key={img.id} href={img.imageUrl} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.imageUrl}
                              alt="Réalisation"
                              style={{ width: 110, height: 74, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-meta">Aucune réalisation.</div>
                    )}
                  </div>

                  {/* Services */}
                  <div style={{ marginTop: 12 }}>
                    <div className="admin-meta" style={{ fontWeight: 700, marginBottom: 6 }}>
                      Services ({services.length})
                    </div>
                    {services.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {services.map((s) => (
                          <div key={s.id} className="admin-meta" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <span><strong>{s.titre}</strong>{s.description ? ` — ${s.description.slice(0, 100)}${s.description.length > 100 ? '…' : ''}` : ''}</span>
                            <span style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>dès {euros(s.prix)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-meta">Aucun service.</div>
                    )}
                  </div>

                  {/* Infos diverses */}
                  <div className="admin-meta" style={{ marginTop: 12 }}>
                    MoMo : {p.user?.telephoneMomo || '—'}
                    {p.user?.operateurMomo ? ` (${OPERATEUR_LABEL[p.user.operateurMomo] ?? p.user.operateurMomo})` : ''}
                    {p.cvName && (
                      <> · CV : {p.cvUrl ? (<a href={p.cvUrl} target="_blank" rel="noopener noreferrer" className="inline-ic">{p.cvName}</a>) : p.cvName}</>
                    )}
                    {p.dateSoumission && <> · soumis le {dateCourte(p.dateSoumission)} {heureCourte(p.dateSoumission)}</>}
                  </div>

                  <div className="admin-meta" style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <a href={`/freelance/${p.userId}`} target="_blank" rel="noopener noreferrer" className="inline-ic">
                      Aperçu du profil public ↗
                    </a>
                    <Link href={`/admin/utilisateurs/${p.userId}`} className="inline-ic">Fiche complète →</Link>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <AdminValidationActions userId={p.userId} prenom={p.user?.prenom ?? 'ce freelance'} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
