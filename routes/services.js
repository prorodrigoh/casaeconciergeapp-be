const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const authenticateToken = require("../middleware/auth");
const { ApiError } = require("../utils/errorHandler");

router.use(authenticateToken);

// // Get all services
// router.get("/", async (req, res, next) => {
//   try {
//     const snapshot = await db.collection("services").get();
//     const services = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));
//     res.send(services);
//   } catch (error) {
//     next(new ApiError(500, "Failed to fetch services", error.message));
//   }
// });

router.get("/", async (req, res, next) => {
  try {
    const snapshot = await db.collection("services").get();
    const services = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt
          ? data.createdAt.toDate().toISOString()
          : null,
        assignedAt: data.assignedAt
          ? data.assignedAt.toDate().toISOString()
          : null,
        closeDate: data.closeDate
          ? data.closeDate.toDate().toISOString()
          : null,
      };
    });
    res.send(services);
  } catch (error) {
    next(new ApiError(500, "Failed to fetch services", error.message));
  }
});

// Create a service
router.post("/", async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).send("Only Admins can create services");
    }
    const { category, name } = req.body; // Align with frontend/AdminCategories.js
    if (!name || !category)
      throw new ApiError(400, "Name and category are required");
    const serviceRef = db.collection("services").doc();
    const serviceData = {
      category,
      name,
      status: "Open", // Default status
      vendor: null, // Initially unassigned
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await serviceRef.set(serviceData);
    res.status(201).send({ id: serviceRef.id, ...serviceData });
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to create service", error.message)
    );
  }
});

// Assign a service to a vendor
router.patch("/:id/assign", async (req, res, next) => {
  try {
    console.log("req.user:", req.user); // Debug log
    if (!req.user.role) {
      return res.status(403).send("User role is undefined");
    }
    if (req.user.role !== "Vendor" && req.user.role !== "Admin") {
      return res
        .status(403)
        .send(`${req.user.role} is not authorized to assign services`);
    }
    const serviceId = req.params.id;
    const { vendor } = req.body; // Expect vendor email

    if (!vendor) {
      throw new ApiError(400, "Vendor email is required");
    }
    // Vendors can only assign to themselves; Admins can assign to any vendor
    if (req.user.role === "Vendor" && vendor !== req.user.email) {
      throw new ApiError(403, "Vendors can only assign services to themselves");
    }

    const serviceRef = db.collection("services").doc(serviceId);
    const doc = await serviceRef.get();
    if (!doc.exists) throw new ApiError(404, "Service not found");

    const serviceData = doc.data();
    if (serviceData.vendor) {
      throw new ApiError(400, "Service already assigned to a vendor");
    }
    if (serviceData.status === "Closed") {
      throw new ApiError(400, "Cannot assign a closed service");
    }

    // Check vendor's open services limit (only applies to Vendor role)
    if (req.user.role === "Vendor") {
      const vendorServicesSnapshot = await db
        .collection("services")
        .where("vendor", "==", vendor)
        .where("status", "!=", "Closed")
        .get();
      if (vendorServicesSnapshot.docs.length >= 3) {
        throw new ApiError(
          400,
          "Vendor has reached the limit of 3 open services"
        );
      }
    }

    await serviceRef.update({
      vendor,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.send({ id: serviceId, ...serviceData, vendor });
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to assign service", error.message)
    );
  }
});

// Close a service (optional, for completeness)
router.patch("/:id/close", async (req, res, next) => {
  try {
    if (req.user.role !== "Vendor" && req.user.role !== "Admin") {
      return res.status(403).send("Only Vendors or Admins can close services");
    }
    const serviceId = req.params.id;
    const serviceRef = db.collection("services").doc(serviceId);
    const doc = await serviceRef.get();
    if (!doc.exists) throw new ApiError(404, "Service not found");

    const serviceData = doc.data();
    if (serviceData.status === "Closed") {
      throw new ApiError(400, "Service is already closed");
    }
    if (req.user.role === "Vendor" && serviceData.vendor !== req.user.email) {
      throw new ApiError(403, "You can only close your own services");
    }

    await serviceRef.update({
      status: "Closed",
      closeDate: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.send({ id: serviceId, ...serviceData, status: "Closed" });
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to close service", error.message)
    );
  }
});

module.exports = router;
