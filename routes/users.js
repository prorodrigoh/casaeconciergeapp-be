const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const authenticateToken = require("../middleware/auth");
const { ApiError } = require("../utils/errorHandler");
const nodemailer = require("nodemailer");

router.use(authenticateToken);

router.get("/", async (req, res, next) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.send(users);
  } catch (error) {
    next(new ApiError(500, "Failed to fetch users", error.message));
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      email,
      password,
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
      role,
    } = req.body;
    if (!email) throw new ApiError(400, "Email is required");
    if (!password) throw new ApiError(400, "Password is required");
    const validRoles = [
      "Admin",
      "Owner",
      "Guest",
      "Manager",
      "House Keeper",
      "Vendor",
    ];

    if (!role || !validRoles.includes(role))
      throw new ApiError(400, "Invalid role");

    const userRef = db.collection("users").doc(email.toLowerCase());
    const userData = {
      email: email.toLowerCase(),
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
      role, // Use the role from the request body
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

    await admin.auth().createUser({
      email: email.toLowerCase(),
      password: password,
      displayName: `${firstName} ${lastName}`.trim() || email.toLowerCase(),
      disabled: !activeUser,
    });

    await admin.auth().setCustomUserClaims(user.uid, { role });

    res.status(201).send(`User ${email} created`);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to create user", error.message)
    );
  }
});

router.get("/:email", async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) {
      const snapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();
      if (snapshot.empty) throw new ApiError(404, "User not found");
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const addressSnapshot = await userRef.collection("address").get();
      const bankAccountsSnapshot = await userRef
        .collection("bankAccounts")
        .get();
      const creditCardsSnapshot = await userRef.collection("creditCards").get();

      const response = {
        ...userData,
        id: userDoc.id,
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
    } else {
      const userData = doc.data();
      const addressSnapshot = await userRef.collection("address").get();
      const bankAccountsSnapshot = await userRef
        .collection("bankAccounts")
        .get();
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
    }
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to fetch user", error.message)
    );
  }
});

router.put("/:email", async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if (!doc.exists) throw new ApiError(404, "User not found");

    const {
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
    const validRoles = [
      "Admin",
      "Owner",
      "Guest",
      "Manager",
      "House Keeper",
      "Vendor",
    ];

    if (role && !validRoles.includes(role))
      throw new ApiError(400, "Invalid role");

    const updates = {
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
    if (role) {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, { role });
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

router.delete("/:email", async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    const userRef = db.collection("users").doc(email);
    await userRef.delete();
    res.send(`User ${email} deleted`);
  } catch (error) {
    next(new ApiError(500, "Failed to delete user", error.message));
  }
});

router.post("/:email/reset-password", async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    const userRecord = await admin.auth().getUserByEmail(email);
    if (!userRecord) throw new ApiError(404, "User not found");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const actionCodeSettings = {
      url: "https://casaeconciergeapp.firebaseapp.com",
      handleCodeInApp: true,
    };
    const resetLink = await admin
      .auth()
      .generatePasswordResetLink(email, actionCodeSettings);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Click this link to reset your password: ${resetLink}`,
      html: `<p>Click this link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send(`Password reset email sent to ${email}`);
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to reset password", error.message)
    );
  }
});

module.exports = router;
