// ============================================================================
// NEXUS APP - Main Application Component
// ============================================================================

import React from 'react';
import { useAppStore } from './store';
import { AppShell } from './components/AppShell';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { Dashboard } from './components/dashboard/Dashboard';
import { PulseFeed } from './components/pulse/PulseFeed';
import { AccountsPage } from './components/accounts/AccountsPage';
import { InboxPage } from './components/inbox/InboxPage';
import { CampaignsPage } from './components/campaigns/CampaignsPage';
import { CompetePage } from './components/compete/CompetePage';
import { LibraryPage } from './components/library/LibraryPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';

// Placeholder components for pages not yet implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64 bg-[#111113] border border-white/10 rounded-xl">
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-400">Coming soon...</p>
    </div>
  </div>
);

// Lazy load pages or use placeholders
const AccountsPageComponent = () => {
  try {
    return <AccountsPage />;
  } catch {
    return <PlaceholderPage title="Accounts" />;
  }
};

const InboxPageComponent = () => {
  try {
    return <InboxPage />;
  } catch {
    return <PlaceholderPage title="Inbox" />;
  }
};

const CampaignsPageComponent = () => {
  try {
    return <CampaignsPage />;
  } catch {
    return <PlaceholderPage title="Campaigns" />;
  }
};

const CompetePageComponent = () => {
  try {
    return <CompetePage />;
  } catch {
    return <PlaceholderPage title="Competitive Intelligence" />;
  }
};

const LibraryPageComponent = () => {
  try {
    return <LibraryPage />;
  } catch {
    return <PlaceholderPage title="Content Library" />;
  }
};

const AnalyticsPageComponent = () => {
  try {
    return <AnalyticsPage />;
  } catch {
    return <PlaceholderPage title="Analytics" />;
  }
};

function NexusApp() {
  const { activeTab } = useAppStore();

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pulse':
        return <PulseFeed />;
      case 'accounts':
        return <AccountsPageComponent />;
      case 'inbox':
        return <InboxPageComponent />;
      case 'campaigns':
        return <CampaignsPageComponent />;
      case 'compete':
        return <CompetePageComponent />;
      case 'library':
        return <LibraryPageComponent />;
      case 'analytics':
        return <AnalyticsPageComponent />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <AppShell>
        {renderPage()}
      </AppShell>
      <SettingsPanel />
    </>
  );
}

export default NexusApp;
