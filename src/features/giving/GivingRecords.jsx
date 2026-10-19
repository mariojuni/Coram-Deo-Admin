import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Plus, CreditCard, Edit, Trash2, Search, ExternalLink, ArrowDownLeft, DollarSign } from 'lucide-react';
import GivingFormModal from './GivingFormModal';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import ModernDropdown from '../../components/ui/ModernDropdown';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

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

export default function GivingRecords() {
  const { userProfile, formatCurrency } = useAuth();
  const CHURCH_ID = userProfile?.churchId ;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [usersMap, setUsersMap] = useState({});
  const [fundsMap, setFundsMap] = useState({});
  const [fundsList, setFundsList] = useState([]);
  const [selectedFundId, setSelectedFundId] = useState('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Date Filter state
  const [dateFilter, setDateFilter] = useState({
    filterType: 'thisMonth',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (!CHURCH_ID) return;
    
    let constraints = [
      where('churchId', '==', CHURCH_ID)
    ];

    const q = query(collection(db, 'givingRecords'), ...constraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by date range in memory to avoid Firestore index requirements
      if (dateFilter.startDate) {
        docs = docs.filter(d => {
          const dDate = d.transactionDate || d.date || '';
          return dDate >= dateFilter.startDate;
        });
      }
      if (dateFilter.endDate) {
        docs = docs.filter(d => {
          const dDate = d.transactionDate || d.date || '';
          return dDate <= dateFilter.endDate;
        });
      }
      
      // Sort in memory (descending by date)
      docs.sort((a, b) => new Date(b.transactionDate || b.date || 0) - new Date(a.transactionDate || a.date || 0));
      setRecords(docs);
      setLoading(false);
    }, (error) => {
      console.error("GivingRecords error:", error);
      setLoading(false);
    });

    // Fetch Users to map names
    const fetchUsers = async () => {
      try {
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
        return unsubscribeUsers;
      } catch (err) {
        console.error("Error fetching users map:", err);
      }
    };
    
    // Fetch Funds to map names and filter
    const fetchFunds = async () => {
      try {
        const qFunds = query(collection(db, 'givingFunds'), where('churchId', '==', CHURCH_ID));
        const unsubscribeFunds = onSnapshot(qFunds, (snap) => {
          const map = {};
          const list = [];
          snap.forEach(d => {
            const data = d.data();
            map[d.id] = data.name;
            if (data.status === 'active' && data.allowGiving !== false) {
              list.push({ id: d.id, name: data.name });
            }
          });
          list.sort((a, b) => a.name.localeCompare(b.name));
          setFundsMap(map);
          setFundsList(list);
        });
        return unsubscribeFunds;
      } catch (err) {
        console.error("Error fetching funds:", err);
      }
    };

    let unsubscribeUsers;
    let unsubscribeFunds;
    fetchUsers().then(unsub => unsubscribeUsers = unsub);
    fetchFunds().then(unsub => unsubscribeFunds = unsub);

    return () => {
      unsubscribe();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeFunds) unsubscribeFunds();
    };
  }, [userProfile?.churchId, dateFilter.startDate, dateFilter.endDate]);

  const handleAddClick = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (record) => {
    if (window.confirm('Are you sure you want to delete this giving record? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'givingRecords', record.id));
        
        // If the record was tied to a campaign, decrement the raised amount
        if (record.campaignId && record.amount) {
          const { increment, updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'givingCampaigns', record.campaignId), {
            raisedAmount: increment(-record.amount)
          });
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete record.");
      }
    }
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


  // Filter records
  const ledgerRecords = records.filter(r => ['completed', 'approved'].includes(r.status));

  const filteredLedgerRecords = ledgerRecords.filter(r => {
    // Check fund filter first
    if (selectedFundId !== 'all' && r.fundId !== selectedFundId) {
       // if it doesn't match fundId, check if it matches legacy fundType (as string)
       const selectedFundName = fundsMap[selectedFundId] || '';
       if (r.fundType !== selectedFundName && r.fundId !== selectedFundId) {
          return false;
       }
    }

    const search = debouncedSearchTerm.toLowerCase();
    if (!search) return true;
    const donorMatch = (r.donorName || '').toLowerCase().includes(search);
    const fundMatch = (r.fundType || mapFundIdToName(r.fundId, r.fundType) || '').toLowerCase().includes(search);
    return donorMatch || fundMatch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateObj = new Date(dateStr + 'T00:00:00'); 
    return dateObj.toLocaleDateString(undefined, options);
  };

  const totalFilteredAmount = useMemo(() => filteredLedgerRecords.reduce((sum, r) => sum + (r.amount || 0), 0), [filteredLedgerRecords]);
  const averageGift = useMemo(() => filteredLedgerRecords.length > 0 ? Math.round(totalFilteredAmount / filteredLedgerRecords.length) : 0, [totalFilteredAmount, filteredLedgerRecords.length]);

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-church-rose tracking-wider uppercase bg-church-rose-light px-3 py-1 rounded-full border border-pink-100">
            TRANSACTION LEDGER
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight mt-2">
            Giving Ledger
          </h1>
          <p className="text-xs sm:text-sm text-church-slate mt-1">
            Manage tithes, offerings, pledges, and digital donations.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <GradientButton 
            onClick={handleAddClick}
            icon={Plus}
          >
            Add Record
          </GradientButton>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SoftCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-church-slate uppercase tracking-wider">Filtered Inflow</p>
            <p className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(totalFilteredAmount)}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <ArrowDownLeft size={20} />
          </div>
        </SoftCard>

        <SoftCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-church-slate uppercase tracking-wider">Total Gifts</p>
            <p className="text-xl font-black text-church-charcoal mt-1">{filteredLedgerRecords.length} contributions</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-church-violet border border-purple-100 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </SoftCard>

        <SoftCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-church-slate uppercase tracking-wider">Average Contribution</p>
            <p className="text-xl font-black text-church-charcoal mt-1">{formatCurrency(averageGift)}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </SoftCard>
      </div>

      {/* Date Filter & Search Row */}
      <SoftCard className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <DateRangeFilter onChange={setDateFilter} defaultFilter="thisMonth" />
            <ModernDropdown 
              value={selectedFundId} 
              onChange={(val) => setSelectedFundId(val)}
              options={[
                { value: 'all', label: 'All Funds' },
                ...fundsList.map(f => ({ value: f.id, label: f.name }))
              ]}
              className="w-full sm:w-52"
            />
          </div>
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search donor or fund..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-church-rose/20 focus:border-church-rose text-xs sm:text-sm transition-all bg-gray-50/50"
            />
          </div>
        </div>
      </SoftCard>

      {/* Table Section */}
      <SoftCard className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-extrabold text-church-charcoal">
            Transactions ({filteredLedgerRecords.length})
          </h2>
          <span className="text-xs text-church-slate font-medium">
            Showing verified contributions
          </span>
        </div>
        
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm border-b border-gray-100">
              <tr className="text-[11px] font-bold text-church-charcoal uppercase tracking-wider">
                <th className="p-4 pl-6">Date</th>
                <th className="p-4">Donor Name</th>
                <th className="p-4">Fund Type</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-9 h-9 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
                      <p className="text-sm font-semibold text-church-slate">Loading records...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLedgerRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-4 mx-auto border border-rose-100/60 shadow-sm">
                      <CreditCard size={30} />
                    </div>
                    <p className="text-church-charcoal font-black text-lg">No transactions found</p>
                    <p className="text-church-slate text-sm mt-1">Try expanding your date filter or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredLedgerRecords.map((record) => {
                  const date = record.transactionDate || record.date || (record.submittedAt ? new Date(record.submittedAt.seconds * 1000).toISOString().split('T')[0] : '');
                  const donorName = usersMap[record.userId] || record.donorName || 'Anonymous';
                  const fundType = mapFundIdToName(record.fundId, record.fundType);
                  const method = normalizeMethod(record.method || record.paymentMethod || 'Cash');
                  const proofUrl = record.proofUrl || record.proofOfPaymentUrl || '';

                  return (
                    <tr key={record.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="p-4 pl-6 whitespace-nowrap text-xs font-semibold text-church-slate">
                        {formatDate(date)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-50 to-violet-50 text-church-charcoal border border-rose-100/60 flex items-center justify-center font-black text-sm uppercase shrink-0">
                            {donorName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-church-charcoal group-hover:text-church-rose transition-colors">
                              {donorName}
                            </p>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              {record.giverEntityType === 'household' ? (
                                <StatusPill variant="violet" className="text-[10px] py-0 px-2">
                                  Household
                                </StatusPill>
                              ) : (
                                <span className="text-[11px] text-church-muted font-medium">
                                  {record.userId ? 'Registered Member' : 'Guest Donor'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <StatusPill variant="violet">
                          {fundType}
                        </StatusPill>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center text-xs font-semibold text-church-slate bg-gray-100 px-2.5 py-1 rounded-full">
                          {method}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap font-black text-base text-emerald-600">
                        +{formatCurrency(record.amount)}
                      </td>
                      <td className="p-4 pr-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {proofUrl && (
                            <a 
                              href={proofUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-church-slate hover:text-church-rose p-2 rounded-xl hover:bg-rose-50 transition-colors"
                              title="View Proof of Payment"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <button 
                            onClick={() => handleEditClick(record)}
                            className="text-church-slate hover:text-church-charcoal p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(record)}
                            className="text-church-slate hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
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

      <GivingFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingRecord={editingRecord}
      />
    </div>
  );
}
