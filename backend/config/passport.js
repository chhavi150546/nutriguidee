/**
 * config/passport.js — Passport.js strategy configuration
 *
 * LECTURE COVERAGE:
 *  41-44: Passport.js — authentication middleware with strategies
 *
 *  What is Passport.js?
 *    A lightweight authentication middleware for Node.js / Express.
 *    It delegates the "how do I verify this user?" logic to swappable
 *    "strategies". 500+ strategies exist on npm.
 *
 *  Two strategies configured here:
 *
 *  1. passport-local  (lectures 41-44: username/password auth)
 *     • Reads email + password from req.body
 *     • Looks up the user in MongoDB
 *     • Compares the plain password against the bcrypt hash
 *     • Returns the user object on success, false on failure
 *
 *  2. passport-jwt  (lectures 41-44: JWT Bearer token auth)
 *     • Reads the JWT from the Authorization: Bearer <token> header
 *     • Verifies the signature with our JWT_SECRET
 *     • Decodes the payload and fetches the user from MongoDB
 *     • Returns the user object on success, false on failure
 *
 *  Core lifecycle:
 *    passport.use(strategy)          → register a strategy
 *    passport.authenticate("name")   → middleware that runs strategy
 *    passport.serializeUser(fn)      → store user in session
 *    passport.deserializeUser(fn)    → restore user from session
 *
 *  We use { session: false } for JWT routes because JWT is stateless —
 *  there is no need to store anything in a server-side session.
 *  serializeUser / deserializeUser are still defined here for completeness
 *  and are used automatically if you ever call authenticate() without
 *  { session: false } (e.g., the local strategy admin login below).
 */

const passport       = require("passport");
const LocalStrategy  = require("passport-local").Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

const User       = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET || "nutriguide_jwt_secret_change_me";

// ── 1. Local Strategy — email + password ─────────────────────────────────────
//
//   passport-local calls the verify function with (email, password, done).
//   We tell it to use "email" instead of the default "username" field.
//
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",      // read req.body.email
      passwordField: "password",   // read req.body.password
      session: false,              // we issue a JWT — no server session needed
    },
    async (email, password, done) => {
      try {
        // Step 1: find the user by email (include password hash for comparison)
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

        if (!user) {
          // done(err, user, info)
          return done(null, false, { message: "No account found with that email" });
        }

        // Step 2: compare plain-text password against bcrypt hash (L41-44)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password" });
        }

        // Step 3: success — return the user (password field stripped by toJSON)
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── 2. JWT Strategy — Bearer token ───────────────────────────────────────────
//
//   ExtractJwt.fromAuthHeaderAsBearerToken() reads the token from:
//     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//
//   passport-jwt verifies the signature, decodes the payload, then calls
//   our verify function with (jwtPayload, done).
//
passport.use(
  "jwt",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:    JWT_SECRET,
      // issuer / audience can be added here for extra security
    },
    async (payload, done) => {
      try {
        // payload = { id, email, role, iat, exp } (what we signed in signToken())
        const user = await User.findById(payload.id);

        if (!user) {
          return done(null, false, { message: "User no longer exists" });
        }

        // Attach user to req.user — available in the route handler
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── serializeUser / deserializeUser ──────────────────────────────────────────
//
//   These run only when session: true (the default).
//   serializeUser:   determines what data is saved in req.session.passport.user
//   deserializeUser: uses that saved data to restore the full user object
//
//   With { session: false } (our JWT routes) these are never called.
//   They are defined here for completeness and to support any session-based
//   route you might add later (e.g., a traditional form login page).
//
passport.serializeUser((user, done) => {
  // Store only the user's id in the session — small footprint
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
