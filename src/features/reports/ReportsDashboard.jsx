import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  CreditCard, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  CheckCircle2, 
  HeartHandshake, 
  Sparkles, 
  Layers,
  ArrowUpRight,
  Filter,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { canManageGiving } from '../../utils/permissions';
import { formatCurrency as formatChurchCurrency } from '../../utils/currency';
import {
  exportMemberRegistryPdf,
  exportAttendanceRegisterPdf,
  exportGivingLedgerPdf,
} from '../../utils/reportPdfGenerator';
import ModernDropdown from '../../components/ui/ModernDropdown';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
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

// Harmonized CoramDeo palette for funds & metrics
const FUND_PALETTE = [
  '#FF577F', // rose
  '#B66DFF', // violet
  '#10B981', // emerald
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#84CC16', // lime
];

export default function ReportsDashboard() {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const canSeeGiving = canManageGiving(userProfile);

  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [churchMeta, setChurchMeta] = useState(null);

  // Raw Data Collections
  const [usersList, setUsersList] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [givingRecords, setGivingRecords] = useState([]);
  const [fundsMap, setFundsMap] = useState({});
  const [fundsList, setFundsList] = useState([]);

  // UI & Filter state
  const [dateFilter, setDateFilter] = useState({
    filterType: 'thisMonth',
    startDate: '',
    endDate: '',
  });
  const [selectedGivingFund, setSelectedGivingFund] = useState('all');
  const [attendanceChartView, setAttendanceChartView] = useState('breakdown'); // 'breakdown' | 'total'

  // Load church metadata & realtime subscriptions
  useEffect(() => {
    if (!CHURCH_ID) return;

    let unsubUsers = () => {};
    let unsubSessions = () => {};
    let unsubAttendance = () => {};
    let unsubGiving = () => {};
    let unsubFunds = () => {};

    const loadData = async () => {
      setLoading(true);

      // 1. Fetch Church metadata for official exports
      try {
        let meta = {};
        const cSnap = await getDoc(doc(db, 'churches', CHURCH_ID));
        if (cSnap.exists()) {
          meta = { ...cSnap.data() };
        }
        try {
          const pSnap = await getDoc(doc(db, 'churches', CHURCH_ID, 'settings', 'profile'));
          if (pSnap.exists()) {
            meta = { ...meta, ...pSnap.data() };
          }
        } catch (pe) {
          console.warn('Could not read church profile settings:', pe);
        }
        setChurchMeta(meta);
      } catch (err) {
        console.warn('Could not load church doc:', err);
      }

      // 2. Fetch Users (directory)
      try {
        const usersQuery = query(collection(db, 'users'));
        unsubUsers = onSnapshot(usersQuery, (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((d) => d.churchId === CHURCH_ID || (!d.churchId && !CHURCH_ID));
          setUsersList(list);
        });
      } catch (e) {
        console.error('Error fetching users:', e);
      }

      // 3. Fetch Attendance Sessions (events & roll calls)
      try {
        const sessQuery = query(collection(db, 'attendance_sessions'), where('churchId', '==', CHURCH_ID));
        unsubSessions = onSnapshot(sessQuery, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setAttendanceSessions(list);
        });
      } catch (e) {
        console.error('Error fetching attendance sessions:', e);
      }

      // 4. Fetch Attendance check-ins (scanner log)
      try {
        const attQuery = query(collection(db, 'attendance'), where('churchId', '==', CHURCH_ID));
        unsubAttendance = onSnapshot(attQuery, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setAttendanceRecords(list);
        });
      } catch (e) {
        console.error('Error fetching attendance:', e);
      }

      // 5. Fetch Giving records (if permitted)
      if (canSeeGiving) {
        try {
          const givingQuery = query(collection(db, 'givingRecords'), where('churchId', '==', CHURCH_ID));
          unsubGiving = onSnapshot(givingQuery, (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setGivingRecords(list);
          });
        } catch (e) {
          console.error('Error fetching giving:', e);
        }
      }

      // 6. Fetch Giving Funds
      try {
        const fundsQuery = query(collection(db, 'givingFunds'), where('churchId', '==', CHURCH_ID));
        unsubFunds = onSnapshot(fundsQuery, (snap) => {
          const map = {};
          const list = [];
          snap.forEach((d) => {
            const data = d.data();
            map[d.id] = data.name;
            if (data.status === 'active') {
              list.push({ id: d.id, name: data.name });
            }
          });
          list.sort((a, b) => a.name.localeCompare(b.name));
          setFundsMap(map);
          setFundsList(list);
          setLoading(false);
        });
      } catch (e) {
        console.error('Error fetching funds:', e);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      unsubUsers();
      unsubSessions();
      unsubAttendance();
      unsubGiving();
      unsubFunds();
    };
  }, [CHURCH_ID, canSeeGiving]);

  // Date range filter helper
  const isInDateRange = (dateValue) => {
    if (!dateValue) return false;
    if (dateFilter.filterType === 'all') return true;

    let targetDate = null;
    if (typeof dateValue?.toDate === 'function') {
      targetDate = dateValue.toDate();
    } else if (dateValue?.seconds) {
      targetDate = new Date(dateValue.seconds * 1000);
    } else {
      targetDate = new Date(dateValue);
    }

    if (isNaN(targetDate.getTime())) return false;

    if (dateFilter.startDate && dateFilter.endDate) {
      const start = new Date(dateFilter.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59, 999);
      return targetDate >= start && targetDate <= end;
    }
    return true;
  };

  // Process Members Directory Data
  const memberDemographics = useMemo(() => {
    const toTitleCase = (str) => {
      if (!str) return '';
      return str.split(/[\s-]+/).map((word) => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    };

    const processed = usersList.map((d) => {
      let displayName = d.name || '';
      if (d.firstName || d.lastName) {
        const f = toTitleCase(d.firstName);
        const l = toTitleCase(d.lastName);
        const mi = d.middleName ? d.middleName.charAt(0).toUpperCase() + '.' : '';
        displayName = [f, mi, l].filter(Boolean).join(' ');
      } else if (d.name) {
        const parts = d.name.split(' ').filter(Boolean);
        if (parts.length > 2) {
          const f = toTitleCase(parts[0]);
          const l = toTitleCase(parts[parts.length - 1]);
          const mi = parts[1].charAt(0).toUpperCase() + '.';
          displayName = `${f} ${mi} ${l}`;
        } else {
          displayName = toTitleCase(d.name);
        }
      }
      return { ...d, displayName };
    });

    // Deduplicate
    const unique = [];
    processed.forEach((d) => {
      const existing = unique.find(
        (u) =>
          (u.email && d.email && u.email.toLowerCase() === d.email.toLowerCase()) ||
          (u.displayName && d.displayName && u.displayName.toLowerCase() === d.displayName.toLowerCase())
      );
      if (existing) {
        if (!existing.email && d.email) existing.email = d.email;
        if (!existing.phoneNumber && d.phoneNumber) existing.phoneNumber = d.phoneNumber;
      } else {
        unique.push(d);
      }
    });

    const activeList = unique.filter(
      (d) => (d.membershipCategory || d.membershipStatus) !== 'Archived'
    );
    activeList.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

    const activeFullMembers = activeList.filter((d) => {
      const cat = d.membershipCategory || (d.membershipStatus === 'Active' || d.membershipStatus === 'Inactive' ? 'Full Member' : d.membershipStatus);
      const sub = d.membershipStatus || 'Active';
      return cat === 'Full Member' && sub !== 'Inactive';
    });

    const inactiveFullMembers = activeList.filter((d) => {
      const cat = d.membershipCategory || (d.membershipStatus === 'Active' || d.membershipStatus === 'Inactive' ? 'Full Member' : d.membershipStatus);
      const sub = d.membershipStatus || 'Active';
      return cat === 'Full Member' && sub === 'Inactive';
    });

    const fellowship = activeList.filter((d) => (d.membershipCategory || d.membershipStatus) === 'Fellowship');
    const visitors = activeList.filter((d) => (d.membershipCategory || d.membershipStatus) === 'Visitor');
    const transferred = activeList.filter((d) => (d.membershipCategory || d.membershipStatus) === 'Transferred');
    const deceased = activeList.filter((d) => (d.membershipCategory || d.membershipStatus) === 'Deceased');

    const baptized = activeList.filter((d) => d.baptismStatus === 'Baptized' || Boolean(d.baptismDate));
    const abroad = activeList.filter((d) => d.isAbroad);
    const male = activeList.filter((d) => (d.gender || '').toLowerCase() === 'male' || (d.gender || '').toLowerCase() === 'm');
    const female = activeList.filter((d) => (d.gender || '').toLowerCase() === 'female' || (d.gender || '').toLowerCase() === 'f');

    return {
      all: activeList,
      totalCount: activeList.length,
      activeFullMembersCount: activeFullMembers.length,
      inactiveFullMembersCount: inactiveFullMembers.length,
      fellowshipCount: fellowship.length,
      visitorsCount: visitors.length,
      transferredCount: transferred.length,
      deceasedCount: deceased.length,
      baptizedCount: baptized.length,
      abroadCount: abroad.length,
      maleCount: male.length,
      femaleCount: female.length,
    };
  }, [usersList]);

  // Process Attendance Records filtered by date
  const filteredAttendance = useMemo(() => {
    // 1. Process from attendance_sessions (preferred service records)
    const sessions = attendanceSessions
      .filter((s) => isInDateRange(s.date || s.eventDate || s.createdAt))
      .map((s) => {
        const present = Number(s.metrics?.present ?? (s.totalAttendance ?? s.present ?? 0));
        const visitors = Number(s.metrics?.visitors || s.firstTimeVisitors || 0);
        const late = Number(s.metrics?.late || 0);
        const total = present + visitors + late;
        return {
          id: s.id,
          date: s.date || s.eventDate || '',
          name: s.eventName || s.title || 'Worship Service',
          present,
          visitors,
          late,
          total,
        };
      })
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    // 2. If sessions are empty, synthesize from flat attendance records
    if (sessions.length === 0 && attendanceRecords.length > 0) {
      const recordsInRange = attendanceRecords.filter((a) => isInDateRange(a.date || a.timestamp || a.createdAt));
      const byDate = {};
      recordsInRange.forEach((a) => {
        const d = a.date || 'Unspecified';
        if (!byDate[d]) {
          byDate[d] = { id: d, date: d, name: 'Service Gathering', present: 0, visitors: 0, late: 0, total: 0 };
        }
        if (a.type === 'visitor') {
          byDate[d].visitors += 1;
        } else {
          byDate[d].present += 1;
        }
        byDate[d].total += 1;
      });

      const synthesized = Object.values(byDate).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      const totalAttendees = synthesized.reduce((sum, s) => sum + s.total, 0);
      const totalVisitors = synthesized.reduce((sum, s) => sum + s.visitors, 0);
      const avg = synthesized.length > 0 ? Math.round(totalAttendees / synthesized.length) : 0;
      const peak = synthesized.reduce((max, s) => Math.max(max, s.total), 0);

      return {
        sessions: synthesized,
        totalServices: synthesized.length,
        totalAttendees,
        totalVisitors,
        avgAttendance: avg,
        peakAttendance: peak,
      };
    }

    const totalAttendees = sessions.reduce((sum, s) => sum + s.total, 0);
    const totalVisitors = sessions.reduce((sum, s) => sum + s.visitors, 0);
    const avg = sessions.length > 0 ? Math.round(totalAttendees / sessions.length) : 0;
    const peak = sessions.reduce((max, s) => Math.max(max, s.total), 0);

    return {
      sessions,
      totalServices: sessions.length,
      totalAttendees,
      totalVisitors,
      avgAttendance: avg,
      peakAttendance: peak,
    };
  }, [attendanceSessions, attendanceRecords, dateFilter]);

  // Process Giving Records filtered by date & Fund Distribution
  const filteredGiving = useMemo(() => {
    if (!canSeeGiving) return { records: [], totalAmount: 0, fundBreakdown: [], count: 0 };

    const inRange = givingRecords.filter((g) => {
      const status = (g.status || 'verified').toLowerCase();
      if (status !== 'verified' && status !== 'completed' && status !== 'approved') return false;
      return isInDateRange(g.date || g.createdAt);
    });

    const totalAmount = inRange.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

    // Group by fund
    const fundsAggr = {};
    inRange.forEach((g) => {
      const fundId = g.fundId || 'general';
      const fundName = (g.fundId && fundsMap[g.fundId]) ? fundsMap[g.fundId] : (g.fundType || 'General Offering');
      const amount = Number(g.amount) || 0;

      if (!fundsAggr[fundName]) {
        fundsAggr[fundName] = { fundId, name: fundName, amount: 0, count: 0 };
      }
      fundsAggr[fundName].amount += amount;
      fundsAggr[fundName].count += 1;
    });

    const fundBreakdown = Object.values(fundsAggr)
      .map((item, index) => ({
        ...item,
        percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
        color: FUND_PALETTE[index % FUND_PALETTE.length],
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      records: inRange,
      totalAmount,
      fundBreakdown,
      count: inRange.length,
    };
  }, [givingRecords, fundsMap, dateFilter, canSeeGiving]);

  // Attendance Chart Data
  const attendanceChartData = useMemo(() => {
    const labels = filteredAttendance.sessions.map((s) => {
      if (!s.date) return 'Session';
      try {
        const parts = s.date.split('-');
        if (parts.length === 3) {
          return `${parts[1]}/${parts[2]}`;
        }
      } catch (e) {}
      return s.date;
    });

    if (attendanceChartView === 'breakdown') {
      return {
        labels,
        datasets: [
          {
            label: 'Members',
            data: filteredAttendance.sessions.map((s) => s.present),
            backgroundColor: '#B66DFF',
            borderRadius: 6,
          },
          {
            label: 'Visitors',
            data: filteredAttendance.sessions.map((s) => s.visitors),
            backgroundColor: '#FF577F',
            borderRadius: 6,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: 'Total Attendees',
          data: filteredAttendance.sessions.map((s) => s.total),
          backgroundColor: '#10B981',
          borderRadius: 8,
        },
      ],
    };
  }, [filteredAttendance, attendanceChartView]);

  // Fund Distribution Chart Data (Doughnut)
  const fundChartData = useMemo(() => {
    if (filteredGiving.fundBreakdown.length === 0) {
      return {
        labels: ['No Contributions in Period'],
        datasets: [{ data: [1], backgroundColor: ['#E2E8F0'], borderWidth: 0 }],
      };
    }
    return {
      labels: filteredGiving.fundBreakdown.map((f) => f.name),
      datasets: [
        {
          data: filteredGiving.fundBreakdown.map((f) => f.amount),
          backgroundColor: filteredGiving.fundBreakdown.map((f) => f.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    };
  }, [filteredGiving]);

  // Currency Formatter
  const formatCurrency = (amt) =>
    formatChurchCurrency(amt, churchMeta?.currency);

  // PDF Exporter
  const handleExportPDF = async (reportType) => {
    setExportLoading(true);
    try {
      if (!CHURCH_ID) throw new Error('No church context.');

      if (reportType === 'members') {
        await exportMemberRegistryPdf(memberDemographics, churchMeta);
      } else if (reportType === 'attendance') {
        await exportAttendanceRegisterPdf(filteredAttendance, dateFilter, churchMeta);
      } else if (reportType === 'giving') {
        if (!canSeeGiving) throw new Error('Unauthorized');
        await exportGivingLedgerPdf(
          filteredGiving,
          selectedGivingFund,
          fundsMap,
          dateFilter,
          churchMeta
        );
      }
    } catch (e) {
      console.error('Failed to export PDF:', e);
      alert('Failed to generate PDF report.');
    } finally {
      setExportLoading(false);
    }
  };

  // CSV Exporter
  const handleExportCSV = async (reportType) => {
    setExportLoading(true);
    try {
      if (!CHURCH_ID) throw new Error('No church context.');
      let csvContent = '';
      const churchName = churchMeta?.name || userProfile?.churchName || 'Coram Deo Church';
      const district = churchMeta?.district || '';
      const address = churchMeta?.address || '';
      const dateOrganized = churchMeta?.dateOrganized || '';

      if (reportType === 'members') {
        const finalData = memberDemographics.all;

        csvContent = `"${churchName.toUpperCase()}"\n`;
        if (district) csvContent += `"${district.toUpperCase()}"\n`;
        if (address) csvContent += `"${address}"\n`;
        csvContent += `\n`;

        const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        csvContent += `"Updated List of ${churchName} Members as of ${currentDate}"\n`;
        if (dateOrganized) csvContent += `"Date Organized: ${dateOrganized}"\n`;
        csvContent += `\n`;

        csvContent += `"TOTALS: Active Full Members (${memberDemographics.activeFullMembersCount}) - Inactive Full Members (${memberDemographics.inactiveFullMembersCount}) - Fellowship (${memberDemographics.fellowshipCount}) - Visitors (${memberDemographics.visitorsCount}) - Transferred (${memberDemographics.transferredCount}) - Deceased (${memberDemographics.deceasedCount})"\n\n`;

        csvContent += `"NAME","GENDER","BIRTHDAY","DATE RECEIVED","CATEGORY","STATUS","BAPTISM STATUS","BAPTISM DATE","ABROAD"\n`;

        finalData.forEach((m) => {
          const gender = m.gender ? m.gender.charAt(0).toUpperCase() : '';
          const birthday = m.birthDate || m.birthday ? new Date(m.birthDate || m.birthday).toLocaleDateString() : '';
          const dateReceived = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString() : '';
          const category = m.membershipCategory || (m.membershipStatus === 'Active' || m.membershipStatus === 'Inactive' ? 'Full Member' : (m.membershipStatus || 'Full Member'));
          const status = category === 'Full Member' ? (m.membershipStatus === 'Inactive' ? 'Inactive' : 'Active') : category;
          const baptismStatus = m.baptismStatus || 'Not Baptized';
          const baptismDate = m.baptismDate ? new Date(m.baptismDate).toLocaleDateString() : '';
          const abroad = m.isAbroad ? 'Yes' : 'No';

          csvContent += `"${m.displayName}","${gender}","${birthday}","${dateReceived}","${category}","${status}","${baptismStatus}","${baptismDate}","${abroad}"\n`;
        });
      } else if (reportType === 'attendance') {
        csvContent = `"${churchName.toUpperCase()} - SERVICE ATTENDANCE REPORT"\n`;
        csvContent += `"Date Range Filter: ${dateFilter.filterType} (${dateFilter.startDate || 'All'} to ${dateFilter.endDate || 'All'})"\n\n`;
        csvContent += `Date,Service / Event Name,Present Members,Visitors,Late,Total Attendees\n`;

        filteredAttendance.sessions.forEach((a) => {
          csvContent += `"${a.date}","${a.name}","${a.present}","${a.visitors}","${a.late}","${a.total}"\n`;
        });
      } else if (reportType === 'giving') {
        if (!canSeeGiving) throw new Error('Unauthorized');

        let data = filteredGiving.records;
        if (selectedGivingFund !== 'all') {
          data = data.filter((r) => {
            if (r.fundId === selectedGivingFund) return true;
            const fundName = fundsMap[selectedGivingFund];
            if (r.fundType === fundName && !r.fundId) return true;
            return false;
          });
        }

        data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        csvContent = `"${churchName.toUpperCase()} - FINANCIAL GIVING & CONTRIBUTIONS LEDGER"\n`;
        csvContent += `"Date Range: ${dateFilter.filterType} | Fund Filter: ${selectedGivingFund === 'all' ? 'All Funds' : fundsMap[selectedGivingFund] || selectedGivingFund}"\n\n`;
        csvContent += `Date,Donor Name,Fund Type,Payment Method,Amount (PHP),Reference No,Status\n`;

        data.forEach((g) => {
          const fundName = g.fundId && fundsMap[g.fundId] ? fundsMap[g.fundId] : (g.fundType || 'General Offering');
          csvContent += `"${g.date}","${g.donorName || 'Anonymous'}","${fundName}","${g.method || g.paymentMethod || 'Cash'}","${g.amount}","${g.referenceNumber || g.id}","${g.status || 'Verified'}"\n`;
        });
      }

      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate report export.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-church-rose">
              Ministry Intelligence
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[11px] font-medium text-church-slate">
              {churchMeta?.name || 'Local Church'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-church-navy tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs md:text-sm text-church-slate mt-0.5">
            Live attendance patterns, financial stewardship, member demographics, and official district exports.
          </p>
        </div>

        {/* Global Date Filter */}
        <div className="self-start lg:self-center">
          <DateRangeFilter
            defaultFilter="thisMonth"
            onChange={(filter) => setDateFilter(filter)}
          />
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Directory Size */}
        <SoftCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-church-slate">
              Community Size
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-church-navy tracking-tight">
              {memberDemographics.totalCount}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <StatusPill variant="emerald">
                {memberDemographics.activeFullMembersCount} Full
              </StatusPill>
              <StatusPill variant="amber">
                {memberDemographics.fellowshipCount} Fellowship
              </StatusPill>
              <StatusPill variant="rose">
                {memberDemographics.visitorsCount} Visitors
              </StatusPill>
            </div>
          </div>
        </SoftCard>

        {/* Average Service Attendance */}
        <SoftCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-church-slate">
              Avg Attendance
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-church-navy tracking-tight">
              {filteredAttendance.avgAttendance}
              <span className="text-xs font-medium text-church-slate ml-1.5">/ service</span>
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <StatusPill variant="violet">
                {filteredAttendance.totalServices} Services Tracked
              </StatusPill>
              {filteredAttendance.peakAttendance > 0 && (
                <span className="text-[11px] font-bold text-church-slate">
                  Peak: {filteredAttendance.peakAttendance}
                </span>
              )}
            </div>
          </div>
        </SoftCard>

        {/* Financial Stewardship / Giving */}
        {canSeeGiving ? (
          <SoftCard className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-church-slate">
                Period Giving Inflow
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-church-navy tracking-tight">
                {formatCurrency(filteredGiving.totalAmount)}
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <StatusPill variant="emerald">
                  {filteredGiving.count} Donations
                </StatusPill>
                {filteredGiving.fundBreakdown[0] && (
                  <span className="text-[11px] font-bold text-church-slate truncate max-w-[120px]">
                    Top: {filteredGiving.fundBreakdown[0].name}
                  </span>
                )}
              </div>
            </div>
          </SoftCard>
        ) : (
          <SoftCard className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-church-slate">
                Active Participation
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck size={18} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-church-navy tracking-tight">
                {memberDemographics.activeFullMembersCount}
              </div>
              <p className="text-xs text-church-slate mt-2.5">
                Active full members in directory
              </p>
            </div>
          </SoftCard>
        )}

        {/* Spiritual Milestones / Baptism */}
        <SoftCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-church-slate">
              Water Baptism
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-church-rose flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-church-navy tracking-tight">
              {memberDemographics.baptizedCount}
              <span className="text-xs font-medium text-church-slate ml-1.5">
                (
                {memberDemographics.totalCount > 0
                  ? Math.round((memberDemographics.baptizedCount / memberDemographics.totalCount) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <StatusPill variant="rose">
                {memberDemographics.abroadCount} Abroad (OFW)
              </StatusPill>
            </div>
          </div>
        </SoftCard>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Headcount & Trend Chart */}
        <SoftCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-church-navy">Service Attendance Trends</h3>
                  <StatusPill variant="violet">
                    {filteredAttendance.totalServices} Gatherings
                  </StatusPill>
                </div>
                <p className="text-xs text-church-slate mt-0.5">
                  Regular members and first-time visitor headcounts
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAttendanceChartView('breakdown')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    attendanceChartView === 'breakdown'
                      ? 'bg-white text-church-navy shadow-xs'
                      : 'text-church-slate hover:text-church-navy'
                  }`}
                >
                  Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceChartView('total')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    attendanceChartView === 'total'
                      ? 'bg-white text-church-navy shadow-xs'
                      : 'text-church-slate hover:text-church-navy'
                  }`}
                >
                  Total Headcount
                </button>
              </div>
            </div>

            {/* Attendance Chart */}
            <div className="h-64 w-full pt-2">
              {filteredAttendance.sessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  <Calendar size={32} className="text-gray-300 mb-2" />
                  <p className="text-xs font-bold text-church-navy">No attendance recorded in this range</p>
                  <p className="text-[11px] text-church-slate mt-0.5">Try selecting a broader date filter above</p>
                </div>
              ) : (
                <Bar
                  data={attendanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { weight: 'bold', size: 11 } },
                      },
                      tooltip: {
                        backgroundColor: '#1E293B',
                        titleFont: { weight: 'bold' },
                        padding: 10,
                        cornerRadius: 8,
                      },
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        beginAtZero: true,
                        ticks: { stepSize: 10 },
                        grid: { color: '#F1F5F9' },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-church-slate">
            <span>Total Attendees: <strong className="text-church-navy">{filteredAttendance.totalAttendees}</strong></span>
            <span>Total Visitors: <strong className="text-church-rose">{filteredAttendance.totalVisitors}</strong></span>
          </div>
        </SoftCard>

        {/* Fund Distribution & Financial Allocation */}
        {canSeeGiving ? (
          <SoftCard className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-church-navy">Fund Allocation & Giving</h3>
                    <StatusPill variant="emerald">
                      {filteredGiving.fundBreakdown.length} Funds
                    </StatusPill>
                  </div>
                  <p className="text-xs text-church-slate mt-0.5">
                    Distribution of tithes, missions, and dedicated offerings
                  </p>
                </div>
              </div>

              {filteredGiving.fundBreakdown.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  <CreditCard size={32} className="text-gray-300 mb-2" />
                  <p className="text-xs font-bold text-church-navy">No verified donations in this timeframe</p>
                  <p className="text-[11px] text-church-slate mt-0.5">Filter by another range to view allocation</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
                  {/* Doughnut Chart */}
                  <div className="sm:col-span-5 relative h-56 flex items-center justify-center">
                    <Doughnut
                      data={fundChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '72%',
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => ` ${context.label}: ₱${Number(context.raw).toLocaleString()}`,
                            },
                          },
                        },
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-[10px] font-bold uppercase text-church-slate tracking-wider">
                        Total
                      </span>
                      <span className="text-sm font-black text-church-navy">
                        {formatCurrency(filteredGiving.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Fund Distribution Progress Bars */}
                  <div className="sm:col-span-7 space-y-3 max-h-56 overflow-y-auto pr-1">
                    {filteredGiving.fundBreakdown.map((fund) => (
                      <div key={fund.name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: fund.color }}
                            />
                            <span className="font-bold text-church-navy truncate">{fund.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold text-church-slate">
                              {fund.percentage.toFixed(1)}%
                            </span>
                            <span className="font-extrabold text-church-navy">
                              {formatCurrency(fund.amount)}
                            </span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${fund.percentage}%`,
                              backgroundColor: fund.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-church-slate">
              <span>Verified Inflow: <strong className="text-church-navy">{formatCurrency(filteredGiving.totalAmount)}</strong></span>
              <span>Total Transactions: <strong className="text-emerald-600">{filteredGiving.count}</strong></span>
            </div>
          </SoftCard>
        ) : (
          /* Demographic Composition Fallback */
          <SoftCard className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-church-navy">Directory Composition</h3>
                  <p className="text-xs text-church-slate">Breakdown of member roles and classifications</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-church-navy">Active Full Members</span>
                    <span className="text-emerald-600">{memberDemographics.activeFullMembersCount}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${memberDemographics.totalCount ? (memberDemographics.activeFullMembersCount / memberDemographics.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-church-navy">Fellowship Members</span>
                    <span className="text-amber-600">{memberDemographics.fellowshipCount}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{
                        width: `${memberDemographics.totalCount ? (memberDemographics.fellowshipCount / memberDemographics.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-church-navy">Visitors & Seekers</span>
                    <span className="text-rose-600">{memberDemographics.visitorsCount}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-rose-500 h-2 rounded-full"
                      style={{
                        width: `${memberDemographics.totalCount ? (memberDemographics.visitorsCount / memberDemographics.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-church-slate">
              <span>Male: {memberDemographics.maleCount}</span>
              <span>Female: {memberDemographics.femaleCount}</span>
            </div>
          </SoftCard>
        )}
      </div>

      {/* Official Export & Compliance Hub */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-church-navy">Official Export & Compliance Center</h2>
          <p className="text-xs text-church-slate">
            Generate and download verified PDF compliance registers structured for district reporting, board reviews, and church records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Member Demographics Export */}
          <SoftCard className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-church-navy leading-tight">Member Registry</h3>
                    <StatusPill variant="emerald" className="scale-90 origin-left">
                      Official PDF
                    </StatusPill>
                  </div>
                  <p className="text-xs text-church-slate mt-0.5">District-compliant directory</p>
                </div>
              </div>

              <div className="bg-gray-50/80 rounded-2xl p-3 mb-5 border border-gray-100 text-xs text-church-slate space-y-1.5">
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <strong className="text-church-navy">{memberDemographics.totalCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Active Full Members:</span>
                  <strong className="text-church-navy">{memberDemographics.activeFullMembersCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Includes:</span>
                  <span className="text-church-slate font-medium">Baptism, abroad & category</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <GradientButton
                onClick={() => handleExportPDF('members')}
                disabled={exportLoading}
                icon={FileText}
                size="md"
                className="w-full"
              >
                Export Official PDF
              </GradientButton>
              <button
                type="button"
                onClick={() => handleExportCSV('members')}
                disabled={exportLoading}
                className="w-full text-center text-[11px] font-semibold text-church-slate hover:text-church-navy py-0.5 transition-colors"
              >
                Download Raw CSV
              </button>
            </div>
          </SoftCard>

          {/* Service Attendance Export */}
          <SoftCard className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Calendar size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-church-navy leading-tight">Attendance Register</h3>
                    <StatusPill variant="violet" className="scale-90 origin-left">
                      Official PDF
                    </StatusPill>
                  </div>
                  <p className="text-xs text-church-slate mt-0.5">Session dates & headcounts</p>
                </div>
              </div>

              <div className="bg-gray-50/80 rounded-2xl p-3 mb-5 border border-gray-100 text-xs text-church-slate space-y-1.5">
                <div className="flex justify-between">
                  <span>Tracked Sessions:</span>
                  <strong className="text-church-navy">{filteredAttendance.totalServices}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Attendees:</span>
                  <strong className="text-church-navy">{filteredAttendance.totalAttendees}</strong>
                </div>
                <div className="flex justify-between">
                  <span>First-Time Visitors:</span>
                  <strong className="text-church-rose">{filteredAttendance.totalVisitors}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <GradientButton
                onClick={() => handleExportPDF('attendance')}
                disabled={exportLoading || filteredAttendance.sessions.length === 0}
                icon={FileText}
                size="md"
                className="w-full"
              >
                Export Official PDF
              </GradientButton>
              <button
                type="button"
                onClick={() => handleExportCSV('attendance')}
                disabled={exportLoading || filteredAttendance.sessions.length === 0}
                className="w-full text-center text-[11px] font-semibold text-church-slate hover:text-church-navy py-0.5 transition-colors"
              >
                Download Raw CSV
              </button>
            </div>
          </SoftCard>

          {/* Giving & Contributions Export */}
          {canSeeGiving && (
            <SoftCard className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-church-navy leading-tight">Giving Ledger</h3>
                      <StatusPill variant="rose" className="scale-90 origin-left">
                        Audit PDF
                      </StatusPill>
                    </div>
                    <p className="text-xs text-church-slate mt-0.5">Tithes & dedicated funds</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-church-slate mb-1">
                    Filter by Dedicated Fund
                  </label>
                  <ModernDropdown
                    value={selectedGivingFund}
                    onChange={(val) => setSelectedGivingFund(val)}
                    options={[
                      { value: 'all', label: 'All Funds' },
                      ...fundsList.map((f) => ({ value: f.id, label: f.name })),
                    ]}
                  />
                </div>

                <div className="bg-gray-50/80 rounded-2xl p-3 mb-5 border border-gray-100 text-xs text-church-slate space-y-1.5">
                  <div className="flex justify-between">
                    <span>Verified Transactions:</span>
                    <strong className="text-church-navy">{filteredGiving.count}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ledger Inflow:</span>
                    <strong className="text-emerald-600">{formatCurrency(filteredGiving.totalAmount)}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <GradientButton
                  onClick={() => handleExportPDF('giving')}
                  disabled={exportLoading || filteredGiving.records.length === 0}
                  icon={FileText}
                  size="md"
                  className="w-full"
                >
                  Export Official PDF
                </GradientButton>
                <button
                  type="button"
                  onClick={() => handleExportCSV('giving')}
                  disabled={exportLoading || filteredGiving.records.length === 0}
                  className="w-full text-center text-[11px] font-semibold text-church-slate hover:text-church-navy py-0.5 transition-colors"
                >
                  Download Raw CSV
                </button>
              </div>
            </SoftCard>
          )}
        </div>
      </div>
    </div>
  );
}

