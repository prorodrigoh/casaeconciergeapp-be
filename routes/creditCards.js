// routes/creditCards.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const authenticateToken = require("../middleware/auth");
const { ApiError, checkRoleAccess } = require("../utils/errorHandler");

router.use(authenticateToken);

const canAccessCreditCards = (req, email) => {
  const userRole = req.userData.role;
  const userEmail = req.user.email.toLowerCase();
  const targetEmail = email.toLowerCase();

  if (userRole === "Owner" && userEmail !== targetEmail) {
    throw new ApiError(
      403,
      "Forbidden: Owners can only access their own credit cards"
    );
  }
  if (["Vendor", "House Keeper"].includes(userRole)) {
    throw new ApiError(
      403,
      "Forbidden: Vendors and House Keepers cannot access credit cards"
    );
  }
  // Managers and Administrators can access all credit cards
};

router.get("/users/:email", async (req, res, next) => {
  try {
    canAccessCreditCards(req, req.params.email);
    const email = req.params.email.toLowerCase();
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");
    const snapshot = await userRef.collection("creditCards").get();
    const creditCards = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.send(creditCards);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to fetch credit cards", error.message)
    );
  }
});

router.post("/users/:email", async (req, res, next) => {
  try {
    canAccessCreditCards(req, req.params.email);
    const email = req.params.email.toLowerCase();
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");

    const { type, cardholderName, cardNumber, expiration, securityCode } =
      req.body;
    const creditCardsRef = userRef.collection("creditCards");
    const newCardRef = await creditCardsRef.add({
      type: type || "",
      cardholderName: cardholderName || "",
      cardNumber: cardNumber || "",
      expiration: expiration || "",
      securityCode: securityCode || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).send({ id: newCardRef.id, ...req.body });
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to add credit card", error.message)
    );
  }
});

router.delete("/users/:email/:cardId", async (req, res, next) => {
  try {
    canAccessCreditCards(req, req.params.email);
    const email = req.params.email.toLowerCase();
    const cardId = req.params.cardId;
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");

    const cardRef = userRef.collection("creditCards").doc(cardId);
    await cardRef.delete();
    res.send(`Credit card ${cardId} deleted`);
  } catch (error) {
    next(new ApiError(500, "Failed to delete credit card", error.message));
  }
});

module.exports = router;
