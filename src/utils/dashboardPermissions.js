import { getSystemRoles, hasRole, hasAnyRole } from './permissions';

/**
 * Returns true if user can access the main admin dashboard.
 * Viewers are blocked by default unless explicitly elevated.
 */
export function canViewDashboard(userProfile) {
  if (!userProfile) return false;
  if (userProfile.status && userProfile.status.toLowerCase() === 'disabled') return false;
  if (userProfile.status && userProfile.status.toLowerCase() === 'pendingchurchlink') return false;

  const roles = getSystemRoles(userProfile);
  if (roles.includes('super_admin')) return true;
  if (!userProfile.churchId) return false;

  // Viewers are blocked by default from web admin dashboard
  return hasAnyRole(userProfile, [
    'super_admin',
    'church_admin',
    'pastor',
    'secretary',
    'finance_admin',
    'ministry_leader',
  ]);
}

/**
 * Can view financial summary cards and detailed finance overview.
 * Allowed: super_admin, church_admin, finance_admin, pastor (if policy allows)
 */
export function canViewFinanceDashboard(userProfile) {
  if (!canViewDashboard(userProfile)) return false;
  return hasAnyRole(userProfile, ['super_admin', 'church_admin', 'finance_admin', 'pastor']);
}

/**
 * Can view prayer overview card & pending moderation.
 * Allowed: super_admin, church_admin, pastor, secretary
 * Restricted from finance_admin & pure ministry_leader by default.
 */
export function canViewPrayerDashboard(userProfile) {
  if (!canViewDashboard(userProfile)) return false;
  return hasAnyRole(userProfile, ['super_admin', 'church_admin', 'pastor', 'secretary']);
}

/**
 * Can view attendance overview metrics.
 * Allowed: super_admin, church_admin, pastor, secretary
 */
export function canViewAttendanceDashboard(userProfile) {
  if (!canViewDashboard(userProfile)) return false;
  return hasAnyRole(userProfile, ['super_admin', 'church_admin', 'pastor', 'secretary']);
}

/**
 * Can view serve/ministry overview card.
 * Allowed: super_admin, church_admin, pastor, secretary, ministry_leader
 */
export function canViewMinistryDashboard(userProfile) {
  if (!canViewDashboard(userProfile)) return false;
  return hasAnyRole(userProfile, [
    'super_admin',
    'church_admin',
    'pastor',
    'secretary',
    'ministry_leader',
  ]);
}

/**
 * Can view small groups / discipleship overview card.
 * Allowed: super_admin, church_admin, pastor, secretary, ministry_leader
 */
export function canViewGroupsDashboard(userProfile) {
  if (!canViewDashboard(userProfile)) return false;
  return hasAnyRole(userProfile, [
    'super_admin',
    'church_admin',
    'pastor',
    'secretary',
    'ministry_leader',
  ]);
}

/**
 * Can view worship setlists overview card.
 * Allowed: super_admin, church_admin, pastor, ministry_leader
 */
export function canViewWorshipDashboard(userProfile) {
  if (!canViewDashboard(userProfile)) return false;
  return hasAnyRole(userProfile, ['super_admin', 'church_admin', 'pastor', 'ministry_leader']);
}

/**
 * Returns role-based quick actions tailored to current user permissions.
 */
export function getDashboardQuickActions(userProfile) {
  if (!canViewDashboard(userProfile)) return [];

  const roles = getSystemRoles(userProfile);
  const actions = [];

  const isSuperOrAdmin = roles.includes('super_admin') || roles.includes('church_admin');
  const isPastor = roles.includes('pastor');
  const isSecretary = roles.includes('secretary');
  const isFinance = roles.includes('finance_admin');
  const isLeader = roles.includes('ministry_leader');

  if (isSuperOrAdmin) {
    actions.push(
      { id: 'create_event', label: 'Create Event', path: '/admin/events', primary: true, color: 'bg-church-green' },
      { id: 'add_member', label: 'Add Member', path: '/admin/members', primary: true, color: 'bg-church-navy' },
      { id: 'generate_events', label: 'Generate Monthly Events', path: '/admin/events', primary: false, color: 'bg-indigo-600' },
      { id: 'upload_sermon', label: 'Upload Sermon', path: '/admin/sermons', primary: false, color: 'bg-purple-600' },
      { id: 'create_announcement', label: 'Create Announcement', path: '/admin/announcements', primary: false, color: 'bg-blue-600' }
    );
  } else if (isPastor) {
    actions.push(
      { id: 'view_prayers', label: 'View Prayer Requests', path: '/admin/prayer', primary: true, color: 'bg-blue-600' },
      { id: 'view_groups', label: 'View Groups', path: '/admin/discipleship/groups', primary: true, color: 'bg-purple-600' },
      { id: 'view_sermons', label: 'View Sermons', path: '/admin/sermons', primary: false, color: 'bg-indigo-600' },
      { id: 'view_attendance', label: 'View Attendance', path: '/admin/attendance', primary: false, color: 'bg-church-green' }
    );
  } else if (isSecretary) {
    actions.push(
      { id: 'create_event', label: 'Create Event', path: '/admin/events', primary: true, color: 'bg-church-green' },
      { id: 'generate_events', label: 'Generate Monthly Events', path: '/admin/events', primary: false, color: 'bg-indigo-600' },
      { id: 'take_attendance', label: 'Attendance', path: '/admin/attendance', primary: true, color: 'bg-purple-600' },
      { id: 'add_announcement', label: 'Add Announcement', path: '/admin/announcements', primary: false, color: 'bg-blue-600' },
      { id: 'add_member', label: 'Add Member', path: '/admin/members', primary: false, color: 'bg-church-navy' }
    );
  } else if (isFinance) {
    actions.push(
      { id: 'giving_input', label: 'Giving Input', path: '/admin/finance/giving', primary: true, color: 'bg-church-green' },
      { id: 'pending_verification', label: 'Pending Verification', path: '/admin/finance/giving', primary: true, color: 'bg-amber-600' },
      { id: 'add_expense', label: 'Add Expense', path: '/admin/finance/expenses', primary: false, color: 'bg-red-600' },
      { id: 'finance_reports', label: 'Finance Reports', path: '/admin/finance/reports', primary: false, color: 'bg-blue-600' }
    );
  } else if (isLeader) {
    actions.push(
      { id: 'my_schedule', label: 'My Ministry Schedule', path: '/admin/schedules', primary: true, color: 'bg-church-green' },
      { id: 'applications', label: 'Ministry Applications', path: '/admin/ministries/applications', primary: true, color: 'bg-purple-600' },
      { id: 'serve_assignments', label: 'Serve Assignments', path: '/admin/schedules', primary: false, color: 'bg-blue-600' },
      { id: 'worship_setlists', label: 'Worship Setlists', path: '/admin/worship/setlists', primary: false, color: 'bg-indigo-600' }
    );
  }

  return actions;
}
