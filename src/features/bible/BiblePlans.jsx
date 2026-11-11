import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, BookOpen, Edit, Trash2, Calendar, Clock, MoreVertical, Upload, Download, CheckSquare, Square, FileText, Globe } from 'lucide-react';
import BiblePlanFormModal from './BiblePlanFormModal';
import BiblePlanImportModal from './BiblePlanImportModal';
import { downloadJSONFile, buildJSONExportEnvelope } from '../../utils/jsonImportExport';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';

export default function BiblePlans() {
  const { currentUser, userProfile, activeChurchId, isLoading: isAuthLoading } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Action menu state
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (isAuthLoading) return;

    setLoading(true);
    setFetchError('');

    const CHURCH_ID = activeChurchId && activeChurchId !== 'system'
      ? activeChurchId
      : (userProfile?.churchId || null);

    let globalDocs = [];
    let legacyDocs = [];
    let churchDocs = [];

    const updateCombinedPlans = () => {
      const map = new Map();
      // Church-scoped docs first
      churchDocs.forEach(p => map.set(p.id, p));
      // Root legacy docs
      legacyDocs.forEach(p => map.set(p.id, p));
      // Global docs take precedence
      globalDocs.forEach(p => map.set(p.id, p));

      const combined = Array.from(map.values()).sort((a, b) => {
        const getTimestamp = (doc) => {
          if (doc.createdAt?.toMillis) return doc.createdAt.toMillis();
          if (doc.createdAt?.seconds) return doc.createdAt.seconds * 1000;
          if (doc.updatedAt?.toMillis) return doc.updatedAt.toMillis();
          if (doc.updatedAt?.seconds) return doc.updatedAt.seconds * 1000;
          if (typeof doc.createdAt === 'string') return new Date(doc.createdAt).getTime() || 0;
          return 0;
        };
        return getTimestamp(b) - getTimestamp(a);
      });

      setPlans(combined);
      setLoading(false);
    };

    // 1. Listen to global /plans
    const qPlans = query(collection(db, 'plans'));
    const unsubPlans = onSnapshot(qPlans, (snapshot) => {
      globalDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      updateCombinedPlans();
    }, (err) => {
      console.warn("Could not listen to /plans:", err);
    });

    // 2. Listen to legacy root /bible_plans
    const qLegacy = query(collection(db, 'bible_plans'));
    const unsubLegacy = onSnapshot(qLegacy, (legacySnap) => {
      legacyDocs = legacySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateCombinedPlans();
    }, (err) => {
      console.warn("Could not listen to /bible_plans:", err);
    });

    // 3. Listen to church-scoped /churches/{CHURCH_ID}/bible_plans
    let unsubChurch = () => {};
    if (CHURCH_ID) {
      const qChurch = query(collection(db, 'churches', CHURCH_ID, 'bible_plans'));
      unsubChurch = onSnapshot(qChurch, (churchSnap) => {
        churchDocs = churchSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        updateCombinedPlans();
      }, (err) => {
        console.warn("Could not listen to church bible_plans:", err);
      });
    }

    return () => {
      unsubPlans();
      unsubLegacy();
      unsubChurch();
    };
  }, [isAuthLoading, userProfile, activeChurchId]);

  const handleAddClick = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleEditClick = async (plan) => {
    setActiveMenuId(null);
    try {
      // Check if plan has subcollection /days
      const daysSnap = await getDocs(collection(db, 'plans', plan.id, 'days'));
      if (!daysSnap.empty) {
        const days = daysSnap.docs
          .map(d => d.data())
          .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
        setEditingPlan({ ...plan, days });
      } else {
        setEditingPlan(plan);
      }
    } catch (e) {
      console.warn("Could not load days subcollection, opening with doc data:", e);
      setEditingPlan(plan);
    }
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id, title) => {
    setActiveMenuId(null);
    if (window.confirm(`Are you sure you want to delete the plan "${title}"?`)) {
      try {
        try { await deleteDoc(doc(db, 'plans', id)); } catch (_) {}
        try { await deleteDoc(doc(db, 'bible_plans', id)); } catch (_) {}
        const CHURCH_ID = activeChurchId || userProfile?.churchId;
        if (CHURCH_ID) {
          try {
            await deleteDoc(doc(db, 'churches', CHURCH_ID, 'bible_plans', id));
          } catch (_) {}
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete plan.");
      }
    }
  };

  const handleSingleExport = async (plan) => {
    setActiveMenuId(null);
    let fullPlan = { ...plan };
    try {
      const daysSnap = await getDocs(collection(db, 'plans', plan.id, 'days'));
      if (!daysSnap.empty) {
        fullPlan.days = daysSnap.docs.map(d => d.data()).sort((a, b) => a.dayNumber - b.dayNumber);
      }
    } catch (e) {
      // Fallback
    }

    const envelope = buildJSONExportEnvelope('bible_plan', fullPlan);
    const safeTitle = plan.title ? plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'spiritual-plan';
    downloadJSONFile(envelope, `${safeTitle}-plan.json`);
  };

  const handleBulkExport = () => {
    const targetPlans = selectedPlanIds.length > 0
      ? plans.filter(p => selectedPlanIds.includes(p.id))
      : plans;

    if (targetPlans.length === 0) {
      alert('No plans available to export');
      return;
    }

    const envelope = buildJSONExportEnvelope('bible_plans_bulk', targetPlans);
    downloadJSONFile(envelope, `plans-bulk-${targetPlans.length}.json`);
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

  const toggleMenu = (id) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString(undefined, options);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'published':
      case 'active':
        return <StatusPill variant="emerald" dot className="text-[11px] py-0.5">Active</StatusPill>;
      case 'completed':
        return <StatusPill variant="slate" className="text-[11px] py-0.5">Completed</StatusPill>;
      case 'draft':
      default:
        return <StatusPill variant="amber" dot className="text-[11px] py-0.5">Draft</StatusPill>;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header aligned to CoramDeo Design System */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <StatusPill variant="rose" dot className="mb-2">
            Scripture & Devotionals
          </StatusPill>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-church-charcoal tracking-tight">Spiritual Growth & Devotional Plans</h1>
            <span className="bg-church-navy text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center">
              <Globe size={11} className="mr-1" /> Global Catalog
            </span>
          </div>
          <p className="text-sm text-church-slate mt-1">Manage guided scripture reading journeys, reading tracks, and devotions across church tenants.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button 
            onClick={handleBulkExport}
            disabled={plans.length === 0}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-church-charcoal rounded-full shadow-sm text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={15} className="mr-1.5 text-church-muted" />
            {selectedPlanIds.length > 0 ? `Export Selected (${selectedPlanIds.length})` : 'Export All JSON'}
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-church-charcoal rounded-full shadow-sm text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            <Upload size={15} className="mr-1.5 text-church-violet" />
            Import JSON
          </button>
          <GradientButton 
            onClick={handleAddClick}
            icon={Plus}
          >
            Create Plan
          </GradientButton>
        </div>
      </div>

      {plans.length > 0 && (
        <div className="flex justify-end pb-1">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-church-slate hover:text-church-charcoal px-3.5 py-1.5 rounded-full bg-white border border-gray-200/80 shadow-sm transition-all"
          >
            {selectedPlanIds.length === plans.length ? (
              <CheckSquare size={15} className="text-church-rose" />
            ) : (
              <Square size={15} className="text-gray-400" />
            )}
            {selectedPlanIds.length === plans.length ? 'Deselect All' : 'Select All for Export'}
          </button>
        </div>
      )}

      {fetchError ? (
        <SoftCard className="flex-1 flex items-center justify-center p-8 my-4">
          <div className="text-center max-w-md">
            <p className="text-rose-600 font-bold mb-2">⚠️ Could not load reading plans</p>
            <p className="text-xs text-church-slate">{fetchError}</p>
          </div>
        </SoftCard>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
            <p className="text-sm font-medium text-church-slate">Loading spiritual plans catalog...</p>
          </div>
        </div>
      ) : plans.length === 0 ? (
        <SoftCard className="p-12 flex flex-col items-center justify-center text-center flex-1 my-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-violet-50 text-church-rose flex items-center justify-center mb-4 border border-rose-100/60 shadow-sm">
            <BookOpen size={30} />
          </div>
          <h3 className="text-xl font-black text-church-charcoal mb-1">No spiritual plans published</h3>
          <p className="text-church-slate text-sm max-w-sm mb-6">Create a global Devotional or Bible reading plan to share scripture and devotions with your congregation.</p>
          <GradientButton 
            onClick={handleAddClick}
            icon={Plus}
          >
            Create Plan
          </GradientButton>
        </SoftCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map(plan => {
            const isSelected = selectedPlanIds.includes(plan.id);
            const isDevotional = plan.type === 'devotional' || plan.daysSummary?.some(d => d.hasDevotional);

            return (
              <SoftCard 
                key={plan.id} 
                hover
                className={`overflow-hidden flex flex-col relative group ${
                  isSelected ? 'ring-2 ring-church-rose border-church-rose/40' : ''
                }`}
              >
                {/* Header Banner */}
                <div className={`h-28 relative border-b border-gray-100 flex items-center justify-center ${
                  isDevotional ? 'bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white' : 'bg-gradient-to-br from-rose-50/70 via-violet-50/40 to-white'
                }`}>
                  <div 
                    onClick={() => toggleSelectPlan(plan.id)}
                    className="absolute top-3 left-3 bg-white/90 p-1.5 rounded-full cursor-pointer hover:bg-white shadow-sm border border-gray-100 transition-colors z-10"
                  >
                    {isSelected ? (
                      <CheckSquare size={16} className="text-church-rose" />
                    ) : (
                      <Square size={16} className="text-gray-400" />
                    )}
                  </div>

                  {isDevotional ? (
                    <FileText size={42} className="text-amber-500/30" />
                  ) : (
                    <BookOpen size={42} className="text-church-rose/25" />
                  )}

                  {/* Type Badge */}
                  <div className="absolute bottom-2 left-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isDevotional ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isDevotional ? '✍️ Devotional' : '📖 Bible Reading'}
                    </span>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="absolute top-3 right-3 z-10">
                    <button 
                      onClick={() => toggleMenu(plan.id)}
                      className="p-1.5 text-church-slate hover:text-church-charcoal bg-white/80 hover:bg-white rounded-full transition-colors shadow-sm border border-gray-100"
                      title="Plan Options"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenuId === plan.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-0 top-9 w-36 bg-white rounded-xl shadow-church-elevated border border-gray-100 z-20 py-1 overflow-hidden">
                          <button 
                            onClick={() => handleSingleExport(plan)}
                            className="w-full flex items-center px-4 py-2 text-xs font-semibold text-church-charcoal hover:bg-gray-50"
                          >
                            <Download size={14} className="mr-2 text-church-violet" /> Export JSON
                          </button>
                          <button
                            onClick={() => handleEditClick(plan)}
                            className="w-full flex items-center px-4 py-2 text-xs font-semibold text-church-charcoal hover:bg-gray-50"
                          >
                            <Edit size={14} className="mr-2 text-church-muted" /> Edit Plan
                          </button>
                          <button
                            onClick={() => handleDeleteClick(plan.id, plan.title)}
                            className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-church-charcoal group-hover:text-church-rose transition-colors line-clamp-1 leading-snug">
                        {plan.title}
                      </h3>
                      {plan.author && (
                        <p className="text-[11px] font-semibold text-church-muted">by {plan.author}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {renderStatusBadge(plan.status)}
                    </div>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-church-slate line-clamp-2 mb-4 flex-1 leading-relaxed">
                    {plan.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-col space-y-2.5 p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100/80 mt-auto">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs font-bold text-church-charcoal">
                        <Clock size={14} className="text-church-rose mr-1.5" />
                        {plan.durationDays || plan.daysSummary?.length || 0} Days Total
                      </div>
                      
                      <div className="text-[11px] font-bold text-church-violet bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100/60">
                        {plan.daysSummary?.length || plan.readings?.length || 0} Days Prepared
                      </div>
                    </div>
                    
                    {(plan.startDate || plan.endDate) && (
                      <div className="flex items-center text-xs font-medium text-church-slate pt-1 border-t border-gray-100/60">
                        <Calendar size={13} className="text-church-muted mr-1.5 shrink-0" />
                        <span className="truncate">
                          {plan.startDate ? formatDate(plan.startDate) : 'TBD'}
                          {plan.endDate && ` - ${formatDate(plan.endDate)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </SoftCard>
            );
          })}
        </div>
      )}

      <BiblePlanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={editingPlan}
      />

      <BiblePlanImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {}}
      />
    </div>
  );
}
