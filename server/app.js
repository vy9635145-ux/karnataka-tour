'use strict';
const http = require('node:http');
const { load } = require('./config');
const { open } = require('./db');
const { loadCatalog } = require('./catalog');
const { Router } = require('./lib/router');
const { RateLimiter } = require('./lib/ratelimit');
const { HttpError, parseCookies, readBody, sendJson } = require('./lib/http');
const { serveStatic } = require('./lib/static');
const sessions = require('./lib/session');
const createMailer = require('./lib/mailer');

const ROUTE_FILES = ['auth', 'me', 'packing', 'discover', 'reviews', 'posts', 'forms', 'public', 'admin'];
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function createApp(overrides = {}) {
  const cfg = load(overrides);
  const db = open(cfg.dbFile);
  const catalog = loadCatalog(cfg.publicDir);
  const limiter = new RateLimiter();
  const sendMail = createMailer(cfg);
  const router = new Router();
  const deps = { cfg, db, catalog, limiter, sendMail };
  for (const f of ROUTE_FILES) require(`./routes/${f}`)(router, deps);

  const clientIp = (req) => {
    if (cfg.trustProxy) {
      const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      if (xff) return xff;
    }
    return req.socket.remoteAddress || 'unknown';
  };

  function securityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (cfg.cookieSecure) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  /* Browsers always send Origin on cross-site POST/PUT/PATCH/DELETE: reject if it is not us. */
  function checkOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return;
    let host;
    try { host = new URL(origin).host; } catch { throw new HttpError(403, 'Cross-origin request blocked.'); }
    const expected = (cfg.trustProxy && req.headers['x-forwarded-host']) || req.headers.host;
    if (host !== expected) throw new HttpError(403, 'Cross-origin request blocked.');
  }

  function rateLimit(ip, name, max, windowMs) {
    const r = limiter.hit(`${name}:${ip}`, Math.ceil(max * cfg.rateLimitScale), windowMs);
    if (!r.ok) throw new HttpError(429, 'Too many requests. Please slow down and try again shortly.', { retryAfter: r.retryAfter });
  }

  async function handleApi(req, res, url, ip) {
    const m = router.match(req.method, url.pathname);
    if (!m) throw new HttpError(404, 'API endpoint not found.');
    if (m.allowed) throw new HttpError(405, 'Method not allowed.', { allow: m.allowed.join(', ') });
    const { route, params } = m;
    const unsafe = UNSAFE.has(req.method);
    if (unsafe) checkOrigin(req);
    rateLimit(ip, 'api', 600, 60_000);

    const ctx = {
      ...deps, req, res, url, ip, params, body: {}, user: null, token: null, status: 200,
      query: Object.fromEntries(url.searchParams), cookies: parseCookies(req.headers.cookie), setCookies: []
    };
    sessions.attach(ctx);
    if ((route.opts.auth || route.opts.admin) && !ctx.user) throw new HttpError(401, 'Please log in to continue.');
    if (route.opts.admin && !ctx.user.isAdmin) throw new HttpError(403, 'Admin access required.');
    if (route.opts.limit) { const l = route.opts.limit; rateLimit(ip, l.name, l.max, l.windowMs); }

    if (unsafe) {
      const buf = await readBody(req, cfg.bodyLimit);
      if (buf.length) {
        if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) throw new HttpError(415, 'Content-Type must be application/json.');
        try { ctx.body = JSON.parse(buf.toString('utf8')); } catch { throw new HttpError(400, 'Invalid JSON body.'); }
        if (ctx.body === null || typeof ctx.body !== 'object' || Array.isArray(ctx.body)) throw new HttpError(400, 'JSON body must be an object.');
      }
    }
    const result = await route.handler(ctx);
    sendJson(res, ctx.status, result === undefined ? { ok: true } : result, ctx.setCookies);
  }

  async function handle(req, res) {
    securityHeaders(res);
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { return sendJson(res, 400, { ok: false, error: 'Bad request URL.' }); }
    const ip = clientIp(req);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      try { return await handleApi(req, res, url, ip); } catch (e) {
        if (e instanceof HttpError) {
          const h = {};
          if (e.extra.retryAfter) h['Retry-After'] = String(e.extra.retryAfter);
          if (e.extra.allow) h.Allow = e.extra.allow;
          return sendJson(res, e.status, { ok: false, error: e.message, ...(e.extra.retryAfter ? { retryAfter: e.extra.retryAfter } : {}) }, [], h);
        }
        throw e;
      }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    return serveStatic(req, res, url.pathname, cfg);
  }

  const server = http.createServer((req, res) => {
    const started = Date.now();
    if (cfg.logRequests && !cfg.silent) res.on('finish', () => console.log(`${req.method} ${req.url.split('?')[0]} ${res.statusCode} ${Date.now() - started}ms`));
    handle(req, res).catch((e) => {
      if (!cfg.silent) console.error('[error]', e);
      if (!res.headersSent) sendJson(res, 500, { ok: false, error: 'Something went wrong on the server.' });
      else res.destroy();
    });
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 5_000;

  return {
    cfg, db, server, limiter,
    listen: (port = cfg.port, host = cfg.host) => new Promise((resolve) => server.listen(port, host, () => resolve(server.address()))),
    close: () => new Promise((resolve) => { limiter.stop(); server.close(() => { db.close(); resolve(); }); server.closeAllConnections?.(); })
  };
}

module.exports = { createApp };
