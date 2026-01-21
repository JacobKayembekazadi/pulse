// ============================================================================
// AI CHATBOT - Floating AI Assistant
// Helps users with questions, tasks, and insights
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../shared/Icons';
import { aiService } from '../../services/ai.service';
import { useSettingsStore } from '../../store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SYSTEM_CONTEXT = `You are NEXUS AI, a helpful assistant for a B2B social intelligence platform. You help users with:
- Monitoring social media conversations (LinkedIn, Twitter, Reddit)
- Generating AI-powered reply suggestions
- Managing accounts and campaigns
- Understanding analytics and engagement data
- Competitive intelligence tracking

Be concise, helpful, and professional. If users ask about features, explain how they work.
If they need help with tasks, provide step-by-step guidance.`;

const SUGGESTED_PROMPTS = [
  "How do I find LinkedIn posts about my topic?",
  "Generate a reply to my latest post",
  "What's my engagement rate this week?",
  "Help me set up a new campaign",
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { aiConfig } = useSettingsStore();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .slice(-6) // Last 6 messages for context
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `${SYSTEM_CONTEXT}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ''}User: ${content}

Respond helpfully and concisely:`;

      const response = await generateResponse(prompt);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please make sure your AI API key is configured in Settings.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate response using configured AI provider
  const generateResponse = async (prompt: string): Promise<string> => {
    const apiKey = aiConfig.apiKey;

    if (!apiKey) {
      throw new Error('No API key configured');
    }

    // Use the appropriate provider based on settings
    if (aiConfig.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error('OpenAI API error');
      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated.';
    }

    if (aiConfig.provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: aiConfig.model || 'claude-3-5-haiku-20241022',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error('Anthropic API error');
      const data = await response.json();
      return data.content[0]?.text || 'No response generated.';
    }

    // Default to Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model || 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );

    if (!response.ok) throw new Error('Gemini API error');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-600'
            : 'bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]'
        }`}
      >
        {isOpen ? (
          <Icons.X className="w-6 h-6 text-white" />
        ) : (
          <Icons.MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Icons.Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">NEXUS AI</h3>
                <p className="text-xs text-gray-400">Your intelligent assistant</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Icons.RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Icons.Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-medium mb-2">Hi! I'm NEXUS AI</h4>
                <p className="text-sm text-gray-400 mb-6">
                  I can help you with social monitoring, generating replies, and more.
                </p>

                {/* Suggested Prompts */}
                <div className="space-y-2">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      className="w-full text-left px-3 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-primary to-accent text-white rounded-br-md'
                        : 'bg-white/10 text-gray-100 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-[10px] opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            {!aiConfig.apiKey && (
              <p className="text-xs text-yellow-400 mb-2 flex items-center gap-1">
                <Icons.AlertTriangle className="w-3 h-3" />
                Configure AI key in Settings to enable chat
              </p>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={!aiConfig.apiKey || isLoading}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || !aiConfig.apiKey || isLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-white rounded-xl transition-all"
              >
                <Icons.Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChatbot;
