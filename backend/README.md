# NutriGuide — Express Backend

A fully-featured Node.js backend for the **NutriGuide** nutrition tracking app,
structured to cover all 48 lecture topics.

## Quick Start

```bash
cd backend
npm install
node index.js          # or: npm run dev  (requires nodemon)
```

Server runs on **http://localhost:3001**

---

## Lecture Coverage Map

| Lectures | Topic | File(s) |
|---|---|---|
| **1–4** | Client-Server Architecture | `index.js` (comments) |
| **5–8** | Node setup, `fs` module, file dependency | `index.js` — writes `server_start.log` on boot |
| **9–12** | Node.js advantages/disadvantages | `index.js` (comment block) |
| **13–16** | HTTP module, endpoints, NPM, modules | `index.js` + `routes/api.js` |
| **17–20** | Express framework | `app.js` |
| **21–24** | Static files, Routing, Response methods, file streams | `app.js` + `routes/api.js` |
| **25–28** | Middleware lifecycle, body-parser, blocking vs non-blocking | `app.js` + `middleware/index.js` |
| **29–32** | SSR vs CSR, EJS template engine | `routes/admin.js` + `views/*.ejs` |
| **33–36** | SQL vs NoSQL, MongoDB, Mongoose ODM | `config/db.js` + `models/MealLog.js` + `controllers/mongoMeals.js` |
| **37–40** | Sessions, Cookies, express-session | `app.js` + `middleware/index.js` |
| **41–44** | Bcrypt, JWT, Passport.js | `models/User.js` + `routes/auth.js` |
| **45–48** | Full-duplex, Socket.io | `utils/socket.js` + `public/chat-demo.html` |

---

## API Endpoints

### Auth (`/auth`)
```
POST /auth/register   — register, returns JWT
POST /auth/login      — login, returns JWT
GET  /auth/me         — current user (JWT required)
POST /auth/logout     — destroy session
```

### Meals (`/api/meals`) — JWT required
```
GET    /api/meals          — list meals (?date=YYYY-MM-DD)
POST   /api/meals          — log a meal
PUT    /api/meals/:id      — update a meal
DELETE /api/meals/:id      — delete a meal
```

### MongoDB demo (`/api/mongo`) — JWT required
```
GET  /api/mongo/meals        — list from MongoDB
POST /api/mongo/meals        — create in MongoDB
GET  /api/mongo/meals/:date  — filter by date + total calories
```

### SSR Admin (`/admin`)
```
GET  /admin          — EJS dashboard (session required)
GET  /admin/login    — login page
POST /admin/login    — authenticate (ADMIN_PASSWORD env var)
GET  /admin/logout   — destroy session
```

### Socket.io Demo
```
GET /chat-demo       — live chat demo page (open in browser)
```

---

## Environment Variables

Add to `../.env` (already exists):

```env
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/nutriguide
JWT_SECRET=change_me_in_production
SESSION_SECRET=change_me_in_production
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:5173
```

---

## Architecture Overview

```
index.js          ← HTTP server + Socket.io attach (L1-16, L45-48)
app.js            ← Express app, middleware stack (L17-28)
├── routes/
│   ├── api.js        ← REST endpoints (L13-24)
│   ├── auth.js       ← JWT + bcrypt auth (L41-44)
│   ├── admin.js      ← SSR/EJS admin (L29-32)
│   └── socketDemo.js ← Socket.io demo page (L45-48)
├── controllers/
│   ├── meals.js      ← CRUD via Supabase REST
│   ├── profile.js    ← Profile CRUD
│   └── mongoMeals.js ← Mongoose CRUD (L33-36)
├── models/
│   ├── MealLog.js    ← Mongoose schema (L33-36)
│   └── User.js       ← User + bcrypt (L41-44)
├── middleware/
│   └── index.js      ← JWT, session guard, logger (L25-28, L41-44)
├── config/
│   └── db.js         ← MongoDB connection (L33-36)
├── views/
│   ├── admin-dashboard.ejs  (L29-32)
│   └── admin-login.ejs      (L29-32)
├── utils/
│   └── socket.js     ← Socket.io setup (L45-48)
└── public/
    └── chat-demo.html ← Socket.io client (L45-48)
```
