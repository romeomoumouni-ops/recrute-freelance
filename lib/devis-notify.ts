import 'server-only';
import { supabaseAdmin } from './supabase';
import { sendEmail } from './email';

const SITE = 'https://www.recrutefreelance.com';

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

// Prévient le freelance par e-mail qu'il a reçu une demande de devis.
// Utilisé à la fois par les vrais clients et par le moteur de test.
export async function notifyDevisRecu(opts: {
  freelanceId: string;
  fromName: string;
  amountEur: number;
  description: string;
  conversationId: string;
}): Promise<void> {
  try {
    const sb = supabaseAdmin();
    const { data } = await sb.from('User').select('email, prenom').eq('id', opts.freelanceId).maybeSingle();
    const u = data as { email: string; prenom: string } | null;
    if (!u?.email) return;

    const lien = `${SITE}/messages?c=${opts.conversationId}`;
    const apercu = opts.description.length > 220 ? opts.description.slice(0, 220) + '…' : opts.description;
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;border:1px solid #ececea;border-radius:14px;overflow:hidden">
      <div style="background:#0d0d0d;padding:20px 24px"><span style="color:#fff;font-weight:800;font-size:17px">recrutefreelance</span></div>
      <div style="padding:24px;color:#222;font-size:14px;line-height:1.6">
        <p>Bonjour ${esc(u.prenom || '')},</p>
        <p><strong>${esc(opts.fromName)}</strong> vous a envoyé une <strong>demande de devis</strong> (budget proposé : <strong>${opts.amountEur} €</strong>).</p>
        <p style="background:#f7f7f5;border-radius:10px;padding:12px 14px;color:#444">« ${esc(apercu)} »</p>
        <p style="margin-top:18px"><a href="${lien}" style="background:#0d0d0d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">Voir la demande et répondre</a></p>
        <p style="margin-top:20px;color:#888;font-size:12px">— L'équipe recrutefreelance.com</p>
      </div>
    </div>`;
    await sendEmail({ to: u.email, subject: `💼 Nouvelle demande de devis de ${opts.fromName}`, html });
  } catch {
    /* une notif ratée ne doit pas casser le flux */
  }
}
