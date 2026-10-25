## Prompt

You are producing a **static, mobile-only HTML/CSS/JS prototype** from
the reference material I'm sharing with you. The folder contains:

- **Image files** (PNG/JPG/WebP) — the target screens. These are the
  source of truth for layout, typography, color and spatial rhythm.
- **Illustration files** (PNG/SVG) in `assets/illustrations/` — spot and
  hero illustrations to place on specific screens (mapping below).
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
- **Use Material Symbols Rounded** for all icons (via Google Fonts icon
  font or inline SVG). Icon size default 24px, optical size 24,
  weight 400, grade 0, fill 0 (filled variant: fill 1).

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
└── assets/
    └── illustrations/           hero, spot & empty-state illustrations
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
- **Map screens:** use a static map image or a solid `bg/sunken` fill
  with route line drawn as SVG overlay. Do not embed a live map SDK.

#### 5. Edge cases and states

A screen is not finished until it handles:

- Empty / zero / "nothing yet" — explicit empty-state copy with a spot
  illustration where mapped below, never a blank screen.
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
- Color pairs meet WCAG AA on both light and dark themes (all pairs
  verified — see token comments below).
- Focus trap inside modals; Escape dismisses.

#### 7. Design tokens — Safarnaama design system

These are the actual production tokens. Map them into `variables.css`
exactly as shown. Every color is specified for both light and dark mode.

```css
/* ═══════════════════════════════════════════
   SAFARNAAMA DESIGN TOKENS — variables.css
   ═══════════════════════════════════════════ */

:root {
  /* ── Primitive palette ── */

  /* Indigo (primary brand) */
  --indigo-50:  #EFEEF9;
  --indigo-100: #DEDCF2;
  --indigo-200: #BDBAE4;
  --indigo-300: #9894D0;
  --indigo-400: #716DB8;
  --indigo-500: #524E9E;
  --indigo-600: #3D3986;
  --indigo-700: #2B2A6B;
  --indigo-800: #201F52;
  --indigo-900: #16153A;
  --indigo-950: #0E0D24;

  /* Marigold (accent) */
  --marigold-50:  #FFF7EB;
  --marigold-100: #FDEAC9;
  --marigold-200: #FBD493;
  --marigold-300: #F8BE62;
  --marigold-400: #F2A33A;
  --marigold-500: #DB8A1E;
  --marigold-600: #B06C12;
  --marigold-700: #87520F;
  --marigold-800: #5F3A0C;
  --marigold-900: #3D2509;

  /* Sand (neutrals) */
  --sand-0:   #FFFFFF;
  --sand-25:  #FDFBF8;
  --sand-50:  #FAF7F2;
  --sand-100: #F3EFE7;
  --sand-200: #E7E1D6;
  --sand-300: #D3CCBF;
  --sand-400: #ADA698;
  --sand-500: #857F73;
  --sand-600: #655F56;
  --sand-700: #4A4640;
  --sand-800: #2F2C29;
  --sand-900: #1C1A18;

  /* Ink */
  --ink-900: #15142B;
  --ink-700: #3B3A52;
  --ink-500: #5E5D74;

  /* Night (dark mode surfaces) */
  --night-bg:           #0D0C1D;
  --night-surface:      #16152B;
  --night-raised:       #1F1E38;
  --night-overlay:      #28274A;
  --night-border:       #36355C;
  --night-border-strong:#7470B5;

  /* Semantic: Green */
  --green-50:  #E9F6EE;
  --green-100: #CDEBD8;
  --green-400: #4CB97A;
  --green-600: #1F7A4A;
  --green-700: #17603A;

  /* Semantic: Red */
  --red-50:  #FCEDEB;
  --red-100: #F8D4CF;
  --red-400: #F0857A;
  --red-600: #B9322A;
  --red-700: #972820;

  /* Semantic: Amber */
  --amber-50:  #FFF4E0;
  --amber-100: #FFE4B3;
  --amber-400: #F5B13D;
  --amber-700: #8A4B00;
  --amber-800: #6B3A00;

  /* Semantic: Blue */
  --blue-50:  #EAF2FB;
  --blue-100: #CFE1F6;
  --blue-400: #7AB0EA;
  --blue-600: #2462A8;
  --blue-700: #1B4C84;


  /* ── Semantic tokens (light mode) ── */

  /* Backgrounds */
  --bg-canvas:        var(--sand-50);       /* #FAF7F2 — main app bg */
  --bg-surface:       var(--sand-0);        /* #FFFFFF — cards, sheets */
  --bg-raised:        var(--sand-0);        /* #FFFFFF — elevated cards */
  --bg-sunken:        var(--sand-100);      /* #F3EFE7 — inset areas, map placeholder */
  --bg-brand:         var(--indigo-700);    /* #2B2A6B — hero/brand fills */
  --bg-brand-subtle:  var(--indigo-50);     /* #EFEEF9 */
  --bg-accent:        var(--marigold-400);  /* #F2A33A */
  --bg-accent-subtle: var(--marigold-50);   /* #FFF7EB */
  --bg-success-subtle:var(--green-50);      /* #E9F6EE */
  --bg-error-subtle:  var(--red-50);        /* #FCEDEB */
  --bg-warning-subtle:var(--amber-50);      /* #FFF4E0 */
  --bg-info-subtle:   var(--blue-50);       /* #EAF2FB */
  --bg-disabled:      var(--sand-100);      /* #F3EFE7 */
  --bg-inverse:       var(--ink-900);       /* #15142B */

  /* Text */
  --text-primary:     var(--ink-900);       /* #15142B */
  --text-secondary:   var(--ink-700);       /* #3B3A52 */
  --text-tertiary:    var(--ink-500);       /* #5E5D74 */
  --text-disabled:    var(--sand-400);      /* #ADA698 */
  --text-on-brand:    var(--sand-0);        /* #FFFFFF */
  --text-on-accent:   var(--ink-900);       /* #15142B */
  --text-brand:       var(--indigo-700);    /* #2B2A6B */
  --text-accent:      var(--marigold-700);  /* #87520F */
  --text-success:     var(--green-700);     /* #17603A */
  --text-error:       var(--red-700);       /* #972820 */
  --text-warning:     var(--amber-800);     /* #6B3A00 */
  --text-info:        var(--blue-700);      /* #1B4C84 */
  --text-inverse:     var(--sand-50);       /* #FAF7F2 */

  /* Borders */
  --border-subtle:    var(--sand-200);      /* #E7E1D6 */
  --border-default:   var(--sand-300);      /* #D3CCBF */
  --border-strong:    var(--sand-600);      /* #655F56 */
  --border-brand:     var(--indigo-700);    /* #2B2A6B */
  --border-accent:    var(--marigold-500);  /* #DB8A1E */
  --border-error:     var(--red-600);       /* #B9322A */
  --border-success:   var(--green-600);     /* #1F7A4A */
  --border-focus:     var(--indigo-500);    /* #524E9E */

  /* Icons */
  --icon-primary:     var(--ink-900);       /* #15142B */
  --icon-secondary:   var(--ink-500);       /* #5E5D74 */
  --icon-brand:       var(--indigo-700);    /* #2B2A6B */
  --icon-accent:      var(--marigold-600);  /* #B06C12 */
  --icon-success:     var(--green-600);     /* #1F7A4A */
  --icon-error:       var(--red-600);       /* #B9322A */
  --icon-warning:     var(--amber-700);     /* #8A4B00 */
  --icon-info:        var(--blue-600);      /* #2462A8 */
  --icon-on-brand:    var(--sand-0);        /* #FFFFFF */
  --icon-disabled:    var(--sand-400);      /* #ADA698 */

  /* Action (buttons, interactive) */
  --action-primary:         var(--indigo-700);  /* #2B2A6B */
  --action-primary-hover:   var(--indigo-600);  /* #3D3986 */
  --action-primary-pressed: var(--indigo-800);  /* #201F52 */
  --action-on-primary:      var(--sand-0);      /* #FFFFFF */
  --action-secondary-hover: var(--indigo-50);   /* #EFEEF9 */
  --action-secondary-pressed:var(--indigo-100); /* #DEDCF2 */
  --action-destructive:     var(--red-600);     /* #B9322A */
  --action-destructive-hover:var(--red-700);    /* #972820 */
  --action-on-destructive:  var(--sand-0);      /* #FFFFFF */

  /* Overlay */
  --overlay-scrim:    var(--ink-900);       /* #15142B at 40% opacity */


  /* ── Typography ── */

  --font-display: 'Fraunces', 'Georgia', serif;       /* Display, H1, H2 */
  --font-body:    'Figtree', 'Inter', system-ui, sans-serif; /* everything else */

  --fw-regular:   400;
  --fw-medium:    500;
  --fw-semibold:  600;
  --fw-bold:      700;

  /* Type scale (mobile — body never below 16px) */
  --fs-caption:   12px;   /* captions, metadata, timestamps */
  --fs-footnote:  14px;   /* secondary labels, helper text */
  --fs-body:      16px;   /* body text, inputs, list items — minimum body */
  --fs-callout:   18px;   /* callouts, card titles */
  --fs-title3:    20px;   /* section headers */
  --fs-title2:    22px;   /* screen sub-titles */
  --fs-title1:    24px;   /* screen titles */
  --fs-headline:  28px;   /* H2 (Fraunces) */
  --fs-display:   34px;   /* H1 / Display (Fraunces) */

  /* Large display styles (fare, number plate, start code, timers) */
  --fs-large-num: 40px;   /* Figtree Bold — fare amount, countdown */
  --fs-xlarge-num:56px;   /* Figtree Bold — hero numbers */

  --lh-tight:     1.15;   /* display, headlines */
  --lh-snug:      1.3;    /* titles, callouts */
  --lh-base:      1.45;   /* body, footnotes */

  /* Letter spacing */
  --ls-tight:    -0.02em; /* display, headlines */
  --ls-normal:    0;      /* body */
  --ls-wide:      0.04em; /* captions, overlines, all-caps labels */


  /* ── Spacing (4px base grid) ── */

  --s-1:  4px;
  --s-2:  8px;
  --s-3:  12px;
  --s-4:  16px;   /* standard gutter */
  --s-5:  20px;
  --s-6:  24px;
  --s-7:  32px;
  --s-8:  40px;
  --s-9:  48px;
  --s-10: 64px;


  /* ── Radii ── */

  --r-xs:   4px;
  --r-sm:   8px;
  --r-md:   12px;
  --r-lg:   16px;
  --r-xl:   20px;
  --r-2xl:  24px;
  --r-3xl:  28px;
  --r-pill: 999px;


  /* ── Elevation (box-shadow) ── */

  --shadow-xs:  0 1px 2px rgba(21,20,43,0.06);
  --shadow-sm:  0 2px 4px rgba(21,20,43,0.08);
  --shadow-md:  0 4px 12px rgba(21,20,43,0.10);
  --shadow-lg:  0 8px 24px rgba(21,20,43,0.14);


  /* ── Motion ── */

  --dur-fast:  140ms;
  --dur-base:  220ms;
  --dur-slow:  360ms;
  --dur-crawl: 600ms;  /* progress fills, long transitions */

  --ease-out:  cubic-bezier(0.2, 0.8, 0.2, 1);    /* enter / slide in */
  --ease-in:   cubic-bezier(0.4, 0, 1, 1);         /* exit / slide out */
  --ease-std:  cubic-bezier(0.4, 0, 0.2, 1);       /* general purpose */
  --ease-bounce:cubic-bezier(0.34, 1.56, 0.64, 1); /* pop / overshoot */
}


/* ── Dark mode ── */

.phone[data-theme="dark"] {
  /* Backgrounds */
  --bg-canvas:        var(--night-bg);          /* #0D0C1D */
  --bg-surface:       var(--night-surface);     /* #16152B */
  --bg-raised:        var(--night-raised);      /* #1F1E38 */
  --bg-sunken:        var(--night-bg);          /* #0D0C1D */
  --bg-brand:         var(--indigo-800);        /* #201F52 */
  --bg-brand-subtle:  var(--night-overlay);     /* #28274A */
  --bg-accent:        var(--marigold-400);      /* #F2A33A — same */
  --bg-accent-subtle: var(--marigold-900);      /* #3D2509 */
  --bg-success-subtle:var(--green-700);         /* #17603A */
  --bg-error-subtle:  var(--red-700);           /* #972820 */
  --bg-warning-subtle:var(--amber-800);         /* #6B3A00 */
  --bg-info-subtle:   var(--blue-700);          /* #1B4C84 */
  --bg-disabled:      var(--night-raised);      /* #1F1E38 */
  --bg-inverse:       var(--sand-50);           /* #FAF7F2 */

  /* Text */
  --text-primary:     var(--sand-50);           /* #FAF7F2 */
  --text-secondary:   var(--indigo-200);        /* #BDBAE4 */
  --text-tertiary:    var(--indigo-300);        /* #9894D0 */
  --text-disabled:    var(--indigo-400);        /* #716DB8 */
  --text-on-brand:    var(--sand-0);            /* #FFFFFF */
  --text-on-accent:   var(--ink-900);           /* #15142B */
  --text-brand:       var(--indigo-200);        /* #BDBAE4 */
  --text-accent:      var(--marigold-300);      /* #F8BE62 */
  --text-success:     var(--green-100);         /* #CDEBD8 */
  --text-error:       var(--red-100);           /* #F8D4CF */
  --text-warning:     var(--amber-100);         /* #FFE4B3 */
  --text-info:        var(--blue-100);          /* #CFE1F6 */
  --text-inverse:     var(--ink-900);           /* #15142B */

  /* Borders */
  --border-subtle:    var(--night-border);      /* #36355C */
  --border-default:   var(--night-border);      /* #36355C */
  --border-strong:    var(--night-border-strong);/* #7470B5 */
  --border-brand:     var(--indigo-300);        /* #9894D0 */
  --border-accent:    var(--marigold-400);      /* #F2A33A */
  --border-error:     var(--red-400);           /* #F0857A */
  --border-success:   var(--green-400);         /* #4CB97A */
  --border-focus:     var(--marigold-300);      /* #F8BE62 */

  /* Icons */
  --icon-primary:     var(--sand-50);           /* #FAF7F2 */
  --icon-secondary:   var(--indigo-300);        /* #9894D0 */
  --icon-brand:       var(--indigo-200);        /* #BDBAE4 */
  --icon-accent:      var(--marigold-300);      /* #F8BE62 */
  --icon-success:     var(--green-400);         /* #4CB97A */
  --icon-error:       var(--red-400);           /* #F0857A */
  --icon-warning:     var(--amber-400);         /* #F5B13D */
  --icon-info:        var(--blue-400);          /* #7AB0EA */
  --icon-on-brand:    var(--sand-0);            /* #FFFFFF */
  --icon-disabled:    var(--indigo-400);        /* #716DB8 */

  /* Action — NOTE: primary flips to marigold in dark mode
     because indigo-on-near-black fails WCAG 3:1 */
  --action-primary:         var(--marigold-400);  /* #F2A33A */
  --action-primary-hover:   var(--marigold-300);  /* #F8BE62 */
  --action-primary-pressed: var(--marigold-500);  /* #DB8A1E */
  --action-on-primary:      var(--ink-900);       /* #15142B */
  --action-secondary-hover: var(--night-overlay); /* #28274A */
  --action-secondary-pressed:var(--night-border); /* #36355C */
  --action-destructive:     var(--red-400);       /* #F0857A */
  --action-destructive-hover:var(--red-100);      /* #F8D4CF */
  --action-on-destructive:  var(--ink-900);       /* #15142B */

  /* Overlay */
  --overlay-scrim:    var(--night-bg);          /* #0D0C1D at 60% opacity */

  color: var(--text-primary);
}
```

Set `color: var(--text-primary)` and `background: var(--bg-canvas)` on
`.phone` so themed text and background cascade. Do NOT set them on `body`
(which lives outside the theme scope).

Import fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Typography usage rules:
- `font-family: var(--font-display)` + `font-weight: var(--fw-semibold)`
  for Display (`--fs-display`), H1 headings, and H2 (`--fs-headline`).
- `font-family: var(--font-body)` for everything else (body, captions,
  buttons, inputs, labels, nav items).
- Body text is never smaller than `--fs-body` (16px).
- Large numerics (fare amount, countdown timer, start code, number plate)
  use `var(--font-body)` at `--fs-large-num` or `--fs-xlarge-num` with
  `--fw-bold`.

#### 8. Assets handoff

The prototype starts with placeholder illustration slots (colored
`bg/brand-subtle` rectangles with a label). When real illustrations are
added to `assets/illustrations/`, the prototype picks them up
automatically via `<img>` tags with these paths.

**Illustration files live in a local folder. Copy them into
`assets/illustrations/` using the filenames below.** The file names
correspond to the ChatGPT-generated illustrations. Match them to the
screens as listed:

| # | Screen / State                        | Illustration slot              | Suggested filename                     | Format   | Size       | Placement                                    |
|---|---------------------------------------|-------------------------------|----------------------------------------|----------|------------|----------------------------------------------|
| 1 | O1 Welcome (first launch)             | Hero illustration             | `welcome-hero.png`                     | PNG/SVG  | 320 × 280  | Centered above "Your airport ride, sorted"    |
| 2 | Flight cancelled state (section 04)   | Spot illustration             | `flight-cancelled.png`                 | PNG/SVG  | 200 × 160  | Above "AI 864 was cancelled" message          |
| 3 | Ride cancelled / refund (section 04)  | Spot illustration             | `ride-cancelled.png`                   | PNG/SVG  | 200 × 160  | Above "Your ride has been cancelled" message  |
| 4 | No cars in queue (sections 05, 09)    | Spot illustration             | `no-cars-queue.png`                    | PNG/SVG  | 200 × 160  | Centered in empty state card                  |
| 5 | R10 You have arrived (section 08)     | Hero illustration             | `you-are-home.png`                     | PNG/SVG  | 280 × 240  | Above "Welcome home, Ananya"                  |
| 6 | Location permission (section 01)      | Spot illustration             | `location-permission.png`              | PNG/SVG  | 200 × 160  | Above "Use your location" prompt              |
| 7 | Notification permission (section 01)  | Spot illustration             | `notification-permission.png`          | PNG/SVG  | 200 × 160  | Above "Get told only when it matters" prompt  |
| 8 | Bags taking a while (section 05)      | Spot illustration             | `bags-waiting.png`                     | PNG/SVG  | 160 × 120  | Inline in "Bags taking a while?" hold state   |
| 9 | Finding your driver (section 05)      | Spot illustration             | `finding-driver.png`                   | PNG/SVG  | 160 × 120  | Centered in loading/search state              |
| 10| Bag left in car (section 08)          | Spot illustration             | `bag-left-behind.png`                  | PNG/SVG  | 200 × 160  | Above "We have asked Santosh to stop"         |
| 11| Trip complete / rating (section 08)   | Spot illustration             | `trip-complete.png`                    | PNG/SVG  | 240 × 200  | Above "Thanks, Ananya" confirmation           |
| 12| Help empty state (section 08)         | Empty-state illustration      | `help-empty.png`                       | PNG/SVG  | 200 × 160  | Centered in Help tab with no open cases       |

**Implementation rule:** In `screens.js`, each illustration slot renders as:
```js
const img = document.createElement('img');
img.src = `assets/illustrations/${filename}`;
img.alt = descriptiveAltText;
img.loading = 'lazy';
img.onerror = () => {
  // fallback: show colored placeholder
  img.replaceWith(createPlaceholder(label));
};
```
This way the prototype works with or without the illustration files.

Additional asset slots (no illustration needed):

| Where in the UI    | Suggested path                 | Format     | Target size |
| ------------------ | ------------------------------ | ---------- | ----------- |
| App logo           | `assets/logo.svg`              | SVG        | 128 × 128   |
| Favicon            | `favicon.svg`                  | SVG        | 512 × 512   |
| iOS touch icon     | `apple-touch-icon.png`         | PNG        | 180 × 180   |

All assets are referenced relatively, never with a leading `/`.

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
- All illustration slots render gracefully with AND without the actual
  image files present (fallback placeholders).

### Project context

```
<project>
App name:            Safarnaama
One-line pitch:      Airport pickup rides without the chaos — know your
                     driver, bay and walk before you land.
Primary brand color: #2B2A6B (Indigo 700)
Accent color:        #F2A33A (Marigold 400)
Canvas background:   #FAF7F2 (Sand 50)
Theme:               both (light-first, with full dark mode)
Fonts:               Fraunces SemiBold (display/headings) +
                     Figtree (body/UI) from Google Fonts,
                     system-ui fallback

Reference material supplied in this folder:
  Images:            all PNGs in this folder (hi-fi screen captures)
  Illustrations:     assets/illustrations/ (12 spot/hero illustrations)
  Video:             none

Screens to build (money shots — in order of first-run flow):
  1.  O1 Welcome          — onboarding hero with illustration, sign-in CTA
  2.  H1 Home             — upcoming trip card, bottom nav (Home/Trips/Help/Profile)
  3.  B2 Book your arrival — flight number input, date/terminal selection
  4.  B3 Choose your ride  — fare cards (Shuttle ₹349 / Sedan ₹749 / SUV ₹1149),
                             ride comparison, confirm
  5.  R4 Scheduled ride    — "Your ride is confirmed" with flight + driver details
  6.  R5 Welcome to Mumbai — post-landing screen with walk directions teaser
  7.  R7 Walk to Bay 12    — step-by-step walking directions (indoor wayfinding)
  8.  R8 Meet and board    — driver card with photo, car details, number plate,
                             start code, "I'm at the bay" button
  9.  R9 During the trip   — map with route, SOS button, share ride, ETA
  10. R10 You have arrived — "Welcome home" with illustration, fare summary
  11. Rating screen        — star rating + tip + "Thanks, Ananya" illustration
  12. X1 At the exit now   — instant ride flow (skip scheduling, get a car now)

Primary bottom-tab items:
  Home, Trips, Help, Profile

Entities / data model:
  Trip = {
    id, status (scheduled|active|completed|cancelled),
    flight: { number, airline, arrivalTime, terminal, gate, status },
    ride: {
      type (shuttle|sedan|suv), fare, currency,
      driver: { name, photo, rating, carModel, carColor, numberPlate, startCode },
      bay: { number, terminal, walkingTime, walkingSteps[] },
      pickup: { scheduledTime, actualTime },
      dropoff: { address, eta, distance }
    },
    rating: { stars, tip, feedback }
  }

  User = {
    id, name, phone, email,
    savedAddresses: [{ label, address, lat, lng }],
    paymentMethods: [{ type, last4, default }],
    preferences: { theme, notifications }
  }

  WalkingStep = { instruction, landmark, icon, distanceMeters }

Dummy data seeds:
  - User: Ananya, arriving on AI 864 Mumbai (BOM) T2
  - Flight: AI 864, DEL→BOM, arrives 14:35, Terminal 2, Gate 24
  - Driver: Santosh Pawar, 4.8★, White Maruti Ertiga, MH-02-AB-1234,
    start code "S-472"
  - Bay: Bay 12, Terminal 2, 4 min walk
  - Fares: Shuttle ₹349, Sedan ₹749, SUV ₹1149
  - Drop: Ananya's home, Bandra West, 23 km, ~45 min

Interactions worth calling out:
  - Fare cards flip/expand to show ride comparison details
  - Walking directions show step markers with landmark icons
  - "I'm at the bay" button has a pulsing ring animation
  - SOS button is always accessible during active ride (sticky)
  - Start code displayed prominently — driver and rider must match
  - Flight status updates in real-time style (simulated with
    setTimeout cycling through states)
  - Bottom sheet for ride details, cancellation, payment breakdown
  - Rating screen: tap stars, optional tip chips (₹20/₹50/₹100),
    submit with confetti-style feedback

Features intentionally out of scope (mark as WIP):
  - Actual map integration (use static SVG route illustration)
  - Push notifications
  - Payment processing
  - Real flight API integration
  - Multi-language support
  - Accessibility voiceover for walking directions
  - Chat with driver
  - Ride sharing / split fare

Hosting URL you plan to use:
  (fill in before deploy, e.g. https://<user>.github.io/safarnaama/)

Anything else that would surprise the assistant:
  - The app's personality is calm and confident, never anxious. Copy
    should feel like a friend who knows the airport, not a robot.
  - Currency is always ₹ (INR), formatted as ₹X,XXX with no decimals.
  - Time format: 12-hour with AM/PM (2:35 PM, not 14:35).
  - "Safarnaama" means "travelogue" in Hindi/Urdu.
  - The indigo-to-marigold shift in dark mode is intentional — primary
    buttons become marigold with dark ink text for WCAG contrast.
  - Walking directions are the hero feature — treat them with the most
    care and polish.
</project>
```

---

## How to use this prompt

1. Put every piece of reference material (screens, video, brand sheet,
   any extra notes) into one folder alongside this `PROMPT.md`.
2. Copy the illustration files into `assets/illustrations/` using the
   filenames from the table in Section 8.
3. Share the folder — ZIP it, upload it, or open your AI coding tool
   inside it — then paste the content under **## Prompt** as your first
   message.
4. When the assistant finishes, run `python3 -m http.server` locally,
   click through every screen, then push to a GitHub Pages repo
   configured as described in the README.
5. Illustrations are gracefully optional — the prototype renders
   colored placeholders if any file is missing.
