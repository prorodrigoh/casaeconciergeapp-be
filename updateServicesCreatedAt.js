const admin = require("firebase-admin");
const serviceAccount = require("./casaeconciergeapp-firebase-key.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://casaeconciergeapp.firebaseio.com",
});

const db = admin.firestore();

async function updateServicesCreatedAt() {
  try {
    console.log("Fetching services collection...");
    const snapshot = await db.collection("services").get();

    if (snapshot.empty) {
      console.log("No services found in the collection.");
      return;
    }

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTimestamp = admin.firestore.Timestamp.fromDate(yesterday);

    // Batch update for efficiency
    const batch = db.batch();
    let updatedCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.createdAt) {
        console.log(`Adding createdAt to service: ${doc.id} - ${data.name}`);
        batch.update(doc.ref, {
          createdAt: yesterdayTimestamp,
        });
        updatedCount++;
      }
    });

    if (updatedCount === 0) {
      console.log("All services already have a createdAt field.");
    } else {
      await batch.commit();
      console.log(
        `Successfully updated ${updatedCount} services with createdAt set to yesterday.`
      );
    }
  } catch (error) {
    console.error("Error updating services:", error.message);
  } finally {
    process.exit(0);
  }
}

updateServicesCreatedAt();
