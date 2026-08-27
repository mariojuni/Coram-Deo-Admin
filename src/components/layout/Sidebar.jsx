import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  HeartHandshake, 
  Settings,
  Bell,
  Search,
  Menu,
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
  ListMusic
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole, hasRole, getPrimaryRole } from '../../utils/permissions';

const churchNavItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader', 'finance_admin', 'secretary'] },
  { name: 'Members', path: '/admin/members', icon: Users, roles: ['super_admin', 'church_admin', 'secretary', 'pastor'] },
  { name: 'Ministries', path: '/admin/ministries', icon: Shield, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader'] },
  { name: 'Events', path: '/admin/events', icon: Calendar, roles: ['super_admin', 'church_admin', 'secretary', 'pastor'] },
  { name: 'Scheduling', path: '/admin/schedules', icon: CalendarDays, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader'] },
  { name: 'Attendance', path: '/admin/attendance', icon: ClipboardCheck, roles: ['super_admin', 'church_admin', 'secretary', 'pastor'] },
  { name: 'Sermons', path: '/admin/sermons', icon: BookOpen, roles: ['super_admin', 'church_admin', 'pastor'] },
  { name: 'Songs & Lyrics', path: '/admin/worship/songs', icon: Music, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader'] },
  { name: 'Setlists', path: '/admin/worship/setlists', icon: ListMusic, roles: ['super_admin', 'church_admin', 'pastor', 'ministry_leader'] },
  { name: 'Bible Plans', path: '/admin/bible', icon: BookOpen, roles: ['super_admin', 'church_admin', 'pastor'] },
  { name: 'Discipleship', path: '/admin/discipleship/groups', icon: BookOpenCheck, roles: ['super_admin', 'church_admin', 'pastor', 'secretary', 'ministry_leader'] },
  { name: 'Announcements', path: '/admin/announcements', icon: Megaphone, roles: ['super_admin', 'church_admin', 'secretary', 'pastor'] },
  { name: 'Prayer Requests', path: '/admin/prayer', icon: HeartHandshake, roles: ['super_admin', 'church_admin', 'pastor'] },
  { name: 'Finance', path: '/admin/finance', icon: CreditCard, roles: ['super_admin', 'church_admin', 'finance_admin', 'pastor'] },
  { name: 'Reports', path: '/admin/reports', icon: Activity, roles: ['super_admin', 'church_admin', 'pastor', 'finance_admin'] },
  { name: 'Settings', path: '/admin/settings', icon: Settings, roles: ['super_admin', 'church_admin'] },
];

const systemNavItems = [
  { name: 'Churches', path: '/super-admin/churches', icon: Building, roles: ['super_admin'] },
  { name: 'Global User Management', path: '/super-admin/pending-members', icon: Users, roles: ['super_admin'] },
  { name: 'Bible Library', path: '/admin/bible-library', icon: BookOpen, roles: ['super_admin'] },
  { name: 'Global Roles', path: '/super-admin/settings/roles', icon: Shield, roles: ['super_admin'] },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { activeChurchId, setActiveChurchId, originalUserProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [churches, setChurches] = useState([]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const isSuperAdmin = hasRole(originalUserProfile, 'super_admin');
  const primaryRole = getPrimaryRole(originalUserProfile);

  const activeNavItems = activeChurchId === 'system' ? systemNavItems : churchNavItems;
  const filteredNavItems = activeNavItems.filter(item =>
    hasAnyRole(originalUserProfile, item.roles)
  );

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

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-church-navy/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white rounded-2xl transform transition-transform duration-300 ease-in-out shadow-church-soft
        lg:translate-x-0 lg:static lg:inset-0 lg:h-[calc(100vh-2rem)] flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6">
            <span className="text-xl font-bold text-church-navy flex items-center">
              <div className="w-8 h-8 bg-church-green rounded-full mr-2 flex items-center justify-center">
                <span className="text-white text-xs">C</span>
              </div>
              ChurchAdmin
            </span>
            <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Workspace Switcher */}
          {isSuperAdmin && (
            <div className="px-4 mb-2 relative">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-2">Workspace</p>
              <button 
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="w-full bg-gray-50 border border-gray-100 hover:border-church-green/50 text-church-navy text-sm rounded-xl px-3 py-2.5 font-bold flex items-center justify-between transition-colors shadow-sm"
              >
                <div className="flex items-center truncate">
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center mr-2 shrink-0">
                    <Building size={14} />
                  </div>
                  <span className="truncate">
                    {activeChurchId === 'system' ? 'System Administration' : (churches.find(c => c.id === activeChurchId)?.name || 'Select Church')}
                  </span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isSwitcherOpen && (
                <div className="absolute top-full mt-1 left-4 right-4 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setActiveChurchId('system');
                        setIsSwitcherOpen(false);
                        navigate('/super-admin/churches');
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${activeChurchId === 'system' ? 'bg-church-green/5 text-church-green font-bold' : 'text-church-navy hover:bg-gray-50'}`}
                    >
                      <span className="truncate pr-2 font-semibold">System Administration</span>
                      {activeChurchId === 'system' && <Check size={16} className="text-church-green shrink-0" />}
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    {churches.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveChurchId(c.id);
                          setIsSwitcherOpen(false);
                          navigate('/admin');
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${activeChurchId === c.id ? 'bg-church-green/5 text-church-green font-bold' : 'text-church-navy hover:bg-gray-50'}`}
                      >
                        <span className="truncate pr-2">{c.name}</span>
                        {activeChurchId === c.id && <Check size={16} className="text-church-green shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            <div className="text-xs font-semibold text-gray-400 mb-4 ml-2 tracking-wider">
              {activeChurchId === 'system' ? 'SYSTEM MENU' : 'CHURCH MENU'}
            </div>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isDiscipleshipActive = item.name === 'Discipleship' && location.pathname.startsWith('/admin/discipleship');
              
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 mb-1 rounded-xl transition-all duration-200 border-l-4 ${
                      isActive || isDiscipleshipActive
                        ? 'border-church-green bg-church-green/5 text-church-green font-bold'
                        : 'border-transparent text-church-slate hover:bg-gray-50 hover:text-church-navy font-medium'
                    }`
                  }
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="mt-auto p-4 m-4 bg-gray-50 rounded-2xl relative">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-church-green flex items-center justify-center text-white font-bold shadow-sm">
                {originalUserProfile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-bold text-church-navy truncate">
                  {originalUserProfile?.name || 'User'}
                </p>
                <p className="text-xs text-church-slate uppercase font-medium">
                  {primaryRole.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
