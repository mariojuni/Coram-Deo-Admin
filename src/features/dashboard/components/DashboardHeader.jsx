import React from 'react';
import { Calendar } from 'lucide-react';

export default function DashboardHeader({ userProfile, activeChurchName }) {
  const name = userProfile?.name || 'Leader';
  const roles = Array.isArray(userProfile?.systemRoles) ? userProfile.systemRoles : [];
  const primaryRole = userProfile?.primaryRole || roles[0] || 'member';

  const roleTitleMap = {
    super_admin: 'Super Administrator',
    church_admin: 'Church Administrator',
    pastor: 'Pastor / Ministry Overseer',
    secretary: 'Executive Secretary',
    finance_admin: 'Finance Administrator',
    ministry_leader: 'Ministry Leader',
    member: 'Member',
  };

  const getGreetingSummary = () => {
    if (roles.includes('finance_admin')) return "Here's your weekly financial & giving verification overview.";
    if (roles.includes('ministry_leader')) return "Here's what needs your team's attention this week.";
    if (roles.includes('secretary')) return "Here's this week's event schedule and attendance summary.";
    return "Here's what needs your attention this week.";
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-church-soft border border-gray-100 flex justify-between items-center relative overflow-hidden">
      <div className="z-10 relative max-w-2xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-church-green uppercase tracking-wider mb-1">
          <span>{activeChurchName || 'Local Church Workspace'}</span>
          <span>•</span>
          <span>{roleTitleMap[primaryRole] || primaryRole}</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-church-navy">
          Welcome back, {name}!
        </h1>
        <p className="text-xs lg:text-sm text-church-slate mt-1">
          Today is {currentDateFormatted}
        </p>
        <p className="text-sm font-medium text-church-navy mt-2">
          {getGreetingSummary()}
        </p>
      </div>

      {/* Decorative styling */}
      <div className="absolute right-0 top-0 bottom-0 w-64 bg-church-green/5 rounded-l-full -mr-16 transform -skew-x-12 hidden md:block"></div>
      <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:block opacity-10 text-church-navy">
        <Calendar size={110} />
      </div>
    </div>
  );
}
