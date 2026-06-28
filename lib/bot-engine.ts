import 'server-only';
import { supabaseAdmin } from './supabase';
import { getSetting } from './settings';
import { findOrCreateConversation } from './conversations';
import { pickBrief, pickAmount } from './bot-briefs';
import { notifyDevisRecu } from './devis-notify';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const TRIAL_MS = 7 * DAY;
const STEP2_WINDOW = 4 * HOUR; // le bot répond dans les ~4h avant la fin de l'essai

// 2e message quand le testeur a ACCEPTÉ la proposition → paiement imminent.
const PAY_VARIANTS = [
  "Parfait, ça me va. Je règle ça aujourd'hui.",
  "Super, on part là-dessus. Je fais le paiement dans la journée.",
  "Ok pour moi, un instant je reviens pour finaliser le paiement.",
  "Nickel, je valide. Je m'occupe du règlement tout de suite.",
  "C'est bon pour moi, je procède au paiement aujourd'hui.",
  "Top, ça marche. Je lance le paiement d'ici ce soir.",
];

// 2e message quand le testeur a répondu par un TEXTE libre → message générique neutre.
const GENERIC_VARIANTS = [
  "Désolé, je n'ai pas tout compris. Tu peux me renvoyer le devis stp ?",
  "Pardon, je suis un peu perdu — tu peux me repréciser le détail ?",
  "Ok je vois, mais peux-tu me remettre la proposition au propre ? Merci.",
  "Hmm, tu peux me renvoyer le devis avec le détail ? Je veux être sûr.",
  "Merci pour ta réponse. Tu peux me renvoyer le devis final stp ?",
];

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function isActive(v: string): boolean {
  return ['on', '1', 'true', 'oui'].includes((v || '').toLowerCase().trim());
}

interface RunResult {
  skipped?: boolean;
  devisSent: number;
  repliesSent: number;
  closed: number;
}

export async function runBotScenarios(): Promise<RunResult> {
  const result: RunResult = { devisSent: 0, repliesSent: 0, closed: 0 };
  if (!isActive(await getSetting('bots_test_actifs'))) return { ...result, skipped: true };

  const sb = supabaseAdmin();
  const now = Date.now();

  // ===== Étape 1 : demande de devis, dans les 24h avant la fin de l'essai =====
  // On récupère largement les freelances récents puis on filtre la fenêtre en JS
  // (cohérent avec le calcul du blocage qui se base sur new Date(createdAt) + 7j).
  const since = new Date(now - 8 * DAY).toISOString();
  const { data: cands } = await sb
    .from('User')
    .select('id, prenom, createdAt, profile:Profile(cat)')
    .eq('role', 'FREELANCE')
    .eq('isTestBot', false)
    .eq('admin', false)
    .eq('banni', false)
    .gt('createdAt', since);

  type Cand = { id: string; prenom: string; createdAt: string; profile: { cat: string | null } | { cat: string | null }[] | null };
  const candidats = (cands as unknown as Cand[]) ?? [];

  // Scénarios déjà existants (1 par testeur).
  const { data: existing } = await sb.from('BotScenario').select('freelanceId');
  const dejaVus = new Set(((existing as { freelanceId: string }[]) ?? []).map((e) => e.freelanceId));

  // Liste des bots disponibles.
  const { data: botRows } = await sb.from('User').select('id, prenom').eq('isTestBot', true);
  const bots = (botRows as { id: string; prenom: string }[]) ?? [];

  if (bots.length > 0) {
    for (const f of candidats) {
      if (dejaVus.has(f.id)) continue;
      const expiry = new Date(f.createdAt).getTime() + TRIAL_MS;
      const ageDays = (now - new Date(f.createdAt).getTime()) / DAY;
      if (now >= expiry) continue; // essai déjà terminé → on ignore
      if (ageDays < 3) continue; // on contacte le testeur 3 jours après son inscription

      const bot = bots[Math.floor(Math.random() * bots.length)];
      const seed = hash(f.id);
      const prof = Array.isArray(f.profile) ? f.profile[0] : f.profile;
      const description = pickBrief(prof?.cat ?? null, seed);
      const amountEur = pickAmount(seed);

      const conversationId = await findOrCreateConversation(bot.id, f.id);
      if (!conversationId) continue;

      const meta = JSON.stringify({ amountEur, description, status: 'pending' });
      const { data: msg } = await sb
        .from('Message')
        .insert({
          conversationId,
          senderId: bot.id,
          type: 'PROPOSITION',
          meta,
          contenu: `Proposition de prix : ${description}`,
        })
        .select('id')
        .single();
      const propositionMessageId = (msg as { id: string } | null)?.id ?? null;

      await sb.from('BotScenario').insert({
        freelanceId: f.id,
        botId: bot.id,
        conversationId,
        propositionMessageId,
        expiresAt: new Date(expiry).toISOString(),
        step: 'DEVIS_SENT',
        amountEur,
      });

      await notifyDevisRecu({ freelanceId: f.id, fromName: bot.prenom, amountEur, description, conversationId });
      dejaVus.add(f.id);
      result.devisSent++;
    }
  }

  // ===== Étape 2 : réponse du bot, quelques heures avant la fin de l'essai =====
  const { data: scen } = await sb.from('BotScenario').select('*').eq('step', 'DEVIS_SENT');
  type Scen = {
    id: string; freelanceId: string; botId: string; conversationId: string | null;
    propositionMessageId: string | null; expiresAt: string;
  };
  for (const s of (scen as Scen[]) ?? []) {
    const expiry = new Date(s.expiresAt).getTime();
    if (now >= expiry) {
      // Essai terminé : on clôt le scénario sans répondre.
      await sb.from('BotScenario').update({ step: 'DONE' }).eq('id', s.id);
      result.closed++;
      continue;
    }
    if (now < expiry - STEP2_WINDOW) continue; // pas encore dans la fenêtre des dernières heures
    if (!s.conversationId) continue;

    // Le testeur a-t-il réagi ? Priorité à l'acceptation de la proposition.
    let accepted = false;
    if (s.propositionMessageId) {
      const { data: prop } = await sb.from('Message').select('meta').eq('id', s.propositionMessageId).maybeSingle();
      try {
        accepted = JSON.parse((prop as { meta: string | null } | null)?.meta ?? '{}').status === 'accepted';
      } catch {
        accepted = false;
      }
    }
    let reacted = accepted;
    if (!accepted) {
      const { count } = await sb
        .from('Message')
        .select('id', { count: 'exact', head: true })
        .eq('conversationId', s.conversationId)
        .eq('senderId', s.freelanceId);
      reacted = (count ?? 0) > 0;
    }
    if (!reacted) continue; // pas de réaction → on attend (clôture si l'essai se termine)

    const reactedType = accepted ? 'accept' : 'text';
    const variants = accepted ? PAY_VARIANTS : GENERIC_VARIANTS;
    const contenu = variants[hash(s.id) % variants.length];

    await sb.from('Message').insert({ conversationId: s.conversationId, senderId: s.botId, contenu });
    await sb.from('BotScenario').update({ step: 'DONE', reactedType }).eq('id', s.id);
    result.repliesSent++;
  }

  return result;
}
