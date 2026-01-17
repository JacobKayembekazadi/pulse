import { GoogleGenAI } from "@google/genai";
import { SocialPost, SOPItem, TimeFrame } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to parse JSON safely
const parseGeminiJson = (text: string): any[] => {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    
    try {
        return JSON.parse(text.substring(start, end + 1));
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return [];
    }
};

export const fetchRealBrandMentions = async (brandName: string, keywords?: string, timeframe: TimeFrame = 'live'): Promise<SocialPost[]> => {
  try {
    const modelId = "gemini-2.5-flash";
    
    let searchQuery = brandName;
    if (keywords) {
        searchQuery += ` ${keywords}`;
    }

    // Define time context for the prompt
    let timeInstruction = "Search for the absolute latest, most recent mentions from today.";
    if (timeframe === '24h') timeInstruction = "Search for mentions from the past 24 hours.";
    if (timeframe === '7d') timeInstruction = "Search for key mentions from the past 7 days.";
    if (timeframe === '30d') timeInstruction = "Search for mentions from the past 30 days.";
    if (timeframe === '1y') timeInstruction = "Search for major mentions and sentiment from the past year (12 months).";

    // Optimized: Single prompt to handle both general and social search to save API calls
    const combinedPrompt = `
      Perform a comprehensive search for "${searchQuery}".
      
      TIME CONSTRAINT: ${timeInstruction}
      ${keywords ? `Focus specifically on mentions related to: ${keywords}` : ''}
      
      1. Search for news and web mentions matching the time constraint.
      2. Search specifically for user discussions on BlueSky (site:bsky.app) and Reddit (site:reddit.com).
      3. Search for professional discussions and posts on LinkedIn (site:linkedin.com).

      Return a single JSON array of 5-6 items containing a mix of sources.
      
      Schema: 
      [{ 
        "id": "unique", 
        "author": "Name or Handle", 
        "handle": "@handle or u/user or empty", 
        "content": "Summary of the post/article (max 280 chars)", 
        "platform": "bluesky" | "reddit" | "linkedin" | "news" | "web", 
        "sentiment": "positive"|"negative"|"neutral", 
        "sourceUrl": "Full URL to the source" 
      }]
    `;

    const result = await ai.models.generateContent({
        model: modelId,
        contents: combinedPrompt,
        config: { tools: [{ googleSearch: {} }] },
    });

    const posts = parseGeminiJson(result.text || "");

    // Format
    return posts.map(post => ({
        ...post,
        id: post.id || Math.random().toString(36).substr(2, 9),
        // If historical, we might want to fake the timestamp to distribute them, 
        // but for now current time is fine as it represents "fetched at".
        timestamp: Date.now(),
        likes: post.likes || 0,
        shares: post.shares || 0,
        avatar: post.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(post.author || 'User')}&color=fff`,
        platform: ['bluesky', 'reddit', 'twitter', 'instagram', 'linkedin', 'news', 'web'].includes(post.platform) ? post.platform : 'web'
    }));

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Propagate rate limit errors so UI can handle them
    if (error.message?.includes('429') || error.status === 429 || error.message?.includes('quota')) {
        throw new Error("RATE_LIMIT");
    }
    return [];
  }
};

export const fetchStrategicInsight = async (brandName: string, posts: SocialPost[]): Promise<string> => {
  try {
    if (posts.length === 0) {
      return `No sufficient data found for **${brandName}** yet. Try checking the spelling or wait for the system to index more sources.`;
    }

    const context = posts.map(p => `[${p.platform.toUpperCase()}] ${p.content}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a senior brand strategist. Analyze these real search results for "${brandName}":
        ${context}
        
        Provide a single, high-impact strategic insight (max 30 words).
        Highlight if there is activity on BlueSky, Reddit, or LinkedIn specifically.
        Use bolding (**) for key phrases.
      `,
    });

    return response.text || "Analysis complete.";
  } catch (error) {
    // Fail silently for insight to not break the app flow
    console.warn("Insight generation failed", error);
    return "Insight generation temporarily unavailable due to high traffic.";
  }
};

export const generateSmartReply = async (post: SocialPost, sops: SOPItem[]): Promise<string> => {
  try {
    const activeSOPs = sops.filter(s => s.isActive);
    
    const sopContext = activeSOPs.map(s => `
      TYPE: ${s.type.toUpperCase()}
      TITLE: ${s.title}
      CONTENT: ${s.content}
    `).join('\n---\n');

    const prompt = `
      You are a social media manager for a brand. 
      Draft a reply to the following user post.
      
      USER POST:
      Platform: ${post.platform}
      Author: ${post.author}
      Content: "${post.content}"
      
      YOUR GUIDELINES (SOPs):
      ${sopContext.length > 0 ? sopContext : "No specific SOPs provided. Be professional and helpful."}
      
      INSTRUCTIONS:
      - Draft a response that strictly follows the SOPs.
      - If the platform is BlueSky or Twitter, keep it under 280 chars.
      - If LinkedIn, keep it professional and constructive.
      - If Reddit, you can be slightly more detailed but keep it conversational.
      - Output ONLY the reply text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not generate reply.";
  } catch (error) {
    console.error("Gemini Reply Error:", error);
    return "Error generating reply. Please check your API connection.";
  }
};

export const generateStrategicPlan = async (brandName: string, posts: SocialPost[]): Promise<string> => {
    try {
        if (posts.length === 0) return "Insufficient data to generate plan.";

        const context = posts.slice(0, 10).map(p => `- ${p.content} (${p.sentiment})`).join('\n');

        const prompt = `
            You are a Crisis Manager and Brand Strategist.
            Based on the following recent social media chatter about "${brandName}", generate a 5-step IMMEDIATE ACTION PLAN.

            CHATTER:
            ${context}

            INSTRUCTIONS:
            - Create a Markdown list.
            - Each item should be a concrete tactical step (e.g., "Draft an apology regarding X", "Amplify positive review from Y").
            - Prioritize actions based on sentiment (Negative = High Priority).
            - Keep it concise.
            - Do not include introductory text, just the list.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "Plan generation failed.";
    } catch (e) {
        console.error(e);
        return "Error generating plan.";
    }
}