import React, { useState, useEffect } from 'react';
import { X, User, Phone, CheckCircle, HeartHandshake } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteField, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernDatePicker from '../../components/ui/ModernDatePicker';
import GradientButton from '../../components/ui/GradientButton';
import {
  getMembershipCategory,
  getMembershipSubStatus,
  MEMBERSHIP_CATEGORIES,
  FULL_MEMBER_SUBSTATUSES,
  BAPTISM_STATUSES
} from './utils/memberStatusUtils';
import { useSubscriptionLimits } from '../subscription/hooks/useSubscriptionLimits';
import UpgradeModal from '../subscription/components/UpgradeModal';

export default function MemberFormModal({ isOpen, onClose, member = null, existingMembers = [] }) {
  const { userProfile, currentUser } = useAuth();
  const { canAddMember, checkAddMemberLimit } = useSubscriptionLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState(null);
  const [formData, setFormData] = useState({
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      const parts = (member.name || '').split(' ');
      const fallbackFirst = parts[0] || '';
      const fallbackLast = parts.length > 1 ? parts.slice(1).join(' ') : '';
      
      const resolvedCategory = getMembershipCategory(member);
      const resolvedSubStatus = getMembershipSubStatus(member);

      setFormData({
        firstName: member.firstName || fallbackFirst,
        middleName: member.middleName || '',
        lastName: member.lastName || fallbackLast,
        email: member.email || '',
        phoneNumber: member.phoneNumber || member.phone || '',
        role: member.role || 'member',
        familyGroup: member.familyGroup || '',
        birthDate: member.birthDate || member.birthday || '',
        gender: member.gender || 'Male',
        address: member.address || '',
        membershipCategory: resolvedCategory,
        membershipStatus: resolvedCategory === 'Full Member' ? resolvedSubStatus : (member.membershipStatus || resolvedCategory),
        baptismStatus: member.baptismStatus || 'Not Baptized',
        baptismDate: member.baptismDate || '',
        emergencyContact: member.emergencyContact || '',
        notes: member.notes || '',
        isAbroad: member.isAbroad || false
      });
    } else {
      setFormData({
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
      });
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
        baptismDate: cleanBaptismDate
      };

      // Firestore throws an error if any field is explicitly undefined
      const cleanData = Object.fromEntries(
        Object.entries(baseData).filter(([_, v]) => v !== undefined)
      );

      let matchingPendingUser = null;
      
      // Try to match by email first
      if (cleanData.email) {
        const emailQ = query(collection(db, 'users'), where('email', '==', cleanData.email), where('status', '==', 'pendingChurchLink'));
        const emailSnap = await getDocs(emailQ);
        if (!emailSnap.empty) {
          matchingPendingUser = { id: emailSnap.docs[0].id, ...emailSnap.docs[0].data() };
        }
      }
      
      // Try to match by phone if not found by email
      if (!matchingPendingUser && cleanData.phoneNumber) {
        const phoneQ = query(collection(db, 'users'), where('phoneNumber', '==', cleanData.phoneNumber), where('status', '==', 'pendingChurchLink'));
        const phoneSnap = await getDocs(phoneQ);
        if (!phoneSnap.empty) {
          matchingPendingUser = { id: phoneSnap.docs[0].id, ...phoneSnap.docs[0].data() };
        }
      }

      if (member) {
        if (matchingPendingUser) {
          // Merge imported data into registered user's doc
          const registeredUserRef = doc(db, 'users', matchingPendingUser.id);
          await updateDoc(registeredUserRef, {
            ...cleanData,
            churchId: member.churchId || userProfile?.churchId || null,
            status: 'Active', // Remove pending status and set to Active
            birthday: deleteField(),
            phone: deleteField(),
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || null
          });
          
          // Delete old imported member document
          const oldMemberRef = doc(db, 'users', member.id);
          await deleteDoc(oldMemberRef);
        } else {
          // Update existing member normally
          const docRef = doc(db, 'users', member.id);
          await updateDoc(docRef, {
            ...cleanData,
            // Always preserve/set churchId so legacy docs without it get migrated
            // and so the Firestore rule (churchId must not change) always passes
            churchId: member.churchId || userProfile?.churchId || null,
            birthday: deleteField(),
            phone: deleteField(),
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || null
          });
        }
      } else {
        if (matchingPendingUser) {
          // Admin is adding a new member, and we found a pending auth account!
          // We should just update the pending auth account instead of duplicating
          const registeredUserRef = doc(db, 'users', matchingPendingUser.id);
          await updateDoc(registeredUserRef, {
            ...cleanData,
            churchId: userProfile?.churchId || null,
            status: 'Active',
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || null
          });
        } else {
          // Add new member profile
          await addDoc(collection(db, 'users'), {
            ...cleanData,
            createdAt: serverTimestamp(),
            createdBy: currentUser?.uid || null,
            churchId: userProfile?.churchId || null
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-church-soft overflow-hidden flex flex-col my-4 sm:my-6 max-h-[90vh]">
        
        {/* Brand Accent Top Stripe */}
        <div className="h-1 w-full bg-gradient-coram shrink-0" />

        {/* Compact Header matching MemberProfileModal */}
        <div className="bg-church-navy text-white px-6 py-4 sm:px-7 sm:py-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-church-rose/20 text-church-rose flex items-center justify-center font-bold shrink-0">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {member ? 'Edit Member Profile' : 'Add New Member'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {member ? `Updating records for ${member.displayName || member.name || 'member'}` : 'Create a new church membership profile'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          <form id="member-form" onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs sm:text-sm font-medium">{error}</div>}
            
            {/* Personal Details */}
            <div>
              <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider mb-3.5 pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                <User size={14} /> Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-church-navy mb-1.5">First Name *</label>
                    <input 
                      type="text" 
                      name="firstName" 
                      required 
                      value={formData.firstName} 
                      onChange={handleChange} 
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose focus:border-transparent text-sm transition-shadow" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-church-navy mb-1.5">Middle Name</label>
                    <input 
                      type="text" 
                      name="middleName" 
                      value={formData.middleName} 
                      onChange={handleChange} 
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose focus:border-transparent text-sm transition-shadow" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-church-navy mb-1.5">Last Name *</label>
                    <input 
                      type="text" 
                      name="lastName" 
                      required 
                      value={formData.lastName} 
                      onChange={handleChange} 
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose focus:border-transparent text-sm transition-shadow" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-church-navy mb-1.5">Birth Date</label>
                  <ModernDatePicker 
                    name="birthDate" 
                    value={formData.birthDate} 
                    onChange={handleChange} 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-church-navy mb-1.5">Gender</label>
                  <ModernDropdown
                    value={formData.gender}
                    onChange={(val) => handleChange({ target: { name: 'gender', value: val } })}
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' }
                    ]}
                  />
                </div>
                
                <div className="flex items-center md:mt-2">
                  <label className="flex items-center text-xs font-semibold text-church-navy cursor-pointer">
                    <input
                      type="checkbox"
                      name="isAbroad"
                      checked={formData.isAbroad}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAbroad: e.target.checked }))}
                      className="mr-2 w-4 h-4 rounded accent-church-rose text-church-rose focus:ring-church-rose border-gray-300"
                    />
                    Currently Living / Working Abroad
                  </label>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider mb-3.5 pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                <Phone size={14} /> Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-church-navy mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose focus:border-transparent text-sm transition-shadow" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-church-navy mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose focus:border-transparent text-sm transition-shadow" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-church-navy mb-1.5">Residential Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose focus:border-transparent text-sm transition-shadow" 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-church-navy mb-1.5">Emergency Contact (Name & Phone)</label>
                  <input 
                    type="text" 
                    name="emergencyContact" 
                    value={formData.emergencyContact} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose focus:border-transparent text-sm transition-shadow" 
                  />
                </div>
              </div>
            </div>

            {/* Church Information */}
            <div>
              <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider mb-3.5 pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                <CheckCircle size={14} /> Church Status & Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-church-navy mb-1.5">Membership Category</label>
                  <ModernDropdown
                    value={formData.membershipCategory}
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
                    <label className="block text-xs font-bold text-church-navy mb-1.5">Full Member Status</label>
                    <ModernDropdown
                      value={formData.membershipStatus}
                      onChange={(val) => handleChange({ target: { name: 'membershipStatus', value: val } })}
                      options={FULL_MEMBER_SUBSTATUSES}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-church-navy mb-1.5">System Role</label>
                    <ModernDropdown
                      value={formData.role}
                      onChange={(val) => handleChange({ target: { name: 'role', value: val } })}
                      options={[
                        { value: 'member', label: 'Member' },
                        { value: 'ministry_leader', label: 'Ministry Leader' },
                        { value: 'pastor', label: 'Pastor' },
                        { value: 'secretary', label: 'Secretary' },
                        { value: 'finance_admin', label: 'Finance Admin' },
                        { value: 'church_admin', label: 'Church Admin' }
                      ]}
                    />
                  </div>
                )}
                
                {formData.membershipCategory === 'Full Member' && (
                  <div>
                    <label className="block text-xs font-bold text-church-navy mb-1.5">System Role</label>
                    <ModernDropdown
                      value={formData.role}
                      onChange={(val) => handleChange({ target: { name: 'role', value: val } })}
                      options={[
                        { value: 'member', label: 'Member' },
                        { value: 'ministry_leader', label: 'Ministry Leader' },
                        { value: 'pastor', label: 'Pastor' },
                        { value: 'secretary', label: 'Secretary' },
                        { value: 'finance_admin', label: 'Finance Admin' },
                        { value: 'church_admin', label: 'Church Admin' }
                      ]}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-church-navy mb-1.5">Baptism Status</label>
                  <ModernDropdown
                    value={formData.baptismStatus}
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
                    <label className="block text-xs font-bold text-church-navy mb-1.5">Baptism Date</label>
                    <ModernDatePicker 
                      name="baptismDate" 
                      value={formData.baptismDate} 
                      onChange={handleChange} 
                      placeholder="Select baptism date"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-church-navy mb-1.5">Family Group</label>
                  <input 
                    type="text" 
                    name="familyGroup" 
                    value={formData.familyGroup} 
                    onChange={handleChange} 
                    placeholder="e.g. Grace Group" 
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose focus:border-transparent text-sm transition-shadow" 
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider mb-3.5 pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                <HeartHandshake size={14} /> Pastoral & Admin Notes
              </h3>
              <textarea 
                name="notes" 
                rows="3" 
                value={formData.notes} 
                onChange={handleChange} 
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose focus:border-transparent text-sm transition-shadow resize-none" 
                placeholder="Any additional pastoral or administrative notes..."
              />
            </div>
          </form>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-3.5 sm:px-7 sm:py-4 border-t border-gray-100 flex justify-end items-center gap-3 bg-gray-50/70 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading} 
            className="px-5 py-2 bg-white border border-gray-200 rounded-full text-xs sm:text-sm font-bold text-church-slate hover:bg-gray-50 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <GradientButton 
            type="submit" 
            form="member-form" 
            disabled={loading}
            loading={loading}
            size="sm"
          >
            {member ? 'Save Changes' : 'Create Member'}
          </GradientButton>
        </div>
      </div>

      {/* Subscription Quota Upgrade Gate Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Member Limit Reached"
        message={upgradeReason?.reason}
        targetTier={upgradeReason?.targetPlan || 'growth'}
      />
    </div>
  );
}
