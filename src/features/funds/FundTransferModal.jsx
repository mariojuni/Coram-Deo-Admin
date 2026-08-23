import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { X, ArrowRightLeft } from 'lucide-react';
import ModernDropdown from '../../components/ui/ModernDropdown';

export default function FundTransferModal({ isOpen, onClose }) {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [sourceFundId, setSourceFundId] = useState('');
  const [destinationFundId, setDestinationFundId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen || !CHURCH_ID) return;

    const fetchFunds = async () => {
      try {
        const q = query(
          collection(db, 'givingFunds'),
          where('churchId', '==', CHURCH_ID),
          where('status', '==', 'active')
        );
        const querySnapshot = await getDocs(q);
        const fundsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort alphabetically
        fundsData.sort((a, b) => a.name.localeCompare(b.name));
        setFunds(fundsData);
      } catch (err) {
        console.error("Error fetching funds: ", err);
      }
    };

    fetchFunds();
  }, [isOpen, CHURCH_ID]);

  // Reset form on open/close
  useEffect(() => {
    if (isOpen) {
      setSourceFundId('');
      setDestinationFundId('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!sourceFundId || !destinationFundId) {
      setError('Please select both source and destination funds.');
      return;
    }

    if (sourceFundId === destinationFundId) {
      setError('Source and destination funds cannot be the same.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!date) {
      setError('Please select a date.');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'fundTransfers'), {
        churchId: CHURCH_ID,
        sourceFundId,
        destinationFundId,
        amount: numAmount,
        date,
        notes: notes.trim(),
        createdBy: userProfile.uid,
        createdAt: serverTimestamp()
      });

      setLoading(false);
      onClose();
    } catch (err) {
      console.error("Error creating transfer: ", err);
      setError('Failed to create transfer. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fundOptions = funds.map(f => ({ value: f.id, label: f.name }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-gray-100 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-church-green/10 flex items-center justify-center text-church-green mr-3">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-church-navy">Transfer Funds</h2>
              <p className="text-xs text-church-slate">Move money between active funds</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}

          <form id="transferForm" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-semibold text-church-navy mb-2">From Fund *</label>
                <ModernDropdown
                  options={fundOptions}
                  value={sourceFundId}
                  onChange={setSourceFundId}
                  placeholder="Select source fund"
                />
              </div>
              
              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white rounded-full p-2 shadow-sm border border-gray-100 text-church-slate">
                  <ArrowRightLeft size={16} className="transform rotate-90" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-church-navy mb-2">To Fund *</label>
                <ModernDropdown
                  options={fundOptions}
                  value={destinationFundId}
                  onChange={setDestinationFundId}
                  placeholder="Select destination fund"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-church-navy mb-2">Amount (PHP) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₱</span>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-church-green focus:border-church-green transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-church-navy mb-2">Date *</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-church-green focus:border-church-green transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-church-navy mb-2">Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-church-green focus:border-church-green transition-all resize-none"
                placeholder="Reason for transfer..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-3xl flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 text-church-slate hover:bg-gray-200 bg-gray-100 rounded-full text-sm font-bold transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="transferForm"
            className="px-6 py-2.5 bg-church-green text-white rounded-full text-sm font-bold hover:bg-church-green/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Execute Transfer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
