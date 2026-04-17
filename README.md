# 🌾 D2Farm

**D2Farm** is a next-generation Agritech B2B supply-chain platform. It empowers direct procurement between farmers and deep-pocket buyers (Supermarkets, Commercial Kitchens), completely bypassing inefficient middlemen. 

This repository leverages a highly scalable modern stack, incorporating native predictive pricing logic directly integrated into a real-time procurement dashboard.

---

## 🏗️ Architecture

The codebase has evolved into a robust Microservices-inspired layout:

- **`frontend/`**: The modern Next.js 14 App Router UI. Features high-performance React components, state-managed cascading dropdowns, and an auto-refreshing "Stock-Market" style AI Market Insights ledger.
- **`backend/`**: A lightweight Node.js/Express REST API heavily integrated with a secure MongoDB connection.
- **`ml_engine/` (Optional/Experimental)**: A scikit-learn Python framework designed to consume market variants (weather, policy, demand) and output real-time nonlinear pricing factors.
- **`frontend-old/`**: The legacy Vanilla JS monolithic codebase (preserved for architectural reference).

---

## 🚀 Getting Started

Follow these steps to deploy the application locally:

### 1. Database & Environment Configuration
1. Ensure you have access to a MongoDB instance (Local or Atlas).
2. Create a `.env` file in the **root** of the directory:
   ```env
   # .env
   MONGODB_URL=mongodb+srv://<user>:<password>@cluster/d2farm?retryWrites=true&w=majority
   PORT=4000
   ```

### 2. Backend Initialization
The backend relies on the `.env` file to mount its Mongoose schemas.
```bash
cd backend
npm install

# Seed the initial geographical database architecture
node seed.js

# Boot the API server
npm run dev
# Expected output: 🚀 PROCUREMENT CORE API ACTIVE: Launching on port 4000
```

### 3. Frontend Initialization
The Next.js architecture heavily relies on the operational backend running on Port 4000 to securely fetch order logics and market simulations.
```bash
cd frontend
npm install

# Build & Boot the local development server
npm run dev
# Expected output: Ready in XXms
```

Open a browser and navigate to `http://localhost:3000` to interact with the Next.js procurement interface.

---

## 💡 Key Features

- **Flat Ecosystem Processing**: Bypasses slow relational database architecture using rapid Geographical Index modeling.
- **Real-Time Market Tracker**: The *Market Insights* tab mimics a Wall-Street trading floor, actively shifting UI prices, confidence scores, and core price-drivers every 4 seconds dynamically.
- **Glassmorphic Component Design**: Utilizes an extensive CSS layout providing premium transparency graphics layered over robust React functional components.
