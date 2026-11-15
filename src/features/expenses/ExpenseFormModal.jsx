import React, { useState, useEffect } from 'react';
import { Upload, Receipt, DollarSign, Calendar, FileText, Building2 } from 'lucide-react';
import { collection, doc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import ModernDatePicker from '../../components/ui/ModernDatePicker';
import { useStorageQuota } from '../subscription/hooks/useStorageQuota';
import StorageQuotaModal from '../subscription/components/StorageQuotaModal';
import Modal from '../../components/ui/Modal';

export default function ExpenseFormModal({ isOpen, onClose, expense = null }) {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId ; 
  const storageQuota = useStorageQuota();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    payee: '',
    category: 'Utilities',
    description: '',
    fundId: '',
    fundType: '',
  });
  
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [funds, setFunds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [storageModalInfo, setStorageModalInfo] = useState({ fileSizeFormatted: null, targetTier: 'kingdom' });

  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date || new Date().toISOString().split('T')[0],
        amount: expense.amount || '',
        payee: expense.payee || '',
        category: expense.category || '',
        description: expense.description || '',
        fundId: expense.fundId || '',
        fundType: expense.fundType || '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        payee: '',
        category: 'Utilities',
        description: '',
        fundId: '',
        fundType: '',
      });
    }
    setReceiptFile(null);
    setUploadProgress(0);
    setError('');
  }, [expense, isOpen]);

  // Fetch available Giving Funds and Custom Expense Categories for dropdowns
  useEffect(() => {
    if (!isOpen || !CHURCH_ID) return;

    const fetchDropdownData = async () => {
      try {
        const { query, where, getDocs } = await import('firebase/firestore');
        
        // 1. Fetch active funds
        const qFunds = query(
          collection(db, 'givingFunds'),
          where('churchId', '==', CHURCH_ID),
          where('status', '==', 'active')
        );
        const snapFunds = await getDocs(qFunds);
        const fundsList = snapFunds.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(f => f.allowExpenses !== false)
          .sort((a, b) => a.name.localeCompare(b.name));
        setFunds(fundsList);

        // Auto-select first fund if not editing
        if (!expense && fundsList.length > 0) {
          setFormData(prev => ({
            ...prev,
            fundId: prev.fundId || fundsList[0].id,
            fundType: prev.fundType || fundsList[0].type || 'general'
          }));
        }

        // 2. Fetch custom active expense categories
        const qCats = query(
          collection(db, 'expenseCategories'),
          where('churchId', '==', CHURCH_ID),
          where('status', '==', 'active')
        );
        const snapCats = await getDocs(qCats);
        const customCats = snapCats.docs.map(d => d.data().name);

        const defaultCategories = [
          'Utilities', 'Ministry', 'Maintenance', 'Salaries & Honorarium',
          'Honorarium', 'Events', 'Mission & Outreach', 'Audio & Video', 'Office Supplies', 'Other'
        ];
        
        const mergedCategories = Array.from(new Set([...defaultCategories, ...customCats])).sort();
        setCategories(mergedCategories);

        if (!expense && !formData.category && mergedCategories.length > 0) {
          setFormData(prev => ({ ...prev, category: mergedCategories[0] }));
        }
      } catch (err) {
        console.error('Error fetching funds or categories for expense form:', err);
      }
    };

    fetchDropdownData();
  }, [isOpen, CHURCH_ID, expense]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFundChange = (fundId) => {
    const selected = funds.find(f => f.id === fundId);
    setFormData(prev => ({
      ...prev,
      fundId,
      fundType: selected ? (selected.type || 'general') : ''
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      
      // Proactive Pre-flight Storage Check
      const check = storageQuota.checkStorageUpload(file.size);
      if (!check.allowed) {
        setStorageModalInfo({
          fileSizeFormatted: check.fileSizeFormatted,
          targetTier: check.targetTier || 'kingdom'
        });
        setIsStorageModalOpen(true);
        e.target.value = null; // reset file input
        return;
      }
      
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!CHURCH_ID) {
      setError('Church ID is missing. Cannot save.');
      return;
    }

    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let receiptUrl = expense?.receiptUrl || '';

      // Upload receipt if selected
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `expense_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `receipts/${CHURCH_ID}/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, receiptFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (err) => reject(err),
            async () => {
              receiptUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const expensesColRef = collection(db, 'expenses');
      const docRef = expense ? doc(db, 'expenses', expense.id) : doc(expensesColRef);

      const finalFundId = formData.fundId || (funds.length > 0 ? funds[0].id : null);
      const matchedFund = funds.find(f => f.id === finalFundId);
      const finalFundType = formData.fundType || (matchedFund ? matchedFund.type : 'general');

      const expenseDoc = {
        ...formData,
        fundId: finalFundId,
        fundType: finalFundType,
        amount: parseFloat(formData.amount) || 0,
        receiptUrl,
        receiptSizeBytes: receiptFile ? receiptFile.size : (expense?.receiptSizeBytes || 0),
        updatedAt: serverTimestamp(),
        churchId: CHURCH_ID
      };

      if (!expense) {
        expenseDoc.createdAt = serverTimestamp();
      }

      await setDoc(docRef, expenseDoc, { merge: true });

      // Increment giving receipt storage metrics
      if (receiptFile && CHURCH_ID) {
        try {
          const churchRef = doc(db, 'churches', CHURCH_ID);
          await updateDoc(churchRef, {
            'stats.storage.totalBytesUsed': increment(receiptFile.size),
            'stats.storage.byCategory.givingReceiptsBytes': increment(receiptFile.size),
            'stats.storage.lastCalculatedAt': serverTimestamp()
          });
        } catch (sErr) {
          console.warn('Expense receipt storage metric increment deferred:', sErr);
        }
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={expense ? 'Edit Expense' : 'Log Expense'}
        subtitle="Record operational costs, disbursement receipts, and fund allocations"
        icon={Receipt}
        maxWidth="lg"
        footer={
          <>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="expense-form"
              disabled={loading}
              className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Saving...' : expense ? 'Save Changes' : 'Log Expense'}
            </button>
          </>
        }
      >
        <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}
          
          {/* Section 1: Financial & Date Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
                <DollarSign size={14} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Amount & Schedule
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Core transaction value and accounting date</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Amount (PHP) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm">₱</span>
                  <input 
                    type="number" 
                    step="0.01"
                    name="amount"
                    required
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-bold text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Disbursement Date <span className="text-rose-500">*</span>
                </label>
                <ModernDatePicker 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Allocation & Category */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
                <Building2 size={14} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Classification & Fund Source
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Designate which fund and budget category to deduct from</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
                <ModernDropdown
                  value={formData.category}
                  onChange={(val) => handleChange({ target: { name: 'category', value: val } })}
                  options={categories.map(c => ({ value: c, label: c }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Deduct from Fund *</label>
                <ModernDropdown
                  value={formData.fundId}
                  onChange={handleFundChange}
                  options={funds.map(f => ({ value: f.id, label: `${f.name} (${f.type || 'general'})` }))}
                  placeholder="Select source fund"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Payee / Vendor <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                name="payee"
                required
                value={formData.payee}
                onChange={handleChange}
                placeholder="e.g. Meralco, Office Depot, Pastor John"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Purpose</label>
              <textarea 
                name="description"
                rows="2"
                value={formData.description}
                onChange={handleChange}
                placeholder="What was this expense for?"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none" 
              />
            </div>
          </div>

          {/* Section 3: Receipt Attachment */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#DFECF5] text-[#2C4A60] border border-[#D5E3EC]/70 flex items-center justify-center shrink-0">
                <FileText size={14} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Receipt Attachment
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Digital audit trail and proof of disbursement</p>
              </div>
            </div>

            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200/80 border-dashed rounded-xl hover:bg-slate-50 transition-colors">
              <div className="space-y-1.5 text-center">
                <Upload className="mx-auto h-7 w-7 text-[#2C4A60]" />
                <div className="text-xs sm:text-sm text-slate-600">
                  <label htmlFor="receipt-upload" className="cursor-pointer font-bold text-[#2C4A60] hover:text-[#162533] focus-within:outline-none">
                    <span>{receiptFile ? receiptFile.name : 'Choose a file or click to browse'}</span>
                    <input id="receipt-upload" name="receipt-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">PNG, JPG, PDF up to 5MB</p>
              </div>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-[#2C4A60] h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      <StorageQuotaModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        fileSizeFormatted={storageModalInfo.fileSizeFormatted}
        targetTier={storageModalInfo.targetTier}
      />
    </>
  );
}
