import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Clock, AlertTriangle } from 'lucide-react';
import { canViewMinistryDashboard } from '../../../utils/dashboardPermissions';

export default function ServeOverviewCard({ serveData, loading, userProfile }) {
  if (!canViewMinistryDashboard(userProfile)) return null;

  const isLeader = userProfile?.systemRoles?.includes('ministry_leader') && !userProfile?.systemRoles?.includes('church_admin');

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-church-navy">
            {isLeader ? 'My Ministry Roster' : 'Serve & Ministry Overview'}
          </h2>
          <p className="text-xs text-church-slate">Upcoming roster assignments & applications</p>
        </div>
        <Link to="/admin/schedules" className="text-xs font-bold text-church-green hover:underline">
          View Schedules
        </Link>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-4 flex-1">
          {/* Top Metric Strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold uppercase text-blue-700">Assignments This Week</span>
              <p className="text-xl font-bold text-church-navy mt-0.5">{serveData?.assignmentsThisWeekCount || 0}</p>
            </div>
            <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100">
              <span className="text-[10px] font-bold uppercase text-purple-700">Pending Applications</span>
              <p className="text-xl font-bold text-church-navy mt-0.5">{serveData?.pendingApplicationsCount || 0}</p>
            </div>
          </div>

          {/* Missing Assignments Warning */}
          {serveData?.missingAssignmentsCount > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-900 font-medium">
              <span className="flex items-center">
                <AlertTriangle size={14} className="mr-1.5 text-amber-600 shrink-0" />
                {serveData.missingAssignmentsCount} upcoming event{serveData.missingAssignmentsCount > 1 ? 's' : ''} have open roster slots
              </span>
              <Link to="/admin/schedules" className="text-amber-800 font-bold underline shrink-0">
                Assign
              </Link>
            </div>
          )}

          {/* Recent Serve Roster Items */}
          <div className="flex-1 overflow-y-auto space-y-2">
            <p className="text-xs font-bold text-church-navy mb-1">Upcoming Serve Roster</p>
            {!serveData?.upcomingAssignments || serveData.upcomingAssignments.length === 0 ? (
              <p className="text-xs text-church-slate py-2">No serve assignments scheduled for this week.</p>
            ) : (
              serveData.upcomingAssignments.slice(0, 3).map((item) => (
                <div key={item.id} className="p-2.5 border border-gray-100 rounded-xl flex justify-between items-center text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-church-navy truncate">{item.memberName || item.userName || 'Assigned Server'}</p>
                    <p className="text-gray-400 truncate">{item.role || item.servingRole || 'Volunteer'} • {item.ministryName || 'Ministry'}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                    {item.status || 'Scheduled'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
