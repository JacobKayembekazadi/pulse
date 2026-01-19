// ============================================================================
// NEXUS CHROME EXTENSION - BACKGROUND SERVICE WORKER
// Handles message passing, storage, and AI API calls
// ============================================================================

// Storage keys
const STORAGE_KEYS = {
  API_KEY: 'nexus_api_key',
  SETTINGS: 'nexus_settings',
  REPLY_HISTORY: 'nexus_reply_history',
  CONNECTED: 'nexus_connected',
};

// Default settings
const DEFAULT_SETTINGS = {
  defaultTone: 'helpful',
  autoInject: true,
  showNotifications: true,
};

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[NEXUS Background] Received message:', message.type);

  switch (message.type) {
    case 'GENERATE_REPLY':
      handleGenerateReply(message.data).then(sendResponse);
      return true; // Keep channel open for async response

    case 'SAVE_SETTINGS':
      handleSaveSettings(message.data).then(sendResponse);
      return true;

    case 'GET_SETTINGS':
      handleGetSettings().then(sendResponse);
      return true;

    case 'SAVE_API_KEY':
      handleSaveApiKey(message.data).then(sendResponse);
      return true;

    case 'GET_API_KEY':
      handleGetApiKey().then(sendResponse);
      return true;

    case 'LOG_REPLY':
      handleLogReply(message.data).then(sendResponse);
      return true;

    case 'GET_REPLY_HISTORY':
      handleGetReplyHistory().then(sendResponse);
      return true;

    case 'OPEN_NEXUS_APP':
      handleOpenNexusApp(message.data);
      sendResponse({ success: true });
      return false;

    default:
      console.warn('[NEXUS Background] Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

// ============================================================================
// AI REPLY GENERATION
// ============================================================================

async function handleGenerateReply(data) {
  const { post, tone = 'helpful', platform } = data;

  try {
    // Get API key from storage
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
    const apiKey = result[STORAGE_KEYS.API_KEY];

    if (!apiKey) {
      return {
        success: false,
        error: 'No API key configured. Please add your Gemini API key in the extension settings.',
        fallback: getFallbackReply(tone),
      };
    }

    // Call Gemini API
    const prompt = buildReplyPrompt(post, tone, platform);
    const reply = await callGeminiAPI(apiKey, prompt);

    return {
      success: true,
      reply: reply.trim().replace(/^["']|["']$/g, ''),
    };
  } catch (error) {
    console.error('[NEXUS Background] Error generating reply:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate reply',
      fallback: getFallbackReply(tone),
    };
  }
}

function buildReplyPrompt(post, tone, platform) {
  return `Generate a ${tone} reply to this ${platform} post.

POST:
Author: ${post.author || 'Unknown'}
Content: "${post.content}"

RULES:
- Keep it under 280 characters
- Be ${tone} in tone
- Add genuine value, don't just agree
- No hashtags or emojis unless natural
- Sound human, not like AI
- Encourage further conversation

Generate ONLY the reply text, nothing else:`;
}

async function callGeminiAPI(apiKey, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function getFallbackReply(tone) {
  const fallbacks = {
    professional: "Great insights on this topic. I've seen similar patterns in my work - would love to connect and discuss further.",
    friendly: "Love this! Really resonates with what I've been seeing lately. Thanks for sharing!",
    curious: "Interesting perspective! What's been your biggest learning from this approach? Would love to hear more.",
    helpful: "This is valuable. One thing that's worked well for us is [add your insight]. Happy to share more if helpful!",
    witty: "This hits different. Saving this for my 'things I wish I knew earlier' collection.",
  };
  return fallbacks[tone] || fallbacks.helpful;
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

async function handleSaveSettings(settings) {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: { ...DEFAULT_SETTINGS, ...settings },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleGetSettings() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return {
      success: true,
      settings: result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleSaveApiKey(apiKey) {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.API_KEY]: apiKey,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleGetApiKey() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
    return {
      success: true,
      apiKey: result[STORAGE_KEYS.API_KEY] || '',
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// REPLY LOGGING
// ============================================================================

async function handleLogReply(data) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.REPLY_HISTORY);
    const history = result[STORAGE_KEYS.REPLY_HISTORY] || [];

    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      platform: data.platform,
      postUrl: data.postUrl,
      postAuthor: data.postAuthor,
      postContent: data.postContent?.substring(0, 200),
      reply: data.reply,
      tone: data.tone,
      wasPosted: data.wasPosted || false,
    };

    // Keep last 100 entries
    const updatedHistory = [entry, ...history].slice(0, 100);

    await chrome.storage.local.set({
      [STORAGE_KEYS.REPLY_HISTORY]: updatedHistory,
    });

    return { success: true, entry };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleGetReplyHistory() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.REPLY_HISTORY);
    return {
      success: true,
      history: result[STORAGE_KEYS.REPLY_HISTORY] || [],
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// NEXUS APP INTEGRATION
// ============================================================================

function handleOpenNexusApp(data) {
  // Open NEXUS app with post data for more advanced reply generation
  const baseUrl = 'http://localhost:5173'; // Development URL
  const params = new URLSearchParams({
    action: 'reply',
    platform: data.platform || '',
    postUrl: data.postUrl || '',
    postContent: encodeURIComponent(data.postContent || ''),
    postAuthor: data.postAuthor || '',
  });

  chrome.tabs.create({
    url: `${baseUrl}?${params.toString()}`,
  });
}

// ============================================================================
// EXTENSION LIFECYCLE
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[NEXUS] Extension installed:', details.reason);

  // Set default settings on install
  if (details.reason === 'install') {
    chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
      [STORAGE_KEYS.REPLY_HISTORY]: [],
    });
  }
});

// Listen for tab updates to re-inject content scripts if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isLinkedIn = tab.url.includes('linkedin.com');
    const isTwitter = tab.url.includes('twitter.com') || tab.url.includes('x.com');
    const isReddit = tab.url.includes('reddit.com');

    if (isLinkedIn || isTwitter || isReddit) {
      console.log('[NEXUS] Social platform detected:', tab.url);
    }
  }
});
