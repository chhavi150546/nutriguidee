/**
 * scripts/reset-admin.js
 * Run: node scripts/reset-admin.js
 *
 * Lists all users and resets/creates an admin account.
 */

const path   = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const bcrypt   = require("bcrypt");

// ── Config — change these before running ─────────────────────────────────────
const NEW_EMAIL    = "admin@nutriguide.com";
const NEW_PASSWORD = "Admin@123";
const NEW_USERNAME = "admin";
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  const User = require("../models/User");

  // 1. List all existing users
  const users = await User.find({}).select("email username role isEmailVerified createdAt");
  console.log("── Existing users ──────────────────────────────────────");
  if (users.length === 0) {
    console.log("  (no users found)");
  } else {
    users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email}  |  username: ${u.username || "(none)"}  |  role: ${u.role}  |  verified: ${u.isEmailVerified}`);
    });
  }
  console.log("");

  // 2. Upsert admin user (creates if not exists, resets password if exists)
  const hash = await bcrypt.hash(NEW_PASSWORD, 12);

  const existing = await User.findOne({ email: NEW_EMAIL });

  if (existing) {
    existing.password        = hash;
    existing.username        = NEW_USERNAME;
    existing.role            = "admin";
    existing.isEmailVerified = true;
    await existing.save({ validateModifiedOnly: true });
    console.log(`✅ Password reset for existing user: ${NEW_EMAIL}`);
  } else {
    await User.create({
      email:            NEW_EMAIL,
      password:         hash,
      username:         NEW_USERNAME,
      role:             "admin",
      isEmailVerified:  true,
    });
    console.log(`✅ New admin user created: ${NEW_EMAIL}`);
  }

  console.log(`\n── Login credentials ───────────────────────────────────`);
  console.log(`   Email   : ${NEW_EMAIL}`);
  console.log(`   Password: ${NEW_PASSWORD}`);
  console.log(`────────────────────────────────────────────────────────`);
  console.log("\n⚠️  Delete this script after use if you push to GitHub.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => mongoose.disconnect());
