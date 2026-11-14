import React from 'react';
import { Activity, FileText, UserPlus, Calendar, CreditCard, HeartHandshake, ListMusic } from 'lucide-react';
import SoftCard from '../../../components/ui/SoftCard';

function getActivityIcon(type) {
  switch (type) {
    case 'application':
      return UserPlus;
    case 'event':
      return Calendar;
    case 'giving':
      return CreditCard;
    case 'prayer':
      return HeartHandshake;
    case 'setlist':
      return ListMusic;
    default:
      return FileText;
  }
}

function getTimeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = new Date() - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins || 1}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function RecentActivityCard({ activityItems, loading }) {
  return (
    <SoftCard className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base md:text-lg font-black text-church-charcoal tracking-tight">Recent Activity</h2>
          <p className="text-xs text-church-slate">Latest updates across church modules</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[360px]">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !activityItems || activityItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <Activity size={36} className="mb-2 stroke-1 text-slate-300" />
            <p className="text-sm font-bold text-church-charcoal">No recent activity logged.</p>
          </div>
        ) : (
          activityItems.map((item) => {
            const Icon = getActivityIcon(item.type);
            return (
              <div key={item.id} className="flex items-center justify-between p-3 border border-white/95 rounded-2xl bg-white/80 hover:bg-white hover:border-[#D5E3EC] transition-all shadow-2xs">
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC] flex items-center justify-center shrink-0">
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-church-charcoal truncate">{item.title}</h4>
                    <p className="text-[11px] text-church-slate truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                  {getTimeAgo(item.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 text-[10px] text-center text-slate-400">
        Activity feed compiled from recent ministry operations
      </div>
    </SoftCard>
  );
}
