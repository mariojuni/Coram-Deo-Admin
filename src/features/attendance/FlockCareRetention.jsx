import React, { useState, useMemo } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Clock, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  HeartHandshake, 
  CheckCircle2, 
  UserCheck, 
  Download, 
  ChevronRight,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import SoftCard from '../../components/ui/SoftCard';
import StatusPill from '../../components/ui/StatusPill';
import GradientButton from '../../components/ui/GradientButton';
import PastoralTouchModal from './PastoralTouchModal';

export default function FlockCareRetention({ 
  analyzedMembers = [], 
  metrics = {}, 
  loading = false,
  onRefresh
}) {
  const [filterTab, setFilterTab] = useState('at_risk'); // 'at_risk' | 'critical' | 'warning' | 'irregular' | 'visitors' | 'in_progress' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('absences_desc'); // 'absences_desc' | 'rate_asc' | 'name_asc'
  const [selectedMemberForCare, setSelectedMemberForCare] = useState(null);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    return analyzedMembers
      .filter(m => {
        // Tab filters
        if (filterTab === 'at_risk') return m.riskTier === 'critical' || m.riskTier === 'warning';
        if (filterTab === 'critical') return m.riskTier === 'critical';
        if (filterTab === 'warning') return m.riskTier === 'warning';
        if (filterTab === 'irregular') return m.riskTier === 'irregular';
        if (filterTab === 'visitors') return m.isVisitor;
        if (filterTab === 'in_progress') return m.followupStatus === 'in_conversation' || m.followupStatus === 'needs_contact';
        return true;
      })
      .filter(m => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          m.fullName.toLowerCase().includes(q) ||
          m.phone?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.householdName?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'absences_desc') {
          return b.consecutiveAbsences - a.consecutiveAbsences || a.attendanceRate - b.attendanceRate;
        }
        if (sortBy === 'rate_asc') {
          return a.attendanceRate - b.attendanceRate;
        }
        if (sortBy === 'name_asc') {
          return a.fullName.localeCompare(b.fullName);
        }
        return 0;
      });
  }, [analyzedMembers, filterTab, searchTerm, sortBy]);

  // Export CSV for pastoral meetings
  const handleExportCSV = () => {
    if (!filteredMembers.length) return;
    const headers = ['Full Name', 'Membership Status', 'Household', 'Phone', 'Email', 'Consecutive Absent Weeks', 'Weekly Attendance Rate', 'Last Attended Date', 'Followup Status', 'Assigned To'];
    const rows = filteredMembers.map(m => [
      `"${m.fullName}"`,
      `"${m.membershipStatus}"`,
      `"${m.householdName || 'None'}"`,
      `"${m.phone || 'N/A'}"`,
      `"${m.email || 'N/A'}"`,
      m.consecutiveAbsentWeeks || m.consecutiveAbsences,
      `${m.attendanceRate}%`,
      `"${m.lastAttendedDate || 'Unrecorded'}"`,
      `"${m.followupStatus}"`,
      `"${m.assignedTo || 'Unassigned'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CoramDeo_Flock_Care_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Absences Card */}
        <SoftCard className="p-5 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-rose-600 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Critical Attention
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {metrics.criticalCount || 0}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Missed 3+ consecutive weeks</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs">
            <ShieldAlert size={24} />
          </div>
        </SoftCard>

        {/* Warning Card */}
        <SoftCard className="p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider">
              Concerning Pattern
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {metrics.warningCount || 0}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Missed last 2 consecutive weeks</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs">
            <AlertTriangle size={24} />
          </div>
        </SoftCard>

        {/* Retention Rate Card */}
        <SoftCard className="p-5 flex items-center justify-between border-l-4 border-l-[#2C4A60]">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#2C4A60] tracking-wider">
              Flock Retention Index
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {metrics.averageAttendanceRate || 0}%
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Weekly consistency score</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EBF2F7] text-[#2C4A60] flex items-center justify-center border border-[#D5E3EC] shadow-2xs">
            <UserCheck size={24} />
          </div>
        </SoftCard>

        {/* Active Care Touches Card */}
        <SoftCard className="p-5 flex items-center justify-between border-l-4 border-l-emerald-600">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">
              Pending Outreach
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {metrics.activeFollowupsCount || 0}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Flock members in care queue</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <HeartHandshake size={24} />
          </div>
        </SoftCard>
      </div>

      {/* ── Filter & Search Bar ── */}
      <SoftCard className="p-4 space-y-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'at_risk', label: 'All At-Risk', count: (metrics.criticalCount || 0) + (metrics.warningCount || 0) },
              { id: 'critical', label: '🔴 3+ Weeks Absent', count: metrics.criticalCount || 0 },
              { id: 'warning', label: '🟡 2 Weeks Absent', count: metrics.warningCount || 0 },
              { id: 'irregular', label: '🔵 Irregular (<50%)', count: metrics.irregularCount || 0 },
              { id: 'visitors', label: '🟣 Visitors', count: metrics.visitorsCount || 0 },
              { id: 'in_progress', label: '📋 In Care Queue', count: metrics.activeFollowupsCount || 0 },
              { id: 'all', label: '👥 Entire Roster', count: metrics.totalMembers || 0 },
            ].map(tab => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    active 
                      ? 'bg-[#162533] text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    active ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!filteredMembers.length}
            className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search member, phone, or household..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown size={12} />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="absences_desc">Most Consecutive Absences</option>
              <option value="rate_asc">Lowest Attendance Rate</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </SoftCard>

      {/* ── Members Care List ── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold animate-pulse text-sm">
          Analyzing flock attendance retention...
        </div>
      ) : filteredMembers.length === 0 ? (
        <SoftCard className="p-16 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-800">No members match this care criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {filterTab === 'at_risk' || filterTab === 'critical'
              ? 'Praise God! No members currently meet the consecutive absence threshold for this filter.'
              : 'Try clearing your search query or switching to another filter tab.'}
          </p>
        </SoftCard>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((record) => {
            const isCritical = record.riskTier === 'critical';
            const isWarning = record.riskTier === 'warning';

            return (
              <SoftCard 
                key={record.memberId}
                className={`p-5 transition-all hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 border ${
                  isCritical 
                    ? 'border-rose-200/80 bg-rose-50/20' 
                    : isWarning 
                    ? 'border-amber-200/80 bg-amber-50/20' 
                    : 'border-white/95'
                }`}
              >
                {/* Left: Member Identity & Status */}
                <div className="flex items-start sm:items-center space-x-3.5 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                    isCritical 
                      ? 'bg-rose-100 text-rose-700 border-rose-200' 
                      : isWarning 
                      ? 'bg-amber-100 text-amber-700 border-amber-200' 
                      : 'bg-[#EBF2F7] text-[#2C4A60] border-[#D5E3EC]'
                  }`}>
                    {record.fullName.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{record.fullName}</h4>
                      <StatusPill variant={record.membershipStatus === 'Active' ? 'steel' : 'slate'}>
                        {record.membershipStatus}
                      </StatusPill>
                      {record.householdName && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          &bull; {record.householdName}
                        </span>
                      )}
                    </div>

                    {/* Contact row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {record.phone && (
                        <a href={`tel:${record.phone}`} className="hover:text-[#2C4A60] font-medium flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          <span>{record.phone}</span>
                        </a>
                      )}
                      {record.email && (
                        <a href={`mailto:${record.email}`} className="hover:text-[#2C4A60] font-medium flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" />
                          <span>{record.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Attendance Metrics & Streaks */}
                <div className="flex flex-col gap-2 py-2 px-3.5 bg-white/70 rounded-xl border border-slate-100 text-xs shrink-0 lg:w-[420px]">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Consecutive Absent Weeks */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consecutive</span>
                      <span className={`font-black text-xs ${
                        isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {record.consecutiveAbsentWeeks > 0 ? `${record.consecutiveAbsentWeeks} wks absent` : 'Active this week'}
                      </span>
                    </div>

                    {/* Weekly Rate */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Rate</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-10 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              record.attendanceRate >= 70 ? 'bg-emerald-500' : record.attendanceRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(5, record.attendanceRate)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{record.attendanceRate}%</span>
                      </div>
                    </div>

                    {/* Last Seen */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Gathering</span>
                      <span className="font-semibold text-slate-700 truncate block text-[11px]" title={record.lastAttendedEvent || ''}>
                        {record.lastAttendedDate ? new Date(record.lastAttendedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Past Weeks Presence Dots */}
                  {record.weeklyBreakdown && record.weeklyBreakdown.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-medium">Recent {record.weeklyBreakdown.length} weeks (any event):</span>
                      <div className="flex items-center gap-1.5">
                        {record.weeklyBreakdown.map((w, idx) => (
                          <div
                            key={w.weekKey || idx}
                            title={`${w.weekLabel}: ${w.attended ? `Attended (${w.eventsAttended.join(', ')})` : w.excused ? 'Excused' : 'Absent'}`}
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black cursor-help transition-transform hover:scale-125 ${
                              w.attended 
                                ? 'bg-emerald-500 text-white shadow-2xs' 
                                : w.excused 
                                ? 'bg-amber-300 text-amber-900' 
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {w.attended ? '✓' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Care Status & Action Button */}
                <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left lg:text-right">
                    <StatusPill variant={
                      record.followupStatus === 'resolved' ? 'emerald' :
                      record.followupStatus === 'in_conversation' ? 'steel' :
                      isCritical ? 'rose' : 'amber'
                    }>
                      {record.followupStatus === 'resolved' ? 'Resolved' :
                       record.followupStatus === 'in_conversation' ? 'In Conversation' :
                       record.followupStatus === 'excused' ? 'Excused' : 'Needs Outreach'}
                    </StatusPill>
                    {record.touches && record.touches.length > 0 && (
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        {record.touches.length} touchpoint{record.touches.length > 1 ? 's' : ''} logged
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedMemberForCare(record)}
                    className="px-4 py-2 bg-[#162533] hover:bg-[#1E2E3D] text-white text-xs font-bold rounded-full transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <HeartHandshake size={14} />
                    <span>Log Touch</span>
                  </button>
                </div>
              </SoftCard>
            );
          })}
        </div>
      )}

      {/* Pastoral Touch Modal */}
      {selectedMemberForCare && (
        <PastoralTouchModal
          isOpen={Boolean(selectedMemberForCare)}
          onClose={() => setSelectedMemberForCare(null)}
          memberRecord={selectedMemberForCare}
          onSaveSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
