/* Karnataka Tour – Smart Packing Assistant: suggestion rules + progress maths.
   Plain JavaScript, no dependencies. Works in the browser (window.PackingRules) and in Node (module.exports) so the tests can use it. */
(function (root) {
  'use strict';

  const TYPES = ['Solo', 'Family', 'Friends', 'Adventure'];
  const ACTIVITIES = ['Trekking', 'Beach', 'Sightseeing', 'Camping', 'Wildlife'];
  const SEASONS = ['Summer', 'Winter', 'Monsoon'];

  /* Category names (also the order they are shown in) */
  const C = {
    clothes: 'Clothes & Footwear',
    toiletries: 'Toiletries',
    tech: 'Electronics & Charging',
    docs: 'Documents & Money',
    personal: 'Personal Essentials',
    weather: 'Weather Gear',
    trek: 'Trekking Gear',
    beach: 'Beach Essentials',
    camp: 'Camping Gear',
    wild: 'Wildlife & Safari',
    sights: 'Sightseeing'
  };
  const ORDER = [C.clothes, C.toiletries, C.tech, C.docs, C.personal, C.weather, C.trek, C.beach, C.camp, C.wild, C.sights];

  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  let seq = 0;
  const uid = (p) => p + Date.now().toString(36).slice(-4) + (seq++).toString(36) + Math.floor(Math.random() * 1296).toString(36);

  /* Generate categories for a trip. `trip` = { days, type, season, activities[], dest (destination object, optional) } */
  function generate(trip) {
    const days = Math.min(Math.max(Math.round(Number(trip.days)) || 1, 1), 60);
    const type = TYPES.includes(trip.type) ? trip.type : 'Solo';
    const season = SEASONS.includes(trip.season) ? trip.season : 'Winter';
    const acts = new Set((trip.activities || []).filter((a) => ACTIVITIES.includes(a)));
    const cats = (trip.dest && trip.dest.cats) || [];
    const has = (a) => acts.has(a);

    /* On long trips people do laundry, so quantities are capped. */
    const laundry = Math.min(days, 7);
    const buckets = new Map(); // category -> Map(normalised name -> {name, qty})
    const taken = new Map();   // normalised name -> category that already holds it (no duplicates anywhere)

    function add(cat, name, qty = 1) {
      const key = norm(name);
      if (taken.has(key)) {                      // same item suggested twice: keep one, with the larger quantity
        const it = buckets.get(taken.get(key)).get(key);
        it.qty = Math.max(it.qty, qty);
        return;
      }
      if (!buckets.has(cat)) buckets.set(cat, new Map());
      buckets.get(cat).set(key, { name, qty: Math.min(Math.max(qty, 1), 99) });
      taken.set(key, cat);
    }

    /* ---- always ---- */
    add(C.clothes, 'T-shirts / tops', laundry);
    add(C.clothes, 'Trousers / jeans', Math.min(Math.ceil(days / 2), 4));
    add(C.clothes, 'Underwear', Math.min(days + 1, 8));
    add(C.clothes, 'Socks (pairs)', Math.min(days + 1, 8));
    add(C.clothes, 'Sleepwear', days > 4 ? 2 : 1);
    add(C.clothes, 'Comfortable walking shoes / sandals');
    add(C.toiletries, 'Toothbrush & toothpaste');
    add(C.toiletries, 'Soap / body wash');
    add(C.toiletries, 'Shampoo (travel size)');
    add(C.toiletries, 'Deodorant');
    add(C.toiletries, 'Comb / hairbrush');
    add(C.toiletries, 'Towel (quick-dry)');
    add(C.toiletries, 'Hand sanitizer');
    add(C.toiletries, 'Face masks', Math.min(days, 5));
    add(C.tech, 'Mobile phone');
    add(C.tech, 'Mobile charger & cable');
    add(C.tech, 'Power bank');
    add(C.tech, 'Earphones');
    add(C.docs, 'Government photo ID (Aadhaar / driving licence)');
    add(C.docs, 'Train / bus / flight tickets');
    add(C.docs, 'Hotel / homestay booking confirmation');
    add(C.docs, 'Cash & UPI / cards');
    add(C.personal, 'Water bottle (reusable)');
    add(C.personal, 'Basic medicines (paracetamol, ORS, antacid)');
    add(C.personal, 'Any prescription medicines');
    add(C.personal, 'Sunglasses');
    add(C.personal, 'Small daypack');
    add(C.personal, 'Snacks');

    /* ---- season ---- */
    if (season === 'Summer') {
      add(C.clothes, 'Light cotton clothes');
      add(C.clothes, 'Cap / hat');
      add(C.personal, 'Sunscreen (SPF 30+)');
      add(C.personal, 'Extra drinking water / electrolytes');
    } else if (season === 'Winter') {
      add(C.clothes, 'Light sweater / hoodie');
      add(C.clothes, 'Light jacket');
      add(C.personal, 'Moisturiser & lip balm');
    } else { // Monsoon
      add(C.weather, 'Raincoat / poncho');
      add(C.weather, 'Umbrella');
      add(C.weather, 'Waterproof bag cover');
      add(C.weather, 'Zip-lock bags for phone & documents', 3);
      add(C.clothes, 'Quick-dry clothes');
      add(C.clothes, 'Waterproof sandals / slippers');
      add(C.clothes, 'Extra pair of socks', Math.min(days + 1, 8));
      add(C.personal, 'Insect repellent');
    }

    /* ---- destination (hills are cool, temples need modest clothes) ---- */
    if (cats.includes('hill') && season !== 'Winter') add(C.clothes, 'Light jacket');
    if (cats.includes('temple')) {
      add(C.clothes, 'Modest clothes for temple visits');
      add(C.clothes, 'Easy slip-off footwear');
    }

    /* ---- trip type ---- */
    if (type === 'Solo') {
      add(C.docs, 'Emergency contact details (written down)');
      add(C.personal, 'Padlock for bag / locker');
      add(C.tech, 'Offline maps downloaded');
    } else if (type === 'Family') {
      add(C.personal, 'First-aid kit');
      add(C.personal, 'Wet wipes & tissues');
      add(C.personal, 'Extra snacks & drinking water');
      add(C.personal, 'Cards / small games for travel time');
    } else if (type === 'Friends') {
      add(C.tech, 'Portable speaker');
      add(C.personal, 'Cards / board game');
      add(C.personal, 'Cash for splitting costs');
    } else { // Adventure
      add(C.personal, 'First-aid kit');
      add(C.personal, 'Torch / headlamp');
      add(C.personal, 'Energy bars');
      add(C.personal, 'Multi-tool / pocket knife (checked baggage only)');
    }

    /* ---- activities ---- */
    if (has('Trekking')) {
      add(C.trek, 'Trekking shoes');
      add(C.trek, 'Trekking pole');
      add(C.trek, 'Dry-fit / quick-dry T-shirts', Math.min(days, 4));
      add(C.trek, 'Trekking socks (pairs)', Math.min(days, 4));
      add(C.trek, 'Torch / headlamp');
      add(C.trek, 'Energy bars / trail mix');
      add(C.trek, 'Extra water (2-3 litres)');
      add(C.trek, 'Blister plasters');
      add(C.personal, 'First-aid kit');
    }
    if (has('Beach')) {
      add(C.beach, 'Swimwear', Math.min(Math.max(Math.ceil(days / 2), 1), 3));
      add(C.beach, 'Beach towel');
      add(C.beach, 'Flip-flops');
      add(C.beach, 'Sunscreen (SPF 30+)');
      add(C.beach, 'Sunglasses');
      add(C.beach, 'Cap / hat');
      add(C.beach, 'Dry bag / waterproof pouch for phone');
      add(C.beach, 'Change of clothes for after the beach');
    }
    if (has('Camping')) {
      add(C.camp, 'Tent');
      add(C.camp, 'Sleeping bag / bedroll');
      add(C.camp, 'Torch / headlamp');
      add(C.camp, 'Extra batteries');
      add(C.camp, 'Mosquito / insect repellent');
      add(C.camp, 'Matchbox / lighter');
      add(C.camp, 'Plate, cup & cutlery');
      add(C.camp, 'Trash bags');
      add(C.camp, 'Warm layer for the night');
    }
    if (has('Wildlife')) {
      add(C.wild, 'Binoculars');
      add(C.wild, 'Camera with zoom lens');
      add(C.wild, 'Neutral / earth-toned clothes (no bright colours)');
      add(C.wild, 'Insect repellent');
      add(C.wild, 'Full-sleeve shirt');
      add(C.wild, 'Safari booking / forest permit');
    }
    if (has('Sightseeing')) {
      add(C.sights, 'Camera / phone with free storage');
      add(C.sights, 'Comfortable walking shoes / sandals');
      add(C.sights, 'Cap / hat');
      add(C.sights, 'Notebook & pen');
      add(C.sights, 'Entry tickets / monument passes');
    }

    return ORDER.filter((n) => buckets.has(n)).map((n) => ({
      id: uid('c'),
      name: n,
      items: [...buckets.get(n).values()].map((it) => ({ id: uid('i'), name: it.name, qty: it.qty, packed: false }))
    }));
  }

  /* total = number of item rows; packed = ticked rows; pct is rounded and 0 for an empty list */
  function progress(list) {
    let total = 0, packed = 0;
    for (const c of (list && list.categories) || []) for (const it of c.items || []) { total++; if (it.packed) packed++; }
    return { total, packed, remaining: total - packed, pct: total ? Math.round((packed / total) * 100) : 0 };
  }

  const api = { TYPES, ACTIVITIES, SEASONS, CATEGORY_NAMES: C, generate, progress, uid };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PackingRules = api;
})(typeof window !== 'undefined' ? window : globalThis);