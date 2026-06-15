import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ShieldCheck, Wallet, Building2, BadgeCheck } from 'lucide-react';
import { getSetting } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    "Inscription gratuite, aucun abonnement. Les freelances ne paient qu'une commission sur les missions réalisées. Paiement Mobile Money sous 3 à 5 jours après validation.",
};

export const dynamic = 'force-dynamic';

export default async function TarifsPage() {
  const rate = Number(await getSetting('commission_rate')) || 0.2;
  const pct = Math.round(rate * 100);
  const part = 100 - pct;
  const exemples = [50, 100, 300, 500];

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>Tarifs</h1>
          <p style={{ fontSize: '.9rem', color: 'var(--gray-300)' }}>
            Simple et transparent : l&apos;inscription est gratuite — vous ne payez que lorsque vous êtes payé.
          </p>
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
            <div className="tarif-price">{pct}%<span> de commission</span></div>
            <p className="tarif-sub">
              Prélevés uniquement sur les missions réalisées. <strong>Inscription gratuite, aucun abonnement.</strong>
            </p>
            <ul className="tarif-list">
              <li><Check size={15} /> Inscription 100% gratuite</li>
              <li><Check size={15} /> Aucun abonnement mensuel</li>
              <li><Check size={15} /> Commission de {pct}% seulement quand vous gagnez</li>
              <li><Check size={15} /> Vous gardez <strong>{part}%</strong> de chaque mission</li>
              <li><Check size={15} /> Paiement sur Mobile Money sous 3 à 5 jours après validation</li>
            </ul>
            <Link href="/inscription?role=freelance" className="btn btn-dark btn-block">Créer mon profil freelance</Link>
          </div>
        </div>

        {/* La commission expliquée */}
        <div className="tarif-note">
          <p>
            <strong>La page de tarification concerne les freelances.</strong> Pour les entreprises, l&apos;utilisation
            de recrutefreelance.com est entièrement gratuite : la commission de {pct}% est prélevée côté freelance,
            sur le montant de chaque mission validée.
          </p>
        </div>

        {/* Exemple de calcul */}
        <h2 className="tarifs-h2">Ce que vous recevez, concrètement</h2>
        <p className="tarifs-p">
          Sur une mission, nous prélevons {pct}% ; le reste vous revient. Exemples :
        </p>
        <div className="table-wrap" style={{ maxWidth: 560 }}>
          <table>
            <thead>
              <tr>
                <th>Montant de la mission</th>
                <th>Commission ({pct}%)</th>
                <th>Vous recevez</th>
              </tr>
            </thead>
            <tbody>
              {exemples.map((m) => (
                <tr key={m}>
                  <td data-label="Mission">{m} €</td>
                  <td data-label="Commission">{Math.round((m * pct) / 100)} €</td>
                  <td data-label="Vous recevez"><strong>{m - Math.round((m * pct) / 100)} €</strong></td>
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
              <p>Une fois la commande validée, votre solde (montant moins {pct}%) devient disponible.</p>
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

        {/* Ce que couvre la commission */}
        <h2 className="tarifs-h2">Ce que couvre la commission</h2>
        <ul className="tarif-list tarif-list-wide">
          <li><ShieldCheck size={15} /> La sécurisation du paiement (séquestre jusqu&apos;à la livraison validée)</li>
          <li><Wallet size={15} /> Le traitement et le versement sur votre Mobile Money</li>
          <li><Check size={15} /> La mise en relation avec des clients européens</li>
          <li><Check size={15} /> Le support et la résolution des litiges</li>
        </ul>

        {/* FAQ */}
        <h2 className="tarifs-h2">Questions fréquentes</h2>
        <div className="faq">
          <details>
            <summary>Y a-t-il des frais d&apos;inscription ou un abonnement ?</summary>
            <p>Non. L&apos;inscription est 100% gratuite et il n&apos;y a aucun abonnement mensuel. Vous ne payez la commission de {pct}% que lorsque vous réalisez une mission.</p>
          </details>
          <details>
            <summary>Quand vais-je recevoir mon argent ?</summary>
            <p>Dès que le client valide la commande, votre solde devient disponible. Vous demandez le retrait et vous recevez le paiement sur votre Mobile Money sous 3 à 5 jours.</p>
          </details>
          <details>
            <summary>La commission s&apos;applique-t-elle aux entreprises ?</summary>
            <p>Non. Les entreprises n&apos;ont aucun frais. La commission de {pct}% concerne uniquement les freelances et est prélevée sur le montant des missions.</p>
          </details>
          <details>
            <summary>Y a-t-il des frais cachés ?</summary>
            <p>Aucun. La commission de {pct}% est le seul prélèvement. Le montant que vous voyez (votre part) est ce que vous recevez.</p>
          </details>
          <details>
            <summary>Comment mon paiement est-il sécurisé ?</summary>
            <p>Le client paie à l&apos;avance et les fonds sont conservés en séquestre par recrutefreelance.com. Ils ne sont libérés qu&apos;une fois votre travail livré et validé — vous êtes donc certain d&apos;être payé pour le travail accepté.</p>
          </details>
        </div>

        <div className="tarifs-cta">
          <h2>Prêt à recevoir des missions d&apos;entreprises européennes ?</h2>
          <p>Inscription gratuite. Vous ne payez que quand vous gagnez.</p>
          <Link href="/inscription?role=freelance" className="btn btn-dark">Créer mon profil freelance</Link>
        </div>
      </div>
    </>
  );
}
