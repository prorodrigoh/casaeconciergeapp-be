const admin = require("firebase-admin");

const authenticateToken = async (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized: No token provided");
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    // Fetch user data from Firestore
    const userRef = admin
      .firestore()
      .collection("users")
      .doc(decodedToken.email.toLowerCase());
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).send("User not found");
    }
    req.currentUser = userDoc.data();
    req.currentUser.email = decodedToken.email; // Ensure email is lowercase
    req.currentUser.id = userDoc.id;

    next();
  } catch (error) {
    return res.status(401).send("Unauthorized: Invalid token");
  }
};

module.exports = authenticateToken;
