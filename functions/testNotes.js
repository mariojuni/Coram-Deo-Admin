const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'coramdeo-prod' });
const db = new admin.firestore.Firestore({ projectId: 'coramdeo-prod', databaseId: 'coramdeo' });
async function check() {
  const versionsSnap = await db.collection('bibleVersions').get();
  for (let vDoc of versionsSnap.docs) {
    const chaptersSnap = await db.collection(`bibleVersions/${vDoc.id}/books/GEN/chapters`).limit(1).get();
    for (let cDoc of chaptersSnap.docs) {
      console.log('Version:', vDoc.id, 'Chapter:', cDoc.id);
      const verses = cDoc.data().verses || [];
      const withNotes = verses.filter(v => v.notes && v.notes.length > 0);
      console.log(`Verses with notes: ${withNotes.length} out of ${verses.length}`);
      if (withNotes.length > 0) {
        console.log('Sample verse:', withNotes[0].verseNumber, withNotes[0].content, withNotes[0].notes);
      }
    }
  }
}
check().catch(console.error).finally(() => process.exit(0));
