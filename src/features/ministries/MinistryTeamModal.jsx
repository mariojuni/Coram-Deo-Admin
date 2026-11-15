import React, { useState, useEffect } from 'react';
import { Users, Search, Check, AlertCircle, Loader2 } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/ui/Modal';

export default function MinistryTeamModal({ isOpen, onClose, ministry = null }) {
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Fetch all members when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchMembers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setMembers(docs);

        // Initialize selected IDs from the ministry's existing memberIds array
        if (ministry && ministry.memberIds) {
          const selected = new Set();
          docs.forEach(docItem => {
            const ids = [docItem.id, docItem.uid, docItem.authUid].filter(Boolean);
            if (ids.some(id => ministry.memberIds.includes(id))) {
              selected.add(docItem.id);
            }
          });
          setSelectedIds(selected);
        } else {
          setSelectedIds(new Set());
        }
      } catch (err) {
        console.error('Error fetching members:', err);
        setError('Failed to load members.');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
    setSearchTerm('');
    setError('');
  }, [isOpen, ministry]);

  if (!isOpen || !ministry) return null;

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleMember = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    try {
      const docRef = doc(db, 'ministries', ministry.id);
      await updateDoc(docRef, {
        memberIds: Array.from(selectedIds),
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save team data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Team Roster"
      subtitle={ministry?.name ? `Assign team members to ${ministry.name}` : 'Manage ministry team roster'}
      icon={Users}
      maxWidth="lg"
      badge={
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC]">
          {selectedIds.size} Selected
        </span>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-semibold text-slate-500">
            {selectedIds.size} members selected
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Team'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center border border-red-200/70">
            <AlertCircle size={15} className="mr-2 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A60]/10 focus:border-[#2C4A60] transition-all"
            placeholder="Search church directory by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden max-h-[360px] flex flex-col">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 size={24} className="animate-spin text-[#2C4A60]" />
              <p className="text-xs font-medium">Loading church members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No members found matching your search.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-y-auto">
              {filteredMembers.map(member => {
                const isSelected = selectedIds.has(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {member.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{member.role ? member.role.replace('_', ' ') : 'Member'}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#162533] border-[#162533] text-white shadow-2xs' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
