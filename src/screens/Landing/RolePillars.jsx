import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  ArrowRight, 
  Wallet, 
  User, 
  Calendar, 
  Music, 
  Smartphone, 
  ChevronRight,
  ExternalLink 
} from 'lucide-react';
import GradientButton from '../../components/ui/GradientButton';
import { CathedralLogo } from '../../components/ui/icons';

const ROLES = [
    {
      id: 'treasurer',
      badge: 'Treasurer · Bookkeeper',
      title: 'Account for every peso, without the late Sunday nights',
      icon: Wallet,
      color: 'text-brand-primary',
      bgColor: 'bg-blue-100/80',
      activeColor: 'border-brand-primary',
      description: 'End the frustration of manual notebook tallies and messy Excel formulas. Record Sunday collections by envelope and fund in minutes.',
      highlights: [
        'Record tithes, loose offerings, and missions by fund in minutes',
        'Trace any donation from Sunday envelope to bank deposit slip',
        'Board-ready financial statements and P&L exports in one click',
        'Manage designated giving campaigns and building fund targets'
      ],
      portalBenefit: 'Authorized Finance Admin role with restricted ledger access',
      ctaText: 'Start Free as Treasurer',
      targetUrl: '/register?role=finance_admin&title=Head%20Treasurer'
    },
    {
      id: 'pastor',
      badge: 'Pastor · Ministry Director',
      title: 'Know your flock and lead with clarity and discernment',
      icon: User,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100/80',
      activeColor: 'border-indigo-600',
      description: 'Keep pastoral touch with every family in your church. Track discipleship milestones, pastoral care prayer requests, and attendance health.',
      highlights: [
        'View complete family units, baptism dates, and spiritual milestones',
        'Confidential prayer wall for sensitive pastoral follow-ups',
        'Track Sunday attendance trends and identify missing members',
        'Transparent, audit-backed financial summaries for board meetings'
      ],
      portalBenefit: 'Pastor portal with discipleship & spiritual oversight tools',
      ctaText: 'Start Free as Pastor',
      targetUrl: '/register?role=pastor&title=Senior%20Pastor'
    },
    {
      id: 'secretary',
      badge: 'Secretary · Church Admin',
      title: 'One directory, one calendar — no more lost notebooks',
      icon: Calendar,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100/80',
      activeColor: 'border-emerald-600',
      description: 'Consolidate all church rosters, contact details, and events into a single modern database accessible anywhere.',
      highlights: [
        'Find any member contact number or address in seconds',
        'Seamless Sunday service attendance check-in via camera QR scanner',
        'Publish church-wide announcements and event schedules',
        'Audit-logged user management with customizable role permissions'
      ],
      portalBenefit: 'Secretary workspace with member registry & attendance kiosk',
      ctaText: 'Start Free as Secretary',
      targetUrl: '/register?role=secretary&title=Church%20Secretary'
    },
    {
      id: 'worship',
      badge: 'Worship · Music Ministry',
      title: 'Organize setlists and chord charts without the group-chat chaos',
      icon: Music,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100/80',
      activeColor: 'border-amber-600',
      description: 'Say goodbye to printing thick binders and scrambling for song keys on Sunday morning. Plan setlists and synchronize lyrics directly.',
      highlights: [
        'Centralized song library with lyrics, genre & language filters, and audio links',
        'Instant musical key transposition (+/-), Capo calculator, and Sharps/Flats toggle',
        'Assign band members, vocalists, and sound engineers with automated reminders',
        'Mobile integration: Musicians rehearse with chords and save arrangements to setlists'
      ],
      portalBenefit: 'Ministry Leader access for setlists, songs, and serving rosters',
      ctaText: 'Start Free as Worship Leader',
      targetUrl: '/register?role=ministry_leader&title=Worship%20Director'
    },
    {
      id: 'member',
      badge: 'Congregation · Member',
      title: 'A spiritual companion for everyday discipleship',
      icon: Smartphone,
      color: 'text-brand-primary',
      bgColor: 'bg-blue-100/80',
      activeColor: 'border-brand-primary',
      description: 'Give your members a personal, spiritual pocket companion on iOS and Android to engage with church life 7 days a week.',
      highlights: [
        'Digital Member QR badge for 2-second contactless Sunday check-in',
        'In-app Bible study: Compare versions, linked cross references, & highlights',
        'Stream Sunday sermon audio/video with offline download support',
        'Secure online giving (GCash, Maya, cards) with personal giving history'
      ],
      portalBenefit: 'Free native iOS & Android companion app for every church member',
      appStoreUrl: 'https://apps.apple.com/ph/app/coramdeo-life/id6802314896',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.coramdeo.app.prod&pcampaignid=web_share'
    }
  ];

export default function RolePillars() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(0);

  const current = ROLES[activeRole];
  const CurrentIcon = current.icon;

  return (
    <section id="roles" className="py-20 lg:py-28 bg-transparent border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill-badge mb-3">
            <CathedralLogo size={15} />
            <span className="text-[11px] font-bold text-[#2C4A60] uppercase tracking-wider">Engineered For Church Leadership</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2E3D] tracking-tight">
            Built for the faithful leaders who keep church running.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#476072] leading-relaxed">
            Whether you balance the books, shepherd the congregation, organize the bulletin, or lead worship, Coram Deo is custom-tailored to your weekly ministry rhythm.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-3 pb-3 mb-8 border-b border-white/60">
          {ROLES.map((r, idx) => {
            const Icon = r.icon;
            const isSelected = activeRole === idx;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRole(idx)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0
                  ${isSelected 
                    ? 'bg-[#162533] text-white shadow-sm scale-100' 
                    : 'glass-light-pill text-[#5A7385] hover:text-[#1E2E3D] hover:bg-white'}
                `}
              >
                <Icon size={16} className={isSelected ? 'text-sky-300' : 'text-[#7E97A8]'} />
                <span>{r.badge.split('·')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Role Card Deep Dive */}
        <div className="glass-light-card rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_12px_36px_-6px_rgba(71,108,133,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-9 h-9 rounded-xl ${current.bgColor} ${current.color} flex items-center justify-center font-bold shadow-2xs`}>
                  <CurrentIcon size={18} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2C4A60]">
                  {current.badge}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-[#1E2E3D] tracking-tight leading-snug">
                {current.title}
              </h3>

              <p className="mt-3 text-base text-[#476072] leading-relaxed">
                {current.description}
              </p>

              {/* Highlights checklist */}
              <div className="mt-6 space-y-3 w-full">
                {current.highlights.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/50">
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-[#1E2E3D]">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

              {/* Role Actions */}
              <div className="mt-8 flex flex-wrap gap-4 items-center pt-6 border-t border-slate-200/60 w-full">
                {current.appStoreUrl ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={current.appStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#162533] hover:bg-[#243746] text-white text-xs font-bold rounded-2xl shadow-xs transition-all hover:scale-[1.02]"
                    >
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.35-.58.66-1.09 1.73-.95 2.76 1 .08 2.04-.51 2.66-1.26z" />
                      </svg>
                      <span>App Store</span>
                      <ExternalLink size={12} className="text-white/70" />
                    </a>
                    <a
                      href={current.playStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#162533] hover:bg-[#243746] text-white text-xs font-bold rounded-2xl shadow-xs transition-all hover:scale-[1.02]"
                    >
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-.926V2.74c0-.348.117-.68.324-.926h.285zm11.242 11.245l2.253 2.253-11.45 6.44 9.197-8.693zm2.253-2.254L14.85 8.552 5.654 2.112l11.45 6.44zm1.058 1.058l3.197 1.8a1.5 1.5 0 0 1 0 2.612l-3.197 1.8-1.74-1.74 1.74-1.472z" />
                      </svg>
                      <span>Google Play</span>
                      <ExternalLink size={12} className="text-white/70" />
                    </a>
                    <a
                      href="#mobile-app"
                      className="text-xs font-bold text-[#476072] hover:text-[#1E2E3D] transition-colors py-2 px-1 flex items-center gap-1"
                    >
                      <span>Preview Screens</span>
                      <ChevronRight size={13} />
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(current.targetUrl || '/register')}
                    className="h-11 px-6 text-sm font-bold rounded-full bg-[#162533] hover:bg-[#243746] text-white shadow-sm transition-all"
                  >
                    {current.ctaText}
                  </button>
                )}

                <button
                  onClick={() => navigate('/login')}
                  className="text-xs font-bold text-[#5A7385] hover:text-[#1E2E3D] flex items-center gap-1 transition-colors"
                >
                  <span>Already an admin? Sign in here</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Right Visual Sandbox Pill */}
            <div className="lg:col-span-5 bg-white/80 backdrop-blur-md rounded-2xl border border-white/95 p-6 shadow-2xs">
              <div className="text-xs font-bold text-[#7E97A8] uppercase tracking-wider mb-2">
                Included in Your Setup
              </div>
              <div className="text-base font-extrabold text-[#1E2E3D] mb-4">
                {current.portalBenefit}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white/90 rounded-xl border border-white/95 flex items-center justify-between text-xs font-semibold text-[#1E2E3D] shadow-2xs">
                  <span>Audit Logging & Timestamps</span>
                  <span className="text-emerald-700 font-bold">Enabled</span>
                </div>
                <div className="p-3 bg-white/90 rounded-xl border border-white/95 flex items-center justify-between text-xs font-semibold text-[#1E2E3D] shadow-2xs">
                  <span>Export Formats (PDF/Excel)</span>
                  <span className="text-emerald-700 font-bold">Included</span>
                </div>
                <div className="p-3 bg-white/90 rounded-xl border border-white/95 flex items-center justify-between text-xs font-semibold text-[#1E2E3D] shadow-2xs">
                  <span>Mobile Push & App Sync</span>
                  <span className="text-emerald-700 font-bold">Live</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/50 text-center">
                <span className="text-xs text-[#7E97A8]">
                  Zero setup fee • Transition support provided
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
