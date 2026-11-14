import { formatStandardName } from '../../../utils/nameUtils';

/**
 * Returns the Sunday-based week start key (YYYY-MM-DD) for any given date.
 * All events from Sunday to Saturday fall into the same calendar week.
 */
export function getWeekStartKey(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const diff = d.getDate() - day;
  const sunday = new Date(d);
  sunday.setDate(diff);
  return sunday.toISOString().split('T')[0];
}

/**
 * Formats a week start key into a human-readable range, e.g.:
 * "Nov 8 – Nov 14, 2026"
 */
export function formatWeekLabel(weekStartKey) {
  if (!weekStartKey) return '';
  const start = new Date(weekStartKey + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

/**
 * Groups sessions into calendar weeks (Sunday–Saturday).
 * 
 * @param {Array} sessions - Array of attendance sessions
 * @returns {Array} Array of week objects sorted descending by week start date
 */
export function groupSessionsByWeek(sessions = []) {
  const validSessions = (sessions || []).filter(s => s.status !== 'Draft' && s.date);
  const weekMap = {};

  validSessions.forEach(session => {
    const weekKey = getWeekStartKey(session.date);
    if (!weekKey) return;

    if (!weekMap[weekKey]) {
      weekMap[weekKey] = {
        weekKey,
        weekLabel: formatWeekLabel(weekKey),
        sessions: []
      };
    }
    weekMap[weekKey].sessions.push(session);
  });

  // Sort weeks descending (most recent first)
  return Object.values(weekMap).sort((a, b) => new Date(b.weekKey) - new Date(a.weekKey));
}

/**
 * Calculates member attendance retention on a WEEKLY basis regardless of event.
 * A member is considered ATTENDED for a calendar week if they attended ANY session that week.
 * Consecutive absences represent consecutive calendar weeks with zero attendance across all events.
 * 
 * @param {Array} sessions - Array of attendance sessions
 * @param {Array} members - Array of active church members
 * @param {Object} recordsBySession - Map of sessionId -> Array of record objects { memberId, status, ... }
 * @param {Object} followupsMap - Map of memberId -> follow-up record { status, touches, ... }
 * @param {number} maxWeeks - Maximum past weeks to evaluate (default: 8 weeks)
 * @returns {Array} List of analyzed member retention objects
 */
export function calculateMemberRetention(
  sessions, 
  members, 
  recordsBySession = {}, 
  followupsMap = {},
  maxWeeks = 8
) {
  if (!members || members.length === 0) return [];

  // Group church sessions into weekly calendar buckets
  const allWeeks = groupSessionsByWeek(sessions);
  const evaluatedWeeks = allWeeks.slice(0, maxWeeks);
  const totalWeeks = evaluatedWeeks.length;

  return members.map(member => {
    const memberId = member.id;
    let consecutiveAbsentWeeks = 0;
    let attendedWeeksCount = 0;
    let excusedWeeksCount = 0;
    let lastAttendedDate = null;
    let lastAttendedEvent = null;

    let streakBroken = false;
    const weeklyBreakdown = [];

    // Evaluate each week from most recent down to oldest
    evaluatedWeeks.forEach(week => {
      let attendedThisWeek = false;
      let allExcused = true;
      let hadAnyRecord = false;
      const attendedEventTitles = [];

      week.sessions.forEach(session => {
        const sessionRecords = recordsBySession[session.id] || [];
        const record = sessionRecords.find(r => 
          r.memberId === memberId || r.userId === memberId || r.id === memberId
        );

        if (record && record.status) {
          hadAnyRecord = true;
          const status = record.status.toLowerCase();
          const isPresent = status === 'present' || status === 'late';
          const isExcused = status === 'excused';

          if (isPresent) {
            attendedThisWeek = true;
            attendedEventTitles.push(session.eventTitle || session.eventName || 'Gathering');
            
            // Record last attended date if not already recorded
            if (!lastAttendedDate && session.date) {
              lastAttendedDate = session.date;
              lastAttendedEvent = session.eventTitle || session.eventName || 'Worship Gathering';
            }
          }

          if (!isExcused) {
            allExcused = false;
          }
        } else {
          allExcused = false;
        }
      });

      if (attendedThisWeek) {
        attendedWeeksCount++;
        streakBroken = true;
      } else if (hadAnyRecord && allExcused) {
        excusedWeeksCount++;
        // Excused does not increase absence count or break consecutive streak
      } else {
        if (!streakBroken) {
          consecutiveAbsentWeeks++;
        }
      }

      weeklyBreakdown.push({
        weekKey: week.weekKey,
        weekLabel: week.weekLabel,
        attended: attendedThisWeek,
        excused: hadAnyRecord && allExcused,
        eventsAttended: attendedEventTitles,
        totalEventsInWeek: week.sessions.length
      });
    });

    // Attendance rate over evaluated weeks (excluding excused weeks)
    const effectiveTotalWeeks = Math.max(1, totalWeeks - excusedWeeksCount);
    const attendanceRate = totalWeeks > 0 
      ? Math.round((attendedWeeksCount / effectiveTotalWeeks) * 100) 
      : 0;

    // Determine Risk Tier based on consecutive absent weeks
    let riskTier = 'healthy';
    let riskLabel = 'Consistent';
    let riskSeverity = 0; // 0: healthy, 1: irregular, 2: warning, 3: critical

    if (consecutiveAbsentWeeks >= 3) {
      riskTier = 'critical';
      riskLabel = `${consecutiveAbsentWeeks} Consecutive Weeks Missed`;
      riskSeverity = 3;
    } else if (consecutiveAbsentWeeks === 2) {
      riskTier = 'warning';
      riskLabel = '2 Consecutive Weeks Missed';
      riskSeverity = 2;
    } else if (attendanceRate < 50 && totalWeeks >= 3) {
      riskTier = 'irregular';
      riskLabel = 'Irregular Attendance (<50%)';
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
      consecutiveAbsences: consecutiveAbsentWeeks, // alias for UI consistency
      consecutiveAbsentWeeks,
      attendedWeeksCount,
      totalEvaluatedWeeks: totalWeeks,
      attendanceRate,
      lastAttendedDate,
      lastAttendedEvent,
      weeklyBreakdown,
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
