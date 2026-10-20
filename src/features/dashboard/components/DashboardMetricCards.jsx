import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  HeartHandshake, 
  ClipboardCheck, 
  BookOpenCheck, 
  BookOpen, 
  CreditCard, 
  Shield,
  ChevronRight
} from 'lucide-react';
import { 
  canViewFinanceDashboard, 
  canViewPrayerDashboard, 
  canViewAttendanceDashboard, 
  canViewMinistryDashboard, 
  canViewGroupsDashboard 
} from '../../../utils/dashboardPermissions';
import SoftCard from '../../../components/ui/SoftCard';

export default function DashboardMetricCards({ metrics, loading, userProfile }) {
  const showFinance = canViewFinanceDashboard(userProfile);
  const showPrayer = canViewPrayerDashboard(userProfile);
  const showAttendance = canViewAttendanceDashboard(userProfile);
  const showMinistry = canViewMinistryDashboard(userProfile);
  const showGroups = canViewGroupsDashboard(userProfile);

  const cards = [];

  // 1. Upcoming Events (Rose)
  cards.push({
    id: 'events',
    title: 'Events This Week',
    value: metrics.upcomingEventsCount,
    subtitle: 'Scheduled services',
    icon: Calendar,
    iconStyle: 'bg-pink-50 text-church-rose',
    path: '/admin/events',
  });

  // 2. Attendance (Emerald)
  if (showAttendance) {
    cards.push({
      id: 'attendance',
      title: 'Attendance This Month',
      value: metrics.monthlyAttendance,
      subtitle: 'Recorded member check-ins',
      icon: ClipboardCheck,
      iconStyle: 'bg-emerald-50 text-church-emerald',
      path: '/admin/attendance',
    });
  }

  // 3. Members (Violet)
  cards.push({
    id: 'members',
    title: 'Active Members',
    value: metrics.activeMembersCount,
    subtitle: 'Linked church directory',
    icon: Users,
    iconStyle: 'bg-purple-50 text-church-violet',
    path: '/admin/members',
  });

  // 4. Pending Applications (Amber)
  if (showMinistry) {
    cards.push({
      id: 'applications',
      title: 'Pending Applications',
      value: metrics.pendingApplicationsCount,
      subtitle: 'Volunteer signups to review',
      icon: Shield,
      iconStyle: 'bg-amber-50 text-church-amber',
      path: '/admin/ministries/applications',
    });
  }

  // 5. Pending Verification / Finance (Rose/Amber)
  if (showFinance) {
    cards.push({
      id: 'giving_verification',
      title: 'Pending Verification',
      value: metrics.pendingGivingCount,
      subtitle: 'Giving slips to verify',
      icon: CreditCard,
      iconStyle: 'bg-amber-50 text-church-amber',
      path: '/admin/finance/giving',
    });
  }

  // 6. Active Groups (Violet)
  if (showGroups) {
    cards.push({
      id: 'groups',
      title: 'Active Groups',
      value: metrics.activeGroupsCount,
      subtitle: 'Discipleship communities',
      icon: BookOpenCheck,
      iconStyle: 'bg-purple-50 text-church-violet',
      path: '/admin/discipleship/groups',
    });
  }

  // 7. Pending Prayer Requests (Rose)
  if (showPrayer) {
    cards.push({
      id: 'prayers',
      title: 'Prayer Moderation',
      value: metrics.pendingPrayerCount,
      subtitle: 'Awaiting leadership review',
      icon: HeartHandshake,
      iconStyle: 'bg-pink-50 text-church-rose',
      path: '/admin/prayer',
    });
  }

  // 8. Sermons (Emerald)
  cards.push({
    id: 'sermons',
    title: 'Published Sermons',
    value: metrics.publishedSermonsCount,
    subtitle: 'Media & audio archive',
    icon: BookOpen,
    iconStyle: 'bg-emerald-50 text-church-emerald',
    path: '/admin/sermons',
  });

  return (
    <SoftCard className="p-6 flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-church-rose" />
            <span className="text-[10px] font-bold text-church-rose uppercase tracking-wider">
              Operations
            </span>
          </div>
          <h2 className="text-base md:text-lg font-black text-church-charcoal tracking-tight">
            Overview
          </h2>
          <p className="text-xs text-church-slate">Real-time ministry vitals & health</p>
        </div>
      </div>

      {/* ── List Content (No progress bars) ── */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[460px]">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              to={card.path}
              className="flex items-center justify-between p-3.5 border border-gray-100/90 rounded-2xl hover:border-gray-200 hover:bg-gray-50/70 transition-all duration-150 group bg-white"
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className={`w-9 h-9 rounded-xl ${card.iconStyle} flex items-center justify-center shrink-0 border border-gray-100/50`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs md:text-sm font-bold text-church-charcoal truncate group-hover:text-church-rose transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-church-slate truncate mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 pl-2">
                <span className="text-base md:text-lg font-black text-church-charcoal tracking-tight group-hover:text-church-rose transition-colors">
                  {loading ? (
                    <span className="animate-pulse text-gray-200">...</span>
                  ) : (
                    card.value
                  )}
                </span>
                <ChevronRight size={15} className="text-church-muted group-hover:text-church-rose group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </SoftCard>
  );
}
