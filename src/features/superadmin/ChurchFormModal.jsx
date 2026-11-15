import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

export default function ChurchFormModal({ isOpen, onClose, church = null }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (church) {
      setFormData({
        name: church.name || '',
        address: church.address || '',
        email: church.contact?.email || '',
        phone: church.contact?.phone || '',
        status: church.status || 'Active'
      });
    } else {
      setFormData({ name: '', address: '', email: '', phone: '', status: 'Active' });
    }
  }, [church, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        contact: { email: formData.email, phone: formData.phone },
        status: formData.status,
      };

      if (church) {
        await updateDoc(doc(db, 'churches', church.id), {
          ...payload,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null
        });
      } else {
        await addDoc(collection(db, 'churches'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || null
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save church.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={church ? 'Edit Tenant Workspace' : 'New Church Tenant'}
      subtitle="Configure independent tenant organization profile and contact channels"
      icon={Building2}
      maxWidth="md"
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
            form="church-form" 
            disabled={loading} 
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Saving...' : church ? 'Save Changes' : 'Create Workspace'}
          </button>
        </>
      }
    >
      <form id="church-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Church Organization Name *</label>
            <input 
              type="text" 
              name="name" 
              required 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g. Grace Fellowship Church"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Address</label>
            <input 
              type="text" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              placeholder="e.g. 123 Church St, Metro Manila"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="contact@church.org"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="+63 917 123 4567"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tenant Status</label>
            <ModernDropdown
              value={formData.status}
              onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
              options={[
                { value: 'Active', label: 'Active Tenant' },
                { value: 'Disabled', label: 'Suspended / Disabled' }
              ]}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
