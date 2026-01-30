// ============================================================================
// API KEYS UTILITY
// Unified way to get API keys from all sources
// ============================================================================

type KeyName = 'gemini' | 'openai' | 'anthropic' | 'apify';

interface APIKeys {
  gemini?: string;
  openai?: string;
  anthropic?: string;
  apify?: string;
}

// Cache to avoid repeated localStorage reads
let cachedKeys: APIKeys | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Get an API key from all possible sources:
 * 1. Environment variables (VITE_*)
 * 2. localStorage nexus-api-keys (setup wizard)
 * 3. localStorage nexus-settings (settings panel)
 */
export function getApiKey(key: KeyName): string {
  // Check environment variables first (most reliable for production)
  const envKey = getEnvKey(key);
  if (envKey) return envKey;

  // Check localStorage (for user-configured keys)
  const localKeys = getLocalStorageKeys();
  return localKeys[key] || '';
}

/**
 * Get API key from environment variables
 */
function getEnvKey(key: KeyName): string {
  const envVarName = `VITE_${key.toUpperCase()}_API_KEY`;
  return (import.meta.env as Record<string, string>)[envVarName] || '';
}

/**
 * Get all API keys from localStorage (with caching)
 */
function getLocalStorageKeys(): APIKeys {
  if (typeof window === 'undefined') return {};

  // Check cache
  if (cachedKeys && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedKeys;
  }

  const keys: APIKeys = {};

  try {
    // Source 1: nexus-api-keys (setup wizard)
    const apiKeysStr = localStorage.getItem('nexus-api-keys');
    if (apiKeysStr) {
      const parsed = JSON.parse(apiKeysStr);
      if (parsed.geminiKey) keys.gemini = parsed.geminiKey;
      if (parsed.openaiKey) keys.openai = parsed.openaiKey;
      if (parsed.anthropicKey) keys.anthropic = parsed.anthropicKey;
      if (parsed.apifyKey) keys.apify = parsed.apifyKey;
    }
  } catch (e) {
    console.warn('Error reading nexus-api-keys:', e);
  }

  try {
    // Source 2: nexus-settings (settings panel / Zustand)
    const settingsStr = localStorage.getItem('nexus-settings');
    if (settingsStr) {
      const parsed = JSON.parse(settingsStr);
      const state = parsed.state || parsed;

      // AI config
      if (state.aiConfig?.apiKey && state.aiConfig?.provider) {
        const provider = state.aiConfig.provider as KeyName;
        if (!keys[provider]) {
          keys[provider] = state.aiConfig.apiKey;
        }
      }

      // Integrations
      if (state.integrations) {
        const apifyIntegration = state.integrations.find((i: any) => i.id === 'apify');
        if (apifyIntegration?.credentials?.apiKey && !keys.apify) {
          keys.apify = apifyIntegration.credentials.apiKey;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading nexus-settings:', e);
  }

  // Update cache
  cachedKeys = keys;
  cacheTimestamp = Date.now();

  return keys;
}

/**
 * Check which APIs are configured
 */
export function getConfiguredAPIs(): { ai: boolean; apify: boolean; supabase: boolean } {
  const gemini = !!getApiKey('gemini');
  const openai = !!getApiKey('openai');
  const anthropic = !!getApiKey('anthropic');
  const apify = !!getApiKey('apify');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    ai: gemini || openai || anthropic,
    apify,
    supabase: !!(supabaseUrl && supabaseKey),
  };
}

/**
 * Get the best available AI provider
 */
export function getBestAIProvider(): { provider: KeyName | null; apiKey: string | null } {
  // Priority: Gemini > OpenAI > Anthropic
  const gemini = getApiKey('gemini');
  if (gemini) return { provider: 'gemini', apiKey: gemini };

  const openai = getApiKey('openai');
  if (openai) return { provider: 'openai', apiKey: openai };

  const anthropic = getApiKey('anthropic');
  if (anthropic) return { provider: 'anthropic', apiKey: anthropic };

  return { provider: null, apiKey: null };
}

/**
 * Clear the cache (call after updating keys)
 */
export function clearApiKeyCache(): void {
  cachedKeys = null;
  cacheTimestamp = 0;
}
