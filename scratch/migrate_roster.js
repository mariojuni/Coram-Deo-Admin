import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";

// I can't easily init firebase without the config which is inside the app.
