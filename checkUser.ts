import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

async function checkUser() {
  try {
    const docRef = doc(db, 'users', 'RS2w5oYCH8gOFjhWpUVhcyw6YPB2');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('Document data:', JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log('No such document!');
    }
  } catch (e) {
    console.error('Error fetching document:', e);
  }
}

checkUser();
