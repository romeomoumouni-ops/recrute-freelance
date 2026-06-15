import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Star, Check, FileText, Quote, Eye } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getFreelanceProfile } from '@/lib/freelancers';
import { CATEGORIES } from '@/lib/constants';
import { euros } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import DevisProvider from '@/components/devis/DevisProvider';
import DevisButton from '@/components/devis/DevisButton';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await getFreelanceProfile(params.id);
  if (!f) return { title: 'Profil introuvable' };
  return {
    title: `${f.nom} — ${f.titre}`,
    description: f.bio.slice(0, 160) || `Profil de ${f.nom}, freelance ${f.titre}.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function FreelancePage({ params }: Props) {
  const f = await getFreelanceProfile(params.id);
  if (!f) notFound();

  const session = await auth();
  const isOwner = session?.user.id === f.id;
  const isAdmin = !!session?.user.admin;
  const isLogged = !!session;

  // Découverte : un profil non approuvé n'est visible que par son propriétaire et l'admin.
  if (f.statutValidation !== 'APPROUVE' && !isOwner && !isAdmin) notFound();
  // Seuls les clients (ou visiteurs non connectés → invités à se connecter)
  // peuvent contacter un freelance. Un freelance ne contacte pas un autre freelance.
  const canContact = !isOwner && (!session || session.user.role === 'CLIENT');

  // ----- Colonne principale -----
  const main = (
    <div className="profile-main">
      <div className="fl-top">
        <Avatar nom={f.nom} photoUrl={f.photoUrl} />
        <div>
          <h1>{f.nom}</h1>
          <div className="role">
            {f.titre}
            {f.pays && (
              <span className="role-pays">
                {' · '}<MapPin size={13} /> {f.pays}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="fl-meta" style={{ marginTop: 14 }}>
        {f.avis > 0 ? (
          <span className="rating">
            <Star size={14} fill="currentColor" /> {f.note.toFixed(1)} ({f.avis} avis)
          </span>
        ) : (
          <span className="rating" style={{ color: 'var(--gray-500)' }}>
            Nouveau profil
          </span>
        )}
        {f.cat && <span className="badge">{CATEGORIES[f.cat] ?? f.cat}</span>}
        {f.estVerifie ? (
          <span className="badge badge-verifie"><Check size={13} /> Freelance approuvé</span>
        ) : (
          <span className="badge badge-attente">Vérification en cours</span>
        )}
      </div>

      {f.mot && (
        <div className="profile-note">
          <span className="quote"><Quote size={18} /></span>
          <span>{f.mot}</span>
        </div>
      )}

      <div className="profile-section">
        <h2>À propos</h2>
        <p>{f.bio || 'Ce freelance n’a pas encore rédigé sa présentation.'}</p>
      </div>

      {f.skills.length > 0 && (
        <div className="profile-section">
          <h2>Compétences</h2>
          <div className="skills">
            {f.skills.map((s) => (
              <span className="badge" key={s}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="profile-section">
        <h2>Mes services</h2>
        {f.services.length ? (
          f.services.map((s) => (
            <div className="service-item" key={s.id}>
              <div>
                <div className="titre">{s.titre}</div>
                <div className="desc">{s.description}</div>
                <div className="desc">Livraison estimée : {s.delaiJours} jours</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="prix">dès {euros(s.prix)}</div>
                {canContact && (
                  <div style={{ marginTop: 8 }}>
                    <DevisButton
                      service={{ id: s.id, titre: s.titre, prix: s.prix }}
                      className="btn btn-dark btn-sm"
                      label="Demander un devis"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p style={{ fontSize: '.83rem', color: 'var(--gray-500)' }}>
            Aucun service publié pour le moment.
          </p>
        )}
      </div>

      <div className="profile-section" id="portfolio">
        <h2>Portfolio</h2>
        {f.portfolio.length ? (
          <div className="portfolio-grid">
            {f.portfolio.map((img) => (
              <div className="portfolio-item" key={img.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt="Réalisation" />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '.83rem', color: 'var(--gray-500)' }}>
            Aucune réalisation ajoutée pour le moment.
          </p>
        )}
      </div>

      {f.cvName && f.cvUrl && (
        <div className="profile-section">
          <h2>CV</h2>
          <a
            className="cv-file cv-file-link"
            style={{ maxWidth: 380 }}
            href={f.cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir / télécharger le CV"
          >
            <FileText size={15} /> {f.cvName}
          </a>
        </div>
      )}

      {f.reviews.length > 0 && (
        <div className="profile-section">
          <h2>Avis ({f.avis})</h2>
          {f.reviews.map((r) => (
            <div className="review-item" key={r.id}>
              <div className="review-head">
                <span className="review-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} fill={n <= r.note ? 'currentColor' : 'none'} />
                  ))}
                </span>
                <span className="nom">{r.author}</span>
                <span className="date">· {new Date(r.date).toLocaleDateString('fr-FR')}</span>
              </div>
              {r.commentaire && <p>{r.commentaire}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ----- Encart latéral : propriétaire vs visiteur -----
  if (isOwner) {
    return (
      <div className="container">
        <div className="preview-banner">
          <span>
            <Eye size={16} />{' '}
            {f.statutValidation === 'APPROUVE' ? (
              <>
                <strong>Aperçu de votre profil public</strong> — voici exactement ce que voient les
                entreprises.
              </>
            ) : f.statutValidation === 'EN_ATTENTE' ? (
              <>
                <strong>Aperçu — en attente de validation.</strong> Votre profil n’est pas encore
                visible par les clients ; notre équipe l’examine.
              </>
            ) : (
              <>
                <strong>Aperçu — profil non encore publié.</strong> Complétez les étapes et demandez la
                validation pour apparaître dans « Trouver un freelance ».
              </>
            )}
          </span>
          <Link className="btn btn-light" href="/mon-profil">
            Modifier mon profil
          </Link>
        </div>
        <div className="profile-grid">
          {main}
          <div className="order-box">
            {f.prixMin != null ? (
              <div className="price">À partir de {euros(f.prixMin)}</div>
            ) : (
              <div className="price" style={{ fontSize: '1rem', color: 'var(--gray-500)' }}>
                Tarifs à venir
              </div>
            )}
            <hr />
            <div className="order-line">
              <span>Statut</span>
              <span>{f.estVerifie ? <span className="inline-ic"><Check size={13} /> Vérifié</span> : 'En attente'}</span>
            </div>
            <div className="order-line">
              <span>Langue</span>
              <span>Français</span>
            </div>
            <hr />
            <Link className="btn btn-dark btn-block" href="/mon-profil">
              Modifier mon profil
            </Link>
            <Link className="btn btn-outline btn-block" href="/parametres" style={{ marginTop: 10 }}>
              Vérification du profil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DevisProvider
      freelanceId={f.id}
      freelanceNom={f.nom}
      isLogged={isLogged}
      loginUrl={`/freelance/${f.id}`}
    >
      <div className="container">
        <div className="profile-grid">
          {main}
          <div className="order-box">
            {f.prixMin != null ? (
              <div className="price">À partir de {euros(f.prixMin)}</div>
            ) : (
              <div className="price" style={{ fontSize: '1rem', color: 'var(--gray-500)' }}>
                Sur devis
              </div>
            )}
            <hr />
            <div className="order-line">
              <span>Statut</span>
              <span>{f.estVerifie ? <span className="inline-ic"><Check size={13} /> Vérifié</span> : 'En attente'}</span>
            </div>
            <div className="order-line">
              <span>Langue</span>
              <span>Français</span>
            </div>
            <hr />
            <a className="btn btn-outline btn-block" href="#portfolio">
              Voir le portfolio
            </a>
            {canContact ? (
              <>
                <div style={{ marginTop: 10 }}>
                  <DevisButton className="btn btn-dark btn-block" label="Demander un devis" />
                </div>
                <p
                  style={{
                    fontSize: '.7rem',
                    color: 'var(--gray-500)',
                    textAlign: 'center',
                    marginTop: 12,
                  }}
                >
                  Réponse rapide — échangez directement dans la messagerie.
                </p>
              </>
            ) : (
              <p
                style={{
                  fontSize: '.72rem',
                  color: 'var(--gray-500)',
                  textAlign: 'center',
                  marginTop: 14,
                }}
              >
                Seuls les comptes client peuvent contacter un freelance.
              </p>
            )}
          </div>
        </div>
      </div>
    </DevisProvider>
  );
}
