import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, BarChart3, Users, BookOpen } from 'lucide-react';

export default function AttendanceOverviewCard({ attendanceData, loading }) {
  const hasData = attendanceData && attendanceData.totalThisMonth > 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-church-navy">Attendance Overview</h2>
          <p className="text-xs text-church-slate">Monthly check-ins and service metrics</p>
        </div>
        <Link to="/admin/attendance" className="text-xs font-bold text-church-green hover:underline">
          Take Roll
        </Link>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ) : !hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-gray-400">
          <ClipboardCheck size={36} className="mb-2 stroke-1" />
          <p className="text-sm font-medium text-church-navy">No attendance data yet for this month.</p>
          <p className="text-xs text-church-slate mt-1">Start taking attendance during weekly events.</p>
          <Link
            to="/admin/attendance"
            className="mt-3 text-xs font-bold text-white bg-church-green px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Record Attendance
          </Link>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          <div className="p-4 bg-purple-50 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase text-purple-700 tracking-wider">This Month Total</p>
              <h3 className="text-2xl font-bold text-church-navy mt-0.5">{attendanceData.totalThisMonth}</h3>
            </div>
            <div className="p-3 bg-white text-purple-600 rounded-xl shadow-sm">
              <ClipboardCheck size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 border border-gray-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-church-slate">Worship Services</span>
              <p className="text-lg font-bold text-church-navy mt-1">
                {attendanceData.worshipAvg || 0} <span className="text-xs font-normal text-gray-400">avg</span>
              </p>
            </div>
            <div className="p-3.5 border border-gray-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-church-slate">Bible Study / Small Groups</span>
              <p className="text-lg font-bold text-church-navy mt-1">
                {attendanceData.groupsAvg || 0} <span className="text-xs font-normal text-gray-400">avg</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
