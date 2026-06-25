@AGENTS.md

# CLAUDE.md — Smart Campus Facility Booking System

> This file is read automatically by Claude Code at the start of every session.
> It tells the AI (and the team) the project facts, structure, rules, and naming so
> nobody — human or AI — has to guess. Keep it updated when something changes.

---

## 1. Project summary

A **Smart Campus Facility Booking System** — a web app where campus users book
facilities (rooms, sports courts, equipment), check in using a QR code, and admins
manage facilities, bookings, and announcements.

There are two kinds of people:

- **user** — books facilities, checks in via QR, manages their own bookings/favourites.
- **admin** — manages facilities, can cancel bookings, sends notifications, views reports.

This is a **5-member group project**. Each member owns a separate module (see section 7).
The system must run **live 24/7** (deployed on Vercel).

---

## 2. Tech stack (exact — do not substitute)

| Part        | Choice                                                 | Notes                                                                |
| ----------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| Framework   | **Next.js** (App Router, React JSX, **no TypeScript**) | Frontend + backend in one project                                    |
| Backend     | **Next.js API Routes** (Node.js runtime)               | No separate Express server                                           |
| Styling     | **Tailwind CSS** (tentative — team may revisit)        | Plain CSS allowed only if team agrees later                          |
| Database    | **MySQL on TiDB Cloud**                                | Cloud-hosted, MySQL-compatible                                       |
| DB driver   | **mysql2**                                             | Use the shared connection helper in `lib/`                           |
| Charts      | **recharts**                                           | For the admin dashboard                                              |
| Icons       | **lucide-react**                                       |                                                                      |
| QR generate | **qrcode**                                             | Makes a unique QR per booking, shown on the user dashboard           |
| QR scan     | **html5-qrcode**                                       | Used on the admin "Scan QR" page; opens the camera (needs HTTPS — Vercel provides it) |
| Deployment  | **Vercel**                                             | Auto-deploys the `main` branch                                       |

**Why Node.js and not PHP:** the goal is a live 24/7 site on Vercel, which supports
Node but not PHP. Node also lets the whole system use one language (JavaScript),
front to back, in a single project.

---

## 3. How the system fits together (the flow)

```
React pages (browser)  →  Next.js API routes (server)  →  TiDB MySQL database
```

- React pages NEVER talk to the database directly (browsers can't, and it's unsafe).
- A page calls an API route using `fetch`.
- The API route runs on the server, uses the shared DB helper, and returns JSON.
- Database credentials live ONLY on the server side, in `.env.local` — never in browser code.

---

## 4. Folder structure (where things go)

```
/app
  /api               ← backend API routes (one folder per module)
  /(pages)           ← the React pages, grouped by module
  layout.jsx         ← shared layout wrapper (Next.js entry point)
  page.jsx           ← landing page at "/"
/components          ← shared reusable UI (e.g. the navigation menu)
/lib
  db.js              ← shared TiDB connection helper (use this everywhere)
/sql
  schema.sql         ← the agreed database table definitions
/public
  /images            ← facility photos (referenced by facility_image_url)
.env.local           ← secret DB credentials (NEVER committed to GitHub)
CLAUDE.md            ← this file
SETUP.md             ← how to run the project locally
GIT-GUIDE.md         ← beginner Git/GitHub guide
```

**Rule:** a feature = its page + its API route + the database table(s) it uses.
Build the whole chain, not just the page.

---

## 5. Database tables (the source of truth)

Five tables. Column names use `snake_case` and are **prefixed with their table name**.
**Foreign keys keep the name of the table they point to** (e.g. `user_id`, `facility_id`),
so it's always clear what they link to.

### users

| Column          | Type     | Size | Key | Null                                          |
| --------------- | -------- | ---- | --- | --------------------------------------------- |
| user_id         | INT      | —    | PK  | NOT NULL                                      |
| user_name       | VARCHAR  | 100  |     | NOT NULL                                      |
| user_email      | VARCHAR  | 150  |     | NOT NULL (unique)                             |
| user_password   | VARCHAR  | 255  |     | NOT NULL (store **hashed**, never plain text) |
| user_role       | VARCHAR  | 10   |     | NOT NULL (`user` or `admin`)                  |
| user_created_at | DATETIME | —    |     | NOT NULL                                      |

### facilities

| Column               | Type    | Size | Key | Null                                               |
| -------------------- | ------- | ---- | --- | -------------------------------------------------- |
| facility_id          | INT     | —    | PK  | NOT NULL                                           |
| facility_name        | VARCHAR | 100  |     | NOT NULL                                           |
| facility_capacity    | INT     | —    |     | NOT NULL (used for the group-size rule)            |
| facility_type        | VARCHAR | 50   |     | NULL (e.g. room, court, equipment — for filtering) |
| facility_description | TEXT    | —    |     | NULL                                               |
| facility_image_url   | VARCHAR | 255  |     | NULL (a link/path, NOT the image file itself)      |
| facility_status      | VARCHAR | 10   |     | NOT NULL (`open` or `closed`)                      |

### bookings

| Column                | Type     | Size | Key             | Null                                                         |
| --------------------- | -------- | ---- | --------------- | ------------------------------------------------------------ |
| booking_id            | INT      | —    | PK              | NOT NULL                                                     |
| user_id               | INT      | —    | FK → users      | NOT NULL                                                     |
| facility_id           | INT      | —    | FK → facilities | NOT NULL                                                     |
| booking_date          | DATE     | —    |                 | NOT NULL                                                     |
| booking_time_slot     | VARCHAR  | 20   |                 | NOT NULL (e.g. `"10:00-11:00"`)                              |
| booking_group_size    | INT      | —    |                 | NOT NULL                                                     |
| booking_status        | VARCHAR  | 15   |                 | NOT NULL (`booked` / `checked-in` / `no-show` / `cancelled`) |
| booking_cancel_reason | VARCHAR  | 255  |                 | **NULL** (only set when cancelled)                           |
| booking_created_at    | DATETIME | —    |                 | NOT NULL                                                     |
| checked_in_at         | DATETIME | —    |                 | NULL (set when admin scans the booking in)                  |
| no_show_marked_at     | DATETIME | —    |                 | NULL (set when marked as no-show)                            |
| checkin_token         | VARCHAR  | 255  |                 | NULL (unique token encoded in the booking's QR code)         |

### favourites

| Column       | Type | Size | Key             | Null     |
| ------------ | ---- | ---- | --------------- | -------- |
| favourite_id | INT  | —    | PK              | NOT NULL |
| user_id      | INT  | —    | FK → users      | NOT NULL |
| facility_id  | INT  | —    | FK → facilities | NOT NULL |

### notifications

| Column                  | Type     | Size | Key        | Null                                                              |
| ----------------------- | -------- | ---- | ---------- | ----------------------------------------------------------------- |
| notification_id         | INT      | —    | PK         | NOT NULL                                                          |
| user_id                 | INT      | —    | FK → users | **NULL** (NULL = sent to ALL users; a value = that specific user) |
| notification_message    | VARCHAR  | 255  |            | NOT NULL                                                          |
| notification_created_at | DATETIME | —    |            | NOT NULL                                                          |

**Fixed values everyone must use exactly:**

- `user_role`: `user`, `admin`
- `facility_status`: `open`, `closed`
- `booking_status`: `booked`, `checked-in`, `no-show`, `cancelled`

---

## 6. Coding conventions (rules that keep our code compatible)

- **React never queries the database directly** — always go through an API route.
- **Always use the shared DB helper** in `lib/db.js`. Don't create new connections.
- **Never hard-code secrets.** All DB credentials come from `.env.local`.
- **Use the shared navigation component** from `/components` — don't build your own menu.
- **Database columns are `snake_case`, prefixed by table.** Foreign keys keep the
  referenced table's name (`user_id`, `facility_id`).
- **JSX is just HTML** with `class` changed to `className`. Write your HTML inside `.jsx` files.
- **API response format (standard):** every API route returns JSON in this shape —
  - success: `{ "success": true, "data": ... }`
  - failure: `{ "success": false, "error": "message" }`

  So every page reads responses the same way. (Team may change this, but keep it consistent.)

- **Always wrap database calls in try/catch** and return the failure shape above on error.

---

## 7. Module ownership (who builds what)

Member 1 : Auth + Profile + Setup （Ng Khai Xiang）
Pages:
Landing page (/)
Login
Register
User Profile
Admin Profile
Manage Profile (edit details)
User Navbar
Admin Navbar
404 Page
403 Page
Also: project scaffolding, shared menu, database setup, Vercel deployment, integration.

Member 2: Facilities, Favourites + User Dashboard (Ng Thong Zhe)
Pages:
User Dashboard (landing after login — upcoming bookings + quick links)
Facility List (with search + filter)
Facility Details
Favourites (add/remove)

Member 3: Booking (this is the hardest module — they choose who takes it) (Koay Kit Jin)
Pages:
Make Booking (with double-booking check + capacity check)
View & Cancel Booking (user views their bookings, cancels own)

Member 4: QR Check-In + Notifications (Pang Ming Shen)
Pages:
QR Check-In (scan + 15-minute / no-show logic)
User Notifications (view notifications)
Admin Send Notification (send to one user or all)

Member 5: Admin Management (Tan Chang Min)
Pages:
Admin Dashboard (stats + charts)
Manage Facilities (add / edit / close / remove)
Manage Bookings (admin emergency-cancel with reason + notify user)
No-Show Report (users with too many no-shows)

---

## 8. Key feature logic (so it's defined once)

- **Time slots:** fixed hourly slots (e.g. `08:00-09:00` … `17:00-18:00`), stored as
  text in `booking_time_slot`. One booking = one slot.
- **Double-booking prevention:** before saving, check if a booking already exists for
  the same `facility_id` + `booking_date` + `booking_time_slot` that is NOT cancelled.
  If yes, block it.
- **Group-size rule:** `booking_group_size` must not exceed `facility_capacity`.
- **QR check-in:** each `booked` booking gets its own QR code (generated via
  `GET /api/bookings/qr`), encoding a unique `checkin_token` saved on the booking row.
  The **student** shows this QR from their dashboard; an **admin** scans it from
  `/admin/qr-scan`, which calls `POST /api/checkin/verify`. That endpoint requires
  `user_role = 'admin'` (403 otherwise), looks up the booking by `checkin_token`
  (not by who is scanning), and if scanned within 15 minutes of the slot start sets
  `booking_status = checked-in`.
- **No-show rule:** if `/api/checkin/verify` is called more than 15 minutes after the
  slot start on a still-`booked` booking, it's marked `no-show` instead (checked on
  demand at scan time — there's no background job).
- **Notifications:** `user_id` set = message to one user (e.g. "your booking was
  cancelled"); `user_id` NULL = broadcast to everyone (e.g. "Court A closed for repairs").

---

## 9. Guardrails (what NOT to do)

- **Never commit `.env.local`** to GitHub (it holds the database password).
- **Never change the database schema alone.** Tell the team, update `/sql/schema.sql`
  and this file, so everyone's code stays in sync.
- **Never write feature/business logic in shared files** (layout, navigation, DB helper).
- **Each person owns their own module** — don't edit a teammate's pages without telling them.

---

## 10. Common commands

```bash
npm run dev      # start the local dev server (http://localhost:3000)
npm install      # install all packages (run after cloning)
npm run build    # build for production (Vercel does this automatically)
```

---

## 11. Quick glossary (for teammates new to this stack)

- **Page** — a screen the user sees (a `.jsx` file under `/app`).
- **Component** — a reusable piece of UI (e.g. the menu) under `/components`.
- **API route** — backend code under `/app/api` that talks to the database and returns data.
- **`.env.local`** — a private file holding secret values (like the DB password). Never shared on GitHub.
- **JSX** — HTML written inside JavaScript; same as HTML but `class` becomes `className`.
- **TiDB** — our cloud MySQL database (works the same as normal MySQL).

---

## 12. Tips for prompting Claude Code (for the team)

- Say **which module/page** you're working on and **which table** it uses.
- Ask Claude Code to **explain its code** after writing it — you must understand it for the demo.
- Mention the conventions above (API format, table names) so its code fits the project.
- Build and test one feature at a time; use fake/test data if real data doesn't exist yet.
