/* Karnataka Tour – tiny API client for the Node backend (same origin, cookie session).
   Every call resolves to { ok, status, error?, ...data } and never throws. */
(function () {
  const BASE = (window.KT_API_BASE || '').replace(/\/$/, '');

  async function request(method, path, body, opts) {
    try {
      const r = await fetch(BASE + path, {
        method,
        credentials: 'same-origin',
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
        keepalive: !!(opts && opts.keepalive)
      });
      let data = {};
      try { data = await r.json(); } catch (e) { /* empty body */ }
      if (r.ok) return Object.assign({}, data, { ok: true, status: r.status });
      return Object.assign({}, data, { ok: false, status: r.status, error: data.error || 'Request failed (' + r.status + ').' });
    } catch (e) {
      return { ok: false, status: 0, error: 'Cannot reach the server. Please check your connection and try again.' };
    }
  }

  /* Synchronous GET – used once per page load so the existing synchronous UI code
     (auth.current(), favourites, blog list) still works. Returns null when offline. */
  function getSync(path) {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', BASE + path, false);
      x.withCredentials = true;
      x.send();
      if (x.status >= 200 && x.status < 300) return JSON.parse(x.responseText);
    } catch (e) { /* server not reachable (e.g. file://) */ }
    return null;
  }

  window.api = {
    get: (p) => request('GET', p),
    post: (p, b, o) => request('POST', p, b === undefined ? {} : b, o),
    put: (p, b) => request('PUT', p, b),
    patch: (p, b) => request('PATCH', p, b),
    del: (p) => request('DELETE', p),
    getSync
  };
})();
