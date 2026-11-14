import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ArrowRight } from 'lucide-react';
import { CathedralLogo } from '../../components/ui/icons';

const NAV_LINKS = [
  { label: 'Web Admin', href: '#web-admin' },
  { label: 'Mobile App', href: '#mobile-app' },
  { label: 'By Role', href: '#roles' },
  { label: 'Interactive Demo', href: '#sandbox' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const { currentUser } = useAuth() || {};
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollTo = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/80 shadow-[0_2px_16px_-4px_rgba(71,108,133,0.05)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-white/90 border border-slate-200/30 flex items-center justify-center shadow-church-soft p-0.5 transition-transform duration-300 group-hover:scale-105 overflow-hidden">
              <CathedralLogo size={36} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-[#1E2E3D] tracking-tight">CoramDeo</span>
                <span className="text-[10px] font-bold text-[#2C4A60] bg-[#EBF2F7] px-2.5 py-0.5 rounded-full border border-[#D5E3EC]">
                  Church Platform
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#7E97A8] -mt-0.5">Faithful Stewardship & Ministry</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="text-sm font-semibold text-[#476072] hover:text-[#1E2E3D] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Action Group: Login + CTA */}
          <div className="hidden sm:flex items-center space-x-4">
            {currentUser ? (
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-2 h-10 px-5 text-sm font-bold rounded-full bg-[#162533] text-white hover:bg-[#243746] transition-all shadow-sm"
              >
                <span>Enter Admin Portal</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="h-10 px-4 text-sm font-bold text-[#2C4A60] hover:text-[#162533] transition-colors flex items-center"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => navigate('/register?source=navbar')}
                  className="h-10 px-5 text-sm font-bold rounded-full bg-[#162533] text-white hover:bg-[#243746] transition-all shadow-sm"
                >
                  Start Free Trial
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#2C4A60] hover:bg-white/80 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200/60 px-5 pt-3 pb-6 space-y-4 shadow-church-elevated animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3 pt-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="text-base font-semibold text-[#2C4A60] hover:text-[#162533] py-1.5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200/60 flex flex-col space-y-3">
            {currentUser ? (
              <button
                onClick={() => navigate('/admin')}
                className="w-full h-11 flex items-center justify-center gap-2 text-sm font-bold rounded-full bg-[#162533] text-white"
              >
                <span>Enter Admin Portal</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full h-11 flex items-center justify-center text-sm font-bold rounded-full border border-slate-200 text-[#2C4A60] hover:bg-slate-50"
                >
                  Sign In to Admin Portal
                </Link>
                <button
                  onClick={() => navigate('/register?source=navbar')}
                  className="w-full h-11 flex items-center justify-center text-sm font-bold rounded-full bg-[#162533] text-white"
                >
                  Start Free Trial
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
