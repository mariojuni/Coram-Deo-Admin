import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, CheckCircle, Search } from 'lucide-react';
import ModernDropdown from '../../components/ui/ModernDropdown';

export default function PendingMembers() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending users based on status
      const usersQuery = query(collection(db, 'users'), where('status', '==', 'pending_church_link'));
      const usersSnap = await getDocs(usersQuery);
      
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // In case they have an old schema or no status field, we might also want to fetch users where membershipStatus is pending_church_link
      const usersQuery2 = query(collection(db, 'users'), where('membershipStatus', '==', 'pending_church_link'));
      const usersSnap2 = await getDocs(usersQuery2);
      
      const usersData2 = usersSnap2.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Merge and deduplicate
      const allPending = [...usersData, ...usersData2].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
      setPendingUsers(allPending);

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
      // Remove from list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error assigning church:", error);
      alert("Failed to assign church. Please try again.");
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

  const filteredUsers = pendingUsers.filter(u => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-church-navy">Pending Accounts</h1>
          <p className="text-sm text-church-slate mt-1">Assign unlinked accounts to their corresponding churches.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-church-soft border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search pending users..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-church-green/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-church-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-church-navy">No Pending Accounts</h3>
            <p className="text-gray-500 mt-2 max-w-md">
              There are currently no accounts waiting to be assigned to a church.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-4 font-bold text-gray-500 text-sm">User</th>
                  <th className="py-4 px-4 font-bold text-gray-500 text-sm">Contact Info</th>
                  <th className="py-4 px-4 font-bold text-gray-500 text-sm">Created</th>
                  <th className="py-4 px-4 font-bold text-gray-500 text-sm text-right">Assign Church</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-church-green/10 text-church-green flex items-center justify-center font-bold mr-3">
                          {(user.name || user.firstName || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-church-navy">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</p>
                          <p className="text-xs text-gray-500">{user.role || 'Member'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-700">{user.email || 'No email'}</p>
                      <p className="text-xs text-gray-500">{user.phoneNumber || 'No phone'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-700">
                        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {processingId === user.id ? (
                          <div className="w-4 h-4 border-2 border-church-green border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <div className="w-56 text-left">
                            <ModernDropdown
                              options={churches.map(c => ({ value: c.id, label: c.name }))}
                              value=""
                              onChange={(val) => confirmAndAssign(user.id, val, user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim())}
                              placeholder="Select Church..."
                              searchable={true}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
