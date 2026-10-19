import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  LayoutDashboard, 
  CreditCard, 
  ClipboardCheck, 
  Receipt, 
  Wallet, 
  Target, 
  Activity,
  Building,
  ArrowRightLeft,
  Tags
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  canAccessFinanceModule, 
  canManageGiving, 
  canVerifyGiving, 
  canManageExpenses,
  canViewFinanceSummary,
  canManageFinanceSettings,
  canViewFinanceReports,
  canManageFundTransfers
} from '../../utils/financePermissions';

import FinanceDashboard from './FinanceDashboard';
import GivingRecords from '../giving/GivingRecords';
import PendingVerification from './PendingVerification';
import ExpensesList from '../expenses/ExpensesList';
import GivingCampaigns from '../giving/GivingCampaigns';

import FundsList from '../funds/FundsList';
import FundTransfersList from '../funds/FundTransfersList';
import CombinedReports from './reports/CombinedReports';
import DonationAccountsList from './donation-accounts/DonationAccountsList';
import ExpenseCategoriesList from './expense-categories/ExpenseCategoriesList';

export default function FinanceLayout() {
  const { userProfile } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!userProfile?.churchId) return;
    const qPending = query(
      collection(db, 'givingRecords'),
      where('churchId', '==', userProfile.churchId),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(qPending, (snap) => {
      setPendingCount(snap.docs.length);
    }, () => {});
    return () => unsubscribe();
  }, [userProfile?.churchId]);
  
  if (!canAccessFinanceModule(userProfile)) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-church-navy mb-4">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to view the Finance module.</p>
      </div>
    );
  }

  const tabs = [];

  if (canViewFinanceSummary(userProfile)) {
    tabs.push({ name: 'Overview', path: '/admin/finance', icon: LayoutDashboard, exact: true });
  }
  
  if (canManageGiving(userProfile) || canViewFinanceSummary(userProfile)) {
    tabs.push({ name: 'Giving', path: '/admin/finance/giving', icon: CreditCard, exact: false });
  }

  if (canVerifyGiving(userProfile)) {
    tabs.push({ 
      name: 'Verification', 
      path: '/admin/finance/verification', 
      icon: ClipboardCheck, 
      exact: false,
      badge: pendingCount > 0 ? pendingCount : null
    });
  }

  if (canManageExpenses(userProfile) || canViewFinanceSummary(userProfile)) {
    tabs.push({ name: 'Expenses', path: '/admin/finance/expenses', icon: Receipt, exact: false });
  }

  if (canManageFinanceSettings(userProfile)) {
    tabs.push({ name: 'Funds', path: '/admin/finance/funds', icon: Wallet, exact: false });
    tabs.push({ name: 'Campaigns', path: '/admin/finance/campaigns', icon: Target, exact: false });
    tabs.push({ name: 'Donation Accounts', path: '/admin/finance/donation-accounts', icon: Building, exact: false });
    tabs.push({ name: 'Expense Categories', path: '/admin/finance/expense-categories', icon: Tags, exact: false });
  }

  if (canManageFundTransfers(userProfile)) {
    tabs.push({ name: 'Transfers', path: '/admin/finance/transfers', icon: ArrowRightLeft, exact: false });
  }

  if (canViewFinanceReports(userProfile)) {
    tabs.push({ name: 'Reports', path: '/admin/finance/reports', icon: Activity, exact: false });
  }

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto pb-10">
      
      {/* Top Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-church-soft border border-gray-100/80 mb-6 p-2 overflow-x-auto custom-scrollbar shrink-0">
        <nav className="flex space-x-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.name}
                to={tab.path}
                end={tab.exact}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-coram text-white shadow-church-glow'
                      : 'text-church-slate hover:bg-gray-50/80 hover:text-church-charcoal'
                  }`
                }
              >
                <Icon size={17} className="mr-2 shrink-0" />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white text-church-rose shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Tab Content Routing */}
      <div className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<FinanceDashboard />} />
          <Route path="giving" element={<GivingRecords />} />
          <Route path="verification" element={<PendingVerification />} />
          <Route path="expenses" element={<ExpensesList />} />
          <Route path="funds" element={<FundsList />} />
          <Route path="transfers" element={<FundTransfersList />} />
          <Route path="campaigns" element={<GivingCampaigns />} />
          <Route path="donation-accounts" element={<DonationAccountsList />} />
          <Route path="expense-categories" element={<ExpenseCategoriesList />} />
          <Route path="reports" element={<CombinedReports />} />
          <Route path="*" element={<Navigate to="/admin/finance" replace />} />
        </Routes>
      </div>
    </div>
  );
}
