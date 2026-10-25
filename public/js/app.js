/* Karnataka Tour – shared logic (plain JavaScript, no build tools) */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
// Keyword-based placeholder photos (no API key). Replace with your own images for production.
const photo = (kw, w = 800, h = 600, lock = 1) => `https://loremflickr.com/${w}/${h}/${encodeURIComponent(kw)}?lock=${lock}`;
const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a4161a"/><stop offset="1" stop-color="#f2b705"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="310" font-size="40" fill="#fff" text-anchor="middle" font-family="sans-serif">Karnataka Tour</text></svg>');
function fb(img) { img.onerror = null; img.src = FALLBACK; }
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
};

let theme = store.get('kt_theme', 'light');
let lang = store.get('kt_lang', 'en');
let favs = typeof auth !== 'undefined' ? auth.data.get('favs') : store.get('kt_favs', []);
document.documentElement.dataset.theme = theme;
document.documentElement.lang = lang;

const t = (k) => (translations[lang] && translations[lang][k]) || translations.en[k] || k;
function applyI18n(root = document) {
  $$('[data-i18n]', root).forEach((e) => { e.textContent = t(e.dataset.i18n); });
  $$('[data-i18n-ph]', root).forEach((e) => { e.placeholder = t(e.dataset.i18nPh); });
}

/* ---------- toast ---------- */
function toast(msg) {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; box.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* ---------- header / footer ---------- */
const NAV = [['index.html', 'nav_home'], ['explore.html', 'nav_explore'], ['blog.html', 'nav_blog'], ['about.html', 'nav_about'], ['index.html#contact', 'nav_contact']];
const ALIAS = { 'destination.html': 'explore.html', '': 'index.html' };
const here = location.pathname.split('/').pop();
const activePage = ALIAS[here] || here;
const LOGO = '<span style="font-size:1.4rem">⛰️</span> <span>Karnataka<b>Tour</b></span>';

function authHTML() {
  const u = typeof auth !== 'undefined' ? auth.current() : null;
  if (!u) return `<a class="btn sm ghost-dark auth-login" href="login.html" data-i18n="nav_login"></a><a class="btn sm" href="signup.html" data-i18n="nav_signup"></a>`;
  return `<div class="user-menu"><button class="avatar" id="user-btn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">${esc(u.name.trim().charAt(0).toUpperCase())}</button>
    <div class="user-pop" id="user-pop" hidden><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small><a href="profile.html" data-i18n="nav_profile"></a><button type="button" id="logout-btn" data-i18n="nav_logout"></button></div></div>`;
}

function renderLayout() {
  const h = $('#site-header');
  if (h) {
    h.innerHTML = `<header class="nav"><div class="container nav-in">
      <a href="index.html" class="logo">${LOGO}</a>
      <nav class="links" id="links" aria-label="Main">${NAV.map(([u, k]) => `<a href="${u}" class="${u === activePage ? 'active' : ''}" data-i18n="${k}"></a>`).join('')}</nav>
      <div class="nav-tools">
        ${authHTML()}
        <label class="lang">🌐<select id="lang" aria-label="Language"><option value="en">English</option><option value="hi">हिन्दी</option><option value="kn">ಕನ್ನಡ</option></select></label>
        <button class="icon-btn" id="theme-btn" aria-label="Toggle dark mode"></button>
        <button class="icon-btn burger" id="burger" aria-label="Menu" aria-expanded="false">☰</button>
      </div></div></header>`;
    $('#lang').value = lang;
    $('#lang').addEventListener('change', (e) => { store.set('kt_lang', e.target.value); location.reload(); });
    const tb = $('#theme-btn'); tb.textContent = theme === 'dark' ? '☀️' : '🌙';
    tb.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark'; store.set('kt_theme', theme);
      document.documentElement.dataset.theme = theme; tb.textContent = theme === 'dark' ? '☀️' : '🌙';
      toast(theme === 'dark' ? 'Dark mode on' : 'Light mode on');
    });
    const ub = $('#user-btn');
    if (ub) {
      ub.addEventListener('click', (e) => { e.stopPropagation(); const p = $('#user-pop'); p.hidden = !p.hidden; ub.setAttribute('aria-expanded', !p.hidden); });
      document.addEventListener('click', (e) => { const p = $('#user-pop'); if (p && !p.contains(e.target)) { p.hidden = true; ub.setAttribute('aria-expanded', 'false'); } });
      $('#logout-btn').addEventListener('click', () => { auth.logout(); toast('Logged out. Hogi banni! 👋'); setTimeout(() => { location.href = 'index.html'; }, 600); });
    }
    $('#burger').addEventListener('click', () => {
      const o = $('#links').classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); $('#burger').textContent = o ? '✕' : '☰';
    });
  }
  const f = $('#site-footer');
  if (f) {
    f.innerHTML = `<footer class="footer"><div class="container foot-grid">
      <div><div class="logo">${LOGO}</div><p data-i18n="footer_tag"></p></div>
      <div><h4>Explore</h4><a href="explore.html">Destinations</a><a href="explore.html?tab=planner">Trip Planner</a><a href="explore.html?tab=budget">Budget Calculator</a></div>
      <div><h4>Read</h4><a href="blog.html">Travel Blog</a><a href="about.html">About</a><a href="index.html#contact">Contact</a><a href="login.html">Login</a><a href="signup.html">Sign up</a></div>
      <div><h4>Note</h4><p>Prices, ratings and weather shown on the site are sample data.</p></div></div>
      <div class="container copy">© ${new Date().getFullYear()} Karnataka Tour – demo project. ಕರ್ನಾಟಕ ಪ್ರವಾಸ</div></footer>`;
  }
  applyI18n();
}

/* ---------- blog helpers (user posts are demo data kept in localStorage) ---------- */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* Community posts come from the server (loaded lazily, once per page). */
let _posts = null;
const userPosts = () => { if (_posts === null) { const r = typeof api !== 'undefined' ? api.getSync('/api/posts') : null; _posts = r && r.ok ? r.posts : []; } return _posts; };
const setUserPosts = (list) => { _posts = list; };
const allBlogs = () => [...userPosts(), ...blogs];
const blogImg = (b) => b.img || `images/blog/${b.slug}.jpg`; // folder: images/blog

/* ---------- shared UI helpers ---------- */
function stars(v) { const r = Math.round(v); return `<span class="stars" aria-label="${v} out of 5">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</span>`; }

function cardHTML(d) {
  const fav = favs.includes(d.id);
  return `<article class="card dest"><div class="img-wrap">
    <img loading="lazy" src="images/places/${d.id}.jpg" alt="${d.name}" onerror="fb(this)">
    <button class="fav${fav ? ' on' : ''}" data-id="${d.id}" aria-label="Save ${d.name} to favourites" aria-pressed="${fav}">${fav ? '♥' : '♡'}</button>
    <span class="chip-abs">${d.cats[0]}</span></div>
    <div class="card-body"><div class="row between"><h3>${d.name}</h3><span class="rate">★ ${d.rating}</span></div>
    <p class="loc">📍 ${d.region}</p><p class="clamp">${d.desc}</p>
    <div class="row between"><small class="muted">from ${inr(d.cost)}/day</small>
    <a class="btn sm" href="destination.html?id=${d.id}">${t('explore_more')}</a></div></div></article>`;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('.fav'); if (!b) return;
  const id = b.dataset.id; const had = favs.includes(id);
  favs = had ? favs.filter((x) => x !== id) : [...favs, id]; auth.data.set('favs', favs);
  $$(`.fav[data-id="${id}"]`).forEach((x) => { x.classList.toggle('on', !had); x.textContent = had ? '♡' : '♥'; x.setAttribute('aria-pressed', !had); });
  toast(had ? 'Removed from favourites' : 'Saved to favourites ♥');
  if (typeof onFavChange === 'function') onFavChange();
});

/* ---------- lightbox ---------- */
function openLightbox(images, start) {
  let i = start;
  const lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image preview');
  lb.innerHTML = `<button class="lb-btn close" aria-label="Close">✕</button><button class="lb-btn left" aria-label="Previous">‹</button><img alt=""><button class="lb-btn right" aria-label="Next">›</button><span class="lb-count"></span>`;
  document.body.appendChild(lb);
  const img = $('img', lb);
  const show = () => { img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; img.src = images[i].full; img.alt = images[i].alt; img.onerror = () => fb(img); $('.lb-count', lb).textContent = `${i + 1} / ${images.length}`; };
  const prev = () => { i = (i - 1 + images.length) % images.length; show(); };
  const next = () => { i = (i + 1) % images.length; show(); };
  const close = () => { lb.remove(); document.removeEventListener('keydown', key); };
  const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); };
  document.addEventListener('keydown', key);
  lb.addEventListener('click', close); img.addEventListener('click', (e) => e.stopPropagation());
  $('.close', lb).onclick = (e) => { e.stopPropagation(); close(); };
  $('.left', lb).onclick = (e) => { e.stopPropagation(); prev(); };
  $('.right', lb).onclick = (e) => { e.stopPropagation(); next(); };
  show(); $('.close', lb).focus();
}

/* ---------- chat assistant (predefined replies, no AI API) ---------- */
const CHAT_REPLIES = [
  [/hampi/, 'Hampi is best from October to February. Allow 2 days, rent a bicycle and don’t miss Virupaksha Temple, Vittala Temple and sunset at Matanga Hill.'],
  [/coorg|kodagu/, 'Coorg is ideal from October to March. Try Abbey Falls, Raja’s Seat, Dubare Elephant Camp and a plantation homestay.'],
  [/beach|gokarna|murudeshwar/, 'For beaches, visit Gokarna (Om, Kudle, Half Moon), Murudeshwar and Malpe near Udupi between October and March.'],
  [/waterfall|jog|falls/, 'Jog Falls is spectacular during and just after the monsoon (July–October). Shivanasamudra and Abbey Falls are also great.'],
  [/best time|when/, 'Winter (Oct–Feb) is best for most of Karnataka. Visit waterfalls in the monsoon and hill stations from September to March.'],
  [/budget|cost|cheap/, 'Roughly ₹1,500–2,000/day for budget trips and ₹3,000+/day for comfortable stays. Try our Budget Calculator!'],
  [/wildlife|safari|tiger|bandipur/, 'Bandipur and Dandeli offer safaris. October to May is the best window; book forest-department safaris early.'],
  [/weekend|bengaluru|bangalore/, 'Weekend trips from Bengaluru: Nandi Hills, Shivanasamudra, Mysuru, Coorg and Chikkamagaluru.'],
  [/food|eat/, 'Try Mysore pak, bisi bele bath, neer dosa, jolada rotti, Coorg pandi curry and filter coffee.'],
  [/hello|hi\b|hey/, 'Hello! I can help with destinations, best times, budgets and weekend ideas in Karnataka.']
];
const CHAT_SUGG = ['Best time to visit Hampi?', 'Weekend trips from Bengaluru', 'Best beaches in Karnataka', 'Budget for 3 days in Coorg'];

function initChat() {
  const fab = document.createElement('button'); fab.className = 'chat-fab'; fab.setAttribute('aria-label', 'Open travel assistant'); fab.textContent = '💬';
  document.body.appendChild(fab);
  let box = null, typing = false;
  const add = (from, text) => { const m = document.createElement('div'); m.className = 'bubble ' + from; m.textContent = text; $('.chat-body', box).appendChild(m); scroll(); return m; };
  const scroll = () => { const b = $('.chat-body', box); b.scrollTop = b.scrollHeight; };
  function send(text) {
    const q = text.trim(); if (!q || typing) return;
    add('user', q); $('.chat-in input', box).value = ''; typing = true;
    const tp = document.createElement('div'); tp.className = 'bubble bot typing'; tp.innerHTML = '<i></i><i></i><i></i>'; $('.chat-body', box).appendChild(tp); scroll();
    const hit = CHAT_REPLIES.find(([re]) => re.test(q.toLowerCase()));
    setTimeout(() => { tp.remove(); add('bot', hit ? hit[1] : 'I’m a demo assistant with limited answers. Try asking about Hampi, Coorg, beaches, waterfalls, budget, food or weekend trips!'); typing = false; }, 900);
  }
  fab.addEventListener('click', () => {
    if (box) { box.remove(); box = null; fab.textContent = '💬'; return; }
    box = document.createElement('div'); box.className = 'chat'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', t('assistant'));
    box.innerHTML = `<div class="chat-head">🤖 ${t('assistant')}</div><div class="chat-body"></div>
      <div class="sugg">${CHAT_SUGG.map((s) => `<button type="button">${s}</button>`).join('')}</div>
      <form class="chat-in"><input aria-label="Message" placeholder="${t('ask_ph')}"><button class="btn sm" type="submit" aria-label="${t('send')}">➤</button></form>`;
    document.body.appendChild(box); fab.textContent = '✕';
    add('bot', 'Namaskara! 🙏 I’m your Karnataka Travel Assistant (demo with predefined answers). Ask me anything!');
    $$('.sugg button', box).forEach((b) => b.addEventListener('click', () => send(b.textContent)));
    $('form', box).addEventListener('submit', (e) => { e.preventDefault(); send($('input', box).value); });
    $('input', box).focus();
  });
}

renderLayout();
initChat();
