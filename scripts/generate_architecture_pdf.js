import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePdf() {
  const outputDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'CoramDeo_Admin_Solution_Architecture.pdf');

  console.log('Generating Solution Architecture PDF with Puppeteer...');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CoramDeo Admin Web App — Solution Architecture Document</title>
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

    /* Print Header & Footer Rules */
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
      position: relative;
    }

    .cover-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .cover-logo-icon {
      width: 54px;
      height: 54px;
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
      margin-top: 40px;
      margin-bottom: 40px;
    }

    .doc-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(232, 79, 122, 0.08);
      color: #e84f7a;
      border: 1px solid rgba(232, 79, 122, 0.25);
      border-radius: 9999px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
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
      max-width: 600px;
      margin: 0 0 32px 0;
    }

    .cover-highlight-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-top: 28px;
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

    /* Content Typography */
    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 28px;
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
      background: #4F3894;
      color: white;
      border-radius: 8px;
      font-size: 10pt;
      font-weight: 700;
    }

    h2 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 20px;
      margin-bottom: 10px;
      letter-spacing: -0.2px;
    }

    h3 {
      font-size: 10.5pt;
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

    /* Callout & Alert Box */
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

    .callout-accent {
      border-left-color: #E84F7A;
    }

    .callout-accent .callout-title {
      color: #E84F7A;
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

    /* Architecture Diagram Blocks */
    .diagram-container {
      background: #0f172a;
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.8pt;
      line-height: 1.45;
      overflow: hidden;
      border: 1px solid #334155;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .diagram-header {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #38bdf8;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 6px;
    }

    .diagram-content {
      white-space: pre;
      color: #94a3b8;
    }

    .diagram-content .hl-tier { color: #f472b6; font-weight: bold; }
    .diagram-content .hl-tech { color: #38bdf8; font-weight: bold; }
    .diagram-content .hl-db   { color: #4ade80; font-weight: bold; }
    .diagram-content .hl-sec  { color: #fbbf24; font-weight: bold; }

    /* Visual Grid Cards */
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
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .feature-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .feature-icon-circle {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      font-weight: bold;
    }

    .feature-card-title {
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
    }

    .feature-card-body {
      font-size: 8pt;
      color: #64748b;
      line-height: 1.45;
    }

    /* Schema Card */
    .schema-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      line-height: 1.5;
      color: #334155;
      margin-bottom: 10px;
    }

    .schema-title {
      font-weight: bold;
      color: #4F3894;
      margin-bottom: 4px;
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
      <span class="doc-badge">Solution Architecture Document (SAD)</span>
      <h1 class="cover-title">High-Level System Architecture & Solution Design</h1>
      <p class="cover-subtitle">
        An engineering blueprint of the CoramDeo Church Administration Web Application — detailing cloud multi-tenancy, zero-trust RBAC, client-side edge computing, reactive data architecture, and SaaS quota governance.
      </p>

      <div class="cover-highlight-grid">
        <div class="highlight-card">
          <div class="highlight-label">Architecture Pattern</div>
          <div class="highlight-value">Modular SPA + BaaS</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Frontend Engine</div>
          <div class="highlight-value">React 19 + Vite + Tailwind v4</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Cloud Persistence</div>
          <div class="highlight-value">Google Cloud Firestore</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Tenancy Model</div>
          <div class="highlight-value">Multi-Tenant Logical DB</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Edge Intelligence</div>
          <div class="highlight-value">FFmpeg WASM + Tesseract OCR</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-label">Compliance & Security</div>
          <div class="highlight-value">Two-Tier RBAC + Audit Logs</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div class="meta-item">
        <strong>AUTHOR</strong>
        <span>Lead Solution Architect</span>
      </div>
      <div class="meta-item">
        <strong>VERSION</strong>
        <span>1.0.0 (Baseline Approved)</span>
      </div>
      <div class="meta-item">
        <strong>TARGET AUDIENCE</strong>
        <span>Engineering, Leadership & IT</span>
      </div>
      <div class="meta-item">
        <strong>CLASSIFICATION</strong>
        <span>Proprietary & Confidential</span>
      </div>
      <div class="meta-item">
        <strong>DATE</strong>
        <span>October 2026</span>
      </div>
    </div>
  </div>

  <!-- SECTION 1 -->
  <div class="page-break"></div>
  <h1><span class="section-num">1</span> Executive Summary & Solution Context</h1>

  <h2>1.1 Strategic Vision & Purpose</h2>
  <p>
    The <strong>CoramDeo Admin Web Application</strong> is the operational command center of the CoramDeo Church Management System (ChMS). Engineered specifically to resolve operational fragmentation in modern ministries, it consolidates congregation directories, volunteer scheduling, worship planning, sermon media delivery, financial stewardship, and pastoral discipleship into a singular, cohesive digital platform.
  </p>
  <p>
    Built to support churches ranging from small church plants (Seed Fellowship) to expansive multi-campus mega-churches (Kingdom Network), the system balances deep local autonomy with global administrative oversight.
  </p>

  <h2>1.2 System Boundary & Ecosystem Integration</h2>
  <p>
    The broader CoramDeo platform operates across three interconnected tiers that share a real-time data fabric:
  </p>
  <ul>
    <li><strong>Admin Web Portal (Primary Focus of this SAD):</strong> A desktop/tablet-optimized Progressive Web Application utilizing React 19, Tailwind CSS v4, and Lucide icons, giving pastors and staff full administrative authority over their church workspace.</li>
    <li><strong>Congregational Mobile App (React Native / Expo):</strong> Native iOS and Android application enabling church members to register for events, present digital check-in passes, contribute tithes, access reading plans, and stream sermons.</li>
    <li><strong>Cloud Data Fabric (Firebase & GCP):</strong> Fully managed serverless backend providing real-time NoSQL persistence (Cloud Firestore), user federation (Firebase Auth), distributed object storage (Cloud Storage), and asynchronous cloud functions.</li>
  </ul>

  <div class="callout callout-accent avoid-break">
    <div class="callout-title">Architectural Imperative: Edge-First Computation</div>
    To protect church budgets from soaring serverless execution fees and bandwidth charges, CoramDeo executes heavy media and document transformations—specifically audio compression, OCR check recognition, and financial PDF synthesis—directly inside client browsers via WebAssembly and Web Workers.
  </div>

  <h2>1.3 Key Architectural Quality Attributes</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Quality Attribute</th>
        <th style="width: 35%;">Engineering Approach</th>
        <th style="width: 40%;">System Impact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Logical Multi-Tenancy</strong></td>
        <td>Partitioned data isolation using indexed <code>churchId</code> attributes across shared Firestore collections.</td>
        <td>Strict data boundaries between churches with zero cross-tenant data leaks and immediate onboarding.</td>
      </tr>
      <tr>
        <td><strong>Real-Time Responsiveness</strong></td>
        <td>Reactive Firestore snapshots (<code>onSnapshot</code>) with optimistic UI updates.</td>
        <td>Instant synchronization of check-in headcounts, prayer requests, and volunteer rosters without polling.</td>
      </tr>
      <tr>
        <td><strong>Two-Tier RBAC</strong></td>
        <td>Orthogonal separation of platform System Roles from local Ministry Serving Roles.</td>
        <td>Ministry volunteers can lead teams or edit setlists without inheriting access to confidential finances or members.</td>
      </tr>
      <tr>
        <td><strong>Dual-Target Runtime</strong></td>
        <td>Dynamic in-browser Firebase re-initialization (<code>reinitFirebaseForEnv</code>).</td>
        <td>QA teams can switch between Staging and Production databases on staging builds without re-compilation.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 2 -->
  <div class="page-break"></div>
  <h1><span class="section-num">2</span> High-Level Solution Architecture</h1>

  <h2>2.1 Tiered Component Topology</h2>
  <p>
    The solution is structured as a decoupled multi-tier architecture emphasizing client-side performance, serverless scaling, and cloud resiliency:
  </p>

  <div class="diagram-container avoid-break">
    <div class="diagram-header">&#9670; CoramDeo End-to-End System Architecture Topology</div>
    <div class="diagram-content">
+---------------------------------------------------------------------------------------------------+
| <span class="hl-tier">1. PRESENTATION TIER (Browser Single-Page Application)</span>                                            |
|                                                                                                   |
|  * <span class="hl-tech">React 19 Core</span> (Concurrent Rendering, Component Suspense, Strict Tree Reconciliation)           |
|  * <span class="hl-tech">Vite 8 Build Tooling</span> (Lightning Fast HMR, Optimized Rollup Tree-Shaking, Oxlint Rules)          |
|  * <span class="hl-tech">Tailwind CSS v4</span> (Zero-Runtime Precompiled Design Tokens: church-rose, church-canvas)            |
|  * <span class="hl-tech">Lucide React Icons</span> &amp; <span class="hl-tech">Chart.js / React-Chartjs-2</span> (Real-Time Interactive Analytical Dashboards) |
|                                                                                                   |
|  +--------------------+------------------------+-------------------+----------------------------+ |
|  | Core Admin Modules | Ministry &amp; Worship Ops | People &amp; Care Hub | Finance, Giving &amp; Audits  | |
|  +--------------------+------------------------+-------------------+----------------------------+ |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| <span class="hl-tier">2. EDGE COMPUTING &amp; BROWSER OFFLOAD ENGINE</span>                                                       |
|                                                                                                   |
|  * <span class="hl-tech">FFmpeg WebAssembly (@ffmpeg/ffmpeg)</span>: Client-Side Audio Transcoding &amp; Bitrate Compression       |
|  * <span class="hl-tech">Tesseract.js OCR Engine</span>: In-Browser Optical Character Recognition for Checks/Receipts       |
|  * <span class="hl-tech">jsPDF + AutoTable</span>: Client-Generated Board-Ready Financial Statements &amp; Donor Tax Receipts   |
|  * <span class="hl-tech">HTML5 QR Scanner &amp; Yudiel Scanner</span>: Real-Time WebCam Video Frame Stream Kiosk Check-In        |
|  * <span class="hl-tech">Dynamic Multi-Currency Engine</span>: Contextual Currency Formatting (PHP, USD, EUR, GBP, SGD)     |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| <span class="hl-tier">3. APPLICATION STATE, CONTEXT &amp; RUNTIME SWITCHER</span>                                                 |
|                                                                                                   |
|  * <span class="hl-sec">AuthContext &amp; Token Synchronizer</span>: Firebase Auth State, Custom Claims, Active Church Routing  |
|  * <span class="hl-sec">EnvironmentSwitcher</span>: In-flight Firebase teardown &amp; re-initialization (Staging &lt;-&gt; Prod)       |
|  * <span class="hl-tech">LocalStorage &amp; IndexedDB (idb-keyval)</span>: Offline scripture indexing, user session cache     |
+-------------------------------------------------+-------------------------------------------------+
                                                  | Encrypted WSS / HTTPS
                                                  v
+---------------------------------------------------------------------------------------------------+
| <span class="hl-tier">4. CLOUD BACKEND-AS-A-SERVICE (Firebase &amp; Google Cloud Platform)</span>                                 |
|                                                                                                   |
|  +-------------------------------------+  +-----------------------------------------------------+ |
|  | <span class="hl-db">Firebase Authentication</span>             |  | <span class="hl-db">Google Cloud Firestore (Multi-Tenant DB)</span>             | |
|  | - Email / Password &amp; OAuth 2.0 Google |  | - Staging: nazarenechurch-9c030                     | |
|  | - Custom JWT Claims Integration     |  | - Production: coramdeo-prod (db: coramdeo)          | |
|  | - Session Persistence &amp; Tokens     |  | - Real-time onSnapshot WebSocket Pipelines         | |
|  +-------------------------------------+  +-----------------------------------------------------+ |
|  +-------------------------------------+  +-----------------------------------------------------+ |
|  | <span class="hl-db">Google Cloud Storage (Buckets)</span>      |  | <span class="hl-db">Firebase Admin SDK &amp; Node Automation</span>                | |
|  | - Compressed Sermon Audio (.mp3)    |  | - SuperAdmin Bootstrap Scripts                      | |
|  | - Worship Sheets &amp; Chord Charts     |  | - Tenant Provisioning &amp; Data Normalization          | |
|  | - Expense Receipts &amp; Church Logos   |  | - Server-Side Integrity Verification                | |
|  +-------------------------------------+  +-----------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------+
    </div>
  </div>

  <h2>2.2 Dual-Target Runtime Switcher Architecture</h2>
  <p>
    Unlike conventional applications that require independent deployments for different environments, CoramDeo implements a runtime environment bridge (<code>src/config/environments.js</code>). In staging builds, administrators can toggle between the Staging Firebase instance (<code>nazarenechurch-9c030</code>) and the Production Firebase instance (<code>coramdeo-prod</code>, database: <code>coramdeo</code>) via an interactive UI pill. The system tears down active Firebase apps via <code>deleteApp()</code> and re-initializes <code>initializeApp()</code> without clearing production security rules.
  </p>

  <!-- SECTION 3 -->
  <div class="page-break"></div>
  <h1><span class="section-num">3</span> Multi-Tenancy & SaaS Subscription Engine</h1>

  <h2>3.1 Logical Data Partitioning</h2>
  <p>
    CoramDeo operates on a <strong>Shared Database, Logical Isolation</strong> multi-tenancy model. Every church entity is registered as a unique document within the <code>churches</code> collection. Subordinate domain collections incorporate an indexed foreign key <code>churchId</code>.
  </p>
  <p>
    When a church administrator logs in, their profile’s <code>churchId</code> binds to the global application state (<code>activeChurchId</code>). All downstream data requests automatically scope their queries with <code>where('churchId', '==', activeChurchId)</code>, ensuring complete privacy and isolation.
  </p>

  <h2>3.2 Subscription Tiers & Quota Matrix</h2>
  <p>
    The platform’s commercial engine enforces tiered resource limits via the <code>useSubscriptionLimits</code> hook:
  </p>

  <table>
    <thead>
      <tr>
        <th>Tier Designation</th>
        <th>Pricing & Billing</th>
        <th>Membership Cap</th>
        <th>Media Quota</th>
        <th>Gated Modules & Capabilities</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-green">Seed Fellowship</span></td>
        <td>Free Forever</td>
        <td><strong>Up to 50 members</strong></td>
        <td>2 GB storage</td>
        <td>Standard giving recording, kiosk QR attendance, member directory. <em>Volunteer scheduling and worship setlists are locked.</em></td>
      </tr>
      <tr>
        <td><span class="badge badge-purple">Growth Ministry</span></td>
        <td>₱3,490 / month<br><small>14-day free trial</small></td>
        <td><strong>Up to 250 members</strong></td>
        <td>20 GB storage</td>
        <td>Unlocks Volunteer Rostering, Worship Setlists, Key Transposition, Discipleship Groups, and 1-Click Board Financial Statements.</td>
      </tr>
      <tr>
        <td><span class="badge badge-rose">Kingdom Network</span></td>
        <td>₱5,490 / month<br><small>14-day free trial</small></td>
        <td><strong>Unlimited Members</strong><br><small>(No caps)</small></td>
        <td>50 GB storage</td>
        <td>All Growth tools + multi-campus readiness, dedicated onboarding, Zoom training, and priority phone support.</td>
      </tr>
    </tbody>
  </table>

  <h2>3.3 Quota Lifecycle & Grace Period Flow</h2>
  <div class="avoid-break">
    <p>
      The subscription governance lifecycle monitors limits and manages payment lapses with the following protocol:
    </p>
    <ul>
      <li><strong>Real-Time Congregation Sizing:</strong> A dedicated listener aggregates active members across <code>users</code> where <code>churchId == activeChurchId</code> (excluding Super Admins), reconciling counters with <code>churches/{id}.stats.membersCount</code>.</li>
      <li><strong>Proactive Capacity Warning:</strong> When a church reaches 80% of its member quota, the top-level <code>SubscriptionBanner</code> presents an advisory alert to administrators.</li>
      <li><strong>7-Day Grace Period:</strong> If a paid tier expires or encounters payment failure, the church enters a 7-day grace period. During this window, all services remain active while warning banners urge billing resolution.</li>
      <li><strong>Graceful Downgrade Protection:</strong> If grace period lapses without renewal, write access to Growth-tier modules locks into read-only mode, preventing data loss while protecting SaaS business boundaries.</li>
    </ul>
  </div>

  <!-- SECTION 4 -->
  <div class="page-break"></div>
  <h1><span class="section-num">4</span> Security Architecture & Identity Management</h1>

  <h2>4.1 Two-Tier Role-Based Access Control (RBAC)</h2>
  <p>
    CoramDeo implements a two-tier security model that separates global system administration from ministry serving responsibilities.
  </p>

  <div class="feature-grid avoid-break">
    <div class="feature-card">
      <div class="feature-card-header">
        <div class="feature-icon-circle" style="background: #f3e8ff; color: #6b21a8;">S</div>
        <div class="feature-card-title">Layer 1: System Roles (Platform RBAC)</div>
      </div>
      <div class="feature-card-body">
        Stored in <code>users/{uid}.systemRoles</code>. Governs navigation, routes, and collection-level operations in the web portal.<br><br>
        <strong>Roles:</strong> <code>super_admin</code>, <code>church_admin</code>, <code>pastor</code>, <code>secretary</code>, <code>finance_admin</code>, <code>ministry_leader</code>, <code>member</code>.
      </div>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <div class="feature-icon-circle" style="background: #ffe4e6; color: #be123c;">M</div>
        <div class="feature-card-title">Layer 2: Ministry Roles (Serving Roster)</div>
      </div>
      <div class="feature-card-body">
        Stored inside specific ministry documents: <code>ministries/{id}.leaderIds</code> and <code>members[].servingRole</code>.<br><br>
        <strong>Examples:</strong> Ministry Leader, Vocalist, Drummer, Usher, Sunday School Lead. Does <em>not</em> grant system-wide administrative access.
      </div>
    </div>
  </div>

  <h2>4.2 System Role Permission Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>System Role</th>
        <th>Members &amp; Care</th>
        <th>Events &amp; Attendance</th>
        <th>Worship &amp; Music</th>
        <th>Sermons &amp; Bible</th>
        <th>Finance &amp; Giving</th>
        <th>Global / Churches</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>super_admin</strong></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-purple">Global Access</span></td>
      </tr>
      <tr>
        <td><strong>church_admin</strong></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-amber">Church Scoped</span></td>
      </tr>
      <tr>
        <td><strong>pastor</strong></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-blue">Read / View</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
      </tr>
      <tr>
        <td><strong>finance_admin</strong></td>
        <td><span class="badge badge-blue">Read Only</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
        <td><span class="badge badge-green">Full Admin</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
      </tr>
      <tr>
        <td><strong>secretary</strong></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-green">Full</span></td>
        <td><span class="badge badge-blue">View Only</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
      </tr>
      <tr>
        <td><strong>ministry_leader</strong></td>
        <td><span class="badge badge-blue">Team Roster</span></td>
        <td><span class="badge badge-blue">Schedules</span></td>
        <td><span class="badge badge-green">Manage Sets</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
      </tr>
      <tr>
        <td><strong>member</strong></td>
        <td><span class="badge badge-blue">Own Profile</span></td>
        <td><span class="badge badge-blue">Check-In</span></td>
        <td><span class="badge badge-blue">View Sets</span></td>
        <td><span class="badge badge-blue">Read Plans</span></td>
        <td><span class="badge badge-blue">Own History</span></td>
        <td><span class="badge badge-amber">No Access</span></td>
      </tr>
    </tbody>
  </table>

  <h2>4.3 Tamper-Evident Role Audit Trails</h2>
  <p>
    To guarantee governance compliance and prevent unauthorized privilege escalation, all system role modifications are permanently written to an immutable <code>roleAuditLogs</code> collection. The audit document captures the executing administrator’s UID and email, the recipient user’s UID, the exact previous and newly assigned roles, and an authoritative server-side timestamp.
  </p>

  <!-- SECTION 5 -->
  <div class="page-break"></div>
  <h1><span class="section-num">5</span> Functional Subsystem Domains</h1>

  <div class="feature-grid avoid-break">
    <div class="feature-card">
      <div class="feature-card-header">
        <div class="feature-icon-circle" style="background: #e0f2fe; color: #0369a1;">1</div>
        <div class="feature-card-title">People &amp; Flock Management</div>
      </div>
      <div class="feature-card-body">
        Maintains member demographics, spiritual milestones (Baptism, Dedication, Membership), family units, custom tags, and access permissions. Supports fast search, filtering, and role elevation.
      </div>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <div class="feature-icon-circle" style="background: #dcfce7; color: #15803d;">2</div>
        <div class="feature-card-title">Gatherings &amp; Smart Attendance</div>
      </div>
      <div class="feature-card-body">
        Manages single and recurring services. Real-time hardware camera QR check-in using <code>@yudiel/react-qr-scanner</code>. Generates live headcounts, first-timer alerts, and absentee flags.
      </div>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <div class="feature-icon-circle" style="background: #f3e8ff; color: #6b21a8;">3</div>
        <div class="feature-card-title">Worship &amp; Service Rostering</div>
      </div>
      <div class="feature-card-body">
        Song lyrics &amp; chord charts library with real-time browser-based transposition. Setlist builder for Sunday services. Volunteer scheduling matrix with conflict detection across teams.
      </div>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <div class="feature-icon-circle" style="background: #ffe4e6; color: #be123c;">4</div>
        <div class="feature-card-title">Pulpit &amp; Sermon Media Hub</div>
      </div>
      <div class="feature-card-body">
        Sermon series archiving, audio/video streaming links, and study guides. Powered by client-side WebAssembly FFmpeg audio compression to slash upload times and storage costs.
      </div>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <div class="feature-icon-circle" style="background: #fef3c7; color: #b45309;">5</div>
        <div class="feature-card-title">Financial Stewardship &amp; Giving</div>
      </div>
      <div class="feature-card-body">
        Designated fund management (Tithes, Missions, Building). In-browser OCR scanning for deposit slips (Tesseract.js). Instant PDF tax statements and Board-ready balance sheets via <code>jspdf</code>.
      </div>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <div class="feature-icon-circle" style="background: #f1f5f9; color: #334155;">6</div>
        <div class="feature-card-title">Discipleship &amp; Care Networks</div>
      </div>
      <div class="feature-card-body">
        Small group directory, leader assignments, meeting trackers, and curriculum document distribution. Moderated prayer wall with public, ministry-only, and confidential pastoral queues.
      </div>
    </div>
  </div>

  <h2>5.1 Client-Side WASM Audio Compression Pipeline</h2>
  <p>
    When church staff upload Sunday sermon audio files (often 100MB+ uncompressed WAV or high-bitrate MP3 recordings), the browser loads the FFmpeg WebAssembly core:
  </p>
  <div class="schema-block avoid-break">
    <div class="schema-title">FFmpeg WebAssembly Transcoding Pipeline</div>
    Raw Audio File (WAV/MP3/M4A) &rarr; WebAssembly Virtual Memory (FS) &rarr;
    Execution: <code>ffmpeg -i input.wav -c:a libmp3lame -b:a 64k -ac 1 output.mp3</code> &rarr;
    Compressed Stream (Average 80% size reduction) &rarr; Cloud Storage Direct Upload.
  </div>

  <h2>5.2 Optical Character Recognition (OCR) Contribution Pipeline</h2>
  <p>
    Church financial administrators entering manual donations, bank transfers, or checks can capture photos directly using their web camera or drag-and-drop receipts. The integrated Tesseract.js engine processes the image within an isolated Web Worker, extracting dollar amounts, donor bank references, and transaction dates for automated verification.
  </p>

  <!-- SECTION 6 -->
  <div class="page-break"></div>
  <h1><span class="section-num">6</span> Data Architecture & Persistence Schemas</h1>

  <h2>6.1 Firestore Entity-Relationship Structure</h2>
  <p>
    The following schema breakdown illustrates the principal document models within Cloud Firestore:
  </p>

  <div class="schema-block avoid-break">
    <div class="schema-title">churches/{churchId} &mdash; Tenant Workspace Definition</div>
    {<br>
    &nbsp;&nbsp;name: string, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// "Coram Deo Grace Fellowship"<br>
    &nbsp;&nbsp;code: string, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// "CDGF-MNL"<br>
    &nbsp;&nbsp;currency: { code: 'PHP', symbol: '₱' },<br>
    &nbsp;&nbsp;subscription: {<br>
    &nbsp;&nbsp;&nbsp;&nbsp;tier: 'growth', &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 'seed' | 'growth' | 'kingdom'<br>
    &nbsp;&nbsp;&nbsp;&nbsp;status: 'active', &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 'active' | 'trial' | 'past_due'<br>
    &nbsp;&nbsp;&nbsp;&nbsp;currentPeriodEnd: ISOString,<br>
    &nbsp;&nbsp;&nbsp;&nbsp;quotas: { maxMembers: 250, sermonStorageGb: 20, scheduling: true }<br>
    &nbsp;&nbsp;},<br>
    &nbsp;&nbsp;stats: { membersCount: 142, activeMinistriesCount: 8 }<br>
    }
  </div>

  <div class="schema-block avoid-break">
    <div class="schema-title">users/{uid} &mdash; Member & Staff Identity</div>
    {<br>
    &nbsp;&nbsp;email: string, displayName: string, phone: string,<br>
    &nbsp;&nbsp;churchId: string, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// Scoped church tenant ID<br>
    &nbsp;&nbsp;systemRoles: ['pastor', 'church_admin'], // Array supporting multi-role capability<br>
    &nbsp;&nbsp;primaryRole: 'pastor', &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// Primary display badge<br>
    &nbsp;&nbsp;familyId: string, status: 'active', birthDate: string, baptismDate: string<br>
    }
  </div>

  <div class="schema-block avoid-break">
    <div class="schema-title">giving/{givingId} &mdash; Financial Stewardship Contribution</div>
    {<br>
    &nbsp;&nbsp;churchId: string, donorId: string, donorName: string, fundId: string,<br>
    &nbsp;&nbsp;amount: number, currency: 'PHP', paymentMethod: 'bank_transfer' | 'cash' | 'check',<br>
    &nbsp;&nbsp;status: 'verified' | 'pending', depositSlipUrl: string, createdAt: serverTimestamp()<br>
    }
  </div>

  <div class="schema-block avoid-break">
    <div class="schema-title">ministries/{ministryId} &mdash; Ministry Team & Serving Roles</div>
    {<br>
    &nbsp;&nbsp;churchId: string, name: 'Worship Arts Ministry', category: 'Worship',<br>
    &nbsp;&nbsp;leaderIds: ['uid_alice', 'uid_bob'], &nbsp;// Grants ministry leadership rights<br>
    &nbsp;&nbsp;members: [<br>
    &nbsp;&nbsp;&nbsp;&nbsp;{ userId: 'uid_carlos', servingRole: 'Acoustic Guitar', joinedDate: ISOString }<br>
    &nbsp;&nbsp;]<br>
    }
  </div>

  <!-- SECTION 7 & 8 -->
  <div class="page-break"></div>
  <h1><span class="section-num">7</span> Non-Functional Attributes & Engineering Rigor</h1>

  <h2>7.1 Performance Benchmarks & Network Optimizations</h2>
  <ul>
    <li><strong>Bundle Size Efficiency:</strong> The application leverages Rollup tree-shaking via Vite 8 and Oxlint static analysis. Code splitting ensures users only download code for their authorized modules.</li>
    <li><strong>Zero-Overhead CSS:</strong> Tailwind CSS v4 compiles all styling statically at build time, yielding zero runtime CSS execution overhead.</li>
    <li><strong>Reactive Query Throttling:</strong> Firestore listeners are scoped with explicit query boundaries and limit clauses (e.g. <code>limit(50)</code> on recent activity and logs), preventing memory bloat on low-power admin devices.</li>
  </ul>

  <h2>7.2 Reliability & Fault Tolerance</h2>
  <ul>
    <li><strong>Offline Capability:</strong> Cloud Firestore enables multi-tab offline caching; in the event of an intermittent sanctuary Wi-Fi outage during Sunday check-in, check-in scans queue locally and flush automatically upon reconnection.</li>
    <li><strong>Data Integrity:</strong> Firestore transactions and batch writes (<code>writeBatch()</code>) are enforced across critical multi-collection operations (e.g., church creation, member deletion, and invoice recording).</li>
  </ul>

  <h1><span class="section-num">8</span> Architecture Roadmap & Recommendations</h1>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Phase</th>
        <th style="width: 35%;">Strategic Capability</th>
        <th style="width: 45%;">Architectural Implementation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Phase 1<br>(Q1 2027)</strong></td>
        <td><strong>Automated Payment Gateway Webhooks</strong></td>
        <td>Deploy Cloud Functions listening to Xendit / PayMongo / Stripe webhooks to auto-reconcile online donations directly into the <code>giving</code> collection.</td>
      </tr>
      <tr>
        <td><strong>Phase 2<br>(Q2 2027)</strong></td>
        <td><strong>Enterprise Push Notification Engine</strong></td>
        <td>Integrate Firebase Cloud Messaging (FCM) topic triggers to broadcast instant prayer alerts and volunteer shift notifications to mobile congregation members.</td>
      </tr>
      <tr>
        <td><strong>Phase 3<br>(Q3 2027)</strong></td>
        <td><strong>AI Pastoral Study Assistant</strong></td>
        <td>Implement Gemini API integrations to generate automated sermon summaries, small group discussion questions, and weekly bulletin announcements.</td>
      </tr>
      <tr>
        <td><strong>Phase 4<br>(Q4 2027)</strong></td>
        <td><strong>End-to-End Encrypted Pastoral Notes</strong></td>
        <td>Client-side asymmetric key encryption for private pastoral counseling and benevolence notes, ensuring absolute privacy even from cloud database administrators.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout avoid-break" style="margin-top: 30px;">
    <div class="callout-title">Architectural Sign-off & Governance Endorsement</div>
    This document constitutes the baseline solution architecture for CoramDeo Admin Web Application. Any structural alterations to collection schemas, authentication claims, or tenant isolation boundaries must undergo formal Architecture Review Board (ARB) assessment.
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
          <span>CoramDeo Platform &mdash; Solution Architecture Document</span>
          <span style="color: #64748b; font-weight: 600;">CONFIDENTIAL</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>StewardTrack System Architecture v1.0.0</span>
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

    console.log(`PDF successfully generated at: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

generatePdf().catch((err) => {
  console.error('Fatal error generating PDF:', err);
  process.exit(1);
});
