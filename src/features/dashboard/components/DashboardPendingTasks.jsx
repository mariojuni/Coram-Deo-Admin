import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { 
  canViewFinanceDashboard, 
  canViewPrayerDashboard, 
  canViewMinistryDashboard, 
  canViewGroupsDashboard 
} from '../../../utils/dashboardPermissions';
import SoftCard from '../../../components/ui/SoftCard';
import StatusPill from '../../../components/ui/StatusPill';

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
      description: 'Donations awaiting manual receipt check',
      path: '/admin/finance/giving',
      badgeColor: 'bg-amber-100 text-church-amber border-amber-200',
    });
  }

  if (showMinistry && counts.pendingApplications > 0) {
    tasks.push({
      id: 'applications',
      title: 'Volunteer Applications',
      count: counts.pendingApplications,
      description: 'Team signups waiting for leader review',
      path: '/admin/ministries/applications',
      badgeColor: 'bg-purple-100 text-church-violet border-purple-200',
    });
  }

  if (showPrayer && counts.pendingPrayers > 0) {
    tasks.push({
      id: 'prayers',
      title: 'Prayer Wall Moderation',
      count: counts.pendingPrayers,
      description: 'Member prayer requests needing approval',
      path: '/admin/prayer',
      badgeColor: 'bg-pink-100 text-church-rose border-pink-200',
    });
  }

  if (showMinistry && counts.missingAssignments > 0) {
    tasks.push({
      id: 'assignments',
      title: 'Missing Roster Assignments',
      count: counts.missingAssignments,
      description: 'Services without full serving team',
      path: '/admin/schedules',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    });
  }

  if (showGroups && counts.groupsWithoutLeader > 0) {
    tasks.push({
      id: 'groups_no_leader',
      title: 'Groups Missing Leader',
      count: counts.groupsWithoutLeader,
      description: 'Discipleship groups without assigned leader',
      path: '/admin/discipleship/groups',
      badgeColor: 'bg-amber-100 text-church-amber border-amber-200',
    });
  }

  if (counts.unpublishedSermons > 0) {
    tasks.push({
      id: 'sermons_draft',
      title: 'Draft / Unpublished Sermons',
      count: counts.unpublishedSermons,
      description: 'Sermon notes or audio pending publication',
      path: '/admin/sermons',
      badgeColor: 'bg-emerald-100 text-church-emerald border-emerald-200',
    });
  }

  const totalPending = tasks.reduce((acc, t) => acc + t.count, 0);

  return (
    <SoftCard className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-church-amber" />
            <span className="text-[10px] font-bold text-church-amber uppercase tracking-wider">Action Radar</span>
          </div>
          <h2 className="text-base md:text-lg font-black text-church-charcoal tracking-tight">Pending Tasks</h2>
          <p className="text-xs text-church-slate">Operational action items needing attention</p>
        </div>

        {totalPending > 0 && (
          <StatusPill variant="amber">
            {totalPending} Action Items
          </StatusPill>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-church-muted">
            <CheckCircle2 size={36} className="mb-2 stroke-1 text-church-emerald" />
            <p className="text-sm font-bold text-church-charcoal">All clear!</p>
            <p className="text-xs text-church-slate mt-0.5">No pending items or moderation needed right now.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Link
              key={task.id}
              to={task.path}
              className="flex items-center justify-between p-3.5 border border-gray-100/90 rounded-2xl hover:bg-gray-50/70 transition-all duration-150 group"
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 border ${task.badgeColor}`}>
                  {task.count}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs md:text-sm font-bold text-church-charcoal truncate group-hover:text-church-rose transition-colors">
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-church-slate truncate mt-0.5">{task.description}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-church-muted group-hover:text-church-rose group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))
        )}
      </div>
    </SoftCard>
  );
}
