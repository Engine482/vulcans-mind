# Public Widget Assets — Vulcan’s Mind

Expected files: `chat-widget.js`, `chat-widget.css`, `assets/vulcans-mind-icon.svg`.

Widget: floating button, custom icon, panel, greeting, disclaimer, suggested questions, input, loading/error states, source cards, clear local chat, responsive/mobile accessibility.

Icon: flat vector brain cross-section outline morphing into volcano crater with small eruption/sparks. SVG-first, readable small, no text, no realism/gore/3D.

Privacy: messages in memory only. No transcript in localStorage/sessionStorage. sessionStorage may hold anonymous session id only.

Config: `window.VULCANS_MIND_CONFIG = { apiBaseUrl, language: "uk" }`.

Use prefixed CSS classes `vm-*` to avoid site collisions.
