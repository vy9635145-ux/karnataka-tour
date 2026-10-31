/* Karnataka Tour – Smart Packing Assistant (page logic, plain JavaScript).
   Logged-in users: checklists live in the database (/api/me/packing) and auto-save.
   Guests: checklists live in localStorage and are moved into the account after login. */
(function () {
  'use strict';
  const R = window.PackingRules;
  const KEY_GUEST = 'kt_packing_guest';
  const KEY_ACTIVE = 'kt_packing_active';
  const MAX_LISTS = 30, MAX_CATS = 20, MAX_PER_CAT = 60, MAX_ITEMS = 300;

  let lists = [];
  let activeId = null;
  const dirty = new Set();
  let saveTimer = null, retryTimer = null, flushing = false, loadError = '';

  const user = () => auth.current();
  const active = () => lists.find((l) => l.id === activeId) || null;
  const newId = () => `p${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
  const clean = (s, max) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const key = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const totalItems = (l) => l.categories.reduce((n, c) => n + c.items.length, 0);

  /* ---------------- status line ---------------- */
  function setState(text, kind) {
    const el = $('#pk-state');
    el.textContent = text || '';
    el.className = 'pk-save-state' + (kind ? ' ' + kind : '');
  }

  /* ---------------- persistence ---------------- */
  const sane = (l) => l && typeof l === 'object' && typeof l.id === 'string' && Array.isArray(l.categories)
    && l.categories.every((c) => c && Array.isArray(c.items)) && typeof l.dest === 'string';

  function touch(l) {
    l.updatedAt = Date.now();
    if (user()) {
      dirty.add(l.id);
      setState('Saving…', 'busy');
      clearTimeout(saveTimer); saveTimer = setTimeout(flush, 700);
    } else {
      store.set(KEY_GUEST, lists);
      setState('Saved on this device ✓', 'ok');
    }
  }

  async function flush() {
    if (!user() || flushing) return;
    clearTimeout(saveTimer); clearTimeout(retryTimer);
    flushing = true;
    let failure = null;
    while (dirty.size) {
      const id = [...dirty][0];
      const l = lists.find((x) => x.id === id);
      if (!l) { dirty.delete(id); continue; }
      const stamp = l.updatedAt;
      let r = await api.put('/api/me/packing/' + encodeURIComponent(id), l);
      if (!r.ok && r.status === 404) r = await api.post('/api/me/packing', l); // not on the server yet
      if (!r.ok) { failure = r; break; }
      l.tourId = r.list.tourId;
      if (l.updatedAt === stamp) dirty.delete(id); // edited again while saving => loop saves it once more
    }
    flushing = false;
    if (!failure) {
      setState('Saved ✓ ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), 'ok');
    } else if (failure.status === 0 || failure.status >= 500 || failure.status === 429) {
      setState('Not saved yet – retrying…', 'bad');
      retryTimer = setTimeout(flush, 6000);
    } else if (failure.status === 401) {
      setState('Not saved – please log in again.', 'bad');
    } else {
      setState('Not saved: ' + failure.error, 'bad');
    }
    return !failure;
  }

  async function importGuestLists() {
    const g = store.get(KEY_GUEST, []);
    if (!user() || !Array.isArray(g) || !g.length) return 0;
    let moved = 0; const rest = [];
    for (const l of g) {
      if (!sane(l)) continue;
      const r = await api.post('/api/me/packing', l);
      if (r.ok || (r.status === 409 && /already exists/.test(r.error || ''))) moved++; else rest.push(l);
    }
    store.set(KEY_GUEST, rest);
    return moved;
  }

  async function load() {
    $('#pk-loading').hidden = false; $('#pk-empty').hidden = true; $('#pk-board').hidden = true;
    loadError = '';
    if (user()) {
      const moved = await importGuestLists();
      if (moved) toast(`Moved ${moved} guest packing list${moved > 1 ? 's' : ''} into your account`);
      const r = await api.get('/api/me/packing');
      if (r.ok) lists = r.lists.filter(sane); else { lists = []; loadError = r.error; }
    } else {
      const g = store.get(KEY_GUEST, []);
      lists = Array.isArray(g) ? g.filter(sane) : [];
    }
    $('#pk-loading').hidden = true;
    const saved = store.get(KEY_ACTIVE, null);
    activeId = lists.some((l) => l.id === saved) ? saved : (lists[0] ? lists[0].id : null);
  }

  /* ---------------- rendering ---------------- */
  function renderAll() {
    renderChips();
    const l = active();
    $('#pk-empty').hidden = !!l;
    $('#pk-board').hidden = !l;
    if (!l) { renderEmpty(); return; }
    $('#pk-title').textContent = l.name;
    const d = getDest(l.dest);
    $('#pk-sub').textContent = [d ? d.name : l.dest, `${l.days} day${l.days > 1 ? 's' : ''}`, l.type, l.season, l.activities.length ? l.activities.join(', ') : 'No special activities'].join(' • ');
    const a = $('#pk-dest-link'); a.href = d ? 'destination.html?id=' + d.id : '#'; a.hidden = !d;
    renderTourLink(l);
    renderCats();
    paintProgress();
  }

  function renderEmpty() {
    const g = $('#pk-guest-note');
    if (loadError) g.innerHTML = `⚠️ Could not load your saved lists (${esc(loadError)}). <button class="link" type="button" id="pk-retry" style="background:none;border:0;cursor:pointer;font:inherit">Try again</button>`;
    else g.innerHTML = user() ? '' : 'You are not logged in, so lists are kept on this device. <a class="link" href="login.html?next=packing.html">Log in</a> to save them to your account.';
  }

  function renderChips() {
    const box = $('#pk-lists');
    box.hidden = !lists.length;
    box.innerHTML = lists.map((l) => `<button type="button" class="chip pk-chip${l.id === activeId ? ' active' : ''}" data-list="${l.id}" aria-pressed="${l.id === activeId}">${esc(l.name)} <small>${R.progress(l).pct}%</small></button>`).join('')
      + '<button type="button" class="chip pk-chip new" id="pk-new">＋ New list</button>';
  }

  function renderTourLink(l) {
    let el = $('#pk-tourlink');
    if (!el) { el = document.createElement('p'); el.id = 'pk-tourlink'; el.className = 'hint pk-tourlink'; $('#pk-sub').after(el); }
    const t = l.tourId ? auth.data.get('tours').find((x) => x.id === l.tourId) : null;
    el.hidden = !t;
    if (t) el.innerHTML = `🗓️ Linked to your confirmed tour: <a class="link" href="profile.html#tour-${esc(t.id)}">${esc(t.name)}</a>`;
  }

  function itemHTML(it) {
    return `<li class="pk-item${it.packed ? ' packed' : ''}" data-item="${it.id}">
      <label class="pk-check"><input type="checkbox" data-act="toggle"${it.packed ? ' checked' : ''} aria-label="Packed: ${esc(it.name)}"><span class="pk-name">${esc(it.name)}</span></label>
      <div class="pk-qty" role="group" aria-label="Quantity of ${esc(it.name)}"><button type="button" data-act="dec" aria-label="Decrease quantity of ${esc(it.name)}"${it.qty <= 1 ? ' disabled' : ''}>−</button><b>${it.qty}</b><button type="button" data-act="inc" aria-label="Increase quantity of ${esc(it.name)}"${it.qty >= 99 ? ' disabled' : ''}>+</button></div>
      <button type="button" class="pk-ico" data-act="edit" aria-label="Rename ${esc(it.name)}" title="Rename">✎</button>
      <button type="button" class="pk-ico del" data-act="del" aria-label="Remove ${esc(it.name)}" title="Remove">✕</button></li>`;
  }

  function catHTML(c) {
    const done = c.items.filter((i) => i.packed).length;
    return `<section class="card pk-cat" data-cat="${c.id}">
      <header class="pk-cat-head"><h3 class="pk-cat-name">${esc(c.name)}</h3><span class="pk-cat-count">${done}/${c.items.length}</span>
        <div class="pk-cat-tools"><button type="button" class="pk-ico" data-act="cat-ren" aria-label="Rename category ${esc(c.name)}" title="Rename category">✎</button><button type="button" class="pk-ico del" data-act="cat-del" aria-label="Delete category ${esc(c.name)}" title="Delete category">🗑</button></div></header>
      <ul class="pk-items">${c.items.map(itemHTML).join('')}</ul>
      <form class="pk-quick" data-act="quick"><input name="name" maxlength="80" placeholder="Add item to ${esc(c.name)}…" aria-label="New item in ${esc(c.name)}"><button class="btn sm" type="submit">Add</button></form>
    </section>`;
  }

  function renderCats() {
    const l = active();
    $('#pk-cats').innerHTML = l.categories.map(catHTML).join('');
    $('#pk-blank').hidden = l.categories.length > 0;
  }

  function paintProgress() {
    const l = active(); if (!l) return;
    const p = R.progress(l);
    $('#pk-total').textContent = p.total; $('#pk-packed').textContent = p.packed;
    $('#pk-left').textContent = p.remaining; $('#pk-pct').textContent = p.pct + '%';
    $('#pk-fill').style.width = p.pct + '%';
    $('#pk-bar').setAttribute('aria-valuenow', p.pct);
    $('#pk-bar').classList.toggle('full', p.total > 0 && p.pct === 100);
    const chip = $(`.pk-chip[data-list="${l.id}"] small`); if (chip) chip.textContent = p.pct + '%';
    $$('.pk-cat').forEach((el) => {
      const c = l.categories.find((x) => x.id === el.dataset.cat); if (!c) return;
      $('.pk-cat-count', el).textContent = `${c.items.filter((i) => i.packed).length}/${c.items.length}`;
    });
  }

  /* ---------------- helpers on the model ---------------- */
  const findCat = (l, id) => l.categories.find((c) => c.id === id);
  function findItem(l, id) {
    for (const c of l.categories) { const it = c.items.find((i) => i.id === id); if (it) return { c, it }; }
    return null;
  }
  const hasItemName = (l, name) => l.categories.some((c) => c.items.some((i) => key(i.name) === key(name)));

  function addItem(l, catId, name, qty) {
    name = clean(name, 80);
    if (!name) return 'Please type an item name.';
    const c = findCat(l, catId); if (!c) return 'Choose a category.';
    if (hasItemName(l, name)) return `“${name}” is already in this list.`;
    if (c.items.length >= MAX_PER_CAT) return `A category can hold up to ${MAX_PER_CAT} items.`;
    if (totalItems(l) >= MAX_ITEMS) return `A checklist can hold up to ${MAX_ITEMS} items.`;
    const q = Math.min(Math.max(Math.round(Number(qty)) || 1, 1), 99);
    c.items.push({ id: R.uid('i'), name, qty: q, packed: false });
    return '';
  }
  function addCategory(l, name) {
    name = clean(name, 40);
    if (!name) return { error: 'Please type a category name.' };
    if (l.categories.some((c) => key(c.name) === key(name))) return { error: `Category “${name}” already exists.` };
    if (l.categories.length >= MAX_CATS) return { error: `You can have up to ${MAX_CATS} categories.` };
    const c = { id: R.uid('c'), name, items: [] };
    l.categories.push(c);
    return { cat: c };
  }

  /* ---------------- trip form ---------------- */
  function seasonNow() { const m = new Date().getMonth() + 1; return m >= 6 && m <= 9 ? 'Monsoon' : (m >= 3 && m <= 5 ? 'Summer' : 'Winter'); }

  function buildForm() {
    $('#pk-dest').innerHTML = destinations.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
    $('#pk-types').innerHTML = R.TYPES.map((v, i) => `<label class="pk-opt"><input type="radio" name="type" value="${v}"${i === 0 ? ' checked' : ''}><span>${v}</span></label>`).join('');
    $('#pk-acts').innerHTML = R.ACTIVITIES.map((v) => `<label class="pk-opt"><input type="checkbox" name="act" value="${v}"><span>${v}</span></label>`).join('');
    const s = seasonNow();
    $('#pk-seasons').innerHTML = R.SEASONS.map((v) => `<label class="pk-opt"><input type="radio" name="season" value="${v}"${v === s ? ' checked' : ''}><span>${v}</span></label>`).join('');
    const tours = user() ? auth.data.get('tours') : [];
    $('#pk-tour-wrap').hidden = !tours.length;
    $('#pk-tour').innerHTML = '<option value="">— Not linked —</option>' + tours.map((t) => `<option value="${esc(t.id)}">${esc(t.name)} (${t.days} day${t.days > 1 ? 's' : ''})</option>`).join('');
  }

  function prefillFromUrl() {
    const q = new URLSearchParams(location.search);
    const dest = q.get('dest'), tourId = q.get('tour');
    if (dest && getDest(dest)) $('#pk-dest').value = dest;
    if (tourId && user()) {
      const t = auth.data.get('tours').find((x) => x.id === tourId);
      if (t) {
        $('#pk-tour').value = t.id; if (getDest(t.dest)) $('#pk-dest').value = t.dest;
        $('#pk-days').value = t.days; $('#pk-name').placeholder = `Packing list – ${t.name}`;
        const existing = lists.find((l) => l.tourId === t.id);
        if (existing) { activeId = existing.id; store.set(KEY_ACTIVE, activeId); }
      }
    }
  }

  function readForm() {
    const f = $('#pk-form');
    const dest = $('#pk-dest').value;
    const days = Number($('#pk-days').value);
    if (!getDest(dest)) return { error: 'Please choose a destination.' };
    if (!Number.isInteger(days) || days < 1 || days > 60) return { error: 'Trip duration must be a whole number from 1 to 60 days.' };
    const type = (f.querySelector('input[name="type"]:checked') || {}).value;
    const season = (f.querySelector('input[name="season"]:checked') || {}).value;
    if (!R.TYPES.includes(type)) return { error: 'Please choose a trip type.' };
    if (!R.SEASONS.includes(season)) return { error: 'Please choose a season.' };
    const activities = [...f.querySelectorAll('input[name="act"]:checked')].map((x) => x.value);
    const d = getDest(dest);
    return { dest, days, type, season, activities, tourId: $('#pk-tour').value || null, name: clean($('#pk-name').value, 100) || `Packing list – ${d.name}` };
  }

  function buildList(t) {
    const d = getDest(t.dest), now = Date.now();
    return {
      id: newId(), name: t.name, dest: t.dest, tourId: t.tourId || null, days: t.days, type: t.type, season: t.season,
      activities: t.activities, createdAt: now, updatedAt: now,
      categories: R.generate({ days: t.days, type: t.type, season: t.season, activities: t.activities, dest: d })
    };
  }

  function activate(id) {
    activeId = id; store.set(KEY_ACTIVE, id);
    $('#pk-panel').innerHTML = '';
    renderAll();
  }

  /* ---------------- panel (add item / add category) ---------------- */
  function openPanel(mode) {
    const l = active(); if (!l) return;
    const p = $('#pk-panel');
    if (mode === 'cat') {
      p.innerHTML = `<form class="card pad pk-panel-form" data-panel="cat"><h3>Add category</h3><label>Category name<input name="name" maxlength="40" required placeholder="e.g. Photography, Kids, Pooja items"></label><p class="form-msg" role="alert"></p><div class="row"><button class="btn sm" type="submit">Add category</button><button class="btn sm ghost-dark" type="button" data-panel-close>Cancel</button></div></form>`;
    } else {
      const none = !l.categories.length;
      p.innerHTML = `<form class="card pad pk-panel-form" data-panel="item"><h3>Add item</h3><div class="pk-panel-grid">
        <label>Item name<input name="name" maxlength="80" required></label>
        <label>Category<select name="cat">${l.categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}<option value="__new"${none ? ' selected' : ''}>＋ New category…</option></select></label>
        <label>Quantity<input type="number" name="qty" min="1" max="99" value="1" inputmode="numeric"></label></div>
        <label class="pk-newcat"${none ? '' : ' hidden'}>New category name<input name="newcat" maxlength="40"></label>
        <p class="form-msg" role="alert"></p><div class="row"><button class="btn sm" type="submit">Add item</button><button class="btn sm ghost-dark" type="button" data-panel-close>Cancel</button></div></form>`;
    }
    const first = $('input[name="name"]', p); if (first) { first.focus(); p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }

  /* ---------------- inline editing ---------------- */
  function startEdit(el, current, max, commit) {
    const input = document.createElement('input');
    input.className = 'pk-edit'; input.value = current; input.maxLength = max; input.setAttribute('aria-label', 'Edit name');
    el.replaceWith(input); input.focus(); input.select();
    let done = false;
    const finish = (save) => {
      if (done) return; done = true;
      const v = clean(input.value, max);
      if (save && v && v !== current) { const err = commit(v); if (err) { toast(err); } }
      renderCats(); paintProgress();
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
  }

  /* ---------------- events ---------------- */
  function bind() {
    $('#pk-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('#pk-msg'); msg.textContent = '';
      const t = readForm();
      if (t.error) { msg.textContent = t.error; return; }
      if (lists.length >= MAX_LISTS) { msg.textContent = `You can keep up to ${MAX_LISTS} packing lists. Delete an old one first.`; return; }
      const l = buildList(t);
      lists.unshift(l); touch(l); activate(l.id);
      toast(`Checklist ready – ${totalItems(l)} items suggested ✓`);
      $('#pk-board').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('#pk-tour').addEventListener('change', (e) => {
      const t = auth.data.get('tours').find((x) => x.id === e.target.value); if (!t) return;
      if (getDest(t.dest)) $('#pk-dest').value = t.dest;
      $('#pk-days').value = t.days; $('#pk-name').placeholder = `Packing list – ${t.name}`;
    });

    $('#pk-lists').addEventListener('click', (e) => {
      if (e.target.closest('#pk-new')) { $('#pk-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#pk-dest').focus(); return; }
      const b = e.target.closest('[data-list]'); if (b) activate(b.dataset.list);
    });

    document.addEventListener('click', (e) => { if (e.target.closest('#pk-retry')) init(); });

    $('#pk-additem').addEventListener('click', () => openPanel('item'));
    $('#pk-addcat').addEventListener('click', () => openPanel('cat'));

    $('#pk-panel').addEventListener('change', (e) => {
      if (e.target.name === 'cat') { const w = $('.pk-newcat', $('#pk-panel')); w.hidden = e.target.value !== '__new'; if (!w.hidden) $('input', w).focus(); }
    });
    $('#pk-panel').addEventListener('click', (e) => { if (e.target.closest('[data-panel-close]')) $('#pk-panel').innerHTML = ''; });
    $('#pk-panel').addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target, l = active(), msg = $('.form-msg', form); msg.textContent = '';
      if (form.dataset.panel === 'cat') {
        const r = addCategory(l, form.elements.name.value);
        if (r.error) { msg.textContent = r.error; return; }
        touch(l); $('#pk-panel').innerHTML = ''; renderCats(); paintProgress(); toast('Category added');
        return;
      }
      let catId = form.elements.cat.value;
      let created = null;
      if (catId === '__new') {
        const r = addCategory(l, form.elements.newcat.value);
        if (r.error) { msg.textContent = r.error; return; }
        created = r.cat; catId = r.cat.id;
      }
      const err = addItem(l, catId, form.elements.name.value, form.elements.qty.value);
      if (err) { if (created) l.categories.pop(); msg.textContent = err; return; }
      touch(l); renderCats(); paintProgress();
      form.elements.name.value = ''; form.elements.qty.value = 1; form.elements.name.focus();
      if (created) { form.elements.cat.innerHTML = l.categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('') + '<option value="__new">＋ New category…</option>'; form.elements.cat.value = created.id; $('.pk-newcat', form).hidden = true; form.elements.newcat.value = ''; }
      toast('Item added');
    });

    $('#pk-cats').addEventListener('change', (e) => {
      if (e.target.dataset.act !== 'toggle') return;
      const l = active(), li = e.target.closest('.pk-item'), f = findItem(l, li.dataset.item); if (!f) return;
      f.it.packed = e.target.checked; li.classList.toggle('packed', f.it.packed);
      touch(l); paintProgress();
    });

    $('#pk-cats').addEventListener('submit', (e) => {
      if (e.target.dataset.act !== 'quick') return;
      e.preventDefault();
      const l = active(), cat = e.target.closest('.pk-cat').dataset.cat, input = e.target.elements.name;
      const err = addItem(l, cat, input.value, 1);
      if (err) { toast(err); return; }
      touch(l); renderCats(); paintProgress();
      const again = $(`.pk-cat[data-cat="${cat}"] .pk-quick input`); if (again) again.focus();
    });

    $('#pk-cats').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      const l = active(), act = b.dataset.act;
      const catEl = b.closest('.pk-cat'), c = findCat(l, catEl.dataset.cat);
      if (act === 'cat-ren') {
        startEdit($('.pk-cat-name', catEl), c.name, 40, (v) => {
          if (l.categories.some((x) => x !== c && key(x.name) === key(v))) return `Category “${v}” already exists.`;
          c.name = v; touch(l); return '';
        });
        return;
      }
      if (act === 'cat-del') {
        if (c.items.length && !confirm(`Delete the category “${c.name}” and its ${c.items.length} item${c.items.length > 1 ? 's' : ''}?`)) return;
        l.categories = l.categories.filter((x) => x !== c); touch(l); renderCats(); paintProgress(); toast('Category deleted');
        return;
      }
      const li = b.closest('.pk-item'); if (!li) return;
      const f = findItem(l, li.dataset.item); if (!f) return;
      if (act === 'inc' || act === 'dec') {
        f.it.qty = Math.min(99, Math.max(1, f.it.qty + (act === 'inc' ? 1 : -1)));
        touch(l); li.outerHTML = itemHTML(f.it);
      } else if (act === 'del') {
        f.c.items = f.c.items.filter((x) => x !== f.it); touch(l); renderCats(); paintProgress();
        toast(`Removed “${f.it.name}”`);
      } else if (act === 'edit') {
        startEdit($('.pk-name', li), f.it.name, 80, (v) => {
          if (key(v) !== key(f.it.name) && hasItemName(l, v)) return `“${v}” is already in this list.`;
          f.it.name = v; touch(l); return '';
        });
      }
    });

    $('#pk-save').addEventListener('click', async () => {
      const l = active(); if (!l) return;
      if (!user()) { touch(l); toast('Saved on this device. Log in to keep it in your account.'); return; }
      dirty.add(l.id); setState('Saving…', 'busy');
      const ok = await flush(); toast(ok ? 'Checklist saved ✓' : 'Could not save – we will keep retrying');
    });

    $('#pk-dup').addEventListener('click', () => {
      const l = active(); if (!l) return;
      if (lists.length >= MAX_LISTS) { toast(`You can keep up to ${MAX_LISTS} packing lists.`); return; }
      const copy = JSON.parse(JSON.stringify(l));
      copy.id = newId(); copy.name = clean(l.name + ' (copy)', 100); copy.createdAt = Date.now(); copy.tourId = null;
      copy.categories.forEach((c) => { c.id = R.uid('c'); c.items.forEach((i) => { i.id = R.uid('i'); i.packed = false; }); });
      lists.unshift(copy); touch(copy); activate(copy.id); toast('Checklist duplicated – nothing is ticked in the copy');
    });

    $('#pk-reset').addEventListener('click', () => {
      const l = active(); if (!l) return;
      if (!confirm('Reset this checklist to the suggested items? Your custom items, edits and ticks will be lost.')) return;
      l.categories = R.generate({ days: l.days, type: l.type, season: l.season, activities: l.activities, dest: getDest(l.dest) });
      touch(l); $('#pk-panel').innerHTML = ''; renderAll(); toast('Checklist reset');
    });

    $('#pk-del').addEventListener('click', async () => {
      const l = active(); if (!l) return;
      if (!confirm(`Delete the packing list “${l.name}”? This cannot be undone.`)) return;
      lists = lists.filter((x) => x.id !== l.id); dirty.delete(l.id);
      if (user()) {
        const r = await api.del('/api/me/packing/' + encodeURIComponent(l.id));
        if (!r.ok && r.status !== 404) { toast(r.error); lists.unshift(l); renderAll(); return; }
        setState('Deleted ✓', 'ok');
      } else { store.set(KEY_GUEST, lists); setState('Deleted ✓', 'ok'); }
      activate(lists[0] ? lists[0].id : null); toast('Packing list deleted');
    });

    window.addEventListener('beforeunload', (e) => { if (dirty.size) { e.preventDefault(); e.returnValue = ''; } });
  }

  /* ---------------- start ---------------- */
  async function init() {
    buildForm();
    await load();
    prefillFromUrl();
    renderAll();
    if (!user() && lists.length) setState('Saved on this device', '');
  }

  const start = () => { bind(); init(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();