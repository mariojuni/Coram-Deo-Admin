import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, HeartHandshake, CheckCircle, XCircle, Trash2, Edit, Check, Shield, Search, Filter } from 'lucide-react';
import PrayerRequestModal from './PrayerRequestModal';
import { canModeratePrayerRequests } from '../../utils/permissions';
import ModernDropdown from '../../components/ui/ModernDropdown';
import { useAuth } from '../../context/AuthContext';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function PrayerModeration() {
  const { userProfile, currentUser } = useAuth();
  const churchId = userProfile?.churchId;
  const isModerator = canModeratePrayerRequests(userProfile);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  useEffect(() => {
    if (!churchId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    
    // We only filter by churchId and orderBy createdAt to avoid needing many composite indexes right now.
    // Client-side filtering handles the rest, which is fine for typical prayer request volumes per church.
    let q;
    if (categoryFilter === 'all') {
      q = query(collection(db, 'churches', churchId, 'prayer_requests'), orderBy('createdAt', 'desc'));
    } else {
      // NOTE: Filtering by category while ordering by createdAt requires a composite index in Firestore.
      // If it fails, we will need to create the index.
      q = query(collection(db, 'churches', churchId, 'prayer_requests'), where('category', '==', categoryFilter), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching prayer requests: ", error);
      // If the index error happens, it will log here. 
      // For immediate fallback without index: 
      // just query orderBy('createdAt', 'desc') and filter category locally.
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId, categoryFilter]);

  const handleAddClick = () => {
    setEditingRequest(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (request) => {
    setEditingRequest(request);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (!isModerator) return;
    if (window.confirm('Are you sure you want to delete this prayer request?')) {
      try {
        await deleteDoc(doc(db, 'churches', churchId, 'prayer_requests', id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete request.");
      }
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!isModerator) return;
    try {
      await updateDoc(doc(db, 'churches', churchId, 'prayer_requests', id), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("Failed to update status.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    return dateObj.toLocaleDateString(undefined, options);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <StatusPill variant="emerald" dot className="text-[11px] py-0.5">Approved</StatusPill>;
      case 'pending':
        return <StatusPill variant="amber" dot className="text-[11px] py-0.5 animate-pulse">Pending Review</StatusPill>;
      case 'answered':
        return <StatusPill variant="violet" dot className="text-[11px] py-0.5">Answered</StatusPill>;
      case 'rejected':
        return <StatusPill variant="rose" className="text-[11px] py-0.5">Rejected</StatusPill>;
      default:
        return <StatusPill variant="slate" className="text-[11px] py-0.5 capitalize">{status}</StatusPill>;
    }
  };

  const renderCategoryBadge = (category) => {
    const cat = category || 'other';
    const labels = {
      healing: 'Healing',
      family: 'Family',
      spiritual_growth: 'Spiritual Growth',
      provision: 'Provision',
      thanksgiving: 'Thanksgiving',
      other: 'Other'
    };
    const variants = {
      healing: 'rose',
      family: 'violet',
      spiritual_growth: 'violet',
      provision: 'emerald',
      thanksgiving: 'amber',
      other: 'slate'
    };
    
    return (
      <StatusPill variant={variants[cat] || 'slate'} className="text-[10px] py-0.5">
        {labels[cat] || labels.other}
      </StatusPill>
    );
  };

  const filteredRequests = requests.filter(req => {
    // 1. Role-based visibility check
    // "finance_admin, ministry_leader, secretary, and member cannot see leaders_only prayer requests unless they created the request"
    if (req.visibility === 'leaders_only' && !isModerator) {
      if (req.createdBy !== currentUser?.uid) {
        return false;
      }
    }

    // 2. Search filter
    const searchMatch = !searchTerm || 
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.requestText?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!searchMatch) return false;

    // 3. Status filter
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;

    // 4. Visibility filter
    if (visibilityFilter !== 'all' && req.visibility !== visibilityFilter) return false;

    // 5. Date filter
    if (dateFilter !== 'all' && req.createdAt) {
      const reqDate = req.createdAt.toDate ? req.createdAt.toDate() : new Date(req.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - reqDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (dateFilter === 'today' && diffDays > 1) return false;
      if (dateFilter === 'week' && diffDays > 7) return false;
      if (dateFilter === 'month' && diffDays > 30) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 flex flex-col h-full max-w-5xl mx-auto">
      {/* Header aligned to CoramDeo Design System */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <StatusPill variant="rose" dot className="mb-2">
            Intercession & Prayer Care
          </StatusPill>
          <h1 className="text-3xl font-black text-church-charcoal tracking-tight">Prayer Requests</h1>
          <p className="text-sm text-church-slate mt-1">Review, moderate, and celebrate answered prayers from the congregation.</p>
        </div>
        <GradientButton 
          onClick={handleAddClick}
          icon={Plus}
        >
          Add Request
        </GradientButton>
      </div>

      {/* Filter Bar */}
      <SoftCard className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search size={17} className="text-church-muted" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 hover:bg-gray-50 border border-gray-200/80 rounded-full text-sm text-church-charcoal placeholder-church-muted focus:outline-none focus:ring-2 focus:ring-church-rose/20 focus:border-church-rose transition-all"
            placeholder="Search prayer requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-church-slate uppercase tracking-wider pl-1">Status:</span>
            <ModernDropdown
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'answered', label: 'Answered' },
                { value: 'rejected', label: 'Rejected' }
              ]}
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-church-slate uppercase tracking-wider pl-1">Category:</span>
            <ModernDropdown
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'healing', label: 'Healing' },
                { value: 'family', label: 'Family' },
                { value: 'spiritual_growth', label: 'Spiritual Growth' },
                { value: 'provision', label: 'Provision' },
                { value: 'thanksgiving', label: 'Thanksgiving' },
                { value: 'other', label: 'Other' }
              ]}
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-church-slate uppercase tracking-wider pl-1">Visibility:</span>
            <ModernDropdown
              value={visibilityFilter}
              onChange={(val) => setVisibilityFilter(val)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'public', label: 'Public' },
                { value: 'leaders_only', label: 'Leaders Only' }
              ]}
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-church-slate uppercase tracking-wider pl-1">Date:</span>
            <ModernDropdown
              value={dateFilter}
              onChange={(val) => setDateFilter(val)}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Past 7 Days' },
                { value: 'month', label: 'Past 30 Days' }
              ]}
            />
          </div>
        </div>
      </SoftCard>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-9 h-9 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
            <p className="text-sm font-medium text-church-slate">Loading prayer requests...</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <SoftCard className="p-16 flex flex-col items-center justify-center text-center flex-1 my-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-4 border border-rose-100/60 shadow-sm">
            <HeartHandshake size={30} />
          </div>
          <h3 className="text-xl font-black text-church-charcoal mb-1">No prayer requests found</h3>
          <p className="text-church-slate text-sm max-w-sm mb-6">
            {categoryFilter !== 'all' || statusFilter !== 'all' || searchTerm !== ''
              ? "No prayer requests matching this filter criteria." 
              : "All caught up. No prayer requests currently pending review."}
          </p>
          <GradientButton 
            onClick={handleAddClick}
            icon={Plus}
          >
            Add Request
          </GradientButton>
        </SoftCard>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(request => (
            <SoftCard 
              key={request.id} 
              hover
              className="p-5 flex flex-col sm:flex-row gap-4 relative group"
            >
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-sm text-church-charcoal">{request.requesterName}</span>
                    <span className="text-xs text-church-slate font-medium">• {formatDate(request.createdAt)}</span>
                    {renderCategoryBadge(request.category)}
                    {request.visibility === 'leaders_only' && (
                      <StatusPill variant="amber" icon={Shield} className="text-[10px] py-0.5">
                        Pastors Only
                      </StatusPill>
                    )}
                  </div>
                  <div className="sm:hidden">
                    {renderStatusBadge(request.status)}
                  </div>
                </div>
                
                <p className="text-church-charcoal/90 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                  "{request.requestText}"
                </p>

                {isModerator && (
                  <div className="mt-auto flex items-center space-x-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleEditClick(request)} 
                      className="text-church-slate hover:text-church-charcoal p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      title="Edit Request"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(request.id)} 
                      className="text-church-slate hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete Request"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Status and Actions Sidebar */}
              <div className="sm:w-48 shrink-0 flex flex-col space-y-2 sm:border-l sm:border-gray-100 sm:pl-4 justify-center">
                <div className="hidden sm:block mb-1">
                  {renderStatusBadge(request.status)}
                </div>

                {isModerator && request.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(request.id, 'approved')}
                      className="w-full flex items-center justify-center px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full text-xs font-bold transition-colors border border-emerald-100"
                    >
                      <CheckCircle size={14} className="mr-1.5" /> Approve
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(request.id, 'rejected')}
                      className="w-full flex items-center justify-center px-3 py-2 bg-gray-50 text-church-slate hover:bg-gray-100 rounded-full text-xs font-bold transition-colors border border-gray-200"
                    >
                      <XCircle size={14} className="mr-1.5" /> Reject
                    </button>
                  </>
                )}

                {isModerator && request.status === 'approved' && (
                  <button 
                    onClick={() => handleUpdateStatus(request.id, 'answered')}
                    className="w-full flex items-center justify-center px-3 py-2 bg-violet-50 text-church-violet hover:bg-violet-100 rounded-full text-xs font-bold transition-colors border border-violet-100"
                  >
                    <Check size={14} className="mr-1.5" /> Mark Answered
                  </button>
                )}
                
                {isModerator && (request.status === 'rejected' || request.status === 'answered') && (
                  <button 
                    onClick={() => handleUpdateStatus(request.id, 'pending')}
                    className="w-full flex items-center justify-center px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-full text-xs font-bold transition-colors border border-amber-100"
                  >
                    Revert to Pending
                  </button>
                )}
              </div>
            </SoftCard>
          ))}
        </div>
      )}

      <PrayerRequestModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={editingRequest}
        churchId={churchId}
      />
    </div>
  );
}

