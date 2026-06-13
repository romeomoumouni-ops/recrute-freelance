import 'server-only';

// Envoi d'e-mails transactionnels via l'API Resend (https://resend.com).
// On appelle l'API REST directement (pas de SDK) pour rester léger.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY manquant');
    return false;
  }
  const from = process.env.DIGEST_FROM || 'RecruteFreelance <onboarding@resend.dev>';

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[email] échec Resend', res.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] erreur réseau Resend', e);
    return false;
  }
}
