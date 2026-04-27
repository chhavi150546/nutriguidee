<<<<<<< HEAD
# NutriiGuide — Full-Stack Node.js Project

A nutrition tracker demonstrating all Node.js lecture topics (L1–48).
**No Supabase. No TanStack Router.** Pure Express + MongoDB backend + React Router frontend.

---

## Architecture (L1-4: Client-Server)

```
Browser (React + React Router)  ←→  Express.js API  ←→  MongoDB
         port 5173                      port 3001
              └────── Socket.io (WebSocket) ──────┘
```

- **Frontend** = CSR (React, React Router v6)
- **Backend** = Express.js REST API + Socket.io server
- **Database** = MongoDB via Mongoose
- **Auth** = bcrypt passwords + JWT tokens

---

## Lecture Coverage Map

| Lectures | Topic | Where in code |
|----------|-------|---------------|
| 1-4      | Client-Server Architecture | `backend/index.js` comments |
| 5-8      | Node.js setup, `fs`, `path` | `backend/index.js` |
| 9-12     | Node.js advantages/disadvantages | `backend/index.js` comment block |
| 13-16    | HTTP module, endpoints, NPM, modules | `backend/index.js` raw `http.createServer` |
| 17-20    | Express framework | `backend/app.js` |
| 21-24    | Static files, Routing, Response methods | `backend/app.js`, `backend/routes/api.js` |
| 25-28    | Middleware lifecycle, body-parser | `backend/app.js`, `backend/middleware/index.js` |
| 29-32    | SSR vs CSR, EJS template engine | `backend/app.js`, `backend/views/*.ejs` |
| 33-36    | MongoDB, Mongoose ODM | `backend/models/`, `backend/controllers/` |
| 37-40    | Sessions, Cookies | `backend/app.js` express-session |
| 41-44    | bcrypt, JWT, Passport.js | `backend/routes/auth.js`, `backend/models/User.js` |
| 45-48    | Socket.io full-duplex | `backend/utils/socket.js`, `frontend/src/pages/Chat.tsx` |

---

## Setup & Run

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas URI

### 2. Environment variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/nutriguide
JWT_SECRET=change_me_to_something_random
SESSION_SECRET=another_random_string
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Install & run backend

```bash
cd backend
npm install
npm run dev        # uses nodemon
```

### 4. Install & run frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server on :5173
```

### 5. Open the app

Navigate to **http://localhost:5173**

The Vite dev server proxies `/api`, `/auth`, and `/socket.io` to `localhost:3001`.

---

## Key files

```
backend/
  index.js          ← Entry: http.createServer + socket.io init
  app.js            ← Express: middleware, routes, EJS, error handler
  routes/
    auth.js         ← POST /auth/login, /auth/register, GET /auth/me
    api.js          ← /api/meals, /api/profile (JWT-protected)
    admin.js        ← EJS SSR admin dashboard
    socketDemo.js   ← Socket.io demo HTML page
  controllers/
    meals.js        ← Mongoose CRUD for MealLog
    profile.js      ← Mongoose CRUD for Profile
    mongoMeals.js   ← Bonus: alternate Mongoose demo
  models/
    User.js         ← bcrypt pre-save hook, comparePassword method
    MealLog.js      ← Meal document schema
    Profile.js      ← User profile document schema
  middleware/
    index.js        ← verifyJWT, verifySession, requestLogger
  utils/
    socket.js       ← Socket.io events: chat:message, meal:logged, user:count
  views/
    admin-dashboard.ejs   ← SSR admin page (L29-32)
    admin-login.ejs       ← SSR login form

frontend/
  src/
    main.tsx        ← ReactDOM.createRoot + BrowserRouter + AuthProvider
    App.tsx         ← React Router v6 route tree
    lib/
      api.ts        ← Central fetch client (JWT Bearer token)
      auth-context.tsx ← JWT auth state (signIn/signUp/signOut)
    hooks/
      use-meals.ts  ← Fetch meals, listen for socket:meal:update
      use-socket.ts ← Shared socket.io-client instance
    pages/
      Landing.tsx   Dashboard.tsx  Login.tsx  Signup.tsx
      Meals.tsx     Profile.tsx    Chat.tsx   Report.tsx
      AppLayout.tsx ← Sidebar + <Outlet />
```
=======
# nutriiGuide
>>>>>>> 0a52cd79fddcaae6b7ad97884b729fcfb64f6ac9
