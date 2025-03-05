// routes/bankAccounts.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const authenticateToken = require("../middleware/auth");
const { ApiError, checkRoleAccess } = require("../utils/errorHandler");

router.use(authenticateToken);

const canAccessBankAccounts = (req, email) => {
  const userRole = req.userData.role;
  const userEmail = req.user.email.toLowerCase();
  const targetEmail = email.toLowerCase();

  if (userRole === "Owner" && userEmail !== targetEmail) {
    throw new ApiError(
      403,
      "Forbidden: Owners can only access their own bank accounts"
    );
  }
  if (["Vendor", "House Keeper"].includes(userRole)) {
    throw new ApiError(
      403,
      "Forbidden: Vendors and House Keepers cannot access bank accounts"
    );
  }
  // Managers and Administrators can access all bank accounts
};

router.get("/users/:email", async (req, res, next) => {
  try {
    canAccessBankAccounts(req, req.params.email);
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
    canAccessBankAccounts(req, req.params.email);
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
        : new ApiError(500, "Failed to add bank account", error.message)
    );
  }
});

router.delete("/users/:email/:accountId", async (req, res, next) => {
  try {
    canAccessBankAccounts(req, req.params.email);
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
