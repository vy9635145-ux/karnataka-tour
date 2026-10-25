'use strict';
/* Usage: npm run make-admin -- someone@example.com   (the person must have signed up already) */
const { load } = require('../server/config');
const { open } = require('../server/db');

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) { console.error('Usage: npm run make-admin -- email@example.com'); process.exit(1); }
const db = open(load().dbFile);
const res = db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(email);
console.log(res.changes ? `✔ ${email} is now an admin (they may need to log in again).` : `✖ No user found with e-mail ${email}. Sign up first.`);
db.close();
process.exit(res.changes ? 0 : 1);
