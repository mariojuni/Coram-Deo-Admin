import React from 'react';
import { ShieldCheck, Lock, Download, FileSpreadsheet, EyeOff, Server } from 'lucide-react';

export default function SecuritySection() {
  const securityFeatures = [
    {
      title: 'Church-Isolated Tenant Partitioning',
      description: 'Your church’s records are strictly partitioned. No other church or outside party can ever view or query your financial or member data.',
      icon: Server,
      color: 'text-church-rose',
      bg: 'bg-pink-50'
    },
    {
      title: 'Role-Based Access Control (RBAC)',
      description: 'Strict separation of powers. Volunteers see only their assigned rosters; bookkeepers see only financial ledgers; pastors see pastoral care notes.',
      icon: Lock,
      color: 'text-church-violet',
      bg: 'bg-purple-50'
    },
    {
      title: 'Immutable Role & Financial Audit Logs',
      description: 'Every privilege change, envelope creation, and financial entry is permanently logged with the user ID and timestamp to ensure complete transparency.',
      icon: ShieldCheck,
      color: 'text-church-emerald',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Complete Data Portability (Zero Lock-In)',
      description: 'Your records belong to your church. Export your complete member directory, giving histories, and ledger entries to standard CSV/PDF at any time with one click.',
      icon: Download,
      color: 'text-church-amber',
      bg: 'bg-amber-50'
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-church-canvas border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-church-charcoal uppercase tracking-wider mb-3 shadow-church-soft">
            <Lock size={13} className="text-church-rose" />
            <span>Data Stewardship & Privacy</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-church-charcoal tracking-tight">
            Your church. Your people. <span className="text-church-rose">Your data.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-church-slate leading-relaxed">
            We understand the sacred trust of shepherding church records and tithes. Coram Deo protects your ministry with enterprise-grade data isolation and transparent access control.
          </p>
        </div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {securityFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-church-soft flex flex-col sm:flex-row items-start gap-5 transition-all duration-300 hover:shadow-church-elevated"
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 font-bold shadow-church-soft`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-church-charcoal tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-church-slate leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Callout Quote */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-gray-100/90 shadow-church-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-church-emerald flex items-center justify-center font-black text-xs">
              ✓
            </div>
            <div className="text-xs sm:text-sm font-semibold text-church-charcoal">
              Safer than notebooks in church filing cabinets or shared USB thumb drives.
            </div>
          </div>
          <span className="text-xs font-bold text-church-slate">
            Encrypted in transit & at rest
          </span>
        </div>

      </div>
    </section>
  );
}
