require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/d2farm');
  console.log("Connected");
  try {
    await Order.syncIndexes();
    console.log("Indexes synced successfully");
  } catch (e) {
    console.log("Error syncing indexes:", e);
  }
  process.exit();
}
fix();
