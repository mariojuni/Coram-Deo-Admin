import React, { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { createSong, createSetlist, createSetlistItem } from './worshipService';
import { parseAndValidateJSONEnvelope } from '../../utils/jsonImportExport';

export default function SongImportModal({ isOpen, onClose, churchId, onImportSuccess }) {
  const [jsonFile, setJsonFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [importType, setImportType] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        setError('Please upload a valid JSON file.');
        return;
      }
      setJsonFile(file);
      setError('');

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const rawString = event.target.result;
          const result = parseAndValidateJSONEnvelope(rawString, [
            'song',
            'songs_bulk',
            'setlist',
            'setlists_bulk'
          ]);

          if (!result.success) {
            setError(result.error);
            setPreviewData(null);
            return;
          }

          setImportType(result.type);
          setPreviewData(result.data);
        } catch (err) {
          setError('Failed to parse JSON file.');
          setPreviewData(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!previewData || !churchId) return;
    setLoading(true);
    setError('');

    try {
      if (importType === 'song' || importType === 'songs_bulk') {
        const songsToImport = Array.isArray(previewData) ? previewData : [previewData];
        for (const song of songsToImport) {
          delete song.id;
          await createSong({
            ...song,
            churchId
          });
        }
      } else if (importType === 'setlist' || importType === 'setlists_bulk') {
        const setlistsToImport = Array.isArray(previewData) ? previewData : [previewData];
        for (const setlistData of setlistsToImport) {
          const { items, ...meta } = setlistData;
          delete meta.id;
          
          const newSetlistId = await createSetlist({
            ...meta,
            churchId
          });

          if (items && Array.isArray(items)) {
            for (const item of items) {
              delete item.id;
              await createSetlistItem({
                ...item,
                setlistId: newSetlistId,
                churchId
              });
            }
          }
        }
      }

      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to import JSON: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-church-navy/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mr-3">
              <Upload size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-church-navy">Import Songs / Setlists JSON</h2>
              <p className="text-sm text-gray-500">Upload single or bulk songs or worship setlists</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start">
              <AlertCircle size={16} className="mt-0.5 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 relative hover:bg-gray-100 transition-colors">
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-church-navy font-medium">Click or drag JSON file here</p>
            <p className="text-sm text-gray-500 mt-1">
              {jsonFile ? jsonFile.name : 'Song or Setlist JSON format'}
            </p>
          </div>

          {previewData && (
            <div className="mt-6 bg-purple-50/50 border border-purple-100 rounded-xl p-4">
              <h3 className="text-sm font-bold text-church-navy mb-2">Preview</h3>
              {Array.isArray(previewData) ? (
                <div>
                  <p className="text-sm text-gray-600"><strong>Bulk Import ({importType}):</strong> {previewData.length} items found.</p>
                  <ul className="mt-2 text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto pl-4 list-disc">
                    {previewData.map((item, idx) => (
                      <li key={idx}><strong>{item.title || item.name || 'Untitled'}</strong> {item.artist ? `(${item.artist})` : ''}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600"><strong>Title / Name:</strong> {previewData.title || previewData.name}</p>
                  {previewData.artist && <p className="text-sm text-gray-600"><strong>Artist:</strong> {previewData.artist}</p>}
                  {previewData.items && <p className="text-sm text-gray-600"><strong>Setlist Items:</strong> {previewData.items.length}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!previewData || loading}
            className="flex items-center px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
