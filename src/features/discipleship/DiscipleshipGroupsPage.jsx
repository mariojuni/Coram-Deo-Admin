import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  ChevronRight,
  BookOpen,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDiscipleshipGroups } from './discipleshipGroupService';
import { canCreateDiscipleshipGroup } from '../../utils/discipleshipGroupPermissions';
import DiscipleshipGroupFormModal from './DiscipleshipGroupFormModal';
import SoftCard from '../../components/ui/SoftCard';

export default function DiscipleshipGroupsPage() {
  const navigate = useNavigate();
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const canCreate = canCreateDiscipleshipGroup(userProfile);

  const fetchGroups = async () => {
    if (!CHURCH_ID) return;
    setLoading(true);
    try {
      const data = await getDiscipleshipGroups(CHURCH_ID);
      setGroups(data);
    } catch (err) {
      console.error("Error fetching discipleship groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [CHURCH_ID]);

  const filteredGroups = groups.filter(g => {
    const matchesSearch = (g.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (g.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || g.groupType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#2C4A60] tracking-wider uppercase bg-[#EBF2F7] px-3 py-1 rounded-full border border-[#D5E3EC]">
            DISCIPLESHIP & FELLOWSHIP
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight mt-2 flex items-center">
            <Users className="mr-3 text-[#2C4A60]" size={28} />
            Small Groups & Discipleship
          </h1>
          <p className="text-xs sm:text-sm text-church-slate mt-1">
            Manage groups, leaders, member rosters, leader materials, and generate weekly meeting events.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => { setEditingGroup(null); setIsFormOpen(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#162533] hover:bg-[#1E2E3D] text-white text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Plus size={16} />
            <span>Create Group</span>
          </button>
        )}
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
        <button
          onClick={() => navigate('/admin/discipleship/groups')}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#162533] text-white shadow-xs"
        >
          Groups
        </button>
        <button
          onClick={() => navigate('/admin/discipleship/materials')}
          className="px-4 py-2 text-xs font-bold rounded-xl text-church-slate hover:bg-white/80 hover:text-church-navy transition-colors"
        >
          Leader Materials
        </button>
        <button
          onClick={() => navigate('/admin/discipleship/plans')}
          className="px-4 py-2 text-xs font-bold rounded-xl text-church-slate hover:bg-white/80 hover:text-church-navy transition-colors"
        >
          Discipleship Plans
        </button>
      </div>

      {/* Filters Bar */}
      <SoftCard className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200/80 rounded-xl text-xs font-medium text-church-navy focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter size={16} className="text-gray-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-gray-50/70 border border-gray-200/80 rounded-xl text-xs font-medium text-church-navy focus:outline-none focus:ring-2 focus:ring-[#2C4A60]/20 focus:border-[#2C4A60] transition-all"
          >
            <option value="all">All Group Types</option>
            <option value="small_group">Small Groups</option>
            <option value="discipleship">Discipleship Groups</option>
            <option value="bible_study">Bible Studies</option>
            <option value="youth_group">Youth Groups</option>
            <option value="other">Other</option>
          </select>
        </div>
      </SoftCard>

      {/* Groups Grid */}
      {loading ? (
        <SoftCard className="text-center py-16 text-gray-400 font-medium">Loading groups...</SoftCard>
      ) : filteredGroups.length === 0 ? (
        <SoftCard className="p-12 text-center">
          <div className="w-16 h-16 bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Users size={30} />
          </div>
          <h3 className="text-lg font-bold text-church-navy mb-1">No groups created yet.</h3>
          <p className="text-xs text-church-slate max-w-md mx-auto mb-6">
            Get started by creating your first Small Group or Discipleship Group to assign leaders and members.
          </p>
          {canCreate && (
            <button
              onClick={() => { setEditingGroup(null); setIsFormOpen(true); }}
              className="px-5 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Create Group Now
            </button>
          )}
        </SoftCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => (
            <SoftCard
              key={group.id}
              hover
              onClick={() => navigate(`/admin/discipleship/groups/${group.id}`)}
              className="p-6 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC] rounded-full">
                    {(group.groupType || 'small_group').replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    group.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {group.status || 'active'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-church-navy group-hover:text-[#2C4A60] transition-colors mb-2">
                  {group.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                  {group.description || 'No description provided.'}
                </p>

                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-church-slate">
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    <span>{group.meetingDay || 'Sunday'}s at {group.meetingTime || '18:00'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate">{group.meetingLocation || 'Location TBD'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs">
                <div className="flex items-center space-x-3 text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Shield size={12} className="text-[#2C4A60]" />
                    <span>{group.leaderMemberIds?.length || 0} Leaders</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users size={12} />
                    <span>{group.memberIds?.length || 0} Members</span>
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#2C4A60] group-hover:text-white text-gray-400 flex items-center justify-center transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            </SoftCard>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <DiscipleshipGroupFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        group={editingGroup}
        onSaved={fetchGroups}
      />
    </div>
  );
}
