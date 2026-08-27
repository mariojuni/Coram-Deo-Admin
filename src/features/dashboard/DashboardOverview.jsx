import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  canViewDashboard, 
  canViewFinanceDashboard, 
  canViewPrayerDashboard, 
  canViewAttendanceDashboard,
  canViewMinistryDashboard,
  canViewGroupsDashboard,
  canViewWorshipDashboard
} from '../../utils/dashboardPermissions';

import DashboardHeader from './components/DashboardHeader';
import DashboardQuickActions from './components/DashboardQuickActions';
import DashboardMetricCards from './components/DashboardMetricCards';
import ThisWeekEventsCard from './components/ThisWeekEventsCard';
import DashboardPendingTasks from './components/DashboardPendingTasks';
import AttendanceOverviewCard from './components/AttendanceOverviewCard';
import FinanceOverviewCard from './components/FinanceOverviewCard';
import ServeOverviewCard from './components/ServeOverviewCard';
import PrayerOverviewCard from './components/PrayerOverviewCard';
import GroupsOverviewCard from './components/GroupsOverviewCard';
import WorshipOverviewCard from './components/WorshipOverviewCard';
import RecentActivityCard from './components/RecentActivityCard';

import { useNavigate } from 'react-router-dom';

export default function DashboardOverview() {
  const { userProfile, activeChurchId } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (activeChurchId === 'system') {
      navigate('/super-admin/churches', { replace: true });
    }
  }, [activeChurchId, navigate]);

  const CHURCH_ID = activeChurchId || userProfile?.churchId;

  const [activeChurchName, setActiveChurchName] = useState('');
  const [loading, setLoading] = useState(true);

  // Aggregated state
  const [metrics, setMetrics] = useState({
    upcomingEventsCount: 0,
    monthlyAttendance: 0,
    activeMembersCount: 0,
    pendingApplicationsCount: 0,
    pendingGivingCount: 0,
    activeGroupsCount: 0,
    pendingPrayerCount: 0,
    publishedSermonsCount: 0,
  });

  const [thisWeekEvents, setThisWeekEvents] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({
    pendingGiving: 0,
    pendingApplications: 0,
    pendingPrayers: 0,
    missingAssignments: 0,
    groupsWithoutLeader: 0,
    unpublishedSermons: 0,
  });

  const [attendanceData, setAttendanceData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [serveData, setServeData] = useState(null);
  const [prayerData, setPrayerData] = useState(null);
  const [groupsData, setGroupsData] = useState(null);
  const [worshipData, setWorshipData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  // Check access permission
  const hasAccess = canViewDashboard(userProfile);

  useEffect(() => {
    if (!userProfile || !hasAccess || !CHURCH_ID) {
      setLoading(false);
      return;
    }

    async function loadDashboardData() {
      setLoading(true);
      try {
        // Fetch Active Church Name
        try {
          const churchSnap = await getDoc(doc(db, 'churches', CHURCH_ID));
          if (churchSnap.exists()) {
            setActiveChurchName(churchSnap.data().name);
          }
        } catch (e) { console.error('Error loading church name:', e); }

        // Date calculations
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday start

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        // Domain Permission Flags
        const canFinance = canViewFinanceDashboard(userProfile);
        const canPrayer = canViewPrayerDashboard(userProfile);
        const canAttendance = canViewAttendanceDashboard(userProfile);
        const canMinistry = canViewMinistryDashboard(userProfile);
        const canGroups = canViewGroupsDashboard(userProfile);
        const canWorship = canViewWorshipDashboard(userProfile);

        const managedMinistryIds = Array.isArray(userProfile.managedMinistryIds) ? userProfile.managedMinistryIds : [];
        const isStrictMinistryLeader = userProfile.systemRoles?.includes('ministry_leader') && !userProfile.systemRoles?.includes('church_admin');

        // Execute queries in parallel using Promise.allSettled
        const results = await Promise.allSettled([
          // 0: Members count
          getDocs(query(collection(db, 'users'), where('churchId', '==', CHURCH_ID))),
          // 1: Events
          getDocs(query(collection(db, 'events'), where('churchId', '==', CHURCH_ID))),
          // 2: Attendance
          canAttendance ? getDocs(query(collection(db, 'attendance'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 3: Giving Records
          canFinance ? getDocs(query(collection(db, 'givingRecords'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 4: Giving Expenses
          canFinance ? getDocs(query(collection(db, 'givingExpenses'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 5: Giving Campaigns
          canFinance ? getDocs(query(collection(db, 'givingCampaigns'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 6: Ministry Applications
          canMinistry ? getDocs(query(collection(db, 'ministryApplications'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 7: Ministry Assignments
          canMinistry ? getDocs(query(collection(db, 'ministryAssignments'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 8: Prayer Requests
          canPrayer ? getDocs(collection(db, 'churches', CHURCH_ID, 'prayer_requests')) : Promise.resolve(null),
          // 9: Discipleship Groups
          canGroups ? getDocs(query(collection(db, 'discipleshipGroups'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 10: Group Materials
          canGroups ? getDocs(query(collection(db, 'discipleshipGroupMaterials'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 11: Worship Setlists
          canWorship ? getDocs(query(collection(db, 'worshipSetlists'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 12: Sermons
          getDocs(query(collection(db, 'sermons'), where('churchId', '==', CHURCH_ID))),
        ]);

        const extractData = (index) => {
          const res = results[index];
          if (res.status === 'fulfilled' && res.value) {
            return res.value.docs.map((d) => ({ id: d.id, ...d.data() }));
          }
          return [];
        };

        const membersDocs = extractData(0);
        const eventsDocs = extractData(1);
        const attendanceDocs = extractData(2);
        const givingDocs = extractData(3);
        const expensesDocs = extractData(4);
        const campaignsDocs = extractData(5);
        const applicationsDocs = extractData(6);
        const assignmentsDocs = extractData(7);
        const prayerDocs = extractData(8);
        const groupsDocs = extractData(9);
        const groupMaterialsDocs = extractData(10);
        const setlistDocs = extractData(11);
        const sermonDocs = extractData(12);

        // Process Events This Week
        const publishedEvents = eventsDocs.filter((e) => e.status !== 'cancelled' && e.status !== 'draft');
        const thisWeekEvts = publishedEvents.filter((e) => {
          const eDate = e.startDateTime ? new Date(e.startDateTime) : (e.date ? new Date(e.date + 'T00:00:00') : null);
          return eDate && eDate >= startOfWeek && eDate <= endOfWeek;
        }).sort((a, b) => {
          const dA = a.startDateTime ? new Date(a.startDateTime) : new Date(a.date);
          const dB = b.startDateTime ? new Date(b.startDateTime) : new Date(b.date);
          return dA - dB;
        });
        setThisWeekEvents(thisWeekEvts);

        // Process Attendance
        let monthlyAttTotal = 0;
        let worshipAvg = 0;
        let groupsAvg = 0;
        if (canAttendance && attendanceDocs.length > 0) {
          const thisMonthRecords = attendanceDocs.filter((a) => a.date && a.date >= startOfMonthStr);
          monthlyAttTotal = thisMonthRecords.length;
          const worshipRecords = thisMonthRecords.filter((a) => (a.category || '').toLowerCase().includes('worship'));
          const groupRecords = thisMonthRecords.filter((a) => (a.category || '').toLowerCase().includes('group') || (a.category || '').toLowerCase().includes('study'));
          worshipAvg = worshipRecords.length > 0 ? Math.round(worshipRecords.length / 4) : 0;
          groupsAvg = groupRecords.length > 0 ? Math.round(groupRecords.length / 4) : 0;

          setAttendanceData({
            totalThisMonth: monthlyAttTotal,
            worshipAvg,
            groupsAvg,
          });
        }

        // Process Finance
        let approvedGivingTotal = 0;
        let pendingGivingCount = 0;
        let totalExpensesThisMonth = 0;
        if (canFinance) {
          const thisMonthGiving = givingDocs.filter((g) => {
            const gDate = g.transactionDate || g.date || '';
            return gDate >= startOfMonthStr;
          });
          thisMonthGiving.forEach((g) => {
            if (g.status === 'approved' || g.status === 'completed' || !g.status) {
              approvedGivingTotal += g.amount || 0;
            } else if (g.status === 'pending') {
              pendingGivingCount++;
            }
          });
          expensesDocs.filter((ex) => ex.date && ex.date >= startOfMonthStr).forEach((ex) => {
            totalExpensesThisMonth += ex.amount || 0;
          });

          setFinanceData({
            approvedGivingThisMonth: approvedGivingTotal,
            expensesThisMonth: totalExpensesThisMonth,
            pendingVerificationCount: pendingGivingCount,
            activeCampaigns: campaignsDocs.filter((c) => c.status === 'active'),
          });
        }

        // Process Serve / Ministries (Filtered for ministry leader if applicable)
        let relevantApplications = applicationsDocs;
        let relevantAssignments = assignmentsDocs;

        if (isStrictMinistryLeader && managedMinistryIds.length > 0) {
          relevantApplications = applicationsDocs.filter((a) => managedMinistryIds.includes(a.ministryId));
          relevantAssignments = assignmentsDocs.filter((a) => managedMinistryIds.includes(a.ministryId));
        }

        const pendingAppsCount = relevantApplications.filter((a) => a.status === 'pending').length;
        const assignmentsThisWeek = relevantAssignments.filter((a) => {
          const evt = eventsDocs.find((e) => e.id === a.eventId);
          if (!evt) return false;
          const eDate = evt.startDateTime ? new Date(evt.startDateTime) : (evt.date ? new Date(evt.date + 'T00:00:00') : null);
          return eDate && eDate >= startOfWeek && eDate <= endOfWeek;
        });

        // Events missing assignments
        const eventsMissingRoster = thisWeekEvts.filter((evt) => {
          const hasRoster = assignmentsDocs.some((a) => a.eventId === evt.id);
          return !hasRoster;
        }).length;

        if (canMinistry) {
          setServeData({
            assignmentsThisWeekCount: assignmentsThisWeek.length,
            pendingApplicationsCount: pendingAppsCount,
            missingAssignmentsCount: eventsMissingRoster,
            upcomingAssignments: assignmentsThisWeek,
          });
        }

        // Process Prayer Requests
        let pendingPrayersCount = 0;
        let newPrayersThisWeek = 0;
        let answeredPrayersCount = 0;
        let privateLeaderPrayersCount = 0;
        if (canPrayer) {
          prayerDocs.forEach((p) => {
            if (p.status === 'pending') pendingPrayersCount++;
            if (p.status === 'answered') answeredPrayersCount++;
            if (p.isLeaderOnly || p.visibility === 'leader_only') privateLeaderPrayersCount++;
            
            const createdAt = p.createdAt ? (p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt)) : null;
            if (createdAt && createdAt >= startOfWeek) newPrayersThisWeek++;
          });

          setPrayerData({
            newThisWeekCount: newPrayersThisWeek,
            answeredCount: answeredPrayersCount,
            pendingReviewCount: pendingPrayersCount,
            privateLeaderCount: privateLeaderPrayersCount,
          });
        }

        // Process Groups
        let activeGroupsCount = 0;
        let groupsNoLeaderCount = 0;
        if (canGroups) {
          activeGroupsCount = groupsDocs.filter((g) => g.status === 'active' || !g.status).length;
          groupsNoLeaderCount = groupsDocs.filter((g) => !g.leaderId).length;

          setGroupsData({
            activeGroupsCount,
            meetingsThisWeekCount: Math.round(activeGroupsCount * 0.8), // estimate
            groupsWithoutLeaderCount: groupsNoLeaderCount,
            materialsCount: groupMaterialsDocs.length,
          });
        }

        // Process Worship Setlists
        let publishedSetlists = 0;
        let draftSetlists = 0;
        if (canWorship) {
          publishedSetlists = setlistDocs.filter((s) => s.status === 'published').length;
          draftSetlists = setlistDocs.filter((s) => s.status === 'draft').length;

          const linkedThisWeek = setlistDocs.filter((s) => {
            if (!s.serviceDate) return false;
            const sDate = new Date(s.serviceDate + 'T00:00:00');
            return sDate >= startOfWeek && sDate <= endOfWeek;
          }).length;

          const worshipEventsThisWeek = thisWeekEvts.filter((e) => (e.category || '').toLowerCase().includes('worship') || (e.title || '').toLowerCase().includes('service')).length;
          const missingSetlist = Math.max(0, worshipEventsThisWeek - linkedThisWeek);

          setWorshipData({
            publishedCount: publishedSetlists,
            draftCount: draftSetlists,
            linkedThisWeekCount: linkedThisWeek,
            missingSetlistForWorshipEvent: missingSetlist,
          });
        }

        // Process Sermons
        const publishedSermonsCount = sermonDocs.filter((s) => s.status === 'published' || !s.status).length;
        const draftSermonsCount = sermonDocs.filter((s) => s.status === 'draft').length;

        // Set Aggregated Metrics
        setMetrics({
          upcomingEventsCount: thisWeekEvts.length,
          monthlyAttendance: monthlyAttTotal,
          activeMembersCount: membersDocs.filter((m) => m.status === 'active' || !m.status).length,
          pendingApplicationsCount: pendingAppsCount,
          pendingGivingCount,
          activeGroupsCount,
          pendingPrayerCount: pendingPrayersCount,
          publishedSermonsCount,
        });

        setPendingCounts({
          pendingGiving: pendingGivingCount,
          pendingApplications: pendingAppsCount,
          pendingPrayers: pendingPrayersCount,
          missingAssignments: eventsMissingRoster,
          groupsWithoutLeader: groupsNoLeaderCount,
          unpublishedSermons: draftSermonsCount,
        });

        // Compile Unified Recent Activity
        const activities = [];
        applicationsDocs.slice(0, 3).forEach((a) => {
          activities.push({
            id: `app_${a.id}`,
            type: 'application',
            title: `Ministry Application: ${a.applicantName || 'Volunteer'}`,
            subtitle: `Applied for ${a.ministryName || 'Ministry'}`,
            timestamp: a.submittedAt || a.createdAt || new Date(),
          });
        });
        eventsDocs.slice(0, 3).forEach((e) => {
          activities.push({
            id: `evt_${e.id}`,
            type: 'event',
            title: `Event Scheduled: ${e.title}`,
            subtitle: e.date || 'Upcoming Service',
            timestamp: e.createdAt || new Date(),
          });
        });
        givingDocs.slice(0, 3).forEach((g) => {
          activities.push({
            id: `giv_${g.id}`,
            type: 'giving',
            title: `Donation Recorded: ₱${g.amount || 0}`,
            subtitle: `${g.donorName || 'Anonymous'} • ${g.fund || 'General'}`,
            timestamp: g.createdAt || new Date(),
          });
        });
        prayerDocs.slice(0, 3).forEach((p) => {
          activities.push({
            id: `pry_${p.id}`,
            type: 'prayer',
            title: `Prayer Request: ${p.title || p.request}`,
            subtitle: `Requested by ${p.requesterName || 'Member'}`,
            timestamp: p.createdAt || new Date(),
          });
        });
        setlistDocs.slice(0, 3).forEach((s) => {
          activities.push({
            id: `set_${s.id}`,
            type: 'setlist',
            title: `Worship Setlist: ${s.title || 'Service Setlist'}`,
            subtitle: s.serviceDate ? `Scheduled for ${s.serviceDate}` : 'Draft setlist',
            timestamp: s.createdAt || new Date(),
          });
        });

        activities.sort((a, b) => {
          const tA = a.timestamp ? (a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) : 0;
          const tB = b.timestamp ? (b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) : 0;
          return tB - tA;
        });

        setRecentActivities(activities.slice(0, 6));

        setLoading(false);
      } catch (err) {
        console.error('Error fetching role-based dashboard data:', err);
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [userProfile, CHURCH_ID, hasAccess]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-church-soft">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-bold text-church-navy">Access Restricted</h2>
        <p className="text-sm text-church-slate mt-2 max-w-md">
          Your current system role does not grant access to the admin dashboard. Please contact your church administrator if you require access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto pb-8">
      {/* 1. Header */}
      <DashboardHeader userProfile={userProfile} activeChurchName={activeChurchName} />

      {/* 2. Quick Actions */}
      <DashboardQuickActions userProfile={userProfile} />

      {/* 3. Metrics Cards */}
      <DashboardMetricCards metrics={metrics} loading={loading} userProfile={userProfile} />

      {/* 4. Core Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ThisWeekEventsCard events={thisWeekEvents} loading={loading} />
        </div>
        <div>
          <DashboardPendingTasks counts={pendingCounts} loading={loading} userProfile={userProfile} />
        </div>
      </div>

      {/* 5. Functional Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canViewAttendanceDashboard(userProfile) && (
          <AttendanceOverviewCard attendanceData={attendanceData} loading={loading} />
        )}
        {canViewFinanceDashboard(userProfile) && (
          <FinanceOverviewCard financeData={financeData} loading={loading} userProfile={userProfile} />
        )}
        {canViewMinistryDashboard(userProfile) && (
          <ServeOverviewCard serveData={serveData} loading={loading} userProfile={userProfile} />
        )}
        {canViewPrayerDashboard(userProfile) && (
          <PrayerOverviewCard prayerData={prayerData} loading={loading} userProfile={userProfile} />
        )}
        {canViewGroupsDashboard(userProfile) && (
          <GroupsOverviewCard groupsData={groupsData} loading={loading} userProfile={userProfile} />
        )}
        {canViewWorshipDashboard(userProfile) && (
          <WorshipOverviewCard worshipData={worshipData} loading={loading} userProfile={userProfile} />
        )}
      </div>

      {/* 6. Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <RecentActivityCard activityItems={recentActivities} loading={loading} />
        </div>
      </div>
    </div>
  );
}
