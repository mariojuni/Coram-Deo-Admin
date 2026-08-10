const admin = require('firebase-admin');
admin.initializeApp({ projectId: "coramdeo-prod" });
const targetDb = new admin.firestore.Firestore({
  projectId: 'coramdeo-prod',
  databaseId: 'coramdeo'
});

async function check() {
  const versionRef = targetDb.collection('bibleVersions').doc('59');
  const versionSnap = await versionRef.get();
  if (!versionSnap.exists) {
    console.log("ESV not found in database. You need to re-import it!");
    return;
  }
  
  const chSnap = await versionRef.collection('books').doc('GEN').collection('chapters').doc('1').get();
  if (chSnap.exists) {
    const verses = chSnap.data().verses || [];
    console.log("Genesis 1 verses:");
    for (const v of verses.slice(0, 3)) {
      console.log(`Verse ${v.verseNumber}: ${v.heading ? '[HEADING: ' + v.heading + '] ' : ''}${v.content}`);
    }
  } else {
    console.log("Genesis 1 not found");
  }
}

check().catch(console.error);
