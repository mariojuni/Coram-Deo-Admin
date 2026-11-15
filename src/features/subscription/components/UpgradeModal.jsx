import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { SUBSCRIPTION_TIERS } from '../../../config/subscriptions';
import Modal from '../../../components/ui/Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resolvedTitle}
      subtitle={resolvedMessage}
      icon={Zap}
      maxWidth="lg"
      badge={
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC]">
          Plan Limit Reached
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Stay on {sub.tierConfig.name}
          </button>
          <button
            type="button"
            onClick={handleGoToBilling}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98"
          >
            <span>Go to Billing & Upgrade</span>
            <ArrowRight size={14} />
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Recommended Upgrade Card */}
        <div className="bg-white rounded-2xl border-2 border-[#2C4A60]/30 p-5 shadow-2xs relative space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#2C4A60]">
              Recommended Upgrade
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#162533] text-white">
              Most Popular
            </span>
          </div>

          <div className="flex items-baseline justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{targetPlan.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{targetPlan.tagline}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{targetPlan.price}</span>
              <span className="text-xs text-slate-400 font-medium">/{targetPlan.period}</span>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs font-medium text-slate-700">
            {targetPlan.features.slice(0, 4).map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} />
                </div>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>Cancel or modify tiers anytime. Your existing congregation data is 100% safeguarded.</span>
        </div>
      </div>
    </Modal>
  );
}
