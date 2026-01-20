# NEXUS - Social Intelligence Platform

<div align="center">

![NEXUS Logo](chrome-extension/icons/icon.svg)

**AI-Powered Social Engagement & Account-Based Marketing Platform**

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)]()
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.0+-61dafb.svg)]()
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)]()

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Usage](#usage) • [API Reference](#api-reference) • [Contributing](#contributing)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
  - [System Architecture](#system-architecture)
  - [Frontend Architecture](#frontend-architecture)
  - [Chrome Extension Architecture](#chrome-extension-architecture)
  - [Data Flow](#data-flow)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Web Application Setup](#web-application-setup)
  - [Chrome Extension Setup](#chrome-extension-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

NEXUS is a comprehensive social intelligence platform designed for B2B sales teams, SDRs (Sales Development Representatives), and growth marketers. It combines real-time social media monitoring with AI-powered engagement capabilities to help teams identify, engage, and convert high-value prospects across LinkedIn, Twitter/X, and Reddit.

### The Problem

Modern B2B sales teams face several challenges:
- **Signal Overload**: Thousands of social posts daily, making it impossible to find relevant conversations
- **Slow Response Times**: Manual monitoring means missing time-sensitive engagement opportunities
- **Inconsistent Messaging**: Without SOPs, responses vary in quality and tone
- **No Attribution**: Difficult to track which social engagements lead to pipeline

### The Solution

NEXUS provides:
- **Intelligent Monitoring**: AI-filtered feeds showing only relevant conversations
- **One-Click Engagement**: Generate and post contextual replies in seconds
- **SOP-Guided Responses**: Ensure brand consistency with customizable playbooks
- **Full Attribution**: Track engagement → reply → meeting → deal pipeline

---

## Features

### Core Platform Features

| Feature | Description |
|---------|-------------|
| **Social Feed Monitoring** | Real-time aggregated feed from LinkedIn, Twitter/X, and Reddit with keyword filtering |
| **AI Reply Generation** | Context-aware reply suggestions using Google Gemini with multiple tone options |
| **Account Management** | Import, enrich, and manage target accounts with engagement tracking |
| **Unified Inbox** | Single view for all social conversations and mentions |
| **Response Library** | Save and organize high-performing responses as reusable templates |
| **Campaign Management** | Create and track multi-touch social engagement campaigns |
| **Competitive Intelligence** | Monitor competitor mentions and social activity |
| **Analytics Dashboard** | Comprehensive metrics on engagement, response rates, and attribution |

### Chrome Extension Features

| Feature | Description |
|---------|-------------|
| **Native Button Injection** | NEXUS button appears directly on social posts |
| **In-Page Reply Modal** | Generate and edit replies without leaving the platform |
| **Tone Selection** | 5 tone presets: Professional, Friendly, Curious, Helpful, Witty |
| **Direct Posting** | Post replies directly or copy to clipboard |
| **Reply History** | Track all generated replies with statistics |
| **Offline Fallback** | Pre-generated responses when API is unavailable |

### AI Capabilities

- **Contextual Understanding**: Analyzes post content, author, and engagement signals
- **Tone Matching**: Adapts response style to match selected tone and platform norms
- **SOP Integration**: Incorporates company guidelines and messaging frameworks
- **Character Optimization**: Respects platform limits (280 chars Twitter, etc.)

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXUS PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐    │
│  │   Web Client     │     │ Chrome Extension │     │   Mobile App     │    │
│  │   (React SPA)    │     │  (Manifest V3)   │     │    (Future)      │    │
│  └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘    │
│           │                        │                        │               │
│           └────────────────────────┼────────────────────────┘               │
│                                    │                                         │
│                          ┌─────────▼─────────┐                              │
│                          │   API Gateway     │                              │
│                          │   (Future)        │                              │
│                          └─────────┬─────────┘                              │
│                                    │                                         │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐  │
│  │                         Service Layer                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Search    │  │     AI      │  │   Account   │  │  Campaign   │  │  │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │  │
│  └─────────┼────────────────┼────────────────┼────────────────┼──────────┘  │
│            │                │                │                │              │
│  ┌─────────┼────────────────┼────────────────┼────────────────┼──────────┐  │
│  │         │          External APIs          │                │          │  │
│  │  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  │  │
│  │  │   Apify     │  │   Gemini    │  │  Clearbit   │  │   HubSpot   │  │  │
│  │  │  (Scraping) │  │    (AI)     │  │ (Enrichment)│  │    (CRM)    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Data Layer                                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Zustand    │  │ localStorage│  │   Chrome    │  │  IndexedDB  │  │  │
│  │  │   Store     │  │  (Settings) │  │   Storage   │  │   (Cache)   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           React Application                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Presentation Layer                           │    │
│  │                                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │  AppShell   │  │  Dashboard  │  │   Inbox     │  │  Settings   │ │    │
│  │  │             │  │             │  │             │  │             │ │    │
│  │  │ - Sidebar   │  │ - Feed      │  │ - Threads   │  │ - API Keys  │ │    │
│  │  │ - Header    │  │ - Metrics   │  │ - Replies   │  │ - SOPs      │ │    │
│  │  │ - Nav       │  │ - Actions   │  │ - Filters   │  │ - Team      │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  │                                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │  Accounts   │  │  Campaigns  │  │   Compete   │  │  Analytics  │ │    │
│  │  │             │  │             │  │             │  │             │ │    │
│  │  │ - List      │  │ - Builder   │  │ - Tracking  │  │ - Charts    │ │    │
│  │  │ - Import    │  │ - Timeline  │  │ - Alerts    │  │ - Reports   │ │    │
│  │  │ - Enrich    │  │ - Stats     │  │ - Compare   │  │ - Export    │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Shared Components                            │    │
│  │                                                                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │ PostCard │ │ReplyModal│ │ MetricBox│ │ DataTable│ │  Charts  │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          State Management                            │    │
│  │                                                                       │    │
│  │  ┌────────────────────────────────────────────────────────────────┐ │    │
│  │  │                      Zustand Stores                             │ │    │
│  │  │                                                                  │ │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │    │
│  │  │  │dashboard │ │ accounts │ │ campaigns│ │ settings │          │ │    │
│  │  │  │  Store   │ │   Store  │ │   Store  │ │   Store  │          │ │    │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │ │    │
│  │  └────────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          Service Layer                               │    │
│  │                                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │SearchService │  │  AIService   │  │ AccountService│              │    │
│  │  │              │  │              │  │              │              │    │
│  │  │ - Apify      │  │ - Gemini     │  │ - Import     │              │    │
│  │  │ - Fallback   │  │ - Prompts    │  │ - Enrich     │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Chrome Extension Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Chrome Extension (Manifest V3)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Service Worker (Background)                   │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │    │
│  │  │                    background.js                                 │ │    │
│  │  │                                                                   │ │    │
│  │  │  • Message Router         • API Key Management                   │ │    │
│  │  │  • Gemini API Calls       • Settings Persistence                 │ │    │
│  │  │  • Reply History          • Tab Monitoring                       │ │    │
│  │  └─────────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Content Scripts                              │    │
│  │                                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │    │
│  │  │ linkedin.js │  │ twitter.js  │  │  reddit.js  │                 │    │
│  │  │             │  │             │  │             │                 │    │
│  │  │ • Post      │  │ • Tweet     │  │ • Post      │                 │    │
│  │  │   Detection │  │   Detection │  │   Detection │                 │    │
│  │  │ • Button    │  │ • Button    │  │ • Button    │                 │    │
│  │  │   Injection │  │   Injection │  │   Injection │                 │    │
│  │  │ • Modal     │  │ • Modal     │  │ • Modal     │                 │    │
│  │  │   Display   │  │   Display   │  │   Display   │                 │    │
│  │  │ • Direct    │  │ • Direct    │  │ • Direct    │                 │    │
│  │  │   Posting   │  │   Posting   │  │   Posting   │                 │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           Popup UI                                   │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │    │
│  │  │  popup.html + popup.js                                          │ │    │
│  │  │                                                                   │ │    │
│  │  │  • Stats Display (Total, Today, Posted)                         │ │    │
│  │  │  • API Key Input                                                 │ │    │
│  │  │  • Settings Toggle (Auto-inject, Default Tone)                  │ │    │
│  │  │  • Recent Activity List                                          │ │    │
│  │  │  • Open NEXUS App Button                                         │ │    │
│  │  └─────────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Injected Styles                              │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │    │
│  │  │  nexus-inject.css                                                │ │    │
│  │  │                                                                   │ │    │
│  │  │  • NEXUS Button Styles (platform-specific variants)             │ │    │
│  │  │  • Modal Styles (glassmorphism, dark theme)                     │ │    │
│  │  │  • Tone Selector Styles                                          │ │    │
│  │  │  • Reply Textarea Styles                                         │ │    │
│  │  │  • Responsive Breakpoints                                        │ │    │
│  │  └─────────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Reply Generation Flow                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  User   │───▶│ Content │───▶│Background│───▶│ Gemini  │───▶│ Reply   │  │
│  │ Clicks  │    │ Script  │    │ Worker  │    │   API   │    │Generated│  │
│  │ Button  │    │         │    │         │    │         │    │         │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │         │
│       │              │              │              │              │         │
│       ▼              ▼              ▼              ▼              ▼         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. User clicks    2. Script      3. Worker      4. API call    5. Reply │
│  │    NEXUS button      extracts       builds         to Gemini      shown │
│  │    on social post    post data      prompt         with tone      in UI │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  User   │───▶│ Modal   │───▶│ Content │───▶│Platform │───▶│  Post   │  │
│  │ Posts   │    │   UI    │    │ Script  │    │Comment  │    │Complete │  │
│  │ Reply   │    │         │    │         │    │  API    │    │         │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │         │
│       │              │              │              │              │         │
│       ▼              ▼              ▼              ▼              ▼         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 6. User edits  7. Click post  8. Script     9. Inject    10. Reply   │
│  │    & approves     button         finds         into         logged   │
│  │    reply                         comment       textarea     in history│
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### State Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Zustand Store Structure                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  dashboardStore                                                              │
│  ├── posts: SocialPost[]           # Aggregated social feed                 │
│  ├── keywords: string[]            # Search keywords                        │
│  ├── platforms: Platform[]         # Active platforms filter                │
│  ├── timeframe: Timeframe          # Date range filter                      │
│  ├── isLoading: boolean            # Loading state                          │
│  ├── setKeywords()                 # Update search terms                    │
│  ├── setPlatforms()                # Toggle platform filters                │
│  ├── fetchPosts()                  # Trigger search                         │
│  └── clearPosts()                  # Reset feed                             │
│                                                                              │
│  accountStore                                                                │
│  ├── accounts: Account[]           # Target account list                    │
│  ├── selectedAccount: Account      # Currently selected                     │
│  ├── filters: AccountFilters       # List filters                           │
│  ├── addAccount()                  # Manual add                             │
│  ├── importAccounts()              # CSV import                             │
│  ├── enrichAccount()               # Add firmographic data                  │
│  └── updateEngagement()            # Log interaction                        │
│                                                                              │
│  campaignStore                                                               │
│  ├── campaigns: Campaign[]         # All campaigns                          │
│  ├── activeCampaign: Campaign      # Current campaign                       │
│  ├── createCampaign()              # New campaign                           │
│  ├── addTouchpoint()               # Add engagement step                    │
│  └── updateMetrics()               # Track performance                      │
│                                                                              │
│  settingsStore                                                               │
│  ├── aiConfig: AIConfig            # API keys, model settings               │
│  ├── searchConfig: SearchConfig    # Default search params                  │
│  ├── sops: SOP[]                   # Response playbooks                     │
│  ├── teamMembers: User[]           # Team settings                          │
│  ├── updateAIConfig()              # Save AI settings                       │
│  └── updateSOP()                   # Edit playbook                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first styling |
| Zustand | 4.x | State management |
| React Router | 6.x | Client-side routing |
| Recharts | 2.x | Data visualization |
| Lucide React | Latest | Icon library |

### Chrome Extension

| Technology | Purpose |
|------------|---------|
| Manifest V3 | Latest extension standard |
| Service Worker | Background processing |
| Content Scripts | DOM manipulation |
| Chrome Storage API | Local data persistence |

### External Services

| Service | Purpose |
|---------|---------|
| Google Gemini | AI text generation |
| Apify | Social media scraping |
| Clearbit | Company enrichment (planned) |
| HubSpot | CRM integration (planned) |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Git | Version control |
| npm | Package management |

---

## Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Google Chrome** >= 88 (for extension)
- **Git**

### Web Application Setup

```bash
# Clone the repository
git clone https://github.com/your-org/pulse.git
cd pulse

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Chrome Extension Setup

```bash
# Navigate to extension directory
cd chrome-extension

# Open Chrome Extensions page
# Navigate to: chrome://extensions/

# Enable Developer Mode (toggle in top-right)

# Click "Load unpacked"

# Select the chrome-extension folder
```

### Environment Variables

Create a `.env` file in the project root:

```env
# AI Service
VITE_GEMINI_API_KEY=your_gemini_api_key

# Social Scraping (Apify)
VITE_APIFY_API_KEY=your_apify_api_key

# Analytics (Optional)
VITE_ANALYTICS_ID=your_analytics_id

# Feature Flags
VITE_ENABLE_COMPETE=true
VITE_ENABLE_CAMPAIGNS=true
```

---

## Configuration

### AI Configuration

Configure AI settings via the Settings panel or directly in the store:

```typescript
interface AIConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  temperature: number;      // 0.0 - 1.0
  maxTokens: number;        // Max response length
  defaultTone: ToneType;    // Default reply tone
}

// Tone options
type ToneType =
  | 'professional'
  | 'friendly'
  | 'curious'
  | 'helpful'
  | 'witty';
```

### Search Configuration

```typescript
interface SearchConfig {
  platforms: ('linkedin' | 'twitter' | 'reddit')[];
  keywords: string[];
  excludeKeywords: string[];
  timeframe: '1h' | '24h' | '7d' | '30d';
  minEngagement: number;
  language: string;
}
```

### SOP (Standard Operating Procedure) Configuration

```typescript
interface SOP {
  id: string;
  name: string;
  description: string;
  triggers: string[];           // Keywords that activate this SOP
  guidelines: string[];         // Response guidelines
  examples: {
    post: string;
    response: string;
  }[];
  tone: ToneType;
  maxLength: number;
}
```

---

## Usage

### Dashboard Workflow

1. **Configure Keywords**: Add industry terms, competitor names, or pain points
2. **Select Platforms**: Choose LinkedIn, Twitter/X, and/or Reddit
3. **Review Feed**: Scroll through AI-filtered relevant posts
4. **Engage**: Click "Reply" to generate and post responses

### Chrome Extension Workflow

1. **Install Extension**: Load unpacked from `chrome-extension` folder
2. **Add API Key**: Click extension icon → Enter Gemini API key
3. **Browse Socials**: Navigate to LinkedIn, Twitter, or Reddit
4. **Find NEXUS Button**: Look for purple button on posts
5. **Generate Reply**: Click button → Select tone → Generate
6. **Post or Copy**: Use "Post" for direct posting or "Copy" for manual

### Account-Based Workflow

1. **Import Accounts**: CSV upload or manual entry
2. **Enrich Data**: Auto-fetch firmographics and social handles
3. **Monitor Activity**: Track posts from target accounts
4. **Engage Strategically**: Prioritize high-intent signals
5. **Track Attribution**: Log engagement → meeting → deal

---

## API Reference

### Search Service

```typescript
class SearchService {
  // Search across platforms
  async search(params: SearchParams): Promise<SocialPost[]>

  // Platform-specific search
  async searchLinkedIn(keywords: string[]): Promise<SocialPost[]>
  async searchTwitter(keywords: string[]): Promise<SocialPost[]>
  async searchReddit(keywords: string[]): Promise<SocialPost[]>
}

interface SearchParams {
  keywords: string[];
  platforms: Platform[];
  timeframe: Timeframe;
  limit?: number;
}

interface SocialPost {
  id: string;
  platform: 'linkedin' | 'twitter' | 'reddit';
  author: string;
  authorTitle?: string;
  authorHandle?: string;
  content: string;
  postedAt: string;
  url: string;
  engagement: {
    likes: number;
    comments: number;
    shares?: number;
  };
}
```

### AI Service

```typescript
class AIService {
  // Generate contextual reply
  async generateReply(params: ReplyParams): Promise<string>

  // Simple comment generation
  async generateSimpleComment(
    postContent: string,
    tone: ToneType
  ): Promise<string>

  // SOP-guided reply
  async generateSOPReply(
    post: SocialPost,
    sop: SOP
  ): Promise<string>
}

interface ReplyParams {
  post: SocialPost;
  tone: ToneType;
  sop?: SOP;
  maxLength?: number;
}
```

### Chrome Extension Messages

```typescript
// Message types for extension communication
type MessageType =
  | 'GENERATE_REPLY'
  | 'SAVE_SETTINGS'
  | 'GET_SETTINGS'
  | 'SAVE_API_KEY'
  | 'GET_API_KEY'
  | 'LOG_REPLY'
  | 'GET_REPLY_HISTORY'
  | 'OPEN_NEXUS_APP';

// Example: Generate reply
chrome.runtime.sendMessage({
  type: 'GENERATE_REPLY',
  data: {
    post: { author: '...', content: '...' },
    tone: 'professional',
    platform: 'linkedin'
  }
}, (response) => {
  if (response.success) {
    console.log(response.reply);
  }
});
```

---

## Project Structure

```
pulse/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx           # Main layout wrapper
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx      # Main dashboard view
│   │   ├── accounts/
│   │   │   └── Accounts.tsx       # Account management
│   │   ├── inbox/
│   │   │   └── Inbox.tsx          # Unified inbox
│   │   ├── library/
│   │   │   └── Library.tsx        # Response templates
│   │   ├── campaigns/
│   │   │   └── Campaigns.tsx      # Campaign builder
│   │   ├── compete/
│   │   │   └── Compete.tsx        # Competitive intel
│   │   ├── analytics/
│   │   │   └── Analytics.tsx      # Performance metrics
│   │   ├── settings/
│   │   │   └── SettingsPanel.tsx  # Configuration
│   │   └── shared/
│   │       ├── PostCard.tsx       # Social post display
│   │       └── ReplyModal.tsx     # Reply generation modal
│   │
│   ├── services/
│   │   ├── ai.service.ts          # AI/Gemini integration
│   │   └── search.service.ts      # Social search (Apify)
│   │
│   ├── stores/
│   │   ├── dashboardStore.ts      # Dashboard state
│   │   ├── accountStore.ts        # Account state
│   │   ├── campaignStore.ts       # Campaign state
│   │   └── settingsStore.ts       # Settings state
│   │
│   ├── types/
│   │   └── index.ts               # TypeScript definitions
│   │
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
│
├── chrome-extension/
│   ├── manifest.json              # Extension config
│   ├── background.js              # Service worker
│   ├── content-scripts/
│   │   ├── linkedin.js            # LinkedIn injection
│   │   ├── twitter.js             # Twitter injection
│   │   └── reddit.js              # Reddit injection
│   ├── popup/
│   │   ├── popup.html             # Popup UI
│   │   └── popup.js               # Popup logic
│   ├── styles/
│   │   └── nexus-inject.css       # Injected styles
│   └── icons/
│       └── icon.svg               # Extension icon
│
├── public/                        # Static assets
├── index.html                     # HTML template
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies
└── README.md                      # This file
```

---

## Development

### Running Development Server

```bash
# Start with hot reload
npm run dev

# Start with network access (for mobile testing)
npm run dev -- --host
```

### Building for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

### Code Style

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Adding a New Feature

1. **Create Types**: Define interfaces in `src/types/index.ts`
2. **Create Store**: Add Zustand store in `src/stores/`
3. **Create Service**: Add API integration in `src/services/`
4. **Create Component**: Add UI in `src/components/`
5. **Add Route**: Update routing in `App.tsx`
6. **Add Navigation**: Update sidebar in `AppShell.tsx`

---

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:e2e

# Open Playwright UI
npm run test:e2e:ui
```

### Extension Testing

1. Load unpacked extension in Chrome
2. Open DevTools on extension popup (right-click → Inspect)
3. Open DevTools on content script (F12 on social media page)
4. Check background script logs in `chrome://extensions/` → Service Worker

---

## Deployment

### Web Application

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy

# Deploy to Netlify
netlify deploy --prod
```

### Chrome Extension

1. Build production version
2. Create ZIP of `chrome-extension` folder
3. Submit to Chrome Web Store Developer Dashboard
4. Complete store listing with screenshots and description

---

## Security

### Best Practices Implemented

- **API Key Storage**: Keys stored in Chrome Storage (local only)
- **Content Security**: Strict CSP headers in manifest
- **Input Sanitization**: All user input escaped before DOM injection
- **HTTPS Only**: All external requests use HTTPS
- **Minimal Permissions**: Only required permissions requested

### Data Privacy

- No telemetry or tracking
- API keys never leave the device
- Reply history stored locally only
- No server-side data collection

### Vulnerability Reporting

Report security issues to: security@nexus.app

---

## Roadmap

### Phase 1: Chrome Extension ✅
- [x] LinkedIn content script
- [x] Twitter/X content script
- [x] Reddit content script
- [x] AI reply generation
- [x] Popup UI with settings

### Phase 2: Account Import & Enrichment
- [ ] CSV account import
- [ ] LinkedIn profile scraping
- [ ] Clearbit enrichment integration
- [ ] Account scoring algorithm

### Phase 3: Engagement Tracking
- [ ] Reply attribution tracking
- [ ] Meeting scheduling integration
- [ ] CRM sync (HubSpot, Salesforce)
- [ ] ROI dashboard

### Phase 4: Power User Features
- [ ] Keyboard shortcuts (Cmd+Shift+N)
- [ ] Template quick-insert
- [ ] Bulk reply queue
- [ ] Team handoff

### Phase 5: Team Features
- [ ] Shared account lists
- [ ] Post claiming/locking
- [ ] Team analytics
- [ ] Role-based permissions

---

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Commit Convention

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting, etc.)
refactor: Code refactoring
test: Add or update tests
chore: Build/tooling changes
```

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests pass
- [ ] No console.log statements
- [ ] TypeScript types are correct
- [ ] Accessibility considered
- [ ] Mobile responsive

---

## License

Copyright 2024 NEXUS. All rights reserved.

This is proprietary software. Unauthorized copying, modification, or distribution is prohibited.

---

## Support

- **Documentation**: [docs.nexus.app](https://docs.nexus.app)
- **Issues**: [GitHub Issues](https://github.com/your-org/pulse/issues)
- **Email**: support@nexus.app
- **Discord**: [NEXUS Community](https://discord.gg/nexus)

---

<div align="center">

**Built for B2B Sales Teams**

[Website](https://nexus.app) • [Documentation](https://docs.nexus.app) • [Twitter](https://twitter.com/nexusapp)

</div>
