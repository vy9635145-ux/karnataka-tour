'use strict';
const V = require('../lib/validate');

module.exports = (r, { cfg, db, sendMail }) => {
  r.post('/api/contact', { limit: { name: 'contact', max: 5, windowMs: 3_600_000 } }, async (ctx) => {
    const name = V.text(ctx.body.name, 'Name', 1, 60);
    const email = V.email(ctx.body.email);
    const message = V.text(ctx.body.message, 'Message', 5, 1000, { multiline: true });
    db.prepare('INSERT INTO contact_messages (name, email, message, ip, created_at) VALUES (?,?,?,?,?)')
      .run(name, email, message, ctx.ip, new Date().toISOString());
    if (cfg.contactNotifyEmail) {
      sendMail({ to: cfg.contactNotifyEmail, subject: `New message from ${name}`, text: `From: ${name} <${email}>\n\n${message}` }); // fire and forget
    }
    ctx.status = 201;
    return { ok: true };
  });

  r.post('/api/newsletter', { limit: { name: 'news', max: 10, windowMs: 3_600_000 } }, (ctx) => {
    const email = V.email(ctx.body.email);
    db.prepare('INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?, ?)').run(email, new Date().toISOString());
    return { ok: true }; // same answer whether or not it was already subscribed
  });
};
