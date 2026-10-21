import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ArrowUpRight, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  Check, 
  X, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  QrCode, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Upload, 
  Image as ImageIcon
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import SoftCard from '../../../components/ui/SoftCard';
import GradientButton from '../../../components/ui/GradientButton';
import { 
  subscribeToAllSubmissions, 
  subscribeToPlatformLedger, 
  subscribeToPlatformBankAccounts,
  approvePaymentAndRecordLedger,
  rejectPaymentSubmission,
  savePlatformBankAccount,
  deletePlatformBankAccount,
  ensureDefaultPlatformBankAccounts,
  uploadPlatformQrCode
} from '../../../services/billingLedgerService';
import { calculateRolloverCredit } from '../../../services/subscriptionService';
import SuperAdminSubscriptionModal from '../SuperAdminSubscriptionModal';
import { generateSubscriptionReceiptPdf } from '../../../utils/subscriptionReceiptPdfGenerator';

export default function PlatformLedgerHub() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'ledger' | 'banks'
  
  // Real-time state
  const [submissions, setSubmissions] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters for Ledger
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [bankFilter, setBankFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  // Inspection / Review Modal State
  const [inspectingSub, setInspectingSub] = useState(null);
  const [inspectingChurchData, setInspectingChurchData] = useState(null);
  const [rolloverInfo, setRolloverInfo] = useState(null);
  const [reviewMode, setReviewMode] = useState(null); // 'approve' | 'reject' | null
  const [clearedAmount, setClearedAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Amount does not match bank deposit statement.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ text: '', type: '' });

  // Direct Church Subscription Modal State
  const [selectedChurchForModal, setSelectedChurchForModal] = useState(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Bank Account Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    instructions: '',
    type: 'bank',
    qrCodeUrl: '',
    isActive: true,
    displayOrder: 1
  });
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [qrUploadProgress, setQrUploadProgress] = useState(null);
  const [viewingAccountQr, setViewingAccountQr] = useState(null);
  const [showManualQrUrl, setShowManualQrUrl] = useState(false);

  // Listeners
  useEffect(() => {
    const unsubSubs = subscribeToAllSubmissions((list) => {
      setSubmissions(list);
      setLoading(false);
    });

    const unsubLedger = subscribeToPlatformLedger((list) => {
      setLedgerEntries(list);
    });

    const unsubBanks = subscribeToPlatformBankAccounts((list) => {
      setBankAccounts(list);
    });

    return () => {
      unsubSubs();
      unsubLedger();
      unsubBanks();
    };
  }, []);

  // Compute Pending Queue
  const pendingSubmissions = useMemo(() => {
    return submissions.filter(s => s.status === 'pending_review');
  }, [submissions]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const totalVolume = ledgerEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const pendingSum = pendingSubmissions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    // This month's volume
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const thisMonthVolume = ledgerEntries
      .filter(item => (item.postedAt?.toDate ? item.postedAt.toDate().toISOString() : item.postedAt || '').startsWith(currentMonth))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const verifiedCount = submissions.filter(s => s.status === 'verified_paid').length;

    return {
      totalVolume,
      pendingCount: pendingSubmissions.length,
      pendingSum,
      thisMonthVolume,
      verifiedCount
    };
  }, [ledgerEntries, pendingSubmissions, submissions]);

  // Filtered Ledger Entries
  const filteredLedger = useMemo(() => {
    return ledgerEntries.filter(entry => {
      const q = ledgerSearch.toLowerCase();
      const matchSearch = !ledgerSearch || 
        (entry.churchName || '').toLowerCase().includes(q) ||
        (entry.ledgerNumber || '').toLowerCase().includes(q) ||
        (entry.referenceCode || '').toLowerCase().includes(q) ||
        (entry.bankReferenceNumber || '').toLowerCase().includes(q) ||
        (entry.invoiceNumber || '').toLowerCase().includes(q);

      const matchBank = bankFilter === 'all' || 
        (entry.receivingBankName || '').toLowerCase().includes(bankFilter.toLowerCase()) ||
        (entry.receivingBankId || '').toLowerCase() === bankFilter.toLowerCase();

      const matchTier = tierFilter === 'all' || (entry.tier || '').toLowerCase() === tierFilter.toLowerCase();

      return matchSearch && matchBank && matchTier;
    });
  }, [ledgerEntries, ledgerSearch, bankFilter, tierFilter]);

  // Handle Review Actions & Church Subscription Mission Control
  const handleOpenInspect = async (sub) => {
    setInspectingSub(sub);
    setReviewMode(null);
    setClearedAmount(sub.amount ? sub.amount.toString() : '');
    setAdminNotes('');
    setRejectionReason('Amount does not match bank deposit record.');
    setInspectingChurchData(null);
    setRolloverInfo(null);

    if (sub.churchId) {
      try {
        const cSnap = await getDoc(doc(db, 'churches', sub.churchId));
        if (cSnap.exists()) {
          const cData = { id: cSnap.id, ...cSnap.data() };
          setInspectingChurchData(cData);
          if (cData.subscription) {
            const roll = calculateRolloverCredit(cData.subscription, sub.tier);
            setRolloverInfo(roll);
          }
        }
      } catch (err) {
        console.warn('Could not fetch church data for inspecting sub:', err);
      }
    }
  };

  const handleOpenChurchSubscriptionModal = async (churchId) => {
    if (!churchId) return;
    try {
      const cSnap = await getDoc(doc(db, 'churches', churchId));
      if (cSnap.exists()) {
        setSelectedChurchForModal({ id: cSnap.id, ...cSnap.data() });
        setIsSubModalOpen(true);
      } else {
        alert('Church workspace document not found.');
      }
    } catch (err) {
      console.error('Error fetching church:', err);
      alert('Failed to load church data.');
    }
  };

  const handleApprove = async () => {
    if (!inspectingSub) return;
    setIsProcessing(true);
    setActionFeedback({ text: '', type: '' });

    try {
      await approvePaymentAndRecordLedger(inspectingSub.id, {
        clearedAmount: Number(clearedAmount),
        notes: adminNotes.trim(),
        reviewedByUserId: currentUser?.uid,
        reviewedByEmail: currentUser?.email
      });

      setActionFeedback({
        text: `Payment for ${inspectingSub.churchName} approved! Subscription extended and credit ledger entry posted.`,
        type: 'success'
      });
      setInspectingSub(null);
    } catch (err) {
      console.error('Approval error:', err);
      setActionFeedback({ text: err.message || 'Failed to approve payment.', type: 'error' });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActionFeedback({ text: '', type: '' }), 6000);
    }
  };

  const handleReject = async () => {
    if (!inspectingSub) return;
    setIsProcessing(true);
    setActionFeedback({ text: '', type: '' });

    try {
      await rejectPaymentSubmission(inspectingSub.id, {
        rejectionReason: rejectionReason.trim(),
        notes: adminNotes.trim(),
        reviewedByUserId: currentUser?.uid,
        reviewedByEmail: currentUser?.email
      });

      setActionFeedback({
        text: `Submission for ${inspectingSub.churchName} marked as rejected. Tenant has been notified to re-upload.`,
        type: 'success'
      });
      setInspectingSub(null);
    } catch (err) {
      console.error('Rejection error:', err);
      setActionFeedback({ text: err.message || 'Failed to reject submission.', type: 'error' });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActionFeedback({ text: '', type: '' }), 6000);
    }
  };

  // Quick Toggle Bank Account Active/Disabled
  const handleToggleAccountActive = async (acc) => {
    try {
      const nextStatus = acc.isActive === false;
      await savePlatformBankAccount({
        id: acc.id,
        isActive: nextStatus
      });
      setActionFeedback({
        text: `"${acc.bankName}" is now ${nextStatus ? 'Active' : 'Disabled'}.`,
        type: 'success'
      });
      setTimeout(() => setActionFeedback({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to toggle account status');
    }
  };

  // Delete Bank Account with confirmation
  const handleDeleteAccount = async (acc) => {
    if (!acc?.id) return;
    const confirmMsg = `Are you sure you want to delete "${acc.bankName} (${acc.accountNumber})"?\n\nChurches will no longer see this receiving account for manual payments.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deletePlatformBankAccount(acc.id);
      setIsBankModalOpen(false);
      setEditingBank(null);
      setActionFeedback({
        text: `Bank account "${acc.bankName}" deleted successfully.`,
        type: 'success'
      });
      setTimeout(() => setActionFeedback({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete bank account');
    }
  };

  // Direct QR Code File Upload
  const handleQrFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('QR Code image must be smaller than 5MB.');
      return;
    }

    try {
      setIsUploadingQr(true);
      setQrUploadProgress(0);
      const { downloadUrl } = await uploadPlatformQrCode(file, (progress) => {
        setQrUploadProgress(progress);
      });
      setBankForm(prev => ({ ...prev, qrCodeUrl: downloadUrl }));
      setActionFeedback({
        text: 'QR code uploaded directly to storage!',
        type: 'success'
      });
      setTimeout(() => setActionFeedback({ text: '', type: '' }), 4000);
    } catch (err) {
      console.error('Failed to upload QR code:', err);
      alert(err.message || 'Failed to upload QR code image.');
    } finally {
      setIsUploadingQr(false);
      setQrUploadProgress(null);
    }
  };

  // CSV Export for Accountants
  const exportLedgerToCsv = () => {
    if (ledgerEntries.length === 0) return;
    const headers = [
      'Ledger ID',
      'Posted Date',
      'Church Name',
      'Plan Tier',
      'Billing Period',
      'Receiving Bank',
      'Bank Trace Ref #',
      'Amount (PHP)',
      'Invoice #',
      'Verified By',
      'Admin Notes'
    ];

    const rows = filteredLedger.map(e => [
      `"${e.ledgerNumber || e.id}"`,
      `"${formatDate(e.postedAt)}"`,
      `"${(e.churchName || '').replace(/"/g, '""')}"`,
      `"${e.tier || ''}"`,
      `"${e.billingPeriod || ''}"`,
      `"${(e.receivingBankName || '').replace(/"/g, '""')}"`,
      `"${e.bankReferenceNumber || ''}"`,
      e.amount || 0,
      `"${e.invoiceNumber || ''}"`,
      `"${e.postedByEmail || ''}"`,
      `"${(e.adminNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CoramDeo_Billing_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      const date = val?.toDate ? val.toDate() : new Date(val);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-church-rose bg-pink-100 px-2.5 py-0.5 rounded-full">
              Super Admin Financial Center
            </span>
            <span className="text-xs text-church-slate font-medium">• Multi-Tenant Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-church-navy tracking-tight mt-1">
            Subscription Payments & Financial Ledger
          </h1>
          <p className="text-xs text-church-slate">
            Monitor incoming bank deposits, reconcile tenant receipts, and track audit-grade platform revenue
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'ledger' && (
            <button
              type="button"
              onClick={exportLedgerToCsv}
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-church-charcoal hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download size={14} className="text-church-slate" />
              <span>Export CSV</span>
            </button>
          )}

          {activeTab === 'banks' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Restore standard Philippine default accounts (BDO, BPI, GCash)? This ensures baseline receiving accounts exist.')) {
                    try {
                      await ensureDefaultPlatformBankAccounts(true);
                      setActionFeedback({ text: 'Default bank accounts restored.', type: 'success' });
                      setTimeout(() => setActionFeedback({ text: '', type: '' }), 4000);
                    } catch (err) {
                      alert(err.message || 'Failed to restore defaults');
                    }
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-church-charcoal hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <RefreshCw size={13} className="text-church-slate" />
                <span>Restore Defaults</span>
              </button>

              <GradientButton
                size="sm"
                onClick={() => {
                  setEditingBank(null);
                  setShowManualQrUrl(false);
                  setBankForm({
                    bankName: '',
                    accountName: 'Coram Deo Technologies Corp.',
                    accountNumber: '',
                    branch: '',
                    instructions: '',
                    type: 'bank',
                    qrCodeUrl: '',
                    isActive: true,
                    displayOrder: bankAccounts.length + 1
                  });
                  setIsBankModalOpen(true);
                }}
                className="flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Bank Account</span>
              </GradientButton>
            </div>
          )}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback.text && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
          actionFeedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{actionFeedback.text}</span>
          <button onClick={() => setActionFeedback({ text: '', type: '' })} className="text-xs font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <SoftCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-church-slate uppercase tracking-wider block mb-1">
              Total Verified Revenue
            </span>
            <div className="text-2xl font-black text-church-navy">
              ₱{metrics.totalVolume.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <ShieldCheck size={12} />
              <span>{metrics.verifiedCount} cleared transactions</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <DollarSign size={20} />
          </div>
        </SoftCard>

        {/* Pending Verification */}
        <SoftCard className={`p-5 flex items-center justify-between border-2 ${
          metrics.pendingCount > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-transparent'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-church-slate uppercase tracking-wider block mb-1">
              Pending Verification
            </span>
            <div className="text-2xl font-black text-church-navy">
              {metrics.pendingCount} <span className="text-xs font-bold text-amber-700 font-mono">(₱{metrics.pendingSum.toLocaleString()})</span>
            </div>
            <span className="text-[11px] text-church-slate font-medium block mt-1">
              Requires Super Admin audit
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
            <Clock size={20} />
          </div>
        </SoftCard>

        {/* This Month's Inflow */}
        <SoftCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-church-slate uppercase tracking-wider block mb-1">
              This Month's Inflow
            </span>
            <div className="text-2xl font-black text-church-navy">
              ₱{metrics.thisMonthVolume.toLocaleString()}
            </div>
            <span className="text-[11px] text-church-slate font-medium block mt-1">
              Current calendar cycle
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <TrendingUp size={20} />
          </div>
        </SoftCard>

        {/* Receiving Bank Accounts */}
        <SoftCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-church-slate uppercase tracking-wider block mb-1">
              Configured Bank Accounts
            </span>
            <div className="text-2xl font-black text-church-navy">
              {bankAccounts.filter(b => b.isActive !== false).length} Active
            </div>
            <span className="text-[11px] text-church-slate font-medium block mt-1">
              BDO, BPI, GCash channels
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <Building2 size={20} />
          </div>
        </SoftCard>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-church-rose text-church-rose font-black'
              : 'border-transparent text-church-slate hover:text-church-navy'
          }`}
        >
          <span>Pending Verifications</span>
          {metrics.pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {metrics.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'border-church-rose text-church-rose font-black'
              : 'border-transparent text-church-slate hover:text-church-navy'
          }`}
        >
          <span>Financial Ledger Journal</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-church-slate">
            {ledgerEntries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banks')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'banks'
              ? 'border-church-rose text-church-rose font-black'
              : 'border-transparent text-church-slate hover:text-church-navy'
          }`}
        >
          <span>Receiving Bank Accounts</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-church-slate">
            {bankAccounts.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENDING VERIFICATION QUEUE */}
      {activeTab === 'pending' && (
        <SoftCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-church-navy">Pending Tenant Payment Receipts</h2>
              <p className="text-xs text-church-slate">
                Match tenant-uploaded receipts with online bank balance before clearing subscription access
              </p>
            </div>
            <span className="text-xs font-bold text-church-slate">
              {pendingSubmissions.length} submission(s) awaiting review
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-church-charcoal">
              <thead>
                <tr className="border-b border-gray-100 text-church-slate text-[11px] font-bold uppercase tracking-wider">
                  <th className="pb-3">Ref Code</th>
                  <th className="pb-3">Church Workspace</th>
                  <th className="pb-3">Plan & Cycle</th>
                  <th className="pb-3">Receiving Channel</th>
                  <th className="pb-3">Bank Ref #</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Date Transferred</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {pendingSubmissions.length > 0 ? (
                  pendingSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 font-mono text-[11px] font-bold text-church-navy">
                        {sub.referenceCode || sub.id}
                      </td>
                      <td className="py-3.5">
                        <button
                          type="button"
                          onClick={() => handleOpenChurchSubscriptionModal(sub.churchId)}
                          className="text-left font-bold text-church-navy hover:text-church-rose hover:underline text-xs block"
                          title="Open SuperAdmin Mission Control for this church"
                        >
                          {sub.churchName}
                        </button>
                        <span className="text-[10px] text-church-muted font-mono">{sub.churchId}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="font-extrabold text-church-charcoal uppercase tracking-wider text-[11px] block">
                          {sub.tier}
                        </span>
                        <span className="text-[10px] text-church-slate capitalize">{sub.billingCycle}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-church-navy block">{sub.receivingBankName}</span>
                        {sub.senderAccountName && (
                          <span className="text-[10px] text-church-slate">From: {sub.senderAccountName}</span>
                        )}
                      </td>
                      <td className="py-3.5 font-mono text-church-charcoal">
                        {sub.bankReferenceNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 font-black text-church-navy text-sm">
                        ₱{(sub.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 text-church-slate">
                        {formatDate(sub.dateTransferred || sub.createdAt)}
                      </td>
                      <td className="py-3.5 text-right">
                        <GradientButton
                          size="sm"
                          onClick={() => handleOpenInspect(sub)}
                          className="inline-flex items-center gap-1 text-[11px]"
                        >
                          <Eye size={13} />
                          <span>Inspect & Verify</span>
                        </GradientButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-church-slate">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                        <span className="font-bold text-sm text-church-navy">All Caught Up!</span>
                        <span className="text-xs text-church-slate mt-0.5">
                          There are currently no manual payment receipts waiting for verification.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SoftCard>
      )}

      {/* TAB 2: FINANCIAL LEDGER JOURNAL */}
      {activeTab === 'ledger' && (
        <SoftCard className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-church-navy">Platform Financial Ledger</h2>
              <p className="text-xs text-church-slate">
                Immutable, double-entry audit log of all manual and automated tenant payments
              </p>
            </div>

            {/* Filters Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-church-muted" />
                <input
                  type="text"
                  placeholder="Search church, ledger #, ref..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-church-rose"
                />
              </div>

              <select
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-medium"
              >
                <option value="all">All Banks</option>
                <option value="bdo">BDO</option>
                <option value="bpi">BPI</option>
                <option value="gcash">GCash</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-medium"
              >
                <option value="all">All Tiers</option>
                <option value="growth">Growth</option>
                <option value="kingdom">Kingdom</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-church-charcoal">
              <thead>
                <tr className="border-b border-gray-100 text-church-slate text-[11px] font-bold uppercase tracking-wider">
                  <th className="pb-3">Ledger ID & Date</th>
                  <th className="pb-3">Church Workspace</th>
                  <th className="pb-3">Plan & Period</th>
                  <th className="pb-3">Receiving Channel & Trace #</th>
                  <th className="pb-3">Amount (PHP)</th>
                  <th className="pb-3">Invoice Generated</th>
                  <th className="pb-3">Auditor</th>
                  <th className="pb-3 text-right">Receipt Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {filteredLedger.length > 0 ? (
                  filteredLedger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5">
                        <span className="font-mono font-bold text-church-navy block text-[11px]">
                          {entry.ledgerNumber || entry.id}
                        </span>
                        <span className="text-[10px] text-church-muted">{formatDate(entry.postedAt)}</span>
                      </td>
                      <td className="py-3.5">
                        <button
                          type="button"
                          onClick={() => handleOpenChurchSubscriptionModal(entry.churchId)}
                          className="text-left font-bold text-church-navy hover:text-church-rose hover:underline text-xs block"
                          title="Open SuperAdmin Mission Control for this church"
                        >
                          {entry.churchName}
                        </button>
                        <span className="text-[10px] text-church-muted font-mono">{entry.referenceCode}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-church-charcoal capitalize block">{entry.tier} Tier</span>
                        <span className="text-[10px] text-church-slate">{entry.billingPeriod || entry.billingCycle}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-church-navy block">{entry.receivingBankName}</span>
                        <span className="text-[10px] font-mono text-church-slate">Ref: {entry.bankReferenceNumber || 'N/A'}</span>
                      </td>
                      <td className="py-3.5 font-black text-emerald-700 text-sm">
                        +₱{(entry.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 font-mono text-[11px] text-church-slate">
                        {entry.invoiceNumber || 'INV-Generated'}
                      </td>
                      <td className="py-3.5 text-[11px] text-church-slate truncate max-w-[120px]" title={entry.postedByEmail}>
                        {entry.postedByEmail || 'SuperAdmin'}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const pStart = entry.billingPeriod?.includes(' to ') 
                                ? entry.billingPeriod.split(' to ')[0] 
                                : new Date().toISOString();
                              const pEnd = entry.billingPeriod?.includes(' to ') 
                                ? entry.billingPeriod.split(' to ')[1] 
                                : new Date().toISOString();

                              generateSubscriptionReceiptPdf({
                                church: { id: entry.churchId, name: entry.churchName },
                                invoice: {
                                  invoiceNumber: entry.invoiceNumber || 'INV-000000',
                                  description: `${(entry.tier || 'growth').toUpperCase()} Subscription Plan (${entry.billingCycle || 'monthly'})`,
                                  amount: entry.amount || 0,
                                  periodStart: pStart,
                                  periodEnd: pEnd,
                                  paidAt: entry.postedAt?.toDate ? entry.postedAt.toDate().toISOString() : entry.postedAt
                                }
                              });
                            }}
                            className="inline-flex items-center gap-1 text-church-slate hover:text-church-navy font-bold text-xs"
                            title="Download Official Tax Invoice PDF"
                          >
                            <Download size={12} />
                            <span>PDF</span>
                          </button>

                          {entry.receiptUrl ? (
                            <button
                              type="button"
                              onClick={() => window.open(entry.receiptUrl, '_blank')}
                              className="inline-flex items-center gap-1 text-church-rose hover:text-church-ruby font-bold text-xs"
                            >
                              <Eye size={12} />
                              <span>Proof</span>
                            </button>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-church-slate">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={32} className="text-gray-300 mb-2" />
                        <span className="font-bold text-sm text-church-navy">No Ledger Entries Found</span>
                        <span className="text-xs text-church-slate mt-0.5">
                          Verified tenant bank payments will be permanently posted to this financial journal.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SoftCard>
      )}

      {/* TAB 3: RECEIVING BANK ACCOUNTS CONFIG */}
      {activeTab === 'banks' && (
        <SoftCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-church-navy">Company Receiving Accounts Master</h2>
              <p className="text-xs text-church-slate">
                These bank and e-wallet accounts are displayed to churches when they choose manual payment
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.length === 0 && (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <CreditCard size={36} className="mx-auto text-church-muted mb-2 opacity-50" />
                <h3 className="font-bold text-church-navy text-sm">No Bank Accounts Configured</h3>
                <p className="text-xs text-church-slate mt-1 max-w-sm mx-auto">
                  You haven't configured any receiving bank or e-wallet accounts yet.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await ensureDefaultPlatformBankAccounts(true);
                    setActionFeedback({ text: 'Default Philippine accounts seeded successfully.', type: 'success' });
                    setTimeout(() => setActionFeedback({ text: '', type: '' }), 4000);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-church-rose text-white text-xs font-bold hover:bg-rose-600 transition-colors"
                >
                  Seed Default Philippine Accounts
                </button>
              </div>
            )}

            {bankAccounts.map((acc) => (
              <div 
                key={acc.id}
                className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${acc.isActive !== false ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className="font-extrabold text-sm text-church-navy">{acc.bankName}</span>
                    </div>

                    {/* Quick Active / Disabled Toggle */}
                    <button
                      type="button"
                      title={acc.isActive !== false ? "Click to disable account" : "Click to activate account"}
                      onClick={() => handleToggleAccountActive(acc)}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all border ${
                        acc.isActive !== false 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {acc.isActive !== false ? (
                        <>
                          <ToggleRight size={15} className="text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={15} className="text-gray-400" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-church-slate space-y-1 mb-3">
                    <div>Account Name: <strong className="text-church-charcoal">{acc.accountName}</strong></div>
                    <div className="font-mono text-sm font-black text-church-navy">{acc.accountNumber}</div>
                    {acc.branch && <div className="text-[11px] text-church-muted">Branch: {acc.branch}</div>}

                    {/* QR Code Indicator */}
                    {acc.qrCodeUrl ? (
                      <div className="pt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingAccountQr({ url: acc.qrCodeUrl, title: `${acc.bankName} QR Code` })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-2xs"
                        >
                          <QrCode size={13} className="text-purple-600" />
                          <span>View QR Code</span>
                        </button>
                        <span className="text-[10px] text-purple-700 font-semibold">Active for tenants</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-church-muted italic pt-1">
                        No QR Code attached
                      </div>
                    )}
                  </div>

                  {acc.instructions && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl">
                      💡 {acc.instructions}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-church-muted">Order: {acc.displayOrder || 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      title="Delete Account"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBank(acc);
                        setShowManualQrUrl(false);
                        setBankForm({
                          bankName: acc.bankName || '',
                          accountName: acc.accountName || '',
                          accountNumber: acc.accountNumber || '',
                          branch: acc.branch || '',
                          instructions: acc.instructions || '',
                          type: acc.type || 'bank',
                          qrCodeUrl: acc.qrCodeUrl || '',
                          isActive: acc.isActive !== false,
                          displayOrder: acc.displayOrder || 1
                        });
                        setIsBankModalOpen(true);
                      }}
                      className="text-xs font-bold text-church-navy hover:text-church-rose bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SoftCard>
      )}

      {/* INSPECTION & VERIFICATION MODAL */}
      {inspectingSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-church-canvas">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-church-rose/10 text-church-rose flex items-center justify-center font-bold">
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-church-navy leading-tight">
                    Verify Manual Payment: {inspectingSub.churchName}
                  </h3>
                  <span className="text-xs text-church-slate font-mono">
                    Ref Code: {inspectingSub.referenceCode} • Bank Ref: {inspectingSub.bankReferenceNumber || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenChurchSubscriptionModal(inspectingSub.churchId)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-purple-200 shadow-xs"
                  title="Open SuperAdmin Mission Control for this church"
                >
                  <ShieldCheck size={13} />
                  <span>Mission Control</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingSub(null)}
                  className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Side-by-side Inspection Body */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: High-Res Receipt Image (6 cols) */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="text-xs font-bold text-church-navy mb-2 flex items-center justify-between">
                  <span>Uploaded Payment Proof</span>
                  {inspectingSub.receiptUrl && (
                    <a
                      href={inspectingSub.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-church-rose hover:underline flex items-center gap-1 font-bold text-[11px]"
                    >
                      <span>Open Full Size</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden p-2 flex items-center justify-center border border-gray-800 min-h-[360px] max-h-[500px]">
                  {inspectingSub.receiptUrl ? (
                    <img
                      src={inspectingSub.receiptUrl}
                      alt="Uploaded Deposit Receipt"
                      className="max-h-[460px] max-w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs">No receipt image attached</div>
                  )}
                </div>
              </div>

              {/* Right Column: Submission Details & Action Form (6 cols) */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-church-slate">Target Tier:</span>
                      <strong className="text-church-navy uppercase font-black">{inspectingSub.tier} Plan</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-church-slate">Billing Cycle:</span>
                      <strong className="text-church-charcoal capitalize">{inspectingSub.billingCycle || 'monthly'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-church-slate">Declared Amount:</span>
                      <strong className="text-church-rose font-black text-sm">₱{Number(inspectingSub.amount).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-church-slate">Receiving Account:</span>
                      <span className="font-bold text-church-navy">{inspectingSub.receivingBankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-church-slate">Bank / Trace Ref #:</span>
                      <span className="font-mono font-bold text-church-navy">{inspectingSub.bankReferenceNumber || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-church-slate">Sender Name:</span>
                      <span className="font-medium text-church-charcoal">{inspectingSub.senderAccountName || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-church-slate">Date Transferred:</span>
                      <span className="font-medium text-church-charcoal">{formatDate(inspectingSub.dateTransferred)}</span>
                    </div>
                    {inspectingSub.tenantNotes && (
                      <div className="pt-2 border-t border-gray-200 text-[11px] text-church-slate">
                        <strong className="block text-church-navy mb-0.5">Tenant Remarks:</strong>
                        <span>{inspectingSub.tenantNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Rollover Credit Bonus Display */}
                  {rolloverInfo && rolloverInfo.rolloverDays > 0 && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5 shadow-xs animate-in fade-in">
                      <div className="p-1.5 rounded-xl bg-emerald-200/80 text-emerald-900 shrink-0 mt-0.5">
                        <TrendingUp size={14} />
                      </div>
                      <div>
                        <strong className="block font-black text-emerald-900 text-xs">
                          Plan Upgrade Rollover: +{rolloverInfo.rolloverDays} Bonus Days
                        </strong>
                        <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                          Church has <strong>{rolloverInfo.remainingDays} unused days</strong> on their current active plan. Approving this payment will carry them over to this new period for a total of <strong>{30 + rolloverInfo.rolloverDays} days</strong> of paid access.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pending Scheduled Downgrade Notice */}
                  {inspectingChurchData?.subscription?.scheduledChange && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 shadow-xs animate-in fade-in">
                      <div className="p-1.5 rounded-xl bg-amber-200/80 text-amber-900 shrink-0 mt-0.5">
                        <AlertCircle size={14} />
                      </div>
                      <div>
                        <strong className="block font-black text-amber-900 text-xs">
                          Pending Downgrade Will Be Cleared
                        </strong>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Scheduled downgrade to <strong className="uppercase">{inspectingChurchData.subscription.scheduledChange.targetTier}</strong> will be automatically cancelled once this payment is approved.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mode Selector: Approve or Reject Form */}
                  {reviewMode === 'approve' && (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>Confirm Approval & Extend Subscription</span>
                      </div>
                      <div>
                        <label className="block font-bold text-emerald-950 mb-1">Cleared Amount in Bank (₱)</label>
                        <input
                          type="number"
                          value={clearedAmount}
                          onChange={(e) => setClearedAmount(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 focus:outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-emerald-950 mb-1">Audit Ledger Note (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Verified via BDO Mobile statement balance"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setReviewMode(null)}
                          className="px-3 py-1.5 text-xs text-gray-500 font-bold hover:underline"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                        >
                          <Check size={14} />
                          <span>{isProcessing ? 'Settling...' : 'Confirm & Activate Plan'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {reviewMode === 'reject' && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900">
                        <XCircle size={16} className="text-rose-600" />
                        <span>Reject Payment Proof</span>
                      </div>
                      <div>
                        <label className="block font-bold text-rose-950 mb-1">Rejection Reason</label>
                        <select
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-rose-300 focus:outline-none text-xs"
                        >
                          <option value="Amount does not match bank deposit statement.">Amount does not match bank record</option>
                          <option value="Unreadable receipt image or blurred screenshot.">Blurred or unreadable image</option>
                          <option value="Duplicate reference number or already cleared.">Duplicate reference number</option>
                          <option value="Transfer was not received in company account.">Deposit not found in account</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-rose-950 mb-1">Specific Instructions for Tenant</label>
                        <input
                          type="text"
                          placeholder="Explain what the church admin needs to rectify..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-rose-300 focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setReviewMode(null)}
                          className="px-3 py-1.5 text-xs text-gray-500 font-bold hover:underline"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                        >
                          <X size={14} />
                          <span>{isProcessing ? 'Rejecting...' : 'Confirm Rejection'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Default Trigger Buttons */}
                {!reviewMode && (
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setReviewMode('reject')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      <span>Reject Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewMode('approve')}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve & Clear Access</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BANK ACCOUNT CONFIG MODAL */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-black text-base text-church-navy">
                {editingBank ? 'Edit Receiving Account' : 'Add Super Admin Bank Account'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await savePlatformBankAccount({
                    ...(editingBank ? { id: editingBank.id } : {}),
                    ...bankForm,
                    displayOrder: Number(bankForm.displayOrder)
                  });
                  setIsBankModalOpen(false);
                  setActionFeedback({ text: 'Bank account configuration saved!', type: 'success' });
                } catch (err) {
                  alert(err.message || 'Failed to save account');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-church-navy mb-1">Bank Name / Provider</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Banco de Oro (BDO) or GCash"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-church-rose"
                />
              </div>

              <div>
                <label className="block font-bold text-church-navy mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coram Deo Technologies Corp."
                  value={bankForm.accountName}
                  onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-church-rose"
                />
              </div>

              <div>
                <label className="block font-bold text-church-navy mb-1">Account / Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0012-3456-7890 or 0917-xxx-xxxx"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-church-rose font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-church-navy mb-1">Branch (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BGC Main"
                    value={bankForm.branch}
                    onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-church-navy mb-1">Channel Type</label>
                  <select
                    value={bankForm.type}
                    onChange={(e) => setBankForm({ ...bankForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                  >
                    <option value="bank">Traditional Bank</option>
                    <option value="ewallet">E-Wallet / QR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-church-navy mb-1">Transfer Instructions / Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Put church name in reference notes..."
                  value={bankForm.instructions}
                  onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-church-navy">
                    QR Code Image (GCash, Maya, or Bank QR)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualQrUrl(!showManualQrUrl)}
                    className="text-[10px] text-church-rose font-bold hover:underline"
                  >
                    {showManualQrUrl ? 'Hide URL input' : 'or enter URL directly'}
                  </button>
                </div>

                {/* Direct Upload Dropzone / Existing Preview */}
                {bankForm.qrCodeUrl ? (
                  <div className="p-3 rounded-2xl border border-purple-200 bg-purple-50/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white border border-purple-200 p-1 shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
                        <img
                          src={bankForm.qrCodeUrl}
                          alt="QR Code Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-purple-900 block truncate">
                          QR Code Ready
                        </span>
                        <span className="text-[10px] text-purple-700 block truncate">
                          Churches can scan this directly when paying
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingAccountQr({ url: bankForm.qrCodeUrl, title: `${bankForm.bankName || 'Account'} QR Code` })}
                          className="text-[11px] font-bold text-purple-800 underline hover:text-purple-950 mt-0.5"
                        >
                          View Full Image
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <label className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white text-purple-700 hover:bg-purple-100 border border-purple-200 cursor-pointer text-center transition-colors">
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrFileUpload}
                          className="hidden"
                          disabled={isUploadingQr}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setBankForm({ ...bankForm, qrCodeUrl: '' })}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={`block border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      isUploadingQr 
                        ? 'border-purple-300 bg-purple-50/50' 
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/20'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrFileUpload}
                        className="hidden"
                        disabled={isUploadingQr}
                      />
                      
                      {isUploadingQr ? (
                        <div className="space-y-2 py-1">
                          <div className="w-8 h-8 mx-auto rounded-full bg-purple-100 text-purple-600 flex items-center justify-center animate-spin">
                            <RefreshCw size={16} />
                          </div>
                          <span className="text-xs font-bold text-purple-900 block">
                            Uploading QR Code image ({qrUploadProgress || 0}%)...
                          </span>
                          <div className="w-full bg-purple-200 rounded-full h-1.5 overflow-hidden max-w-xs mx-auto">
                            <div 
                              className="bg-purple-600 h-1.5 rounded-full transition-all duration-200" 
                              style={{ width: `${qrUploadProgress || 0}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-1">
                          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
                            <QrCode size={20} />
                          </div>
                          <span className="text-xs font-bold text-church-navy">
                            Click to upload QR code directly
                          </span>
                          <span className="text-[10px] text-church-slate mt-0.5">
                            PNG, JPG, or WEBP up to 5MB (GCash, Maya, or bank QR)
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                )}

                {/* Secondary manual URL input fallback */}
                {showManualQrUrl && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="url"
                      placeholder="Paste image URL directly (https://...)"
                      value={bankForm.qrCodeUrl || ''}
                      onChange={(e) => setBankForm({ ...bankForm, qrCodeUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={bankForm.isActive}
                  onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
                  className="rounded text-church-rose"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-church-navy cursor-pointer">
                  Account is active and available for payments
                </label>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-gray-100">
                {editingBank ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(editingBank)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 border border-rose-200"
                  >
                    <Trash2 size={13} />
                    <span>Delete Account</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBankModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-church-slate hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <GradientButton size="sm" type="submit">
                    Save Account
                  </GradientButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL QR CODE PREVIEW MODAL */}
      {viewingAccountQr && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewingAccountQr(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewingAccountQr(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
            >
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <QrCode size={24} />
            </div>
            <h3 className="text-base font-bold text-church-navy mb-1">{viewingAccountQr.title}</h3>
            <p className="text-xs text-church-slate mb-4">
              This QR code is displayed to churches in their payment modal.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 inline-block mx-auto mb-4">
              <img
                src={viewingAccountQr.url}
                alt="Account QR"
                className="max-h-64 max-w-full object-contain rounded-xl mx-auto"
              />
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setViewingAccountQr(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-church-navy text-white hover:bg-black transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT SUPERADMIN SUBSCRIPTION MISSION CONTROL MODAL */}
      {selectedChurchForModal && (
        <SuperAdminSubscriptionModal
          isOpen={isSubModalOpen}
          onClose={() => {
            setIsSubModalOpen(false);
            setSelectedChurchForModal(null);
          }}
          church={selectedChurchForModal}
          onUpdated={async () => {
            if (selectedChurchForModal?.id) {
              try {
                const updatedSnap = await getDoc(doc(db, 'churches', selectedChurchForModal.id));
                if (updatedSnap.exists()) {
                  setSelectedChurchForModal({ id: updatedSnap.id, ...updatedSnap.data() });
                }
              } catch (e) {
                console.warn('Error refreshing updated church doc:', e);
              }
            }
          }}
        />
      )}
    </div>
  );
}
