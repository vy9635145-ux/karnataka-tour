'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

/* Minimal .env loader (no dependency). Real environment variables always win. */
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnvFile(path.join(ROOT, '.env'));

const bool = (v, d) => (v === undefined || v === '' ? d : /^(1|true|yes|on)$/i.test(v));
const list = (v) => (v || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

/** Build the configuration. `overrides` is used by the tests. */
function load(overrides = {}) {
  const env = process.env;
  const nodeEnv = env.NODE_ENV || 'development';
  const prod = nodeEnv === 'production';
  const dbFile = env.DB_FILE || 'data/karnataka.db';
  const cfg = {
    ROOT,
    nodeEnv,
    isProd: prod,
    port: Number(env.PORT) || 3000,
    host: env.HOST || '0.0.0.0',
    dbFile: dbFile === ':memory:' ? dbFile : path.resolve(ROOT, dbFile),
    publicDir: path.join(ROOT, 'public'),
    cookieSecure: bool(env.COOKIE_SECURE, prod),
    trustProxy: bool(env.TRUST_PROXY, false),
    adminEmails: list(env.ADMIN_EMAILS),
    resetCodeInResponse: bool(env.RESET_CODE_IN_RESPONSE, !prod),
    resendKey: env.RESEND_API_KEY || '',
    mailFrom: env.MAIL_FROM || 'Karnataka Tour <no-reply@example.com>',
    contactNotifyEmail: env.CONTACT_NOTIFY_EMAIL || '',
    bodyLimit: 100 * 1024, // bytes of JSON accepted per request
    rememberDays: 30,
    sessionHours: 24, // lifetime when "remember me" is off
    rateLimitScale: 1, // tests raise this; keep 1 in real use
    logRequests: bool(env.LOG_REQUESTS, !prod),
    silent: false
  };
  return Object.assign(cfg, overrides);
}

module.exports = { load, ROOT };
