import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, BookOpen, Monitor, Mic, Guitar, Drum, Piano, GraduationCap, Shield, Music, Heart, Star, Settings, Check, X } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import Modal from '../../components/ui/Modal';

const normalizeRole = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const getRoleIcon = (roleName) => {
  const norm = normalizeRole(roleName);
  switch(norm) {
    case 'openingprayer': return <Users size={16} color="#818CF8" />;
    case 'tithesofferingprayer': return <BookOpen size={16} color="#4D8BFF" />;
    case 'techaudio': 
    case 'tech': 
    case 'audio': return <Monitor size={16} color="#6B7280" />;
    case 'presider': return <Users size={16} color="#FF6596" />;
    case 'scripturereading': return <BookOpen size={16} color="#F59E0B" />;
    case 'preacher': return <Mic size={16} color="#FF6596" />;
    case 'vocalist': return <Mic size={16} color="#818CF8" />;
    case 'bassguitar': return <Guitar size={16} color="#4D8BFF" />;
    case 'drummer': return <Drum size={16} color="#EF4444" />;
    case 'piano': return <Piano size={16} color="#10B981" />;
    case 'electricguitar': return <Guitar size={16} color="#F59E0B" />;
    case 'kids': return <GraduationCap size={16} color="#F59E0B" />;
    case 'youth': return <GraduationCap size={16} color="#4D8BFF" />;
    case 'adults': return <GraduationCap size={16} color="#10B981" />;
    default: return <Users size={16} color="#9CA3AF" />;
  }
};

const getRoleBg = (roleName) => {
  const norm = normalizeRole(roleName);
  switch(norm) {
    case 'openingprayer': return '#E0E7FF';
    case 'tithesofferingprayer': return '#E8F0FF';
    case 'techaudio': 
    case 'tech': 
    case 'audio': return '#F3F4F6';
    case 'presider': return '#FFE8F0';
    case 'scripturereading': return '#FEF3C7';
    case 'preacher': return '#FFE8F0';
    case 'vocalist': return '#E0E7FF';
    case 'bassguitar': return '#E8F0FF';
    case 'drummer': return '#FEE2E2';
    case 'piano': return '#D1FAE5';
    case 'electricguitar': return '#FEF3C7';
    case 'kids': return '#FEF3C7';
    case 'youth': return '#E8F0FF';
    case 'adults': return '#D1FAE5';
    default: return '#F3F4F6';
  }
};

const PALETTE = [
  '#E0E7FF', '#E8F0FF', '#F3F4F6', '#FFE8F0', '#FEF3C7', '#FEE2E2', '#D1FAE5', '#F3EEFF'
];

const ICON_COLORS = {
  '#E0E7FF': '#818CF8',
  '#E8F0FF': '#4D8BFF',
  '#F3F4F6': '#6B7280',
  '#FFE8F0': '#FF6596',
  '#FEF3C7': '#F59E0B',
  '#FEE2E2': '#EF4444',
  '#D1FAE5': '#10B981',
  '#F3EEFF': '#A855F7'
};

const AVAILABLE_ICONS = [
  { name: 'Users', Icon: Users },
  { name: 'BookOpen', Icon: BookOpen },
  { name: 'Monitor', Icon: Monitor },
  { name: 'Mic', Icon: Mic },
  { name: 'Music', Icon: Music },
  { name: 'Guitar', Icon: Guitar },
  { name: 'Drum', Icon: Drum },
  { name: 'Piano', Icon: Piano },
  { name: 'GraduationCap', Icon: GraduationCap },
  { name: 'Heart', Icon: Heart },
  { name: 'Star', Icon: Star },
  { name: 'Settings', Icon: Settings },
];

export default function MinistryFormModal({ isOpen, onClose, ministry = null }) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    status: 'Active',
    features: {
      songListEnabled: false
    }
  });

  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [roleStyles, setRoleStyles] = useState({});
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState('Users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (ministry) {
      setFormData({
        name: ministry.name || '',
        description: ministry.description || '',
        type: ministry.type || 'general',
        status: ministry.status || 'Active',
        features: {
          songListEnabled: ministry.features?.songListEnabled || false,
          ...ministry.features
        }
      });
      setRoles(ministry.roles || []);
      setRoleStyles(ministry.roleStyles || {});
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'general',
        status: 'Active',
        features: {
          songListEnabled: false
        }
      });
      setRoles([]);
      setRoleStyles({});
    }
    setActiveTab('general');
    setError('');
  }, [ministry, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRole = (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    if (roles.includes(newRole.trim())) {
      setError('Role already exists');
      return;
    }

    const trimmed = newRole.trim();
    setRoles([...roles, trimmed]);
    setRoleStyles({
      ...roleStyles,
      [trimmed]: {
        backgroundColor: selectedColor,
        iconName: selectedIcon,
        iconColor: ICON_COLORS[selectedColor] || '#4B5563'
      }
    });

    setNewRole('');
    setError('');
  };

  const handleRemoveRole = (roleToRemove) => {
    setRoles(roles.filter(r => r !== roleToRemove));
    const nextStyles = { ...roleStyles };
    delete nextStyles[roleToRemove];
    setRoleStyles(nextStyles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Ministry Name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        roles,
        roleStyles,
        churchId: userProfile?.churchId || null,
        updatedAt: serverTimestamp()
      };

      if (ministry) {
        await updateDoc(doc(db, 'ministries', ministry.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        payload.members = [];
        await addDoc(collection(db, 'ministries'), payload);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save ministry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ministry ? 'Edit Ministry' : 'Create Ministry'}
      subtitle="Configure church departments, custom service roles, and member permission sets"
      icon={Shield}
      maxWidth="xl"
      footer={
        <>
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-98"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="ministry-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#162533] hover:bg-[#1E2E3D] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-[#162533]/20 active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Saving...' : ministry ? 'Save Changes' : 'Create Ministry'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 text-red-600 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-white rounded-2xl border border-slate-200/80 p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'general' ? 'bg-[#162533] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            General Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'features' ? 'bg-[#162533] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Feature Permissions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'roles' ? 'bg-[#162533] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Roles ({roles.length})
          </button>
        </div>

        <form id="ministry-form" onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'general' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ministry Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="e.g. Praise and Worship Ministry" 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ministry Type *</label>
                <ModernDropdown
                  value={formData.type}
                  onChange={(val) => handleChange({ target: { name: 'type', value: val } })}
                  options={[
                    { value: 'worship', label: 'Worship (Music & Praise)' },
                    { value: 'ushers', label: 'Ushers & Greeters' },
                    { value: 'prayer', label: 'Prayer Ministry' },
                    { value: 'teaching', label: 'Teaching & Preaching' },
                    { value: 'youth', label: 'Youth Ministry' },
                    { value: 'children', label: 'Children\'s Ministry' },
                    { value: 'media', label: 'Media & Tech' },
                    { value: 'general', label: 'General Ministry' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea 
                  name="description" 
                  rows="3" 
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="Explain the purpose and ministry responsibilities..." 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#2C4A60] focus:ring-4 focus:ring-[#2C4A60]/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 transition-all placeholder-slate-400 shadow-2xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                <ModernDropdown
                  value={formData.status}
                  onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                  options={[
                    { value: 'Active', label: 'Active Ministry' },
                    { value: 'Archived', label: 'Archived' }
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Configure module privileges and tools unlocked for rostered members of this ministry.
              </p>
              
              {formData.type === 'worship' ? (
                <label className="flex items-start space-x-3 cursor-pointer p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                  <input 
                    type="checkbox"
                    checked={formData.features?.songListEnabled || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      features: { ...prev.features, songListEnabled: e.target.checked }
                    }))}
                    className="w-4 h-4 text-[#2C4A60] rounded border-slate-300 focus:ring-[#2C4A60] mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Worship Song List & Chord Chart Access</span>
                    <span className="text-[11px] text-slate-500">Allow members to view the church song repository, setlists, and chord charts.</span>
                  </div>
                </label>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400 font-medium text-center">
                  No specialized features for this ministry type yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap gap-2">
                {roles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No roles configured yet. Add role names below.</p>
                ) : (
                  roles.map(role => {
                    const style = roleStyles[role];
                    const bg = style?.backgroundColor || getRoleBg(role);
                    const SelectedIconComp = style?.iconName ? AVAILABLE_ICONS.find(i => i.name === style.iconName)?.Icon : null;
                    const iconColor = style?.iconColor || ICON_COLORS[bg] || '#4B5563';
                    const iconNode = SelectedIconComp ? <SelectedIconComp size={14} color={iconColor} /> : getRoleIcon(role);
                    
                    return (
                      <div 
                        key={role} 
                        className="flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-2xs border border-black/5"
                        style={{ backgroundColor: bg }}
                      >
                        <span className="mr-1.5 opacity-90">{iconNode}</span>
                        <span className="text-slate-800">{role}</span>
                        <button type="button" onClick={() => handleRemoveRole(role)} className="ml-2 text-slate-400 hover:text-slate-700 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                <input 
                  type="text" 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)} 
                  placeholder="New Role Name (e.g. Lead Guitarist, Backup Singer)" 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2C4A60]/10 focus:border-[#2C4A60] transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRole(e); } }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Color Tag</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTE.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className="w-6 h-6 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-110"
                          style={{ backgroundColor: color }}
                        >
                          {selectedColor === color && <Check size={12} color="#1F2937" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Icon</label>
                    <ModernDropdown
                      value={selectedIcon}
                      onChange={(val) => setSelectedIcon(val)}
                      options={AVAILABLE_ICONS.map(icon => ({ value: icon.name, label: icon.name }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button 
                    type="button" 
                    onClick={handleAddRole} 
                    className="px-4 py-2 bg-[#162533] text-white rounded-xl text-xs font-bold hover:bg-[#1E2E3D] transition-all shadow-xs"
                  >
                    Add Role
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}
