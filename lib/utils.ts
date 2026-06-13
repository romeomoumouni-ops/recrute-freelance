// ===== Helpers UI partagés =====

export function initiales(nom: string): string {
  return nom
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function euros(n: number): string {
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}

export function fcfa(n: number): string {
  return Math.round(n).toLocaleString('fr-FR') + ' FCFA';
}

export function parseSkills(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Formatte une date pour l'affichage tableau (jj/mm/aaaa)
export function dateCourte(d: Date | string): string {
  return new Date(d).toLocaleDateString('fr-FR');
}

export function heureCourte(d: Date | string): string {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
