import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { SUBSCRIPTION_TIERS } from '../../../config/subscriptions';
import GradientButton from '../../../components/ui/GradientButton';

export default function UpgradeModal({ isOpen, onClose, title, message, targetTier = 'growth', reason = null }) {
  const navigate = useNavigate();
  const sub = useSubscription();

  if (!isOpen) return null;

  const resolvedTier = reason?.targetPlan || targetTier || (sub.isSeed ? 'growth' : 'kingdom');
  const targetPlan = SUBSCRIPTION_TIERS[resolvedTier] || SUBSCRIPTION_TIERS.growth;
  const resolvedMessage = reason?.reason || message || `Expand your congregation capacity and unlock advanced tools with the ${targetPlan.name} plan.`;
  const resolvedTitle = title || (reason ? 'Member Limit Reached' : 'Unlock Ministry Capabilities');

  const handleGoToBilling = () => {
    onClose();
    navigate('/admin/settings/billing');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-church-rose/10 via-purple-50 to-church-canvas p-6 border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/80 text-church-slate hover:text-church-charcoal transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-church-rose/15 text-church-rose text-xs font-black uppercase tracking-wider mb-2">
            <Zap size={13} />
            <span>Plan Limit Reached</span>
          </div>
          <h2 className="text-2xl font-black text-church-navy tracking-tight">
            {resolvedTitle}
          </h2>
          <p className="text-xs sm:text-sm text-church-slate mt-1">
            {resolvedMessage}
          </p>
        </div>

        {/* Modal Body: Target Plan Preview */}
        <div className="p-6 space-y-5">
          <div className="p-5 rounded-2xl bg-church-canvas border-2 border-church-rose/30 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-church-rose">
                Recommended Upgrade
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-church-rose text-white">
                Most Popular
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h3 className="text-xl font-black text-church-navy">{targetPlan.name}</h3>
                <p className="text-xs text-church-slate">{targetPlan.tagline}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-church-charcoal">{targetPlan.price}</span>
                <span className="text-xs text-church-slate">/{targetPlan.period}</span>
              </div>
            </div>

            <ul className="space-y-2 pt-3 border-t border-gray-200 text-xs font-medium text-church-charcoal">
              {targetPlan.features.slice(0, 4).map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-church-slate font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Cancel or change tiers anytime. Your existing congregation data is 100% safeguarded.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-church-slate hover:bg-gray-100 hover:text-church-navy transition-colors"
          >
            Stay on {sub.tierConfig.name}
          </button>
          <GradientButton
            onClick={handleGoToBilling}
            icon={ArrowRight}
            size="md"
          >
            Go to Billing & Upgrade
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
