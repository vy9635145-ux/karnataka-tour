'use strict';
/* Smart Packing Assistant API – every route needs a logged-in user and only ever touches that user's rows. */
const { HttpError, bad } = require('../lib/http');
const V = require('../lib/validate');
const sec = require('../lib/security');

const MAX_LISTS = 30;
const MAX_CATS = 20;
const MAX_ITEMS_PER_CAT = 60;
const MAX_ITEMS = 300;
const MAX_JSON = 60_000; // body limit of the server is 100 KB

const TYPES = ['Solo', 'Family', 'Friends', 'Adventure'];
const ACTIVITIES = ['Trekking', 'Beach', 'Sightseeing', 'Camping', 'Wildlife'];
const SEASONS = ['Summer', 'Winter', 'Monsoon'];

const LIST_ID = /^p\d{8,16}$/;
const TOUR_ID = /^t\d{8,16}$/;
const SUB_ID = /^[A-Za-z0-9_-]{1,32}$/;

const newListId = () => `p${Date.now()}${Math.floor(Math.random() * 1000)}`;

module.exports = (r, { db, catalog }) => {
  const mine = (uid) => db.prepare('SELECT data FROM packing_lists WHERE user_id = ? ORDER BY updated_at DESC, rowid DESC').all(uid).map((x) => JSON.parse(x.data));

  /* Whitelist + clamp everything: the checklist JSON comes from the browser and is shown back to the user later. */
  function cleanList(b, uid, forcedId) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw bad('Invalid checklist.');
    if (!catalog.destById.has(b.dest)) throw bad('Please choose a valid destination.');
    const dest = catalog.destById.get(b.dest);
    if (!TYPES.includes(b.type)) throw bad('Trip type must be one of: ' + TYPES.join(', ') + '.');
    if (!SEASONS.includes(b.season)) throw bad('Season must be one of: ' + SEASONS.join(', ') + '.');
    const acts = Array.isArray(b.activities) ? [...new Set(b.activities)] : [];
    if (acts.length > ACTIVITIES.length || acts.some((a) => !ACTIVITIES.includes(a))) throw bad('Unknown activity.');
    if (!Array.isArray(b.categories)) throw bad('Categories must be a list.');
    if (b.categories.length > MAX_CATS) throw bad(`You can have up to ${MAX_CATS} categories.`);

    const seen = new Set();
    const uniqueId = (v) => {
      let id = typeof v === 'string' && SUB_ID.test(v) && !seen.has(v) ? v : null;
      while (!id || seen.has(id)) id = sec.newToken().slice(0, 10).replace(/[^A-Za-z0-9_-]/g, 'x');
      seen.add(id);
      return id;
    };
    let total = 0;
    const categories = b.categories.map((c) => {
      if (!c || typeof c !== 'object' || !Array.isArray(c.items)) throw bad('Invalid category.');
      if (c.items.length > MAX_ITEMS_PER_CAT) throw bad(`A category can hold up to ${MAX_ITEMS_PER_CAT} items.`);
      total += c.items.length;
      if (total > MAX_ITEMS) throw bad(`A checklist can hold up to ${MAX_ITEMS} items.`);
      return {
        id: uniqueId(c.id),
        name: V.text(c.name, 'Category name', 1, 40),
        items: c.items.map((it) => {
          if (!it || typeof it !== 'object') throw bad('Invalid item.');
          return {
            id: uniqueId(it.id),
            name: V.text(it.name, 'Item name', 1, 80),
            qty: V.int(it.qty === undefined ? 1 : it.qty, 'Quantity', 1, 99),
            packed: it.packed === true
          };
        })
      };
    });

    let tourId = null;
    if (typeof b.tourId === 'string' && TOUR_ID.test(b.tourId)) {
      // only keep the link while the tour still belongs to this user (a cancelled tour just unlinks)
      tourId = db.prepare('SELECT 1 AS ok FROM tours WHERE user_id = ? AND id = ?').get(uid, b.tourId) ? b.tourId : null;
    }
    const now = Date.now();
    const out = {
      id: forcedId || (typeof b.id === 'string' && LIST_ID.test(b.id) ? b.id : newListId()),
      name: V.text(b.name || `Packing list – ${dest.name}`, 'List name', 1, 100),
      dest: dest.id,
      tourId,
      days: V.int(b.days, 'Trip duration', 1, 60),
      type: b.type,
      season: b.season,
      activities: acts,
      createdAt: Number.isFinite(+b.createdAt) && +b.createdAt > 0 ? Math.round(+b.createdAt) : now,
      updatedAt: now,
      categories
    };
    if (JSON.stringify(out).length > MAX_JSON) throw bad('Checklist is too large.');
    return out;
  }

  r.get('/api/me/packing', { auth: true }, (ctx) => ({ ok: true, lists: mine(ctx.user.id) }));

  r.post('/api/me/packing', { auth: true, limit: { name: 'packing', max: 600, windowMs: 3_600_000 } }, (ctx) => {
    const list = cleanList(ctx.body, ctx.user.id);
    const count = db.prepare('SELECT COUNT(*) AS n FROM packing_lists WHERE user_id = ?').get(ctx.user.id).n;
    if (count >= MAX_LISTS) throw new HttpError(409, `You can keep up to ${MAX_LISTS} packing lists. Delete an old one first.`);
    try {
      db.prepare('INSERT INTO packing_lists (user_id, id, name, dest_id, tour_id, data, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(ctx.user.id, list.id, list.name, list.dest, list.tourId, JSON.stringify(list), list.createdAt, list.updatedAt);
    } catch (e) {
      if (/UNIQUE|PRIMARY/i.test(e.message)) throw new HttpError(409, 'This packing list already exists.');
      throw e;
    }
    ctx.status = 201;
    return { ok: true, list };
  });

  r.put('/api/me/packing/:id', { auth: true, limit: { name: 'packing', max: 600, windowMs: 3_600_000 } }, (ctx) => {
    if (!LIST_ID.test(ctx.params.id)) throw new HttpError(404, 'Packing list not found.');
    const list = cleanList(ctx.body, ctx.user.id, ctx.params.id);
    const res = db.prepare('UPDATE packing_lists SET name = ?, dest_id = ?, tour_id = ?, data = ?, updated_at = ? WHERE user_id = ? AND id = ?')
      .run(list.name, list.dest, list.tourId, JSON.stringify(list), list.updatedAt, ctx.user.id, list.id);
    if (!res.changes) throw new HttpError(404, 'Packing list not found.');
    return { ok: true, list };
  });

  r.delete('/api/me/packing/:id', { auth: true }, (ctx) => {
    const res = db.prepare('DELETE FROM packing_lists WHERE user_id = ? AND id = ?').run(ctx.user.id, ctx.params.id);
    if (!res.changes) throw new HttpError(404, 'Packing list not found.');
    return { ok: true };
  });
};