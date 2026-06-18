import type { Metadata } from 'next';
import { MessageCircle } from 'lucide-react';
import OpenSupportButton from '@/components/OpenSupportButton';

export const metadata: Metadata = {
  title: "Centre d'aide",
  description: 'Questions fréquentes et contact du support de recrutefreelance.com.',
};

const WHATSAPP = 'https://wa.me/22969201952';

export default function AidePage() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>Centre d&apos;aide</h1>
        </div>
      </div>

      <div className="container tarifs">
        {/* Contact support */}
        <div className="tarifs-cta" style={{ marginTop: 0, marginBottom: 40 }}>
          <h2>Besoin d&apos;aide ?</h2>
          <p>Notre équipe vous répond directement dans le chat. Vous pouvez aussi nous écrire sur WhatsApp.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <OpenSupportButton className="btn btn-dark">
              <MessageCircle size={16} /> Contacter le support
            </OpenSupportButton>
            <a className="btn btn-outline" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              Nous écrire sur WhatsApp
            </a>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            Le chat est disponible une fois connecté à votre compte.
          </p>
        </div>

        {/* FAQ */}
        <h2 className="tarifs-h2" style={{ marginTop: 0 }}>Questions fréquentes</h2>
        <div className="faq">
          <details>
            <summary>Comment fonctionne recrutefreelance.com ?</summary>
            <p>
              La plateforme met en relation des entreprises avec des freelances francophones d&apos;Afrique.
              Vous échangez dans la messagerie, le freelance envoie un devis, vous payez en ligne, et les fonds
              sont sécurisés jusqu&apos;à la livraison validée.
            </p>
          </details>
          <details>
            <summary>Comment se passe le paiement ?</summary>
            <p>
              Le client paie par carte. Les fonds sont conservés en séquestre par recrutefreelance.com et ne
              sont libérés au freelance qu&apos;une fois la commande livrée et validée.
            </p>
          </details>
          <details>
            <summary>Quand le freelance reçoit-il son argent ?</summary>
            <p>
              Dès que le client valide la commande, le solde devient disponible. Le freelance demande le retrait
              et reçoit le paiement sur son Mobile Money sous 3 à 5 jours.
            </p>
          </details>
          <details>
            <summary>Comment devenir freelance sur la plateforme ?</summary>
            <p>
              Créez un compte freelance, complétez votre profil (photo, présentation, portfolio, CV, services,
              numéro Mobile Money), puis soumettez votre demande de validation. Une fois approuvé par notre
              équipe, votre profil devient visible dans « Trouver un freelance ».
            </p>
          </details>
          <details>
            <summary>Que faire en cas de litige ?</summary>
            <p>
              Si un problème survient sur une commande, contactez le support via le chat : notre équipe examine
              la situation et peut, selon les cas, libérer ou rembourser les fonds en séquestre.
            </p>
          </details>
          <details>
            <summary>Puis-je échanger mes coordonnées hors de la plateforme ?</summary>
            <p>
              Non. Pour votre sécurité et celle de votre paiement, n&apos;échangez aucune coordonnée hors
              plateforme (e-mail, WhatsApp, Instagram, etc.). Tout échange et paiement doit rester sur
              recrutefreelance.com — au risque d&apos;être banni.
            </p>
          </details>
          <details>
            <summary>Combien coûte la plateforme ?</summary>
            <p>
              Pour les <strong>entreprises</strong>, c&apos;est entièrement gratuit. Pour les
              <strong> freelances</strong>, les <strong>7 premiers jours sont offerts</strong>, puis
              l&apos;abonnement est de <strong>20&nbsp;000 FCFA/mois</strong> — et <strong>0&nbsp;% de
              commission</strong> sur les missions (vous gardez 100 % de l&apos;argent que vous gagnez). Voir la
              page Tarifs.
            </p>
          </details>
        </div>
      </div>
    </>
  );
}
