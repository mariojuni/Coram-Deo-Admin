import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { CathedralLogo } from '../../components/ui/icons';

const TIERS = [
  {
    name: 'Seed Fellowship',
    tagline: 'For church plants & fellowships',
    price: 'Free',
    period: 'forever',
    description: 'Everything small churches need to establish faithful record-keeping without any software cost.',
    features: [
      'Up to 50 active members & family profiles',
      'Sunday tithes & offerings recording',
      'Kiosk QR entrance check-in',
      'Mobile app for congregation members',
      'Standard PDF financial exports',
      'Community email support'
    ],
    popular: false,
    ctaText: 'Start Free Forever',
    targetTier: 'seed'
  },
  {
    name: 'Growth Ministry',
    tagline: 'For established growing churches',
    price: '₱3,490',
    period: 'per month',
    description: 'The complete management engine for growing churches — up to 250 members with 20 GB media storage and automated leadership workflows.',
    features: [
      'Up to 250 active members & unlimited families',
      'Unlimited giving funds & campaign progress bars',
      '20 GB / month sermon video & media storage',
      'Volunteer rostering & ministry scheduling',
      'Worship setlists & chord transposition',
      'Discipleship group chat & prayer walls',
      'Board-ready financial statements in 1 click',
      'Priority chat and onboarding support'
    ],
    popular: true,
    ctaText: 'Start 14-Day Free Trial',
    targetTier: 'growth'
  },
  {
    name: 'Kingdom Network',
    tagline: 'For large and expanding church ministries',
    price: '₱5,490',
    period: 'per month',
    description: 'Everything in Growth Ministry with unlimited congregation members, unlimited giving funds, and 50 GB sermon media storage.',
    features: [
      'Unlimited members & family profiles (No congregation caps)',
      'Unlimited giving funds, campaigns & financial tracking',
      '50 GB sermon video & media storage quota',
      'All Growth Ministry tools (worship setlists, rostering, discipleship)',
      'Dedicated staff onboarding & Zoom training for church leaders',
      'Priority direct phone and email technical support'
    ],
    popular: false,
    ctaText: 'Start 14-Day Free Trial',
    targetTier: 'kingdom'
  }
];

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-transparent border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill-badge mb-3">
            <CathedralLogo size={15} />
            <span className="text-[11px] font-bold text-[#2C4A60] uppercase tracking-wider">Transparent Church Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2E3D] tracking-tight">
            Simple, honest pricing for the local church.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#476072] leading-relaxed">
            No surprise add-ons. No hidden credit card fees. Cancel or change tiers anytime with complete data export freedom.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {TIERS.map((tier, idx) => (
            <div
              key={idx}
              className={`
                glass-light-card rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative
                ${tier.popular 
                  ? 'border border-[#4F748E]/50 shadow-[0_16px_40px_-6px_rgba(71,108,133,0.1)] scale-[1.02]' 
                  : 'border border-white/95 shadow-[0_12px_36px_-6px_rgba(71,108,133,0.06)] hover:shadow-md'}
              `}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#162533] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
                  <span>Most Recommended</span>
                </div>
              )}

              <div>
                <div className="text-sm font-extrabold text-[#1E2E3D]">
                  {tier.name}
                </div>
                <div className="text-xs font-semibold text-[#4F748E] mt-0.5">
                  {tier.tagline}
                </div>

                <div className="mt-4 mb-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-[#1E2E3D] tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs font-semibold text-[#7E97A8]">
                    /{tier.period}
                  </span>
                </div>

                <p className="text-xs text-[#476072] leading-relaxed mb-6">
                  {tier.description}
                </p>

                {/* Features List */}
                <div className="space-y-3 pt-6 border-t border-slate-200/50">
                  <div className="text-[11px] font-bold text-[#7E97A8] uppercase tracking-wider">
                    What's included:
                  </div>
                  {tier.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#1E2E3D]">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/50">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Action */}
              <div className="mt-8 pt-6 border-t border-slate-200/50">
                {tier.popular ? (
                  <button
                    onClick={() => navigate(`/register?tier=${tier.targetTier}`)}
                    className="w-full h-11 rounded-full bg-[#162533] hover:bg-[#243746] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/register?tier=${tier.targetTier}`)}
                    className="w-full h-11 rounded-full glass-light-pill hover:bg-white text-[#2C4A60] text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight size={14} className="text-[#4F748E]" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Existing Leader Sign-in Note */}
        <div className="mt-12 text-center text-xs text-[#5A7385]">
          Already have a Coram Deo church account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-bold text-[#2C4A60] hover:underline"
          >
            Sign in to your admin portal here →
          </button>
        </div>

      </div>
    </section>
  );
}
