import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  QrCode, 
  Heart, 
  Download,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-church-canvas">
      {/* Subtle Background Glow Spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-coram opacity-[0.06] blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-400 opacity-[0.05] blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Value Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-pink-100 shadow-church-soft mb-6">
              <span className="w-2 h-2 rounded-full bg-church-rose animate-pulse" />
              <span className="text-xs font-bold text-church-charcoal uppercase tracking-wider">
                All-in-One Church Management Ecosystem
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-church-charcoal tracking-tight leading-[1.12]">
              Faithful Stewardship, <br />
              <span className="text-gradient-coram">
                Modern Ministry.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-church-slate max-w-2xl leading-relaxed">
              Run your entire church operations in one place. Record tithes and offerings, manage member directories, coordinate volunteer setlists, and engage your congregation with a native iOS & Android mobile companion.
            </p>

            {/* Dual CTAs: Register + Login */}
            <div className="mt-8 flex flex-wrap gap-4 items-center w-full sm:w-auto">
              <GradientButton
                size="lg"
                onClick={() => navigate('/register?source=hero')}
                className="shadow-church-glow w-full sm:w-auto"
                icon={ArrowRight}
              >
                Start Free Trial
              </GradientButton>

              <button
                onClick={() => navigate('/login')}
                className="h-13 px-7 text-sm font-bold rounded-full border border-gray-200 bg-white hover:border-church-rose/40 hover:bg-gray-50/80 text-church-charcoal shadow-church-soft transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>Sign In to Admin Portal</span>
                <ArrowRight size={16} className="text-church-rose" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-200/60 w-full text-xs font-semibold text-church-slate">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-church-emerald shrink-0" />
                <span>Free for Fellowships</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-church-emerald shrink-0" />
                <span>10-Minute Setup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-church-emerald shrink-0" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-church-emerald shrink-0" />
                <span>iOS & Android Ready</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dual Device Mockup Showcase */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            
            {/* Desktop Web Admin Window Preview */}
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-church-elevated border border-gray-100 p-5 relative z-10 transition-transform duration-500 hover:-translate-y-1">
              
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs font-semibold text-church-slate">Church of the Nazarene · Treasury Portal</span>
                </div>
                <StatusPill variant="success" size="sm">
                  Live Sync
                </StatusPill>
              </div>

              {/* Sunday Giving KPI Box */}
              <div className="bg-gradient-to-br from-church-canvas to-pink-50/30 rounded-2xl p-4 border border-gray-100 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-church-slate uppercase tracking-wider">Sunday Giving Summary</span>
                  <span className="text-xs font-bold text-church-emerald flex items-center gap-1">
                    <TrendingUp size={13} /> +18.4% vs last mo.
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-church-charcoal">₱65,500</span>
                  <span className="text-xs text-church-slate">recorded today</span>
                </div>

                {/* Fund breakdown pills */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200/50 text-center">
                  <div className="bg-white p-2 rounded-xl border border-gray-100">
                    <div className="text-[10px] font-semibold text-church-slate">Tithes</div>
                    <div className="text-sm font-extrabold text-church-charcoal">₱42,500</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-gray-100">
                    <div className="text-[10px] font-semibold text-church-slate">Offering</div>
                    <div className="text-sm font-extrabold text-church-charcoal">₱14,800</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-gray-100">
                    <div className="text-[10px] font-semibold text-church-slate">Missions</div>
                    <div className="text-sm font-extrabold text-church-charcoal">₱8,200</div>
                  </div>
                </div>
              </div>

              {/* Envelope Audit Log mini-table */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs font-bold text-church-slate px-1">
                  <span>Recent Envelopes</span>
                  <span className="text-church-rose cursor-pointer hover:underline">View All (42)</span>
                </div>

                <div className="bg-gray-50/70 rounded-xl p-2.5 flex items-center justify-between text-xs border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pink-100 text-church-rose font-bold flex items-center justify-center text-[10px]">
                      DC
                    </div>
                    <div>
                      <span className="font-bold text-church-charcoal block">Dela Cruz Household</span>
                      <span className="text-[10px] text-church-slate">Tithes · Envelope #104</span>
                    </div>
                  </div>
                  <span className="font-black text-church-charcoal text-right">₱5,000</span>
                </div>

                <div className="bg-gray-50/70 rounded-xl p-2.5 flex items-center justify-between text-xs border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-church-violet font-bold flex items-center justify-center text-[10px]">
                      MS
                    </div>
                    <div>
                      <span className="font-bold text-church-charcoal block">Santos, Maria</span>
                      <span className="text-[10px] text-church-slate">Building Fund · Online Maya</span>
                    </div>
                  </div>
                  <span className="font-black text-church-charcoal text-right">₱2,500</span>
                </div>
              </div>

              {/* One-Click Board Report callout */}
              <div className="bg-church-charcoal text-white rounded-xl p-3 flex items-center justify-between shadow-church-soft">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-church-emerald">
                    <Download size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Sunday Board Report Ready</div>
                    <div className="text-[10px] text-white/70">One-click PDF statement</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-pink-300 underline underline-offset-2">Export</span>
              </div>
            </div>

            {/* Overlapping Mobile Phone Screen Mockup (Referencing /mobile-screens/screen_01.png) */}
            <div className="hidden sm:block absolute -right-6 -bottom-10 w-56 z-20 transition-transform duration-500 hover:scale-105">
              <div className="relative rounded-[38px] p-2 bg-church-charcoal shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border-4 border-gray-800">
                {/* Dynamic Island / Speaker notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-30" />

                {/* Phone screen display */}
                <div className="overflow-hidden rounded-[30px] bg-black aspect-[9/19]">
                  <img
                    src="/mobile-screens/dashboard_home.png"
                    alt="Coram Deo Member Mobile Dashboard"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Floating Member Dashboard Feed Badge */}
                <div className="absolute -left-6 top-1/3 bg-white rounded-2xl shadow-church-elevated p-3 border border-pink-100 max-w-[170px] animate-bounce duration-1000">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-pink-100 text-church-rose flex items-center justify-center">
                      <Heart size={14} className="fill-church-rose" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-church-charcoal">Member Dashboard</div>
                      <div className="text-[9px] font-semibold text-church-slate">Daily Scripture & Life</div>
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
