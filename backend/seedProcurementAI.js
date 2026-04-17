/**
 * ═══════════════════════════════════════════════════════
 *  D2Farm — Procurement AI Database Seeder
 *  Seeds MongoDB with realistic agricultural data
 *  Run: node seedProcurementAI.js
 * ═══════════════════════════════════════════════════════
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const CropProfile = require('./models/CropProfile');
const ConsumptionLog = require('./models/ConsumptionLog');
const Supplier = require('./models/Supplier');
const PriceForecast = require('./models/PriceForecast');

const DB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/d2farm';

// ─── Helper: Random number in range ───
const rand = (min, max) => Math.round(Math.random() * (max - min) + min);
const randFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(1);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Buyer names pool ───
const BUYERS = [
    'Grand Hotel Kitchens', 'FreshMart Superstore', 'SpiceBox Restaurant Chain',
    'Metro Wholesale Club', 'Zomato Cloud Kitchen', 'Swiggy Instamart Hub',
    'Chai Point Cafes', 'Haldiram Distribution', 'BigBasket Warehouse',
    'DMart Fresh Counter', 'ITC Foods Processing', 'Mother Dairy Outlet',
];

// ─── Supplier names pool ───
const SUPPLIER_NAMES = [
    { name: 'Rajesh Kumar', loc: 'Lucknow, UP', dist: 'Lucknow', state: 'Uttar Pradesh' },
    { name: 'Meena Devi', loc: 'Kanpur Dehat, UP', dist: 'Kanpur Dehat', state: 'Uttar Pradesh' },
    { name: 'Vikram Singh', loc: 'Bithoor, UP', dist: 'Kanpur Nagar', state: 'Uttar Pradesh' },
    { name: 'Sunita Patel', loc: 'Unnao, UP', dist: 'Unnao', state: 'Uttar Pradesh' },
    { name: 'Ramesh Yadav', loc: 'Barabanki, UP', dist: 'Barabanki', state: 'Uttar Pradesh' },
    { name: 'Asha Kumari', loc: 'Sitapur, UP', dist: 'Sitapur', state: 'Uttar Pradesh' },
    { name: 'Mahesh Tiwari', loc: 'Hardoi, UP', dist: 'Hardoi', state: 'Uttar Pradesh' },
    { name: 'Geeta Verma', loc: 'Kannauj, UP', dist: 'Kannauj', state: 'Uttar Pradesh' },
    { name: 'Arvind Mishra', loc: 'Fatehpur, UP', dist: 'Fatehpur', state: 'Uttar Pradesh' },
    { name: 'Priya Sharma', loc: 'Rae Bareli, UP', dist: 'Rae Bareli', state: 'Uttar Pradesh' },
    { name: 'Deepak Gupta', loc: 'Allahabad, UP', dist: 'Prayagraj', state: 'Uttar Pradesh' },
    { name: 'Kavita Rani', loc: 'Varanasi, UP', dist: 'Varanasi', state: 'Uttar Pradesh' },
    { name: 'Suresh Chauhan', loc: 'Agra, UP', dist: 'Agra', state: 'Uttar Pradesh' },
    { name: 'Anita Devi', loc: 'Meerut, UP', dist: 'Meerut', state: 'Uttar Pradesh' },
    { name: 'Bhola Nath', loc: 'Jhansi, UP', dist: 'Jhansi', state: 'Uttar Pradesh' },
    { name: 'Sita Ram', loc: 'Moradabad, UP', dist: 'Moradabad', state: 'Uttar Pradesh' },
    { name: 'Kiran Bai', loc: 'Bareilly, UP', dist: 'Bareilly', state: 'Uttar Pradesh' },
    { name: 'Pankaj Dubey', loc: 'Gorakhpur, UP', dist: 'Gorakhpur', state: 'Uttar Pradesh' },
    { name: 'Lakshmi Devi', loc: 'Nashik, MH', dist: 'Nashik', state: 'Maharashtra' },
    { name: 'Ravi Patil', loc: 'Pune, MH', dist: 'Pune', state: 'Maharashtra' },
    { name: 'Ganesh Jadhav', loc: 'Kolhapur, MH', dist: 'Kolhapur', state: 'Maharashtra' },
    { name: 'Shanti Bai', loc: 'Indore, MP', dist: 'Indore', state: 'Madhya Pradesh' },
    { name: 'Mohan Lal', loc: 'Bhopal, MP', dist: 'Bhopal', state: 'Madhya Pradesh' },
    { name: 'Pushpa Kumari', loc: 'Patna, BR', dist: 'Patna', state: 'Bihar' },
    { name: 'Raju Mandal', loc: 'Muzaffarpur, BR', dist: 'Muzaffarpur', state: 'Bihar' },
];

// ─── Crop Profiles Data ───
const CROP_PROFILES = [
    {
        name: 'Tomato', varieties: ['Hybrid', 'Cherry', 'Roma', 'Desi', 'Green'],
        category: 'perishable', seasonality: 'high', shelfLife: '3-4 days',
        refrigerationRequired: true, basePrice: 18, baseCost: 12, mspPrice: 0,
        avgMonthlyConsumption: 3200, peakSeasonMonths: [3, 4, 5, 10, 11],
        riskFactors: ['weather', 'pest', 'transport_delay', 'cold_chain_failure'],
        iconEmoji: '🍅', colorHex: '#EF4444',
    },
    {
        name: 'Onion', varieties: ['Red Nashik', 'White', 'Yellow', 'Spring Onion', 'Shallot'],
        category: 'semi-perishable', seasonality: 'medium', shelfLife: '15-20 days',
        refrigerationRequired: false, basePrice: 25, baseCost: 18, mspPrice: 0,
        avgMonthlyConsumption: 2800, peakSeasonMonths: [9, 10, 11, 12],
        riskFactors: ['weather', 'storage_rot', 'export_ban'],
        iconEmoji: '🧅', colorHex: '#D97706',
    },
    {
        name: 'Potato', varieties: ['Agra Big', 'Kufri Jyoti', 'Sweet Potato', 'Baby Potato', 'Red Potato'],
        category: 'stable', seasonality: 'low', shelfLife: '30-45 days',
        refrigerationRequired: false, basePrice: 15, baseCost: 10, mspPrice: 0,
        avgMonthlyConsumption: 4100, peakSeasonMonths: [1, 2, 3, 11, 12],
        riskFactors: ['frost', 'blight', 'overproduction'],
        iconEmoji: '🥔', colorHex: '#92400E',
    },
    {
        name: 'Wheat', varieties: ['Sharbati', 'Durum', 'Lokwan', 'Sujata', 'HD-2967'],
        category: 'stable', seasonality: 'low', shelfLife: '180+ days',
        refrigerationRequired: false, basePrice: 28, baseCost: 22, mspPrice: 22.75,
        avgMonthlyConsumption: 5200, peakSeasonMonths: [4, 5],
        riskFactors: ['heatwave', 'rain_delay', 'storage_pest'],
        iconEmoji: '🌾', colorHex: '#CA8A04',
    },
    {
        name: 'Rice', varieties: ['Basmati', 'Sona Masuri', 'Kolam', 'Indrayani', 'Ponni'],
        category: 'stable', seasonality: 'low', shelfLife: '180+ days',
        refrigerationRequired: false, basePrice: 35, baseCost: 26, mspPrice: 21.83,
        avgMonthlyConsumption: 4800, peakSeasonMonths: [10, 11, 12],
        riskFactors: ['flood', 'drought', 'export_policy'],
        iconEmoji: '🍚', colorHex: '#F5F5DC',
    },
    {
        name: 'Carrot', varieties: ['Ooty', 'Delhi Red', 'Orange', 'Black Carrot', 'Nantes'],
        category: 'perishable', seasonality: 'medium', shelfLife: '7-10 days',
        refrigerationRequired: true, basePrice: 22, baseCost: 14, mspPrice: 0,
        avgMonthlyConsumption: 1600, peakSeasonMonths: [11, 12, 1, 2],
        riskFactors: ['pest', 'weather', 'cold_chain_failure'],
        iconEmoji: '🥕', colorHex: '#EA580C',
    },
    {
        name: 'Capsicum', varieties: ['Green', 'Red', 'Yellow', 'Simla Big', 'Orange'],
        category: 'perishable', seasonality: 'high', shelfLife: '5-7 days',
        refrigerationRequired: true, basePrice: 40, baseCost: 28, mspPrice: 0,
        avgMonthlyConsumption: 900, peakSeasonMonths: [3, 4, 5, 6],
        riskFactors: ['greenhouse_failure', 'pest', 'cold_chain_failure'],
        iconEmoji: '🫑', colorHex: '#16A34A',
    },
    {
        name: 'Cabbage', varieties: ['Green', 'Purple', 'Savoy', 'Napa', 'Bok Choy'],
        category: 'semi-perishable', seasonality: 'medium', shelfLife: '10-14 days',
        refrigerationRequired: false, basePrice: 12, baseCost: 7, mspPrice: 0,
        avgMonthlyConsumption: 1800, peakSeasonMonths: [11, 12, 1, 2, 3],
        riskFactors: ['pest', 'overproduction', 'rain_damage'],
        iconEmoji: '🥬', colorHex: '#22C55E',
    },
    {
        name: 'Garlic', varieties: ['Ooty Single Clove', 'Mandsaur', 'Jamnagar', 'Desi', 'Elephant'],
        category: 'stable', seasonality: 'low', shelfLife: '60-90 days',
        refrigerationRequired: false, basePrice: 60, baseCost: 40, mspPrice: 0,
        avgMonthlyConsumption: 600, peakSeasonMonths: [2, 3, 4],
        riskFactors: ['import_competition', 'storage_pest', 'demand_spike'],
        iconEmoji: '🧄', colorHex: '#E2E8F0',
    },
    {
        name: 'Ginger', varieties: ['Kochi', 'Assam', 'Bangalore', 'Himalayan', 'Dry Ginger'],
        category: 'semi-perishable', seasonality: 'medium', shelfLife: '20-30 days',
        refrigerationRequired: false, basePrice: 55, baseCost: 35, mspPrice: 0,
        avgMonthlyConsumption: 500, peakSeasonMonths: [12, 1, 2],
        riskFactors: ['weather', 'disease', 'storage_quality'],
        iconEmoji: '🫚', colorHex: '#F59E0B',
    },
    {
        name: 'Cauliflower', varieties: ['Snowball', 'Early Kunwari', 'Pusa Snowball', 'Hybrid White'],
        category: 'perishable', seasonality: 'high', shelfLife: '4-6 days',
        refrigerationRequired: true, basePrice: 20, baseCost: 12, mspPrice: 0,
        avgMonthlyConsumption: 1400, peakSeasonMonths: [11, 12, 1, 2],
        riskFactors: ['frost', 'pest', 'transport_delay'],
        iconEmoji: '🥦', colorHex: '#FAFAF9',
    },
    {
        name: 'Spinach', varieties: ['Palak', 'Baby Spinach', 'Savoy', 'Flat Leaf'],
        category: 'perishable', seasonality: 'high', shelfLife: '2-3 days',
        refrigerationRequired: true, basePrice: 15, baseCost: 8, mspPrice: 0,
        avgMonthlyConsumption: 800, peakSeasonMonths: [11, 12, 1, 2, 3],
        riskFactors: ['rain_damage', 'pest', 'wilting'],
        iconEmoji: '🥬', colorHex: '#15803D',
    },
];

async function seedProcurementAI() {
    try {
        console.log('\n═══════════════════════════════════════════════');
        console.log('  🌱 D2FARM — PROCUREMENT AI DATABASE SEEDER');
        console.log('═══════════════════════════════════════════════\n');

        console.log('🔄 Connecting to MongoDB...');
        console.log(`   URI: ${DB_URI.replace(/:([^@]+)@/, ':****@')}`);
        await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected successfully.\n');

        // ─── Clear Procurement AI collections ───
        console.log('🧹 Clearing Procurement AI collections...');
        await CropProfile.deleteMany({});
        await ConsumptionLog.deleteMany({});
        await Supplier.deleteMany({});
        await PriceForecast.deleteMany({});
        console.log('   ✓ Collections cleared.\n');

        // ═══════════════════════════════════════
        // 1. SEED CROP PROFILES (12 crops)
        // ═══════════════════════════════════════
        console.log('📦 Seeding Crop Profiles...');
        const insertedCrops = await CropProfile.insertMany(CROP_PROFILES);
        console.log(`   ✓ ${insertedCrops.length} crop profiles inserted.\n`);

        // ═══════════════════════════════════════
        // 2. SEED CONSUMPTION LOGS (90 days × 12 crops = ~1000+ records)
        // ═══════════════════════════════════════
        console.log('📊 Generating Consumption Logs (90 days of history)...');
        const consumptionLogs = [];
        const today = new Date();

        for (const crop of CROP_PROFILES) {
            // Generate 90 days of consumption data
            for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
                // Not every crop is ordered every day — simulate irregular ordering
                const orderProbability = crop.avgMonthlyConsumption > 3000 ? 0.85 : (crop.avgMonthlyConsumption > 1000 ? 0.6 : 0.4);
                if (Math.random() > orderProbability) continue;

                const orderDate = new Date(today);
                orderDate.setDate(orderDate.getDate() - dayOffset);

                // Seasonal price variation
                const month = orderDate.getMonth() + 1;
                const isPeakSeason = crop.peakSeasonMonths.includes(month);
                const seasonalMultiplier = isPeakSeason ? (0.85 + Math.random() * 0.1) : (1.05 + Math.random() * 0.15);

                const pricePerKg = +(crop.basePrice * seasonalMultiplier + (Math.random() * 4 - 2)).toFixed(1);
                const dailyQty = Math.round((crop.avgMonthlyConsumption / 30) * (0.7 + Math.random() * 0.6));
                const supplier = pick(SUPPLIER_NAMES);

                consumptionLogs.push({
                    cropName: crop.name,
                    buyerName: pick(BUYERS),
                    quantityKg: dailyQty,
                    pricePerKg: Math.max(crop.baseCost * 0.9, pricePerKg),
                    totalCost: Math.round(dailyQty * pricePerKg),
                    variety: pick(crop.varieties),
                    orderDate: orderDate,
                    deliveryDate: new Date(orderDate.getTime() + (rand(1, 3) * 24 * 60 * 60 * 1000)),
                    weekNumber: Math.ceil((dayOffset > 0 ? 90 - dayOffset : 90) / 7),
                    monthNumber: orderDate.getMonth() + 1,
                    qualityScore: randFloat(3.5, 5.0),
                    fulfillmentStatus: Math.random() > 0.08 ? 'completed' : (Math.random() > 0.5 ? 'partial' : 'cancelled'),
                    spoilagePercentage: crop.category === 'perishable' ? randFloat(0, 8) : randFloat(0, 2),
                    supplierName: supplier.name,
                    supplierLocation: supplier.loc,
                });
            }
        }

        // Batch insert in chunks (MongoDB has a 16MB limit)
        const CHUNK_SIZE = 500;
        for (let i = 0; i < consumptionLogs.length; i += CHUNK_SIZE) {
            await ConsumptionLog.insertMany(consumptionLogs.slice(i, i + CHUNK_SIZE));
        }
        console.log(`   ✓ ${consumptionLogs.length} consumption logs inserted (90 days × 12 crops).\n`);

        // ═══════════════════════════════════════
        // 3. SEED SUPPLIERS (25 suppliers, each serves 2-5 crops)
        // ═══════════════════════════════════════
        console.log('👨‍🌾 Seeding Suppliers...');
        const suppliers = SUPPLIER_NAMES.map((s, i) => {
            // Each supplier serves 2-5 random crops
            const numCrops = rand(2, 5);
            const shuffled = [...CROP_PROFILES].sort(() => Math.random() - 0.5);
            const cropsForSupplier = shuffled.slice(0, numCrops);

            return {
                name: s.name,
                businessType: i < 18 ? 'farmer' : (i < 22 ? 'aggregator' : 'cooperative'),
                location: s.loc,
                state: s.state,
                district: s.dist,
                phone: `+91 ${rand(70000, 99999)} ${rand(10000, 99999)}`,
                email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@farm.in`,
                rating: randFloat(3.8, 5.0),
                totalDeliveries: rand(20, 300),
                onTimeDeliveryRate: rand(85, 99),
                reliability: rand(82, 99),
                cropsSupplied: cropsForSupplier.map(crop => ({
                    cropName: crop.name,
                    avgPricePerKg: +(crop.basePrice * (0.88 + Math.random() * 0.2)).toFixed(1),
                    maxCapacityKg: rand(200, 5000),
                    qualityGrade: pick(['A', 'A', 'A', 'B', 'B']), // Weighted toward A
                })),
                isVerified: Math.random() > 0.15,
                verifiedAt: Math.random() > 0.15 ? new Date(today.getTime() - rand(30, 365) * 86400000) : null,
                documentsSubmitted: Math.random() > 0.1,
                coordinates: {
                    lat: randFloat(25.5, 28.8),
                    lng: randFloat(78.0, 84.0),
                },
            };
        });

        await Supplier.insertMany(suppliers);
        console.log(`   ✓ ${suppliers.length} suppliers inserted.\n`);

        // ═══════════════════════════════════════
        // 4. SEED PRICE FORECASTS (4 weeks × 12 crops = 48 records)
        // ═══════════════════════════════════════
        console.log('🔮 Generating Price Forecasts...');
        const forecasts = [];

        for (const crop of CROP_PROFILES) {
            for (let w = 1; w <= 4; w++) {
                const demandNoise = 1 + (Math.random() * 0.2 - 0.08);
                const priceShift = 1 + (Math.random() * 0.25 - 0.1);
                const needKg = Math.round((crop.avgMonthlyConsumption / 4) * demandNoise);
                const price = +(crop.basePrice * priceShift).toFixed(1);
                const confidence = Math.max(60, Math.floor(95 - (w * 6) + rand(0, 8)));

                const validUntil = new Date(today);
                validUntil.setDate(validUntil.getDate() + (w * 7));

                forecasts.push({
                    cropName: crop.name,
                    weekNumber: w,
                    weekLabel: w === 1 ? 'Current Week' : `Week ${w}`,
                    predictedNeedKg: needKg,
                    expectedPricePerKg: price,
                    confidence: confidence,
                    supplyOutlook: priceShift > 1.1 ? 'tight' : (priceShift < 0.95 ? 'surplus' : 'balanced'),
                    modelVersion: 'v1.2',
                    generatedAt: new Date(),
                    validUntil: validUntil,
                    factors: {
                        weatherImpact: randFloat(-0.5, 0.5),
                        demandSurge: randFloat(-0.3, 0.8),
                        supplyDisruption: randFloat(-0.2, 0.6),
                        seasonalAdjustment: randFloat(-0.4, 0.4),
                    },
                });
            }
        }

        await PriceForecast.insertMany(forecasts);
        console.log(`   ✓ ${forecasts.length} price forecasts inserted.\n`);

        // ═══════════════════════════════════════
        // SUMMARY
        // ═══════════════════════════════════════
        console.log('═══════════════════════════════════════════════');
        console.log('  ✅ SEEDING COMPLETE!');
        console.log('═══════════════════════════════════════════════');
        console.log(`  📦 Crop Profiles:     ${insertedCrops.length}`);
        console.log(`  📊 Consumption Logs:  ${consumptionLogs.length}`);
        console.log(`  👨‍🌾 Suppliers:         ${suppliers.length}`);
        console.log(`  🔮 Price Forecasts:   ${forecasts.length}`);
        console.log(`  ─────────────────────────────────────────`);
        console.log(`  📁 Total Documents:   ${insertedCrops.length + consumptionLogs.length + suppliers.length + forecasts.length}`);
        console.log('═══════════════════════════════════════════════\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ SEEDING ERROR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seedProcurementAI();
