import Link from 'next/link';
import { Bot, Clapperboard, Code2, Megaphone } from 'lucide-react';
import HomeSearch from '@/components/HomeSearch';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-bg"
          src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1800&q=80"
          alt="Freelance au travail"
        />
        <div className="hero-overlay" />
        <div className="container">
          <div className="hero-content">
            <h1>Trouvez le freelance parfait pour vos besoins</h1>
            <p className="sub">
              Connectez votre entreprise aux meilleurs talents d&apos;Afrique francophone. Même
              langue, même fuseau horaire, tarifs jusqu&apos;à 60&nbsp;% plus compétitifs.
            </p>
            <HomeSearch />
            <div className="chips">
              <Link className="chip" href="/recherche?cat=design">
                Design de logo
              </Link>
              <Link className="chip" href="/recherche?cat=dev">
                Site &amp; Développement web
              </Link>
              <Link className="chip" href="/recherche?cat=ia">
                Services IA
              </Link>
              <Link className="chip" href="/recherche?cat=marketing">
                Marketing Digital
              </Link>
              <Link className="chip" href="/recherche?cat=audiovisuel">
                Audiovisuel
              </Link>
              <Link className="chip" href="/recherche?cat=redaction">
                Rédaction
              </Link>
              <Link className="chip" href="/recherche?cat=social">
                Réseaux sociaux
              </Link>
              <Link className="chip" href="/recherche?cat=business">
                Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container stats-inner">
          <div className="stat">
            <strong>Jusqu&apos;à -60&nbsp;%</strong>
            <span>par rapport aux tarifs du marché européen</span>
          </div>
          <div className="stat">
            <strong>Paiement Mobile Money</strong>
            <span>les freelances sont payés directement, sans friction</span>
          </div>
          <div className="stat">
            <strong>100&nbsp;% francophone</strong>
            <span>même langue, fuseaux horaires quasi identiques</span>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <div className="section-head">
            <h2>Services populaires</h2>
            <Link className="all-link" href="/recherche">
              Tous les services
            </Link>
          </div>
          <div className="cards">
            <Link className="card" href="/recherche?cat=ia">
              <div className="icon"><Bot size={24} /></div>
              <h3>Services IA</h3>
              <p>Automatisation, chatbots, data — les meilleurs experts IA d&apos;Afrique francophone.</p>
            </Link>
            <Link className="card dark" href="/recherche?cat=audiovisuel">
              <div className="icon"><Clapperboard size={24} /></div>
              <h3>Audiovisuel</h3>
              <p>Montage, motion design et animation pour vos contenus et campagnes.</p>
            </Link>
            <Link className="card" href="/recherche?cat=dev">
              <div className="icon"><Code2 size={24} /></div>
              <h3>Site &amp; Développement web</h3>
              <p>Sites, applications et SaaS livrés par des développeurs confirmés.</p>
            </Link>
            <Link className="card" href="/recherche?cat=marketing">
              <div className="icon"><Megaphone size={24} /></div>
              <h3>Marketing Digital</h3>
              <p>SEO, réseaux sociaux, publicité en ligne — boostez votre visibilité.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container promise">
          <div className="promise-card light" id="entreprises">
            <div className="kicker">Pour les entreprises en Europe</div>
            <h3>Des talents vérifiés, des budgets maîtrisés</h3>
            <ul>
              <li>Freelances sélectionnés et évalués sur leurs livrables</li>
              <li>Tarifs nettement plus rentables qu&apos;en Europe, à qualité égale</li>
              <li>Collaboration fluide : même langue, fuseaux horaires proches</li>
              <li>Paiement sécurisé, libéré uniquement à la livraison</li>
            </ul>
            <Link className="btn btn-dark" href="/recherche">
              Trouver un freelance
            </Link>
          </div>
          <div className="promise-card dark" id="freelances">
            <div className="kicker">Pour les freelances en Afrique</div>
            <span className="free-badge">🎁 7 jours d&apos;essai gratuits</span>
            <h3>Des clients européens, payés sur votre Mobile Money</h3>
            <ul>
              <li><strong>7 jours gratuits</strong>, puis 20&nbsp;000 FCFA/mois seulement</li>
              <li><strong>0&nbsp;% de commission</strong> : vous gardez l&apos;intégralité de l&apos;argent que vous gagnez</li>
              <li>Accédez à des missions d&apos;entreprises européennes</li>
              <li>Payé directement sur votre Mobile Money, sans compte bancaire</li>
            </ul>
            <Link className="btn btn-light" href="/inscription?role=freelance">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="comment" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Comment ça marche</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num">1</div>
              <h3>Publiez votre besoin</h3>
              <p>
                Décrivez votre projet en quelques minutes ou parcourez les profils des freelances
                vérifiés.
              </p>
            </div>
            <div className="step">
              <div className="num">2</div>
              <h3>Choisissez votre freelance</h3>
              <p>
                Comparez les propositions, échangez en français et sélectionnez le profil idéal, sans
                barrière de fuseau horaire.
              </p>
            </div>
            <div className="step">
              <div className="num">3</div>
              <h3>Payez en toute sécurité</h3>
              <p>
                Le paiement est sécurisé jusqu&apos;à la livraison. Le freelance reçoit ses fonds
                directement sur son Mobile Money.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 0 }}>
        <div className="cta">
          <h2>Prêt à collaborer avec les meilleurs talents francophones&nbsp;?</h2>
          <p>
            Entreprises : trouvez un freelance gratuitement. Freelances :{' '}
            <strong>7 jours d&apos;essai gratuits</strong>, puis 20&nbsp;000 FCFA/mois, sans aucune commission
            sur vos missions.
          </p>
          <div className="cta-actions">
            <Link className="btn btn-light" href="/recherche">
              Je cherche un freelance
            </Link>
            <Link className="btn btn-ghost" href="/inscription?role=freelance">
              Je deviens freelance
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
