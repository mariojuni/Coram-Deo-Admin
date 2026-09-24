const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query } = require('firebase/firestore');

// Since we can't connect from the terminal easily without the exact firebase config or admin sdk
