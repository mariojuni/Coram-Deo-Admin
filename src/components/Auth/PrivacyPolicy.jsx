import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.svg';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-church-bg flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-church-green rounded-xl flex items-center justify-center shadow-sm p-1">
            <img src={logo} alt="Coram Deo Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <span className="text-church-navy font-bold text-xl tracking-tight">ChurchAdmin</span>
        </div>
        <Link 
          to="/login"
          className="flex items-center text-sm font-medium text-church-slate hover:text-church-navy transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Login
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16">
        <div className="bg-white rounded-2xl shadow-church-soft p-8 md:p-12">
          <h1 className="text-3xl font-bold text-church-navy mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-church-slate">
            <p>
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            
            <section>
              <h2 className="text-xl font-semibold text-church-navy mb-3">1. Introduction</h2>
              <p>
                Welcome to Coram Deo. We respect your privacy and are committed to protecting your personal data. 
                This Privacy Policy will inform you as to how we look after your personal data when you visit our 
                application and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-church-navy mb-3">2. The Data We Collect About You</h2>
              <p>
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this application.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-church-navy mb-3">3. How We Use Your Personal Data</h2>
              <p>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                <li>Where we need to comply with a legal obligation.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-church-navy mb-3">4. Data Security</h2>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-church-navy mb-3">5. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our privacy practices, please contact your church administrator.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-sm text-church-slate/70">
        &copy; {new Date().getFullYear()} Coram Deo. All rights reserved.
      </footer>
    </div>
  );
}
