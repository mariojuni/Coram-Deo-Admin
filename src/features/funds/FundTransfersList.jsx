import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Plus, ArrowRightLeft, Trash2 } from 'lucide-react';
import FundTransferModal from './FundTransferModal';
import { canManageFundTransfers } from '../../utils/financePermissions';

export default function FundTransfersList() {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  const [transfers, setTransfers] = useState([]);
  const [funds, setFunds] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!CHURCH_ID) return;
    
    // Fetch Funds to get names
    const qFunds = query(collection(db, 'givingFunds'), where('churchId', '==', CHURCH_ID));
    const unsubscribeFunds = onSnapshot(qFunds, (snapshot) => {
      const fundsMap = {};
      snapshot.docs.forEach(doc => {
        fundsMap[doc.id] = doc.data().name;
      });
      setFunds(fundsMap);
    });

    // Fetch Transfers
    const qTransfers = query(collection(db, 'fundTransfers'), where('churchId', '==', CHURCH_ID));
    const unsubscribeTransfers = onSnapshot(qTransfers, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date descending
      docs.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

      setTransfers(docs);
      setLoading(false);
    }, (error) => {
      console.error("TransfersList error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeFunds();
      unsubscribeTransfers();
    };
  }, [CHURCH_ID]);

  const handleDeleteClick = async (transfer) => {
    if (window.confirm(`Are you sure you want to delete this transfer of ${formatCurrency(transfer.amount)}?`)) {
      try {
        await deleteDoc(doc(db, 'fundTransfers', transfer.id));
      } catch (error) {
        console.error("Error deleting transfer: ", error);
        alert("Failed to delete transfer.");
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!canManageFundTransfers(userProfile)) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-church-navy mb-4">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to view fund transfers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-church-navy">Fund Transfers</h1>
          <p className="text-sm text-church-slate mt-1">Manage reallocation of funds within your church.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-5 py-2.5 bg-church-green text-white rounded-full shadow-md text-sm font-medium hover:bg-church-green/90 transition-opacity"
        >
          <Plus size={18} className="mr-2" />
          New Transfer
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-church-soft border border-gray-100 flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h2 className="text-lg font-bold text-church-navy">
            Transfer History
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-church-bg/50 text-church-slate text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold rounded-tl-3xl">Date</th>
                <th className="px-6 py-4 font-semibold">Source Fund</th>
                <th className="px-6 py-4 font-semibold">Destination Fund</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold">Notes</th>
                <th className="px-6 py-4 font-semibold rounded-tr-3xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-church-slate">
                    Loading transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-church-slate flex flex-col items-center">
                    <ArrowRightLeft size={32} className="mb-3 text-gray-300" />
                    <p>No transfers found. Create one to reallocate funds.</p>
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => {
                  return (
                  <tr key={transfer.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-church-slate">
                      {formatDate(transfer.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="font-medium text-red-600">{funds[transfer.sourceFundId] || 'Unknown Fund'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="font-medium text-green-600">{funds[transfer.destinationFundId] || 'Unknown Fund'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-church-navy">
                      {formatCurrency(transfer.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs text-church-slate max-w-xs truncate">
                      {transfer.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteClick(transfer)}
                          className="text-red-500 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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
      </div>

      <FundTransferModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
