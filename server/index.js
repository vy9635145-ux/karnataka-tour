'use strict';
const { createApp } = require('./app');

const app = createApp();
const { cfg } = app;

if (cfg.isProd) {
  if (!cfg.cookieSecure) console.warn('[warn] NODE_ENV=production but COOKIE_SECURE is not true – serve over HTTPS and enable it.');
  if (!cfg.resendKey) console.warn('[warn] RESEND_API_KEY is not set – password-reset codes will only be printed to this console.');
  if (cfg.resetCodeInResponse) console.warn('[warn] RESET_CODE_IN_RESPONSE=true exposes reset codes in API responses. Set it to false in production.');
}

app.listen().then((addr) => {
  console.log(`\n  Karnataka Tour is running → http://localhost:${addr.port}`);
  console.log(`  Database: ${cfg.dbFile}`);
  console.log(`  Admins: ${cfg.adminEmails.length ? cfg.adminEmails.join(', ') : '(none – set ADMIN_EMAILS)'}\n`);
});

const stop = () => { console.log('\nShutting down…'); app.close().then(() => process.exit(0)); setTimeout(() => process.exit(0), 3000).unref(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
