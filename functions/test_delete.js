const admin = require('firebase-admin');
admin.initializeApp({projectId: "demo-test"});
console.log(typeof admin.firestore().recursiveDelete);
