import React, { useState, useEffect } from 'react';
import { X, Tags } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import ModernDropdown from '../../../components/ui/ModernDropdown';

export default function ExpenseCategoryFormModal({ isOpen, onClose, category = null }) {
  const { userProfile, currentUser } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        status: category.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        status: 'active',
      });
    }
    setError('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name.trim()) {
        throw new Error('Category Name is required.');
      }

      // Check for duplicate name
      const q = query(
        collection(db, 'expenseCategories'), 
        where('churchId', '==', CHURCH_ID),
        where('name', '==', formData.name.trim())
      );
      const snap = await getDocs(q);
      
      const isDuplicate = snap.docs.some(d => d.id !== category?.id);
      if (isDuplicate) {
        throw new Error('A category with this name already exists.');
      }

      const payload = {
        ...formData,
        name: formData.name.trim(),
        churchId: CHURCH_ID,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null,
      };

      if (category) {
        await updateDoc(doc(db, 'expenseCategories', category.id), payload);
      } else {
        await addDoc(collection(db, 'expenseCategories'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || null,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-church-soft overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-church-bg">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-church-green/10 flex items-center justify-center mr-3">
              <Tags size={20} className="text-church-green" />
            </div>
            <h2 className="text-xl font-bold text-church-navy">{category ? 'Edit Category' : 'Create Category'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-church-navy mb-1.5">Category Name *</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Utilities"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green focus:border-transparent transition-shadow" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-church-navy mb-1.5">Status *</label>
              <ModernDropdown
                value={formData.status}
                onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-church-slate hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2.5 bg-church-green text-white rounded-full text-sm font-medium hover:bg-church-green/90 transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
