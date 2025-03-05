const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const authenticateToken = require("../middleware/auth");
const { ApiError, checkRoleAccess } = require("../utils/errorHandler");

router.use(authenticateToken);

// Helper to check if user can access this property (self for Owner, all for Manager/Admin)
const canAccessProperty = async (req, propertyId) => {
  const userRole = req.userData.role;
  const userEmail = req.user.email.toLowerCase();

  if (["Vendor", "House Keeper"].includes(userRole)) {
    throw new ApiError(
      403,
      "Forbidden: Vendors and House Keepers cannot access properties"
    );
  }

  if (userRole === "Owner") {
    const propertyRef = db.collection("properties").doc(propertyId);
    const doc = await propertyRef.get();
    if (!doc.exists) throw new ApiError(404, "Property not found");
    // Assume properties are linked to users via email or another field (e.g., ownerEmail)
    if (doc.data().ownerEmail !== userEmail) {
      throw new ApiError(
        403,
        "Forbidden: Owners can only access their own properties"
      );
    }
  }
  // Managers and Administrators can access all properties
};

router.get("/", async (req, res, next) => {
  try {
    checkRoleAccess(req, ["Administrator", "Manager", "Owner"]); // Owners see only their properties
    const userRole = req.userData.role;
    let query = db.collection("properties");

    if (userRole === "Owner") {
      query = query.where("ownerEmail", "==", req.user.email.toLowerCase());
    }

    const snapshot = await query.get();
    const properties = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.send(properties);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to fetch properties", error.message)
    );
  }
});

router.post("/", async (req, res, next) => {
  try {
    checkRoleAccess(req, ["Administrator", "Manager"]); // Only Admins and Managers can create properties
    const { name, address } = req.body;
    if (!name) throw new ApiError(400, "Name is required");
    const propertyRef = db.collection("properties").doc();
    const propertyData = {
      name,
      address: address || "",
      ownerEmail: req.user.email.toLowerCase(), // Link property to current user (for Owners)
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
    await canAccessProperty(req, req.params.id);
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
    checkRoleAccess(req, ["Administrator", "Manager"]); // Only Admins and Managers can delete properties
    const id = req.params.id;
    const propertyRef = db.collection("properties").doc(id);
    await propertyRef.delete();
    res.send(`Property ${id} deleted`);
  } catch (error) {
    next(new ApiError(500, "Failed to delete property", error.message));
  }
});

module.exports = router;
