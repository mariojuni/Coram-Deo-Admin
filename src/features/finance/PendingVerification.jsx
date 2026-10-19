import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, increment, where, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Search, CheckCircle, XCircle, FileImage, ExternalLink, Activity } from 'lucide-react';
import SoftCard from '../../components/ui/SoftCard';
import StatusPill from '../../components/ui/StatusPill';

export default function PendingVerification() {
  const { userProfile, currentUser, formatCurrency } = useAuth();
  const CHURCH_ID = userProfile?.churchId ;
  
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [usersMap, setUsersMap] = useState({});
  const [fundsMap, setFundsMap] = useState({});

  useEffect(() => {
    if (!CHURCH_ID) return;
    
    // Query only pending records to optimize read load
    const q = query(
      collection(db, 'givingRecords'), 
      where('churchId', '==', CHURCH_ID),
      where('status', '==', 'pending')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by submitted date ascending (oldest first)
      docs.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date();
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date();
        return dateA - dateB;
      });
      setPendingRecords(docs);
      setLoading(false);
    }, (error) => {
      console.error("PendingVerification error:", error);
      setLoading(false);
    });

    const qUsers = query(collection(db, 'users'), where('churchId', '==', CHURCH_ID));
    const unsubscribeUsers = onSnapshot(qUsers, (snap) => {
      const map = {};
      snap.forEach(d => {
        const u = d.data();
        let name = '';
        if (u.firstName || u.lastName) {
          const f = (u.firstName || '').trim().split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          const l = (u.lastName || '').trim().split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          const m = u.middleName ? u.middleName.trim().charAt(0).toUpperCase() + '.' : '';
          name = [f, m, l].filter(Boolean).join(' ');
        }
        if (!name) name = u.name || u.displayName;
        map[d.id] = name || 'Anonymous';
      });
      setUsersMap(map);
    });

    const qFunds = query(collection(db, 'givingFunds'), where('churchId', '==', CHURCH_ID));
    const unsubscribeFunds = onSnapshot(qFunds, (snap) => {
      const map = {};
      snap.forEach(d => {
        map[d.id] = d.data().name;
      });
      setFundsMap(map);
    });

    return () => {
      unsubscribe();
      unsubscribeUsers();
      unsubscribeFunds();
    };
  }, [userProfile?.churchId]);

  const getDonorName = (record) => {
    return usersMap[record.userId] || record.donorName || record.userName || 'Anonymous';
  };

  const mapFundIdToName = (fundId, fundType) => {
    if (fundId && fundsMap[fundId]) return fundsMap[fundId];
    if (fundType) return fundType;
    if (!fundId) return 'Tithe';
    const lower = fundId.toLowerCase();
    if (lower.includes('tithe')) return 'Tithe';
    if (lower.includes('offering')) return 'Offering';
    if (lower.includes('building')) return 'Building Fund';
    if (lower.includes('mission')) return 'Missions';
    return 'Others';
  };

  const handleApprove = async (record) => {
    if (!window.confirm('Are you sure you want to approve this giving record?')) return;
    
    try {
      const recordRef = doc(db, 'givingRecords', record.id);
      const submittedDate = record.submittedAt?.toDate() || new Date();
      const dateString = submittedDate.toISOString().split('T')[0];

      await updateDoc(recordRef, {
        status: 'completed',
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.uid,
        date: dateString,
        fundType: mapFundIdToName(record.fundId, record.fundType),
        updatedAt: serverTimestamp()
      });
      
      if (record.campaignId) {
        try {
          const campaignRef = doc(db, 'givingCampaigns', record.campaignId);
          await updateDoc(campaignRef, {
            raisedAmount: increment(record.amount || 0)
          });
        } catch (campaignErr) {
          console.error("Error updating campaign raised amount:", campaignErr);
        }
      }
    } catch (err) {
      console.error("Error approving submission", err);
      alert("Failed to approve submission.");
    }
  };

  const handleReject = async (record) => {
    const reason = window.prompt("Please enter a reason for rejecting this submission:");
    if (reason === null) return; 
    
    try {
      await updateDoc(doc(db, 'givingRecords', record.id), {
        status: 'rejected',
        rejectionReason: reason || 'Declined by admin',
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (record.proofOfPaymentUrl) {
        try {
          const imageRef = ref(storage, record.proofOfPaymentUrl);
          await deleteObject(imageRef);
        } catch (storageErr) {
          console.error("Error deleting image from storage:", storageErr);
        }
      }
    } catch (err) {
      console.error("Error rejecting giving record:", err);
      alert("Failed to reject record.");
    }
  };

  const filteredRecords = pendingRecords.filter(r => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const donorName = getDonorName(r).toLowerCase();
    const fundMatch = mapFundIdToName(r.fundId, r.fundType).toLowerCase().includes(search);
    return donorName.includes(search) || fundMatch;
  });

  if (loading) {
    return (
      <SoftCard className="p-16 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
          <p className="text-sm font-semibold text-church-slate">Loading pending verifications...</p>
        </div>
      </SoftCard>
    );
  }

  return (
    <SoftCard className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-extrabold text-church-rose tracking-wider uppercase bg-church-rose-light px-3 py-1 rounded-full border border-pink-100">
            AUDIT & VERIFICATION
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-church-charcoal tracking-tight mt-2">
            Pending Submissions ({pendingRecords.length})
          </h2>
          <p className="text-xs sm:text-sm text-church-slate mt-0.5">
            Review online transfers, e-wallet submissions, and deposit slips awaiting approval.
          </p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by donor or fund..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200/80 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-church-rose/20 focus:border-church-rose bg-gray-50/50 transition-all"
          />
          <Search size={16} className="absolute left-3.5 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-church-charcoal uppercase tracking-wider">
              <th className="p-4 pl-6">Date Submitted</th>
              <th className="p-4">Submitted By</th>
              <th className="p-4">Fund Allocation</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Proof of Payment</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-sm">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center mb-3 mx-auto border border-emerald-100/60 shadow-sm">
                    <CheckCircle size={30} />
                  </div>
                  <p className="text-church-charcoal font-black text-lg">All caught up!</p>
                  <p className="text-church-slate text-sm mt-1">No pending digital transactions to review.</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const submittedDate = record.submittedAt?.toDate ? record.submittedAt.toDate() : new Date();
                const donorName = getDonorName(record);
                return (
                  <tr key={record.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="p-4 pl-6 whitespace-nowrap">
                      <p className="text-xs font-bold text-church-charcoal">
                        {submittedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[11px] text-church-slate mt-0.5">
                        {submittedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-50 to-violet-50 text-church-charcoal border border-rose-100/60 flex items-center justify-center font-black text-sm uppercase shrink-0">
                          {donorName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-church-charcoal">{donorName}</p>
                          <span className="text-[11px] text-church-muted font-medium">App Submission</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <StatusPill variant="violet">
                          {mapFundIdToName(record.fundId, record.fundType)}
                        </StatusPill>
                        {record.campaignId && (
                          <StatusPill variant="amber" className="text-[10px] py-0 px-2">
                            Campaign
                          </StatusPill>
                        )}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-base font-black text-emerald-600">
                        {formatCurrency(record.amount)}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {record.proofOfPaymentUrl ? (
                        <a 
                          href={record.proofOfPaymentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-bold text-church-rose hover:text-church-rose-dark bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-xl transition-colors border border-rose-100"
                        >
                          <FileImage size={15} className="mr-1.5" />
                          View Receipt
                          <ExternalLink size={12} className="ml-1.5 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-xs text-church-muted italic">No receipt attached</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleApprove(record)}
                          className="flex items-center px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition-all shadow-sm"
                          title="Approve Transaction"
                        >
                          <CheckCircle size={15} className="mr-1" /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(record)}
                          className="flex items-center px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-all"
                          title="Reject Transaction"
                        >
                          <XCircle size={15} className="mr-1" /> Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </SoftCard>
  );
}
