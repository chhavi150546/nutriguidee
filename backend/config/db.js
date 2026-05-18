
const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nutriguide";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      
      serverSelectionTimeoutMS: 5000, //5sec
    });
    isConnected = true;
    console.log(` MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(" MongoDB connection failed:", err.message);
    console.warn("   Running without MongoDB — Mongo-backed routes will return 503.");
    
  }
}

module.exports = { connectDB };
