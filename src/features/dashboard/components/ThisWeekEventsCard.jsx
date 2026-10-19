import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import SoftCard from '../../../components/ui/SoftCard';

export default function ThisWeekEventsCard({ events, loading }) {
  const navigate = useNavigate();

  const formatDate = (dateStr, startDateTime) => {
    const d = startDateTime ? new Date(startDateTime) : (dateStr ? new Date(dateStr + 'T00:00:00') : new Date());
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  return (
    <SoftCard className="p-6 flex flex-col h-full">
      {/* ── Header matching Mobile App Screenshot 2 ── */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-[10px] font-bold text-church-rose uppercase tracking-wider block mb-0.5">
            WHAT'S NEXT
          </span>
          <h2 className="text-lg font-black text-church-charcoal tracking-tight">Upcoming Events</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-church-muted">
            <Calendar size={36} className="mb-2 stroke-1" />
            <p className="text-sm font-semibold text-church-charcoal">No events scheduled for this week.</p>
            <p className="text-xs text-church-slate mt-0.5">Check the calendar to schedule a new gathering.</p>
          </div>
        ) : (
          events.map((event) => {
            const dateInfo = formatDate(event.date, event.startDateTime);
            const timeDisplay = (event.startTime || event.time)
              ? (event.endTime ? `${(event.startTime || event.time)} – ${event.endTime}` : (event.startTime || event.time))
              : dateInfo.time;

            return (
              <div
                key={event.id}
                onClick={() => navigate(`/admin/events/${event.id}`)}
                className="flex items-center p-3.5 border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-xs transition-all duration-150 group cursor-pointer bg-white"
              >
                {/* Date Column matching Mobile App */}
                <div className="flex flex-col items-center justify-center w-11 shrink-0 text-center">
                  <span className="text-[10px] font-bold text-church-rose uppercase tracking-wider">{dateInfo.month}</span>
                  <span className="text-xl font-black text-church-charcoal leading-none my-0.5">{dateInfo.day}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{dateInfo.weekday}</span>
                </div>

                {/* Vertical Divider */}
                <div className="h-10 w-[1px] bg-gray-100 mx-3 shrink-0" />

                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-sm font-black text-church-charcoal truncate tracking-tight group-hover:text-church-rose transition-colors">
                    {event.title}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {/* Time Pill matching Mobile App */}
                    <div className="inline-flex items-center px-2.5 py-0.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-full text-[11px] font-medium">
                      <Clock size={11} className="mr-1 text-gray-400 shrink-0" />
                      <span>{timeDisplay}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-[11px] text-gray-400 mt-1 font-medium truncate">
                    <MapPin size={11} className="mr-1 text-gray-400 shrink-0" />
                    <span className="truncate">{event.location || 'Church Sanctuary'}</span>
                  </div>
                </div>

                <div className="ml-2 shrink-0 text-gray-300 group-hover:text-church-rose group-hover:translate-x-0.5 transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Link matching Mobile App */}
      <div className="pt-3 border-t border-gray-100 text-center mt-2">
        <Link 
          to="/admin/events" 
          className="text-xs font-bold text-church-rose hover:text-church-rose-hover hover:underline inline-flex items-center gap-1 transition-colors"
        >
          <span>See all events</span>
          <span>&gt;</span>
        </Link>
      </div>
    </SoftCard>
  );
}
