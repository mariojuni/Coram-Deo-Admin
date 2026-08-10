const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: 'nazarenechurch-9c030' });
const db = getFirestore();

async function check() {
  const snapshot = await db.collection('bibleImports').get();
  console.log(`Found ${snapshot.size} imports in nazarenechurch-9c030 (default)`);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data().status);
  });
}
check().catch(console.error);
