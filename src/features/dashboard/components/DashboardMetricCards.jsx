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
    <div className="space-y-3">
      {/* Section Eyebrow (Matching CoramDeo Mobile App screenshot 1: • SUPPORT A CAUSE) */}
      <div className="flex items-center gap-2 px-1">
        <span className="w-2 h-2 rounded-full bg-church-rose" />
        <h2 className="text-xs font-bold text-church-rose uppercase tracking-wider">
          Operations Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <SoftCard
              key={card.id}
              hover
              className="p-5 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[11px] font-bold text-church-slate uppercase tracking-wider">
                    {card.title}
                  </p>
                  <div className={`w-9 h-9 rounded-2xl ${card.iconStyle} flex items-center justify-center shrink-0`}>
                    <Icon size={18} />
                  </div>
                </div>

                <div>
                  <h3 className="text-3xl font-black text-church-charcoal tracking-tight">
                    {loading ? (
                      <span className="animate-pulse text-gray-200">...</span>
                    ) : (
                      card.value
                    )}
                  </h3>
                  <p className="text-xs text-church-slate font-medium mt-1 truncate">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              {/* Subtle accent bottom progress bar (mirroring mobile goal cards) */}
              <div className="w-full bg-gray-100/80 h-1 rounded-full mt-4 overflow-hidden">
                <div className={`h-full ${card.barColor} rounded-full w-2/3 transition-all duration-500`} />
              </div>
            </SoftCard>
          );
        })}
      </div>
    </div>
  );
}
