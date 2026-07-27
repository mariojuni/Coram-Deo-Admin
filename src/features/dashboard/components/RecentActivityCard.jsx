import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, FileText, UserPlus, Calendar, CreditCard, HeartHandshake, ListMusic } from 'lucide-react';

export default function RecentActivityCard({ activityItems, loading }) {
  const getIcon = (type) => {
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
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins || 1}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-church-navy">Recent Activity</h2>
          <p className="text-xs text-church-slate">Latest updates across church modules</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !activityItems || activityItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <Activity size={36} className="mb-2 stroke-1" />
            <p className="text-sm font-medium text-church-navy">No recent activity logged.</p>
          </div>
        ) : (
          activityItems.map((item) => {
            const Icon = getIcon(item.type);
            return (
              <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="p-2 rounded-xl bg-gray-100 text-church-navy shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-church-navy truncate">{item.title}</h4>
                    <p className="text-[11px] text-church-slate truncate">{item.subtitle}</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-gray-400 shrink-0">
                  {getTimeAgo(item.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* TODO note for future dedicated audit logs collection */}
      <div className="mt-3 text-[10px] text-center text-gray-400 italic">
        Activity feed compiled from recent documents. TODO: Upgrade to activityLogs collection.
      </div>
    </div>
  );
}
