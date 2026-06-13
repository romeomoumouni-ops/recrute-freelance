// Petit système de toast global basé sur un CustomEvent.
// Utilisable depuis n'importe quel composant client : toast('Enregistré ✓').
export function toast(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('rf-toast', { detail: message }));
}
