const express = require("express");
const admin = require("firebase-admin");
const authenticateToken = require("../middleware/auth");
const { ApiError } = require("../utils/errorHandler");

const router = express.Router();
const db = admin.firestore();

// Get all requests
router.get("/", authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection("requests").get();
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Get a single request
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const doc = await db.collection("requests").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).send("Request not found");
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Create a request
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { role, email } = req.user;
    if (role !== "Manager" && role !== "Owner" && role !== "Admin") {
      return res
        .status(403)
        .send("Only Managers and Owners can create requests");
    }

    const request = {
      ...req.body,
      createdBy: email,
      createdDate: new Date(req.body.createdDate),
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      closeDate: req.body.closeDate ? new Date(req.body.closeDate) : null,
    };
    const docRef = await db.collection("requests").add(request);
    res.status(201).json({ id: docRef.id, ...request });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Update a request
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { role, email } = req.user;
    const doc = await db.collection("requests").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).send("Request not found");
    }
    const requestData = doc.data();
    if (role !== "Manager" && requestData.createdBy !== email) {
      return res.status(403).send("You can only edit your own requests");
    }

    const updatedRequest = {
      ...req.body,
      createdDate: new Date(req.body.createdDate),
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      closeDate: req.body.closeDate ? new Date(req.body.closeDate) : null,
    };
    await db.collection("requests").doc(req.params.id).set(updatedRequest);
    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Mark a request as complete
router.patch("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const { completedBy, completedAt } = req.body;
    const docRef = db.collection("requests").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).send("Request not found");
    }
    await docRef.update({
      status: "Completed",
      completedBy,
      completedAt: new Date(completedAt),
    });
    res.status(200).send("Request marked as completed");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
