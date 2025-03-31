const express = require("express");
const admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 8080;
const serviceAccount = require("./casaeconciergeapp-firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://casaeconciergeapp.firebaseio.com",
});

app.use(express.json());

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://casaeconciergeapp.firebaseapp.com"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Import routes
const usersRouter = require("./routes/users");
const propertiesRouter = require("./routes/properties");
const servicesRouter = require("./routes/services");
const bankAccountsRouter = require("./routes/bankAccounts");
const creditCardsRouter = require("./routes/creditCards");
const requestsRoutes = require("./routes/requests");
const adminRoutes = require("./routes/admin");

// Import error handler
const errorHandler = require("./middleware/error");

// Mount routes
app.use("/users", usersRouter);
app.use("/properties", propertiesRouter);
app.use("/services", servicesRouter);
app.use("/bankAccounts", bankAccountsRouter);
app.use("/creditCards", creditCardsRouter);
app.use("/requests", requestsRoutes);
app.use("/admin", adminRoutes);

// Global error handler
app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
