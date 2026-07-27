import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export default function ThisWeekEventsCard({ events, loading }) {
  const formatDate = (dateStr, startDateTime) => {
    const d = startDateTime ? new Date(startDateTime) : (dateStr ? new Date(dateStr + 'T00:00:00') : new Date());
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      day: d.getDate(),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-church-navy">This Week's Events</h2>
          <p className="text-xs text-church-slate">Published scheduled services & gatherings</p>
        </div>
        <Link to="/admin/events" className="text-xs font-bold text-church-green hover:underline">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <Calendar size={36} className="mb-2 stroke-1" />
            <p className="text-sm font-medium">No events scheduled for this week.</p>
          </div>
        ) : (
          events.map((event) => {
            const dateInfo = formatDate(event.date, event.startDateTime);
            return (
              <div
                key={event.id}
                className="flex items-center p-3.5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-church-green/10 flex flex-col items-center justify-center shrink-0 mr-3">
                  <span className="text-[10px] font-bold text-church-green uppercase">{dateInfo.month}</span>
                  <span className="text-base font-bold text-church-navy leading-none">{dateInfo.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-church-navy truncate">{event.title}</h4>
                    {event.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold shrink-0">
                        {event.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-church-slate mt-1 space-x-3 truncate">
                    <span className="flex items-center shrink-0">
                      <Clock size={12} className="mr-1" /> {event.time || dateInfo.time}
                    </span>
                    <span className="flex items-center truncate">
                      <MapPin size={12} className="mr-1 shrink-0" /> {event.location || 'Campus'}
                    </span>
                  </div>
                </div>
                <div className="ml-2 flex flex-col items-end shrink-0">
                  {event.attendanceEnabled && (
                    <span className="text-[10px] bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded-md flex items-center mb-1">
                      <CheckCircle size={10} className="mr-1" /> Roll
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
