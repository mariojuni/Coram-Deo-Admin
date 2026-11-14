import React, { useState } from 'react';
import { 
  Wallet, 
  Users, 
  QrCode, 
  CalendarDays, 
  Music, 
  Check, 
  Search
} from 'lucide-react';
import StatusPill from '../../components/ui/StatusPill';
import { CathedralLogo } from '../../components/ui/icons';

const PILLARS = [
    {
      id: 'treasury',
      title: 'Treasury & Giving',
      subtitle: 'Complete financial stewardship with audit trails',
      icon: Wallet,
      color: 'text-brand-primary',
      bg: 'bg-blue-100/80',
      description: 'Account for every contribution with envelope-level precision. Set up custom fundraising campaigns with monetary goals that automatically push live to the congregation mobile app.',
      features: [
        'Admin-configured fundraising campaigns with live target progress bars',
        'Custom designated funds (Tithes, Offerings, Building, Compassion, Missions)',
        'One-click PDF/Excel financial reports for pastors and church board',
        'Strict audit logs detailing who recorded each contribution'
      ],
      previewUI: (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 mb-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sunday Collection Overview</div>
              <div className="text-2xl font-black text-brand-dark">₱128,450.00</div>
            </div>
            <StatusPill variant="navy" size="sm">Audited & Reconciled</StatusPill>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/75 border border-white/90 shadow-2xs">
              <span className="font-bold text-slate-700">General Tithes Fund</span>
              <span className="font-extrabold text-brand-dark">₱84,200 (65%)</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/75 border border-white/90 shadow-2xs">
              <span className="font-bold text-slate-700">Building & Sanctuary Fund</span>
              <span className="font-extrabold text-brand-dark">₱28,750 (22%)</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/75 border border-white/90 shadow-2xs">
              <span className="font-bold text-slate-700">Global Missions Support</span>
              <span className="font-extrabold text-brand-dark">₱15,500 (13%)</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100/80 text-xs text-slate-800 flex items-center justify-between">
            <span className="font-medium">Board Financial Statement ready for export</span>
            <span className="font-bold text-brand-primary cursor-pointer hover:underline">Download PDF</span>
          </div>
        </div>
      )
    },
    {
      id: 'members',
      title: 'Member Directory & Families',
      subtitle: 'Know and nurture every household in your flock',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100/80',
      description: 'Keep rich, organized profiles of members and their families. Record spiritual milestones like baptism dates, salvation journeys, and ministry affiliations.',
      features: [
        'Family household unit linking (Parents, Children, Relatives)',
        'Spiritual milestones tracking: Baptism date, Salvation, Membership class',
        'Custom tagging by discipleship life groups and ministry departments',
        'Role-governed privacy: Non-authorized volunteers cannot see sensitive records'
      ],
      previewUI: (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 mb-3">
            <div className="flex items-center gap-2">
              <Search size={15} className="text-slate-500" />
              <span className="text-xs font-bold text-brand-dark">Member Directory (342 Active)</span>
            </div>
            <span className="text-xs text-slate-500">Filters: Active, Baptized</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-white/75 border border-white/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-brand-primary font-black text-xs flex items-center justify-center">
                  JD
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-dark">Jonathan Dela Cruz</div>
                  <div className="text-[10px] text-slate-500">Family Head • Discipleship Group Alpha</div>
                </div>
              </div>
              <StatusPill variant="steel" size="xs">Baptized 2021</StatusPill>
            </div>

            <div className="p-3 rounded-xl bg-white/75 border border-white/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                  ER
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-dark">Elena Reyes</div>
                  <div className="text-[10px] text-slate-500">Worship Ministry • Sunday School Teacher</div>
                </div>
              </div>
              <StatusPill variant="navy" size="xs">Active Member</StatusPill>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'attendance',
      title: 'Sunday Kiosk Check-in',
      subtitle: 'Instant camera QR check-in & headcounts',
      icon: QrCode,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100/80',
      description: 'Streamline your entrance foyer with an ultra-fast QR scanner. Members flash their phone badge or volunteers search names in seconds.',
      features: [
        'Contactless Sunday check-in in under 2 seconds per member',
        'Works with phone cameras or dedicated tablets at church entrances',
        'Visitor and guest registration flow with follow-up notifications',
        'Live attendance charts comparing morning vs afternoon services'
      ],
      previewUI: (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 mb-3">
            <span className="text-xs font-bold text-brand-dark">Main Sanctuary · Sunday 9:00 AM Service</span>
            <span className="text-xs font-black text-emerald-600 animate-pulse">● Live Kiosk Active</span>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-100 mb-3 text-center">
            <div className="text-3xl font-black text-brand-dark">248</div>
            <div className="text-xs font-semibold text-emerald-800">Checked In Today (86% of target)</div>
          </div>

          <div className="p-2.5 bg-white/75 rounded-xl border border-white/90 shadow-2xs flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Last Check-in: Gabriel Tan (Family of 4)</span>
            <span className="text-slate-500">Just now</span>
          </div>
        </div>
      )
    },
    {
      id: 'scheduling',
      title: 'Volunteer Rosters',
      subtitle: 'Schedule ministry teams without group-chat confusion',
      icon: CalendarDays,
      color: 'text-amber-700',
      bg: 'bg-amber-100/80',
      description: 'Coordinate Ushers, Tech Crew, Greeters, and Preachers with ease. Send serving confirmations and minimize no-shows.',
      features: [
        'Drag-and-drop monthly serving calendars for all ministry teams',
        'Serving conflict detection (prevents double-booking members)',
        'Automated reminder notifications sent to members mobile app',
        'Volunteers can accept or decline assignments with one tap'
      ],
      previewUI: (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 p-5 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Next Sunday Roster · Oct 25</div>
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-white/75 border border-white/90 shadow-2xs flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-brand-dark block">A/V & Streaming</span>
                <span className="text-[10px] text-slate-500">Assigned: Mark Villanueva</span>
              </div>
              <StatusPill variant="navy" size="xs">Confirmed</StatusPill>
            </div>
            <div className="p-2.5 rounded-xl bg-white/75 border border-white/90 shadow-2xs flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-brand-dark block">Main Greeters</span>
                <span className="text-[10px] text-slate-500">Assigned: Sarah & Paul Chen</span>
              </div>
              <StatusPill variant="warning" size="xs">Pending Reply</StatusPill>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'worship',
      title: 'Worship Chords & Setlists',
      subtitle: 'Centralized song lyrics, keys, and setlist planning',
      icon: Music,
      color: 'text-brand-steel',
      bg: 'bg-slate-100/80',
      description: 'Equip your music ministry with organized chord sheets, song lyrics, and Sunday setlists. Transpose keys instantly on desktop or mobile.',
      features: [
        'Comprehensive song catalog with BPM, themes, and audio references',
        'Instant musical key transposition (e.g., C to D, G to E)',
        'Build and order Sunday setlists in minutes',
        'Synced with mobile app so musicians practice anywhere'
      ],
      previewUI: (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 mb-3">
            <span className="text-xs font-bold text-brand-dark">Worship Setlist · Sunday Service</span>
            <span className="text-xs font-bold text-brand-steel">3 Songs (16 mins)</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-white/75 border border-white/90 shadow-2xs flex items-center justify-between">
              <span className="font-bold text-brand-dark">1. All I Have Is Christ</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-brand-dark border border-slate-200">Key: C</span>
            </div>
            <div className="p-2 rounded-lg bg-white/75 border border-white/90 shadow-2xs flex items-center justify-between">
              <span className="font-bold text-brand-dark">2. Christ Is Our Hope in Life and Death</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-brand-dark border border-slate-200">Key: D</span>
            </div>
            <div className="p-2 rounded-lg bg-white/75 border border-white/90 shadow-2xs flex items-center justify-between">
              <span className="font-bold text-brand-dark">3. As For Me and My House</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-brand-dark border border-slate-200">Key: G</span>
            </div>
          </div>
        </div>
      )
    }
  ];

export default function WebAdminShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const current = PILLARS[activeTab];

  return (
    <section id="web-admin" className="py-20 lg:py-28 bg-transparent border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill-badge mb-3">
            <CathedralLogo size={15} />
            <span className="text-[11px] font-bold text-[#2C4A60] uppercase tracking-wider">The Web Admin Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2E3D] tracking-tight">
            The command center for your entire church leadership.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#476072] leading-relaxed">
            Everything your church needs to steward resources, organize teams, and oversee ministry health — housed under one secure, clean web dashboard.
          </p>
        </div>

        {/* Pillar Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {PILLARS.map((p, idx) => {
            const Icon = p.icon;
            const isSelected = activeTab === idx;
            return (
              <button
                key={p.id}
                onClick={() => setActiveTab(idx)}
                className={`
                  p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between h-28
                  ${isSelected 
                    ? 'glass-nav-active border-white scale-[1.02] text-[#1E2E3D]' 
                    : 'glass-light-card hover:bg-white text-[#5A7385]'}
                `}
              >
                <div className={`w-8 h-8 rounded-xl ${p.bg} ${p.color} flex items-center justify-center font-bold shadow-2xs`}>
                  <Icon size={17} />
                </div>
                <div>
                  <div className="text-xs font-bold leading-snug">
                    {p.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Detailed Card */}
        <div className="glass-light-card rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_12px_36px_-6px_rgba(71,108,133,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content Breakdown */}
            <div className="lg:col-span-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#4F748E] mb-1">
                {current.subtitle}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#1E2E3D] tracking-tight">
                {current.title}
              </h3>
              <p className="mt-3 text-base text-[#476072] leading-relaxed">
                {current.description}
              </p>

              <div className="mt-6 space-y-3">
                {current.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/50">
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-[#1E2E3D]">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Interactive UI Representation */}
            <div className="lg:col-span-6">
              {current.previewUI}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
