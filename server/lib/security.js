'use strict';
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);

const KEYLEN = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

/** scrypt$<salt>$<hash> – salted, memory-hard, built into Node. */
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, PARAMS);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const key = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length, PARAMS);
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

const newToken = () => crypto.randomBytes(32).toString('base64url');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const randomId = (prefix, bytes = 6) => `${prefix}${crypto.randomBytes(bytes).toString('hex')}`;
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const sixDigitCode = () => String(crypto.randomInt(100000, 1000000));

module.exports = { hashPassword, verifyPassword, newToken, sha256, randomId, safeEqual, sixDigitCode };
