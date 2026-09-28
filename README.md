# Matcha Avenue Cafe - Online Ordering System

An artisan matcha, coffee and bakery ordering web app built with **React 19**, **TypeScript**, **Tailwind CSS 4** and an **Express REST API**. It ships a customer storefront, an embedded admin console, a Leaflet/Google delivery pin picker, live order tracking, loyalty & promotions management, Meta (Facebook Messenger) AI ordering, and SQL export for MySQL / Supabase.

- **Customer storefront** -> `/`
- **Admin console** -> `/admin`

---

## Features

| Area | Highlights |
| :--- | :--- |
| Ordering | Menu by category, live search, cart drawer, delivery / pickup / dine-in, kitchen notes, quick-pick delivery hubs |
| Maps | Interactive Leaflet map with Google raster tiles (streets / satellite / OSM), draggable pin, GPS "use my location", place search with autocomplete, dashed route to the flagship store |
| Payments | GCash / Maya e-wallet validation (11-digit PH mobile + reference number), cash and card |
| Tracking | Real-time order status, tracker modal, cancellation and receipt confirmation |
| Admin | Dashboard analytics, order pipeline, product & category editor, promotions/discounts, store customizer, customer management, QR code stand, reporting snapshots |
| Integrations | Google Sheets sync, Supabase schema/SQL export, MySQL dump, Meta Messenger AI webhook, Gemini AI ordering assistant |

---

## Quick Start (local)

### Prerequisites
1. **Node.js 18+** (Node 20 LTS recommended) - https://nodejs.org/
2. **VS Code** (optional) - https://code.visualstudio.com/
3. **MySQL / XAMPP** (optional) - only needed if you want to import the generated SQL

### Steps

```bash
# 1. From the project root
npm install

# 2. Start the unified Express + Vite dev server
npm run dev
```

Expected output:

```text
Matcha Avenue Cafe server running on http://0.0.0.0:3000
  Customer view : http://localhost:3000/
  Admin console : http://localhost:3000/admin
  Health check  : http://localhost:3000/api/health
```

Open **http://localhost:3000** for the storefront and **http://localhost:3000/admin** for the admin console.

> `PORT` and `HOST` are read from the environment. If `PORT` is not set the server
> starts on 3000 and automatically falls back to the next free port when 3000 is
> already in use, printing the address it chose.

### Default admin account

| Username | Also accepted | Password |
| :--- | :--- | :--- |
| `admin` | `admin@matchaavenue.com`, `admin@avenuecafe.com` | `matcha2025` (also `avenuecafe2025`, `admin`) |

Customers create their own accounts from the login portal ("Create new account"), or use the Google / Facebook social buttons.

---

## Available npm Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Express + Vite dev server on `http://localhost:3000` |
| `npm run build` | Bundles the React frontend into `dist/` and compiles the server to `dist/server.cjs` |
| `npm start` | Runs the production bundle (`node dist/server.cjs`) |
| `npm run lint` | TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Removes `dist/` and `server.js` |

---

## Deploy to Render (free hosting)

This repository is Render-ready - `render.yaml` is a Blueprint that installs, builds and starts the app.

### Option A - Blueprint deploy (recommended, about 2 minutes)

1. Sign in at **https://dashboard.render.com** (signing in with GitHub is easiest).
2. Click **New +** -> **Blueprint**.
3. Connect the **earlPineda/ordermaster** repository, then click **Connect**.
4. Render reads `render.yaml` and shows the service **matcha-avenue-cafe** on the **Free** plan - click **Apply** / **Create Resources**.
5. If prompted for the optional secret values, paste them now or leave them empty and add them later under **Settings -> Environment**.
6. Wait for the build to finish and the health check on `/api/health` to pass. The app is then live at:

```text
https://matcha-avenue-cafe.onrender.com/        (customer storefront)
https://matcha-avenue-cafe.onrender.com/admin   (admin console)
```

### Option B - Manual Web Service

1. **New +** -> **Web Service** -> connect **earlPineda/ordermaster**.
2. Configure:

| Field | Value |
| :--- | :--- |
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Environment Variable | `NODE_ENV` = `production` |

3. Click **Create Web Service**.

> `--include=dev` matters: `NODE_ENV=production` makes npm skip devDependencies by
> default, and the build needs Vite, esbuild and TypeScript. `server.ts` loads a local
> `.env` at startup too (dotenv never overrides variables that already exist, so
> Render's environment variables always take precedence).

### Environment variables

| Key | Required | Purpose |
| :--- | :--- | :--- |
| `PORT` | automatic | Injected by Render; the server binds exactly this port. Do not set it yourself. |
| `NODE_ENV` | yes | `production` makes the server serve the built `dist/` instead of the Vite dev middleware (already set in `render.yaml`). |
| `GEMINI_API_KEY` | optional | Google Gemini key for the AI ordering assistant and Meta AI replies. Without it those features fall back to scripted responses. |
| `GOOGLE_MAPS_PLATFORM_KEY` | optional | Read at **build time** by `vite.config.ts` and baked into the client bundle, so changing it requires a rebuild. The delivery pin map works without it. |
| `FB_PAGE_ACCESS_TOKEN` | optional | Facebook Page token for Messenger auto-replies. Without it, webhook replies are simulated only. |
| `FB_VERIFY_TOKEN` | optional | Meta webhook verify token (defaults to `matcha_avenue_meta_ai_secret_verify_token` in code). |

### How production runs

* `npm run build` -> Vite bundles the frontend into `dist/` and esbuild compiles the server to `dist/server.cjs` (image loaders included).
* `npm start` -> `node dist/server.cjs`. With `NODE_ENV=production` the server skips Vite, serves `dist/` statically with an SPA fallback (so deep links such as `/admin` work) and exposes the REST API.
* Render injects `PORT`; the server logs the address it binds and answers Render's health check at `/api/health`.

### Free-plan behaviour to be aware of

* The service **sleeps after ~15 minutes of inactivity**; the next page load takes a few seconds to wake up.
* There is **no persistent disk** on the free plan and the API keeps its data **in memory**, so **orders, products and accounts reset on every restart or redeploy**.
* Need durable data? Export the SQL from the admin console before redeploying, or move the store to Supabase (schema + SQL export are already built in) or a Render Postgres instance.

---

## API Reference (selected routes)

| Method | Route | Purpose |
| :--- | :--- | :--- |
| GET | `/api/health` | Health probe used by Render |
| GET / POST | `/api/menu` | List / create products |
| PUT / DELETE | `/api/menu/:id` | Update / delete a product |
| POST | `/api/menu/apply-batch-discount`, `/api/menu/reset-discounts` | Bulk promotions |
| GET / PUT | `/api/settings` | Read / update store settings |
| POST | `/api/settings/reset` | Restore default store settings |
| GET | `/api/orders`, `/api/orders/:id` | List / read orders |
| POST | `/api/orders` | Place an order |
| PATCH | `/api/orders/:id/status`, `/api/orders/:id/confirm-receipt`, `/api/orders/:id/reschedule-pickup` | Status, receipt and pickup updates |
| POST | `/api/orders/:id/cancel-by-customer`, `/api/orders/bulk-delete` | Customer cancellation and admin cleanup |
| GET | `/api/notifications` | Admin alert feed |
| POST | `/api/notifications/read` | Mark alerts as read |
| GET | `/api/admin/stats` | Dashboard analytics |
| POST | `/api/auth/login`, `/api/auth/register`, `/api/auth/social`, `/api/auth/forgot-password` | Accounts |
| GET / POST / DELETE | `/api/reporting/snapshots` | Sales report snapshots |
| GET | `/api/supabase/export-sql`, `/api/export-sql` | Supabase schema / SQL dump export |
| GET / POST | `/api/meta-ai/config`, `/api/meta-ai/webhook`, `/api/meta-ai/chat`, `/api/meta-ai/sessions`, `/api/meta-ai/simulate-message`, `/api/meta-ai/send-messenger` | Messenger + AI integration |

---

## Project Structure

```text
├── server.ts                  # Express API + Vite middleware (dev) / static serving (prod)
├── render.yaml                # Render Blueprint: build, start, health check, env vars
├── vite.config.ts             # Vite + React + Tailwind; bakes GOOGLE_MAPS_PLATFORM_KEY
├── start-dev.ps1              # Windows helper: frees port 3000, then runs the server
├── public/matcha-avenue-logo.jpg
├── src/
│   ├── App.tsx                # Routes "/" (storefront) and "/admin" (console)
│   ├── components/
│   │   ├── CustomerView.tsx           Header.tsx  SideMenuDrawer.tsx
│   │   ├── CartDrawer.tsx             CheckoutModal.tsx  OrderTrackerModal.tsx
│   │   ├── GoogleMapsLocationPicker.tsx   # Leaflet + Google tiles delivery pin picker
│   │   ├── AdminDashboard.tsx         RidayDashboardView.tsx  CustomerManagementView.tsx
│   │   ├── CustomerDetailModal.tsx    QrCodeStandModal.tsx
│   │   ├── LoginPortal.tsx            CreateAccountModal.tsx
│   │   ├── ForgotPasswordModal.tsx    AuthModal.tsx  AdminLogin.tsx
│   │   ├── PromotionsPanel.tsx        StoreCustomizerPanel.tsx
│   │   ├── GoogleSheetsPanel.tsx      SupabasePanel.tsx
│   │   └── MetaAiMessengerPanel.tsx   AiOrderingAssistant.tsx
│   ├── data/initialData.ts    data/supabaseSchema.ts
│   ├── services/googleAuth.ts services/googleSheets.ts
│   ├── utils/format.ts        utils/audio.ts   utils/supabaseClient.ts
│   ├── utils/reportingStorage.ts  utils/imagePresets.ts
│   └── types.ts
```

---

## Troubleshooting

| Symptom | Cause and fix |
| :--- | :--- |
| Port 3000 is busy | The server prints `[server] Port 3000 is already in use - using 3001 instead.` and binds the next free port. Set `PORT` to force a specific one, or run `start-dev.ps1`, which frees 3000 first on Windows. |
| `EADDRINUSE` on port **24678** or `WebSocket server error` | Vite's HMR websocket port is fixed, so run only one dev server at a time - stop the previous instance first. |
| Render build fails looking for Vite / esbuild / TypeScript | DevDependencies were skipped. Keep the build command as `npm install --include=dev && npm run build`. |
| Site works but data resets | Expected on the free plan: the API keeps data in memory. Export SQL before redeploying, or attach a database. |
| Map renders as a grey box | The tile host (Google or OpenStreetMap) is unreachable from the browser, or the Leaflet stylesheet from the unpkg CDN was blocked. Try the **OSM** map-layer button. |
| An `/api/...` URL returns HTML | That route does not exist, so the SPA fallback served `index.html`. Compare with the API reference above. |
| `npm run lint` fails | The repository is kept type-clean; run it locally to see the errors. |

---

## Security Notes (read before sharing a public URL)

* **The admin login is a demo shortcut.** `server.ts` and `LoginPortal.tsx` accept the hardcoded pair **`admin` / `matcha2025`** (also `avenuecafe2025` and `admin` as passwords). On a public Render URL, anyone can sign in as admin and manage the store. Move these credentials into environment variables (for example `ADMIN_USERNAME` / `ADMIN_PASSWORD`) or wire up a real auth provider before sharing the link.
* Accounts are kept **in memory with plain-text passwords**. Use Supabase Auth or Firebase Auth (both already scaffolded in this repo) for anything real.
* `firebase-applet-config.json` contains a Firebase **web** API key. That key is public by design, but restrict it by HTTP referrer in the Google Cloud Console and keep security rules enabled.
* There is **no rate limiting** on the API - add `express-rate-limit` or similar if it becomes publicly reachable.

---

## MySQL / phpMyAdmin (optional)

The API never requires MySQL - it runs on an in-memory store. To import the data into MySQL (XAMPP / WAMP):

1. Open the admin console and use the SQL / export panel.
2. Copy the script or download the `.sql` file.
3. In phpMyAdmin (http://localhost/phpmyadmin) create a database named `avenue_cafe_db`, open the **SQL** tab, paste the script and click **Go**.

