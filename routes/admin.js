const express = require("express");
const admin = require("firebase-admin");
const authenticateToken = require("../middleware/auth");

const router = express.Router();
const db = admin.firestore();

// Get all categories and services
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection("categories").get();
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const servicesSnapshot = await db.collection("services").get();
    const services = servicesSnapshot.docs.reduce((acc, doc) => {
      const data = doc.data();
      if (!acc[data.category]) acc[data.category] = [];
      acc[data.category].push({ id: doc.id, ...data });
      return acc;
    }, {});
    res.status(200).json({ categories, services });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Create a category
router.post("/categories", authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== "Administrator") {
      return res.status(403).send("Only Administrators can manage categories");
    }
    const { name } = req.body;
    const docRef = await db.collection("categories").add({ name });
    res.status(201).json({ id: docRef.id, name });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Update a category
router.put("/categories/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== "Administrator") {
      return res.status(403).send("Only Administrators can manage categories");
    }
    const { name } = req.body;
    await db.collection("categories").doc(req.params.id).update({ name });
    res.status(200).send({ id: req.params.id, name });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Delete a category
router.delete("/categories/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== "Administrator") {
      return res.status(403).send("Only Administrators can manage categories");
    }
    await db.collection("categories").doc(req.params.id).delete();
    res.status(200).send("Category deleted");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Create a service
router.post("/services", authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== "Administrator") {
      return res.status(403).send("Only Administrators can manage services");
    }
    const { category, name } = req.body;
    const docRef = await db.collection("services").add({ category, name });
    res.status(201).json({ id: docRef.id, category, name });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Update a service
router.put("/services/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== "Administrator") {
      return res.status(403).send("Only Administrators can manage services");
    }
    const { name } = req.body;
    await db.collection("services").doc(req.params.id).update({ name });
    res.status(200).send({ id: req.params.id, name });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Delete a service
router.delete(
  "/services/:category/:id",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.userType !== "Administrator") {
        return res.status(403).send("Only Administrators can manage services");
      }
      await db.collection("services").doc(req.params.id).delete();
      res.status(200).send("Service deleted");
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

module.exports = router;
