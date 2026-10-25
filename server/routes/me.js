'use strict';
const { HttpError, bad } = require('../lib/http');
const V = require('../lib/validate');
const sec = require('../lib/security');
const sessions = require('../lib/session');
const { tx } = require('../db');

const MAX_TOURS = 100;
const scalar = (v, max = 40) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.slice(0, max);
  return null;
};
const money = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), 100_000_000) : 0; };

module.exports = (r, { db, catalog, sendMail }) => {
  const getFavs = (uid) => db.prepare('SELECT dest_id FROM favourites WHERE user_id = ? ORDER BY created_at, rowid').all(uid).map((x) => x.dest_id);
  const getTours = (uid) => db.prepare('SELECT data FROM tours WHERE user_id = ? ORDER BY created_at DESC, rowid DESC').all(uid).map((x) => JSON.parse(x.data));

  /* Whitelist + clamp everything: the tour JSON comes from the browser and is shown back to the user later. */
  function cleanTour(t) {
    if (!t || typeof t !== 'object' || Array.isArray(t)) throw bad('Invalid tour.');
    if (!catalog.destById.has(t.dest)) throw bad('Unknown destination.');
    const d = catalog.destById.get(t.dest);
    const out = {
      id: typeof t.id === 'string' && /^t\d{8,16}$/.test(t.id) ? t.id : `t${Date.now()}${Math.floor(Math.random() * 1000)}`,
      ts: Number.isFinite(+t.ts) && +t.ts > 0 ? Math.round(+t.ts) : Date.now(),
      dest: d.id,
      name: V.text(t.name || `Trip to ${d.name}`, 'Tour name', 1, 100),
      travellers: V.int(t.travellers, 'Travellers', 1, 100),
      days: V.int(t.days, 'Days', 1, 60),
      total: money(t.total),
      pp: money(t.pp)
    };
    for (const k of ['mode', 'hotel', 'budget']) if (t[k] !== undefined) out[k] = scalar(t[k], 30);
    for (const k of ['food', 'act', 'shop']) if (t[k] !== undefined) out[k] = scalar(t[k], 30);
    if (Array.isArray(t.parts)) {
      out.parts = t.parts.slice(0, 12).map((p) => (Array.isArray(p) ? [String(p[0] ?? '').slice(0, 60), money(p[1])] : null)).filter(Boolean);
    }
    if (Array.isArray(t.plan)) {
      out.plan = t.plan.slice(0, 60).map((day) => (Array.isArray(day) ? day.slice(0, 50).map((it) => ({
        k: String(it?.k ?? 'other').slice(0, 12), t: String(it?.t ?? '').replace(/\s+/g, ' ').trim().slice(0, 200), c: money(it?.c)
      })) : []));
    }
    if (JSON.stringify(out).length > 30_000) throw bad('Tour is too large.');
    return out;
  }

  /* One call that gives the page everything it needs at load (user + favourites + tours). */
  r.get('/api/bootstrap', (ctx) => {
    if (!ctx.user) return { ok: true, user: null, favs: [], tours: [] };
    return { ok: true, user: ctx.user, favs: getFavs(ctx.user.id), tours: getTours(ctx.user.id) };
  });

  r.get('/api/me', { auth: true }, (ctx) => ({ ok: true, user: ctx.user }));

  r.patch('/api/me', { auth: true }, (ctx) => {
    const name = V.name(ctx.body.name), phone = V.phone(ctx.body.phone);
    db.prepare('UPDATE users SET name = ?, phone = ?, updated_at = ? WHERE id = ?').run(name, phone, new Date().toISOString(), ctx.user.id);
    ctx.user = { ...ctx.user, name, phone };
    return { ok: true, user: ctx.user };
  });

  r.post('/api/me/password', { auth: true, limit: { name: 'pwchange', max: 10, windowMs: 15 * 60_000 } }, async (ctx) => {
    const row = db.prepare('SELECT password FROM users WHERE id = ?').get(ctx.user.id);
    if (typeof ctx.body.oldPassword !== 'string' || !(await sec.verifyPassword(ctx.body.oldPassword, row.password))) throw bad('Current password is incorrect.');
    const hash = await sec.hashPassword(V.password(ctx.body.newPassword));
    tx(db, () => {
      db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hash, new Date().toISOString(), ctx.user.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(ctx.user.id, sec.sha256(ctx.token)); // other devices are logged out
    });
    return { ok: true };
  });

  r.delete('/api/me', { auth: true }, (ctx) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(ctx.user.id); // cascades: sessions, favourites, tours, reviews, posts
    sessions.destroy(ctx);
    return { ok: true };
  });

  /* ---- favourites ---- */
  r.get('/api/me/favourites', { auth: true }, (ctx) => ({ ok: true, favs: getFavs(ctx.user.id) }));
  r.put('/api/me/favourites', { auth: true }, (ctx) => {
    const ids = ctx.body.ids;
    if (!Array.isArray(ids) || ids.length > 200) throw bad('ids must be an array.');
    const clean = [...new Set(ids.filter((x) => typeof x === 'string' && catalog.destById.has(x)))];
    tx(db, () => {
      db.prepare('DELETE FROM favourites WHERE user_id = ?').run(ctx.user.id);
      const ins = db.prepare('INSERT INTO favourites (user_id, dest_id, created_at) VALUES (?,?,?)');
      const base = Date.now();
      clean.forEach((id, i) => ins.run(ctx.user.id, id, base + i));
    });
    return { ok: true, favs: clean };
  });

  /* ---- confirmed tours ---- */
  r.get('/api/me/tours', { auth: true }, (ctx) => ({ ok: true, tours: getTours(ctx.user.id) }));
  r.post('/api/me/tours', { auth: true, limit: { name: 'tour', max: 60, windowMs: 3_600_000 } }, (ctx) => {
    const tour = cleanTour(ctx.body);
    const count = db.prepare('SELECT COUNT(*) AS n FROM tours WHERE user_id = ?').get(ctx.user.id).n;
    if (count >= MAX_TOURS) throw new HttpError(409, `You can keep up to ${MAX_TOURS} tours. Cancel an old one first.`);
    try {
      db.prepare('INSERT INTO tours (user_id, id, dest_id, name, total, data, created_at) VALUES (?,?,?,?,?,?,?)')
        .run(ctx.user.id, tour.id, tour.dest, tour.name, tour.total, JSON.stringify(tour), tour.ts);
    } catch (e) {
      if (/UNIQUE|PRIMARY/i.test(e.message)) throw new HttpError(409, 'This tour is already saved.');
      throw e;
    }
    ctx.status = 201;
    return { ok: true, tour };
  });
  r.delete('/api/me/tours/:id', { auth: true }, (ctx) => {
    const res = db.prepare('DELETE FROM tours WHERE user_id = ? AND id = ?').run(ctx.user.id, ctx.params.id);
    if (!res.changes) throw new HttpError(404, 'Tour not found.');
    return { ok: true };
  });
};
