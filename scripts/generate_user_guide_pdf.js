import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateUserGuidePdf() {
  const outputDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'CoramDeo_Admin_User_Guide.pdf');

  console.log('Generating End-User Documentation PDF with Puppeteer...');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CoramDeo Admin — End-User Software Documentation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.55;
      font-size: 10pt;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Cover Page */
    .cover-page {
      height: 100vh;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10mm 5mm 5mm 5mm;
      page-break-after: always;
    }

    .cover-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .cover-logo-icon {
      width: 56px;
      height: 56px;
    }

    .brand-title {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #4F3894 0%, #8B4FB3 40%, #E84F7A 75%, #FF5252 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-tag {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-top: -3px;
    }

    .cover-center {
      margin-top: 35px;
      margin-bottom: 35px;
    }

    .doc-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(79, 56, 148, 0.08);
      color: #4F3894;
      border: 1px solid rgba(79, 56, 148, 0.25);
      border-radius: 9999px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 18px;
    }

    .cover-title {
      font-size: 32pt;
      font-weight: 800;
      line-height: 1.15;
      color: #0f172a;
      letter-spacing: -1px;
      margin: 0 0 16px 0;
    }

    .cover-subtitle {
      font-size: 13pt;
      font-weight: 400;
      color: #475569;
      line-height: 1.6;
      max-width: 620px;
      margin: 0 0 28px 0;
    }

    .cover-highlight-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-top: 24px;
    }

    .highlight-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
    }

    .highlight-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }

    .highlight-value {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
    }

    .cover-footer {
      border-top: 2px solid #f1f5f9;
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #64748b;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-item strong {
      color: #1e293b;
      font-weight: 600;
    }

    /* Headings */
    h1 {
      font-size: 17pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 26px;
      margin-bottom: 14px;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    h1 .section-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: #E84F7A;
      color: white;
      border-radius: 8px;
      font-size: 10pt;
      font-weight: 700;
    }

    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 18px;
      margin-bottom: 10px;
      letter-spacing: -0.2px;
    }

    h3 {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    p {
      margin: 0 0 10px 0;
      color: #334155;
      font-size: 9.5pt;
      text-align: justify;
    }

    ul, ol {
      margin: 0 0 12px 0;
      padding-left: 20px;
      color: #334155;
      font-size: 9.5pt;
    }

    li {
      margin-bottom: 5px;
    }

    /* Step Workflow Container */
    .step-workflow {
      margin: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
    }

    .step-number {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #4F3894;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 9pt;
      flex-shrink: 0;
    }

    .step-content {
      font-size: 9pt;
      color: #334155;
    }

    .step-content strong {
      color: #0f172a;
    }

    /* Callouts */
    .callout {
      background: #f8fafc;
      border-left: 4px solid #4F3894;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin: 14px 0;
      font-size: 9pt;
      color: #1e293b;
    }

    .callout-title {
      font-weight: 700;
      color: #4F3894;
      margin-bottom: 4px;
      font-size: 9pt;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .callout-rose {
      border-left-color: #E84F7A;
    }
    .callout-rose .callout-title {
      color: #E84F7A;
    }

    .callout-green {
      border-left-color: #10B981;
    }
    .callout-green .callout-title {
      color: #10B981;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 8.5pt;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 600;
      white-space: nowrap;
    }

    .badge-purple { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
    .badge-rose   { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
    .badge-blue   { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-green  { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-amber  { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

    /* ASCII / Mockup Box */
    .mockup-box {
      background: #0f172a;
      border-radius: 10px;
      padding: 14px 16px;
      margin: 14px 0;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      line-height: 1.45;
      border: 1px solid #334155;
    }

    .mockup-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #38bdf8;
      margin-bottom: 8px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 4px;
    }

    /* Feature Grid */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 12px 0;
    }

    .feature-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
    }

    .feature-card-title {
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .feature-card-body {
      font-size: 8pt;
      color: #64748b;
      line-height: 1.45;
    }

    /* FAQ Item */
    .faq-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }

    .faq-q {
      font-weight: 700;
      color: #0f172a;
      font-size: 9pt;
      margin-bottom: 4px;
    }

    .faq-a {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-top">
      <svg class="cover-logo-icon" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="archGradient" x1="80" y1="80" x2="320" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#4F3894"/>
            <stop offset="45%" stop-color="#8B4FB3"/>
            <stop offset="75%" stop-color="#E84F7A"/>
            <stop offset="100%" stop-color="#FF5252"/>
          </linearGradient>
          <radialGradient id="centerGlow" cx="200" cy="200" r="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="35%" stop-color="#FF94B8"/>
            <stop offset="70%" stop-color="#E84F7A"/>
            <stop offset="100%" stop-color="#E84F7A" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path d="M 100,320 L 100,180 A 100,100 0 0,1 300,180 L 300,320 L 200,270 Z" fill="url(#archGradient)"/>
        <path d="M 145,270 L 145,180 A 55,55 0 0,1 255,180 L 255,270 Z" fill="#F8FAFC"/>
        <circle cx="200" cy="200" r="20" fill="url(#centerGlow)"/>
        <circle cx="200" cy="200" r="7" fill="#FFFFFF"/>
      </svg>
      <div>
        <div class="brand-title">CoramDeo Platform</div>
        <div class="brand-tag">StewardTrack Administrative Suite</div>
      </div>
    </div>

    <div class="cover-center">
      <span class="doc-badge">End-User &amp; Administrator Operational Manual</span>
      <h1 class="cover-title">Client-Facing Software Documentation &amp; User Guide</h1>
      <p class="cover-subtitle">
        A task-oriented, user-friendly operational manual for Church Pastors, Administrators, Treasurers, Ministry Leaders, and Secretaries — covering flock care, worship planning, Sunday kiosk check-ins, financial stewardship, and platform settings.
      </p>

      <div class="cover-highlight-grid">
        <div class="highlight-card">
          <div class="highlight-label">Target Audience</div>
          <div class="highlight-value">Pastors &amp; Church Staff</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Platform Edition</div>
          <div class="highlight-value">CoramDeo Admin Web</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Operational Core</div>
          <div class="highlight-value">Flock, Worship, Giving</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Kiosk Ready</div>
          <div class="highlight-value">Webcam QR Attendance</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Treasury Tools</div>
          <div class="highlight-value">OCR Slips &amp; Tax Reports</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Security Model</div>
          <div class="highlight-value">2-Tier Role Separation</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div class="meta-item">
        <strong>PRODUCT ROLES</strong>
        <span>Solution Architect &amp; Product Owner</span>
      </div>
      <div class="meta-item">
        <strong>EDITION</strong>
        <span>Version 1.0.0 (Client-Facing)</span>
      </div>
      <div class="meta-item">
        <strong>SUPPORT CONTACT</strong>
        <span>support@coramdeo.app</span>
      </div>
      <div class="meta-item">
        <strong>DATE</strong>
        <span>October 2026</span>
      </div>
    </div>
  </div>

  <!-- SECTION 1 -->
  <div class="page-break"></div>
  <h1><span class="section-num">1</span> Welcome to CoramDeo Admin</h1>

  <h2>1.1 Introduction &amp; Mission</h2>
  <p>
    Welcome to the <strong>CoramDeo Admin Web Application</strong> (powered by the <em>StewardTrack</em> engine). Our mission is to equip church leadership with an intuitive, unified digital platform that eliminates messy spreadsheets, fragmented messaging apps, and manual paper sign-ins.
  </p>
  <p>
    CoramDeo bridges the gap between high-level oversight and daily practical ministry. From tracking tithes with designated funds to scheduling volunteer worship teams without calendar conflicts, everything is organized under one roof.
  </p>

  <h2>1.2 User Personas &amp; Role Directory</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Staff Persona</th>
        <th style="width: 25%;">Primary Focus</th>
        <th style="width: 55%;">Daily &amp; Weekly Software Workflows</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Senior Pastor</strong></td>
        <td>Spiritual oversight, preaching, flock care</td>
        <td>Upload Sunday sermons, monitor attendance trajectories, review confidential pastoral prayer requests, and distribute discipleship curriculums.</td>
      </tr>
      <tr>
        <td><strong>Church Administrator</strong></td>
        <td>Operational governance &amp; platform settings</td>
        <td>Manage church profile, assign staff roles, review audit logs, monitor subscription quotas, and manage facilities/events.</td>
      </tr>
      <tr>
        <td><strong>Treasurer / Finance Admin</strong></td>
        <td>Financial stewardship &amp; transparency</td>
        <td>Record Sunday tithes/offerings, scan deposit slips with camera OCR, manage expenses, and generate 1-click board balance sheets and donor tax statements.</td>
      </tr>
      <tr>
        <td><strong>Church Secretary</strong></td>
        <td>Flock records &amp; communications</td>
        <td>Maintain member directory, create events, monitor Sunday kiosk check-ins, and publish weekly church bulletins.</td>
      </tr>
      <tr>
        <td><strong>Worship Director</strong></td>
        <td>Sunday service liturgy &amp; music</td>
        <td>Maintain song chord charts, transpose vocal keys on the fly, curate weekly setlists, and schedule band/vocalist rosters.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 2 -->
  <div class="page-break"></div>
  <h1><span class="section-num">2</span> Getting Started &amp; Security</h1>

  <h2>2.1 Signing In to Your Workspace</h2>
  <div class="step-workflow avoid-break">
    <div class="step-item">
      <div class="step-number">1</div>
      <div class="step-content">
        <strong>Open Your Browser:</strong> Use Google Chrome, Apple Safari, Microsoft Edge, or Mozilla Firefox. Navigate to your church's CoramDeo login URL.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">2</div>
      <div class="step-content">
        <strong>Authenticate:</strong> Enter your registered church email address and password, or click <strong>Sign in with Google</strong> for instant Single Sign-On (SSO).
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">3</div>
      <div class="step-content">
        <strong>Verification &amp; Approval:</strong> If you are newly registered, you must verify your email and await approval from your Senior Pastor or Church Administrator before accessing church records.
      </div>
    </div>
  </div>

  <h2>2.2 Two-Tier Security Explained</h2>
  <div class="callout callout-rose avoid-break">
    <div class="callout-title">Important: Privacy &amp; Separation of Duties</div>
    CoramDeo strictly segregates <strong>System Roles</strong> (which control system modules like Finances, Settings, and Members) from <strong>Ministry Serving Roles</strong> (such as Drummer, Greeter, or Sunday School Lead). A volunteer worship leader can manage setlists without seeing confidential church donations or private pastoral care files.
  </div>

  <h1><span class="section-num">3</span> The Daily Command Center: Dashboard</h1>
  <p>
    Upon logging in, the <strong>Dashboard Overview</strong> provides a real-time summary of your church’s weekly momentum:
  </p>

  <div class="mockup-box avoid-break">
    <div class="mockup-title">&#9670; CoramDeo Executive Dashboard Display</div>
    [ 👥 Active Members: 142 ]   [ 📅 Upcoming Events: 3 ]   [ 📊 Monthly Attendance: 520 ]
    [ 💰 Pending Giving: 4 ]     [ 🙏 Pending Prayers: 2 ]   [ 📖 Published Sermons: 48 ]
    ----------------------------------------------------------------------------------
    PENDING ACTION QUEUE:
    &bull; 4 Online Tithes Awaiting Verification (GCash, Check, Bank Transfer)
    &bull; 2 Confidential Pastoral Prayer Requests to Review
    &bull; 1 Small Group Pending Leader Assignment
    ----------------------------------------------------------------------------------
    QUICK ACTIONS: [+ Add Member]  [+ Record Giving]  [+ Create Event]  [+ Upload Sermon]
  </div>

  <!-- SECTION 4 -->
  <div class="page-break"></div>
  <h1><span class="section-num">4</span> Flock &amp; Member Care Directory</h1>
  <p>
    The <strong>Members</strong> module (<code>/admin/members</code>) serves as your church's master pastoral registry.
  </p>

  <h2>4.1 How to Add a New Member</h2>
  <div class="step-workflow avoid-break">
    <div class="step-item">
      <div class="step-number">1</div>
      <div class="step-content">
        Navigate to <strong>Members</strong> in the left sidebar and click the <strong>+ Add Member</strong> button.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">2</div>
      <div class="step-content">
        <strong>Input Identity &amp; Contact:</strong> Enter First Name, Middle Name, Last Name, Email, and Mobile Phone Number.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">3</div>
      <div class="step-content">
        <strong>Membership &amp; Faith Milestones:</strong> Select Membership Category (<em>Full Member</em>, <em>Preparatory</em>, <em>Adherent</em>, <em>Visitor</em>), Baptism Status (<em>Baptized</em> / <em>Not Baptized</em>), and Baptism Date.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">4</div>
      <div class="step-content">
        <strong>Family Linking &amp; Special Flags:</strong> Assign a Family Unit to connect spouses and children together. Check <em>Is Abroad / OFW</em> if the member worships overseas online.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">5</div>
      <div class="step-content">
        Click <strong>Save Member</strong>. The profile is immediately accessible and searchable.
      </div>
    </div>
  </div>

  <h2>4.2 Managing Roles &amp; Promoting Staff</h2>
  <p>
    Only administrators (<code>super_admin</code> and <code>church_admin</code>) can elevate member roles. To grant administrative privileges:
  </p>
  <ul>
    <li>Open the member's profile card in the directory.</li>
    <li>Click the <strong>Access &amp; Role</strong> tab.</li>
    <li>Select their primary role (e.g. <code>pastor</code>, <code>secretary</code>, or <code>finance_admin</code>).</li>
    <li>Click <strong>Update Role</strong>. The action is permanently recorded in your church’s <strong>Role Audit Log</strong>.</li>
  </ul>

  <!-- SECTION 5 -->
  <div class="page-break"></div>
  <h1><span class="section-num">5</span> Gatherings, Events &amp; Smart Attendance</h1>

  <h2>5.1 Scheduling Sunday Services &amp; Events</h2>
  <p>
    Navigate to <strong>Events</strong> to coordinate Sunday worship, prayer vigils, youth rallies, and ministry meetings. When creating an event, define session times (e.g., <em>8:00 AM 1st Service</em>, <em>10:30 AM 2nd Service</em>) and whether member pre-registration is required.
  </p>

  <h2>5.2 Operating the Sunday Kiosk QR Scanner</h2>
  <div class="callout callout-green avoid-break">
    <div class="callout-title">Fast, Contactless Sunday Morning Check-In</div>
    Turn any sanctuary tablet or laptop into a high-speed kiosk. Members display their personalized QR pass from their CoramDeo mobile app, and the kiosk logs their presence in under 1 second!
  </div>

  <div class="step-workflow avoid-break">
    <div class="step-item">
      <div class="step-number">1</div>
      <div class="step-content">
        Open <strong>Attendance</strong> &rarr; Select today's worship service &rarr; Click <strong>Open QR Scanner Kiosk</strong>.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">2</div>
      <div class="step-content">
        Allow the browser permission to access your webcam or external USB barcode scanner.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">3</div>
      <div class="step-content">
        Members present their digital pass in front of the camera. The system beeps, flashes a green welcome banner, and updates the live attendee counter.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">4</div>
      <div class="step-content">
        <strong>Manual Fallback:</strong> If a member forgot their phone, the usher can switch to <strong>Manual Search</strong>, type the member's last name, and tap <strong>Check In</strong>.
      </div>
    </div>
  </div>

  <!-- SECTION 6 -->
  <div class="page-break"></div>
  <h1><span class="section-num">6</span> Worship Ministry &amp; Service Planning</h1>

  <h2>6.1 Song Catalog &amp; Real-Time Key Transposition</h2>
  <p>
    Under <strong>Ministry &amp; Word &rarr; Songs &amp; Lyrics</strong>, maintain your church’s worship music library with chord charts, tempo (BPM), and copyright information:
  </p>
  <ul>
    <li><strong>Chord Transposition:</strong> Need to adjust a song from Key of G to Key of E to match a vocalist's range? Simply select the target key from the dropdown. The chords transpose instantly across the chart!</li>
    <li><strong>Lyrics &amp; Chords View:</strong> Switch between full musician chord charts and lyric-only presentation formats.</li>
  </ul>

  <h2>6.2 Building Sunday Setlists</h2>
  <div class="step-workflow avoid-break">
    <div class="step-item">
      <div class="step-number">1</div>
      <div class="step-content">
        Go to <strong>Setlists</strong> &rarr; Click <strong>+ New Setlist</strong> &rarr; Select the Sunday Service Date.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">2</div>
      <div class="step-content">
        Add songs in worship order: <em>Opening Praise &rarr; Adoration &rarr; Offertory &rarr; Response</em>.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">3</div>
      <div class="step-content">
        Save the setlist. Band members can open the setlist on their mobile devices or tablets during practice.
      </div>
    </div>
  </div>

  <h2>6.3 Volunteer Rostering &amp; Conflict Avoidance</h2>
  <p>
    Under <strong>Scheduling</strong>, coordinate musicians, ushers, sound technicians, and presiders. CoramDeo automatically warns ministry coordinators if a volunteer is inadvertently scheduled in two different places at the same time.
  </p>

  <!-- SECTION 7 -->
  <div class="page-break"></div>
  <h1><span class="section-num">7</span> Pulpit, Sermons &amp; Bible Plans</h1>

  <h2>7.1 Archiving Sermons with In-Browser Audio Compression</h2>
  <p>
    Uploading large Sunday audio files (often 100MB+) can take forever on church Wi-Fi. CoramDeo solves this with <strong>built-in WebAssembly compression</strong>:
  </p>
  <div class="step-workflow avoid-break">
    <div class="step-item">
      <div class="step-number">1</div>
      <div class="step-content">
        Navigate to <strong>Sermons</strong> and click <strong>+ Upload Sermon</strong>.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">2</div>
      <div class="step-content">
        Enter the Sermon Title, Series Name, Preacher, Scripture Reference, and Date.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">3</div>
      <div class="step-content">
        Attach your raw audio recording (.mp3, .wav, or .m4a).
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">4</div>
      <div class="step-content">
        <strong>Automatic Browser Transcoding:</strong> Your browser immediately compresses the audio file by over 80% using WebAssembly before uploading, saving your church’s storage quota and speeding up uploads!
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">5</div>
      <div class="step-content">
        Click <strong>Publish</strong>. The sermon instantly becomes available on your congregation's mobile application.
      </div>
    </div>
  </div>

  <h2>7.2 Bible Reading Plans</h2>
  <p>
    Pastors can select from pre-configured church reading plans (such as *Through the Gospels in 40 Days*) or author custom chronological plans. Members mark their daily chapters as completed directly in their mobile app.
  </p>

  <!-- SECTION 8 -->
  <div class="page-break"></div>
  <h1><span class="section-num">8</span> Discipleship &amp; Pastoral Care</h1>

  <h2>8.1 Life Groups &amp; Materials Distribution</h2>
  <ul>
    <li><strong>Group Management:</strong> Register small groups, assign trusted leaders, define meeting times (in-person or Zoom), and assign member rosters.</li>
    <li><strong>Study Guides:</strong> Upload weekly discussion questions, leader notes, and PDF discipleship workbooks for small group leaders to download directly.</li>
  </ul>

  <h2>8.2 Prayer Request Moderation Queue</h2>
  <p>
    Under <strong>Prayer Requests</strong> (<code>/admin/prayer</code>), pastors and secretaries review incoming prayer requests from members:
  </p>
  <div class="feature-grid avoid-break">
    <div class="feature-card">
      <div class="feature-card-title">Public Church-Wide Prayers</div>
      <div class="feature-card-body">
        Approved prayers are published to the mobile prayer wall so the entire congregation can intercede together and tap "I Prayed For This".
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-card-title">Confidential Pastoral Care</div>
      <div class="feature-card-body">
        Sensitive requests marked "Pastors Only" remain strictly quarantined and visible exclusively to authorized pastoral staff.
      </div>
    </div>
  </div>

  <!-- SECTION 9 -->
  <div class="page-break"></div>
  <h1><span class="section-num">9</span> Financial Stewardship &amp; Accounting</h1>

  <h2>9.1 Designated Funds (Tithes, Missions, Building)</h2>
  <p>
    CoramDeo guarantees that donor intent is respected. Financial gifts are categorized into dedicated funds:
  </p>
  <ul>
    <li><strong>General Tithes &amp; Offerings:</strong> Regular operating expenses and pastoral support.</li>
    <li><strong>Building / Sanctuary Fund:</strong> Capital improvements and facility development.</li>
    <li><strong>Foreign &amp; Local Missions:</strong> Direct missionary support and church planting.</li>
    <li><strong>Benevolence / Calamity Relief:</strong> Assisting church families during acute emergencies.</li>
  </ul>

  <h2>9.2 Recording Contributions &amp; Camera OCR Slip Scanner</h2>
  <div class="step-workflow avoid-break">
    <div class="step-item">
      <div class="step-number">1</div>
      <div class="step-content">
        Go to <strong>Finance &amp; Giving</strong> &rarr; Click <strong>+ Record Giving</strong>.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">2</div>
      <div class="step-content">
        Choose <strong>Manual Entry</strong> (select donor name, designated fund, amount, and payment type) OR click <strong>Scan Receipt / Slip</strong>.
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">3</div>
      <div class="step-content">
        <strong>Camera OCR Scanner:</strong> Hold a bank deposit slip, check, or online transfer receipt up to your webcam. The integrated Tesseract.js engine detects the numerical amount and reference code automatically!
      </div>
    </div>
    <div class="step-item">
      <div class="step-number">4</div>
      <div class="step-content">
        Click <strong>Verify &amp; Post</strong>. The transaction is immediately reflected in the church financial ledger.
      </div>
    </div>
  </div>

  <h2>9.3 1-Click Board Statements &amp; Donor Tax Receipts</h2>
  <p>
    Under <strong>Finance &rarr; Reports</strong>, generate executive reports without spreadsheets:
  </p>
  <ul>
    <li><strong>Board Financial Statements (PDF):</strong> Produces a comprehensive monthly balance sheet with income vs. expense visual charts ready for the Church Council or Board of Elders.</li>
    <li><strong>Donor Annual Giving Statements (PDF):</strong> With one click, generate official annual tax acknowledgment receipts for congregation members.</li>
  </ul>

  <!-- SECTION 10 & 11 -->
  <div class="page-break"></div>
  <h1><span class="section-num">10</span> Subscription Plans &amp; Quotas</h1>

  <table>
    <thead>
      <tr>
        <th>Plan Designation</th>
        <th>Target Size</th>
        <th>Membership Limit</th>
        <th>Media Quota</th>
        <th>Key Features</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-green">Seed Fellowship</span></td>
        <td>Church plants &amp; small fellowships</td>
        <td><strong>Up to 50 members</strong></td>
        <td>2 GB storage</td>
        <td>Core giving, QR kiosk attendance, member directory. Free forever.</td>
      </tr>
      <tr>
        <td><span class="badge badge-purple">Growth Ministry</span></td>
        <td>Established growing churches</td>
        <td><strong>Up to 250 members</strong></td>
        <td>20 GB storage</td>
        <td>Volunteer scheduling, worship setlists, board financial reports, priority support.</td>
      </tr>
      <tr>
        <td><span class="badge badge-rose">Kingdom Network</span></td>
        <td>Large churches &amp; networks</td>
        <td><strong>Unlimited members</strong></td>
        <td>50 GB storage</td>
        <td>All Growth tools + unlimited congregation members, multi-campus scalability, and Zoom staff onboarding.</td>
      </tr>
    </tbody>
  </table>

  <h1><span class="section-num">11</span> Troubleshooting &amp; FAQ</h1>

  <div class="faq-item avoid-break">
    <div class="faq-q">Q: What happens if our church reaches its member limit on the Free Seed plan?</div>
    <div class="faq-a">Your existing data remains 100% secure. When attempting to add the 51st member, an alert will prompt you to upgrade to the Growth Ministry tier, which includes a 14-day free trial.</div>
  </div>

  <div class="faq-item avoid-break">
    <div class="faq-q">Q: Can our worship leader see financial contributions or pastoral care notes?</div>
    <div class="faq-a"><strong>No.</strong> CoramDeo enforces strict role-based access control. Ministry leaders can only view their assigned team rosters, song charts, and setlists. Financial ledgers and pastoral files are completely hidden.</div>
  </div>

  <div class="faq-item avoid-break">
    <div class="faq-q">Q: What if our sanctuary Wi-Fi drops during Sunday attendance check-in?</div>
    <div class="faq-a">Don't worry! CoramDeo features offline caching. Attendance scans queue safely in your computer’s local memory and automatically upload to the cloud the moment internet connection is restored.</div>
  </div>

  <div class="callout callout-rose avoid-break" style="margin-top: 24px;">
    <div class="callout-title">Need Technical Assistance?</div>
    Our team is dedicated to supporting your ministry. Reach our customer care team at <strong>support@coramdeo.app</strong> or access priority chat within your admin workspace.
  </div>

</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          <span>CoramDeo Platform &mdash; End-User &amp; Administrator Manual</span>
          <span style="color: #64748b; font-weight: 600;">USER GUIDE</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>StewardTrack Software Documentation v1.0.0</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '16mm',
        right: '16mm'
      }
    });

    console.log(`User Guide PDF successfully generated at: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

generateUserGuidePdf().catch((err) => {
  console.error('Fatal error generating User Guide PDF:', err);
  process.exit(1);
});
