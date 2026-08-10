const admin = require('firebase-admin');

// Initialize the app. We need to make sure we hit the production database
// GCLOUD_PROJECT is required for application default credentials to know the project.
admin.initializeApp({
    projectId: "coramdeo-prod"
});

const db = admin.firestore();
// production target database is 'coramdeo'
const targetDb = new admin.firestore.Firestore({
  projectId: 'coramdeo-prod',
  databaseId: 'coramdeo'
});


async function check() {
  const versionsSnap = await targetDb.collection('bibleVersions').get();
  console.log(`Found ${versionsSnap.size} versions in coramdeo database.`);
  versionsSnap.forEach(doc => {
      console.log(`Version ${doc.id}: status=${doc.data().status}`);
  });
  
  const importsSnap = await targetDb.collection('bibleImports').get();
  console.log(`\nFound ${importsSnap.size} imports in coramdeo database.`);
  importsSnap.forEach(doc => {
      console.log(`Import ${doc.id}: status=${doc.data().status}`);
  });
}

check().catch(console.error);
