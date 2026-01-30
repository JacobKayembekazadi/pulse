// ============================================================================
// NEXUS APP SHELL - Main Layout with Pulse Visual Design
// ============================================================================

import React from 'react';
import { useAppStore, useInboxStore, useNotificationsStore } from '../store';
import { Icons } from './shared/Icons';

// Navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  { id: 'pipeline', label: 'Pipeline', icon: Icons.Layers },
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
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 relative">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-56'
        } glass-panel border-r border-white/10 flex flex-col transition-all duration-300 fixed h-full z-30`}
      >
        {/* Logo */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Icons.Zap className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                NEXUS
              </span>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-white border border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {showBadge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all group border border-transparent"
          >
            <Icons.Settings className="w-5 h-5 flex-shrink-0 group-hover:rotate-45 transition-transform" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-56'} transition-all duration-300`}>
        {/* Top Header - Pulse Style Navbar */}
        <header className="h-16 border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 capitalize">
              {activeTab}
            </h1>
            <div className="h-6 w-[1px] bg-white/20 mx-2"></div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 transition-all hover:bg-white/10">
              <div className={`w-2 h-2 rounded-full ${
                hotMoments.length > 0
                  ? 'bg-green-500 shadow-[0_0_10px_#10b981]'
                  : 'bg-gray-500'
              }`}></div>
              <span className="text-sm font-mono text-gray-300">
                {hotMoments.length > 0 ? 'LIVE' : 'IDLE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Indicators */}
            <div className="hidden md:flex items-center gap-4 text-xs text-gray-500 font-mono border-r border-white/10 pr-4">
              <span className="flex items-center gap-1">
                <Icons.Globe className="w-3 h-3" /> GLOBAL
              </span>
              <span className="flex items-center gap-1">
                <Icons.Database className="w-3 h-3" /> SYNCED
              </span>
            </div>

            {/* Hot Moments Indicator */}
            {hotMoments.length > 0 && (
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full text-orange-400 hover:bg-orange-500/30 transition-colors neon-border">
                <Icons.Fire className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">{hotMoments.length} Hot</span>
              </button>
            )}

            {/* Notifications */}
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors group">
              <Icons.Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_#f472b6]" />
              )}
            </button>

            {/* User Menu */}
            <button className="flex items-center gap-2 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                U
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
