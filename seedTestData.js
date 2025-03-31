const admin = require("firebase-admin");
const serviceAccount = require("./casaeconciergeapp-firebase-key.json"); // Adjust path to your service account key

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://casaeconciergeapp.firebaseio.com",
});

const db = admin.firestore();

// Sample services data
const services = [
  // Unassigned (Available) Services
  {
    category: "Cleaning",
    name: "Room Cleaning",
    status: "Open",
    vendor: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    category: "Maintenance",
    name: "Pool Maintenance",
    status: "Open",
    vendor: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    category: "Repair",
    name: "Fix Window",
    status: "Open",
    vendor: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },

  // Assigned Open Services (for a specific vendor)
  {
    category: "Repair",
    name: "Fix Sink",
    status: "Open",
    vendor: "vendor@example.com", // Replace with your test vendor email
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    category: "Cleaning",
    name: "Kitchen Deep Clean",
    status: "Open",
    vendor: "vendor@example.com",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
  },

  // Closed Services (for the same vendor)
  {
    category: "Maintenance",
    name: "AC Check",
    status: "Closed",
    vendor: "vendor@example.com",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    closeDate: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    category: "Repair",
    name: "Door Repair",
    status: "Closed",
    vendor: "vendor@example.com",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    closeDate: admin.firestore.FieldValue.serverTimestamp(),
  },
];

// Function to seed services
async function seedServices() {
  try {
    const batch = db.batch();
    services.forEach((service) => {
      const serviceRef = db.collection("services").doc();
      batch.set(serviceRef, service);
    });

    await batch.commit();
    console.log("Successfully seeded services data!");
  } catch (error) {
    console.error("Error seeding services:", error.message);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the seeding function
seedServices();
