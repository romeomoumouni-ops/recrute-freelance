import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ShieldCheck, Wallet, Building2, BadgeCheck, Gift } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    "Freelances : 7 jours d'essai gratuits, puis 20 000 FCFA/mois, et 0 % de commission — vous gardez 100 % de l'argent que vous gagnez. Gratuit pour les entreprises. Paiement Mobile Money.",
};

export const dynamic = 'force-dynamic';

export default function TarifsPage() {
  const exemples = [50, 100, 300, 500];

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>Tarifs</h1>
        </div>
      </div>

      <div className="container tarifs">
        {/* Deux audiences */}
        <div className="tarifs-grid">
          <div className="tarif-card">
            <div className="tarif-ic"><Building2 size={22} /></div>
            <h2>Pour les entreprises</h2>
            <div className="tarif-price">Gratuit</div>
            <p className="tarif-sub">Aucun frais, jamais.</p>
            <ul className="tarif-list">
              <li><Check size={15} /> Publier un besoin et parcourir les profils</li>
              <li><Check size={15} /> Contacter et échanger avec les freelances</li>
              <li><Check size={15} /> Paiement sécurisé, libéré uniquement à la livraison validée</li>
            </ul>
            <Link href="/recherche" className="btn btn-outline btn-block">Trouver un freelance</Link>
          </div>

          <div className="tarif-card highlight">
            <div className="tarif-ic"><BadgeCheck size={22} /></div>
            <h2>Pour les freelances</h2>
            <div className="tarif-price">20&nbsp;000 FCFA<span> / mois</span></div>
            <p className="tarif-sub">
              <strong>Vos 7 premiers jours sont 100 % gratuits.</strong> Vous testez toute la plateforme sans
              payer. Ensuite, c&apos;est 20&nbsp;000 FCFA/mois (≈&nbsp;30&nbsp;€) — résiliable à tout moment.
            </p>
            <ul className="tarif-list">
              <li><Gift size={15} /> 7 jours d&apos;essai gratuits, sans engagement</li>
              <li><Check size={15} /> <strong>0&nbsp;% de commission</strong> sur vos missions</li>
              <li><Check size={15} /> Vous gardez <strong>100&nbsp;%</strong> de l&apos;argent que vous gagnez</li>
              <li><Check size={15} /> Accès à des clients d&apos;Europe francophone</li>
              <li><Check size={15} /> Paiement sur Mobile Money sous 3 à 5 jours après validation</li>
            </ul>
            <Link href="/inscription?role=freelance" className="btn btn-dark btn-block">Commencer gratuitement</Link>
          </div>
        </div>

        {/* Le principe */}
        <div className="tarif-note">
          <p>
            <strong>Un abonnement simple, zéro commission.</strong> Au lieu de prélever un pourcentage sur
            chaque mission, recrutefreelance.com fonctionne avec un abonnement mensuel unique de
            <strong> 20&nbsp;000 FCFA</strong> côté freelance — avec <strong>7 jours d&apos;essai offerts</strong>.
            Vous encaissez ensuite <strong>l&apos;intégralité</strong> de l&apos;argent que vous gagnez. Pour les entreprises,
            la plateforme reste entièrement gratuite.
          </p>
        </div>

        {/* Exemple de calcul */}
        <h2 className="tarifs-h2">Ce que vous recevez, concrètement</h2>
        <p className="tarifs-p">
          Aucune commission n&apos;est prélevée : le montant de la mission vous revient en entier. Exemples :
        </p>
        <div className="table-wrap" style={{ maxWidth: 560 }}>
          <table>
            <thead>
              <tr>
                <th>Montant de la mission</th>
                <th>Commission</th>
                <th>Vous recevez</th>
              </tr>
            </thead>
            <tbody>
              {exemples.map((m) => (
                <tr key={m}>
                  <td data-label="Mission">{m} €</td>
                  <td data-label="Commission">0 €</td>
                  <td data-label="Vous recevez"><strong>{m} €</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comment vous êtes payé */}
        <h2 className="tarifs-h2">Comment vous êtes payé</h2>
        <div className="tarifs-steps">
          <div className="tarif-step">
            <span className="n">1</span>
            <div>
              <strong>Le client paie</strong>
              <p>Les fonds sont sécurisés par recrutefreelance.com (séquestre), pas encore versés.</p>
            </div>
          </div>
          <div className="tarif-step">
            <span className="n">2</span>
            <div>
              <strong>Vous livrez, le client valide</strong>
              <p>Une fois la commande validée, l&apos;intégralité du montant devient disponible sur votre solde.</p>
            </div>
          </div>
          <div className="tarif-step">
            <span className="n">3</span>
            <div>
              <strong>Vous retirez sur Mobile Money</strong>
              <p>Vous recevez le paiement sur votre Mobile Money sous <strong>3 à 5 jours</strong>.</p>
            </div>
          </div>
        </div>

        {/* Ce que couvre l'abonnement */}
        <h2 className="tarifs-h2">Ce que couvre votre abonnement</h2>
        <ul className="tarif-list tarif-list-wide">
          <li><Check size={15} /> La mise en relation avec des clients européens</li>
          <li><ShieldCheck size={15} /> La sécurisation du paiement (séquestre jusqu&apos;à la livraison validée)</li>
          <li><Wallet size={15} /> Le traitement et le versement sur votre Mobile Money</li>
          <li><Check size={15} /> Le support et la résolution des litiges</li>
        </ul>

        {/* FAQ */}
        <h2 className="tarifs-h2">Questions fréquentes</h2>
        <div className="faq">
          <details>
            <summary>Combien coûte la plateforme pour un freelance ?</summary>
            <p>
              Vos <strong>7 premiers jours sont entièrement gratuits</strong> : vous créez votre profil, recevez
              des demandes et réalisez des missions sans rien payer. Ensuite, l&apos;abonnement est de
              <strong> 20&nbsp;000 FCFA par mois</strong> (≈&nbsp;30&nbsp;€), sans engagement.
            </p>
          </details>
          <details>
            <summary>Prenez-vous une commission sur mes missions ?</summary>
            <p>
              Non. <strong>0&nbsp;% de commission.</strong> Le montant de chaque mission vous revient en
              totalité. La plateforme se rémunère uniquement via l&apos;abonnement mensuel.
            </p>
          </details>
          <details>
            <summary>Que se passe-t-il après les 7 jours gratuits ?</summary>
            <p>
              À la fin de vos 7 jours d&apos;essai, vous passez à 20&nbsp;000 FCFA/mois pour continuer à
              apparaître sur la marketplace et recevoir des missions. Vous pouvez résilier quand vous voulez.
            </p>
          </details>
          <details>
            <summary>Les entreprises paient-elles quelque chose ?</summary>
            <p>Non. Pour les entreprises, l&apos;utilisation de recrutefreelance.com est 100 % gratuite.</p>
          </details>
          <details>
            <summary>Quand vais-je recevoir mon argent ?</summary>
            <p>
              Dès que le client valide la commande, l&apos;intégralité du montant devient disponible. Vous
              demandez le retrait et recevez le paiement sur votre Mobile Money sous 3 à 5 jours.
            </p>
          </details>
          <details>
            <summary>Comment mon paiement est-il sécurisé ?</summary>
            <p>
              Le client paie à l&apos;avance et les fonds sont conservés en séquestre par
              recrutefreelance.com. Ils ne sont libérés qu&apos;une fois votre travail livré et validé — vous
              êtes donc certain d&apos;être payé pour le travail accepté.
            </p>
          </details>
        </div>

        <div className="tarifs-cta">
          <h2>Prêt à recevoir des missions d&apos;entreprises européennes ?</h2>
          <p>Vos 7 premiers jours sont offerts. 0 % de commission — vous gardez 100 % de l&apos;argent que vous gagnez.</p>
          <Link href="/inscription?role=freelance" className="btn btn-dark">Commencer gratuitement</Link>
        </div>
      </div>
    </>
  );
}
