import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { auth } from '@/lib/auth';
import AbonnementCard from '@/components/AbonnementCard';

export const metadata: Metadata = { title: 'Mon abonnement' };
export const dynamic = 'force-dynamic';

export default async function MonAbonnementPage() {
  const session = await auth();
  if (!session) redirect('/connexion?callbackUrl=/mon-abonnement');
  if (session.user.role !== 'FREELANCE') redirect('/tarifs');

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>Mon abonnement</h1>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 640, paddingTop: 28, paddingBottom: 48 }}>
        <AbonnementCard />

        <div className="tarif-note" style={{ marginTop: 24 }}>
          <p>
            <strong>Comment ça marche :</strong> votre inscription comprend <strong>7 jours d&apos;essai
            gratuits</strong>. Ensuite, l&apos;accès à la plateforme est de <strong>20&nbsp;000 FCFA/mois</strong>,
            renouvelable. Chaque paiement prolonge votre accès de 30 jours.
          </p>
        </div>

        <h2 className="tarifs-h2" style={{ fontSize: '1.05rem' }}>Ce que comprend votre abonnement</h2>
        <ul className="tarif-list tarif-list-wide">
          <li><Check size={15} /> <strong>0&nbsp;% de commission</strong> : vous gardez 100&nbsp;% de l&apos;argent que vous gagnez</li>
          <li><Check size={15} /> Accès aux clients d&apos;Europe francophone et à la messagerie</li>
          <li><Check size={15} /> Présence dans « Trouver un freelance »</li>
          <li><Check size={15} /> Paiement sécurisé (séquestre) et versement sur Mobile Money</li>
        </ul>
      </div>
    </>
  );
}
