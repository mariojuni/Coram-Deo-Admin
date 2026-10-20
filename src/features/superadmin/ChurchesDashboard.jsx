import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Building, 
  MoreVertical, 
  Edit, 
  Power, 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Mail, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import ChurchFormModal from './ChurchFormModal';

export default function ChurchesDashboard() {
  const { currentUser } = useAuth();
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'active' | 'disabled'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'churches'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChurches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Error fetching churches in dashboard:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Compute pending approvals count
  const pendingCount = useMemo(() => {
    return churches.filter(c => {
      const s = (c.status || '').toLowerCase();
      return s === 'pending_approval' || s === 'pending_verification' || s === 'pending' || c.isApproved === false;
    }).length;
  }, [churches]);

  // Filtered churches
  const filteredChurches = useMemo(() => {
    return churches.filter(church => {
      const status = (church.status || '').toLowerCase();
      const isPending = status === 'pending_approval' || status === 'pending_verification' || status === 'pending' || church.isApproved === false;
      const isActive = status === 'active' && !isPending;
      const isDisabled = status === 'disabled' || status === 'suspended';

      // Tab match
      if (activeTab === 'pending' && !isPending) return false;
      if (activeTab === 'active' && !isActive) return false;
      if (activeTab === 'disabled' && !isDisabled) return false;

      // Search match
      if (searchTerm.trim()) {
        const queryStr = searchTerm.toLowerCase();
        const name = (church.name || '').toLowerCase();
        const city = (church.city || '').toLowerCase();
        const email = (church.contact?.email || '').toLowerCase();
        const pastor = (church.seniorPastor || '').toLowerCase();
        const denom = (church.denomination || '').toLowerCase();
        return name.includes(queryStr) || city.includes(queryStr) || email.includes(queryStr) || pastor.includes(queryStr) || denom.includes(queryStr);
      }

      return true;
    });
  }, [churches, activeTab, searchTerm]);

  // Approve church workspace
  const handleApproveChurch = async (church) => {
    setActionInProgress(church.id);
    try {
      const churchRef = doc(db, 'churches', church.id);
      await updateDoc(churchRef, {
        status: 'Active',
        approvalStatus: 'approved',
        isApproved: true,
        approvedAt: serverTimestamp(),
        approvedBy: currentUser?.uid || 'super_admin',
        updatedAt: serverTimestamp()
      });

      // Also activate founder user account if ownerUid exists
      if (church.ownerUid) {
        try {
          await updateDoc(doc(db, 'users', church.ownerUid), {
            status: 'active',
            updatedAt: new Date().toISOString()
          });
          await updateDoc(doc(db, 'userAccounts', church.ownerUid), {
            status: 'active',
            updatedAt: new Date().toISOString()
          });
        } catch (uErr) {
          console.warn('Founder user account activation deferred:', uErr);
        }
      }
    } catch (err) {
      console.error('Failed to approve church:', err);
      alert('Failed to approve church workspace: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  // Reject church application
  const handleRejectChurch = async (church) => {
    if (!window.confirm(`Are you sure you want to decline registration for "${church.name}"?`)) return;
    setActionInProgress(church.id);
    try {
      await updateDoc(doc(db, 'churches', church.id), {
        status: 'Rejected',
        approvalStatus: 'rejected',
        isApproved: false,
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser?.uid || 'super_admin'
      });
    } catch (err) {
      console.error('Failed to reject church:', err);
      alert('Error updating status: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  // Toggle active/disabled
  const handleToggleStatus = async (church) => {
    setActiveMenuId(null);
    const isCurrentlyActive = (church.status || '').toLowerCase() === 'active';
    const newStatus = isCurrentlyActive ? 'Disabled' : 'Active';
    if (window.confirm(`Are you sure you want to mark "${church.name}" as ${newStatus}?`)) {
      await updateDoc(doc(db, 'churches', church.id), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-church-navy">Tenants / Churches</h1>
          <p className="text-sm text-church-slate mt-1">
            Super Admin dashboard for governing and approving church tenant instances.
          </p>
        </div>
        <button 
          onClick={() => { setSelectedChurch(null); setIsFormOpen(true); }}
          className="flex items-center px-5 py-2.5 bg-church-green text-white rounded-full shadow-church-soft text-sm font-bold hover:scale-[1.02] transition-transform w-fit"
        >
          <Plus size={18} className="mr-2" />
          Add Church
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-church-soft">
        
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-church-navy text-white shadow-sm'
                : 'text-church-slate hover:bg-gray-100'
            }`}
          >
            All Churches ({churches.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-church-slate hover:bg-gray-100'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'pending' ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-church-emerald text-white shadow-sm'
                : 'text-church-slate hover:bg-gray-100'
            }`}
          >
            Active
          </button>

          <button
            onClick={() => setActiveTab('disabled')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'disabled'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-church-slate hover:bg-gray-100'
            }`}
          >
            Disabled
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-church-slate" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, city, email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-church-charcoal focus:outline-none focus:ring-2 focus:ring-church-navy/20 focus:border-church-navy"
          />
        </div>
      </div>

      {/* Church Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-church-slate text-sm font-semibold">
            Loading church workspace directory...
          </div>
        ) : filteredChurches.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-3xl border border-gray-100 text-center">
            <Building size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-church-charcoal">No churches match your criteria</h3>
            <p className="text-xs text-church-slate mt-1">Try switching tabs or adjusting your search keywords.</p>
          </div>
        ) : (
          filteredChurches.map((church) => {
            const rawStatus = (church.status || '').toLowerCase();
            const isPendingApproval = rawStatus === 'pending_approval' || rawStatus === 'pending' || (church.isApproved === false && rawStatus !== 'rejected');
            const isPendingVerification = rawStatus === 'pending_verification';
            const isActive = rawStatus === 'active';
            const isRejected = rawStatus === 'rejected';

            return (
              <div 
                key={church.id} 
                className={`bg-white p-6 rounded-3xl shadow-church-soft border transition-all flex flex-col relative group ${
                  isPendingApproval 
                    ? 'border-amber-300 ring-2 ring-amber-100' 
                    : isPendingVerification
                      ? 'border-blue-200'
                      : 'border-gray-100'
                }`}
              >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isPendingApproval 
                      ? 'bg-amber-100 text-amber-700' 
                      : isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Building size={24} />
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === church.id ? null : church.id)} 
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenuId === church.id && (
                      <div className="absolute right-0 top-10 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 text-left">
                        <button 
                          onClick={() => { setSelectedChurch(church); setIsFormOpen(true); setActiveMenuId(null); }} 
                          className="w-full flex items-center px-4 py-2 text-xs font-semibold text-church-navy hover:bg-gray-50"
                        >
                          <Edit size={15} className="mr-2" /> Edit Details
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(church)} 
                          className={`w-full flex items-center px-4 py-2 text-xs font-semibold ${
                            isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <Power size={15} className="mr-2" /> {isActive ? 'Disable Workspace' : 'Enable Workspace'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Church Info */}
                <h3 className="text-lg font-bold text-church-navy leading-snug">{church.name}</h3>
                <p className="text-xs text-church-slate mt-1 line-clamp-1">
                  {church.denomination ? `${church.denomination} • ` : ''}{church.city || church.address || 'Philippines'}
                </p>

                {/* Founder Details */}
                <div className="mt-3 py-2 px-3 rounded-xl bg-gray-50 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-church-slate font-medium">Founder / Contact:</span>
                    <span className="font-bold text-church-charcoal truncate max-w-[160px]">
                      {church.contact?.email || church.seniorPastor || 'Not specified'}
                    </span>
                  </div>
                  {church.tier && (
                    <div className="flex items-center justify-between">
                      <span className="text-church-slate font-medium">Plan Tier:</span>
                      <span className="font-bold uppercase text-[10px] text-church-navy">
                        {church.tier}
                      </span>
                    </div>
                  )}
                </div>

                {/* Super Admin Review Action Bar for Pending Churches */}
                {isPendingApproval && (
                  <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                      <Clock size={14} className="shrink-0" />
                      <span>Action Required: Review & Approval</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApproveChurch(church)}
                        disabled={actionInProgress === church.id}
                        className="flex-1 py-2 px-3 rounded-xl bg-church-emerald hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                      >
                        <Check size={14} />
                        <span>{actionInProgress === church.id ? 'Approving...' : 'Approve Church'}</span>
                      </button>
                      <button
                        onClick={() => handleRejectChurch(church)}
                        disabled={actionInProgress === church.id}
                        className="py-2 px-3 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer Status Pill & Tenant ID */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    isActive
                      ? 'bg-emerald-50 text-church-emerald border border-emerald-200'
                      : isPendingApproval
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isPendingVerification
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : isRejected
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-700'
                  }`}>
                    {isPendingApproval 
                      ? 'Pending Approval' 
                      : isPendingVerification 
                        ? 'Pending Email Verification' 
                        : church.status || 'Active'}
                  </span>

                  <div className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100 truncate max-w-[120px]">
                    {church.id}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      <ChurchFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        church={selectedChurch} 
      />
    </div>
  );
}
