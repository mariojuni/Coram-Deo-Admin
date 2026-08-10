const admin = require('firebase-admin');

admin.initializeApp({
    projectId: "coramdeo-prod"
});

const targetDb = new admin.firestore.Firestore({
  projectId: 'coramdeo-prod',
  databaseId: 'coramdeo'
});

async function fix() {
  const versionsSnap = await targetDb.collection('bibleVersions').get();
  const batch = targetDb.batch();
  
  versionsSnap.forEach(doc => {
      if (doc.data().status === 'validated') {
          batch.update(doc.ref, { status: 'published' });
          console.log(`Setting version ${doc.id} to published.`);
      }
  });
  
  const importsSnap = await targetDb.collection('bibleImports').get();
  importsSnap.forEach(doc => {
      if (doc.data().status === 'validated') {
          batch.update(doc.ref, { status: 'published' });
          console.log(`Setting import ${doc.id} to published.`);
      }
  });
  
  await batch.commit();
  console.log("Done.");
}

fix().catch(console.error);
