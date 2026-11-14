import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  ClipboardCheck, 
  Plus, 
  Calendar, 
  Users, 
  ArrowRight, 
  HeartHandshake, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NewAttendanceSessionModal from '../../components/Modals/NewAttendanceSessionModal';
import { deduplicateMembers } from '../../utils/nameUtils';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';
import FlockCareRetention from './FlockCareRetention';
import AttendanceAnalytics from './AttendanceAnalytics';
import { calculateMemberRetention, calculateRetentionMetrics } from './utils/retentionUtils';

export default function AttendanceDashboard() {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'sessions' | 'flock_care' | 'analytics'
  const activeTab = searchParams.get('tab') || 'sessions';
  const setActiveTab = (tab) => {
    setSearchParams(tab === 'sessions' ? {} : { tab });
  };

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [recordsBySession, setRecordsBySession] = useState({});
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [followups, setFollowups] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch active members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        const activeMembers = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => {
            const status = m.membershipStatus || 'Active';
            return ['Active', 'Visitor', 'Fellowship', 'Regular'].includes(status);
          })
          .filter(m => m.churchId === CHURCH_ID || (!m.churchId && !CHURCH_ID));
        
        const dedupedMembers = deduplicateMembers(activeMembers, {});
        setMembers(dedupedMembers);
      } catch (err) {
        console.error("Error fetching members for attendance:", err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [CHURCH_ID]);

  // 2. Subscribe to attendance sessions
  useEffect(() => {
    if (!CHURCH_ID) {
      setLoadingSessions(false);
      return;
    }
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
      setLoadingSessions(false);
    }, (err) => {
      console.error("Attendance sessions fetch error:", err);
      setLoadingSessions(false);
    });
    return () => unsubscribe();
  }, [CHURCH_ID]);

  // 3. Subscribe to pastoral care followups
  useEffect(() => {
    if (!CHURCH_ID) return;
    const q = query(
      collection(db, 'attendance_followups'),
      where('churchId', '==', CHURCH_ID)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map = {};
      snapshot.docs.forEach(d => {
        map[d.id] = { id: d.id, ...d.data() };
      });
      setFollowups(map);
    }, (err) => {
      console.warn("Followups fetch error (non-fatal):", err);
    });
    return () => unsubscribe();
  }, [CHURCH_ID]);

  // 4. Fetch records for the top 10 recent sessions
  const fetchRecentRecords = useCallback(async () => {
    if (!sessions.length) {
      setLoadingRecords(false);
      return;
    }
    try {
      const topSessions = sessions.slice(0, 10);
      const recordsMap = {};

      await Promise.all(
        topSessions.map(async (sess) => {
          try {
            const recordsQ = query(collection(db, 'attendance_sessions', sess.id, 'records'));
            const snap = await getDocs(recordsQ);
            recordsMap[sess.id] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          } catch (e) {
            console.warn(`Could not load records for session ${sess.id}`, e);
          }
        })
      );

      setRecordsBySession(recordsMap);
    } catch (e) {
      console.error("Error loading session records:", e);
    } finally {
      setLoadingRecords(false);
    }
  }, [sessions]);

  useEffect(() => {
    if (sessions.length > 0) {
      fetchRecentRecords();
    } else if (!loadingSessions) {
      setLoadingRecords(false);
    }
  }, [sessions, loadingSessions, fetchRecentRecords]);

  // 5. Analyze member retention
  const analyzedMembers = useMemo(() => {
    return calculateMemberRetention(sessions, members, recordsBySession, followups);
  }, [sessions, members, recordsBySession, followups]);

  // 6. Calculate high-level retention metrics
  const metrics = useMemo(() => {
    return calculateRetentionMetrics(analyzedMembers);
  }, [analyzedMembers]);

  const handleCreateSession = () => {
    setIsModalOpen(true);
  };

  const isInitialLoading = loadingSessions || loadingMembers;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <StatusPill variant="steel" dot className="mb-2">
            Flock Care & Attendance Retention
          </StatusPill>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track Sunday service turnouts, identify absence patterns early, and provide proactive pastoral care.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <GradientButton 
            onClick={handleCreateSession}
            icon={Plus}
            size="md"
            className="shadow-sm"
          >
            New Session
          </GradientButton>
        </div>
      </div>

      {/* ── Modern Navigation Tabs ── */}
      <div className="flex items-center space-x-1.5 p-1.5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/95 shadow-xs w-fit">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'sessions'
              ? 'bg-[#162533] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardCheck size={14} />
          <span>Sessions & Roll Call</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            activeTab === 'sessions' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {sessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('flock_care')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'flock_care'
              ? 'bg-[#162533] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HeartHandshake size={14} />
          <span>Flock Care & Retention</span>
          {metrics.criticalCount > 0 ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-600 text-white animate-pulse">
              {metrics.criticalCount} at risk
            </span>
          ) : (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'flock_care' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {analyzedMembers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'analytics'
              ? 'bg-[#162533] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp size={14} />
          <span>Retention Analytics</span>
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'sessions' && (
        <>
          {/* Critical Absence Alert Banner if any members are flagged */}
          {metrics.criticalCount > 0 && (
            <SoftCard 
              onClick={() => setActiveTab('flock_care')}
              hover
              className="p-4 bg-gradient-to-r from-rose-50/90 to-amber-50/60 border border-rose-200 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                    Pastoral Care Attention Needed
                  </h4>
                  <p className="text-xs text-rose-700 font-medium mt-0.5">
                    <strong>{metrics.criticalCount} member{metrics.criticalCount > 1 ? 's have' : ' has'} missed 3+ consecutive Sunday services.</strong> Click to review the flock care outreach queue.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-xs font-bold text-rose-800 space-x-1 shrink-0">
                <span>View Flock Care</span>
                <ArrowRight size={14} />
              </div>
            </SoftCard>
          )}

          {/* Sessions Grid */}
          {isInitialLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm font-semibold animate-pulse">
              Loading attendance sessions...
            </div>
          ) : sessions.length === 0 ? (
            <SoftCard className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[#EBF2F7] text-[#2C4A60] rounded-3xl flex items-center justify-center mb-4 border border-[#D5E3EC] shadow-sm">
                <ClipboardCheck size={30} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">No attendance records yet</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
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
                const attendancePct = members.length > 0 ? Math.min(100, Math.round((memberCount / members.length) * 100)) : 0;
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
                        <StatusPill variant={isToday ? "steel" : "slate"}>
                          {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </StatusPill>
                        <StatusPill variant={isOpen ? "emerald" : "slate"}>
                          {session.status}
                        </StatusPill>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 group-hover:text-[#2C4A60] transition-colors line-clamp-1 mb-4">
                        {session.eventTitle || session.eventName || 'Sunday Gathering'}
                      </h3>

                      {/* Metrics Box */}
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Roll</span>
                          <div className="text-right">
                            <span className="text-2xl font-black text-slate-900">{totalPresent}</span>
                            <span className="text-xs font-bold text-slate-400 ml-1">/ {members.length} members</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#2C4A60] h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(5, attendancePct)}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-xs font-medium text-slate-500 pt-1">
                          <span>Members: <strong className="text-slate-800">{memberCount}</strong> ({attendancePct}%)</span>
                          <span>Visitors: <strong className="text-[#2C4A60]">{visitorCount}</strong></span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#2C4A60] group-hover:text-[#162533]">
                      <span>Take Attendance &bull; Roster</span>
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </SoftCard>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'flock_care' && (
        <FlockCareRetention
          analyzedMembers={analyzedMembers}
          metrics={metrics}
          loading={loadingRecords || isInitialLoading}
          onRefresh={fetchRecentRecords}
        />
      )}

      {activeTab === 'analytics' && (
        <AttendanceAnalytics
          sessions={sessions}
          analyzedMembers={analyzedMembers}
          totalMembers={members.length}
        />
      )}

      <NewAttendanceSessionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
