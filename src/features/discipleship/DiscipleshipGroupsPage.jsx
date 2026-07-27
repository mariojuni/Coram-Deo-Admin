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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-church-navy flex items-center">
            <Users className="mr-3 text-church-green" size={28} />
            Small Groups & Discipleship
          </h1>
          <p className="text-sm text-church-slate mt-1">
            Manage groups, leaders, member rosters, leader materials, and generate weekly meeting events.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => { setEditingGroup(null); setIsFormOpen(true); }}
            className="flex items-center justify-center px-5 py-3 bg-church-green text-white font-bold text-sm rounded-xl shadow-lg shadow-church-green/20 hover:bg-church-green/90 transition-all shrink-0"
          >
            <Plus size={18} className="mr-2" />
            Create Group
          </button>
        )}
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => navigate('/admin/discipleship/groups')}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-church-green text-white"
        >
          Groups
        </button>
        <button
          onClick={() => navigate('/admin/discipleship/materials')}
          className="px-4 py-2 text-xs font-bold rounded-xl text-church-slate hover:bg-gray-100"
        >
          Leader Materials
        </button>
        <button
          onClick={() => navigate('/admin/discipleship/plans')}
          className="px-4 py-2 text-xs font-bold rounded-xl text-church-slate hover:bg-gray-100"
        >
          Discipleship Plans
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-church-soft border border-gray-100">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none focus:ring-2 focus:ring-church-green/20"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter size={16} className="text-gray-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
          >
            <option value="all">All Group Types</option>
            <option value="small_group">Small Groups</option>
            <option value="discipleship">Discipleship Groups</option>
            <option value="bible_study">Bible Studies</option>
            <option value="youth_group">Youth Groups</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 font-medium">Loading groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-church-soft border border-gray-100 text-center">
          <div className="w-16 h-16 bg-church-green/10 text-church-green rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-church-navy mb-1">No groups created yet.</h3>
          <p className="text-xs text-church-slate max-w-md mx-auto mb-6">
            Get started by creating your first Small Group or Discipleship Group to assign leaders and members.
          </p>
          {canCreate && (
            <button
              onClick={() => { setEditingGroup(null); setIsFormOpen(true); }}
              className="px-5 py-2.5 bg-church-green text-white font-bold text-xs rounded-xl shadow-md hover:bg-church-green/90"
            >
              Create Group Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => (
            <div
              key={group.id}
              onClick={() => navigate(`/admin/discipleship/groups/${group.id}`)}
              className="bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100 hover:shadow-lg hover:border-church-green/30 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-church-green/10 text-church-green rounded-full">
                    {(group.groupType || 'small_group').replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    group.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {group.status || 'active'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-church-navy group-hover:text-church-green transition-colors mb-2">
                  {group.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                  {group.description || 'No description provided.'}
                </p>

                <div className="space-y-2 pt-2 border-t border-gray-50 text-xs text-church-slate">
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
                    <Shield size={12} className="text-church-green" />
                    <span>{group.leaderMemberIds?.length || 0} Leaders</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users size={12} />
                    <span>{group.memberIds?.length || 0} Members</span>
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-church-green group-hover:text-white text-gray-400 flex items-center justify-center transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
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
