import React, { useState, useEffect } from 'react';
import { Sun, Moon, CloudSun, BookOpen, Building } from 'lucide-react';
import { CathedralLogo } from '../../../components/ui/icons';
import { fetchVerseOfTheDay } from '../../../utils/bibleApi';

const ROLE_TITLE_MAP = {
  super_admin: 'Super Administrator',
  church_admin: 'Church Administrator',
  pastor: 'Pastor / Overseer',
  secretary: 'Executive Secretary',
  finance_admin: 'Finance Administrator',
  ministry_leader: 'Ministry Leader',
  member: 'Leader',
};

function getGreetingInfo() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', Icon: CloudSun };
  if (hour < 18) return { text: 'Good afternoon', Icon: Sun };
  return { text: 'Good evening', Icon: Moon };
}

export default function DashboardHeader({ userProfile, activeChurchName }) {
  const { text: greeting, Icon: GreetingIcon } = getGreetingInfo();
  
  const name = userProfile?.name?.split(' ')[0] || 'Leader';
  const roles = Array.isArray(userProfile?.systemRoles) ? userProfile.systemRoles : [];
  const primaryRole = userProfile?.primaryRole || roles[0] || 'member';

  const roleTitleMap = ROLE_TITLE_MAP;

  const [votd, setVotd] = useState(null);
  const [loadingVotd, setLoadingVotd] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadVerse() {
      try {
        const data = await fetchVerseOfTheDay();
        if (isMounted && data) {
          setVotd(data);
        }
      } catch (err) {
        console.warn('[DashboardHeader] Error loading dynamic Verse of the Day:', err);
      } finally {
        if (isMounted) setLoadingVotd(false);
      }
    }
    loadVerse();
    return () => {
      isMounted = false;
    };
  }, []);

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill-badge mb-2 shadow-2xs">
            <CathedralLogo size={14} />
            <span className="text-[11px] font-bold text-[#2C4A60] tracking-wide">
              {currentDateFormatted}
            </span>
          </div>

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
          <div className="glass-light-shell px-4 py-2.5 rounded-2xl border border-white/95 shadow-church-soft flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2F7] text-[#2C4A60] flex items-center justify-center border border-[#D5E3EC]">
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

      {/* ── CoramDeo Signature Verse of the Day Card (Aligned with Mobile App Frosted Glass Card) ── */}
      <div className="glass-light-card rounded-3xl p-6 md:p-7 border border-white/95 shadow-[0_12px_36px_-6px_rgba(44,74,96,0.06)] relative overflow-hidden group transition-all duration-300">
        {/* Subtle background quote watermark */}
        <div className="absolute -top-6 right-6 text-[120px] font-serif font-black text-[#2C4A60]/5 select-none pointer-events-none leading-none">
          &ldquo;
        </div>

        <div className="relative z-10 space-y-3.5">
          {/* Top category row matching mobile screenshot 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#5A7385] uppercase tracking-wider">
                Today&apos;s focus &bull; <strong className="text-[#2C4A60]">VERSE OF THE DAY</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#4F748E] px-2.5 py-0.5 rounded-full bg-[#EBF2F7] border border-[#D5E3EC]">
                {votd?.translation || 'NIV'}
              </span>
              <div className="w-7 h-7 rounded-full glass-light-pill flex items-center justify-center text-[#4F748E]">
                <BookOpen size={14} />
              </div>
            </div>
          </div>

          {/* Scripture Reference Title */}
          <h2 className="text-2xl md:text-3xl font-black text-[#1E2E3D] tracking-tight transition-opacity duration-200">
            {votd?.reference || (loadingVotd ? 'Loading Scripture...' : 'Psalm 119:105')}
          </h2>

          {/* Scripture Verse Quotation */}
          <blockquote className="text-base md:text-lg text-[#334E68] font-normal leading-relaxed italic max-w-4xl transition-opacity duration-200">
            &ldquo;{votd?.verseText || votd?.text || (loadingVotd ? 'Loading today\'s scripture verse...' : 'Your word is a lamp to my feet and a light to my path.')}&rdquo;
          </blockquote>

          {/* Bottom Action Row (Read chapter removed as requested) */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/50">
            <span className="text-xs font-semibold text-[#5A7385]">
              Daily Walk in His Presence &bull; Coram Deo Rhythms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
