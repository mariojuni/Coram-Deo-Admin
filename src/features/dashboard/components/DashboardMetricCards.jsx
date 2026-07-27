import React from 'react';
import { 
  Calendar, 
  Users, 
  HeartHandshake, 
  ClipboardCheck, 
  BookOpenCheck, 
  BookOpen, 
  CreditCard, 
  Clock, 
  Shield 
} from 'lucide-react';
import { 
  canViewFinanceDashboard, 
  canViewPrayerDashboard, 
  canViewAttendanceDashboard,
  canViewMinistryDashboard,
  canViewGroupsDashboard
} from '../../../utils/dashboardPermissions';

export default function DashboardMetricCards({ metrics, loading, userProfile }) {
  const showFinance = canViewFinanceDashboard(userProfile);
  const showPrayer = canViewPrayerDashboard(userProfile);
  const showAttendance = canViewAttendanceDashboard(userProfile);
  const showMinistry = canViewMinistryDashboard(userProfile);
  const showGroups = canViewGroupsDashboard(userProfile);

  const cards = [];

  // 1. Upcoming Events
  cards.push({
    id: 'events',
    title: 'Events This Week',
    value: metrics.upcomingEventsCount,
    subtitle: 'Published events scheduled',
    icon: Calendar,
    color: 'bg-blue-50 text-blue-600',
  });

  // 2. Attendance
  if (showAttendance) {
    cards.push({
      id: 'attendance',
      title: 'Attendance This Month',
      value: metrics.monthlyAttendance,
      subtitle: 'Total check-ins recorded',
      icon: ClipboardCheck,
      color: 'bg-purple-50 text-purple-600',
    });
  }

  // 3. Members
  cards.push({
    id: 'members',
    title: 'Active Members',
    value: metrics.activeMembersCount,
    subtitle: 'Registered directory users',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600',
  });

  // 4. Pending Applications
  if (showMinistry) {
    cards.push({
      id: 'applications',
      title: 'Pending Applications',
      value: metrics.pendingApplicationsCount,
      subtitle: 'Volunteer signups awaiting review',
      icon: Shield,
      color: 'bg-amber-50 text-amber-600',
    });
  }

  // 5. Pending Verification (Finance)
  if (showFinance) {
    cards.push({
      id: 'giving_verification',
      title: 'Pending Verification',
      value: metrics.pendingGivingCount,
      subtitle: 'Donation receipts to verify',
      icon: CreditCard,
      color: 'bg-orange-50 text-orange-600',
    });
  }

  // 6. Active Groups
  if (showGroups) {
    cards.push({
      id: 'groups',
      title: 'Active Small Groups',
      value: metrics.activeGroupsCount,
      subtitle: 'Registered discipleship groups',
      icon: BookOpenCheck,
      color: 'bg-indigo-50 text-indigo-600',
    });
  }

  // 7. Pending Prayer Requests
  if (showPrayer) {
    cards.push({
      id: 'prayers',
      title: 'Pending Prayer Requests',
      value: metrics.pendingPrayerCount,
      subtitle: 'Requests needing moderation',
      icon: HeartHandshake,
      color: 'bg-rose-50 text-rose-600',
    });
  }

  // 8. Sermons
  cards.push({
    id: 'sermons',
    title: 'Published Sermons',
    value: metrics.publishedSermonsCount,
    subtitle: 'Media archive library',
    icon: BookOpen,
    color: 'bg-teal-50 text-teal-600',
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white p-5 rounded-3xl shadow-church-soft border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-church-navy uppercase tracking-wider">
                {card.title}
              </p>
              <div className={`p-2 rounded-xl ${card.color}`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-bold text-church-navy">
                {loading ? (
                  <span className="animate-pulse text-gray-300">...</span>
                ) : (
                  card.value
                )}
              </h3>
              <p className="text-xs text-church-slate font-medium mt-1">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
