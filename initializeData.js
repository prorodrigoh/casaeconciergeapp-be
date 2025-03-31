// const admin = require("firebase-admin");
// const serviceAccount = require("./casaeconciergeapp-firebase-key.json");

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://casaeconciergeapp.firebaseio.com",
// });

// const db = admin.firestore();

// async function initializeData() {
//   try {
//     // Step 1: Create Firestore Composite Index
//     console.log("Creating Firestore composite index for services...");
//     const indexDefinition = {
//       collectionGroup: "services",
//       queryScope: "COLLECTION",
//       fieldOverrides: [
//         {
//           fieldPath: "vendor",
//           order: "ASCENDING",
//         },
//         {
//           fieldPath: "status",
//           order: "ASCENDING",
//         },
//       ],
//     };
//     // Note: Firestore Admin SDK doesn’t directly support creating indexes programmatically in Node.js.
//     // We’ll simulate this by logging the command and instructing manual creation if needed.
//     // For production, you’d typically define this in firestore.indexes.json and deploy via CLI.
//     console.log(
//       "Firestore index creation requires manual setup or CLI deployment. Please run:\n" +
//       "firebase firestore:indexes > firestore.indexes.json\n" +
//       "Then add the following to firestore.indexes.json and deploy with 'firebase deploy':\n" +
//       JSON.stringify({ indexes: [indexDefinition] }, null, 2)
//     );
//     // Alternatively, manually create via Firebase Console as a one-time step.

//     // Step 2: Create First Admin User (pro.rodrigoh@gmail.com)
//     console.log("Creating Admin user: pro.rodrigoh@gmail.com...");
//     const adminEmail = "pro.rodrigoh@gmail.com";
//     const adminUserRef = db.collection("users").doc(adminEmail);
//     const adminUserData = {
//       email: adminEmail,
//       activeUser: true,
//       firstName: "Rodrigo",
//       lastName: "Pro",
//       role: "Admin",
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//     };

//     // Check if user already exists in Firestore
//     const adminDoc = await adminUserRef.get();
//     if (!adminDoc.exists) {
//       await adminUserRef.set(adminUserData);
//       try {
//         const user = await admin.auth().createUser({
//           email: adminEmail,
//           password: "admin123", // Change this to a secure password
//           displayName: "Rodrigo Pro",
//           disabled: false,
//         });
//         await admin.auth().setCustomUserClaims(user.uid, { role: "Admin" });
//         console.log(`Admin user ${adminEmail} created in Auth and Firestore.`);
//       } catch (error) {
//         if (error.code === "auth/email-already-exists") {
//           const user = await admin.auth().getUserByEmail(adminEmail);
//           await admin.auth().setCustomUserClaims(user.uid, { role: "Admin" });
//           console.log(`Admin user ${adminEmail} already exists, updated custom claims.`);
//         } else {
//           throw error;
//         }
//       }
//     } else {
//       await adminUserRef.update({ role: "Admin" }); // Ensure role is correct
//       const user = await admin.auth().getUserByEmail(adminEmail);
//       await admin.auth().setCustomUserClaims(user.uid, { role: "Admin" });
//       console.log(`Admin user ${adminEmail} already in Firestore, updated role and claims.`);
//     }

//     // Step 3: Seed Categories
//     console.log("Seeding categories...");
//     const categories = [
//       "General",
//       "Maintenance",
//       "Cleaning",
//       "Car",
//       "Setup",
//       "Translation",
//       "Shopping",
//       "Inspect",
//       "Financial",
//       "System",
//       "Booking",
//       "Move in",
//       "Rents",
//     ];
//     const categoryRefs = {};
//     for (const name of categories) {
//       const docRef = await db.collection("categories").add({ name });
//       categoryRefs[name] = docRef.id;
//       console.log(`Category "${name}" added with ID: ${docRef.id}`);
//     }

//     // Step 4: Seed Services with Vendor and Status
//     console.log("Seeding services...");
//     const services = {
//       General: [{ name: "Extra services", status: "Open", vendor: null }],
//       Cleaning: [
//         { name: "Move in & Move out", status: "Open", vendor: null },
//         { name: "Regular cleaning", status: "Open", vendor: null },
//         { name: "Deep cleaning", status: "Open", vendor: "vendor@example.com" },
//         { name: "Window cleaning", status: "Closed", vendor: "vendor@example.com", closeDate: admin.firestore.FieldValue.serverTimestamp() },
//         { name: "Pressure wash", status: "Open", vendor: null },
//       ],
//       Car: [
//         { name: "Sunpass", status: "Open", vendor: null },
//         { name: "Car wash", status: "Open", vendor: null },
//         { name: "Maintenance", status: "Open", vendor: null },
//         { name: "Registration", status: "Open", vendor: null },
//         { name: "Insurance", status: "Open", vendor: null },
//         { name: "Change battery", status: "Open", vendor: null },
//         { name: "Flat tire", status: "Open", vendor: null },
//         { name: "Change oil", status: "Open", vendor: null },
//         { name: "Put fuel", status: "Open", vendor: null },
//       ],
//       Setup: [
//         { name: "Landscape services", status: "Open", vendor: null },
//         { name: "Pool services", status: "Open", vendor: null },
//         { name: "TV Cable", status: "Open", vendor: null },
//         { name: "FPL", status: "Open", vendor: null },
//         { name: "Water", status: "Open", vendor: null },
//         { name: "Alarm", status: "Open", vendor: null },
//         { name: "Automation system", status: "Open", vendor: null },
//         { name: "Internet", status: "Open", vendor: null },
//         { name: "Pest Control", status: "Open", vendor: null },
//         { name: "Locksmith", status: "Open", vendor: null },
//         { name: "Schedule cleaning", status: "Open", vendor: null },
//       ],
//       Translation: [
//         { name: "Call", status: "Open", vendor: null },
//         { name: "Documents", status: "Open", vendor: null },
//       ],
//       Shopping: [
//         { name: "Grocery", status: "Open", vendor: null },
//         { name: "Appliance", status: "Open", vendor: null },
//         { name: "House parts", status: "Open", vendor: null },
//       ],
//       Inspect: [
//         { name: "Delivery", status: "Open", vendor: null },
//         { name: "Services", status: "Open", vendor: null },
//       ],
//       Financial: [
//         { name: "Go to the bank", status: "Open", vendor: null },
//         { name: "Online payment", status: "Open", vendor: null },
//         { name: "Deposit", status: "Open", vendor: null },
//         { name: "Low balance alert", status: "Open", vendor: null },
//       ],
//       System: [
//         { name: "Report Error", status: "Open", vendor: null },
//         { name: "Training", status: "Open", vendor: null },
//         { name: "Presentation", status: "Open", vendor: null },
//       ],
//       Booking: [
//         { name: "Reservation", status: "Open", vendor: null },
//         { name: "Entrance authorization", status: "Open", vendor: null },
//         { name: "Schedule classes", status: "Open", vendor: null },
//         { name: "Buy tickets", status: "Open", vendor: null },
//       ],
//       "Move in": [
//         { name: "Start setup", status: "Open", vendor: null },
//         { name: "Booking lift", status: "Open", vendor: null },
//         { name: "Decoration", status: "Open", vendor: null },
//       ],
//       Rents: [
//         { name: "Boat", status: "Open", vendor: null },
//         { name: "Car", status: "Open", vendor: null },
//         { name: "Motorcycle", status: "Open", vendor: null },
//       ],
//     };

//     // Seed a test vendor user
//     const vendorEmail = "vendor@example.com";
//     const vendorUserRef = db.collection("users").doc(vendorEmail);
//     const vendorUserData = {
//       email: vendorEmail,
//       activeUser: true,
//       firstName: "Test",
//       lastName: "Vendor",
//       role: "Vendor",
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//     };
//     const vendorDoc = await vendorUserRef.get();
//     if (!vendorDoc.exists) {
//       await vendorUserRef.set(vendorUserData);
//       try {
//         const vendorUser = await admin.auth().createUser({
//           email: vendorEmail,
//           password: "vendor123",
//           displayName: "Test Vendor",
//           disabled: false,
//         });
//         await admin.auth().setCustomUserClaims(vendorUser.uid, { role: "Vendor" });
//         console.log(`Vendor user ${vendorEmail} created in Auth and Firestore.`);
//       } catch (error) {
//         if (error.code === "auth/email-already-exists") {
//           const vendorUser = await admin.auth().getUserByEmail(vendorEmail);
//           await admin.auth().setCustomUserClaims(vendorUser.uid, { role: "Vendor" });
//           console.log(`Vendor user ${vendorEmail} already exists, updated custom claims.`);
//         } else {
//           throw error;
//         }
//       }
//     } else {
//       await vendorUserRef.update({ role: "Vendor" });
//       const vendorUser = await admin.auth().getUserByEmail(vendorEmail);
//       await admin.auth().setCustomUserClaims(vendorUser.uid, { role: "Vendor" });
//       console.log(`Vendor user ${vendorEmail} already in Firestore, updated role and claims.`);
//     }

//     // Seed services
//     for (const [category, serviceList] of Object.entries(services)) {
//       for (const service of serviceList) {
//         const serviceData = {
//           category,
//           name: service.name,
//           status: service.status || "Open",
//           vendor: service.vendor || null,
//           createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         };
//         if (service.vendor) {
//           serviceData.assignedAt = admin.firestore.FieldValue.serverTimestamp();
//         }
//         if (service.closeDate) {
//           serviceData.closeDate = service.closeDate;
//         }
//         const docRef = await db.collection("services").add(serviceData);
//         console.log(`Service "${service.name}" in "${category}" added with ID: ${docRef.id}`);
//       }
//     }

//     console.log("Data initialization completed successfully!");
//   } catch (error) {
//     console.error("Error initializing data:", error.message);
//   } finally {
//     process.exit(0);
//   }
// }

// initializeData();
