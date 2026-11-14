import { describe, it, expect } from 'vitest';
import { 
  getWeekStartKey, 
  groupSessionsByWeek, 
  calculateMemberRetention, 
  calculateRetentionMetrics 
} from './retentionUtils';

describe('retentionUtils - Weekly Attendance Evaluation', () => {
  it('correctly maps dates to Sunday week start keys', () => {
    // 2026-11-15 is Sunday -> week start 2026-11-15
    expect(getWeekStartKey('2026-11-15')).toBe('2026-11-15');
    // 2026-11-18 is Wednesday -> week start 2026-11-15
    expect(getWeekStartKey('2026-11-18')).toBe('2026-11-15');
    // 2026-11-20 is Friday -> week start 2026-11-15
    expect(getWeekStartKey('2026-11-20')).toBe('2026-11-15');
    // 2026-11-22 is following Sunday -> week start 2026-11-22
    expect(getWeekStartKey('2026-11-22')).toBe('2026-11-22');
  });

  it('groups multiple sessions in the same week into one weekly bucket regardless of event', () => {
    const sessions = [
      { id: 'sun_worship', date: '2026-11-15', eventTitle: 'Sunday Morning Worship', status: 'Closed' },
      { id: 'wed_prayer', date: '2026-11-18', eventTitle: 'Midweek Prayer Gathering', status: 'Closed' },
      { id: 'fri_youth', date: '2026-11-20', eventTitle: 'Youth Night', status: 'Closed' },
      { id: 'prev_sun', date: '2026-11-08', eventTitle: 'Sunday Morning Worship', status: 'Closed' },
    ];

    const weeks = groupSessionsByWeek(sessions);
    expect(weeks.length).toBe(2);
    expect(weeks[0].weekKey).toBe('2026-11-15');
    expect(weeks[0].sessions.length).toBe(3); // 3 events in current week
    expect(weeks[1].weekKey).toBe('2026-11-08');
    expect(weeks[1].sessions.length).toBe(1); // 1 event in previous week
  });

  it('counts member as attended for the week if they attended ANY event in that week', () => {
    // Week 1 has Sunday Morning and Wednesday Prayer
    const sessions = [
      { id: 's_sun', date: '2026-11-15', eventTitle: 'Sunday Morning Worship', status: 'Closed' },
      { id: 's_wed', date: '2026-11-18', eventTitle: 'Midweek Prayer Gathering', status: 'Closed' },
    ];

    const members = [
      { id: 'm1', firstName: 'John', lastName: 'Doe', membershipStatus: 'Active' },
    ];

    // John missed Sunday morning, but attended Wednesday prayer
    const recordsBySession = {
      s_sun: [{ memberId: 'm1', status: 'Absent' }],
      s_wed: [{ memberId: 'm1', status: 'Present' }],
    };

    const results = calculateMemberRetention(sessions, members, recordsBySession);
    const m1 = results.find(m => m.memberId === 'm1');

    // John should NOT be marked absent for the week because he attended Wednesday!
    expect(m1.consecutiveAbsentWeeks).toBe(0);
    expect(m1.attendedWeeksCount).toBe(1);
    expect(m1.attendanceRate).toBe(100);
    expect(m1.riskTier).toBe('healthy');
    expect(m1.lastAttendedEvent).toBe('Midweek Prayer Gathering');
  });

  it('correctly calculates 3 consecutive absent weeks across multi-event calendar weeks', () => {
    // 3 distinct weeks
    const sessions = [
      // Week 3 (most recent): Nov 15
      { id: 'w3_sun', date: '2026-11-15', eventTitle: 'Sunday Worship', status: 'Closed' },
      { id: 'w3_wed', date: '2026-11-18', eventTitle: 'Midweek Prayer', status: 'Closed' },
      // Week 2: Nov 08
      { id: 'w2_sun', date: '2026-11-08', eventTitle: 'Sunday Worship', status: 'Closed' },
      // Week 1: Nov 01
      { id: 'w1_sun', date: '2026-11-01', eventTitle: 'Sunday Worship', status: 'Closed' },
      // Week 0: Oct 25 (attended here)
      { id: 'w0_sun', date: '2026-10-25', eventTitle: 'Sunday Worship', status: 'Closed' },
    ];

    const members = [
      { id: 'm1', firstName: 'Sister', lastName: 'Anna', membershipStatus: 'Active' },
    ];

    // Anna was absent from Week 3 (both Sun and Wed), Week 2, and Week 1. But attended Week 0.
    const recordsBySession = {
      w3_sun: [{ memberId: 'm1', status: 'Absent' }],
      w3_wed: [{ memberId: 'm1', status: 'Absent' }],
      w2_sun: [{ memberId: 'm1', status: 'Absent' }],
      w1_sun: [{ memberId: 'm1', status: 'Absent' }],
      w0_sun: [{ memberId: 'm1', status: 'Present' }],
    };

    const results = calculateMemberRetention(sessions, members, recordsBySession);
    const m1 = results.find(m => m.memberId === 'm1');

    expect(m1.consecutiveAbsentWeeks).toBe(3);
    expect(m1.riskTier).toBe('critical');
    expect(m1.riskLabel).toBe('3 Consecutive Weeks Missed');
    expect(m1.attendedWeeksCount).toBe(1);
    expect(m1.totalEvaluatedWeeks).toBe(4);
    expect(m1.attendanceRate).toBe(25); // 1 out of 4 weeks = 25%
  });

  it('computes aggregate retention metrics accurately', () => {
    const analyzed = [
      { riskTier: 'critical', attendanceRate: 0, isVisitor: false, followupStatus: 'needs_contact' },
      { riskTier: 'warning', attendanceRate: 50, isVisitor: false, followupStatus: 'in_conversation' },
      { riskTier: 'healthy', attendanceRate: 100, isVisitor: true, followupStatus: 'none' },
    ];

    const metrics = calculateRetentionMetrics(analyzed);

    expect(metrics.totalMembers).toBe(3);
    expect(metrics.criticalCount).toBe(1);
    expect(metrics.warningCount).toBe(1);
    expect(metrics.healthyCount).toBe(1);
    expect(metrics.visitorsCount).toBe(1);
    expect(metrics.activeFollowupsCount).toBe(2);
    expect(metrics.averageAttendanceRate).toBe(50);
  });
});
