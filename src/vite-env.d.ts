/// <reference types="vite/client" />

interface ImportMetaEnv {
  // AI Service Providers
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;

  // Legacy alias for Gemini
  readonly VITE_API_KEY?: string;

  // Social Scraping / Data Collection
  readonly VITE_APIFY_API_KEY?: string;

  // Enrichment Services
  readonly VITE_CLEARBIT_API_KEY?: string;
  readonly VITE_APOLLO_API_KEY?: string;
  readonly VITE_HUNTER_API_KEY?: string;
  readonly VITE_ZOOMINFO_API_KEY?: string;

  // CRM Integrations
  readonly VITE_HUBSPOT_API_KEY?: string;
  readonly VITE_SALESFORCE_CLIENT_ID?: string;
  readonly VITE_PIPEDRIVE_API_KEY?: string;

  // Social Platform APIs
  readonly VITE_LINKEDIN_CLIENT_ID?: string;
  readonly VITE_TWITTER_BEARER_TOKEN?: string;

  // Intent Data Providers
  readonly VITE_LEADFEEDER_API_KEY?: string;
  readonly VITE_G2_API_KEY?: string;

  // Analytics
  readonly VITE_ANALYTICS_ID?: string;

  // Feature Flags
  readonly VITE_ENABLE_COMPETE?: string;
  readonly VITE_ENABLE_CAMPAIGNS?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_ENRICHMENT?: string;

  // App Configuration
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
