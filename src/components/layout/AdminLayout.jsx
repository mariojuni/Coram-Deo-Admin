import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SubscriptionBanner from '../../features/subscription/components/SubscriptionBanner';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout, userProfile } = useAuth();

  return (
    <div className="h-screen overflow-hidden flex text-brand-dark font-sans bg-transparent p-2 lg:p-4 gap-4">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-transparent flex items-center justify-between px-2 lg:px-6 sticky top-0 z-10 mb-2">
          <div className="flex items-center gap-3">
            <button 
              className="p-2.5 text-brand-dark glass-light-pill rounded-2xl lg:hidden hover:bg-white transition-all shadow-xs"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notification Bell Button (matches mobile circular top button) */}
            <button 
              className="w-10 h-10 rounded-full glass-light-pill flex items-center justify-center text-[#2C4A60] hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-xs"
              aria-label="Notifications"
            >
              <Bell size={18} className="text-[#2C4A60]" />
            </button>

            {/* Logout pill button */}
            <button 
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 glass-light-pill border border-red-200/60 px-3.5 py-2 rounded-full transition-all duration-150"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Subscription / Trial / Grace Alert Banner */}
        <SubscriptionBanner />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-2 md:px-6 pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
