const admin = require('firebase-admin');

admin.initializeApp({ projectId: "coramdeo-prod" });

const targetDb = new admin.firestore.Firestore({
  projectId: 'coramdeo-prod',
  databaseId: 'coramdeo'
});

const TRANSLATION_ID = '59'; // ESV

async function deleteCollection(collectionRef) {
  const snap = await collectionRef.get();
  if (snap.empty) return;
  const batch = targetDb.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`  Deleted ${snap.size} docs from ${collectionRef.path}`);
}

async function deleteVersionWithSubcollections(versionId) {
  const versionRef = targetDb.collection('bibleVersions').doc(versionId);
  const versionSnap = await versionRef.get();

  if (!versionSnap.exists) {
    console.log(`bibleVersions/${versionId} does not exist, skipping.`);
  } else {
    // Delete books subcollection + each book's chapters subcollection
    const booksSnap = await versionRef.collection('books').get();
    for (const bookDoc of booksSnap.docs) {
      const chaptersRef = bookDoc.ref.collection('chapters');
      await deleteCollection(chaptersRef);
      await bookDoc.ref.delete();
      process.stdout.write('.');
    }
    console.log(`\n  Deleted ${booksSnap.size} books.`);

    // Delete the root version doc
    await versionRef.delete();
    console.log(`  Deleted bibleVersions/${versionId}`);
  }
}

async function deleteImports(translationId) {
  const importsSnap = await targetDb.collection('bibleImports')
    .where('translationId', '==', Number(translationId))
    .get();
  // Also try string match
  const importsSnapStr = await targetDb.collection('bibleImports')
    .where('translationId', '==', translationId)
    .get();
  
  const allDocs = new Map();
  importsSnap.docs.forEach(d => allDocs.set(d.id, d));
  importsSnapStr.docs.forEach(d => allDocs.set(d.id, d));

  if (allDocs.size === 0) {
    console.log('  No bibleImports found for ESV.');
  } else {
    const batch = targetDb.batch();
    allDocs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(`  Deleted ${allDocs.size} bibleImport docs.`);
  }
}

async function run() {
  console.log(`Deleting ESV (translationId=${TRANSLATION_ID}) from production database...`);

  console.log('\n[1/2] Deleting bibleVersions/59 and all subcollections...');
  await deleteVersionWithSubcollections(TRANSLATION_ID);

  console.log('\n[2/2] Deleting bibleImports for ESV...');
  await deleteImports(TRANSLATION_ID);

  console.log('\nDone! ESV has been completely removed.');
}

run().catch(console.error);
