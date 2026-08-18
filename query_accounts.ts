import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

initializeApp();
const db = getFirestore(undefined, process.env.VITE_FIREBASE_DATABASE_ID);
const q = await db.collection('donationAccounts').get();
console.log(`Found ${q.size} documents in donationAccounts`);
q.docs.forEach(doc => console.log(doc.id, doc.data()));
