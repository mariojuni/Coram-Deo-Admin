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

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100">
      <h2 className="text-lg font-bold text-church-navy mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {actions.map((act) => {
          const Icon = getIcon(act.id);
          return (
            <Link
              key={act.id}
              to={act.path}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all duration-200 text-center border hover:shadow-md ${
                act.primary
                  ? `${act.color} text-white border-transparent`
                  : 'bg-gray-50 hover:bg-gray-100 text-church-navy border-gray-200'
              }`}
            >
              <Icon size={20} className="mb-2 shrink-0" />
              <span className="text-xs font-bold leading-tight">{act.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
