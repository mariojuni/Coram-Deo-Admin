# CoramDeo Church Administration Platform (StewardTrack)
## Official End-User & Client-Facing Software Documentation
**Document Version:** 1.0.0  
**Target Audience:** Church Pastors, Administrators, Treasurers, Ministry Leaders, Church Secretaries, and Super Admins  
**Product:** CoramDeo Admin Web Application  
**Classification:** Client-Facing User Guide & Operational Manual  

---

# Table of Contents
1. [Welcome to CoramDeo Admin](#1-welcome-to-coramdeo-admin)
2. [Getting Started & Access Security](#2-getting-started--access-security)
3. [The Daily Command Center: Dashboard Overview](#3-the-daily-command-center-dashboard-overview)
4. [Flock & Member Care Directory](#4-flock--member-care-directory)
5. [Gatherings, Events & Smart Attendance](#5-gatherings-events--smart-attendance)
6. [Worship Ministry & Service Planning](#6-worship-ministry--service-planning)
7. [Pulpit, Sermons & Bible Plans](#7-pulpit-sermons--bible-plans)
8. [Discipleship Groups & Prayer Care](#8-discipleship-groups--prayer-care)
9. [Financial Stewardship, Giving & Expenses](#9-financial-stewardship-giving--expenses)
10. [Subscription Plans, Quotas & Settings](#10-subscription-plans-quotas--settings)
11. [Troubleshooting & Frequently Asked Questions (FAQ)](#11-troubleshooting--frequently-asked-questions-faq)

---

## 1. Welcome to CoramDeo Admin

Welcome to **CoramDeo Admin** (powered by the *StewardTrack* engine) — the comprehensive digital platform engineered to assist your church leadership in shepherding the flock, honoring God through transparent financial stewardship, organizing worship services, and streamlining weekly administrative ministry.

Whether you are a senior pastor reviewing Sunday attendance, a church treasurer tracking designated missionary funds, a worship leader transposing chords for Sunday morning, or a church secretary managing membership records, this manual provides clear, task-oriented guidance.

### 1.1 Who Is This Software For?
* **Senior Pastors & Pastoral Staff:** Review congregation growth, plan sermon series, curate discipleship materials, and oversee confidential prayer requests.
* **Church Administrators & Secretaries:** Maintain the member directory, coordinate event registrations, set up Sunday kiosk check-ins, and publish announcements.
* **Finance Officers & Treasurers:** Record tithes and offerings, scan bank deposit slips using camera OCR, allocate designated funds, track expenses, and issue annual tax contribution statements.
* **Worship Directors & Ministry Coordinators:** Manage song repertoires, transpose chord charts on the fly, build Sunday setlists, and schedule volunteers without double-booking conflicts.
* **Super Administrators:** Manage church tenants, approve new leadership accounts, oversee multi-campus networks, and maintain biblical translation libraries.

---

## 2. Getting Started & Access Security

### 2.1 Logging In
1. Open your desktop or tablet browser (Google Chrome, Apple Safari, Microsoft Edge, or Mozilla Firefox are fully supported).
2. Navigate to your church's CoramDeo Admin URL.
3. Choose your preferred sign-in method:
   * **Email & Password:** Enter your church staff email address and password, then click **Sign In**.
   * **Sign in with Google:** Click the **Continue with Google** button to authenticate with your verified Google Workspace or personal Gmail account.
4. If you have forgotten your password, click **Forgot Password?** to receive an automated secure password-reset link.

### 2.2 Approval & Email Verification Status
To ensure church data remains private and secure:
* **Email Verification:** If your email has not yet been verified, you will be prompted to check your inbox and click the verification link.
* **Administrative Approval:** New administrative accounts must be approved by your church's `church_admin` or a platform `super_admin`. While pending, your screen will display an **Approval Pending** notice. Once approved, refresh your browser to enter the portal.

### 2.3 Understanding Your Role & Navigation Sidebar
Your left-hand navigation sidebar automatically displays only the modules you are authorized to access based on your assigned role:

| System Role | Primary Responsibilities | Sidebar Sections Accessible |
| :--- | :--- | :--- |
| **church_admin** | Full operational control of the church | All Church Modules (Dashboard, Events, Members, Worship, Sermons, Finance, Settings) |
| **pastor** | Spiritual oversight, teaching, care | Dashboard, Sermons, Worship, Bible Plans, Discipleship, Prayer, Members, Reports |
| **finance_admin** | Treasury, giving, expense accounting | Finance & Giving, Accounts & Funds, Expenses, Verification Queue, Financial Reports |
| **secretary** | Church office administration | Member Directory, Events, Kiosk Attendance, Announcements, Prayer Moderation |
| **ministry_leader**| Ministry team coordination | Assigned Ministry, Volunteer Scheduling, Songs & Lyrics, Worship Setlists |
| **super_admin** | Platform & multi-church governance | Global Churches Registry, User Approvals, Bible Library, Global Roles |

---

## 3. The Daily Command Center: Dashboard Overview

When you sign in, the **Dashboard** provides an executive summary of your church's weekly momentum and immediate action items.

```
+---------------------------------------------------------------------------------------+
|  CORAMDEO ADMIN DASHBOARD                                     [Active Church Workspace]|
+---------------------------------------------------------------------------------------+
|  [👥 Active Members: 142]  [📅 Upcoming Events: 3]  [📊 Monthly Attendance: 520]      |
|  [💰 Pending Giving: 4]    [🙏 Pending Prayers: 2]  [📖 Published Sermons: 48]        |
+---------------------------------------------------------------------------------------+
|  URGENT ACTION QUEUE                        |  THIS WEEK'S SCHEDULE                   |
|  * 4 Online Tithes Awaiting Verification    |  * Sunday 1st Service (09:00 AM)        |
|  * 2 Confidential Prayer Requests to Review |  * Midweek Prayer Gathering (07:00 PM)  |
|  * 1 Life Group without Assigned Leader     |  * Youth Night (Saturday 05:00 PM)      |
+---------------------------------------------------------------------------------------+
```

### 3.1 Key Metrics Cards
* **Active Members:** Real-time count of active congregation members and families.
* **Monthly Attendance:** Cumulative check-in headcounts across all services this month.
* **Pending Tasks Indicator:** Displays outstanding items requiring pastoral or administrative attention (e.g., unapproved prayers, unverified giving slips).

### 3.2 Quick Action Buttons
At the top of your dashboard, one-click action shortcuts allow you to:
* **Add New Member**
* **Record Tithe / Offering**
* **Create New Event**
* **Upload Sermon Audio**

---

## 4. Flock & Member Care Directory

The **Members** module (`/admin/members`) is your central congregation registry.

### 4.1 Adding a New Member Profile
1. Navigate to **Members** in the sidebar.
2. Click the **+ Add Member** button in the upper-right corner.
3. Fill in the member's details:
   * **Full Name:** First, Middle, and Last Name.
   * **Contact Information:** Email address and mobile phone number.
   * **Membership Classification:** Select *Full Member*, *Preparatory Member*, *Adherent*, or *Visitor*.
   * **Spiritual Milestones:** Record Baptism Status (*Baptized* / *Not Baptized*), Baptism Date, and Confirmation.
   * **Family Group:** Assign or create a family unit so relatives are linked together for household communications.
   * **Special Attributes:** Mark *Is Abroad / OFW* if the member attends online from overseas, or add confidential emergency contacts.
4. Click **Save Member**. The profile is instantly searchable in the directory.

### 4.2 Managing Roles & Portal Access
> [!IMPORTANT]
> Only `church_admin` and `super_admin` users are authorized to assign or change system roles. Users can never change their own role.

To grant administrative access to a church member:
1. Open the member's profile card in the directory.
2. Click the **Access & Role** tab.
3. Under **System Role**, select the appropriate role (e.g. *Secretary*, *Finance Admin*, or *Pastor*).
4. Click **Update Role**.
5. The action is permanently recorded in your church's **Role Audit Log** for safety and governance.

---

## 5. Gatherings, Events & Smart Attendance

The **Events** and **Attendance** modules coordinate Sunday services, youth camps, conferences, and mid-week Bible studies.

### 5.1 Creating a Service or Event
1. Go to **Events** and click **+ Create Event**.
2. Enter the event title (e.g. *Sunday Morning Worship - 1st Service*), date, start/end time, and sanctuary location.
3. For multi-service days, add sessions (e.g. *Session 1: 8:00 AM*, *Session 2: 10:30 AM*).
4. Save the event. CoramDeo automatically generates a unique check-in QR code.

### 5.2 Operating the Kiosk QR Attendance Scanner
On Sunday morning, transform any laptop, tablet, or desktop equipped with a webcam into a self-service check-in kiosk:
1. Navigate to **Attendance** &rarr; Select Today's Service &rarr; Click **Open QR Scanner Kiosk**.
2. Allow your browser permission to access the camera.
3. Congregation members simply hold their CoramDeo mobile app QR code up to the screen.
4. The system beeps, displays an on-screen welcome greeting, increments the live headcount, and logs the attendance timestamp.
5. If a member does not have their phone, the usher can use the **Manual Search Check-In** tab to search by name and click **Check In**.

---

## 6. Worship Ministry & Service Planning

Located under **Ministry & Word &rarr; Songs & Lyrics** and **Setlists**.

### 6.1 Building the Song Library & Chord Charts
1. Go to **Songs & Lyrics** and click **+ Add Song**.
2. Input the song title, artist/composer, copyright/CCLI reference, original musical key (e.g., Key of G), and tempo (BPM).
3. Paste lyrics with standard chord notation (e.g. `[G]Amazing Grace, how [C]sweet the [G]sound`).
4. Save the song.

### 6.2 Real-Time Key Transposition
Every vocalist has a different vocal range. CoramDeo features an in-browser chord transposition engine:
* Open any song sheet.
* Click the **Transpose Key** dropdown (e.g., change from Key of G to Key of D).
* The chords instantly recalculate across the entire chart without modifying the original database record.

### 6.3 Creating a Sunday Service Setlist
1. Navigate to **Setlists** &rarr; click **+ New Setlist**.
2. Select the upcoming event date.
3. Search and add songs in order of worship (Opening Praise, Adoration, Response, Offertory).
4. Specify the chosen performance key for each song.
5. Worship team members can access the setlist directly from their tablets during rehearsal or Sunday service.

---

## 7. Pulpit, Sermons & Bible Plans

### 7.1 Archiving Sermons with Edge Audio Compression
CoramDeo features in-browser audio compression powered by WebAssembly, meaning large Sunday sermon recordings are compressed on your computer *before* uploading:
1. Navigate to **Sermons** &rarr; click **+ Upload Sermon**.
2. Enter the sermon title, series name, scripture text, preaching pastor, and date.
3. Attach your audio recording (.mp3, .wav, or .m4a).
4. **Watch the Compression Engine:** The browser automatically compresses the file by up to 80% without quality loss, uploading in seconds and saving your church's media storage quota.
5. Publish the sermon. It will immediately appear in your congregation's mobile application.

### 7.2 Church-Wide Bible Reading Plans
1. Navigate to **Bible Plans**.
2. Select an existing plan (e.g. *Through the New Testament in 90 Days*) or click **Create Custom Plan**.
3. Members can follow daily devotional scriptures and mark chapters completed from their mobile phones.

---

## 8. Discipleship Groups & Prayer Care

### 8.1 Life Groups & Curriculum Distribution
1. Navigate to **Discipleship &rarr; Groups**.
2. Click **+ Create Group** to register a new small group (e.g., *Couples Fellowship North*, *Young Adults Life Group*).
3. Assign a **Group Leader** and add member profiles.
4. Under **Materials**, upload study guides or sermon discussion questions for group leaders to download weekly.

### 8.2 Moderating Prayer Requests
1. Navigate to **Prayer Requests** (`/admin/prayer`).
2. Incoming prayers submitted from congregation members are listed in the **Moderation Queue**.
3. Review the prayer details:
   * **Public:** Display on the church-wide mobile prayer wall so the congregation can pray together.
   * **Confidential:** Restrict visibility exclusively to pastoral staff for private pastoral intercession.
4. Update prayer status as God answers: transition items from *Praying* to *Answered / Praise Report* to encourage the congregation!

---

## 9. Financial Stewardship, Giving & Expenses

The **Finance & Giving** module (`/admin/finance`) is engineered for church transparency, strict segregation of duties, and board auditing standards.

```
+---------------------------------------------------------------------------------------+
|  FINANCE & STEWARDSHIP OVERVIEW                                                       |
+---------------------------------------------------------------------------------------+
|  [💰 Total Giving: ₱148,500]  [📉 Total Expenses: ₱62,300]  [⚖️ Net Balance: ₱86,200] |
+---------------------------------------------------------------------------------------+
|  FUND ALLOCATION BREAKDOWN            |  VERIFICATION QUEUE                           |
|  * General Tithes: 65%                |  * Ref #BT-8891 - GCash Tithe (₱2,500)        |
|  * Building Fund: 20%                 |  * Ref #CK-4022 - Check Deposit (₱10,000)     |
|  * Foreign Missions: 10%              |  * 2 Bank Transfers Awaiting Review           |
|  * Benevolence Fund: 5%               |                                               |
+---------------------------------------------------------------------------------------+
```

### 9.1 Designated Fund Accounting
Ensure every gift goes where the donor intended:
* Navigate to **Finance &rarr; Funds**.
* View or create designated funds: *General Tithes & Offerings*, *Building / Sanctuary Fund*, *Missions Fund*, *Benevolence / Calamity Relief*.
* All contributions are linked to a specific fund for precise financial reporting.

### 9.2 Recording Contributions & Camera OCR Scanner
1. Go to **Finance & Giving** &rarr; click **+ Record Giving**.
2. Choose the entry method:
   * **Manual Entry:** Select donor name (or mark *Anonymous*), choose fund, enter amount, payment type (Cash, Check, Bank Transfer, Online), and date.
   * **Smart Camera / OCR Slip Scanner:** Click **Scan Receipt / Deposit Slip**. Point your web camera or upload a photo of the bank transfer slip or check. The built-in Tesseract.js OCR engine automatically detects and fills in the amount and reference code!
3. Click **Verify & Post Transaction**.

### 9.3 Tracking Church Expenses
1. Go to **Finance &rarr; Expenses** &rarr; click **+ Record Expense**.
2. Input the vendor name, expense category (e.g., *Sanctuary Utilities*, *Ministry Supplies*, *Guest Honorarium*), amount, and payment date.
3. Upload a photo or PDF of the receipt for church accounting records.

### 9.4 1-Click Board Statements & Donor Tax Receipts
At month-end or year-end:
1. Navigate to **Finance &rarr; Reports**.
2. Select your date range (e.g. *Current Year*, *Last Quarter*, or *Custom Range*).
3. Click **Generate Board Statement (PDF)** for a formal balance sheet with visual charts ready for the church board meeting.
4. Click **Donor Annual Giving Statements** to generate individual PDF tax acknowledgment receipts for congregation members with a single click.

---

## 10. Subscription Plans, Quotas & Settings

### 10.1 Understanding Church Subscription Tiers
CoramDeo offers three subscription tiers tailored to your church size:

| Plan | Target Ministry | Membership Cap | Media Storage | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Seed Fellowship** | Church plants & small fellowships | Up to 50 members | 2 GB storage | Core giving, QR kiosk attendance, member directory. |
| **Growth Ministry** | Established growing churches | Up to 250 members | 20 GB storage | Volunteer scheduling, worship setlists, board reports, priority support. |
| **Kingdom Network** | Large churches & multi-campus | Unlimited members | 50 GB storage | All Growth tools + unlimited members, multi-campus scalability, Zoom training. |

### 10.2 What Happens If Your Church Reaches Its Member Limit?
If your church is on the **Seed Fellowship** tier and you attempt to add your 51st member:
1. The system displays a friendly **Plan Limit Reached** dialog.
2. Existing data remains 100% safe and intact.
3. A church administrator can click **Upgrade Plan** to activate a 14-day free trial of **Growth Ministry** with higher member and storage quotas.

### 10.3 Church Branding & Currency Settings
1. Navigate to **Settings &rarr; Church Profile**.
2. Upload your church logo, address, contact telephone, and senior pastor name.
3. Select your church's primary operating currency (e.g., **PHP (₱)**, **USD ($)**, **CAD ($)**, **EUR (€)**, **GBP (£)**, or **SGD ($)**).
4. All dashboard counters, giving logs, and PDF reports immediately reflect your chosen currency symbol.

---

## 11. Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: My webcam is not turning on for QR Attendance check-in. What should I do?
* **Answer:** Check your browser's address bar. Click the camera icon or pad-lock icon on the left of the URL and ensure **Camera Permission** is set to **Allow**. Make sure no other application (like Zoom or Teams) is currently locking the webcam.

### Q2: Can a volunteer worship leader view church giving or member phone numbers?
* **Answer:** **No.** CoramDeo's Two-Tier RBAC security guarantees that users with the `ministry_leader` role can only see their team roster, song chords, and setlists. Financial transactions, confidential giving records, and pastoral prayer queues are completely hidden.

### Q3: How do we change a staff member's permissions when their role changes?
* **Answer:** A `church_admin` should open **Settings &rarr; Users & Roles** (or the member's profile &rarr; **Access & Role** tab), select the new role, and click **Save**. The change takes effect immediately upon their next action.

### Q4: Are Sunday check-ins recorded if sanctuary Wi-Fi drops temporarily?
* **Answer:** **Yes.** CoramDeo utilizes Google Cloud Firestore with active local caching. Check-ins scanned during a temporary connection drop are queued in your browser's local memory and automatically sync to the cloud database the moment connection resumes.

### Q5: Who can I contact if I need technical assistance?
* **Community & Seed Tier Support:** Email `support@coramdeo.app`.
* **Growth & Kingdom Tiers:** Access direct priority chat inside the admin portal or request scheduled Zoom onboarding assistance.

---
*CoramDeo Admin Web Application — Soli Deo Gloria.*
