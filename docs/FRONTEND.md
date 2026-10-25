# Karnataka Tour – Plain HTML/CSS/JavaScript

No Node.js, npm, React or Vite needed.

## Run
**Easiest:** double-click `index.html`.
**Better (optional local server):** in this folder run `python -m http.server 8000` and open http://localhost:8000

## Files
- `index.html, explore.html (tabs: Destinations / Trip Planner / Budget Calculator), destination.html?id=hampi, blog.html (list + write-your-own form; an article opens in the same file via blog.html?slug=…), about.html, 404.html (Contact form lives on the home page: index.html#contact)`
- `css/style.css` – all styling (light/dark themes via CSS variables at the top)
- `js/data.js` – destinations, blogs, translations (edit here to add content)
- `js/app.js` – navbar, footer, theme, language, toasts, favourites, lightbox, chat assistant
- `js/maps.js` – map helper: Leaflet map (street / OpenStreetMap / satellite), road route from the user's location (OSRM) or from a typed place
- `js/auth.js` – sign up / login / logout / profile / password reset (demo, localStorage)
- `js/translator.js` + `css/translator.css` – home page Language Translator with Voice (same code as `language-translator/`)
- `language-translator/` – the translator as a stand-alone website (`index.html`, `style.css`, `script.js`, `README.md`)
- `signup.html, login.html, profile.html` – account pages (profile.html is the user dashboard)

## Notes
- Frontend only: no backend, database or API keys. Theme, language, favourites and demo reviews use `localStorage`.
- Prices, ratings, reviews and weather are sample data. The chat assistant uses predefined answers.
- Images use `loremflickr.com` placeholder photos and the map uses OpenStreetMap, so internet is needed. Replace `photo()` in `js/app.js` with your own images for production.
- Changing the language reloads the page (the choice is remembered).

- Trip Planner and Budget Calculator live only inside the Explore page tabs (not in the main navbar). Direct links: `explore.html?tab=planner` and `explore.html?tab=budget`.
- Blog posts written by visitors are stored in `localStorage` (key `kt_user_posts`) and can be deleted from the blog list.

## New in this version
- **Karnataka theme**: kumkum-red + arishina-yellow palette (Karnataka flag colours), Hoysala star-pattern background, temple/palace skyline in the hero, Kannada font (Noto Sans Kannada).
- **Home page**: removed Historical Places, Hill Stations & Waterfalls, Beaches & Wildlife, Featured Travel Experiences and Karnataka Travel Guides. Added **About Karnataka** (History → Geography → Language → Culture & Food) and a **Language Translator**.
- **Translator**: uses the free MyMemory API (no key, daily quota, internet needed). It detects the script of each line, keeps line breaks and bullets, and has copy, listen and voice input. For romanised text (e.g. Hinglish) pick the source language manually. Replace `mm()` in `js/translator.js` with your own backend/LLM call for higher quality, tone modes and pronunciation.
- **Accounts**: sign up (password strength meter, duplicate check), login with remember-me and a 5-attempt lockout, forgot-password with an on-screen demo code, profile page (edit details, change password, saved places, log out, delete account). Passwords are salted + hashed (PBKDF2) but everything is stored in the browser's localStorage – this is a **demo**. For a real site you need a server, database, HTTPS and email verification.

## Update 2
- About Karnataka removed from the home page; Contact form is now a section inside `index.html` (no `contact.html`); blog list and article share one file (`blog.html`, no `blog-details.html`).
- Budget Calculator has **Confirm Tour**: saves the tour to the dashboard → Tours (login required).
- Dashboard tabs: Tours, Favourite places (hearted destinations), Details, Security, Account.

## Update 3
- **Translator history removed** everywhere (home page and dashboard).
- **Language Translator rebuilt**: two cards (original / translated), 26 languages, microphone + speaker in both cards, Translate button, auto-speak switch, swap, clear, character counter, loading spinner and error messages. Details: `language-translator/README.md`.
- **Recommended Weekend Trips removed.** A new **Must-Visit Places in Karnataka** section sits above Popular Destinations: 7 places are shown and **View all** reveals every destination (**Show less** folds it back). Change the 7 places in the `MUST` list in `index.html`.

## Update 4
- **Must-Visit Places section removed** from the home page.
- **Dashboard → Tours**: each confirmed tour now shows everything (destination, people, days, travel, hotel, food/activity/shopping amounts, cost breakdown, budget check, your day-wise plan, best time, food and shopping tips) plus a **map with the route from your location to the destination** (distance and driving time). If location is blocked, type your starting place. “Open in Google Maps” gives turn-by-turn directions.
- **Better maps**: sharp retina street map with OpenStreetMap and satellite options, scale bar and zoom. The destination page uses the same map and route.
- **About page** now has a full **History of Karnataka** timeline (Kadambas, Chalukyas, Hoysalas, Vijayanagara, Wadiyars, unification in 1956 and more).
- **Trip Planner rebuilt**: you plan the trip yourself (people, days, travel, hotel, budget, food, shopping and your own activity for each day). Recommendations are shown beside it: ideal days, rooms and vehicle for the group size, budget level, suggested budget split (with one-click apply), food and shopping ideas and tips. **Confirm Tour** saves it to your dashboard (log in first; your plan is kept while you log in). The Budget Calculator now also asks for a destination so its tours get a map.
- Maps and routes need internet, and location needs `http://localhost` (Live Server) or https. Opening the files by double-click works, but the browser may block the location.

## Update 5
- **Famous Food of Karnataka** section on the home page (12 dishes with category filters, veg/non-veg mark, where to try them and a link to the destination).
- **Map API key (optional)**: open `js/config.js` and paste a free Geoapify key (https://www.geoapify.com). With a key the map tiles, the road route and the place search all use the Geoapify API, which is much more reliable. Without a key the free public servers are used.

## Update 6 – images folder
All pictures now come from the local `images/` folder (no more random online photos): `images/places`, `images/gallery`, `images/food`, `images/blog`, `images/backgrounds`. The current files are placeholder pictures named after each place/food. Replace any file with your own photo of the **same name** to use it. Full list of names: `images/README.txt`.
