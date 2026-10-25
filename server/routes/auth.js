'use strict';
const { HttpError } = require('../lib/http');
const V = require('../lib/validate');
const sec = require('../lib/security');
const sessions = require('../lib/session');
const { tx } = require('../db');

const HOUR = 3_600_000;
const RESET_TTL = 10 * 60_000;

module.exports = (r, { cfg, db, limiter, sendMail }) => {
  const dummyHash = sec.hashPassword('not-a-real-password-1'); // equalises timing for unknown e-mails
  const isAdminEmail = (email) => cfg.adminEmails.includes(email);
  const byEmail = db.prepare('SELECT * FROM users WHERE email = ?');
  const syncAdmin = (u) => {
    const want = isAdminEmail(u.email) ? 1 : 0;
    if (u.is_admin !== want) { db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(want, u.id); u.is_admin = want; }
  };

  r.post('/api/auth/signup', { limit: { name: 'signup', max: 10, windowMs: HOUR } }, async (ctx) => {
    const b = ctx.body;
    const name = V.name(b.name), email = V.email(b.email), phone = V.phone(b.phone), pw = V.password(b.password);
    if (byEmail.get(email)) throw new HttpError(409, 'An account with this email already exists. Please log in.');
    const id = sec.randomId('u_');
    const now = new Date().toISOString();
    const hash = await sec.hashPassword(pw);
    try {
      db.prepare('INSERT INTO users (id, name, email, phone, password, is_admin, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(id, name, email, phone, hash, isAdminEmail(email) ? 1 : 0, now, now);
    } catch (e) {
      if (/UNIQUE/i.test(e.message)) throw new HttpError(409, 'An account with this email already exists. Please log in.');
      throw e;
    }
    sessions.create(ctx, byEmail.get(email), true);
    ctx.status = 201;
    return { ok: true, user: ctx.user };
  });

  r.post('/api/auth/login', { limit: { name: 'login', max: 30, windowMs: 10 * 60_000 } }, async (ctx) => {
    const email = typeof ctx.body.email === 'string' ? ctx.body.email.trim().toLowerCase() : '';
    const password = typeof ctx.body.password === 'string' ? ctx.body.password.slice(0, 200) : '';
    const lockKey = `${email}|${ctx.ip}`;
    const locked = limiter.lockedFor(lockKey);
    if (locked) throw new HttpError(429, `Too many attempts. Try again in ${locked}s.`, { retryAfter: locked });

    const u = email ? byEmail.get(email) : null;
    const ok = await sec.verifyPassword(password, u ? u.password : await dummyHash);
    if (!u || !ok) {
      limiter.registerFail(lockKey, 5, 60_000);
      throw new HttpError(401, 'Incorrect email or password.');
    }
    limiter.clearFails(lockKey);
    syncAdmin(u);
    sessions.create(ctx, u, !!ctx.body.remember);
    return { ok: true, user: ctx.user };
  });

  r.post('/api/auth/logout', (ctx) => { sessions.destroy(ctx); return { ok: true }; });

  /* Step 1 of password reset. Never reveals whether the e-mail exists (except in dev mode, for the demo UI). */
  r.post('/api/auth/forgot', { limit: { name: 'forgot', max: 8, windowMs: 15 * 60_000 } }, async (ctx) => {
    const email = V.email(ctx.body.email);
    const emailLimit = limiter.hit(`forgot-email:${email}`, 3, 15 * 60_000);
    const u = byEmail.get(email);
    let code = null;
    if (u && emailLimit.ok) {
      code = sec.sixDigitCode();
      db.prepare(`INSERT INTO password_resets (user_id, code_hash, expires_at, attempts) VALUES (?,?,?,0)
                  ON CONFLICT(user_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0`)
        .run(u.id, sec.sha256(`${u.id}:${code}`), Date.now() + RESET_TTL);
      await sendMail({
        to: u.email, subject: 'Your Karnataka Tour password reset code',
        text: `Hi ${u.name},\n\nYour password reset code is ${code}. It expires in 10 minutes.\nIf you did not ask for this, ignore this e-mail.`
      });
    }
    const out = { ok: true };
    if (cfg.resetCodeInResponse) { out.exists = !!u; if (u && code) out.code = code; }
    return out;
  });

  /* Step 2: code + new password. Max 5 wrong codes per request, then the code is burned. */
  r.post('/api/auth/reset', { limit: { name: 'reset', max: 15, windowMs: 15 * 60_000 } }, async (ctx) => {
    const email = V.email(ctx.body.email);
    const code = typeof ctx.body.code === 'string' ? ctx.body.code.trim() : String(ctx.body.code ?? '').trim();
    const pw = V.password(ctx.body.password);
    const invalid = new HttpError(400, 'Invalid or expired code.');
    const u = byEmail.get(email);
    if (!u) throw invalid;
    const row = db.prepare('SELECT * FROM password_resets WHERE user_id = ?').get(u.id);
    if (!row || row.expires_at < Date.now() || row.attempts >= 5) throw invalid;
    if (!sec.safeEqual(sec.sha256(`${u.id}:${code}`), row.code_hash)) {
      db.prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE user_id = ?').run(u.id);
      throw invalid;
    }
    const hash = await sec.hashPassword(pw);
    tx(db, () => {
      db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hash, new Date().toISOString(), u.id);
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(u.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(u.id); // log out everywhere
    });
    return { ok: true };
  });
};
