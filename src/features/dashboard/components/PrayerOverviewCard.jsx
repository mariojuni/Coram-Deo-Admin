import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, CheckCircle2, Lock, Clock } from 'lucide-react';
import { canViewPrayerDashboard } from '../../../utils/dashboardPermissions';

export default function PrayerOverviewCard({ prayerData, loading, userProfile }) {
  if (!canViewPrayerDashboard(userProfile)) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-church-navy">Prayer Wall Overview</h2>
          <p className="text-xs text-church-slate">Intercession & prayer request stats</p>
        </div>
        <Link to="/admin/prayer" className="text-xs font-bold text-church-green hover:underline">
          Prayer Wall
        </Link>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100">
              <span className="text-[10px] font-bold uppercase text-rose-700">New This Week</span>
              <p className="text-xl font-bold text-church-navy mt-0.5">{prayerData?.newThisWeekCount || 0}</p>
            </div>
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Answered Prayers</span>
              <p className="text-xl font-bold text-church-navy mt-0.5">{prayerData?.answeredCount || 0}</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-church-navy font-medium">
                <Clock size={14} className="mr-1.5 text-amber-600" /> Pending Moderation
              </span>
              <span className="font-bold text-amber-700">{prayerData?.pendingReviewCount || 0}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-church-navy font-medium">
                <Lock size={14} className="mr-1.5 text-purple-600" /> Private Pastoral Requests
              </span>
              <span className="font-bold text-purple-700">{prayerData?.privateLeaderCount || 0}</span>
            </div>
          </div>

          <Link
            to="/admin/prayer"
            className="w-full text-center block py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-church-navy transition-colors"
          >
            Review Prayer Requests
          </Link>
        </div>
      )}
    </div>
  );
}
