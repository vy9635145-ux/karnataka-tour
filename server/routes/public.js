'use strict';
const { HttpError } = require('../lib/http');

module.exports = (r, { db, catalog }) => {
  const reviewStats = db.prepare('SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE dest_id = ?');

  r.get('/api/health', () => ({ ok: true, time: new Date().toISOString() }));

  r.get('/api/destinations', (ctx) => {
    const q = String(ctx.query.q || '').toLowerCase().trim();
    const cat = String(ctx.query.cat || '').toLowerCase();
    let list = catalog.destinations;
    if (cat && cat !== 'all') list = list.filter((d) => d.cats.includes(cat));
    if (q) list = list.filter((d) => `${d.name} ${d.region} ${d.desc}`.toLowerCase().includes(q));
    return { ok: true, count: list.length, destinations: list };
  });

  r.get('/api/destinations/:id', (ctx) => {
    const d = catalog.destById.get(ctx.params.id);
    if (!d) throw new HttpError(404, 'Destination not found.');
    const s = reviewStats.get(d.id);
    return { ok: true, destination: d, shopping: catalog.SHOP[d.id] || [], reviews: { count: s.n, average: s.n ? Math.round(s.avg * 10) / 10 : 0 } };
  });

  r.get('/api/foods', (ctx) => {
    const cat = String(ctx.query.cat || '');
    const foods = cat && cat !== 'All' ? catalog.FOODS.filter((f) => f.cat === cat) : catalog.FOODS;
    return { ok: true, foods };
  });

  /* Built-in articles + community posts, newest community posts first. */
  r.get('/api/blogs', (ctx) => {
    const community = db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 200').all().map((row) => ({
      slug: row.slug, user: true, title: row.title, author: row.author, category: row.category, date: row.created_at.slice(0, 10),
      read: row.read_min, img: row.img, excerpt: row.excerpt, body: JSON.parse(row.body)
    }));
    let all = [...community, ...catalog.blogs];
    const cat = String(ctx.query.cat || '');
    if (cat && cat !== 'All') all = all.filter((b) => b.category === cat);
    return { ok: true, categories: catalog.blogCategories, blogs: all };
  });
  r.get('/api/blogs/:slug', (ctx) => {
    const b = catalog.blogs.find((x) => x.slug === ctx.params.slug);
    if (b) return { ok: true, blog: b };
    const row = db.prepare('SELECT * FROM posts WHERE slug = ?').get(ctx.params.slug);
    if (!row) throw new HttpError(404, 'Article not found.');
    return { ok: true, blog: { slug: row.slug, user: true, title: row.title, author: row.author, category: row.category, date: row.created_at.slice(0, 10), read: row.read_min, img: row.img, excerpt: row.excerpt, body: JSON.parse(row.body) } };
  });
};
