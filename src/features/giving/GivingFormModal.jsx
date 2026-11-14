import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, User, Users, HeartHandshake } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernDatePicker from '../../components/ui/ModernDatePicker';
import Modal from '../../components/ui/Modal';

const METHOD_OPTIONS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'GCash', label: 'GCash' },
  { value: 'Maya', label: 'Maya' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Check', label: 'Check' },
  { value: 'Online Payment', label: 'Online Payment' }
];

const GIVER_TYPE_OPTIONS = [
  { id: 'individual', label: 'Individual', icon: User },
  { id: 'household', label: 'Household', icon: Users },
  { id: 'anonymous', label: 'Loose Offering', icon: HeartHandshake }
];

const normalizeMethod = (m) => {
  if (!m) return 'Cash';
  const raw = String(m).trim();
  const lower = raw.toLowerCase().replace(/_/g, ' ');
  if (lower === 'cash') return 'Cash';
  if (lower === 'gcash') return 'GCash';
  if (lower === 'maya') return 'Maya';
  if (lower === 'bank transfer' || lower === 'bank') return 'Bank Transfer';
  if (lower === 'check') return 'Check';
  if (lower === 'online payment' || lower === 'online') return 'Online Payment';
  return raw.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export default function GivingFormModal({ isOpen, onClose, record = null, editingRecord = null }) {
  const { userProfile, currentUser } = useAuth();
  const CHURCH_ID = userProfile?.churchId ;
  const activeRecord = record || editingRecord;

  const [formData, setFormData] = useState({
    giverEntityType: 'individual',
    householdId: '',
    userId: '',
    donorName: '',
    amount: '',
    date: '',
    transactionDate: '',
    fundId: '',
    fundType: '',
    method: 'Cash',
    campaignId: '',
    notes: '',
    proofUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [funds, setFunds] = useState([]);

  const donorOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Anonymous' }];
    members.forEach(m => {
      opts.push({ value: m.id, label: m.name });
    });
    if (formData.userId && !opts.some(o => o.value === formData.userId)) {
      opts.push({ value: formData.userId, label: formData.donorName || 'Selected Member' });
    }
    if (!formData.userId && formData.donorName && formData.donorName !== 'Anonymous' && formData.donorName !== 'Loose Offering') {
      opts.push({ value: 'custom_donor', label: formData.donorName });
    }
    return opts;
  }, [members, formData.userId, formData.donorName]);

  useEffect(() => {
    if (activeRecord) {
      let derivedGiverType = activeRecord.giverEntityType;
      if (!derivedGiverType) {
        derivedGiverType = (!activeRecord.userId && (!activeRecord.donorName || activeRecord.donorName === 'Anonymous' || activeRecord.donorName === 'Loose Offering')) ? 'anonymous' : 'individual';
      }
      setFormData({
        giverEntityType: derivedGiverType,
        householdId: activeRecord.householdId || '',
        userId: activeRecord.userId || '',
        donorName: activeRecord.donorName || '',
        amount: activeRecord.amount !== undefined && activeRecord.amount !== null ? activeRecord.amount.toString() : '',
        date: activeRecord.date || activeRecord.transactionDate || '',
        transactionDate: activeRecord.transactionDate || activeRecord.date || '',
        fundId: activeRecord.fundId || '',
        fundType: activeRecord.fundType || '',
        method: normalizeMethod(activeRecord.method || activeRecord.paymentMethod || 'Cash'),
        campaignId: activeRecord.campaignId || '',
        notes: activeRecord.notes || activeRecord.note || '',
        proofUrl: activeRecord.proofUrl || activeRecord.proofOfPaymentUrl || ''
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        giverEntityType: 'individual',
        householdId: '',
        userId: '',
        donorName: '',
        amount: '',
        date: today,
        transactionDate: today,
        fundId: '',
        fundType: '',
        method: 'Cash',
        campaignId: '',
        notes: '',
        proofUrl: ''
      });
    }
    setError('');

    // Fetch members for dropdown
    if (isOpen) {
      const fetchMembers = async () => {
        try {
          if (!CHURCH_ID) return;
          const qMembers = query(collection(db, 'users'), where('churchId', '==', CHURCH_ID));
          const qHouseholds = query(collection(db, 'households'), where('churchId', '==', CHURCH_ID));
          
          const [membersSnap, householdsSnap] = await Promise.all([getDocs(qMembers), getDocs(qHouseholds)]);
          
          const activeMembers = membersSnap.docs
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
          setHouseholds(householdsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          if (activeRecord && !activeRecord.userId && activeRecord.donorName) {
            const matched = activeMembers.find(m => m.name.toLowerCase() === activeRecord.donorName.toLowerCase());
            if (matched) {
              setFormData(prev => ({ ...prev, userId: matched.id }));
            }
          }
        } catch (e) {
          console.error("Failed to fetch members for dropdown", e);
        }
      };
      
      const fetchCampaigns = async () => {
        try {
          if (!CHURCH_ID) return;
          const q = query(collection(db, 'givingCampaigns'), where('churchId', '==', CHURCH_ID));
          const snap = await getDocs(q);
          const activeCampaigns = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(c => c.status === 'active')
            .sort((a, b) => a.title.localeCompare(b.title));
          setCampaigns(activeCampaigns);
        } catch (e) {
          console.error("Failed to fetch campaigns for dropdown", e);
        }
      };

      const fetchFunds = async () => {
        try {
          if (!CHURCH_ID) return;
          const q = query(collection(db, 'givingFunds'), where('churchId', '==', CHURCH_ID), where('status', '==', 'active'));
          const snap = await getDocs(q);
          const activeFunds = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(f => f.allowGiving !== false)
            .sort((a, b) => a.name.localeCompare(b.name));
          setFunds(activeFunds);
          
          if (!activeRecord && activeFunds.length > 0) {
             setFormData(prev => ({ ...prev, fundId: activeFunds[0].id, fundType: activeFunds[0].name }));
          }
        } catch (e) {
          console.error("Failed to fetch funds for dropdown", e);
        }
      };
      
      fetchMembers();
      fetchCampaigns();
      fetchFunds();
    }
  }, [record, editingRecord, isOpen, userProfile?.churchId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid amount.");
      }

      // Ensure fundType is set for backwards compatibility based on selected fundId
      let finalFundType = formData.fundType;
      if (formData.fundId) {
        const selectedFund = funds.find(f => f.id === formData.fundId);
        if (selectedFund) {
          finalFundType = selectedFund.name;
        }
      }

      const finalGiverType = formData.giverEntityType;
      const finalHouseholdId = finalGiverType === 'household' ? formData.householdId : null;
      let finalUserId = formData.userId;
      let finalDonorName = formData.donorName;
      
      if (finalGiverType === 'household') {
        const householdObj = households.find(h => h.id === finalHouseholdId);
        finalUserId = householdObj?.primaryMemberId || null;
      } else if (finalGiverType === 'anonymous') {
        finalUserId = null;
        finalDonorName = 'Loose Offering';
      }

      const payload = {
        ...formData,
        giverEntityType: finalGiverType,
        householdId: finalHouseholdId,
        userId: finalUserId || null,
        donorName: finalDonorName,
        fundType: finalFundType,
        amount: amountNum,
        transactionDate: formData.date
      };
      if (!payload.campaignId) delete payload.campaignId;

      if (activeRecord) {
        await updateDoc(doc(db, 'givingRecords', activeRecord.id), {
          ...payload,
          churchId: CHURCH_ID,
          donorName: finalDonorName || 'Anonymous',
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null
        });

        // Handle Campaign Amount updates for Edits
        const oldAmount = activeRecord.amount || 0;
        const oldCampaignId = activeRecord.campaignId;
        const newCampaignId = payload.campaignId;
        
        // If the campaign changed entirely or was removed
        if (oldCampaignId && oldCampaignId !== newCampaignId) {
           const { increment } = await import('firebase/firestore');
           await updateDoc(doc(db, 'givingCampaigns', oldCampaignId), {
              raisedAmount: increment(-oldAmount)
           });
        }
        
        // If there's a new campaign, and it's the same as old, update the diff. Else, add full amount.
        if (newCampaignId) {
           const { increment } = await import('firebase/firestore');
           if (newCampaignId === oldCampaignId) {
             const diff = amountNum - oldAmount;
             if (diff !== 0) {
               await updateDoc(doc(db, 'givingCampaigns', newCampaignId), {
                 raisedAmount: increment(diff)
               });
             }
           } else {
             await updateDoc(doc(db, 'givingCampaigns', newCampaignId), {
               raisedAmount: increment(amountNum)
             });
           }
        }
      } else {
        await addDoc(collection(db, 'givingRecords'), {
          ...payload,
          churchId: CHURCH_ID,
          donorName: finalDonorName || 'Anonymous',
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || null,
          status: 'completed'
        });
        
        // Handle new record campaign update
        if (payload.campaignId) {
          const { increment } = await import('firebase/firestore');
          await updateDoc(doc(db, 'givingCampaigns', payload.campaignId), {
            raisedAmount: increment(amountNum)
          });
        }
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save giving record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeRecord ? 'Edit Contribution' : 'Add Contribution'}
      subtitle="Record a tithe, offering, mission pledge, or donation"
      icon={DollarSign}
      maxWidth="lg"
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
            form="giving-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Record'}
          </button>
        </>
      }
    >
      <form id="giving-form" onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs sm:text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        
        {/* Donor Type Segmented Control */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Giver Entity Type
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70">
            {GIVER_TYPE_OPTIONS.map(({ id, label, icon: GiverIcon }) => {
              const isActive = formData.giverEntityType === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, giverEntityType: id }))}
                  className={`
                    flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm transition-all
                    ${isActive 
                      ? 'bg-white text-slate-900 font-bold shadow-2xs border border-white' 
                      : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-white/50'
                    }
                  `}
                >
                  <GiverIcon size={15} className={isActive ? 'text-[#2C4A60]' : 'text-slate-400'} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {formData.giverEntityType === 'household' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Household</label>
            <ModernDropdown
              value={formData.householdId}
              onChange={(val) => {
                const selectedHousehold = households.find(h => h.id === val);
                setFormData(prev => ({
                  ...prev,
                  householdId: val,
                  donorName: selectedHousehold ? selectedHousehold.name : ''
                }));
              }}
              options={[
                { value: '', label: '-- Select Household --' },
                ...households.map(h => ({ value: h.id, label: h.name }))
              ]}
              placeholder="-- Select Household --"
              searchable={true}
            />
          </div>
        )}
        
        {formData.giverEntityType === 'individual' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Donor Name</label>
            <ModernDropdown
              value={formData.userId ? formData.userId : (formData.donorName && formData.donorName !== 'Anonymous' ? 'custom_donor' : '')}
              onChange={(val) => {
                if (typeof val === 'string' && val.startsWith('custom:')) {
                  const customName = val.replace('custom:', '');
                  setFormData(prev => ({
                    ...prev,
                    userId: '',
                    donorName: customName
                  }));
                } else {
                  const selectedMember = members.find(m => m.id === val);
                  setFormData(prev => ({
                    ...prev,
                    userId: val,
                    donorName: selectedMember ? selectedMember.name : (val === '' ? 'Anonymous' : prev.donorName)
                  }));
                }
              }}
              options={donorOptions}
              placeholder="-- Select Donor --"
              searchable={true}
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Amount *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                ₱
              </div>
              <input 
                type="number" 
                step="0.01"
                min="0"
                name="amount"
                required
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all font-semibold text-slate-900 bg-white placeholder:text-slate-400 text-sm" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Date *</label>
            <ModernDatePicker 
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Fund Type *</label>
            <ModernDropdown
              value={formData.fundId}
              onChange={(val) => handleChange({ target: { name: 'fundId', value: val } })}
              options={funds.map(f => ({ value: f.id, label: f.name }))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Payment Method *</label>
            <ModernDropdown
              value={formData.method}
              onChange={(val) => handleChange({ target: { name: 'method', value: val } })}
              options={METHOD_OPTIONS}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Giving Campaign (Optional)</label>
          <ModernDropdown
            value={formData.campaignId || ''}
            onChange={(val) => handleChange({ target: { name: 'campaignId', value: val } })}
            options={[
              { value: '', label: 'None' },
              ...campaigns.map(c => ({ value: c.id, label: c.title }))
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
          <textarea 
            name="notes"
            rows="2"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Check number, specific designation, donor request, etc."
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all resize-none bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm" 
          />
        </div>
      </form>
    </Modal>
  );
}
