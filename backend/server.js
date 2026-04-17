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
const { readCSV, appendCSV } = require('./csvUtil');

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

        // 4a. Also log to consumption CSV (feeds Procurement AI)
        try {
            const today = new Date().toISOString().split('T')[0];
            const delDate = deliveryDate || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
            appendCSV('consumption_logs.csv', {
                id: `LOG-${Date.now()}-${Math.floor(Math.random()*9000)+1000}`,
                cropName: crop,
                variety: variety || 'Standard',
                buyerName: 'Grand Hotel Kitchens',
                quantityKg: quantity,
                pricePerKg: pricePerKg,
                totalCost: Math.round(quantity * pricePerKg),
                orderDate: today,
                deliveryDate: delDate,
                fulfillmentStatus: 'completed',
                qualityScore: 4.5,
                spoilagePercent: 0,
                supplierName: 'Auto-Matched',
                supplierLocation: 'Lucknow UP',
            });
            console.log(`📊 [CSV LOG] Order appended to consumption_logs.csv`);
        } catch(csvErr) {
            console.log('⚠️ CSV append failed (non-critical):', csvErr.message);
        }

        // 4b. Send the physical Database ObjectID back to the frontend receipt popup
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
// PROCUREMENT AI DASHBOARD (CSV-Powered — No Database Required)
// Reads from local CSV files in /data folder
// -------------------------------------------------------------
app.get('/api/procurement-ai/dashboard', async (req, res) => {
    try {
        const cropFilter = req.query.crop || 'Tomato';

        // ─── 1. Read Crop Profiles from CSV ───
        const allCrops = readCSV('crop_profiles.csv');
        const cropInfo = allCrops.find(c => c.name === cropFilter);
        if (!cropInfo) {
            return res.status(404).json({ success: false, message: `Crop '${cropFilter}' not found in CSV data. Run: node generateCSVData.js` });
        }

        // ─── 2. Read & Filter Consumption Logs from CSV ───
        const allLogs = readCSV('consumption_logs.csv');
        const today = new Date();
        const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30);
        const sixtyDaysAgo = new Date(today); sixtyDaysAgo.setDate(today.getDate() - 60);

        const cropLogs = allLogs.filter(l => l.cropName === cropFilter);
        const current30d = cropLogs.filter(l => l.fulfillmentStatus === 'completed' && new Date(l.orderDate) >= thirtyDaysAgo);
        const prev30d = cropLogs.filter(l => l.fulfillmentStatus === 'completed' && new Date(l.orderDate) >= sixtyDaysAgo && new Date(l.orderDate) < thirtyDaysAgo);

        // Aggregate consumption
        const totalConsumption30d = current30d.reduce((sum, l) => sum + (l.quantityKg || 0), 0) || cropInfo.avgMonthlyConsumption;
        const prevConsumption = prev30d.reduce((sum, l) => sum + (l.quantityKg || 0), 0) || totalConsumption30d;
        const consumptionChange = prevConsumption > 0 ? +(((totalConsumption30d - prevConsumption) / prevConsumption) * 100).toFixed(1) : 0;

        // Avg spoilage
        const avgSpoilage = current30d.length > 0 ? current30d.reduce((s, l) => s + (l.spoilagePercent || 0), 0) / current30d.length : 0;

        // ─── 3. Predicted Need ───
        const demandMultiplier = cropInfo.seasonality === 'high' ? 1.2 : (cropInfo.seasonality === 'medium' ? 1.1 : 1.05);
        const predictedNeed30d = Math.round(totalConsumption30d * demandMultiplier);

        // ─── 4. Procurement Efficiency ───
        const allCropLogs30d = cropLogs.filter(l => new Date(l.orderDate) >= thirtyDaysAgo);
        const totalOrders = allCropLogs30d.length || 1;
        const completedOrders = allCropLogs30d.filter(l => l.fulfillmentStatus === 'completed').length;
        const goodPriceOrders = allCropLogs30d.filter(l => l.pricePerKg <= cropInfo.basePrice).length;
        const efficiency = Math.min(99, Math.round(((completedOrders * 0.5 + goodPriceOrders * 0.5) / totalOrders) * 100));
        const efficiencyMessage = efficiency >= 92 ? 'You are buying at optimal times.' : 'Some orders were placed at peak prices.';

        // ─── 5. Read Weekly Forecasts from CSV ───
        const allForecasts = readCSV('price_forecasts.csv');
        const forecastData = allForecasts
            .filter(f => f.cropName === cropFilter)
            .sort((a, b) => a.weekNumber - b.weekNumber)
            .map(f => ({
                week: f.weekNumber,
                label: f.weekLabel,
                predictedNeedKg: f.predictedNeedKg,
                expectedPricePerKg: f.expectedPricePerKg,
                confidence: f.confidence,
                supplyOutlook: f.supplyOutlook,
            }));

        // ─── 6. AI Recommendations ───
        const recommendations = [];
        const currentPrice = forecastData.length > 0 ? forecastData[0].expectedPricePerKg : cropInfo.basePrice;

        if (forecastData.length > 0) {
            const lowestPriceWeek = forecastData.reduce((best, w) => w.expectedPricePerKg < best.expectedPricePerKg ? w : best, forecastData[0]);
            const highestPriceWeek = forecastData.reduce((worst, w) => w.expectedPricePerKg > worst.expectedPricePerKg ? w : worst, forecastData[0]);

            if (lowestPriceWeek.week !== 1 && lowestPriceWeek.expectedPricePerKg < currentPrice * 0.92) {
                const bulkQty = Math.round(lowestPriceWeek.predictedNeedKg * 0.8);
                const savings = Math.round(bulkQty * (currentPrice - lowestPriceWeek.expectedPricePerKg));
                recommendations.push({
                    id: 'bulk_opportunity', type: 'info', title: 'Bulk Order Opportunity', icon: 'lightbulb',
                    message: `Prices are expected to drop to ₹${lowestPriceWeek.expectedPricePerKg}/kg in ${lowestPriceWeek.label} while your demand peaks at ${lowestPriceWeek.predictedNeedKg}kg.`,
                    action: `Procure ${bulkQty}kg in ${lowestPriceWeek.label} to save ₹${savings}.`,
                    actionType: 'schedule_order', priority: 'high', savingsEstimate: savings,
                });
            }

            if (highestPriceWeek.expectedPricePerKg > currentPrice * 1.08 && highestPriceWeek.week > 1) {
                recommendations.push({
                    id: 'hold_buying', type: 'warning', title: 'Hold Off Buying', icon: 'warning',
                    message: `${highestPriceWeek.label}'s price may spike to ₹${highestPriceWeek.expectedPricePerKg}/kg. Use current inventory of ${cropFilter.toLowerCase()} until the dip.`,
                    action: null, actionType: null, priority: 'medium', savingsEstimate: 0,
                });
            }
        }

        if (cropInfo.category === 'perishable') {
            recommendations.push({
                id: 'cold_storage', type: 'warning', title: 'Cold Storage Advisory', icon: 'thermometer',
                message: `${cropFilter} is perishable (shelf life: ${cropInfo.shelfLife}). Ensure cold-chain logistics for bulk orders.`,
                action: 'Enable refrigerated transport for upcoming orders.',
                actionType: 'transport_settings', priority: 'medium', savingsEstimate: 0,
            });
        }

        if (efficiency >= 90) {
            recommendations.push({
                id: 'efficiency_praise', type: 'success', title: 'Procurement Timing Excellent', icon: 'check-circle',
                message: `Your ${cropFilter} procurement timing is in the top ${100 - efficiency}% — you consistently buy during price dips!`,
                action: null, actionType: null, priority: 'low', savingsEstimate: 0,
            });
        }

        if (avgSpoilage > 3) {
            recommendations.push({
                id: 'spoilage_alert', type: 'warning', title: 'High Spoilage Detected', icon: 'warning',
                message: `Avg spoilage for ${cropFilter} is ${avgSpoilage.toFixed(1)}% over last 30 days. Review cold-chain and delivery windows.`,
                action: 'Optimize delivery scheduling to reduce waste.',
                actionType: 'transport_settings', priority: 'high', savingsEstimate: 0,
            });
        }

        // ─── 7. Read Top Suppliers from CSV ───
        const allSuppliers = readCSV('suppliers.csv');
        const suppliersData = allSuppliers
            .filter(s => s.verified && s.cropsSupplied && s.cropsSupplied.split('|').includes(cropFilter))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5)
            .map(s => {
                const cropIdx = s.cropsSupplied.split('|').indexOf(cropFilter);
                const prices = s.avgPrices ? s.avgPrices.split('|').map(Number) : [];
                return {
                    name: s.name,
                    location: s.location,
                    rating: s.rating,
                    totalDeliveries: s.deliveries,
                    avgPrice: prices[cropIdx] || cropInfo.basePrice,
                    reliability: s.reliability,
                };
            });

        // ─── Response ───
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            source: 'csv',
            cropFilter: cropFilter,
            metrics: {
                totalConsumption: { value: totalConsumption30d, unit: 'kg', period: '30 days', change: consumptionChange },
                predictedNeed: { value: predictedNeed30d, unit: 'kg', period: 'Next 30 days', seasonality: cropInfo.seasonality },
                efficiency: { value: efficiency, message: efficiencyMessage },
                currentPrice: { value: currentPrice, unit: '₹/kg' },
            },
            weeklyForecast: forecastData,
            recommendations: recommendations,
            suppliers: suppliersData,
            availableCrops: allCrops.map(c => c.name),
            _debug: {
                totalLogsInCSV: allLogs.length,
                logsLast30d: current30d.length,
                suppliersFound: suppliersData.length,
            }
        });

    } catch (err) {
        console.error('❌ Procurement AI Error:', err);
        res.status(500).json({ success: false, message: 'Procurement AI Engine failed.', error: err.message });
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
