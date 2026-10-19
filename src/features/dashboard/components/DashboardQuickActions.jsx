import React from 'react';
import { Link } from 'react-router-dom';
import { getDashboardQuickActions } from '../../../utils/dashboardPermissions';
import { 
  PlusCircle, 
  UserPlus, 
  Calendar, 
  BookOpen, 
  Megaphone, 
  HeartHandshake, 
  ClipboardCheck, 
  CreditCard, 
  FileText, 
  Users, 
  ListMusic
} from 'lucide-react';
import SoftCard from '../../../components/ui/SoftCard';

export default function DashboardQuickActions({ userProfile }) {
  const actions = getDashboardQuickActions(userProfile);

  if (!actions || actions.length === 0) return null;

  const getIcon = (id) => {
    switch (id) {
      case 'create_event':
      case 'generate_events':
        return Calendar;
      case 'add_member':
        return UserPlus;
      case 'upload_sermon':
      case 'view_sermons':
        return BookOpen;
      case 'create_announcement':
      case 'add_announcement':
        return Megaphone;
      case 'view_prayers':
        return HeartHandshake;
      case 'take_attendance':
      case 'view_attendance':
        return ClipboardCheck;
      case 'giving_input':
      case 'pending_verification':
      case 'add_expense':
        return CreditCard;
      case 'finance_reports':
        return FileText;
      case 'view_groups':
        return Users;
      case 'worship_setlists':
        return ListMusic;
      default:
        return PlusCircle;
    }
  };

  /**
   * CoramDeo System Design — Softer Color Theme per action
   * Soft pastel surfaces with matching borders and crisp white icon badges.
   */
  const getActionTheme = (id) => {
    switch (id) {
      // 1. Create Event & Giving Input (Soft Emerald)
      case 'create_event':
      case 'giving_input':
      case 'my_schedule':
        return {
          card: 'bg-[#ECFDF5] hover:bg-[#D1FAE5]/80 border-[#A7F3D0] hover:border-[#6EE7B7]',
          icon: 'text-[#10B981] border-[#A7F3D0]/60',
          text: 'text-[#065F46]',
        };

      // 2. Add Member (Soft Slate-Navy)
      case 'add_member':
        return {
          card: 'bg-[#F1F5F9] hover:bg-[#E2E8F0]/80 border-[#CBD5E1] hover:border-[#94A3B8]',
          icon: 'text-[#1E293B] border-[#CBD5E1]/60',
          text: 'text-[#0F172A]',
        };

      // 3. Generate Events & Worship (Soft Indigo)
      case 'generate_events':
      case 'worship_setlists':
        return {
          card: 'bg-[#EEF2FF] hover:bg-[#E0E7FF]/80 border-[#C7D2FE] hover:border-[#A5B4FC]',
          icon: 'text-[#4F46E5] border-[#C7D2FE]/60',
          text: 'text-[#312E81]',
        };

      // 4. Sermons & Groups & Applications (Soft Violet)
      case 'upload_sermon':
      case 'view_sermons':
      case 'view_groups':
      case 'applications':
      case 'take_attendance':
        return {
          card: 'bg-[#F5F3FF] hover:bg-[#EDE9FE]/80 border-[#DDD6FE] hover:border-[#C4B5FD]',
          icon: 'text-[#7C3AED] border-[#DDD6FE]/60',
          text: 'text-[#4C1D95]',
        };

      // 5. Announcements & Finance Reports (Soft Blue)
      case 'create_announcement':
      case 'add_announcement':
      case 'finance_reports':
      case 'serve_assignments':
        return {
          card: 'bg-[#EFF6FF] hover:bg-[#DBEAFE]/80 border-[#BFDBFE] hover:border-[#93C5FD]',
          icon: 'text-[#2563EB] border-[#BFDBFE]/60',
          text: 'text-[#1E3A8A]',
        };

      // 6. Prayers (Soft Rose)
      case 'view_prayers':
        return {
          card: 'bg-[#FFF0F5] hover:bg-[#FFE4EC]/80 border-[#FFE4EC] hover:border-[#FECDD6]',
          icon: 'text-[#FF577F] border-[#FFE4EC]/80',
          text: 'text-[#9F1239]',
        };

      // 7. Pending Verification (Soft Amber)
      case 'pending_verification':
        return {
          card: 'bg-[#FEF3C7] hover:bg-[#FDE68A]/80 border-[#FDE68A] hover:border-[#FCD34D]',
          icon: 'text-[#D97706] border-[#FDE68A]/80',
          text: 'text-[#92400E]',
        };

      // 8. Expense (Soft Crimson)
      case 'add_expense':
        return {
          card: 'bg-[#FFF1F2] hover:bg-[#FFE4E6]/80 border-[#FECDD3] hover:border-[#FDA4AF]',
          icon: 'text-[#E11D48] border-[#FECDD3]/80',
          text: 'text-[#881337]',
        };

      default:
        return {
          card: 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] hover:border-[#CBD5E1]',
          icon: 'text-[#475569] border-[#E2E8F0]',
          text: 'text-[#1E293B]',
        };
    }
  };

  return (
    <SoftCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base md:text-lg font-bold text-church-navy tracking-tight">Quick Actions</h2>
          <p className="text-xs text-church-slate font-medium mt-0.5">Frequently used workflows and shortcuts</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {actions.map((act) => {
          const Icon = getIcon(act.id);
          const theme = getActionTheme(act.id);

          return (
            <Link
              key={act.id}
              to={act.path}
              className={`
                group flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 text-center
                shadow-xs hover:shadow-church-elevated hover:-translate-y-0.5 active:translate-y-0 ${theme.card}
              `}
            >
              <div className={`w-10 h-10 rounded-xl bg-white shadow-xs border flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 ${theme.icon}`}>
                <Icon size={18} />
              </div>
              <span className={`text-xs font-bold leading-snug tracking-tight ${theme.text}`}>
                {act.label}
              </span>
            </Link>
          );
        })}
      </div>
    </SoftCard>
  );
}
