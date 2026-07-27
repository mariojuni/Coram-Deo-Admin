import React, { useState } from 'react';
import { X, UploadCloud, FileText, Lock, Globe, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadGroupMaterial } from './discipleshipGroupService';

const MATERIAL_TYPES = [
  { value: 'leader_guide', label: 'Leader Guide' },
  { value: 'member_handout', label: 'Member Handout' },
  { value: 'discussion_guide', label: 'Discussion Guide' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'other', label: 'Other Resource' },
];

const AUDIENCES = [
  { value: 'leaders_only', label: 'Leaders Only (Leader-Only Protection)', icon: Lock },
  { value: 'members', label: 'Group Members', icon: Users },
  { value: 'public', label: 'Public', icon: Globe },
];

export default function GroupMaterialUploadModal({ isOpen, onClose, group = null, onUploaded }) {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const userId = userProfile?.uid || userProfile?.id;

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

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-church-navy/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-church-green/10 text-church-green flex items-center justify-center">
              <UploadCloud size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-church-navy">Upload Leader Material</h2>
              <p className="text-xs text-gray-500">{group ? group.name : 'Church General Materials'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Material Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Leader Discussion Guide - Week 1"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none focus:ring-2 focus:ring-church-green/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                name="materialType"
                value={formData.materialType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
              >
                {MATERIAL_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Audience (Access Level)
              </label>
              <select
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
              >
                {AUDIENCES.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Instructions or overview for leaders..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
            />
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Select Document / File *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-xl hover:border-church-green transition-colors">
              <div className="space-y-1 text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <div className="flex text-xs text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-bold text-church-green hover:text-church-green/80">
                    <span>Choose a file</span>
                    <input type="file" onChange={handleFileChange} className="sr-only" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-[10px] text-gray-400">
                  PDF, DOCX, PNG, JPG up to 25MB
                </p>
                {file && (
                  <p className="text-xs font-bold text-church-navy bg-church-green/10 py-1 px-3 rounded-full mt-2 inline-block">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600">
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 bg-church-green text-white text-xs font-bold rounded-xl shadow-lg shadow-church-green/20 hover:bg-church-green/90"
            >
              {uploading ? 'Uploading...' : 'Upload Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
