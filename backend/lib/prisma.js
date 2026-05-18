/**
 * lib/prisma.js — Prisma Client singleton
 *
 * WHY a singleton?
 *   PrismaClient opens a connection pool to PostgreSQL.
 *   Creating a new instance per request = hundreds of open connections = crash.
 *   We create ONE instance and reuse it everywhere — same pattern as Mongoose.
 *
 * HOW to use it in a controller:
 *   const prisma = require("../lib/prisma");
 *   const foods  = await prisma.food.findMany();
 *
 * Prisma vs Mongoose query comparison:
 *   Mongoose                          Prisma
 *   ──────────────────────────────    ──────────────────────────────────
 *   Model.find({ name: "Apple" })  →  prisma.food.findMany({ where: { name: "Apple" } })
 *   Model.findById(id)             →  prisma.food.findUnique({ where: { id } })
 *   Model.create({ ... })          →  prisma.food.create({ data: { ... } })
 *   Model.findByIdAndUpdate(id,..) →  prisma.food.update({ where: { id }, data: { ... } })
 *   Model.findByIdAndDelete(id)    →  prisma.food.delete({ where: { id } })
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["query", "warn", "error"]   // log all SQL in dev so you can see what Prisma generates
    : ["warn", "error"],
});

module.exports = prisma;
