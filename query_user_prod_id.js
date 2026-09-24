import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiW6T8eeCy9SHaA-bP12oERod2AA4ht9A",
  authDomain: "coramdeo-prod.firebaseapp.com",
  projectId: "coramdeo-prod",
  storageBucket: "coramdeo-prod.firebasestorage.app",
  messagingSenderId: "130463348213",
  appId: "1:130463348213:web:56e7fc5bfd0759115d5cbc",
  measurementId: "G-7VB550X705"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "coramdeo");

async function main() {
  const ref = doc(db, 'users', 'p5DKArAQXte1XM2e57of2efwbc13');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    console.log("users doc PROD:", snap.data());
  } else {
    console.log("users doc PROD DOES NOT EXIST");
  }
  process.exit(0);
}
main();
