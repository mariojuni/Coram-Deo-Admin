import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load staging env
dotenv.config({ path: path.resolve(__dirname, '../.env.staging') });

if (process.env.VITE_APP_ENV === 'production') {
  console.error("FATAL ERROR: Attempting to run staging seed script in production!");
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Seeding staging environment...");
  
  // 1. Create a Test Church
  const churchId = "test_church_123";
  await setDoc(doc(db, "churches", churchId), {
    name: "Test Staging Church",
    location: "Staging Environment",
    createdAt: new Date()
  });
  console.log("Created test church.");

  // 2. Create a Test Member
  await addDoc(collection(db, "members"), {
    churchId,
    firstName: "Test",
    lastName: "Member",
    role: "member",
    createdAt: new Date()
  });
  console.log("Created test member.");
  
  // TODO: Add more test data (ministries, giving, attendance, etc.) as needed

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error during seeding:", err);
  process.exit(1);
});
