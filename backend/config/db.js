/**
 * config/db.js — MongoDB + Mongoose connection
 *
 * LECTURE COVERAGE:
 *  33-36: Introduction to databases, SQL vs NoSQL,
 *          Connecting MongoDB, Mongoose ODM.
 *
 *  SQL (Relational) — tables, rows, joins, ACID transactions.
 *    Example: PostgreSQL (what Supabase uses for the frontend).
 *
 *  NoSQL (Non-Relational) — documents, flexible schema, horizontal scale.
 *    Example: MongoDB — stores JSON-like documents in "collections".
 *    Perfect for nutrition logs where each meal's shape may vary.
 *
 *  ODM (Object-Document Mapper) = Mongoose.
 *    Mongoose gives us schemas + validation on top of MongoDB's
 *    schema-less documents — best of both worlds.
 */

const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nutriguide";

let isConnected = false;

/**
 * connectDB — idempotent connection helper.
 * Call once at startup; Mongoose manages the connection pool internally.
 */
async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      // Modern Mongoose (v6+) has these on by default; shown here for clarity.
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.warn("   Running without MongoDB — Mongo-backed routes will return 503.");
    // We do NOT call process.exit() — the rest of the app still works.
  }
}

// ── 33-36: SQL vs NoSQL comparison (comment block) ──────────────────────────
/*
  SQL (e.g. PostgreSQL via Supabase)             NoSQL (e.g. MongoDB)
  ─────────────────────────────────────────────  ──────────────────────────────
  Fixed schema (migrations required)             Flexible / schema-optional
  Tables + rows                                  Collections + documents (BSON)
  JOINs for relations                            Embedded documents / $lookup
  ACID by default                                Eventual consistency (tunable)
  Great for structured, relational data          Great for varied / nested data
  Examples: user profiles, transactions          Examples: logs, chat messages
*/

module.exports = { connectDB };
