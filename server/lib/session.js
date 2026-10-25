'use strict';
const { serializeCookie } = require('./http');
const { newToken, sha256 } = require('./security');

const COOKIE = 'kt_sid';

const publicUser = (row) => ({
  id: row.id, name: row.name, email: row.email, phone: row.phone || '', created: row.created_at, isAdmin: !!row.is_admin
});

function attach(ctx) {
  const tok = ctx.cookies[COOKIE];
  if (!tok || tok.length > 100) return;
  const row = ctx.db.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).get(sha256(tok), Date.now());
  if (row) { ctx.user = publicUser(row); ctx.token = tok; }
}

function create(ctx, userRow, remember) {
  const { db, cfg } = ctx;
  const now = Date.now();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  const tok = newToken();
  const ttl = remember ? cfg.rememberDays * 86_400_000 : cfg.sessionHours * 3_600_000;
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, ip, user_agent) VALUES (?,?,?,?,?,?)')
    .run(sha256(tok), userRow.id, now, now + ttl, ctx.ip || null, String(ctx.req.headers['user-agent'] || '').slice(0, 200));
  ctx.setCookies.push(serializeCookie(COOKIE, tok, {
    maxAge: remember ? ttl / 1000 : undefined, secure: cfg.cookieSecure, httpOnly: true, sameSite: 'Lax'
  }));
  ctx.user = publicUser(userRow);
  ctx.token = tok;
}

function destroy(ctx) {
  if (ctx.token) ctx.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(ctx.token));
  ctx.setCookies.push(serializeCookie(COOKIE, '', { maxAge: 0, secure: ctx.cfg.cookieSecure }));
  ctx.user = null; ctx.token = null;
}

module.exports = { COOKIE, publicUser, attach, create, destroy };
