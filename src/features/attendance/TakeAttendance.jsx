import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Search, CheckCircle, XCircle, Clock, FileWarning, Users, QrCode } from 'lucide-react';
import ModernDropdown from '../../components/ui/ModernDropdown';
import { useAuth } from '../../context/AuthContext';
import { formatStandardName, deduplicateMembers } from '../../utils/nameUtils';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function TakeAttendance() {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // All active members from roster
  const [members, setMembers] = useState([]);
  
  // Local state of attendance marks: { memberId: 'Present' | 'Absent' | 'Late' | 'Excused' }
  const [marks, setMarks] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const unsubscribeSession = onSnapshot(doc(db, 'attendance_sessions', id), (docSnap) => {
      if (docSnap.exists()) {
        setSession({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/admin/attendance');
      }
    });

    const fetchExistingRecords = async () => {
      const recordsQ = query(collection(db, 'attendance_sessions', id, 'records'));
      const recordsSnap = await getDocs(recordsQ);
      const initialMarks = {};
      const extraMembers = [];
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;
      let directVisitors = 0;
      
      recordsSnap.forEach(r => {
        const data = r.data();
        const rType = (data.type || '').toLowerCase();
        const rRole = (data.role || '').toLowerCase();
        const memberId = data.memberId || r.id;
        const isDirectVisitor = 
          rType === 'visitor' || 
          rType === 'guest' || 
          rRole.includes('visitor') || 
          rRole.includes('guest') || 
          r.id.startsWith('visitor_') || 
          memberId.startsWith('visitor_') || 
          r.id.startsWith('guest_') || 
          memberId.startsWith('guest_') || 
          data.isVisitor === true;

        if (data.status) {
          const rawStatus = data.status;
          const normalizedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
          initialMarks[memberId] = normalizedStatus;

          if (isDirectVisitor) {
            if (normalizedStatus === 'Present' || normalizedStatus === 'Late') directVisitors++;
          } else {
            if (normalizedStatus === 'Present') presentCount++;
            else if (normalizedStatus === 'Late') lateCount++;
            else if (normalizedStatus === 'Absent') absentCount++;
            else if (normalizedStatus === 'Excused') excusedCount++;
          }
          
          extraMembers.push({
            id: memberId,
            name: data.memberName || 'Unknown',
            role: data.type || (isDirectVisitor ? 'Visitor' : 'Member'),
            isVisitor: isDirectVisitor
          });
        }
      });
      setMarks(initialMarks);
      return { extraMembers, initialMarks, counts: { presentCount, lateCount, absentCount, excusedCount, directVisitors } };
    };

    const fetchMembers = async () => {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.membershipStatus !== 'Archived')
        .filter(m => m.churchId === CHURCH_ID || (!m.churchId && !CHURCH_ID));
    };

    Promise.all([fetchExistingRecords(), fetchMembers()]).then(([{ extraMembers, initialMarks, counts }, activeMembers]) => {
      const finalMembers = [...activeMembers];
      const existingIds = new Set(activeMembers.map(m => m.id));
      
      for (const extra of extraMembers) {
        if (!existingIds.has(extra.id) && !extra.id.startsWith('visitor_') && !extra.id.startsWith('guest_')) {
          finalMembers.push(extra);
        }
      }
      
      const dedupedMembers = deduplicateMembers(finalMembers, initialMarks);
      dedupedMembers.sort((a, b) => formatStandardName(a).localeCompare(formatStandardName(b)));
      
      setMembers(dedupedMembers);

      // Check if any marked member in users collection is registered as a visitor
      const memberMap = new Map(dedupedMembers.map(m => [m.id, m]));
      let memberPresent = 0;
      let memberLate = 0;
      let memberAbsent = 0;
      let memberExcused = 0;
      let totalVisitors = counts.directVisitors;

      Object.entries(initialMarks).forEach(([mId, status]) => {
        const m = memberMap.get(mId);
        const mStatus = (m?.membershipStatus || '').toLowerCase();
        const mRole = (m?.role || '').toLowerCase();
        const isMemberVis = 
          mId.startsWith('visitor_') || 
          mId.startsWith('guest_') || 
          mStatus === 'visitor' || 
          mStatus === 'visitors' || 
          mRole.includes('visitor') || 
          mRole.includes('guest') || 
          m?.status === 'new' || 
          m?.isVisitor === true;

        if (isMemberVis) {
          if (status === 'Present' || status === 'Late') {
            totalVisitors++;
          }
        } else if (!mId.startsWith('visitor_') && !mId.startsWith('guest_')) {
          if (status === 'Present') memberPresent++;
          else if (status === 'Late') memberLate++;
          else if (status === 'Absent') memberAbsent++;
          else if (status === 'Excused') memberExcused++;
        }
      });

      const finalVisitors = Math.max(
        totalVisitors, 
        Number(session?.metrics?.visitors ?? session?.metrics?.firstTimeVisitors ?? session?.visitors ?? 0)
      );
      setGuestCount(finalVisitors);

      // Auto-heal session metrics in Firestore if out of sync with actual records
      if (memberPresent > 0 || memberLate > 0 || finalVisitors > 0) {
        const sessionRef = doc(db, 'attendance_sessions', id);
        setDoc(sessionRef, {
          metrics: {
            present: memberPresent,
            late: memberLate,
            absent: memberAbsent,
            excused: memberExcused,
            visitors: finalVisitors,
            totalRoster: dedupedMembers.length
          },
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(e => console.warn("Could not sync session metrics:", e));
      }

      setLoading(false);
    });
    
    return () => unsubscribeSession();
  }, [id, CHURCH_ID, navigate]);

  const handleMark = (memberId, status) => {
    setMarks(prev => ({
      ...prev,
      [memberId]: prev[memberId] === status ? undefined : status
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      const currentUserId = userProfile?.id || userProfile?.uid || '';
      
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let excusedCount = 0;
      let visitorCount = 0;

      members.forEach(member => {
        const status = marks[member.id];
        if (status) {
          const mStatus = (member.membershipStatus || '').toLowerCase();
          const mRole = (member.role || '').toLowerCase();
          const isVis = 
            member.isVisitor === true ||
            mStatus === 'visitor' || 
            mStatus === 'visitors' || 
            mRole.includes('visitor') || 
            mRole.includes('guest') ||
            member.id.startsWith('visitor_') ||
            member.id.startsWith('guest_');

          if (isVis) {
            if (status === 'Present' || status === 'Late') visitorCount++;
          } else {
            if (status === 'Present') presentCount++;
            else if (status === 'Absent') absentCount++;
            else if (status === 'Late') lateCount++;
            else if (status === 'Excused') excusedCount++;
          }

          const docRef = doc(collection(db, 'attendance_sessions', id, 'records'), member.id);
          batch.set(docRef, {
            id: member.id,
            memberId: member.id,
            memberName: formatStandardName(member),
            status: status,
            type: isVis ? 'visitor' : 'member',
            role: member.role || (isVis ? 'Visitor' : 'Member'),
            isVisitor: isVis,
            timestamp: now,
            checkInMethod: 'manual_web',
            checkedInAt: now,
            checkedInBy: currentUserId,
            churchId: CHURCH_ID,
            createdAt: now,
            eventDate: session?.date || '',
            eventId: session?.eventId || '',
            eventTitle: session?.eventTitle || session?.eventName || '',
            source: 'web',
            updatedAt: now,
            userId: member.id
          }, { merge: true });
        }
      });

      const finalSavedVisitors = Math.max(
        visitorCount, 
        guestCount, 
        Number(session?.metrics?.visitors ?? session?.metrics?.firstTimeVisitors ?? session?.visitors ?? 0)
      );

      const sessionRef = doc(db, 'attendance_sessions', id);
      batch.set(sessionRef, {
        metrics: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          totalRoster: members.length,
          visitors: finalSavedVisitors
        },
        updatedAt: now
      }, { merge: true });

      await batch.commit();
      alert('Attendance changes saved successfully!');
    } catch (err) {
      console.error("Save error:", err);
      alert('Failed to save attendance. Check permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSessionStatus = async () => {
    try {
      const newStatus = session.status === 'Open' ? 'Closed' : 'Open';
      const sessionRef = doc(db, 'attendance_sessions', id);
      await writeBatch(db).update(sessionRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      }).commit();
    } catch (err) {
      console.error(err);
      alert('Could not update status');
    }
  };

  const filteredMembers = members.filter(member => {
    const fullName = formatStandardName(member).toLowerCase();
    const matchesSearch = fullName.includes(debouncedSearchTerm.toLowerCase());
    
    const currentMark = marks[member.id];
    let matchesFilter = true;
    
    if (filterType === 'Unmarked') matchesFilter = !currentMark;
    else if (filterType !== 'All') matchesFilter = currentMark === filterType;

    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="p-12 text-center text-church-slate text-sm font-semibold animate-pulse">Loading attendance roster...</div>;
  if (!session) return null;

  const isClosed = session.status === 'Closed';

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-7rem)]">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={() => navigate('/admin/attendance')}
            className="w-10 h-10 bg-white rounded-full shadow-church-soft border border-gray-100 flex items-center justify-center text-church-slate hover:text-church-charcoal transition-all active:scale-95"
            aria-label="Back to attendance"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusPill variant={session.status === 'Open' ? "emerald" : "slate"}>
                {session.status} Session
              </StatusPill>
              <StatusPill variant="steel">
                {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </StatusPill>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-church-charcoal tracking-tight">
              {session.eventTitle || session.eventName || 'Attendance Check-in'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={toggleSessionStatus}
            className="px-4 py-2.5 bg-white border border-gray-200 text-church-charcoal rounded-full text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            {isClosed ? 'Reopen Session' : 'Close Session'}
          </button>
          <GradientButton 
            onClick={handleSave}
            loading={isSaving}
            disabled={isClosed}
            size="md"
            className="shadow-church-glow"
          >
            Save Attendance
          </GradientButton>
        </div>
      </div>

      {/* ── Main Roster Card ── */}
      <SoftCard className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-72">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-church-muted">
                <Search size={16} />
              </div>
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4F748E]/25 focus:border-[#2C4A60] bg-white"
                placeholder="Search member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center border border-gray-200 rounded-full bg-white px-2 py-0.5 shadow-sm">
              <span className="text-[10px] font-bold text-church-slate pl-2 pr-1 uppercase tracking-wider">Filter:</span>
              <ModernDropdown
                value={filterType}
                onChange={(val) => setFilterType(val)}
                options={[
                  { value: 'All', label: 'All Members' },
                  { value: 'Unmarked', label: 'Unmarked Only' },
                  { value: 'Present', label: 'Present' },
                  { value: 'Absent', label: 'Absent' },
                  { value: 'Late', label: 'Late' },
                  { value: 'Excused', label: 'Excused' }
                ]}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => alert('Fast QR Scanner connects directly with the CoramDeo Mobile Member ID QR code.')}
              className="flex items-center px-4 py-2 bg-purple-50 text-church-violet rounded-full text-xs font-bold hover:bg-purple-100 border border-purple-100 transition-colors"
            >
              <QrCode size={14} className="mr-1.5" /> Fast QR Check-in
            </button>
            <button 
              onClick={async () => {
                const visitorName = prompt("Enter guest or visitor name:");
                if (visitorName && visitorName.trim()) {
                  const now = new Date().toISOString();
                  const visitorId = `visitor_${Date.now()}`;
                  const docRef = doc(collection(db, 'attendance_sessions', id, 'records'), visitorId);
                  const sessionRef = doc(db, 'attendance_sessions', id);
                  const nextVisitors = guestCount + 1;

                  const batch = writeBatch(db);
                  batch.set(docRef, {
                    id: visitorId,
                    memberId: visitorId,
                    memberName: visitorName.trim(),
                    status: 'Present',
                    type: 'visitor',
                    role: 'Visitor',
                    isVisitor: true,
                    timestamp: now,
                    checkInMethod: 'manual_web',
                    checkedInAt: now,
                    checkedInBy: userProfile?.id || userProfile?.uid || '',
                    churchId: CHURCH_ID,
                    createdAt: now,
                    eventDate: session?.date || '',
                    eventId: session?.eventId || '',
                    eventTitle: session?.eventTitle || session?.eventName || '',
                    source: 'web',
                    updatedAt: now,
                    userId: visitorId
                  }, { merge: true });

                  batch.set(sessionRef, {
                    metrics: {
                      ...(session?.metrics || {}),
                      visitors: nextVisitors
                    },
                    updatedAt: now
                  }, { merge: true });

                  try {
                    await batch.commit();
                    setGuestCount(nextVisitors);
                    alert(`Guest "${visitorName.trim()}" logged successfully!`);
                  } catch (err) {
                    console.error("Error logging guest:", err);
                    alert("Failed to log guest. Check permissions.");
                  }
                }
              }}
              disabled={isClosed}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 text-church-charcoal rounded-full text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Users size={14} className="mr-1.5 text-[#2C4A60]" /> Log Guest
            </button>
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-2 max-w-4xl mx-auto">
            {filteredMembers.map(member => {
              const mark = marks[member.id];
              const name = formatStandardName(member);
              const initial = name.charAt(0).toUpperCase();

              return (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100/90 hover:border-gray-200 transition-all bg-white"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF2F7] text-[#2C4A60] font-black text-xs flex items-center justify-center shrink-0 border border-[#D5E3EC]">
                      {initial}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-church-charcoal text-sm truncate block">{name}</span>
                      <span className="text-[11px] text-church-slate font-medium">{member.role?.replace(/_/g, ' ') || 'Member'}</span>
                    </div>
                  </div>
                  
                  {/* Modern Status Buttons */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button 
                      onClick={() => handleMark(member.id, 'Present')}
                      disabled={isClosed}
                      className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        mark === 'Present' 
                          ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-200' 
                          : 'bg-gray-50 text-church-slate hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <CheckCircle size={13} className="mr-1" /> Present
                    </button>
                    
                    <button 
                      onClick={() => handleMark(member.id, 'Late')}
                      disabled={isClosed}
                      className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        mark === 'Late' 
                          ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-200' 
                          : 'bg-gray-50 text-church-slate hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <Clock size={13} className="mr-1" /> Late
                    </button>

                    <button 
                      onClick={() => handleMark(member.id, 'Absent')}
                      disabled={isClosed}
                      className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        mark === 'Absent' 
                          ? 'bg-red-500 text-white shadow-sm ring-2 ring-red-200' 
                          : 'bg-gray-50 text-church-slate hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      <XCircle size={13} className="mr-1" /> Absent
                    </button>

                    <button 
                      onClick={() => handleMark(member.id, 'Excused')}
                      disabled={isClosed}
                      className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        mark === 'Excused' 
                          ? 'bg-purple-500 text-white shadow-sm ring-2 ring-purple-200' 
                          : 'bg-gray-50 text-church-slate hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      <FileWarning size={13} className="mr-1" /> Excused
                    </button>
                  </div>
                </div>
              );
            })}
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-16 text-church-slate text-sm font-semibold">
                No members found matching your search or filters.
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary Bar */}
        <div className="p-4 border-t border-gray-100 bg-white flex flex-wrap justify-between items-center text-xs font-bold text-church-slate gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-church-charcoal">
              Marked: <span className="text-[#2C4A60] font-black">{Object.keys(marks).length}</span> / {members.length}
            </span>
            <span className="text-gray-300">&bull;</span>
            <span className="text-emerald-600">Present: {Object.values(marks).filter(v => v === 'Present').length}</span>
            <span className="text-amber-600">Late: {Object.values(marks).filter(v => v === 'Late').length}</span>
            <span className="text-red-600">Absent: {Object.values(marks).filter(v => v === 'Absent').length}</span>
            <span className="text-church-violet">Excused: {Object.values(marks).filter(v => v === 'Excused').length}</span>
            <span className="text-blue-600">Guests / Visitors: {guestCount || session?.metrics?.visitors || 0}</span>
          </div>
        </div>
      </SoftCard>
    </div>
  );
}
