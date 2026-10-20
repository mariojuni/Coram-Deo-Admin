import { jsPDF } from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';
import { formatCurrency, formatCurrencyForPdf, sanitizeTextForPdf } from './currency.js';

// Guarantee that autoTable plugin is attached to jsPDF prototype
try {
  applyPlugin(jsPDF);
} catch (e) {
  // Ignored if already attached
}

/**
 * Universal autoTable caller that works across different bundlers & environments
 */
function runAutoTable(doc, options) {
  if (typeof doc.autoTable === 'function') {
    return doc.autoTable(options);
  }
  if (typeof autoTable === 'function') {
    return autoTable(doc, options);
  }
  if (autoTable && typeof autoTable.default === 'function') {
    return autoTable.default(doc, options);
  }
  throw new Error('AutoTable plugin is not available on jsPDF');
}

/**
 * Safely loads an image URL into a Base64 data string with timeout and CORS safety
 */
async function getBase64ImageFromUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) return null;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(null);
    }, 1200);

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 120;
          canvas.height = img.naturalHeight || img.height || 120;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
      img.src = imageUrl;
    } catch (e) {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

/**
 * Formats full physical address from church metadata
 */
function getFullAddress(meta) {
  if (!meta) return '';
  if (meta.fullAddress) return meta.fullAddress;
  const parts = [
    meta.address,
    meta.city,
    meta.province,
    meta.postalCode,
    meta.country
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Draws the official Church Header on the active PDF page.
 * NOTE: As per reporting requirements, Senior Pastor, Denominational council affiliation,
 * and individual generator name ('Gen By') are strictly excluded from the header.
 *
 * @param {jsPDF} doc
 * @param {Object} churchMeta
 * @param {string} reportTitle
 * @param {string} periodText
 * @param {string|null} logoBase64
 * @returns {number} The Y position where content can begin
 */
function drawOfficialHeader(doc, churchMeta, reportTitle, periodText, logoBase64) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let cursorY = 14;

  const churchName = (
    churchMeta?.churchName ||
    churchMeta?.name ||
    'CORAM DEO CHURCH'
  ).toUpperCase();

  const fullAddress = getFullAddress(churchMeta);
  const phone = churchMeta?.contact?.phone || churchMeta?.phone || '';
  const email = churchMeta?.contact?.email || churchMeta?.email || '';
  const website = churchMeta?.social?.website || churchMeta?.website || '';

  // Contact line elements
  const contactParts = [];
  if (phone) contactParts.push(`Tel: ${phone}`);
  if (email) contactParts.push(`Email: ${email}`);
  if (website) contactParts.push(`Web: ${website}`);
  const contactLine = contactParts.join('  •  ');

  const hasLogo = Boolean(logoBase64 && typeof logoBase64 === 'string' && logoBase64.startsWith('data:image/'));
  const logoWidth = 18;
  const logoHeight = 18;
  const textStartX = hasLogo ? margin + logoWidth + 6 : margin;

  if (hasLogo) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, cursorY, logoWidth, logoHeight, undefined, 'FAST');
    } catch (err) {
      console.warn('Failed to embed logo image into PDF:', err);
    }
  }

  // Church Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(24, 39, 75); // Deep Navy (#18274B)
  doc.text(churchName, textStartX, cursorY + 5);

  // Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // Slate (#475569)
  if (fullAddress) {
    doc.text(fullAddress, textStartX, cursorY + 10.5);
  }

  // Contact info
  if (contactLine) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(contactLine, textStartX, cursorY + 15.5);
  }

  cursorY = Math.max(cursorY + logoHeight + 2, cursorY + 18);

  // Thin dividing line
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 4;

  // Report Title Banner Box
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 12, 1.5, 1.5, 'S');

  // Title Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text(sanitizeTextForPdf(reportTitle.toUpperCase()), margin + 5, cursorY + 7.5);

  // Date and Scope Text (Right Aligned)
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const subText = periodText ? `${periodText}  |  Generated: ${currentDate}` : `Generated: ${currentDate}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(sanitizeTextForPdf(subText), pageWidth - margin - 5, cursorY + 7.5, { align: 'right' });

  cursorY += 15;
  return cursorY;
}

/**
 * Draws executive metric KPI summary badges
 */
function drawKpiBadges(doc, startY, items) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const availableWidth = pageWidth - margin * 2;
  const gap = 4;
  const cardWidth = (availableWidth - gap * (items.length - 1)) / items.length;
  const cardHeight = 13;

  items.forEach((item, idx) => {
    const x = margin + idx * (cardWidth + gap);

    // Card background
    doc.setFillColor(241, 245, 249); // #F1F5F9
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label.toUpperCase(), x + cardWidth / 2, startY + 4.5, { align: 'center' });

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (typeof item.color === 'string') {
      doc.setTextColor(item.color);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(sanitizeTextForPdf(String(item.value)), x + cardWidth / 2, startY + 10, { align: 'center' });
  });

  return startY + cardHeight + 5;
}

/**
 * Adds official footer and page numbering across all generated pages
 */
function stampPageFooters(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    // Confidentiality notice on left
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // #94A3B8
    doc.text('OFFICIAL COMPLIANCE REPORT • CONFIDENTIAL CHURCH RECORD', margin, pageHeight - 6.5);

    // Page number on right
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }
}

/**
 * 1. MEMBER DEMOGRAPHICS REGISTER PDF
 */
export async function exportMemberRegistryPdf(memberDemographics, churchMeta) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let logoBase64 = null;
  try {
    logoBase64 = await getBase64ImageFromUrl(churchMeta?.logoUrl);
  } catch (e) {
    logoBase64 = null;
  }

  const startY = drawOfficialHeader(
    doc,
    churchMeta,
    'Official Member Registry & Demographics Directory',
    `Active Membership Roll`,
    logoBase64
  );

  // KPI Summary Items with safe hex colors
  const kpis = [
    { label: 'Total Records', value: memberDemographics?.totalCount || 0 },
    { label: 'Active Full Members', value: memberDemographics?.activeFullMembersCount || 0, color: '#166534' },
    { label: 'Inactive Members', value: memberDemographics?.inactiveFullMembersCount || 0, color: '#64748B' },
    { label: 'Fellowship / Affiliates', value: memberDemographics?.fellowshipCount || 0, color: '#1E40AF' },
    { label: 'Visitors / Seekers', value: memberDemographics?.visitorsCount || 0, color: '#BE185D' },
    { label: 'Male / Female', value: `${memberDemographics?.maleCount || 0} / ${memberDemographics?.femaleCount || 0}` },
  ];

  const tableStartY = drawKpiBadges(doc, startY, kpis);

  const rows = (memberDemographics?.all || []).map((m, index) => {
    const gender = m.gender ? m.gender.charAt(0).toUpperCase() : '-';
    const birthday = m.birthDate || m.birthday ? new Date(m.birthDate || m.birthday).toLocaleDateString() : '-';
    const dateReceived = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString() : '-';
    const category = m.membershipCategory || (m.membershipStatus === 'Active' || m.membershipStatus === 'Inactive' ? 'Full Member' : (m.membershipStatus || 'Full Member'));
    const status = category === 'Full Member' ? (m.membershipStatus === 'Inactive' ? 'Inactive' : 'Active') : category;
    const baptismStatus = m.baptismStatus || 'Not Baptized';
    const baptismDate = m.baptismDate ? new Date(m.baptismDate).toLocaleDateString() : '-';
    const abroad = m.isAbroad ? 'Yes' : 'No';

    return [
      index + 1,
      m.displayName || 'Unnamed Member',
      gender,
      birthday,
      dateReceived,
      category,
      status,
      baptismStatus,
      baptismDate,
      abroad,
    ];
  });

  runAutoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14, bottom: 18 },
    head: [[
      '#',
      'Full Name',
      'Gender',
      'Birthday',
      'Date Received',
      'Category',
      'Status',
      'Baptism',
      'Baptism Date',
      'Abroad',
    ]],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [24, 39, 75], // Deep Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 24 },
      4: { cellWidth: 25 },
      5: { cellWidth: 32 },
      6: { cellWidth: 24 },
      7: { cellWidth: 28 },
      8: { cellWidth: 25 },
      9: { cellWidth: 18, halign: 'center' },
    },
  });

  stampPageFooters(doc);
  const filename = `Official_Member_Registry_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * 2. SERVICE ATTENDANCE REGISTER PDF
 */
export async function exportAttendanceRegisterPdf(filteredAttendance, dateFilter, churchMeta) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let logoBase64 = null;
  try {
    logoBase64 = await getBase64ImageFromUrl(churchMeta?.logoUrl);
  } catch (e) {
    logoBase64 = null;
  }

  const periodText = dateFilter?.filterType
    ? `Period: ${dateFilter.filterType} (${dateFilter.startDate || 'All'} - ${dateFilter.endDate || 'All'})`
    : 'All Recorded Sessions';

  const startY = drawOfficialHeader(
    doc,
    churchMeta,
    'Official Service Attendance Register',
    periodText,
    logoBase64
  );

  const kpis = [
    { label: 'Tracked Sessions', value: filteredAttendance?.totalServices || 0 },
    { label: 'Total Attendees', value: filteredAttendance?.totalAttendees || 0, color: '#166534' },
    { label: 'First-Time Visitors', value: filteredAttendance?.totalVisitors || 0, color: '#BE185D' },
    { label: 'Avg / Session', value: filteredAttendance?.avgAttendance || 0, color: '#1E40AF' },
  ];

  const tableStartY = drawKpiBadges(doc, startY, kpis);

  const rows = (filteredAttendance?.sessions || []).map((s, index) => [
    index + 1,
    s.date || '-',
    s.name || 'Worship Service',
    s.present || 0,
    s.visitors || 0,
    s.late || 0,
    s.total || 0,
  ]);

  runAutoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14, bottom: 18 },
    head: [[
      '#',
      'Service Date',
      'Service / Event Name',
      'Members',
      'Visitors',
      'Late',
      'Total Headcount',
    ]],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [88, 28, 135], // Deep Purple (#581C87)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [250, 245, 255],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 62, fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
  });

  stampPageFooters(doc);
  const filename = `Official_Attendance_Register_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * 3. FINANCIAL GIVING & CONTRIBUTIONS LEDGER PDF
 */
export async function exportGivingLedgerPdf(filteredGiving, selectedGivingFund, fundsMap, dateFilter, churchMeta) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let logoBase64 = null;
  try {
    logoBase64 = await getBase64ImageFromUrl(churchMeta?.logoUrl);
  } catch (e) {
    logoBase64 = null;
  }

  const fundLabel = selectedGivingFund === 'all'
    ? 'All Dedicated Funds'
    : fundsMap[selectedGivingFund] || selectedGivingFund;

  const periodText = `Fund: ${fundLabel}  |  Period: ${dateFilter?.filterType || 'All'}`;

  const startY = drawOfficialHeader(
    doc,
    churchMeta,
    'Official Financial Giving & Contributions Ledger',
    periodText,
    logoBase64
  );

  let data = filteredGiving?.records || [];
  if (selectedGivingFund !== 'all') {
    data = data.filter((r) => {
      if (r.fundId === selectedGivingFund) return true;
      const fundName = fundsMap[selectedGivingFund];
      if (r.fundType === fundName && !r.fundId) return true;
      return false;
    });
  }
  data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const totalInflow = data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const currencyConfig = churchMeta?.currency;

  const kpis = [
    { label: 'Audited Transactions', value: data.length },
    {
      label: 'Verified Total Inflow',
      value: formatCurrencyForPdf(totalInflow, currencyConfig),
      color: '#166534',
    },
    { label: 'Selected Fund', value: sanitizeTextForPdf(fundLabel) },
  ];

  const tableStartY = drawKpiBadges(doc, startY, kpis);

  const rows = data.map((g, index) => {
    const fundName = sanitizeTextForPdf(g.fundId && fundsMap[g.fundId] ? fundsMap[g.fundId] : (g.fundType || 'General Offering'));
    const paymentMethod = sanitizeTextForPdf(g.method || g.paymentMethod || 'Cash');
    const donorName = sanitizeTextForPdf(g.donorName || 'Anonymous Contributor');
    const refNo = sanitizeTextForPdf(g.referenceNumber || g.id || '-');
    const status = sanitizeTextForPdf(g.status || 'Verified');
    const formattedAmount = formatCurrencyForPdf(g.amount, currencyConfig);

    return [
      index + 1,
      g.date || '-',
      donorName,
      fundName,
      paymentMethod,
      refNo,
      status,
      formattedAmount,
    ];
  });

  const currencyCode = currencyConfig?.code || 'PHP';
  const amountColHeader = `Amount (${currencyCode})`;

  runAutoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14, bottom: 18 },
    head: [[
      '#',
      'Transaction Date',
      'Donor Name',
      'Fund Name',
      'Payment Method',
      'Reference / Txn #',
      'Status',
      amountColHeader,
    ]],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [5, 150, 105], // Deep Emerald (#059669)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 55, fontStyle: 'bold' },
      3: { cellWidth: 45 },
      4: { cellWidth: 32 },
      5: { cellWidth: 38 },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
  });

  stampPageFooters(doc);
  const filename = `Official_Giving_Ledger_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * 4. OFFICIAL EXPENSES & DISBURSEMENTS LEDGER PDF
 */
export async function exportExpenseLedgerPdf(filteredExpenses, selectedExpenseFund, fundsMap, dateFilter, churchMeta) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let logoBase64 = null;
  try {
    logoBase64 = await getBase64ImageFromUrl(churchMeta?.logoUrl);
  } catch (e) {
    logoBase64 = null;
  }

  const fundLabel = selectedExpenseFund === 'all'
    ? 'All Dedicated Funds'
    : fundsMap[selectedExpenseFund] || selectedExpenseFund;

  const periodText = `Fund: ${fundLabel}  |  Period: ${dateFilter?.filterType || 'All'}`;

  const startY = drawOfficialHeader(
    doc,
    churchMeta,
    'Official Church Expenses & Disbursements Ledger',
    periodText,
    logoBase64
  );

  let data = filteredExpenses?.records || [];
  if (selectedExpenseFund !== 'all') {
    data = data.filter((r) => {
      if (r.fundId === selectedExpenseFund) return true;
      const fundName = fundsMap[selectedExpenseFund];
      if (r.fundType === fundName && !r.fundId) return true;
      return false;
    });
  }
  data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const totalOutflow = data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const currencyConfig = churchMeta?.currency;

  const kpis = [
    { label: 'Audited Disbursements', value: data.length },
    {
      label: 'Verified Total Outflow',
      value: formatCurrencyForPdf(totalOutflow, currencyConfig),
      color: '#BE123C',
    },
    { label: 'Selected Fund', value: sanitizeTextForPdf(fundLabel) },
  ];

  const tableStartY = drawKpiBadges(doc, startY, kpis);

  const rows = data.map((ex, index) => {
    const fundName = sanitizeTextForPdf(ex.fundId && fundsMap[ex.fundId] ? fundsMap[ex.fundId] : (ex.fundType || 'General Fund'));
    const payee = sanitizeTextForPdf(ex.payee || 'Unspecified Payee');
    const category = sanitizeTextForPdf(ex.category || 'General');
    const description = sanitizeTextForPdf(ex.description || '-');
    const formattedAmount = formatCurrencyForPdf(ex.amount, currencyConfig);

    return [
      index + 1,
      ex.date || '-',
      payee,
      category,
      fundName,
      description,
      formattedAmount,
    ];
  });

  const currencyCode = currencyConfig?.code || 'PHP';
  const amountColHeader = `Amount (${currencyCode})`;

  runAutoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14, bottom: 18 },
    head: [[
      '#',
      'Disbursement Date',
      'Payee / Vendor',
      'Category',
      'Fund Charged',
      'Description / Purpose',
      amountColHeader,
    ]],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [190, 18, 60], // Deep Rose (#be123c)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [255, 241, 242], // Rose-50
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 48, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 38 },
      5: { cellWidth: 72 },
      6: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
  });

  stampPageFooters(doc);
  const filename = `Official_Expense_Ledger_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * 5. EXECUTIVE BOARD FINANCIAL STATEMENT & BALANCE SHEET PDF
 */
export async function exportBoardStatementPdf(
  filteredGiving,
  filteredExpenses,
  fundsMap,
  fundsList,
  dateFilter,
  churchMeta
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  let logoBase64 = null;
  try {
    logoBase64 = await getBase64ImageFromUrl(churchMeta?.logoUrl);
  } catch (e) {
    logoBase64 = null;
  }

  const periodText = `Scope: Consolidated All Funds  |  Period: ${dateFilter?.filterType || 'All'}`;

  const startY = drawOfficialHeader(
    doc,
    churchMeta,
    'Executive Board Financial Statement & Stewardship Balance Sheet',
    periodText,
    logoBase64
  );

  const givingRecords = filteredGiving?.records || [];
  const expenseRecords = filteredExpenses?.records || [];

  const totalInflow = givingRecords.reduce((s, g) => s + (Number(g.amount) || 0), 0);
  const totalOutflow = expenseRecords.reduce((s, ex) => s + (Number(ex.amount) || 0), 0);
  const netStewardship = totalInflow - totalOutflow;
  const currencyConfig = churchMeta?.currency;
  const currencyCode = currencyConfig?.code || 'PHP';

  // 1. Executive KPI Badges
  const kpis = [
    {
      label: 'Audited Inflow (Giving)',
      value: formatCurrencyForPdf(totalInflow, currencyConfig),
      color: '#166534',
    },
    {
      label: 'Audited Outflow (Expenses)',
      value: formatCurrencyForPdf(totalOutflow, currencyConfig),
      color: '#BE123C',
    },
    {
      label: 'Net Stewardship Balance',
      value: `${netStewardship >= 0 ? '+' : ''}${formatCurrencyForPdf(netStewardship, currencyConfig)}`,
      color: netStewardship >= 0 ? '#15803D' : '#B91C1C',
    },
    {
      label: 'Governance Status',
      value: netStewardship >= 0 ? 'Surplus Operational Reserve' : 'Deficit Drawdown',
      color: netStewardship >= 0 ? '#15803D' : '#B91C1C',
    },
  ];

  let currentY = drawKpiBadges(doc, startY, kpis);

  // 2. Fund Allocation & Movement Breakdown
  // Collect all known fund keys
  const fundKeys = new Set([
    ...(fundsList || []).map((f) => f.id),
    ...givingRecords.map((g) => g.fundId).filter(Boolean),
    ...expenseRecords.map((e) => e.fundId).filter(Boolean),
  ]);

  const fundDataMap = {};

  fundKeys.forEach((fId) => {
    const name = fundsMap[fId] || fId;
    fundDataMap[fId] = { id: fId, name, inflow: 0, outflow: 0 };
  });

  // Also handle records without fundId (general)
  const generalKey = '__general__';
  fundDataMap[generalKey] = { id: generalKey, name: 'General Offering & Ministry', inflow: 0, outflow: 0 };

  givingRecords.forEach((g) => {
    const key = g.fundId && fundDataMap[g.fundId] ? g.fundId : generalKey;
    fundDataMap[key].inflow += Number(g.amount) || 0;
  });

  expenseRecords.forEach((ex) => {
    const key = ex.fundId && fundDataMap[ex.fundId] ? ex.fundId : generalKey;
    fundDataMap[key].outflow += Number(ex.amount) || 0;
  });

  // Filter out funds with 0 inflow and 0 outflow unless it's general
  const fundRows = Object.values(fundDataMap)
    .filter((f) => f.inflow > 0 || f.outflow > 0 || f.id === generalKey)
    .sort((a, b) => b.inflow - a.inflow);

  const fundTableBody = fundRows.map((f, idx) => {
    const net = f.inflow - f.outflow;
    const share = totalInflow > 0 ? ((f.inflow / totalInflow) * 100).toFixed(1) + '%' : '0.0%';
    const netFormatted = `${net >= 0 ? '+' : ''}${formatCurrencyForPdf(net, currencyConfig)}`;
    const status = net >= 0 ? 'Surplus' : 'Deficit';

    return [
      idx + 1,
      sanitizeTextForPdf(f.name),
      formatCurrencyForPdf(f.inflow, currencyConfig),
      formatCurrencyForPdf(f.outflow, currencyConfig),
      netFormatted,
      status,
      share,
    ];
  });

  // Add Grand Total row to Fund Table
  const totalNetFormatted = `${netStewardship >= 0 ? '+' : ''}${formatCurrencyForPdf(netStewardship, currencyConfig)}`;
  fundTableBody.push([
    '',
    'CONSOLIDATED TOTAL',
    formatCurrencyForPdf(totalInflow, currencyConfig),
    formatCurrencyForPdf(totalOutflow, currencyConfig),
    totalNetFormatted,
    netStewardship >= 0 ? 'Operating Surplus' : 'Operating Deficit',
    '100.0%',
  ]);

  // Section 1 Header text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('I. STATEMENT OF REVENUES, DISBURSEMENTS & DEDICATED FUND BALANCES', margin, currentY + 2);
  currentY += 4.5;

  runAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 18 },
    head: [[
      '#',
      'Ministry / Dedicated Fund Name',
      `Inflow (${currencyCode})`,
      `Outflow (${currencyCode})`,
      `Net Movement (${currencyCode})`,
      'Status',
      '% Inflow',
    ]],
    body: fundTableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70, fontStyle: 'bold' },
      2: { cellWidth: 42, halign: 'right' },
      3: { cellWidth: 42, halign: 'right' },
      4: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 32, halign: 'center' },
      6: { cellWidth: 28, halign: 'right' },
    },
    didParseCell: (data) => {
      // Highlight Grand Total row
      if (data.row.index === fundTableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
  });

  currentY = doc.lastAutoTable.finalY + 7;

  // 3. Category Outflow Breakdown Table
  const categoryMap = {};
  expenseRecords.forEach((ex) => {
    const cat = ex.category || 'General Operations';
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, amount: 0 };
    categoryMap[cat].count += 1;
    categoryMap[cat].amount += Number(ex.amount) || 0;
  });

  const categoryRows = Object.entries(categoryMap)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([catName, info], idx) => {
      const share = totalOutflow > 0 ? ((info.amount / totalOutflow) * 100).toFixed(1) + '%' : '0.0%';
      return [
        idx + 1,
        sanitizeTextForPdf(catName),
        info.count,
        formatCurrencyForPdf(info.amount, currencyConfig),
        share,
      ];
    });

  if (categoryRows.length > 0) {
    // If not enough room for category table and attestation, start new page
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('II. OPERATIONAL OUTFLOW ANALYSIS BY EXPENDITURE CATEGORY', margin, currentY + 2);
    currentY += 4.5;

    runAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 18 },
      head: [[
        '#',
        'Expenditure Category',
        'Disbursements Count',
        `Total Outflow (${currencyCode})`,
        '% of Total Outflow',
      ]],
      body: categoryRows,
      theme: 'striped',
      headStyles: {
        fillColor: [190, 18, 60], // Deep Rose (#BE123C)
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [255, 241, 242], // Rose-50
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 95, fontStyle: 'bold' },
        2: { cellWidth: 45, halign: 'center' },
        3: { cellWidth: 65, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 54, halign: 'right' },
      },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // 4. Governance Certification & Sign-off Block
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Audit Certification: We, the undersigned church fiduciaries, certify that this executive statement accurately reflects all verified fund inflows, disbursements, and net stewardship reserves for the stated reporting period.',
    margin,
    currentY
  );
  currentY += 6;

  const boxWidth = (pageWidth - margin * 2 - 20) / 2;
  const boxHeight = 22;

  // Treasurer signature box
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Prepared by: Church Treasurer / Finance Officer', margin + 4, currentY + 5);
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 4, currentY + 14, margin + boxWidth - 4, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('Signature & Date Verified', margin + 4, currentY + 18.5);

  // Elder / Pastor signature box
  const rightBoxX = margin + boxWidth + 20;
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(rightBoxX, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Audited & Approved by: Senior Pastor / Board Chairman', rightBoxX + 4, currentY + 5);
  doc.setDrawColor(148, 163, 184);
  doc.line(rightBoxX + 4, currentY + 14, rightBoxX + boxWidth - 4, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('Official Seal / Signature & Date', rightBoxX + 4, currentY + 18.5);

  stampPageFooters(doc);
  const filename = `Executive_Board_Financial_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}


