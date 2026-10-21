# CoramDeo Church Management Platform — Solution Architecture Document (SAD)

**Document Version:** 1.0.0  
**Status:** Approved / Baseline Architecture  
**Architect:** Lead Solution Architect  
**Project:** CoramDeo Admin Web Application (StewardTrack System)  
**Date:** October 2026  

---

## 1. Executive Summary & Solution Context

### 1.1 Purpose & Scope
The **CoramDeo Admin Web Application** (codenamed *StewardTrack*) is a cloud-native, multi-tenant Church Management System (ChMS) engineered to empower modern churches with seamless administrative, pastoral, worship, financial, and flock-care operations.

While modern church leadership faces fragmented tools across spreadsheets, siloed giving platforms, and manual volunteer scheduling, CoramDeo provides a single unified digital operating system. It bridges high-level executive oversight (Super Admin multi-church management) with daily local ministry operations (pastors, ministry leaders, finance administrators, secretaries) and congregational mobile parity.

### 1.2 System Boundary & Ecosystem
The CoramDeo ecosystem consists of three interconnected layers:
1. **CoramDeo Admin Portal (Web)**: The desktop/tablet-optimized management interface (React 19, Vite, Tailwind CSS v4, Firebase) used by church staff, leadership, and super administrators.
2. **CoramDeo Mobile Application (React Native / Expo)**: The congregational mobile client used by church members for event registrations, digital giving, sermon listening, prayer submissions, and Bible reading.
3. **Cloud Backend & Data Fabric (Google Cloud Platform & Firebase)**: Managed authentication, real-time NoSQL storage (Cloud Firestore), media asset storage (Cloud Storage), serverless workflows, and role security governance.

### 1.3 Key Architectural Drivers & Principles
- **Multi-Tenant Isolation**: Secure logical data partitioning across independent church workspaces.
- **Zero-Trust Role-Based Access Control (RBAC)**: Fine-grained dual-layer permission model separating administrative system functions from local ministry serving duties.
- **Client-Side Edge Computing**: Heavy computations—such as audio transcoding for sermons (WebAssembly FFmpeg), check/receipt deposit OCR (Tesseract.js), and board-ready financial PDF statements (jsPDF)—run on the client edge, drastically reducing backend compute overhead, latency, and cloud egress costs.
- **Real-Time Reactive State**: Instant synchronization of attendance rosters, prayer moderation, schedule updates, and financial verifications via Firestore streaming listeners.
- **Tier-Based SaaS Scaling**: Embedded quotas, grace periods, and feature gating supporting tiered monetization (Seed, Growth, Kingdom tiers).
- **Dual-Environment Dynamic Runtime**: Seamless switching between Staging and Production databases within staging builds, accelerating QA and enterprise onboarding.

---

## 2. High-Level System Architecture

### 2.1 Architectural Pattern
The application implements a **Client-Side Single-Page Application (SPA)** architecture interacting with a **Backend-as-a-Service (BaaS)** cloud infrastructure.

```
+---------------------------------------------------------------------------------------+
|                               PRESENTATION TIER (CLIENT)                              |
|                                                                                       |
|  React 19 Core  *  Vite Build Engine  *  Tailwind CSS v4  *  Lucide UI Componentry    |
|  +--------------------+------------------------+-------------------+----------------+ |
|  | Core Admin Modules | Ministry & Worship Ops | People & Care Hub | Finance & Gaps | |
|  +--------------------+------------------------+-------------------+----------------+ |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                           CLIENT-SIDE COMPUTING & EDGE LOGIC                          |
|                                                                                       |
|  * FFmpeg WASM Audio Transcoder       * Tesseract.js OCR Receipt & Check Reader       |
|  * jsPDF & AutoTable Report Generator * HTML5 / Yudiel QR Scanner Video Pipeline      |
|  * Dynamic Multi-Currency Engine      * Client-Side Quota & Tier Enforcement Hooks    |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                              APPLICATION STATE & CONTEXT                              |
|                                                                                       |
|  * AuthContext (Firebase Auth / Claims)    * Multi-Tenant Workspace Selector          |
|  * Environment Switcher Runtime Engine     * LocalStorage & IndexedDB (idb-keyval)    |
+-------------------------------------------+-------------------------------------------+
                                            | Secure HTTPS / WebSockets
                                            v
+---------------------------------------------------------------------------------------+
|                               CLOUD SERVICES (FIREBASE / GCP)                         |
|                                                                                       |
|  +--------------------------------+  +----------------------------------------------+ |
|  | Firebase Authentication        |  | Cloud Firestore (Multi-Tenant NoSQL Data)    | |
|  | - Email / Password Credentials |  | - Staging DB: nazarenechurch-9c030           | |
|  | - Google OAuth SSO             |  | - Production DB: coramdeo-prod (coramdeo)    | |
|  | - Custom JWT Claims Sync       |  | - Real-time Listeners (onSnapshot)           | |
|  +--------------------------------+  +----------------------------------------------+ |
|  +--------------------------------+  +----------------------------------------------+ |
|  | Cloud Storage (GCP Bucket)     |  | Firebase Admin SDK & Cloud Functions         | |
|  | - Compressed Sermon Audio      |  | - Super Admin Bootstrapping Scripts          | |
|  | - Worship Sheets & Chord Charts|  | - System Auditing & Data Migrations          | |
|  | - Ministry Media & Receipts    |  | - Cross-Service Triggers                     | |
|  +--------------------------------+  +----------------------------------------------+ |
+---------------------------------------------------------------------------------------+
```

### 2.2 Technology Stack Matrix

| Layer | Technology | Version | Rationale & Responsibility |
| :--- | :--- | :--- | :--- |
| **Runtime & Language** | JavaScript / TypeScript / Node.js | ES2023+ / TS 6.0 | Modern language semantics, asynchronous operations, dynamic typing with typed utility helpers. |
| **Frontend Framework** | React.js | 19.2.7 | Declarative component model, Concurrent React, fast DOM reconciliation. |
| **Build & Tooling** | Vite | 8.1.0 | Instant Hot Module Replacement (HMR), lightning-fast Rollup-based production bundling. |
| **Styling & Design** | Tailwind CSS & PostCSS | 4.3.3 | Utility-first CSS engine with pre-compiled theme tokens (`church-rose`, `church-canvas`, `church-charcoal`). |
| **Navigation & Routing** | React Router DOM | 7.18.0 | Declarative nested routing, path parameters, client redirects, and Route Guards. |
| **Identity & Authentication** | Firebase Auth | 12.15.0 | Session state management, OAuth 2.0 Google federation, JWT token claim verification. |
| **Database & Realtime** | Google Cloud Firestore | 12.15.0 | Schema-less document database with offline persistence and reactive snapshot listeners. |
| **Asset Storage** | Google Cloud Storage | 12.15.0 | Distributed object storage for media, receipts, audio sermons, and church branding. |
| **Edge Audio Compression** | FFmpeg WebAssembly (`@ffmpeg/ffmpeg`) | 0.12.15 | In-browser client audio transcoding and size compression before upload. |
| **Edge Optical Recognition** | Tesseract.js | 7.0.0 | Client-side Optical Character Recognition (OCR) for check deposits and expense receipts. |
| **Document Generation** | jsPDF & jsPDF-AutoTable | 4.2.1 / 5.0.9 | High-fidelity tabular financial reports, donor tax receipts, and member certificates. |
| **QR Code Processing** | `@yudiel/react-qr-scanner` / `html5-qrcode` | 2.6.0 / 2.3.8 | Hardware camera integration for contactless kiosk check-in and event validation. |
| **Data Visualizations** | Chart.js & `react-chartjs-2` | 4.5.1 / 5.3.1 | Financial charts, attendance trajectory trends, and giving fund breakdowns. |
| **Local Cache** | `idb-keyval` & LocalStorage | 6.2.5 | Fast client-side key-value persistence for scripture texts and runtime preferences. |
| **Testing & Quality** | Vitest, Testing Library, Oxlint | 4.1.9 / 1.69.0 | High-performance unit testing, DOM simulation, and linting rules. |

---

## 3. Multi-Tenancy & SaaS Subscription Architecture

### 3.1 Logical Multi-Tenancy Model
CoramDeo utilizes a **Shared Database, Logical Isolation** multi-tenancy model. Every church operates as an independent tenant identified by a unique `churchId`.

- All primary domain collections (`users`, `events`, `giving`, `expenses`, `ministries`, `schedules`, `sermons`, `prayerRequests`, `discipleshipGroups`) include a required `churchId` index attribute.
- Firestore Security Rules and client repositories strictly constrain queries with `where('churchId', '==', activeChurchId)`.
- Super Admins hold a global context (`activeChurchId = 'system'`) allowing multi-church switching, global oversight, and tenant provisioning.

### 3.2 Subscription Tiers & Quota Governance
The platform implements a SaaS monetization model governed by tier-based quotas and dynamic enforcement hooks (`useSubscriptionLimits` and `useSubscription`).

| Feature / Limit | Seed Fellowship (Free) | Growth Ministry (₱3,490/mo) | Kingdom Network (₱5,490/mo) |
| :--- | :--- | :--- | :--- |
| **Target Church Profile** | Church plants & small fellowships | Established mid-sized churches | Mega-churches & expanding networks |
| **Active Members Quota** | Up to **50 members** | Up to **250 members** | **Unlimited members** (No caps) |
| **Campus Workspaces** | 1 Campus | 1 Campus | Multi-Campus / Multi-Branch Ready |
| **Sermon Cloud Storage** | 2 GB storage limit | 20 GB / month media storage | 50 GB sermon video/audio storage |
| **Financial Tracking** | Tithes & General Giving | Unlimited Giving Funds & Campaigns | Unlimited Funds, Custom Analytics |
| **Volunteer Scheduling** | Not Available (Locked) | Full Team Rostering & Schedules | Advanced Rostering & Conflict Flags |
| **Worship & Setlists** | Basic Song List | Full Setlists & Key Transposition | Full Worship Tools & Lyrics Projection |
| **Discipleship & Groups**| Locked | Life Groups & Curriculums | Enterprise Group Hierarchy |
| **Financial Reporting** | Standard CSV/PDF exports | 1-Click Board-Ready Statements | Custom Audit Logs & Batch Tools |
| **Support Service Level**| Community Email Support | Priority Chat & Onboarding | Dedicated Account Rep & Zoom Staff Training |

### 3.3 Dynamic Quota Enforcement & Trial Lifecycle
1. **Real-Time Counter Synchronization**: A reactive listener calculates active congregation size (excluding Super Admins) and synchronizes counters with the church's Firestore document.
2. **Grace Period Protocol**: If a church subscription expires or payment lapses, the system provides a 7-day grace period with administrative alert banners (`SubscriptionBanner.jsx`) before write operations on tier-restricted features lock down gracefully into read-only mode.
3. **Upgrade Interceptor**: UI actions triggering locked features (e.g. attempting to create a Setlist or roster volunteers under the Seed tier) open the native `UpgradeModal` to initiate an automated plan change.

---

## 4. Security Architecture & Identity Access Management (IAM)

### 4.1 Two-Tier Role-Based Access Control (RBAC)
Security in CoramDeo is structured into two completely orthogonal, non-interfering layers:

```
+----------------------------------------------------------------------------------------------------+
|                               LAYER 1: SYSTEM ROLES (PLATFORM RBAC)                                 |
|                         (Stored in user profile: users/{uid}.systemRoles)                          |
|                                                                                                    |
|  * Church Admin     Full management of this church: members, finance, and settings.                 |
|  * Pastor           Pastoral ministry leadership, preaching, and discipleship.                     |
|  * Secretary        Administrative directory maintenance and attendance logs.                      |
|  * Finance Admin    Financial management: giving records, funds, and reports.                      |
|  * Ministry Leader  Oversees specific ministry departments and teams.                              |
|  * Member           Standard church member account.                                                |
|  * Super Admin      Full system-wide administrative control across all churches.                   |
+----------------------------------------------------------------------------------------------------+
                                                  +
+----------------------------------------------------------------------------------------------------+
|                               LAYER 2: MINISTRY ROLES (SERVING ROSTER)                             |
|                (Stored in ministry document: ministries/{id}.members[].servingRole)                |
|                                                                                                    |
|  * Ministry Leader  Assigned via ministries/{id}.leaderIds; edits roster and schedules             |
|  * Serving Roles    Vocalist, Drummer, Sound Tech, Usher, Greeter, Sunday School Lead              |
+----------------------------------------------------------------------------------------------------+
```

#### Multi-Role Capability & Primary Role Resolution
* **Multi-Select Assignment:** Church administrators can assign one or more system roles per user (e.g., a staff member can hold both `Pastor` and `Church Admin`).
* **Primary Role Indicator:** The first assigned role in `systemRoles` becomes the user's `primaryRole`, rendered in the administrative interface with a pink/rose **PRIMARY** badge.
* **Separation of Ministry Roles:** Ministry roles govern serving rosters and team scheduling without granting access to sensitive system settings or financial records.

### 4.2 Security Governance Rules & Auditability
- **Self-Elevation Prevention:** Users are strictly blocked from elevating or altering their own system role (`member.id !== userProfile?.uid`).
- **Super Admin Protection:** Only a `super_admin` can create or promote another `super_admin`. `church_admin` users can only assign roles within their church scope.
- **Reason for Change Audit:** When role modifications occur, the administrator can optionally submit a reason for change. This explanation, along with the actor ID, target user ID, timestamp, and previous vs new role arrays, is written to an immutable `roleAuditLogs` collection.
- **Custom Claims Validation:** High-privilege actions verify Firebase Authentication custom token claims (`tokenResult.claims.superAdmin`) alongside Firestore user profiles.

---

## 5. Functional Domains & Subsystem Architecture

### 5.1 People & Membership Management
- **Central Flock Directory**: Maintains comprehensive member records including contact information, demographic details, birthdates, baptism dates, spiritual milestones, and status flags (Active, Inactive, Visitor, Disciplined).
- **Family Unit Clustering**: Relates family members together (Head of Household, Spouse, Children) for integrated pastoral care and household-level financial statements.
- **Dynamic Filtering & Tags**: Allows secretaries and pastors to segment the congregation by age groups, ministry affiliations, and baptismal readiness.

### 5.2 Gathering, Events & Smart Attendance
- **Event Management Engine**: Supports recurring weekly Sunday worship services, mid-week prayer meetings, youth conferences, and special seminars.
- **Kiosk & Mobile Check-In Scanner**: Features integration with hardware cameras using `@yudiel/react-qr-scanner` and `html5-qrcode`. Congregation members present their personalized mobile QR code for instant check-in.
- **Real-Time Attendance Intelligence**: Automatically aggregates check-in totals per service session, flags first-time visitors, and generates absentee warning alerts for pastoral follow-up.

### 5.3 Worship Planning & Service Rostering
- **Song & Lyric Repository**: Central database of church worship music with song tags, authors, copyright metadata, original keys, and BPM.
- **Real-Time Key Transposition**: Dynamic in-browser transposition engine allowing music directors to shift chord charts into any vocal key on the fly.
- **Service Setlist Builder**: Enables worship teams to assemble Sunday service rundowns, link songs, specify arrangements, and project lyrics.
- **Volunteer Rostering & Conflict Detection**: Organizes ministry teams into shift schedules, alerting coordinators of double-booked volunteers across simultaneous services.

### 5.4 Pulpit & Pastoral Content Hub
- **Sermon Series & Media Pipeline**: Catalogs sermon series, scripture references, preachers, and attached study guides.
- **Client-Side WASM Audio Compression**: Leverages WebAssembly FFmpeg inside the browser (`@ffmpeg/ffmpeg`) to compress high-definition sermon audio recordings into streaming-optimized formats before transmission, eliminating server transcoding clusters and saving cloud bandwidth.
- **Global & Local Bible Reading Plans**: Provides multi-week scripture reading schedules with daily devotional tracking.
- **Global Bible Library**: High-performance indexed scripture engine supporting multiple biblical translations (KJV, ASV, Tagalog Ang Dating Biblia) with fast local querying.

### 5.5 Small Groups & Discipleship Engine
- **Life Groups Directory**: Manages small group clusters, campus divisions, leader appointments, and meeting schedules (in-person and virtual).
- **Curriculum & Materials Distribution**: Central repository for sermon discussion guides, discipleship modules, and leadership training handbooks.
- **Member Progress Tracking**: Monitors discipleship milestones from initial new-believer classes to ministry leadership graduation.

### 5.6 Pastoral Care & Community Prayer Wall
- **Moderated Prayer Wall**: Members submit prayer requests categorized as Public (church-wide), Ministry Team, or Confidential (Pastors only).
- **Pastoral Moderation Queue**: Dedicated approval workflow for church administrators to review, approve, or privatize incoming prayer items.
- **Status Lifecycle**: Transitions prayer items through active stages (*Under Review -> Praying -> Answered / Praise Report -> Archived*).

### 5.7 Financial Stewardship, Giving & Expenses
- **Multi-Fund Designated Giving**: Segregates financial contributions into distinct funds (General Tithes, Building Fund, Foreign Missions, Benevolence).
- **Omni-Channel Contribution Entry**: Accommodates digital payment verifications, batch Sunday envelope entries, and check deposits.
- **Edge OCR Receipt & Deposit Slip Scanner**: Utilizes Tesseract.js client-side OCR to parse bank deposit slips, check numbers, and cash amounts directly from scanned camera photos.
- **Expense & Budget Tracking**: Logs church operational expenditures, assigns expense categories, and tracks receipts for finance committee auditing.
- **Tax Statements & Board Reports**: Generates formal annual contribution statements and financial balance reports instantly on the client via `jspdf-autotable`.

### 5.8 Platform Administration & Super Admin Portal
- **Tenant Management**: Multi-church registration, church profile onboarding, trial extensions, and subscription tier assignments.
- **Global User Moderation**: Cross-tenant pending approval dashboard for newly registered administrators.
- **Global Bible Translation Manager**: Administrative import pipeline for ingesting full biblical canons into the shared platform library.

---

## 6. Data Architecture & Persistence Schema

### 6.1 Core Firestore Collections

```
churches/ {churchId}
  ├── name, code, contactEmail, currency, logoUrl
  ├── subscription: { tier, status, currentPeriodEnd, quotas }
  ├── stats: { membersCount, activeMinistriesCount }
  │
  ├── (subcollections or root collections with churchId filter)

users/ {uid}
  ├── email, displayName, photoURL, phone, churchId
  ├── systemRoles: ['super_admin' | 'church_admin' | 'pastor' | ...]
  ├── primaryRole: string
  ├── familyId, birthDate, baptismDate, status: 'active' | 'pending'

events/ {eventId}
  ├── churchId, title, description, startDate, endDate, location
  ├── sessions: [ { id, name, startTime, endTime } ]
  ├── isRegistrationRequired, capacity, checkInCode

eventAttendance/ {attendanceId}
  ├── churchId, eventId, sessionId, userId, memberName
  ├── checkInMethod: 'qr_scanner' | 'manual'
  ├── checkInTime: timestamp

giving/ {givingId}
  ├── churchId, donorId, donorName, fundId, amount, currency
  ├── paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'online'
  ├── status: 'verified' | 'pending'
  ├── depositSlipUrl, date: timestamp

givingFunds/ {fundId}
  ├── churchId, name, description, isTaxDeductible, isDefault

expenses/ {expenseId}
  ├── churchId, categoryId, amount, currency, description, vendor
  ├── receiptUrl, approvedBy, date: timestamp

ministries/ {ministryId}
  ├── churchId, name, description, category
  ├── leaderIds: [uid1, uid2]
  ├── members: [ { userId, servingRole, joinedDate } ]

schedules/ {scheduleId}
  ├── churchId, ministryId, eventId, date, title
  ├── assignments: [ { roleName, assignedUserId, confirmed } ]

songs/ {songId}
  ├── churchId, title, artist, originalKey, bpm, lyricsAndChords, tags

setlists/ {setlistId}
  ├── churchId, title, serviceDate, songs: [ { songId, key, order } ]

sermons/ {sermonId}
  ├── churchId, title, series, speaker, date, audioUrl, studyGuideUrl

discipleshipGroups/ {groupId}
  ├── churchId, name, leaderId, memberIds: [], meetingSchedule

prayerRequests/ {requestId}
  ├── churchId, authorId, authorName, requestText, privacyLevel, status

roleAuditLogs/ {logId}
  ├── actorId, actorEmail, targetUserId, previousRoles, newRoles, timestamp
```

---

## 7. Non-Functional & Quality Attributes

### 7.1 Performance & Resource Efficiency
- **Zero Server Compute for Media & OCR**: By embedding WebAssembly FFmpeg and Tesseract.js directly inside client browsers, the platform eliminates dedicated server transcoders, slashing infrastructure costs while delivering instant visual feedback.
- **Targeted Reactive Listeners**: Firestore queries strictly filter by `churchId` and use specific limits (`limit(50)`), preventing unbounded listener costs.
- **Sub-Second Bundle Delivery**: Built with Vite 8 with Oxlint tree-shaking and dynamic code-splitting for routes, ensuring fast initial page loads.

### 7.2 Scalability & Availability
- **Cloud Infrastructure SLA**: Hosted on Google Cloud and Firebase with automated multi-zone replication, guaranteeing **99.95% availability**.
- **Tenant Scalability**: Logical tenant separation ensures millions of records can coexist across thousands of independent churches without schema migrations or cross-talk.

### 7.3 Data Privacy & Compliance
- **Financial Segregation**: Giving and personal contribution records are restricted to users with `finance_admin`, `church_admin`, or `super_admin` permissions. Pastors can optionally be granted giving visibility depending on church governance bylaws.
- **Pastoral Privilege**: Confidential prayer requests and pastoral care logs are shielded from general church staff and volunteer ministry leaders.

---

## 8. Strategic Roadmap & Future Architecture Evolution

1. **Integrated Payment Gateways (Q1 2027)**: Webhook-driven automated bank reconciliation via Xendit, PayMongo, and Stripe for seamless instant giving verifications.
2. **Push Notification Gateway (Q2 2027)**: Direct integration with Firebase Cloud Messaging (FCM) to trigger instant push notifications to the mobile congregation app for urgent prayer alerts and service schedule changes.
3. **AI Pastoral Assistant (Q3 2027)**: Secure LLM integration for automated sermon transcription, study guide generation, and congregational sentiment analysis.
4. **End-to-End Encrypted Pastoral Counseling (Q4 2027)**: Client-side encrypted notes for private pastoral counseling sessions to ensure complete confidentiality.
