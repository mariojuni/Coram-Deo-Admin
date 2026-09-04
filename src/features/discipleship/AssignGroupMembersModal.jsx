import React, { useState, useEffect } from 'react';
import { X, Search, Shield, User, Check, Plus, Trash2 } from 'lucide-react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { assignGroupLeadersAndMembers } from './discipleshipGroupService';
import { formatStandardName } from '../../utils/nameUtils';

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
        let allMembers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allMembers.sort((a, b) => {
          const nameA = (a.name || a.displayName || '').toLowerCase();
          const nameB = (b.name || b.displayName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

        const membersList = allMembers.filter(m => !m.churchId || m.churchId === CHURCH_ID);
        setAllMembers(membersList);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-church-navy/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-church-navy">Manage Group Roster</h2>
            <p className="text-xs text-gray-500">{group.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-2 my-4 border-b border-gray-100 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('leaders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center space-x-2 ${
              activeTab === 'leaders' ? 'bg-church-green text-white shadow-sm' : 'bg-gray-100 text-church-slate hover:bg-gray-200'
            }`}
          >
            <Shield size={14} />
            <span>Group Leaders ({selectedLeaderIds.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center space-x-2 ${
              activeTab === 'members' ? 'bg-church-green text-white shadow-sm' : 'bg-gray-100 text-church-slate hover:bg-gray-200'
            }`}
          >
            <User size={14} />
            <span>Group Members ({selectedMemberIds.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3 shrink-0">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search member by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none focus:ring-2 focus:ring-church-green/20"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-gray-400 font-medium">Loading roster...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 font-medium">No members found.</div>
          ) : (
            filteredMembers.map((m) => {
              const isSelected = activeTab === 'leaders'
                ? selectedLeaderIds.includes(m.id)
                : selectedMemberIds.includes(m.id);
              const formattedName = formatStandardName(m);

              return (
                <div
                  key={m.id}
                  onClick={() => (activeTab === 'leaders' ? toggleLeader(m.id) : toggleMember(m.id))}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected ? 'border-church-green bg-church-green/5' : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-church-navy/10 text-church-navy font-bold flex items-center justify-center text-xs">
                      {formattedName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-church-navy">{formattedName}</p>
                      <p className="text-[10px] text-gray-400">{m.email || m.role || 'Member'}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-church-green text-white' : 'border border-gray-300'
                  }`}>
                    {isSelected && <Check size={14} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-4 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-church-navy">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-church-green text-white text-xs font-bold rounded-xl shadow-lg shadow-church-green/20 hover:bg-church-green/90"
          >
            {saving ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
}
