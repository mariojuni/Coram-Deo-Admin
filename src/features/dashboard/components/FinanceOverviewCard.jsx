import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock } from 'lucide-react';
import { canViewFinanceDashboard } from '../../../utils/dashboardPermissions';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency as formatCurrencyUtil } from '../../../utils/currency';
import SoftCard from '../../../components/ui/SoftCard';

export default function FinanceOverviewCard({ financeData, loading, userProfile, churchCurrency }) {
  const auth = useAuth();

  if (!canViewFinanceDashboard(userProfile)) {
    return null;
  }
  const formatCurrency = (amount) => {
    if (churchCurrency) {
      return formatCurrencyUtil(amount, churchCurrency);
    }
    if (auth?.formatCurrency) {
      return auth.formatCurrency(amount);
    }
    return formatCurrencyUtil(amount);
  };

  const totalGiving = financeData?.approvedGivingThisMonth || 0;
  const totalExpenses = financeData?.expensesThisMonth || 0;
  const netBalance = totalGiving - totalExpenses;
  const pendingCount = financeData?.pendingVerificationCount || 0;
  const activeCampaigns = financeData?.activeCampaigns || [];

  return (
    <SoftCard className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base md:text-lg font-black text-church-charcoal tracking-tight">Finance Overview</h2>
          <p className="text-xs text-church-slate">Monthly approved giving & expense summary</p>
        </div>
        <Link to="/admin/finance" className="text-xs font-bold text-[#2C4A60] hover:text-[#1D3547] hover:underline">
          Finance Portal
        </Link>
      </div>

      {loading ? (
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-4 flex-1">
          {/* Main Net Balance Summary */}
          <div className="p-4 bg-gradient-to-br from-emerald-50/70 to-white/90 rounded-2xl border border-emerald-100/80 flex justify-between items-center shadow-2xs">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">Net Monthly Cash Flow</p>
              <h3 className="text-2xl font-black text-church-charcoal mt-0.5">{formatCurrency(netBalance)}</h3>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">Approved Giving minus Expenses</p>
            </div>
            <div className="p-3 bg-white/90 text-emerald-600 rounded-xl border border-emerald-100 shadow-2xs">
              <TrendingUp size={22} />
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white/70 border border-white/95 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-church-slate">Approved Giving</span>
              <p className="text-base font-black text-church-charcoal mt-1">{formatCurrency(totalGiving)}</p>
            </div>
            <div className="p-3.5 bg-white/70 border border-white/95 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-church-slate">Total Expenses</span>
              <p className="text-base font-black text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>

          {/* Pending verification alert */}
          {pendingCount > 0 && (
            <Link
              to="/admin/finance/giving"
              className="flex items-center justify-between p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-amber-900 text-xs font-bold hover:bg-amber-100/80 transition-colors shadow-2xs"
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
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-church-charcoal">Active Giving Campaign</p>
                <Link to="/admin/finance/campaigns" className="text-[11px] font-bold text-[#2C4A60] hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {activeCampaigns.slice(0, 2).map((camp) => {
                  const goal = Number(camp.goalAmount || camp.targetAmount || 0);
                  const raised = Number(camp.raisedAmount || camp.currentAmount || 0);
                  const percent = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
                  return (
                    <div key={camp.id} className="space-y-1.5 bg-white/70 p-2.5 rounded-xl border border-white/95 shadow-2xs">
                      <div className="flex justify-between text-xs font-medium gap-2">
                        <span className="text-church-charcoal font-bold truncate">{camp.title || camp.name || 'Giving Campaign'}</span>
                        <span className="text-[#2C4A60] font-bold whitespace-nowrap">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#2C4A60] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-church-slate font-medium">
                        <span>{formatCurrency(raised)} raised</span>
                        {goal > 0 && <span>Goal: {formatCurrency(goal)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </SoftCard>
  );
}
