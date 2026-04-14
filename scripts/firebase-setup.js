/**
 * Firebase Setup Script
 * Run this once to initialize your Firebase project with demo users and security rules.
 *
 * Usage:
 *   1. Install: npm install -g firebase-tools
 *   2. Login: firebase login
 *   3. Set project: firebase use YOUR_PROJECT_ID
 *   4. Run: node scripts/firebase-setup.js
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

// Path to your service account key JSON
// Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

const DEMO_USERS = [
  {
    email: "admin@buildsnap.de",
    password: "BuildSnap2024!",
    displayName: "Max Admin",
    role: "admin",
  },
  {
    email: "mitarbeiter@buildsnap.de",
    password: "BuildSnap2024!",
    displayName: "Anna Müller",
    role: "employee",
  },
  {
    email: "marketing@buildsnap.de",
    password: "BuildSnap2024!",
    displayName: "Tom Marketing",
    role: "marketing",
  },
];

async function createUsers() {
  console.log("Creating demo users...");
  for (const u of DEMO_USERS) {
    try {
      const userRecord = await auth.createUser({
        email: u.email,
        password: u.password,
        displayName: u.displayName,
      });
      await db.collection("users").doc(userRecord.uid).set({
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        createdAt: new Date(),
      });
      console.log(`✅ Created: ${u.email} (${u.role})`);
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        console.log(`⚠️  Already exists: ${u.email}`);
      } else {
        console.error(`❌ Error creating ${u.email}:`, err.message);
      }
    }
  }
}

async function createIndexes() {
  console.log("\nNote: Create these Firestore composite indexes manually in the Firebase Console:");
  console.log("  Collection: images");
  console.log("    - projectId (ASC) + uploadedAt (DESC)");
  console.log("    - isFavorite (ASC) + uploadedAt (DESC)");
  console.log("  Collection: uploadLinks");
  console.log("    - token (ASC) + active (ASC)");
  console.log("    - projectId (ASC) + createdAt (DESC)");
}

createUsers()
  .then(createIndexes)
  .then(() => {
    console.log("\n✨ Setup complete!");
    console.log("\nDemo login credentials:");
    DEMO_USERS.forEach((u) => {
      console.log(`  ${u.role.padEnd(12)} ${u.email} / ${u.password}`);
    });
    process.exit(0);
  })
  .catch((err) => {
    console.error("Setup failed:", err);
    process.exit(1);
  });
