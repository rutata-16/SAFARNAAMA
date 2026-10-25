## Prompt

You are producing a **static, mobile-only HTML/CSS/JS prototype** from
the reference material I'm sharing with you. The folder contains:

- **Image files** (PNG/JPG/WebP) — the target screens. These are the
  source of truth for layout, typography, color and spatial rhythm.
- **Optionally a video file** (MP4/MOV/WebM) — the live interactions:
  tap feedback, screen transitions, modals, gestures, animation timing.

Read every image and watch the video before you write code. If a screen
is referenced in the video but missing from the images (or vice versa),
reconcile from both and name the inferred screen in your README.

### Non-negotiable principles

Everything below is foundational — it applies to every project built
from this prompt. Do not relax a rule to save time; call out gaps in
the README instead.

#### 1. Tech surface

- **No framework.** No React, Vue, Svelte, Angular, Alpine, Tailwind,
  jQuery, Bootstrap, etc. Vanilla HTML, CSS, and ES modules only.
- **No build step.** The repo must open and run from a plain static file
  server (`python3 -m http.server`) and from GitHub Pages with zero
  changes — no npm install, no bundling, no transpilation.
- **No runtime dependencies** beyond fonts from Google Fonts (optional).
  No CDN script tags for libraries.
- **No inline CSS or JS.** Styles live in `.css` files, logic in `.js`
  modules, both referenced from `index.html`. The only inline markup
  allowed is SVG icons (preferred source: a single `icons.js` module
  that exports the markup).
- **Mobile only.** The design never expands to a desktop layout. On
  wider windows, wrap the app in a phone-shaped frame (centered, fixed
  width ≈390px, status bar + home indicator mock); below ~520px drop
  the frame and let the app fill the viewport. Always honor
  `env(safe-area-inset-*)`.
- **All data is dummy and static**, defined in a `data.js` module.
  Mutations and user state go through a `store.js` module backed by
  `localStorage`, with a silent **in-memory fallback** for private
  browsing / disabled storage.
- **Zero image assets required.** Every icon ships as inline SVG from a
  single `icons.js` module so the prototype runs with no `assets/*`
  files. Real imagery is additive — see "Assets handoff" below.

#### 2. GitHub Pages hard rules (critical)

The output must drop into a GitHub Pages repo and work both at the
project root (`username.github.io/repo-name/`) and under a user/org
site (`username.github.io/`). Enforce every item:

- **All paths relative, leading-slash-free.** `css/base.css`, not
  `/css/base.css`. In HTML and inside modules use relative imports
  (`./router.js`, `./icons.js`). Never emit a root-absolute path in
  HTML, CSS (`url(...)`), or JS (`fetch`, `import`, `new URL`).
- **Case-sensitive filenames.** Pages runs Linux; `Icons.js` and
  `icons.js` are different files. Pick one convention (lowercase or
  kebab-case) and match every import exactly.
- **ES modules via `<script type="module" src="js/app.js">`** with a
  `.js` extension — don't rely on `.mjs`.
- **Add `.nojekyll`** at the deploy root so Pages serves files whose
  names start with `_` and does not rewrite paths.
- **Add `404.html`** that is a byte-for-byte copy of `index.html` so a
  deep-link refresh still boots the app.
- **No service worker** unless explicitly requested; sub-path hosting
  scope issues cause more pain than they solve for a demo.
- **No `process.env`, no Node APIs, no `require`.** Browser globals
  only.
- **Favicons and logos** sit alongside `index.html` and are referenced
  relatively.
- **Document deployment** in README: push to `main`, enable Pages on
  `main` / `/ (root)` (or `/docs` if the project is sub-foldered),
  open `https://<user>.github.io/<repo>/`.

#### 3. File layout to produce

Keep every piece in exactly one place, so reusable UI is reusable:

```
<repo-root>/
├── index.html
├── 404.html                     byte-for-byte copy of index.html
├── .nojekyll                    empty file
├── README.md                    run + deploy + what's built / not built
├── css/
│   ├── reset.css                reset + prefers-reduced-motion guard
│   ├── variables.css            design tokens (color, type, spacing, motion)
│   ├── base.css                 body, phone frame, status bar, theme shell
│   ├── components.css           every reusable UI piece: buttons, chips,
│   │                            toggle, checkbox, slider, input, toast,
│   │                            sheet, row, action-bar, header
│   ├── screens.css              per-screen layouts; composes components
│   └── animations.css           named keyframes + route-transition classes
├── js/
│   ├── icons.js                 inline SVG icon map
│   ├── data.js                  dummy entities for every screen
│   ├── store.js                 localStorage adapter + pub/sub + reset
│   ├── components.js            DOM builders for every reusable UI piece
│   ├── router.js                screen stack + enter/exit transitions
│   ├── screens.js               each route as a factory returning a DOM node
│   └── app.js                   entry: route table, initial route, theme
└── assets/                      empty; see "Assets handoff"
```

Rules this layout enforces:

- Every reusable piece has a builder in `components.js` and a matching
  rule in `components.css`. Screens never redefine their own buttons,
  toggles, sliders, chips or inputs.
- Design values live only in `variables.css`. Screens never hard-code a
  color, radius, duration, or spacing value.
- Icons come only from `icons.js`. Don't paste raw SVG into screens.
- Data shape lives only in `data.js`. Screens read via `store.js`.

#### 4. Interactions, animation and feel

Match the reference video. In its absence, apply these defaults:

- **Screen transitions:** slide-in-right for forward, slide-in-left for
  back, fade for modal replacements. Duration ≈220ms, easing
  `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **Buttons / tiles:** scale down ~0.97 on `:active`.
- **Toggles:** thumb slides with easing; animated background.
- **Checkboxes:** check mark draws in with a short pop.
- **Sliders:** colored fill tracks the drag; pointer- *and* keyboard-
  driven (ArrowLeft/Right/Up/Down, Home, End); announce value via
  `aria-valuenow`.
- **Toasts:** slide up, auto-dismiss ~2.5s, auto-stack.
- **Bottom sheets:** slide up from the bottom over a 40%-black overlay;
  dismiss on backdrop tap and Escape.
- **Status/progress feedback** everywhere a state changes.
- **`@media (prefers-reduced-motion: reduce)`** collapses every
  animation and transition to near-zero duration.

#### 5. Edge cases and states

A screen is not finished until it handles:

- Empty / zero / "nothing yet" — explicit empty-state copy, never a
  blank screen.
- Loading — skeletons or spinners sized to the final layout.
- Error — inline error for form fields, toast for operations.
- Validation — required fields block submission with a clear message
  rendered in an `aria-live` region.
- Destructive actions — always behind a confirm sheet.
- Keyboard — Enter/Space activates custom buttons; focus-visible
  outline on every interactive element.
- Storage disabled — in-memory fallback; the UX does not degrade.
- Any feature intentionally left out — carries a visible "Not built
  yet" badge or triggers a "Coming soon" toast. **Never leave a dead
  button.**

#### 6. Accessibility (meet, don't skirt)

- Semantic landmarks: `<main>`, `<nav>`, `<section>`, labelled with
  `aria-label` where needed.
- Correct ARIA on interactive composites:
  - `role="switch"` + `aria-checked` on toggles
  - `role="checkbox"` on custom checkboxes
  - `role="radiogroup"` + `role="radio"` on chip groups / icon pickers
  - `role="slider"` + `aria-valuemin / valuemax / valuenow`
  - `role="dialog"` + `aria-modal="true"` on sheets
- `aria-live="polite"` region for toasts and inline errors.
- `aria-current="page"` on the active bottom-tab item.
- Minimum 44×44 CSS px touch targets on nav + action controls.
- Color pairs meet WCAG AA on both light and dark themes.
- Focus trap inside modals; Escape dismisses.

#### 7. Design tokens (starting point — refine from the reference)

Treat these as a scaffold. Replace every value with what the reference
images actually use; keep the token names.

```
Color
  --bg-app, --bg-surface, --bg-card, --bg-pill
  --ink, --ink-soft, --ink-mute, --ink-faint
  --line, --line-strong
  --accent, --accent-ink, --accent-soft
  --success, --success-soft
Radii: --r-xs 8, --r-sm 12, --r-md 16, --r-lg 20, --r-xl 28, --r-pill 999
Spacing (4pt base): --s-1..--s-8  (4 / 8 / 12 / 16 / 20 / 24 / 32 / 40)
Type:   --fs-micro..--fs-3xl      (11 / 12 / 14 / 15 / 16 / 18 / 22 / 28 / 34)
Line heights: --lh-tight 1.15, --lh-snug 1.3, --lh-base 1.45
Motion: --dur-fast 140ms, --dur-base 220ms, --dur-slow 360ms
Easing: --ease-out, --ease-in, --ease-std (cubic-bezier triplets)
```

Provide a `.phone[data-theme="dark"]` override on the phone root with
accessible dark counterparts. Set `color` on `.phone` so themed text
cascades (not on `body`, which lives outside the theme scope).

#### 8. Assets handoff

The prototype ships asset-free. If brand imagery arrives later, the
convention is a relative path under `assets/`. In the README, publish
this table filled in with the actual slots the project uses:

| Where in the UI    | Suggested path                 | Format     | Target size |
| ------------------ | ------------------------------ | ---------- | ----------- |
| App logo           | `assets/logo.svg`              | SVG        | 128 × 128   |
| Hero / splash      | `assets/hero.jpg`              | JPG / WebP | 1125 × 2436 |
| Illustrations      | `assets/illustrations/<id>.svg`| SVG        | 320 × 240   |
| Photos             | `assets/photos/<id>.jpg`       | JPG / WebP | 800 × 480   |
| Favicon            | `favicon.svg`                  | SVG        | 512 × 512   |
| iOS touch icon     | `apple-touch-icon.png`         | PNG        | 180 × 180   |

New assets are referenced relatively, never with a leading `/`.

#### 9. "Done" definition

- `python3 -m http.server` → every screen reachable, every interaction
  works, no console errors or 404s.
- `git push` to a GitHub Pages repo → the live URL renders identically;
  every CSS, JS and font request returns 200.
- Lighthouse (mobile, incognito) ≥ 95 Accessibility and Best Practices,
  ≥ 90 Performance.
- Resizing between a mobile viewport and a wide desktop reflows
  cleanly; the app itself never grows past phone width.
- README documents: run locally, deploy to Pages, what's built, what's
  marked WIP, and the assets table.

### Project context (fill this in — the only project-specific slot)

```
<project>
App name:
One-line pitch:
Primary brand color (hex):
Theme:                       light-first | dark-first | both
Fonts:                       (default: Inter from Google Fonts, system fallback)

Reference material supplied in this folder:
  Images:                    (list filenames, or "all PNGs in this folder")
  Video:                     (filename, or "none")

Screens to build (in order of first-run flow):
  1.
  2.
  3.
  …

Primary bottom-tab items (if any):
  (e.g. Home, Rooms, Automations, Activity, You)

Entities / data model:
  (e.g. "Scene = { id, name, icon, meta, pinned, actions[{deviceId, value}] }"
   "Device = { id, name, room, type, caps[] }")

Dummy data seeds:
  (optional — list a few sample records or say "invent plausible samples")

Interactions worth calling out from the video:
  (e.g. "progress bar fills between wizard steps",
   "running-scene card pulses on the accent dot")

Features intentionally out of scope (mark as WIP):
  (e.g. notifications, friend invites, cloud sync)

Hosting URL you plan to use:
  (e.g. https://<user>.github.io/<repo>/)

Anything else that would surprise the assistant:
</project>
```

---

## How to use this prompt

1. Put every piece of reference material (screens, video, brand sheet,
   any extra notes) into one folder alongside this `PROMPT.md`.
2. Fill in the `<project>` block above. Leave the rest alone.
3. Share the folder — ZIP it, upload it, or open your AI coding tool
   inside it — then paste the content under **## Prompt** as your first
   message.
4. When the assistant finishes, run `python3 -m http.server` locally,
   click through every screen, then push to a GitHub Pages repo
   configured as described in the README.
5. Hand real brand assets over by dropping them into `assets/` using
   the paths published in the README; swap tokens in `variables.css`
   for brand values — no screen code needs to change.
