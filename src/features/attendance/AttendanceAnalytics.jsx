import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Award 
} from 'lucide-react';
import SoftCard from '../../components/ui/SoftCard';
import StatusPill from '../../components/ui/StatusPill';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Hoisted static chart configurations to avoid GC churn & canvas re-initialization
const BAR_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: { family: 'inherit', size: 12, weight: 'bold' },
        color: '#475569',
        usePointStyle: true,
        boxWidth: 8,
      }
    },
    tooltip: {
      backgroundColor: '#162533',
      titleFont: { weight: 'bold' },
      padding: 10,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, weight: '600' }, color: '#64748B' }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#F1F5F9' },
      ticks: { font: { size: 11 }, color: '#94A3B8' }
    }
  }
};

const DOUGHNUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { family: 'inherit', size: 11, weight: '600' },
        color: '#475569',
        usePointStyle: true,
        padding: 14,
      }
    }
  },
  cutout: '68%',
};

export default function AttendanceAnalytics({ 
  sessions = [], 
  analyzedMembers = [],
  totalMembers = 0 
}) {
  // Sort sessions chronologically (oldest to newest for charting)
  const sortedSessions = useMemo(() => {
    return [...(sessions || [])]
      .filter(s => s.status !== 'Draft' && s.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10); // Latest 10 sessions
  }, [sessions]);

  // Bar Chart Data (Members vs Visitors)
  const barChartData = useMemo(() => {
    const labels = sortedSessions.map(s => {
      const d = new Date(s.date);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    });

    const membersData = sortedSessions.map(s => s.metrics?.present || 0);
    const visitorsData = sortedSessions.map(s => s.metrics?.visitors || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Members',
          data: membersData,
          backgroundColor: '#2C4A60',
          borderRadius: 6,
        },
        {
          label: 'Visitors',
          data: visitorsData,
          backgroundColor: '#10B981',
          borderRadius: 6,
        }
      ]
    };
  }, [sortedSessions]);

  // Engagement Tier Distribution Doughnut
  const doughnutData = useMemo(() => {
    let faithful = 0;
    let consistent = 0;
    let irregular = 0;
    let atRisk = 0;

    analyzedMembers.forEach(m => {
      if (m.riskTier === 'critical' || m.riskTier === 'warning') atRisk++;
      else if (m.attendanceRate >= 80) faithful++;
      else if (m.attendanceRate >= 50) consistent++;
      else irregular++;
    });

    return {
      labels: ['Faithful (80%+)', 'Consistent (50-79%)', 'Irregular (<50%)', 'At-Risk (2+ Missed)'],
      datasets: [
        {
          data: [faithful, consistent, irregular, atRisk],
          backgroundColor: ['#2C4A60', '#3B82F6', '#F59E0B', '#EF4444'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }
      ]
    };
  }, [analyzedMembers]);

  // High-level averages
  const averageAttendance = useMemo(() => {
    if (!sortedSessions.length) return 0;
    const total = sortedSessions.reduce((acc, s) => acc + (s.metrics?.present || 0) + (s.metrics?.visitors || 0), 0);
    return Math.round(total / sortedSessions.length);
  }, [sortedSessions]);

  const averageVisitors = useMemo(() => {
    if (!sortedSessions.length) return 0;
    const total = sortedSessions.reduce((acc, s) => acc + (s.metrics?.visitors || 0), 0);
    return Math.round(total / sortedSessions.length);
  }, [sortedSessions]);

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SoftCard className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Average Turnout
              </span>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{averageAttendance}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Per worship gathering</p>
            </div>
            <div className="p-3 bg-[#EBF2F7] text-[#2C4A60] rounded-2xl border border-[#D5E3EC]">
              <TrendingUp size={22} />
            </div>
          </div>
        </SoftCard>

        <SoftCard className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Avg. Weekly Visitors
              </span>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{averageVisitors}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Newcomers & guests</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Users size={22} />
            </div>
          </div>
        </SoftCard>

        <SoftCard className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Active Member Roster
              </span>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{totalMembers}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Enrolled church flock</p>
            </div>
            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100">
              <Award size={22} />
            </div>
          </div>
        </SoftCard>
      </div>

      {/* ── Visual Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Recent Attendance Trends (2 Columns) */}
        <SoftCard className="p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Weekly Attendance Velocity</h3>
                <p className="text-xs text-slate-500">Member vs visitor headcount over the last 10 services</p>
              </div>
              <StatusPill variant="steel">Last 10 Services</StatusPill>
            </div>

            <div className="h-64 sm:h-72 w-full mt-2">
              {sortedSessions.length > 0 ? (
                <Bar data={barChartData} options={BAR_CHART_OPTIONS} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Insufficient session history to plot velocity.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dark: Active Members</span>
            <span>Emerald: Visitors & Guests</span>
          </div>
        </SoftCard>

        {/* Doughnut Chart: Engagement Tiers (1 Column) */}
        <SoftCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Engagement Health</h3>
              <p className="text-xs text-slate-500">Congregational attendance consistency</p>
            </div>

            <div className="h-56 sm:h-64 w-full relative flex items-center justify-center">
              {analyzedMembers.length > 0 ? (
                <Doughnut data={doughnutData} options={DOUGHNUT_OPTIONS} />
              ) : (
                <div className="text-xs text-slate-400">No member data to display.</div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-3">
            Based on active roll presence over evaluated Sunday services.
          </p>
        </SoftCard>
      </div>
    </div>
  );
}
