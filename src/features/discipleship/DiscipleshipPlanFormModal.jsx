import React, { useState, useEffect } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createDiscipleshipPlan, updateDiscipleshipPlan } from './discipleshipService';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

export default function DiscipleshipPlanFormModal({ isOpen, onClose, plan = null, onSave }) {
  const { userProfile, currentUser } = useAuth();
  const CHURCH_ID = userProfile?.churchId ;
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    language: 'English',
    coverImageUrl: '',
    sourceTitle: '',
    sourceAuthor: '',
    status: 'draft',
    visibility: 'church_members_only',
    totalWeeks: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title || '',
        subtitle: plan.subtitle || '',
        description: plan.description || '',
        category: plan.category || '',
        language: plan.language || 'English',
        coverImageUrl: plan.coverImageUrl || '',
        sourceTitle: plan.sourceTitle || '',
        sourceAuthor: plan.sourceAuthor || '',
        status: plan.status || 'draft',
        visibility: plan.visibility || 'church_members_only',
        totalWeeks: plan.totalWeeks || 0
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        category: '',
        language: 'English',
        coverImageUrl: '',
        sourceTitle: '',
        sourceAuthor: '',
        status: 'draft',
        visibility: 'church_members_only',
        totalWeeks: 0
      });
    }
    setError('');
  }, [plan, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        ...formData,
        updatedBy: currentUser?.uid || null
      };

      if (plan) {
        await updateDiscipleshipPlan(plan.id, dataToSave);
      } else {
        dataToSave.createdBy = currentUser?.uid || null;
        await createDiscipleshipPlan(CHURCH_ID, dataToSave);
      }

      onSave && onSave();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save discipleship plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? 'Edit Discipleship Plan' : 'Create Discipleship Plan'}
      subtitle="Define curriculum curriculum tracks, source materials, and language scope"
      icon={BookOpen}
      maxWidth="2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="discipleship-plan-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Saving...' : plan ? 'Save Changes' : 'Create Plan'}
          </button>
        </>
      }
    >
      <form id="discipleship-plan-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {/* Section 1: Curriculum Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <BookOpen size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Curriculum Identity
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Core title, thematic category, and description</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Plan Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
              placeholder="e.g. The Story of God & Redemption"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Subtitle</label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
              placeholder="e.g. Volume 1: From Creation to the Promised Land"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
              placeholder="Describe the target audience, learning objectives, and scope..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
                placeholder="e.g. Foundations, New Believers"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Language</label>
              <ModernDropdown
                value={formData.language}
                onChange={(val) => handleChange({ target: { name: 'language', value: val } })}
                options={[
                  { value: 'English', label: 'English' },
                  { value: 'Tagalog', label: 'Tagalog' },
                  { value: 'Cebuano', label: 'Cebuano' },
                  { value: 'Spanish', label: 'Spanish' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Source Attribution & Media */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Source Material Title</label>
              <input
                type="text"
                name="sourceTitle"
                value={formData.sourceTitle}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                placeholder="e.g. Gospel Foundations Manual"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Source Author</label>
              <input
                type="text"
                name="sourceAuthor"
                value={formData.sourceAuthor}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                placeholder="e.g. Dr. Timothy Keller"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Cover Image URL (Optional)</label>
            <input
              type="url"
              name="coverImageUrl"
              value={formData.coverImageUrl}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Visibility</label>
              <ModernDropdown
                value={formData.visibility}
                onChange={(val) => handleChange({ target: { name: 'visibility', value: val } })}
                options={[
                  { value: 'church_members_only', label: 'Church Members Only' },
                  { value: 'public', label: 'Public' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
              <ModernDropdown
                value={formData.status}
                onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                options={[
                  { value: 'draft', label: 'Draft (Internal)' },
                  { value: 'published', label: 'Published & Active' },
                  { value: 'archived', label: 'Archived' }
                ]}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
