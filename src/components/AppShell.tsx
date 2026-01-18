// ============================================================================
// NEXUS APP SHELL - Main Layout with Navigation
// ============================================================================

import React from 'react';
import { useAppStore, useInboxStore, useNotificationsStore } from '../store';
import { Icons } from './shared/Icons';

// Navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  { id: 'pulse', label: 'Pulse', icon: Icons.Pulse },
  { id: 'accounts', label: 'Accounts', icon: Icons.Target },
  { id: 'inbox', label: 'Inbox', icon: Icons.Inbox },
  { id: 'campaigns', label: 'Campaigns', icon: Icons.Campaign },
  { id: 'compete', label: 'Compete', icon: Icons.Compete },
  { id: 'library', label: 'Library', icon: Icons.Library },
  { id: 'analytics', label: 'Analytics', icon: Icons.Analytics },
] as const;

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { activeTab, setActiveTab, sidebarCollapsed, toggleSidebar, setShowSettings } = useAppStore();
  const { unreadCount } = useInboxStore();
  const { hotMoments, notifications } = useNotificationsStore();

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-56'
        } border-r border-white/10 bg-[#0a0a0b] flex flex-col transition-all duration-300 fixed h-full z-30`}
      >
        {/* Logo */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Icons.Zap className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold tracking-tight">NEXUS</span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Icons.Menu className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showBadge = item.id === 'inbox' && unreadCount > 0;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {showBadge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings Button */}
        <div className="p-2 border-t border-white/10">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Icons.Settings className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-56'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="h-16 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Hot Moments Indicator */}
            {hotMoments.length > 0 && (
              <button className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 hover:bg-orange-500/20 transition-colors">
                <Icons.Fire className="w-4 h-4" />
                <span className="text-sm font-medium">{hotMoments.length} Hot</span>
              </button>
            )}

            {/* Notifications */}
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Icons.Bell className="w-5 h-5 text-gray-400" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* User Menu */}
            <button className="flex items-center gap-2 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-medium">
                U
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
