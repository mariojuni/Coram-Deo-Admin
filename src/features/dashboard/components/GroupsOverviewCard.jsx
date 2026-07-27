import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, Users, AlertCircle, FileText } from 'lucide-react';
import { canViewGroupsDashboard } from '../../../utils/dashboardPermissions';

export default function GroupsOverviewCard({ groupsData, loading, userProfile }) {
  if (!canViewGroupsDashboard(userProfile)) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-church-navy">Discipleship Groups</h2>
          <p className="text-xs text-church-slate">Small groups & leader study materials</p>
        </div>
        <Link to="/admin/discipleship/groups" className="text-xs font-bold text-church-green hover:underline">
          Manage Groups
        </Link>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <span className="text-[10px] font-bold uppercase text-indigo-700">Active Groups</span>
              <p className="text-xl font-bold text-church-navy mt-0.5">{groupsData?.activeGroupsCount || 0}</p>
            </div>
            <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-100">
              <span className="text-[10px] font-bold uppercase text-teal-700">Meetings This Week</span>
              <p className="text-xl font-bold text-church-navy mt-0.5">{groupsData?.meetingsThisWeekCount || 0}</p>
            </div>
          </div>

          {groupsData?.groupsWithoutLeaderCount > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-900 font-medium">
              <span className="flex items-center">
                <AlertCircle size={14} className="mr-1.5 text-amber-600 shrink-0" />
                {groupsData.groupsWithoutLeaderCount} group{groupsData.groupsWithoutLeaderCount > 1 ? 's' : ''} need an assigned leader
              </span>
              <Link to="/admin/discipleship/groups" className="text-amber-800 font-bold underline shrink-0">
                Review
              </Link>
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
            <span className="flex items-center text-church-navy font-medium">
              <FileText size={14} className="mr-1.5 text-indigo-600" /> Study Guides & Materials
            </span>
            <span className="font-bold text-church-navy">{groupsData?.materialsCount || 0} uploaded</span>
          </div>
        </div>
      )}
    </div>
  );
}
