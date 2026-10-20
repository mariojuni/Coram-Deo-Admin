/**
 * Coram Deo Subscription Configuration & Tier Definitions
 * Central single source of truth for all subscription, trial, and quota rules.
 */

export const SUBSCRIPTION_TIERS = {
  seed: {
    id: 'seed',
    key: 'seed',
    name: 'Seed Fellowship',
    tagline: 'For church plants & fellowships',
    price: 'Free',
    priceNum: 0,
    period: 'forever',
    billingCycle: 'free',
    trialDays: 0,
    description: 'Everything small churches need to establish faithful record-keeping without any software cost.',
    features: [
      'Up to 50 active members & family profiles',
      'Sunday tithes & offerings recording',
      'Kiosk QR entrance check-in',
      'Mobile app for congregation members',
      'Standard PDF financial exports',
      'Community email support'
    ],
    quotas: {
      maxMembers: 50,
      maxCampuses: 1,
      sermonStorageGb: 2,
      unlimitedGiving: false,
      customGivingGateways: false,
      prioritySupport: false,
      boardReports: false,
      scheduling: false,
      worshipSetlists: false
    },
    popular: false,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },

  growth: {
    id: 'growth',
    key: 'growth',
    name: 'Growth Ministry',
    tagline: 'For established growing churches',
    price: '₱3,490',
    priceNum: 3490,
    period: 'per month',
    billingCycle: 'monthly',
    trialDays: 14,
    description: 'The complete management engine for growing churches — up to 250 members with 20 GB media storage and automated leadership workflows.',
    features: [
      'Up to 250 active members & unlimited families',
      'Unlimited giving funds & campaign progress bars',
      '20 GB / month sermon video & media storage',
      'Volunteer rostering & ministry scheduling',
      'Worship setlists & chord transposition',
      'Discipleship group chat & prayer walls',
      'Board-ready financial statements in 1 click',
      'Priority chat and onboarding support'
    ],
    quotas: {
      maxMembers: 250,
      maxCampuses: 1,
      sermonStorageGb: 20,
      unlimitedGiving: true,
      customGivingGateways: false,
      prioritySupport: true,
      boardReports: true,
      scheduling: true,
      worshipSetlists: true
    },
    popular: true,
    badgeColor: 'bg-church-rose/10 text-church-rose border-church-rose/20'
  },

  kingdom: {
    id: 'kingdom',
    key: 'kingdom',
    name: 'Kingdom Network',
    tagline: 'For large and expanding church ministries',
    price: '₱5,490',
    priceNum: 5490,
    period: 'per month',
    billingCycle: 'monthly',
    trialDays: 14,
    description: 'Everything in Growth Ministry with unlimited congregation members, unlimited giving funds, and 50 GB sermon media storage.',
    features: [
      'Unlimited congregation members & families (No caps)',
      'Unlimited giving funds, campaigns & financial tracking',
      '50 GB sermon video & media storage quota',
      'All Growth Ministry tools (worship setlists, rostering, discipleship)',
      'Dedicated staff onboarding & Zoom training for church leaders',
      'Priority direct phone and email technical support'
    ],
    quotas: {
      maxMembers: 999999,
      maxCampuses: 1,
      sermonStorageGb: 50,
      unlimitedGiving: true,
      customGivingGateways: true,
      prioritySupport: true,
      boardReports: true,
      scheduling: true,
      worshipSetlists: true
    },
    popular: false,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  }
};

/**
 * Returns tier config with safe fallback to growth or seed
 */
export function getTierConfig(tierKey) {
  const normalized = (tierKey || 'seed').toLowerCase();
  return SUBSCRIPTION_TIERS[normalized] || SUBSCRIPTION_TIERS.seed;
}

/**
 * Calculates trial end date (ISO string)
 */
export function calculateTrialEndDate(startDate = new Date(), trialDays = 14) {
  const start = new Date(startDate);
  start.setDate(start.getDate() + trialDays);
  return start.toISOString();
}

/**
 * Returns remaining trial days (integer >= 0)
 */
export function getRemainingDays(targetIsoDate) {
  if (!targetIsoDate) return 0;
  const target = new Date(targetIsoDate).getTime();
  const now = Date.now();
  const diffMs = target - now;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates whether church currently has an operative active subscription state
 */
export function isSubscriptionOperative(sub) {
  if (!sub) return true; // Graceful default
  const status = sub.status || 'active';
  if (status === 'active' || status === 'lifetime_free' || status === 'sponsored') return true;
  if (status === 'trialing') {
    return getRemainingDays(sub.trialEndDate) > 0;
  }
  if (status === 'past_due' || status === 'grace_period') {
    // Allowed during grace period
    return getRemainingDays(sub.gracePeriodEndsAt) > 0;
  }
  return false;
}
