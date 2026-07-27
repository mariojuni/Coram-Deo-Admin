import { getSystemRoles, hasAnyRole } from './permissions';

/**
 * Checks if user is active and belongs to the specified churchId.
 */
function isValidChurchUser(userProfile, targetChurchId = null) {
  if (!userProfile) return false;
  if (userProfile.status && userProfile.status.toLowerCase() === 'disabled') return false;
  if (!userProfile.churchId) return false;
  if (targetChurchId && userProfile.churchId !== targetChurchId) return false;
  return true;
}

/**
 * Checks if the user is a designated leader of the given group.
 */
export function isAssignedGroupLeader(userProfile, group) {
  if (!userProfile || !group) return false;
  
  const memberId = userProfile.memberId || userProfile.id;
  const uid = userProfile.uid || userProfile.id;

  const isLeaderByMember = Array.isArray(group.leaderMemberIds) && Boolean(memberId && group.leaderMemberIds.includes(memberId));
  const isLeaderByUid = Array.isArray(group.leaderUserIds) && Boolean(uid && group.leaderUserIds.includes(uid));

  return isLeaderByMember || isLeaderByUid;
}

/**
 * Can view Discipleship / Small Groups list in web portal.
 * Roles: super_admin, church_admin, pastor, secretary, ministry_leader (if assigned)
 */
export function canViewDiscipleshipGroups(userProfile) {
  if (!isValidChurchUser(userProfile)) return false;
  return hasAnyRole(userProfile, ['super_admin', 'church_admin', 'pastor', 'secretary', 'ministry_leader']);
}

/**
 * Can create a new Discipleship / Small Group.
 * Roles: super_admin, church_admin, pastor
 */
export function canCreateDiscipleshipGroup(userProfile) {
  if (!isValidChurchUser(userProfile)) return false;
  return hasAnyRole(userProfile, ['super_admin', 'church_admin', 'pastor']);
}

/**
 * Can manage (edit, update, delete) a specific group.
 * - super_admin, church_admin, pastor: true for all groups in church
 * - assigned group leader: true for their assigned group
 */
export function canManageDiscipleshipGroup(userProfile, group) {
  if (!isValidChurchUser(userProfile, group?.churchId)) return false;

  if (hasAnyRole(userProfile, ['super_admin', 'church_admin', 'pastor'])) {
    return true;
  }

  return isAssignedGroupLeader(userProfile, group);
}

/**
 * Can manage (add/remove) members & leaders in a group.
 * - super_admin, church_admin, pastor: true for all groups
 * - assigned group leader: true for their group
 */
export function canManageGroupMembers(userProfile, group) {
  return canManageDiscipleshipGroup(userProfile, group);
}

/**
 * Can upload group materials.
 * - super_admin, church_admin, pastor: true
 * - assigned group leader: true for their group
 */
export function canUploadGroupMaterial(userProfile, group) {
  return canManageDiscipleshipGroup(userProfile, group);
}

export function canAttachPlanToGroup(userProfile, group) {
  return canManageDiscipleshipGroup(userProfile, group);
}

export function canChangeGroupPlan(userProfile, group) {
  return canManageDiscipleshipGroup(userProfile, group);
}

export function canRemoveGroupPlan(userProfile, group) {
  return canManageDiscipleshipGroup(userProfile, group);
}

export function canAdvanceGroupWeek(userProfile, group) {
  return canManageDiscipleshipGroup(userProfile, group);
}

export function canViewGroupLeaderMaterials(userProfile, group) {
  if (!isValidChurchUser(userProfile, group?.churchId)) return false;
  if (hasAnyRole(userProfile, ['super_admin', 'church_admin', 'pastor'])) return true;
  return isAssignedGroupLeader(userProfile, group);
}

/**
 * Can view group material.
 * Rules:
 * - Public materials: visible to all active church users
 * - Members materials: visible to church admins/pastors or members of the group
 * - Leaders_only materials: visible ONLY to super_admin, church_admin, pastor, or assigned group leader
 */
export function canViewGroupMaterial(userProfile, group, material) {
  if (!isValidChurchUser(userProfile, material?.churchId || group?.churchId)) return false;

  // Global admins & pastor can see all materials in their church
  if (hasAnyRole(userProfile, ['super_admin', 'church_admin', 'pastor'])) {
    return true;
  }

  const audience = material?.audience || 'leaders_only';

  if (audience === 'leaders_only') {
    // Only assigned group leaders can see leaders_only materials
    return isAssignedGroupLeader(userProfile, group);
  }

  if (audience === 'members') {
    // Assigned leader or member of group
    if (isAssignedGroupLeader(userProfile, group)) return true;
    const memberId = userProfile.memberId || userProfile.id;
    const uid = userProfile.uid || userProfile.id;
    const isMember = (Array.isArray(group?.memberIds) && memberId && group.memberIds.includes(memberId)) ||
                     (Array.isArray(group?.userIds) && uid && group.userIds.includes(uid));
    return isMember;
  }

  return audience === 'public';
}

/**
 * Can bulk generate weekly group meeting events into the events collection.
 * Roles: super_admin, church_admin, pastor, secretary (if policy permits), assigned leader
 */
export function canGenerateGroupMeetings(userProfile, group) {
  if (!isValidChurchUser(userProfile, group?.churchId)) return false;

  if (hasAnyRole(userProfile, ['super_admin', 'church_admin', 'pastor', 'secretary'])) {
    return true;
  }

  return isAssignedGroupLeader(userProfile, group);
}
