import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Sparkles, 
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
  Film
} from 'lucide-react';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';
import { useSubscription } from '../subscription/hooks/useSubscription';
import { useSubscriptionLimits } from '../subscription/hooks/useSubscriptionLimits';
import { useStorageQuota } from '../subscription/hooks/useStorageQuota';
import { SUBSCRIPTION_TIERS } from '../../config/subscriptions';
import { 
  changeChurchTier, 
  subscribeToChurchInvoices 
} from '../../services/subscriptionService';
import { generateSubscriptionReceiptPdf } from '../../utils/subscriptionReceiptPdfGenerator';
import { useAuth } from '../../context/AuthContext';

export default function SettingsSubscription({ churchId }) {
  const { userProfile } = useAuth();
  const sub = useSubscription();
  const limits = useSubscriptionLimits();
  const storage = useStorageQuota();
  const [switchingTier, setSwitchingTier] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });
  const [invoices, setInvoices] = useState([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    nameOnCard: 'Senior Pastor',
    cardNumber: '•••• •••• •••• 4242',
    expiry: '12/28',
    brand: 'Visa'
  });

  const activeChurchId = churchId || sub.rawChurch?.id;

  // Listen to real-time invoices subcollection
  useEffect(() => {
    if (!activeChurchId) return;
    const unsub = subscribeToChurchInvoices(activeChurchId, (list) => {
      setInvoices(list);
    });
    return () => unsub();
  }, [activeChurchId]);

  // Handle self-serve tier upgrade/downgrade
  const handleSelectTier = async (targetTierKey) => {
    if (!activeChurchId) return;
    if (targetTierKey === sub.tier) return;

    setSwitchingTier(targetTierKey);
    setFeedbackMsg({ text: '', type: '' });

    try {
      const targetConfig = SUBSCRIPTION_TIERS[targetTierKey];
      await changeChurchTier(activeChurchId, targetTierKey, {
        currency: sub.currency || 'PHP'
      });

      setFeedbackMsg({
        text: `Workspace successfully upgraded to the ${targetConfig.name} plan!`,
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to update subscription tier:', err);
      setFeedbackMsg({
        text: 'Failed to update plan. Please verify permissions or try again.',
        type: 'error'
      });
    } finally {
      setSwitchingTier(null);
      setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 6000);
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

      {/* Row 1: Current Plan & Quotas Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Plan Overview (7 cols) */}
        <div className="lg:col-span-7">
          <SoftCard className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-church-rose/10 text-church-rose flex items-center justify-center font-black">
                    <Sparkles size={18} />
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
                  <span className="text-church-slate font-medium block text-[11px]">Payment Gateway</span>
                  <span className="font-bold text-church-navy flex items-center gap-1">
                    <CreditCard size={13} className="text-church-rose" />
                    <span>Stripe Billing</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-church-slate">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Prorated billing, bank-grade 256-bit SSL encryption.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCardModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-church-rose hover:text-church-ruby transition-colors"
              >
                <span>Manage Payment Cards & Details</span>
                <ExternalLink size={13} />
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
                onClick={() => handleSelectTier('kingdom')}
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
                onClick={() => handleSelectTier(sub.isSeed ? 'growth' : 'kingdom')}
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
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-church-slate cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <GradientButton
                      onClick={() => handleSelectTier(plan.id)}
                      disabled={switchingTier === plan.id}
                      variant={plan.popular ? 'primary' : 'outline'}
                      size="md"
                      className="w-full"
                    >
                      {switchingTier === plan.id 
                        ? 'Updating Plan...' 
                        : plan.priceNum > sub.tierConfig.priceNum
                        ? `Upgrade to ${plan.name}`
                        : `Switch to ${plan.name}`}
                    </GradientButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Billing & Invoice History */}
      <SoftCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-church-navy">Billing & Receipt History</h3>
            <p className="text-xs text-church-slate">Official monthly VAT/tax invoices for your church board</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-church-charcoal">
            <thead>
              <tr className="border-b border-gray-100 text-church-slate text-[11px] font-bold uppercase tracking-wider">
                <th className="pb-3">Invoice #</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3.5 font-mono text-[11px] text-church-slate">{inv.invoiceNumber || inv.id}</td>
                    <td className="py-3.5">{formatDate(inv.periodStart || inv.createdAt)}</td>
                    <td className="py-3.5 font-bold text-church-navy">{inv.description}</td>
                    <td className="py-3.5 font-black text-church-charcoal">
                      ₱{(inv.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {inv.status || 'Paid'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => generateSubscriptionReceiptPdf({
                          church: sub.rawChurch,
                          invoice: inv,
                          subscription: sub
                        })}
                        className="inline-flex items-center gap-1 text-church-rose hover:text-church-ruby font-bold"
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3.5 font-mono text-[11px] text-church-slate">INV-00124</td>
                  <td className="py-3.5">{formatDate(sub.currentPeriodStart || new Date().toISOString())}</td>
                  <td className="py-3.5 font-bold text-church-navy">
                    {sub.tierConfig.name} Plan Activation ({sub.isSeed ? 'Free Forever' : '1 Month'})
                  </td>
                  <td className="py-3.5 font-black text-church-charcoal">
                    {sub.isSeed ? '₱0.00' : sub.tierConfig.price}
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Paid
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => generateSubscriptionReceiptPdf({
                        church: sub.rawChurch,
                        invoice: {
                          invoiceNumber: 'INV-00124',
                          description: `${sub.tierConfig.name} Plan Activation (${sub.isSeed ? 'Free Forever' : '1 Month'})`,
                          amount: sub.isSeed ? 0 : sub.tierConfig.priceNum,
                          status: 'paid',
                          periodStart: sub.currentPeriodStart || new Date().toISOString(),
                          periodEnd: sub.currentPeriodEnd || new Date().toISOString()
                        },
                        subscription: sub
                      })}
                      className="inline-flex items-center gap-1 text-church-rose hover:text-church-ruby font-bold"
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SoftCard>

      {/* Payment Method Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2 text-church-navy font-black text-lg">
                <CreditCard size={20} className="text-church-rose" />
                <span>Payment Method Details</span>
              </div>
              <button 
                onClick={() => setIsCardModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-md relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">Coram Deo Billing Card</span>
                  <span className="font-extrabold italic text-sm">{cardForm.brand}</span>
                </div>
                <div className="font-mono text-base tracking-widest mb-4">
                  {cardForm.cardNumber}
                </div>
                <div className="flex justify-between text-[10px] opacity-75">
                  <span>{cardForm.nameOnCard}</span>
                  <span>EXP: {cardForm.expiry}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-church-slate font-medium">
                <Lock size={14} className="text-emerald-600 shrink-0" />
                <span>Card data is securely handled via Stripe's encrypted token vault. We never store raw card numbers.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-church-slate hover:bg-gray-100"
                >
                  Close
                </button>
                <GradientButton
                  size="sm"
                  onClick={() => {
                    setIsCardModalOpen(false);
                    setFeedbackMsg({ text: 'Payment method updated successfully.', type: 'success' });
                  }}
                >
                  Save Payment Card
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
