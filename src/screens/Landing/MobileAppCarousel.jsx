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
  QrCode,
  ExternalLink 
} from 'lucide-react';
import StatusPill from '../../components/ui/StatusPill';

export default function MobileAppCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const screens = [
    {
      id: 'member-dashboard',
      title: 'Personal Member Dashboard & Daily Feed',
      subtitle: 'Verse of the day, spiritual journey, and active causes',
      image: '/mobile-screens/dashboard_home.png',
      altScreen: '/mobile-screens/bible_plan_detail.png',
      category: 'Member Dashboard',
      icon: Home,
      color: 'text-church-rose',
      bg: 'bg-pink-50',
      description: 'The heartbeat of your congregation’s daily walk. Members open the app to a personalized greeting with daily scripture, streak tracking, active Bible plans, and church causes.',
      bullets: [
        'Verse of the Day with one-tap link to read the full chapter',
        'My Journey spiritual tracker with weekly reading streaks',
        'Bible Reading Plan progress bar (e.g. New Testament 182-day plan)',
        'Support a Cause: Transparent real-time progress for church building projects'
      ]
    },
    {
      id: 'bible-study',
      title: 'Bible Study, Cross References & Version Compare',
      subtitle: 'Side-by-side comparison, linked cross references & multi-color highlights',
      image: '/mobile-screens/bible_cross_reference.png',
      altScreen: '/mobile-screens/bible_versions.png',
      category: 'Bible & Study',
      icon: BookOpen,
      color: 'text-church-amber',
      bg: 'bg-amber-50',
      description: 'Equip your congregation with serious scripture study tools right in their pockets. Members can compare translations side-by-side (ESV, NIV, NASB, NKJV, NLT, KJV, LSB), explore interactive cross-reference bubbles on any verse, and organize notes with color-coded highlights.',
      bullets: [
        'Compare multiple Bible versions side-by-side (ESV, NIV, NASB, NKJV, NLT, KJV, LSB)',
        'Interactive cross-reference links directly within every verse',
        'Multi-color highlight palette (yellow, pink, blue, green, purple, peach)',
        'Personal study notes & church-wide Bible reading plans with streak tracking'
      ]
    },
    {
      id: 'dashboard-schedule-prayer',
      title: 'Volunteer Serving Roster & Prayer Wall',
      subtitle: '1-tap duty confirmations and community prayer requests',
      image: '/mobile-screens/dashboard_schedule.png',
      altScreen: '/mobile-screens/prayer_thread_detail.png',
      category: 'Serving & Prayer',
      icon: Users,
      color: 'text-church-emerald',
      bg: 'bg-emerald-50',
      description: 'Streamline ministry scheduling and church prayer right on the member’s home screen. Volunteers view pending duty requests and confirm with one tap, while members post prayer needs, encourage one another with comments, and celebrate answered prayers.',
      bullets: [
        'Serving This Week: View assigned ministry duties (e.g. Opening Prayer, Ushers, Media)',
        'One-tap Confirm or Decline actions that immediately sync to the leadership portal',
        'Interactive Prayer Wall: Post prayer requests, write comments ("Amen!"), and mark as answered',
        'Eliminates the chaos of disorganized WhatsApp and Messenger group chats'
      ]
    },
    {
      id: 'dashboard-sermons-events',
      title: 'Church Events, 1-Tap RSVP & Sermon Library',
      subtitle: 'Interactive event RSVP (Going / Maybe / Not Going) & video sermons',
      image: '/mobile-screens/community_events.png',
      altScreen: '/mobile-screens/community_sermons.png',
      category: 'Sermons & Events',
      icon: Calendar,
      color: 'text-church-violet',
      bg: 'bg-purple-50',
      description: 'Keep your congregation connected throughout the week. Members can RSVP to upcoming gatherings with one tap (Going / Maybe / Not Going), view sanctuary venue details, and stream latest video sermons complete with passage citations and speaker details.',
      bullets: [
        'Interactive Event RSVP: One-tap "Going", "Maybe", or "Not Going" responses',
        'Church Calendar Feed: Wednesday Prayer Meeting, Friday Bible Study, Sunday School',
        'Video Sermon Archive: Watch messages with passage citations (Acts 1:1-10, Philippians 2:1-10)',
        'Event Details: Exact times, church sanctuary location, and real-time community headcount'
      ]
    },
    {
      id: 'worship-lyrics',
      title: 'Worship Band Chords, Capo & Song Catalog',
      subtitle: 'Dynamic key transposition, Capo calculation & multilingual catalog',
      image: '/mobile-screens/worship_chords_transpose.png',
      altScreen: '/mobile-screens/worship_songs_catalog.png',
      category: 'Worship Band',
      icon: Music,
      color: 'text-church-rose',
      bg: 'bg-pink-50',
      description: 'Equip your music ministry with professional chord charts and song sheets directly in the app. Musicians can transpose keys on the fly, calculate Capo settings, switch between Sharps/Flats, listen to reference tracks, and save customized arrangements straight to Sunday setlists.',
      bullets: [
        'Instant Key Transposition (+/- semitones) and automatic Capo position calculator',
        'Accidentals toggle (Sharps or Flats) with live tempo & time signature display (e.g. 80 BPM | 3/4)',
        'Comprehensive Community Song Catalog: Hymns, Contemporary, and Psalm genres',
        'Multilingual lyrics (English, Tagalog, and more) with direct "Listen" audio references'
      ]
    },
    {
      id: 'digital-giving',
      title: 'Online Giving, Designated Funds & Campaigns',
      subtitle: 'Admin-configurable fundraising campaigns & household giving',
      image: '/mobile-screens/giving_campaigns_funds.png',
      altScreen: '/mobile-screens/giving_form_transfer.png',
      category: 'Online Giving',
      icon: HeartHandshake,
      color: 'text-church-violet',
      bg: 'bg-purple-50',
      description: 'Inspire faithful stewardship with designated funds and fundraising campaigns configured directly in CoramDeo Admin. Church admins create projects with custom monetary targets that sync live to the mobile app, allowing members to give as an Individual or Household via bank transfer or e-wallets.',
      bullets: [
        'Admin-Configured Campaigns: Launch church building projects (e.g. Altar of Grace) with live progress bars',
        'Designated Ministry Funds: Direct funds into Tithes, Offerings, Building, Compassion, and Missions',
        'Give as Individual or Household: Flexible options that automatically link to family giving records',
        'Direct Bank & E-Wallet Transfers: In-app account number copying with official verification receipts'
      ]
    }
  ];

  const current = screens[selectedIndex];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? screens.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === screens.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="mobile-app" className="py-20 lg:py-28 bg-white border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-100 text-xs font-bold text-church-rose uppercase tracking-wider mb-3">
            <Smartphone size={14} />
            <span>Native iOS & Android Mobile Companion</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-church-charcoal tracking-tight">
            Put the church in every member’s pocket.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-church-slate leading-relaxed">
            Most church software only cares about the desktop admin. Coram Deo connects your entire congregation through a fast, beautiful mobile experience available on the App Store and Google Play.
          </p>
        </div>

        {/* Feature Category Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-4 mb-8">
          {screens.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIndex(idx)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0
                  ${isSelected
                    ? 'bg-gradient-coram text-white shadow-church-glow scale-[1.02]'
                    : 'bg-church-canvas text-church-slate hover:text-church-charcoal hover:bg-gray-100'}
                `}
              >
                <Icon size={15} />
                <span>{item.category}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Device + Content Display */}
        <div className="bg-church-canvas rounded-3xl border border-gray-100 p-6 sm:p-10 lg:p-14 shadow-church-soft relative">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content Explanations */}
            <div className="lg:col-span-7 flex flex-col items-start order-2 lg:order-1">
              <div className="flex items-center gap-2 mb-2">
                <StatusPill variant="pink" size="sm">
                  {current.category}
                </StatusPill>
                <span className="text-xs font-semibold text-church-slate">Screen {selectedIndex + 1} of {screens.length}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-church-charcoal tracking-tight mt-1">
                {current.title}
              </h3>

              <div className="text-sm font-bold text-church-rose mt-1">
                {current.subtitle}
              </div>

              <p className="mt-4 text-base text-church-slate leading-relaxed">
                {current.description}
              </p>

              {/* Bullet highlights */}
              <div className="mt-6 space-y-3 w-full">
                {current.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-pink-100 text-church-rose flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-church-charcoal">
                      {b}
                    </span>
                  </div>
                ))}
              </div>

              {/* Congregation App Store & Google Play Links */}
              <div className="mt-8 pt-6 border-t border-gray-200/60 w-full flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://apps.apple.com/ph/app/coramdeo-life/id6802314896"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-5 py-2.5 bg-church-charcoal hover:bg-black text-white rounded-2xl shadow-church-elevated transition-all hover:scale-[1.02] group"
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
                    className="inline-flex items-center gap-3 px-5 py-2.5 bg-church-charcoal hover:bg-black text-white rounded-2xl shadow-church-elevated transition-all hover:scale-[1.02] group"
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
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 text-church-charcoal flex items-center justify-center hover:bg-gray-50 shadow-church-soft transition-all"
                    aria-label="Previous screen"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 text-church-charcoal flex items-center justify-center hover:bg-gray-50 shadow-church-soft transition-all"
                    aria-label="Next screen"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: High-Resolution iPhone 17 Pro Mockup */}
            <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
              <div className="relative w-72 sm:w-80">
                
                {/* Ambient glow behind phone */}
                <div className="absolute inset-0 bg-gradient-coram opacity-20 blur-2xl rounded-full" />

                {/* iPhone Frame */}
                <div className="relative rounded-[48px] p-3 bg-church-charcoal shadow-church-elevated border-4 border-gray-800">
                  
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30" />

                  {/* High-Resolution Screen Render */}
                  <div className="overflow-hidden rounded-[38px] bg-black aspect-[9/19.5] relative">
                    <img
                      src={current.image}
                      alt={current.title}
                      className="w-full h-full object-cover object-top transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Secondary floating thumbnail card */}
                {current.altScreen && (
                  <div className="hidden sm:block absolute -left-10 -bottom-6 w-36 rounded-2xl overflow-hidden shadow-church-elevated border-2 border-white bg-white hover:scale-105 transition-transform duration-300">
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
