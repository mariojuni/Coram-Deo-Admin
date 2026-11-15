import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={household ? 'Edit Household' : 'Add Household'}
      subtitle="Group related family members together for directory and giving"
      icon={Users}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="household-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#162533] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#1E2E3D] transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Saving...' : 'Save Household'}
          </button>
        </>
      }
    >
      <form id="household-form" onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Household Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Smith Family"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all text-slate-900 bg-white placeholder:text-slate-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Members</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 mb-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-sm bg-white transition-all text-slate-900 placeholder:text-slate-400"
          />
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-white/80">
            {members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(member => (
              <label key={member.id} className="flex items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.memberIds.includes(member.id)}
                  onChange={() => handleToggleMember(member.id)}
                  className="mr-3 text-[#2C4A60] accent-[#2C4A60] focus:ring-[#2C4A60] rounded"
                />
                <span className="text-sm font-medium text-slate-900">{member.name}</span>
              </label>
            ))}
            {members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="p-2 text-sm text-slate-400 text-center">No members found.</div>
            )}
          </div>
        </div>

        {formData.memberIds.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Primary Member (Head of Household)</label>
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
      </form>
    </Modal>
  );
}
