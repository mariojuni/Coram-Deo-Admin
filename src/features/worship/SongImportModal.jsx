import React, { useState } from 'react';
import { Upload, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { createSong, createSetlist, createSetlistItem } from './worshipService';
import { parseAndValidateJSONEnvelope } from '../../utils/jsonImportExport';
import Modal from '../../components/ui/Modal';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Songs / Setlists JSON"
      subtitle="Upload single or bulk songs or worship setlists"
      icon={Upload}
      maxWidth="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!previewData || loading}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Confirm Import'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-start border border-red-200/70">
            <AlertCircle size={15} className="mt-0.5 mr-2 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50 hover:bg-slate-100/60 transition-colors relative cursor-pointer group">
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-slate-200/70 text-[#2C4A60] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
            <Upload size={22} />
          </div>
          <p className="text-sm font-bold text-slate-800">Click or drag JSON file here</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {jsonFile ? jsonFile.name : 'Song or Setlist JSON format'}
          </p>
        </div>

        {previewData && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <FileText size={14} />
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payload Preview</h3>
            </div>

            {Array.isArray(previewData) ? (
              <div>
                <p className="text-xs text-slate-600 font-medium">
                  <strong>Bulk Import ({importType}):</strong> {previewData.length} items found.
                </p>
                <ul className="mt-2 text-xs text-slate-600 space-y-1.5 max-h-40 overflow-y-auto pl-4 list-disc bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {previewData.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-semibold text-slate-800">{item.title || item.name || 'Untitled'}</span>{' '}
                      {item.artist && <span className="text-slate-500 font-normal">({item.artist})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs text-slate-700 space-y-1">
                <p><strong className="text-slate-800">Title / Name:</strong> {previewData.title || previewData.name}</p>
                {previewData.artist && <p><strong className="text-slate-800">Artist:</strong> {previewData.artist}</p>}
                {previewData.items && <p><strong className="text-slate-800">Setlist Items:</strong> {previewData.items.length}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
