# Vulcan’s Mind — Chat Widget UX Specification

## UX goal

Visible but not intrusive; scientifically calm; not a generic support widget; mobile-first; accessible; integrated with `motornyi.com`.

## Floating button

Position bottom-right: desktop 24px, mobile 16px + safe area. Size: desktop 64px, mobile/tablet 56px, minimum tap target 44px. Circular button, subtle shadow, warm volcanic accent, visible focus ring.

## Icon

Flat vector icon: simplified outline of a human brain cross-section morphing into a volcano crater with a small eruption/sparks. “Mind blowing” metaphor. SVG-first. Readable at 24–32px. Avoid realistic anatomy, gore, skulls, excessive lava, 3D, text, complex folds.

Required: `public/assets/vulcans-mind-icon.svg`.

## Colors

Button should contrast with current site palette but not clash. Suggested variables: `--vm-button-bg: #d8612c`, `--vm-button-fg: #fff7ed`, `--vm-button-accent: #facc15`. Panel uses main site palette.

## Panel

Desktop width 380–420px, height 560–640px, max-height calc(100vh - 48px). Mobile bottom-sheet/near-fullscreen with safe-area and no horizontal overflow. Rounded corners, subtle border/shadow.

Sections: header, greeting, disclaimer, suggested questions, messages, source cards, input.

## Copy

Greeting: “Вітаю. Я Vulcan’s Mind — AI-бот у контексті роботи, досвіду та дослідницьких інтересів Володимира “Вулкана” Моторного...”

Disclaimer: “Не є медичним сервісом. Відповіді мають інформаційний характер і спираються на обмежену базу джерел.”

Loading: “Шукаю в базі джерел…”

## Accessibility

Focusable launcher, close, input, send, suggested chips. Escape closes panel. Focus returns to launcher. ARIA labels. Reduced motion support.

## Privacy

Messages in memory only. No transcript in localStorage. sessionStorage may store anonymous session id only.

## Integration

Use prefixed CSS classes `vm-*`. Config via `window.VULCANS_MIND_CONFIG = { apiBaseUrl, language }`.
