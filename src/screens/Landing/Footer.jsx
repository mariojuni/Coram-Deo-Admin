import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, ExternalLink } from 'lucide-react';
import CathedralLogo from '../../components/ui/icons/CathedralLogo';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-transparent border-t border-white/60">
      
      {/* ── Pre-Footer High-Conversion Banner ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-[#162533] rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-xl relative overflow-hidden border border-[#243746]">
          
          {/* Ambient Brand Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4F748E]/20 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2C4A60]/25 blur-[90px] pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse" />
              <span>Get Started This Week</span>
            </div>

            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Ready to give your church leadership hours back every week?
            </h3>

            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
              Ditch the scattered paper notebooks and messy spreadsheets. Start your church's free workspace today and invite your team in minutes.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => navigate('/register?source=prefooter')}
                className="h-13 px-8 text-sm font-bold rounded-full bg-white hover:bg-slate-100 text-slate-900 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Start Free for Your Church</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate('/login')}
                className="h-13 px-7 text-sm font-bold rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In to Admin Portal</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer Sitemaps ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/60">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-2xl bg-white/90 border border-slate-200/30 flex items-center justify-center shadow-church-soft p-0.5 backdrop-blur-md overflow-hidden">
                <CathedralLogo size={36} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-[#1E2E3D] tracking-tight">CoramDeo</span>
                <span className="text-[10px] font-medium text-[#7E97A8] -mt-0.5">Faithful Stewardship & Ministry</span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[#5A7385] max-w-sm leading-relaxed">
              <em>Coram Deo</em> — Living in the presence of God. Empowering local churches with unified financial stewardship, member directories, worship planning, and mobile engagement.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#476072] pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All Systems Operational (99.9% Sunday Uptime)</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#1E2E3D] uppercase tracking-wider">
              Platform
            </div>
            <ul className="space-y-2 text-xs font-semibold text-[#5A7385]">
              <li><a href="#web-admin" className="hover:text-[#1E2E3D] transition-colors">Web Admin Portal</a></li>
              <li className="pt-0.5 pb-1">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[#1E2E3D] font-bold">Congregation App</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a 
                      href="https://apps.apple.com/ph/app/coramdeo-life/id6802314896"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-85 transition-opacity inline-flex items-center gap-1"
                    >
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#162533] text-white font-bold inline-flex items-center gap-1">
                        <span>App Store</span>
                        <ExternalLink size={9} />
                      </span>
                    </a>
                    <a 
                      href="https://play.google.com/store/apps/details?id=com.coramdeo.app.prod&pcampaignid=web_share"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-85 transition-opacity inline-flex items-center gap-1"
                    >
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#162533] text-white font-bold inline-flex items-center gap-1">
                        <span>Google Play</span>
                        <ExternalLink size={9} />
                      </span>
                    </a>
                  </div>
                </div>
              </li>
              <li><a href="#roles" className="hover:text-[#1E2E3D] transition-colors">By Leadership Role</a></li>
              <li><a href="#sandbox" className="hover:text-[#1E2E3D] transition-colors">Interactive Live Demo</a></li>
              <li><a href="#pricing" className="hover:text-[#1E2E3D] transition-colors">Church Pricing</a></li>
            </ul>
          </div>

          {/* Leadership Access */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#1E2E3D] uppercase tracking-wider">
              Leadership Access
            </div>
            <ul className="space-y-2 text-xs font-semibold text-[#5A7385]">
              <li>
                <Link to="/login" className="text-[#1E2E3D] font-bold hover:text-[#2C4A60] transition-colors flex items-center gap-1.5">
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight size={13} className="text-[#4F748E]" />
                </Link>
              </li>
              <li>
                <Link to="/register?source=footer" className="hover:text-[#1E2E3D] transition-colors">
                  Create New Church Workspace
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1E2E3D] transition-colors">
                  Treasurer & Bookkeeper Login
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1E2E3D] transition-colors">
                  Pastor & Ministry Leader Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#1E2E3D] uppercase tracking-wider">
              Trust & Legal
            </div>
            <ul className="space-y-2 text-xs font-semibold text-[#5A7385]">
              <li>
                <Link to="/privacy-policy" className="hover:text-[#1E2E3D] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#1E2E3D] transition-colors">
                  Data Isolation Architecture
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#1E2E3D] transition-colors">
                  Role Audit Logs
                </a>
              </li>
              <li>
                <span className="text-[#7E97A8]">Terms of Ministry Service</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7E97A8]">
          <div>
            &copy; {new Date().getFullYear()} Coram Deo Platform. Engineered for faithful churches worldwide.
          </div>
          <div className="flex items-center gap-2">
            <span>Built with care for ministry stewards</span>
            <Heart size={13} className="text-[#4F748E] fill-[#4F748E]" />
          </div>
        </div>

      </div>

    </footer>
  );
}
