import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { Building, Plus, MoreVertical, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import DonationAccountFormModal from './DonationAccountFormModal';

export default function DonationAccountsList() {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchAccounts = async () => {
    if (!CHURCH_ID) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'donationAccounts'),
        where('churchId', '==', CHURCH_ID)
      );
      const snap = await getDocs(q);
      const accountsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory by displayOrder, falling back to name
      accountsData.sort((a, b) => {
        const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 999;
        const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.bankName || '').localeCompare(b.bankName || '');
      });

      setAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching donation accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [CHURCH_ID]);

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleEditAccount = (account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const maskAccountNumber = (number) => {
    if (!number) return '';
    if (number.length <= 4) return number;
    return `Account ending in ${number.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-3xl shadow-church-soft border border-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-church-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-church-soft border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-church-navy">Donation Accounts</h1>
          <p className="text-gray-500 mt-1">
            Configure the bank accounts members can use when giving through the mobile app.
          </p>
        </div>
        <button
          onClick={handleAddAccount}
          className="flex items-center px-4 py-2.5 bg-church-green text-white rounded-full font-bold hover:bg-church-green/90 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Add Donation Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-church-soft border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-church-navy mb-2">No donation bank account has been configured yet.</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Add your church's official bank account so members can view the details from the mobile Giving feature.
          </p>
          <button
            onClick={handleAddAccount}
            className="px-6 py-2.5 bg-church-green text-white rounded-full font-bold hover:bg-church-green/90 transition-colors shadow-sm"
          >
            Add Donation Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Account Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 tracking-wider uppercase ml-2">Primary Account</h2>
            {accounts.filter(a => a.isPrimary).length === 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-300 text-center text-gray-500 text-sm">
                No primary account selected.
              </div>
            )}
            {accounts.filter(a => a.isPrimary).map(account => (
              <div key={account.id} className="bg-white rounded-3xl p-6 shadow-church-soft border-2 border-church-green relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-church-green/5 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-church-navy">{account.bankName}</h3>
                      <p className="text-church-slate font-medium">{account.accountName}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-church-green/10 text-church-green border border-church-green/20">
                      Primary
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded-xl border border-gray-100 inline-block">
                      {maskAccountNumber(account.accountNumber)}
                    </p>
                    {account.branchName && (
                      <p className="text-sm text-gray-500"><span className="font-medium">Branch:</span> {account.branchName}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        {account.isActive ? (
                          <CheckCircle2 size={16} className="text-church-green mr-1.5" />
                        ) : (
                          <XCircle size={16} className="text-gray-400 mr-1.5" />
                        )}
                        <span className={`text-sm font-medium ${account.isActive ? 'text-church-green' : 'text-gray-500'}`}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {account.qrImagePath && (
                        <div className="flex items-center text-sm font-medium text-blue-600">
                          <CheckCircle2 size={16} className="mr-1.5" />
                          Official QR Available
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditAccount(account)}
                      className="px-4 py-1.5 text-sm font-bold text-church-slate hover:text-church-navy hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Other Accounts Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 tracking-wider uppercase ml-2">Other Accounts</h2>
            {accounts.filter(a => !a.isPrimary).length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-300 text-center text-gray-500 text-sm">
                No other accounts configured.
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.filter(a => !a.isPrimary).map(account => (
                  <div key={account.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-church-navy">{account.bankName}</h4>
                        <p className="text-sm text-church-slate">{account.accountName}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mr-3 ${
                          account.isActive 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleEditAccount(account)}
                          className="p-1.5 text-gray-400 hover:text-church-navy hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded inline-block mb-2 border border-gray-100">
                      {maskAccountNumber(account.accountNumber)}
                    </p>
                    {account.qrImagePath && (
                      <p className="text-xs text-blue-600 font-medium flex items-center">
                        <CheckCircle2 size={12} className="mr-1" /> QR Available
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <DonationAccountFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            fetchAccounts();
          }}
          account={selectedAccount}
          accounts={accounts}
        />
      )}
    </div>
  );
}
