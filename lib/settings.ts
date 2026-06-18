import 'server-only';
import { supabaseAdmin } from './supabase';

export const SETTING_DEFAULTS: Record<string, string> = {
  commission_rate: '0',
  abonnement_url: '', // lien de paiement Chariow de l'abonnement freelance (20 000 FCFA/mois)
  banner_messagerie:
    "Pour votre sécurité, n'échangez aucune coordonnée hors de la plateforme (mail, WhatsApp, Instagram, etc.) — au risque d'être totalement banni.",
};

export async function getSettings(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin().from('Setting').select('key, value');
  const map = { ...SETTING_DEFAULTS };
  for (const r of (data as { key: string; value: string }[]) ?? []) map[r.key] = r.value;
  return map;
}

export async function getSetting(key: string): Promise<string> {
  const { data } = await supabaseAdmin().from('Setting').select('value').eq('key', key).maybeSingle();
  return (data as { value: string } | null)?.value ?? SETTING_DEFAULTS[key] ?? '';
}
