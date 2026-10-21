import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { SUBSCRIPTION_TIERS } from '../../../config/subscriptions';
import GradientButton from '../../../components/ui/GradientButton';
import SoftCard from '../../../components/ui/SoftCard';

/**
 * Component wrapper that guards premium feature sections according to church plan tier.
 * Displays a friendly, polished upgrade call-to-action if the workspace tier lacks the feature.
 */
export default function FeatureGate({
  feature,
  requiredTier = 'growth',
  featureName = 'This feature',
  description,
  children,
  fallback = null
}) {
  const navigate = useNavigate();
  const sub = useSubscription();
  const limits = useSubscriptionLimits();

  // If user is superadmin or church is on Kingdom, always permit
  if (sub.isKingdom) return <>{children}</>;

  // Check feature permission
  const isAllowed = feature ? limits.hasFeature(feature) : sub.tier === requiredTier;
  if (isAllowed) return <>{children}</>;

  // If custom fallback provided
  if (fallback) return <>{fallback}</>;

  const targetPlan = SUBSCRIPTION_TIERS[requiredTier] || SUBSCRIPTION_TIERS.growth;

  return (
    <SoftCard className="p-8 my-4 text-center max-w-2xl mx-auto border-2 border-dashed border-gray-200">
      <div className="w-14 h-14 rounded-3xl bg-church-rose/10 text-church-rose flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Lock size={26} />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-black uppercase tracking-wider mb-2">
        <Zap size={13} />
        <span>Available in {targetPlan.name}</span>
      </div>

      <h3 className="text-xl font-black text-church-navy tracking-tight">
        Unlock {featureName}
      </h3>

      <p className="text-xs sm:text-sm text-church-slate max-w-md mx-auto mt-2 leading-relaxed">
        {description ||
          `This tool requires the ${targetPlan.name} plan. Upgrade your workspace to empower your ministry leadership.`}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <GradientButton
          onClick={() => navigate('/admin/settings/billing')}
          icon={ArrowRight}
          size="md"
        >
          Upgrade to {targetPlan.name}
        </GradientButton>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-church-slate">
        <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
        <span>14-day evaluation trial included. No upfront credit card required.</span>
      </div>
    </SoftCard>
  );
}
