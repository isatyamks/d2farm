require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const Crop = require('./models/Crop');
const Order = require('./models/Order');
const Transaction = require('./models/Transaction');

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

        console.log('🌱 Seeding Orders (Flat Geospatial Model)...');
        const order = await Order.create({
            buyerName: "BigBasket",
            crop: "Onions",
            variety: "Red Nashik",
            quantityRequired: 10,
            unit: "ton",
            priceOffered: 250000,
            location: {
                type: "Point",
                coordinates: [72.8777, 19.076]
            },
            status: "Open"
        });

        console.log('✅ Seeding Complete! The database is now ready.');
        process.exit();

    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
}

seedDatabase();
