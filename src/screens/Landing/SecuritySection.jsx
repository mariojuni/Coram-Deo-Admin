import React from 'react';
import { ShieldCheck, Lock, Download, Server } from 'lucide-react';
import { CathedralLogo } from '../../components/ui/icons';

const SECURITY_FEATURES = [
  {
    title: 'Church-Isolated Tenant Partitioning',
    description: 'Your church’s records are strictly partitioned. No other church or outside party can ever view or query your financial or member data.',
    icon: Server,
    color: 'text-brand-primary',
    bg: 'bg-blue-100/80'
  },
  {
    title: 'Role-Based Access Control (RBAC)',
    description: 'Strict separation of powers. Volunteers see only their assigned rosters; bookkeepers see only financial ledgers; pastors see pastoral care notes.',
    icon: Lock,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100/80'
  },
  {
    title: 'Immutable Role & Financial Audit Logs',
    description: 'Every privilege change, envelope creation, and financial entry is permanently logged with the user ID and timestamp to ensure complete transparency.',
    icon: ShieldCheck,
    color: 'text-emerald-700',
    bg: 'bg-emerald-100/80'
  },
  {
    title: 'Complete Data Portability (Zero Lock-In)',
    description: 'Your records belong to your church. Export your complete member directory, giving histories, and ledger entries to standard CSV/PDF at any time with one click.',
    icon: Download,
    color: 'text-amber-700',
    bg: 'bg-amber-100/80'
  }
];

export default function SecuritySection() {
  return (
    <section className="py-20 lg:py-28 bg-transparent border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill-badge mb-3">
            <CathedralLogo size={15} />
            <span className="text-[11px] font-bold text-[#2C4A60] uppercase tracking-wider">Data Stewardship & Privacy</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E2E3D] tracking-tight">
            Your church. Your people. <span className="bg-gradient-to-r from-[#2C4A60] via-[#4F748E] to-[#6892AD] bg-clip-text text-transparent">Your data.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#476072] leading-relaxed">
            We understand the sacred trust of shepherding church records and tithes. Coram Deo protects your ministry with enterprise-grade data isolation and transparent access control.
          </p>
        </div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SECURITY_FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="glass-light-card rounded-3xl p-8 border border-white/95 shadow-[0_12px_36px_-6px_rgba(71,108,133,0.06)] flex flex-col sm:flex-row items-start gap-5 transition-all duration-300 hover:shadow-md"
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 font-bold shadow-2xs`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1E2E3D] tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#476072] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Callout Quote */}
        <div className="mt-12 glass-light-card rounded-2xl p-6 border border-white/95 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs border border-emerald-200/50">
              ✓
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#1E2E3D]">
              Safer than notebooks in church filing cabinets or shared USB thumb drives.
            </div>
          </div>
          <span className="text-xs font-bold text-[#7E97A8]">
            Encrypted in transit & at rest
          </span>
        </div>

      </div>
    </section>
  );
}
