import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Plus, MoreVertical, Edit, Archive, Users, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MinistryFormModal from './MinistryFormModal';
import MinistryApplicationsList from './MinistryApplicationsList';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function MinistriesList() {
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [activeTab, setActiveTab] = useState('ministries');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (!userProfile) return;
    if (!CHURCH_ID) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'ministries'), 
      where('churchId', '==', CHURCH_ID)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      docs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setMinistries(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching ministries:", error);
      alert(`Error fetching ministries: ${error.message}`);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userProfile?.churchId]);

  const filteredMinistries = ministries.filter(m => {
    const searchMatch = m.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const statusMatch = filterStatus === 'All' ? true : m.status === filterStatus;
    return searchMatch && statusMatch;
  });

  const handleAddClick = () => {
    setSelectedMinistry(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (e, ministry) => {
    e.stopPropagation();
    setSelectedMinistry(ministry);
    setIsFormOpen(true);
    setActiveMenuId(null);
  };

  const handleArchiveClick = async (e, ministry) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (window.confirm(`Are you sure you want to archive ${ministry.name}?`)) {
      try {
        await updateDoc(doc(db, 'ministries', ministry.id), {
          status: 'Archived',
          updatedAt: new Date()
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header aligned to CoramDeo Design System */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <StatusPill variant="rose" dot className="mb-2">
            Ministry Teams & Service
          </StatusPill>
          <h1 className="text-3xl font-black text-church-charcoal tracking-tight">Ministries</h1>
          <p className="text-sm text-church-slate mt-1">Organize volunteer teams, leadership roles, and review membership applications.</p>
        </div>
        
        {activeTab === 'ministries' && (
          <GradientButton 
            onClick={handleAddClick}
            icon={Plus}
          >
            Create Ministry
          </GradientButton>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-100 flex space-x-8">
        <button
          onClick={() => setActiveTab('ministries')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'ministries'
              ? 'border-church-rose text-church-rose'
              : 'border-transparent text-church-slate hover:text-church-charcoal'
          }`}
        >
          All Ministries
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'applications'
              ? 'border-church-rose text-church-rose'
              : 'border-transparent text-church-slate hover:text-church-charcoal'
          }`}
        >
          Applications
        </button>
      </div>

      {activeTab === 'applications' ? (
        <MinistryApplicationsList />
      ) : (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <SoftCard className="p-3">
            <div className="flex items-center space-x-4 flex-1 flex-wrap gap-y-2">
              <div className="relative w-80 max-w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Search size={17} className="text-church-muted" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50/70 hover:bg-gray-50 border border-gray-200/80 rounded-full text-sm text-church-charcoal placeholder-church-muted focus:outline-none focus:ring-2 focus:ring-church-rose/20 focus:border-church-rose transition-all"
                  placeholder="Search ministries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-church-slate uppercase tracking-wider">Status:</span>
                <ModernDropdown
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val)}
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Archived', label: 'Archived' },
                    { value: 'All', label: 'All Ministries' }
                  ]}
                />
              </div>
            </div>
          </SoftCard>

          {/* Cards Grid */}
          <div>
            {loading ? (
              <div className="py-20 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-9 h-9 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
                  <p className="text-sm font-medium text-church-slate">Loading ministries...</p>
                </div>
              </div>
            ) : filteredMinistries.length === 0 ? (
              <SoftCard className="p-16 text-center my-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-4 mx-auto border border-rose-100/60 shadow-sm">
                  <Shield size={30} />
                </div>
                <p className="text-church-charcoal font-black text-lg">No ministries found</p>
                <p className="text-church-slate text-sm mt-1 mb-6">Create a new ministry to begin organizing volunteer teams.</p>
                <GradientButton 
                  onClick={handleAddClick}
                  icon={Plus}
                >
                  Create Ministry
                </GradientButton>
              </SoftCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMinistries.map(ministry => (
                  <SoftCard 
                    key={ministry.id} 
                    hover
                    onClick={() => navigate(`/admin/ministries/${ministry.id}`)}
                    className="p-6 flex flex-col relative group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose border border-rose-100/60 flex items-center justify-center shadow-sm">
                        <Shield size={24} />
                      </div>
                      
                      <button 
                        onClick={(e) => toggleMenu(e, ministry.id)}
                        className="text-church-slate hover:text-church-charcoal p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenuId === ministry.id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                          <div className="absolute right-6 top-10 mt-1 w-40 bg-white rounded-xl shadow-church-elevated border border-gray-100 z-30 py-1 text-left overflow-hidden">
                            <button onClick={(e) => handleEditClick(e, ministry)} className="w-full flex items-center px-4 py-2 text-xs font-semibold text-church-charcoal hover:bg-gray-50">
                              <Edit size={14} className="mr-2 text-church-muted" /> Edit Details
                            </button>
                            {ministry.status !== 'Archived' && (
                              <button onClick={(e) => handleArchiveClick(e, ministry)} className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border-t border-gray-50 mt-1">
                                <Archive size={14} className="mr-2" /> Archive
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-church-charcoal group-hover:text-church-rose transition-colors">{ministry.name}</h3>
                    <p className="text-xs sm:text-sm text-church-slate mt-1 line-clamp-2 min-h-[40px] leading-relaxed">{ministry.description || 'No description provided.'}</p>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center text-xs font-semibold text-church-slate">
                        <Users size={14} className="mr-1.5 text-church-muted" />
                        {ministry.members?.length || 0} Members
                      </div>
                      
                      <StatusPill 
                        variant={ministry.status === 'Active' ? 'emerald' : 'slate'} 
                        dot 
                        className="text-[11px] py-0.5"
                      >
                        {ministry.status || 'Active'}
                      </StatusPill>
                    </div>
                  </SoftCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <MinistryFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        ministry={selectedMinistry}
      />
    </div>
  );
}

