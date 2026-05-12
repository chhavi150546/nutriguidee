const passport       = require("passport");
const LocalStrategy  = require("passport-local").Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const User       = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET || "nutriguide_jwt_secret_change_me";
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",      
      passwordField: "password",   
      session: false,              
    },
    async (email, password, done) => {
      try {
        // Step 1: find the user by email 
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

        if (!user) {
         
          return done(null, false, { message: "No account found with that email" });
        }

        // Step 2: compare plain-text password against bcrypt hash 
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

//jwt strategies
passport.use(
  "jwt",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:    JWT_SECRET,
      
    },
    async (payload, done) => {
      try {
        
        const user = await User.findById(payload.id);

        if (!user) {
          return done(null, false, { message: "User no longer exists" });
        }

        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  
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
