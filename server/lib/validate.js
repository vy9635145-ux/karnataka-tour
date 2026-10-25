'use strict';
const { bad } = require('./http');

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s-]{7,15}$/;

function text(v, label, min, max, { multiline = false, optional = false } = {}) {
  if (v === undefined || v === null || v === '') {
    if (optional) return '';
    throw bad(`${label} is required.`);
  }
  if (typeof v !== 'string') throw bad(`${label} must be text.`);
  let s = v.replace(CONTROL, '');
  s = multiline ? s.replace(/\r\n?/g, '\n').trim() : s.replace(/\s+/g, ' ').trim();
  if (s.length < min) throw bad(min === 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`);
  if (s.length > max) throw bad(`${label} must be at most ${max} characters.`);
  return s;
}

const name = (v) => {
  const s = typeof v === 'string' ? v.replace(CONTROL, '').replace(/\s+/g, ' ').trim() : '';
  if (s.length < 2 || s.length > 60) throw bad('Please enter your full name (2–60 characters).');
  return s;
};
const email = (v) => {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (s.length > 254 || !EMAIL.test(s)) throw bad('Please enter a valid email address.');
  return s;
};
const phone = (v) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s && !PHONE.test(s)) throw bad('Phone number looks invalid.');
  return s;
};
const password = (v) => {
  if (typeof v !== 'string') throw bad('Password is required.');
  if (v.length < 8) throw bad('Password must be at least 8 characters.');
  if (v.length > 128) throw bad('Password must be at most 128 characters.');
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) throw bad('Password needs at least one letter and one number.');
  return v;
};
const httpUrl = (v, max = 500) => {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v !== 'string' || v.length > max) throw bad('Image URL is too long.');
  let u; try { u = new URL(v.trim()); } catch { throw bad('Image URL must start with http:// or https://'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw bad('Image URL must start with http:// or https://');
  return u.toString();
};
const int = (v, label, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw bad(`${label} must be between ${min} and ${max}.`);
  return Math.round(n);
};

module.exports = { text, name, email, phone, password, httpUrl, int };
