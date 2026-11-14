import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Clock } from 'lucide-react';
import { canViewPrayerDashboard } from '../../../utils/dashboardPermissions';
import SoftCard from '../../../components/ui/SoftCard';

export default function PrayerOverviewCard({ prayerData, loading, userProfile }) {
  if (!canViewPrayerDashboard(userProfile)) return null;

  return (
    <SoftCard className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base md:text-lg font-black text-church-charcoal tracking-tight">Prayer Wall Overview</h2>
          <p className="text-xs text-church-slate">Intercession & prayer request stats</p>
        </div>
        <Link to="/admin/prayer" className="text-xs font-bold text-[#2C4A60] hover:text-[#1D3547] hover:underline">
          Prayer Wall
        </Link>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-gradient-to-br from-white/90 to-[#EBF2F7]/70 rounded-2xl border border-white/95 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-[#2C4A60]">New This Week</span>
              <p className="text-xl font-black text-church-charcoal mt-0.5">{prayerData?.newThisWeekCount || 0}</p>
            </div>
            <div className="p-3.5 bg-gradient-to-br from-white/90 to-emerald-50/50 rounded-2xl border border-white/95 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700">Answered Prayers</span>
              <p className="text-xl font-black text-church-charcoal mt-0.5">{prayerData?.answeredCount || 0}</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100/80 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-church-charcoal font-medium">
                <Clock size={14} className="mr-1.5 text-amber-600" /> Pending Moderation
              </span>
              <span className="font-bold text-amber-700">{prayerData?.pendingReviewCount || 0}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-church-charcoal font-medium">
                <Lock size={14} className="mr-1.5 text-purple-600" /> Private Pastoral Requests
              </span>
              <span className="font-bold text-purple-700">{prayerData?.privateLeaderCount || 0}</span>
            </div>
          </div>

          <Link
            to="/admin/prayer"
            className="w-full text-center block py-2.5 px-3 bg-white/80 hover:bg-white rounded-xl text-xs font-bold text-[#2C4A60] border border-white/95 hover:border-[#D5E3EC] transition-all shadow-2xs"
          >
            Review Prayer Requests
          </Link>
        </div>
      )}
    </SoftCard>
  );
}
