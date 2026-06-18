'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, X, Check, Clock } from 'lucide-react';
import { euros, fcfa, dateCourte } from '@/lib/utils';
import {
  STATUTS_LABEL,
  STATUT_CLASS,
  OPERATEURS_MOMO,
  OPERATEUR_CODE,
  OPERATEUR_LABEL,
  TAUX_FCFA,
  type OrderStatus,
} from '@/lib/constants';
import { toast } from '@/lib/toast';

export interface ClientOrder {
  id: string;
  titre: string;
  freelance: string;
  momoLabel: string;
  total: number;
  date: string;
  statut: OrderStatus;
  hasReview: boolean;
}
export interface FreelanceOrder {
  id: string;
  titre: string;
  client: string;
  montant: number;
  date: string;
  statut: OrderStatus;
}

type Props =
  | { role: 'CLIENT'; prenom: string; clientOrders: ClientOrder[] }
  | {
      role: 'FREELANCE';
      prenom: string;
      freelanceOrders: FreelanceOrder[];
      solde: number;
      enAttente: number;
      gagne: number;
      momo: { numero: string; operateur: string };
    };

function StatusBadge({ statut }: { statut: OrderStatus }) {
  return <span className={`status ${STATUT_CLASS[statut]}`}>{STATUTS_LABEL[statut]}</span>;
}

export default function DashboardClient(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  // ----- Avis (client) -----
  const [reviewOrder, setReviewOrder] = useState<ClientOrder | null>(null);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');

  // ----- Retrait (freelance) -----
  const [retraitOpen, setRetraitOpen] = useState(false);
  const [retraitDone, setRetraitDone] = useState<{ montant: number; fcfa: number; operateur: string } | null>(
    null
  );

  async function validerLivraison(o: ClientOrder) {
    setBusy(o.id);
    const res = await fetch(`/api/orders/${o.id}/valider`, { method: 'POST' });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return toast(data.error || 'Erreur.');
    toast(`Livraison validée ✓ ${euros(data.montant)} envoyés sur le ${o.momoLabel} de ${o.freelance}.`);
    router.refresh();
  }

  async function marquerLivree(o: FreelanceOrder) {
    setBusy(o.id);
    const res = await fetch(`/api/orders/${o.id}/livrer`, { method: 'POST' });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return toast(data.error || 'Erreur.');
    toast('Mission marquée comme livrée ✓ — en attente de validation du client.');
    router.refresh();
  }

  async function submitReview() {
    if (!reviewOrder) return;
    setBusy(reviewOrder.id);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: reviewOrder.id, note, commentaire }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return toast(data.error || 'Erreur.');
    toast('Merci pour votre avis ✓');
    setReviewOrder(null);
    setNote(5);
    setCommentaire('');
    router.refresh();
  }

  // ================= VUE CLIENT =================
  if (props.role === 'CLIENT') {
    const orders = props.clientOrders;
    const enCours = orders.filter((o) => o.statut === 'EN_COURS' || o.statut === 'LIVREE').length;
    const totalInvesti = orders.reduce((s, o) => s + o.total, 0);

    return (
      <div className="container dash">
        <h1>Bonjour {props.prenom}</h1>
        <p className="sub">Voici l&apos;état de vos missions.</p>

        <div className="dash-stats">
          <div className="dash-stat dark">
            <div className="label">Missions en cours</div>
            <div className="value">{enCours}</div>
          </div>
          <div className="dash-stat">
            <div className="label">Missions au total</div>
            <div className="value">{orders.length}</div>
          </div>
          <div className="dash-stat">
            <div className="label">Total investi</div>
            <div className="value">{euros(totalInvesti)}</div>
          </div>
        </div>

        {orders.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mission</th>
                  <th>Freelance</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td data-label="Mission">
                      <strong>{o.titre}</strong>
                    </td>
                    <td data-label="Freelance">{o.freelance}</td>
                    <td data-label="Montant">{euros(o.total)}</td>
                    <td data-label="Date">{dateCourte(o.date)}</td>
                    <td data-label="Statut">
                      <StatusBadge statut={o.statut} />
                    </td>
                    <td data-label="" className="td-action">
                      {o.statut === 'EN_COURS' || o.statut === 'LIVREE' ? (
                        <button
                          className="btn btn-dark btn-sm"
                          disabled={busy === o.id}
                          onClick={() => validerLivraison(o)}
                        >
                          {busy === o.id ? '…' : 'Valider la livraison'}
                        </button>
                      ) : o.statut === 'VALIDEE' || o.statut === 'PAYEE' ? (
                        o.hasReview ? (
                          <span style={{ fontSize: '.72rem', color: 'var(--green)' }}>
                            <Check size={12} /> Fonds envoyés · avis laissé
                          </span>
                        ) : (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setReviewOrder(o)}
                          >
                            Laisser un avis
                          </button>
                        )
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            Aucune mission pour le moment.
            <br />
            <br />
            <Link className="btn btn-dark" href="/recherche">
              Trouver un freelance
            </Link>
          </div>
        )}

        {/* Modal avis */}
        <div
          className={`modal-backdrop${reviewOrder ? ' open' : ''}`}
          onClick={() => setReviewOrder(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {reviewOrder && (
              <>
                <button className="modal-close" onClick={() => setReviewOrder(null)}>
                  <X size={18} />
                </button>
                <h2>Laisser un avis</h2>
                <p className="sub">
                  Mission « {reviewOrder.titre} » avec {reviewOrder.freelance}.
                </p>
                <div className="star-pick">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={n <= note ? 'on' : ''}
                      onClick={() => setNote(n)}
                      aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    >
                      <Star size={26} fill={n <= note ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <div className="field">
                  <label>Commentaire</label>
                  <textarea
                    rows={4}
                    placeholder="Partagez votre expérience…"
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-dark btn-block"
                  disabled={busy === reviewOrder.id}
                  onClick={submitReview}
                >
                  {busy === reviewOrder.id ? 'Envoi…' : 'Publier mon avis'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= VUE FREELANCE =================
  const { freelanceOrders: orders, solde, enAttente, gagne, momo, prenom } = props;
  return (
    <div className="container dash">
      <h1>Bonjour {prenom}</h1>
      <p className="sub">
        Vos missions et vos gains{momo.numero ? ` — Mobile Money : ${momo.numero}` : ''}.
      </p>

      <div className="dash-stats">
        <div className="dash-stat dark">
          <div className="label">Solde disponible pour retrait</div>
          <div className="value">{euros(solde)}</div>
          {solde > 0 && (
            <button
              className="btn btn-light btn-sm"
              style={{ marginTop: 14 }}
              onClick={() => setRetraitOpen(true)}
            >
              Retirer sur Mobile Money
            </button>
          )}
        </div>
        <div className="dash-stat">
          <div className="label">En attente de validation</div>
          <div className="value">{euros(enAttente)}</div>
          <div className="hint" style={{ marginTop: 6, fontSize: '.72rem', color: 'var(--gray-500)' }}>
            Montant total de vos missions en cours (0 % de commission). Débloqué dès que le client valide.
          </div>
        </div>
        <div className="dash-stat">
          <div className="label">Total gagné</div>
          <div className="value">{euros(gagne)}</div>
        </div>
      </div>

      {orders.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mission</th>
                <th>Client</th>
                <th>Montant net</th>
                <th>Date</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td data-label="Mission">
                    <strong>{o.titre}</strong>
                  </td>
                  <td data-label="Client">{o.client}</td>
                  <td data-label="Montant net">{euros(o.montant)}</td>
                  <td data-label="Date">{dateCourte(o.date)}</td>
                  <td data-label="Statut">
                    <StatusBadge statut={o.statut} />
                  </td>
                  <td data-label="" className="td-action">
                    {o.statut === 'EN_COURS' ? (
                      <button
                        className="btn btn-dark btn-sm"
                        disabled={busy === o.id}
                        onClick={() => marquerLivree(o)}
                      >
                        {busy === o.id ? '…' : 'Marquer livrée'}
                      </button>
                    ) : o.statut === 'LIVREE' ? (
                      <span style={{ fontSize: '.72rem', color: 'var(--gray-500)' }}>
                        En attente de validation
                      </span>
                    ) : o.statut === 'VALIDEE' || o.statut === 'PAYEE' ? (
                      <span style={{ fontSize: '.72rem', color: 'var(--green)' }}>
                        <Check size={12} /> Payée sur Mobile Money
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          Aucune mission reçue pour l&apos;instant.
          <br />
          <span style={{ fontSize: '.78rem' }}>
            Complétez votre profil pour apparaître dans les recherches et recevoir des missions.
          </span>
        </div>
      )}

      {/* Modal retrait */}
      <RetraitModal
        open={retraitOpen}
        onClose={() => {
          setRetraitOpen(false);
          setRetraitDone(null);
          router.refresh();
        }}
        solde={solde}
        defaultNumero={momo.numero}
        defaultOperateur={momo.operateur}
        done={retraitDone}
        onDone={setRetraitDone}
        setBusy={setBusy}
      />
    </div>
  );
}

function RetraitModal({
  open,
  onClose,
  solde,
  defaultNumero,
  defaultOperateur,
  done,
  onDone,
  setBusy,
}: {
  open: boolean;
  onClose: () => void;
  solde: number;
  defaultNumero: string;
  defaultOperateur: string;
  done: { montant: number; fcfa: number; operateur: string } | null;
  onDone: (d: { montant: number; fcfa: number; operateur: string }) => void;
  setBusy: (v: string | null) => void;
}) {
  const [operateur, setOperateur] = useState(defaultOperateur || 'ORANGE');
  const [numero, setNumero] = useState(defaultNumero || '+229 01 90 00 00 00');
  const [montant, setMontant] = useState(String(Math.round(solde)));
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const montantNum = Math.min(solde, Number(montant) || 0);
  const fcfaVal = Math.round(montantNum * TAUX_FCFA);

  async function confirm() {
    if (montantNum <= 0) {
      toast('Montant invalide.');
      return;
    }
    setSubmitting(true);
    setBusy('retrait');
    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ montant: montantNum, operateur, numero }),
    });
    const data = await res.json();
    setSubmitting(false);
    setBusy(null);
    if (!res.ok) return toast(data.error || 'Erreur.');
    onDone({ montant: data.montant, fcfa: data.fcfa, operateur });
  }

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="center">
            <div className="success-icon pending"><Clock size={30} /></div>
            <h2>Retrait en cours</h2>
            <p className="sub" style={{ marginTop: 8 }}>
              {euros(done.montant)} (≈ {fcfa(done.fcfa)}) en cours d&apos;envoi via{' '}
              <strong>{OPERATEUR_LABEL[done.operateur] ?? done.operateur}</strong> au {numero}.
              <br />
              Cela peut prendre entre <strong>3 et 5 jours</strong>.
            </p>
            <button className="btn btn-dark btn-block" onClick={onClose}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
            <h2>Retirer mes gains</h2>
            <p className="sub">
              Solde disponible : <strong>{euros(solde)}</strong>
            </p>
            <div className="field">
              <label>Opérateur Mobile Money</label>
            </div>
            <div className="momo-options">
              {OPERATEURS_MOMO.map((label) => {
                const code = OPERATEUR_CODE[label];
                return (
                  <button
                    key={code}
                    type="button"
                    className={code === operateur ? 'active' : ''}
                    onClick={() => setOperateur(code)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="field">
              <label>Numéro Mobile Money</label>
              <input type="tel" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div className="field">
              <label>Montant (€)</label>
              <input
                type="number"
                min={1}
                max={solde}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
              <div className="hint">
                ≈ {fcfa(fcfaVal)} — converti au taux du jour ({TAUX_FCFA}), sans frais cachés.
              </div>
            </div>
            <button className="btn btn-dark btn-block" disabled={submitting} onClick={confirm}>
              {submitting ? 'Traitement…' : 'Confirmer le retrait'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
