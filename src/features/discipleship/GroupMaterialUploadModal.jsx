import React, { useState } from 'react';
import { UploadCloud, FileText, Lock, Globe, Users, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadGroupMaterial } from './discipleshipGroupService';
import { useStorageQuota } from '../subscription/hooks/useStorageQuota';
import StorageQuotaModal from '../subscription/components/StorageQuotaModal';
import Modal from '../../components/ui/Modal';

const MATERIAL_TYPES = [
  { value: 'leader_guide', label: 'Leader Guide' },
  { value: 'member_handout', label: 'Member Handout' },
  { value: 'discussion_guide', label: 'Discussion Guide' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'other', label: 'Other Resource' },
];

const AUDIENCES = [
  { value: 'leaders_only', label: 'Leaders Only (Leader-Only Protection)' },
  { value: 'members', label: 'Group Members' },
  { value: 'public', label: 'Public' },
];

export default function GroupMaterialUploadModal({ isOpen, onClose, group = null, onUploaded }) {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const userId = userProfile?.uid || userProfile?.id;
  const storageQuota = useStorageQuota();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    materialType: 'leader_guide',
    audience: 'leaders_only',
    status: 'published',
  });

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [storageModalInfo, setStorageModalInfo] = useState({ fileSizeFormatted: null, targetTier: 'kingdom' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const capacity = storageQuota.checkUploadCapacity(selected.size);
      if (!capacity.allowed) {
        setStorageModalInfo({
          fileSizeFormatted: capacity.fileSizeFormatted,
          targetTier: capacity.targetTier
        });
        setIsStorageModalOpen(true);
        e.target.value = '';
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!CHURCH_ID) {
      setError('Church ID is missing.');
      return;
    }
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    if (!storageQuota.canUploadBytes(file.size)) {
      const capacity = storageQuota.checkUploadCapacity(file.size);
      setStorageModalInfo({
        fileSizeFormatted: capacity.fileSizeFormatted,
        targetTier: capacity.targetTier
      });
      setIsStorageModalOpen(true);
      return;
    }

    setUploading(true);
    setError('');

    try {
      await uploadGroupMaterial({
        churchId: CHURCH_ID,
        groupId: group?.id || null,
        title: formData.title,
        description: formData.description,
        materialType: formData.materialType,
        audience: formData.audience,
        status: formData.status,
        file,
        userId
      });

      onUploaded && onUploaded();
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Upload Group Resource"
        subtitle={group ? `Upload leader or member material for ${group.name}` : 'Upload church discipleship material'}
        icon={UploadCloud}
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="material-upload-form"
              disabled={uploading}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
            >
              {uploading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Uploading...</span>
                </span>
              ) : (
                'Upload Material'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center border border-red-200/70">
              <AlertCircle size={15} className="mr-2 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form id="material-upload-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Material Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Leader Discussion Guide - Week 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Material Type
                  </label>
                  <select
                    name="materialType"
                    value={formData.materialType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                  >
                    {MATERIAL_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Audience (Access Level)
                  </label>
                  <select
                    name="audience"
                    value={formData.audience}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                  >
                    {AUDIENCES.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Instructions or overview for leaders and participants..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Document / Resource File *
                </label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-100/60 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-slate-200/70 text-[#2C4A60] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <FileText size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    <span className="text-[#2C4A60] underline">Choose a file</span> or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PDF, DOCX, PNG, JPG up to 25MB
                  </p>
                  {file && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC] rounded-full text-xs font-bold">
                      <FileText size={12} />
                      <span>{file.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      <StorageQuotaModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        fileSizeFormatted={storageModalInfo.fileSizeFormatted}
        targetTier={storageModalInfo.targetTier}
      />
    </>
  );
}
