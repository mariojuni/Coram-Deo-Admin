import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, TrendingUp, TrendingDown, Clock, ShieldAlert } from 'lucide-react';
import { canViewFinanceDashboard } from '../../../utils/dashboardPermissions';

export default function FinanceOverviewCard({ financeData, loading, userProfile }) {
  if (!canViewFinanceDashboard(userProfile)) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
  };

  const totalGiving = financeData?.approvedGivingThisMonth || 0;
  const totalExpenses = financeData?.expensesThisMonth || 0;
  const netBalance = totalGiving - totalExpenses;
  const pendingCount = financeData?.pendingVerificationCount || 0;
  const activeCampaigns = financeData?.activeCampaigns || [];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-church-soft border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-church-navy">Finance Overview</h2>
          <p className="text-xs text-church-slate">Monthly approved giving & expense summary</p>
        </div>
        <Link to="/admin/finance" className="text-xs font-bold text-church-green hover:underline">
          Finance Portal
        </Link>
      </div>

      {loading ? (
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-4 flex-1">
          {/* Main Net Balance Summary */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Net Monthly Cash Flow</p>
              <h3 className="text-2xl font-bold text-church-navy mt-0.5">{formatCurrency(netBalance)}</h3>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">Approved Giving minus Expenses</p>
            </div>
            <div className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm">
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 border border-gray-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-church-slate">Approved Giving</span>
              <p className="text-base font-bold text-church-navy mt-1">{formatCurrency(totalGiving)}</p>
            </div>
            <div className="p-3.5 border border-gray-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-church-slate">Total Expenses</span>
              <p className="text-base font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>

          {/* Pending verification alert */}
          {pendingCount > 0 && (
            <Link
              to="/admin/finance/giving"
              className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors"
            >
              <span className="flex items-center">
                <Clock size={14} className="mr-1.5 text-amber-700" />
                {pendingCount} giving receipt{pendingCount > 1 ? 's' : ''} awaiting verification
              </span>
              <span className="text-amber-800 underline">Verify</span>
            </Link>
          )}

          {/* Active campaign progress */}
          {activeCampaigns.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-church-navy mb-2">Active Giving Campaign</p>
              {activeCampaigns.slice(0, 1).map((camp) => {
                const percent = camp.targetAmount ? Math.min(Math.round((camp.currentAmount / camp.targetAmount) * 100), 100) : 0;
                return (
                  <div key={camp.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-church-navy font-bold truncate">{camp.title || camp.name}</span>
                      <span className="text-church-slate">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-church-green h-2 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
