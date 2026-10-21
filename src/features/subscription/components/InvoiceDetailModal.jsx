import React, { useState } from 'react';
import { 
  X, 
  Receipt, 
  Download, 
  CheckCircle2, 
  Copy, 
  Check, 
  Building2, 
  Calendar, 
  CreditCard, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  FileText
} from 'lucide-react';
import { generateSubscriptionReceiptPdf } from '../../../utils/subscriptionReceiptPdfGenerator';
import GradientButton from '../../../components/ui/GradientButton';

export default function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  church,
  subscription
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const invNumber = invoice.invoiceNumber || invoice.id || 'INV-000000';
  const issueDate = invoice.paidAt || invoice.createdAt || new Date().toISOString();
  const periodStart = invoice.periodStart || issueDate;
  const periodEnd = invoice.periodEnd || issueDate;
  const amount = Number(invoice.amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(dateString);
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(invNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    generateSubscriptionReceiptPdf({
      church,
      invoice,
      subscription
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-church-navy via-slate-900 to-church-charcoal text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-church-rose text-white">
              Official Tax Invoice
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <CheckCircle2 size={11} />
              <span>Paid & Cleared</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <span>{invNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Copy Invoice Number"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Issued on {formatDate(issueDate)} • Church Operating System
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-bold">Total Paid</span>
              <span className="text-2xl font-black text-white">
                ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Billed To & Payment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Billed To */}
            <div className="p-4 rounded-2xl bg-church-canvas border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-church-rose mb-2">
                  <Building2 size={13} />
                  <span>Billed To (Church Workspace)</span>
                </div>
                <div className="font-bold text-sm text-church-navy">
                  {church?.name || church?.churchName || 'Church Workspace'}
                </div>
                <p className="text-xs text-church-slate mt-0.5">
                  Attn: {church?.seniorPastor || 'Church Administrator'}
                </p>
                <p className="text-xs text-church-slate">
                  {church?.city || church?.address || 'Philippines'}
                </p>
                <p className="text-xs text-church-slate">
                  Email: {church?.contact?.email || 'N/A'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200/60 font-mono text-[10px] text-church-slate">
                Workspace ID: {church?.id || 'N/A'}
              </div>
            </div>

            {/* Payment & Clearing Info */}
            <div className="p-4 rounded-2xl bg-church-canvas border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-church-rose mb-2">
                  <CreditCard size={13} />
                  <span>Payment & Clearing Details</span>
                </div>
                <div className="font-bold text-sm text-church-navy">
                  {invoice.paymentMethod || 'Manual Bank Transfer / GCash'}
                </div>
                <p className="text-xs text-church-slate mt-0.5">
                  Deposit Account: <strong className="text-church-charcoal">{invoice.bankName || 'Direct Deposit'}</strong>
                </p>
                <p className="text-xs text-church-slate">
                  Reference #: <code className="font-mono text-[11px] font-bold text-church-charcoal">{invoice.bankReferenceNumber || 'Verified by Admin'}</code>
                </p>
                <div className="flex items-center gap-1 text-xs text-church-slate mt-1">
                  <Calendar size={12} className="shrink-0 text-church-slate" />
                  <span>Coverage: {formatDate(periodStart)} – {formatDate(periodEnd)}</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px]">
                <span className="text-church-slate font-medium">Platform Ledger Status:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Verified & Cleared</span>
                </span>
              </div>
            </div>
          </div>

          {/* Rollover Credit Banner (if any) */}
          {invoice.rolloverDays > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
              <TrendingUp size={16} className="text-emerald-600 shrink-0" />
              <div>
                <strong className="block font-bold">Plan Rollover Credit Applied:</strong>
                <span>+{invoice.rolloverDays} bonus days were carried over from your previous unused cycle.</span>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-church-navy mb-2 flex items-center gap-1.5">
              <Receipt size={13} />
              <span>Invoice Items & Breakdown</span>
            </h4>
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-church-charcoal">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-church-slate text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Item & Description</th>
                    <th className="py-2.5 px-3 text-center">Cycle</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  <tr>
                    <td className="py-3 px-4">
                      <div className="font-bold text-church-navy">{invoice.description}</div>
                      <div className="text-[11px] text-church-slate mt-0.5">
                        Active Workspace Subscription ({formatDate(periodStart)} to {formatDate(periodEnd)})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-church-slate font-medium">
                      {invoice.billingCycle === 'annual' ? '1 Year' : '1 Month'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-church-navy">
                      ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="bg-gray-50/70 p-4 border-t border-gray-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-church-slate">
                  <span>Subtotal:</span>
                  <span>₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-church-slate">
                  <span>Value Added Tax (0% VAT Non-VAT Church Exempt):</span>
                  <span>₱0.00</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-black text-sm text-church-navy">
                  <span>Total Amount Paid:</span>
                  <span className="text-church-rose font-black">
                    ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Bank Deposit Slip (if available) */}
          {invoice.receiptUrl && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-blue-950 font-bold">
                <FileText size={16} className="text-blue-600 shrink-0" />
                <span>Uploaded Bank Deposit Slip / Receipt</span>
              </div>
              <a
                href={invoice.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-100/70 border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <span>View Attachment</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Governance Notice */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-[11px] text-church-slate leading-relaxed">
            <strong className="block font-bold text-church-navy mb-0.5">Auditable Board Record</strong>
            This is an authorized computer-generated tax invoice issued by Coram Deo. It is recognized for church board administration, financial reporting, and annual audits.
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-church-canvas border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full font-bold text-xs text-church-slate hover:bg-gray-200/70 transition-colors"
          >
            Close
          </button>
          <GradientButton
            onClick={handleDownloadPdf}
            icon={Download}
            size="md"
            className="w-full sm:w-auto justify-center text-xs px-5 rounded-full"
          >
            Download Official PDF
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
