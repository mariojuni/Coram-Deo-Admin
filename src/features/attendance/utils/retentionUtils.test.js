import { describe, it, expect } from 'vitest';
import { calculateMemberRetention, calculateRetentionMetrics } from './retentionUtils';

describe('retentionUtils', () => {
  const mockSessions = [
    { id: 's3', date: '2026-11-15', eventTitle: 'Sunday Worship Service', status: 'Closed' },
    { id: 's2', date: '2026-11-08', eventTitle: 'Sunday Worship Service', status: 'Closed' },
    { id: 's1', date: '2026-11-01', eventTitle: 'Sunday Worship Service', status: 'Closed' },
  ];

  const mockMembers = [
    { id: 'm1', firstName: 'John', lastName: 'Doe', membershipStatus: 'Active', phone: '123-456' },
    { id: 'm2', firstName: 'Sarah', lastName: 'Smith', membershipStatus: 'Active' },
    { id: 'm3', firstName: 'David', lastName: 'Johnson', membershipStatus: 'Active' },
  ];

  it('correctly calculates critical consecutive absences (3 missed)', () => {
    // m1 was absent for all 3 sessions
    const recordsBySession = {
      s3: [{ memberId: 'm1', status: 'Absent' }],
      s2: [{ memberId: 'm1', status: 'Absent' }],
      s1: [{ memberId: 'm1', status: 'Absent' }],
    };

    const results = calculateMemberRetention(mockSessions, mockMembers, recordsBySession);
    const m1 = results.find(m => m.memberId === 'm1');

    expect(m1.consecutiveAbsences).toBe(3);
    expect(m1.riskTier).toBe('critical');
    expect(m1.attendanceRate).toBe(0);
  });

  it('correctly resets consecutive absences when present in recent session', () => {
    // m2 was present in s3, absent in s2 and s1
    const recordsBySession = {
      s3: [{ memberId: 'm2', status: 'Present' }],
      s2: [{ memberId: 'm2', status: 'Absent' }],
      s1: [{ memberId: 'm2', status: 'Absent' }],
    };

    const results = calculateMemberRetention(mockSessions, mockMembers, recordsBySession);
    const m2 = results.find(m => m.memberId === 'm2');

    expect(m2.consecutiveAbsences).toBe(0);
    expect(m2.attendedCount).toBe(1);
    expect(m2.lastAttendedDate).toBe('2026-11-15');
    expect(m2.lastAttendedEvent).toBe('Sunday Worship Service');
  });

  it('flags warning tier for exactly 2 consecutive missed sessions', () => {
    // m3 was absent in s3 and s2, but present in s1
    const recordsBySession = {
      s3: [{ memberId: 'm3', status: 'Absent' }],
      s2: [{ memberId: 'm3', status: 'Absent' }],
      s1: [{ memberId: 'm3', status: 'Present' }],
    };

    const results = calculateMemberRetention(mockSessions, mockMembers, recordsBySession);
    const m3 = results.find(m => m.memberId === 'm3');

    expect(m3.consecutiveAbsences).toBe(2);
    expect(m3.riskTier).toBe('warning');
    expect(m3.attendanceRate).toBe(33); // 1 out of 3 = 33%
  });

  it('calculates retention summary metrics accurately', () => {
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
    expect(metrics.averageAttendanceRate).toBe(50); // (0 + 50 + 100) / 3 = 50%
  });
});
