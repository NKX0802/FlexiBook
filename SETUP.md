# Project Setup Guide

Welcome to the Smart Campus Facility Booking System! This guide will get you running the project on your own computer in a few minutes.

---

## Step 1 — Clone the Repository

Open a terminal (PowerShell or Command Prompt) and run:

```bash
git clone https://github.com/YOUR-TEAM/smart-campus-facility-booking-system.git
cd smart-campus-facility-booking-system
```

Replace `YOUR-TEAM` with your actual GitHub username or organization.

---

## Step 2 — Install Dependencies

```bash
npm install
```

This downloads all the packages the project needs (Next.js, Tailwind, mysql2, etc.).

---

## Step 3 — Set Up Your Database Credentials

The project connects to a TiDB Cloud MySQL database. Your credentials are never stored in the code — they live in a file called `.env.local` that each teammate creates on their own machine.

**Create the file:**

In the project root folder, create a file called `.env.local` and paste this into it:

```
DB_HOST=your-tidb-host.tidbcloud.com
DB_PORT=4000
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name
AUTH_SECRET=replace_with_a_long_random_string
```

**Where to get TiDB values:**
1. Go to https://tidbcloud.com and sign in
2. Click your cluster name
3. Click the "Connect" button (top right)
4. Choose connection type: "General"
5. Copy Host, Username, Password, and Database Name from there

**Important:** `.env.local` is in `.gitignore` — it will NEVER be pushed to GitHub. Do not share your password in chat or email.

---

## Step 4 — Run the Development Server

```bash
npm run dev
```

Open your browser and go to: http://localhost:3000

You should see the landing page. Any file you save will automatically refresh the browser.

---

## Folder Structure Overview

```
smart-campus-facility-booking-system/
│
├── pages/                        ← Every file here = one URL route (Pages Router)
│   ├── _app.js                   ← Wraps every page: imports CSS + Navbar
│   ├── index.js                  → /              (landing page)
│   ├── login.js                  → /login
│   ├── register.js               → /register
│   ├── profile.js                → /profile       (student)
│   ├── favourites.js             → /favourites
│   ├── book.js                   → /book
│   ├── bookings.js               → /bookings      (history)
│   ├── notifications.js          → /notifications
│   │
│   ├── rooms/
│   │   ├── index.js              → /rooms         (room list)
│   │   └── [id].js              → /rooms/123     (room detail)
│   │
│   ├── admin/                    ← All admin pages live here
│   │   ├── dashboard.js          → /admin/dashboard
│   │   ├── rooms.js              → /admin/rooms
│   │   ├── bookings.js           → /admin/bookings
│   │   ├── noshows.js            → /admin/noshows
│   │   ├── notifications.js      → /admin/notifications
│   │   └── profile.js            → /admin/profile
│   │
│   └── api/                      ← Backend endpoints (not visible pages)
│       ├── login.js              → POST /api/login
│       ├── register.js           → POST /api/register
│       ├── profile.js            → GET/PUT /api/profile
│       ├── favourites.js         → GET/POST/DELETE /api/favourites
│       ├── book.js               → POST /api/book
│       ├── bookings.js           → GET/DELETE /api/bookings
│       ├── checkin.js            → POST /api/checkin
│       ├── notifications.js      → GET/PATCH /api/notifications
│       ├── rooms/
│       │   ├── index.js          → GET /api/rooms
│       │   └── [id].js          → GET /api/rooms/[id]
│       └── admin/
│           ├── rooms.js          → GET/POST/PUT/DELETE /api/admin/rooms
│           ├── bookings.js       → GET/PATCH /api/admin/bookings
│           ├── noshows.js        → GET /api/admin/noshows
│           └── notifications.js  → GET/POST /api/admin/notifications
│
├── components/
│   └── Navbar.js                 ← Shared navigation bar (used in _app.js)
│
├── lib/
│   └── db.js                     ← Database connection — import this in every API file
│
├── styles/
│   └── globals.css               ← Global CSS + Tailwind setup
│
├── sql/
│   └── README.md                 ← Notes on what database tables to create
│
├── public/                       ← Static files (images, icons)
├── .env.local                    ← YOUR private credentials (never pushed to GitHub!)
├── SETUP.md                      ← This file
└── GIT-GUIDE.md                  ← Beginner Git guide for the team
```

---

## How Pages Router Works (important to understand)

In this project we use Next.js **Pages Router**. The rule is simple:

> **The filename = the URL**

| File | URL in browser |
|---|---|
| `pages/index.js` | `/` |
| `pages/login.js` | `/login` |
| `pages/rooms/index.js` | `/rooms` |
| `pages/rooms/[id].js` | `/rooms/123` (any ID) |
| `pages/admin/dashboard.js` | `/admin/dashboard` |
| `pages/api/login.js` | `/api/login` (backend only) |

Every page file must export a default function that returns JSX (your page content).
Every API file must export a default `handler(req, res)` function.

---

## A Note on JSX

All files end in `.js` but you write JSX (HTML-like syntax) inside them. Two differences from regular HTML:

- Write `className` instead of `class`
  Example: `<div className="container">` not `<div class="container">`
- Self-closing tags need a slash: `<img />` not `<img>`

```js
// Example page file
export default function LoginPage() {
  return (
    <div className="container">
      <h1>Login</h1>
      <input type="email" placeholder="Email" />
    </div>
  )
}
```

---

## Packages Installed

| Package | What it's for |
|---|---|
| `next`, `react`, `react-dom` | The framework itself |
| `tailwindcss` | CSS styling |
| `mysql2` | Connect to TiDB database |
| `bcryptjs` | Hash passwords securely |
| `jose` | Create and verify JWT login tokens |
| `lucide-react` | Icons (import and use as components) |
| `recharts` | Charts for the admin dashboard |
| `qrcode` | Generate QR codes for bookings |
| `html5-qrcode` | Scan QR codes via phone camera |

---

## Common Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Build the project for production |
| `npm run lint` | Check your code for common errors |

---

If you get stuck, check `GIT-GUIDE.md` for how to use Git, or ask a teammate!
