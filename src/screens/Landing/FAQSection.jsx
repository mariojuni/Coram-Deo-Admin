import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Does the mobile app include multiple Bible translations, cross references, and reading plans?',
      a: 'Yes! Members can compare translations side-by-side (ESV, NIV, KJV, NASB, NKJV, NLT, LSB). The in-app reader also features interactive in-verse cross references, multi-color highlighting (yellow, pink, blue, green, purple, peach), personal study notes, and structured reading plans (such as the New Testament 182-day plan) with reading streaks.'
    },
    {
      q: 'How does Coram Deo support our worship team with setlists and chords?',
      a: 'Worship leaders assemble Sunday setlists from a searchable song catalog. Band members can dynamically transpose chords into any musical key (+/- semitones), calculate Capo fret positions in real time, and view synchronized chord sheets on their phones or tablets without printing paper binders.'
    },
    {
      q: 'How do volunteer duty scheduling and church prayer requests work?',
      a: 'Volunteers receive assigned duties (such as Ushers, Multimedia, Worship, or Opening Prayer) directly on their mobile home screen with 1-tap "Confirm" or "Decline" responses that immediately update leadership. Members can also post prayer requests to the interactive Prayer Wall, encourage one another with comments, and celebrate answered prayers.'
    },
    {
      q: 'Can members RSVP to church events and stream video sermons?',
      a: 'Yes. The mobile app features a live church calendar where members can RSVP with one tap ("Going", "Maybe", or "Not Going"), view sanctuary venue details, and stream or download weekly video and audio sermons tagged with scripture passages and speaker information.'
    },
    {
      q: 'Can we configure custom fundraising campaigns and accept digital giving like GCash or Maya?',
      a: 'Yes! Church treasurers can configure unlimited giving funds and building campaigns (such as Altar of Grace or Youth Camp) with real-time goal progress bars. Members can give securely via GCash, Maya, cards, or bank transfer and track their personal giving history, while treasurers record physical Sunday cash/check envelopes in seconds.'
    },
    {
      q: 'What happens if church Wi-Fi or mobile data is spotty on Sunday morning?',
      a: 'The CoramDeo Mobile app securely caches each member’s personal QR badge locally on their phone, allowing 2-second check-in even when completely offline. Ushers and secretaries can also quickly look up members by name or phone number on the kiosk scanner if needed.'
    },
    {
      q: 'Can volunteers or worship leaders see confidential church financial records?',
      a: 'Never. Coram Deo implements strict Role-Based Access Control (RBAC). Worship leaders and volunteer coordinators only have access to their setlists, roster schedules, and ministry tools. Sensitive tithes, offerings, donor profiles, and financial statements are restricted exclusively to authorized church and finance administrators.'
    },
    {
      q: 'Can we export financial statements and member directories for our church board?',
      a: 'Yes, anytime with a single click. You can export complete board-ready financial summaries, weekly stewardship statements, donor contribution receipts, and member directories into standard Excel (XLSX), CSV, or official PDF formats with zero vendor lock-in.'
    },
    {
      q: 'Is the companion mobile app free for our congregation members?',
      a: 'The CoramDeo companion app is 100% free for all church members and attendees on both Android and iOS. Android users can install it directly from the Google Play Store, and it seamlessly connects to your church’s workspace with zero per-member mobile fees.'
    }
  ];

  return (
    <section id="faq" className="py-20 lg:py-28 bg-church-canvas border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-church-charcoal uppercase tracking-wider mb-3 shadow-church-soft">
            <HelpCircle size={13} className="text-church-rose" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-church-charcoal tracking-tight">
            Clear answers for your church board.
          </h2>
          <p className="mt-4 text-base text-church-slate leading-relaxed">
            Have questions about transitioning your records or getting started? Here is everything you need to know.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-church-soft overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full text-left p-6 flex items-center justify-between gap-4 font-bold text-church-charcoal hover:text-church-rose transition-colors"
                >
                  <span className="text-base sm:text-lg">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full bg-church-canvas flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-pink-50 text-church-rose' : 'text-church-slate'}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-church-slate leading-relaxed border-t border-gray-100 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
