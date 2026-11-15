import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Shield, AlertCircle, Edit, Search, X } from 'lucide-react';
import { logRoleChange } from '../../utils/roleAudit';
import {
  SYSTEM_ROLES,
  getSystemRoles,
  getPrimaryRole,
  canManageRoles,
  getAssignableRoles,
} from '../../utils/permissions';
import SettingsHeader from './SettingsHeader';
import SoftCard from '../../components/ui/SoftCard';
import Modal from '../../components/ui/Modal';

export default function SettingsUsersAndRoles({ embedded = false, onUserCountChange, churchId = null }) {
  const { userProfile, activeChurchId } = useAuth();
  const effectiveChurchId = churchId || (activeChurchId !== 'system' ? activeChurchId : userProfile?.churchId);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  /** @type {[string[], Function]} selected roles during editing */
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [effectiveChurchId]);

  const fetchUsers = async () => {
    if (!effectiveChurchId || effectiveChurchId === 'system') {
      setUsers([]);
      if (onUserCountChange) onUserCountChange(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('churchId', '==', effectiveChurchId));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(docs);
      if (onUserCountChange) {
        onUserCountChange(docs.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const iCanManageRoles = canManageRoles(userProfile);
  const availableRoles = getAssignableRoles(userProfile);

  const handleEditClick = (user) => {
    if (user.id === userProfile?.uid) {
      alert("You cannot change your own role.");
      return;
    }
    setEditingUser(user);
    // Populate current roles for the user being edited
    setSelectedRoles(getSystemRoles(user));
    setReason('');
  };

  const toggleRole = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    if (selectedRoles.length === 0) {
      alert("A user must have at least one role.");
      return;
    }
    setSaving(true);
    try {
      const previousRoles = getSystemRoles(editingUser);
      const primaryRole = selectedRoles[0];

      // 1. Update user document with systemRoles array
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        churchId: editingUser.churchId || effectiveChurchId,
        systemRoles: selectedRoles,
        primaryRole,
        // Keep legacy `role` in sync for backward compat with any other systems
        role: primaryRole,
        roleUpdatedBy: userProfile.uid,
        roleUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Log audit (arrays)
      await logRoleChange(
        editingUser.churchId || effectiveChurchId,
        editingUser.id,
        previousRoles,
        selectedRoles,
        userProfile.uid,
        reason
      );

      // Update local state
      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, systemRoles: selectedRoles, primaryRole, role: primaryRole }
          : u
      ));
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      alert("Failed to update roles. Please ensure you have permissions.");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <SettingsHeader
          eyebrow="Users & Access Control"
          title="Users & Access Control"
          subtitle="Manage system access levels, permissions, and staff roles for your team."
        />
      )}

      <SoftCard className="overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] uppercase tracking-wider text-church-slate font-bold">
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">System Roles</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Last Updated</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const userRoles = getSystemRoles(user);
                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC] flex items-center justify-center font-bold text-xs mr-3 shadow-2xs">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-church-navy text-sm">{user.name || 'Unnamed User'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {userRoles.map(r => (
                          <span
                            key={r}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF2F7] text-[#2C4A60] capitalize border border-[#D5E3EC]"
                          >
                            <Shield size={10} className="mr-1" />
                            {r.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {user.roleUpdatedAt?.toDate ? user.roleUpdatedAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {iCanManageRoles && (
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="text-gray-400 hover:text-church-navy transition-colors"
                          title="Edit Roles"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SoftCard>

      {/* Edit Roles Modal */}
      {editingUser && (
        <Modal
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title="Change System Roles"
          subtitle={`Assign system roles and access levels for ${editingUser.name}`}
          icon={Shield}
          maxWidth="md"
          footer={
            <>
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={saving}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveRole}
                disabled={saving || selectedRoles.length === 0}
                className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm Change'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-amber-50 text-amber-900 p-3.5 rounded-xl text-xs flex items-start border border-amber-200/70">
              <AlertCircle size={15} className="mr-2 shrink-0 mt-0.5 text-amber-600" />
              <p>
                Users can hold multiple roles simultaneously. The <strong>first selected role</strong> acts as their primary display role.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                System Roles
                <span className="ml-1.5 text-[11px] font-normal text-slate-400 lowercase">(select one or more)</span>
              </label>
              <div className="space-y-2">
                {availableRoles.map(role => {
                  const isChecked = selectedRoles.includes(role);
                  const isFirst = selectedRoles[0] === role;
                  return (
                    <label
                      key={role}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#EBF2F7]/50 border-[#2C4A60] shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRole(role)}
                        className="w-4 h-4 rounded text-[#2C4A60] accent-[#2C4A60]"
                      />
                      <span className="text-xs font-bold text-slate-800 capitalize flex-1">
                        {role.replace(/_/g, ' ')}
                      </span>
                      {isFirst && isChecked && (
                        <span className="text-[10px] font-bold text-[#2C4A60] bg-[#EBF2F7] px-2 py-0.5 rounded-full border border-[#D5E3EC]">
                          PRIMARY
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {selectedRoles.length > 0 && (
                <p className="text-[11px] text-slate-500 pt-1">
                  Primary role: <strong className="text-slate-800 capitalize">{selectedRoles[0].replace(/_/g, ' ')}</strong>
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Audit Reason (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for role change (e.g. joined sound tech ministry)..."
                rows="2"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-[#2C4A60] resize-none transition-all"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
