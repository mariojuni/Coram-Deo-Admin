import React, { useState, useEffect } from 'react';
import { Wallet, Shield, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

const FUND_TYPES = [
  'tithe',
  'offering',
  'missions',
  'building',
  'ministry',
  'general',
  'special_project',
  'other'
];

export default function FundFormModal({ isOpen, onClose, fund = null }) {
  const { userProfile, currentUser } = useAuth();
  const CHURCH_ID = userProfile?.churchId ;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    status: 'active',
    visibility: 'public',
    allowGiving: true,
    allowExpenses: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (fund) {
      setFormData({
        name: fund.name || '',
        description: fund.description || '',
        type: fund.type || 'general',
        status: fund.status || 'active',
        visibility: fund.visibility || 'public',
        allowGiving: fund.allowGiving !== undefined ? fund.allowGiving : true,
        allowExpenses: fund.allowExpenses !== undefined ? fund.allowExpenses : true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'general',
        status: 'active',
        visibility: 'public',
        allowGiving: true,
        allowExpenses: true,
      });
    }
    setError('');
  }, [fund, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!CHURCH_ID) {
      setError('Church ID is missing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Name uniqueness check for this church
      const q = query(
        collection(db, 'givingFunds'),
        where('churchId', '==', CHURCH_ID),
        where('name', '==', formData.name.trim())
      );
      const snap = await getDocs(q);
      const isDuplicate = snap.docs.some(d => d.id !== fund?.id);
      if (isDuplicate) {
        throw new Error('A fund with this name already exists in your church.');
      }

      const payload = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        churchId: CHURCH_ID,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null
      };

      if (fund) {
        await updateDoc(doc(db, 'givingFunds', fund.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        payload.createdBy = currentUser?.uid || null;
        await addDoc(collection(db, 'givingFunds'), payload);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save fund. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fund ? 'Edit Fund' : 'Create Fund'}
      subtitle="Designate accounts for tithes, offerings, missions, or special projects"
      icon={Wallet}
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
            form="fund-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Saving...' : fund ? 'Save Changes' : 'Create Fund'}
          </button>
        </>
      }
    >
      <form id="fund-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}
        
        {/* Section 1: Fund Info */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Wallet size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Fund Definition
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Naming, category classification, and purpose</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Fund Name <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Building Expansion Fund"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea 
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              placeholder="Explain the purpose of this fund..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none" 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Fund Type *</label>
              <ModernDropdown
                value={formData.type}
                onChange={(val) => handleChange({ target: { name: 'type', value: val } })}
                options={FUND_TYPES.map(t => ({ 
                  value: t, 
                  label: t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') 
                }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Visibility *</label>
              <ModernDropdown
                value={formData.visibility}
                onChange={(val) => handleChange({ target: { name: 'visibility', value: val } })}
                options={[
                  { value: 'public', label: 'Public (Mobile App)' },
                  { value: 'internal', label: 'Internal (Staff Only)' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Policies & Permissions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
              <Shield size={14} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Policies & Status
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Control donation inflows and disbursement rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer">
              <input 
                type="checkbox" 
                name="allowGiving"
                checked={formData.allowGiving}
                onChange={handleChange}
                className="w-4 h-4 text-[#2C4A60] rounded border-slate-300 focus:ring-[#2C4A60]"
              />
              <span className="text-xs font-bold text-slate-800">Accept Donations</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer">
              <input 
                type="checkbox" 
                name="allowExpenses"
                checked={formData.allowExpenses}
                onChange={handleChange}
                className="w-4 h-4 text-[#2C4A60] rounded border-slate-300 focus:ring-[#2C4A60]"
              />
              <span className="text-xs font-bold text-slate-800">Allow Expense Deductions</span>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Lifecycle Status</label>
            <ModernDropdown
              value={formData.status}
              onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
              options={[
                { value: 'active', label: 'Active Fund' },
                { value: 'archived', label: 'Archived Fund' }
              ]}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
