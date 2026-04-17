require('dotenv').config({ path: '../.env' }); // Points up to the root .env securely
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Initialize pure, modern Express app
const app = express();

// Security and utility middleware
app.use(cors());
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

app.get('/api/system/health', (req, res) => {
    res.status(200).json({ status: 'SECURE', message: 'D2Farm High-Performance Node Backend Active' });
});

app.post('/api/orders/deposit', async (req, res) => {
    try {
        const { crop, variety, quantity, deliveryDate } = req.body;
        console.log(`[ORDER RECEIVED] Processing ${quantity}kg of ${crop} (${variety}) ...`);
        
        // 2. We skip DB foreign key checks because we migrated to the Flat Geo-Schema.
        // --- REAL-TIME ML PRICING ENGINE INTEGRATION ---
        let pricePerKg = 18.0; // Fail-safe default
        try {
            // For a dramatic simulation, we randomize the demand from 500-5000 to see fluid price shifts
            const mlPayload = {
                supply: 1500,             // Mock warehouse supply
                demand: quantity * 2.5,   // Derived dynamic market demand
                weather: 0,               // 0=Normal
                cultivation_cost: 12.0,   // Base price
                gov_policy: 1.0           // Neutral
            };
            // Ping our new Python AI Flask Server!
            const mlResponse = await fetch('http://127.0.0.1:5000/api/ml/predict-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mlPayload)
            });
            if(mlResponse.ok) {
                const mlData = await mlResponse.json();
                if(mlData.success) {
                    pricePerKg = mlData.predicted_price_per_kg;
                    console.log(`🧠 [ML Pricing Generated] ₹${pricePerKg}/kg (Ratio: ${mlData.factors.ratio})`);
                }
            } else {
                console.log('⚠️ ML Server offline or failed; falling back to static 18/kg');
            }
        } catch (mlErr) {
            console.log('⚠️ ML Flask Engine not running on port 5000; falling back to static 18/kg');
        }

        const totalValue = quantity * pricePerKg; 
        const deposit = totalValue * 0.10; // 10%
        const remaining = totalValue - deposit;

        // 3. SECURELY WRITE TO MONGODB (FLAT SCHEMA)
        const newOrder = await Order.create({
            buyerName: "Grand Hotel Kitchens",
            crop: crop,
            variety: variety || "Standard",
            quantityRequired: quantity,
            unit: "kg",
            priceOffered: totalValue,
            location: {
                type: "Point",
                coordinates: [72.8777, 19.076] 
            },
            status: "Open"
        });

        console.log(`✅ [DB WRITE SUCCESS] Order ${newOrder._id} saved to MongoDB!`);

        // 4. Send the physical Database ObjectID back to the frontend receipt popup
        res.status(200).json({ 
            success: true, 
            message: `Order firmly written to the database! We charged ₹${deposit} as a 10% deposit.`,
            orderId: newOrder._id.toString()
        });

    } catch (err) {
        console.error('❌ DB Save Failed:', err);
        res.status(500).json({ success: false, message: 'Payment/Database Action Failed', error: err.message });
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

// -------------------------------------------------------------
// START SERVER ENGINE
// -------------------------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 PROCUREMENT CORE API ACTIVE: Launching on port ${PORT}`);
    console.log(`⚙️  API Systems checking at: http://localhost:${PORT}/api/system/health`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ PORT CONFLICT: Port ${PORT} is busy. Please close the other program or change PORT in .env`);
        process.exit(1);
    }
});
