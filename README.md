# Avenue Café - Full Stack Online Coffee & Food Ordering System

An artisan café online ordering web application built with **React**, **TypeScript**, **Tailwind CSS**, and an **Express REST API** backend server. Features live order tracking, GCash & Maya payment validation, administrative console with real-time audio notifications, and a MySQL/phpMyAdmin database script generator.

---

## 🚀 Quick Start Guide for VS Code

Follow these steps to run the application locally on your computer using **Visual Studio Code**.

### Prerequisites
1. **Node.js** (v18.0 or higher) - [Download Node.js](https://nodejs.org/)
2. **VS Code** (Visual Studio Code) - [Download VS Code](https://code.visualstudio.com/)
3. **Git** (optional, for cloning)

---

### Step 1: Open the Project in VS Code
1. Open Visual Studio Code.
2. Click **File > Open Folder...** (or press `Ctrl+O` / `Cmd+O`).
3. Select this project root directory.

---

### Step 2: Open Terminal in VS Code
1. In VS Code, open the integrated terminal: press `` Ctrl+` `` (Control + Backtick) or go to **Terminal > New Terminal**.
2. Make sure you are in the project root directory.

---

### Step 3: Install Dependencies
Run the following command in the VS Code terminal:

```bash
npm install
```

This installs all required packages (`react`, `express`, `vite`, `tsx`, `lucide-react`, `motion`, etc.).

---

### Step 4: Run Development Server
Run the unified Express + Vite dev server:

```bash
npm run dev
```

You should see output similar to:
```text
Server running on http://0.0.0.0:3000
Vite server running on http://localhost:3000
```

---

### Step 5: Open in Browser
Open your web browser and navigate to:
```text
http://localhost:3000
```

- **Customer View**: Browse artisan coffee, pastries, paninis, customize notes, pay via GCash / Maya / Cash, and track order status in real-time.
- **Admin Dashboard**: Click **"Admin Dashboard"** in the top navigation bar to manage products, view incoming orders, update order status, and inspect verified GCash / Maya payment reference numbers.

---

## 🛠️ Available npm Scripts

In VS Code terminal, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Express server with Vite middleware on `http://localhost:3000` |
| `npm run build` | Bundles React frontend into `dist/` and compiles Express server into `dist/server.cjs` |
| `npm run start` | Runs the production bundled server using `node dist/server.cjs` |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |

---

## 🗄️ MySQL & phpMyAdmin Integration (XAMPP)

To connect or import database records into MySQL:
1. Open the **Admin Dashboard** in the app.
2. Go to the **"MySQL Dump"** tab.
3. Click **"Copy SQL Script"** or **"Download .sql File"**.
4. Open **phpMyAdmin** (e.g. via XAMPP / WAMP) at `http://localhost/phpmyadmin`.
5. Create a database named `avenue_cafe_db`.
6. Click the **"SQL"** tab in phpMyAdmin, paste the script, and click **"Go"**.

---

## 💳 Payment Validation Features
- **GCash**: Requires a valid 11-digit Philippine mobile number (`09XXXXXXXXX`) and an 8–16 digit Transaction Reference Number.
- **Maya**: Requires a valid 11-digit Philippine mobile number (`09XXXXXXXXX`) and Reference Number.
- **Cash / Card**: Standard checkout options with live order status updates.

---

## 📁 Project Structure

```text
├── server.ts              # Express API Server + Vite Dev Middleware
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx  # Admin order & menu management console
│   │   ├── CustomerView.tsx    # Customer menu, cart & order status tracker
│   │   ├── CheckoutModal.tsx   # Checkout modal with GCash/Maya validation
│   │   ├── Header.tsx          # Navigation header & VS Code Guide button
│   │   └── VSCodeGuideModal.tsx# In-app interactive VS Code setup modal
│   ├── data/
│   │   └── initialData.ts  # Initial menu products, orders, and MySQL dump
│   ├── types.ts            # TypeScript interfaces & types
│   ├── utils/
│   │   └── format.ts       # Peso (₱) formatting & e-wallet validators
│   ├── App.tsx             # Main React application component
│   └── main.tsx            # React entry point
├── package.json            # Node.js dependencies and scripts
└── README.md               # VS Code setup guide and documentation
```
