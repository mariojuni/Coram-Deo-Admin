import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, BookOpen, Clock, Upload, Download, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDiscipleshipPlans, deleteDiscipleshipPlan, exportDiscipleshipPlanJSON, exportDiscipleshipPlansBulkJSON } from './discipleshipService';
import DiscipleshipPlanFormModal from './DiscipleshipPlanFormModal';
import DiscipleshipImportModal from './DiscipleshipImportModal';
import { downloadJSONFile, buildJSONExportEnvelope } from '../../utils/jsonImportExport';
import SoftCard from '../../components/ui/SoftCard';

export default function DiscipleshipPlans() {
  const navigate = useNavigate();
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const fetchPlans = async () => {
    if (!CHURCH_ID) return;
    setLoading(true);
    try {
      const data = await getDiscipleshipPlans(CHURCH_ID);
      setPlans(data);
    } catch (error) {
      console.error("Error fetching discipleship plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [CHURCH_ID]);

  const handleAddClick = () => {
    setEditingPlan(null);
    setIsFormModalOpen(true);
  };

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleEditClick = (plan) => {
    setEditingPlan(plan);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the plan "${title}"? This will also delete all associated weeks.`)) {
      try {
        await deleteDiscipleshipPlan(CHURCH_ID, id);
        fetchPlans();
      } catch (error) {
        console.error("Error deleting plan:", error);
        alert("Failed to delete plan.");
      }
    }
  };

  const handleSingleExport = async (plan) => {
    try {
      setIsExporting(true);
      const fullPlan = await exportDiscipleshipPlanJSON(CHURCH_ID, plan.id);
      const envelope = buildJSONExportEnvelope('discipleship_plan', fullPlan);
      const safeTitle = plan.title ? plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'discipleship-plan';
      downloadJSONFile(envelope, `${safeTitle}-discipleship-plan.json`);
    } catch (err) {
      console.error(err);
      alert('Failed to export discipleship plan: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkExport = async () => {
    const idsToExport = selectedPlanIds.length > 0 ? selectedPlanIds : plans.map(p => p.id);
    if (idsToExport.length === 0) {
      alert('No plans available to export');
      return;
    }
    try {
      setIsExporting(true);
      const fullPlans = await exportDiscipleshipPlansBulkJSON(CHURCH_ID, idsToExport);
      const envelope = buildJSONExportEnvelope('discipleship_plans_bulk', fullPlans);
      downloadJSONFile(envelope, `discipleship-plans-bulk-${idsToExport.length}.json`);
    } catch (err) {
      console.error(err);
      alert('Failed to bulk export plans: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPlanIds.length === plans.length) {
      setSelectedPlanIds([]);
    } else {
      setSelectedPlanIds(plans.map(p => p.id));
    }
  };

  const toggleSelectPlan = (id) => {
    setSelectedPlanIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (!CHURCH_ID) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please select a church to view discipleship plans.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#2C4A60] tracking-wider uppercase bg-[#EBF2F7] px-3 py-1 rounded-full border border-[#D5E3EC]">
            CURRICULUM & STUDY
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight mt-2">Discipleship Plans</h1>
          <p className="text-xs sm:text-sm text-church-slate mt-1">Manage weekly discipleship study plans and curricula</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBulkExport}
            disabled={isExporting || plans.length === 0}
            className="inline-flex items-center bg-white border border-slate-200 text-church-navy px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold shadow-xs disabled:opacity-50"
          >
            <Download size={14} className="mr-1.5" />
            {selectedPlanIds.length > 0 ? `Export (${selectedPlanIds.length})` : 'Export All JSON'}
          </button>
          <button
            onClick={handleImportClick}
            className="inline-flex items-center bg-white border border-slate-200 text-church-navy px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold shadow-xs"
          >
            <Upload size={14} className="mr-1.5" />
            Import JSON
          </button>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-1.5 bg-[#162533] hover:bg-[#1E2E3D] text-white px-4 py-2 rounded-xl transition-all text-xs font-bold shadow-sm"
          >
            <Plus size={15} />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation & Selection Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/admin/discipleship/groups')}
            className="px-4 py-2 text-xs font-bold rounded-xl text-church-slate hover:bg-white/80 hover:text-church-navy transition-colors"
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
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#162533] text-white shadow-xs"
          >
            Discipleship Plans
          </button>
        </div>

        {plans.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-church-navy px-3 py-1.5 rounded-xl bg-gray-50/80 hover:bg-gray-100 border border-gray-200/60"
            >
              {selectedPlanIds.length === plans.length ? (
                <CheckSquare size={15} className="text-[#2C4A60]" />
              ) : (
                <Square size={15} />
              )}
              {selectedPlanIds.length === plans.length ? 'Deselect All' : 'Select All for Export'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <SoftCard className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#2C4A60] border-t-transparent rounded-full animate-spin"></div>
        </SoftCard>
      ) : plans.length === 0 ? (
        <SoftCard className="p-12 text-center">
          <div className="w-16 h-16 bg-[#EBF2F7] text-[#2C4A60] border border-[#D5E3EC] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
            <BookOpen size={30} />
          </div>
          <h3 className="text-xl font-bold text-church-navy mb-2">No Discipleship Plans</h3>
          <p className="text-church-slate text-xs mb-6 max-w-md mx-auto">
            Create a new weekly study plan to help members grow in their faith.
          </p>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-1.5 bg-[#162533] text-white px-5 py-2.5 rounded-xl hover:bg-[#1E2E3D] transition-all text-xs font-bold shadow-sm"
          >
            <Plus size={16} />
            <span>Create First Plan</span>
          </button>
        </SoftCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isSelected = selectedPlanIds.includes(plan.id);
            return (
              <SoftCard 
                key={plan.id} 
                className={`overflow-hidden border flex flex-col p-0 transition-all ${
                  isSelected ? 'border-[#2C4A60] ring-2 ring-[#2C4A60]/20' : ''
                }`}
              >
                <div className="relative">
                  <div 
                    onClick={() => toggleSelectPlan(plan.id)}
                    className="absolute top-3 left-3 z-10 bg-white/90 p-1.5 rounded-lg cursor-pointer hover:bg-white shadow-sm"
                  >
                    {isSelected ? (
                      <CheckSquare size={18} className="text-[#2C4A60]" />
                    ) : (
                      <Square size={18} className="text-gray-400" />
                    )}
                  </div>

                  {plan.coverImageUrl ? (
                    <div className="h-40 w-full relative">
                      <img src={plan.coverImageUrl} alt={plan.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          plan.status === 'published' ? 'bg-green-100 text-green-700' :
                          plan.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {plan.status?.toUpperCase() || 'DRAFT'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-church-green/20 to-blue-50 relative flex items-center justify-center">
                      <BookOpen size={48} className="text-church-green/40" />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          plan.status === 'published' ? 'bg-green-100 text-green-700' :
                          plan.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {plan.status?.toUpperCase() || 'DRAFT'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-church-navy mb-1 line-clamp-1">{plan.title}</h3>
                  {plan.subtitle && <p className="text-sm text-gray-500 mb-3 line-clamp-1">{plan.subtitle}</p>}
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                    {plan.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">
                      <Calendar size={14} className="mr-1.5" />
                      {plan.totalWeeks || 0} Weeks
                    </span>
                    {plan.category && (
                      <span className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">
                        {plan.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSingleExport(plan)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Export JSON"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleEditClick(plan)}
                        className="p-2 text-gray-400 hover:text-church-green hover:bg-church-green/10 rounded-lg transition-colors"
                        title="Edit Plan"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(plan.id, plan.title)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/discipleship/plans/${plan.id}`)}
                      className="text-sm font-bold text-[#2C4A60] hover:text-[#1D3547] flex items-center gap-1 hover:underline"
                    >
                      Manage Weeks →
                    </button>
                  </div>
                </div>
              </SoftCard>
            );
          })}
        </div>
      )}

      {isFormModalOpen && (
        <DiscipleshipPlanFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          plan={editingPlan}
          onSave={fetchPlans}
        />
      )}
      
      {isImportModalOpen && (
        <DiscipleshipImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={fetchPlans}
        />
      )}
    </div>
  );
}

