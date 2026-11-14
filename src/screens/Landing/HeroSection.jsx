import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Heart, 
  Download
} from 'lucide-react';
import StatusPill from '../../components/ui/StatusPill';
import { CathedralLogo } from '../../components/ui/icons';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-transparent">
      {/* Calm Ethereal Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-[#C8DFEE]/40 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#DCEBF4]/50 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Value Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Pill Tag (Matches Mobile Screenshot Style) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill-badge mb-6">
              <CathedralLogo size={16} />
              <span className="text-[11px] font-bold text-[#2C4A60] uppercase tracking-wider">
                All-in-One Church Management Ecosystem
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1E2E3D] tracking-tight leading-[1.12]">
              Faithful Stewardship, <br />
              <span className="bg-gradient-to-r from-[#2C4A60] via-[#4F748E] to-[#6892AD] bg-clip-text text-transparent">
                Modern Ministry.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-[#476072] max-w-2xl leading-relaxed font-normal">
              Run your entire church operations in one calm, connected space. Record tithes and offerings, manage member directories, coordinate volunteer setlists, and engage your congregation with a native iOS & Android mobile companion.
            </p>

            {/* Dual CTAs: Register + Login */}
            <div className="mt-8 flex flex-wrap gap-4 items-center w-full sm:w-auto">
              <button
                onClick={() => navigate('/register?source=hero')}
                className="h-13 px-8 text-sm font-bold rounded-full bg-[#162533] hover:bg-[#243746] text-white shadow-[0_8px_20px_-4px_rgba(22,37,51,0.18)] transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto group"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/login')}
                className="h-13 px-7 text-sm font-bold rounded-full glass-light-pill hover:bg-white text-[#2C4A60] shadow-xs transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>Sign In to Admin Portal</span>
                <ArrowRight size={16} className="text-[#4F748E]" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200/70 w-full text-xs font-semibold text-[#5A7385]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Free for Fellowships</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>10-Minute Setup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>No Credit Card</span>
              </div>
              <a 
                href="#mobile-app" 
                className="flex items-center gap-1.5 hover:text-[#1E2E3D] transition-colors group cursor-pointer"
                title="Download on App Store & Google Play"
              >
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="underline decoration-dotted decoration-slate-300 underline-offset-4">iOS & Android Ready</span>
              </a>
            </div>
          </div>

          {/* Right Column: Dual Device Mockup Showcase */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            
            {/* Desktop Web Admin Window Preview */}
            <div className="w-full max-w-lg glass-light-card rounded-3xl p-5 relative z-10 transition-transform duration-500 hover:-translate-y-1">
              
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/70">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs font-semibold text-[#5A7385]">Church of the Nazarene · Treasury Portal</span>
                </div>
                <StatusPill variant="glass" size="sm">
                  Live Sync
                </StatusPill>
              </div>

              {/* Sunday Giving KPI Box */}
              <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 border border-white/95 mb-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#5A7385] uppercase tracking-wider">Sunday Giving Summary</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <TrendingUp size={13} /> +18.4% vs last mo.
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#1E2E3D]">₱65,500</span>
                  <span className="text-xs text-[#5A7385]">recorded today</span>
                </div>

                {/* Fund breakdown pills */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/50 text-center">
                  <div className="bg-white/90 p-2 rounded-xl border border-white/95 shadow-2xs">
                    <div className="text-[10px] font-semibold text-[#5A7385]">Tithes</div>
                    <div className="text-sm font-extrabold text-[#1E2E3D]">₱42,500</div>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-white/95 shadow-2xs">
                    <div className="text-[10px] font-semibold text-[#5A7385]">Offering</div>
                    <div className="text-sm font-extrabold text-[#1E2E3D]">₱14,800</div>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-white/95 shadow-2xs">
                    <div className="text-[10px] font-semibold text-[#5A7385]">Missions</div>
                    <div className="text-sm font-extrabold text-[#1E2E3D]">₱8,200</div>
                  </div>
                </div>
              </div>

              {/* Envelope Audit Log mini-table */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#5A7385] px-1">
                  <span>Recent Envelopes</span>
                  <span className="text-[#2C4A60] cursor-pointer hover:underline">View All (42)</span>
                </div>

                <div className="bg-white/75 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between text-xs border border-white/90 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2C4A60] font-bold flex items-center justify-center text-[10px]">
                      DC
                    </div>
                    <div>
                      <span className="font-bold text-[#1E2E3D] block">Dela Cruz Household</span>
                      <span className="text-[10px] text-[#5A7385]">Tithes · Envelope #104</span>
                    </div>
                  </div>
                  <span className="font-black text-[#1E2E3D] text-right">₱5,000</span>
                </div>

                <div className="bg-white/75 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between text-xs border border-white/90 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                      MS
                    </div>
                    <div>
                      <span className="font-bold text-[#1E2E3D] block">Santos, Maria</span>
                      <span className="text-[10px] text-[#5A7385]">Building Fund · Online Maya</span>
                    </div>
                  </div>
                  <span className="font-black text-[#1E2E3D] text-right">₱2,500</span>
                </div>
              </div>

              {/* One-Click Board Report callout */}
              <div className="bg-[#162533] text-white rounded-2xl p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                    <Download size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Sunday Board Report Ready</div>
                    <div className="text-[10px] text-white/70">One-click PDF statement</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-sky-200 underline underline-offset-2">Export</span>
              </div>
            </div>

            {/* Overlapping Mobile Phone Screen Mockup */}
            <div className="hidden sm:block absolute -right-6 -bottom-10 w-56 z-20 transition-transform duration-500 hover:scale-105">
              <div className="relative rounded-[38px] p-2 bg-[#162533] shadow-[0_25px_60px_-15px_rgba(71,108,133,0.22)] border-4 border-[#243746]">
                {/* Dynamic Island / Speaker notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-30" />

                {/* Phone screen display with exact raw screen ratio */}
                <div className="overflow-hidden rounded-[30px] bg-slate-950 aspect-[1206/2622]">
                  <img
                    src="/mobile-screens/dashboard_home.png"
                    alt="Coram Deo Member Mobile Dashboard"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Floating Member Dashboard Feed Badge */}
                <div className="absolute -left-6 top-1/3 glass-light-pill rounded-2xl p-3 border border-white/95 max-w-[170px]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2C4A60] flex items-center justify-center">
                      <Heart size={14} className="fill-[#2C4A60] text-[#2C4A60]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-[#1E2E3D]">Member Dashboard</div>
                      <div className="text-[9px] font-semibold text-[#5A7385]">Daily Scripture & Life</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
