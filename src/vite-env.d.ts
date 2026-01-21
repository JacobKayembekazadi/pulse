/// <reference types="vite/client" />

interface ImportMetaEnv {
  // AI Service
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_API_KEY: string;

  // Social Scraping
  readonly VITE_APIFY_API_KEY: string;

  // Alternative AI Providers
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;

  // Analytics
  readonly VITE_ANALYTICS_ID?: string;

  // Feature Flags
  readonly VITE_ENABLE_COMPETE?: string;
  readonly VITE_ENABLE_CAMPAIGNS?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
