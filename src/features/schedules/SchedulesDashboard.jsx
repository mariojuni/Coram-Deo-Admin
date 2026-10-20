import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, Shield, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import AssignmentFormModal from './AssignmentFormModal';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';
import FeatureGate from '../subscription/components/FeatureGate';

export default function SchedulesDashboard() {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'date', 'ministry', 'member'
  const [activeTab, setActiveTab] = useState('date');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (!CHURCH_ID) return;
    
    const q = query(collection(db, 'ministryAssignments'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs = docs.filter(d => d.churchId === CHURCH_ID || (!d.churchId && !CHURCH_ID));
      docs.sort((a, b) => new Date(a.eventDate || 0) - new Date(b.eventDate || 0));
      
      setAssignments(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [CHURCH_ID]);

  const handleDelete = async (id) => {
    setActiveMenuId(null);
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await deleteDoc(doc(db, 'ministryAssignments', id));
      } catch (err) {
        console.error("Error deleting assignment", err);
      }
    }
  };

  const toggleMenu = (id) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Grouping logic
  const groupedByDate = assignments.reduce((acc, a) => {
    const d = a.eventDate || 'Unknown Date';
    if (!acc[d]) acc[d] = [];
    acc[d].push(a);
    return acc;
  }, {});

  const groupedByMinistry = assignments.reduce((acc, a) => {
    const minName = a.ministryName || 'Unknown Ministry';
    if (!acc[minName]) acc[minName] = [];
    acc[minName].push(a);
    return acc;
  }, {});

  const groupedByMember = assignments.reduce((acc, a) => {
    const mem = a.memberName || 'Unknown Member';
    if (!acc[mem]) acc[mem] = [];
    acc[mem].push(a);
    return acc;
  }, {});

  if (loading) return <div className="p-12 text-center text-church-slate text-sm font-semibold animate-pulse">Loading ministry schedules...</div>;

  return (
    <FeatureGate
      feature="scheduling"
      featureName="Ministry Scheduling & Rostering"
      requiredTier="growth"
      description="Coordinate team assignments, call times, volunteer notifications, and ministry rotations. Available on Growth Ministry and Kingdom Network tiers."
    >
      <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <StatusPill variant="rose" dot className="mb-2">
            Ministry Service Roster
          </StatusPill>
          <h1 className="text-3xl font-black text-church-charcoal tracking-tight">Ministry Scheduling</h1>
          <p className="text-sm text-church-slate mt-1">Manage team assignments, roles, call times, and volunteer commitments.</p>
        </div>

        <div>
          <GradientButton 
            onClick={() => { setEditingAssignment(null); setIsModalOpen(true); }}
            icon={Plus}
            size="md"
            className="shadow-church-glow"
          >
            Create Assignment
          </GradientButton>
        </div>
      </div>

      {/* ── Main Container ── */}
      <SoftCard className="overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 pt-3 space-x-6">
          {[
            { id: 'date', label: 'By Date' },
            { id: 'ministry', label: 'By Ministry' },
            { id: 'member', label: 'By Volunteer' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  isActive 
                    ? 'border-church-rose text-church-rose' 
                    : 'border-transparent text-church-slate hover:text-church-charcoal'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 md:p-8">
          {assignments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-pink-50 text-church-rose rounded-3xl mx-auto flex items-center justify-center mb-4 border border-pink-100 shadow-sm">
                <Calendar size={28} />
              </div>
              <h3 className="text-lg font-black text-church-charcoal mb-1">No assignments scheduled</h3>
              <p className="text-church-slate text-sm max-w-sm mx-auto mb-6">Schedule your worship, ushering, tech, and hospitality teams for upcoming church gatherings.</p>
              <GradientButton 
                onClick={() => { setEditingAssignment(null); setIsModalOpen(true); }}
                icon={Plus}
                size="sm"
              >
                Create First Assignment
              </GradientButton>
            </div>
          ) : (
            <>
              {/* Grouped by Date */}
              {activeTab === 'date' && (
                <div className="space-y-6">
                  {Object.entries(groupedByDate).sort(([a], [b]) => new Date(a) - new Date(b)).map(([dateStr, dateAssignments]) => (
                    <div key={dateStr} className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                      <div className="bg-gray-50/80 px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-church-charcoal text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-church-rose" />
                          {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>
                        <span className="text-xs font-bold text-church-slate">{dateAssignments.length} Assigned</span>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {dateAssignments.map(a => (
                          <div key={a.id} className="p-4 border border-gray-100 rounded-2xl hover:border-gray-200 transition-all bg-white relative group">
                            <h4 className="font-bold text-church-charcoal text-sm mb-1 pr-7 truncate">{a.eventName}</h4>
                            <p className="text-xs text-church-rose font-bold mb-2">{a.ministryName} &bull; {a.roleName}</p>
                            <div className="flex items-center text-xs font-medium text-church-slate mb-3">
                              <Users size={13} className="mr-1.5 text-church-muted" /> 
                              <span className="text-church-charcoal font-semibold">{a.memberName}</span>
                            </div>
                            {a.callTime && (
                              <p className="text-[11px] font-semibold text-church-muted mb-3">Call Time: {a.callTime}</p>
                            )}
                            <div className="flex items-center space-x-2">
                              <StatusPill variant={a.status === 'Confirmed' ? 'emerald' : (a.status === 'Declined' ? 'rose' : 'amber')}>
                                {a.status || 'Pending'}
                              </StatusPill>
                              {a.canViewSongList && (
                                <StatusPill variant="violet">
                                  Setlist Access
                                </StatusPill>
                              )}
                            </div>
                            
                            <div className="absolute top-3.5 right-3.5">
                              <button 
                                onClick={() => toggleMenu(a.id)} 
                                className="w-7 h-7 rounded-full flex items-center justify-center text-church-muted hover:text-church-charcoal hover:bg-gray-100"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {activeMenuId === a.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                  <div className="absolute right-0 top-7 w-32 bg-white border border-gray-100 shadow-church-elevated rounded-2xl z-20 py-1 text-left animate-in fade-in zoom-in-95 duration-150">
                                    <button 
                                      onClick={() => { setActiveMenuId(null); setEditingAssignment(a); setIsModalOpen(true); }} 
                                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-church-charcoal hover:bg-gray-50 flex items-center"
                                    >
                                      <Edit size={13} className="mr-2 text-church-muted" /> Edit
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(a.id)} 
                                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center"
                                    >
                                      <Trash2 size={13} className="mr-2" /> Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grouped by Ministry */}
              {activeTab === 'ministry' && (
                <div className="space-y-6">
                  {Object.entries(groupedByMinistry).map(([ministryName, minAssignments]) => (
                    <div key={ministryName} className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                      <div className="bg-gray-50/80 px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-church-charcoal text-sm flex items-center">
                          <Shield size={16} className="mr-2 text-church-rose" /> {ministryName}
                        </h3>
                        <span className="text-xs font-bold text-church-slate">{minAssignments.length} Assignments</span>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {minAssignments.map(a => (
                          <div key={a.id} className="p-4 border border-gray-100 rounded-2xl hover:border-gray-200 transition-all bg-white relative">
                            <h4 className="font-bold text-church-charcoal text-sm mb-1 pr-7 truncate">{a.eventName}</h4>
                            <p className="text-xs text-church-muted font-medium mb-1.5">{a.eventDate}</p>
                            <p className="text-xs font-bold text-church-rose">{a.roleName}</p>
                            <p className="text-xs text-church-slate font-medium mb-3">{a.memberName}</p>
                            
                            <StatusPill variant={a.status === 'Confirmed' ? 'emerald' : (a.status === 'Declined' ? 'rose' : 'amber')}>
                              {a.status || 'Pending'}
                            </StatusPill>
                            
                            <div className="absolute top-3.5 right-3.5">
                              <button onClick={() => toggleMenu(a.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-church-muted hover:text-church-charcoal hover:bg-gray-100">
                                <MoreVertical size={16} />
                              </button>
                              {activeMenuId === a.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                  <div className="absolute right-0 top-7 w-32 bg-white border border-gray-100 shadow-church-elevated rounded-2xl z-20 py-1 text-left">
                                    <button onClick={() => { setActiveMenuId(null); setEditingAssignment(a); setIsModalOpen(true); }} className="w-full text-left px-3.5 py-2 text-xs font-bold text-church-charcoal hover:bg-gray-50 flex items-center">
                                      <Edit size={13} className="mr-2 text-church-muted" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(a.id)} className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center">
                                      <Trash2 size={13} className="mr-2" /> Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grouped by Member */}
              {activeTab === 'member' && (
                <div className="space-y-6">
                  {Object.entries(groupedByMember).map(([memberName, memAssignments]) => (
                    <div key={memberName} className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                      <div className="bg-gray-50/80 px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-church-charcoal text-sm flex items-center">
                          <Users size={16} className="mr-2 text-church-violet" /> {memberName}
                        </h3>
                        <span className="text-xs font-bold text-church-slate">{memAssignments.length} Assignments</span>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {memAssignments.map(a => (
                          <div key={a.id} className="p-4 border border-gray-100 rounded-2xl hover:border-gray-200 transition-all bg-white relative">
                            <h4 className="font-bold text-church-charcoal text-sm mb-1 pr-7 truncate">{a.eventName}</h4>
                            <p className="text-xs text-church-muted font-medium mb-1.5">{a.eventDate}</p>
                            <p className="text-xs font-bold text-church-violet">{a.ministryName} &bull; {a.roleName}</p>
                            <div className="mt-3">
                              <StatusPill variant={a.status === 'Confirmed' ? 'emerald' : (a.status === 'Declined' ? 'rose' : 'amber')}>
                                {a.status || 'Pending'}
                              </StatusPill>
                            </div>
                            
                            <div className="absolute top-3.5 right-3.5">
                              <button onClick={() => toggleMenu(a.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-church-muted hover:text-church-charcoal hover:bg-gray-100">
                                <MoreVertical size={16} />
                              </button>
                              {activeMenuId === a.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                  <div className="absolute right-0 top-7 w-32 bg-white border border-gray-100 shadow-church-elevated rounded-2xl z-20 py-1 text-left">
                                    <button onClick={() => { setActiveMenuId(null); setEditingAssignment(a); setIsModalOpen(true); }} className="w-full text-left px-3.5 py-2 text-xs font-bold text-church-charcoal hover:bg-gray-50 flex items-center">
                                      <Edit size={13} className="mr-2 text-church-muted" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(a.id)} className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center">
                                      <Trash2 size={13} className="mr-2" /> Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </SoftCard>

      <AssignmentFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        existingAssignment={editingAssignment} 
      />
      </div>
    </FeatureGate>
  );
}
