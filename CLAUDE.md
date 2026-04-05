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
- **Env config**: dotenv
- **Dev**: nodemon
- **Language**: JavaScript (no TypeScript)

## Architecture

MVC-style layout:

```
controllers/       Route handlers (auth, display, data)
middleware/         Session config, DB connection, auth guard, rate limiting
models/            Database models
routes/            Express router
html/              Static HTML pages (index, admin, error pages)
public/            Static assets (css/, js/, images/)
src/               (empty, unused)
```

Entry point: `app.js` -- wires middleware in order: session, static files, body parsers, then routes.

## Environment Variables

Required in `.env`:

| Variable         | Purpose                             |
| ---------------- | ----------------------------------- |
| `PORT`           | Express server port                 |
| `SESSION_SECRET` | Session signing secret              |
| `NODE_ENV`       | "production" enables secure cookies |
| `MONGO_URI`      | MongoDB connection string           |
| `DB_NAME`        | MongoDB database name               |
| `ADMIN_PW`       | Admin password for simple auth      |

## Conventions

- ES modules (`import`/`export`) -- no CommonJS
- Kebab-case file naming (`auth-controller.js`, `db-config.js`)
- Controller pattern: each controller exports handler functions
- Dedicated HTML error pages per status code (401, 404, 500)
- Environment-based configuration via dotenv
- In-memory IP-based rate limiting on auth (10 attempts / 15 min)

## Known Issues and Stubs

- **Auth route not connected**: `auth-controller.js` and `requireAuth` middleware exist but are not wired into `router.js`

## Mobile-First Design

The app is designed mobile-first. `media-styles.css` handles responsive breakpoints. Frontend JS includes a `responsive.js` module. All UI work should follow a mobile-first approach.
