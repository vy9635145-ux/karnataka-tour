'use strict';
/* In-memory limiter. Fine for a single server process; use Redis if you ever run several. */
class RateLimiter {
  constructor() {
    this.windows = new Map(); // key -> { n, reset }
    this.fails = new Map();   // key -> { n, until, exp }
    this.timer = setInterval(() => this.sweep(), 60_000);
    this.timer.unref();
  }
  /** Fixed window counter. */
  hit(key, max, windowMs) {
    const now = Date.now();
    let e = this.windows.get(key);
    if (!e || e.reset <= now) { e = { n: 0, reset: now + windowMs }; this.windows.set(key, e); }
    e.n += 1;
    if (this.windows.size > 100_000) this.sweep();
    return { ok: e.n <= max, retryAfter: Math.max(1, Math.ceil((e.reset - now) / 1000)) };
  }
  /** Seconds left of a lock (0 = not locked). */
  lockedFor(key) {
    const e = this.fails.get(key);
    if (!e || !e.until) return 0;
    const left = e.until - Date.now();
    return left > 0 ? Math.ceil(left / 1000) : 0;
  }
  registerFail(key, max = 5, lockMs = 60_000) {
    const now = Date.now();
    let e = this.fails.get(key);
    if (!e || e.exp <= now) e = { n: 0, until: 0, exp: now + 15 * 60_000 };
    e.n += 1;
    if (e.n >= max) { e.until = now + lockMs; e.n = 0; }
    this.fails.set(key, e);
  }
  clearFails(key) { this.fails.delete(key); }
  sweep() {
    const now = Date.now();
    for (const [k, v] of this.windows) if (v.reset <= now) this.windows.delete(k);
    for (const [k, v] of this.fails) if (v.exp <= now && v.until <= now) this.fails.delete(k);
    if (this.windows.size > 100_000) this.windows.clear();
  }
  stop() { clearInterval(this.timer); }
}
module.exports = { RateLimiter };
