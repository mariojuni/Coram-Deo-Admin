const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function publishValidatedVersions() {
  const versionsSnapshot = await db.collection('bibleVersions').where('status', '==', 'validated').get();
  
  if (versionsSnapshot.empty) {
    console.log('No validated versions found.');
    return;
  }
  
  const batch = db.batch();
  versionsSnapshot.forEach(doc => {
    batch.update(doc.ref, { status: 'published' });
    console.log(`Setting version ${doc.id} to published.`);
  });
  
  await batch.commit();
  console.log('Successfully published all validated versions.');
}

publishValidatedVersions().catch(console.error);
