import React from 'react';
import { ShieldCheck, Zap, RefreshCw, FileText } from 'lucide-react';

export default function TrustMetrics() {
  const metrics = [
    {
      value: '99.9%',
      label: 'Sunday Service Uptime',
      description: 'Reliable QR kiosk check-in and giving when attendance peaks.',
      icon: Zap,
      color: 'text-church-rose',
      bg: 'bg-pink-50'
    },
    {
      value: '1 Click',
      label: 'Board & Financial Statements',
      description: 'Instant PDF and Excel reports ready for church board reviews.',
      icon: FileText,
      color: 'text-church-violet',
      bg: 'bg-purple-50'
    },
    {
      value: '100%',
      label: 'Church Data Isolation',
      description: 'Tenant security rules and strict role-based access control.',
      icon: ShieldCheck,
      color: 'text-church-emerald',
      bg: 'bg-emerald-50'
    },
    {
      value: 'Real-Time',
      label: 'Cloud Sync (Web & Mobile)',
      description: 'Instant synchronization between leadership desk and member pockets.',
      icon: RefreshCw,
      color: 'text-church-amber',
      bg: 'bg-amber-50'
    }
  ];

  return (
    <section className="py-14 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center sm:items-start text-center sm:text-left group"
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-church-soft`}>
                  <Icon size={22} />
                </div>
                <div className="text-3xl lg:text-4xl font-black text-church-charcoal tracking-tight">
                  {item.value}
                </div>
                <div className="text-sm font-bold text-church-charcoal mt-1">
                  {item.label}
                </div>
                <p className="text-xs text-church-slate mt-1.5 leading-relaxed max-w-xs">
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
