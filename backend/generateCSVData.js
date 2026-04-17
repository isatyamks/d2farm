/**
 * ═══════════════════════════════════════════════════════
 *  D2Farm — CSV Data Generator
 *  Generates realistic CSV data files for Procurement AI
 *  Run: node generateCSVData.js
 *  No MongoDB needed!
 * ═══════════════════════════════════════════════════════
 */
const { writeCSV, appendCSV, DATA_DIR } = require('./csvUtil');
const path = require('path');

const rand = (min, max) => Math.round(Math.random() * (max - min) + min);
const randFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(1);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Buyer names ───
const BUYERS = [
    'Grand Hotel Kitchens', 'FreshMart Superstore', 'SpiceBox Restaurant Chain',
    'Metro Wholesale Club', 'Zomato Cloud Kitchen', 'Swiggy Instamart Hub',
    'Chai Point Cafes', 'Haldiram Distribution', 'BigBasket Warehouse',
    'DMart Fresh Counter', 'ITC Foods Processing', 'Mother Dairy Outlet',
];

// ─── Supplier pool ───
const SUPPLIERS_RAW = [
    { name: 'Rajesh Kumar', location: 'Lucknow UP', state: 'Uttar Pradesh', rating: 4.8, deliveries: 142, reliability: 98 },
    { name: 'Meena Devi', location: 'Kanpur Dehat UP', state: 'Uttar Pradesh', rating: 4.6, deliveries: 98, reliability: 95 },
    { name: 'Vikram Singh', location: 'Bithoor UP', state: 'Uttar Pradesh', rating: 4.5, deliveries: 76, reliability: 92 },
    { name: 'Sunita Patel', location: 'Unnao UP', state: 'Uttar Pradesh', rating: 4.7, deliveries: 120, reliability: 96 },
    { name: 'Ramesh Yadav', location: 'Barabanki UP', state: 'Uttar Pradesh', rating: 4.3, deliveries: 55, reliability: 88 },
    { name: 'Asha Kumari', location: 'Sitapur UP', state: 'Uttar Pradesh', rating: 4.4, deliveries: 67, reliability: 90 },
    { name: 'Mahesh Tiwari', location: 'Hardoi UP', state: 'Uttar Pradesh', rating: 4.2, deliveries: 43, reliability: 85 },
    { name: 'Geeta Verma', location: 'Kannauj UP', state: 'Uttar Pradesh', rating: 4.6, deliveries: 89, reliability: 94 },
    { name: 'Arvind Mishra', location: 'Fatehpur UP', state: 'Uttar Pradesh', rating: 4.1, deliveries: 32, reliability: 82 },
    { name: 'Priya Sharma', location: 'Rae Bareli UP', state: 'Uttar Pradesh', rating: 4.9, deliveries: 210, reliability: 99 },
    { name: 'Deepak Gupta', location: 'Prayagraj UP', state: 'Uttar Pradesh', rating: 4.4, deliveries: 72, reliability: 91 },
    { name: 'Kavita Rani', location: 'Varanasi UP', state: 'Uttar Pradesh', rating: 4.5, deliveries: 80, reliability: 93 },
    { name: 'Suresh Chauhan', location: 'Agra UP', state: 'Uttar Pradesh', rating: 4.3, deliveries: 58, reliability: 87 },
    { name: 'Anita Devi', location: 'Meerut UP', state: 'Uttar Pradesh', rating: 4.7, deliveries: 115, reliability: 97 },
    { name: 'Bhola Nath', location: 'Jhansi UP', state: 'Uttar Pradesh', rating: 4.0, deliveries: 28, reliability: 80 },
    { name: 'Lakshmi Devi', location: 'Nashik MH', state: 'Maharashtra', rating: 4.8, deliveries: 165, reliability: 98 },
    { name: 'Ravi Patil', location: 'Pune MH', state: 'Maharashtra', rating: 4.6, deliveries: 95, reliability: 94 },
    { name: 'Ganesh Jadhav', location: 'Kolhapur MH', state: 'Maharashtra', rating: 4.5, deliveries: 78, reliability: 92 },
    { name: 'Shanti Bai', location: 'Indore MP', state: 'Madhya Pradesh', rating: 4.4, deliveries: 65, reliability: 89 },
    { name: 'Mohan Lal', location: 'Bhopal MP', state: 'Madhya Pradesh', rating: 4.3, deliveries: 50, reliability: 86 },
    { name: 'Pushpa Kumari', location: 'Patna BR', state: 'Bihar', rating: 4.2, deliveries: 40, reliability: 84 },
    { name: 'Raju Mandal', location: 'Muzaffarpur BR', state: 'Bihar', rating: 4.1, deliveries: 35, reliability: 83 },
    { name: 'Kiran Bai', location: 'Bareilly UP', state: 'Uttar Pradesh', rating: 4.5, deliveries: 75, reliability: 91 },
    { name: 'Pankaj Dubey', location: 'Gorakhpur UP', state: 'Uttar Pradesh', rating: 4.3, deliveries: 60, reliability: 88 },
    { name: 'Sita Ram', location: 'Moradabad UP', state: 'Uttar Pradesh', rating: 4.4, deliveries: 70, reliability: 90 },
];

// ─── Crop profiles ───
const CROPS = [
    { name: 'Tomato', category: 'perishable', seasonality: 'high', shelfLife: '3-4 days', refrigeration: true, basePrice: 18, baseCost: 12, avgMonthlyConsumption: 3200, peakMonths: '3,4,5,10,11', varieties: 'Hybrid|Cherry|Roma|Desi|Green' },
    { name: 'Onion', category: 'semi-perishable', seasonality: 'medium', shelfLife: '15-20 days', refrigeration: false, basePrice: 25, baseCost: 18, avgMonthlyConsumption: 2800, peakMonths: '9,10,11,12', varieties: 'Red Nashik|White|Yellow|Spring Onion' },
    { name: 'Potato', category: 'stable', seasonality: 'low', shelfLife: '30-45 days', refrigeration: false, basePrice: 15, baseCost: 10, avgMonthlyConsumption: 4100, peakMonths: '1,2,3,11,12', varieties: 'Agra Big|Kufri Jyoti|Sweet Potato|Baby Potato' },
    { name: 'Wheat', category: 'stable', seasonality: 'low', shelfLife: '180+ days', refrigeration: false, basePrice: 28, baseCost: 22, avgMonthlyConsumption: 5200, peakMonths: '4,5', varieties: 'Sharbati|Durum|Lokwan|Sujata' },
    { name: 'Rice', category: 'stable', seasonality: 'low', shelfLife: '180+ days', refrigeration: false, basePrice: 35, baseCost: 26, avgMonthlyConsumption: 4800, peakMonths: '10,11,12', varieties: 'Basmati|Sona Masuri|Kolam|Indrayani' },
    { name: 'Carrot', category: 'perishable', seasonality: 'medium', shelfLife: '7-10 days', refrigeration: true, basePrice: 22, baseCost: 14, avgMonthlyConsumption: 1600, peakMonths: '11,12,1,2', varieties: 'Ooty|Delhi Red|Orange|Nantes' },
    { name: 'Capsicum', category: 'perishable', seasonality: 'high', shelfLife: '5-7 days', refrigeration: true, basePrice: 40, baseCost: 28, avgMonthlyConsumption: 900, peakMonths: '3,4,5,6', varieties: 'Green|Red|Yellow|Simla Big' },
    { name: 'Cabbage', category: 'semi-perishable', seasonality: 'medium', shelfLife: '10-14 days', refrigeration: false, basePrice: 12, baseCost: 7, avgMonthlyConsumption: 1800, peakMonths: '11,12,1,2,3', varieties: 'Green|Purple|Savoy|Napa' },
    { name: 'Garlic', category: 'stable', seasonality: 'low', shelfLife: '60-90 days', refrigeration: false, basePrice: 60, baseCost: 40, avgMonthlyConsumption: 600, peakMonths: '2,3,4', varieties: 'Single Clove|Mandsaur|Jamnagar|Desi' },
    { name: 'Ginger', category: 'semi-perishable', seasonality: 'medium', shelfLife: '20-30 days', refrigeration: false, basePrice: 55, baseCost: 35, avgMonthlyConsumption: 500, peakMonths: '12,1,2', varieties: 'Kochi|Assam|Bangalore|Himalayan' },
    { name: 'Cauliflower', category: 'perishable', seasonality: 'high', shelfLife: '4-6 days', refrigeration: true, basePrice: 20, baseCost: 12, avgMonthlyConsumption: 1400, peakMonths: '11,12,1,2', varieties: 'Snowball|Pusa|Hybrid White' },
    { name: 'Spinach', category: 'perishable', seasonality: 'high', shelfLife: '2-3 days', refrigeration: true, basePrice: 15, baseCost: 8, avgMonthlyConsumption: 800, peakMonths: '11,12,1,2,3', varieties: 'Palak|Baby Spinach|Flat Leaf' },
];

function generate() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  📁 D2FARM — CSV DATA GENERATOR');
    console.log('═══════════════════════════════════════════════\n');

    // ─── 1. Crop Profiles ───
    console.log('📦 Writing crop_profiles.csv...');
    writeCSV('crop_profiles.csv', CROPS);
    console.log(`   ✓ ${CROPS.length} crops written.\n`);

    // ─── 2. Suppliers ───
    console.log('👨‍🌾 Writing suppliers.csv...');
    const suppliers = SUPPLIERS_RAW.map(s => {
        // Each supplier serves 2-4 random crops
        const numCrops = rand(2, 4);
        const shuffled = [...CROPS].sort(() => Math.random() - 0.5);
        const crops = shuffled.slice(0, numCrops).map(c => c.name).join('|');
        const prices = shuffled.slice(0, numCrops).map(c => randFloat(c.basePrice * 0.88, c.basePrice * 1.08)).join('|');
        return {
            ...s,
            cropsSupplied: crops,
            avgPrices: prices,
            verified: Math.random() > 0.15,
        };
    });
    writeCSV('suppliers.csv', suppliers);
    console.log(`   ✓ ${suppliers.length} suppliers written.\n`);

    // ─── 3. Consumption Logs (90 days of history) ───
    console.log('📊 Generating consumption_logs.csv (90 days)...');
    const logs = [];
    const today = new Date();

    for (const crop of CROPS) {
        for (let dayOffset = 90; dayOffset >= 1; dayOffset--) {
            // Not every crop ordered every day
            const prob = crop.avgMonthlyConsumption > 3000 ? 0.85 : (crop.avgMonthlyConsumption > 1000 ? 0.6 : 0.4);
            if (Math.random() > prob) continue;

            const orderDate = new Date(today);
            orderDate.setDate(orderDate.getDate() - dayOffset);
            const dateStr = orderDate.toISOString().split('T')[0];

            const month = orderDate.getMonth() + 1;
            const peakMonths = crop.peakMonths.split(',').map(Number);
            const isPeak = peakMonths.includes(month);
            const seasonMultiplier = isPeak ? (0.85 + Math.random() * 0.1) : (1.05 + Math.random() * 0.15);

            const pricePerKg = +(crop.basePrice * seasonMultiplier + (Math.random() * 4 - 2)).toFixed(1);
            const qty = Math.round((crop.avgMonthlyConsumption / 30) * (0.7 + Math.random() * 0.6));
            const supplier = pick(SUPPLIERS_RAW);
            const variety = pick(crop.varieties.split('|'));

            logs.push({
                id: `LOG-${Date.now()}-${rand(1000, 9999)}`,
                cropName: crop.name,
                variety: variety,
                buyerName: pick(BUYERS),
                quantityKg: qty,
                pricePerKg: Math.max(crop.baseCost * 0.9, pricePerKg),
                totalCost: Math.round(qty * Math.max(crop.baseCost * 0.9, pricePerKg)),
                orderDate: dateStr,
                deliveryDate: new Date(orderDate.getTime() + rand(1, 3) * 86400000).toISOString().split('T')[0],
                fulfillmentStatus: Math.random() > 0.08 ? 'completed' : (Math.random() > 0.5 ? 'partial' : 'cancelled'),
                qualityScore: randFloat(3.5, 5.0),
                spoilagePercent: crop.category === 'perishable' ? randFloat(0, 8) : randFloat(0, 2),
                supplierName: supplier.name,
                supplierLocation: supplier.location,
            });
        }
    }

    writeCSV('consumption_logs.csv', logs);
    console.log(`   ✓ ${logs.length} consumption logs written.\n`);

    // ─── 4. Price Forecasts ───
    console.log('🔮 Generating price_forecasts.csv...');
    const forecasts = [];
    for (const crop of CROPS) {
        for (let w = 1; w <= 4; w++) {
            const priceShift = 1 + (Math.random() * 0.25 - 0.1);
            const needKg = Math.round((crop.avgMonthlyConsumption / 4) * (1 + Math.random() * 0.2 - 0.08));
            const price = +(crop.basePrice * priceShift).toFixed(1);
            const confidence = Math.max(60, Math.floor(95 - (w * 6) + rand(0, 8)));

            forecasts.push({
                cropName: crop.name,
                weekNumber: w,
                weekLabel: w === 1 ? 'Current Week' : `Week ${w}`,
                predictedNeedKg: needKg,
                expectedPricePerKg: price,
                confidence: confidence,
                supplyOutlook: priceShift > 1.1 ? 'tight' : (priceShift < 0.95 ? 'surplus' : 'balanced'),
            });
        }
    }
    writeCSV('price_forecasts.csv', forecasts);
    console.log(`   ✓ ${forecasts.length} forecasts written.\n`);

    // ─── Summary ───
    console.log('═══════════════════════════════════════════════');
    console.log('  ✅ CSV GENERATION COMPLETE!');
    console.log('═══════════════════════════════════════════════');
    console.log(`  📦 Crop Profiles:     ${CROPS.length}`);
    console.log(`  📊 Consumption Logs:  ${logs.length}`);
    console.log(`  👨‍🌾 Suppliers:         ${suppliers.length}`);
    console.log(`  🔮 Price Forecasts:   ${forecasts.length}`);
    console.log(`  ─────────────────────────────────────────`);
    console.log(`  📁 Location: ${DATA_DIR}`);
    console.log('═══════════════════════════════════════════════\n');
}

generate();
