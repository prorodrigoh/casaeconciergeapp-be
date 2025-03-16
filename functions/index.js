const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.resetPassword = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required"
      );
    }

    const { email } = data;
    if (!email) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email is required"
      );
    }

    const userRecord = await admin.auth().getUserByEmail(email.toLowerCase());
    if (!userRecord) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const actionCodeSettings = {
      url: "https://casaeconciergeapp.firebaseapp.com", // Update with your app URL
      handleCodeInApp: true,
    };
    await admin
      .auth()
      .generatePasswordResetLink(email.toLowerCase(), actionCodeSettings);

    return { success: true, message: `Password reset email sent to ${email}` };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "Failed to reset password",
      error.message
    );
  }
});
