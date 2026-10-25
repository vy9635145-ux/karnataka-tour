# Karnataka Tour – Full-stack (website + backend)

Aapki HTML website ke saath ek **complete backend**: accounts, favourites, tours, reviews, blog posts, contact form, newsletter aur admin panel.
Backend me **koi npm package nahi** chahiye – sirf Node.js 22.5+ (built-in SQLite use hota hai).

## Chalane ka tarika

```bash
node -v          # 22.5 ya usse naya hona chahiye
npm start        # phir browser me http://localhost:3000 kholo
```

Bas. Database file `data/karnataka.db` pehli baar apne aap ban jati hai. Website aur API ek hi server se chalti hain
(isliye CORS / cookie ki koi dikkat nahi). Ab `index.html` double-click karke kholne ke bajay **hamesha `http://localhost:3000`** se kholo.

Optional settings ke liye `.env.example` ko `.env` naam se copy karke badlo.

```bash
npm test                              # 14 automated API tests
npm run dev                           # auto-restart on file change
npm run make-admin -- aap@email.com   # kisi signed-up user ko admin banao
```

## Admin panel
1. `.env` me `ADMIN_EMAILS=aap@email.com` likho (ya `npm run make-admin -- aap@email.com`).
2. Us email se sign up / login karo, phir `http://localhost:3000/admin.html` kholo.
3. Wahan contact messages, newsletter subscribers aur users dikhte hain. Admin kisi bhi review/post ko delete bhi kar sakta hai.

## Folder structure
```
public/            aapki website (HTML/CSS/JS) – server isi folder ko serve karta hai
  js/api.js        NAYA: API client
  js/auth.js       BADLA: localStorage ki jagah server se baat karta hai (same interface)
  admin.html       NAYA: admin dashboard
server/
  index.js         server start
  app.js           request pipeline (security, rate-limit, JSON, static files)
  db.js            SQLite + migrations
  catalog.js       public/js/data.js se destinations/blogs/foods padhta hai
  lib/             router, passwords (scrypt), sessions, validation, rate-limit, mailer, static
  routes/          auth, me (favourites+tours), reviews, posts, forms, public, admin
test/api.test.js   automated tests
docs/API.md        saare endpoints
docs/FRONTEND.md   purani frontend README
```

## Frontend me kya badla
| Pehle (localStorage demo) | Ab (server) |
|---|---|
| Signup / login / profile / password change | `/api/auth/*`, `/api/me*` – password scrypt se hash, httpOnly cookie session |
| Favourites, confirmed tours | Database me, har user ke liye alag |
| Reviews (sirf aapke browser me) | Database me; **login zaroori**, ek user = ek review per destination (dubara bhejne par edit) |
| Blog posts (browser me) | Database me; **login zaroori**; sirf owner/admin delete kar sakta hai |
| Contact + newsletter (kuch bhejta nahi tha) | Database me save, admin panel me dikhta hai |
| Forgot password (code screen par) | Dev mode me code screen par; production me **email** par (neeche dekho) |

Guest (bina login) favourites browser me rehte hain aur login karte hi account me merge ho jaate hain.
Agar `file://` se kholo to site guest mode me chalti hai (server nahi hai to login/review kaam nahi karega).

## Production me lagane se pehle
1. **HTTPS** lagao (reverse proxy jaise nginx/Caddy ya hosting platform) aur `.env` me `NODE_ENV=production`, `COOKIE_SECURE=true`.
2. Proxy ke peeche ho to `TRUST_PROXY=true` (warna rate-limit sabko ek hi IP samjhega).
3. **Password-reset email**: `RESEND_API_KEY` (resend.com) aur `MAIL_FROM` set karo, aur `RESET_CODE_IN_RESPONSE=false` karo.
   Bina key ke code sirf server console me print hota hai. *(Resend wala hissa yahan live test nahi hua – internet nahi tha; baaki sab test hua hai.)*
4. `data/` folder ko persistent disk par rakho aur uska backup lo (`data/karnataka.db*` copy kar do).
5. Rate-limits memory me hain – ek hi server process ke liye theek hain.

## Dhyan dene wali baatein
- `public/js/data.js` (destinations, blogs, foods) abhi bhi file me hi hai; API (`/api/destinations`...) usi file ko padhti hai, to ek hi jagah edit karna hai.
- Translator (MyMemory) aur chat assistant pehle jaise hi hain – unke liye server-side kuch nahi badla.
- Pages ek baar page-load par synchronous request karte hain (user/favourites/tours/blog list laane ke liye) taaki purana synchronous frontend code bina rewrite ke chale. Chhoti site ke liye theek hai; bade scale par pages ko async me convert karna behtar hoga.
- Account delete karne par uske reviews aur blog posts bhi delete ho jaate hain.
