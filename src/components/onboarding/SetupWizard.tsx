// ============================================================================
// SETUP WIZARD - First-time user onboarding
// Detects pre-configured env vars and skips API setup if not needed
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Icons } from '../shared/Icons';
import { useSettingsStore } from '../../store';
import { storage } from '../../services/storage.service';

interface SetupWizardProps {
  onComplete: () => void;
}

// Check if keys are configured via environment variables
const getEnvKeys = () => {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  const apifyKey = import.meta.env.VITE_APIFY_API_KEY || '';

  return {
    aiKey: geminiKey || openaiKey || anthropicKey,
    aiProvider: geminiKey ? 'google' : openaiKey ? 'openai' : anthropicKey ? 'anthropic' : null,
    apifyKey,
    hasAI: !!(geminiKey || openaiKey || anthropicKey),
    hasApify: !!apifyKey,
    allConfigured: !!(geminiKey || openaiKey || anthropicKey) && !!apifyKey
  };
};

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const { aiConfig, setAIConfig } = useSettingsStore();
  const [step, setStep] = useState(0);
  const [geminiKey, setGeminiKey] = useState('');
  const [apifyKey, setApifyKey] = useState('');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Check for pre-configured env vars
  const envKeys = getEnvKeys();

  // Determine which steps to show based on what's already configured
  const needsAISetup = !envKeys.hasAI && !aiConfig.apiKey;
  const needsApifySetup = !envKeys.hasApify;

  // Build dynamic steps
  const steps = [
    { title: 'Welcome', icon: Icons.Sparkles },
    ...(needsAISetup ? [{ title: 'AI Setup', icon: Icons.Zap }] : []),
    ...(needsApifySetup ? [{ title: 'Data Sources', icon: Icons.Search }] : []),
    { title: 'Ready!', icon: Icons.Check }
  ];

  // Load existing keys if any
  useEffect(() => {
    const settings = storage.get<{ apifyKey?: string }>('nexus-api-keys', {});
    if (settings.apifyKey) {
      setApifyKey(settings.apifyKey);
    }
    if (aiConfig.apiKey) {
      setGeminiKey(aiConfig.apiKey);
    }
  }, [aiConfig.apiKey]);

  const testGeminiKey = async () => {
    if (!geminiKey) return;

    setIsTestingGemini(true);
    setGeminiStatus('idle');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "connected" in one word' }] }]
          })
        }
      );

      if (response.ok) {
        setGeminiStatus('success');
      } else {
        setGeminiStatus('error');
      }
    } catch {
      setGeminiStatus('error');
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSaveAndContinue = () => {
    // Save user-provided Gemini key to settings store (if not using env var)
    if (geminiKey && !envKeys.hasAI) {
      setAIConfig({ ...aiConfig, apiKey: geminiKey });
    }

    // Save user-provided Apify key to storage (if not using env var)
    if (apifyKey && !envKeys.hasApify) {
      storage.set('nexus-api-keys', { apifyKey });
    }

    // Mark setup as complete
    storage.set('nexus-setup-complete', true);
    onComplete();
  };

  const handleSkip = () => {
    storage.set('nexus-setup-complete', true);
    onComplete();
  };

  // Get current step content based on dynamic steps
  const getCurrentStepType = () => {
    if (step === 0) return 'welcome';
    if (step === steps.length - 1) return 'ready';

    // Middle steps depend on what's needed
    const middleStepIndex = step - 1; // 0-indexed for middle steps
    if (needsAISetup && middleStepIndex === 0) return 'ai';
    if (needsApifySetup) {
      if (needsAISetup && middleStepIndex === 1) return 'apify';
      if (!needsAISetup && middleStepIndex === 0) return 'apify';
    }
    return 'ready';
  };

  const stepType = getCurrentStepType();

  // Computed status for summary
  const aiConfigured = envKeys.hasAI || !!geminiKey || !!aiConfig.apiKey;
  const apifyConfigured = envKeys.hasApify || !!apifyKey;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
      <div className="glass-panel rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-8 p-6 border-b border-white/10">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-2 ${
                i <= step ? 'text-white' : 'text-gray-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                i < step ? 'bg-green-500/20 text-green-400' :
                i === step ? 'bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' :
                'bg-white/5 text-gray-600'
              }`}>
                {i < step ? <Icons.Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className="text-xs font-medium">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          {stepType === 'welcome' && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                <Icons.Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Welcome to NEXUS</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Your AI-powered social intelligence platform for B2B sales.
                {envKeys.allConfigured
                  ? " Everything is pre-configured and ready to go!"
                  : " Let's get you set up in under 2 minutes."}
              </p>

              {/* Show pre-configured status */}
              {(envKeys.hasAI || envKeys.hasApify) && (
                <div className="glass-card p-4 rounded-xl mb-6 text-left max-w-md mx-auto border border-green-500/20">
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-green-400">
                    <Icons.Check className="w-4 h-4" />
                    Pre-configured by your admin:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {envKeys.hasAI && (
                      <li className="flex items-center gap-2">
                        <Icons.Check className="w-4 h-4 text-green-400" />
                        AI Provider ({envKeys.aiProvider === 'google' ? 'Gemini' : envKeys.aiProvider === 'openai' ? 'OpenAI' : 'Claude'})
                      </li>
                    )}
                    {envKeys.hasApify && (
                      <li className="flex items-center gap-2">
                        <Icons.Check className="w-4 h-4 text-green-400" />
                        Social Data (Apify)
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="glass-card p-4 rounded-xl mb-6 text-left max-w-md mx-auto">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Icons.Zap className="w-4 h-4 text-yellow-400" />
                  What you'll be able to do:
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-green-400" />
                    Search & monitor social conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-green-400" />
                    Generate AI-powered reply suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-green-400" />
                    Track accounts & measure engagement
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-green-400" />
                    Manage outreach campaigns
                  </li>
                </ul>
              </div>
            </div>
          )}

          {stepType === 'ai' && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-center">AI Configuration</h2>
              <p className="text-gray-400 mb-6 text-center">
                NEXUS uses AI to generate intelligent replies. Add your API key below.
              </p>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Gemini API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={e => {
                        setGeminiKey(e.target.value);
                        setGeminiStatus('idle');
                      }}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50"
                      placeholder="AIza..."
                    />
                    <button
                      onClick={testGeminiKey}
                      disabled={!geminiKey || isTestingGemini}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isTestingGemini ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Icons.Zap className="w-4 h-4" />
                          Test
                        </>
                      )}
                    </button>
                  </div>
                  {geminiStatus === 'success' && (
                    <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                      <Icons.Check className="w-4 h-4" />
                      Connected successfully!
                    </p>
                  )}
                  {geminiStatus === 'error' && (
                    <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                      <Icons.X className="w-4 h-4" />
                      Invalid API key. Please check and try again.
                    </p>
                  )}
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <p className="text-sm text-gray-400">
                    <strong className="text-white">Get a free API key:</strong><br />
                    Visit{' '}
                    <a
                      href="https://makersuite.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      makersuite.google.com
                    </a>
                  </p>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  You can skip this step, but AI features won't work.
                </p>
              </div>
            </div>
          )}

          {stepType === 'apify' && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-center">Data Sources</h2>
              <p className="text-gray-400 mb-6 text-center">
                Connect to Apify for real-time social data from LinkedIn, Twitter & Reddit.
              </p>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Apify API Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={apifyKey}
                    onChange={e => setApifyKey(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50"
                    placeholder="apify_api_..."
                  />
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <p className="text-sm text-gray-400">
                    <strong className="text-white">No Apify account?</strong><br />
                    Sign up at{' '}
                    <a
                      href="https://apify.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      apify.com
                    </a>
                    {' '}- free tier includes 5GB/month.
                  </p>
                </div>

                <div className="glass-card p-4 rounded-lg border-yellow-500/30">
                  <p className="text-sm text-yellow-400 flex items-start gap-2">
                    <Icons.AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Without Apify, you'll see sample data for demonstration.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {stepType === 'ready' && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Icons.Check className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">You're All Set!</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {aiConfigured && apifyConfigured
                  ? "Everything is configured. You're ready to start using NEXUS!"
                  : aiConfigured
                    ? "AI is ready. You can add data sources later in Settings."
                    : "You can explore with sample data. Configure APIs anytime in Settings."}
              </p>

              <div className="glass-card p-4 rounded-xl mb-6 text-left max-w-md mx-auto">
                <h3 className="font-medium mb-3">Configuration Summary:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-400">AI Provider</span>
                    <span className={aiConfigured ? 'text-green-400 flex items-center gap-1' : 'text-yellow-400'}>
                      {aiConfigured && <Icons.Check className="w-3 h-3" />}
                      {aiConfigured
                        ? (envKeys.hasAI ? 'Pre-configured' : 'Configured')
                        : 'Using templates'}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-400">Social Data</span>
                    <span className={apifyConfigured ? 'text-green-400 flex items-center gap-1' : 'text-yellow-400'}>
                      {apifyConfigured && <Icons.Check className="w-3 h-3" />}
                      {apifyConfigured
                        ? (envKeys.hasApify ? 'Pre-configured' : 'Configured')
                        : 'Sample data'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Skip Setup
            </button>
          )}

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              Continue
              <Icons.ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSaveAndContinue}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              Get Started
              <Icons.ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SetupWizard;
