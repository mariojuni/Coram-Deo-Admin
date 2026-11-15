import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CalendarCheck } from 'lucide-react';
import ModernDropdown from '../ui/ModernDropdown';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';

export default function NewAttendanceSessionModal({ isOpen, onClose }) {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId ;
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'events'));
        const snapshot = await getDocs(q);
        let docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter for church
        docs = docs.filter(d => d.churchId === CHURCH_ID || (!d.churchId && !CHURCH_ID));
        
        // Filter upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        docs = docs.filter(d => {
          if (!d.date) return false;
          const eventDate = new Date(d.date + 'T00:00:00');
          return eventDate >= today;
        });

        // Sort by dates
        docs.sort((a, b) => new Date(a.date) - new Date(b.date));

        setEvents(docs);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isOpen, CHURCH_ID]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return;

    const selectedEvent = events.find(ev => ev.id === selectedEventId);
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const sessionRef = doc(db, 'attendance_sessions', selectedEvent.id);
      await setDoc(sessionRef, {
        eventTitle: selectedEvent.title,
        eventId: selectedEvent.id,
        date: selectedEvent.date,
        status: 'Open',
        metrics: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          visitors: 0
        },
        createdAt: serverTimestamp(),
        churchId: CHURCH_ID
      }, { merge: true });
      onClose();
      navigate(`/admin/attendance/${selectedEvent.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create attendance session: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventOptions = events.map(ev => ({
    value: ev.id,
    label: `${ev.title} (${new Date(ev.date + 'T00:00:00').toLocaleDateString()})`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Attendance Session"
      subtitle="Open attendance check-in for an upcoming church service or event"
      icon={CalendarCheck}
      maxWidth="md"
      footer={
        <>
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="attendance-session-form"
            disabled={isSubmitting || !selectedEventId || loading}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Opening Session...' : 'Open Session'}
          </button>
        </>
      }
    >
      <form id="attendance-session-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Upcoming Church Service / Event *
          </label>
          {loading ? (
            <div className="text-xs text-slate-400 py-3 font-medium">Loading upcoming calendar events...</div>
          ) : events.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium text-center">
              No upcoming events found. Please create an event in the calendar first.
            </div>
          ) : (
            <ModernDropdown
              value={selectedEventId}
              onChange={(val) => setSelectedEventId(val)}
              options={eventOptions}
              placeholder="Select an upcoming event"
              searchable={true}
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
