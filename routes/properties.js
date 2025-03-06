const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const authenticateToken = require("../middleware/auth");
const { ApiError } = require("../utils/errorHandler");

router.use(authenticateToken);

router.get("/", async (req, res, next) => {
  try {
    const snapshot = await db.collection("properties").get();
    const properties = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.send(properties);
  } catch (error) {
    next(new ApiError(500, "Failed to fetch properties", error.message));
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, address } = req.body;
    if (!name) throw new ApiError(400, "Name is required");
    const propertyRef = db.collection("properties").doc();
    const propertyData = {
      name,
      address: address || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await propertyRef.set(propertyData);
    res.status(201).send({ id: propertyRef.id, ...propertyData });
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to create property", error.message)
    );
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const { name, address } = req.body;
    if (!name) throw new ApiError(400, "Name is required");
    const propertyRef = db.collection("properties").doc(id);
    const updates = { name, address };
    await propertyRef.update(updates);
    res.send(`Property ${id} updated`);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to update property", error.message)
    );
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const propertyRef = db.collection("properties").doc(id);
    await propertyRef.delete();
    res.send(`Property ${id} deleted`);
  } catch (error) {
    next(new ApiError(500, "Failed to delete property", error.message));
  }
});

module.exports = router;
