import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Moon, CloudSun, Sparkles } from 'lucide-react';

export default function DashboardHeader({ userProfile, activeChurchName }) {
  const [greeting, setGreeting] = useState('Welcome back');
  const [GreetingIcon, setGreetingIcon] = useState(Sun);
  
  const name = userProfile?.name?.split(' ')[0] || 'Leader';
  const roles = Array.isArray(userProfile?.systemRoles) ? userProfile.systemRoles : [];
  const primaryRole = userProfile?.primaryRole || roles[0] || 'member';

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
      setGreetingIcon(() => CloudSun);
    } else if (hour < 18) {
      setGreeting('Good afternoon');
      setGreetingIcon(() => Sun);
    } else {
      setGreeting('Good evening');
      setGreetingIcon(() => Moon);
    }
  }, []);

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
    if (roles.includes('finance_admin')) return "Your financial & giving verification overview is ready.";
    if (roles.includes('ministry_leader')) return "Here's what needs your team's attention today.";
    if (roles.includes('secretary')) return "Your schedule and attendance summary for the week.";
    return "Here's what needs your attention this week.";
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative overflow-hidden min-h-[240px] bg-white rounded-3xl p-6 lg:p-8 shadow-church-soft border border-gray-100 group transition-all duration-500 hover:shadow-lg flex items-center">
      {/* Dynamic Background Elements - Light Theme */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-church-green/10 rounded-full blur-3xl opacity-60 group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl opacity-60 group-hover:translate-x-4 transition-transform duration-700"></div>
      <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 hidden md:block">
        <Calendar size={140} strokeWidth={1} className="text-church-navy transform group-hover:rotate-3 transition-transform duration-500" />
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-church-green/5 backdrop-blur-sm rounded-full border border-church-green/10 text-xs font-semibold tracking-wide uppercase">
            <span className="text-church-green flex items-center gap-1"><Sparkles size={14} className="text-church-green" /> {activeChurchName || 'Local Church Workspace'}</span>
            <span className="text-gray-300">•</span>
            <span className="text-church-navy/70">{roleTitleMap[primaryRole] || primaryRole}</span>
          </div>
          
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-church-navy mb-3 flex items-center gap-3">
              {greeting}, {name}! <GreetingIcon className="text-yellow-500" size={36} />
            </h1>
            <p className="text-church-green text-sm md:text-base font-medium flex items-center gap-2">
              <Calendar size={16} />
              {currentDateFormatted}
            </p>
          </div>
          
          <p className="text-church-slate text-sm md:text-base max-w-lg leading-relaxed pt-2">
            {getGreetingSummary()}
          </p>
        </div>
      </div>
    </div>
  );
}
