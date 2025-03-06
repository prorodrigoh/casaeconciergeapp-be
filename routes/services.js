const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const authenticateToken = require("../middleware/auth");
const { ApiError } = require("../utils/errorHandler");

router.use(authenticateToken);

router.get("/", async (req, res, next) => {
  try {
    const snapshot = await db.collection("services").get();
    const services = snapshot.docs.map((doc) => doc.data());
    res.send(services);
  } catch (error) {
    next(new ApiError(500, "Failed to fetch services", error.message));
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) throw new ApiError(400, "Title is required");
    const serviceRef = db.collection("services").doc();
    await serviceRef.set({
      title,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).send(`Service ${title} created`);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to create service", error.message)
    );
  }
});

module.exports = router;
