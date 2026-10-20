import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import GradientButton from '../../components/ui/GradientButton';

export default function PricingSection() {
  const navigate = useNavigate();

  const tiers = [
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
      ctaAction: () => navigate('/register?tier=seed')
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
      ctaAction: () => navigate('/register?tier=growth')
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
      ctaAction: () => navigate('/register?tier=kingdom')
    }
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-church-canvas border border-gray-200 text-xs font-bold text-church-charcoal uppercase tracking-wider mb-3 shadow-church-soft">
            Transparent Church Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-church-charcoal tracking-tight">
            Simple, honest pricing for the local church.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-church-slate leading-relaxed">
            No surprise add-ons. No hidden credit card fees. Cancel or change tiers anytime with complete data export freedom.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`
                rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative
                ${tier.popular 
                  ? 'bg-gradient-to-b from-white to-pink-50/20 border-2 border-church-rose shadow-church-elevated scale-[1.02]' 
                  : 'bg-church-canvas border border-gray-100 shadow-church-soft hover:shadow-church-elevated'}
              `}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-coram text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-church-glow flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Most Recommended</span>
                </div>
              )}

              <div>
                <div className="text-sm font-extrabold text-church-charcoal">
                  {tier.name}
                </div>
                <div className="text-xs font-semibold text-church-rose mt-0.5">
                  {tier.tagline}
                </div>

                <div className="mt-4 mb-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-church-charcoal tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs font-semibold text-church-slate">
                    /{tier.period}
                  </span>
                </div>

                <p className="text-xs text-church-slate leading-relaxed mb-6">
                  {tier.description}
                </p>

                {/* Features List */}
                <div className="space-y-3 pt-6 border-t border-gray-200/60">
                  <div className="text-[11px] font-bold text-church-slate uppercase tracking-wider">
                    What's included:
                  </div>
                  {tier.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-church-charcoal">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-church-emerald flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Action */}
              <div className="mt-8 pt-6 border-t border-gray-200/50">
                {tier.popular ? (
                  <GradientButton
                    size="md"
                    onClick={tier.ctaAction}
                    className="w-full justify-center shadow-church-glow"
                  >
                    {tier.ctaText}
                  </GradientButton>
                ) : (
                  <button
                    onClick={tier.ctaAction}
                    className="w-full h-11 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-church-charcoal text-xs font-bold transition-all shadow-church-soft flex items-center justify-center gap-1.5"
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Existing Leader Sign-in Note */}
        <div className="mt-12 text-center text-xs text-church-slate">
          Already have a Coram Deo church account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-bold text-church-rose hover:underline"
          >
            Sign in to your admin portal here →
          </button>
        </div>

      </div>
    </section>
  );
}
