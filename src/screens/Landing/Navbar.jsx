import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ArrowRight } from 'lucide-react';
import logo from '../../assets/logo.svg';
import GradientButton from '../../components/ui/GradientButton';

export default function Navbar() {
  const { currentUser } = useAuth() || {};
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Web Admin', href: '#web-admin' },
    { label: 'Mobile App', href: '#mobile-app' },
    { label: 'By Role', href: '#roles' },
    { label: 'Interactive Demo', href: '#sandbox' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleScrollTo = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100/90 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-coram rounded-2xl flex items-center justify-center shadow-church-glow p-2 transition-transform duration-300 group-hover:scale-105">
              <img src={logo} alt="Coram Deo" className="w-full h-full object-contain filter brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-church-charcoal tracking-tight">CoramDeo</span>
                <span className="text-[10px] font-bold text-church-rose bg-church-rose-light px-2 py-0.5 rounded-full border border-pink-100">
                  Church Platform
                </span>
              </div>
              <span className="text-[10px] font-medium text-church-slate -mt-0.5">Faithful Stewardship & Ministry</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="text-sm font-semibold text-church-slate hover:text-church-rose transition-colors duration-200"
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
                className="inline-flex items-center gap-2 h-10 px-5 text-sm font-bold rounded-full bg-church-charcoal text-white hover:bg-black transition-all shadow-church-soft"
              >
                <span>Enter Admin Portal</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="h-10 px-4 text-sm font-bold text-church-charcoal hover:text-church-rose transition-colors flex items-center"
                >
                  Sign In
                </Link>
                <GradientButton
                  size="sm"
                  onClick={() => navigate('/register?source=navbar')}
                  className="shadow-church-glow"
                >
                  Start Free Trial
                </GradientButton>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-church-charcoal hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-gray-100 px-5 pt-3 pb-6 space-y-4 shadow-church-elevated animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="text-base font-semibold text-church-charcoal hover:text-church-rose py-1.5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
            {currentUser ? (
              <button
                onClick={() => navigate('/admin')}
                className="w-full h-11 flex items-center justify-center gap-2 text-sm font-bold rounded-full bg-church-charcoal text-white"
              >
                <span>Enter Admin Portal</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full h-11 flex items-center justify-center text-sm font-bold rounded-full border border-gray-200 text-church-charcoal hover:bg-gray-50"
                >
                  Sign In to Admin Portal
                </Link>
                <GradientButton
                  size="md"
                  onClick={() => navigate('/register?source=navbar')}
                  className="w-full justify-center"
                >
                  Start Free Trial
                </GradientButton>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
