import React from 'react';
import { 
  Calendar, 
  Users, 
  HeartHandshake, 
  ClipboardCheck, 
  BookOpenCheck, 
  BookOpen, 
  CreditCard, 
  Shield 
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
    subtitle: 'Scheduled ministry services',
    icon: Calendar,
    iconStyle: 'bg-pink-50 text-church-rose',
    barColor: 'bg-church-rose',
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
      barColor: 'bg-church-emerald',
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
    barColor: 'bg-church-violet',
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
      barColor: 'bg-church-amber',
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
      barColor: 'bg-church-amber',
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
      barColor: 'bg-church-violet',
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
      barColor: 'bg-church-rose',
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
    barColor: 'bg-church-emerald',
  });

  return (
    <div className="space-y-2.5">
      {/* Section Eyebrow */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-church-rose" />
          <h2 className="text-xs font-bold text-church-rose uppercase tracking-wider">
            Operations Overview
          </h2>
        </div>
        <span className="hidden sm:inline text-[11px] text-church-slate font-medium">Real-time ministry metrics</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2.5 md:gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <SoftCard
              key={card.id}
              hover
              className="p-3 md:p-3.5 rounded-2xl flex flex-col justify-between border border-gray-100/90 hover:border-gray-200 transition-all duration-150"
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[11px] font-bold text-church-slate uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`w-7 h-7 rounded-lg ${card.iconStyle} flex items-center justify-center shrink-0`}>
                  <Icon size={14} />
                </div>
              </div>

              <div>
                <h3 className="text-xl md:text-2xl font-black text-church-charcoal tracking-tight leading-none">
                  {loading ? (
                    <span className="animate-pulse text-gray-200">...</span>
                  ) : (
                    card.value
                  )}
                </h3>
                <p className="text-[11px] text-church-slate font-medium mt-1 truncate">
                  {card.subtitle}
                </p>

                {/* Accent bottom progress bar */}
                <div className="w-full bg-gray-100/90 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className={`h-full ${card.barColor} rounded-full w-2/3 transition-all duration-500`} />
                </div>
              </div>
            </SoftCard>
          );
        })}
      </div>
    </div>
  );
}
