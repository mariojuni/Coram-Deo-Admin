import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { ArrowRightLeft, ArrowDown } from 'lucide-react';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernDatePicker from '../../components/ui/ModernDatePicker';
import Modal from '../../components/ui/Modal';

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
        createdBy: userProfile?.uid || null,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Funds"
      subtitle="Reallocate balances between active church designated funds"
      icon={ArrowRightLeft}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="transferForm"
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Transfer'}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      <form id="transferForm" onSubmit={handleSubmit} className="space-y-4">
        {/* Source & Destination Routing Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Source Fund (From) <span className="text-rose-500">*</span>
            </label>
            <ModernDropdown
              value={sourceFundId}
              onChange={(val) => setSourceFundId(val)}
              options={fundOptions}
              placeholder="Select source fund"
            />
          </div>

          <div className="flex justify-center -my-1">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-[#2C4A60] shadow-2xs">
              <ArrowDown size={14} strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Destination Fund (To) <span className="text-rose-500">*</span>
            </label>
            <ModernDropdown
              value={destinationFundId}
              onChange={(val) => setDestinationFundId(val)}
              options={fundOptions}
              placeholder="Select destination fund"
            />
          </div>
        </div>

        {/* Transfer Parameters Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Transfer Amount (PHP) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder-slate-400 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Effective Date <span className="text-rose-500">*</span>
              </label>
              <ModernDatePicker
                name="transferDate"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Audit Notes & Purpose (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              placeholder="Reason for transfer (e.g., Board resolution, ministry subsidy)..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
