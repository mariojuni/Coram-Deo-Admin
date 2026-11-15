import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertCircle, 
  QrCode, 
  ShieldCheck, 
  Gift,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '../../../config/subscriptions';
import { 
  subscribeToPlatformBankAccounts, 
  submitManualPaymentReceipt 
} from '../../../services/billingLedgerService';
import { calculateRolloverCredit } from '../../../services/subscriptionService';
import Modal from '../../../components/ui/Modal';

export default function ManualPaymentModal({ 
  isOpen, 
  onClose, 
  church, 
  currentUser, 
  initialTier = 'growth',
  onSuccess 
}) {
  const [targetTier, setTargetTier] = useState(initialTier);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [copiedBankId, setCopiedBankId] = useState(null);
  
  // Form fields
  const [bankReferenceNumber, setBankReferenceNumber] = useState('');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [senderBank, setSenderBank] = useState('');
  const [dateTransferred, setDateTransferred] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState('');
  const [tenantNotes, setTenantNotes] = useState('');
  
  // File upload state
  const [receiptFile, setReceiptFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState(1); // 1: Bank & Transfer Info, 2: Receipt Upload Form
  const [viewingQr, setViewingQr] = useState(null);

  // Load active bank accounts
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToPlatformBankAccounts((accounts) => {
      const active = accounts.filter(a => a.isActive !== false);
      setBankAccounts(active);
      if (active.length > 0 && !selectedBankId) {
        setSelectedBankId(active[0].id);
      }
    });
    return () => unsub();
  }, [isOpen]);

  // Update default amount when tier changes
  useEffect(() => {
    const tierConfig = SUBSCRIPTION_TIERS[targetTier] || SUBSCRIPTION_TIERS.growth;
    const basePrice = tierConfig.priceNum || 3490;
    const finalAmount = billingCycle === 'yearly' ? basePrice * 10 : basePrice; // 2 months free for yearly
    setAmountPaid(finalAmount.toString());
  }, [targetTier, billingCycle]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Receipt file size must be less than 10MB.');
      return;
    }

    setReceiptFile(file);
    setErrorMessage('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedBankId(id);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  const selectedBank = bankAccounts.find(a => a.id === selectedBankId) || bankAccounts[0];
  const targetConfig = SUBSCRIPTION_TIERS[targetTier] || SUBSCRIPTION_TIERS.growth;
  const rollover = React.useMemo(() => {
    return calculateRolloverCredit(church?.subscription, targetTier);
  }, [church?.subscription, targetTier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      setErrorMessage('Please upload a photo or PDF of your transfer receipt.');
      return;
    }
    if (!bankReferenceNumber.trim()) {
      setErrorMessage('Please enter the Bank / GCash Reference or Trace Number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const churchId = church?.id;
      const churchName = church?.name || 'Church Workspace';

      await submitManualPaymentReceipt(
        churchId,
        churchName,
        {
          tier: targetTier,
          billingCycle,
          amount: Number(amountPaid),
          paymentMethod: selectedBank?.type === 'ewallet' ? 'gcash' : 'bank_transfer',
          receivingBankId: selectedBank?.id || 'bdo-corp',
          receivingBankName: selectedBank?.bankName || 'BDO',
          bankReferenceNumber: bankReferenceNumber.trim(),
          senderAccountName: senderAccountName.trim(),
          senderBank: senderBank.trim(),
          dateTransferred,
          tenantNotes: tenantNotes.trim(),
          submittedByUserId: currentUser?.uid || null,
          submittedByEmail: currentUser?.email || null
        },
        receiptFile,
        (progress) => setUploadProgress(progress)
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting manual payment receipt:', err);
      setErrorMessage(err.message || 'Failed to submit receipt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Bank Transfer & Manual Payment"
        subtitle="Upload proof of payment to renew or upgrade your church plan"
        icon={Building2}
        maxWidth="2xl"
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC]">
            {step === 1 ? 'Step 1: Receiving Account' : 'Step 2: Upload Proof'}
          </span>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <ArrowLeft size={14} />
                  <span>Bank Accounts</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Cancel
              </button>

              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs"
                >
                  <span>Continue to Upload Proof</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  form="manual-payment-form"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Receipt...' : 'Submit Payment Proof'}
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Step Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                step === 1
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#EBF2F7] text-[#2C4A60] flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Bank Details</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                step === 2
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#EBF2F7] text-[#2C4A60] flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Upload Proof</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/70 text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Receiving Bank Accounts & Instructions */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Plan Tier Selector */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Select Subscription Plan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetTier('growth')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      targetTier === 'growth'
                        ? 'border-[#2C4A60] bg-[#EBF2F7]/40 shadow-2xs ring-1 ring-[#2C4A60]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">Growth Ministry</span>
                      <span className="text-[10px] font-bold text-[#2C4A60] px-2 py-0.5 rounded-full bg-[#EBF2F7] border border-[#D5E3EC]">Popular</span>
                    </div>
                    <div className="text-base font-black text-slate-900">₱3,490<span className="text-[10px] font-normal text-slate-500">/mo</span></div>
                    <div className="text-[11px] text-slate-500 mt-1">Up to 250 members • 20GB media</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetTier('kingdom')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      targetTier === 'kingdom'
                        ? 'border-purple-600 bg-purple-50/40 shadow-2xs ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">Kingdom Network</span>
                      <span className="text-[10px] font-bold text-purple-700 px-2 py-0.5 rounded-full bg-purple-100 border border-purple-200">Unlimited</span>
                    </div>
                    <div className="text-base font-black text-slate-900">₱5,490<span className="text-[10px] font-normal text-slate-500">/mo</span></div>
                    <div className="text-[11px] text-slate-500 mt-1">No member limits • 50GB media</div>
                  </button>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Billing Period:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        billingCycle === 'monthly' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      Monthly (₱{targetConfig.priceNum?.toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        billingCycle === 'yearly' ? 'bg-white shadow-2xs text-[#2C4A60]' : 'text-slate-500'
                      }`}
                    >
                      Annual (Save 2 Mo. • ₱{(targetConfig.priceNum * 10)?.toLocaleString()})
                    </button>
                  </div>
                </div>
              </div>

              {/* Bank Accounts List */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Select Receiving Bank Account
                </label>
                <div className="space-y-2.5">
                  {bankAccounts.map((acc) => {
                    const isSelected = selectedBankId === acc.id;
                    const isCopied = copiedBankId === acc.id;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedBankId(acc.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-[#2C4A60] bg-[#EBF2F7]/40 shadow-2xs ring-1 ring-[#2C4A60]' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">{acc.bankName}</span>
                              {acc.type === 'ewallet' && (
                                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  E-Wallet / QR
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              Account Name: <strong className="text-slate-800">{acc.accountName}</strong>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                              <span>Account No:</span>
                              <span className="text-sm font-black text-slate-900 tracking-wider">{acc.accountNumber}</span>
                            </div>
                            {acc.instructions && (
                              <div className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/60 p-2 rounded-lg mt-1">
                                💡 {acc.instructions}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {acc.qrCodeUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingQr({ url: acc.qrCodeUrl, title: `${acc.bankName} QR Code` });
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 transition-all"
                              >
                                <QrCode size={13} />
                                <span>QR</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(acc.accountNumber, acc.id);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                isCopied 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isCopied ? <Check size={13} /> : <Copy size={13} />}
                              <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prominent QR Code Scan Banner */}
              {selectedBank?.qrCodeUrl && (
                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      onClick={() => setViewingQr({ url: selectedBank.qrCodeUrl, title: `${selectedBank.bankName} QR Code` })}
                      className="w-14 h-14 rounded-xl bg-white border border-purple-200 p-1 shrink-0 overflow-hidden shadow-2xs flex items-center justify-center cursor-pointer hover:border-purple-400 transition-all"
                    >
                      <img
                        src={selectedBank.qrCodeUrl}
                        alt="Account QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-purple-950 block truncate">
                        {selectedBank.bankName} QR Code
                      </span>
                      <span className="text-[11px] text-purple-700 block">
                        Scan using your mobile banking or e-wallet app to pay.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingQr({ url: selectedBank.qrCodeUrl, title: `${selectedBank.bankName} Official QR Code` })}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <QrCode size={14} />
                    <span>Zoom QR</span>
                  </button>
                </div>
              )}

              {/* Rollover Credit Bonus Banner */}
              {rollover.rolloverDays > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5 shadow-2xs">
                  <Gift size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Unused Plan Rollover Bonus:</strong>
                    <span>{rollover.rolloverExplanation}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Form & Receipt Upload */}
          {step === 2 && (
            <form id="manual-payment-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Selected Account:</span>
                  <strong className="text-slate-900 font-bold">{selectedBank?.bankName}</strong> ({selectedBank?.accountNumber})
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Plan & Amount:</span>
                  <strong className="text-[#2C4A60] font-black">{targetConfig.name} (₱{Number(amountPaid).toLocaleString()})</strong>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Bank / GCash Reference # *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10928374652 or BDO-TXN-839"
                      value={bankReferenceNumber}
                      onChange={(e) => setBankReferenceNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Date of Transfer *
                    </label>
                    <input
                      type="date"
                      required
                      value={dateTransferred}
                      onChange={(e) => setDateTransferred(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Sender Account Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pastor John Doe"
                      value={senderAccountName}
                      onChange={(e) => setSenderAccountName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Total Amount Transferred (₱) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-bold focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                    />
                  </div>
                </div>

                {/* Dropzone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Upload Transfer Receipt / Screenshot *
                  </label>

                  <div className="border-2 border-dashed border-slate-200 hover:border-[#2C4A60] rounded-2xl p-6 transition-all text-center relative bg-slate-50/50 cursor-pointer group">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      required={!receiptFile}
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {filePreview ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={filePreview} 
                          alt="Receipt Preview" 
                          className="max-h-36 rounded-xl object-contain shadow-2xs border border-slate-200 mb-2" 
                        />
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          <span>{receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} KB)</span>
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">Click or drag another image to replace</span>
                      </div>
                    ) : receiptFile ? (
                      <div className="flex flex-col items-center py-2">
                        <FileText size={32} className="text-[#2C4A60] mb-1" />
                        <span className="text-xs font-bold text-slate-800">{receiptFile.name}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">Click to choose another file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-slate-200/70 text-[#2C4A60] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                          <UploadCloud size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Click to browse or drop payment receipt here
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          Accepts PNG, JPG, WebP, PDF (Max 10MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Additional Notes / Reference to Admin (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any special notes or references..."
                    value={tenantNotes}
                    onChange={(e) => setTenantNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-[#2C4A60] transition-all"
                  />
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isSubmitting && (
                <div className="p-3.5 rounded-2xl bg-[#EBF2F7] border border-[#D5E3EC] space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#2C4A60]">
                    <span>Uploading receipt & notifying Super Admin...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#2C4A60] h-full transition-all duration-200 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </Modal>

      {/* QR Code Inspection Modal */}
      {viewingQr && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <span className="font-extrabold text-sm text-church-navy">{viewingQr.title || 'Scan QR Code'}</span>
              <button
                type="button"
                onClick={() => setViewingQr(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4 flex items-center justify-center">
              <img
                src={viewingQr.url}
                alt="QR Code"
                className="max-h-64 max-w-full object-contain rounded-xl shadow-sm"
              />
            </div>

            <p className="text-xs text-church-slate mb-4">
              Open your GCash, Maya, or Bank mobile app, tap <strong>Scan QR</strong>, and point your camera here to pay.
            </p>

            <button
              type="button"
              onClick={() => setViewingQr(null)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-gray-100 hover:bg-gray-200 text-church-charcoal"
            >
              Done Scanning
            </button>
          </div>
        </div>
      )}
    </>
  );
}
