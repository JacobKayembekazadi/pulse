// ============================================================================
// NEXUS APP - Main Application Component
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAppStore, useSettingsStore } from './store';
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
import { SetupWizard } from './components/onboarding/SetupWizard';
import { HumanInbox } from './components/inbox/HumanInbox';
import { storage } from './services/storage.service';
import { Icons } from './components/shared/Icons';
import { ToastContainer } from './components/shared/Toast';
import { AIChatbot } from './components/chat/AIChatbot';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

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

// Demo Data Banner - shows when APIs aren't configured
function DemoDataBanner({ onConfigure }: { onConfigure: () => void }) {
  const { aiConfig } = useSettingsStore();
  const apifyKey = storage.get<{ apifyKey?: string }>('nexus-api-keys', {}).apifyKey;

  // Don't show if both are configured
  if (aiConfig.apiKey && apifyKey) {
    return null;
  }

  return (
    <div className="mx-6 mt-4 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icons.AlertTriangle className="w-5 h-5 text-yellow-400" />
        <div>
          <span className="text-yellow-400 font-medium">Demo Mode Active</span>
          <span className="text-gray-400 text-sm ml-2">
            {!aiConfig.apiKey && !apifyKey
              ? "AI features and live data disabled. Using sample data."
              : !aiConfig.apiKey
                ? "AI reply generation disabled."
                : "Live data disabled. Using sample posts."}
          </span>
        </div>
      </div>
      <button
        onClick={onConfigure}
        className="px-3 py-1.5 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
      >
        Configure APIs
      </button>
    </div>
  );
}

function NexusApp() {
  const { activeTab } = useAppStore();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if first-time user on mount
  useEffect(() => {
    const setupComplete = storage.get<boolean>('nexus-setup-complete', false);
    if (!setupComplete) {
      setShowSetupWizard(true);
    }
    setIsInitialized(true);
  }, []);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
  };

  const handleOpenSetup = () => {
    // Reset setup flag temporarily to show wizard again
    setShowSetupWizard(true);
  };

  // Don't render until we've checked setup status
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-t-2 border-accent rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
      </div>
    );
  }

  // Show setup wizard for first-time users
  if (showSetupWizard) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  const renderPage = () => {
    const page = (() => {
      switch (activeTab) {
        case 'dashboard':
          return <Dashboard />;
        case 'pipeline':
          return <HumanInbox />;
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
    })();

    return <ErrorBoundary>{page}</ErrorBoundary>;
  };

  return (
    <>
      <AppShell>
        <DemoDataBanner onConfigure={handleOpenSetup} />
        {renderPage()}
      </AppShell>
      <SettingsPanel />
      <ToastContainer />
      <AIChatbot />
    </>
  );
}

export default NexusApp;
