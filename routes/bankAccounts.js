const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const authenticateToken = require("../middleware/auth");
const { ApiError } = require("../utils/errorHandler");

router.use(authenticateToken);

router.get("/users/:email", async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");
    const snapshot = await userRef.collection("bankAccounts").get();
    const bankAccounts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.send(bankAccounts);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to fetch bank accounts", error.message)
    );
  }
});

router.post("/users/:email", async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");

    const { ein, accountHolder, bankName, routing, accountNumber, notes } =
      req.body;
    const bankAccountsRef = userRef.collection("bankAccounts");
    const newAccountRef = await bankAccountsRef.add({
      ein: ein || "",
      accountHolder: accountHolder || "",
      bankName: bankName || "",
      routing: routing || "",
      accountNumber: accountNumber || "",
      notes: notes || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).send({ id: newAccountRef.id, ...req.body });
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to create bank account", error.message)
    );
  }
});

router.delete("/users/:email/:accountId", async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    const accountId = req.params.accountId;
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");

    const accountRef = userRef.collection("bankAccounts").doc(accountId);
    await accountRef.delete();
    res.send(`Bank account ${accountId} deleted`);
  } catch (error) {
    next(new ApiError(500, "Failed to delete bank account", error.message));
  }
});

module.exports = router;
