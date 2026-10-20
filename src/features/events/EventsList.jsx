import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Calendar as CalendarIcon, CalendarPlus, Edit, Trash2, MapPin, Clock, MoreVertical, CheckCircle2, ChevronRight, Bell } from 'lucide-react';
import EventFormModal from './EventFormModal';
import { useNavigate } from 'react-router-dom';
import { canManageEvents } from '../../utils/permissions';
import GenerateMonthlyEventsModal from './GenerateMonthlyEventsModal';
import ModernDropdown from '../../components/ui/ModernDropdown';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function EventsList() {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'all'
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const canManage = canManageEvents(userProfile);

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Action menu state
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (!CHURCH_ID) return;
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Multi-tenant filter
      docs = docs.filter(d => d.churchId === CHURCH_ID || (!d.churchId && !CHURCH_ID));
      // Sort in memory by date
      docs.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      setEvents(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [CHURCH_ID]);

  const handleAddClick = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (e, event) => {
    e.stopPropagation();
    setEditingEvent(event);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDeleteClick = async (id, title) => {
    setActiveMenuId(null);
    if (window.confirm(`Are you sure you want to delete the event "${title}"?`)) {
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete event.");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEvents.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedEvents.length} selected events?`)) {
      try {
        const batch = writeBatch(db);
        selectedEvents.forEach(id => {
          batch.delete(doc(db, 'events', id));
        });
        await batch.commit();
        setSelectedEvents([]);
        setIsSelectionMode(false);
      } catch (error) {
        console.error("Error deleting documents: ", error);
        alert("Failed to delete selected events.");
      }
    }
  };

  const handleBulkComplete = async () => {
    if (selectedEvents.length === 0) return;
    if (window.confirm(`Are you sure you want to mark ${selectedEvents.length} selected events as completed?`)) {
      try {
        const batch = writeBatch(db);
        selectedEvents.forEach(id => {
          const docRef = doc(db, 'events', id);
          batch.update(docRef, { status: 'completed' });
        });
        await batch.commit();
        setSelectedEvents([]);
        setIsSelectionMode(false);
      } catch (error) {
        console.error("Error completing documents: ", error);
        alert("Failed to complete selected events.");
      }
    }
  };

  const handleCompleteEvent = async (id) => {
    setActiveMenuId(null);
    try {
      const docRef = doc(db, 'events', id);
      const batch = writeBatch(db);
      batch.update(docRef, { status: 'completed' });
      await batch.commit();
    } catch (error) {
      console.error("Error completing event: ", error);
      alert("Failed to complete event.");
    }
  };
  
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedEvents([]);
    setActiveMenuId(null);
  };

  const toggleEventSelect = (e, id) => {
    e.stopPropagation();
    if (selectedEvents.includes(id)) {
      setSelectedEvents(selectedEvents.filter(eventId => eventId !== id));
    } else {
      setSelectedEvents([...selectedEvents, id]);
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const upcomingCount = events.filter(e => {
    const isCompleted = e.status?.toLowerCase() === 'completed';
    if (isCompleted) return false;
    return !e.date || e.date >= todayStr;
  }).length;

  const completedCount = events.filter(e => {
    const isCompleted = e.status?.toLowerCase() === 'completed';
    return isCompleted || (e.date && e.date < todayStr);
  }).length;

  const filteredEvents = events.filter(event => {
    const isCompleted = event.status?.toLowerCase() === 'completed' || (event.date && event.date < todayStr);
    
    if (activeTab === 'upcoming' && isCompleted) return false;
    if (activeTab === 'completed' && !isCompleted) return false;

    if (!event.date) return activeTab !== 'completed';
    const [y, m] = event.date.split('-');
    
    const yearMatch = filterYear === 'all' || y === filterYear;
    const monthMatch = filterMonth === 'all' || parseInt(m, 10) - 1 === parseInt(filterMonth, 10);
    
    return yearMatch && monthMatch;
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <StatusPill variant="rose" dot className="mb-2">
            Church Gatherings & Services
          </StatusPill>
          <h1 className="text-3xl font-black text-church-charcoal tracking-tight">Events</h1>
          <p className="text-sm text-church-slate mt-1">Manage upcoming worship gatherings, services, and special events.</p>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2.5 items-center justify-start md:justify-end">
            {isSelectionMode ? (
              <>
                <button 
                  onClick={handleBulkComplete}
                  disabled={selectedEvents.length === 0}
                  className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50 border border-emerald-200"
                >
                  <CheckCircle2 size={15} className="mr-1.5" />
                  Mark Completed ({selectedEvents.length})
                </button>
                <button 
                  onClick={handleBulkDelete}
                  disabled={selectedEvents.length === 0}
                  className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
                >
                  <Trash2 size={15} className="mr-1.5" />
                  Delete ({selectedEvents.length})
                </button>
                <button 
                  onClick={toggleSelectionMode}
                  className="flex items-center px-4 py-2 bg-white border border-gray-200 text-church-charcoal rounded-full text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {events.length > 0 && (
                  <button 
                    onClick={toggleSelectionMode}
                    className="flex items-center px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-church-charcoal rounded-full text-xs font-bold shadow-sm transition-all hover:bg-gray-50"
                  >
                    Select
                  </button>
                )}
                <button 
                  onClick={() => setIsGeneratorOpen(true)}
                  className="flex items-center px-4 py-2 bg-white border border-gray-200 hover:border-church-rose/40 hover:bg-pink-50/30 text-church-charcoal rounded-full text-xs font-bold shadow-sm transition-all hidden sm:flex"
                >
                  <CalendarIcon size={14} className="mr-1.5 text-church-rose" />
                  Generate
                </button>
                <button 
                  onClick={handleAddClick}
                  title="Create New Event"
                  className="w-10 h-10 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-center text-church-rose hover:bg-pink-50 transition-colors"
                >
                  <CalendarPlus size={20} />
                </button>
                <GradientButton
                  onClick={handleAddClick}
                  icon={Plus}
                  size="md"
                  className="shadow-church-glow"
                >
                  Create Event
                </GradientButton>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Segmented Control Pills (Exact Mobile App Styling) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm ${
              activeTab === 'upcoming'
                ? 'bg-church-rose text-white'
                : 'bg-white border border-gray-200 text-church-slate hover:bg-gray-50'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm ${
              activeTab === 'completed'
                ? 'bg-church-rose text-white'
                : 'bg-white border border-gray-200 text-church-slate hover:bg-gray-50'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-church-rose text-white shadow-sm'
                : 'bg-white border border-gray-200 text-church-slate hover:bg-gray-50'
            }`}
          >
            All ({events.length})
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center space-x-2">
          <div className="w-36">
            <ModernDropdown
              value={filterMonth}
              onChange={setFilterMonth}
              options={[
                { value: 'all', label: 'All Months' },
                ...MONTHS.map((m, i) => ({ value: String(i), label: m }))
              ]}
            />
          </div>
          <div className="w-28">
            <ModernDropdown
              value={filterYear}
              onChange={setFilterYear}
              options={[
                { value: 'all', label: 'All Years' },
                { value: String(new Date().getFullYear() - 1), label: String(new Date().getFullYear() - 1) },
                { value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) },
                { value: String(new Date().getFullYear() + 1), label: String(new Date().getFullYear() + 1) }
              ]}
            />
          </div>
        </div>
      </div>
      
      {/* ── Events Grid / Empty State ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <p className="text-church-slate text-sm font-semibold animate-pulse">Loading church events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <SoftCard className="p-12 flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-16 h-16 bg-pink-50 text-church-rose rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-pink-100">
            <CalendarIcon size={28} />
          </div>
          <h3 className="text-xl font-black text-church-charcoal mb-1">No events found</h3>
          <p className="text-church-slate text-sm max-w-sm mb-6">No scheduled events match your selected view. Add a new service or generate scheduled monthly events.</p>
          {canManage && (
            <GradientButton onClick={handleAddClick} icon={Plus} size="sm">
              Create First Event
            </GradientButton>
          )}
        </SoftCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredEvents.map(event => {
            const dateObj = event.date ? new Date(event.date + 'T00:00:00') : null;
            const monthStr = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
            const dayStr = dateObj ? String(dateObj.getDate()) : '--';
            const dayOfWeekStr = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : '';
            const isCancelled = event.status?.toLowerCase() === 'cancelled';
            const isCompleted = event.status?.toLowerCase() === 'completed' || (event.date && event.date < todayStr);
            const isPublished = event.status?.toLowerCase() === 'published';
            const isDraft = !event.status || event.status?.toLowerCase() === 'draft';
            const timeDisplay = (event.startTime || event.time) 
              ? (event.endTime ? `${(event.startTime || event.time)} - ${event.endTime}` : (event.startTime || event.time)) 
              : 'TBD';

            return (
              <div 
                key={event.id} 
                onClick={(e) => isSelectionMode ? toggleEventSelect(e, event.id) : navigate(`/admin/events/${event.id}`)}
                className={`bg-white rounded-3xl p-5 border border-gray-100/90 shadow-church-soft hover:shadow-church-elevated hover:border-gray-200 transition-all flex items-center relative cursor-pointer group ${
                  selectedEvents.includes(event.id) ? 'ring-2 ring-church-rose bg-pink-50/20' : ''
                }`}
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <div className="mr-3.5 shrink-0">
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      selectedEvents.includes(event.id) ? 'bg-church-rose border-church-rose text-white' : 'border-gray-300 bg-white'
                    }`}>
                      {selectedEvents.includes(event.id) && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </div>
                )}
                
                {/* Mobile-aligned Date Column */}
                <div className="flex flex-col items-center justify-center w-12 sm:w-14 shrink-0 text-center">
                  <span className="text-[11px] font-bold text-church-rose uppercase tracking-wider">{monthStr}</span>
                  <span className="text-2xl font-black text-church-charcoal leading-none my-0.5">{dayStr}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dayOfWeekStr}</span>
                </div>

                {/* Clean Vertical Divider matching Mobile Screenshot */}
                <div className="h-11 w-[1px] bg-gray-100 mx-3 sm:mx-4 shrink-0" />
                
                {/* Content Column */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="mb-1 flex items-center gap-1.5 flex-wrap">
                    {isPublished && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-black text-[9px] tracking-wider uppercase">
                        PUBLISHED
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-black text-[9px] tracking-wider uppercase">
                        COMPLETED
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-black text-[9px] tracking-wider uppercase">
                        CANCELLED
                      </span>
                    )}
                    {(!event.status || isDraft) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-black text-[9px] tracking-wider uppercase">
                        DRAFT
                      </span>
                    )}
                    {event.category && (
                      <span className="text-[10px] font-bold text-church-muted hidden sm:inline">
                        &bull; {event.category}
                      </span>
                    )}
                    {event.reminderMinutesBefore !== 0 && event.reminderMinutesBefore !== null && (
                      <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        event.notificationSent
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-church-rose'
                      }`}>
                        <Bell size={9} className="mr-0.5" />
                        {event.notificationSent ? 'Sent' : `${event.reminderMinutesBefore !== undefined ? event.reminderMinutesBefore : 30}m`}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-base font-black text-church-charcoal tracking-tight truncate group-hover:text-church-rose transition-colors ${
                    isCancelled ? 'line-through text-gray-400' : ''
                  }`}>
                    {event.title}
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 mt-1 text-xs text-church-slate font-medium">
                    <div className="flex items-center text-church-slate">
                      <Clock size={12} className="mr-1.5 text-gray-400 shrink-0" />
                      <span>{timeDisplay}</span>
                    </div>
                    <div className="flex items-center text-church-slate truncate">
                      <MapPin size={12} className="mr-1.5 text-gray-400 shrink-0" />
                      <span className="truncate">{event.location || 'Church Sanctuary'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Right Action Icons matching Mobile App Screenshot */}
                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {canManage && !isCompleted && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCompleteEvent(event.id); }}
                      title="Mark Completed"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-colors"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                  {canManage && isCompleted && (
                    <div className="w-8 h-8 flex items-center justify-center text-emerald-500" title="Completed">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                  {canManage && (
                    <button 
                      onClick={(e) => handleEditClick(e, event)}
                      title="Edit Details"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-church-charcoal hover:bg-gray-100 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {canManage && (
                    <button 
                      onClick={(e) => toggleMenu(e, event.id)}
                      title="More Options"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-church-charcoal hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  )}
                </div>
                
                {/* Popup Menu */}
                {activeMenuId === event.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                    <div className="absolute right-4 top-14 w-40 bg-white rounded-2xl shadow-church-elevated border border-gray-100 z-20 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                      <button 
                        onClick={(e) => handleEditClick(e, event)}
                        className="w-full flex items-center px-3.5 py-2 text-xs font-bold text-church-charcoal hover:bg-gray-50"
                      >
                        <Edit size={14} className="mr-2 text-church-muted" /> Edit Details
                      </button>
                      {!isCompleted && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCompleteEvent(event.id); }}
                          className="w-full flex items-center px-3.5 py-2 text-xs font-bold text-church-emerald hover:bg-emerald-50"
                        >
                          <CheckCircle2 size={14} className="mr-2" /> Mark Completed
                        </button>
                      )}
                      <div className="border-t border-gray-100 my-1" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(event.id, event.title); }}
                        className="w-full flex items-center px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="mr-2" /> Delete Event
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <EventFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={editingEvent}
      />

      <GenerateMonthlyEventsModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />
    </div>
  );
}
