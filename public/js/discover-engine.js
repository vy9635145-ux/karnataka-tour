/* Karnataka Tour – Travel Personality: quiz, scoring and destination matching.
   Plain JavaScript, no dependencies, no randomness, no AI. Works in the browser (window.DiscoverEngine)
   and in Node (module.exports) so the server and the tests use exactly the same logic. */
(function (root) {
  'use strict';

  /* Tie-break order (used only after total score AND "direct" score are equal). */
  const PRIORITY = ['nature', 'adventure', 'history', 'spiritual', 'beach', 'culture', 'photo'];

  /* cats = categories used by the existing destinations in data.js: historical, hill, waterfall, beach, wildlife, temple, adventure, city */
  const PERSONALITIES = {
    nature: { name: 'Nature Explorer', emoji: '🌿', short: 'Mountains, forests, waterfalls and scenic places.',
      desc: 'You feel most alive among green hills, misty forests and the sound of falling water. You travel to slow down and breathe.',
      environments: ['Western Ghats forests', 'Waterfalls', 'Hill ranges'], activities: ['Nature walks', 'Birdwatching', 'Waterfall visits'],
      cats: ['hill', 'waterfall', 'wildlife'] },
    adventure: { name: 'Adventure Seeker', emoji: '🧗', short: 'Trekking, camping and outdoor exploration.',
      desc: 'You want your legs tired and your story good. Trails, summits and off-road routes beat a sofa every time.',
      environments: ['Trekking trails', 'Rocky hills', 'Forest routes'], activities: ['Trekking', 'Camping', 'Sunrise climbs'],
      cats: ['adventure', 'hill'] },
    history: { name: 'History Lover', emoji: '🏛️', short: 'Forts, monuments, heritage architecture.',
      desc: 'Old stones talk to you. You like to know who built a place, why, and what it has seen.',
      environments: ['Ancient temple clusters', 'Forts and ruins', 'Heritage towns'], activities: ['Heritage walks', 'Architecture spotting', 'Reading inscriptions'],
      cats: ['historical'] },
    spiritual: { name: 'Spiritual Explorer', emoji: '🛕', short: 'Temples, pilgrimage sites and cultural heritage.',
      desc: 'You travel for stillness and meaning – temple towns, sacred hills and old traditions.',
      environments: ['Temple towns', 'Sacred hills', 'Riverside shrines'], activities: ['Temple visits', 'Quiet reflection', 'Festivals'],
      cats: ['temple'] },
    beach: { name: 'Beach Lover', emoji: '🏖️', short: 'Coastal destinations and water activities.',
      desc: 'Salt air, long horizons and sunsets over the Arabian Sea are your idea of a perfect trip.',
      environments: ['Quiet beaches', 'Estuaries', 'Coastal towns'], activities: ['Beach walks', 'Boat rides', 'Sunset watching'],
      cats: ['beach'] },
    culture: { name: 'Culture Enthusiast', emoji: '🎭', short: 'Villages, local food, traditional art and festivals.',
      desc: 'You meet a place through its people – lanes, home-cooked food, crafts and living traditions.',
      environments: ['Old towns', 'Local markets', 'Traditional communities'], activities: ['Town walks', 'Local food', 'Craft and art visits'],
      cats: ['city'] },
    photo: { name: 'Photography Explorer', emoji: '📷', short: 'Scenic landscapes, viewpoints and unique photo spots.',
      desc: 'You chase light – golden hours, cloud-filled valleys and frames nobody else has captured.',
      environments: ['Viewpoints', 'Waterfalls', 'Coastlines at sunset'], activities: ['Sunrise/sunset shoots', 'Landscape photography', 'Wildlife photography'],
      cats: ['hill', 'waterfall', 'beach'] }
  };

  /* w = personality points per answer. */
  const QUESTIONS = [
    { id: 'q1', text: 'What type of places do you prefer?', type: 'single', options: [
      { id: 'hills', label: 'Mountains and hills', w: { nature: 2, adventure: 1, photo: 1 } },
      { id: 'beaches', label: 'Beaches', w: { beach: 3 } },
      { id: 'monuments', label: 'Historical monuments', w: { history: 3 } },
      { id: 'temples', label: 'Temples', w: { spiritual: 3 } },
      { id: 'forests', label: 'Forests and waterfalls', w: { nature: 3, adventure: 1 } },
      { id: 'villages', label: 'Villages and local culture', w: { culture: 3 } } ] },
    { id: 'q2', text: 'What is your favourite travel activity?', type: 'single', options: [
      { id: 'trek', label: 'Trekking and adventure', w: { adventure: 3, nature: 1 } },
      { id: 'photo', label: 'Photography', w: { photo: 3 } },
      { id: 'history', label: 'Exploring history', w: { history: 3 } },
      { id: 'relax', label: 'Relaxing in nature', w: { nature: 3 } },
      { id: 'food', label: 'Trying local food', w: { culture: 3 } },
      { id: 'culture', label: 'Cultural exploration', w: { culture: 2, spiritual: 1 } } ] },
    { id: 'q3', text: 'What is your preferred travel environment?', type: 'single', options: [
      { id: 'peaceful', label: 'Peaceful and quiet', w: { nature: 2, spiritual: 1 } },
      { id: 'adventurous', label: 'Adventurous', w: { adventure: 3 } },
      { id: 'historic', label: 'Historical and cultural', w: { history: 2, culture: 2 } },
      { id: 'scenic', label: 'Natural and scenic', w: { nature: 2, photo: 2 } },
      { id: 'vibrant', label: 'Vibrant and entertaining', w: { culture: 1, beach: 1 } } ] },
    { id: 'q4', text: 'What is your approximate travel budget?', type: 'single', options: [
      { id: 'budget', label: 'Budget-friendly', w: {} },
      { id: 'moderate', label: 'Moderate', w: {} },
      { id: 'premium', label: 'Premium', w: {} } ] },
    { id: 'q5', text: 'How long do you usually travel?', type: 'single', options: [
      { id: 'd1', label: 'One day', w: {} }, { id: 'd23', label: '2–3 days', w: {} },
      { id: 'd47', label: '4–7 days', w: {} }, { id: 'd7p', label: 'More than one week', w: {} } ] },
    { id: 'q6', text: 'Who do you prefer travelling with?', type: 'single', options: [
      { id: 'solo', label: 'Solo', w: {} }, { id: 'friends', label: 'Friends', w: {} }, { id: 'family', label: 'Family', w: {} },
      { id: 'partner', label: 'Partner', w: {} }, { id: 'group', label: 'Group', w: {} } ] },
    { id: 'q7', text: 'What pace suits your trips?', type: 'single', options: [
      { id: 'slow', label: 'Slow and relaxed', w: { nature: 1, spiritual: 1 } },
      { id: 'balanced', label: 'A bit of everything', w: {} },
      { id: 'packed', label: 'Packed – see as much as possible', w: { adventure: 1, history: 1 } } ] },
    { id: 'q8', text: 'Pick up to two mornings you would love:', type: 'multi', max: 2, options: [
      { id: 'sunrise', label: 'Sunrise over a misty viewpoint', w: { photo: 2, nature: 1 } },
      { id: 'bells', label: 'Temple bells and morning rituals', w: { spiritual: 2 } },
      { id: 'fort', label: 'Walking through old fort ruins', w: { history: 2 } },
      { id: 'surf', label: 'Waves and an empty beach', w: { beach: 2 } },
      { id: 'market', label: 'A village market and fresh breakfast', w: { culture: 2 } },
      { id: 'river', label: 'A jungle river trek', w: { adventure: 2 } } ] },
    { id: 'q9', text: 'How much physical effort do you enjoy?', type: 'single', options: [
      { id: 'easy', label: 'Easy – short walks', w: { spiritual: 1, culture: 1 } },
      { id: 'moderate', label: 'Moderate – a few hours of walking', w: { nature: 1, history: 1 } },
      { id: 'hard', label: 'Strenuous – full-day treks', w: { adventure: 2 } } ] }
  ];
  const DIRECT_Q = ['q1', 'q2']; // the two most explicit preference questions, used to break ties

  /* Returns an error message (string) or '' when the answers are complete and valid. */
  function validate(answers) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return 'Answers must be an object.';
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      const ids = q.type === 'multi' ? a : [a];
      if (q.type === 'multi' && (!Array.isArray(a) || a.length < 1 || a.length > q.max || new Set(a).size !== a.length)) return `Please pick 1–${q.max} options for: ${q.text}`;
      if (q.type === 'single' && typeof a !== 'string') return `Please answer: ${q.text}`;
      for (const id of ids) if (!q.options.some((o) => o.id === id)) return `Unknown option for: ${q.text}`;
    }
    return '';
  }
  const chosen = (q, answers) => (q.type === 'multi' ? answers[q.id] : [answers[q.id]]).map((id) => q.options.find((o) => o.id === id));

  /* Score a completed quiz. Pure function: same answers => same result. */
  function score(answers) {
    const err = validate(answers);
    if (err) throw new Error(err);
    const total = {}, direct = {};
    PRIORITY.forEach((p) => { total[p] = 0; direct[p] = 0; });
    for (const q of QUESTIONS) for (const o of chosen(q, answers)) {
      for (const [p, pts] of Object.entries(o.w)) { total[p] += pts; if (DIRECT_Q.includes(q.id)) direct[p] += pts; }
    }
    // order: total score, then direct score, then fixed PRIORITY order
    const ranked = [...PRIORITY].sort((a, b) => total[b] - total[a] || direct[b] - direct[a] || PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
    const [first, second] = ranked;
    const tieBroken = total[first] === total[second];
    const secondary = total[second] > 0 && total[second] >= 0.6 * total[first] ? second : null; // only when genuinely close
    return { primary: first, secondary, scores: total, direct, ranked, tieBroken };
  }

  /* Destination matching (transparent): +5 if the destination's category fits the primary personality,
     +3 if it fits the secondary one. Ties are sorted by the destination's rating, then by name. */
  const POINTS = { primary: 5, secondary: 3 };
  const fits = (d, p) => !!p && d.cats.some((c) => PERSONALITIES[p].cats.includes(c));
  function scorePlace(d, r) {
    const reasons = []; let s = 0;
    if (fits(d, r.primary)) { s += POINTS.primary; reasons.push(`Fits your ${PERSONALITIES[r.primary].name} style (+${POINTS.primary})`); }
    else if (fits(d, r.secondary)) { s += POINTS.secondary; reasons.push(`Fits your ${PERSONALITIES[r.secondary].name} side (+${POINTS.secondary})`); }
    return { place: d, score: s, matched: s > 0, reasons };
  }
  const order = (a, b) => b.score - a.score || (b.place.rating || 0) - (a.place.rating || 0) || a.place.name.localeCompare(b.place.name);

  function recommend(destinations, r, { limit = 6, differentLimit = 3 } = {}) {
    const scored = destinations.map((d) => scorePlace(d, r));
    const recommended = scored.filter((x) => x.matched).sort(order).slice(0, limit);
    // "Explore something different": no overlap with the primary/secondary style, one per category, never padded
    const seen = new Set(), different = [];
    for (const x of scored.filter((y) => !y.matched).sort(order)) {
      if (seen.has(x.place.cats[0])) continue; seen.add(x.place.cats[0]); different.push(x);
      if (different.length >= differentLimit) break;
    }
    const message = recommended.length >= 3 ? '' : recommended.length
      ? `Only ${recommended.length} destination${recommended.length > 1 ? 's' : ''} match your style right now.` : 'No destinations match your style right now.';
    return { recommended, different, message };
  }

  const api = { PERSONALITIES, QUESTIONS, PRIORITY, POINTS, validate, score, scorePlace, recommend };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DiscoverEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);