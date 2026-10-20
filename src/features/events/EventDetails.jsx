import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Calendar, MapPin, Clock, ArrowLeft, Users, Shield, CheckCircle2, Music, ChevronRight, Bell } from 'lucide-react';
import { getSetlistByEvent } from '../worship/worshipService';
import SoftCard from '../../components/ui/SoftCard';
import StatusPill from '../../components/ui/StatusPill';
import GradientButton from '../../components/ui/GradientButton';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [assignments, setAssignments] = useState([]);
  const [setlist, setSetlist] = useState(null);
  const [rsvpUsers, setRsvpUsers] = useState({});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching event:", error);
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'ministryAssignments'), where('eventId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAssignments(docs);
    });
    
    // Fetch setlist for this event
    const fetchSetlist = async () => {
      try {
        const sl = await getSetlistByEvent(id);
        setSetlist(sl);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSetlist();
    
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!event?.rsvps || !Array.isArray(event.rsvps)) return;

    const fetchUsers = async () => {
      const usersData = { ...rsvpUsers };
      const usersToFetch = event.rsvps
        .map(rsvp => rsvp.userId)
        .filter(userId => userId && usersData[userId] === undefined);

      if (usersToFetch.length === 0) return;

      try {
        const promises = usersToFetch.map(userId => getDoc(doc(db, 'users', userId)));
        const docs = await Promise.all(promises);
        
        docs.forEach(docSnap => {
          if (docSnap.exists()) {
            usersData[docSnap.id] = docSnap.data();
          } else {
            usersData[docSnap.id] = null;
          }
        });
        setRsvpUsers(usersData);
      } catch (error) {
        console.error("Error fetching RSVP users:", error);
      }
    };
    
    fetchUsers();
  }, [event?.rsvps]);

  if (loading) return <div className="p-12 text-center text-church-slate text-sm font-semibold animate-pulse">Loading event details...</div>;
  if (!event) return <div className="p-12 text-center text-church-slate text-sm font-semibold">Event not found.</div>;

  const isPublished = event.status?.toLowerCase() === 'published';
  const isCompleted = event.status?.toLowerCase() === 'completed';

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/admin/events')} 
          className="w-10 h-10 bg-white border border-gray-100 rounded-full shadow-church-soft flex items-center justify-center text-church-slate hover:text-church-charcoal hover:bg-gray-50 transition-all active:scale-95"
          aria-label="Back to events"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isPublished && <StatusPill variant="emerald">Published Gathering</StatusPill>}
            {isCompleted && <StatusPill variant="violet">Completed</StatusPill>}
            {!isPublished && !isCompleted && <StatusPill variant="slate">Draft</StatusPill>}
            {event.reminderMinutesBefore !== 0 && event.reminderMinutesBefore !== null && (
              <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                event.notificationSent 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-rose-50 text-church-rose border-rose-100'
              }`}>
                <Bell size={11} className="mr-1" />
                {event.notificationSent 
                  ? 'Push Sent' 
                  : `Reminder: ${event.reminderMinutesBefore !== undefined ? event.reminderMinutesBefore : 30}m before`}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-church-charcoal tracking-tight">{event.title}</h1>
          <div className="flex flex-wrap items-center text-xs text-church-slate mt-1.5 gap-x-4 gap-y-1 font-medium">
            <span className="flex items-center"><Calendar size={13} className="mr-1 text-church-muted" /> {event.date || 'TBD'}</span>
            <span className="flex items-center"><Clock size={13} className="mr-1 text-church-muted" /> {event.startTime || event.time || 'TBD'}</span>
            <span className="flex items-center"><MapPin size={13} className="mr-1 text-church-muted" /> {event.location || 'Church Campus'}</span>
          </div>
        </div>
      </div>

      {/* ── Main Card Container ── */}
      <SoftCard className="overflow-hidden">
        {/* Modern Tabs */}
        <div className="flex border-b border-gray-100 px-6 pt-3 space-x-6 overflow-x-auto">
          {['overview', 'assigned_ministries', 'worship_setlist', 'attendance', 'rsvp'].map(tab => {
            const isActive = activeTab === tab;
            return (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3.5 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap ${
                  isActive 
                    ? 'border-church-rose text-church-rose' 
                    : 'border-transparent text-church-slate hover:text-church-charcoal'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            );
          })}
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-black text-church-charcoal text-base mb-2">Description</h3>
                <p className="text-church-slate text-sm leading-relaxed">{event.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-church-slate text-xs uppercase tracking-wider mb-1.5">Status</h4>
                  {isPublished ? (
                    <StatusPill variant="emerald">Published</StatusPill>
                  ) : (
                    <StatusPill variant="slate">{event.status || 'Draft'}</StatusPill>
                  )}
                </div>

                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-church-slate text-xs uppercase tracking-wider mb-1.5">Category</h4>
                  <p className="text-church-charcoal text-sm font-bold">{event.category || 'General Gathering'}</p>
                </div>

                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-church-slate text-xs uppercase tracking-wider mb-1.5">Assigned Volunteers</h4>
                  <p className="text-church-charcoal text-sm font-bold">{assignments.length} Volunteers</p>
                </div>

                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-church-slate text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Bell size={12} className="text-church-rose" /> Push Reminder
                  </h4>
                  <p className="text-church-charcoal text-sm font-bold">
                    {event.reminderMinutesBefore === 0 || event.reminderMinutesBefore === null
                      ? 'No Reminder'
                      : `${event.reminderMinutesBefore !== undefined ? event.reminderMinutesBefore : 30}m before`}
                    {event.notificationSent && <span className="ml-1.5 text-xs text-emerald-600 font-semibold">(Sent)</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assigned_ministries' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-black text-church-charcoal text-lg">Assigned Ministries</h3>
                  <p className="text-xs text-church-slate">Volunteer roster confirmed for this service</p>
                </div>
                <button 
                  onClick={() => navigate('/admin/schedules')} 
                  className="text-xs text-church-rose font-bold hover:underline"
                >
                  Manage in Scheduling &rarr;
                </button>
              </div>

              {assignments.length === 0 ? (
                <div className="text-center py-12 text-church-slate text-sm">
                  No ministries or volunteers assigned to this event yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignments.map(a => (
                    <div key={a.id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between bg-white hover:border-gray-200 transition-colors">
                      <div>
                        <p className="font-bold text-church-charcoal text-sm">{a.ministryName || a.ministryId}</p>
                        <p className="text-xs text-church-slate mt-0.5">{a.roleName} &bull; <span className="font-semibold text-church-charcoal">{a.memberName}</span></p>
                      </div>
                      <StatusPill variant={a.status === 'Confirmed' ? 'emerald' : 'amber'}>
                        {a.status || 'Pending'}
                      </StatusPill>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="text-center py-12 text-church-slate space-y-3">
              <div className="w-14 h-14 bg-pink-50 text-church-rose rounded-3xl mx-auto flex items-center justify-center border border-pink-100 shadow-sm">
                <Users size={24} />
              </div>
              <h3 className="text-base font-bold text-church-charcoal">Service Attendance Check-in</h3>
              <p className="text-xs text-church-slate max-w-sm mx-auto">
                Open the attendance session to log member arrivals, visitors, and attendance notes.
              </p>
              <div>
                <GradientButton 
                  onClick={() => navigate(`/admin/attendance/${event.id}`)}
                  size="md"
                  className="shadow-church-glow"
                >
                  Take Attendance Now
                </GradientButton>
              </div>
            </div>
          )}

          {activeTab === 'worship_setlist' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-black text-church-charcoal text-lg flex items-center">
                    <Music size={18} className="mr-2 text-church-rose" /> Worship Setlist
                  </h3>
                  <p className="text-xs text-church-slate">Song lyrics, chord charts, and team setlist</p>
                </div>
              </div>
              
              {setlist ? (
                <div className="bg-gray-50/70 p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-church-charcoal text-base">{setlist.title}</h4>
                    <p className="text-xs text-church-slate mt-1">Status: <span className="font-semibold uppercase text-church-charcoal">{setlist.status}</span></p>
                  </div>
                  <button 
                    onClick={() => navigate(`/admin/worship/setlists/${setlist.id}`)}
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-church-charcoal hover:bg-gray-50 shadow-sm"
                  >
                    View Setlist
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 text-church-slate bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-church-muted">
                      <Music size={20} />
                    </div>
                  </div>
                  <p className="text-xs font-medium mb-3">No worship setlist linked to this event yet.</p>
                  <button 
                    onClick={() => navigate('/admin/worship/setlists')}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-church-charcoal hover:bg-gray-50 shadow-sm"
                  >
                    Go to Setlists
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rsvp' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-black text-church-charcoal text-lg">RSVP Responses</h3>
                  <p className="text-xs text-church-slate">Confirmed attendee responses for this gathering</p>
                </div>
              </div>

              {(!event.rsvps || event.rsvps.length === 0) ? (
                <div className="text-center py-12 text-church-slate text-sm">
                  No member RSVPs recorded yet for this gathering.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {event.rsvps.map((rsvp, index) => {
                    const user = rsvpUsers[rsvp.userId];
                    const name = user 
                      ? `${user.firstName || ''} ${user.middleInitial ? user.middleInitial + '.' : ''} ${user.lastName || ''}`.replace(/\s+/g, ' ').trim()
                      : (user === null ? 'Unknown Member' : 'Loading...');
                    
                    return (
                      <div key={index} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between bg-white">
                        <p className="font-bold text-church-charcoal text-sm">{name}</p>
                        <StatusPill 
                          variant={rsvp.status === 'going' ? 'emerald' : (rsvp.status === 'not_going' ? 'rose' : 'amber')}
                        >
                          {rsvp.status}
                        </StatusPill>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </SoftCard>
    </div>
  );
}
