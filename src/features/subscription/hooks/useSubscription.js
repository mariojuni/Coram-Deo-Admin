import { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  getTierConfig, 
  getRemainingDays, 
  isSubscriptionOperative 
} from '../../../config/subscriptions';

/**
 * Custom hook to access normalized, real-time subscription state for the current church workspace.
 * Automatically derives legacy church documents without breakages.
 */
export function useSubscription() {
  const { churchData, churchCurrency } = useAuth();

  return useMemo(() => {
    if (!churchData) {
      const defaultTierConfig = getTierConfig('growth');
      return {
        isLoading: true,
        tier: 'growth',
        tierConfig: defaultTierConfig,
        status: 'active',
        isTrial: false,
        isPastDue: false,
        isGracePeriod: false,
        isOperative: true,
        daysRemaining: 14,
        trialEndDate: null,
        currentPeriodEnd: null,
        quotas: defaultTierConfig.quotas,
        isSeed: false,
        isGrowth: true,
        isKingdom: false,
        subscription: null,
        rawChurch: null,
      };
    }

    // Read or synthesize subscription object
    const rawSub = churchData.subscription || {};
    const tierKey = (rawSub.tier || churchData.tier || 'seed').toLowerCase();
    const tierConfig = getTierConfig(tierKey);

    const status = rawSub.status || (tierKey === 'seed' ? 'active' : 'trialing');
    const isTrial = status === 'trialing';
    const isPastDue = status === 'past_due';
    const isGracePeriod = status === 'grace_period';
    const isSeed = tierKey === 'seed';
    const isGrowth = tierKey === 'growth';
    const isKingdom = tierKey === 'kingdom';

    let daysRemaining = 0;
    if (isTrial) {
      daysRemaining = getRemainingDays(rawSub.trialEndDate);
    } else if (isPastDue || isGracePeriod) {
      daysRemaining = getRemainingDays(rawSub.gracePeriodEndsAt);
    }

    const isTrialExpired = isTrial && rawSub.trialEndDate && (new Date(rawSub.trialEndDate).getTime() < Date.now());
    const isOperative = isSubscriptionOperative(rawSub);
    const quotas = rawSub.quotas || tierConfig.quotas;

    return {
      isLoading: false,
      tier: tierKey,
      tierConfig,
      status,
      isTrial,
      isTrialExpired,
      isPastDue,
      isGracePeriod,
      isOperative,
      daysRemaining,
      trialStartDate: rawSub.trialStartDate || null,
      trialEndDate: rawSub.trialEndDate || null,
      currentPeriodStart: rawSub.currentPeriodStart || null,
      currentPeriodEnd: rawSub.currentPeriodEnd || null,
      gracePeriodEndsAt: rawSub.gracePeriodEndsAt || null,
      cancelAtPeriodEnd: Boolean(rawSub.cancelAtPeriodEnd),
      scheduledChange: rawSub.scheduledChange || null,
      isScheduledDowngrade: Boolean(rawSub.scheduledChange),
      paymentGateway: rawSub.paymentGateway || 'manual_bank_transfer',
      gatewayCustomerId: rawSub.gatewayCustomerId || null,
      gatewaySubscriptionId: rawSub.gatewaySubscriptionId || null,
      quotas,
      isSeed,
      isGrowth,
      isKingdom,
      churchId: churchData?.id || null,
      currency: churchCurrency?.code || churchData.currency || 'PHP',
      currencySymbol: churchCurrency?.symbol || churchData.currencySymbol || '₱',
      subscription: rawSub,
      rawChurch: churchData
    };
  }, [churchData, churchCurrency]);
}
