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
  ShieldCheck, 
  ChevronRight,
  ExternalLink 
} from 'lucide-react';
import GradientButton from '../../components/ui/GradientButton';

export default function RolePillars() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(0);

  const roles = [
    {
      id: 'treasurer',
      badge: 'Treasurer · Bookkeeper',
      title: 'Account for every peso, without the late Sunday nights',
      icon: Wallet,
      color: 'text-church-rose',
      bgColor: 'bg-pink-50',
      activeColor: 'border-church-rose',
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
      color: 'text-church-violet',
      bgColor: 'bg-purple-50',
      activeColor: 'border-church-violet',
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
      color: 'text-church-emerald',
      bgColor: 'bg-emerald-50',
      activeColor: 'border-church-emerald',
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
      color: 'text-church-amber',
      bgColor: 'bg-amber-50',
      activeColor: 'border-church-amber',
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
      color: 'text-church-rose',
      bgColor: 'bg-pink-50',
      activeColor: 'border-church-rose',
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

  const current = roles[activeRole];
  const CurrentIcon = current.icon;

  return (
    <section id="roles" className="py-20 lg:py-28 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-church-canvas border border-gray-200 text-xs font-bold text-church-charcoal uppercase tracking-wider mb-3">
            Engineered For Your Role
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-church-charcoal tracking-tight">
            Built for the faithful leaders who keep church running.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-church-slate leading-relaxed">
            Whether you balance the books, shepherd the congregation, organize the bulletin, or lead worship, Coram Deo is custom-tailored to your weekly ministry rhythm.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-3 pb-3 mb-8 border-b border-gray-100">
          {roles.map((r, idx) => {
            const Icon = r.icon;
            const isSelected = activeRole === idx;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRole(idx)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0
                  ${isSelected 
                    ? 'bg-church-charcoal text-white shadow-church-elevated scale-100' 
                    : 'bg-church-canvas text-church-slate hover:text-church-charcoal hover:bg-gray-100/80'}
                `}
              >
                <Icon size={16} className={isSelected ? 'text-pink-400' : 'text-church-slate'} />
                <span>{r.badge.split('·')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Role Card Deep Dive */}
        <div className="bg-church-canvas rounded-3xl border border-gray-100/90 p-6 sm:p-10 lg:p-12 shadow-church-soft">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-9 h-9 rounded-xl ${current.bgColor} ${current.color} flex items-center justify-center font-bold`}>
                  <CurrentIcon size={18} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-church-charcoal">
                  {current.badge}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight leading-snug">
                {current.title}
              </h3>

              <p className="mt-3 text-base text-church-slate leading-relaxed">
                {current.description}
              </p>

              {/* Highlights checklist */}
              <div className="mt-6 space-y-3 w-full">
                {current.highlights.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-church-emerald flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-church-charcoal">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

              {/* Role Actions */}
              <div className="mt-8 flex flex-wrap gap-4 items-center pt-6 border-t border-gray-200/60 w-full">
                {current.appStoreUrl ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={current.appStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-church-charcoal hover:bg-black text-white text-xs font-bold rounded-2xl shadow-church-soft transition-all hover:scale-[1.02]"
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
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-church-charcoal hover:bg-black text-white text-xs font-bold rounded-2xl shadow-church-soft transition-all hover:scale-[1.02]"
                    >
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-.926V2.74c0-.348.117-.68.324-.926h.285zm11.242 11.245l2.253 2.253-11.45 6.44 9.197-8.693zm2.253-2.254L14.85 8.552 5.654 2.112l11.45 6.44zm1.058 1.058l3.197 1.8a1.5 1.5 0 0 1 0 2.612l-3.197 1.8-1.74-1.74 1.74-1.472z" />
                      </svg>
                      <span>Google Play</span>
                      <ExternalLink size={12} className="text-white/70" />
                    </a>
                    <a
                      href="#mobile-app"
                      className="text-xs font-bold text-church-charcoal hover:text-church-rose transition-colors py-2 px-1 flex items-center gap-1"
                    >
                      <span>Preview Screens</span>
                      <ChevronRight size={13} />
                    </a>
                  </div>
                ) : current.ctaUrl ? (
                  <a
                    href={current.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <GradientButton
                      size="md"
                      className="shadow-church-glow cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span>{current.ctaText}</span>
                        <ExternalLink size={15} />
                      </span>
                    </GradientButton>
                  </a>
                ) : (
                  <GradientButton
                    size="md"
                    onClick={() => navigate(current.targetUrl || '/register')}
                    className="shadow-church-glow"
                  >
                    {current.ctaText}
                  </GradientButton>
                )}

                <button
                  onClick={() => navigate('/login')}
                  className="text-xs font-bold text-church-charcoal hover:text-church-rose flex items-center gap-1 transition-colors"
                >
                  <span>Already an admin? Sign in here</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Right Visual Sandbox Pill */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-church-soft">
              <div className="text-xs font-bold text-church-slate uppercase tracking-wider mb-2">
                Included in Your Setup
              </div>
              <div className="text-base font-extrabold text-church-charcoal mb-4">
                {current.portalBenefit}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-church-canvas rounded-xl border border-gray-100 flex items-center justify-between text-xs font-semibold text-church-charcoal">
                  <span>Audit Logging & Timestamps</span>
                  <span className="text-church-emerald font-bold">Enabled</span>
                </div>
                <div className="p-3 bg-church-canvas rounded-xl border border-gray-100 flex items-center justify-between text-xs font-semibold text-church-charcoal">
                  <span>Export Formats (PDF/Excel)</span>
                  <span className="text-church-emerald font-bold">Included</span>
                </div>
                <div className="p-3 bg-church-canvas rounded-xl border border-gray-100 flex items-center justify-between text-xs font-semibold text-church-charcoal">
                  <span>Mobile Push & App Sync</span>
                  <span className="text-church-emerald font-bold">Live</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <span className="text-xs text-church-slate">
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
