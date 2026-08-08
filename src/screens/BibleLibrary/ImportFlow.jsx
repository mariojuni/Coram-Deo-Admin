import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { UploadCloud, File, AlertTriangle, CheckCircle, ArrowLeft, Loader2, Info } from 'lucide-react';

export default function BibleImportFlow() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isDuplicate, setIsDuplicate] = useState(false);
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

      data.index.books.forEach(book => {
        if (book.chapters) {
          chapterCount += book.chapters.length;
          book.chapters.forEach(chapter => {
            const passageId = chapter.usfm;
            const verses = data.chapters?.[passageId]?.verses;
            if (verses && Array.isArray(verses)) {
              verseCount += verses.length;
              verses.forEach(verse => {
                if (verse.content) {
                  const markers = verse.content.match(/\{\{note:\d+\}\}/g);
                  if (markers) noteMarkerCount += markers.length;
                }
                if (verse.crossReferences) {
                  crossRefCount += verse.crossReferences.length;
                }
              });
            }
          });
        }
      });

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
      };

      setMetadata(meta);

      // Check for duplicate translationId in bibleVersions
      const q = query(collection(db, 'bibleVersions'), where('translationId', '==', data.translation_id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setIsDuplicate(true);
      } else {
        setIsDuplicate(false);
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

            {isDuplicate && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                <Info size={20} className="text-blue-600 mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-blue-800">Existing Translation ID</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This translation ID ({metadata.translationId}) already exists. If the content differs, a new contentVersion will be created. If it is identical, the import may be blocked by the backend.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={handleImport}
                disabled={uploading}
                className={`flex items-center px-6 py-2.5 rounded-lg font-bold text-white transition-colors ${
                  uploading ? 'bg-church-navy/50 cursor-not-allowed' : 'bg-church-navy hover:bg-church-navy/90'
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
