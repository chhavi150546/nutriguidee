
const express      = require("express");
const path         = require("path");
const cookieParser = require("cookie-parser");   
const session      = require("express-session"); 
const morgan       = require("morgan");          
const passport     = require("./config/passport"); 

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/static", express.static(path.join(__dirname, "public")));


app.use(morgan("dev"));                           
app.use(express.json());                            
app.use(express.urlencoded({ extended: true }));    
app.use(cookieParser());                            

app.use(
  session({
    secret: process.env.SESSION_SECRET || "nutriguide_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use(passport.initialize());

app.use((req, _res, next) => {
  req.requestTime = new Date().toISOString();
  next(); 
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const apiRouter          = require("./routes/api");          
const authRouter         = require("./routes/auth");         
const passportAuthRouter = require("./routes/passportAuth"); 
const adminRouter        = require("./routes/admin");        
const socketRouter       = require("./routes/socketDemo");   

app.use("/api", apiRouter);
app.use("/auth", authRouter);
app.use("/passport-auth", passportAuthRouter); 
app.use("/admin", adminRouter);
app.use("/chat-demo", socketRouter);

app.get("/", (req, res) => {
  res.json({
    message: "NutriGuide API",
    version: "1.0.0",
    docs: "/api",
    requestTime: req.requestTime,
  });
});

const fs = require("fs");
app.get("/readme", (req, res) => {
  const filePath = path.join(__dirname, "README.md");
  res.setHeader("Content-Type", "text/plain");
  const readStream = fs.createReadStream(filePath);
  readStream.on("error", () => res.status(404).send("README not found"));
  readStream.pipe(res);
});

app.use((err, req, res, next) => {
  console.error("[Error Middleware]", err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

module.exports = app;
