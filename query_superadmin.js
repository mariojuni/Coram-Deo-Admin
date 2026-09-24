import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

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
  const q = query(collection(db, 'users'), where('email', 'in', ['mjuni777@gmail.com', 'maryow@example.com', 'mariojuni']));
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} users`);
  snap.forEach(doc => {
    console.log("ID:", doc.id, "=>", doc.data());
  });
  
  const q2 = query(collection(db, 'userAccounts'), where('email', 'in', ['mjuni777@gmail.com', 'maryow@example.com', 'mariojuni']));
  try {
    const snap2 = await getDocs(q2);
    console.log(`Found ${snap2.size} userAccounts`);
  } catch (e) {
    console.log("Could not read userAccounts");
  }

  process.exit(0);
}
main();
