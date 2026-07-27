import React from 'react';
import { Link } from 'react-router-dom';
import { ListMusic, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { canViewWorshipDashboard } from '../../../utils/dashboardPermissions';

export default function WorshipOverviewCard({ worshipData, loading, userProfile }) {
  if (!canViewWorshipDashboard(userProfile)) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-church-navy">Worship Setlists</h2>
          <p className="text-xs text-church-slate">Setlist publications & event linking</p>
        </div>
        <Link to="/admin/worship/setlists" className="text-xs font-bold text-church-green hover:underline">
          All Setlists
        </Link>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Published Setlists</span>
              <p className="text-xl font-bold text-church-navy mt-0.5">{worshipData?.publishedCount || 0}</p>
            </div>
            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100">
              <span className="text-[10px] font-bold uppercase text-amber-700">Draft Setlists</span>
              <p className="text-xl font-bold text-church-navy mt-0.5">{worshipData?.draftCount || 0}</p>
            </div>
          </div>

          {worshipData?.missingSetlistForWorshipEvent > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-900 font-medium">
              <span className="flex items-center">
                <AlertTriangle size={14} className="mr-1.5 text-amber-600 shrink-0" />
                {worshipData.missingSetlistForWorshipEvent} worship service{worshipData.missingSetlistForWorshipEvent > 1 ? 's' : ''} this week missing a setlist
              </span>
              <Link to="/admin/worship/setlists" className="text-amber-800 font-bold underline shrink-0">
                Create
              </Link>
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
            <span className="flex items-center text-church-navy font-medium">
              <ListMusic size={14} className="mr-1.5 text-indigo-600" /> Linked to This Week's Events
            </span>
            <span className="font-bold text-church-navy">{worshipData?.linkedThisWeekCount || 0} setlists</span>
          </div>
        </div>
      )}
    </div>
  );
}
