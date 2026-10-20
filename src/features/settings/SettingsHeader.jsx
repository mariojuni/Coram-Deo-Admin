import React from 'react';
import { Settings, Users, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canManageRoles, hasAnyRole } from '../../utils/permissions';
import SoftCard from '../../components/ui/SoftCard';

export default function SettingsHeader({
  activeTab = 'profile',
  onTabChange,
  title = 'Church Profile',
  subtitle = 'Manage congregation details, campus location, worship service schedules, and financial localization.',
  eyebrow = 'Church Profile',
  actions = null,
  usersCount = null,
}) {
  const { userProfile } = useAuth();
  const canManageRolesAccess = canManageRoles(userProfile);
  const canManageBillingAccess = hasAnyRole(userProfile, ['church_admin', 'super_admin']);

  return (
    <SoftCard className="p-6">
      {/* Top Section: Title, Eyebrow & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-church-rose">
              Administration
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[11px] font-medium text-church-slate">{eyebrow}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-church-navy tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-church-slate mt-0.5">
            {subtitle}
          </p>
        </div>

        {actions && (
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Bottom Section: Integrated Navigation Tabs on the same screen (not floating) */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center space-x-2 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => onTabChange && onTabChange('profile')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
            activeTab === 'profile'
              ? 'bg-gradient-coram text-white shadow-church-glow'
              : 'text-church-slate hover:bg-gray-50/80 hover:text-church-navy'
          }`}
        >
          <Settings size={16} className="mr-2 shrink-0" />
          <span>Church Profile</span>
        </button>

        {canManageRolesAccess && (
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('roles')}
            className={`flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
              activeTab === 'roles'
                ? 'bg-gradient-coram text-white shadow-church-glow'
                : 'text-church-slate hover:bg-gray-50/80 hover:text-church-navy'
            }`}
          >
            <Users size={16} className="mr-2 shrink-0" />
            <span>Users & Access Control</span>
            {usersCount !== null && usersCount !== undefined && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'roles' ? 'bg-white text-church-rose' : 'bg-gray-100 text-church-slate'
              }`}>
                {usersCount}
              </span>
            )}
          </button>
        )}

        {canManageBillingAccess && (
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('billing')}
            className={`flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
              activeTab === 'billing'
                ? 'bg-gradient-coram text-white shadow-church-glow'
                : 'text-church-slate hover:bg-gray-50/80 hover:text-church-navy'
            }`}
          >
            <CreditCard size={16} className="mr-2 shrink-0" />
            <span>Subscription & Billing</span>
          </button>
        )}
      </div>
    </SoftCard>
  );
}
