/**
 * Project configuration for Claude Intelligence Digest.
 *
 * Each project entry describes a personal project that news items
 * are scored against. The description should be detailed enough
 * for Claude to accurately assess relevance.
 *
 * @type {import('../lib/types').AppConfig}
 */
module.exports = {
  scoringThreshold: 7,
  maxSearchResults: 10,
  projects: [
    {
      name: "Smart Tutor",
      description: "An AI-powered tutoring application that uses Claude to generate personalized lessons, quizzes, and explanations. Built with React via CDN, Vercel serverless functions, and the Claude API. Features voice synthesis/recognition, session export/import, and a Claude Ecosystem Playground integration.",
      stack: ["react-cdn", "vercel", "claude-api", "speech-api", "javascript"],
      color: "#3B82F6"
    },
    {
      name: "Claude Intelligence Digest",
      description: "This project itself — a daily news digest site that monitors Claude/Anthropic announcements, scores them for relevance against personal projects, and presents them newspaper-style with inline chat. Built with vanilla JS, Vercel KV, and Claude API web search.",
      stack: ["vanilla-js", "vercel", "upstash-redis", "claude-api", "web-search"],
      color: "#8B5CF6"
    },
    {
      name: "Conglomerate App",
      description: "A multi-tenant business management platform with chat capabilities. Uses real-time messaging, project management, and AI-assisted workflows. Interested in Claude API improvements, multi-modal capabilities, and enterprise integration patterns.",
      stack: ["react", "node", "claude-api", "websockets", "postgresql"],
      color: "#10B981"
    },
    {
      name: "TrailLink",
      description: "A trail and outdoor activity tracking application. Uses mapping APIs, GPS data, and social features for sharing routes. Interested in AI for route recommendations, terrain analysis, and natural language trail descriptions.",
      stack: ["react-native", "mapbox", "node", "postgresql", "claude-api"],
      color: "#F59E0B"
    },
    {
      name: "Bionic Line Reader",
      description: "A browser extension and web tool that applies bionic reading formatting to text content. Enhances reading speed by bolding key parts of words. Interested in Claude for text processing, content analysis, and accessibility improvements.",
      stack: ["javascript", "browser-extension", "claude-api", "css"],
      color: "#EF4444"
    },
    {
      name: "Moon Publishing",
      description: "A media and publishing website for content creation and distribution. Features article management, editorial workflows, and audience analytics. Interested in Claude for content generation, editing assistance, and SEO optimization.",
      stack: ["next-js", "vercel", "claude-api", "cms", "analytics"],
      color: "#6366F1"
    },
    {
      name: "Roost",
      description: "A property and real estate management application. Features listing management, tenant communication, and maintenance tracking. Interested in Claude for property descriptions, market analysis, and automated communication.",
      stack: ["react", "node", "postgresql", "claude-api", "stripe"],
      color: "#EC4899"
    },
    {
      name: "Pearler of Africa",
      description: "A cultural heritage and tourism platform focused on African destinations. Features travel guides, cultural content, and booking integration. Interested in Claude for multilingual content, cultural context generation, and travel recommendations.",
      stack: ["next-js", "vercel", "claude-api", "i18n", "stripe"],
      color: "#14B8A6"
    }
  ]
};
