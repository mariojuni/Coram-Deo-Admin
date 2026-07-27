import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  ArrowLeft, 
  Shield, 
  Calendar, 
  Clock, 
  MapPin, 
  Edit, 
  Trash2, 
  Plus, 
  FileText, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Download,
  BarChart2,
  BookOpen,
  ChevronRight,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatStandardName } from '../../utils/nameUtils';
import { useAuth } from '../../context/AuthContext';
import { 
  getDiscipleshipGroup, 
  deleteDiscipleshipGroup,
  getGroupMaterials,
  getGroupEvents,
  deleteGroupMaterial,
  advanceGroupWeek,
  removeGroupPlanFromGroup
} from './discipleshipGroupService';
import { getDiscipleshipPlan, getDiscipleshipWeeks } from './discipleshipService';
import { canManageDiscipleshipGroup, canUploadGroupMaterial } from '../../utils/discipleshipGroupPermissions';
import DiscipleshipGroupFormModal from './DiscipleshipGroupFormModal';
import AssignGroupMembersModal from './AssignGroupMembersModal';
import GroupMaterialUploadModal from './GroupMaterialUploadModal';
import GenerateGroupMeetingsModal from './GenerateGroupMeetingsModal';
import AttachPlanModal from './AttachPlanModal';

export default function DiscipleshipGroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;

  const [group, setGroup] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [events, setEvents] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [plan, setPlan] = useState(null);
  const [planWeeks, setPlanWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, members, meetings, materials, attendance

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAttachPlanOpen, setIsAttachPlanOpen] = useState(false);

  const canManage = canManageDiscipleshipGroup(userProfile, group);
  const canUpload = canUploadGroupMaterial(userProfile, group);

  const fetchData = async () => {
    if (!CHURCH_ID || !id) return;
    setLoading(true);
    try {
      const g = await getDiscipleshipGroup(CHURCH_ID, id);
      if (!g) {
        navigate('/admin/discipleship/groups');
        return;
      }
      setGroup(g);

      const [mList, eList, usersSnap] = await Promise.all([
        getGroupMaterials(CHURCH_ID, id),
        getGroupEvents(CHURCH_ID, id),
        getDocs(query(collection(db, 'users')))
      ]);

      const mMap = {};
      usersSnap.forEach(d => {
        mMap[d.id] = { id: d.id, ...d.data() };
      });
      setMembersMap(mMap);

      setMaterials(mList);
      setEvents(eList);

      if (g.planId) {
        const [pData, wData] = await Promise.all([
          getDiscipleshipPlan(CHURCH_ID, g.planId),
          getDiscipleshipWeeks(CHURCH_ID, g.planId)
        ]);
        setPlan(pData);
        setPlanWeeks(wData);
      } else {
        setPlan(null);
        setPlanWeeks([]);
      }
    } catch (err) {
      console.error("Error loading group detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [CHURCH_ID, id]);

  const handleAdvanceWeek = async () => {
    if (!group || !group.planId || !planWeeks.length) return;
    const currentWk = group.currentWeekNumber || 1;
    if (currentWk >= (plan?.totalWeeks || planWeeks.length)) {
      alert("This group is already at the final week of the discipleship plan.");
      return;
    }
    const nextWk = currentWk + 1;
    const nextLesson = planWeeks.find(w => w.weekNumber === nextWk) || planWeeks[0];

    try {
      await advanceGroupWeek(CHURCH_ID, group.id, nextWk, nextLesson?.id || null, userProfile?.uid);
      fetchData();
    } catch (err) {
      alert("Failed to advance week: " + err.message);
    }
  };

  const handleRemovePlan = async () => {
    if (window.confirm("Are you sure you want to remove the discipleship plan from this group? Progress records will be preserved.")) {
      try {
        await removeGroupPlanFromGroup(CHURCH_ID, group.id, userProfile?.uid);
        fetchData();
      } catch (err) {
        alert("Failed to remove plan: " + err.message);
      }
    }
  };

  if (loading || !group) {
    return <div className="text-center py-16 text-gray-400 font-medium">Loading group details...</div>;
  }

  const handleDeleteGroup = async () => {
    if (window.confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      try {
        await deleteDiscipleshipGroup(CHURCH_ID, group.id);
        navigate('/admin/discipleship/groups');
      } catch (err) {
        alert("Failed to delete group: " + err.message);
      }
    }
  };

  const handleDeleteMaterial = async (m) => {
    if (window.confirm(`Delete material "${m.title}"?`)) {
      try {
        await deleteGroupMaterial(CHURCH_ID, m.id, m.storagePath);
        fetchData();
      } catch (err) {
        alert("Failed to delete material: " + err.message);
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.date >= todayStr);
  const pastEvents = events.filter(e => e.date < todayStr);

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/discipleship/groups')}
          className="flex items-center space-x-2 text-xs font-bold text-gray-500 hover:text-church-navy transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Groups</span>
        </button>

        {canManage && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 text-church-navy hover:bg-gray-200 font-bold text-xs rounded-xl"
            >
              <Edit size={14} />
              <span>Edit Group</span>
            </button>
            <button
              onClick={handleDeleteGroup}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Hero Card */}
      <div className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-church-green/10 text-church-green rounded-full">
                {(group.groupType || 'small_group').replace('_', ' ')}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                group.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {group.status || 'active'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-church-navy">{group.name}</h1>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">{group.description || 'No description provided.'}</p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {canManage && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-church-navy text-white text-xs font-bold rounded-xl hover:bg-church-navy/90"
              >
                <Users size={14} />
                <span>Manage Members</span>
              </button>
            )}
            {canUpload && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-church-green text-white text-xs font-bold rounded-xl hover:bg-church-green/90 shadow-md shadow-church-green/20"
              >
                <FileText size={14} />
                <span>Upload Material</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Info Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-gray-100 text-xs">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Meeting Schedule</span>
            <p className="font-bold text-church-navy mt-0.5">{group.meetingDay}s at {group.meetingTime}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Location</span>
            <p className="font-bold text-church-navy mt-0.5 truncate">{group.meetingLocation || 'TBD'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Group Leaders</span>
            <p className="font-bold text-church-navy mt-0.5">{group.leaderMemberIds?.length || 0} Leaders</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Total Members</span>
            <p className="font-bold text-church-navy mt-0.5">{group.memberIds?.length || 0} Members</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'members', label: `Members (${(group.memberIds?.length || 0) + (group.leaderMemberIds?.length || 0)})` },
          { id: 'meetings', label: `Meetings (${events.length})` },
          { id: 'materials', label: `Leader Materials (${materials.length})` },
          { id: 'attendance', label: 'Attendance' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-3 px-1 text-xs font-bold border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-church-green text-church-green'
                : 'border-transparent text-gray-400 hover:text-church-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Attached Discipleship Plan Card */}
            <div className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-church-navy flex items-center space-x-2">
                  <BookOpen size={18} className="text-church-green" />
                  <span>Current Discipleship Plan</span>
                </h3>
                {canManage && (
                  <div className="flex items-center space-x-2">
                    {group.planId ? (
                      <>
                        <button
                          onClick={() => setIsAttachPlanOpen(true)}
                          className="px-3 py-1 bg-gray-100 text-church-navy hover:bg-gray-200 text-xs font-bold rounded-lg flex items-center space-x-1"
                        >
                          <RefreshCw size={12} />
                          <span>Change Plan</span>
                        </button>
                        <button
                          onClick={handleRemovePlan}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg flex items-center space-x-1"
                        >
                          <XCircle size={12} />
                          <span>Remove Plan</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsAttachPlanOpen(true)}
                        className="px-3 py-1.5 bg-church-green text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-md shadow-church-green/20"
                      >
                        <Plus size={12} />
                        <span>Attach Plan</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {group.planId && plan ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-church-green">
                        Week {group.currentWeekNumber || 1} of {plan.totalWeeks || 0}
                      </span>
                      <h4 className="text-base font-bold text-church-navy mt-0.5">{plan.title}</h4>
                      {planWeeks.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Current Lesson:{' '}
                          <strong className="text-church-navy">
                            {planWeeks.find((w) => w.weekNumber === (group.currentWeekNumber || 1))?.title ||
                              'Week Lesson'}
                          </strong>
                          {planWeeks.find((w) => w.weekNumber === (group.currentWeekNumber || 1))
                            ?.scriptureReference && (
                            <span className="ml-2 italic text-gray-400">
                              (
                              {
                                planWeeks.find((w) => w.weekNumber === (group.currentWeekNumber || 1))
                                  ?.scriptureReference
                              }
                              )
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {canManage && (
                      <button
                        onClick={handleAdvanceWeek}
                        disabled={(group.currentWeekNumber || 1) >= (plan.totalWeeks || planWeeks.length)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 ${
                          (group.currentWeekNumber || 1) >= (plan.totalWeeks || planWeeks.length)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-church-navy text-white hover:bg-church-navy/90'
                        }`}
                      >
                        <span>Advance to Next Week</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No discipleship plan currently attached to this group.
                </div>
              )}
            </div>

            {/* Upcoming Meeting Card */}
            <div className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100">
              <h3 className="text-sm font-bold text-church-navy mb-4 flex items-center justify-between">
                <span>Next Upcoming Meeting</span>
                {canManage && (
                  <button
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="text-xs font-bold text-church-green hover:underline flex items-center space-x-1"
                  >
                    <Plus size={12} />
                    <span>Generate Meetings</span>
                  </button>
                )}
              </h3>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  No upcoming meetings generated yet.
                </div>
              ) : (
                <div className="p-4 bg-church-green/5 border border-church-green/20 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-church-navy">{upcomingEvents[0].title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Date: <strong>{upcomingEvents[0].date}</strong> at {upcomingEvents[0].startTime}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/events/${upcomingEvents[0].id}`)}
                    className="px-3 py-1.5 bg-church-green text-white text-xs font-bold rounded-lg"
                  >
                    View Event
                  </button>
                </div>
              )}
            </div>

            {/* Leader Materials Highlight */}
            <div className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-church-navy flex items-center space-x-2">
                  <Lock size={16} className="text-church-green" />
                  <span>Leader-Only Materials</span>
                </h3>
                {canUpload && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="text-xs font-bold text-church-green hover:underline"
                  >
                    Upload Material
                  </button>
                )}
              </div>
              {materials.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No leader materials uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {materials.slice(0, 3).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                      <div className="flex items-center space-x-3">
                        <FileText size={16} className="text-church-green" />
                        <div>
                          <p className="font-bold text-church-navy">{m.title}</p>
                          <p className="text-[10px] text-gray-400">{m.materialType} | Audience: {m.audience}</p>
                        </div>
                      </div>
                      {m.fileUrl && (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-church-navy font-bold text-[10px] hover:bg-gray-100 flex items-center space-x-1"
                        >
                          <Download size={10} />
                          <span>View</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100">
              <h3 className="text-sm font-bold text-church-navy mb-3">Group Roster Summary</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Group Leaders</span>
                  <span className="font-bold text-church-navy">{group.leaderMemberIds?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Assigned Members</span>
                  <span className="font-bold text-church-navy">{group.memberIds?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">Total Roster</span>
                  <span className="font-bold text-church-green">
                    {(group.memberIds?.length || 0) + (group.leaderMemberIds?.length || 0)}
                  </span>
                </div>
              </div>
              {canManage && (
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="w-full mt-4 py-2 bg-gray-100 text-church-navy font-bold text-xs rounded-xl hover:bg-gray-200"
                >
                  Manage Roster
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <div className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-church-navy">Assigned Group Leaders & Members</h3>
            {canManage && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="px-4 py-2 bg-church-green text-white text-xs font-bold rounded-xl"
              >
                Assign / Remove Members
              </button>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Shield size={14} className="text-church-green" />
              <span>Leaders ({group.leaderMemberIds?.length || 0})</span>
            </h4>
            {!group.leaderMemberIds || group.leaderMemberIds.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No leaders assigned yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {group.leaderMemberIds.map((memId) => {
                  const memberDoc = membersMap[memId];
                  const formattedName = formatStandardName(memberDoc);
                  const initial = formattedName.charAt(0).toUpperCase();

                  return (
                    <div key={memId} className="p-3 bg-church-green/5 border border-church-green/20 rounded-xl flex items-center space-x-3 text-xs">
                      <div className="w-8 h-8 rounded-full bg-church-green text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {initial}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-church-navy truncate">{formattedName}</p>
                        <span className="text-[10px] text-church-green font-bold">Group Leader</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Users size={14} />
              <span>Members ({group.memberIds?.length || 0})</span>
            </h4>
            {!group.memberIds || group.memberIds.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No members assigned yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {group.memberIds.map((memId) => {
                  const memberDoc = membersMap[memId];
                  const formattedName = formatStandardName(memberDoc);
                  const initial = formattedName.charAt(0).toUpperCase();

                  return (
                    <div key={memId} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center space-x-3 text-xs">
                      <div className="w-8 h-8 rounded-full bg-church-navy/10 text-church-navy font-bold flex items-center justify-center text-xs shrink-0">
                        {initial}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-church-navy truncate">{formattedName}</p>
                        <span className="text-[10px] text-gray-400">Regular Member</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEETINGS TAB */}
      {activeTab === 'meetings' && (
        <div className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-church-navy">Weekly Group Meetings</h3>
            {canManage && (
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-4 py-2 bg-church-green text-white text-xs font-bold rounded-xl flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Generate Weekly Meetings</span>
              </button>
            )}
          </div>

          {events.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No weekly meetings generated yet. Click "Generate Weekly Meetings" above to bulk create events for a selected month.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <div>
                    <h4 className="font-bold text-church-navy text-sm">{e.title}</h4>
                    <p className="text-gray-500 mt-0.5">
                      Date: <strong>{e.date}</strong> at {e.startTime} | Category: {e.category}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/events/${e.id}`)}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-church-navy font-bold rounded-lg hover:bg-gray-100"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MATERIALS TAB */}
      {activeTab === 'materials' && (
        <div className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-church-navy">Leader & Group Materials</h3>
              <p className="text-[10px] text-gray-400">Materials marked "leaders_only" are restricted to group leaders & admins.</p>
            </div>
            {canUpload && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-church-green text-white text-xs font-bold rounded-xl flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Upload Material</span>
              </button>
            )}
          </div>

          {materials.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No leader materials uploaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-church-green/10 text-church-green flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-church-navy text-sm">{m.title}</p>
                        {m.audience === 'leaders_only' && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <Lock size={10} />
                            <span>Leaders Only</span>
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 mt-0.5">{m.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {m.fileUrl && (
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-church-navy hover:bg-gray-100 flex items-center space-x-1"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </a>
                    )}
                    {canManage && (
                      <button
                        onClick={() => handleDeleteMaterial(m)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-church-navy">Group Meeting Attendance Alignment</h3>
            <p className="text-xs text-gray-400">Reuses existing events and attendance records</p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No meetings recorded for attendance. Generate weekly meetings to start tracking.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <div>
                    <p className="font-bold text-church-navy text-sm">{e.title}</p>
                    <p className="text-gray-500 mt-0.5">Meeting Date: {e.date}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/attendance/${e.id}`)}
                    className="px-3 py-1.5 bg-church-green text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                  >
                    <BarChart2 size={14} />
                    <span>Take / View Attendance</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <DiscipleshipGroupFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        group={group}
        onSaved={fetchData}
      />

      <AssignGroupMembersModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        group={group}
        onSaved={fetchData}
      />

      <GroupMaterialUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        group={group}
        onUploaded={fetchData}
      />

      <GenerateGroupMeetingsModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        group={group}
        onGenerated={fetchData}
      />

      <AttachPlanModal
        isOpen={isAttachPlanOpen}
        onClose={() => setIsAttachPlanOpen(false)}
        group={group}
        onSaved={fetchData}
      />
    </div>
  );
}
