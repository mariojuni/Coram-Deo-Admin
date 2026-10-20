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
    <div className="h-screen overflow-hidden flex text-church-charcoal font-sans bg-church-canvas p-2 lg:p-4 gap-4">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-transparent flex items-center justify-between px-2 lg:px-6 sticky top-0 z-10 mb-2">
          <div className="flex items-center gap-3">
            <button 
              className="p-2.5 text-church-charcoal bg-white rounded-xl lg:hidden shadow-church-soft border border-gray-100 hover:bg-gray-50 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notification Bell Button (matches mobile circular top button) */}
            <button 
              className="w-10 h-10 rounded-full bg-white shadow-church-soft border border-gray-100 flex items-center justify-center text-church-charcoal hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
              aria-label="Notifications"
            >
              <Bell size={18} className="text-church-slate" />
            </button>

            {/* Logout pill button */}
            <button 
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-100 px-3.5 py-2 rounded-full transition-all duration-150"
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
