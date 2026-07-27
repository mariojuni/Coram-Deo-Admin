import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Lock, 
  Globe, 
  Users, 
  Download, 
  Trash2,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getGroupMaterials, deleteGroupMaterial } from './discipleshipGroupService';
import { canUploadGroupMaterial } from '../../utils/discipleshipGroupPermissions';
import GroupMaterialUploadModal from './GroupMaterialUploadModal';

export default function DiscipleshipGroupMaterialsPage() {
  const navigate = useNavigate();
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const canUpload = canUploadGroupMaterial(userProfile);

  const fetchMaterials = async () => {
    if (!CHURCH_ID) return;
    setLoading(true);
    try {
      const data = await getGroupMaterials(CHURCH_ID);
      setMaterials(data);
    } catch (err) {
      console.error("Error fetching materials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [CHURCH_ID]);

  const handleDelete = async (m) => {
    if (window.confirm(`Delete material "${m.title}"?`)) {
      try {
        await deleteGroupMaterial(CHURCH_ID, m.id, m.storagePath);
        fetchMaterials();
      } catch (err) {
        alert("Failed to delete material: " + err.message);
      }
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = (m.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || m.materialType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-church-soft border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-church-navy flex items-center">
            <FileText className="mr-3 text-church-green" size={28} />
            Leader Materials & Guides
          </h1>
          <p className="text-sm text-church-slate mt-1">
            Repository of leader-only guides, member handouts, and discussion resources.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center justify-center px-5 py-3 bg-church-green text-white font-bold text-sm rounded-xl shadow-lg shadow-church-green/20 hover:bg-church-green/90 transition-all shrink-0"
          >
            <Plus size={18} className="mr-2" />
            Upload Material
          </button>
        )}
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => navigate('/admin/discipleship/groups')}
          className="px-4 py-2 text-xs font-bold rounded-xl text-church-slate hover:bg-gray-100"
        >
          Groups
        </button>
        <button
          onClick={() => navigate('/admin/discipleship/materials')}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-church-green text-white"
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

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-church-soft border border-gray-100">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search material title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="leader_guide">Leader Guides</option>
            <option value="member_handout">Member Handouts</option>
            <option value="discussion_guide">Discussion Guides</option>
            <option value="pdf">PDF Documents</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Materials Table/List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 font-medium">Loading materials...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-church-soft border border-gray-100 text-center">
          <FileText size={32} className="text-church-green mx-auto mb-3" />
          <h3 className="text-lg font-bold text-church-navy">No leader materials uploaded yet.</h3>
          <p className="text-xs text-gray-500 mt-1 mb-6">Upload leader guides and discussion outlines for your small group leaders.</p>
          {canUpload && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-2.5 bg-church-green text-white font-bold text-xs rounded-xl"
            >
              Upload Leader Material Now
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-church-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 uppercase text-[10px] font-bold text-gray-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMaterials.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-church-navy">{m.title}</p>
                      <p className="text-gray-400 text-[11px] truncate max-w-md">{m.description || 'No description'}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-church-navy capitalize">
                      {(m.materialType || 'leader_guide').replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.audience === 'leaders_only' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full font-bold text-[10px]">
                          <Lock size={10} />
                          <span>Leaders Only</span>
                        </span>
                      ) : m.audience === 'members' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full font-bold text-[10px]">
                          <Users size={10} />
                          <span>Members</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-bold text-[10px]">
                          <Globe size={10} />
                          <span>Public</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {m.fileUrl && (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-church-green/10 text-church-green font-bold rounded-lg hover:bg-church-green/20 flex items-center space-x-1"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <GroupMaterialUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={fetchMaterials}
      />
    </div>
  );
}
