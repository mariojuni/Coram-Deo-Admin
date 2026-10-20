import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
  const { userProfile, activeChurchId, formatCurrency } = useAuth();
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

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const isSameMonth = (dateVal) => {
          if (!dateVal) return false;
          let d = null;
          if (typeof dateVal?.toDate === 'function') {
            d = dateVal.toDate();
          } else if (dateVal?.seconds) {
            d = new Date(dateVal.seconds * 1000);
          } else if (dateVal instanceof Date) {
            d = dateVal;
          } else if (typeof dateVal === 'string') {
            d = new Date(dateVal.includes('T') ? dateVal : dateVal + 'T00:00:00');
          }
          if (!d || isNaN(d.getTime())) return false;
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        };

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
          // 2: Attendance Sessions (Primary attendance tool)
          canAttendance ? getDocs(query(collection(db, 'attendance_sessions'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 3: Flat Attendance check-ins (Scanner / legacy log)
          canAttendance ? getDocs(query(collection(db, 'attendance'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 4: Giving Records
          canFinance ? getDocs(query(collection(db, 'givingRecords'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 5: Giving Expenses
          canFinance ? getDocs(query(collection(db, 'givingExpenses'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 6: Giving Campaigns
          canFinance ? getDocs(query(collection(db, 'givingCampaigns'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 7: Ministry Applications
          canMinistry ? getDocs(query(collection(db, 'ministryApplications'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 8: Ministry Assignments
          canMinistry ? getDocs(query(collection(db, 'ministryAssignments'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 9: Prayer Requests
          canPrayer ? getDocs(collection(db, 'churches', CHURCH_ID, 'prayer_requests')) : Promise.resolve(null),
          // 10: Discipleship Groups
          canGroups ? getDocs(query(collection(db, 'discipleshipGroups'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 11: Group Materials
          canGroups ? getDocs(query(collection(db, 'discipleshipGroupMaterials'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 12: Worship Setlists
          canWorship ? getDocs(query(collection(db, 'worshipSetlists'), where('churchId', '==', CHURCH_ID))) : Promise.resolve(null),
          // 13: Sermons
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
        const attendanceSessionsDocs = extractData(2);
        const attendanceDocs = extractData(3);
        const givingDocs = extractData(4);
        const expensesDocs = extractData(5);
        const campaignsDocs = extractData(6);
        const applicationsDocs = extractData(7);
        const assignmentsDocs = extractData(8);
        const prayerDocs = extractData(9);
        const groupsDocs = extractData(10);
        const groupMaterialsDocs = extractData(11);
        const setlistDocs = extractData(12);
        const sermonDocs = extractData(13);

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
        let sessionsThisMonthCount = 0;

        if (canAttendance) {
          // 1. Process attendance_sessions (where roll call / service sessions are tracked)
          const monthlySessions = [];
          attendanceSessionsDocs.forEach((s) => {
            const linkedEvent = eventsDocs.find((e) => e.id === (s.eventId || s.id));
            const sDate = s.date || s.eventDate || linkedEvent?.date || linkedEvent?.startDateTime || s.createdAt;
            
            if (isSameMonth(sDate)) {
              const present = Number(s.metrics?.present ?? (s.totalAttendance ?? s.present ?? 0));
              const late = Number(s.metrics?.late || 0);
              const visitors = Number(s.metrics?.visitors || s.firstTimeVisitors || 0);
              const totalAttendees = present + late + visitors;

              const cat = (s.category || linkedEvent?.category || s.eventTitle || s.title || linkedEvent?.title || '').toLowerCase();

              monthlySessions.push({
                id: s.id,
                date: s.date || linkedEvent?.date || '',
                totalAttendees,
                isWorship: cat.includes('worship') || cat.includes('service') || cat.includes('sunday'),
                isGroup: cat.includes('group') || cat.includes('study') || cat.includes('discipleship') || cat.includes('cell'),
              });
            }
          });

          // 2. Process flat attendance records (from scanner or manual check-in log)
          const sessionDates = new Set(monthlySessions.map((s) => s.date).filter(Boolean));
          const monthlyCheckins = attendanceDocs.filter((a) => {
            const aDate = a.date || a.timestamp || a.createdAt;
            return isSameMonth(aDate);
          });

          if (monthlySessions.length > 0) {
            sessionsThisMonthCount = monthlySessions.length;
            monthlyAttTotal = monthlySessions.reduce((sum, s) => sum + s.totalAttendees, 0);

            // Add any check-ins on dates not covered by attendance sessions to prevent undercounting
            const extraCheckins = monthlyCheckins.filter((a) => !sessionDates.has(a.date));
            monthlyAttTotal += extraCheckins.length;

            const worshipSessions = monthlySessions.filter((s) => s.isWorship);
            const worshipTotal = worshipSessions.reduce((sum, s) => sum + s.totalAttendees, 0);
            worshipAvg = worshipSessions.length > 0 ? Math.round(worshipTotal / worshipSessions.length) : 0;

            const groupSessions = monthlySessions.filter((s) => s.isGroup);
            const groupTotal = groupSessions.reduce((sum, s) => sum + s.totalAttendees, 0);
            groupsAvg = groupSessions.length > 0 ? Math.round(groupTotal / groupSessions.length) : 0;
          } else if (monthlyCheckins.length > 0) {
            monthlyAttTotal = monthlyCheckins.length;
            const checkinsByDate = {};
            monthlyCheckins.forEach((a) => {
              const d = a.date || 'unknown';
              checkinsByDate[d] = (checkinsByDate[d] || 0) + 1;
            });
            const uniqueDates = Object.keys(checkinsByDate);
            worshipAvg = uniqueDates.length > 0 ? Math.round(monthlyAttTotal / uniqueDates.length) : 0;
            groupsAvg = 0;
          }

          setAttendanceData({
            totalThisMonth: monthlyAttTotal,
            worshipAvg,
            groupsAvg,
            sessionsCount: sessionsThisMonthCount,
            monthName: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
          });
        }

        // Process Finance
        let approvedGivingTotal = 0;
        let pendingGivingCount = 0;
        let totalExpensesThisMonth = 0;
        if (canFinance) {
          givingDocs.forEach((g) => {
            if (g.status === 'pending') {
              pendingGivingCount++;
            }
            const gDate = g.transactionDate || g.date || g.createdAt;
            if (isSameMonth(gDate)) {
              if (g.status === 'approved' || g.status === 'completed' || !g.status) {
                approvedGivingTotal += Number(g.amount || 0);
              }
            }
          });

          expensesDocs.forEach((ex) => {
            const exDate = ex.date || ex.createdAt;
            if (isSameMonth(exDate)) {
              totalExpensesThisMonth += Number(ex.amount || 0);
            }
          });

          setFinanceData({
            approvedGivingThisMonth: approvedGivingTotal,
            expensesThisMonth: totalExpensesThisMonth,
            pendingVerificationCount: pendingGivingCount,
            activeCampaigns: campaignsDocs.filter((c) => (c.status || '').toLowerCase() === 'active'),
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
            title: `Donation Recorded: ${formatCurrency(g.amount || 0)}`,
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
    <div className="space-y-4 md:space-y-5 flex flex-col h-full overflow-y-auto pb-8">
      {/* 1. Header */}
      <DashboardHeader userProfile={userProfile} activeChurchName={activeChurchName} />

      {/* 2. Quick Actions */}
      <DashboardQuickActions userProfile={userProfile} />

      {/* 3. Metrics Cards */}
      <DashboardMetricCards metrics={metrics} loading={loading} userProfile={userProfile} />

      {/* 4. Core Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-4.5">
        <div className="lg:col-span-2">
          <ThisWeekEventsCard events={thisWeekEvents} loading={loading} />
        </div>
        <div>
          <DashboardPendingTasks counts={pendingCounts} loading={loading} userProfile={userProfile} />
        </div>
      </div>

      {/* 5. Functional Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-4.5">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-4.5">
        <div className="lg:col-span-3">
          <RecentActivityCard activityItems={recentActivities} loading={loading} />
        </div>
      </div>
    </div>
  );
}
