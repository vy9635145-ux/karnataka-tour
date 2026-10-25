/* Karnataka Tour – accounts, favourites and tours, backed by the Node server (see /server).
   Same public interface as the old localStorage demo, so the pages did not need a redesign:
   - auth.current() / auth.data.get() stay synchronous (state is loaded once at page start),
   - everything that changes data talks to the API and returns a Promise.
   Guests (not logged in) keep their favourites in localStorage; they are merged into the account on login. */
const auth = (() => {
  const GUEST_FAVS = 'kt_favs_guest';
  const rd = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const state = { user: null, favs: [], tours: [] };
  const boot = (typeof api !== 'undefined') ? api.getSync('/api/bootstrap') : null;
  if (boot && boot.ok) { state.user = boot.user; state.favs = boot.favs || []; state.tours = boot.tours || []; }

  const say = (m) => { if (typeof toast === 'function') toast(m); };
  let queue = Promise.resolve(); // keeps writes in order
  const enqueue = (fn) => { queue = queue.then(fn).catch(() => {}); return queue; };

  async function refresh() {
    const r = await api.get('/api/bootstrap');
    if (r.ok) { state.user = r.user; state.favs = r.favs || []; state.tours = r.tours || []; }
    return r;
  }

  /* After login/signup: move guest favourites into the account. */
  async function afterLogin(user) {
    state.user = user;
    const guest = rd(GUEST_FAVS, []);
    if (guest.length) {
      const cur = await api.get('/api/me/favourites');
      const union = [...new Set([...(cur.favs || []), ...guest])];
      await api.put('/api/me/favourites', { ids: union });
      try { localStorage.removeItem(GUEST_FAVS); } catch (e) { /* ignore */ }
    }
    await refresh();
  }

  function strength(pw) {
    let n = 0; if (pw.length >= 8) n++; if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) n++; if (/\d/.test(pw)) n++; if (/[^A-Za-z0-9]/.test(pw)) n++; if (pw.length >= 12) n++;
    return Math.min(4, n);
  }
  function pwError(pw) {
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password needs at least one letter and one number.';
    return '';
  }

  return {
    strength, pwError, refresh,
    data: {
      get(name) {
        if (!state.user) return name === 'favs' ? rd(GUEST_FAVS, []) : [];
        return JSON.parse(JSON.stringify(state[name] || []));
      },
      set(name, list) {
        if (!state.user) { if (name === 'favs') wr(GUEST_FAVS, list); return true; }
        if (name === 'favs') {
          state.favs = list.slice();
          enqueue(async () => { const r = await api.put('/api/me/favourites', { ids: list }); if (!r.ok) { say(r.error); await refresh(); } });
        } else if (name === 'tours') {
          const before = state.tours.map((t) => t.id), after = list.map((t) => t.id);
          const added = list.filter((t) => !before.includes(t.id));
          const removed = before.filter((id) => !after.includes(id));
          state.tours = list.slice();
          enqueue(async () => {
            let failed = false;
            for (const t of added) { const r = await api.post('/api/me/tours', t); if (!r.ok) { failed = true; say(r.error); } }
            for (const id of removed) { const r = await api.del('/api/me/tours/' + encodeURIComponent(id)); if (!r.ok && r.status !== 404) { failed = true; say(r.error); } }
            if (failed) await refresh();
          });
        }
        return true;
      }
    },
    current() { return state.user; },
    async signup({ name, email, phone, password }) {
      const r = await api.post('/api/auth/signup', { name, email, phone, password });
      if (!r.ok) return { ok: false, error: r.error };
      await afterLogin(r.user);
      return { ok: true, user: state.user };
    },
    async login({ email, password, remember }) {
      const r = await api.post('/api/auth/login', { email, password, remember: !!remember });
      if (!r.ok) return { ok: false, error: r.error };
      await afterLogin(r.user);
      return { ok: true, user: state.user };
    },
    logout() {
      state.user = null; state.favs = []; state.tours = [];
      return api.post('/api/auth/logout', {}, { keepalive: true });
    },
    async updateProfile({ name, phone }) {
      const r = await api.patch('/api/me', { name, phone });
      if (!r.ok) return { ok: false, error: r.error };
      state.user = r.user; return { ok: true, user: r.user };
    },
    async changePassword(oldPw, newPw) {
      const r = await api.post('/api/me/password', { oldPassword: oldPw, newPassword: newPw });
      return r.ok ? { ok: true } : { ok: false, error: r.error };
    },
    async deleteAccount() {
      const r = await api.del('/api/me');
      if (r.ok) { state.user = null; state.favs = []; state.tours = []; }
      return r;
    },
    /* Password reset. In development the server returns the code so the demo UI can show it;
       in production it is e-mailed (see RESET_CODE_IN_RESPONSE and RESEND_API_KEY in .env). */
    async requestReset(email) {
      const r = await api.post('/api/auth/forgot', { email });
      return r.ok ? { ok: true, exists: r.exists, code: r.code } : { ok: false, error: r.error };
    },
    async resetPassword(email, code, newPw) {
      const r = await api.post('/api/auth/reset', { email, code, password: newPw });
      return r.ok ? { ok: true } : { ok: false, error: r.error };
    }
  };
})();
