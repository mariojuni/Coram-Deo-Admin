import React, { useState } from 'react';
import { 
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
import Modal from '../../../components/ui/Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invNumber}
      subtitle={`Issued on ${formatDate(issueDate)} • Church Operating System`}
      icon={Receipt}
      maxWidth="2xl"
      badge={
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={11} className="text-emerald-600" />
          <span>Paid & Cleared</span>
        </span>
      }
      headerActions={
        <button
          type="button"
          onClick={handleCopyNumber}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          title="Copy Invoice Number"
        >
          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
        </button>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#162533] hover:bg-[#1E2E3D] text-white font-bold text-xs sm:text-sm shadow-sm shadow-[#162533]/20 transition-all active:scale-98"
          >
            <Download size={14} />
            <span>Download Official PDF</span>
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Total Paid Summary Banner */}
        <div className="flex items-center justify-between p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Tax Invoice</span>
            <span className="text-xs text-slate-700 font-semibold">Subscription Billing Document</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount Paid</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Billed To & Payment Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Billed To */}
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2C4A60] mb-2.5">
                <Building2 size={13} />
                <span>Billed To (Church Workspace)</span>
              </div>
              <div className="font-bold text-sm text-slate-900">
                {church?.name || church?.churchName || 'Church Workspace'}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Attn: {church?.seniorPastor || 'Church Administrator'}
              </p>
              <p className="text-xs text-slate-500">
                {church?.city || church?.address || 'Philippines'}
              </p>
              <p className="text-xs text-slate-500">
                Email: {church?.contact?.email || 'N/A'}
              </p>
            </div>
            <div className="mt-3.5 pt-2 border-t border-slate-100 font-mono text-[10px] text-slate-400">
              Workspace ID: {church?.id || 'N/A'}
            </div>
          </div>

          {/* Payment & Clearing Info */}
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2C4A60] mb-2.5">
                <CreditCard size={13} />
                <span>Payment & Clearing Details</span>
              </div>
              <div className="font-bold text-sm text-slate-900">
                {invoice.paymentMethod || 'Manual Bank Transfer / GCash'}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deposit Account: <strong className="text-slate-800">{invoice.bankName || 'Direct Deposit'}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Reference #: <code className="font-mono text-[11px] font-bold text-slate-800">{invoice.bankReferenceNumber || 'Verified by Admin'}</code>
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <Calendar size={12} className="shrink-0 text-slate-400" />
                <span>Coverage: {formatDate(periodStart)} – {formatDate(periodEnd)}</span>
              </div>
            </div>
            <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 font-medium">Platform Ledger Status:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>Verified & Cleared</span>
              </span>
            </div>
          </div>
        </div>

        {/* Rollover Credit Banner (if any) */}
        {invoice.rolloverDays > 0 && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-950 flex items-center gap-2.5">
            <TrendingUp size={16} className="text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-bold">Plan Rollover Credit Applied:</strong>
              <span>+{invoice.rolloverDays} bonus days were carried over from your previous unused cycle.</span>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
            <Receipt size={13} className="text-[#2C4A60]" />
            <span>Invoice Items & Breakdown</span>
          </div>
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Item & Description</th>
                  <th className="py-2.5 px-3 text-center">Cycle</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{invoice.description}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Active Workspace Subscription ({formatDate(periodStart)} to {formatDate(periodEnd)})
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500 font-medium">
                    {invoice.billingCycle === 'annual' ? '1 Year' : '1 Month'}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className="bg-slate-50/50 p-4 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Value Added Tax (0% VAT Non-VAT Church Exempt):</span>
                <span>₱0.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount Paid:</span>
                <span className="text-[#2C4A60] font-black">
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
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-100/70 border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
            >
              <span>View Attachment</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Governance Notice */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed shadow-2xs">
          <strong className="block font-bold text-slate-800 mb-0.5">Auditable Board Record</strong>
          This is an authorized computer-generated tax invoice issued by Coram Deo. It is recognized for church board administration, financial reporting, and annual audits.
        </div>
      </div>
    </Modal>
  );
}
