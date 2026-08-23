import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Tags, Edit, Power, PowerOff } from 'lucide-react';
import ExpenseCategoryFormModal from './ExpenseCategoryFormModal';
import { canManageFinanceSettings } from '../../../utils/financePermissions';

export default function ExpenseCategoriesList() {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    if (!CHURCH_ID) return;
    
    const q = query(
      collection(db, 'expenseCategories'), 
      where('churchId', '==', CHURCH_ID)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      docs.sort((a, b) => {
        if (a.status === b.status) {
           return a.name.localeCompare(b.name);
        }
        if (a.status === 'active') return -1;
        if (b.status === 'active') return 1;
        if (a.status === 'inactive') return -1;
        return 1;
      });

      setCategories(docs);
      setLoading(false);
    }, (error) => {
      console.error("ExpenseCategoriesList error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [CHURCH_ID]);

  const handleAddClick = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (category) => {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${action} the ${category.name} category?`)) {
      try {
        await updateDoc(doc(db, 'expenseCategories', category.id), { status: newStatus });
      } catch (error) {
        console.error("Error toggling category status: ", error);
        alert(`Failed to ${action} category.`);
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active') return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">Active</span>;
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">Inactive</span>;
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-church-navy">Expense Categories</h1>
          <p className="text-sm text-church-slate mt-1">Manage categories used for logging church expenses.</p>
        </div>
        {canManageFinanceSettings(userProfile) && (
          <button 
            onClick={handleAddClick}
            className="flex items-center px-5 py-2.5 bg-church-green text-white rounded-full shadow-md text-sm font-medium hover:bg-church-green/90 transition-opacity"
          >
            <Plus size={18} className="mr-2" />
            Add Category
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-church-soft border border-gray-100 flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h2 className="text-lg font-bold text-church-navy">
            All Categories
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-church-bg/50 text-church-slate text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold rounded-tl-3xl">Category Name</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold rounded-tr-3xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-church-slate">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-church-slate flex flex-col items-center">
                    <Tags size={32} className="mb-3 text-gray-300" />
                    <p>No categories found. Create one to get started.</p>
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  return (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-church-navy">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(category.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canManageFinanceSettings(userProfile) && (
                          <>
                            <button 
                              onClick={() => handleEditClick(category)}
                              className="text-church-slate hover:text-church-navy p-1 rounded-md hover:bg-gray-100 transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            {category.status === 'active' ? (
                              <button 
                                onClick={() => handleToggleStatus(category)}
                                className="text-yellow-500 hover:text-yellow-600 p-1 rounded-md hover:bg-yellow-50 transition-colors"
                                title="Deactivate"
                              >
                                <PowerOff size={18} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleToggleStatus(category)}
                                className="text-green-500 hover:text-green-600 p-1 rounded-md hover:bg-green-50 transition-colors"
                                title="Activate"
                              >
                                <Power size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseCategoryFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        category={editingCategory}
      />
    </div>
  );
}
