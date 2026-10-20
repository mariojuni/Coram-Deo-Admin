import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, ArrowRight, X, ShieldAlert, Sparkles } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export default function SubscriptionBanner() {
  const navigate = useNavigate();
  const sub = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || sub.isLoading) return null;

  // Case 1A: Trial Expired
  if (sub.isTrialExpired) {
    return (
      <div className="mb-3 mx-2 md:mx-6 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs md:text-sm font-semibold shadow-sm transition-all border bg-rose-50 border-rose-200 text-rose-900">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <div className="truncate">
            <span className="font-extrabold mr-1">
              Your 14-day Free Trial has ended.
            </span>
            <span className="hidden sm:inline text-opacity-80">
              Activate your subscription plan to keep full access to worship, member directory, and cloud storage.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/admin/settings/billing')}
            className="px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all text-xs bg-rose-600 hover:bg-rose-700 text-white"
          >
            <span>Activate Plan</span>
            <ArrowRight size={13} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-black/5 rounded-lg text-gray-500 transition-colors"
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Case 1B: Trialing and nearing expiration (5 days or less)
  if (sub.isTrial && sub.daysRemaining <= 5) {
    const isUrgent = sub.daysRemaining <= 2;
    return (
      <div className={`mb-3 mx-2 md:mx-6 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs md:text-sm font-semibold shadow-sm transition-all border ${
        isUrgent 
          ? 'bg-rose-50 border-rose-200 text-rose-900' 
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <Clock size={16} />
          </div>
          <div className="truncate">
            <span className="font-extrabold mr-1">
              {sub.daysRemaining === 0 
                ? 'Trial ends today!' 
                : `${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'} remaining in your ${sub.tierConfig.name} trial.`}
            </span>
            <span className="hidden sm:inline text-opacity-80">
              Add payment details to ensure uninterrupted access to worship, members, and giving tools.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/admin/settings/billing')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all text-xs ${
              isUrgent
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <span>Activate Plan</span>
            <ArrowRight size={13} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-black/5 rounded-lg text-gray-500 transition-colors"
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Past Due / Grace Period Alert
  if (sub.isPastDue || sub.isGracePeriod) {
    return (
      <div className="mb-3 mx-2 md:mx-6 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs md:text-sm font-semibold bg-red-50 border border-red-200 text-red-900 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <ShieldAlert size={16} />
          </div>
          <div className="truncate">
            <span className="font-extrabold mr-1">Renewal payment pending.</span>
            <span className="hidden sm:inline">
              Your features remain fully active during your 7-day grace period ({sub.daysRemaining} days left).
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/admin/settings/billing')}
            className="px-3 py-1.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm text-xs"
          >
            <span>Update Card</span>
            <ArrowRight size={13} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Expired / Downgraded
  if (sub.status === 'expired') {
    return (
      <div className="mb-3 mx-2 md:mx-6 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs md:text-sm font-semibold bg-gray-50 border border-gray-200 text-gray-800 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="truncate">
            <span>Operating under <strong>Seed Fellowship</strong>. Upgrade to restore premium growth features.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/admin/settings/billing')}
            className="px-3 py-1.5 rounded-xl font-bold bg-church-charcoal hover:bg-black text-white flex items-center gap-1.5 shadow-sm text-xs"
          >
            <span>View Plans</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
