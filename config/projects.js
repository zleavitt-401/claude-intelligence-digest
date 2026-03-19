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
      name: "Stream Reader",
      description: "A streaming text reader iOS app that scrolls text horizontally right-to-left at configurable speeds (50-500 WPM) with optional anchor formatting that bolds word beginnings to reduce mind-wandering. Supports a persistent library, share sheet integration for importing articles from Safari, internationalization (CJK/RTL), and beta feedback surveys.",
      stack: ["React 18", "TypeScript", "Vite", "Capacitor 7", "CSS Modules", "Vitest"],
      color: "#3B82F6"
    },
    {
      name: "Starter Repo",
      description: "A static GitHub starter kit for non-technical beginners learning to build web apps with Claude Code. Provides slash commands, reusable AI skills, and an interactive field guide that automate environment setup, project scaffolding, and a guided development workflow (specify → plan → implement).",
      stack: ["Node.js", "GitHub CLI", "Vercel CLI", "Spec Kit", "HTML/CSS", "D3.js", "Claude Code"],
      color: "#8B5CF6"
    },
    {
      name: "Fauxbituaries",
      description: "AI-powered humorous obituary generator for fictional characters from movies, TV, books, and video games. Features 1,094+ characters, 16 humor styles, voting, collections, and an admin panel.",
      stack: ["Vanilla JS", "HTML5", "CSS3", "Firebase Firestore", "Vercel", "Claude 3.5 Sonnet API", "Replicate FLUX.1"],
      color: "#10B981"
    },
    {
      name: "Roost",
      description: "AI-powered life-relocation assistant that helps users discover US locations where they'd thrive. Users upload a resume, answer lifestyle questions, and receive comprehensive location reports assembled by AI agents within 24 hours.",
      stack: ["Next.js 14+", "React 18", "TypeScript", "Tailwind CSS", "Firebase", "Anthropic Claude API", "Nodemailer", "Vercel"],
      color: "#F59E0B"
    },
    {
      name: "Smart Tutor",
      description: "AI-powered interactive learning web app that generates personalized lessons, concept maps, and comparisons using Claude. Features voice interaction (TTS/STT), highlights, session persistence, and a force-directed concept map canvas.",
      stack: ["React 18", "Babel", "Vercel", "Anthropic Claude API", "Mermaid.js", "KaTeX", "Web Speech API"],
      color: "#EF4444"
    },
    {
      name: "Anti-Flag Chess",
      description: "A real-time online chess web app with an in-person chess timer. Implements the Anti-Flag timing variant where players have fixed time per turn with a grace period; expired time triggers auto-moves or grace period effects rather than flagging losses. Includes both online multiplayer games and standalone IRL timer for in-person play.",
      stack: ["TypeScript 5.x", "Next.js 14+", "React 18+", "Tailwind CSS", "Zustand", "Socket.io", "Vitest"],
      color: "#6366F1"
    },
    {
      name: "Conglomerate-App",
      description: "Full-featured digital adaptation of the Conglomerate 2.0 board game supporting local pass-and-play and real-time online multiplayer. Players build business empires, manage supply chains, trade licenses and cards, and use Professional Service Cards to eliminate rivals.",
      stack: ["TypeScript 5.7", "React 19.2", "Vite 7.1", "Firebase Realtime DB", "Vitest"],
      color: "#EC4899"
    },
    {
      name: "Timeline Operator",
      description: "A web application for creating, editing, and visualizing interactive timelines with Firebase authentication and real-time collaboration features.",
      stack: ["React 18", "TypeScript 5", "Vite", "Firebase", "D3.js", "Tailwind CSS"],
      color: "#14B8A6"
    }
  ]
};
