# 🛒 D2Farm — Buyer Dashboard (Frontend)

The buyer-facing procurement dashboard built with **Next.js 14 (App Router)**.

This is where restaurants, cloud kitchens, and small industries place forward demand orders (3–7 days ahead), view real-time market insights, and manage their procurement.

---

## ✨ Key Features

- **Procurement Interface** — Place forward orders with crop selection, quantity, and delivery date
- **AI Market Insights Ledger** — Real-time "stock-market" style price tracker with historical, live, and AI-forecast data
- **ML-Powered Pricing** — Prices driven by supply/demand ratio, weather, and government policy via the Python ML engine
- **Deposit System** — 10% commitment on order placement (smart contract ready)
- **Glassmorphic UI** — Premium CSS design with transparency and gradient effects

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Backend API running on port 4000 (see `../backend/`)

### Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/           → Next.js App Router pages
│   └── components/    → Reusable React components
├── public/            → Static assets
├── next.config.ts     → Next.js configuration
├── tsconfig.json      → TypeScript config
└── package.json       → Dependencies
```

---

## 🔗 API Dependencies

This frontend connects to:

| Service | Port | Purpose |
|---|---|---|
| Backend API | `:4000` | Orders, market data, crop info |
| ML Engine | `:5000` | AI pricing predictions (via backend) |
