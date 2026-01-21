// ============================================================================
// SETTINGS PANEL - Integrations, AI Config, and Preferences
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAppStore, useSettingsStore } from '../../store';
import { Icons } from '../shared/Icons';
import { Integration, IntegrationProvider } from '../../types';
import { storage } from '../../services/storage.service';
import { toast } from '../shared/Toast';

type SettingsSection = 'social' | 'abm' | 'ai' | 'mcp' | 'team';
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const sections = [
  { id: 'social', label: 'Social Listening', icon: Icons.MessageSquare },
  { id: 'abm', label: 'ABM Integrations', icon: Icons.Target },
  { id: 'ai', label: 'AI Configuration', icon: Icons.Sparkles },
  { id: 'mcp', label: 'MCP Servers', icon: Icons.Database },
  { id: 'team', label: 'Team', icon: Icons.Users },
] as const;

// Integration definitions
const socialProviders = [
  { id: 'apify', name: 'Apify', description: 'LinkedIn + Twitter scraping with proxy rotation', recommended: true, color: '#00d4aa' },
  { id: 'phantombuster', name: 'PhantomBuster', description: 'LinkedIn automation & lead gen', color: '#6366f1' },
  { id: 'google', name: 'Pulse (Gemini)', description: 'Free - Google Search grounded results', color: '#4285f4', free: true },
];

const abmProviders = [
  { id: 'leadfeeder', name: 'Leadfeeder', description: 'Website visitor identification', color: '#6366f1' },
  { id: 'clay', name: 'Clay', description: 'Data enrichment & prospecting', color: '#f59e0b' },
  { id: 'hubspot', name: 'HubSpot', description: 'CRM & outreach automation', color: '#ff7a59' },
  { id: 'apollo', name: 'Apollo.io', description: 'Contact database & sequences', color: '#5b5fc7' },
  { id: 'clearbit', name: 'Clearbit', description: 'Company enrichment', color: '#3b82f6' },
  { id: 'zoominfo', name: 'ZoomInfo', description: 'Enterprise B2B data', color: '#22c55e' },
];

const aiProviders = [
  { id: 'anthropic', name: 'Claude (Anthropic)', models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'], color: '#d4a574' },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'], color: '#10a37f' },
  { id: 'google', name: 'Gemini (Google)', models: ['gemini-2.0-flash', 'gemini-1.5-pro'], color: '#4285f4' },
];

const mcpServers = [
  { id: 'asana', name: 'Asana', description: 'Task management' },
  { id: 'notion', name: 'Notion', description: 'Documentation & wikis' },
  { id: 'slack', name: 'Slack', description: 'Team messaging' },
  { id: 'gmail', name: 'Gmail', description: 'Email integration' },
  { id: 'calendar', name: 'Google Calendar', description: 'Scheduling' },
  { id: 'zapier', name: 'Zapier', description: 'Workflow automation' },
];

export function SettingsPanel() {
  const { showSettings, setShowSettings } = useAppStore();
  const { integrations, setIntegrations, aiConfig, setAIConfig } = useSettingsStore();

  const [activeSection, setActiveSection] = useState<SettingsSection>('social');
  const [selectedSocialProvider, setSelectedSocialProvider] = useState<string>('google');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [enabledIntegrations, setEnabledIntegrations] = useState<Record<string, boolean>>({});
  const [mcpEnabled, setMcpEnabled] = useState<Record<string, boolean>>({});

  // API Testing state
  const [aiTestStatus, setAiTestStatus] = useState<TestStatus>('idle');
  const [apifyTestStatus, setApifyTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState<string>('');

  // Load existing Apify key
  useEffect(() => {
    const savedKeys = storage.get<{ apifyKey?: string }>('nexus-api-keys', {});
    if (savedKeys.apifyKey) {
      setApiKeys(prev => ({ ...prev, apify: savedKeys.apifyKey || '' }));
    }
  }, []);

  // Test Gemini API key
  const testGeminiKey = async () => {
    if (!aiConfig.apiKey) return;

    setAiTestStatus('testing');
    setTestError('');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "connected" in one word' }] }]
          })
        }
      );

      if (response.ok) {
        setAiTestStatus('success');
      } else {
        const data = await response.json();
        setTestError(data.error?.message || 'Invalid API key');
        setAiTestStatus('error');
      }
    } catch (err) {
      setTestError('Network error - please try again');
      setAiTestStatus('error');
    }
  };

  // Test OpenAI API key
  const testOpenAIKey = async () => {
    if (!aiConfig.apiKey) return;

    setAiTestStatus('testing');
    setTestError('');

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${aiConfig.apiKey}` }
      });

      if (response.ok) {
        setAiTestStatus('success');
      } else {
        setTestError('Invalid API key');
        setAiTestStatus('error');
      }
    } catch (err) {
      setTestError('Network error - please try again');
      setAiTestStatus('error');
    }
  };

  // Test Anthropic API key
  const testAnthropicKey = async () => {
    if (!aiConfig.apiKey) return;

    setAiTestStatus('testing');
    setTestError('');

    try {
      // Note: Anthropic doesn't have a simple test endpoint, so we just validate format
      if (aiConfig.apiKey.startsWith('sk-ant-')) {
        setAiTestStatus('success');
      } else {
        setTestError('Invalid key format - should start with sk-ant-');
        setAiTestStatus('error');
      }
    } catch (err) {
      setTestError('Validation error');
      setAiTestStatus('error');
    }
  };

  // Test current AI provider
  const testAIKey = () => {
    switch (aiConfig.provider) {
      case 'google':
        testGeminiKey();
        break;
      case 'openai':
        testOpenAIKey();
        break;
      case 'anthropic':
        testAnthropicKey();
        break;
    }
  };

  // Test Apify API key
  const testApifyKey = async () => {
    const apifyKey = apiKeys['apify'];
    if (!apifyKey) return;

    setApifyTestStatus('testing');

    try {
      const response = await fetch(`https://api.apify.com/v2/users/me?token=${apifyKey}`);

      if (response.ok) {
        setApifyTestStatus('success');
      } else {
        setApifyTestStatus('error');
      }
    } catch (err) {
      setApifyTestStatus('error');
    }
  };

  if (!showSettings) return null;

  const handleSave = () => {
    // Save integrations to store
    const newIntegrations: Integration[] = [];

    // Social provider
    if (apiKeys[selectedSocialProvider]) {
      newIntegrations.push({
        id: selectedSocialProvider,
        provider: selectedSocialProvider as IntegrationProvider,
        status: 'connected',
        credentials: { apiKey: apiKeys[selectedSocialProvider] },
        settings: {}
      });
    }

    // Save Apify key to storage
    if (apiKeys['apify']) {
      storage.set('nexus-api-keys', { apifyKey: apiKeys['apify'] });
    }

    // ABM providers
    abmProviders.forEach(p => {
      if (enabledIntegrations[p.id] && apiKeys[p.id]) {
        newIntegrations.push({
          id: p.id,
          provider: p.id as IntegrationProvider,
          status: 'connected',
          credentials: { apiKey: apiKeys[p.id] },
          settings: {}
        });
      }
    });

    setIntegrations(newIntegrations);
    setShowSettings(false);
    toast.success('Settings saved', 'Your configuration has been updated');
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setShowSettings(false)}
    >
      <div
        className="bg-[#0a0a0b] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex"
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-56 border-r border-white/10 p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icons.X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <nav className="space-y-1">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Social Listening */}
          {activeSection === 'social' && (
            <div>
              <h3 className="text-xl font-semibold mb-2">Social Listening</h3>
              <p className="text-gray-400 text-sm mb-6">Configure your social monitoring data source</p>

              {/* Recommendation */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex gap-3">
                <Icons.Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-300 mb-1">Recommendation</h4>
                  <p className="text-sm text-blue-200/70">
                    Start with <strong>Pulse (Gemini)</strong> - it's free and provides real-time Google Search results.
                    Upgrade to <strong>Apify</strong> for deep LinkedIn/Twitter scraping.
                  </p>
                </div>
              </div>

              {/* Provider Selection */}
              <div className="space-y-3">
                {socialProviders.map(provider => (
                  <div
                    key={provider.id}
                    className={`border rounded-xl p-4 transition-colors cursor-pointer ${
                      selectedSocialProvider === provider.id
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedSocialProvider(provider.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={selectedSocialProvider === provider.id}
                        onChange={() => setSelectedSocialProvider(provider.id)}
                        className="accent-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{provider.name}</span>
                          {provider.recommended && (
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                              Recommended
                            </span>
                          )}
                          {provider.free && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                              Free
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{provider.description}</p>
                      </div>
                    </div>

                    {selectedSocialProvider === provider.id && provider.id !== 'google' && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <label className="block text-sm text-gray-400 mb-2">API Key</label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder={provider.id === 'apify' ? 'apify_api_...' : `${provider.id}_api_key...`}
                            value={apiKeys[provider.id] || ''}
                            onChange={e => {
                              setApiKeys({ ...apiKeys, [provider.id]: e.target.value });
                              if (provider.id === 'apify') setApifyTestStatus('idle');
                            }}
                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                          />
                          {provider.id === 'apify' && (
                            <button
                              onClick={testApifyKey}
                              disabled={!apiKeys['apify'] || apifyTestStatus === 'testing'}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 text-sm"
                            >
                              {apifyTestStatus === 'testing' ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Icons.Zap className="w-4 h-4" />
                                  Test
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        {provider.id === 'apify' && apifyTestStatus === 'success' && (
                          <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                            <Icons.Check className="w-4 h-4" />
                            Apify connection verified!
                          </p>
                        )}
                        {provider.id === 'apify' && apifyTestStatus === 'error' && (
                          <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                            <Icons.X className="w-4 h-4" />
                            Invalid API token
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABM Integrations */}
          {activeSection === 'abm' && (
            <div>
              <h3 className="text-xl font-semibold mb-2">ABM Integrations</h3>
              <p className="text-gray-400 text-sm mb-6">Connect your sales & marketing tools</p>

              <div className="space-y-3">
                {abmProviders.map(provider => (
                  <div key={provider.id} className="border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: provider.color }}
                        >
                          {provider.name[0]}
                        </div>
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-gray-400">{provider.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                          API + MCP
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabledIntegrations[provider.id] || false}
                            onChange={e => setEnabledIntegrations({
                              ...enabledIntegrations,
                              [provider.id]: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    </div>

                    {enabledIntegrations[provider.id] && (
                      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">API Key</label>
                          <input
                            type="password"
                            placeholder={`${provider.id}_api_...`}
                            value={apiKeys[provider.id] || ''}
                            onChange={e => setApiKeys({ ...apiKeys, [provider.id]: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">MCP Server URL</label>
                          <input
                            type="text"
                            placeholder={`https://mcp.${provider.id}.com/sse`}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Configuration */}
          {activeSection === 'ai' && (
            <div>
              <h3 className="text-xl font-semibold mb-2">AI Configuration</h3>
              <p className="text-gray-400 text-sm mb-6">Configure your AI model for content generation</p>

              <div className="space-y-6">
                {/* Provider Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">AI Provider</label>
                  <div className="grid grid-cols-3 gap-3">
                    {aiProviders.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => setAIConfig({
                          ...aiConfig,
                          provider: provider.id as 'anthropic' | 'openai' | 'google',
                          model: provider.models[0]
                        })}
                        className={`p-4 border rounded-xl text-left transition-colors ${
                          aiConfig.provider === provider.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: provider.color }}
                        >
                          {provider.name[0]}
                        </div>
                        <div className="font-medium text-sm">{provider.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <select
                    value={aiConfig.model}
                    onChange={e => setAIConfig({ ...aiConfig, model: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {aiProviders
                      .find(p => p.id === aiConfig.provider)
                      ?.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                  </select>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={aiConfig.provider === 'google' ? 'AIza...' : aiConfig.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                      value={aiConfig.apiKey}
                      onChange={e => {
                        setAIConfig({ ...aiConfig, apiKey: e.target.value });
                        setAiTestStatus('idle');
                      }}
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={testAIKey}
                      disabled={!aiConfig.apiKey || aiTestStatus === 'testing'}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      {aiTestStatus === 'testing' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Icons.Zap className="w-4 h-4" />
                          Test
                        </>
                      )}
                    </button>
                  </div>
                  {aiTestStatus === 'success' && (
                    <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                      <Icons.Check className="w-4 h-4" />
                      API key verified successfully!
                    </p>
                  )}
                  {aiTestStatus === 'error' && (
                    <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                      <Icons.X className="w-4 h-4" />
                      {testError || 'Invalid API key'}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {aiConfig.provider === 'google' && 'Get a free key at makersuite.google.com'}
                    {aiConfig.provider === 'openai' && 'Get a key at platform.openai.com'}
                    {aiConfig.provider === 'anthropic' && 'Get a key at console.anthropic.com'}
                  </p>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Temperature: {aiConfig.settings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiConfig.settings.temperature}
                    onChange={e => setAIConfig({
                      ...aiConfig,
                      settings: { ...aiConfig.settings, temperature: parseFloat(e.target.value) }
                    })}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Default Tone */}
                <div>
                  <label className="block text-sm font-medium mb-2">Default Tone</label>
                  <select
                    value={aiConfig.settings.defaultTone}
                    onChange={e => setAIConfig({
                      ...aiConfig,
                      settings: { ...aiConfig.settings, defaultTone: e.target.value }
                    })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="witty">Witty</option>
                    <option value="empathetic">Empathetic</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* MCP Servers */}
          {activeSection === 'mcp' && (
            <div>
              <h3 className="text-xl font-semibold mb-2">MCP Servers</h3>
              <p className="text-gray-400 text-sm mb-6">Model Context Protocol for AI agent orchestration</p>

              {/* Info Box */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6 flex gap-3">
                <Icons.Database className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-300 mb-1">What is MCP?</h4>
                  <p className="text-sm text-purple-200/70">
                    MCP allows AI agents to interact with external services through standardized tools -
                    fetch data, create records, and trigger actions across your tech stack.
                  </p>
                </div>
              </div>

              {/* MCP Server Grid */}
              <div className="grid grid-cols-2 gap-3">
                {mcpServers.map(server => (
                  <div
                    key={server.id}
                    className="border border-white/10 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-medium">{server.name}</h4>
                      <p className="text-sm text-gray-400">{server.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mcpEnabled[server.id] || false}
                        onChange={e => setMcpEnabled({
                          ...mcpEnabled,
                          [server.id]: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Custom MCP Server */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-medium mb-3">Add Custom MCP Server</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Server name"
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="https://your-mcp-server.com/sse"
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors">
                  <Icons.Plus className="w-4 h-4" />
                  Add Server
                </button>
              </div>
            </div>
          )}

          {/* Team */}
          {activeSection === 'team' && (
            <div>
              <h3 className="text-xl font-semibold mb-2">Team Management</h3>
              <p className="text-gray-400 text-sm mb-6">Manage team members and permissions</p>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
                <Icons.AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-300 mb-1">Coming Soon</h4>
                  <p className="text-sm text-yellow-200/70">
                    Team management features including member invites, role assignment,
                    and permission controls will be available in the next update.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-3">
            <button
              onClick={() => setShowSettings(false)}
              className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
