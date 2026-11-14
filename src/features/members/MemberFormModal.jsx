import React, { useState, useEffect } from 'react';
import { User, Phone, CheckCircle, HeartHandshake } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteField, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernDatePicker from '../../components/ui/ModernDatePicker';
import GradientButton from '../../components/ui/GradientButton';
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

      // Firestore throws an error if any field is explicitly undefined
      const cleanData = Object.fromEntries(
        Object.entries(baseData).filter(([_, v]) => v !== undefined)
      );

      let matchingPendingUser = null;
      
      // Try to match pending users safely without crashing if unpermitted
      try {
        if (cleanData.email) {
          const emailQ = query(collection(db, 'users'), where('email', '==', cleanData.email), where('status', '==', 'pendingChurchLink'));
          const emailSnap = await getDocs(emailQ);
          if (!emailSnap.empty) {
            matchingPendingUser = { id: emailSnap.docs[0].id, ...emailSnap.docs[0].data() };
          }
        }
        
        if (!matchingPendingUser && cleanData.phoneNumber) {
          const phoneQ = query(collection(db, 'users'), where('phoneNumber', '==', cleanData.phoneNumber), where('status', '==', 'pendingChurchLink'));
          const phoneSnap = await getDocs(phoneQ);
          if (!phoneSnap.empty) {
            matchingPendingUser = { id: phoneSnap.docs[0].id, ...phoneSnap.docs[0].data() };
          }
        }
      } catch (matchErr) {
        console.warn("Could not check pendingChurchLink user (non-fatal):", matchErr);
      }

      if (member) {
        if (matchingPendingUser) {
          // Merge imported data into registered user's doc
          const registeredUserRef = doc(db, 'users', matchingPendingUser.id);
          await updateDoc(registeredUserRef, {
            ...cleanData,
            churchId: member.churchId || targetChurchId,
            status: 'Active',
            birthday: deleteField(),
            phone: deleteField(),
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || null
          });
          
          try {
            const oldMemberRef = doc(db, 'users', member.id);
            await deleteDoc(oldMemberRef);
          } catch (delErr) {
            console.warn("Could not delete old member doc (non-fatal):", delErr);
          }
        } else {
          // Update existing member normally
          const docRef = doc(db, 'users', member.id);
          await updateDoc(docRef, {
            ...cleanData,
            churchId: member.churchId || targetChurchId,
            birthday: deleteField(),
            phone: deleteField(),
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || null
          });
        }
      } else {
        if (matchingPendingUser) {
          const registeredUserRef = doc(db, 'users', matchingPendingUser.id);
          await updateDoc(registeredUserRef, {
            ...cleanData,
            churchId: targetChurchId,
            status: 'Active',
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || null
          });
        } else {
          await addDoc(collection(db, 'users'), {
            ...cleanData,
            createdAt: serverTimestamp(),
            createdBy: currentUser?.uid || null,
            churchId: targetChurchId
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
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="member-form" 
              disabled={loading}
              className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : member ? 'Save Changes' : 'Create Member'}
            </button>
          </>
        }
      >
        <form id="member-form" onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs sm:text-sm font-medium">{error}</div>}
            
            {/* Personal Details */}
            <div>
              <h3 className="text-xs font-bold text-[#2C4A60] uppercase tracking-wider mb-3.5 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <User size={14} /> Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name *</label>
                    <input 
                      type="text" 
                      name="firstName" 
                      required 
                      value={formData.firstName || ''} 
                      onChange={handleChange} 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-xs font-medium text-slate-900 transition-all placeholder-slate-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Middle Name</label>
                    <input 
                      type="text" 
                      name="middleName" 
                      value={formData.middleName || ''} 
                      onChange={handleChange} 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-xs font-medium text-slate-900 transition-all placeholder-slate-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name *</label>
                    <input 
                      type="text" 
                      name="lastName" 
                      required 
                      value={formData.lastName || ''} 
                      onChange={handleChange} 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-xs font-medium text-slate-900 transition-all placeholder-slate-400" 
                    />
                  </div>
                </div>
                
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
                
                <div className="flex items-center md:mt-2">
                  <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isAbroad"
                      checked={Boolean(formData.isAbroad)}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAbroad: e.target.checked }))}
                      className="mr-2 w-4 h-4 rounded accent-[#2C4A60] text-[#2C4A60] focus:ring-[#2C4A60] border-slate-300"
                    />
                    Currently Living / Working Abroad
                  </label>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-xs font-bold text-[#2C4A60] uppercase tracking-wider mb-3.5 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <Phone size={14} /> Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email || ''} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-xs font-medium text-slate-900 transition-all placeholder-slate-400" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phoneNumber" 
                    value={formData.phoneNumber || ''} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-xs font-medium text-slate-900 transition-all placeholder-slate-400" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Residential Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={formData.address || ''} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-xs font-medium text-slate-900 transition-all placeholder-slate-400" 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact (Name & Phone)</label>
                  <input 
                    type="text" 
                    name="emergencyContact" 
                    value={formData.emergencyContact || ''} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-xs font-medium text-slate-900 transition-all placeholder-slate-400" 
                  />
                </div>
              </div>
            </div>

            {/* Church Information */}
            <div>
              <h3 className="text-xs font-bold text-[#2C4A60] uppercase tracking-wider mb-3.5 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <CheckCircle size={14} /> Church Status & Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">System Role</label>
                    <ModernDropdown
                      value={formData.role || 'member'}
                      onChange={(val) => handleChange({ target: { name: 'role', value: val } })}
                      options={ROLE_OPTIONS}
                    />
                  </div>
                )}
                
                {formData.membershipCategory === 'Full Member' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">System Role</label>
                    <ModernDropdown
                      value={formData.role || 'member'}
                      onChange={(val) => handleChange({ target: { name: 'role', value: val } })}
                      options={ROLE_OPTIONS}
                    />
                  </div>
                )}
                
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
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-xs font-medium text-slate-900 transition-all placeholder-slate-400" 
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-xs font-bold text-[#2C4A60] uppercase tracking-wider mb-3.5 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <HeartHandshake size={14} /> Pastoral & Admin Notes
              </h3>
              <textarea 
                name="notes" 
                rows="3" 
                value={formData.notes || ''} 
                onChange={handleChange} 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] text-xs font-medium text-slate-900 transition-all placeholder-slate-400 resize-none" 
                placeholder="Any additional pastoral or administrative notes..."
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
