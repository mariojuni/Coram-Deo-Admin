import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Heart, ExternalLink } from 'lucide-react';
import logo from '../../assets/logo.svg';
import GradientButton from '../../components/ui/GradientButton';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-church-canvas border-t border-gray-200/80">
      
      {/* ── Pre-Footer High-Conversion Banner ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-church-charcoal rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-church-elevated relative overflow-hidden border border-gray-800">
          
          {/* Ambient Brand Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-coram opacity-15 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500 opacity-10 blur-[90px] pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-pink-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-church-rose" />
              <span>Get Started This Week</span>
            </div>

            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Ready to give your church leadership hours back every week?
            </h3>

            <p className="mt-4 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
              Ditch the scattered paper notebooks and messy spreadsheets. Start your church's free workspace today and invite your team in minutes.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <GradientButton
                size="lg"
                onClick={() => navigate('/register?source=prefooter')}
                className="shadow-church-glow"
              >
                Start Free for Your Church
              </GradientButton>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-gray-200">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-coram rounded-2xl flex items-center justify-center shadow-church-glow p-2">
                <img src={logo} alt="Coram Deo" className="w-full h-full object-contain filter brightness-0 invert" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-church-charcoal tracking-tight">CoramDeo</span>
                <span className="text-[10px] font-medium text-church-slate -mt-0.5">Faithful Stewardship & Ministry</span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-church-slate max-w-sm leading-relaxed">
              *Coram Deo* — Living in the presence of God. Empowering local churches with unified financial stewardship, member directories, worship planning, and mobile engagement.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-church-charcoal pt-2">
              <span className="w-2 h-2 rounded-full bg-church-emerald" />
              <span>All Systems Operational (99.9% Sunday Uptime)</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-church-charcoal uppercase tracking-wider">
              Platform
            </div>
            <ul className="space-y-2 text-xs font-semibold text-church-slate">
              <li><a href="#web-admin" className="hover:text-church-rose transition-colors">Web Admin Portal</a></li>
              <li className="pt-0.5 pb-1">
                <div className="flex flex-col gap-1.5">
                  <span className="text-church-charcoal font-bold">Congregation App</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a 
                      href="https://apps.apple.com/ph/app/coramdeo-life/id6802314896"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-85 transition-opacity inline-flex items-center gap-1"
                    >
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold inline-flex items-center gap-1">
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-church-rose font-bold inline-flex items-center gap-1">
                        <span>Google Play</span>
                        <ExternalLink size={9} />
                      </span>
                    </a>
                  </div>
                </div>
              </li>
              <li><a href="#roles" className="hover:text-church-rose transition-colors">By Leadership Role</a></li>
              <li><a href="#sandbox" className="hover:text-church-rose transition-colors">Interactive Live Demo</a></li>
              <li><a href="#pricing" className="hover:text-church-rose transition-colors">Church Pricing</a></li>
            </ul>
          </div>

          {/* Leadership Access (Crucial Login Links!) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-church-charcoal uppercase tracking-wider">
              Leadership Access
            </div>
            <ul className="space-y-2 text-xs font-semibold text-church-slate">
              <li>
                <Link to="/login" className="text-church-charcoal font-bold hover:text-church-rose transition-colors flex items-center gap-1.5">
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight size={13} className="text-church-rose" />
                </Link>
              </li>
              <li>
                <Link to="/register?source=footer" className="hover:text-church-rose transition-colors">
                  Create New Church Workspace
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-church-rose transition-colors">
                  Treasurer & Bookkeeper Login
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-church-rose transition-colors">
                  Pastor & Ministry Leader Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-church-charcoal uppercase tracking-wider">
              Trust & Legal
            </div>
            <ul className="space-y-2 text-xs font-semibold text-church-slate">
              <li>
                <Link to="/privacy-policy" className="hover:text-church-rose transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-church-rose transition-colors">
                  Data Isolation Architecture
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-church-rose transition-colors">
                  Role Audit Logs
                </a>
              </li>
              <li>
                <span className="text-church-slate/80">Terms of Ministry Service</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-church-slate">
          <div>
            &copy; {new Date().getFullYear()} Coram Deo Platform. Engineered for faithful churches worldwide.
          </div>
          <div className="flex items-center gap-2">
            <span>Built with care for ministry stewards</span>
            <Heart size={13} className="text-church-rose fill-church-rose" />
          </div>
        </div>

      </div>

    </footer>
  );
}
