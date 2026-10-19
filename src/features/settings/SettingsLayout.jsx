import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Settings, Users, ChevronRight, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canManageRoles } from '../../utils/permissions';
import SoftCard from '../../components/ui/SoftCard';

export default function SettingsLayout() {
  const { userProfile } = useAuth();
  const canManageRolesAccess = canManageRoles(userProfile);

  const navItems = [
    {
      to: '/admin/settings',
      end: true,
      label: 'Church Profile',
      subtitle: 'Identity, theme & schedule',
      icon: Settings,
      allowed: true,
    },
    {
      to: '/admin/settings/roles',
      end: false,
      label: 'Users & Roles',
      subtitle: 'Permissions & staff access',
      icon: Users,
      allowed: canManageRolesAccess,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full max-w-6xl mx-auto gap-6 pb-12">
      {/* Settings Navigation Sidebar */}
      <div className="w-full lg:w-72 shrink-0">
        <SoftCard className="p-4 lg:sticky lg:top-6">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-church-rose/10 flex items-center justify-center text-church-rose">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-church-navy leading-none">Administration</h2>
              <p className="text-[11px] text-church-slate font-medium mt-0.5">Configuration & settings</p>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          <nav className="space-y-1.5 pt-1">
            {navItems
              .filter((item) => item.allowed)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `
                      group flex items-center justify-between p-3 rounded-2xl transition-all duration-200
                      ${
                        isActive
                          ? 'bg-gradient-coram text-white shadow-church-glow font-bold'
                          : 'text-church-slate hover:text-church-navy hover:bg-church-cream/70 font-semibold'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-100/80 text-church-slate group-hover:bg-white group-hover:text-church-navy'
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="text-sm leading-tight truncate">{item.label}</div>
                            <div
                              className={`text-[11px] truncate mt-0.5 ${
                                isActive ? 'text-white/80' : 'text-church-slate/70'
                              }`}
                            >
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          className={`shrink-0 transition-transform ${
                            isActive ? 'text-white translate-x-0.5' : 'text-gray-300 group-hover:text-gray-400'
                          }`}
                        />
                      </>
                    )}
                  </NavLink>
                );
              })}
          </nav>
        </SoftCard>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

