const admin = require("firebase-admin");
const serviceAccount = require("./casaeconciergeapp-firebase-key.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://casaeconciergeapp.firebaseio.com",
});

const db = admin.firestore();

async function addStatusToServices() {
  try {
    console.log("Fetching services collection...");
    const snapshot = await db.collection("services").get();

    if (snapshot.empty) {
      console.log("No services found in the collection.");
      return;
    }

    // Batch update for efficiency
    const batch = db.batch();
    let updatedCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.status) {
        console.log(`Adding status to service: ${doc.id} - ${data.name}`);
        batch.update(doc.ref, {
          status: "Open", // Default to "Open" if missing
        });
        updatedCount++;
      }
    });

    if (updatedCount === 0) {
      console.log("All services already have a status field.");
    } else {
      await batch.commit();
      console.log(
        `Successfully updated ${updatedCount} services with status "Open".`
      );
    }
  } catch (error) {
    console.error("Error updating services:", error.message);
  } finally {
    process.exit(0);
  }
}

addStatusToServices();
