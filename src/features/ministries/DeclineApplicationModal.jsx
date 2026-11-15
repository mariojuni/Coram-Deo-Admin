import React, { useState } from 'react';
import { UserX, AlertCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';

export default function DeclineApplicationModal({
  isOpen,
  onClose,
  onConfirm,
  processing,
}) {
  const [declineReason, setDeclineReason] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!declineReason.trim()) {
      setError('Please provide a reason for declining.');
      return;
    }
    setError('');
    onConfirm({ declineReason: declineReason.trim(), reviewNote: reviewNote.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Decline Ministry Application"
      subtitle="Provide constructive pastoral feedback explaining the application status"
      icon={UserX}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="decline-app-form"
            disabled={processing || !declineReason.trim()}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50"
          >
            {processing ? 'Declining...' : 'Confirm Decline'}
          </button>
        </>
      }
    >
      <form id="decline-app-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium flex items-center">
            <AlertCircle size={15} className="mr-2 shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Decline Reason (Visible to Applicant) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Schedule incompatibility, prerequisites not yet met, or ministry full..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Internal Leadership Note (Optional)
            </label>
            <textarea
              rows={2}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Internal notes for pastors and ministry leaders..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
