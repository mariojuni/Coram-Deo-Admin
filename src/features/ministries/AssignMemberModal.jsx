import React, { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ModernDropdown from '../../components/ui/ModernDropdown';
import { formatStandardName } from '../../utils/nameUtils';
import Modal from '../../components/ui/Modal';

export default function AssignMemberModal({ isOpen, onClose, ministry }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      setSelectedMemberId('');
      setError('');
    }
  }, [isOpen, ministry]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const formattedDocs = docs.map(d => ({
        ...d,
        displayName: formatStandardName(d)
      }));

      formattedDocs.sort((a, b) => a.displayName.localeCompare(b.displayName));

      const uniqueDocsMap = new Map();
      formattedDocs.forEach(d => {
        if (!uniqueDocsMap.has(d.displayName)) {
          uniqueDocsMap.set(d.displayName, d);
        }
      });
      const uniqueFormattedDocs = Array.from(uniqueDocsMap.values());

      const existingMemberIds = (ministry?.members || []).map(m => m.memberId);
      const availableMembers = uniqueFormattedDocs.filter(m => {
        const mIds = [m.id, m.uid, m.authUid].filter(Boolean);
        return !mIds.some(id => existingMemberIds.includes(id)) && m.status !== 'deceased' && m.status !== 'transferred';
      });

      setMembers(availableMembers);
    } catch (err) {
      console.error('Error fetching church members:', err);
      setError("Failed to fetch church members");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const dropdownOptions = members.map(m => {
    const roleLabel = m.role ? ` (${m.role.replace('_', ' ')})` : '';
    return {
      value: m.id,
      label: `${m.displayName}${roleLabel}`
    };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('Please select a member.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const memberObj = members.find(m => m.id === selectedMemberId);
      const ministryRef = doc(db, 'ministries', ministry.id);

      const existingMembers = ministry.members || [];
      const newMember = {
        memberId: selectedMemberId,
        name: memberObj?.displayName || memberObj?.name || 'Unknown',
        role: memberObj?.role || 'member',
        assignedAt: new Date().toISOString()
      };

      await updateDoc(ministryRef, {
        members: [...existingMembers, newMember]
      });

      try {
        const mmRef = doc(db, 'ministryMembers', `${ministry.id}_${selectedMemberId}`);
        await setDoc(mmRef, {
          ministryId: ministry.id,
          memberId: selectedMemberId,
          memberName: memberObj?.displayName || memberObj?.name || 'Unknown',
          ministryName: ministry.name,
          assignedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to sync to ministryMembers collection', err);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to assign member to ministry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign to ${ministry?.name || 'Ministry'}`}
      subtitle="Select a church member to join this ministry team roster"
      icon={UserCheck}
      maxWidth="md"
      footer={
        <>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={saving} 
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="assign-member-form"
            disabled={saving || !selectedMemberId} 
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {saving ? 'Assigning...' : 'Assign Member'}
          </button>
        </>
      }
    >
      <form id="assign-member-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Church Member *
          </label>
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100 font-medium">
              Loading church members directory...
            </div>
          ) : (
            <ModernDropdown
              options={dropdownOptions}
              value={selectedMemberId}
              onChange={setSelectedMemberId}
              placeholder="Choose a member to assign..."
              searchable={true}
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
