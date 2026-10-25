'use strict';
const { HttpError, bad } = require('../lib/http');
const V = require('../lib/validate');
const sec = require('../lib/security');

module.exports = (r, { db, catalog }) => {
  const shape = (row, user) => ({
    id: row.id, name: row.display_name, rating: row.rating, text: row.text, date: row.created_at.slice(0, 10),
    mine: !!user && (user.id === row.user_id || user.isAdmin)
  });
  const summary = (destId) => {
    const s = db.prepare('SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE dest_id = ?').get(destId);
    return { count: s.n, average: s.n ? Math.round(s.avg * 10) / 10 : 0 };
  };
  const mustExist = (id) => { if (!catalog.destById.has(id)) throw new HttpError(404, 'Destination not found.'); };

  r.get('/api/destinations/:id/reviews', (ctx) => {
    mustExist(ctx.params.id);
    const rows = db.prepare('SELECT * FROM reviews WHERE dest_id = ? ORDER BY created_at DESC LIMIT 200').all(ctx.params.id);
    return { ok: true, reviews: rows.map((x) => shape(x, ctx.user)), ...summary(ctx.params.id) };
  });

  /* One review per person per destination: posting again edits your earlier review. */
  r.post('/api/destinations/:id/reviews', { auth: true, limit: { name: 'review', max: 20, windowMs: 3_600_000 } }, (ctx) => {
    mustExist(ctx.params.id);
    const rating = Number(ctx.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw bad('Please select a star rating (1–5).');
    const text = V.text(ctx.body.text, 'Review', 3, 1000, { multiline: true });
    const display = V.text(ctx.body.name || ctx.user.name, 'Name', 1, 40);
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM reviews WHERE dest_id = ? AND user_id = ?').get(ctx.params.id, ctx.user.id);
    let id;
    if (existing) {
      id = existing.id;
      db.prepare('UPDATE reviews SET rating = ?, text = ?, display_name = ?, created_at = ? WHERE id = ?').run(rating, text, display, now, id);
    } else {
      id = sec.randomId('r_');
      db.prepare('INSERT INTO reviews (id, dest_id, user_id, display_name, rating, text, created_at) VALUES (?,?,?,?,?,?,?)')
        .run(id, ctx.params.id, ctx.user.id, display, rating, text, now);
      ctx.status = 201;
    }
    const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    return { ok: true, updated: !!existing, review: shape(row, ctx.user), ...summary(ctx.params.id) };
  });

  r.delete('/api/reviews/:id', { auth: true }, (ctx) => {
    const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(ctx.params.id);
    if (!row) throw new HttpError(404, 'Review not found.');
    if (row.user_id !== ctx.user.id && !ctx.user.isAdmin) throw new HttpError(403, 'You can only delete your own reviews.');
    db.prepare('DELETE FROM reviews WHERE id = ?').run(row.id);
    return { ok: true };
  });
};
