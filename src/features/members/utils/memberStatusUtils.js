/**
 * Helper utilities for Member status, category, and baptism resolution
 * Provides 100% backward compatibility for legacy records where 'Active' or 'Inactive'
 * was stored directly as membershipStatus without an explicit membershipCategory.
 */

export const MEMBERSHIP_CATEGORIES = [
  { value: 'Full Member', label: 'Full Member' },
  { value: 'Fellowship', label: 'Fellowship' },
  { value: 'Visitor', label: 'Visitor' },
  { value: 'Transferred', label: 'Transferred' },
  { value: 'Deceased', label: 'Deceased' },
  { value: 'Archived', label: 'Archived' }
];

export const FULL_MEMBER_SUBSTATUSES = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' }
];

export const BAPTISM_STATUSES = [
  { value: 'Not Baptized', label: 'Not Baptized' },
  { value: 'To Be Baptized', label: 'To Be Baptized' },
  { value: 'Baptized', label: 'Baptized' }
];

/**
 * Resolves the primary membership category of a member.
 * Legacy records with 'Active' or 'Inactive' are recognized as 'Full Member'.
 */
export function getMembershipCategory(member) {
  if (!member) return 'Full Member';
  if (member.membershipCategory) return member.membershipCategory;

  const status = member.membershipStatus || 'Active';
  if (status === 'Active' || status === 'Inactive') {
    return 'Full Member';
  }
  return status;
}

/**
 * Resolves the sub-status (Active vs Inactive) for a Full Member.
 */
export function getMembershipSubStatus(member) {
  if (!member) return 'Active';
  const status = member.membershipStatus || 'Active';
  if (status === 'Inactive') return 'Inactive';
  return 'Active';
}

/**
 * Generates badge styling and label for membership status.
 */
export function getMembershipBadgeInfo(member) {
  const category = getMembershipCategory(member);
  const subStatus = getMembershipSubStatus(member);

  if (category === 'Full Member') {
    if (subStatus === 'Active') {
      return {
        label: 'Full Member • Active',
        shortLabel: 'Active',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    return {
      label: 'Full Member • Inactive',
      shortLabel: 'Inactive',
      className: 'bg-amber-100 text-amber-800 border-amber-200'
    };
  }

  if (category === 'Fellowship') {
    return {
      label: 'Fellowship',
      shortLabel: 'Fellowship',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
  }

  if (category === 'Visitor') {
    return {
      label: 'Visitor',
      shortLabel: 'Visitor',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  }

  // Archived, Deceased, Transferred
  return {
    label: category,
    shortLabel: category,
    className: 'bg-gray-100 text-gray-700 border-gray-200'
  };
}

/**
 * Formats the baptism status and date for display.
 */
export function formatBaptismDisplay(member) {
  if (!member) return 'Not Baptized';
  const status = member.baptismStatus || 'Not Baptized';
  const date = member.baptismDate;

  if (status === 'Baptized') {
    if (date) {
      try {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          const dateStr = parsed.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          return `Baptized (${dateStr})`;
        }
      } catch (_) {}
      return `Baptized (${date})`;
    }
    return 'Baptized';
  }

  if (status === 'To Be Baptized') {
    return 'To Be Baptized';
  }

  return 'Not Baptized';
}
