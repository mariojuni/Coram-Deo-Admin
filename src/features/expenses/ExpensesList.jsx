import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Receipt, Edit, Trash2, ArrowUpRight, TrendingDown } from 'lucide-react';
import ExpenseFormModal from './ExpenseFormModal';
import { useAuth } from '../../context/AuthContext';
import ModernDropdown from '../../components/ui/ModernDropdown';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function ExpensesList() {
  const { userProfile, formatCurrency } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [fundsMap, setFundsMap] = useState({});
  const [fundsList, setFundsList] = useState([]);
  const [selectedFundId, setSelectedFundId] = useState('all');
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!CHURCH_ID) return;
    const q = query(
      collection(db, 'givingExpenses'), 
      where('churchId', '==', CHURCH_ID)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      docs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setExpenses(docs);
      setLoading(false);
    }, (err) => {
      console.error("Expenses fetch error:", err);
      setLoading(false);
    });

    const fetchFunds = async () => {
      try {
        const qFunds = query(collection(db, 'givingFunds'), where('churchId', '==', CHURCH_ID));
        const unsubscribeFunds = onSnapshot(qFunds, (snap) => {
          const map = {};
          const list = [];
          snap.forEach(d => {
            const data = d.data();
            map[d.id] = data.name;
            if (data.status === 'active' && data.allowExpenses !== false) {
              list.push({ id: d.id, name: data.name });
            }
          });
          list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setFundsMap(map);
          setFundsList(list);
        });
        return unsubscribeFunds;
      } catch (err) {
        console.error("Error fetching funds:", err);
      }
    };

    const fetchCategories = async () => {
      try {
        const qCats = query(collection(db, 'expenseCategories'), where('churchId', '==', CHURCH_ID));
        const unsubscribeCats = onSnapshot(qCats, (snap) => {
          const list = [];
          snap.forEach(d => {
            const data = d.data();
            if (data.status === 'active') {
              list.push({ id: d.id, name: data.name });
            }
          });
          list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setCategoriesList(list);
        });
        return unsubscribeCats;
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    
    let unsubscribeFunds;
    let unsubscribeCats;
    fetchFunds().then(unsub => unsubscribeFunds = unsub);
    fetchCategories().then(unsub => unsubscribeCats = unsub);

    return () => {
      unsubscribe();
      if (unsubscribeFunds) unsubscribeFunds();
      if (unsubscribeCats) unsubscribeCats();
    };
  }, [CHURCH_ID]);

  const handleAddClick = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id, payee) => {
    if (window.confirm(`Are you sure you want to delete the expense for "${payee}"?`)) {
      try {
        await deleteDoc(doc(db, 'givingExpenses', id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete expense.");
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateObj = new Date(dateStr + 'T00:00:00'); 
    return dateObj.toLocaleDateString(undefined, options);
  };

  const mapFundIdToName = (fundId, fundType) => {
    if (fundId && fundsMap[fundId]) return fundsMap[fundId];
    if (fundType) return fundType;
    return 'General';
  };

  const filteredExpenses = expenses.filter(r => {
    if (selectedFundId !== 'all' && r.fundId !== selectedFundId) {
       const selectedFundName = fundsMap[selectedFundId] || '';
       if (r.fundType !== selectedFundName && r.fundId !== selectedFundId) {
          return false;
       }
    }
    if (selectedCategory !== 'all' && r.category !== selectedCategory) {
       return false;
    }
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-rose-500 tracking-wider uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            OPERATIONAL EXPENDITURES
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight mt-2">
            Expenses
          </h1>
          <p className="text-xs sm:text-sm text-church-slate mt-1">
            Track and manage church outflows, ministry receipts, and vendor payments.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <GradientButton 
            onClick={handleAddClick}
            icon={Plus}
          >
            Log Expense
          </GradientButton>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SoftCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-church-slate uppercase tracking-wider">Filtered Outflow</p>
            <p className="text-xl font-black text-rose-500 mt-1">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center">
            <ArrowUpRight size={20} />
          </div>
        </SoftCard>

        <SoftCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-church-slate uppercase tracking-wider">Expense Vouchers</p>
            <p className="text-xl font-black text-church-charcoal mt-1">{filteredExpenses.length} vouchers logged</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gray-50 text-church-slate border border-gray-100 flex items-center justify-center">
            <Receipt size={20} />
          </div>
        </SoftCard>
      </div>

      {/* Filter Row */}
      <SoftCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <ModernDropdown 
            value={selectedFundId} 
            onChange={(val) => setSelectedFundId(val)}
            options={[
              { value: 'all', label: 'All Funds' },
              ...fundsList.map(f => ({ value: f.id, label: f.name }))
            ]}
            className="w-full sm:w-56"
          />
          <ModernDropdown 
            value={selectedCategory} 
            onChange={(val) => setSelectedCategory(val)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categoriesList.map(c => ({ value: c.name, label: c.name }))
            ]}
            className="w-full sm:w-56"
          />
        </div>
      </SoftCard>

      {/* Table Section */}
      {loading ? (
        <SoftCard className="p-16 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-9 h-9 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
            <p className="text-sm font-semibold text-church-slate">Loading expenses...</p>
          </div>
        </SoftCard>
      ) : expenses.length === 0 ? (
        <SoftCard className="p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-4 border border-rose-100/60 shadow-sm">
            <Receipt size={30} />
          </div>
          <h3 className="text-lg font-black text-church-charcoal mb-1">No expenses logged</h3>
          <p className="text-church-slate text-sm max-w-sm mb-6">Record your first church expense to start tracking outflows.</p>
          <GradientButton onClick={handleAddClick} icon={Plus}>
            Log Expense
          </GradientButton>
        </SoftCard>
      ) : (
        <SoftCard className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-base font-extrabold text-church-charcoal">
              Expense Records ({filteredExpenses.length})
            </h2>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm border-b border-gray-100">
                <tr className="text-[11px] font-bold text-church-charcoal uppercase tracking-wider">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Payee & Purpose</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Source Fund</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Receipt</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="p-4 pl-6 whitespace-nowrap text-xs font-semibold text-church-slate">
                      {formatDate(expense.date)}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-church-charcoal">{expense.payee}</div>
                      {expense.description && (
                        <div className="text-xs text-church-muted line-clamp-1 mt-0.5">{expense.description}</div>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <StatusPill variant="slate">
                        {expense.category || 'General'}
                      </StatusPill>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <StatusPill variant="violet">
                        {mapFundIdToName(expense.fundId, expense.fundType)}
                      </StatusPill>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap font-black text-base text-rose-500">
                      -{formatCurrency(expense.amount)}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      {expense.receiptUrl ? (
                        <a 
                          href={expense.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-2 bg-rose-50 text-church-rose rounded-xl hover:bg-rose-100 transition-colors"
                          title="View Receipt"
                        >
                          <Receipt size={16} />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs font-bold">-</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button 
                          onClick={() => handleEditClick(expense)}
                          className="text-church-slate hover:text-church-charcoal p-2 rounded-xl hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(expense.id, expense.payee)}
                          className="text-church-slate hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SoftCard>
      )}

      <ExpenseFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expense={editingExpense}
      />
    </div>
  );
}
