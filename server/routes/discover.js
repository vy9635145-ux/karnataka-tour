'use strict';
/* Travel Personality API. Guests can take the quiz; saving a result needs a login and only touches that user's rows. */
const { bad } = require('../lib/http');
const E = require('../../public/js/discover-engine');

const LIMIT_SAVED = 50; // keep the newest 50 results per user

module.exports = (r, { db, catalog }) => {
  const resultOut = (row) => ({
    id: row.id, primary: row.primary_personality, secondary: row.secondary_personality,
    answers: JSON.parse(row.quiz_answers), scores: JSON.parse(row.scores), createdAt: row.created_at
  });

  r.get('/api/discover/quiz', () => ({ ok: true, questions: E.QUESTIONS, personalities: E.PERSONALITIES }));

  /* Score + recommend without saving anything (works for guests). */
  r.post('/api/discover/recommend', { limit: { name: 'recommend', max: 60, windowMs: 60_000 } }, (ctx) => {
    const err = E.validate(ctx.body.answers);
    if (err) throw bad(err);
    const result = E.score(ctx.body.answers);
    const rec = E.recommend(catalog.destinations, result);
    const out = (x) => ({ id: x.place.id, score: x.score, reasons: x.reasons });
    return { ok: true, result, recommended: rec.recommended.map(out), different: rec.different.map(out), message: rec.message };
  });

  r.get('/api/me/personality', { auth: true }, (ctx) => {
    const row = db.prepare('SELECT * FROM personality_results WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(ctx.user.id);
    return { ok: true, latest: row ? resultOut(row) : null };
  });

  /* The server re-scores the answers: the client's claimed result is never trusted. */
  r.post('/api/me/personality', { auth: true, limit: { name: 'personality', max: 30, windowMs: 3_600_000 } }, (ctx) => {
    const err = E.validate(ctx.body.answers);
    if (err) throw bad(err);
    const res = E.score(ctx.body.answers);
    const clean = {};
    for (const q of E.QUESTIONS) clean[q.id] = ctx.body.answers[q.id];
    const info = db.prepare('INSERT INTO personality_results (user_id, primary_personality, secondary_personality, quiz_answers, scores, created_at) VALUES (?,?,?,?,?,?)')
      .run(ctx.user.id, res.primary, res.secondary, JSON.stringify(clean), JSON.stringify(res.scores), new Date().toISOString());
    db.prepare('DELETE FROM personality_results WHERE user_id = ? AND id NOT IN (SELECT id FROM personality_results WHERE user_id = ? ORDER BY id DESC LIMIT ?)')
      .run(ctx.user.id, ctx.user.id, LIMIT_SAVED);
    ctx.status = 201;
    return { ok: true, saved: resultOut(db.prepare('SELECT * FROM personality_results WHERE id = ?').get(Number(info.lastInsertRowid))) };
  });

  r.delete('/api/me/personality', { auth: true }, (ctx) => {
    db.prepare('DELETE FROM personality_results WHERE user_id = ?').run(ctx.user.id);
    return { ok: true };
  });
};