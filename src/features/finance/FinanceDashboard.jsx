import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PieChart, 
  BarChart3, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Receipt,
  Sparkles
} from 'lucide-react';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import SoftCard from '../../components/ui/SoftCard';
import StatusPill from '../../components/ui/StatusPill';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Curated CoramDeo harmonized palette for funds
const FUND_PALETTE = [
  '#10B981', // emerald
  '#FF577F', // rose
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#3B82F6', // blue
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#84CC16', // lime
];

export default function FinanceDashboard() {
  const { userProfile, formatCurrency } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  
  const [givingRecords, setGivingRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fundsMap, setFundsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [chartViewMode, setChartViewMode] = useState('trend'); // 'trend' | 'comparison'

  // Date Filter state
  const [dateFilter, setDateFilter] = useState({
    filterType: 'thisMonth',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (!CHURCH_ID) return;

    let givingUnsubscribe = () => {};
    let expensesUnsubscribe = () => {};
    let fundsUnsubscribe = () => {};

    const fetchFinanceData = async () => {
      // 1. Fetch Giving Records
      const givingQuery = query(collection(db, 'givingRecords'), where('churchId', '==', CHURCH_ID));
      givingUnsubscribe = onSnapshot(givingQuery, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGivingRecords(docs);
      });

      // 2. Fetch Expenses
      const expensesQuery = query(collection(db, 'givingExpenses'), where('churchId', '==', CHURCH_ID));
      expensesUnsubscribe = onSnapshot(expensesQuery, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExpenses(docs);
      });

      // 3. Fetch Funds to map fundId accurately
      const fundsQuery = query(collection(db, 'givingFunds'), where('churchId', '==', CHURCH_ID));
      fundsUnsubscribe = onSnapshot(fundsQuery, (snapshot) => {
        const map = {};
        snapshot.forEach(d => {
          map[d.id] = d.data().name;
        });
        setFundsMap(map);
        setLoading(false);
      });
    };

    fetchFinanceData();

    return () => {
      givingUnsubscribe();
      expensesUnsubscribe();
      fundsUnsubscribe();
    };
  }, [CHURCH_ID]);

  // Apply Date Filter in-memory to prevent indexing gaps
  const filteredGiving = useMemo(() => {
    return givingRecords.filter(r => {
      if (!['completed', 'approved'].includes(r.status)) return false;
      const dDate = r.transactionDate || r.date || (r.submittedAt ? new Date(r.submittedAt.seconds * 1000).toISOString().split('T')[0] : '');
      if (dateFilter.startDate && dDate < dateFilter.startDate) return false;
      if (dateFilter.endDate && dDate > dateFilter.endDate) return false;
      return true;
    });
  }, [givingRecords, dateFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const dDate = e.date || '';
      if (dateFilter.startDate && dDate < dateFilter.startDate) return false;
      if (dateFilter.endDate && dDate > dateFilter.endDate) return false;
      return true;
    });
  }, [expenses, dateFilter]);

  // KPIs
  const totalGiving = useMemo(() => filteredGiving.reduce((sum, r) => sum + (r.amount || 0), 0), [filteredGiving]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0), [filteredExpenses]);
  const netBalance = totalGiving - totalExpenses;
  const retentionRate = totalGiving > 0 ? ((netBalance / totalGiving) * 100) : 0;
  const givingCount = filteredGiving.length;
  const expenseCount = filteredExpenses.length;
  const averageGift = givingCount > 0 ? Math.round(totalGiving / givingCount) : 0;

  // -------------------------------------------------------------
  // FUND DISTRIBUTION CALCULATIONS & STRUCTURING
  // -------------------------------------------------------------
  const fundStats = useMemo(() => {
    const totals = {};
    const counts = {};

    filteredGiving.forEach(record => {
      const fundName = fundsMap[record.fundId] || record.fundType || 'General Fund';
      totals[fundName] = (totals[fundName] || 0) + (record.amount || 0);
      counts[fundName] = (counts[fundName] || 0) + 1;
    });

    const entries = Object.keys(totals).map((name, index) => {
      const amount = totals[name];
      const count = counts[name] || 0;
      const percentage = totalGiving > 0 ? (amount / totalGiving) * 100 : 0;
      const color = FUND_PALETTE[index % FUND_PALETTE.length];
      return {
        name,
        amount,
        count,
        percentage,
        color
      };
    });

    // Sort by largest allocation first
    return entries.sort((a, b) => b.amount - a.amount);
  }, [filteredGiving, fundsMap, totalGiving]);

  const doughnutData = useMemo(() => {
    return {
      labels: fundStats.map(f => f.name),
      datasets: [
        {
          data: fundStats.map(f => f.amount),
          backgroundColor: fundStats.map(f => f.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6,
          borderRadius: 4,
        }
      ]
    };
  }, [fundStats]);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 12,
        cornerRadius: 12,
        titleFont: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 12, weight: '700' },
        bodyFont: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 13, weight: '800' },
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw || 0;
            const pct = totalGiving > 0 ? ((val / totalGiving) * 100).toFixed(1) : 0;
            return ` ${formatCurrency(val)} (${pct}%)`;
          }
        }
      }
    }
  }), [totalGiving]);

  // -------------------------------------------------------------
  // INCOME VS EXPENSES: TIMELINE & COMPARATIVE BAR CHART
  // -------------------------------------------------------------
  const { barChartData, barChartOptions } = useMemo(() => {
    if (chartViewMode === 'comparison') {
      // Direct summary comparison
      return {
        barChartData: {
          labels: ['Total Giving Inflow', 'Operational Expenses'],
          datasets: [
            {
              label: 'Total Amount',
              data: [totalGiving, totalExpenses],
              backgroundColor: ['#10B981', '#FF577F'],
              borderRadius: { topLeft: 12, topRight: 12, bottomLeft: 4, bottomRight: 4 },
              maxBarThickness: 54,
            }
          ]
        },
        barChartOptions: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E293B',
              padding: 12,
              cornerRadius: 12,
              titleFont: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 12, weight: '700' },
              bodyFont: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 14, weight: '800' },
              displayColors: false,
              callbacks: {
                label: (ctx) => ` Amount: ${formatCurrency(ctx.raw)}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", weight: '600', size: 12 }, color: '#4B5563' }
            },
            y: {
              beginAtZero: true,
              grid: { color: '#F1F5F9', borderDash: [4, 4] },
              ticks: {
                font: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 11 },
                color: '#94A3B8',
                callback: (val) => '₱' + (val >= 1000 ? (val / 1000).toLocaleString() + 'k' : val)
              }
            }
          }
        }
      };
    }

    // Timeline Trend Mode: Group by period bins
    // Determine interval aggregation based on date filter or spread
    const startStr = dateFilter.startDate;
    const endStr = dateFilter.endDate;
    let isMultiMonth = false;

    if (dateFilter.filterType === 'thisYear' || (startStr && endStr && (new Date(endStr) - new Date(startStr)) > 45 * 86400000)) {
      isMultiMonth = true;
    }

    let binLabels = [];
    let binGivingMap = {};
    let binExpenseMap = {};

    if (isMultiMonth) {
      // Group by Month (Jan -> Dec)
      binLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      binLabels.forEach(m => {
        binGivingMap[m] = 0;
        binExpenseMap[m] = 0;
      });

      filteredGiving.forEach(r => {
        const dStr = r.transactionDate || r.date || '';
        if (!dStr) return;
        const monthIdx = new Date(dStr).getMonth();
        const label = binLabels[monthIdx];
        if (label) binGivingMap[label] = (binGivingMap[label] || 0) + (r.amount || 0);
      });

      filteredExpenses.forEach(e => {
        const dStr = e.date || '';
        if (!dStr) return;
        const monthIdx = new Date(dStr).getMonth();
        const label = binLabels[monthIdx];
        if (label) binExpenseMap[label] = (binExpenseMap[label] || 0) + (e.amount || 0);
      });
    } else {
      // Group by 4-5 weekly intervals or specific periods
      binLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
      binLabels.forEach(w => {
        binGivingMap[w] = 0;
        binExpenseMap[w] = 0;
      });

      const assignWeekBin = (dateStr) => {
        if (!dateStr) return 'Week 1';
        const dayOfMonth = new Date(dateStr).getDate();
        if (dayOfMonth <= 7) return 'Week 1';
        if (dayOfMonth <= 14) return 'Week 2';
        if (dayOfMonth <= 21) return 'Week 3';
        if (dayOfMonth <= 28) return 'Week 4';
        return 'Week 5';
      };

      filteredGiving.forEach(r => {
        const dStr = r.transactionDate || r.date || '';
        const bin = assignWeekBin(dStr);
        binGivingMap[bin] = (binGivingMap[bin] || 0) + (r.amount || 0);
      });

      filteredExpenses.forEach(e => {
        const dStr = e.date || '';
        const bin = assignWeekBin(dStr);
        binExpenseMap[bin] = (binExpenseMap[bin] || 0) + (e.amount || 0);
      });
    }

    return {
      barChartData: {
        labels: binLabels,
        datasets: [
          {
            label: 'Giving Inflow',
            data: binLabels.map(l => binGivingMap[l] || 0),
            backgroundColor: '#10B981',
            borderRadius: { topLeft: 6, topRight: 6 },
            maxBarThickness: 24,
          },
          {
            label: 'Expenses Outflow',
            data: binLabels.map(l => binExpenseMap[l] || 0),
            backgroundColor: '#FF577F',
            borderRadius: { topLeft: 6, topRight: 6 },
            maxBarThickness: 24,
          }
        ]
      },
      barChartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // We render our custom high-fidelity header indicators
          },
          tooltip: {
            backgroundColor: '#1E293B',
            padding: 12,
            cornerRadius: 12,
            titleFont: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 12, weight: '700' },
            bodyFont: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 13, weight: '600' },
            boxPadding: 4,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
              footer: (items) => {
                if (items.length >= 2) {
                  const inflow = items[0].raw || 0;
                  const outflow = items[1].raw || 0;
                  const net = inflow - outflow;
                  return `Net: ${net >= 0 ? '+' : ''}${formatCurrency(net)}`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", weight: '600', size: 12 }, color: '#4B5563' }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9', borderDash: [4, 4] },
            ticks: {
              font: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 11 },
              color: '#94A3B8',
              callback: (val) => '₱' + (val >= 1000 ? (val / 1000).toLocaleString() + 'k' : val)
            }
          }
        }
      }
    };
  }, [chartViewMode, filteredGiving, filteredExpenses, totalGiving, totalExpenses, dateFilter]);

  // Combined Recent Activity (Latest 6 entries)
  const recentActivity = useMemo(() => {
    const combined = [
      ...filteredGiving.map(g => ({
        id: g.id,
        type: 'giving',
        date: g.transactionDate || g.date || '',
        title: g.donorName || 'Anonymous Giver',
        category: fundsMap[g.fundId] || g.fundType || 'General Fund',
        amount: g.amount || 0,
        method: g.method || g.paymentMethod || 'Cash'
      })),
      ...filteredExpenses.map(e => ({
        id: e.id,
        type: 'expense',
        date: e.date || '',
        title: e.description || e.vendor || 'Expense Voucher',
        category: e.category || 'Operations',
        amount: e.amount || 0,
        method: e.paymentMethod || 'Cash'
      }))
    ];

    combined.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return combined.slice(0, 6);
  }, [filteredGiving, filteredExpenses, fundsMap]);

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-church-rose tracking-wider uppercase bg-church-rose-light px-3 py-1 rounded-full border border-pink-100">
            FINANCE & STEWARDSHIP
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-church-charcoal tracking-tight mt-2">
            Finance Overview
          </h1>
          <p className="text-xs sm:text-sm text-church-slate mt-1">
            Real-time tracking of tithes, ministry allocations, operational expenses, and net cashflow.
          </p>
        </div>

        <div className="relative z-40 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-church-soft border border-gray-100/80 shrink-0">
          <DateRangeFilter onChange={setDateFilter} defaultFilter="thisMonth" />
        </div>
      </div>

      {loading ? (
        <SoftCard className="p-16 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-9 h-9 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin" />
            <p className="text-sm font-semibold text-church-slate">Loading financial ledger and fund data...</p>
          </div>
        </SoftCard>
      ) : (
        <>
          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
            {/* 1. Total Giving (Inflow) */}
            <SoftCard className="p-6 relative overflow-hidden group hover:border-emerald-200/80 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-church-slate uppercase tracking-wider">Total Giving (Inflow)</span>
                    <StatusPill variant="emerald" className="text-[10px] py-0 px-2">
                      Inflow
                    </StatusPill>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-church-charcoal mt-2 tracking-tight">
                    {formatCurrency(totalGiving)}
                  </h3>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-church-slate">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {givingCount} gifts
                    </span>
                    <span>• Avg {formatCurrency(averageGift)}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <TrendingUp size={24} />
                </div>
              </div>
            </SoftCard>

            {/* 2. Total Expenses (Outflow) */}
            <SoftCard className="p-6 relative overflow-hidden group hover:border-rose-200/80 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-church-slate uppercase tracking-wider">Total Expenses (Outflow)</span>
                    <StatusPill variant="rose" className="text-[10px] py-0 px-2">
                      Outflow
                    </StatusPill>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-church-charcoal mt-2 tracking-tight">
                    {formatCurrency(totalExpenses)}
                  </h3>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-church-slate">
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                      {expenseCount} vouchers
                    </span>
                    <span>• Operating expenditures</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100/60 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <TrendingDown size={24} />
                </div>
              </div>
            </SoftCard>

            {/* 3. Net Operating Balance */}
            <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E1B4B] rounded-3xl p-6 shadow-church-elevated border border-gray-800 text-white relative overflow-hidden group flex flex-col justify-between">
              {/* Subtle ambient gradient aura */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-coram opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Net Operating Balance</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      netBalance >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {netBalance >= 0 ? `Surplus (+${retentionRate.toFixed(0)}%)` : 'Deficit'}
                    </span>
                  </div>
                  <h3 className={`text-2xl sm:text-3xl font-black mt-2 tracking-tight ${
                    netBalance >= 0 ? 'text-white' : 'text-rose-400'
                  }`}>
                    {formatCurrency(netBalance)}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  <Wallet size={22} />
                </div>
              </div>

              <div className="relative z-10 mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span>Inflow retention:</span>
                <span className="font-bold text-white">{retentionRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 1: Income vs Expenses (7 cols) */}
            <SoftCard className="p-6 lg:col-span-7 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={18} className="text-church-rose" />
                    <h3 className="font-extrabold text-base text-church-charcoal">
                      Income vs Expenses
                    </h3>
                  </div>
                  <p className="text-xs text-church-slate mt-0.5">
                    Periodic comparison between church inflows and operational costs.
                  </p>
                </div>

                {/* View Switcher: Trend vs Direct Comparison */}
                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setChartViewMode('trend')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      chartViewMode === 'trend'
                        ? 'bg-white text-church-charcoal shadow-sm'
                        : 'text-church-slate hover:text-church-charcoal'
                    }`}
                  >
                    Timeline Trend
                  </button>
                  <button
                    onClick={() => setChartViewMode('comparison')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      chartViewMode === 'comparison'
                        ? 'bg-white text-church-charcoal shadow-sm'
                        : 'text-church-slate hover:text-church-charcoal'
                    }`}
                  >
                    Summary Total
                  </button>
                </div>
              </div>

              {/* Quick Legend & Metric Badges */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-semibold">
                <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Inflow: {formatCurrency(totalGiving)}</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-rose-50 text-rose-800 px-2.5 py-1 rounded-lg border border-rose-100">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Outflow: {formatCurrency(totalExpenses)}</span>
                </div>
                <div className="ml-auto text-church-slate text-[11px]">
                  Net Margin: <strong className={netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(netBalance)}</strong>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-72 relative flex-1">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </SoftCard>

            {/* Chart 2: Fund Distribution (5 cols) */}
            <SoftCard className="p-6 lg:col-span-5 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <PieChart size={18} className="text-church-rose" />
                  <h3 className="font-extrabold text-base text-church-charcoal">
                    Fund Distribution
                  </h3>
                </div>
                <span className="text-xs font-bold text-church-slate bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {fundStats.length} {fundStats.length === 1 ? 'Fund' : 'Funds'}
                </span>
              </div>

              {fundStats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 text-church-muted flex items-center justify-center mb-3">
                    <Wallet size={26} />
                  </div>
                  <p className="text-sm font-bold text-church-charcoal">No giving records found</p>
                  <p className="text-xs text-church-slate mt-1">
                    Try expanding your date filter to view fund allocation.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  {/* Donut Chart with Embedded Center Display */}
                  <div className="h-48 relative flex items-center justify-center">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-church-slate uppercase tracking-wider">
                        Total Allocated
                      </span>
                      <span className="text-lg font-black text-church-charcoal tracking-tight mt-0.5">
                        {formatCurrency(totalGiving)}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-full mt-0.5">
                        {givingCount} gifts
                      </span>
                    </div>
                  </div>

                  {/* High-Fidelity Breakdown List with Progress Bars */}
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar pt-2 border-t border-gray-100">
                    {fundStats.map((fund, idx) => (
                      <div key={fund.name} className="p-2.5 rounded-2xl hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 truncate">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: fund.color }} 
                            />
                            <span className="font-bold text-church-charcoal truncate" title={fund.name}>
                              {fund.name}
                            </span>
                            <span className="text-[10px] text-church-muted shrink-0">
                              ({fund.count} {fund.count === 1 ? 'gift' : 'gifts'})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0 ml-2">
                            <span className="font-extrabold text-church-charcoal">
                              {formatCurrency(fund.amount)}
                            </span>
                            <span className="text-[11px] font-black text-church-slate bg-gray-100 px-1.5 py-0.5 rounded-md">
                              {fund.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Micro Progress Bar */}
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(fund.percentage, 100)}%`, 
                              backgroundColor: fund.color 
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SoftCard>
          </div>

          {/* Recent Financial Activity Feed */}
          <SoftCard className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Layers size={18} className="text-church-rose" />
                <h3 className="font-extrabold text-base text-church-charcoal">
                  Recent Financial Activity
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <Link 
                  to="/admin/finance/giving" 
                  className="text-xs font-bold text-church-rose hover:text-church-rose-dark flex items-center transition-colors"
                >
                  Giving Ledger <ArrowRight size={13} className="ml-1" />
                </Link>
                <span className="text-gray-300">•</span>
                <Link 
                  to="/admin/finance/expenses" 
                  className="text-xs font-bold text-church-slate hover:text-church-charcoal flex items-center transition-colors"
                >
                  Expenses <ArrowRight size={13} className="ml-1" />
                </Link>
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-church-slate text-sm">
                No recent transactions in this date range.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentActivity.map((tx) => (
                  <div key={`${tx.type}-${tx.id}`} className="py-3 flex items-center justify-between hover:bg-gray-50/60 rounded-xl px-2 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'giving' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-500 border border-rose-100'
                      }`}>
                        {tx.type === 'giving' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-bold text-church-charcoal">{tx.title}</p>
                          <StatusPill 
                            variant={tx.type === 'giving' ? 'emerald' : 'rose'} 
                            className="text-[10px] py-0 px-2"
                          >
                            {tx.type === 'giving' ? 'Giving' : 'Expense'}
                          </StatusPill>
                        </div>
                        <p className="text-xs text-church-slate mt-0.5">
                          {tx.category} • {tx.method} • {tx.date ? new Date(tx.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${
                        tx.type === 'giving' ? 'text-emerald-600' : 'text-rose-500'
                      }`}>
                        {tx.type === 'giving' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SoftCard>
        </>
      )}
    </div>
  );
}
