import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Database,
  Users,
  Eye,
  CalendarCheck,
  Mail,
  Cookie,
  Scale,
  FileText,
  AlertTriangle,
  Globe,
  ArrowLeft,
  Search,
  Printer,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Server,
  KeyRound,
  FileCheck2,
  HeartHandshake,
  Baby
} from 'lucide-react';
import logo from '../../assets/logo.svg';
import SoftCard from '../ui/SoftCard';
import StatusPill from '../ui/StatusPill';

// ---------------------------------------------------------------------------
// Privacy Policy Content & Structure
// ---------------------------------------------------------------------------
const SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction & Scope',
    shortTitle: 'Introduction',
    icon: Shield,
    badgeVariant: 'violet',
    summary: 'Overview of Coram Deo, our mission, and our commitment to data privacy.',
    content: (
      <div className="space-y-4">
        <p>
          Welcome to <strong>Coram Deo</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). We provide a unified church management and ministry platform designed to support churches, pastors, administrators, volunteers, and congregation members in their spiritual mission, administration, discipleship, and community engagement.
        </p>
        <p>
          This Privacy Policy explains how personal data is collected, stored, processed, and safeguarded across all Coram Deo applications, including the <strong>Coram Deo Admin Portal</strong>, mobile applications, check-in kiosks, and associated ministry services (collectively, the &ldquo;Service&rdquo;).
        </p>
        <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4 text-sm text-church-navy">
          <strong>Key Commitment:</strong> We respect the sacred trust between a church and its congregation. We do not sell, rent, or monetize your church&rsquo;s personal data to advertisers or third-party data brokers. Your church owns its data.
        </div>
      </div>
    ),
  },
  {
    id: 'controller-processor',
    title: '2. Data Controller vs. Data Processor',
    shortTitle: 'Controller & Processor',
    icon: Scale,
    badgeVariant: 'amber',
    summary: 'Distinction between the Church’s responsibilities and Coram Deo’s role.',
    content: (
      <div className="space-y-4">
        <p>
          To maintain transparency and comply with international privacy regulations (such as GDPR, the Philippine Data Privacy Act of 2012, and CCPA):
        </p>
        <div className="grid md:grid-cols-2 gap-4 my-2">
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-2 font-bold text-church-navy mb-1.5">
              <span className="w-2 h-2 rounded-full bg-church-amber" />
              The Church as Data Controller
            </div>
            <p className="text-xs text-church-slate leading-relaxed">
              Your local church or ministry organization is the <strong>Data Controller</strong>. The church decides what congregation records to collect, manages member records, processes giving, organizes ministries, and authorizes staff and volunteer access permissions.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-2 font-bold text-church-navy mb-1.5">
              <span className="w-2 h-2 rounded-full bg-church-emerald" />
              Coram Deo as Data Processor
            </div>
            <p className="text-xs text-church-slate leading-relaxed">
              Coram Deo acts strictly as the <strong>Data Processor</strong> (or Service Provider). We store and process data exclusively on behalf of the church, adhering strictly to the church&rsquo;s instructions and implementing technical safeguards to keep that data confidential.
            </p>
          </div>
        </div>
        <p className="text-sm">
          If you are a church member or attendee with questions about the records your church maintains about you or wishing to update your profile, please contact your local church administrator directly.
        </p>
      </div>
    ),
  },
  {
    id: 'information-collected',
    title: '3. Information We Collect',
    shortTitle: 'Data Collected',
    icon: Database,
    badgeVariant: 'rose',
    summary: 'Categories of personal, spiritual, administrative, and technical information.',
    content: (
      <div className="space-y-4">
        <p>
          We only collect information necessary to deliver and support church management functions. Information is grouped into the following categories:
        </p>
        <div className="space-y-3 mt-2">
          <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-xs">
            <h4 className="font-semibold text-sm text-church-navy mb-1">A. Church Administrator & Staff Accounts</h4>
            <p className="text-xs text-church-slate">
              Full name, church email address, encrypted authentication credentials, assigned system roles (Super Admin, Church Admin, Pastor, Finance Lead, Ministry Lead), profile photograph, and contact numbers.
            </p>
          </div>

          <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-xs">
            <h4 className="font-semibold text-sm text-church-navy mb-1">B. Congregation & Member Directory Data</h4>
            <p className="text-xs text-church-slate">
              Member identity (full name, nickname, gender, date of birth, marital status), contact information (residential address, phone numbers, email), family household links, membership status (active, visitor, regular attendee, archived), spiritual milestones (date of baptism, salvation, membership confirmation), and notes logged by authorized pastoral staff.
            </p>
          </div>

          <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-xs">
            <h4 className="font-semibold text-sm text-church-navy mb-1">C. Attendance & Check-In Logs</h4>
            <p className="text-xs text-church-slate">
              Worship service dates, service types, check-in timestamps, QR-scanner check-in events, child kiosk check-ins, and guardian authorized release verifications.
            </p>
          </div>

          <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-xs">
            <h4 className="font-semibold text-sm text-church-navy mb-1">D. Giving, Tithes & Financial Records</h4>
            <p className="text-xs text-church-slate">
              Donation records, fund designations (Tithe, General Offering, Missions, Building Fund), transaction dates, amounts, check numbers, or bank deposit reference numbers, and annual contribution statements. <em>Note: Coram Deo does not process payments or operate an online payment gateway. Giving is conducted directly between the donor and the church via direct bank deposits to church account numbers, bank transfers, or in-person cash/check. We do not collect or store donor credit/debit cards, bank login credentials, or PINs.</em>
            </p>
          </div>

          <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-xs">
            <h4 className="font-semibold text-sm text-church-navy mb-1">E. Ministries, Discipleship & Spiritual Activities</h4>
            <p className="text-xs text-church-slate">
              Discipleship groups, small group rosters, attendance logs, curriculum progress, worship song catalogs and setlists, sermon outlines, and prayer requests (which can be configured as confidential pastoral-only or shared with the prayer team).
            </p>
          </div>

          <div className="border border-gray-100 rounded-xl p-3.5 bg-white shadow-xs">
            <h4 className="font-semibold text-sm text-church-navy mb-1">F. Technical & Device Information</h4>
            <p className="text-xs text-church-slate">
              Internet Protocol (IP) addresses, browser type, operating system version, device identifiers, session tokens, audit timestamps, and diagnostic error reports.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'legal-basis',
    title: '4. Legal Basis for Processing',
    shortTitle: 'Legal Basis',
    icon: FileCheck2,
    badgeVariant: 'emerald',
    summary: 'Lawful processing grounds under GDPR and Data Privacy regulations.',
    content: (
      <div className="space-y-3">
        <p>
          Under international privacy frameworks (including GDPR Article 6 & Article 9, and national data privacy acts), we process personal data under the following lawful grounds:
        </p>
        <ul className="space-y-2 text-sm text-church-slate pl-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-church-emerald shrink-0 mt-0.5" />
            <span><strong>Contractual Necessity:</strong> Processing required to establish accounts, grant church administrator access, and operate the church management system.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-church-emerald shrink-0 mt-0.5" />
            <span><strong>Legitimate Ministry & Organizational Interests:</strong> Managing ecclesiastical records, facilitating member care, organizing volunteer teams, and maintaining church financial stewardship.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-church-emerald shrink-0 mt-0.5" />
            <span><strong>Consent:</strong> When members voluntarily opt-in to public prayer chains, media recording consents, or event communications.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-church-emerald shrink-0 mt-0.5" />
            <span><strong>Legal Obligations:</strong> Compliance with statutory financial records retention, tax compliance for donor acknowledgments, and mandatory child protection laws.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'multi-tenant',
    title: '5. Multi-Tenant Data Isolation & Security Architecture',
    shortTitle: 'Multi-Tenant Isolation',
    icon: Lock,
    badgeVariant: 'violet',
    summary: 'How church records are partitioned, isolated, and protected from cross-tenant access.',
    content: (
      <div className="space-y-4">
        <p>
          Coram Deo operates as a modern cloud-native <strong>multi-tenant architecture</strong>. While churches leverage shared high-availability cloud infrastructure, each organization&rsquo;s data is strictly partitioned and isolated:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40">
            <h5 className="font-semibold text-church-navy text-xs uppercase tracking-wider mb-1">Row-Level Tenant Scoping</h5>
            <p className="text-xs text-church-slate">Every document, member record, event, and financial transaction is strictly tagged with a unique <code className="bg-purple-100/70 px-1 py-0.5 rounded text-[11px] font-mono">churchId</code>. Backend database security rules enforce isolation so Church A cannot query Church B&rsquo;s records.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40">
            <h5 className="font-semibold text-church-navy text-xs uppercase tracking-wider mb-1">Role-Based Access Control (RBAC)</h5>
            <p className="text-xs text-church-slate">Granular permissions limit visibility within each church. For example, regular volunteers cannot access giving records or confidential pastoral notes.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40">
            <h5 className="font-semibold text-church-navy text-xs uppercase tracking-wider mb-1">Authentication Hardening</h5>
            <p className="text-xs text-church-slate">Admin accounts are verified via Google Cloud Identity and Firebase Auth, with secure JWT token revocation, reCAPTCHA Enterprise protection, and SMS OTP verification options.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40">
            <h5 className="font-semibold text-church-navy text-xs uppercase tracking-wider mb-1">Audit Trail Logging</h5>
            <p className="text-xs text-church-slate">Critical actions (such as giving modifications, role elevation, member bulk exports, and account status alterations) are recorded with timestamp and admin identifier for full accountability.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'financial-giving',
    title: '6. Giving, Offerings & Direct Bank Transfers',
    shortTitle: 'Donations & Giving',
    icon: HeartHandshake,
    badgeVariant: 'emerald',
    summary: 'Direct-to-bank contributions, manual giving records, and financial stewardship.',
    content: (
      <div className="space-y-4">
        <p>
          Handling church tithes and offerings demands the highest fiduciary, ethical, and technical care:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-church-slate">
          <li>
            <strong>No Automated Payment Gateway:</strong> Coram Deo does not process electronic payments or operate an online payment gateway, checkout, or digital wallet service. We do not process, intermediate, or handle monetary transactions directly.
          </li>
          <li>
            <strong>Direct-to-Bank Giving:</strong> Digital giving is completed externally by donors sending contributions directly to their church&rsquo;s official bank account numbers (via their personal online bank apps, wire transfers, or over-the-counter deposits). The church may display its official bank account numbers on its profile or bulletin solely to guide congregation members.
          </li>
          <li>
            <strong>Strict Financial Access Controls:</strong> Giving records and donor contribution amounts logged by church staff are restricted strictly to authorized finance administrators and pastors with explicit financial oversight privileges.
          </li>
          <li>
            <strong>No Banking Credentials or Card Data Stored:</strong> Coram Deo never collects, captures, transmits, or stores donors&rsquo; online banking passwords, ATM PINs, OTPs, or credit/debit card numbers.
          </li>
          <li>
            <strong>Stewardship &amp; Contribution Statements:</strong> Recorded giving logs (amounts, fund designations such as Tithes or Missions, transaction dates, and optional deposit reference/check numbers) are maintained solely for generating donor contribution statements, annual receipts, and statutory church financial accounting.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'event-registrants',
    title: '7. Event Registrants & Guest Privacy',
    shortTitle: 'Events & Guests',
    icon: CalendarCheck,
    badgeVariant: 'rose',
    summary: 'Protection of attendees registering for public events, conferences, and retreats.',
    content: (
      <div className="space-y-3">
        <p>
          When members or first-time guests register for church conferences, camps, retreats, or community events:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-church-slate">
          <li>Registrant details (name, email, contact, ticket selections, dietary accommodations) are collected exclusively on behalf of the organizing church.</li>
          <li>Guest contact information is never sold or used for external commercial marketing.</li>
          <li>After the conclusion of an event, the hosting church manages data retention according to their internal event follow-up policies.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'child-safety',
    title: '8. Child Safety Standards & Zero-Tolerance CSAE Policy',
    shortTitle: 'Child Safety & CSAE',
    icon: Baby,
    badgeVariant: 'rose',
    isAlert: true,
    summary: 'Strict protections for children, minors, Sunday school check-ins, and anti-CSAE rules.',
    content: (
      <div className="space-y-4">
        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4.5">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-base mb-2">
            <AlertTriangle className="text-rose-600 shrink-0" size={20} />
            Strict Zero-Tolerance Child Sexual Abuse Exploitation (CSAE) Policy
          </div>
          <p className="text-rose-950 text-sm leading-relaxed">
            <strong>Coram Deo</strong> is strictly committed to child safety and enforces a zero-tolerance policy against Child Sexual Abuse and Exploitation (CSAE). We explicitly prohibit any content, behavior, or activity that promotes, distributes, depicts, facilitates, or encourages CSAE.
          </p>
          <p className="text-rose-950 text-sm mt-2 leading-relaxed">
            Any user or account found in violation of this policy will experience immediate and irreversible account termination, immediate preservation of diagnostic evidence, and mandatory reporting to law enforcement authorities (including the Philippine National Police Anti-Cybercrime Group / NBI and the National Center for Missing &amp; Exploited Children - NCMEC).
          </p>
        </div>

        <div className="space-y-2 text-sm text-church-slate">
          <h4 className="font-semibold text-church-navy">Minor & Children&rsquo;s Ministry Protections:</h4>
          <p>
            When churches utilize Coram Deo for Sunday School, Kids Ministry, and Youth groups:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Children&rsquo;s records (names, birthdates, medical/allergy alerts) may only be created and managed by authorized parents, legal guardians, or designated children&rsquo;s ministry workers.</li>
            <li>Child Check-In systems issue matched security pickup codes ensuring only authenticated parents or authorized guardians may check out a child.</li>
            <li>We do not knowingly allow minors under the legal age of digital consent to create self-managed accounts without verifiable parental/guardian authorization.</li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-church-navy flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <strong>Designated Child Safety Point of Contact:</strong>
            <p className="text-church-slate mt-0.5">
              If you have any concerns regarding child safety or suspect a violation of this policy, contact our designated officer immediately:
            </p>
          </div>
          <a
            href="mailto:mjuni777@gmail.com?subject=URGENT%20Child%20Safety%20Concern"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0"
          >
            <Mail size={14} />
            mjuni777@gmail.com
          </a>
        </div>
      </div>
    ),
  },
  {
    id: 'data-security',
    title: '9. Technical Data Security & Infrastructure Safeguards',
    shortTitle: 'Data Security',
    icon: KeyRound,
    badgeVariant: 'violet',
    summary: 'Cloud infrastructure security, in-transit and at-rest safeguards, and access controls.',
    content: (
      <div className="space-y-4">
        <p>
          We employ robust cloud security and defense-in-depth measures to protect your church&rsquo;s records from unauthorized access, accidental alteration, disclosure, or destruction:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70">
            <span className="font-bold text-church-navy block text-xs uppercase mb-1">Encryption in Transit</span>
            <p className="text-xs text-church-slate">All communications between client devices and our cloud backend are transmitted using Transport Layer Security (TLS 1.3 / HTTPS) with HTTP Strict Transport Security (HSTS).</p>
          </div>
          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70">
            <span className="font-bold text-church-navy block text-xs uppercase mb-1">Encryption at Rest</span>
            <p className="text-xs text-church-slate">Persistent database records, media assets, backups, and cloud file storage are encrypted at rest using Google Cloud AES-256 infrastructure encryption.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70">
            <span className="font-bold text-church-navy block text-xs uppercase mb-1">Automated Backups</span>
            <p className="text-xs text-church-slate">Point-in-time disaster recovery snapshots are captured and stored in geographically redundant, secure cloud infrastructure.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70">
            <span className="font-bold text-church-navy block text-xs uppercase mb-1">Incident Response</span>
            <p className="text-xs text-church-slate">We maintain protocols to detect, isolate, and mitigate security incidents, including prompt notification to affected church controllers within statutory deadlines.</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-church-slate leading-relaxed">
          <strong>Note on Encryption Architecture:</strong> Coram Deo secures all data in transit via standard HTTPS/TLS and at rest via Google Cloud database encryption. The system relies on centralized cloud authorization and role-based permissions; it does not currently provide zero-knowledge or end-to-end encryption (E2EE).
        </div>
      </div>
    ),
  },
  {
    id: 'data-retention',
    title: '10. Data Retention & Account Deletion',
    shortTitle: 'Retention & Deletion',
    icon: Server,
    badgeVariant: 'slate',
    summary: 'How long records are maintained, archive policies, and deletion procedures.',
    content: (
      <div className="space-y-3 text-sm text-church-slate">
        <p>
          We retain information only as long as necessary to fulfill the ministry purposes outlined in this policy or as legally mandated:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Active Church Subscription:</strong> Church data is maintained and accessible while the church account is active.</li>
          <li><strong>Member Archival:</strong> When a church archives a member record, it is hidden from everyday roster views but preserved in church archives until permanently deleted by an authorized church administrator.</li>
          <li><strong>Financial Records:</strong> In accordance with statutory financial compliance, donation and accounting logs are retained for up to 7 years.</li>
          <li><strong>Church Account Termination:</strong> Upon termination of a church subscription, the church may request a complete export of its congregation records. Following a 30-day grace period, all live database collections are permanently purged. Backup archives expire systematically within 30 days.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'user-rights',
    title: '11. Your Rights Under Global Data Privacy Laws',
    shortTitle: 'Your Privacy Rights',
    icon: Globe,
    badgeVariant: 'emerald',
    summary: 'Rights under GDPR, Philippine DPA of 2012 (RA 10173), and CCPA.',
    content: (
      <div className="space-y-4">
        <p>
          Depending on your jurisdiction, you possess fundamental rights regarding your personal information:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="border border-gray-100 rounded-xl p-3 bg-white">
            <h5 className="font-semibold text-xs text-church-navy mb-1">Right to Access &amp; Portability</h5>
            <p className="text-xs text-church-slate">Request a copy of the personal data held about you in a structured, commonly used digital format (e.g., CSV or PDF).</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-3 bg-white">
            <h5 className="font-semibold text-xs text-church-navy mb-1">Right to Rectification</h5>
            <p className="text-xs text-church-slate">Request immediate correction of inaccurate, outdated, or incomplete personal and contact details.</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-3 bg-white">
            <h5 className="font-semibold text-xs text-church-navy mb-1">Right to Erasure (&ldquo;To Be Forgotten&rdquo;)</h5>
            <p className="text-xs text-church-slate">Request deletion of personal records where there is no overriding legal or statutory requirement for retention.</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-3 bg-white">
            <h5 className="font-semibold text-xs text-church-navy mb-1">Right to Object &amp; Restrict</h5>
            <p className="text-xs text-church-slate">Object to specific processing, withdraw consent for communications, or limit directory visibility.</p>
          </div>
        </div>
        <p className="text-xs text-church-slate">
          <strong>How to Exercise Your Rights:</strong> As Coram Deo is a processor, congregation members should first direct privacy requests to their local church administrator. If you require assistance contacting your church controller or have an escalated inquiry, contact our Data Protection Officer at <a href="mailto:mjuni777@gmail.com" className="text-church-rose font-medium hover:underline">mjuni777@gmail.com</a>.
        </p>
      </div>
    ),
  },
  {
    id: 'third-party',
    title: '12. Third-Party Service Providers (Sub-Processors)',
    shortTitle: 'Sub-Processors',
    icon: Users,
    badgeVariant: 'slate',
    summary: 'Cloud providers and infrastructure vendors assisting in service delivery.',
    content: (
      <div className="space-y-3 text-sm text-church-slate">
        <p>
          To maintain high reliability, scalability, and security, we partner with industry-leading cloud infrastructure providers who adhere to strict data protection standards:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-gray-100 rounded-xl overflow-hidden">
            <thead className="bg-gray-50 text-church-navy font-semibold">
              <tr>
                <th className="p-2.5">Provider</th>
                <th className="p-2.5">Role / Purpose</th>
                <th className="p-2.5">Security Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-2.5 font-medium text-church-navy">Google Cloud / Firebase</td>
                <td className="p-2.5">Primary database (Firestore), authentication, cloud hosting, and encrypted storage</td>
                <td className="p-2.5">ISO 27001, SOC 1/2/3, HIPAA, GDPR</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-church-navy">Telecom & SMS Delivery Providers</td>
                <td className="p-2.5">Delivering multi-factor authentication SMS OTPs and urgent church notification alerts</td>
                <td className="p-2.5">Carrier-grade encryption & confidentiality</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'cookies',
    title: '13. Cookies & Local Storage',
    shortTitle: 'Cookies & Storage',
    icon: Cookie,
    badgeVariant: 'amber',
    summary: 'Technical tokens, active church context, and preference caching.',
    content: (
      <div className="space-y-3 text-sm text-church-slate">
        <p>
          We use essential browser cookies and local storage tokens strictly to enable core functionality:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Authentication Tokens:</strong> Secure session identifiers verifying logged-in administrator status and protecting against cross-site request forgery (CSRF).</li>
          <li><strong>Active Church Context:</strong> Remembering your selected church profile, active dashboard environment, and view preferences.</li>
          <li><strong>No Third-Party Ad Trackers:</strong> We do not deploy third-party advertising cookies, retargeting pixels, or behavioral tracking algorithms.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'changes',
    title: '14. Changes to This Privacy Policy',
    shortTitle: 'Policy Changes',
    icon: FileText,
    badgeVariant: 'slate',
    summary: 'Revision procedures, advance notifications, and version history.',
    content: (
      <div className="space-y-3 text-sm text-church-slate">
        <p>
          We may periodically update this Privacy Policy to reflect enhancements in our application, changes in church ministry features, or updates in legal requirements.
        </p>
        <p>
          When material changes are made, we will notify administrators through the admin portal dashboard and update the &ldquo;Last Updated&rdquo; date at the top of this document. We encourage administrators to review this page periodically.
        </p>
      </div>
    ),
  },
  {
    id: 'contact',
    title: '15. Contact Us & Privacy Support',
    shortTitle: 'Contact Us',
    icon: Mail,
    badgeVariant: 'violet',
    summary: 'Direct contacts for privacy inquiries, child protection, and security notices.',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-church-slate">
          If you have any questions, concerns, or requests regarding this Privacy Policy or Coram Deo&rsquo;s data protection practices, please contact our team:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/80 space-y-1.5">
            <span className="font-bold text-church-navy text-sm block">Data Protection & Privacy</span>
            <p className="text-church-slate">General privacy inquiries, DPA requests, and user rights:</p>
            <a href="mailto:mjuni777@gmail.com?subject=Coram%20Deo%20Privacy%20Inquiry" className="text-church-rose font-semibold hover:underline inline-flex items-center gap-1 mt-1">
              mjuni777@gmail.com <ExternalLink size={12} />
            </a>
          </div>
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 space-y-1.5">
            <span className="font-bold text-rose-900 text-sm block">Child Safety Point of Contact</span>
            <p className="text-rose-950/80">Urgent child safety reports or CSAE concerns:</p>
            <a href="mailto:mjuni777@gmail.com?subject=URGENT%20Child%20Safety" className="text-rose-600 font-semibold hover:underline inline-flex items-center gap-1 mt-1">
              mjuni777@gmail.com <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PrivacyPolicy() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('introduction');

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const query = searchQuery.toLowerCase();
    return SECTIONS.filter(
      (sec) =>
        sec.title.toLowerCase().includes(query) ||
        sec.shortTitle.toLowerCase().includes(query) ||
        sec.summary.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-church-canvas text-church-charcoal flex flex-col antialiased selection:bg-church-rose/20 selection:text-church-rose">
      {/* ----------------------------------------------------------------- */}
      {/* Header Bar */}
      {/* ----------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & App Name */}
          <Link to="/login" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-coram flex items-center justify-center p-2 shadow-church-glow group-hover:scale-105 transition-transform duration-200">
              <img src={logo} alt="Coram Deo Logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-church-navy group-hover:text-church-rose transition-colors">
                  Coram Deo
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-100">
                  Admin Portal
                </span>
              </div>
              <p className="text-[11px] text-church-muted font-medium hidden sm:block">
                Church Management System
              </p>
            </div>
          </Link>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-church-slate hover:text-church-navy bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200/70 transition-colors"
              title="Print or Save as PDF"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-coram hover:opacity-95 shadow-church-glow rounded-full transition-all active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* Hero Banner */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100/80 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        {/* Ambient background glow matching Coram Deo brand */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-10 left-10 w-80 h-80 bg-rose-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2">
            <StatusPill variant="rose" dot>
              Official Legal &amp; Security Policy
            </StatusPill>
            <span className="text-xs text-church-muted font-medium hidden sm:inline">
              • Version 2026.1
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-church-navy">
            Privacy Policy &amp; Data Protection
          </h1>

          <p className="text-base sm:text-lg text-church-slate max-w-3xl mx-auto leading-relaxed">
            How Coram Deo collects, handles, and safeguards records for churches, pastors, donors, and congregation members &mdash; prioritizing multi-tenant data isolation, cloud security safeguards, and faithful stewardship.
          </p>

          <div className="pt-2 text-xs text-church-muted flex items-center justify-center gap-4 flex-wrap">
            <span>
              <strong>Effective Date:</strong> January 1, 2026
            </span>
            <span>•</span>
            <span>
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span>•</span>
            <span className="text-church-emerald font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> Active &amp; Verified
            </span>
          </div>

          {/* Quick Pillars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-xl border border-gray-100 bg-white/80 shadow-church-soft">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-church-rose flex items-center justify-center mb-2">
                <Lock size={15} />
              </div>
              <p className="font-bold text-xs text-church-navy">TLS 1.3 &amp; AES-256</p>
              <p className="text-[11px] text-church-muted mt-0.5">Encrypted in transit &amp; cloud storage at rest</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-100 bg-white/80 shadow-church-soft">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                <Shield size={15} />
              </div>
              <p className="font-bold text-xs text-church-navy">Multi-Tenant Scoping</p>
              <p className="text-[11px] text-church-muted mt-0.5">Strict logical isolation between churches</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-100 bg-white/80 shadow-church-soft">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-church-emerald flex items-center justify-center mb-2">
                <Scale size={15} />
              </div>
              <p className="font-bold text-xs text-church-navy">Church Ownership</p>
              <p className="text-[11px] text-church-muted mt-0.5">Church retains full Data Controller ownership</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-100 bg-white/80 shadow-church-soft">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Baby size={15} />
              </div>
              <p className="font-bold text-xs text-church-navy">Zero-Tolerance CSAE</p>
              <p className="text-[11px] text-church-muted mt-0.5">Strict child protection &amp; legal reporting</p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Main Content Layout */}
      {/* ----------------------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sticky Table of Contents (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4 print:hidden">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-church-soft p-4 space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-church-muted" />
                <input
                  type="text"
                  placeholder="Filter clauses (e.g. child, giving, delete)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200/70 focus:outline-none focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 transition-all placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-church-muted hover:text-church-navy"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Table of Contents list */}
              <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                <p className="text-[11px] font-bold text-church-muted uppercase tracking-wider px-2 py-1">
                  Table of Contents ({filteredSections.length})
                </p>
                {filteredSections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-rose-50/80 text-church-rose font-bold border border-rose-100 shadow-xs'
                          : 'text-church-slate hover:bg-gray-50 hover:text-church-navy'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          size={14}
                          className={isActive ? 'text-church-rose shrink-0' : 'text-church-muted group-hover:text-church-navy shrink-0'}
                        />
                        <span className="truncate">{sec.shortTitle}</span>
                      </div>
                      <ChevronRight
                        size={12}
                        className={`shrink-0 transition-transform ${
                          isActive ? 'text-church-rose translate-x-0.5' : 'text-gray-300 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Quick Contact Box */}
              <div className="pt-3 border-t border-gray-100 text-xs text-church-slate space-y-2">
                <div className="flex items-center gap-2 font-semibold text-church-navy">
                  <Mail size={13} className="text-church-rose" />
                  <span>Privacy Inquiries</span>
                </div>
                <p className="text-[11px] text-church-muted leading-relaxed">
                  Have specific compliance inquiries or need a Data Processing Agreement (DPA)?
                </p>
                <a
                  href="mailto:mjuni777@gmail.com?subject=Coram%20Deo%20Privacy%20Question"
                  className="block text-center py-2 px-3 bg-gray-50 hover:bg-gray-100 font-semibold text-church-navy rounded-lg border border-gray-200/80 text-[11px] transition-colors"
                >
                  Contact Data Officer
                </a>
              </div>
            </div>
          </aside>

          {/* Right Column: Policy Document Sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* Mobile Quick Navigation Pill Scroller */}
            <div className="lg:hidden bg-white p-3 rounded-xl border border-gray-100 shadow-xs space-y-2 print:hidden">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-church-muted" />
                <input
                  type="text"
                  placeholder="Filter sections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {filteredSections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeSection === sec.id
                        ? 'bg-church-rose text-white font-bold'
                        : 'bg-gray-100 text-church-slate hover:bg-gray-200'
                    }`}
                  >
                    {sec.shortTitle}
                  </button>
                ))}
              </div>
            </div>

            {/* If no search results */}
            {filteredSections.length === 0 && (
              <SoftCard className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-church-muted mx-auto flex items-center justify-center">
                  <Search size={20} />
                </div>
                <h3 className="font-bold text-base text-church-navy">No matching policy clauses found</h3>
                <p className="text-xs text-church-slate max-w-sm mx-auto">
                  We could not find any policy sections matching &ldquo;{searchQuery}&rdquo;. Try another keyword like &ldquo;giving&rdquo;, &ldquo;child&rdquo;, or &ldquo;retention&rdquo;.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 text-xs font-semibold text-church-rose bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  Clear search filter
                </button>
              </SoftCard>
            )}

            {/* Rendered Policy Sections */}
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <article
                  key={sec.id}
                  id={sec.id}
                  className={`scroll-mt-24 rounded-2xl bg-white border ${
                    sec.isAlert
                      ? 'border-rose-200/80 shadow-church-soft ring-1 ring-rose-100'
                      : 'border-gray-100/90 shadow-church-soft'
                  } p-6 sm:p-8 transition-all duration-200`}
                >
                  {/* Section Header */}
                  <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          sec.isAlert
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-church-navy tracking-tight">
                          {sec.title}
                        </h2>
                        <p className="text-xs text-church-muted mt-0.5">
                          {sec.summary}
                        </p>
                      </div>
                    </div>
                    <StatusPill variant={sec.badgeVariant} className="hidden sm:inline-flex">
                      Section
                    </StatusPill>
                  </div>

                  {/* Section Content */}
                  <div className="text-church-slate text-sm leading-relaxed">
                    {sec.content}
                  </div>
                </article>
              );
            })}

            {/* Bottom Disclaimer & Download Card */}
            <div className="p-6 rounded-2xl bg-gradient-coram-soft border border-purple-100/70 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white text-church-rose mx-auto flex items-center justify-center shadow-xs">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-base text-church-navy">
                Questions or Custom Enterprise DPA?
              </h3>
              <p className="text-xs text-church-slate max-w-lg mx-auto leading-relaxed">
                If your church organization requires a countersigned Data Processing Agreement (DPA) or specific compliance declarations for denominational oversight, our team is ready to assist.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="mailto:mjuni777@gmail.com?subject=Coram%20Deo%20Data%20Processing%20Agreement%20Request"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-coram shadow-church-glow hover:opacity-95 transition-opacity"
                >
                  <Mail size={14} /> Request DPA Documents
                </a>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-church-slate bg-white border border-gray-200 hover:text-church-navy transition-colors"
                >
                  <Printer size={14} /> Print Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ----------------------------------------------------------------- */}
      {/* Footer */}
      {/* ----------------------------------------------------------------- */}
      <footer className="mt-auto bg-white border-t border-gray-100 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-church-muted space-y-3 print:hidden">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 rounded-md bg-gradient-coram flex items-center justify-center p-1">
            <img src={logo} alt="Coram Deo Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <span className="font-bold text-church-navy text-sm">Coram Deo Admin</span>
        </div>
        <p>
          &copy; {new Date().getFullYear()} Coram Deo Church Management. Built with faithful stewardship and privacy excellence.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs font-medium text-church-slate">
          <Link to="/login" className="hover:text-church-rose transition-colors">
            Admin Login
          </Link>
          <span>•</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-church-rose transition-colors"
          >
            Back to Top
          </button>
          <span>•</span>
          <a
            href="mailto:mjuni777@gmail.com"
            className="hover:text-church-rose transition-colors"
          >
            Contact Support
          </a>
        </div>
      </footer>
    </div>
  );
}
