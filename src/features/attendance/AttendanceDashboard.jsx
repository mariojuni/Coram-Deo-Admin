import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ClipboardCheck, Plus, Calendar, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NewAttendanceSessionModal from '../../components/Modals/NewAttendanceSessionModal';
import { deduplicateMembers } from '../../utils/nameUtils';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function AttendanceDashboard() {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const activeMembers = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => {
          const status = m.membershipStatus || 'Active';
          return ['Active', 'Visitor', 'Fellowship'].includes(status);
        })
        .filter(m => m.churchId === CHURCH_ID || (!m.churchId && !CHURCH_ID));
      
      const dedupedMembers = deduplicateMembers(activeMembers, {});
      setTotalMembers(dedupedMembers.length);
    };
    fetchMembers();
  }, [CHURCH_ID]);

  useEffect(() => {
    if (!CHURCH_ID) return;
    const q = query(
      collection(db, 'attendance_sessions'),
      where('churchId', '==', CHURCH_ID)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      docs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setSessions(docs);
      setLoading(false);
    }, (err) => {
      console.error("Attendance fetch error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [CHURCH_ID]);

  const handleCreateSession = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <StatusPill variant="rose" dot className="mb-2">
            Service Check-in & Member Care
          </StatusPill>
          <h1 className="text-3xl font-black text-church-charcoal tracking-tight">Attendance</h1>
          <p className="text-sm text-church-slate mt-1">Track worship service participation, visitor arrivals, and church family growth.</p>
        </div>

        <div>
          <GradientButton 
            onClick={handleCreateSession}
            icon={Plus}
            size="md"
            className="shadow-church-glow"
          >
            New Session
          </GradientButton>
        </div>
      </div>

      {/* ── Session Cards Grid ── */}
      {loading ? (
        <div className="py-16 text-center text-church-slate text-sm font-semibold animate-pulse">
          Loading attendance sessions...
        </div>
      ) : sessions.length === 0 ? (
        <SoftCard className="p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-pink-50 text-church-rose rounded-3xl flex items-center justify-center mb-4 border border-pink-100 shadow-sm">
            <ClipboardCheck size={30} />
          </div>
          <h3 className="text-xl font-black text-church-charcoal mb-1">No attendance records yet</h3>
          <p className="text-church-slate text-sm max-w-sm mb-6">
            Start a new attendance session for Sunday worship, prayer meetings, or special gatherings.
          </p>
          <GradientButton onClick={handleCreateSession} icon={Plus} size="sm">
            Start First Session
          </GradientButton>
        </SoftCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map(session => {
            const dateObj = new Date(session.date);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            const totalPresent = (session.metrics?.present || 0) + (session.metrics?.visitors || 0);
            const memberCount = session.metrics?.present || 0;
            const visitorCount = session.metrics?.visitors || 0;
            const attendancePct = totalMembers > 0 ? Math.min(100, Math.round((memberCount / totalMembers) * 100)) : 0;
            const isOpen = session.status === 'Open';

            return (
              <SoftCard 
                key={session.id} 
                hover
                onClick={() => navigate(`/admin/attendance/${session.id}`)}
                className="p-6 flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <StatusPill variant={isToday ? "rose" : "slate"}>
                      {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </StatusPill>
                    <StatusPill variant={isOpen ? "emerald" : "slate"}>
                      {session.status}
                    </StatusPill>
                  </div>

                  <h3 className="text-lg font-black text-church-charcoal group-hover:text-church-rose transition-colors line-clamp-1 mb-4">
                    {session.eventTitle || session.eventName || 'Sunday Gathering'}
                  </h3>

                  {/* Metrics Box (Styled after CoramDeo Mobile Goal & Journey Cards) */}
                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-church-slate uppercase tracking-wider">Attendance Roll</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-church-charcoal">{totalPresent}</span>
                        <span className="text-xs font-bold text-church-muted ml-1">/ {totalMembers} members</span>
                      </div>
                    </div>

                    {/* Gradient Progress Bar */}
                    <div className="w-full bg-gray-200/80 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-coram h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(5, attendancePct)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs font-medium text-church-slate pt-1">
                      <span>Members: <strong className="text-church-charcoal">{memberCount}</strong> ({attendancePct}%)</span>
                      <span>Visitors: <strong className="text-church-rose">{visitorCount}</strong></span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-church-rose group-hover:text-church-rose-hover">
                  <span>Take Attendance &bull; Roster</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </SoftCard>
            );
          })}
        </div>
      )}

      <NewAttendanceSessionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
