import React, { useState, useEffect } from 'react';
import { Sun, Moon, CloudSun, BookOpen, Building } from 'lucide-react';
import StatusPill from '../../../components/ui/StatusPill';

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
    pastor: 'Pastor / Overseer',
    secretary: 'Executive Secretary',
    finance_admin: 'Finance Administrator',
    ministry_leader: 'Ministry Leader',
    member: 'Leader',
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* ── Top Greeting Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Mobile-aligned Date Eyebrow Pill */}
          <StatusPill variant="rose" dot className="mb-2">
            {currentDateFormatted}
          </StatusPill>

          <p className="text-church-slate text-sm font-medium">
            {greeting},
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-church-charcoal tracking-tight flex items-center gap-2">
            <span>{name}!</span>
            <GreetingIcon className="text-amber-400 shrink-0" size={28} />
          </h1>
        </div>

        {/* Church & Role Pill Badge */}
        <div className="flex items-center gap-2">
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-100/90 shadow-church-soft flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-church-rose flex items-center justify-center">
              <Building size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-church-charcoal">
                {activeChurchName || 'Local Church Workspace'}
              </div>
              <div className="text-[10px] font-semibold text-church-slate uppercase tracking-wider">
                {roleTitleMap[primaryRole] || primaryRole}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CoramDeo Signature Verse of the Day Card (Directly adopting CoramDeo Mobile System Design) ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-7 text-white shadow-[0_10px_25px_-5px_rgba(224,64,160,0.22)] bg-gradient-to-r from-[#FC709D] via-[#BD6DF2] to-[#B069F5] border border-white/20 group transition-all duration-300">
        {/* Top hairline shine bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/35 via-white/10 to-transparent" />

        {/* Ambient atmospheric luminous orbs */}
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-white/[0.08] blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/[0.06] blur-lg pointer-events-none" />

        {/* Top-right dot matrix grid */}
        <div className="absolute top-5 right-6 grid grid-cols-5 gap-2 opacity-20 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-white" />
          ))}
        </div>

        {/* Subtle decorative watermark open-quote (matching mobile's decorativeQuote) */}
        <div className="absolute -top-6 right-6 text-[130px] font-serif font-black text-white/[0.07] select-none pointer-events-none leading-none">
          &ldquo;
        </div>

        <div className="relative z-10 max-w-3xl space-y-3.5">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/18 border border-white/30 backdrop-blur-sm text-[9.5px] font-bold tracking-[1.4px] uppercase text-white/95">
            <span>VERSE OF THE DAY</span>
          </div>

          {/* Scripture verse text */}
          <blockquote className="font-serif text-base md:text-lg lg:text-xl font-normal leading-relaxed text-white/95 tracking-wide">
            &ldquo;10The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full.&rdquo;
          </blockquote>

          {/* Divider */}
          <div className="h-px bg-white/15 my-3" />

          {/* Bottom row: Scripture Reference */}
          <div className="pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/18 border border-white/30 text-xs font-bold text-white tracking-wide">
              <BookOpen size={12} className="text-white/90" />
              <span>John 10:10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
