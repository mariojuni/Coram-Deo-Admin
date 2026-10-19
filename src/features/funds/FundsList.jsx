import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Wallet, Edit, Archive, CheckCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import FundFormModal from './FundFormModal';
import { canManageFunds, canCreateFund, canEditFund, canArchiveFund } from '../../utils/financePermissions';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function FundsList() {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState(null);

  useEffect(() => {
    if (!CHURCH_ID) return;
    
    const q = query(
      collection(db, 'givingFunds'), 
      where('churchId', '==', CHURCH_ID)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      docs.sort((a, b) => {
        if (a.status === b.status) {
           return a.name.localeCompare(b.name);
        }
        if (a.status === 'active') return -1;
        if (b.status === 'active') return 1;
        if (a.status === 'inactive') return -1;
        return 1;
      });

      setFunds(docs);
      setLoading(false);
    }, (error) => {
      console.error("FundsList error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [CHURCH_ID]);

  const handleAddClick = () => {
    setEditingFund(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (fund) => {
    setEditingFund(fund);
    setIsModalOpen(true);
  };

  const handleArchiveClick = async (fund) => {
    if (window.confirm(`Are you sure you want to archive the ${fund.name} fund?`)) {
      try {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'givingFunds', fund.id), { status: 'archived' });
      } catch (error) {
        console.error("Error archiving fund: ", error);
        alert("Failed to archive fund.");
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active') return <StatusPill variant="emerald">Active</StatusPill>;
    if (status === 'inactive') return <StatusPill variant="amber">Inactive</StatusPill>;
    return <StatusPill variant="slate">Archived</StatusPill>;
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-church-rose tracking-wider uppercase bg-church-rose-light px-3 py-1 rounded-full border border-pink-100">
            MINISTRY FUNDS & ACCOUNTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight mt-2">
            Funds Management
          </h1>
          <p className="text-xs sm:text-sm text-church-slate mt-1">
            Manage designated church funds, budget accounts, and ministry allocations.
          </p>
        </div>
        {canCreateFund(userProfile) && (
          <div className="shrink-0">
            <GradientButton 
              onClick={handleAddClick}
              icon={Plus}
            >
              Create Fund
            </GradientButton>
          </div>
        )}
      </div>

      {/* Table Section */}
      <SoftCard className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-extrabold text-church-charcoal">
            Designated Funds ({funds.length})
          </h2>
        </div>
        
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm border-b border-gray-100">
              <tr className="text-[11px] font-bold text-church-charcoal uppercase tracking-wider">
                <th className="p-4 pl-6">Fund Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Allowed Usage</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-9 h-9 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
                      <p className="text-sm font-semibold text-church-slate">Loading funds...</p>
                    </div>
                  </td>
                </tr>
              ) : funds.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-4 mx-auto border border-rose-100/60 shadow-sm">
                      <Wallet size={30} />
                    </div>
                    <p className="text-church-charcoal font-black text-lg">No funds found</p>
                    <p className="text-church-slate text-sm mt-1">Create your first fund account to get started.</p>
                  </td>
                </tr>
              ) : (
                funds.map((fund) => {
                  return (
                    <tr key={fund.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-church-charcoal group-hover:text-church-rose transition-colors">
                            {fund.name}
                          </span>
                          {fund.description && (
                            <span className="text-xs text-church-muted mt-0.5 truncate max-w-sm">
                              {fund.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="capitalize text-xs font-semibold text-church-slate">
                          {fund.type?.replace('_', ' ') || 'General'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {getStatusBadge(fund.status)}
                      </td>
                      <td className="p-4 whitespace-nowrap text-xs">
                        <div className="flex items-center space-x-2">
                          {fund.allowGiving && (
                            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              <ArrowDownLeft size={12} className="mr-1" /> Giving
                            </span>
                          )}
                          {fund.allowExpenses && (
                            <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                              <ArrowUpRight size={12} className="mr-1" /> Expenses
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {canEditFund(userProfile) && (
                            <button 
                              onClick={() => handleEditClick(fund)}
                              className="text-church-slate hover:text-church-charcoal p-2 rounded-xl hover:bg-gray-100 transition-colors"
                              title="Edit Fund"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canArchiveFund(userProfile) && fund.status !== 'archived' && (
                            <button 
                              onClick={() => handleArchiveClick(fund)}
                              className="text-church-slate hover:text-amber-600 p-2 rounded-xl hover:bg-amber-50 transition-colors"
                              title="Archive Fund"
                            >
                              <Archive size={16} />
                            </button>
                          )}
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

      <FundFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        fund={editingFund}
      />
    </div>
  );
}
