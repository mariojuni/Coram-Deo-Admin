import React, { useState } from 'react';
import { 
  Wallet, 
  Users, 
  QrCode, 
  CalendarDays, 
  Music, 
  FileSpreadsheet, 
  Check, 
  TrendingUp, 
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import StatusPill from '../../components/ui/StatusPill';

export default function WebAdminShowcase() {
  const [activeTab, setActiveTab] = useState(0);

  const pillars = [
    {
      id: 'treasury',
      title: 'Treasury & Giving',
      subtitle: 'Complete financial stewardship with audit trails',
      icon: Wallet,
      color: 'text-church-rose',
      bg: 'bg-pink-50',
      description: 'Account for every contribution with envelope-level precision. Set up custom fundraising campaigns with monetary goals that automatically push live to the congregation mobile app.',
      features: [
        'Admin-configured fundraising campaigns with live target progress bars',
        'Custom designated funds (Tithes, Offerings, Building, Compassion, Missions)',
        'One-click PDF/Excel financial reports for pastors and church board',
        'Strict audit logs detailing who recorded each contribution'
      ],
      previewUI: (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-church-soft">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <div className="text-xs font-bold text-church-slate uppercase">Sunday Collection Overview</div>
              <div className="text-2xl font-black text-church-charcoal">₱128,450.00</div>
            </div>
            <StatusPill variant="success" size="sm">Audited & Reconciled</StatusPill>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-church-canvas border border-gray-100">
              <span className="font-bold text-church-charcoal">General Tithes Fund</span>
              <span className="font-extrabold text-church-charcoal">₱84,200 (65%)</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-church-canvas border border-gray-100">
              <span className="font-bold text-church-charcoal">Building & Sanctuary Fund</span>
              <span className="font-extrabold text-church-charcoal">₱28,750 (22%)</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-church-canvas border border-gray-100">
              <span className="font-bold text-church-charcoal">Global Missions Support</span>
              <span className="font-extrabold text-church-charcoal">₱15,500 (13%)</span>
            </div>
          </div>

          <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100 text-xs text-church-charcoal flex items-center justify-between">
            <span className="font-medium">Board Financial Statement ready for export</span>
            <span className="font-bold text-church-rose cursor-pointer hover:underline">Download PDF</span>
          </div>
        </div>
      )
    },
    {
      id: 'members',
      title: 'Member Directory & Families',
      subtitle: 'Know and nurture every household in your flock',
      icon: Users,
      color: 'text-church-violet',
      bg: 'bg-purple-50',
      description: 'Keep rich, organized profiles of members and their families. Record spiritual milestones like baptism dates, salvation journeys, and ministry affiliations.',
      features: [
        'Family household unit linking (Parents, Children, Relatives)',
        'Spiritual milestones tracking: Baptism date, Salvation, Membership class',
        'Custom tagging by discipleship life groups and ministry departments',
        'Role-governed privacy: Non-authorized volunteers cannot see sensitive records'
      ],
      previewUI: (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-church-soft">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <Search size={15} className="text-church-slate" />
              <span className="text-xs font-bold text-church-charcoal">Member Directory (342 Active)</span>
            </div>
            <span className="text-xs text-church-slate">Filters: Active, Baptized</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-church-canvas border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-pink-100 text-church-rose font-black text-xs flex items-center justify-center">
                  JD
                </div>
                <div>
                  <div className="text-xs font-bold text-church-charcoal">Jonathan Dela Cruz</div>
                  <div className="text-[10px] text-church-slate">Family Head • Discipleship Group Alpha</div>
                </div>
              </div>
              <StatusPill variant="default" size="xs">Baptized 2021</StatusPill>
            </div>

            <div className="p-3 rounded-xl bg-church-canvas border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-church-violet font-black text-xs flex items-center justify-center">
                  ER
                </div>
                <div>
                  <div className="text-xs font-bold text-church-charcoal">Elena Reyes</div>
                  <div className="text-[10px] text-church-slate">Worship Ministry • Sunday School Teacher</div>
                </div>
              </div>
              <StatusPill variant="success" size="xs">Active Member</StatusPill>
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
      color: 'text-church-emerald',
      bg: 'bg-emerald-50',
      description: 'Streamline your entrance foyer with an ultra-fast QR scanner. Members flash their phone badge or volunteers search names in seconds.',
      features: [
        'Contactless Sunday check-in in under 2 seconds per member',
        'Works with phone cameras or dedicated tablets at church entrances',
        'Visitor and guest registration flow with follow-up notifications',
        'Live attendance charts comparing morning vs afternoon services'
      ],
      previewUI: (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-church-soft">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <span className="text-xs font-bold text-church-charcoal">Main Sanctuary · Sunday 9:00 AM Service</span>
            <span className="text-xs font-black text-church-emerald animate-pulse">● Live Kiosk Active</span>
          </div>

          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100 mb-3 text-center">
            <div className="text-3xl font-black text-church-charcoal">248</div>
            <div className="text-xs font-semibold text-emerald-800">Checked In Today (86% of target)</div>
          </div>

          <div className="p-2.5 bg-church-canvas rounded-xl border border-gray-100 flex items-center justify-between text-xs">
            <span className="font-bold text-church-charcoal">Last Check-in: Gabriel Tan (Family of 4)</span>
            <span className="text-church-slate">Just now</span>
          </div>
        </div>
      )
    },
    {
      id: 'scheduling',
      title: 'Volunteer Rosters',
      subtitle: 'Schedule ministry teams without group-chat confusion',
      icon: CalendarDays,
      color: 'text-church-amber',
      bg: 'bg-amber-50',
      description: 'Coordinate Ushers, Tech Crew, Greeters, and Preachers with ease. Send serving confirmations and minimize no-shows.',
      features: [
        'Drag-and-drop monthly serving calendars for all ministry teams',
        'Serving conflict detection (prevents double-booking members)',
        'Automated reminder notifications sent to members mobile app',
        'Volunteers can accept or decline assignments with one tap'
      ],
      previewUI: (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-church-soft">
          <div className="text-xs font-bold text-church-slate uppercase mb-3">Next Sunday Roster · Oct 25</div>
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-church-canvas border border-gray-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-church-charcoal block">A/V & Streaming</span>
                <span className="text-[10px] text-church-slate">Assigned: Mark Villanueva</span>
              </div>
              <StatusPill variant="success" size="xs">Confirmed</StatusPill>
            </div>
            <div className="p-2.5 rounded-xl bg-church-canvas border border-gray-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-church-charcoal block">Main Greeters</span>
                <span className="text-[10px] text-church-slate">Assigned: Sarah & Paul Chen</span>
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
      color: 'text-church-rose',
      bg: 'bg-pink-50',
      description: 'Equip your music ministry with organized chord sheets, song lyrics, and Sunday setlists. Transpose keys instantly on desktop or mobile.',
      features: [
        'Comprehensive song catalog with BPM, themes, and audio references',
        'Instant musical key transposition (e.g., C to D, G to E)',
        'Build and order Sunday setlists in minutes',
        'Synced with mobile app so musicians practice anywhere'
      ],
      previewUI: (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-church-soft">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
            <span className="text-xs font-bold text-church-charcoal">Worship Setlist · Sunday Service</span>
            <span className="text-xs font-bold text-church-rose">4 Songs (22 mins)</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-church-canvas flex items-center justify-between">
              <span className="font-bold text-church-charcoal">1. 10,000 Reasons (Bless The Lord)</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-church-charcoal border">Key: G</span>
            </div>
            <div className="p-2 rounded-lg bg-church-canvas flex items-center justify-between">
              <span className="font-bold text-church-charcoal">2. Goodness of God</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-church-charcoal border">Key: D</span>
            </div>
            <div className="p-2 rounded-lg bg-church-canvas flex items-center justify-between">
              <span className="font-bold text-church-charcoal">3. King of Kings</span>
              <span className="px-2 py-0.5 rounded bg-white font-black text-church-charcoal border">Key: D</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const current = pillars[activeTab];

  return (
    <section id="web-admin" className="py-20 lg:py-28 bg-church-canvas border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-church-charcoal uppercase tracking-wider mb-3 shadow-church-soft">
            The Web Admin Engine
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-church-charcoal tracking-tight">
            The command center for your entire church leadership.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-church-slate leading-relaxed">
            Everything your church needs to steward resources, organize teams, and oversee ministry health — housed under one secure, clean web dashboard.
          </p>
        </div>

        {/* Pillar Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            const isSelected = activeTab === idx;
            return (
              <button
                key={p.id}
                onClick={() => setActiveTab(idx)}
                className={`
                  p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between h-28
                  ${isSelected 
                    ? 'bg-white border-church-rose/40 shadow-church-elevated scale-[1.02]' 
                    : 'bg-white/60 border-gray-100 hover:bg-white hover:border-gray-200 text-church-slate'}
                `}
              >
                <div className={`w-8 h-8 rounded-xl ${p.bg} ${p.color} flex items-center justify-center font-bold`}>
                  <Icon size={17} />
                </div>
                <div>
                  <div className="text-xs font-bold text-church-charcoal leading-snug">
                    {p.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Detailed Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 lg:p-12 shadow-church-elevated">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content Breakdown */}
            <div className="lg:col-span-6">
              <div className="text-xs font-bold uppercase tracking-wider text-church-rose mb-1">
                {current.subtitle}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight">
                {current.title}
              </h3>
              <p className="mt-3 text-base text-church-slate leading-relaxed">
                {current.description}
              </p>

              <div className="mt-6 space-y-3">
                {current.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-pink-100 text-church-rose flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-church-charcoal">
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
