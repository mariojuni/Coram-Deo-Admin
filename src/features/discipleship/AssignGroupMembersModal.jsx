import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, User, Check, Loader2 } from 'lucide-react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { assignGroupLeadersAndMembers } from './discipleshipGroupService';
import { formatStandardName, deduplicateMembers } from '../../utils/nameUtils';
import Modal from '../../components/ui/Modal';

export default function AssignGroupMembersModal({ isOpen, onClose, group, onSaved }) {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const userId = userProfile?.uid || userProfile?.id;

  const [activeTab, setActiveTab] = useState('leaders'); // 'leaders' | 'members'
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedLeaderIds, setSelectedLeaderIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  useEffect(() => {
    if (group) {
      setSelectedLeaderIds(group.leaderMemberIds || []);
      setSelectedMemberIds(group.memberIds || []);
    }
  }, [group, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        let membersList = snap.docs.map(docItem => ({ id: docItem.id, ...docItem.data() }));
        membersList = deduplicateMembers(membersList);
        membersList.sort((a, b) => {
          const nameA = (a.name || a.displayName || '').toLowerCase();
          const nameB = (b.name || b.displayName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

        const filtered = membersList.filter(m => !m.churchId || m.churchId === CHURCH_ID);
        setAllMembers(filtered);
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [isOpen, CHURCH_ID]);

  if (!isOpen || !group) return null;

  const filteredMembers = allMembers.filter(m => {
    const formatted = formatStandardName(m);
    const nameStr = `${formatted} ${m.email || ''} ${m.role || ''}`.toLowerCase();
    return nameStr.includes(searchTerm.toLowerCase());
  });

  const toggleLeader = (id) => {
    setSelectedLeaderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleMember = (id) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await assignGroupLeadersAndMembers(CHURCH_ID, group.id, selectedLeaderIds, selectedMemberIds, userId);
      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error("Error saving assignments:", err);
      alert("Failed to save assignments: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Group Roster"
      subtitle={group?.name ? `Assign leaders and members for ${group.name}` : 'Manage group assignments'}
      icon={Users}
      maxWidth="xl"
      badge={
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC]">
          {selectedLeaderIds.length} Leaders • {selectedMemberIds.length} Members
        </span>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-semibold text-slate-500">
            {activeTab === 'leaders' ? `${selectedLeaderIds.length} leaders assigned` : `${selectedMemberIds.length} members assigned`}
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
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('leaders')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'leaders'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield size={13} className={activeTab === 'leaders' ? 'text-[#2C4A60]' : ''} />
            <span>Group Leaders ({selectedLeaderIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={13} className={activeTab === 'members' ? 'text-[#2C4A60]' : ''} />
            <span>Group Members ({selectedMemberIds.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search member by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A60]/10 focus:border-[#2C4A60] transition-all"
          />
        </div>

        {/* List */}
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
              {filteredMembers.map((m) => {
                const isSelected = activeTab === 'leaders'
                  ? selectedLeaderIds.includes(m.id)
                  : selectedMemberIds.includes(m.id);
                const formattedName = formatStandardName(m);

                return (
                  <div
                    key={m.id}
                    onClick={() => (activeTab === 'leaders' ? toggleLeader(m.id) : toggleMember(m.id))}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                        {formattedName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{formattedName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{m.email || m.role || 'Member'}</p>
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
