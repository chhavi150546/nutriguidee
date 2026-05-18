/**
 * controllers/foods.js — Food Catalogue CRUD using Prisma + PostgreSQL
 *
 * PRISMA CONCEPTS DEMONSTRATED:
 *   prisma.food.findMany()    → SELECT with WHERE / ORDER BY / pagination
 *   prisma.food.findUnique()  → SELECT WHERE id = ? (returns null if not found)
 *   prisma.food.create()      → INSERT INTO food ...
 *   prisma.food.update()      → UPDATE food SET ... WHERE id = ?
 *   prisma.food.delete()      → DELETE FROM food WHERE id = ?
 *   prisma.foodLog.create()   → INSERT with a relation (foodId FK)
 *   prisma.foodLog.findMany() → JOIN-style query via include / select
 *
 * Endpoints wired in routes/foods.js:
 *   GET    /api/foods             list + search foods (public)
 *   GET    /api/foods/:id         get one food with its recent logs
 *   POST   /api/foods             create a food entry       (JWT required)
 *   PUT    /api/foods/:id         update your own food      (JWT required)
 *   DELETE /api/foods/:id         delete your own food      (JWT required)
 *   GET    /api/foods/logs        your food logs            (JWT required)
 *   POST   /api/foods/logs        log eating a food item    (JWT required)
 *   DELETE /api/foods/logs/:id    delete a food log         (JWT required)
 */

const prisma = require("../lib/prisma");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/foods
// Search the food catalogue. Supports:
//   ?search=apple          → name or brand contains "apple" (case-insensitive)
//   ?category=fruit        → filter by category
//   ?page=1&limit=20       → pagination
// ─────────────────────────────────────────────────────────────────────────────
exports.list = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;

    // ── WHERE clause (Prisma filter object) ───────────────────────────────────
    const where = {};

    if (search) {
      // Prisma's "contains" = SQL LIKE '%apple%'
      // "mode: insensitive" = case-insensitive (PostgreSQL uses ilike under the hood)
      where.OR = [
        { name:  { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    // ── Pagination ────────────────────────────────────────────────────────────
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Run query + count in parallel (Promise.all = non-blocking)
    const [foods, total] = await Promise.all([
      prisma.food.findMany({
        where,
        orderBy: { name: "asc" },   // ORDER BY name ASC
        skip,
        take,
        // "select" limits which columns are returned (like .select() in Mongoose)
        select: {
          id: true, name: true, brand: true, category: true,
          calories: true, protein: true, carbs: true, fats: true, fibre: true,
          createdAt: true,
        },
      }),
      prisma.food.count({ where }),  // SELECT COUNT(*) for pagination metadata
    ]);

    res.json({
      foods,
      pagination: {
        total,
        page: Number(page),
        limit: take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/foods/:id
// Get a single food + its 5 most recent logs.
// Demonstrates: findUnique + include (like Mongoose's .populate())
// ─────────────────────────────────────────────────────────────────────────────
exports.getOne = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const food = await prisma.food.findUnique({
      where: { id },
      // "include" tells Prisma to JOIN the related table and return nested data
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 5,                          // latest 5 logs only
          select: {
            id: true, grams: true, eatenOn: true, mealType: true, userId: true,
          },
        },
      },
    });

    if (!food) return res.status(404).json({ error: "Food not found" });
    res.json({ food });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/foods
// Create a new food entry in the catalogue.
// Demonstrates: prisma.food.create()
// ─────────────────────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const { name, brand, category, calories, protein, carbs, fats, fibre } = req.body;

    if (!name || calories == null) {
      return res.status(400).json({ error: "name and calories are required" });
    }

    // prisma.food.create() = INSERT INTO food (...) VALUES (...) RETURNING *
    const food = await prisma.food.create({
      data: {
        name:            name.trim(),
        brand:           brand?.trim() ?? null,
        category:        category ?? "general",
        calories:        Number(calories),
        protein:         Number(protein  ?? 0),
        carbs:           Number(carbs    ?? 0),
        fats:            Number(fats     ?? 0),
        fibre:           Number(fibre    ?? 0),
        createdByUserId: req.user.id,       // from verifyJWT middleware
      },
    });

    res.status(201).json({ food });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/foods/:id
// Update your own food entry.
// Demonstrates: prisma.food.update() + ownership check
// ─────────────────────────────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // First check ownership (fetch without update)
    const existing = await prisma.food.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Food not found" });
    if (existing.createdByUserId !== req.user.id) {
      return res.status(403).json({ error: "You can only edit your own food entries" });
    }

    const { name, brand, category, calories, protein, carbs, fats, fibre } = req.body;

    // prisma.food.update() = UPDATE food SET ... WHERE id = ? RETURNING *
    const food = await prisma.food.update({
      where: { id },
      data: {
        ...(name     != null && { name:     name.trim() }),
        ...(brand    != null && { brand:    brand.trim() }),
        ...(category != null && { category }),
        ...(calories != null && { calories: Number(calories) }),
        ...(protein  != null && { protein:  Number(protein)  }),
        ...(carbs    != null && { carbs:    Number(carbs)    }),
        ...(fats     != null && { fats:     Number(fats)     }),
        ...(fibre    != null && { fibre:    Number(fibre)    }),
      },
    });

    res.json({ food });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/foods/:id
// Delete your own food entry (cascades to its FoodLogs automatically).
// Demonstrates: prisma.food.delete() + cascade (defined in schema)
// ─────────────────────────────────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = await prisma.food.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Food not found" });
    if (existing.createdByUserId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own food entries" });
    }

    await prisma.food.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/foods/logs
// Get the current user's food logs with the related food info joined.
// Demonstrates: findMany with include (JOIN), filtering by userId
// ─────────────────────────────────────────────────────────────────────────────
exports.listLogs = async (req, res, next) => {
  try {
    const { date } = req.query;
    const where = { userId: req.user.id };
    if (date) where.eatenOn = date;

    const logs = await prisma.foodLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        // Prisma automatically JOINs the Food table and nests the result
        food: {
          select: { id: true, name: true, brand: true, calories: true, protein: true, carbs: true, fats: true },
        },
      },
    });

    res.json({ logs });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/foods/logs
// Record that the user ate X grams of a food item.
// Demonstrates: create with a relation (foreign key foodId)
// ─────────────────────────────────────────────────────────────────────────────
exports.createLog = async (req, res, next) => {
  try {
    const { foodId, grams = 100, eatenOn, mealType = "snack", notes } = req.body;
    if (!foodId) return res.status(400).json({ error: "foodId is required" });

    const today = new Date().toISOString().slice(0, 10);

    const log = await prisma.foodLog.create({
      data: {
        foodId:   Number(foodId),
        userId:   req.user.id,
        grams:    Number(grams),
        eatenOn:  eatenOn ?? today,
        mealType,
        notes:    notes ?? null,
      },
      // Return the food data alongside the log — no second query needed
      include: {
        food: { select: { name: true, calories: true, protein: true, carbs: true, fats: true } },
      },
    });

    res.status(201).json({ log });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/foods/logs/:id
// Delete one of the current user's food logs.
// ─────────────────────────────────────────────────────────────────────────────
exports.removeLog = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = await prisma.foodLog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Log not found" });
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own logs" });
    }

    await prisma.foodLog.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
