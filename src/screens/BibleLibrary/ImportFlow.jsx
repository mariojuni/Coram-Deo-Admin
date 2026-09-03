import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { UploadCloud, File, AlertTriangle, CheckCircle, ArrowLeft, Loader2, Info, Smartphone, Download, GitBranch, ShieldAlert, Sparkles } from 'lucide-react';

export default function BibleImportFlow() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [versionInfo, setVersionInfo] = useState(null); // { type: 'new'|'update'|'identical', currentVersion, nextVersion, existingHash, newHash }
  const [uploading, setUploading] = useState(false);
  
  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          setJsonData(parsed);
          validateAndExtractMetadata(parsed);
        } catch (error) {
          setValidationErrors(['Invalid JSON file format.']);
        }
      };
      reader.readAsText(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    maxFiles: 1
  });

  const validateAndExtractMetadata = async (data) => {
    const errors = [];
    
    // Basic validation
    if (!data.translation_id) errors.push('Missing translation_id');
    if (!data.translation_abbr) errors.push('Missing translation_abbr');
    if (!data.translation_title) errors.push('Missing translation_title');
    if (!data.language_tag) errors.push('Missing language_tag');
    if (!data.index || !data.index.books || !Array.isArray(data.index.books)) errors.push('Missing or invalid books array');

    setValidationErrors(errors);

    if (errors.length === 0) {
      let bookCount = data.index.books.length;
      let chapterCount = 0;
      let verseCount = 0;
      let noteMarkerCount = 0;
      let crossRefCount = 0;

      // Size estimation: measure actual byte sizes of data the mobile app stores
      // Mobile stores: (1) index JSON blob, (2) per-chapter JSON blobs in SQLite
      let totalVerseTextBytes = 0;  // raw verse content bytes
      let totalChapterJsonBytes = 0; // serialized chapter blobs
      const SQLITE_ROW_OVERHEAD = 80; // bytes per SQLite row (headers, keys, indices)

      data.index.books.forEach(book => {
        if (book.chapters) {
          chapterCount += book.chapters.length;
          book.chapters.forEach(chapter => {
            const passageId = chapter.usfm;
            const chapterData = data.chapters?.[passageId];
            const verses = chapterData?.verses;
            if (verses && Array.isArray(verses)) {
              verseCount += verses.length;
              let chapterVerseBytes = 0; // reset per chapter
              verses.forEach(verse => {
                if (verse.content) {
                  chapterVerseBytes += new TextEncoder().encode(verse.content).length;
                  const markers = verse.content.match(/\{\{note:\d+\}\}/g);
                  if (markers) noteMarkerCount += markers.length;
                }
                if (verse.crossReferences) {
                  crossRefCount += verse.crossReferences.length;
                }
              });
              // Estimate serialized chapter blob size (verse text + verse metadata JSON overhead)
              const verseMetaOverhead = verses.length * 60; // ~60 bytes per verse for id/verseNumber fields
              totalChapterJsonBytes += chapterVerseBytes + verseMetaOverhead + SQLITE_ROW_OVERHEAD;
            }
          });
        }
      });

      // Index blob = book/chapter structure stored as JSON
      const indexJsonBytes = new TextEncoder().encode(JSON.stringify(data.index)).length;

      // Total estimated mobile storage (index + all chapter blobs)
      const estimatedBytes = indexJsonBytes + totalChapterJsonBytes;
      const estimatedMB = estimatedBytes / (1024 * 1024);

      // Categorize size
      let sizeCategory;
      if (estimatedMB < 2) sizeCategory = { label: 'Lightweight', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
      else if (estimatedMB < 8) sizeCategory = { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
      else sizeCategory = { label: 'Large', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };

      const meta = {
        translationId: data.translation_id,
        abbreviation: data.translation_abbr,
        title: data.translation_title,
        languageTag: data.language_tag,
        publisher: data.index?.publisher?.name || 'Public Domain',
        copyright: data.index?.copyright_short?.text || 'None',
        bookCount,
        chapterCount,
        verseCount,
        noteMarkerCount,
        crossRefCount,
        textAvailable: data.index?.text ?? true,
        audioAvailable: data.index?.audio ?? false,
        estimatedBytes,
        indexBytes: indexJsonBytes,
        chapterBytes: totalChapterJsonBytes,
        avgChapterBytes: chapterCount > 0 ? Math.round(totalChapterJsonBytes / chapterCount) : 0,
        sizeCategory,
      };

      setMetadata(meta);

      // --- Version identity check ---
      // Compute SHA-256 of chapters data (matches backend algorithm exactly)
      const contentString = JSON.stringify(data.chapters || {});
      const msgBuffer = new TextEncoder().encode(contentString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const newHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check for existing version in bibleVersions
      const q = query(collection(db, 'bibleVersions'), where('translationId', '==', data.translation_id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setVersionInfo({ type: 'new', nextVersion: 1, newHash });
      } else {
        const existingDoc = querySnapshot.docs[0].data();
        const existingHash = existingDoc.contentHash || null;
        const currentVersion = existingDoc.contentVersion || 1;
        
        // if (existingHash && existingHash === newHash) {
        //   setVersionInfo({ type: 'identical', currentVersion, newHash, existingHash });
        // } else {
          setVersionInfo({ type: 'update', currentVersion, nextVersion: currentVersion + 1, newHash, existingHash });
        // }
      }
    }
  };

  const handleImport = async () => {
    if (!jsonData || !metadata) return;
    setUploading(true);
    
    try {
      const storagePath = `bible_imports/${metadata.translationId}_${Date.now()}.json`;
      const storageRef = ref(storage, storagePath);
      
      // Upload JSON as string
      await uploadString(storageRef, JSON.stringify(jsonData), 'raw', { contentType: 'application/json' });
      
      // Create bibleImports document
      await addDoc(collection(db, 'bibleImports'), {
        translationId: metadata.translationId,
        abbreviation: metadata.abbreviation,
        title: metadata.title,
        status: 'uploaded',
        sourceStoragePath: storagePath,
        importedBy: currentUser.uid,
        startedAt: serverTimestamp(),
        progress: 0,
        warnings: [],
        errors: [],
        booksProcessed: 0,
        totalBooks: metadata.bookCount,
        chaptersProcessed: 0,
        totalChapters: metadata.chapterCount,
        versesProcessed: 0,
        totalVerses: metadata.verseCount,
        metadataSnapshot: metadata
      });

      navigate('/admin/bible-library');
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to start import process. Check console for details.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/admin/bible-library')}
        className="flex items-center text-gray-500 hover:text-church-navy mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Library
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Import Bible Version</h1>

      {!metadata && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-church-navy bg-church-navy/5' : 'border-gray-300 hover:border-church-navy hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {isDragActive ? "Drop JSON file here" : "Drag & drop a Bible JSON file here"}
            </p>
            <p className="text-sm text-gray-500">
              or click to browse from your computer
            </p>
          </div>
          
          {validationErrors.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-bold text-red-800 flex items-center mb-2">
                <AlertTriangle size={16} className="mr-2" />
                Validation Errors
              </h3>
              <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {metadata && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center">
              <File size={24} className="text-church-navy mr-3" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">{file?.name}</h2>
                <p className="text-sm text-gray-500">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => { setMetadata(null); setJsonData(null); setFile(null); }}
              className="text-sm text-gray-500 hover:text-red-600"
              disabled={uploading}
            >
              Cancel
            </button>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Metadata Preview</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <PreviewItem label="Title" value={metadata.title} />
              <PreviewItem label="Abbreviation" value={metadata.abbreviation} />
              <PreviewItem label="Translation ID" value={metadata.translationId} />
              <PreviewItem label="Language Tag" value={metadata.languageTag} />
              <PreviewItem label="Publisher" value={metadata.publisher} />
              <PreviewItem label="Copyright" value={metadata.copyright} />
            </div>

            <div className="border-t border-gray-100 pt-6 mb-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Content Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatBox label="Books" value={metadata.bookCount} />
                <StatBox label="Chapters" value={metadata.chapterCount} />
                <StatBox label="Verses" value={metadata.verseCount} />
                <StatBox label="Note Markers" value={metadata.noteMarkerCount} />
                <StatBox label="Cross Refs" value={metadata.crossRefCount} />
              </div>
            </div>

            {/* Mobile Download Size Estimate */}
            <div className={`border rounded-xl p-5 mb-8 ${metadata.sizeCategory.bg}`}>
              <div className="flex items-center mb-4">
                <Smartphone size={18} className={`${metadata.sizeCategory.color} mr-2`} />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Estimated Mobile Download Size</h3>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${metadata.sizeCategory.color} bg-white border`}>
                  {metadata.sizeCategory.label}
                </span>
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className={`text-4xl font-black ${metadata.sizeCategory.color}`}>{formatBytes(metadata.estimatedBytes)}</span>
                <span className="text-xs text-gray-400 mb-1.5 ml-1">(when fully downloaded offline)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Index Data</p>
                  <p className="text-sm font-bold text-gray-700 mt-0.5">{formatBytes(metadata.indexBytes)}</p>
                  <p className="text-[10px] text-gray-400">Books &amp; chapters map</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chapter Data</p>
                  <p className="text-sm font-bold text-gray-700 mt-0.5">{formatBytes(metadata.chapterBytes)}</p>
                  <p className="text-[10px] text-gray-400">{metadata.chapterCount} chapters total</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg / Chapter</p>
                  <p className="text-sm font-bold text-gray-700 mt-0.5">{formatBytes(metadata.avgChapterBytes)}</p>
                  <p className="text-[10px] text-gray-400">SQLite row size</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 flex items-center">
                <Download size={10} className="mr-1" />
                Estimate based on verse text length + SQLite row overhead. Actual size may vary slightly.
              </p>
            </div>

            {metadata.noteMarkerCount !== metadata.crossRefCount && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                <AlertTriangle size={20} className="text-yellow-600 mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-yellow-800">Note Count Mismatch</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    There are {metadata.noteMarkerCount} note markers ({'{{note:X}}'}) in the text, but {metadata.crossRefCount} cross references defined. The backend importer will attempt to validate and warn about orphans.
                  </p>
                </div>
              </div>
            )}

            {/* Version Identity Banner */}
            {versionInfo && versionInfo.type === 'new' && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start">
                <Sparkles size={20} className="text-emerald-600 mr-3 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-emerald-800">New Bible Version</h4>
                    <span className="text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">v1</span>
                  </div>
                  <p className="text-sm text-emerald-700 mt-1">
                    This is a brand new translation — no existing version found for <code className="bg-emerald-100 px-1 rounded">{metadata.translationId}</code>.
                  </p>
                </div>
              </div>
            )}

            {versionInfo && versionInfo.type === 'update' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start">
                <GitBranch size={20} className="text-blue-600 mr-3 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-blue-800">Content Update Detected</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">v{versionInfo.currentVersion}</span>
                      <span className="text-gray-400 text-xs">→</span>
                      <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">v{versionInfo.nextVersion}</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    This translation ID (<code className="bg-blue-100 px-1 rounded">{metadata.translationId}</code>) already exists but the content has changed. Importing will create <strong>version {versionInfo.nextVersion}</strong>.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="bg-white/80 rounded p-2">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Existing Hash</p>
                      <p className="text-[10px] font-mono text-gray-500 truncate">{versionInfo.existingHash?.slice(0, 16)}…</p>
                    </div>
                    <div className="bg-white/80 rounded p-2">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">New Hash</p>
                      <p className="text-[10px] font-mono text-blue-600 truncate">{versionInfo.newHash?.slice(0, 16)}…</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {versionInfo && versionInfo.type === 'identical' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <ShieldAlert size={20} className="text-red-600 mr-3 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-red-800">Identical Content — Import Blocked</h4>
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">v{versionInfo.currentVersion} (no change)</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    The content of this file is byte-for-byte identical to the existing <strong>v{versionInfo.currentVersion}</strong>. The backend will reject this import. Please make changes to the content before importing.
                  </p>
                  <div className="mt-2 bg-white/80 rounded p-2 inline-block">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Content Hash</p>
                    <p className="text-[10px] font-mono text-red-500">{versionInfo.newHash?.slice(0, 32)}…</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={handleImport}
                disabled={uploading || versionInfo?.type === 'identical'}
                className={`flex items-center px-6 py-2.5 rounded-lg font-bold text-white transition-colors ${
                  uploading || versionInfo?.type === 'identical' ? 'bg-church-navy/40 cursor-not-allowed' : 'bg-church-navy hover:bg-church-navy/90'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="mr-2" />
                    Start Import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
      <p className="text-xl font-bold text-church-navy">{value.toLocaleString()}</p>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

/** Smart byte formatter: auto-selects B / KB / MB based on magnitude */
function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
