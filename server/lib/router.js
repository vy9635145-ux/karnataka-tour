'use strict';
/* Tiny router: r.get('/api/x/:id', { auth: true, limit: {...} }, handler) */
class Router {
  constructor() { this.routes = []; }
  add(method, path, a, b) {
    const opts = b ? a : {};
    const handler = b || a;
    const keys = [];
    const re = new RegExp('^' + path.replace(/:([A-Za-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    this.routes.push({ method, re, keys, opts, handler });
  }
  get(p, a, b) { this.add('GET', p, a, b); }
  post(p, a, b) { this.add('POST', p, a, b); }
  put(p, a, b) { this.add('PUT', p, a, b); }
  patch(p, a, b) { this.add('PATCH', p, a, b); }
  delete(p, a, b) { this.add('DELETE', p, a, b); }

  match(method, pathname) {
    const allowed = [];
    for (const route of this.routes) {
      const m = route.re.exec(pathname);
      if (!m) continue;
      if (route.method === method || (method === 'HEAD' && route.method === 'GET')) {
        const params = {};
        route.keys.forEach((k, i) => { try { params[k] = decodeURIComponent(m[i + 1]); } catch { params[k] = m[i + 1]; } });
        return { route, params };
      }
      allowed.push(route.method);
    }
    return allowed.length ? { allowed: [...new Set(allowed)] } : null;
  }
}
module.exports = { Router };
