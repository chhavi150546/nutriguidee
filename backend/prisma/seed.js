/**
 * prisma/seed.js — Seed the Food catalogue with common foods
 *
 * Run with:
 *   node prisma/seed.js
 *
 * What it does:
 *   1. Connects to PostgreSQL via Prisma
 *   2. Upserts 30 common foods (skips if already exists by name)
 *   3. Logs results and disconnects
 *
 * Prisma concept — upsert:
 *   Like MongoDB's { upsert: true } option.
 *   Creates the record if it doesn't exist, updates it if it does.
 *   Avoids duplicate errors when you run the seed multiple times.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SYSTEM_USER = "seed_system";

// Nutritional values are per 100 g
const foods = [
  // ── Fruits ────────────────────────────────────────────────────────────────
  { name: "Apple",       category: "fruit",     calories: 52,  protein: 0.3, carbs: 14.0, fats: 0.2, fibre: 2.4 },
  { name: "Banana",      category: "fruit",     calories: 89,  protein: 1.1, carbs: 23.0, fats: 0.3, fibre: 2.6 },
  { name: "Orange",      category: "fruit",     calories: 47,  protein: 0.9, carbs: 12.0, fats: 0.1, fibre: 2.4 },
  { name: "Grapes",      category: "fruit",     calories: 67,  protein: 0.6, carbs: 17.1, fats: 0.4, fibre: 0.9 },
  { name: "Mango",       category: "fruit",     calories: 60,  protein: 0.8, carbs: 15.0, fats: 0.4, fibre: 1.6 },

  // ── Vegetables ────────────────────────────────────────────────────────────
  { name: "Broccoli",    category: "vegetable", calories: 34,  protein: 2.8, carbs: 7.0,  fats: 0.4, fibre: 2.6 },
  { name: "Spinach",     category: "vegetable", calories: 23,  protein: 2.9, carbs: 3.6,  fats: 0.4, fibre: 2.2 },
  { name: "Carrot",      category: "vegetable", calories: 41,  protein: 0.9, carbs: 9.6,  fats: 0.2, fibre: 2.8 },
  { name: "Sweet Potato",category: "vegetable", calories: 86,  protein: 1.6, carbs: 20.0, fats: 0.1, fibre: 3.0 },
  { name: "Tomato",      category: "vegetable", calories: 18,  protein: 0.9, carbs: 3.9,  fats: 0.2, fibre: 1.2 },

  // ── Proteins ──────────────────────────────────────────────────────────────
  { name: "Chicken Breast (cooked)", category: "protein", calories: 165, protein: 31.0, carbs: 0.0,  fats: 3.6,  fibre: 0.0 },
  { name: "Eggs (whole)",            category: "protein", calories: 155, protein: 13.0, carbs: 1.1,  fats: 11.0, fibre: 0.0 },
  { name: "Salmon (cooked)",         category: "protein", calories: 208, protein: 28.0, carbs: 0.0,  fats: 10.0, fibre: 0.0 },
  { name: "Tuna (canned in water)",  category: "protein", calories: 116, protein: 25.5, carbs: 0.0,  fats: 0.8,  fibre: 0.0 },
  { name: "Greek Yogurt (plain)",    category: "protein", calories: 59,  protein: 10.0, carbs: 3.6,  fats: 0.4,  fibre: 0.0 },
  { name: "Lentils (cooked)",        category: "protein", calories: 116, protein: 9.0,  carbs: 20.0, fats: 0.4,  fibre: 7.9 },

  // ── Grains & Carbs ────────────────────────────────────────────────────────
  { name: "White Rice (cooked)",     category: "grain",   calories: 130, protein: 2.7,  carbs: 28.0, fats: 0.3,  fibre: 0.4 },
  { name: "Brown Rice (cooked)",     category: "grain",   calories: 123, protein: 2.7,  carbs: 26.0, fats: 1.0,  fibre: 1.8 },
  { name: "Oats (dry)",              category: "grain",   calories: 389, protein: 17.0, carbs: 66.0, fats: 7.0,  fibre: 10.6 },
  { name: "Whole Wheat Bread",       category: "grain",   calories: 247, protein: 13.0, carbs: 41.0, fats: 4.2,  fibre: 6.0 },
  { name: "Pasta (cooked)",          category: "grain",   calories: 158, protein: 5.8,  carbs: 31.0, fats: 0.9,  fibre: 1.8 },
  { name: "Quinoa (cooked)",         category: "grain",   calories: 120, protein: 4.4,  carbs: 22.0, fats: 1.9,  fibre: 2.8 },

  // ── Dairy ─────────────────────────────────────────────────────────────────
  { name: "Whole Milk",              category: "dairy",   calories: 61,  protein: 3.2,  carbs: 4.8,  fats: 3.3,  fibre: 0.0 },
  { name: "Cheddar Cheese",          category: "dairy",   calories: 402, protein: 25.0, carbs: 1.3,  fats: 33.0, fibre: 0.0 },
  { name: "Cottage Cheese",          category: "dairy",   calories: 98,  protein: 11.0, carbs: 3.4,  fats: 4.3,  fibre: 0.0 },

  // ── Nuts & Fats ───────────────────────────────────────────────────────────
  { name: "Almonds",                 category: "nut",     calories: 579, protein: 21.0, carbs: 22.0, fats: 50.0, fibre: 12.5 },
  { name: "Peanut Butter",           category: "nut",     calories: 588, protein: 25.0, carbs: 20.0, fats: 50.0, fibre: 6.0 },
  { name: "Avocado",                 category: "fat",     calories: 160, protein: 2.0,  carbs: 9.0,  fats: 15.0, fibre: 7.0 },
  { name: "Olive Oil",               category: "fat",     calories: 884, protein: 0.0,  carbs: 0.0,  fats: 100.0,fibre: 0.0 },

  // ── Snacks ────────────────────────────────────────────────────────────────
  { name: "Dark Chocolate (70%)",    category: "snack",   calories: 598, protein: 7.8,  carbs: 46.0, fats: 43.0, fibre: 10.9 },
];

async function main() {
  console.log("🌱 Starting seed...\n");

  let created = 0;
  let skipped = 0;

  for (const food of foods) {
    // upsert: create if doesn't exist, update if it does (matched by name)
    const result = await prisma.food.upsert({
      where:  { name: food.name },       // requires @@unique or @unique on name
      update: food,                       // overwrite all fields on re-run
      create: { ...food, createdByUserId: SYSTEM_USER },
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      console.log(`  ✅ Created: ${result.name}`);
      created++;
    } else {
      console.log(`  ↻  Updated: ${result.name}`);
      skipped++;
    }
  }

  console.log(`\n✅ Seed complete — ${created} created, ${skipped} updated.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
