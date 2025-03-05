const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const authenticateToken = require("../middleware/auth");
const { ApiError } = require("../utils/errorHandler");

router.use(authenticateToken);

const checkPermission = (req, targetEmail, action) => {
  const { userType } = req.currentUser;
  const isOwner = userType === "owner";
  const isManager = userType === "manager";
  const targetUserRef = db.collection("users").doc(targetEmail.toLowerCase());
  const isSelf =
    req.currentUser.email.toLowerCase() === targetEmail.toLowerCase();

  if (isOwner) {
    if (!isSelf)
      throw new ApiError(403, "Owners can only access their own data");
    return; // Owners can only manage their own data
  }

  if (isManager) {
    if (action === "changePassword" && targetEmail) {
      return db
        .collection("users")
        .doc(targetEmail.toLowerCase())
        .get()
        .then((doc) => {
          if (!doc.exists) throw new ApiError(404, "User not found");
          if (doc.data().userType === "owner") {
            throw new ApiError(
              403,
              "Managers cannot change passwords for Owners"
            );
          }
        });
    }
    return; // Managers can do everything except change Owner passwords
  }

  if (["vendor", "House Keeper"].includes(userType)) {
    throw new ApiError(
      403,
      "Vendors and House Keepers cannot access user data"
    );
  }

  throw new ApiError(403, "Unauthorized access");
};

// Get all users (only Managers)
router.get("/", async (req, res, next) => {
  try {
    if (req.currentUser.userType !== "manager") {
      throw new ApiError(403, "Only Managers can view all users");
    }
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.send(users);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to fetch users", error.message)
    );
  }
});

// Get specific user
router.get("/:email", async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    await checkPermission(req, email, "read");
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");

    const userData = doc.data();
    const addressSnapshot = await userRef.collection("address").get();
    const bankAccountsSnapshot = await userRef.collection("bankAccounts").get();
    const creditCardsSnapshot = await userRef.collection("creditCards").get();

    const response = {
      ...userData,
      id: doc.id,
      address: addressSnapshot.docs.map((doc) => doc.data()),
      bankAccounts: bankAccountsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
      creditCards: creditCardsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    };
    res.send(response);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to fetch user", error.message)
    );
  }
});

// Create user (only Managers)
router.post("/", async (req, res, next) => {
  try {
    if (req.currentUser.userType !== "manager") {
      throw new ApiError(403, "Only Managers can create users");
    }
    const {
      email,
      password,
      userType,
      activeUser,
      firstName,
      lastName,
      dateOfBirth,
      company,
      cellPhoneBRA,
      cellPhoneUSA,
      whatsapp,
      address,
      bankAccounts,
      creditCards,
    } = req.body;
    if (!email) throw new ApiError(400, "Email is required");
    const validUserTypes = [
      "owner",
      "guest",
      "manager",
      "House Keeper",
      "Vendor",
    ];
    if (!validUserTypes.includes(userType))
      throw new ApiError(400, "Invalid user type");

    const userRef = db.collection("users").doc(email.toLowerCase());
    const userData = {
      email,
      userType,
      activeUser: !!activeUser,
      firstName: firstName || "",
      lastName: lastName || "",
      dateOfBirth: dateOfBirth
        ? admin.firestore.Timestamp.fromDate(new Date(dateOfBirth))
        : null,
      company: company || "",
      cellPhoneBRA: cellPhoneBRA || "",
      cellPhoneUSA: cellPhoneUSA || "",
      whatsapp: whatsapp || "",
      role: "Services", // Default role, can be updated later
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(userData);

    if (address) {
      await userRef
        .collection("address")
        .doc("main")
        .set({
          address: address.address || "",
          city: address.city || "",
          state: address.state || "",
          zip: address.zip || "",
          country: address.country || "Brazil",
        });
    }

    if (bankAccounts && Array.isArray(bankAccounts)) {
      const bankAccountsRef = userRef.collection("bankAccounts");
      for (const account of bankAccounts) {
        await bankAccountsRef.add({
          ein: account.ein || "",
          accountHolder: account.accountHolder || "",
          bankName: account.bankName || "",
          routing: account.routing || "",
          accountNumber: account.accountNumber || "",
          notes: account.notes || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    if (creditCards && Array.isArray(creditCards)) {
      const creditCardsRef = userRef.collection("creditCards");
      for (const card of creditCards) {
        await creditCardsRef.add({
          type: card.type || "",
          cardholderName: card.cardholderName || "",
          cardNumber: card.cardNumber || "",
          expiration: card.expiration || "",
          securityCode: card.securityCode || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    res.status(201).send(`User ${email} registered`);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to create user", error.message)
    );
  }
});

// Update user (Managers can update all except Owner passwords, Owners can update self)
router.put("/:email", async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    await checkPermission(req, email, "update");
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");

    const {
      userType,
      activeUser,
      firstName,
      lastName,
      dateOfBirth,
      company,
      cellPhoneBRA,
      cellPhoneUSA,
      whatsapp,
      address,
      role,
    } = req.body;
    const validUserTypes = [
      "owner",
      "guest",
      "manager",
      "House Keeper",
      "Vendor",
    ];
    if (userType && !validUserTypes.includes(userType))
      throw new ApiError(400, "Invalid user type");

    const updates = {
      userType: userType || doc.data().userType,
      activeUser:
        activeUser !== undefined ? !!activeUser : doc.data().activeUser,
      firstName: firstName || doc.data().firstName,
      lastName: lastName || doc.data().lastName,
      dateOfBirth: dateOfBirth
        ? admin.firestore.Timestamp.fromDate(new Date(dateOfBirth))
        : doc.data().dateOfBirth,
      company: company || doc.data().company,
      cellPhoneBRA: cellPhoneBRA || doc.data().cellPhoneBRA,
      cellPhoneUSA: cellPhoneUSA || doc.data().cellPhoneUSA,
      whatsapp: whatsapp || doc.data().whatsapp,
      role: role || doc.data().role,
    };

    // Prevent password changes for Owners by Managers
    if (req.body.password && req.currentUser.userType === "manager") {
      const targetUser = await db.collection("users").doc(email).get();
      if (targetUser.data().userType === "owner") {
        throw new ApiError(403, "Managers cannot change passwords for Owners");
      }
    }

    await userRef.update(updates);

    if (address) {
      await userRef
        .collection("address")
        .doc("main")
        .set(
          {
            address: address.address || "",
            city: address.city || "",
            state: address.state || "",
            zip: address.zip || "",
            country: address.country || "Brazil",
          },
          { merge: true }
        );
    }

    res.send(`User ${email} updated`);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to update user", error.message)
    );
  }
});

// Delete user (only Managers)
router.delete("/:email", async (req, res, next) => {
  try {
    if (req.currentUser.userType !== "manager") {
      throw new ApiError(403, "Only Managers can delete users");
    }
    const email = req.params.email.toLowerCase();
    const userRef = db.collection("users").doc(email);
    await userRef.delete();
    res.send(`User ${email} deleted`);
  } catch (error) {
    next(new ApiError(500, "Failed to delete user", error.message));
  }
});

// New: Send password reset link (only Managers for Owners)
router.post("/:email/reset-password", async (req, res, next) => {
  try {
    if (req.currentUser.userType !== "manager") {
      throw new ApiError(403, "Only Managers can send password reset links");
    }
    const email = req.params.email.toLowerCase();
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");
    if (doc.data().userType !== "owner")
      throw new ApiError(403, "Password reset only available for Owners");

    // Generate a reset token (simplified; in production, use Firebase Auth or a secure token service)
    const resetToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    await userRef.update({
      resetToken,
      resetTokenExpires: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 3600000)
      ), // 1 hour expiration
    });

    // Send reset link via email (simplified; use a service like Nodemailer or Firebase Auth)
    const resetLink = `https://casaeconciergeapp.firebaseapp.com/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;
    console.log(`Password reset link for ${email}: ${resetLink}`); // Log for testing; replace with email sending logic

    res.send(`Password reset link sent to ${email}`);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to send password reset link", error.message)
    );
  }
});

module.exports = router;
