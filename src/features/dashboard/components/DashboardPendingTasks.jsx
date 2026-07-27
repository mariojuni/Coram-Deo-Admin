import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { 
  canViewFinanceDashboard, 
  canViewPrayerDashboard, 
  canViewMinistryDashboard, 
  canViewGroupsDashboard 
} from '../../../utils/dashboardPermissions';

export default function DashboardPendingTasks({ counts, loading, userProfile }) {
  const showFinance = canViewFinanceDashboard(userProfile);
  const showPrayer = canViewPrayerDashboard(userProfile);
  const showMinistry = canViewMinistryDashboard(userProfile);
  const showGroups = canViewGroupsDashboard(userProfile);

  const tasks = [];

  if (showFinance && counts.pendingGiving > 0) {
    tasks.push({
      id: 'giving',
      title: 'Pending Giving Verification',
      count: counts.pendingGiving,
      description: 'Donations awaiting manual receipt verification',
      path: '/admin/finance/giving',
      badgeColor: 'bg-amber-100 text-amber-800',
    });
  }

  if (showMinistry && counts.pendingApplications > 0) {
    tasks.push({
      id: 'applications',
      title: 'Pending Ministry Applications',
      count: counts.pendingApplications,
      description: 'Volunteer team signups waiting for review',
      path: '/admin/ministries/applications',
      badgeColor: 'bg-purple-100 text-purple-800',
    });
  }

  if (showPrayer && counts.pendingPrayers > 0) {
    tasks.push({
      id: 'prayers',
      title: 'Pending Prayer Requests',
      count: counts.pendingPrayers,
      description: 'Prayer wall requests requiring moderation',
      path: '/admin/prayer',
      badgeColor: 'bg-rose-100 text-rose-800',
    });
  }

  if (showMinistry && counts.missingAssignments > 0) {
    tasks.push({
      id: 'assignments',
      title: 'Events Missing Roster Assignments',
      count: counts.missingAssignments,
      description: 'Upcoming events without full serving team assigned',
      path: '/admin/schedules',
      badgeColor: 'bg-blue-100 text-blue-800',
    });
  }

  if (showGroups && counts.groupsWithoutLeader > 0) {
    tasks.push({
      id: 'groups_no_leader',
      title: 'Groups Missing Leader',
      count: counts.groupsWithoutLeader,
      description: 'Discipleship small groups without assigned leader',
      path: '/admin/discipleship/groups',
      badgeColor: 'bg-orange-100 text-orange-800',
    });
  }

  if (counts.unpublishedSermons > 0) {
    tasks.push({
      id: 'sermons_draft',
      title: 'Draft / Unpublished Sermons',
      count: counts.unpublishedSermons,
      description: 'Sermon notes or recordings pending publication',
      path: '/admin/sermons',
      badgeColor: 'bg-teal-100 text-teal-800',
    });
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-church-navy">Pending Tasks</h2>
          <p className="text-xs text-church-slate">Operational action items needing attention</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <CheckCircle2 size={36} className="mb-2 stroke-1 text-church-green" />
            <p className="text-sm font-medium text-church-navy">All clear!</p>
            <p className="text-xs text-church-slate">No pending tasks or moderation needed right now.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Link
              key={task.id}
              to={task.path}
              className="flex items-center justify-between p-3.5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${task.badgeColor}`}>
                  {task.count}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-church-navy truncate">{task.title}</h4>
                  <p className="text-xs text-church-slate truncate">{task.description}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-church-navy transition-colors shrink-0" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
