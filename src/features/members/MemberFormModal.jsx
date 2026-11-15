import React, { useState, useEffect } from 'react';
import { User, Phone, CheckCircle, HeartHandshake } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteField, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernDatePicker from '../../components/ui/ModernDatePicker';
import Modal from '../../components/ui/Modal';
import {
  getMembershipCategory,
  getMembershipSubStatus,
  MEMBERSHIP_CATEGORIES,
  FULL_MEMBER_SUBSTATUSES,
  BAPTISM_STATUSES
} from './utils/memberStatusUtils';
import { useSubscriptionLimits } from '../subscription/hooks/useSubscriptionLimits';
import UpgradeModal from '../subscription/components/UpgradeModal';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'ministry_leader', label: 'Ministry Leader' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'finance_admin', label: 'Finance Admin' },
  { value: 'church_admin', label: 'Church Admin' }
];

const INITIAL_FORM_STATE = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  role: 'member',
  familyGroup: '',
  birthDate: '',
  gender: 'Male',
  address: '',
  membershipCategory: 'Full Member',
  membershipStatus: 'Active',
  baptismStatus: 'Not Baptized',
  baptismDate: '',
  emergencyContact: '',
  notes: '',
  isAbroad: false
};

export default function MemberFormModal({ isOpen, onClose, member = null, existingMembers = [] }) {
  const { userProfile, currentUser, activeChurchId } = useAuth();
  const { canAddMember, checkAddMemberLimit } = useSubscriptionLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const targetChurchId = activeChurchId || userProfile?.churchId || member?.churchId || null;

  useEffect(() => {
    if (member) {
      const parts = (member.name || '').split(' ');
      const fallbackFirst = parts[0] || '';
      const fallbackLast = parts.length > 1 ? parts.slice(1).join(' ') : '';
      
      const resolvedCategory = getMembershipCategory(member);
      const resolvedSubStatus = getMembershipSubStatus(member);

      setFormData({
        firstName: member.firstName || fallbackFirst || '',
        middleName: member.middleName || '',
        lastName: member.lastName || fallbackLast || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || member.phone || '',
        role: member.role || 'member',
        familyGroup: member.familyGroup || '',
        birthDate: member.birthDate || member.birthday || '',
        gender: member.gender || 'Male',
        address: member.address || '',
        membershipCategory: resolvedCategory || 'Full Member',
        membershipStatus: resolvedCategory === 'Full Member' ? (resolvedSubStatus || 'Active') : (member.membershipStatus || resolvedCategory || 'Active'),
        baptismStatus: member.baptismStatus || 'Not Baptized',
        baptismDate: member.baptismDate || '',
        emergencyContact: member.emergencyContact || '',
        notes: member.notes || '',
        isAbroad: Boolean(member.isAbroad)
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
    setError('');
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const computedName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');
      
      if (!member) {
        if (!canAddMember) {
          const check = checkAddMemberLimit();
          setUpgradeReason(check);
          setShowUpgradeModal(true);
          setLoading(false);
          return;
        }

        const isDuplicate = existingMembers.find(m => 
          (m.email && formData.email && m.email.toLowerCase() === formData.email.toLowerCase()) ||
          (m.name && computedName && m.name.toLowerCase() === computedName.toLowerCase())
        );
        
        if (isDuplicate) {
          setError('A member with this name or email already exists.');
          setLoading(false);
          return;
        }
      }

      const category = formData.membershipCategory || 'Full Member';
      const status = category === 'Full Member'
        ? (formData.membershipStatus === 'Inactive' ? 'Inactive' : 'Active')
        : category;
      const isBaptized = formData.baptismStatus === 'Baptized';
      const cleanBaptismDate = isBaptized ? (formData.baptismDate || '') : '';

      const baseData = {
        ...formData,
        name: computedName,
        membershipCategory: category,
        membershipStatus: status,
        baptismStatus: formData.baptismStatus || 'Not Baptized',
        baptismDate: cleanBaptismDate,
        churchId: targetChurchId
      };

      if (!member) {
        await addDoc(collection(db, 'members'), {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        const memberRef = doc(db, 'members', member.id);
        const updates = {
          ...baseData,
          updatedAt: serverTimestamp()
        };

        if (formData.membershipCategory !== 'Full Member') {
          updates.membershipStatus = category;
        }
        if (!isBaptized) {
          updates.baptismDate = deleteField();
        }

        await updateDoc(memberRef, updates);

        if (member.householdId) {
          const householdRef = doc(db, 'households', member.householdId);
          await updateDoc(householdRef, {
            members: member.householdMembers.map(m => 
              m.memberId === member.id ? { ...m, name: computedName, role: formData.role } : m
            ),
            updatedAt: serverTimestamp()
          });
        }
      }

      onClose();
    } catch (err) {
      console.error("Save Member Error:", err);
      setError(err.message || 'Failed to save member data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={member ? 'Edit Member Profile' : 'Add New Member'}
        subtitle={member ? `Updating records for ${member.displayName || member.name || 'member'}` : 'Create a new church membership profile'}
        icon={User}
        maxWidth="2xl"
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
              form="member-form" 
              disabled={loading}
              className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Saving...' : member ? 'Save Changes' : 'Create Member'}
            </button>
          </>
        }
      >
        <form id="member-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}
            
          {/* Section 1: Personal Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
                <User size={14} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Personal Details
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Basic identifying demographics</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="firstName" 
                  required 
                  value={formData.firstName || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Aaron"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Middle Name</label>
                <input 
                  type="text" 
                  name="middleName" 
                  value={formData.middleName || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. V."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="lastName" 
                  required 
                  value={formData.lastName || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Lunario"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Birth Date</label>
                <ModernDatePicker 
                  name="birthDate" 
                  value={formData.birthDate || ''} 
                  onChange={handleChange} 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender</label>
                <ModernDropdown
                  value={formData.gender || 'Male'}
                  onChange={(val) => handleChange({ target: { name: 'gender', value: val } })}
                  options={GENDER_OPTIONS}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-xl cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  name="isAbroad"
                  checked={Boolean(formData.isAbroad)}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAbroad: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#2C4A60] text-[#2C4A60] focus:ring-[#2C4A60] border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                    Living or Working Abroad
                  </span>
                  <p className="text-[11px] text-slate-400 font-medium">Flag member for overseas diaspora fellowship</p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
                <Phone size={14} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Contact Information
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Channels to connect and communicate</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email || ''} 
                  onChange={handleChange} 
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  value={formData.phoneNumber || ''} 
                  onChange={handleChange} 
                  placeholder="+63 900 000 0000"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Residential Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address || ''} 
                  onChange={handleChange} 
                  placeholder="Street, City, Country"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact (Name & Phone)</label>
                <input 
                  type="text" 
                  name="emergencyContact" 
                  value={formData.emergencyContact || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Maria Lunario (+63 912 345 6789)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Church Status & Milestones */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
                <CheckCircle size={14} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Church Status & Milestones
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Membership classification and spiritual milestones</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Membership Category</label>
                <ModernDropdown
                  value={formData.membershipCategory || 'Full Member'}
                  onChange={(val) => {
                    setFormData(prev => ({
                      ...prev,
                      membershipCategory: val,
                      membershipStatus: val === 'Full Member'
                        ? (prev.membershipStatus === 'Inactive' ? 'Inactive' : 'Active')
                        : val
                    }));
                  }}
                  options={MEMBERSHIP_CATEGORIES}
                />
              </div>

              {formData.membershipCategory === 'Full Member' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Member Status</label>
                  <ModernDropdown
                    value={formData.membershipStatus || 'Active'}
                    onChange={(val) => handleChange({ target: { name: 'membershipStatus', value: val } })}
                    options={FULL_MEMBER_SUBSTATUSES}
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">System Role</label>
                <ModernDropdown
                  value={formData.role || 'member'}
                  onChange={(val) => handleChange({ target: { name: 'role', value: val } })}
                  options={ROLE_OPTIONS}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Baptism Status</label>
                <ModernDropdown
                  value={formData.baptismStatus || 'Not Baptized'}
                  onChange={(val) => {
                    setFormData(prev => ({
                      ...prev,
                      baptismStatus: val,
                      baptismDate: val === 'Baptized' ? prev.baptismDate : ''
                    }));
                  }}
                  options={BAPTISM_STATUSES}
                />
              </div>

              {formData.baptismStatus === 'Baptized' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Baptism Date</label>
                  <ModernDatePicker 
                    name="baptismDate" 
                    value={formData.baptismDate || ''} 
                    onChange={handleChange} 
                    placeholder="Select baptism date"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Family Group</label>
                <input 
                  type="text" 
                  name="familyGroup" 
                  value={formData.familyGroup || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Grace Group" 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                />
              </div>
            </div>
          </div>

          {/* Section 4: Pastoral & Admin Notes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
                <HeartHandshake size={14} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pastoral & Admin Notes
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Confidential ministry records and observations</p>
              </div>
            </div>

            <textarea 
              name="notes" 
              rows="3" 
              value={formData.notes || ''} 
              onChange={handleChange} 
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none" 
              placeholder="Any additional pastoral care notes, testimony notes, or ministry observations..."
            />
          </div>
        </form>
      </Modal>

      {/* Subscription Quota Upgrade Gate Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Member Limit Reached"
        message={upgradeReason?.reason}
        targetTier={upgradeReason?.targetPlan || 'growth'}
      />
    </>
  );
}
