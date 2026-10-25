'use strict';
/* Sends e-mail through Resend's HTTP API when RESEND_API_KEY is set, otherwise prints it to the
   server console (good enough for development). Failures never break the request. */
module.exports = function createMailer(cfg) {
  return async function sendMail({ to, subject, text }) {
    if (!cfg.resendKey) {
      if (!cfg.silent) console.log(`\n[mail:console] to=${to}\n  subject: ${subject}\n  ${text.replace(/\n/g, '\n  ')}\n`);
      return { ok: true, transport: 'console' };
    }
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: cfg.mailFrom, to: [to], subject, text }),
        signal: AbortSignal.timeout(10_000)
      });
      if (!r.ok) throw new Error(`Resend responded ${r.status}`);
      return { ok: true, transport: 'resend' };
    } catch (e) {
      if (!cfg.silent) console.error('[mail] failed:', e.message);
      return { ok: false, error: e.message };
    }
  };
};
