// Run this script once (e.g., in a temporary file like fixRole.js)
const admin = require("firebase-admin");
const serviceAccount = require("./casaeconciergeapp-firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://casaeconciergeapp.firebaseio.com",
});

async function fixUserRole() {
  const email = "famhq.rodrigo@gmail.com";
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { role: "Vendor" });
  await admin
    .firestore()
    .collection("users")
    .doc(email)
    .update({ role: "Vendor" });
  console.log("Role fixed for", email);
  process.exit(0);
}

fixUserRole().catch(console.error);
