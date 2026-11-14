import React from 'react';
import { Link } from 'react-router-dom';
import { ListMusic, AlertTriangle } from 'lucide-react';
import { canViewWorshipDashboard } from '../../../utils/dashboardPermissions';
import SoftCard from '../../../components/ui/SoftCard';

export default function WorshipOverviewCard({ worshipData, loading, userProfile }) {
  if (!canViewWorshipDashboard(userProfile)) return null;

  return (
    <SoftCard className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base md:text-lg font-black text-church-charcoal tracking-tight">Worship Setlists</h2>
          <p className="text-xs text-church-slate">Setlist publications & event linking</p>
        </div>
        <Link to="/admin/worship/setlists" className="text-xs font-bold text-[#2C4A60] hover:text-[#1D3547] hover:underline">
          All Setlists
        </Link>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-gradient-to-br from-white/90 to-emerald-50/50 rounded-2xl border border-white/95 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700">Published Setlists</span>
              <p className="text-xl font-black text-church-charcoal mt-0.5">{worshipData?.publishedCount || 0}</p>
            </div>
            <div className="p-3.5 bg-gradient-to-br from-white/90 to-amber-50/50 rounded-2xl border border-white/95 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-amber-700">Draft Setlists</span>
              <p className="text-xl font-black text-church-charcoal mt-0.5">{worshipData?.draftCount || 0}</p>
            </div>
          </div>

          {worshipData?.missingSetlistForWorshipEvent > 0 && (
            <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-900 font-medium shadow-2xs">
              <span className="flex items-center">
                <AlertTriangle size={14} className="mr-1.5 text-amber-600 shrink-0" />
                {worshipData.missingSetlistForWorshipEvent} worship service{worshipData.missingSetlistForWorshipEvent > 1 ? 's' : ''} this week missing a setlist
              </span>
              <Link to="/admin/worship/setlists" className="text-amber-800 font-bold underline shrink-0">
                Create
              </Link>
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100/80">
            <span className="flex items-center text-church-charcoal font-medium">
              <ListMusic size={14} className="mr-1.5 text-[#2C4A60]" /> Linked to This Week's Events
            </span>
            <span className="font-bold text-church-charcoal">{worshipData?.linkedThisWeekCount || 0} setlists</span>
          </div>
        </div>
      )}
    </SoftCard>
  );
}
