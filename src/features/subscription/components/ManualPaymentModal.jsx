import React, { useState, useEffect } from 'react';
import { 
  X, 
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
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '../../../config/subscriptions';
import { 
  subscribeToPlatformBankAccounts, 
  submitManualPaymentReceipt 
} from '../../../services/billingLedgerService';
import { calculateRolloverCredit } from '../../../services/subscriptionService';
import GradientButton from '../../../components/ui/GradientButton';

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

  // Handle file selection
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-church-rose/10 text-church-rose flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-church-navy leading-tight">
                Bank Transfer & Manual Payment
              </h2>
              <p className="text-xs text-church-slate font-medium">
                Upload proof of payment to renew or upgrade your church plan
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="px-6 pt-4 flex items-center gap-2 text-xs font-bold border-b border-gray-100">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
              step === 1 
                ? 'border-church-rose text-church-rose' 
                : 'border-transparent text-church-slate hover:text-church-navy'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-church-rose/10 text-church-rose flex items-center justify-center text-[10px]">1</span>
            <span>Bank Account Details</span>
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
              step === 2 
                ? 'border-church-rose text-church-rose' 
                : 'border-transparent text-church-slate hover:text-church-navy'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-church-rose/10 text-church-rose flex items-center justify-center text-[10px]">2</span>
            <span>Upload Receipt Proof</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Receiving Bank Accounts & Instructions */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            {/* Plan Tier Selector */}
            <div className="p-4 rounded-2xl bg-church-canvas border border-gray-100">
              <label className="block text-xs font-bold text-church-navy mb-2">Select Subscription Plan</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetTier('growth')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    targetTier === 'growth'
                      ? 'border-church-rose bg-white shadow-sm ring-2 ring-church-rose/20'
                      : 'border-gray-200 bg-gray-50/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-church-navy">Growth Ministry</span>
                    <span className="text-[10px] font-bold text-church-rose px-2 py-0.5 rounded-full bg-church-rose/10">Popular</span>
                  </div>
                  <div className="text-base font-black text-church-charcoal">₱3,490<span className="text-[10px] font-normal text-church-slate">/mo</span></div>
                  <div className="text-[11px] text-church-slate mt-1">Up to 250 members • 20GB media</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetTier('kingdom')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    targetTier === 'kingdom'
                      ? 'border-purple-600 bg-white shadow-sm ring-2 ring-purple-600/20'
                      : 'border-gray-200 bg-gray-50/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-church-navy">Kingdom Network</span>
                    <span className="text-[10px] font-bold text-purple-700 px-2 py-0.5 rounded-full bg-purple-100">Unlimited</span>
                  </div>
                  <div className="text-base font-black text-church-charcoal">₱5,490<span className="text-[10px] font-normal text-church-slate">/mo</span></div>
                  <div className="text-[11px] text-church-slate mt-1">No member limits • 50GB media</div>
                </button>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-200/70 text-xs">
                <span className="text-church-slate font-medium">Billing Period:</span>
                <div className="flex items-center gap-1 bg-gray-200/60 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      billingCycle === 'monthly' ? 'bg-white shadow text-church-navy' : 'text-church-slate'
                    }`}
                  >
                    Monthly (₱{targetConfig.priceNum?.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      billingCycle === 'yearly' ? 'bg-white shadow text-church-rose' : 'text-church-slate'
                    }`}
                  >
                    Annual (Save 2 Mo. • ₱{(targetConfig.priceNum * 10)?.toLocaleString()})
                  </button>
                </div>
              </div>
            </div>

            {/* Bank Accounts List */}
            <div>
              <label className="block text-xs font-bold text-church-navy mb-2">
                Choose Super Admin Receiving Account
              </label>
              <div className="space-y-2.5">
                {bankAccounts.map((acc) => {
                  const isSelected = selectedBankId === acc.id;
                  const isCopied = copiedBankId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedBankId(acc.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-church-rose bg-pink-50/20 shadow-sm ring-1 ring-church-rose' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-church-navy">{acc.bankName}</span>
                            {acc.type === 'ewallet' && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-700">
                                E-Wallet / QR
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-church-slate">
                            Account Name: <strong className="text-church-charcoal">{acc.accountName}</strong>
                          </div>
                          <div className="text-xs text-church-slate flex items-center gap-2 font-mono">
                            <span>Account No:</span>
                            <span className="text-sm font-black text-church-navy tracking-wider">{acc.accountNumber}</span>
                          </div>
                          {acc.branch && (
                            <div className="text-[11px] text-church-muted">Branch: {acc.branch}</div>
                          )}
                          {acc.instructions && (
                            <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl mt-1">
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
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1 transition-all"
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
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-gray-100 hover:bg-gray-200 text-church-charcoal'
                            }`}
                          >
                            {isCopied ? <Check size={13} /> : <Copy size={13} />}
                            <span>{isCopied ? 'Copied!' : 'Copy No.'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prominent QR Code Scan Banner if Selected Account has QR Code */}
            {selectedBank?.qrCodeUrl && (
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    onClick={() => setViewingQr({ url: selectedBank.qrCodeUrl, title: `${selectedBank.bankName} QR Code` })}
                    className="w-14 h-14 rounded-xl bg-white border border-purple-200 p-1 shrink-0 overflow-hidden shadow-xs flex items-center justify-center cursor-pointer hover:border-purple-400 transition-all"
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
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <QrCode size={14} />
                  <span>Scan / Zoom QR</span>
                </button>
              </div>
            )}

            {/* Rollover Credit Bonus Banner */}
            {rollover.rolloverDays > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5 animate-in fade-in">
                <Gift size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <strong className="block font-bold">Unused Plan Rollover Bonus:</strong>
                  <span>{rollover.rolloverExplanation}</span>
                </div>
              </div>
            )}

            {/* Reference Remark Instructions */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
              <ShieldCheck size={18} className="shrink-0 text-blue-600 mt-0.5" />
              <div>
                <strong className="block font-bold">Important Transfer Instruction:</strong>
                <span>
                  When doing your online transfer, please put <strong>{church?.name || 'Your Church'}</strong> in the remarks/message field so our accounting team can quickly match your deposit.
                </span>
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-church-slate hover:bg-gray-100"
              >
                Cancel
              </button>
              <GradientButton
                type="button"
                onClick={() => setStep(2)}
                size="md"
                className="flex items-center gap-1.5"
              >
                <span>Continue to Upload Proof</span>
                <ArrowRight size={14} />
              </GradientButton>
            </div>
          </div>
        )}

        {/* Step 2: Form & Receipt Upload */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-church-slate block text-[11px]">Selected Account:</span>
                <strong className="text-church-navy font-bold">{selectedBank?.bankName}</strong> ({selectedBank?.accountNumber})
                {selectedBank?.qrCodeUrl && (
                  <button
                    type="button"
                    onClick={() => setViewingQr({ url: selectedBank.qrCodeUrl, title: `${selectedBank.bankName} QR Code` })}
                    className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline text-[11px] mt-0.5 ml-2"
                  >
                    <QrCode size={12} />
                    <span>View QR Code</span>
                  </button>
                )}
              </div>
              <div className="text-right">
                <span className="text-church-slate block text-[11px]">Plan & Amount:</span>
                <strong className="text-church-rose font-black">{targetConfig.name} (₱{Number(amountPaid).toLocaleString()})</strong>
              </div>
            </div>

            {rollover.rolloverDays > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <Gift size={15} className="text-emerald-600 shrink-0" />
                <span className="text-[11px]">
                  <strong>+{rollover.rolloverDays} Rollover Days</strong> will be credited on top of your standard 30-day period.
                </span>
              </div>
            )}

            {/* Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-church-navy mb-1">
                  Bank / GCash Reference # <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10928374652 or BDO-TXN-839"
                  value={bankReferenceNumber}
                  onChange={(e) => setBankReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-church-rose font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-church-navy mb-1">
                  Date of Transfer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateTransferred}
                  onChange={(e) => setDateTransferred(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-church-rose"
                />
              </div>

              <div>
                <label className="block font-bold text-church-navy mb-1">
                  Sender Account Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pastor John Doe / Church Board"
                  value={senderAccountName}
                  onChange={(e) => setSenderAccountName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-church-rose"
                />
              </div>

              <div>
                <label className="block font-bold text-church-navy mb-1">
                  Total Amount Transferred (₱) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-church-rose font-bold"
                />
              </div>
            </div>

            {/* Receipt File Upload Dropzone */}
            <div>
              <label className="block text-xs font-bold text-church-navy mb-1.5">
                Upload Transfer Receipt / Screenshot <span className="text-rose-500">*</span>
              </label>

              <div className="border-2 border-dashed border-gray-200 hover:border-church-rose rounded-2xl p-4 transition-all text-center relative bg-gray-50/50">
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
                      className="max-h-36 rounded-xl object-contain shadow-sm border border-gray-200 mb-2" 
                    />
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>{receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} KB)</span>
                    </span>
                    <span className="text-[10px] text-church-slate mt-0.5">Click or drag another image to replace</span>
                  </div>
                ) : receiptFile ? (
                  <div className="flex flex-col items-center py-2">
                    <FileText size={32} className="text-church-rose mb-1" />
                    <span className="text-xs font-bold text-church-navy">{receiptFile.name}</span>
                    <span className="text-[10px] text-church-slate mt-0.5">Click to choose another file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-3">
                    <div className="w-10 h-10 rounded-2xl bg-church-rose/10 text-church-rose flex items-center justify-center mb-2">
                      <UploadCloud size={20} />
                    </div>
                    <span className="text-xs font-bold text-church-navy">
                      Click to browse or drop payment receipt here
                    </span>
                    <span className="text-[11px] text-church-slate mt-0.5">
                      Accepts PNG, JPG, WebP, PDF (Max 10MB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-bold text-church-navy mb-1">
                Additional Notes / Message to Admin (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Any special notes or references..."
                value={tenantNotes}
                onChange={(e) => setTenantNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-church-rose text-xs"
              />
            </div>

            {/* Upload Progress Bar */}
            {isSubmitting && (
              <div className="p-3 rounded-2xl bg-pink-50 border border-pink-100 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-church-rose">
                  <span>Uploading receipt & notifying Super Admin...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-pink-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-church-rose h-full transition-all duration-200 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="text-xs font-bold text-church-slate hover:text-church-navy"
              >
                ← Back to Bank Details
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-church-slate hover:bg-gray-100"
                >
                  Cancel
                </button>
                <GradientButton
                  type="submit"
                  size="md"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Submitting Receipt...' : 'Submit Payment Proof'}
                </GradientButton>
              </div>
            </div>
          </form>
        )}
      </div>

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
    </div>
  );
}
