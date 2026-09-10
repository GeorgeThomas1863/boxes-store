# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

Important: You are the orchestrator. subagents execute. you should NOT build, verify, or code inline (if possible). your job is to plan, prioritize & coordinate the acitons of your subagents

Keep your replies extremely concise and focus on providing necessary information.

When building or implementing a new feature use the code found in the .EXAMPLE-CODE/ directory to understand how the user prefers to build / design. Note the patterns shown in the .EXAMPLE-CODE/ folder and try to emulate them in your solution. The .EXAMPLE-CODE directory I'm talking about is in the root directory of this project.

Put all pictures / screenshots you take with the mcp plugin in the "pics" subfolder, under the .claude folder in THIS project.

# User preferences

**Playwright usage**: Do NOT use Playwright for small CSS changes (a few property tweaks, minor adjustments). Reserve Playwright only for large UI changes where visual verification is worth the time and token cost. The user verifies small CSS changes themselves.

**GitHub Rules**
Do NOT commit anything to GitHub. The user will control all commits to GitHub. Do NOT edit or in any way change the user's Git history or interact with GitHub.

**Continuously LEARN and improve**
If you make a mistake or the user points out something is wrong or corrects you, please make note of it here, so you can avoid that mistake in the future.

# boxes-store

This is a mobile-first ecommerce store.

## Tech Stack

- **Runtime**: Node.js (ES modules throughout)
- **Framework**: Express.js v5
- **Database**: MongoDB (v7 driver); custom config
- **Session**: express-session (24h sessions, httpOnly cookies)
- **Payments**: Stripe (v22)
- **File uploads**: multer (v2)
- **Env config**: dotenv
- **Dev**: nodemon
- **Testing**: vitest + jsdom
- **Language**: JavaScript (no TypeScript)

## Architecture

MVC-style layout:

```
controllers/       Route handlers (auth, display, admin, data)
middleware/        Session, DB, auth guard, rate limiting, stripe config, upload error handling
models/            Database models
routes/            Express router
src/               Business logic modules (cart, orders, payments, products, mailer, sanitize, upload-back, customer, contact)
html/              Static HTML pages (index, admin, error pages, about, cart, contact, checkout, confirm)
public/            Static assets (css/, js/, images/)
tests/             vitest unit tests (backend + frontend)
```

Entry point: `app.js` -- wires middleware in order: session, static files, body parsers, then routes.

## Environment Variables

Loaded by `middleware/env-config.js` via dotenv from `[".env.test", ".env"]` (cwd-relative). If `.env.test` exists on disk it overrides `.env` for local runs (first file wins).

| Variable                 | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `PORT`                   | Express server port (also interpolated by docker compose)   |
| `HOST`                   | Optional bind address (default `127.0.0.1`; compose sets `0.0.0.0`) |
| `NODE_ENV`               | "production" enables secure cookies                         |
| `SESSION_SECRET`         | Session signing secret                                      |
| `MONGO_URI`              | MongoDB connection string (compose overrides to `mongodb://mongo:27017`) |
| `DB_NAME`                | MongoDB database name                                       |
| `ADMIN_PW`               | Admin password for simple auth                              |
| `STRIPE_SECRET_KEY`      | Stripe server-side key                                      |
| `STRIPE_PUBLISHABLE_KEY` | Stripe browser key                                          |
| `UPLOAD_SIZE_LIMIT_MB`   | Optional upload size limit (default 10)                     |
| `PRODUCTS_COLLECTION`    | Mongo collection name for products                          |
| `ORDERS_COLLECTION`      | Mongo collection name for orders                            |
| `CUSTOMERS_COLLECTION`   | Mongo collection name for customers                         |
| `CONTACTS_COLLECTION`    | Mongo collection name for contact submissions               |
| `RESEND_API_KEY`         | Resend email API key                                        |
| `EMAIL_USER`             | Sender email address                                        |
| `EMAIL_FROM_NAME`        | Sender display name                                         |
| `EMAIL_RECIPIENT_1`      | Notification recipient                                      |
| `EMAIL_RECIPIENT_2`      | Notification recipient                                      |
| `SHIP_STATION_BASE_URL`  | ShipStation API base URL                                    |
| `SHIP_STATION_API_KEY`   | ShipStation API key                                         |
| `SHIPPING_ZIP`           | Origin ZIP for shipping rates                               |

## Docker

```
docker compose up -d --build     # build image and start app + mongo
docker compose logs -f app       # tail app logs
docker compose down              # stop containers (data is kept)
```

**Never run `docker compose down -v`** - it deletes the named volumes (uploaded images and the database).

| Volume             | Mounted at                    | Holds                     |
| ------------------ | ----------------------------- | ------------------------- |
| `uploads-products` | `/app/public/images/products` | Admin-uploaded product images |
| `mongo-data`       | `/data/db`                    | MongoDB data              |

Notes:
- Compose reads `.env` (required) and `.env.local` (optional). `.env*` files are excluded from the image by `.dockerignore`, so inside the container dotenv finds nothing and compose's `env_file` supplies the vars.
- Compose forces `HOST=0.0.0.0` and `MONGO_URI=mongodb://mongo:27017`, overriding whatever `.env` says.
- `PORT` must be set in `.env` because compose interpolates it for the port mapping (`127.0.0.1:${PORT}:${PORT}`).
- `public/images/products/.gitkeep` keeps the directory in the image owned by `node` so Docker seeds the volume with correct ownership.

## Conventions

- ES modules (`import`/`export`) -- no CommonJS
- Kebab-case file naming (`auth-controller.js`, `db-config.js`)
- Controller pattern: each controller exports handler functions
- Dedicated HTML error pages per status code (401, 404, 500)
- Environment-based configuration via dotenv
- In-memory IP-based rate limiting on auth (10 attempts / 15 min)

## Known Issues and Stubs

None currently tracked.

## Mobile-First Design

The app is designed mobile-first. `media-styles.css` handles responsive breakpoints. Frontend JS includes a `responsive.js` module. All UI work should follow a mobile-first approach.

## Potential Future Features

### Product Image Aspect Ratio Display (NOT YET IMPLEMENTED)

The `.EXAMPLE-CODE` directory has a display-side solution for handling varied product image aspect ratios. If product images look bad due to mismatched proportions, implement this pattern:

**How it works:**
- `rotate-pics.js` exports `needsContain(img, element)` — compares `img.naturalWidth/naturalHeight` against the container's dimensions
- If ratio mismatch exceeds **1.25 (25%)**, adds CSS class `contain-mode` (or `bg-contain-mode` for background images)
- CSS toggles `object-fit` from `cover` (crop to fill) → `contain` (show whole image)
- Applied via `{ once: true }` load listener on the `<img>` element; uses `preloadImage(url)` Promise for background images

**Key files in `.EXAMPLE-CODE` to reference:**
- `public/js/helpers/rotate-pics.js` — `needsContain()`, `preloadImage()`, `setCurrentPic()`
- `public/js/helpers/products-run.js` — where `contain-mode` is applied to product detail modal image on load
- `public/css/products-styles.css` — `.product-detail-image` and `.product-detail-image.contain-mode` rules

**Why this matters (recurring evidence):** A code review (April 2026) caught that `.carousel-slide` was changed from `object-fit: contain` to `object-fit: cover`, which crops product photos. The `.EXAMPLE-CODE` confirms `contain` is the correct default for carousel slides. A static `contain` prevents cropping but letterboxes well-fitted images. The `needsContain` dynamic approach solves both problems. Until implemented, carousel slides must use `object-fit: contain` — do NOT change this to `cover`.
