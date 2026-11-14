import React, { useEffect } from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import TrustMetrics from './TrustMetrics';
import RolePillars from './RolePillars';
import WebAdminShowcase from './WebAdminShowcase';
import MobileAppCarousel from './MobileAppCarousel';
import InteractiveSandbox from './InteractiveSandbox';
import OnboardingSteps from './OnboardingSteps';
import SecuritySection from './SecuritySection';
import PricingSection from './PricingSection';
import FAQSection from './FAQSection';
import Footer from './Footer';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'Coram Deo — Church Management Platform | Web & Mobile Ecosystem';
  }, []);

  return (
    <div className="min-h-screen glass-light-canvas text-brand-dark flex flex-col selection:bg-blue-100 selection:text-brand-primary font-sans">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <TrustMetrics />
        <RolePillars />
        <WebAdminShowcase />
        <MobileAppCarousel />
        <InteractiveSandbox />
        <OnboardingSteps />
        <SecuritySection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
