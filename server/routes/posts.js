'use strict';
const { HttpError, bad } = require('../lib/http');
const V = require('../lib/validate');
const sec = require('../lib/security');

module.exports = (r, { db, catalog }) => {
  /* Same shape the frontend already uses for its built-in blogs, plus `user: true` and `mine`. */
  const shape = (row, user) => ({
    slug: row.slug, user: true, title: row.title, author: row.author, category: row.category,
    date: row.created_at.slice(0, 10), read: row.read_min, kw: `karnataka,${row.category.toLowerCase()}`,
    img: row.img, excerpt: row.excerpt, body: JSON.parse(row.body),
    mine: !!user && (user.id === row.user_id || user.isAdmin)
  });

  r.get('/api/posts', (ctx) => {
    const rows = db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 200').all();
    return { ok: true, posts: rows.map((x) => shape(x, ctx.user)) };
  });

  r.post('/api/posts', { auth: true, limit: { name: 'post', max: 10, windowMs: 3_600_000 } }, (ctx) => {
    const b = ctx.body;
    const title = V.text(b.title, 'Title', 3, 100);
    const author = V.text(b.author || ctx.user.name, 'Name', 1, 40);
    const category = String(b.category || '');
    if (!catalog.postCategories.includes(category)) throw bad('Please choose a valid category.');
    const text = V.text(b.body, 'Your story', 40, 5000, { multiline: true });
    const img = V.httpUrl(b.img);
    const paras = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    const words = text.split(/\s+/).length;
    const excerpt = text.length > 140 ? `${text.slice(0, 140).replace(/\s+\S*$/, '')}…` : text;
    const slug = `user-${Date.now()}-${sec.randomId('', 2)}`;
    db.prepare('INSERT INTO posts (slug, user_id, author, title, category, img, excerpt, body, read_min, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(slug, ctx.user.id, author, title, category, img, excerpt.replace(/\n/g, ' '), JSON.stringify(paras), Math.max(1, Math.ceil(words / 200)), new Date().toISOString());
    ctx.status = 201;
    return { ok: true, post: shape(db.prepare('SELECT * FROM posts WHERE slug = ?').get(slug), ctx.user) };
  });

  r.delete('/api/posts/:slug', { auth: true }, (ctx) => {
    const row = db.prepare('SELECT user_id FROM posts WHERE slug = ?').get(ctx.params.slug);
    if (!row) throw new HttpError(404, 'Post not found.');
    if (row.user_id !== ctx.user.id && !ctx.user.isAdmin) throw new HttpError(403, 'You can only delete your own posts.');
    db.prepare('DELETE FROM posts WHERE slug = ?').run(ctx.params.slug);
    return { ok: true };
  });
};
