# API reference

Base URL = same server (`/api/...`). All bodies are JSON (`Content-Type: application/json`). Responses always contain `ok: true|false`;
errors look like `{ "ok": false, "error": "message" }` with a proper HTTP status (400, 401, 403, 404, 409, 413, 415, 429).
Login is a cookie (`kt_sid`, httpOnly, SameSite=Lax). Cross-origin write requests are rejected (Origin check).

| Method & path | Auth | Body → Response |
|---|---|---|
| `GET /api/health` | – | `{ok,time}` |
| `GET /api/bootstrap` | – | `{user\|null, favs[], tours[]}` – used by every page at load |
| **Accounts** | | |
| `POST /api/auth/signup` | – | `{name,email,phone?,password}` → 201 `{user}` + cookie |
| `POST /api/auth/login` | – | `{email,password,remember?}` → `{user}` (5 wrong tries ⇒ 60 s lock, 429) |
| `POST /api/auth/logout` | – | `{ok}` |
| `POST /api/auth/forgot` | – | `{email}` → `{ok}` (dev mode also `exists`, `code`) |
| `POST /api/auth/reset` | – | `{email,code,password}` → `{ok}` (code valid 10 min, 5 tries, logs out all devices) |
| `GET /api/me` · `PATCH /api/me` | user | `{name,phone}` → `{user}` |
| `POST /api/me/password` | user | `{oldPassword,newPassword}` (other devices logged out) |
| `DELETE /api/me` | user | deletes account + all its data |
| **Favourites & tours** | | |
| `GET/PUT /api/me/favourites` | user | PUT `{ids:["hampi",…]}` → `{favs}` |
| `GET /api/me/tours` | user | `{tours[]}` |
| `POST /api/me/tours` | user | tour object (same shape the planner/budget pages create) → 201 `{tour}` |
| `DELETE /api/me/tours/:id` | user | `{ok}` |
| **Reviews** | | |
| `GET /api/destinations/:id/reviews` | – | `{reviews[],count,average}` (`mine:true` on your own) |
| `POST /api/destinations/:id/reviews` | user | `{rating 1-5,text,name?}` → 201 new / 200 edited |
| `DELETE /api/reviews/:id` | owner/admin | |
| **Blog** | | |
| `GET /api/posts` | – | community posts `{posts[]}` |
| `POST /api/posts` | user | `{title,author?,category,img?,body}` → 201 `{post}` |
| `DELETE /api/posts/:slug` | owner/admin | |
| `GET /api/blogs` · `GET /api/blogs/:slug` | – | built-in + community articles |
| **Catalog (from public/js/data.js)** | | |
| `GET /api/destinations?cat=&q=` · `GET /api/destinations/:id` | – | destinations (+ shopping + review summary) |
| `GET /api/foods?cat=` | – | foods |
| **Forms** | | |
| `POST /api/contact` | – | `{name,email,message}` (5/hour per IP) |
| `POST /api/newsletter` | – | `{email}` |
| **Admin** (`ADMIN_EMAILS`) | admin | `GET /api/admin/stats`, `GET /api/admin/messages`, `PATCH/DELETE /api/admin/messages/:id`, `GET /api/admin/subscribers`, `GET /api/admin/users` |

## Security summary
scrypt password hashing · random 256-bit session tokens (only their SHA-256 is stored) · httpOnly + SameSite cookies (Secure in production) ·
Origin check + JSON-only bodies against CSRF · per-IP rate limits and login lockout · 100 KB body limit · whitelisted/clamped tour data ·
parameterised SQL everywhere · static server blocks path traversal and dotfiles · constant-time comparisons for codes.
