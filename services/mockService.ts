import { SocialPost, AnalyticsData } from '../types';

const AUTHORS = [
  { name: "Alex Rivera", handle: "@arivera_tech", avatar: "https://picsum.photos/150/150?random=1" },
  { name: "Sarah Chen", handle: "@chen_codes", avatar: "https://picsum.photos/150/150?random=2" },
  { name: "Jordan Smith", handle: "@jsmith_marketing", avatar: "https://picsum.photos/150/150?random=3" },
  { name: "Design Daily", handle: "@designdaily", avatar: "https://picsum.photos/150/150?random=4" },
  { name: "Tech Insider", handle: "@tech_insider", avatar: "https://picsum.photos/150/150?random=5" },
  { name: "Crypto King", handle: "@cryptoking", avatar: "https://picsum.photos/150/150?random=6" },
  { name: "Growth Hacker", handle: "@growth_guru", avatar: "https://picsum.photos/150/150?random=7" },
];

const TEMPLATES = {
  positive: [
    "Just tried {brand} and honestly? It's a game changer. 🚀",
    "Huge shoutout to the team at {brand} for the amazing support today!",
    "Finally a solution that actually works. {brand} is slick.",
    "I'm obsessed with the new update from {brand}. So clean.",
    "{brand} just gets it. User experience is 10/10.",
  ],
  negative: [
    "Really disappointed with {brand} today. Server downtime again?",
    "Can someone at {brand} please answer my ticket? It's been 3 days.",
    "The new UI for {brand} is confusing. Why fix what isn't broken?",
    "Ugh, {brand} keeps crashing on mobile. Fix this please.",
  ],
  neutral: [
    "Anyone else using {brand} for their workflow?",
    "Checking out {brand} today. Thoughts?",
    "Comparison: {brand} vs Competitor X. Thread below 👇",
    "Just saw the news about {brand}. Interesting move.",
  ]
};

const PLATFORMS = ['twitter', 'instagram', 'linkedin', 'tiktok'] as const;

export const generateMockPost = (brandName: string): SocialPost => {
  const author = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
  const sentimentRoll = Math.random();
  let sentiment: 'positive' | 'negative' | 'neutral';
  let contentTemplate: string;

  if (sentimentRoll > 0.7) {
    sentiment = 'positive';
    contentTemplate = TEMPLATES.positive[Math.floor(Math.random() * TEMPLATES.positive.length)];
  } else if (sentimentRoll > 0.9) {
    sentiment = 'negative';
    contentTemplate = TEMPLATES.negative[Math.floor(Math.random() * TEMPLATES.negative.length)];
  } else {
    sentiment = 'neutral';
    contentTemplate = TEMPLATES.neutral[Math.floor(Math.random() * TEMPLATES.neutral.length)];
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    author: author.name,
    handle: author.handle,
    avatar: author.avatar,
    content: contentTemplate.replace('{brand}', brandName),
    platform: PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)],
    sentiment,
    timestamp: Date.now(),
    likes: Math.floor(Math.random() * 500),
    shares: Math.floor(Math.random() * 100),
  };
};

export const generateInitialHistory = (brandName: string, count: number = 10): SocialPost[] => {
  return Array.from({ length: count }).map((_, i) => {
    const post = generateMockPost(brandName);
    post.timestamp = Date.now() - (i * 1000 * 60 * 5); // stagger back in time
    return post;
  });
};

export const generateMockAnalytics = (): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  const now = new Date();
  for (let i = 10; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60000);
    data.push({
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      volume: Math.floor(Math.random() * 50) + 20,
      sentimentScore: Math.floor(Math.random() * 40) + 60, // 0-100
    });
  }
  return data;
};
