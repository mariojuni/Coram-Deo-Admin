import React from 'react';
import { FileText, CheckCircle, XCircle, Clock, Shield, User, Loader2 } from 'lucide-react';
import { canReviewMinistryApplication } from '../../utils/ministryApplicationPermissions';
import { formatStandardName } from '../../utils/nameUtils';
import Modal from '../../components/ui/Modal';

export default function MinistryApplicationDetailModal({
  isOpen,
  onClose,
  application,
  userProfile,
  applicantName: customApplicantName,
  applicantPhotoUrl: customApplicantPhotoUrl,
  onApprove,
  onDecline,
  processing,
}) {
  if (!isOpen || !application) return null;

  const canReview = canReviewMinistryApplication(userProfile, application) && application.status === 'pending';
  const applicantName = customApplicantName || formatStandardName(application);
  const applicantPhotoUrl = customApplicantPhotoUrl || application.applicantPhotoUrl;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} className="mr-1 text-emerald-600" /> Approved
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle size={12} className="mr-1 text-red-600" /> Declined
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="mr-1 text-amber-600" /> Pending Review
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ministry Application"
      subtitle={`Submitted on ${formatDate(application.submittedAt || application.createdAt)}`}
      icon={FileText}
      maxWidth="2xl"
      badge={getStatusBadge(application.status)}
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Close
          </button>

          {canReview && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onDecline(application)}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl transition-colors disabled:opacity-50"
              >
                <XCircle size={14} />
                <span>Decline Application</span>
              </button>
              <button
                type="button"
                onClick={() => onApprove(application)}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162533] hover:bg-[#1E2E3D] rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span>Approve Application</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Applicant Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {applicantPhotoUrl ? (
              <img
                src={applicantPhotoUrl}
                alt={applicantName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#162533] to-[#2C4A60] text-white flex items-center justify-center font-black text-lg shadow-2xs">
                {(applicantName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-800 truncate">{applicantName}</h3>
              <div className="flex items-center text-xs text-slate-500 mt-0.5">
                <Shield size={12} className="mr-1 text-[#2C4A60]" />
                <span className="font-semibold text-slate-700">{application.ministryName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          {/* Preferred Roles */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Roles</label>
            <div className="flex flex-wrap gap-2">
              {application.preferredRoleNames && application.preferredRoleNames.length > 0 ? (
                application.preferredRoleNames.map((roleName, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[#EBF2F7] text-[#2C4A60] text-xs font-bold rounded-lg border border-[#D5E3EC]">
                    {roleName}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No specific role preferred</span>
              )}
            </div>
          </div>

          {/* Reason for Joining */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reason for Joining</label>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200/70 whitespace-pre-wrap leading-relaxed">
              {application.reason || application.reasonForJoining || <span className="text-slate-400 italic">None provided</span>}
            </div>
          </div>

          {/* Relevant Experience */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Relevant Experience</label>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200/70 whitespace-pre-wrap leading-relaxed">
              {application.experience || <span className="text-slate-400 italic">None provided</span>}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Availability</label>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200/70">
              {application.availability || <span className="text-slate-400 italic">None provided</span>}
            </div>
          </div>

          {/* Review Information if reviewed */}
          {application.status !== 'pending' && (
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1.5 mt-2">
              <h4 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Review Audit Trail</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <p><span className="font-semibold">Reviewed At:</span> {formatDate(application.reviewedAt)}</p>
                {application.reviewNote && (
                  <p><span className="font-semibold">Internal Note:</span> {application.reviewNote}</p>
                )}
                {application.declineReason && (
                  <p className="text-red-700"><span className="font-semibold">Decline Reason:</span> {application.declineReason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
