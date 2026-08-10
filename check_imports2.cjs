const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({ projectId: 'coramdeo-prod' });
const dbDefault = getFirestore(app, '(default)');
const dbCoramDeo = getFirestore(app, 'coramdeo');

async function check() {
  const snap1 = await dbDefault.collection('bibleImports').get();
  console.log(`Found ${snap1.size} imports in coramdeo-prod (default)`);
  
  const snap2 = await dbCoramDeo.collection('bibleImports').get();
  console.log(`Found ${snap2.size} imports in coramdeo-prod (coramdeo)`);
}
check().catch(console.error);
