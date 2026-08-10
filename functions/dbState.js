const admin = require('firebase-admin');

admin.initializeApp({ projectId: "coramdeo-prod" });

const targetDb = new admin.firestore.Firestore({
  projectId: 'coramdeo-prod',
  databaseId: 'coramdeo'
});

async function check() {
  console.log('=== bibleVersions ===');
  const versionsSnap = await targetDb.collection('bibleVersions').get();
  if (versionsSnap.empty) {
    console.log('  (empty)');
  } else {
    versionsSnap.forEach(doc => {
      const d = doc.data();
      console.log(`  ID=${doc.id}  translationId=${d.translationId}  abbreviation=${d.abbreviation}  status=${d.status}  contentVersion=${d.contentVersion}`);
    });
  }

  console.log('\n=== bibleLanguages ===');
  const langSnap = await targetDb.collection('bibleLanguages').get();
  if (langSnap.empty) {
    console.log('  (empty)');
  } else {
    langSnap.forEach(doc => {
      const d = doc.data();
      console.log(`  ID=${doc.id}  name=${d.name}  publishedVersionCount=${d.publishedVersionCount}`);
    });
  }

  console.log('\n=== bibleImports ===');
  const importsSnap = await targetDb.collection('bibleImports').get();
  if (importsSnap.empty) {
    console.log('  (empty)');
  } else {
    importsSnap.forEach(doc => {
      const d = doc.data();
      console.log(`  ID=${doc.id}  translationId=${d.translationId}  abbreviation=${d.abbreviation}  status=${d.status}`);
    });
  }
}

check().catch(console.error);
