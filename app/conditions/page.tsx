import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions Générales d'Utilisation et de Vente de recrutefreelance.com : compte, abonnement freelance, commandes, paiement, séquestre, annulation et remboursement.",
};

export const dynamic = 'force-dynamic';

export default function ConditionsPage() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>Conditions Générales d&apos;Utilisation</h1>
        </div>
      </div>

      <div className="container legal">
        <p className="legal-meta">Dernière mise à jour : 15 juin 2026</p>
        <p className="legal-intro">
          Les présentes Conditions Générales d&apos;Utilisation et de Vente (ci-après les « <strong>CGU</strong> »)
          régissent l&apos;accès et l&apos;utilisation de la plateforme <strong>recrutefreelance.com</strong>
          (ci-après la « <strong>Plateforme</strong> »), qui met en relation des entreprises et clients
          (ci-après les « <strong>Clients</strong> ») avec des prestataires indépendants
          (ci-après les « <strong>Freelances</strong> »). En créant un compte ou en utilisant la Plateforme,
          vous reconnaissez avoir lu, compris et accepté sans réserve les présentes CGU.
        </p>

        <h2>Article 1 — Définitions</h2>
        <ul>
          <li><strong>Plateforme</strong> : le site recrutefreelance.com et l&apos;ensemble de ses services.</li>
          <li><strong>Utilisateur</strong> : toute personne disposant d&apos;un compte (Client ou Freelance).</li>
          <li><strong>Client</strong> : entreprise ou personne qui recherche, commande et paie une prestation.</li>
          <li><strong>Freelance</strong> : prestataire indépendant qui propose et réalise des prestations.</li>
          <li><strong>Devis</strong> : proposition chiffrée émise par un Freelance dans la messagerie.</li>
          <li><strong>Commande</strong> : devis accepté et payé par un Client.</li>
          <li><strong>Mission / Prestation</strong> : le service réalisé par le Freelance pour le Client.</li>
          <li><strong>Séquestre</strong> : conservation sécurisée des fonds par la Plateforme jusqu&apos;à validation.</li>
          <li><strong>Mobile Money</strong> : service de paiement mobile par lequel le Freelance est réglé.</li>
          <li><strong>Abonnement</strong> : formule mensuelle souscrite par le Freelance pour accéder à la Plateforme.</li>
        </ul>

        <h2>Article 2 — Objet</h2>
        <p>
          La Plateforme est un service d&apos;intermédiation technique permettant la mise en relation, la
          communication, la contractualisation et le paiement sécurisé entre Clients et Freelances. La
          Plateforme n&apos;est pas l&apos;employeur des Freelances, ni partie au contrat de prestation conclu
          entre un Client et un Freelance ; elle agit en qualité de tiers de confiance et d&apos;intermédiaire
          de paiement.
        </p>

        <h2>Article 3 — Acceptation et modification des CGU</h2>
        <p>
          L&apos;utilisation de la Plateforme emporte acceptation pleine et entière des présentes CGU. La
          Plateforme se réserve le droit de modifier les CGU à tout moment. Les CGU applicables sont celles
          en vigueur à la date d&apos;utilisation. En cas de modification substantielle, les Utilisateurs sont
          informés ; la poursuite de l&apos;utilisation vaut acceptation des CGU modifiées.
        </p>

        <h2>Article 4 — Inscription et compte</h2>
        <h3>4.1 Éligibilité</h3>
        <p>
          L&apos;inscription est réservée aux personnes majeures et juridiquement capables. Les informations
          fournies doivent être exactes, complètes et tenues à jour. Un Utilisateur est responsable de la
          confidentialité de ses identifiants et de toute activité réalisée depuis son compte.
        </p>
        <h3>4.2 Inscription et abonnement</h3>
        <p>
          La création d&apos;un compte est gratuite. Pour les <strong>Clients</strong>, l&apos;utilisation de la
          Plateforme est entièrement gratuite, sans frais ni abonnement. Pour les <strong>Freelances</strong>,
          l&apos;accès à la Plateforme s&apos;effectue via un abonnement mensuel décrit à l&apos;Article 6,
          dont le <strong>premier mois est offert</strong>.
        </p>
        <h3>4.3 Validation des profils Freelances</h3>
        <p>
          Un Freelance n&apos;est rendu visible et accessible aux Clients qu&apos;après avoir complété son
          profil (photo, présentation, portfolio, justificatifs, services, coordonnées Mobile Money) et après
          <strong> approbation par l&apos;équipe de la Plateforme</strong>. La Plateforme se réserve le droit
          d&apos;accepter, de refuser ou de révoquer une validation, à sa discrétion, notamment en cas
          d&apos;informations inexactes ou de non-respect des présentes CGU.
        </p>

        <h2>Article 5 — Commandes et devis</h2>
        <p>
          Le Freelance émet un devis précisant le périmètre, le prix et le délai. La Commande est formée
          lorsque le Client accepte et règle le devis. Le Client et le Freelance définissent ensemble les
          modalités de la Mission ; la Plateforme n&apos;intervient pas dans la définition du contenu de la
          prestation, sans préjudice de son rôle d&apos;arbitrage défini à l&apos;Article 8.
        </p>

        <h2>Article 6 — Prix, paiement et abonnement</h2>
        <h3>6.1 Paiement par le Client</h3>
        <p>
          Le Client règle le montant de la Commande en ligne au moment de l&apos;acceptation du devis. Le
          paiement est traité par un prestataire de services de paiement tiers. Aucun frais ni commission
          n&apos;est facturé au Client en sus du montant de la Mission.
        </p>
        <h3>6.2 Abonnement du Freelance</h3>
        <p>
          La Plateforme <strong>ne prélève aucune commission</strong> sur le montant des Missions : le
          Freelance perçoit <strong>l&apos;intégralité (100&nbsp;%)</strong> du montant de chaque Mission
          validée. En contrepartie de l&apos;accès à la Plateforme (mise en relation, sécurisation du
          paiement, traitement du versement, support et résolution des litiges), le Freelance souscrit un
          <strong> abonnement mensuel de 20&nbsp;000 FCFA</strong>. Le <strong>premier mois est offert</strong> :
          aucun montant n&apos;est dû pendant cette période d&apos;essai. À l&apos;issue du mois offert,
          l&apos;abonnement est exigible pour maintenir la visibilité du profil et l&apos;accès aux Missions.
          L&apos;abonnement est sans engagement et résiliable à tout moment ; il n&apos;est pas remboursable au
          prorata pour le mois entamé.
        </p>

        <h2>Article 7 — Séquestre des fonds</h2>
        <p>
          Afin de protéger les deux parties, les fonds réglés par le Client sont <strong>conservés en
          séquestre</strong> par la Plateforme et ne sont pas immédiatement versés au Freelance. Les fonds
          demeurent en séquestre jusqu&apos;à la validation de la Commande par le Client ou jusqu&apos;à la
          décision de la Plateforme conformément à l&apos;Article 8. Tant que la Commande n&apos;est pas
          validée, le solde correspondant apparaît comme « en attente de validation » et n&apos;est pas
          disponible au retrait.
        </p>

        <h2>Article 8 — Livraison, validation et arbitrage</h2>
        <h3>8.1 Livraison et validation</h3>
        <p>
          Le Freelance livre la Mission via la Plateforme. Le Client dispose alors de la possibilité de
          <strong> valider</strong> la Commande (la prestation étant jugée conforme) ou de demander une
          correction. La validation déclenche la libération de l&apos;intégralité des fonds au profit du
          Freelance, sans aucune déduction de commission.
        </p>
        <h3>8.2 Pouvoir d&apos;arbitrage de la Plateforme</h3>
        <p>
          En cas de désaccord, d&apos;absence de validation, de prestation non conforme, incomplète ou non
          réalisée, la Plateforme est habilitée à intervenir et à décider, à sa seule appréciation et au vu des
          éléments disponibles :
        </p>
        <ul>
          <li>
            soit de <strong>libérer les fonds</strong> au profit du Freelance lorsque la prestation est jugée
            correctement réalisée ;
          </li>
          <li>
            soit d&apos;<strong>annuler la Commande</strong> et de procéder au remboursement du Client lorsque
            la prestation n&apos;est pas correctement réalisée, dans les conditions de l&apos;Article 9.
          </li>
        </ul>
        <p>
          Les décisions d&apos;arbitrage de la Plateforme sont prises de bonne foi dans le but de protéger les
          deux parties.
        </p>

        <h2>Article 9 — Annulation et remboursement</h2>
        <p>
          Lorsqu&apos;une Commande est annulée et ouvre droit à remboursement au profit du Client, le
          remboursement porte sur le montant réglé, <strong>déduction faite des frais de traitement du
          paiement</strong>. Ces frais, correspondant aux coûts non récupérables facturés par le prestataire
          de services de paiement lors de la transaction et de son remboursement, s&apos;élèvent à
          <strong> 10%</strong> du montant de la Commande. Le Client est ainsi remboursé à hauteur de 90% du
          montant réglé. Ces frais de traitement ne sont pas conservés à titre de bénéfice par la Plateforme
          et reflètent les coûts de la transaction.
        </p>
        <p>
          Aucune annulation ne peut intervenir après validation de la Commande par le Client, sauf accord
          exprès de la Plateforme.
        </p>

        <h2>Article 10 — Versement au Freelance (Mobile Money)</h2>
        <p>
          Une fois la Commande validée, le solde du Freelance (l&apos;intégralité du montant de la Mission)
          devient disponible. Le Freelance peut alors demander un retrait. Le versement est effectué sur le
          compte Mobile Money renseigné par le Freelance, généralement sous un délai de <strong>3 à 5
          jours</strong> ouvrés à compter de la demande de retrait. Le Freelance est seul responsable de
          l&apos;exactitude de ses coordonnées Mobile Money.
        </p>

        <h2>Article 11 — Obligations des Utilisateurs</h2>
        <h3>11.1 Freelances</h3>
        <ul>
          <li>Fournir des informations exactes et des prestations conformes aux devis acceptés ;</li>
          <li>Respecter les délais convenus et communiquer de bonne foi ;</li>
          <li>Disposer des droits et compétences nécessaires à la réalisation des Missions.</li>
        </ul>
        <h3>11.2 Clients</h3>
        <ul>
          <li>Décrire leurs besoins de manière claire et complète ;</li>
          <li>Régler les Commandes via la Plateforme et valider les prestations conformes sans retard abusif.</li>
        </ul>

        <h2>Article 12 — Interdiction de contournement</h2>
        <p>
          Afin de garantir la sécurité des paiements et la protection des Utilisateurs, il est
          <strong> strictement interdit</strong> d&apos;échanger des coordonnées personnelles (e-mail,
          téléphone, réseaux sociaux, messageries tierces, etc.) ou de réaliser un paiement en dehors de la
          Plateforme. Toute tentative de contournement peut entraîner un signalement, la suspension ou la
          <strong> résiliation définitive</strong> du compte, sans préavis ni indemnité, et sans préjudice de
          toute action de la Plateforme.
        </p>

        <h2>Article 13 — Propriété intellectuelle des livrables</h2>
        <p>
          Sauf accord particulier entre les parties, les droits sur les livrables sont transférés au Client
          après paiement intégral de la Mission. Chaque Utilisateur garantit détenir les droits sur les
          contenus qu&apos;il publie ou transmet et garantit la Plateforme contre toute réclamation à ce titre.
        </p>

        <h2>Article 14 — Données personnelles</h2>
        <p>
          La Plateforme traite les données personnelles des Utilisateurs conformément à la réglementation
          applicable et à sa politique de confidentialité. Les Utilisateurs disposent de droits d&apos;accès,
          de rectification et de suppression de leurs données, exerçables auprès du support.
        </p>

        <h2>Article 15 — Responsabilité</h2>
        <p>
          La Plateforme agit en qualité d&apos;intermédiaire et de tiers de confiance. Elle ne garantit pas la
          qualité, la conformité ou la bonne fin des prestations, qui relèvent de la responsabilité des
          Freelances. La responsabilité de la Plateforme ne saurait être engagée pour les manquements
          imputables aux Utilisateurs, ni pour les interruptions, indisponibilités ou cas de force majeure. La
          responsabilité de la Plateforme, si elle était retenue, serait limitée au montant de
          l&apos;abonnement mensuel en vigueur.
        </p>

        <h2>Article 16 — Litiges entre Utilisateurs</h2>
        <p>
          Les litiges relatifs à une Mission sont d&apos;abord traités via le support de la Plateforme, qui peut
          exercer son pouvoir d&apos;arbitrage tel que décrit à l&apos;Article 8. Les Utilisateurs s&apos;engagent
          à coopérer de bonne foi et à fournir tout élément utile.
        </p>

        <h2>Article 17 — Suspension et résiliation</h2>
        <p>
          La Plateforme peut suspendre ou résilier l&apos;accès d&apos;un Utilisateur, notamment en cas de
          violation des présentes CGU, de fraude, de comportement abusif ou de tentative de contournement. Un
          Utilisateur peut demander la fermeture de son compte ; les Commandes et obligations en cours
          demeurent régies par les présentes CGU jusqu&apos;à leur terme.
        </p>

        <h2>Article 18 — Droit applicable et juridiction</h2>
        <p>
          Les présentes CGU sont régies par le droit applicable au siège de l&apos;éditeur de la Plateforme. À
          défaut de résolution amiable, tout litige sera soumis aux juridictions compétentes. Les dispositions
          impératives protectrices des consommateurs demeurent réservées.
        </p>

        <h2>Article 19 — Contact</h2>
        <p>
          Pour toute question relative aux présentes CGU, vous pouvez contacter le support via le{' '}
          <Link href="/aide">Centre d&apos;aide</Link>.
        </p>
      </div>
    </>
  );
}
