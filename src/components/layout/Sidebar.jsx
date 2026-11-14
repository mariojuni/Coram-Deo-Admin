import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  HeartHandshake, 
  Settings,
  X,
  Shield,
  LayoutDashboard,
  ClipboardCheck,
  Megaphone,
  Building,
  Activity,
  CalendarDays,
  ChevronDown,
  Check,
  BookOpenCheck,
  Music,
  ListMusic,
  Search,
  ChevronRight,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole, hasRole, getPrimaryRole } from '../../utils/permissions';
import { useSubscriptionLimits } from '../../features/subscription/hooks/useSubscriptionLimits';
import UpgradeModal from '../../features/subscription/components/UpgradeModal';
import { subscribeToPendingPayments } from '../../services/billingLedgerService';
import { CathedralLogo, BibleIcon, CommunityIcon, ServeIcon } from '../ui/icons';

const churchNavCategories = [
  {
    category: 'CORE',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader', 'finance_admin', 'secretary'] },
      { name: 'Events', path: '/admin/events', icon: Calendar, roles: ['super_admin', 'church_admin', 'secretary', 'pastor'] },
      { name: 'Scheduling', path: '/admin/schedules', icon: CalendarDays, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader'], featureKey: 'scheduling', requiredTier: 'growth' },
      { name: 'Attendance', path: '/admin/attendance', icon: ClipboardCheck, roles: ['super_admin', 'church_admin', 'secretary', 'pastor'] },
    ]
  },
  {
    category: 'MINISTRY & WORD',
    items: [
      { name: 'Songs & Lyrics', path: '/admin/worship/songs', icon: Music, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader'] },
      { name: 'Setlists', path: '/admin/worship/setlists', icon: ListMusic, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader'], featureKey: 'worshipSetlists', requiredTier: 'growth' },
      { name: 'Sermons', path: '/admin/sermons', icon: BookOpen, roles: ['super_admin', 'church_admin', 'pastor'] },
      { name: 'Discipleship', path: '/admin/discipleship/groups', icon: CommunityIcon, roles: ['super_admin'] },
    ]
  },
  {
    category: 'PEOPLE & CARE',
    items: [
      { name: 'Members', path: '/admin/members', icon: CommunityIcon, roles: ['super_admin', 'church_admin', 'secretary', 'pastor'] },
      { name: 'Ministries', path: '/admin/ministries', icon: ServeIcon, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader'] },
      { name: 'Prayer Requests', path: '/admin/prayer', icon: HeartHandshake, roles: ['super_admin', 'church_admin', 'pastor'] },
      { name: 'Announcements', path: '/admin/announcements', icon: Megaphone, roles: ['super_admin', 'church_admin', 'secretary', 'pastor'] },
    ]
  },
  {
    category: 'FINANCE & ADMIN',
    items: [
      { name: 'Finance & Giving', path: '/admin/finance', icon: CreditCard, roles: ['super_admin', 'church_admin', 'finance_admin', 'pastor'] },
      { name: 'Reports', path: '/admin/reports', icon: Activity, roles: ['super_admin', 'church_admin', 'pastor', 'finance_admin'] },
      { name: 'Settings', path: '/admin/settings', icon: Settings, roles: ['super_admin', 'church_admin'] },
    ]
  }
];

const systemNavItems = [
  { name: 'Churches', path: '/super-admin/churches', icon: Building, roles: ['super_admin'] },
  { name: 'Billing & Ledger', path: '/super-admin/ledger', icon: CreditCard, roles: ['super_admin'] },
  { name: 'Global User Management', path: '/super-admin/pending-members', icon: CommunityIcon, roles: ['super_admin'] },
  { name: 'Bible & Devotional Plans', path: '/super-admin/bible', icon: BibleIcon, roles: ['super_admin'] },
  { name: 'Bible Library', path: '/admin/bible-library', icon: BibleIcon, roles: ['super_admin'] },
  { name: 'Global Roles', path: '/super-admin/settings/roles', icon: Shield, roles: ['super_admin'] },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { activeChurchId, setActiveChurchId, originalUserProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [churches, setChurches] = useState([]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [churchSearch, setChurchSearch] = useState('');
  const limits = useSubscriptionLimits();
  const [upgradeModal, setUpgradeModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetTier: 'growth'
  });

  const isSuperAdmin = hasRole(originalUserProfile, 'super_admin');
  const primaryRole = getPrimaryRole(originalUserProfile);

  useEffect(() => {
    if (isSuperAdmin) {
      const fetchChurches = async () => {
        try {
          const snap = await getDocs(query(collection(db, 'churches'), orderBy('name', 'asc')));
          setChurches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
          console.error("Error fetching churches in Sidebar:", error);
        }
      };
      fetchChurches();
    }
  }, [isSuperAdmin]);

  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const unsub = subscribeToPendingPayments((list) => {
      setPendingPaymentsCount(list.length);
    });
    return () => unsub();
  }, [isSuperAdmin]);

  const activeChurchName = activeChurchId === 'system' 
    ? 'System Administration' 
    : (churches.find(c => c.id === activeChurchId)?.name || 'Local Church Workspace');

  const filteredChurches = churches.filter(c => 
    (c.name || '').toLowerCase().includes(churchSearch.toLowerCase())
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 glass-light-shell rounded-3xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:h-[calc(100vh-2rem)] flex flex-col overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top Header & Brand Mark */}
        <div className="flex items-center justify-between h-20 px-6 shrink-0 border-b border-white/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/30 flex items-center justify-center shadow-church-soft p-0.5 overflow-hidden">
              <CathedralLogo size={36} />
            </div>
            <div>
              <span className="text-lg font-black text-brand-dark tracking-tight">CoramDeo</span>
              <span className="ml-1.5 text-[10px] font-bold text-[#2C4A60] bg-[#EBF2F7] px-2 py-0.5 rounded-full border border-[#D5E3EC] uppercase tracking-wider">
                Admin
              </span>
            </div>
          </div>
          <button 
            className="lg:hidden text-gray-400 hover:text-brand-dark p-1.5 rounded-xl hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Church / Workspace Switcher (for Super Admin) */}
        {isSuperAdmin && (
          <div className="px-5 pt-4 pb-2 relative shrink-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 flex items-center justify-between">
              <span>Active Workspace</span>
              <span className={`w-2 h-2 rounded-full ${activeChurchId === 'system' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            </div>
            <button 
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="w-full bg-white/75 backdrop-blur-md border border-white/90 hover:bg-white text-brand-dark text-xs rounded-2xl px-3.5 py-2.5 font-bold flex items-center justify-between transition-all duration-150 shadow-2xs"
            >
              <div className="flex items-center truncate">
                <div className={`w-6 h-6 rounded-lg ${activeChurchId === 'system' ? 'bg-indigo-100 text-brand-primary' : 'bg-blue-100 text-brand-primary'} flex items-center justify-center mr-2 shrink-0`}>
                  <Building size={13} />
                </div>
                <span className="truncate">{activeChurchName}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isSwitcherOpen && (
              <div className="absolute top-full mt-1.5 left-5 right-5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-church-elevated border border-white/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 pt-1 pb-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search church..."
                      value={churchSearch}
                      onChange={(e) => setChurchSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary-light focus:border-brand-primary-light"
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveChurchId('system');
                      setIsSwitcherOpen(false);
                      navigate('/super-admin/churches');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-colors ${activeChurchId === 'system' ? 'bg-indigo-50 text-brand-primary font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="truncate pr-2">System Administration</span>
                    {activeChurchId === 'system' && <Check size={14} className="text-brand-primary shrink-0" />}
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  {filteredChurches.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveChurchId(c.id);
                        setIsSwitcherOpen(false);
                        navigate('/admin');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-colors ${activeChurchId === c.id ? 'bg-blue-50 text-brand-primary font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span className="truncate pr-2">{c.name}</span>
                      {activeChurchId === c.id && <Check size={14} className="text-brand-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Categories */}
        <nav className="flex-1 px-3.5 py-2.5 overflow-y-auto space-y-4 custom-scrollbar">
          {activeChurchId === 'system' ? (
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ml-2">
                System Administration
              </div>
              <div className="space-y-1">
                {systemNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all duration-200 ${
                          isActive
                            ? 'glass-nav-active font-extrabold text-[#2C4A60]'
                            : 'text-slate-600 hover:bg-white/50 hover:text-brand-dark font-semibold'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                                isActive
                                  ? 'bg-[#EBF2F7] text-[#2C4A60]'
                                  : 'bg-white/60 text-slate-500 group-hover:bg-white group-hover:text-brand-dark shadow-2xs'
                              }`}
                            >
                              <Icon size={15} strokeWidth={2.2} />
                            </div>
                            <span className="truncate">{item.name}</span>
                            {item.name === 'Billing & Ledger' && pendingPaymentsCount > 0 && (
                              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
                                isActive ? 'bg-[#EBF2F7] text-[#2C4A60] shadow-xs' : 'bg-amber-500 text-white animate-pulse'
                              }`}>
                                {pendingPaymentsCount}
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            size={13}
                            strokeWidth={isActive ? 2.6 : 2.2}
                            className={`shrink-0 transition-all ${
                              isActive ? 'text-[#2C4A60]' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                            }`}
                          />
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ) : (
            churchNavCategories.map((cat) => {
              const accessibleItems = cat.items.filter(item =>
                hasAnyRole(originalUserProfile, item.roles)
              );

              if (accessibleItems.length === 0) return null;

              return (
                <div key={cat.category}>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ml-2">
                    {cat.category}
                  </div>
                  <div className="space-y-1">
                    {accessibleItems.map((item) => {
                      const Icon = item.icon;
                      const isDiscipleshipActive = item.name === 'Discipleship' && location.pathname.startsWith('/admin/discipleship');
                      const isLocked = !isSuperAdmin && item.featureKey && !limits.hasFeature(item.featureKey);

                      return (
                        <NavLink
                          key={item.name}
                          to={item.path}
                          end={item.path === '/admin'}
                          onClick={(e) => {
                            if (isLocked) {
                              e.preventDefault();
                              setUpgradeModal({
                                isOpen: true,
                                title: `Unlock ${item.name}`,
                                message: `${item.name} is available on the Growth Ministry and Kingdom Network tiers. Upgrade your plan to unlock team scheduling and worship tools.`,
                                targetTier: item.requiredTier || 'growth'
                              });
                            } else {
                              setIsOpen(false);
                            }
                          }}
                          className={({ isActive }) => {
                            const isCurrent = isActive || isDiscipleshipActive;
                            return `group flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all duration-200 ${
                              isCurrent
                                ? 'glass-nav-active font-extrabold text-[#2C4A60]'
                                : 'text-slate-600 hover:bg-white/50 hover:text-brand-dark font-semibold'
                            }`;
                          }}
                        >
                          {({ isActive }) => {
                            const isCurrent = isActive || isDiscipleshipActive;
                            return (
                              <>
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                                      isCurrent
                                        ? 'bg-[#EBF2F7] text-[#2C4A60]'
                                        : 'bg-white/60 text-slate-500 group-hover:bg-white group-hover:text-brand-dark shadow-2xs'
                                    }`}
                                  >
                                    <Icon size={15} strokeWidth={2.2} />
                                  </div>
                                  <span className="truncate">{item.name}</span>
                                </div>
                                {isLocked ? (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 text-[9px] font-black uppercase tracking-tight shrink-0 shadow-2xs">
                                    <Lock size={9} strokeWidth={2.5} />
                                    <span>Growth</span>
                                  </span>
                                ) : (
                                  <ChevronRight
                                    size={13}
                                    strokeWidth={isCurrent ? 2.6 : 2.2}
                                    className={`shrink-0 transition-all ${
                                      isCurrent ? 'text-[#2C4A60]' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                                    }`}
                                  />
                                )}
                              </>
                            );
                          }}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        {/* Bottom User Profile Section */}
        <div className="p-3.5 mx-4 mb-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/90 shadow-2xs shrink-0">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-2xl bg-gradient-coram flex items-center justify-center text-white font-black text-sm shadow-church-glow shrink-0">
              {originalUserProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-3 truncate flex-1 min-w-0">
              <p className="text-xs font-bold text-brand-dark truncate">
                {originalUserProfile?.name || 'Leader'}
              </p>
              <div className="inline-flex items-center mt-0.5">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 uppercase tracking-tight truncate">
                  {primaryRole.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Upgrade Gate Modal for Locked Nav Items */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal(prev => ({ ...prev, isOpen: false }))}
        title={upgradeModal.title}
        message={upgradeModal.message}
        targetTier={upgradeModal.targetTier}
      />
    </>
  );
}
