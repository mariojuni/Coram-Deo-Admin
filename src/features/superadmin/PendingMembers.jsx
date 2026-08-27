import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, CheckCircle, Search, Link2Off } from 'lucide-react';
import ModernDropdown from '../../components/ui/ModernDropdown';

export default function PendingMembers() {
  const [users, setUsers] = useState([]);
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active'
  const [filterChurchId, setFilterChurchId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all users to filter locally (since there are multiple status fields used historically)
      const usersSnap = await getDocs(collection(db, 'users'));
      
      const allUsers = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter for active and pending
      const relevantUsers = allUsers.filter(u => 
        u.status === 'pending_church_link' || 
        u.membershipStatus === 'pending_church_link' ||
        u.status === 'Active' || 
        u.membershipStatus === 'Active'
      );

      setUsers(relevantUsers);

      // Fetch churches
      const churchesSnap = await getDocs(collection(db, 'churches'));
      const churchesData = churchesSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      // Sort alphabetically
      churchesData.sort((a, b) => a.name.localeCompare(b.name));
      setChurches(churchesData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignChurch = async (userId, churchId) => {
    if (!churchId) return;
    setProcessingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        churchId: churchId,
        status: 'Active',
        membershipStatus: 'Active'
      });
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, churchId, status: 'Active', membershipStatus: 'Active' }
          : u
      ));
    } catch (error) {
      console.error("Error assigning church:", error);
      alert("Failed to assign church. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnlink = async (userId) => {
    setProcessingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        churchId: null,
        status: 'pending_church_link',
        membershipStatus: 'pending_church_link'
      });
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, churchId: null, status: 'pending_church_link', membershipStatus: 'pending_church_link' }
          : u
      ));
    } catch (error) {
      console.error("Error unlinking user:", error);
      alert("Failed to unlink user. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const confirmAndAssign = (userId, churchId, userName) => {
    if (!churchId) return;
    const church = churches.find(c => c.id === churchId);
    if (window.confirm(`Are you sure you want to assign ${userName} to ${church?.name || 'this church'}?`)) {
      handleAssignChurch(userId, churchId);
    }
  };

  const confirmUnlink = (userId, userName) => {
    if (window.confirm(`Are you sure you want to unlink ${userName} from their current church?`)) {
      handleUnlink(userId);
    }
  };

  const displayedUsers = users.filter(u => {
    const isPending = u.status === 'pending_church_link' || u.membershipStatus === 'pending_church_link';
    const isActive = u.status === 'Active' || u.membershipStatus === 'Active';
    
    if (activeTab === 'pending' && !isPending) return false;
    if (activeTab === 'active' && !isActive) return false;

    if (activeTab === 'active' && filterChurchId && u.churchId !== filterChurchId) return false;

    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-church-navy">Global User Management</h1>
          <p className="text-sm text-church-slate mt-1">Assign unlinked accounts or manage existing member church links.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-church-soft border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          
          {/* Tabs */}
          <div className="flex space-x-2 bg-gray-50/50 p-1 rounded-2xl border border-gray-100/50">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-white text-church-navy shadow-sm'
                  : 'text-gray-500 hover:text-church-navy hover:bg-white/50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'active'
                  ? 'bg-white text-church-navy shadow-sm'
                  : 'text-gray-500 hover:text-church-navy hover:bg-white/50'
              }`}
            >
              Active
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1 justify-end">
            {activeTab === 'active' && (
              <div className="w-full md:w-64">
                <ModernDropdown
                  options={[{ value: '', label: 'All Churches' }, ...churches.map(c => ({ value: c.id, label: c.name }))]}
                  value={filterChurchId}
                  onChange={setFilterChurchId}
                  placeholder="Filter by Church"
                  searchable={true}
                />
              </div>
            )}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search ${activeTab} users...`}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-church-green/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-church-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-church-navy">No {activeTab === 'pending' ? 'Pending' : 'Active'} Accounts</h3>
            <p className="text-gray-500 mt-2 max-w-md">
              {activeTab === 'pending' 
                ? "There are currently no accounts waiting to be assigned to a church."
                : "There are no active users matching your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-4 font-bold text-gray-500 text-sm">User</th>
                  <th className="py-4 px-4 font-bold text-gray-500 text-sm">Contact Info</th>
                  {activeTab === 'active' && <th className="py-4 px-4 font-bold text-gray-500 text-sm">Current Church</th>}
                  <th className="py-4 px-4 font-bold text-gray-500 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((user) => {
                  const currentChurch = churches.find(c => c.id === user.churchId);
                  const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
                  
                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-church-green/10 text-church-green flex items-center justify-center font-bold mr-3">
                            {userName[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-church-navy">{userName}</p>
                            <p className="text-xs text-gray-500">{user.role || 'Member'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-700">{user.email || 'No email'}</p>
                        <p className="text-xs text-gray-500">{user.phoneNumber || 'No phone'}</p>
                      </td>
                      
                      {activeTab === 'active' && (
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                            {currentChurch?.name || 'Unknown Church'}
                          </span>
                        </td>
                      )}
                      
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {processingId === user.id ? (
                            <div className="w-4 h-4 border-2 border-church-green border-t-transparent rounded-full animate-spin"></div>
                          ) : activeTab === 'pending' ? (
                            <div className="w-56 text-left">
                              <ModernDropdown
                                options={churches.map(c => ({ value: c.id, label: c.name }))}
                                value=""
                                onChange={(val) => confirmAndAssign(user.id, val, userName)}
                                placeholder="Select Church..."
                                searchable={true}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 w-full justify-end">
                              <div className="w-56 text-left">
                                <ModernDropdown
                                  options={churches.map(c => ({ value: c.id, label: c.name }))}
                                  value={user.churchId || ""}
                                  onChange={(val) => {
                                    if (val !== user.churchId) confirmAndAssign(user.id, val, userName);
                                  }}
                                  placeholder="Re-assign Church..."
                                  searchable={true}
                                />
                              </div>
                              <button
                                onClick={() => confirmUnlink(user.id, userName)}
                                className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                                title="Unlink User"
                              >
                                <Link2Off size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
