// ============================================================================
// SETUP WIZARD - First-time user onboarding
// Guides users through API configuration before they start
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Icons } from '../shared/Icons';
import { useSettingsStore } from '../../store';
import { storage } from '../../services/storage.service';

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const { aiConfig, setAIConfig } = useSettingsStore();
  const [step, setStep] = useState(0);
  const [geminiKey, setGeminiKey] = useState(aiConfig.apiKey || '');
  const [apifyKey, setApifyKey] = useState('');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [skipSetup, setSkipSetup] = useState(false);

  // Load existing keys if any
  useEffect(() => {
    const settings = storage.get<{ apifyKey?: string }>('nexus-api-keys', {});
    if (settings.apifyKey) {
      setApifyKey(settings.apifyKey);
    }
  }, []);

  const testGeminiKey = async () => {
    if (!geminiKey) return;

    setIsTestingGemini(true);
    setGeminiStatus('idle');

    try {
      // Test the Gemini API with a simple request
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
    // Save Gemini key to settings store
    if (geminiKey) {
      setAIConfig({ ...aiConfig, apiKey: geminiKey });
    }

    // Save Apify key to storage
    if (apifyKey) {
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

  const steps = [
    { title: 'Welcome', icon: Icons.Sparkles },
    { title: 'AI Setup', icon: Icons.Zap },
    { title: 'Data Sources', icon: Icons.Search },
    { title: 'Ready!', icon: Icons.Check }
  ];

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
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                <Icons.Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Welcome to NEXUS</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Your AI-powered social intelligence platform for B2B sales. Let's get you set up in under 2 minutes.
              </p>

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

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-center">AI Configuration</h2>
              <p className="text-gray-400 mb-6 text-center">
                NEXUS uses Google Gemini AI to generate intelligent replies.
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
                      placeholder="Enter your Gemini API key"
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
                    <strong className="text-white">Don't have an API key?</strong><br />
                    Get one free at{' '}
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
                  You can skip this step and use sample data, but AI features won't work.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
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
                    placeholder="Enter your Apify API token"
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
                    {' '}- free tier includes 5GB of data/month.
                  </p>
                </div>

                <div className="glass-card p-4 rounded-lg border-yellow-500/30">
                  <p className="text-sm text-yellow-400 flex items-start gap-2">
                    <Icons.AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Without data sources configured, NEXUS will display sample data for demonstration purposes.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Icons.Check className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">You're All Set!</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {geminiKey || apifyKey ? (
                  "Your configuration has been saved. You're ready to start using NEXUS!"
                ) : (
                  "You can start exploring NEXUS with sample data. Configure API keys anytime in Settings."
                )}
              </p>

              <div className="glass-card p-4 rounded-xl mb-6 text-left max-w-md mx-auto">
                <h3 className="font-medium mb-3">Configuration Summary:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-400">Gemini AI</span>
                    <span className={geminiKey ? 'text-green-400' : 'text-yellow-400'}>
                      {geminiKey ? 'Configured' : 'Using templates'}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-400">Data Sources</span>
                    <span className={apifyKey ? 'text-green-400' : 'text-yellow-400'}>
                      {apifyKey ? 'Configured' : 'Sample data'}
                    </span>
                  </li>
                </ul>
              </div>

              {!geminiKey && !apifyKey && (
                <p className="text-xs text-gray-500 mb-4">
                  Look for the "Demo Data" badge to identify sample content.
                </p>
              )}
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
