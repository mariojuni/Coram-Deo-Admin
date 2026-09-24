import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "coramdeo");

async function main() {
  const ref = doc(db, 'users', 'jqhUjgROuNP1aqHJ0IRFFzQPA3A2');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    console.log("users doc:", snap.data());
  } else {
    console.log("users doc DOES NOT EXIST");
  }
  
  try {
    const accRef = doc(db, 'userAccounts', 'jqhUjgROuNP1aqHJ0IRFFzQPA3A2');
    const accSnap = await getDoc(accRef);
    if (accSnap.exists()) {
      console.log("userAccounts doc:", accSnap.data());
    } else {
      console.log("userAccounts doc DOES NOT EXIST");
    }
  } catch (e) {
    console.log("Could not read userAccounts:", e.message);
  }
  process.exit(0);
}
main();
