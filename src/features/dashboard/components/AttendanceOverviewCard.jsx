import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import SoftCard from '../../../components/ui/SoftCard';

export default function AttendanceOverviewCard({ attendanceData, loading }) {
  const hasData = attendanceData && (attendanceData.totalThisMonth > 0 || (attendanceData.sessionsCount && attendanceData.sessionsCount > 0));
  const currentMonthLabel = attendanceData?.monthName || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <SoftCard className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base md:text-lg font-black text-church-charcoal tracking-tight">Attendance Overview</h2>
          <p className="text-xs text-church-slate">{currentMonthLabel} check-ins and service metrics</p>
        </div>
        <Link to="/admin/attendance" className="text-xs font-bold text-[#2C4A60] hover:text-[#1D3547] hover:underline">
          Take Roll
        </Link>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ) : !hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-gray-400">
          <ClipboardCheck size={36} className="mb-2 stroke-1 text-slate-300" />
          <p className="text-sm font-bold text-church-charcoal">No attendance data yet for {currentMonthLabel}.</p>
          <p className="text-xs text-church-slate mt-1">Start taking attendance during weekly events.</p>
          <Link
            to="/admin/attendance"
            className="mt-3 text-xs font-bold text-white bg-[#162533] hover:bg-[#1D3547] px-3.5 py-1.5 rounded-full transition-all shadow-xs"
          >
            Record Attendance
          </Link>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          <div className="p-4 bg-gradient-to-br from-white/90 to-[#EBF2F7]/60 border border-white/95 rounded-2xl flex justify-between items-center shadow-2xs">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-[#4F748E] tracking-wider">This Month Total</p>
              <h3 className="text-2xl font-black text-church-charcoal mt-0.5">{attendanceData.totalThisMonth}</h3>
              {attendanceData.sessionsCount > 0 && (
                <p className="text-[11px] text-[#2C4A60] font-medium mt-0.5">
                  Across {attendanceData.sessionsCount} session{attendanceData.sessionsCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="p-3 bg-white/80 text-[#2C4A60] rounded-xl border border-white/90 shadow-2xs">
              <ClipboardCheck size={22} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white/70 border border-white/95 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-church-slate">Worship Services</span>
              <p className="text-lg font-black text-church-charcoal mt-1">
                {attendanceData.worshipAvg || 0} <span className="text-xs font-normal text-slate-400">avg</span>
              </p>
            </div>
            <div className="p-3.5 bg-white/70 border border-white/95 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-church-slate">Bible Study / Groups</span>
              <p className="text-lg font-black text-church-charcoal mt-1">
                {attendanceData.groupsAvg || 0} <span className="text-xs font-normal text-slate-400">avg</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </SoftCard>
  );
}
