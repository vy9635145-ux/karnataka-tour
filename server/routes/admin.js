'use strict';
const { HttpError } = require('../lib/http');

module.exports = (r, { db }) => {
  const A = { admin: true };
  const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;

  r.get('/api/admin/stats', A, () => ({
    ok: true,
    stats: {
      users: count('users'), tours: count('tours'), reviews: count('reviews'), posts: count('posts'),
      subscribers: count('subscribers'), messages: count('contact_messages'),
      unhandledMessages: db.prepare('SELECT COUNT(*) AS n FROM contact_messages WHERE handled = 0').get().n
    }
  }));

  r.get('/api/admin/messages', A, (ctx) => {
    const only = ctx.query.handled;
    const rows = only === '0' || only === '1'
      ? db.prepare('SELECT * FROM contact_messages WHERE handled = ? ORDER BY id DESC LIMIT 500').all(Number(only))
      : db.prepare('SELECT * FROM contact_messages ORDER BY id DESC LIMIT 500').all();
    return { ok: true, messages: rows.map((m) => ({ ...m, handled: !!m.handled })) };
  });
  r.patch('/api/admin/messages/:id', A, (ctx) => {
    const res = db.prepare('UPDATE contact_messages SET handled = ? WHERE id = ?').run(ctx.body.handled ? 1 : 0, Number(ctx.params.id));
    if (!res.changes) throw new HttpError(404, 'Message not found.');
    return { ok: true };
  });
  r.delete('/api/admin/messages/:id', A, (ctx) => {
    const res = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(Number(ctx.params.id));
    if (!res.changes) throw new HttpError(404, 'Message not found.');
    return { ok: true };
  });

  r.get('/api/admin/subscribers', A, () => ({
    ok: true, subscribers: db.prepare('SELECT email, created_at FROM subscribers ORDER BY created_at DESC LIMIT 5000').all()
  }));

  r.get('/api/admin/users', A, () => ({
    ok: true,
    users: db.prepare('SELECT id, name, email, phone, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 1000').all()
      .map((u) => ({ ...u, is_admin: !!u.is_admin }))
  }));
};
