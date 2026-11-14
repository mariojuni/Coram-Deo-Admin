import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';

export default function HouseholdFormModal({ isOpen, onClose, household = null }) {
  const { userProfile, currentUser } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  
  const [formData, setFormData] = useState({
    name: '',
    primaryMemberId: '',
    memberIds: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (household) {
      setFormData({
        name: household.name || '',
        primaryMemberId: household.primaryMemberId || '',
        memberIds: household.memberIds || []
      });
    } else {
      setFormData({
        name: '',
        primaryMemberId: '',
        memberIds: []
      });
    }
    setError('');

    if (isOpen && CHURCH_ID) {
      const fetchMembers = async () => {
        try {
          const q = query(collection(db, 'users'), where('churchId', '==', CHURCH_ID));
          const snap = await getDocs(q);
          const activeMembers = snap.docs
            .map(d => {
              const u = d.data();
              if (u.membershipStatus === 'Archived') return null;
              let name = '';
              if (u.firstName || u.lastName) {
                const f = (u.firstName || '').trim().split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                const l = (u.lastName || '').trim().split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                const m = u.middleName ? u.middleName.trim().charAt(0).toUpperCase() + '.' : '';
                name = [f, m, l].filter(Boolean).join(' ');
              }
              if (!name) name = u.name || u.displayName;
              return { id: d.id, name: name || 'Anonymous' };
            })
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
            
          setMembers(activeMembers);
        } catch (e) {
          console.error("Failed to fetch members", e);
        }
      };
      fetchMembers();
    }
  }, [household, isOpen, CHURCH_ID]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleToggleMember = (memberId) => {
    setFormData(prev => {
      const isSelected = prev.memberIds.includes(memberId);
      let newMemberIds;
      if (isSelected) {
        newMemberIds = prev.memberIds.filter(id => id !== memberId);
      } else {
        newMemberIds = [...prev.memberIds, memberId];
      }
      
      // If primary member is removed, unset primary
      let newPrimary = prev.primaryMemberId;
      if (isSelected && prev.primaryMemberId === memberId) {
        newPrimary = '';
      }
      
      return { ...prev, memberIds: newMemberIds, primaryMemberId: newPrimary };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name.trim()) {
        throw new Error("Household name is required.");
      }

      const payload = {
        name: formData.name.trim(),
        primaryMemberId: formData.primaryMemberId || null,
        memberIds: formData.memberIds,
        churchId: CHURCH_ID
      };

      if (household) {
        await updateDoc(doc(db, 'households', household.id), {
          ...payload,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null
        });
      } else {
        await addDoc(collection(db, 'households'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || null
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save household. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-light-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/95">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-2xl bg-[#2C4A60]/10 flex items-center justify-center mr-3 text-[#2C4A60]">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-bold text-church-navy">{household ? 'Edit Household' : 'Add Household'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-church-navy mb-1.5">Household Name *</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Smith Family"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all text-church-navy bg-white" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-church-navy mb-1.5">Select Members</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-sm bg-white transition-all"
              />
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1 bg-white">
                {members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(member => (
                  <label key={member.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={formData.memberIds.includes(member.id)}
                      onChange={() => handleToggleMember(member.id)}
                      className="mr-3 text-[#2C4A60] accent-[#2C4A60] focus:ring-[#2C4A60] rounded"
                    />
                    <span className="text-sm font-medium text-church-navy">{member.name}</span>
                  </label>
                ))}
                {members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <div className="p-2 text-sm text-gray-400 text-center">No members found.</div>
                )}
              </div>
            </div>

            {formData.memberIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-church-navy mb-1.5">Primary Member (Head of Household)</label>
                <ModernDropdown
                  value={formData.primaryMemberId}
                  onChange={(val) => setFormData(prev => ({ ...prev, primaryMemberId: val }))}
                  options={[
                    { value: '', label: '-- Select Primary Member --' },
                    ...formData.memberIds.map(id => {
                      const m = members.find(mem => mem.id === id);
                      return { value: id, label: m ? m.name : id };
                    })
                  ]}
                />
              </div>
            )}

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
                className="px-6 py-2.5 bg-[#162533] text-white rounded-full text-sm font-medium hover:bg-[#1E2E3D] transition-all disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Saving...' : 'Save Household'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
