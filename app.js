if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express(); 
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const path = require("path");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const { MongoStore } = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// MongoDB Connection
async function main() {
  await mongoose.connect(process.env.ATLASDB_URL, {
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 60000
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Connection failed:', err));
}

main()
  .then(() => console.log("connected to db"))
  .catch(err => console.log("error caught", err));

// View Engine & Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// 🔒 PRODUCTION SECURITY HEADERS
app.use((req, res, next) => {
  // Fix "Dangerous Site" warning
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "img-src 'self' https://res.cloudinary.com https: data: blob:; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "font-src 'self' https: data:; " +
    "connect-src 'self';"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 🔒 HTTPS Redirect (Render.com)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.get('X-Forwarded-Proto') !== 'https') {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
  }
  next();
});

// ✅ FIXED MongoStore v6 + Production Ready
const store = new MongoStore({
  mongoUrl: process.env.ATLASDB_URL,
  dbName: 'wanderlust',
  collectionName: 'sessions',
  ttl: 7 * 24 * 60 * 60  // 7 days
});

store.on("error", (err) => {
  console.log("MONGO SESSION STORE ERROR:", err);
});

// 🔒 PRODUCTION SESSION CONFIG
const sessionOption = {
  store,
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // ✅ HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // ✅ Cross-site
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
};

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Error Handlers
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { err, message });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🌐 Local: http://localhost:${port}`);
  console.log(`🔗 Render: https://airbnb-a9y2.onrender.com`);
});
