import React, { useState, useEffect } from 'react';
import { HeartHandshake, Shield, Sparkles } from 'lucide-react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved & Active' },
  { value: 'answered', label: 'Answered Praise' },
  { value: 'rejected', label: 'Archived / Rejected' }
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public Congregation Wall' },
  { value: 'leaders_only', label: 'Pastoral & Leaders Only' }
];

const CATEGORY_OPTIONS = [
  { value: 'healing', label: 'Healing & Health' },
  { value: 'family', label: 'Family & Marriage' },
  { value: 'spiritual_growth', label: 'Spiritual Growth' },
  { value: 'provision', label: 'Financial & Provision' },
  { value: 'thanksgiving', label: 'Thanksgiving & Praise' },
  { value: 'other', label: 'General / Other' }
];

export default function PrayerRequestModal({ isOpen, onClose, request = null, churchId }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    requesterName: '',
    requestText: '',
    status: 'pending',
    visibility: 'public',
    category: 'other'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request) {
      setFormData({
        requesterName: request.requesterName || '',
        requestText: request.requestText || '',
        status: request.status || 'pending',
        visibility: request.visibility || 'public',
        category: request.category || 'other'
      });
    } else {
      setFormData({
        requesterName: '',
        requestText: '',
        status: 'pending',
        visibility: 'public',
        category: 'other'
      });
    }
    setError('');
  }, [request, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!churchId) {
      setError('Church ID is missing. Cannot save.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const prayersColRef = collection(db, 'churches', churchId, 'prayer_requests');
      const docRef = request ? doc(db, 'churches', churchId, 'prayer_requests', request.id) : doc(prayersColRef);

      const prayerDoc = {
        ...formData,
        requesterName: formData.requesterName || 'Anonymous',
        updatedAt: serverTimestamp(),
      };

      if (!request) {
        prayerDoc.createdAt = serverTimestamp();
        prayerDoc.userId = currentUser?.uid; // Required by firestore.rules
      }

      await setDoc(docRef, prayerDoc, { merge: true });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save prayer request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={request ? 'Edit Prayer Request' : 'New Prayer Request'}
      subtitle={request ? 'Update intercession details, moderation status, and audience' : 'Submit an intercession or thanksgiving petition for the church'}
      icon={HeartHandshake}
      maxWidth="lg"
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
            form="prayer-request-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Saving...' : request ? 'Save Changes' : 'Submit Request'}
          </button>
        </>
      }
    >
      <form id="prayer-request-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {/* Section: Request Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Sparkles size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Petition & Requester
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Identify who is requesting and the prayer need</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Requester Name (Optional)
              </label>
              <input
                type="text"
                name="requesterName"
                value={formData.requesterName}
                onChange={handleChange}
                placeholder="Leave blank for Anonymous"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ministry Category
              </label>
              <ModernDropdown
                value={formData.category}
                onChange={(val) => handleChange({ target: { name: 'category', value: val } })}
                options={CATEGORY_OPTIONS}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Prayer Request <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="requestText"
              required
              rows="4"
              value={formData.requestText}
              onChange={handleChange}
              placeholder="What can our pastoral team and church community pray for?"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
            />
          </div>
        </div>

        {/* Section: Moderation & Governance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Shield size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Audience & Pastoral Status
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Control visibility and workflow lifecycle</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Visibility Scope
              </label>
              <ModernDropdown
                value={formData.visibility}
                onChange={(val) => handleChange({ target: { name: 'visibility', value: val } })}
                options={VISIBILITY_OPTIONS}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Moderation Status
              </label>
              <ModernDropdown
                value={formData.status}
                onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
