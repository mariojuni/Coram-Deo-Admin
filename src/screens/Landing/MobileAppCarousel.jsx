import React, { useState } from 'react';
import { 
  Smartphone, 
  Home, 
  Calendar, 
  BookOpen, 
  Music, 
  Users, 
  HeartHandshake, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import StatusPill from '../../components/ui/StatusPill';
import { CathedralLogo } from '../../components/ui/icons';

const SCREENS = [
    {
      id: 'member-dashboard',
      title: 'Walk in God’s Presence, Every Single Day',
      subtitle: 'Verse of the Day, guided reading plans, and weekly spiritual journey',
      image: '/mobile-screens/dashboard_home.png',
      altScreen: '/mobile-screens/bible_plan_detail.png',
      category: 'Daily Rhythm',
      icon: Home,
      color: 'text-brand-primary',
      bg: 'bg-blue-100/80',
      description: 'The heartbeat of your congregation’s daily walk. Members open the app to a personalized greeting with daily scripture, streak tracking, active Bible plans, and church causes in one calm space.',
      bullets: [
        'Verse of the Day with one-tap link to read the full chapter',
        'My Journey spiritual tracker with weekly reading streaks',
        'Bible Reading Plan progress bar (e.g. TGC Two-Year Plan 6/730)',
        'Support a Cause: Transparent real-time progress for church building projects'
      ]
    },
    {
      id: 'bible-study',
      title: 'Read & Highlight the Word with Clarity',
      subtitle: 'Color-coded verse highlights, inline reflections, and distraction-free Scripture study',
      image: '/mobile-screens/bible_plan_detail.png',
      altScreen: '/mobile-screens/worship_chords_transpose.png',
      category: 'Scripture & Highlights',
      icon: BookOpen,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100/80',
      description: 'Equip your congregation with serious scripture study tools right in their pockets. Members can compare translations side-by-side, explore interactive reflections on any verse, and organize study notes.',
      bullets: [
        'Color-coded verse highlights with customizable multi-color palettes',
        'Inline community reflections and cross-references directly in the passage',
        'Distraction-free ESV and multiple translation Scripture study',
        'Church-wide Bible reading plans with personal progress tracking'
      ]
    },
    {
      id: 'gatherings-events',
      title: 'Never Miss a Moment to Gather & Worship',
      subtitle: 'RSVP to Sunday School, prayer meetings, and Bible studies with live church calendar',
      image: '/mobile-screens/community_events.png',
      altScreen: '/mobile-screens/dashboard_schedule.png',
      category: 'Gatherings & Events',
      icon: Calendar,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100/80',
      description: 'Keep your congregation connected throughout the week. Members can RSVP to upcoming gatherings with one tap (Going / Maybe / Not Going), view sanctuary venue details, and stay updated.',
      bullets: [
        'Interactive Event RSVP: One-tap "Going", "Maybe", or "Not Going" responses',
        'Church Calendar Feed: Wednesday Prayer Meeting, Friday Bible Study, Sunday School',
        'Live venue & timing details directly linked to church sanctuary',
        'Real-time community headcount updates for church coordinators'
      ]
    },
    {
      id: 'ministry-stewardship',
      title: 'Serve Your Ministry with Confidence',
      subtitle: 'View serving schedules, worship setlists, duty confirmations, and Sunday order of service',
      image: '/mobile-screens/dashboard_schedule.png',
      altScreen: '/mobile-screens/prayer_thread_detail.png',
      category: 'Ministry & Stewardship',
      icon: Users,
      color: 'text-amber-700',
      bg: 'bg-amber-100/80',
      description: 'Streamline ministry scheduling right on the member’s phone. Volunteers view pending duty requests, check call times, review song sequences, and confirm assignments with one tap.',
      bullets: [
        'Serving This Week: View assigned ministry duties (Drummer, Ushers, Sound)',
        'One-tap duty confirmations that immediately sync to leadership portal',
        'View Sunday Worship Service setlists and order of service directly in-app',
        'Eliminates the chaos of disorganized messaging group chats'
      ]
    },
    {
      id: 'worship-lyrics',
      title: 'Transpose Chords & Lyrics in Real Time',
      subtitle: 'Adjust keys, capo positions, and sharps or flats instantly for your worship team setlist',
      image: '/mobile-screens/worship_chords_transpose.png',
      altScreen: '/mobile-screens/community_events.png',
      category: 'Worship Chords & Setlist',
      icon: Music,
      color: 'text-brand-steel',
      bg: 'bg-slate-100/80',
      description: 'Equip your music ministry with professional chord charts and song sheets directly in the app. Musicians transpose keys on the fly, calculate Capo settings, and save customized arrangements straight to Sunday setlists.',
      bullets: [
        'Instant Key Transposition (+/- semitones) and automatic Capo position calculator',
        'Accidentals toggle (Sharps or Flats) with live chord diagrams and tempo indicators',
        'Interactive Lyric & Chord sheets with one-click copy and setlist integration',
        'Save arrangements straight to the church worship team setlist'
      ]
    },
    {
      id: 'church-fellowship',
      title: 'Stay Connected with Your Church Family',
      subtitle: 'Share prayer requests, scripture highlights, notes, and celebrate member milestones together',
      image: '/mobile-screens/prayer_thread_detail.png',
      altScreen: '/mobile-screens/dashboard_home.png',
      category: 'Church Fellowship & Prayer',
      icon: HeartHandshake,
      color: 'text-brand-primary',
      bg: 'bg-blue-100/80',
      description: 'Strengthen community bonds beyond Sunday morning. Members share scripture highlights, post prayer requests, encourage one another with comments, and celebrate member milestones.',
      bullets: [
        'Community Feed: Share scripture highlights and personal reflections',
        'Birthday & Milestone celebrations for church members',
        'Interactive Prayer Wall: Post requests, comment ("Amen!"), and track answers',
        'Safe, uplifting church-only fellowship environment'
      ]
    }
  ];

export default function MobileAppCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = SCREENS[selectedIndex];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? SCREENS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === SCREENS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="mobile-app" className="py-20 lg:py-28 bg-transparent border-b border-white/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill-badge mb-3">
            <CathedralLogo size={15} />
            <span className="text-[11px] font-bold text-[#2C4A60] uppercase tracking-wider">Native iOS & Android Mobile Companion</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2E3D] tracking-tight">
            Put the church in every member’s pocket.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#476072] leading-relaxed">
            Most church software only cares about desktop administration. Coram Deo connects your entire congregation through a fast, beautiful mobile experience available on the App Store and Google Play.
          </p>
        </div>

        {/* Feature Category Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-4 mb-8">
          {SCREENS.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIndex(idx)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0
                  ${isSelected
                    ? 'bg-[#162533] text-white shadow-sm scale-[1.02]'
                    : 'glass-light-pill text-[#5A7385] hover:text-[#1E2E3D] hover:bg-white'}
                `}
              >
                <Icon size={15} className={isSelected ? 'text-sky-300' : 'text-[#7E97A8]'} />
                <span>{item.category}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Device + Content Display */}
        <div className="glass-light-card rounded-3xl p-6 sm:p-10 lg:p-14 shadow-[0_12px_36px_-6px_rgba(71,108,133,0.06)] relative">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content Explanations */}
            <div className="lg:col-span-7 flex flex-col items-start order-2 lg:order-1">
              <div className="flex items-center gap-2 mb-2">
                <StatusPill variant="navy" size="sm">
                  {current.category}
                </StatusPill>
                <span className="text-xs font-semibold text-[#7E97A8]">Screen {selectedIndex + 1} of {SCREENS.length}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E2E3D] tracking-tight mt-1">
                {current.title}
              </h3>

              <div className="text-sm font-bold text-[#4F748E] mt-1">
                {current.subtitle}
              </div>

              <p className="mt-4 text-base text-[#476072] leading-relaxed">
                {current.description}
              </p>

              {/* Bullet highlights */}
              <div className="mt-6 space-y-3 w-full">
                {current.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/50">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-[#1E2E3D]">
                      {b}
                    </span>
                  </div>
                ))}
              </div>

              {/* Congregation App Store & Google Play Links */}
              <div className="mt-8 pt-6 border-t border-slate-200/60 w-full flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://apps.apple.com/ph/app/coramdeo-life/id6802314896"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#162533] hover:bg-[#243746] text-white rounded-2xl shadow-xs transition-all hover:scale-[1.02] group"
                  >
                    <svg className="w-5 h-5 fill-current text-white group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.35-.58.66-1.09 1.73-.95 2.76 1 .08 2.04-.51 2.66-1.26z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-[9px] uppercase tracking-wider text-white/70 leading-none">Download on the</div>
                      <div className="text-xs font-bold leading-tight flex items-center gap-1">
                        <span>App Store</span>
                        <ExternalLink size={12} className="text-white/60" />
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://play.google.com/store/apps/details?id=com.coramdeo.app.prod&pcampaignid=web_share"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#162533] hover:bg-[#243746] text-white rounded-2xl shadow-xs transition-all hover:scale-[1.02] group"
                  >
                    <svg className="w-5 h-5 fill-current text-white group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-.926V2.74c0-.348.117-.68.324-.926h.285zm11.242 11.245l2.253 2.253-11.45 6.44 9.197-8.693zm2.253-2.254L14.85 8.552 5.654 2.112l11.45 6.44zm1.058 1.058l3.197 1.8a1.5 1.5 0 0 1 0 2.612l-3.197 1.8-1.74-1.74 1.74-1.472z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-[9px] uppercase tracking-wider text-white/70 leading-none">Get it on</div>
                      <div className="text-xs font-bold leading-tight flex items-center gap-1">
                        <span>Google Play</span>
                        <ExternalLink size={12} className="text-white/60" />
                      </div>
                    </div>
                  </a>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrev}
                    className="w-10 h-10 rounded-full glass-light-pill text-[#2C4A60] flex items-center justify-center hover:bg-white shadow-2xs transition-all"
                    aria-label="Previous screen"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-10 h-10 rounded-full glass-light-pill text-[#2C4A60] flex items-center justify-center hover:bg-white shadow-2xs transition-all"
                    aria-label="Next screen"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: High-Resolution Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
              <div className="relative w-72 sm:w-80">
                
                {/* Ambient glow behind phone */}
                <div className="absolute inset-0 bg-[#C8DFEE]/40 blur-2xl rounded-full" />

                {/* Phone Frame */}
                <div className="relative rounded-[48px] p-3 bg-[#162533] shadow-[0_25px_60px_-15px_rgba(71,108,133,0.22)] border-4 border-[#243746]">
                  
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30" />

                  {/* High-Resolution Screen Render */}
                  <div className="overflow-hidden rounded-[38px] bg-slate-950 aspect-[1206/2622] relative">
                    <img
                      src={current.image}
                      alt={current.title}
                      className="w-full h-full object-cover object-top transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Secondary floating thumbnail card */}
                {current.altScreen && (
                  <div className="hidden sm:block absolute -left-10 -bottom-6 w-36 rounded-2xl overflow-hidden shadow-sm border-2 border-white/90 bg-white hover:scale-105 transition-transform duration-300">
                    <img
                      src={current.altScreen}
                      alt="Alternate screen preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
