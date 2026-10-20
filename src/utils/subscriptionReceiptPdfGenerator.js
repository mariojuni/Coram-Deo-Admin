import { jsPDF } from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';

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
 * Generates and downloads an official board-ready subscription receipt PDF.
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
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2);

  // Palette
  const primaryNavy = [15, 23, 42];
  const churchRose = [255, 87, 127];
  const churchSlate = [100, 116, 139];
  const emeraldGreen = [16, 185, 129];
  const lightBg = [248, 250, 252];

  // 1. Top Decorative Brand Accent Bar
  doc.setFillColor(...churchRose);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Header: Logo / Company Name
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CORAM DEO', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...churchSlate);
  doc.text('CHURCH OPERATING SYSTEM & WORKSPACE MANAGEMENT', margin, 24);

  // Invoice / Receipt Title (Right Aligned)
  doc.setTextColor(...churchRose);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PAYMENT RECEIPT', pageWidth - margin, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...churchSlate);
  const invNumber = invoice?.invoiceNumber || `INV-${(invoice?.id || Date.now().toString()).slice(-6)}`;
  doc.text(`Receipt #: ${invNumber}`, pageWidth - margin, 25, { align: 'right' });
  
  const issueDate = invoice?.paidAt || invoice?.createdAt || new Date().toISOString();
  doc.text(`Date Issued: ${new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, pageWidth - margin, 30, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);

  // 3. Church & Billing Information Boxes
  const infoY = 42;
  const colWidth = (contentWidth - 10) / 2;

  // Church Recipient (Billed To)
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, infoY, colWidth, 38, 3, 3, 'F');

  doc.setTextColor(...churchRose);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('BILLED TO (CHURCH WORKSPACE)', margin + 4, infoY + 6);

  doc.setTextColor(...primaryNavy);
  doc.setFontSize(11);
  const churchName = church?.name || church?.churchName || 'Faith Fellowship Church';
  doc.text(churchName, margin + 4, infoY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...churchSlate);
  const seniorPastor = church?.seniorPastor || church?.contact?.seniorPastor || 'Church Administrator';
  doc.text(`Attn: ${seniorPastor}`, margin + 4, infoY + 17);

  const address = church?.city || church?.address || 'Philippines';
  doc.text(address, margin + 4, infoY + 22);

  const email = church?.contact?.email || 'admin@church.org';
  doc.text(`Email: ${email}`, margin + 4, infoY + 27);

  doc.setFontSize(7.5);
  doc.text(`Workspace ID: ${church?.id || 'N/A'}`, margin + 4, infoY + 33);

  // Provider & Payment Info (Right Box)
  const rightBoxX = margin + colWidth + 10;
  doc.setFillColor(...lightBg);
  doc.roundedRect(rightBoxX, infoY, colWidth, 38, 3, 3, 'F');

  doc.setTextColor(...churchRose);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PAYMENT DETAILS', rightBoxX + 4, infoY + 6);

  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Payment Gateway: Stripe Billing', rightBoxX + 4, infoY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...churchSlate);
  doc.text('Method: Visa / Mastercard (•••• 4242)', rightBoxX + 4, infoY + 17);

  const periodStart = invoice?.periodStart ? new Date(invoice.periodStart).toLocaleDateString() : 'N/A';
  const periodEnd = invoice?.periodEnd ? new Date(invoice.periodEnd).toLocaleDateString() : 'N/A';
  doc.text(`Billing Period: ${periodStart} - ${periodEnd}`, rightBoxX + 4, infoY + 22);

  // Status Badge
  doc.setFillColor(209, 250, 229);
  doc.roundedRect(rightBoxX + 4, infoY + 26, 26, 6, 2, 2, 'F');
  doc.setTextColor(...emeraldGreen);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PAID IN FULL', rightBoxX + 7, infoY + 30.5);

  // 4. Line Items Table
  // For jsPDF standard 1-byte fonts, Unicode ₱ (U+20B1) corrupts to ± (0xB1 in WinAnsi).
  // Use ISO code 'PHP ' for Philippine Peso to guarantee clean, professional board-ready rendering.
  const rawSymbol = church?.currencySymbol || church?.currency?.symbol || 'PHP ';
  const currencyCode = church?.currencyCode || church?.currency?.code || 'PHP';
  const currencySymbol = (rawSymbol === '₱' || rawSymbol.includes('₱') || currencyCode === 'PHP')
    ? 'PHP '
    : `${rawSymbol.trim()} `;

  const amountNum = Number(invoice?.amount || 0);
  const formattedAmount = `${currencySymbol}${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sanitize = (text) => String(text || '').replace(/[₱\u20B1]\s*/g, 'PHP ');
  const rawDescription = invoice?.description || `${subscription?.tierConfig?.name || 'Growth Ministry'} Plan Subscription`;
  const cleanDescription = sanitize(rawDescription);

  const tableBody = [
    [
      '1',
      cleanDescription,
      '1 Month',
      formattedAmount,
      formattedAmount
    ]
  ];

  runAutoTable(doc, {
    startY: 88,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: primaryNavy,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: primaryNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
    },
    head: [['#', 'Item & Description', 'Cycle', 'Unit Price', 'Total']],
    body: tableBody
  });

  // 5. Totals Section
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 120;
  const totalsX = pageWidth - margin - 75;

  doc.setFillColor(...lightBg);
  doc.roundedRect(totalsX, finalY, 75, 34, 3, 3, 'F');

  doc.setTextColor(...churchSlate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Subtotal:', totalsX + 4, finalY + 8);
  doc.text(formattedAmount, totalsX + 71, finalY + 8, { align: 'right' });

  doc.text('Value Added Tax (0%):', totalsX + 4, finalY + 14);
  doc.text(`${currencySymbol}0.00`, totalsX + 71, finalY + 14, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX + 4, finalY + 18, totalsX + 71, finalY + 18);

  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Total Amount Paid:', totalsX + 4, finalY + 26);
  doc.setTextColor(...churchRose);
  doc.text(formattedAmount, totalsX + 71, finalY + 26, { align: 'right' });

  // 6. Board Audit & Tax Disclaimer
  const footerBoxY = pageHeight - 45;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, footerBoxY, contentWidth, 22, 2, 2, 'F');

  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL ELECTRONIC RECEIPT FOR CHURCH RECORDS', margin + 4, footerBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...churchSlate);
  doc.text(
    'This is an authorized computer-generated receipt issued by Coram Deo for church accounting and governance.',
    margin + 4,
    footerBoxY + 11
  );
  doc.text(
    'No signature is required. Keep this document for annual church board financial audits and administrative files.',
    margin + 4,
    footerBoxY + 16
  );

  // Bottom brand footer
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text(
    'Coram Deo Church Operating System • Support: billing@coramdeo.church • https://coramdeo.church',
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  );

  // Save / Trigger Download
  const filename = `CoramDeo_Receipt_${invNumber}.pdf`;
  doc.save(filename);
}
