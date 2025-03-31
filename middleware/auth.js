const admin = require("firebase-admin");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized: No token provided");
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // Fetch user by email instead of UID
    const userQuery = await admin
      .firestore()
      .collection("users")
      .where("email", "==", decodedToken.email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(404).send("User not found in Firestore");
    }

    const userDoc = userQuery.docs[0];
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userDoc.data().role || "unknown",
    };
    console.log("Authenticated user:", req.user); // Debug log
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).send("Unauthorized: Invalid token");
  }
};

module.exports = authenticateToken;
