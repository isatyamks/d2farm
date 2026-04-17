# 🌾 D2Farm — Demand-Driven Agricultural Exchange

> India's first demand-driven agricultural operating system — connecting future demand with upcoming supply **before** harvest happens.

[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Status](https://img.shields.io/badge/status-Active%20Development-brightgreen)]()
[![Focus](https://img.shields.io/badge/target-MP%20%7C%20UP%20%7C%20Bihar-orange)]()

---

## 🚨 The Problem

In states like **Madhya Pradesh, Uttar Pradesh, and Bihar**, over 80% of farmers are small and marginal. They face three harsh realities:

| Reality | What Happens |
|---|---|
| **No price control** | Mandis and middlemen dictate rates |
| **No timing control** | Zero cold storage forces immediate selling at crash prices |
| **No information access** | No visibility into future demand or market trends |

**Example:** A farmer in MP harvests tomatoes → reaches mandi → oversupply → price crashes from ₹20/kg to ₹5/kg overnight. Meanwhile, restaurants in cities struggle with price spikes and inconsistent supply.

> **This is not a production problem. This is a coordination failure.**

Agriculture in India is reactive — farmers grow first, then search for buyers. Buyers need supply but can't plan ahead. There is **zero connection** between future demand and current supply, leading to **30–40% post-harvest losses**, extreme price volatility, and farmer distress.

---

## 💡 The Solution

**D2Farm** is a controlled agricultural market system that connects:

```
👉 Future demand (buyers)  ←→  Upcoming supply (farmers)
```

**BEFORE** harvest happens — so both sides can plan, commit, and transact with confidence.

### How It Works (End-to-End)

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   BUYERS          │       │   AI MATCHING    │       │   FARMERS         │
│                   │       │   ENGINE         │       │                   │
│ • Restaurants     │──────▶│ • Match demand   │◀──────│ • List expected   │
│ • Cloud Kitchens  │       │   ↔ supply       │       │   harvest (range) │
│ • Small Industries│       │ • Multi-farmer   │       │ • Verified via    │
│                   │       │   allocation     │       │   past data +     │
│ Place demand      │       │ • 20-30% buffer  │       │   field agents    │
│ 3-7 days ahead    │       │                  │       │                   │
│ Pay 5-10% deposit │       │                  │       │                   │
└──────────────────┘       └──────────────────┘       └──────────────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │   EXECUTION       │
                           │                   │
                           │ Harvest → Pickup  │
                           │ → Delivery →      │
                           │ Payment           │
                           └──────────────────┘
```

---

## 📊 Demand Intelligence — Where the Data Comes From

The core question: *"How do we know upcoming demand?"* — We use a multi-source approach:

### Primary Sources (Direct Demand Capture)
| Source | Signal Type | How We Use It |
|---|---|---|
| **Buyer orders on D2Farm** | Actual stated demand (3-7 day forward orders) | Core matching engine input |
| **Restaurant POS integration** (Petpooja, POSist) | Weekly ingredient consumption patterns | Predict recurring buyer needs |
| **Institutional procurement cycles** | Canteen/hotel bulk schedules | Stable baseline demand |

### Government & Public Data (Free APIs)
| Source | Data Available | Access |
|---|---|---|
| **[Agmarknet](https://agmarknet.gov.in)** | Daily mandi arrivals & prices for 3000+ mandis | Open API / CSV |
| **[eNAM](https://enam.gov.in)** | Real-time electronic mandi trades & volumes | Open API |
| **[data.gov.in](https://data.gov.in/sector/Agriculture)** | District-wise crop production, harvest calendars | Open Data |
| **[IMD](https://mausam.imd.gov.in)** | District weather forecasts (spoilage/transport) | Open API |
| **WDRA** | Cold storage & warehouse occupancy data | Public records |

### Derived Intelligence (AI-Powered)
| Signal | Insight |
|---|---|
| **Zomato/Swiggy cuisine trends** | Trending food categories → derive ingredient demand spikes |
| **Wedding/festival calendar** | Oct-Feb wedding season, Navratri, Diwali → predictable surges |
| **Historical mandi price-volume data** | 10+ year seasonality models for price prediction |
| **School/college reopening dates** | Institutional canteen demand ramp-up |

---

## 🏗️ Architecture

The codebase follows a microservices-inspired architecture:

```
d2farm/
├── frontend/          → Buyer-facing Next.js 14 App (procurement dashboard)
│   └── src/
│       ├── app/       → App Router pages
│       └── components/→ Reusable React components
│
├── backend/           → Node.js/Express REST API + MongoDB
│   ├── server.js      → Core API (orders, market insights, health)
│   ├── models/        → Mongoose schemas (Order, User, Crop, Transaction)
│   └── seed.js        → Database seeder
│
├── ml_engine/         → Python AI/ML pricing engine
│   ├── app.py         → Flask API server (port 5000)
│   └── pricing_model.py → RandomForest pricing model (scikit-learn)
│
├── farmer/            → Farmer-facing application (🚧 Under Development)
│   ├── frontend/      → Farmer UI
│   └── backend/       → Farmer API & models
│
└── .env               → Environment configuration
```

### Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Buyer Frontend** | Next.js 14 (App Router), React, TypeScript | Procurement dashboard with real-time market insights |
| **Farmer Frontend** | 🚧 *Under Development* | Harvest listing, order tracking, payment status |
| **Backend API** | Node.js, Express.js | REST API, order management, market data |
| **Database** | MongoDB (Atlas / Local) | Orders, users, crops, transactions |
| **ML Engine** | Python, Flask, scikit-learn | AI pricing prediction (supply/demand/weather/policy) |
| **Blockchain** | *Planned* | Smart contracts for escrow payments & dispute resolution |
| **IoT** | *Planned* | Temperature/humidity monitoring in storage hubs & transit |

---

## 🧠 Deep Tech — Where and Why

We use deep tech **only where it solves real problems**:

### 🤖 AI Layer
| Model | Purpose | Status |
|---|---|---|
| **Demand Prediction** | Forecast buyer needs from historical POS + seasonal + event data | 🔄 In Progress |
| **Price Signal Engine** | Predict short-term price movement → suggest "buy now / wait" | ✅ Built (`ml_engine/`) |
| **Supply Confidence Model** | Score farmer reliability + region-based yield estimation | 📋 Planned |
| **Matching Optimization** | Multi-variable allocation (time, location, risk) | 📋 Planned |

### 🌐 Blockchain (Selective Use)
- ✅ Smart contracts between buyer & farmer
- ✅ Escrow-based payments (10% deposit model already live)
- ✅ Immutable transaction records
- ❌ NOT used for fake demand/supply detection (handled via incentives + scoring)

### 📡 IoT (Practical Use)
- Micro storage hubs: temperature & humidity tracking
- Transport monitoring: reduce spoilage in transit

---

## 🛡️ System Design for Indian Reality

We assume everything will fail — and build for it:

| Failure Mode | Our Defense |
|---|---|
| Farmers under-deliver | Multi-farmer allocation (no single dependency) |
| Buyers cancel | Smart contracts + deposit forfeiture |
| Logistics fail | Backup transport + micro buffer inventory |
| Oversupply/Undersupply | Over-allocation at 120-130% + real-time rebalancing |
| System-wide failure | Mandi fallback integration |

> **The system works even with 30% failure rate.**

---

## ⚠️ Loophole Prevention

| Loophole | Solution |
|---|---|
| Fake demand from buyers | Deposits (5-10%) + reputation scoring |
| Fake supply from farmers | Reliability scoring + historical yield data |
| Farmer default | Multi-source allocation + graduated penalties |
| Buyer cancellation | Smart contracts + deposit forfeiture |
| Logistics failure | Backup transport + micro buffer hubs |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- Python 3.9+ (for ML engine)

### 1. Environment Setup
Create a `.env` file in the project root:
```env
MONGODB_URL=mongodb+srv://<user>:<password>@cluster/d2farm?retryWrites=true&w=majority
PORT=4000
```

### 2. Backend
```bash
cd backend
npm install
node seed.js        # Seed initial data
npm run dev         # → Launches on port 4000
```

### 3. Frontend (Buyer Dashboard)
```bash
cd frontend
npm install
npm run dev         # → Launches on port 3000
```

### 4. ML Engine (Optional)
```bash
cd ml_engine
pip install -r requirements.txt
python app.py       # → Flask API on port 5000
```

### 5. Farmer App
> 🚧 **Under Development** — The farmer-facing application is being built. Check the `farmer/` directory for progress.

---

## 💰 Impact (State-Specific: MP / UP / Bihar)

### For Farmers
- ✅ **10–25% better price realization** over mandi rates
- ✅ Guaranteed buyers before harvest
- ✅ Eliminated distress selling

### For Buyers
- ✅ Stable, predictable supply
- ✅ Reduced price volatility
- ✅ Lower procurement effort and cost

### For the Ecosystem
- ✅ Reduced post-harvest waste (target: cut 30-40% losses by half)
- ✅ Efficient hyperlocal logistics
- ✅ Data-driven agricultural planning

---

## 🎯 Why We Win

Others are building marketplaces, logistics apps, or data dashboards.

**We are building a controlled agricultural market system** where:
- Incentives are aligned between all parties
- Risk is distributed, not concentrated
- Decisions are data-driven, not reactive

---

## 🔮 Roadmap

- [x] Buyer procurement dashboard (Next.js)
- [x] AI pricing engine (ML model)
- [x] Order management with deposit system
- [x] Real-time market insights ledger
- [ ] 🚧 Farmer-facing application
- [ ] Demand prediction model (POS + event + seasonal data)
- [ ] Blockchain smart contracts for escrow
- [ ] IoT integration for storage & transport
- [ ] Multi-farmer matching & allocation engine
- [ ] Mandi fallback integration
- [ ] Mobile apps (buyer + farmer)

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  <strong>🌾 D2Farm</strong> — Not just improving agriculture… rewiring how it works.
</p>
