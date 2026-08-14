import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Users, Trash2, Edit } from 'lucide-react';
import HouseholdFormModal from './HouseholdFormModal';

export default function HouseholdsList() {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState(null);

  useEffect(() => {
    if (!CHURCH_ID) return;
    const q = query(collection(db, 'households'), where('churchId', '==', CHURCH_ID));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHouseholds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [CHURCH_ID]);

  const handleAddClick = () => {
    setEditingHousehold(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (h) => {
    setEditingHousehold(h);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this household?')) {
      await deleteDoc(doc(db, 'households', id));
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-church-soft border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <h2 className="font-bold text-church-navy">Households</h2>
        <button 
          onClick={handleAddClick}
          className="flex items-center px-4 py-2 bg-church-green text-white rounded-full text-sm font-bold hover:bg-church-green/90"
        >
          <Plus size={16} className="mr-2" /> Add Household
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="border-b border-gray-200 text-xs font-bold text-church-slate uppercase tracking-wider">
              <th className="p-4 pl-6 bg-gray-50">Household Name</th>
              <th className="p-4 bg-gray-50">Members Count</th>
              <th className="p-4 text-right pr-6 bg-gray-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="3" className="p-8 text-center text-church-slate">Loading households...</td></tr>
            ) : households.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-16 text-center">
                  <div className="flex justify-center text-gray-300 mb-4"><Users size={40} /></div>
                  <p className="text-church-navy font-bold text-lg">No households found</p>
                </td>
              </tr>
            ) : (
              households.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6 font-bold text-church-navy">{h.name}</td>
                  <td className="p-4 text-church-slate">{h.memberIds?.length || 0} members</td>
                  <td className="p-4 text-right pr-6">
                    <button onClick={() => handleEditClick(h)} className="text-church-slate hover:text-church-navy p-2 mr-2">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(h.id)} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <HouseholdFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        household={editingHousehold}
      />
    </div>
  );
}
