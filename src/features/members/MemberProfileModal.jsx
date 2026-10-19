import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  HeartHandshake, 
  CreditCard, 
  CheckCircle, 
  ClipboardCheck, 
  Edit, 
  Copy, 
  Check, 
  Globe
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { logRoleChange } from '../../utils/roleAudit';
import {
  canManageGiving,
  canManageRoles,
  getSystemRoles,
  getAssignableRoles,
} from '../../utils/permissions';
import { 
  getMembershipBadgeInfo
} from './utils/memberStatusUtils';
import GradientButton from '../../components/ui/GradientButton';

const ROLE_DESCRIPTIONS = {
  super_admin: 'Full system-wide administrative control across all churches.',
  church_admin: 'Full management of this church: members, finance, and settings.',
  pastor: 'Pastoral ministry leadership, preaching, and discipleship.',
  secretary: 'Administrative directory maintenance and attendance logs.',
  finance_admin: 'Financial management: giving records, funds, and reports.',
  ministry_leader: 'Oversees specific ministry departments and teams.',
  member: 'Standard church member account.',
};

export default function MemberProfileModal({ isOpen, onClose, member = null, onEdit = null }) {
  const { userProfile, activeChurchId, formatCurrency } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  
  const [activeTab, setActiveTab] = useState('profile');
  
  // Giving state
  const [givingHistory, setGivingHistory] = useState([]);
  const [loadingGiving, setLoadingGiving] = useState(false);
  const [userHousehold, setUserHousehold] = useState(null);
  const [showHouseholdGiving, setShowHouseholdGiving] = useState(false);
  const [fundsMap, setFundsMap] = useState({});
  
  // Attendance state
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Ministries state
  const [memberMinistries, setMemberMinistries] = useState([]);
  const [loadingMinistries, setLoadingMinistries] = useState(false);

  // Discipleship groups state
  const [memberGroups, setMemberGroups] = useState([]);

  // Roles state
  const [newRoles, setNewRoles] = useState([]);
  const [reason, setReason] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  useEffect(() => {
    if (isOpen && member) {
      setActiveTab('profile');
      setNewRoles(getSystemRoles(member));
      setReason('');
      
      const canSeeGiving = canManageGiving(userProfile);
      if (canSeeGiving && member.id) {
        fetchHouseholdAndGiving(member);
        
        // Fetch funds map
        const fetchFunds = async () => {
          try {
            const q = query(collection(db, 'givingFunds'), where('churchId', '==', CHURCH_ID));
            const snap = await getDocs(q);
            const map = {};
            snap.forEach(d => {
              map[d.id] = d.data().name;
            });
            setFundsMap(map);
          } catch (e) {
            console.error("Error fetching funds:", e);
          }
        };
        fetchFunds();
      }
      if (member.id) {
        fetchAttendanceHistory(member.id);
        fetchMinistries(member.id);
        fetchDiscipleshipGroups(member.id);
      }
    }
  }, [isOpen, member, userProfile]);

  const fetchHouseholdAndGiving = async (currentMember) => {
    setLoadingGiving(true);
    const churchId = CHURCH_ID || userProfile?.churchId;
    try {
      const hq = query(
        collection(db, 'households'),
        where('churchId', '==', churchId),
        where('memberIds', 'array-contains', currentMember.id)
      );
      const hSnap = await getDocs(hq);
      let household = null;
      if (!hSnap.empty) {
        household = { id: hSnap.docs[0].id, ...hSnap.docs[0].data() };
        setUserHousehold(household);
        setShowHouseholdGiving(true);
      } else {
        setUserHousehold(null);
        setShowHouseholdGiving(false);
      }

      await fetchGivingHistory(currentMember, household, household ? true : false);
    } catch (e) {
      console.error(e);
      setLoadingGiving(false);
    }
  };

  const fetchGivingHistory = async (currentMember, household, showHousehold) => {
    setLoadingGiving(true);
    const churchId = CHURCH_ID || userProfile?.churchId;
    try {
      let q;
      if (showHousehold && household && household.memberIds?.length > 0) {
        const ids = household.memberIds.slice(0, 10);
        q = query(
          collection(db, 'givingRecords'), 
          where('churchId', '==', churchId),
          where('userId', 'in', ids)
        );
      } else {
        q = query(
          collection(db, 'givingRecords'), 
          where('churchId', '==', churchId),
          where('userId', '==', currentMember.id)
        );
      }
      
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setGivingHistory(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGiving(false);
    }
  };

  useEffect(() => {
    if (isOpen && member && canManageGiving(userProfile)) {
      if (userHousehold !== undefined) {
        fetchGivingHistory(member, userHousehold, showHouseholdGiving);
      }
    }
  }, [showHouseholdGiving]);

  const fetchMinistries = async (memberId) => {
    setLoadingMinistries(true);
    const churchId = CHURCH_ID || userProfile?.churchId;
    try {
      const q = query(
        collection(db, 'ministries'),
        where('churchId', '==', churchId)
      );
      const snap = await getDocs(q);
      const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const memberMinistriesList = allDocs.filter(ministry => {
        if (ministry.memberIds && ministry.memberIds.includes(memberId)) return true;
        if (ministry.members && Array.isArray(ministry.members)) {
          return ministry.members.some(m => m.memberId === memberId);
        }
        return false;
      });
      
      setMemberMinistries(memberMinistriesList);
    } catch (e) {
      console.error("Error fetching ministries:", e);
    } finally {
      setLoadingMinistries(false);
    }
  };

  const fetchDiscipleshipGroups = async (memberId) => {
    const churchId = CHURCH_ID || userProfile?.churchId;
    try {
      const q = query(
        collection(db, 'discipleshipGroups'),
        where('churchId', '==', churchId)
      );
      const snap = await getDocs(q);
      const allGroups = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const userGroups = allGroups.filter(g =>
        (g.leaderMemberIds && g.leaderMemberIds.includes(memberId)) ||
        (g.memberIds && g.memberIds.includes(memberId))
      );
      setMemberGroups(userGroups);
    } catch (e) {
      console.error("Error fetching discipleship groups:", e);
    }
  };

  const fetchAttendanceHistory = async (memberId) => {
    setLoadingAttendance(true);
    try {
      const allSessions = [];
      
      try {
        const sessionsQuery = query(collection(db, 'attendance_sessions'));
        const sessionsSnap = await getDocs(sessionsQuery);
        sessionsSnap.docs.forEach(d => allSessions.push({ id: d.id, collectionName: 'attendance_sessions' }));
      } catch (e) { console.warn(e); }

      try {
        const sessionQuerySingular = query(collection(db, 'attendance_session'));
        const sessionSnapSingular = await getDocs(sessionQuerySingular);
        sessionSnapSingular.docs.forEach(d => allSessions.push({ id: d.id, collectionName: 'attendance_session' }));
      } catch (e) { console.warn(e); }
      
      const recordPromises = allSessions.map(async (sessionDoc) => {
        const eventId = sessionDoc.id;
        const recordRef = doc(db, sessionDoc.collectionName, eventId, 'records', memberId);
        const recordSnap = await getDoc(recordRef);
        if (recordSnap.exists()) {
          return { id: recordSnap.id, eventId, ...recordSnap.data() };
        }
        return null;
      });

      const results = await Promise.all(recordPromises);
      const validRecords = results.filter(r => r !== null);
      
      validRecords.sort((a, b) => {
        const dateA = a.checkedInAt ? new Date(a.checkedInAt) : new Date(a.timestamp || 0);
        const dateB = b.checkedInAt ? new Date(b.checkedInAt) : new Date(b.timestamp || 0);
        return dateB - dateA;
      });
      
      setAttendanceHistory(validRecords);
    } catch (e) {
      console.error("Error fetching attendance:", e);
    } finally {
      setLoadingAttendance(false);
    }
  };

  if (!isOpen || !member) return null;

  const canSeeGiving = canManageGiving(userProfile);
  const myCanManageRoles = canManageRoles(userProfile);
  const availableRoles = getAssignableRoles(userProfile);

  const toggleRole = (role) => {
    setNewRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const calculateAge = (dateVal) => {
    const birthday = dateVal || member?.birthDate || member?.birthday;
    if (!birthday) return 'N/A';
    const birth = new Date(birthday);
    if (isNaN(birth.getTime())) return 'N/A';
    const ageDifMs = Date.now() - birth.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleSaveRole = async () => {
    if (member.id === userProfile?.uid) {
      alert("You cannot change your own role.");
      return;
    }
    if (newRoles.length === 0) {
      alert("A user must have at least one role.");
      return;
    }
    setSavingRole(true);
    try {
      const previousRoles = getSystemRoles(member);
      const primaryRole = newRoles[0];

      const userRef = doc(db, 'users', member.id);
      await updateDoc(userRef, {
        churchId: member.churchId || CHURCH_ID,
        systemRoles: newRoles,
        primaryRole,
        role: primaryRole,
        roleUpdatedBy: userProfile.uid,
        roleUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await logRoleChange(
        member.churchId || CHURCH_ID,
        member.id,
        previousRoles,
        newRoles,
        userProfile.uid,
        reason
      );

      member.systemRoles = newRoles;
      member.primaryRole = primaryRole;
      member.role = primaryRole;
      alert("Roles updated successfully.");
      setReason('');
    } catch (e) {
      console.error(e);
      alert("Failed to update roles. Please ensure you have permissions.");
    } finally {
      setSavingRole(false);
    }
  };

  const memberName = member.displayName || member.name || 'Member';
  const badgeInfo = getMembershipBadgeInfo(member);
  const memberInitials = (memberName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();

  const totalGivingAmount = givingHistory.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-church-soft overflow-hidden flex flex-col my-4 sm:my-6 max-h-[90vh]">
        
        {/* Brand Accent Top Stripe */}
        <div className="h-1 w-full bg-gradient-coram shrink-0" />

        {/* ── Compact Header ── */}
        <div className="bg-church-navy text-white relative px-6 py-5 sm:px-8 sm:py-6 shrink-0">
          {/* Header Action Buttons */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {onEdit && (
              <button 
                type="button"
                onClick={() => onEdit(member)} 
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold text-white transition-colors flex items-center gap-1.5 backdrop-blur-sm"
                title="Edit member"
              >
                <Edit size={12} />
                <span>Edit</span>
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Avatar and Identity */}
          <div className="flex items-center gap-4 sm:gap-5 pr-24">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-coram flex items-center justify-center text-2xl font-black text-white shadow-church-glow shrink-0 overflow-hidden ring-2 ring-white/20">
              {member.photoUrl || member.avatarUrl || member.profilePictureUrl ? (
                <img 
                  src={member.photoUrl || member.avatarUrl || member.profilePictureUrl} 
                  alt={memberName} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                memberInitials
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeInfo.className}`}>
                  {badgeInfo.label}
                </span>
                {member.isAbroad && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    <Globe size={10} /> Abroad
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {memberName}
              </h1>

              <div className="flex flex-wrap items-center text-xs text-church-slate mt-1 gap-x-4 gap-y-1 font-medium">
                {member.email && (
                  <span className="flex items-center gap-1 text-gray-300">
                    <Mail size={13} className="text-church-rose shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{member.email}</span>
                    <button 
                      type="button"
                      onClick={() => handleCopy(member.email, 'email')}
                      className="p-0.5 hover:text-white text-gray-400 transition-colors"
                      title="Copy email"
                    >
                      {copiedKey === 'email' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </span>
                )}
                {(member.phoneNumber || member.phone) && (
                  <span className="flex items-center gap-1 text-gray-300">
                    <Phone size={13} className="text-church-violet shrink-0" />
                    <span>{member.phoneNumber || member.phone}</span>
                    <button 
                      type="button"
                      onClick={() => handleCopy(member.phoneNumber || member.phone, 'phone')}
                      className="p-0.5 hover:text-white text-gray-400 transition-colors"
                      title="Copy phone"
                    >
                      {copiedKey === 'phone' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Compact Tab Navigation (Just like previous) ── */}
        <div className="px-6 sm:px-8 border-b border-gray-100 flex space-x-6 overflow-x-auto text-xs sm:text-sm font-bold bg-white shrink-0">
          <button 
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'profile' 
                ? 'border-church-rose text-church-rose' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Profile Details
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('ministry')}
            className={`py-3.5 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ministry' 
                ? 'border-church-rose text-church-rose' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <span>Ministry & Discipleship</span>
            {(memberMinistries.length + memberGroups.length) > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'ministry' ? 'bg-church-rose-light text-church-rose' : 'bg-gray-100 text-gray-500'
              }`}>
                {memberMinistries.length + memberGroups.length}
              </span>
            )}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-3.5 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'attendance' 
                ? 'border-church-rose text-church-rose' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <span>Attendance</span>
            {attendanceHistory.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'attendance' ? 'bg-church-rose-light text-church-rose' : 'bg-gray-100 text-gray-500'
              }`}>
                {attendanceHistory.length}
              </span>
            )}
          </button>
          {canSeeGiving && (
            <button 
              type="button"
              onClick={() => setActiveTab('giving')}
              className={`py-3.5 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'giving' 
                  ? 'border-church-rose text-church-rose' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span>Giving History</span>
              {givingHistory.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'giving' ? 'bg-church-rose-light text-church-rose' : 'bg-gray-100 text-gray-500'
                }`}>
                  {givingHistory.length}
                </span>
              )}
            </button>
          )}
          {myCanManageRoles && (
            <button 
              type="button"
              onClick={() => setActiveTab('access')}
              className={`py-3.5 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'access' 
                  ? 'border-church-rose text-church-rose' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Access & Role
            </button>
          )}
        </div>

        {/* ── Content Area ── */}
        <div className="p-6 sm:p-7 flex-1 overflow-y-auto bg-gray-50/50">
          
          {/* TAB 1: Profile Details (Compact 2-Column Grid) */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-5">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <User size={15} /> Demographics
                  </h3>
                  <dl className="space-y-2.5 text-xs sm:text-sm">
                    <div className="grid grid-cols-3 py-0.5">
                      <dt className="text-gray-500 font-medium">Gender</dt>
                      <dd className="col-span-2 font-semibold text-church-navy">{member.gender || 'Not specified'}</dd>
                    </div>
                    <div className="grid grid-cols-3 py-0.5">
                      <dt className="text-gray-500 font-medium">Birth Date</dt>
                      <dd className="col-span-2 font-semibold text-church-navy">{member.birthDate || member.birthday || 'Not specified'}</dd>
                    </div>
                    <div className="grid grid-cols-3 py-0.5">
                      <dt className="text-gray-500 font-medium">Age</dt>
                      <dd className="col-span-2 font-semibold text-church-navy">{calculateAge(member.birthDate || member.birthday)}</dd>
                    </div>
                    <div className="grid grid-cols-3 py-0.5">
                      <dt className="text-gray-500 font-medium">Address</dt>
                      <dd className="col-span-2 font-semibold text-church-navy">{member.address || 'Not specified'}</dd>
                    </div>
                    <div className="grid grid-cols-3 py-0.5">
                      <dt className="text-gray-500 font-medium">Location</dt>
                      <dd className="col-span-2 font-semibold text-church-navy">
                        {member.isAbroad ? (
                          <span className="text-blue-700 font-bold">Abroad (Overseas)</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">Local</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Phone size={15} /> Emergency Contact
                  </h3>
                  {member.emergencyContact ? (
                    <p className="text-sm font-semibold text-church-navy">{member.emergencyContact}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No emergency contact provided.</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle size={15} /> Church Status
                  </h3>
                  <dl className="space-y-2.5 text-xs sm:text-sm">
                    <div className="grid grid-cols-3 py-0.5 items-center">
                      <dt className="text-gray-500 font-medium">Status</dt>
                      <dd className="col-span-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${badgeInfo.className}`}>
                          {badgeInfo.label}
                        </span>
                      </dd>
                    </div>

                    <div className="grid grid-cols-3 py-0.5 items-center">
                      <dt className="text-gray-500 font-medium">Role(s)</dt>
                      <dd className="col-span-2">
                        <div className="flex flex-wrap gap-1">
                          {getSystemRoles(member).map(r => (
                            <span key={r} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 capitalize">
                              {r.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </dd>
                    </div>

                    <div className="grid grid-cols-3 py-0.5 items-baseline">
                      <dt className="text-gray-500 font-medium">Baptism</dt>
                      <dd className="col-span-2 text-xs sm:text-sm font-medium text-church-navy">
                        {member?.baptismStatus === 'Baptized' ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Baptized
                            </span>
                            {member.baptismDate && (
                              <span className="text-xs text-church-slate">
                                {new Date(member.baptismDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ) : member?.baptismStatus === 'To Be Baptized' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            To Be Baptized
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs font-medium">
                            {member?.baptismStatus || 'Not Baptized'}
                          </span>
                        )}
                      </dd>
                    </div>

                    <div className="grid grid-cols-3 py-0.5">
                      <dt className="text-gray-500 font-medium">Joined</dt>
                      <dd className="col-span-2 font-semibold text-church-navy">
                        {member.createdAt?.toDate 
                          ? member.createdAt.toDate().toLocaleDateString() 
                          : member.createdAt 
                            ? new Date(member.createdAt).toLocaleDateString() 
                            : 'N/A'}
                      </dd>
                    </div>

                    {userHousehold && (
                      <div className="grid grid-cols-3 py-0.5">
                        <dt className="text-gray-500 font-medium">Household</dt>
                        <dd className="col-span-2 font-semibold text-church-navy">
                          {userHousehold.name}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HeartHandshake size={15} /> Pastoral & Admin Notes
                  </h3>
                  <p className="text-xs sm:text-sm text-church-navy whitespace-pre-wrap leading-relaxed">
                    {member.notes || <span className="text-gray-400 italic">No notes available.</span>}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Ministry & Discipleship */}
          {activeTab === 'ministry' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="text-center space-y-1.5 max-w-md mx-auto">
                <div className="w-12 h-12 bg-church-rose-light text-church-rose rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <HeartHandshake size={24} />
                </div>
                <h2 className="text-base font-bold text-church-navy">Family Group & Ministries</h2>
                <p className="text-xs sm:text-sm text-church-slate">
                  {memberName} is part of the <strong>{member.familyGroup || 'General Fellowship'}</strong> family group.
                </p>
              </div>

              {/* Ministry Assignments */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-church-slate mb-3">
                  Assigned Ministries ({memberMinistries.length})
                </h4>
                {loadingMinistries ? (
                  <div className="p-6 text-center text-xs text-gray-500">Loading ministries...</div>
                ) : memberMinistries.length === 0 ? (
                  <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 italic">No ministry assignments found for this member.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {memberMinistries.map(ministry => (
                      <div key={ministry.id} className="p-3.5 border border-gray-100 rounded-xl bg-gray-50/40 flex items-center space-x-3">
                        <div className="w-9 h-9 bg-church-rose-light text-church-rose rounded-xl flex items-center justify-center shrink-0">
                          <HeartHandshake size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-church-navy truncate">{ministry.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{ministry.roles?.length || 0} Roles Available</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Small / Discipleship Groups (if any) */}
              {memberGroups.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-church-slate mb-3">
                    Discipleship Groups ({memberGroups.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {memberGroups.map(group => {
                      const isLeader = group.leaderMemberIds && group.leaderMemberIds.includes(member.id);
                      return (
                        <div key={group.id} className="p-3.5 border border-gray-100 rounded-xl bg-gray-50/40 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-church-navy">{group.name}</h4>
                            <p className="text-xs text-gray-500">{group.meetingDay || 'Weekly'} • {group.meetingTime || 'TBD'}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isLeader ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {isLeader ? 'Leader' : 'Member'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Attendance History */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck size={15} /> Attendance Records
                </h3>
                <span className="text-xs text-church-slate font-semibold">
                  {attendanceHistory.length} Total Sessions
                </span>
              </div>
              
              {loadingAttendance ? (
                <div className="p-8 text-center text-xs text-gray-500">Loading records...</div>
              ) : attendanceHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">No attendance records found for {memberName}.</div>
              ) : (
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase">
                        <th className="px-6 py-3">Event</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs sm:text-sm">
                      {attendanceHistory.map(record => (
                        <tr key={record.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-church-navy">{record.eventTitle || 'Unknown Event'}</td>
                          <td className="px-6 py-3.5 text-church-slate">
                            {record.checkedInAt 
                              ? new Date(record.checkedInAt).toLocaleDateString() 
                              : (record.timestamp ? new Date(record.timestamp).toLocaleDateString() : '')}
                          </td>
                          <td className="px-6 py-3.5 text-right font-medium">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              record.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                              record.status === 'Absent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              record.status === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Giving History */}
          {activeTab === 'giving' && canSeeGiving && (
            <div className="space-y-4">
              {userHousehold && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs">
                  <p className="text-blue-900 mb-2">
                    <strong>Note:</strong> {memberName} belongs to the <strong>{userHousehold.name}</strong>. Showing combined household giving.
                  </p>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center font-medium text-blue-900 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showHouseholdGiving} 
                        onChange={() => setShowHouseholdGiving(true)} 
                        className="mr-2 accent-church-rose rounded"
                      />
                      Show Household Giving
                    </label>
                    <label className="flex items-center font-medium text-blue-900 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!showHouseholdGiving} 
                        onChange={() => setShowHouseholdGiving(false)} 
                        className="mr-2 accent-church-rose rounded"
                      />
                      Show Only Individual Giving
                    </label>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-xs font-bold text-church-rose uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={15} /> Giving Records
                  </h3>
                  <div className="text-xs sm:text-sm font-bold text-church-navy">
                    Total: <strong className="text-emerald-600">{formatCurrency(totalGivingAmount)}</strong>
                  </div>
                </div>
                
                {loadingGiving ? (
                  <div className="p-8 text-center text-xs text-gray-500">Loading records...</div>
                ) : givingHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">No giving records found under "{memberName}".</div>
                ) : (
                  <div className="overflow-x-auto max-h-[50vh]">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase">
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Fund</th>
                          <th className="px-6 py-3">Method</th>
                          <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs sm:text-sm">
                        {givingHistory.map(record => (
                          <tr key={record.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-6 py-3.5 text-church-slate">{new Date(record.date).toLocaleDateString()}</td>
                            <td className="px-6 py-3.5 font-medium text-church-navy">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {fundsMap[record.fundId] || record.fundType || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-church-slate">{record.method}</td>
                            <td className="px-6 py-3.5 font-bold text-emerald-600 text-right">
                              {formatCurrency(record.amount || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Access & Role */}
          {activeTab === 'access' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto space-y-5">
              <div>
                <h2 className="text-base font-bold text-church-navy">System Access & Security</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage what this user can access in the admin portal.</p>
              </div>

              {myCanManageRoles ? (
                <div className="space-y-5">
                  <div className="bg-amber-50 text-amber-900 p-3.5 rounded-xl text-xs flex items-start border border-amber-200/80 leading-relaxed">
                    <p>
                      Users can hold multiple roles. The <strong>first selected role</strong> becomes their primary display role.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-church-navy uppercase tracking-wider mb-2">
                      System Roles <span className="text-gray-400 font-normal lowercase">(select one or more)</span>
                    </label>
                    <div className="space-y-2">
                      {availableRoles.map(role => {
                        const isChecked = newRoles.includes(role);
                        const isFirst = newRoles[0] === role;
                        const desc = ROLE_DESCRIPTIONS[role] || '';

                        return (
                          <label
                            key={role}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-church-rose/5 border-church-rose/40'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleRole(role)}
                              disabled={member.id === userProfile?.uid}
                              className="w-4 h-4 mt-0.5 rounded accent-church-rose"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-church-navy capitalize">
                                  {role.replace(/_/g, ' ')}
                                </span>
                                {isFirst && isChecked && (
                                  <span className="text-[10px] font-bold text-church-rose bg-church-rose-light px-2 py-0.5 rounded-full border border-church-rose/20">
                                    PRIMARY
                                  </span>
                                )}
                              </div>
                              {desc && (
                                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {member.id === userProfile?.uid && (
                      <p className="text-xs text-rose-500 mt-1.5 font-medium">You cannot change your own role.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-church-navy uppercase tracking-wider mb-1.5">
                      Reason for Change (Optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why are these roles being changed?"
                      rows="2"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-rose text-xs sm:text-sm resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Primary role: <strong>{newRoles[0]?.replace(/_/g, ' ') || 'None'}</strong>
                    </p>
                    <GradientButton
                      onClick={handleSaveRole}
                      disabled={savingRole || newRoles.length === 0 || member.id === userProfile?.uid}
                      loading={savingRole}
                      size="sm"
                    >
                      Update Roles
                    </GradientButton>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="flex flex-wrap gap-2 justify-center mb-3">
                    {getSystemRoles(member).map(r => (
                      <span key={r} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 capitalize font-bold text-xs border border-blue-100">
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">You do not have permission to change system roles.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
