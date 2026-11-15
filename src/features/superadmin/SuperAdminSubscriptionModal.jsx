import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Gift, 
  HardDrive,
  RotateCcw,
  Users,
  Film,
  BookOpen,
  Receipt,
  AlertTriangle,
  Play,
  CalendarClock
} from 'lucide-react';
import { 
  changeChurchTier, 
  extendChurchTrial, 
  grantComplimentaryAccess,
  grantStorageQuotaExtension,
  resetStorageQuotaOverride,
  cancelScheduledDowngrade,
  executeScheduledChangeNow,
  updateChurchPeriodEnd
} from '../../services/subscriptionService';
import { SUBSCRIPTION_TIERS, getRemainingDays } from '../../config/subscriptions';
import { formatBytes } from '../subscription/hooks/useStorageQuota';
import Modal from '../../components/ui/Modal';

export default function SuperAdminSubscriptionModal({ isOpen, onClose, church, onUpdated }) {
  const sub = church?.subscription || {};
  const currentTier = (sub.tier || church?.tier || 'seed').toLowerCase();
  const currentStatus = sub.status || (currentTier === 'seed' ? 'active' : 'trialing');

  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [customGb, setCustomGb] = useState('');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (church) {
      const tier = (church.subscription?.tier || church.tier || 'seed').toLowerCase();
      setSelectedTier(tier);
      setMessage({ text: '', type: '' });
      setCustomGb('');
      setExtensionReason('');
      if (church.subscription?.currentPeriodEnd) {
        try {
          const dateStr = new Date(church.subscription.currentPeriodEnd).toISOString().split('T')[0];
          setCustomExpiryDate(dateStr);
        } catch {
          setCustomExpiryDate('');
        }
      } else {
        setCustomExpiryDate('');
      }
    }
  }, [church, isOpen]);

  if (!isOpen || !church) return null;

  const trialDaysRemaining = sub.trialEndDate ? getRemainingDays(sub.trialEndDate) : 0;
  const paidDaysRemaining = sub.currentPeriodEnd ? getRemainingDays(sub.currentPeriodEnd) : 0;
  const scheduledChange = sub.scheduledChange;

  const handleCancelDowngrade = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await cancelScheduledDowngrade(church.id);
      setMessage({ text: 'Scheduled downgrade successfully cancelled. Church remains on active plan.', type: 'success' });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to cancel scheduled downgrade.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDowngradeNow = async () => {
    if (!scheduledChange) return;
    const confirmExec = window.confirm(`Are you sure you want to immediately execute the downgrade to ${scheduledChange.targetTier?.toUpperCase()}?\n\nPlan quotas will be updated now.`);
    if (!confirmExec) return;

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await executeScheduledChangeNow(church.id, scheduledChange);
      setMessage({ text: `Downgrade to ${scheduledChange.targetTier?.toUpperCase()} executed immediately!`, type: 'success' });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to execute scheduled downgrade.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTier = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await changeChurchTier(church.id, selectedTier);
      setMessage({ text: `Plan successfully updated to ${SUBSCRIPTION_TIERS[selectedTier]?.name}!`, type: 'success' });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to change tier.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = async (days) => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const newEnd = await extendChurchTrial(church.id, days);
      const dateStr = new Date(newEnd).toLocaleDateString();
      setMessage({ text: `Trial extended by +${days} days (valid through ${dateStr}).`, type: 'success' });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to extend trial.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendPaidPeriod = async (days) => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const baseDate = sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > new Date()
        ? new Date(sub.currentPeriodEnd)
        : new Date();
      const newEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      await updateChurchPeriodEnd(church.id, newEnd, `SuperAdmin +${days} days paid extension`);
      setMessage({ text: `Subscription validity extended by +${days} days (valid through ${new Date(newEnd).toLocaleDateString()}).`, type: 'success' });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to extend subscription validity.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExactExpiryDate = async () => {
    if (!customExpiryDate) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const newEndIso = new Date(`${customExpiryDate}T23:59:59Z`).toISOString();
      await updateChurchPeriodEnd(church.id, newEndIso, extensionReason || 'SuperAdmin date adjustment');
      setMessage({ text: `Subscription expiry set to ${new Date(newEndIso).toLocaleDateString()}.`, type: 'success' });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update expiry date.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantSponsorship = async (months) => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await grantComplimentaryAccess(church.id, selectedTier === 'seed' ? 'growth' : selectedTier, months);
      setMessage({ 
        text: `Complimentary ${months >= 999 ? 'Lifetime' : `${months}-Month`} sponsorship granted!`, 
        type: 'success' 
      });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to grant sponsorship.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const quotas = sub.quotas || {};
  const currentQuotaGb = quotas.sermonStorageGb || (currentTier === 'kingdom' ? 50 : currentTier === 'growth' ? 20 : 2);
  const storageOverride = sub.storageOverride;

  const handleGrantStorageExtension = async (gb) => {
    const numGb = Number(gb);
    if (!numGb || numGb <= 0) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await grantStorageQuotaExtension(church.id, numGb, 'Special Conference / Revival Event');
      setMessage({ text: `Granted +${numGb} GB storage boost (total quota is now ${currentQuotaGb + numGb} GB)!`, type: 'success' });
      setCustomGb('');
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to grant storage extension.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetStorage = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await resetStorageQuotaOverride(church.id, currentTier);
      setMessage({ text: `Storage quota successfully reset to default.`, type: 'success' });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to reset storage.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Subscription & Quotas"
      subtitle={`${church.name} • Workspace ID: ${church.id}`}
      icon={ShieldCheck}
      maxWidth="xl"
      badge={
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#162533] text-white">
          SuperAdmin
        </span>
      }
      footer={
        <div className="flex justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Feedback Message */}
        {message.text && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ text: '', type: '' })} className="font-bold underline ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* Scheduled Downgrade Active Alert */}
        {scheduledChange && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-3 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <span className="font-black text-amber-950 uppercase tracking-wider text-[11px] block">
                    Scheduled Plan Downgrade in Progress
                  </span>
                  <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                    Scheduled to downgrade to <strong className="uppercase font-black text-amber-950">{SUBSCRIPTION_TIERS[scheduledChange.targetTier]?.name || scheduledChange.targetTier} Plan</strong> on{' '}
                    <strong>{scheduledChange.scheduledEffectiveDate ? new Date(scheduledChange.scheduledEffectiveDate).toLocaleDateString() : 'Current Period End'}</strong>.
                  </p>
                  {scheduledChange.reason && (
                    <span className="text-[11px] text-amber-700/90 italic block mt-1">
                      Reason: "{scheduledChange.reason}"
                    </span>
                  )}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-200/90 text-amber-950 font-black text-[10px] tracking-wide shrink-0">
                PENDING
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/80">
              <span className="text-[11px] text-amber-900 font-medium">
                Workspace maintains current paid tier limits until effective date.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelDowngrade}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 font-bold text-xs transition-all disabled:opacity-50 shadow-2xs"
                >
                  Cancel Downgrade
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDowngradeNow}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <Play size={11} fill="currentColor" />
                  <span>Execute Immediately</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Status Overview & Live Resource Footprint */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 font-medium block text-[11px]">Active Plan Tier</span>
              <span className="font-extrabold text-slate-900 capitalize text-sm">
                {SUBSCRIPTION_TIERS[currentTier]?.name || currentTier}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block text-[11px]">Lifecycle Status</span>
              <span className="font-extrabold capitalize text-sm text-slate-800">
                {sub.isSponsored 
                  ? '⭐ Sponsored / Complimentary'
                  : scheduledChange
                  ? '⏳ Downgrade Scheduled'
                  : currentStatus === 'trialing' 
                  ? `⏳ Trial (${trialDaysRemaining}d left)`
                  : currentStatus}
              </span>
            </div>
          </div>

          {/* Storage & Member Resource Health */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <HardDrive size={13} className="text-[#2C4A60]" />
                <span>Cloud Storage Footprint:</span>
              </span>
              <span className="font-extrabold text-slate-800">
                {formatBytes(church.stats?.storage?.totalBytesUsed || 0)} / {currentQuotaGb} GB
                <span className="ml-1 text-slate-500 font-medium">
                  ({Math.min(100, Math.round(((church.stats?.storage?.totalBytesUsed || 0) / (currentQuotaGb * 1024 * 1024 * 1024)) * 100))}%)
                </span>
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#2C4A60] to-teal-600 transition-all"
                style={{ 
                  width: `${Math.min(100, Math.max(2, Math.round(((church.stats?.storage?.totalBytesUsed || 0) / (currentQuotaGb * 1024 * 1024 * 1024)) * 100)))}%` 
                }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-1.5">
                <Film size={12} className="text-rose-500 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-500 block text-[9px] leading-tight">Sermons</span>
                  <strong className="text-slate-800">{formatBytes(church.stats?.storage?.byCategory?.sermonsBytes || 0)}</strong>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-1.5">
                <Users size={12} className="text-blue-500 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-500 block text-[9px] leading-tight">Members ({church.stats?.membersCount || 0})</span>
                  <strong className="text-slate-800">{formatBytes(church.stats?.storage?.byCategory?.membersBytes || 0)}</strong>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-1.5">
                <BookOpen size={12} className="text-purple-500 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-500 block text-[9px] leading-tight">Discipleship</span>
                  <strong className="text-slate-800">{formatBytes(church.stats?.storage?.byCategory?.discipleshipBytes || 0)}</strong>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-1.5">
                <Receipt size={12} className="text-emerald-500 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-500 block text-[9px] leading-tight">Receipts</span>
                  <strong className="text-slate-800">{formatBytes(church.stats?.storage?.byCategory?.givingReceiptsBytes || 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Override Plan Tier */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Override Plan Tier
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {Object.values(SUBSCRIPTION_TIERS).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedTier(p.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTier === p.id
                    ? 'border-[#2C4A60] bg-[#EBF2F7]/40 text-[#2C4A60] shadow-2xs font-bold ring-1 ring-[#2C4A60]'
                    : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                }`}
              >
                <div className="font-bold text-xs">{p.name}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">{p.price}</div>
              </button>
            ))}
          </div>

          {selectedTier !== currentTier && (
            <button
              type="button"
              onClick={handleUpdateTier}
              disabled={loading}
              className="mt-2 px-4 py-2 rounded-xl bg-[#162533] hover:bg-[#1E2E3D] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-2xs"
            >
              {loading ? 'Updating...' : `Apply ${SUBSCRIPTION_TIERS[selectedTier]?.name} Tier`}
            </button>
          )}
        </div>

        {/* Section 2: Paid Subscription Expiry & Extensions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <CalendarClock size={14} className="text-indigo-600" />
              <span>Paid Plan Expiry & Extensions</span>
            </div>
            <span className="text-[11px] font-bold text-slate-700">
              {sub.currentPeriodEnd 
                ? `Expires: ${new Date(sub.currentPeriodEnd).toLocaleDateString()} (${paidDaysRemaining > 0 ? `${paidDaysRemaining}d remaining` : 'Expired'})`
                : 'No expiry set (Seed / Lifetime)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleExtendPaidPeriod(15)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              +15 Days
            </button>
            <button
              type="button"
              onClick={() => handleExtendPaidPeriod(30)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              +30 Days (1 Mo)
            </button>
            <button
              type="button"
              onClick={() => handleExtendPaidPeriod(60)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              +60 Days (2 Mo)
            </button>
            <button
              type="button"
              onClick={() => handleExtendPaidPeriod(90)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              +90 Days (Quarter)
            </button>
          </div>

          {/* Exact Date Adjustment */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Set Date:</span>
              <input
                type="date"
                value={customExpiryDate}
                onChange={(e) => setCustomExpiryDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
              />
            </div>
            <input
              type="text"
              placeholder="Reason / Reference (e.g. Check cleared)"
              value={extensionReason}
              onChange={(e) => setExtensionReason(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleSaveExactExpiryDate}
              disabled={loading || !customExpiryDate}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-40 whitespace-nowrap shadow-2xs"
            >
              Save Date
            </button>
          </div>
        </div>

        {/* Section 3: Trial Extension */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Clock size={14} className="text-[#2C4A60]" />
            <span>Extend Free Trial Duration</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleExtendTrial(14)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              +14 Days Extension
            </button>
            <button
              type="button"
              onClick={() => handleExtendTrial(30)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              +30 Days Extension
            </button>
          </div>
        </div>

        {/* Section 4: Complimentary Sponsorship */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Gift size={14} className="text-purple-600" />
            <span>Grant Complimentary / Mission Sponsorship</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleGrantSponsorship(6)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              6-Month Sponsorship
            </button>
            <button
              type="button"
              onClick={() => handleGrantSponsorship(12)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              1-Year Sponsorship
            </button>
            <button
              type="button"
              onClick={() => handleGrantSponsorship(999)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 text-xs font-extrabold transition-all disabled:opacity-50"
            >
              Lifetime Sponsored
            </button>
          </div>
        </div>

        {/* Section 5: Cloud Storage Quota Override */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <HardDrive size={14} className="text-blue-600" />
              <span>Cloud Storage Quota Override</span>
            </div>
            <span className="text-[11px] font-bold text-slate-700">
              Quota: {currentQuotaGb} GB {storageOverride ? `(+${storageOverride.additionalGb} GB Boost Active)` : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleGrantStorageExtension(10)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              +10 GB Boost
            </button>
            <button
              type="button"
              onClick={() => handleGrantStorageExtension(20)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-all disabled:opacity-50"
            >
              +20 GB Boost
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="500"
                value={customGb}
                onChange={(e) => setCustomGb(e.target.value)}
                placeholder="Custom GB"
                className="w-24 px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
              />
              <button
                type="button"
                onClick={() => handleGrantStorageExtension(customGb)}
                disabled={loading || !customGb}
                className="px-3 py-1.5 rounded-xl bg-[#162533] text-white text-xs font-bold hover:bg-[#1E2E3D] transition-all disabled:opacity-40"
              >
                Apply
              </button>
            </div>

            {storageOverride && (
              <button
                type="button"
                onClick={handleResetStorage}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <RotateCcw size={12} />
                <span>Reset to Plan Default</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
