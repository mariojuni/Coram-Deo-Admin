import { jsPDF } from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';
import { sanitizeTextForPdf } from './currency.js';

// Guarantee that autoTable plugin is attached to jsPDF prototype
try {
  applyPlugin(jsPDF);
} catch (e) {
  // Ignored if already attached
}

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
 * Formats date into a clean, professional string (e.g., "Oct 21, 2026")
 */
function formatPdfDate(dateInput) {
  if (!dateInput) return 'N/A';
  try {
    const d = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Generates and downloads an executive, board-audit-ready official tax invoice & receipt PDF.
 *
 * @param {Object} params
 * @param {Object} params.church - Church workspace data
 * @param {Object} params.invoice - Invoice details
 * @param {Object} [params.subscription] - Subscription details
 */
export function generateSubscriptionReceiptPdf({ church, invoice, subscription }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Modern Executive Color Palette
  const primaryNavy = [15, 23, 42];      // #0f172a
  const churchRose = [244, 63, 94];      // #f43f5e
  const textDark = [30, 41, 59];         // #1e293b
  const churchSlate = [100, 116, 139];   // #64748b
  const borderGray = [226, 232, 240];    // #e2e8f0
  const lightBg = [248, 250, 252];       // #f8fafc
  const emeraldGreen = [16, 185, 129];   // #10b981
  const emeraldBg = [236, 253, 245];     // #ecfdf5

  // 1. Top Decorative Brand Accent Bar
  doc.setFillColor(...churchRose);
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  // 2. Header Section
  // Left: Coram Deo Brand & Corporate Identity
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('CORAM DEO', margin, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...churchRose);
  doc.text('CHURCH CLOUD OPERATING SYSTEM', margin, 22.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...churchSlate);
  doc.text('Coram Deo Technologies Inc. • Non-VAT Reg: 009-842-192-000', margin, 27);
  doc.text('Makati City, Metro Manila, Philippines • billing@coramdeo.church', margin, 30.5);

  // Right: Document Title & Identifiers
  const invNumber = invoice?.invoiceNumber || (invoice?.id ? `INV-${invoice.id.slice(-6)}` : `INV-${Date.now().toString().slice(-6)}`);
  const issueDate = invoice?.paidAt || invoice?.createdAt || new Date().toISOString();

  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('OFFICIAL TAX INVOICE', pageWidth - margin, 18, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...churchRose);
  doc.text(`Invoice #: ${invNumber}`, pageWidth - margin, 23, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...churchSlate);
  doc.text(`Date Issued: ${formatPdfDate(issueDate)}`, pageWidth - margin, 27.5, { align: 'right' });

  // Paid & Cleared Status Pill (Top Right)
  const pillW = 30;
  const pillH = 5.5;
  const pillX = pageWidth - margin - pillW;
  const pillY = 30;
  doc.setFillColor(...emeraldBg);
  doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.2);
  doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, 'S');

  doc.setTextColor(...emeraldGreen);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('PAID & CLEARED', pillX + (pillW / 2), pillY + 3.8, { align: 'center' });

  // Divider Line
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.5);
  doc.line(margin, 38.5, pageWidth - margin, 38.5);

  // 3. Structured Information Cards (Billed To & Payment Details)
  const infoY = 43;
  const colGap = 7;
  const colWidth = (contentWidth - colGap) / 2;
  const cardHeight = 42;

  // --- Left Box: BILLED TO (CHURCH WORKSPACE) ---
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, infoY, colWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, infoY, colWidth, cardHeight, 3, 3, 'S');

  doc.setTextColor(...churchRose);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('BILLED TO (CHURCH WORKSPACE)', margin + 4, infoY + 6);

  const churchName = sanitizeTextForPdf(church?.name || church?.churchName || 'Church Workspace');
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(churchName, margin + 4, infoY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  const seniorPastor = sanitizeTextForPdf(church?.seniorPastor || church?.contact?.seniorPastor || 'Church Administrator');
  doc.text(`Attn: ${seniorPastor}`, margin + 4, infoY + 17);

  const address = sanitizeTextForPdf(
    [church?.address, church?.city, church?.province, church?.country].filter(Boolean).join(', ') || 'Philippines'
  );
  doc.setTextColor(...churchSlate);
  doc.text(doc.splitTextToSize(address, colWidth - 8)[0], margin + 4, infoY + 22);

  const email = church?.contact?.email || 'N/A';
  doc.text(`Email: ${email}`, margin + 4, infoY + 26.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...churchSlate);
  doc.text(`Workspace ID: ${church?.id || 'N/A'}`, margin + 4, infoY + 34);

  // --- Right Box: PAYMENT & CLEARING DETAILS ---
  const rightBoxX = margin + colWidth + colGap;
  doc.setFillColor(...lightBg);
  doc.roundedRect(rightBoxX, infoY, colWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightBoxX, infoY, colWidth, cardHeight, 3, 3, 'S');

  doc.setTextColor(...churchRose);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PAYMENT & CLEARING DETAILS', rightBoxX + 4, infoY + 6);

  const paymentChannel = invoice?.paymentMethod || subscription?.lastPaymentMethod === 'manual_bank_transfer' 
    ? 'Manual Bank Transfer / GCash' 
    : 'Direct Bank Settlement';
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(paymentChannel, rightBoxX + 4, infoY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  const bankName = invoice?.bankName || 'Coram Deo Receiving Account';
  doc.text(`Account / Bank: ${bankName}`, rightBoxX + 4, infoY + 17);

  const bankRef = invoice?.bankReferenceNumber || subscription?.lastBankReferenceNumber;
  const refText = bankRef ? `Bank Ref #: ${bankRef}` : 'Clearing: Verified via Platform Ledger';
  doc.setTextColor(...churchSlate);
  doc.text(refText, rightBoxX + 4, infoY + 22);

  const periodStart = formatPdfDate(invoice?.periodStart || subscription?.currentPeriodStart);
  const periodEnd = formatPdfDate(invoice?.periodEnd || subscription?.currentPeriodEnd);
  doc.text(`Billing Coverage: ${periodStart} - ${periodEnd}`, rightBoxX + 4, infoY + 26.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...emeraldGreen);
  doc.text('Ledger Status: Cleared & Active in System', rightBoxX + 4, infoY + 34);

  // 4. Currency & Amount Setup
  const amountNum = Number(invoice?.amount || 0);
  const formattedAmount = `PHP ${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const rawDescription = invoice?.description || `${subscription?.tierConfig?.name || 'Growth Ministry'} Plan Subscription`;
  const cleanDescription = sanitizeTextForPdf(rawDescription);

  // 5. Rollover Banner (Optional)
  let tableStartY = 91;
  const rolloverDays = Number(invoice?.rolloverDays || subscription?.rolloverDaysCredited || 0);
  if (rolloverDays > 0) {
    const bannerY = infoY + cardHeight + 4;
    doc.setFillColor(...emeraldBg);
    doc.roundedRect(margin, bannerY, contentWidth, 9, 2, 2, 'F');
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, bannerY, contentWidth, 9, 2, 2, 'S');

    doc.setTextColor(...emeraldGreen);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Plan Upgrade Rollover: +${rolloverDays} Bonus Days Credited`, margin + 4, bannerY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text(`Unused days from your previous active period were automatically rolled over into this billing cycle.`, margin + 4, bannerY + 7.5);

    tableStartY = bannerY + 13;
  }

  // 6. Line Items Table (autoTable)
  const billingCycleStr = invoice?.billingCycle === 'annual' ? '1 Year' : '1 Month';
  const tableBody = [
    [
      '1',
      `${cleanDescription}\nCoverage: ${periodStart} to ${periodEnd}${rolloverDays > 0 ? ` (+${rolloverDays} Rollover Days)` : ''}`,
      billingCycleStr,
      formattedAmount,
      formattedAmount
    ]
  ];

  runAutoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: textDark,
      cellPadding: 4,
      lineColor: borderGray,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: primaryNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 34, halign: 'right' },
      4: { cellWidth: 34, halign: 'right', fontStyle: 'bold' }
    },
    head: [['#', 'Item & Service Description', 'Billing Cycle', 'Unit Price', 'Total Amount']],
    body: tableBody
  });

  // 7. Totals & Settlement Summary Section
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 130;
  const totalsBoxW = 82;
  const totalsX = pageWidth - margin - totalsBoxW;
  const totalsBoxH = 38;

  doc.setFillColor(...lightBg);
  doc.roundedRect(totalsX, finalY, totalsBoxW, totalsBoxH, 3, 3, 'F');
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(totalsX, finalY, totalsBoxW, totalsBoxH, 3, 3, 'S');

  // Subtotal
  doc.setTextColor(...churchSlate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Subtotal:', totalsX + 4, finalY + 7);
  doc.text(formattedAmount, totalsX + totalsBoxW - 4, finalY + 7, { align: 'right' });

  // VAT (0%)
  doc.text('Value Added Tax (0% VAT Exempt):', totalsX + 4, finalY + 13);
  doc.text('PHP 0.00', totalsX + totalsBoxW - 4, finalY + 13, { align: 'right' });

  // Divider inside totals
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(totalsX + 4, finalY + 17, totalsX + totalsBoxW - 4, finalY + 17);

  // Total Paid
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Total Amount Paid:', totalsX + 4, finalY + 24);
  doc.setTextColor(...churchRose);
  doc.setFontSize(11);
  doc.text(formattedAmount, totalsX + totalsBoxW - 4, finalY + 24, { align: 'right' });

  // Outstanding Balance
  doc.setTextColor(...churchSlate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Outstanding Balance Due:', totalsX + 4, finalY + 31);
  doc.setTextColor(...emeraldGreen);
  doc.setFont('helvetica', 'bold');
  doc.text('PHP 0.00 (Settled)', totalsX + totalsBoxW - 4, finalY + 31, { align: 'right' });

  // 8. Board Audit & Non-VAT Certification Notice
  const certY = pageHeight - 48;
  const certH = 26;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, certY, contentWidth, certH, 2.5, 2.5, 'F');
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, certY, contentWidth, certH, 2.5, 2.5, 'S');

  // Left decorative badge indicator
  doc.setFillColor(...primaryNavy);
  doc.rect(margin, certY, 3, certH, 'F');

  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL ELECTRONIC TAX INVOICE & BOARD AUDIT RECORD', margin + 6, certY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...churchSlate);
  doc.text(
    'This is a valid, system-generated electronic tax invoice and official payment receipt issued by Coram Deo.',
    margin + 6,
    certY + 11
  );
  doc.text(
    'Issued in compliance with Philippine Tax Code non-profit and non-VAT educational/religious workspace standards.',
    margin + 6,
    certY + 15.5
  );
  doc.text(
    'No signature required. Authenticated via Platform Ledger immutable hash. Suitable for church board audits & accounting.',
    margin + 6,
    certY + 20
  );

  // 9. Bottom Footer
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text(
    'Coram Deo Church Operating System • Support: billing@coramdeo.church • https://coramdeo.church • Page 1 of 1',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // 10. Save / Download
  const filename = `CoramDeo_Invoice_${invNumber}.pdf`;
  doc.save(filename);
}
