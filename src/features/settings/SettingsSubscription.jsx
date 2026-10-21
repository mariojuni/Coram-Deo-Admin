import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  Users,
  Building,
  Zap,
  ArrowUpRight,
  HelpCircle,
  Gift,
  X,
  Lock,
  HardDrive,
  FolderCheck,
  Music,
  BookOpen,
  Receipt,
  Headphones,
  Film,
  Calendar,
  ArrowDownRight,
  Undo2,
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';
import { useSubscription } from '../subscription/hooks/useSubscription';
import { useSubscriptionLimits } from '../subscription/hooks/useSubscriptionLimits';
import { useStorageQuota } from '../subscription/hooks/useStorageQuota';
import { SUBSCRIPTION_TIERS, getTierConfig } from '../../config/subscriptions';
import { 
  changeChurchTier, 
  scheduleChurchDowngrade,
  cancelScheduledDowngrade,
  checkAndApplyScheduledTierChanges,
  subscribeToChurchInvoices 
} from '../../services/subscriptionService';
import { subscribeToChurchSubmissions } from '../../services/billingLedgerService';
import ManualPaymentModal from '../subscription/components/ManualPaymentModal';
import InvoiceDetailModal from '../subscription/components/InvoiceDetailModal';
import { generateSubscriptionReceiptPdf } from '../../utils/subscriptionReceiptPdfGenerator';
import { useAuth } from '../../context/AuthContext';
import { UploadCloud, Eye, Building2 } from 'lucide-react';

export default function SettingsSubscription({ churchId }) {
  const { userProfile, currentUser } = useAuth();
  const sub = useSubscription();
  const limits = useSubscriptionLimits();
  const storage = useStorageQuota();
  const [switchingTier, setSwitchingTier] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });
  const [invoices, setInvoices] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTier, setManualTier] = useState('growth');
  const [historyTab, setHistoryTab] = useState('invoices'); // 'invoices' | 'submissions'
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState(null);
  
  // Downgrade Advisory Modal State
  const [downgradeModalTarget, setDowngradeModalTarget] = useState(null);
  const [isSchedulingDowngrade, setIsSchedulingDowngrade] = useState(false);

  const activeChurchId = churchId || sub.rawChurch?.id;

  // Check and execute any scheduled tier changes on load
  useEffect(() => {
    if (activeChurchId && sub.rawChurch) {
      checkAndApplyScheduledTierChanges(activeChurchId, sub.rawChurch);
    }
  }, [activeChurchId, sub.rawChurch]);

  // Listen to real-time invoices & manual payment submissions
  useEffect(() => {
    if (!activeChurchId) return;
    const unsubInvoices = subscribeToChurchInvoices(activeChurchId, (list) => {
      setInvoices(list);
    });
    const unsubSubmissions = subscribeToChurchSubmissions(activeChurchId, (list) => {
      setSubmissions(list);
    });
    return () => {
      unsubInvoices();
      unsubSubmissions();
    };
  }, [activeChurchId]);

  const pendingSubmission = submissions.find(s => s.status === 'pending_review');
  const latestRejectedSubmission = submissions.find(s => s.status === 'rejected');

  const TIER_RANK = { seed: 1, growth: 2, kingdom: 3 };

  // Handle tier selection: detects Upgrade vs Downgrade
  const handleSelectTier = async (targetTierKey) => {
    if (!activeChurchId) return;
    if (targetTierKey === sub.tier) return;

    const currentRank = TIER_RANK[sub.tier] || 1;
    const targetRank = TIER_RANK[targetTierKey] || 1;

    // If downgrading: open Downgrade Advisory Modal with pre-flight quota checks
    if (targetRank < currentRank) {
      setDowngradeModalTarget(targetTierKey);
      return;
    }

    // If upgrading: open manual bank transfer/GCash payment modal
    setManualTier(targetTierKey);
    setIsManualModalOpen(true);
  };

  // Confirm and schedule downgrade at period end
  const handleConfirmDowngrade = async () => {
    if (!activeChurchId || !downgradeModalTarget) return;
    setIsSchedulingDowngrade(true);
    try {
      const targetConfig = SUBSCRIPTION_TIERS[downgradeModalTarget];
      const scheduled = await scheduleChurchDowngrade(activeChurchId, downgradeModalTarget, {
        userId: currentUser?.uid
      });

      if (scheduled) {
        setFeedbackMsg({
          text: `Plan change scheduled! You will transition to ${targetConfig.name} on ${formatDate(scheduled.scheduledEffectiveDate)}.`,
          type: 'success'
        });
      } else {
        setFeedbackMsg({
          text: `Plan successfully changed to ${targetConfig.name}.`,
          type: 'success'
        });
      }
      setDowngradeModalTarget(null);
    } catch (err) {
      console.error('Failed to schedule downgrade:', err);
      alert(err.message || 'Failed to schedule plan change');
    } finally {
      setIsSchedulingDowngrade(false);
      setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 6000);
    }
  };

  // Cancel scheduled downgrade
  const handleCancelScheduledDowngrade = async () => {
    if (!activeChurchId) return;
    try {
      await cancelScheduledDowngrade(activeChurchId);
      setFeedbackMsg({
        text: 'Scheduled downgrade cancelled. You will remain on your current plan!',
        type: 'success'
      });
    } catch (err) {
      alert(err.message || 'Failed to cancel scheduled downgrade');
    }
  };

  const getStatusBadge = () => {
    if (sub.subscription?.isSponsored) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Gift size={12} />
          <span>Complimentary Sponsorship</span>
        </span>
      );
    }
    if (sub.isTrial) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={12} />
          <span>14-Day Free Trial ({sub.daysRemaining} days left)</span>
        </span>
      );
    }
    if (sub.isPastDue || sub.isGracePeriod) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle size={12} />
          <span>Past Due ({sub.daysRemaining}d Grace Period)</span>
        </span>
      );
    }
    if (sub.isSeed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check size={12} />
          <span>Free Forever</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Check size={12} />
        <span>Active & In Good Standing</span>
      </span>
    );
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {feedbackMsg.text && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg({ text: '', type: '' })} className="text-xs font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Sponsored Banner */}
      {sub.subscription?.isSponsored && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-purple-200 flex items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
              <Gift size={20} />
            </div>
            <div>
              <span className="font-extrabold text-purple-900 block">
                Kingdom Mission Partnership Sponsorship Active
              </span>
              <span className="text-purple-700 text-xs">
                Your church workspace is granted 100% complimentary access for ministry enablement.
              </span>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-purple-600 text-white rounded-full">
            Sponsored
          </span>
        </div>
      )}

      {/* Scheduled Downgrade Banner */}
      {sub.scheduledChange && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm animate-in fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-950">
                  Plan Downgrade Scheduled
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {SUBSCRIPTION_TIERS[sub.scheduledChange.targetTier]?.name || sub.scheduledChange.targetTier}
                </span>
              </div>
              <p className="text-amber-900 text-xs mt-0.5">
                Effective on <strong>{formatDate(sub.scheduledChange.scheduledEffectiveDate)}</strong>. You will retain all {sub.tierConfig.name} plan privileges and quotas until the end of your billing cycle.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelScheduledDowngrade}
            className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100/70 shrink-0 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Undo2 size={13} />
            <span>Keep Current Plan</span>
          </button>
        </div>
      )}

      {/* Manual Payment Under Review Banner */}
      {pendingSubmission && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-950">
                  Manual Payment Verification in Progress
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">
                  {pendingSubmission.referenceCode}
                </span>
              </div>
              <p className="text-amber-800 text-xs mt-0.5">
                ₱{pendingSubmission.amount?.toLocaleString()} ({pendingSubmission.tier?.toUpperCase()} Plan) deposited to {pendingSubmission.receivingBankName}. Super Admin receipt verification is currently in progress.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingSubmission.receiptUrl && (
              <button
                type="button"
                onClick={() => window.open(pendingSubmission.receiptUrl, '_blank')}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-900 hover:bg-amber-50 font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <Eye size={13} />
                <span>View Receipt</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manual Payment Rejected Banner */}
      {latestRejectedSubmission && !pendingSubmission && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="font-extrabold text-rose-950 block">
                Previous Payment Receipt Could Not Be Verified
              </span>
              <span className="text-rose-800 text-xs block mt-0.5">
                Reason: {latestRejectedSubmission.rejectionReason || 'Receipt details could not be matched with bank statement.'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setManualTier(latestRejectedSubmission.tier || 'growth');
              setIsManualModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-church-rose text-white font-bold text-xs hover:bg-church-ruby shrink-0 shadow-sm"
          >
            Re-upload Payment Proof
          </button>
        </div>
      )}

      {/* Row 1: Current Plan & Quotas Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Plan Overview (7 cols) */}
        <div className="lg:col-span-7">
          <SoftCard className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-church-rose/10 text-church-rose flex items-center justify-center font-black">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-church-navy leading-tight">Active Plan & Renewal</h2>
                    <p className="text-[11px] text-church-slate font-medium">Workspace billing details & lifecycle</p>
                  </div>
                </div>
                {getStatusBadge()}
              </div>

              <div className="mt-4 p-5 rounded-2xl bg-church-canvas border border-gray-100 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="text-2xl font-black text-church-navy">{sub.tierConfig.name}</div>
                  <div className="text-xs text-church-slate mt-0.5">{sub.tierConfig.tagline}</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-black text-church-charcoal">
                    {sub.subscription?.isSponsored ? '₱0 (Sponsored)' : sub.tierConfig.price}
                  </div>
                  <div className="text-xs text-church-slate">
                    {sub.isSeed ? 'Free forever' : `Billed ${sub.tierConfig.period}`}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-church-slate font-medium block text-[11px]">Billing Cycle</span>
                  <span className="font-bold text-church-navy capitalize">
                    {sub.isSeed ? 'Lifetime Free' : sub.subscription?.isSponsored ? 'Sponsored' : 'Monthly Recurring'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-church-slate font-medium block text-[11px]">
                    {sub.isTrial ? 'Trial Ends' : 'Next Renewal'}
                  </span>
                  <span className="font-bold text-church-navy">
                    {sub.isSeed ? 'Indefinite' : formatDate(sub.isTrial ? sub.trialEndDate : sub.currentPeriodEnd)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 col-span-2 sm:col-span-1">
                  <span className="text-church-slate font-medium block text-[11px]">Payment Method</span>
                  <span className="font-bold text-church-navy flex items-center gap-1.5">
                    <Building2 size={13} className="text-church-rose" />
                    <span>Direct Bank & GCash</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-church-slate">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Manual bank deposits reconciled & verified by platform finance administrators.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManualTier(sub.isSeed ? 'growth' : sub.tier);
                  setIsManualModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-church-rose hover:bg-church-ruby text-white text-xs font-bold shadow-sm transition-all"
              >
                <Building2 size={14} />
                <span>Submit Bank / GCash Payment</span>
              </button>
            </div>
          </SoftCard>
        </div>

        {/* Quota & Capacity Usage (5 cols) */}
        <div className="lg:col-span-5">
          <SoftCard className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Zap size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-church-navy leading-tight">Tier Quotas & Capacity</h2>
                  <p className="text-[11px] text-church-slate font-medium">Real-time allocation across resources</p>
                </div>
              </div>

              {/* Members Usage Bar */}
              <div className="p-4 rounded-2xl bg-church-canvas border border-gray-100 mb-4">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="flex items-center gap-1.5 text-church-navy">
                    <Users size={14} className="text-church-slate" />
                    <span>Active Member Profiles</span>
                  </span>
                  <span className="text-church-charcoal">
                    {limits.currentMembersCount} / {sub.isKingdom ? 'Unlimited' : limits.maxMembers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      limits.memberUsagePercent >= 90
                        ? 'bg-red-500'
                        : limits.memberUsagePercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-gradient-coram'
                    }`}
                    style={{ width: `${sub.isKingdom ? 15 : limits.memberUsagePercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-church-slate mt-2">
                  {sub.isKingdom
                    ? 'Unlimited member capacity available.'
                    : `${Math.max(0, limits.maxMembers - limits.currentMembersCount)} member slot(s) remaining on this plan.`}
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-church-slate">Sermon Media Storage:</span>
                  <span className="font-bold text-church-navy">
                    {sub.isKingdom 
                      ? '50 GB Video & Audio Media Storage' 
                      : sub.isGrowth 
                      ? '20 GB / Month Video & Audio' 
                      : '2 GB Audio Archive Storage'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-church-slate">Giving Funds & Channels:</span>
                  <span className="font-bold text-church-navy">
                    {sub.isKingdom ? 'Unlimited Funds & Campaigns' : 'Unlimited Giving Funds'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-church-slate">Volunteer Rostering & Setlists:</span>
                  <span className="font-bold text-church-navy">
                    {sub.isSeed ? 'Restricted to Growth+' : 'Full Access'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-church-slate">Financial PDF Statements:</span>
                  <span className="font-bold text-church-navy">Board-Ready 1-Click</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-purple-50/70 text-purple-900 text-xs font-semibold flex items-center justify-between">
              <span>Need unlimited members and unmetered sermon storage?</span>
              <button
                onClick={() => {
                  setManualTier('kingdom');
                  setIsManualModalOpen(true);
                }}
                className="text-purple-700 font-extrabold hover:underline"
              >
                Kingdom Plan
              </button>
            </div>
          </SoftCard>
        </div>
      </div>

      {/* Row 2: Cloud Storage & Monthly Quota Monitoring */}
      <SoftCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <HardDrive size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-church-navy leading-tight">
                  Cloud Storage & Monthly Quota Monitor
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  storage.usagePercentage >= 95
                    ? 'bg-rose-100 text-rose-800'
                    : storage.usagePercentage >= 80
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {storage.usagePercentage >= 95
                    ? 'Near Capacity'
                    : storage.usagePercentage >= 80
                    ? 'Approaching Limit'
                    : 'Healthy Allocation'}
                </span>
              </div>
              <p className="text-[11px] text-church-slate font-medium">
                Live metering across sermon archives, member directory, and church media assets
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-church-slate block">Current Consumption</span>
            <span className="text-lg font-black text-church-navy">
              {storage.totalGbFormatted} <span className="text-xs font-semibold text-church-slate">/ {storage.quotaGbFormatted}</span>
            </span>
          </div>
        </div>

        {/* Warning Banner if >= 80% */}
        {storage.isNearLimit && (
          <div className={`p-4 rounded-2xl mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
            storage.isOverLimit 
              ? 'bg-rose-50 border border-rose-200 text-rose-900' 
              : 'bg-amber-50 border border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className={storage.isOverLimit ? 'text-rose-600 shrink-0' : 'text-amber-600 shrink-0'} />
              <div>
                <span className="font-bold block">
                  {storage.isOverLimit 
                    ? 'Storage Limit Exceeded — New uploads are paused' 
                    : `Storage is at ${storage.usagePercentage}% capacity (${storage.remainingFormatted} remaining)`}
                </span>
                <span className="text-[11px] opacity-80">
                  {sub.isGrowth
                    ? 'Upgrade to Kingdom Network for 50 GB of storage and unlimited member accounts.'
                    : sub.isSeed
                    ? 'Upgrade to Growth Ministry for 20 GB of storage and 250 member accounts.'
                    : 'Consider deleting older sermon video files to reclaim cloud storage space.'}
                </span>
              </div>
            </div>
            {!sub.isKingdom && (
              <button
                type="button"
                onClick={() => {
                  setManualTier(sub.isSeed ? 'growth' : 'kingdom');
                  setIsManualModalOpen(true);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 shadow-sm transition-all ${
                  storage.isOverLimit
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                Upgrade to {sub.isSeed ? 'Growth (20 GB)' : 'Kingdom (50 GB)'}
              </button>
            )}
          </div>
        )}

        {/* Visual Storage Progress Bar */}
        <div className="p-4 rounded-2xl bg-church-canvas border border-gray-100 mb-6">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-church-navy">Total Cloud Footprint</span>
            <span className="text-church-charcoal">{storage.usagePercentage}% of {storage.quotaGbFormatted}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                storage.usagePercentage >= 95
                  ? 'bg-rose-500'
                  : storage.usagePercentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(3, storage.usagePercentage))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-church-slate mt-2">
            <span>Used: <strong>{storage.totalGbFormatted}</strong></span>
            <span>Available: <strong>{storage.remainingFormatted}</strong></span>
            <span>Plan Cap: <strong>{storage.quotaGbFormatted}</strong></span>
          </div>
        </div>

        {/* Category Breakdown Grid */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-church-navy uppercase tracking-wider mb-3">
            Storage Breakdown by Resource Category
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Category 1: Sermons */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-church-rose flex items-center justify-center shrink-0">
                <Film size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-church-slate font-medium block truncate">Sermons & Media</span>
                <span className="text-sm font-extrabold text-church-navy block">
                  {storage.byCategory.sermonsFormatted}
                </span>
                <span className="text-[10px] text-church-slate">
                  {storage.byCategory.sermonsPercent}% of tier quota
                </span>
              </div>
            </div>

            {/* Category 2: Member Profiles */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-church-slate font-medium block truncate">Member Profiles</span>
                <span className="text-sm font-extrabold text-church-navy block">
                  {storage.byCategory.membersFormatted}
                </span>
                <span className="text-[10px] text-church-slate">Avatars & records</span>
              </div>
            </div>

            {/* Category 3: Discipleship */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-church-slate font-medium block truncate">Discipleship & Guides</span>
                <span className="text-sm font-extrabold text-church-navy block">
                  {storage.byCategory.discipleshipFormatted}
                </span>
                <span className="text-[10px] text-church-slate">Study attachments</span>
              </div>
            </div>

            {/* Category 4: Giving Receipts */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Receipt size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-church-slate font-medium block truncate">Giving Receipts</span>
                <span className="text-sm font-extrabold text-church-navy block">
                  {storage.byCategory.givingReceiptsFormatted}
                </span>
                <span className="text-[10px] text-church-slate">Bank transfer slips</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-[11px] text-church-slate gap-2">
          <span>
            💡 <strong>Optimization Tip:</strong> Audio sermons require ~25-45 MB each. 720p compressed video sermons require ~150-300 MB each.
          </span>
          <span className="font-semibold text-church-navy">
            Allocated: {storage.quotaGbFormatted} ({sub.tierConfig.name})
          </span>
        </div>
      </SoftCard>

      {/* Row 3: Plan Comparison & Tier Switching */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-black text-church-navy">Select Church Plan</h3>
          <p className="text-xs text-church-slate">
            Change or upgrade your church subscription tier anytime. Upgrades are activated instantaneously.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(SUBSCRIPTION_TIERS).map((plan) => {
            const isCurrent = sub.tier === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 transition-all relative flex flex-col justify-between border-2 ${
                  isCurrent
                    ? 'bg-white border-church-rose shadow-church-glow'
                    : 'bg-white border-gray-100 hover:border-gray-300 shadow-church-soft'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-church-rose text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-sm tracking-wider">
                    Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-church-slate">
                      {plan.name}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Current Tier
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <span className="text-3xl font-black text-church-navy">{plan.price}</span>
                    <span className="text-xs text-church-slate ml-1">/{plan.period}</span>
                  </div>

                  <p className="text-xs text-church-slate mb-5 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="space-y-2.5 mb-6 text-xs text-church-charcoal">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full h-11 rounded-full font-bold text-xs bg-gray-100 text-church-slate cursor-default flex items-center justify-center"
                    >
                      Active Plan
                    </button>
                  ) : sub.scheduledChange?.targetTier === plan.id ? (
                    <div className="space-y-1.5">
                      <div className="w-full h-11 px-3 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center text-center">
                        Downgrade Scheduled ({formatDate(sub.scheduledChange.scheduledEffectiveDate)})
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelScheduledDowngrade}
                        className="w-full py-1.5 text-xs font-bold text-amber-800 hover:underline text-center block"
                      >
                        Keep Current Plan (Undo)
                      </button>
                    </div>
                  ) : TIER_RANK[plan.id] < TIER_RANK[sub.tier] ? (
                    <button
                      type="button"
                      onClick={() => handleSelectTier(plan.id)}
                      className="w-full h-11 rounded-full font-bold text-xs bg-gray-50 hover:bg-gray-100 text-church-charcoal border border-gray-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownRight size={14} className="text-church-slate shrink-0" />
                      <span>Schedule Downgrade</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <GradientButton
                        onClick={() => {
                          setManualTier(plan.id);
                          setIsManualModalOpen(true);
                        }}
                        icon={ArrowUpRight}
                        size="md"
                        className="w-full justify-center text-xs sm:text-sm px-3"
                      >
                        Upgrade to {plan.name}
                      </GradientButton>
                      <p className="text-[11px] text-center text-church-slate font-medium">
                        Pay via direct bank transfer or GCash
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Billing & Invoice History */}
      <SoftCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-church-navy/5 text-church-navy flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold">
              <Receipt size={20} className="text-church-navy" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-church-navy">Billing & Official Invoices</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Audit-Ready
                </span>
              </div>
              <p className="text-xs text-church-slate mt-0.5">
                Official BIR/tax-compliant invoices, payment lifecycle, and manual bank deposit receipts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-2xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setHistoryTab('invoices')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                historyTab === 'invoices' 
                  ? 'bg-white shadow text-church-navy font-bold' 
                  : 'text-church-slate hover:text-church-navy'
              }`}
            >
              <Receipt size={13} className={historyTab === 'invoices' ? 'text-church-rose' : 'text-church-slate'} />
              <span>Tax Invoices</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                historyTab === 'invoices' ? 'bg-church-rose/10 text-church-rose' : 'bg-gray-200 text-church-slate'
              }`}>
                {invoices.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('submissions')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                historyTab === 'submissions' 
                  ? 'bg-white shadow text-church-rose font-bold' 
                  : 'text-church-slate hover:text-church-navy'
              }`}
            >
              <Building2 size={13} className={historyTab === 'submissions' ? 'text-church-rose' : 'text-church-slate'} />
              <span>Bank Deposits</span>
              {pendingSubmission && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                historyTab === 'submissions' ? 'bg-church-rose/10 text-church-rose' : 'bg-gray-200 text-church-slate'
              }`}>
                {submissions.length}
              </span>
            </button>
          </div>
        </div>

        {historyTab === 'invoices' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-church-charcoal">
              <thead>
                <tr className="border-b border-gray-100 text-church-slate text-[11px] font-bold uppercase tracking-wider bg-church-canvas/50">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Issued Date</th>
                  <th className="py-3 px-3">Plan & Coverage</th>
                  <th className="py-3 px-3">Payment Channel</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-[11px] font-bold text-church-navy">
                          {inv.invoiceNumber || inv.id}
                        </div>
                        {inv.bankReferenceNumber && (
                          <div className="text-[10px] font-mono text-church-slate truncate max-w-[120px]">
                            Ref: {inv.bankReferenceNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-church-charcoal">
                          {formatDate(inv.paidAt || inv.createdAt || inv.periodStart)}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-church-navy leading-snug">
                          {inv.description}
                        </div>
                        <div className="text-[11px] text-church-slate mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</span>
                          {inv.rolloverDays > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              <TrendingUp size={9} />
                              +{inv.rolloverDays}d Rollover
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-church-charcoal block">
                          {inv.paymentMethod || 'Manual Bank Transfer'}
                        </span>
                        <span className="text-[11px] text-church-slate">
                          {inv.bankName || 'Direct Deposit'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-sm font-black text-church-charcoal">
                          ₱{(Number(inv.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          <span>{inv.status || 'Paid'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForModal(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-church-navy font-bold text-xs transition-colors shadow-xs"
                            title="View Full Invoice Details"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => generateSubscriptionReceiptPdf({
                              church: sub.rawChurch,
                              invoice: inv,
                              subscription: sub
                            })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-church-rose/10 hover:bg-church-rose/20 text-church-rose font-bold text-xs transition-colors shadow-xs"
                            title="Download Official Tax PDF"
                          >
                            <Download size={12} />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-church-slate">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 text-church-slate flex items-center justify-center mb-2.5">
                          <Receipt size={22} className="text-gray-400" />
                        </div>
                        <p className="font-bold text-xs text-church-navy">No tax invoices or billing records yet</p>
                        <p className="text-[11px] text-church-slate max-w-sm mt-1 leading-relaxed">
                          Official tax invoices and digital receipts are generated automatically once a subscription payment is approved.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-church-charcoal">
              <thead>
                <tr className="border-b border-gray-100 text-church-slate text-[11px] font-bold uppercase tracking-wider">
                  <th className="pb-3">Ref Code</th>
                  <th className="pb-3">Transfer Date</th>
                  <th className="pb-3">Plan & Bank</th>
                  <th className="pb-3">Bank Ref #</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Review Status</th>
                  <th className="pb-3 text-right">Proof File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {submissions.length > 0 ? (
                  submissions.map((subm) => (
                    <tr key={subm.id}>
                      <td className="py-3.5 font-mono text-[11px] font-bold text-church-navy">
                        {subm.referenceCode || subm.id}
                      </td>
                      <td className="py-3.5">{formatDate(subm.dateTransferred || subm.createdAt)}</td>
                      <td className="py-3.5">
                        <span className="font-bold text-church-navy block capitalize">{subm.tier} Plan</span>
                        <span className="text-[11px] text-church-slate">{subm.receivingBankName}</span>
                      </td>
                      <td className="py-3.5 font-mono text-church-charcoal">
                        {subm.bankReferenceNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 font-black text-church-charcoal">
                        ₱{(subm.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        {subm.status === 'pending_review' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase flex items-center gap-1 w-max">
                            <Clock size={11} />
                            <span>Under Review</span>
                          </span>
                        ) : subm.status === 'verified_paid' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1 w-max">
                            <Check size={11} />
                            <span>Verified & Active</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 uppercase flex items-center gap-1 w-max">
                            <AlertTriangle size={11} />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        {subm.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => window.open(subm.receiptUrl, '_blank')}
                            className="inline-flex items-center gap-1 text-church-rose hover:text-church-ruby font-bold"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-church-slate">
                      <div className="flex flex-col items-center justify-center">
                        <Building2 size={24} className="text-gray-300 mb-1" />
                        <span className="font-medium text-xs">No manual bank transfer submissions yet.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setManualTier(sub.isSeed ? 'growth' : sub.tier);
                            setIsManualModalOpen(true);
                          }}
                          className="mt-2 text-church-rose font-bold hover:underline"
                        >
                          Submit your first bank receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SoftCard>

      {/* Manual Payment Modal */}
      <ManualPaymentModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        church={sub.rawChurch}
        currentUser={currentUser}
        initialTier={manualTier}
        onSuccess={() => {
          setFeedbackMsg({
            text: 'Proof of payment submitted successfully! Super Admin will review your transaction shortly.',
            type: 'success'
          });
        }}
      />

      {/* Interactive Invoice Details Modal */}
      <InvoiceDetailModal
        isOpen={Boolean(selectedInvoiceForModal)}
        onClose={() => setSelectedInvoiceForModal(null)}
        invoice={selectedInvoiceForModal}
        church={sub.rawChurch}
        subscription={sub}
      />


      {/* Downgrade Advisory Modal with Pre-flight Quota Auditing */}
      {downgradeModalTarget && (() => {
        const targetConfig = SUBSCRIPTION_TIERS[downgradeModalTarget];
        const memberCount = limits.currentMembersCount || 0;
        const targetMaxMembers = targetConfig?.quotas?.maxMembers || 50;
        const isMembersOver = memberCount > targetMaxMembers;

        const targetStorageGb = targetConfig?.quotas?.sermonStorageGb || 2;
        const storageBytes = storage.totalBytes || 0;
        const targetStorageBytes = targetStorageGb * 1024 * 1024 * 1024;
        const isStorageOver = storageBytes > targetStorageBytes;

        const effectiveDateStr = sub.currentPeriodEnd 
          ? formatDate(sub.currentPeriodEnd) 
          : 'Immediately';

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden relative p-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <ArrowDownRight size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-church-navy">
                      Schedule Plan Downgrade
                    </h3>
                    <span className="text-xs text-church-slate">
                      Transitioning from {sub.tierConfig.name} to {targetConfig.name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDowngradeModalTarget(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Timing Information */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 flex items-start gap-2.5">
                  <Calendar size={18} className="shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Effective Date: {effectiveDateStr}</strong>
                    <span>
                      You retain full access to all {sub.tierConfig.name} tools and quotas until this billing cycle ends. You will not be charged again.
                    </span>
                  </div>
                </div>

                {/* Pre-flight Quota Checks */}
                <div className="space-y-2">
                  <h4 className="font-bold text-church-navy uppercase tracking-wider text-[11px]">
                    Pre-Flight Quota Audit
                  </h4>

                  {/* Members Audit */}
                  <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                    isMembersOver ? 'bg-amber-50/70 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {isMembersOver ? (
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-church-navy">Congregation Members</strong>
                        <span className="font-bold text-church-charcoal">
                          {memberCount} / {targetMaxMembers >= 999999 ? 'Unlimited' : targetMaxMembers}
                        </span>
                      </div>
                      {isMembersOver && (
                        <p className="text-[11px] text-amber-900 mt-1">
                          ⚠️ You currently have {memberCount} members (Target limit: {targetMaxMembers}). Existing profiles will remain safe, but adding new members will be paused until member count is within limits.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Media Storage Audit */}
                  <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                    isStorageOver ? 'bg-amber-50/70 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {isStorageOver ? (
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-church-navy">Cloud Sermon Storage</strong>
                        <span className="font-bold text-church-charcoal">
                          {storage.totalGbFormatted} / {targetStorageGb} GB
                        </span>
                      </div>
                      {isStorageOver && (
                        <p className="text-[11px] text-amber-900 mt-1">
                          ⚠️ Your storage exceeds {targetStorageGb} GB. No sermon videos or files will be deleted, but uploading new video files will be paused upon downgrade.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Non-Destructive Data Guarantee */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 flex items-start gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[11px]">
                    <strong>Coram Deo Zero Data Loss Guarantee:</strong> We never delete your church's records, sermons, tithes, or member directories during any plan transition.
                  </span>
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setDowngradeModalTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-church-slate hover:bg-gray-100"
                  >
                    Keep Current Plan
                  </button>
                  <button
                    type="button"
                    disabled={isSchedulingDowngrade}
                    onClick={handleConfirmDowngrade}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowDownRight size={14} />
                    <span>{isSchedulingDowngrade ? 'Scheduling...' : `Confirm Downgrade for ${effectiveDateStr}`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
