# Pulse - Social Command Center: Project Overview

## 1. Executive Summary
**Pulse** is a real-time, AI-enhanced social listening and community management dashboard designed for modern brands. It replaces traditional, expensive enterprise APIs with **Google Gemini's Search Grounding** capabilities to identify brand mentions across the web, specifically targeting emerging platforms like **BlueSky** and community hubs like **Reddit**, alongside general news and web sources.

The platform features a "Command Center" aesthetic (Dark UI, Glassmorphism) and integrates AI-driven workflows for analyzing sentiment and generating on-brand responses based on user-defined SOPs (Standard Operating Procedures).

## 2. Technology Stack
*   **Frontend:** React 19, Vite, TypeScript.
*   **Styling:** Tailwind CSS 4 (Glassmorphism, Neon accents, Animations), Lucide React (Icons).
*   **Visualization:** Recharts (Area charts for volume, Bar charts for sentiment).
*   **AI & Data:** Google Gemini API (`gemini-2.5-flash`) via `@google/genai`.
    *   **Key Tool:** `googleSearch` tool for retrieving real-time web data.
    *   **Model Capabilities:** JSON structured output, text generation, semantic analysis.

## 3. Core Functionalities

### A. Brand Monitoring (The "Live Feed")
*   **Search Engine:** Instead of direct social APIs (Twitter/X, Instagram), the app uses Gemini with search grounding.
*   **Targeted Queries:** It runs parallel search queries:
    1.  **General:** News, reviews, and web mentions.
    2.  **Community Specific:** Targeted `site:bsky.app` and `site:reddit.com` searches to capture user discussions.
*   **Data Normalization:** Raw search results are parsed into a unified `SocialPost` schema (Author, Content, Platform, Sentiment, Source URL).
*   **Polling:** The system polls for new data every 20 seconds to simulate a live feed.

### B. Strategic AI Analysis
*   **Insight Card:** Aggregates the current batch of fetched posts and uses Gemini to generate a "Strategic Insight"—a 30-word high-level summary of brand sentiment and actionable advice.
*   **Analytics Panel:** Visualizes data volume and sentiment distribution (currently uses a mix of real volume tracking and simulated historical data for the demo graph).

### C. Community Management (SOPs & Smart Replies)
*   **SOP Manager:** A CRUD interface where users define **Standard Operating Procedures**.
    *   **Types:** Tone (e.g., "Professional but friendly"), Rules (e.g., "Escalate outages"), Templates (e.g., "Thanks for the feedback").
*   **AI Reply Agent:** Generates draft responses to specific mentions.
    *   **Context Aware:** The AI prompt includes the specific user post *and* the active SOPs to ensure the draft adheres to brand guidelines.
*   **Reply Workflow:**
    1.  User clicks "Reply AI" on a post.
    2.  **Reply Modal** opens with the original post and an AI-generated draft.
    3.  **Templates:** Users can click sidebar templates to instantly overwrite the draft.
    4.  **Action:** "Copy & Open Source" button copies the text to the clipboard and opens the original source URL in a new tab for manual posting (bypassing API write restrictions).

## 4. Key Components & Architecture

| Component | Description |
| :--- | :--- |
| **`App.tsx`** | Main controller. Manages `brand` state, polling intervals, and coordinates data fetching. |
| **`geminiService.ts`** | The core logic layer. Handles `fetchRealBrandMentions` (Search), `fetchStrategicInsight` (Analysis), and `generateSmartReply` (Drafting). |
| **`LiveFeed.tsx`** | Renders the stream of posts. Handles platform-specific icons (BlueSky cloud, Reddit logo) and "View Source" links. |
| **`BrandInput.tsx`** | Hero onboarding component. Accepts brand name/link and sanitizes input. |
| **`SOPManager.tsx`** | Modal for managing brand guidelines. Persists state in `App.tsx`. |
| **`ReplyModal.tsx`** | The workspace for crafting responses. Features a template sidebar and "Copy & Go" functionality. |

## 5. Data Flow

1.  **Input:** User enters "Nike".
2.  **Fetch:** `App` calls `geminiService.fetchRealBrandMentions("Nike")`.
3.  **AI Processing:**
    *   Gemini searches Google -> Finds links/snippets.
    *   Gemini formats result into JSON `SocialPost[]`.
4.  **Render:** `App` updates `posts` state -> passed to `LiveFeed`.
5.  **Interaction:** User clicks reply on a post.
6.  **Generation:** `geminiService.generateSmartReply` is called with the post content + active SOPs.
7.  **Output:** User copies the final text and posts it on the actual social platform.
