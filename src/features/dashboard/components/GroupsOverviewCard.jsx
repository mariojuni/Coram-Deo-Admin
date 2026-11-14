import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FileText } from 'lucide-react';
import { canViewGroupsDashboard } from '../../../utils/dashboardPermissions';
import SoftCard from '../../../components/ui/SoftCard';

export default function GroupsOverviewCard({ groupsData, loading, userProfile }) {
  if (!canViewGroupsDashboard(userProfile)) return null;

  return (
    <SoftCard className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base md:text-lg font-black text-church-charcoal tracking-tight">Discipleship Groups</h2>
          <p className="text-xs text-church-slate">Small groups & leader study materials</p>
        </div>
        <Link to="/admin/discipleship/groups" className="text-xs font-bold text-[#2C4A60] hover:text-[#1D3547] hover:underline">
          Manage Groups
        </Link>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white/70 rounded-2xl border border-white/95 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-[#2C4A60]">Active Groups</span>
              <p className="text-xl font-black text-church-charcoal mt-0.5">{groupsData?.activeGroupsCount || 0}</p>
            </div>
            <div className="p-3.5 bg-white/70 rounded-2xl border border-white/95 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-[#4F748E]">Meetings This Week</span>
              <p className="text-xl font-black text-church-charcoal mt-0.5">{groupsData?.meetingsThisWeekCount || 0}</p>
            </div>
          </div>

          {groupsData?.groupsWithoutLeaderCount > 0 && (
            <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-900 font-medium shadow-2xs">
              <span className="flex items-center">
                <AlertCircle size={14} className="mr-1.5 text-amber-600 shrink-0" />
                {groupsData.groupsWithoutLeaderCount} group{groupsData.groupsWithoutLeaderCount > 1 ? 's' : ''} need an assigned leader
              </span>
              <Link to="/admin/discipleship/groups" className="text-amber-800 font-bold underline shrink-0">
                Review
              </Link>
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100/80">
            <span className="flex items-center text-church-charcoal font-medium">
              <FileText size={14} className="mr-1.5 text-[#2C4A60]" /> Study Guides & Materials
            </span>
            <span className="font-bold text-church-charcoal">{groupsData?.materialsCount || 0} uploaded</span>
          </div>
        </div>
      )}
    </SoftCard>
  );
}
