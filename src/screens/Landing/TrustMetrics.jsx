import React from 'react';
import { ShieldCheck, Zap, RefreshCw, FileText } from 'lucide-react';

const METRICS = [
  {
    value: '99.9%',
    label: 'Sunday Service Uptime',
    description: 'Reliable QR kiosk check-in and giving when attendance peaks.',
    icon: Zap,
    color: 'text-[#2C4A60]',
    bg: 'bg-white/90 border border-white/95'
  },
  {
    value: '1 Click',
    label: 'Board & Financial Statements',
    description: 'Instant PDF and Excel reports ready for church board reviews.',
    icon: FileText,
    color: 'text-[#4F748E]',
    bg: 'bg-white/90 border border-white/95'
  },
  {
    value: '100%',
    label: 'Church Data Isolation',
    description: 'Tenant security rules and strict role-based access control.',
    icon: ShieldCheck,
    color: 'text-emerald-700',
    bg: 'bg-white/90 border border-white/95'
  },
  {
    value: 'Real-Time',
    label: 'Cloud Sync (Web & Mobile)',
    description: 'Instant synchronization between leadership desk and member pockets.',
    icon: RefreshCw,
    color: 'text-[#4F748E]',
    bg: 'bg-white/90 border border-white/95'
  }
];

export default function TrustMetrics() {
  return (
    <section className="py-14 bg-white/60 backdrop-blur-xl border-y border-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {METRICS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center sm:items-start text-center sm:text-left group"
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105 shadow-church-soft`}>
                  <Icon size={22} />
                </div>
                <div className="text-3xl lg:text-4xl font-black text-[#1E2E3D] tracking-tight">
                  {item.value}
                </div>
                <div className="text-sm font-bold text-[#2C4A60] mt-1">
                  {item.label}
                </div>
                <p className="text-xs text-[#5A7385] mt-1.5 leading-relaxed max-w-xs">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
