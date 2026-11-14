import { formatStandardName } from '../../../utils/nameUtils';

/**
 * Calculates member attendance retention, consecutive absences, and engagement tiers.
 * 
 * @param {Array} sessions - Array of attendance sessions (sorted descending by date)
 * @param {Array} members - Array of active church members
 * @param {Object} recordsBySession - Map of sessionId -> Array of record objects { memberId, status, type, ... }
 * @param {Object} followupsMap - Map of memberId -> follow-up record { status, touches, ... }
 * @returns {Array} List of analyzed member retention objects
 */
export function calculateMemberRetention(sessions, members, recordsBySession = {}, followupsMap = {}) {
  if (!members || members.length === 0) return [];

  // Filter to valid completed or active sessions, max latest 10 sessions
  const evaluatedSessions = (sessions || [])
    .filter(s => s.status !== 'Draft')
    .slice(0, 10);

  const totalSessions = evaluatedSessions.length;

  return members.map(member => {
    const memberId = member.id;
    let consecutiveAbsences = 0;
    let attendedCount = 0;
    let excusedCount = 0;
    let explicitAbsentCount = 0;
    let lastAttendedDate = null;
    let lastAttendedEvent = null;

    let streakBroken = false;

    // Check attendance from most recent session to oldest
    evaluatedSessions.forEach((session) => {
      const sessionRecords = recordsBySession[session.id] || [];
      const record = sessionRecords.find(r => r.memberId === memberId || r.userId === memberId || r.id === memberId);
      const status = record?.status ? record.status.toLowerCase() : null;

      const isPresent = status === 'present' || status === 'late';
      const isExcused = status === 'excused';

      if (isPresent) {
        attendedCount++;
        if (!lastAttendedDate && session.date) {
          lastAttendedDate = session.date;
          lastAttendedEvent = session.eventTitle || session.eventName || 'Worship Service';
        }
        streakBroken = true;
      } else if (isExcused) {
        excusedCount++;
        // Excused does not increase absence count or break consecutive streak
      } else {
        explicitAbsentCount++;
        if (!streakBroken) {
          consecutiveAbsences++;
        }
      }
    });

    // Attendance rate over evaluated sessions (excluding excused)
    const effectiveTotal = Math.max(1, totalSessions - excusedCount);
    const attendanceRate = totalSessions > 0 
      ? Math.round((attendedCount / effectiveTotal) * 100) 
      : 0;

    // Determine Risk Tier
    let riskTier = 'healthy';
    let riskLabel = 'Consistent';
    let riskSeverity = 0; // 0: healthy, 1: irregular, 2: warning, 3: critical

    if (consecutiveAbsences >= 3) {
      riskTier = 'critical';
      riskLabel = `${consecutiveAbsences} Consecutive Absences`;
      riskSeverity = 3;
    } else if (consecutiveAbsences === 2) {
      riskTier = 'warning';
      riskLabel = '2 Consecutive Absences';
      riskSeverity = 2;
    } else if (attendanceRate < 50 && totalSessions >= 3) {
      riskTier = 'irregular';
      riskLabel = 'Irregular (<50%)';
      riskSeverity = 1;
    } else {
      riskTier = 'healthy';
      riskLabel = attendanceRate >= 80 ? 'Highly Faithful' : 'Consistent';
      riskSeverity = 0;
    }

    const isVisitor = member.membershipStatus === 'Visitor' || member.role === 'Visitor';
    const followup = followupsMap[memberId] || null;

    return {
      memberId,
      member,
      fullName: formatStandardName(member),
      email: member.email || '',
      phone: member.phone || member.mobilePhone || member.contactNumber || '',
      membershipStatus: member.membershipStatus || 'Active',
      householdName: member.householdName || member.familyName || '',
      consecutiveAbsences,
      attendedCount,
      totalSessions,
      attendanceRate,
      lastAttendedDate,
      lastAttendedEvent,
      riskTier,
      riskLabel,
      riskSeverity,
      isVisitor,
      followupStatus: followup?.status || (riskSeverity >= 2 ? 'needs_contact' : 'none'),
      followupNotes: followup?.notes || '',
      lastContactDate: followup?.lastContactDate || null,
      lastContactMethod: followup?.lastContactMethod || null,
      assignedTo: followup?.assignedTo || '',
      touches: followup?.touches || []
    };
  });
}

/**
 * Computes high-level flock retention summary metrics.
 */
export function calculateRetentionMetrics(analyzedMembers = []) {
  if (!analyzedMembers || analyzedMembers.length === 0) {
    return {
      totalMembers: 0,
      criticalCount: 0,
      warningCount: 0,
      irregularCount: 0,
      healthyCount: 0,
      visitorsCount: 0,
      activeFollowupsCount: 0,
      averageAttendanceRate: 0
    };
  }

  let criticalCount = 0;
  let warningCount = 0;
  let irregularCount = 0;
  let healthyCount = 0;
  let visitorsCount = 0;
  let activeFollowupsCount = 0;
  let totalRateSum = 0;

  analyzedMembers.forEach(m => {
    if (m.riskTier === 'critical') criticalCount++;
    else if (m.riskTier === 'warning') warningCount++;
    else if (m.riskTier === 'irregular') irregularCount++;
    else healthyCount++;

    if (m.isVisitor) visitorsCount++;
    if (m.followupStatus === 'needs_contact' || m.followupStatus === 'in_conversation') {
      activeFollowupsCount++;
    }
    totalRateSum += m.attendanceRate;
  });

  return {
    totalMembers: analyzedMembers.length,
    criticalCount,
    warningCount,
    irregularCount,
    healthyCount,
    visitorsCount,
    activeFollowupsCount,
    averageAttendanceRate: Math.round(totalRateSum / analyzedMembers.length)
  };
}
