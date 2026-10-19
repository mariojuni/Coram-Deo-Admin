import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UploadCloud, UserCheck, ArrowRight } from 'lucide-react';
import GradientButton from '../../components/ui/GradientButton';

export default function OnboardingSteps() {
  const navigate = useNavigate();

  const steps = [
    {
      step: '01',
      title: 'Create Your Church Profile',
      subtitle: 'Takes about 10 minutes, no credit card',
      description: 'Sign up for free and enter your church name, campus location, and preferred currency (₱, $, etc.). Your dedicated tenant workspace is provisioned instantly.',
      icon: Building2,
      color: 'text-church-rose',
      bg: 'bg-pink-50'
    },
    {
      step: '02',
      title: 'Bring Over Your Records',
      subtitle: 'Free assisted onboarding and CSV import',
      description: 'Easily import your existing member rosters, family groups, and fund categories from spreadsheets. Our team provides free transition guidance so no data is left behind.',
      icon: UploadCloud,
      color: 'text-church-violet',
      bg: 'bg-purple-50'
    },
    {
      step: '03',
      title: 'Invite Your Team & Congregation',
      subtitle: 'Grant role-governed access immediately',
      description: 'Assign your treasurer, secretary, and pastors their respective roles with strict permission boundaries. Distribute the mobile app to your congregation for instant QR check-ins.',
      icon: UserCheck,
      color: 'text-church-emerald',
      bg: 'bg-emerald-50'
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-church-canvas border border-gray-200 text-xs font-bold text-church-charcoal uppercase tracking-wider mb-3">
            Frictionless Onboarding
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-church-charcoal tracking-tight">
            Up and running before next Sunday.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-church-slate leading-relaxed">
            Transitioning your church management doesn't take months of expensive consultants. We designed Coram Deo to feel natural from your very first afternoon.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-church-canvas rounded-3xl p-8 border border-gray-100 shadow-church-soft flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-church-elevated relative overflow-hidden"
              >
                {/* Large Background Step Number */}
                <div className="absolute top-4 right-6 text-6xl font-black text-gray-200/50 select-none pointer-events-none">
                  {item.step}
                </div>

                <div>
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center font-bold mb-6 shadow-church-soft`}>
                    <Icon size={22} />
                  </div>

                  <h3 className="text-xl font-black text-church-charcoal tracking-tight">
                    {item.title}
                  </h3>

                  <div className="text-xs font-bold text-church-rose mt-1">
                    {item.subtitle}
                  </div>

                  <p className="mt-3 text-sm text-church-slate leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200/50 flex items-center text-xs font-bold text-church-charcoal">
                  <span>Step {idx + 1} of 3</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center gap-4">
          <GradientButton
            size="md"
            onClick={() => navigate('/register?source=onboarding')}
            className="shadow-church-glow"
          >
            Start Setting Up Your Church
          </GradientButton>

          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-church-charcoal hover:text-church-rose px-4 py-2 transition-colors flex items-center gap-1.5"
          >
            <span>Have an existing account? Sign In</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </section>
  );
}
