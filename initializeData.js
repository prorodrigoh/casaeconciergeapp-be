// const admin = require("firebase-admin");
// const serviceAccount = require("./casaeconciergeapp-firebase-key.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
// const db = admin.firestore();

// async function initializeData() {
//   const categories = [
//     "General",
//     "Maintenance",
//     "Cleaning",
//     "Car",
//     "Setup",
//     "Translation",
//     "Shopping",
//     "Inspect",
//     "Financial",
//     "System",
//     "Booking",
//     "Move in",
//     "Rents",
//   ];
//   for (const name of categories) {
//     await db.collection("categories").add({ name });
//   }

//   const services = {
//     General: ["Extra services"],
//     Cleaning: [
//       "Move in & Move out",
//       "Regular cleaning",
//       "Deep cleaning",
//       "Window cleaning",
//       "Pressure wash",
//     ],
//     Car: [
//       "Sunpass",
//       "Car wash",
//       "Maintenance",
//       "Registration",
//       "Insurance",
//       "Change battery",
//       "Flat tire",
//       "Change oil",
//       "Put fuel",
//     ],
//     Setup: [
//       "Landscape services",
//       "Pool services",
//       "TV Cable",
//       "FPL",
//       "Water",
//       "Alarm",
//       "Automation system",
//       "Internet",
//       "Pest Control",
//       "Locksmith",
//       "Schedule cleaning",
//     ],
//     Translation: ["Call", "Documents"],
//     Shopping: ["Grocery", "Appliance", "House parts"],
//     Inspect: ["Delivery", "Services"],
//     Financial: [
//       "Go to the bank",
//       "Online payment",
//       "Deposit",
//       "Low balance alert",
//     ],
//     System: ["Report Error", "Training", "Presentation"],
//     Booking: [
//       "Reservation",
//       "Entrance authorization",
//       "Schedule classes",
//       "Buy tickets",
//     ],
//     "Move in": ["Start setup", "Booking lift", "Decoration"],
//     Rents: ["Boat", "Car", "Motorcycle"],
//   };
//   for (const [category, serviceList] of Object.entries(services)) {
//     for (const name of serviceList) {
//       await db.collection("services").add({ category, name });
//     }
//   }
//   console.log("Data initialized successfully");
// }

// initializeData().catch(console.error);
