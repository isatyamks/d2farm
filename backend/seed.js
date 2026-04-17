require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const Crop = require('./models/Crop');
const Order = require('./models/Order');
const Transaction = require('./models/Transaction');
const FarmerProfile = require('./models/FarmerProfile');
const CropListing = require('./models/CropListing');
const Proposal = require('./models/Proposal');

const DB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/d2farm';

async function seedDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected successfully.');

        console.log('🧹 Clearing existing database...');
        await User.deleteMany({});
        await Crop.deleteMany({});
        await Order.deleteMany({});
        await Transaction.deleteMany({});
        await FarmerProfile.deleteMany({});
        await CropListing.deleteMany({});
        await Proposal.deleteMany({});

        // ─── Seed Buyer Orders (Existing) ───
        console.log('🌱 Seeding Buyer Orders...');
        const orders = await Order.insertMany([
            {
                buyerName: "BigBasket",
                crop: "Onion",
                variety: "Red Nashik",
                quantityRequired: 10000,
                unit: "kg",
                priceOffered: 250000,
                location: { type: "Point", coordinates: [72.8777, 19.076] },
                status: "Open"
            },
            {
                buyerName: "Grand Hotel Kitchens",
                crop: "Tomato",
                variety: "Hybrid",
                quantityRequired: 2000,
                unit: "kg",
                priceOffered: 40000,
                location: { type: "Point", coordinates: [72.8356, 18.9220] },
                status: "Open"
            },
            {
                buyerName: "FreshMart Retail",
                crop: "Potato",
                variety: "Agra Big",
                quantityRequired: 5000,
                unit: "kg",
                priceOffered: 75000,
                location: { type: "Point", coordinates: [73.8567, 18.5204] },
                status: "Open"
            },
            {
                buyerName: "SpiceJet Foods",
                crop: "Wheat",
                variety: "Sharbati",
                quantityRequired: 8000,
                unit: "kg",
                priceOffered: 176000,
                location: { type: "Point", coordinates: [72.8311, 18.9388] },
                status: "Open"
            },
            {
                buyerName: "Zomato Hyperpure",
                crop: "Capsicum",
                variety: "Green",
                quantityRequired: 1500,
                unit: "kg",
                priceOffered: 60000,
                location: { type: "Point", coordinates: [72.8777, 19.0760] },
                status: "Open"
            },
            {
                buyerName: "Reliance Fresh",
                crop: "Rice",
                variety: "Basmati",
                quantityRequired: 15000,
                unit: "kg",
                priceOffered: 900000,
                location: { type: "Point", coordinates: [72.8296, 19.1411] },
                status: "Open"
            }
        ]);

        // ─── Seed Farmer Profiles ───
        console.log('👨‍🌾 Seeding Farmer Profiles...');
        const farmers = await FarmerProfile.insertMany([
            {
                fullName: "Rajesh Kumar Patil",
                phone: "9876543210",
                govId: { type: 'AADHAAR', number: '1234-5678-9012' },
                wallet: { custodialAddress: '0xFa4m3R001d2fArM0000000000000000000000001', balance: 24500, currency: 'INR' },
                farmLocation: { type: "Point", coordinates: [73.7898, 19.9975] },
                farmAddress: "Plot 42, Nashik District, Maharashtra",
                farmSizeAcres: 12,
                blockchainMeta: {
                    farmerIdTokenId: 'fid-001',
                    farmlandTokenId: 'fld-001',
                    mintedAt: new Date(),
                    txHash: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
                },
                onboardingStatus: 'VERIFIED',
                metrics: { trustScore: 95, totalProposals: 12, acceptedProposals: 10, completedDeliveries: 8, rejectedProposals: 2 }
            },
            {
                fullName: "Sunita Devi Sharma",
                phone: "9812345670",
                govId: { type: 'AADHAAR', number: '9876-5432-1098' },
                wallet: { custodialAddress: '0xFa4m3R002d2fArM0000000000000000000000002', balance: 18200, currency: 'INR' },
                farmLocation: { type: "Point", coordinates: [73.8567, 18.5204] },
                farmAddress: "Survey No. 15, Pune District, Maharashtra",
                farmSizeAcres: 8,
                blockchainMeta: {
                    farmerIdTokenId: 'fid-002',
                    farmlandTokenId: 'fld-002',
                    mintedAt: new Date(),
                    txHash: '0x4a44dc15364204a80fe80e9039455cc1608281820af2b2a95b3e218202425021'
                },
                onboardingStatus: 'VERIFIED',
                metrics: { trustScore: 88, totalProposals: 6, acceptedProposals: 5, completedDeliveries: 4, rejectedProposals: 1 }
            }
        ]);

        // ─── Seed Crop Listings ───
        console.log('🌾 Seeding Crop Listings...');
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
        const twoMonths = new Date(now.getFullYear(), now.getMonth() + 2, 15);

        await CropListing.insertMany([
            {
                farmerId: farmers[0]._id,
                category: 'VEGETABLE',
                cropName: 'Onion',
                variety: 'Red Nashik',
                method: 'ORGANIC',
                totalQuantity: 5000,
                unit: 'kg',
                moqRange: { min: 500, max: 5000 },
                harvestDateRange: { start: now, end: nextMonth },
                pricePerUnit: 22,
                status: 'ACTIVE'
            },
            {
                farmerId: farmers[0]._id,
                category: 'VEGETABLE',
                cropName: 'Tomato',
                variety: 'Hybrid',
                method: 'CONVENTIONAL',
                totalQuantity: 3000,
                unit: 'kg',
                moqRange: { min: 200, max: 3000 },
                harvestDateRange: { start: now, end: twoMonths },
                pricePerUnit: 18,
                status: 'ACTIVE'
            },
            {
                farmerId: farmers[1]._id,
                category: 'VEGETABLE',
                cropName: 'Potato',
                variety: 'Agra Big',
                method: 'CONVENTIONAL',
                totalQuantity: 8000,
                unit: 'kg',
                moqRange: { min: 1000, max: 8000 },
                harvestDateRange: { start: nextMonth, end: twoMonths },
                pricePerUnit: 14,
                status: 'ACTIVE'
            },
            {
                farmerId: farmers[1]._id,
                category: 'GRAIN',
                cropName: 'Wheat',
                variety: 'Sharbati',
                method: 'ORGANIC',
                totalQuantity: 10000,
                unit: 'kg',
                moqRange: { min: 2000, max: 10000 },
                harvestDateRange: { start: now, end: twoMonths },
                pricePerUnit: 24,
                status: 'ACTIVE'
            }
        ]);

        // ─── Seed Proposals (with timeline) ───
        console.log('📩 Seeding Proposals...');
        const proposal1 = new Proposal({
            farmerId: farmers[0]._id,
            orderId: orders[0]._id,
            proposedQuantity: 5000,
            proposedPricePerUnit: 22,
            message: 'Fresh organic onions from Nashik, ready for dispatch.',
            status: 'DELIVERED',
            paymentStatus: 'PENDING',
            timeline: [
                { status: 'SENT', timestamp: new Date(Date.now() - 7 * 86400000), note: 'Proposal submitted to buyer' },
                { status: 'ACCEPTED', timestamp: new Date(Date.now() - 5 * 86400000), note: 'BigBasket accepted your proposal' },
                { status: 'LOGISTICS_DISPATCHED', timestamp: new Date(Date.now() - 3 * 86400000), note: 'Shipment picked up from farm gate' },
                { status: 'DELIVERED', timestamp: new Date(Date.now() - 1 * 86400000), note: 'Delivered to BigBasket warehouse' }
            ]
        });
        proposal1.totalValue = proposal1.proposedQuantity * proposal1.proposedPricePerUnit;
        await proposal1.save();

        const proposal2 = new Proposal({
            farmerId: farmers[0]._id,
            orderId: orders[1]._id,
            proposedQuantity: 2000,
            proposedPricePerUnit: 18,
            message: 'Premium hybrid tomatoes, Grade A quality.',
            status: 'ACCEPTED',
            paymentStatus: 'PENDING',
            timeline: [
                { status: 'SENT', timestamp: new Date(Date.now() - 2 * 86400000), note: 'Proposal submitted to buyer' },
                { status: 'ACCEPTED', timestamp: new Date(Date.now() - 1 * 86400000), note: 'Grand Hotel accepted your proposal' }
            ]
        });
        proposal2.totalValue = proposal2.proposedQuantity * proposal2.proposedPricePerUnit;
        await proposal2.save();

        console.log('✅ Seeding Complete! The database is now ready.');
        console.log(`   📦 ${orders.length} Buyer Orders`);
        console.log(`   👨‍🌾 ${farmers.length} Farmer Profiles`);
        console.log(`   🌾 4 Crop Listings`);
        console.log(`   📩 2 Proposals with Timeline`);
        process.exit();

    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
}

seedDatabase();
