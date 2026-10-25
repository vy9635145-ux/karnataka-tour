'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server/app');

let app, base;
test.before(async () => {
  app = createApp({ dbFile: ':memory:', silent: true, rateLimitScale: 50, adminEmails: ['admin@example.com'], resetCodeInResponse: true });
  const addr = await app.listen(0, '127.0.0.1');
  base = `http://127.0.0.1:${addr.port}`;
});
test.after(() => app.close());

/* Minimal client with a cookie jar so each "browser" keeps its own session. */
function client() {
  let cookie = '';
  const call = async (method, path, body, headers = {}) => {
    const h = { ...headers };
    if (body !== undefined) h['Content-Type'] = h['Content-Type'] || 'application/json';
    if (cookie) h.Cookie = cookie;
    const res = await fetch(base + path, { method, headers: h, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
    const set = res.headers.getSetCookie?.() || [];
    for (const c of set) { const kv = c.split(';')[0]; cookie = kv.endsWith('=') ? '' : kv; }
    let json = null; const ct = res.headers.get('content-type') || '';
    if (ct.includes('json')) json = await res.json(); else await res.arrayBuffer();
    return { status: res.status, json, headers: res.headers, setCookie: set };
  };
  return { call, get: (p) => call('GET', p), post: (p, b) => call('POST', p, b ?? {}), put: (p, b) => call('PUT', p, b), patch: (p, b) => call('PATCH', p, b), del: (p) => call('DELETE', p), jar: () => cookie };
}
const userData = (n) => ({ name: `User ${n}`, email: `user${n}@example.com`, phone: '+91 98765 43210', password: 'Passw0rdOK' });
async function signedUp(n) { const c = client(); const r = await c.post('/api/auth/signup', userData(n)); assert.equal(r.status, 201); return c; }

test('health + static site + 404 page + traversal blocked', async () => {
  const c = client();
  assert.equal((await c.get('/api/health')).json.ok, true);
  const home = await fetch(base + '/'); assert.equal(home.status, 200); assert.match(await home.text(), /<html/i);
  const css = await fetch(base + '/css/style.css'); assert.equal(css.status, 200); assert.match(css.headers.get('content-type'), /text\/css/);
  assert.equal(css.headers.get('x-content-type-options'), 'nosniff');
  const nf = await fetch(base + '/nope.html', { headers: { Accept: 'text/html' } }); assert.equal(nf.status, 404); assert.match(await nf.text(), /wandered off/);
  for (const p of ['/../package.json', '/%2e%2e/package.json', '/..%2fserver/app.js', '/.env', '/js/../../server/app.js']) {
    const r = await fetch(base + p); assert.equal(r.status, 404, p); await r.arrayBuffer();
  }
});

test('catalog endpoints mirror data.js', async () => {
  const c = client();
  const all = await c.get('/api/destinations'); assert.ok(all.json.count >= 15);
  const hampi = await c.get('/api/destinations/hampi'); assert.equal(hampi.json.destination.name, 'Hampi'); assert.ok(Array.isArray(hampi.json.shopping));
  assert.equal((await c.get('/api/destinations/atlantis')).status, 404);
  assert.ok((await c.get('/api/destinations?cat=beach')).json.destinations.every((d) => d.cats.includes('beach')));
  assert.ok((await c.get('/api/foods')).json.foods.length >= 10);
  assert.ok((await c.get('/api/blogs')).json.blogs.length >= 3);
});

test('signup → me → logout → login, with validation', async () => {
  const c = client();
  assert.equal((await c.get('/api/bootstrap')).json.user, null);
  assert.equal((await c.post('/api/auth/signup', { ...userData(1), password: 'short' })).status, 400);
  assert.equal((await c.post('/api/auth/signup', { ...userData(1), email: 'bad' })).status, 400);
  const ok = await c.post('/api/auth/signup', userData(1));
  assert.equal(ok.status, 201);
  assert.ok(ok.setCookie[0].includes('HttpOnly') && ok.setCookie[0].includes('SameSite=Lax'));
  assert.equal(ok.json.user.password, undefined);
  assert.equal((await c.get('/api/me')).json.user.email, 'user1@example.com');
  assert.equal((await client().post('/api/auth/signup', userData(1))).status, 409);
  await c.post('/api/auth/logout');
  assert.equal((await c.get('/api/me')).status, 401);
  assert.equal((await c.post('/api/auth/login', { email: 'USER1@example.com', password: 'wrong' })).status, 401);
  const li = await c.post('/api/auth/login', { email: 'USER1@example.com', password: 'Passw0rdOK', remember: true });
  assert.equal(li.status, 200); assert.match(li.setCookie[0], /Max-Age=/);
  assert.equal((await c.get('/api/me')).status, 200);
});

test('login lockout after 5 wrong passwords', async () => {
  await signedUp(2);
  const c = client();
  for (let i = 0; i < 5; i++) assert.equal((await c.post('/api/auth/login', { email: 'user2@example.com', password: 'nope-nope1' })).status, 401);
  const locked = await c.post('/api/auth/login', { email: 'user2@example.com', password: 'Passw0rdOK' });
  assert.equal(locked.status, 429); assert.match(locked.json.error, /Too many attempts/); assert.ok(locked.headers.get('retry-after'));
});

test('profile update, password change logs out other devices', async () => {
  const a = await signedUp(3);
  const b = client(); await b.post('/api/auth/login', { email: 'user3@example.com', password: 'Passw0rdOK' });
  assert.equal((await a.patch('/api/me', { name: 'New Name', phone: '' })).json.user.name, 'New Name');
  assert.equal((await a.post('/api/me/password', { oldPassword: 'bad', newPassword: 'Another123' })).status, 400);
  assert.equal((await a.post('/api/me/password', { oldPassword: 'Passw0rdOK', newPassword: 'Another123' })).status, 200);
  assert.equal((await a.get('/api/me')).status, 200);
  assert.equal((await b.get('/api/me')).status, 401);
  assert.equal((await client().post('/api/auth/login', { email: 'user3@example.com', password: 'Another123' })).status, 200);
});

test('forgot / reset password flow', async () => {
  await signedUp(4);
  const c = client();
  const f = await c.post('/api/auth/forgot', { email: 'user4@example.com' });
  assert.equal(f.json.exists, true); assert.match(f.json.code, /^\d{6}$/);
  assert.equal((await c.post('/api/auth/reset', { email: 'user4@example.com', code: '000000', password: 'Brandnew99' })).status, 400);
  assert.equal((await c.post('/api/auth/reset', { email: 'user4@example.com', code: f.json.code, password: 'Brandnew99' })).status, 200);
  assert.equal((await c.post('/api/auth/reset', { email: 'user4@example.com', code: f.json.code, password: 'Brandnew99' })).status, 400); // single use
  assert.equal((await c.post('/api/auth/login', { email: 'user4@example.com', password: 'Brandnew99' })).status, 200);
  const unknown = await client().post('/api/auth/forgot', { email: 'ghost@example.com' });
  assert.equal(unknown.status, 200); assert.equal(unknown.json.code, undefined);
});

test('reset code is burned after 5 wrong tries', async () => {
  await signedUp(5);
  const c = client(); const f = await c.post('/api/auth/forgot', { email: 'user5@example.com' });
  for (let i = 0; i < 5; i++) await c.post('/api/auth/reset', { email: 'user5@example.com', code: '111111', password: 'Brandnew99' });
  assert.equal((await c.post('/api/auth/reset', { email: 'user5@example.com', code: f.json.code, password: 'Brandnew99' })).status, 400);
});

test('favourites and tours persist per user', async () => {
  const c = await signedUp(6);
  assert.deepEqual((await c.put('/api/me/favourites', { ids: ['hampi', 'coorg', 'hampi', 'bogus'] })).json.favs, ['hampi', 'coorg']);
  const tour = { id: 't1760000000000', ts: 1760000000000, dest: 'hampi', name: 'My Hampi trip', travellers: 3, days: 2, mode: 'train', hotel: 'mid', food: 400, act: 300, parts: [['Transport', 3000], ['Food', 2400]], total: 9000, pp: 3000, plan: [[{ k: 'visit', t: 'Virupaksha', c: 100 }], []], evil: '<script>' };
  const created = await c.post('/api/me/tours', tour);
  assert.equal(created.status, 201); assert.equal(created.json.tour.evil, undefined);
  assert.equal((await c.post('/api/me/tours', tour)).status, 409);
  assert.equal((await c.post('/api/me/tours', { ...tour, id: 't1', dest: 'mars' })).status, 400);
  assert.equal((await c.post('/api/me/tours', { ...tour, id: 't2', days: 0 })).status, 400);
  const boot = (await c.get('/api/bootstrap')).json;
  assert.deepEqual(boot.favs, ['hampi', 'coorg']); assert.equal(boot.tours.length, 1); assert.equal(boot.tours[0].plan[0][0].t, 'Virupaksha');
  const other = await signedUp(7);
  assert.equal((await other.get('/api/me/tours')).json.tours.length, 0);
  assert.equal((await other.del('/api/me/tours/t1760000000000')).status, 404);
  assert.equal((await c.del('/api/me/tours/t1760000000000')).status, 200);
  assert.equal((await c.get('/api/me/tours')).json.tours.length, 0);
});

test('reviews: login needed, one per user (edit), average, delete permissions', async () => {
  const a = await signedUp(8), b = await signedUp(9), anon = client();
  assert.equal((await anon.post('/api/destinations/hampi/reviews', { rating: 5, text: 'Great' })).status, 401);
  assert.equal((await a.post('/api/destinations/hampi/reviews', { rating: 9, text: 'Great' })).status, 400);
  assert.equal((await a.post('/api/destinations/nowhere/reviews', { rating: 5, text: 'Great' })).status, 404);
  const r1 = await a.post('/api/destinations/hampi/reviews', { rating: 5, text: 'Stunning place' }); assert.equal(r1.status, 201);
  const edit = await a.post('/api/destinations/hampi/reviews', { rating: 3, text: 'Changed my mind' }); assert.equal(edit.status, 200); assert.equal(edit.json.updated, true);
  await b.post('/api/destinations/hampi/reviews', { rating: 5, text: 'Loved it' });
  const list = (await anon.get('/api/destinations/hampi/reviews')).json;
  assert.equal(list.count, 2); assert.equal(list.average, 4); assert.ok(list.reviews.every((x) => x.mine === false));
  assert.equal((await b.del(`/api/reviews/${r1.json.review.id}`)).status, 403);
  assert.equal((await a.del(`/api/reviews/${r1.json.review.id}`)).status, 200);
});

test('blog posts: create, list with mine flag, owner/admin delete, validation', async () => {
  const a = await signedUp(10), b = await signedUp(11), anon = client();
  const body = { author: 'Priya', title: 'A rainy weekend in Coorg', category: 'Nature', body: 'We drove up on Friday evening.\nSaturday was all coffee estates and waterfalls, truly lovely.' };
  assert.equal((await anon.post('/api/posts', body)).status, 401);
  assert.equal((await a.post('/api/posts', { ...body, category: 'Nope' })).status, 400);
  assert.equal((await a.post('/api/posts', { ...body, body: 'too short' })).status, 400);
  assert.equal((await a.post('/api/posts', { ...body, img: 'javascript:alert(1)' })).status, 400);
  const p = await a.post('/api/posts', body); assert.equal(p.status, 201);
  assert.equal(p.json.post.body.length, 2); assert.equal(p.json.post.mine, true);
  const seenByB = (await b.get('/api/posts')).json.posts.find((x) => x.slug === p.json.post.slug); assert.equal(seenByB.mine, false);
  assert.ok((await anon.get('/api/blogs')).json.blogs.some((x) => x.slug === p.json.post.slug));
  assert.equal((await b.del(`/api/posts/${p.json.post.slug}`)).status, 403);
  const admin = client(); await admin.post('/api/auth/signup', { ...userData(0), email: 'admin@example.com' });
  assert.equal((await admin.del(`/api/posts/${p.json.post.slug}`)).status, 200);
});

test('contact + newsletter + admin area', async () => {
  const anon = client();
  assert.equal((await anon.post('/api/contact', { name: 'A', email: 'a@b.co', message: 'hi there, nice site' })).status, 201);
  assert.equal((await anon.post('/api/contact', { name: 'A', email: 'nope', message: 'hi there' })).status, 400);
  assert.equal((await anon.post('/api/newsletter', { email: 'news@example.com' })).status, 200);
  assert.equal((await anon.post('/api/newsletter', { email: 'news@example.com' })).status, 200);
  assert.equal((await anon.get('/api/admin/stats')).status, 401);
  const normal = await signedUp(12); assert.equal((await normal.get('/api/admin/messages')).status, 403);
  const admin = client(); await admin.post('/api/auth/login', { email: 'admin@example.com', password: 'Passw0rdOK' });
  assert.equal((await admin.get('/api/me')).json.user.isAdmin, true);
  const msgs = (await admin.get('/api/admin/messages')).json.messages; assert.ok(msgs.length >= 1);
  assert.equal((await admin.patch(`/api/admin/messages/${msgs[0].id}`, { handled: true })).status, 200);
  assert.equal((await admin.get('/api/admin/subscribers')).json.subscribers.filter((s) => s.email === 'news@example.com').length, 1);
  assert.ok((await admin.get('/api/admin/stats')).json.stats.users >= 5);
});

test('security: cross-origin writes, content-type, body size, bad JSON, 405', async () => {
  const c = client();
  const evil = await c.call('POST', '/api/newsletter', { email: 'x@example.com' }, { Origin: 'https://evil.example' });
  assert.equal(evil.status, 403);
  const same = await c.call('POST', '/api/newsletter', { email: 'x@example.com' }, { Origin: base });
  assert.equal(same.status, 200);
  assert.equal((await c.call('POST', '/api/newsletter', 'email=x@example.com', { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await c.call('POST', '/api/newsletter', '{bad json')).status, 400);
  assert.equal((await c.call('POST', '/api/newsletter', JSON.stringify({ email: 'x@example.com', pad: 'a'.repeat(200_000) }))).status, 413);
  assert.equal((await c.post('/api/health', {})).status, 405);
  assert.equal((await c.get('/api/unknown')).status, 404);
});

test('delete account removes everything', async () => {
  const c = await signedUp(13);
  await c.put('/api/me/favourites', { ids: ['hampi'] });
  await c.post('/api/destinations/hampi/reviews', { rating: 4, text: 'Nice one' });
  assert.equal((await c.del('/api/me')).status, 200);
  assert.equal((await c.get('/api/me')).status, 401);
  assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM reviews r JOIN users u ON u.id=r.user_id WHERE u.email='user13@example.com'").get().n, 0);
  assert.equal((await client().post('/api/auth/login', userData(13))).status, 401);
});

test('rate limiting returns 429 with Retry-After (default limits)', async () => {
  const strict = createApp({ dbFile: ':memory:', silent: true });
  const addr = await strict.listen(0, '127.0.0.1');
  try {
    let last;
    for (let i = 0; i < 6; i++) {
      last = await fetch(`http://127.0.0.1:${addr.port}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'A', email: 'a@b.co', message: 'hello there' }) });
      await last.arrayBuffer();
    }
    assert.equal(last.status, 429); assert.ok(Number(last.headers.get('retry-after')) > 0);
  } finally { await strict.close(); }
});
