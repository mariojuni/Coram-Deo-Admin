const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const crypto = require("crypto");

const isProd = process.env.GCLOUD_PROJECT === 'coramdeo-prod';
const targetDatabase = isProd ? "coramdeo" : "(default)";

/**
 * Triggers when a new Bible import is added.
 * Downloads the JSON from Storage, normalizes it, and saves it into canonical format.
 */
exports.processBibleImport = onDocumentCreated(
  {
    document: "bibleImports/{importId}",
    database: targetDatabase,
    region: "us-central1",
    timeoutSeconds: 540,
    memory: "1GiB"
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return null;
    
    const importId = event.params.importId;
    const data = snap.data();
    const db = snap.ref.firestore;
    
    if (data.status !== "uploaded") {
      return null;
    }
    
    try {
      await snap.ref.update({ status: "processing" });
      
      const bucket = admin.storage().bucket();
      const file = bucket.file(data.sourceStoragePath);
      const [fileContent] = await file.download();
      const rawBible = JSON.parse(fileContent.toString("utf-8"));
      
      // Basic validation
      const warnings = [];
      const errors = [];
      
      const translationId = String(rawBible.translation_id);
      
      // Calculate content hash for duplicate detection
      // To ensure stable hash, only hash the canonical data (chapters)
      const contentString = JSON.stringify(rawBible.chapters || {});
      const contentHash = crypto.createHash("sha256").update(contentString).digest("hex");
      
      // Check for existing version and content Hash
      const existingRef = db.collection("bibleVersions").doc(translationId);
      const existingSnap = await existingRef.get();
      
      let contentVersion = 1;
      
      if (existingSnap.exists) {
        const existingData = existingSnap.data();
        if (existingData.contentHash === contentHash) {
          await snap.ref.update({
            status: "failed",
            errors: ["Duplicate content: This exact Bible content already exists."]
          });
          return null;
        } else {
          contentVersion = (existingData.contentVersion || 1) + 1;
          warnings.push(`Content differs from existing version. Creating contentVersion ${contentVersion}.`);
        }
      }
      
      await snap.ref.update({ status: "validating", progress: 10 });
      
      // 1. Prepare Root Version Metadata
      const versionMetadata = {
        id: translationId,
        translationId: translationId,
        abbreviation: rawBible.translation_abbr || rawBible.index?.abbreviation || "",
        localAbbreviation: rawBible.index?.local_abbreviation || "",
        title: rawBible.translation_title || rawBible.index?.title || "",
        localTitle: rawBible.index?.local_title || "",
        languageTag: rawBible.language_tag || rawBible.index?.language?.tag || "en",
        language: {
          iso6391: rawBible.index?.language?.iso_639_1 || null,
          iso6393: rawBible.index?.language?.iso_639_3 || rawBible.language_tag,
          name: rawBible.index?.language?.name || rawBible.language_tag,
          localName: rawBible.index?.language?.local_name || rawBible.language_tag,
          textDirection: rawBible.index?.language?.text_direction || "ltr"
        },
        capabilities: {
          text: rawBible.index?.text ?? true,
          audio: rawBible.index?.audio ?? false,
          audioCount: rawBible.index?.audio_count ?? 0
        },
        publisher: {
          id: rawBible.index?.publisher?.id || "",
          name: rawBible.index?.publisher?.name || "Public Domain",
          localName: rawBible.index?.publisher?.local_name || "",
          url: rawBible.index?.publisher?.url || ""
        },
        copyright: {
          shortText: rawBible.copyright_short || rawBible.index?.copyright_short?.text || "",
          shortHtml: rawBible.index?.copyright_short?.html || "",
          longText: rawBible.copyright_long || rawBible.index?.copyright_long?.text || "",
          longHtml: rawBible.index?.copyright_long?.html || ""
        },
        readerFooter: rawBible.index?.reader_footer || {},
        bookCount: data.metadataSnapshot?.bookCount || rawBible.index?.books?.length || 0,
        chapterCount: data.metadataSnapshot?.chapterCount || 0,
        verseCount: data.metadataSnapshot?.verseCount || 0,
        status: "published",
        schemaVersion: 1,
        contentVersion: contentVersion,
        contentHash: contentHash,
        sourceFormat: "json",
        importedBy: data.importedBy,
        importedAt: data.startedAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // 2. Normalize and Save Content
      // Since saving a whole Bible can take many writes, we use batches.
      let batch = db.batch();
      let writeCount = 0;
      
      const commitBatch = async () => {
        if (writeCount > 0) {
          await batch.commit();
          batch = db.batch();
          writeCount = 0;
        }
      };
      
      // Set the root document
      batch.set(existingRef, versionMetadata, { merge: true });
      writeCount++;
      
      let processedBooks = 0;
      let processedChapters = 0;
      let processedVerses = 0;
      
      for (const book of (rawBible.index?.books || [])) {
        const bookId = book.id || book.usfm;
        if (!bookId) continue;
        
        const bookRef = existingRef.collection("books").doc(bookId);
        const bookData = {
          id: bookId,
          usfm: book.usfm || bookId,
          name: book.name || book.human || bookId,
          longName: book.long_name || book.longName || "",
          abbreviation: book.abbreviation || "",
          canon: book.canon || "other",
          order: book.order || processedBooks,
          chapterCount: book.chapters?.length || 0,
          textAvailable: book.text_available ?? book.text ?? true,
          audioAvailable: book.audio_available ?? book.audio ?? false
        };
        
        batch.set(bookRef, bookData);
        writeCount++;
        if (writeCount >= 400) await commitBatch();
        
        for (const chapter of (book.chapters || [])) {
          const passageId = chapter.usfm;
          const chapterNumber = parseInt(chapter.number || chapter.human || chapter.chapter, 10);
          if (isNaN(chapterNumber)) continue;
          
          const chapterRef = bookRef.collection("chapters").doc(String(chapterNumber));
          const rawVerses = rawBible.chapters?.[passageId]?.verses || [];
          
          const normalizedVerses = rawVerses.map(verse => {
            const verseNumStr = String(verse.number || verse.verseNumber || verse.verse || verse.human_reference);
            const verseContent = verse.content || verse.text || "";
            
            // Extract cross-references / notes mapping
            const normalizedNotes = [];
            const rawCrossRefs = verse.crossReferences || [];
            
            // Look for {{note:X}} markers in the content
            const noteRegex = /\{\{note:(\d+)\}\}/g;
            let match;
            while ((match = noteRegex.exec(verseContent)) !== null) {
              const noteIndex = parseInt(match[1], 10);
              const rawRef = rawCrossRefs[noteIndex] || "";
              
              if (rawRef) {
                // In Phase 2, we normalize these simply by attaching the raw string.
                // Later a canonical parser could split this further.
                normalizedNotes.push({
                  index: noteIndex,
                  type: "cross_reference",
                  raw: rawRef
                });
              }
            }
            
            processedVerses++;
            
            const verseObj = {
              id: `${bookId}.${chapterNumber}.${verseNumStr}`,
              verseNumber: verseNumStr,
              content: verseContent
            };
            
            if (normalizedNotes.length > 0) {
              verseObj.notes = normalizedNotes;
            }
            
            return verseObj;
          });
          
          batch.set(chapterRef, {
            versionId: translationId,
            bookId: bookId,
            chapterNumber: chapterNumber,
            verses: normalizedVerses
          });
          
          writeCount++;
          processedChapters++;
          if (writeCount >= 400) await commitBatch();
        }
        
        processedBooks++;
        
        // Update progress occasionally
        if (processedBooks % 5 === 0) {
          const progress = 10 + Math.floor((processedBooks / versionMetadata.bookCount) * 80);
          await snap.ref.update({ 
            progress,
            booksProcessed: processedBooks,
            chaptersProcessed: processedChapters,
            versesProcessed: processedVerses
          });
        }
      }
      
      await commitBatch();
      
      // Update import status to validated
      await snap.ref.update({
        status: "validated",
        progress: 100,
        booksProcessed: processedBooks,
        chaptersProcessed: processedChapters,
        versesProcessed: processedVerses,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        warnings: warnings,
        errors: errors
      });
      
    } catch (error) {
      console.error("Bible Import Processing Error:", error);
      await snap.ref.update({
        status: "failed",
        errors: [error.message || "Unknown error during processing."]
      });
    }
  }
);

/**
 * Triggers when a Bible version is updated.
 * Handles language count aggregation if published status changes.
 */
exports.onBibleVersionUpdated = onDocumentWritten(
  {
    document: "bibleVersions/{versionId}",
    database: targetDatabase,
    region: "us-central1",
    timeoutSeconds: 60
  },
  async (event) => {
    const change = event.data;
    if (!change) return null;
    
    const db = change.after.exists ? change.after.ref.firestore : change.before.ref.firestore;
    
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;
    
    const wasPublished = beforeData && beforeData.status === "published";
    const isPublished = afterData && afterData.status === "published";
    
    // Check if the published status actually changed
    if (wasPublished === isPublished) {
      return null;
    }
    
    // We need to increment or decrement the count on the bibleLanguages doc.
    const languageTag = (afterData && afterData.languageTag) || (beforeData && beforeData.languageTag);
    if (!languageTag) return null;
    
    const langRef = db.collection("bibleLanguages").doc(languageTag);
    
    await db.runTransaction(async (transaction) => {
      const langDoc = await transaction.get(langRef);
      
      let count = 0;
      if (langDoc.exists) {
        count = langDoc.data().publishedVersionCount || 0;
      }
      
      if (isPublished && !wasPublished) {
        count += 1;
      } else if (wasPublished && !isPublished) {
        count -= 1;
        if (count < 0) count = 0;
      }
      
      if (!langDoc.exists && isPublished) {
        // Create language document
        const langData = afterData.language || {
          iso6393: languageTag,
          name: languageTag,
          localName: languageTag,
          textDirection: "ltr"
        };
        transaction.set(langRef, {
          id: languageTag,
          ...langData,
          publishedVersionCount: count,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (langDoc.exists) {
        transaction.update(langRef, {
          publishedVersionCount: count,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    
    return null;
  }
);
