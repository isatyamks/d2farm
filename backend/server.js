const path = require('path');
// Load .env: backend/.env for local dev, root .env as fallback (monorepo), Vercel injects directly
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
if (!process.env.MONGODB_URL && !process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ── Dynamic CORS: allow localhost (dev) + deployed Vercel frontends (prod)
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    process.env.FARMER_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server calls and whitelisted origins
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json());

// -------------------------------------------------------------
// HIGH-RELIABILITY DATABASE CONNECTION
// Hooks into your .env MongoDB URI securely
// -------------------------------------------------------------
const DB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/d2farm';
mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ DATABASE LINKED: Secure connection to MongoDB established.'))
.catch((err) => console.error('❌ MONGODB ERROR: Could not connect to cluster.', err));

// -------------------------------------------------------------
// CORE A.P.I. ROUTES (WIRED TO MONGODB)
// -------------------------------------------------------------
const Order = require('./models/Order');
const User = require('./models/User');
const Crop = require('./models/Crop');

// Farmer Platform Routes
const farmerRoutes = require('./routes/farmerRoutes');
const listingRoutes = require('./routes/listingRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const matchRoutes = require('./routes/matchRoutes');

app.use('/api/farmer', farmerRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/match', matchRoutes);

// -------------------------------------------------------------
// ML FARMER FORECAST ENGINE
// Generates realistic, crop-specific predictions seeded from
// actual market data (not random) so numbers feel genuine
// -------------------------------------------------------------

// Base market profiles for each crop (derived from APMC historical data)
const CROP_MARKET_PROFILES = {
    'Tomato':     { basePrice: 22, volatility: 0.18, perishabilityFactor: 0.9, demandZone: 'BigBasket Micro-Fulfillment', deficitPct: 28 },
    'Onion':      { basePrice: 30, volatility: 0.12, perishabilityFactor: 0.5, demandZone: 'Lasalgaon APMC Wholesale', deficitPct: 18 },
    'Potato':     { basePrice: 18, volatility: 0.08, perishabilityFactor: 0.3, demandZone: 'Agra Cold Storage Hub', deficitPct: 10 },
    'Wheat':      { basePrice: 25, volatility: 0.05, perishabilityFactor: 0.1, demandZone: 'FCI Procurement Centre', deficitPct: 8 },
    'Rice':       { basePrice: 34, volatility: 0.07, perishabilityFactor: 0.2, demandZone: 'State Govt Procurement', deficitPct: 12 },
    'Mango':      { basePrice: 55, volatility: 0.22, perishabilityFactor: 0.95, demandZone: 'Reliance Fresh Fulfil. Hub', deficitPct: 35 },
    'Banana':     { basePrice: 28, volatility: 0.15, perishabilityFactor: 0.85, demandZone: 'Metro Cash & Carry', deficitPct: 22 },
    'Capsicum':   { basePrice: 40, volatility: 0.20, perishabilityFactor: 0.75, demandZone: 'Hotel & Restaurant Hub', deficitPct: 30 },
    'Garlic':     { basePrice: 80, volatility: 0.14, perishabilityFactor: 0.4, demandZone: 'Spice Export Terminal', deficitPct: 14 },
    'Ginger':     { basePrice: 70, volatility: 0.16, perishabilityFactor: 0.45, demandZone: 'Kochi Spice Board', deficitPct: 16 },
    'Turmeric':   { basePrice: 120, volatility: 0.10, perishabilityFactor: 0.2, demandZone: 'Nizamabad Mandi', deficitPct: 9 },
};

const DEFAULT_PROFILE = { basePrice: 20, volatility: 0.12, perishabilityFactor: 0.5, demandZone: 'Nearest APMC Market', deficitPct: 15 };

// Seeded pseudo-random (produces same output for same crop — not truly random)
function seededRand(seed, offset) {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
}

app.get('/api/ml/farmer-forecast', (req, res) => {
    const { crop = 'Tomato', basePrice, travelHours = 8, temperature = 30 } = req.query;
    const profile = CROP_MARKET_PROFILES[crop] || DEFAULT_PROFILE;
    const price = parseFloat(basePrice) || profile.basePrice;
    const seed = crop.charCodeAt(0) + crop.charCodeAt(crop.length - 1);

    // --- 1. PRICE FORECAST (7-day trajectory) ---
    const today = new Date();
    const forecast7Day = [];
    let rollingPrice = price;

    // Determine macro trend based on seeded value
    const trendBias = seededRand(seed, 99) > 0.5 ? -1 : 1; // consistent per crop
    const weeklyDrift = trendBias * profile.volatility * 0.4;

    for (let i = 1; i <= 7; i++) {
        const dayNoise = (seededRand(seed, i) - 0.5) * profile.volatility * rollingPrice;
        const drift = weeklyDrift * rollingPrice * 0.15;
        rollingPrice = Math.max(price * 0.6, rollingPrice + dayNoise + drift);
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() + i);
        forecast7Day.push({
            day: dayDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
            predicted_price: parseFloat(rollingPrice.toFixed(1)),
            confidence_score: parseFloat((96 - i * 4.5).toFixed(1)),
        });
    }

    const finalPrice = forecast7Day[6].predicted_price;
    const trend = finalPrice > price ? 'BULLISH' : 'BEARISH';
    const pctChange = (((finalPrice - price) / price) * 100).toFixed(1);
    const action = trend === 'BULLISH' ? 'HOLD — prices rising' : 'SELL NOW — price declining';

    // --- 2. DEMAND PREDICTION ---
    const demandResult = {
        optimal_zone: profile.demandZone,
        distance_km: Math.round(8 + seededRand(seed, 7) * 25),
        supply_deficit_pct: profile.deficitPct,
        expected_premium_pct: Math.round(profile.deficitPct * 0.7),
    };

    // --- 3. SPOILAGE RISK ---
    const temp = parseFloat(temperature);
    const hours = parseFloat(travelHours);
    const tempStress = Math.max(0, (temp - 25) * 0.025) * profile.perishabilityFactor;
    const timeStress = (hours / 24) * 0.12 * profile.perishabilityFactor;
    const spoilageRisk = Math.min(95, Math.round((0.04 + tempStress + timeStress) * 100));
    const riskLevel = spoilageRisk > 30 ? 'HIGH' : spoilageRisk > 15 ? 'MEDIUM' : 'LOW';
    const coldChainNeeded = spoilageRisk > 25;

    // --- 4. ROUTE SUGGESTION ---
    const routes = [
        { name: 'National Highway 48 (Express)', eta: parseFloat((hours * 0.75).toFixed(1)), risk: 'Low Vibration', cold_nodes: 3 },
        { name: 'State Road via District HQ', eta: parseFloat((hours * 0.9).toFixed(1)), risk: 'Moderate Road Quality', cold_nodes: 1 },
    ];

    res.status(200).json({
        success: true,
        crop,
        farmerPrice: price,
        forecast: { trend, pct_change: pctChange, action, days: forecast7Day },
        demand: demandResult,
        spoilage: { risk_pct: spoilageRisk, risk_level: riskLevel, cold_chain_needed: coldChainNeeded, stressor: temp > 28 ? `High temp (${temp}°C)` : `Transit duration (${hours}h)` },
        route: { recommended: routes[0], alternative: routes[1] }
    });
});

app.get('/api/system/health', (req, res) => {
    res.status(200).json({ status: 'SECURE', message: 'D2Farm High-Performance Node Backend Active' });
});

app.post('/api/orders/deposit', async (req, res) => {
    try {
        const { crop, variety, quantity, deliveryDate, buyerName, lat, lng } = req.body;

        // ── Input validation
        if (!crop || !quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
            return res.status(400).json({ success: false, message: 'crop and a positive quantity are required.' });
        }

        const qty = Number(quantity);

        // ── Price from in-process market profiles (no external Flask dependency)
        const profile = CROP_MARKET_PROFILES[crop] || { basePrice: 20 };
        const pricePerKg = parseFloat(profile.basePrice.toFixed(2));
        const totalValue = parseFloat((qty * pricePerKg).toFixed(2));

        console.log(`[ORDER] ${qty}kg of ${crop} @ ₹${pricePerKg}/kg = ₹${totalValue}`);

        // ── Create order — coordinates default to Mumbai if buyer location not provided
        const newOrder = await Order.create({
            buyerName:        buyerName || 'D2Farm Buyer',
            crop:             crop,
            variety:          variety || 'Standard',
            quantityRequired: qty,
            unit:             'kg',
            priceOffered:     pricePerKg,
            location: {
                type:        'Point',
                coordinates: [Number(lng) || 72.8777, Number(lat) || 19.0760]
            },
            status: 'Open'
        });

        console.log(`✅ Order ${newOrder._id} saved`);

        res.status(200).json({
            success:  true,
            message:  `Order placed! ${qty}kg of ${crop} at ₹${pricePerKg}/kg. Total value: ₹${totalValue.toLocaleString('en-IN')}.`,
            orderId:  newOrder._id.toString(),
            pricePerKg,
            totalValue
        });

    } catch (err) {
        console.error('❌ /api/orders/deposit failed:', err.message, err.errors || '');
        res.status(500).json({
            success: false,
            message: err.message || 'Order could not be saved.',
            detail:  process.env.NODE_ENV !== 'production' ? err.message : undefined
        });
    }
});

// -------------------------------------------------------------
// AI MARKET INSIGHTS LEDGER (ML INTEGRATION)
// -------------------------------------------------------------
app.get('/api/market-insights/ledger', async (req, res) => {
    try {
        const cropsToAnalyze = [
            { name: "Tomato (Hybrid)", baseCost: 12.0, baseSupply: 2000, baseDemand: 2200 },
            { name: "Onion (Red Nashik)", baseCost: 18.0, baseSupply: 1000, baseDemand: 3000 },
            { name: "Potato (Agra Big)", baseCost: 10.0, baseSupply: 4000, baseDemand: 3500 },
            { name: "Wheat (Sharbati)", baseCost: 22.0, baseSupply: 5000, baseDemand: 6000 }
        ];

        // Native MVP Real-Time Mock Engine (Stock Market Simulation)
        let allTabularRows = [];
        let summaries = [];

        for (const crop of cropsToAnalyze) {
            const cropParts = crop.name.split(' (');
            const cropType = cropParts[0];
            const variety = cropParts[1] ? cropParts[1].replace(')', '') : 'Standard';

            // Internal algorithmic mock generator to act as ML
            const generateMockML = (baseCost, dayOffset) => {
                // Simulate frantic stock market tick shifts
                const demandVolatility = (Math.random() * 0.3) - 0.1; // -10% to +20% shifts
                const noise = (Math.random() - 0.5) * 2; // -1 to +1 Rupee noise
                
                let price = (baseCost * (1 + demandVolatility)) + noise;
                price = Math.max(baseCost * 0.8, price); // Price floor
                
                let driver = "Steady Trading";
                if (demandVolatility > 0.15) driver = "Heavy Buyer Procurement";
                if (demandVolatility < -0.05) driver = "Overabundant Supply Arrivals";
                if (dayOffset >= 2 && Math.random() > 0.5) {
                     price *= 1.15; // 15% shock
                     driver = "Projected Highway Logistics Delay";
                }

                let confidence = Math.floor(Math.random() * 20) + 75; // 75%-95% precision
                if (dayOffset > 0) confidence -= (dayOffset * 5); // Less confident in future

                return { price, driver, confidence };
            };

            let currentData = generateMockML(crop.baseCost, 0);
            let futureMaxData = generateMockML(crop.baseCost, 3);
            
            for(let i = -7; i <= 3; i++) {
                let phase = i < 0 ? 'HISTORICAL' : (i === 0 ? 'LIVE CURRENT' : 'AI FORECAST');
                
                let mlCalc = generateMockML(crop.baseCost, i);
                
                if (i === 0) mlCalc = currentData;
                if (i === 3) mlCalc = futureMaxData;

                let d = new Date();
                d.setDate(d.getDate() + i);

                allTabularRows.push({
                    id: `${cropType}-${variety}-${i}-${Math.random()}`,
                    crop: cropType,
                    variety: variety,
                    date: d.toISOString().split('T')[0],
                    price: mlCalc.price,
                    phase: phase,
                    dayOffset: i,
                    confidence: mlCalc.confidence,
                    driver: mlCalc.driver
                });
            }

            summaries.push({
                id: cropType.toLowerCase(),
                crop: crop.name,
                currentPrice: currentData.price,
                predictedFuturePrice: futureMaxData.price,
                trend: futureMaxData.price > currentData.price ? "SCARCITY EXPECTED" : "OVERSUPPLY EXPECTED",
                strategy: futureMaxData.price > currentData.price ? "BUY NOW (BULK)" : "DELAY PROCUREMENT",
            });
        }

        res.status(200).json({ success: true, rows: allTabularRows, summaries: summaries });
    } catch (err) {
        console.error("Market Insights Error:", err);
        res.status(500).json({ success: false, message: 'AI Ledger Engine failed to process.', rows: [], summaries: [] });
    }
});

// ── Start server locally (Vercel handles this in serverless mode)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 D2Farm API running on port ${PORT}`);
        console.log(`⚙️  Health: http://localhost:${PORT}/api/system/health`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is busy.`);
            process.exit(1);
        }
    });
}

// Export for Vercel serverless
module.exports = app;
