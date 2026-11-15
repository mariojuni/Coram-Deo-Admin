import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Upload, AlertCircle, BookOpen } from 'lucide-react';
import { collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { parseAndValidateJSONEnvelope } from '../../utils/jsonImportExport';
import Modal from '../../components/ui/Modal';

export default function BiblePlanImportModal({ isOpen, onClose, onImportSuccess }) {
  const { userProfile, activeChurchId } = useAuth();
  const [jsonFile, setJsonFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);

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
          const result = parseAndValidateJSONEnvelope(rawString, ['bible_plan', 'bible_plans_bulk']);

          if (!result.success) {
            setError(result.error);
            setPreviewData(null);
            return;
          }

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
    if (!previewData) return;
    setLoading(true);
    setError('');

    try {
      const CHURCH_ID = activeChurchId || userProfile?.churchId;
      if (!CHURCH_ID) throw new Error("No church context found.");

      const itemsToImport = Array.isArray(previewData) ? previewData : [previewData];
      const batch = writeBatch(db);

      for (const item of itemsToImport) {
        delete item.id;
        const newRef = doc(collection(db, 'churches', CHURCH_ID, 'bible_plans'));
        batch.set(newRef, {
          ...item,
          status: item.status || 'draft',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to import Bible plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Bible Plan JSON"
      subtitle="Upload single or bulk Bible reading plans to your church catalog"
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
          <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center border border-red-200/70">
            <AlertCircle size={15} className="mr-2 shrink-0 text-red-500" />
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
          <p className="text-sm font-bold text-slate-800">Click or drag Bible plan JSON file here</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {jsonFile ? jsonFile.name : 'Must follow Bible plan JSON schema'}
          </p>
        </div>

        {previewData && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center">
                <BookOpen size={14} />
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Plan Preview</h3>
            </div>

            {Array.isArray(previewData) ? (
              <div>
                <p className="text-xs text-slate-600 font-medium">
                  <strong>Bulk Import:</strong> {previewData.length} Bible Reading Plans found.
                </p>
                <ul className="mt-2 text-xs text-slate-600 space-y-1.5 max-h-40 overflow-y-auto pl-4 list-disc bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {previewData.map((p, idx) => (
                    <li key={idx}>
                      <span className="font-semibold text-slate-800">{p.title || 'Untitled'}</span>{' '}
                      <span className="text-slate-500">({p.durationDays || p.readings?.length || 0} days)</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs text-slate-700 space-y-1">
                <p><strong className="text-slate-800">Title:</strong> {previewData.title}</p>
                <p><strong className="text-slate-800">Duration:</strong> {previewData.durationDays || 'N/A'} Days</p>
                <p><strong className="text-slate-800">Readings Count:</strong> {previewData.readings?.length || 0}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
