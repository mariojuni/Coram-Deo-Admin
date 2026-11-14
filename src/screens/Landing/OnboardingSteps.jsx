import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UploadCloud, UserCheck, ArrowRight } from 'lucide-react';
import GradientButton from '../../components/ui/GradientButton';
import { CathedralLogo } from '../../components/ui/icons';

const STEPS = [
  {
    step: '01',
    title: 'Create Your Church Profile',
    subtitle: 'Takes about 10 minutes, no credit card',
    description: 'Sign up for free and enter your church name, campus location, and preferred currency (₱, $, etc.). Your dedicated tenant workspace is provisioned instantly.',
    icon: Building2,
    color: 'text-brand-primary',
    bg: 'bg-blue-100/80'
  },
  {
    step: '02',
    title: 'Bring Over Your Records',
    subtitle: 'Free assisted onboarding and CSV import',
    description: 'Easily import your existing member rosters, family groups, and fund categories from spreadsheets. Our team provides free transition guidance so no data is left behind.',
    icon: UploadCloud,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100/80'
  },
  {
    step: '03',
    title: 'Invite Your Team & Congregation',
    subtitle: 'Grant role-governed access immediately',
    description: 'Assign your treasurer, secretary, and pastors their respective roles with strict permission boundaries. Distribute the mobile app to your congregation for instant QR check-ins.',
    icon: UserCheck,
    color: 'text-emerald-700',
    bg: 'bg-emerald-100/80'
  }
];

export default function OnboardingSteps() {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-28 bg-transparent border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill-badge mb-3">
            <CathedralLogo size={15} />
            <span className="text-[11px] font-bold text-[#2C4A60] uppercase tracking-wider">Frictionless Onboarding</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2E3D] tracking-tight">
            Up and running before next Sunday.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#476072] leading-relaxed">
            Transitioning your church management doesn't take months of expensive consultants. We designed Coram Deo to feel natural from your very first afternoon.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="glass-light-card rounded-3xl p-8 border border-white/95 shadow-[0_12px_36px_-6px_rgba(71,108,133,0.06)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden"
              >
                {/* Large Background Step Number */}
                <div className="absolute top-4 right-6 text-6xl font-black text-slate-300/30 select-none pointer-events-none">
                  {item.step}
                </div>

                <div>
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center font-bold mb-6 shadow-2xs`}>
                    <Icon size={22} />
                  </div>

                  <h3 className="text-xl font-black text-[#1E2E3D] tracking-tight">
                    {item.title}
                  </h3>

                  <div className="text-xs font-bold text-[#4F748E] mt-1">
                    {item.subtitle}
                  </div>

                  <p className="mt-3 text-sm text-[#476072] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200/50 flex items-center text-xs font-bold text-[#5A7385]">
                  <span>Step {idx + 1} of 3</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate('/register?source=onboarding')}
            className="h-12 px-7 text-sm font-bold rounded-full bg-[#162533] hover:bg-[#243746] text-white shadow-sm transition-all flex items-center gap-2"
          >
            <span>Start Free Church Setup</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="h-12 px-6 text-xs font-bold rounded-full glass-light-pill hover:bg-white text-[#2C4A60] shadow-2xs transition-all flex items-center gap-2"
          >
            <span>Have an account? Sign in</span>
          </button>
        </div>

      </div>
    </section>
  );
}
