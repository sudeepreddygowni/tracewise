# Tracewise — Product, Design System & Implementation Blueprint

**Version:** 1.0 — design and product specification freeze  
**Prepared:** 15 November 2026  
**Project:** Tracewise — AI-assisted electronics engineering studio  
**Audience:** Claude / coding agents, designers, developers, reviewers, and YIIC 9 mentors  
**Status:** Specification. Features in this document are **not** statements that they have already been built.  
**Primary delivery:** A usable web prototype for the YIIC final presentation; deeper engineering capabilities follow in later releases.

> **Source-of-truth rule:** Do not randomly change this guide's approved palette, typography, project scope, navigation, or user journey during implementation. If a proposed change is necessary, explain why, record the decision, and update this file. Prioritize a small working product over an impressive but nonfunctional website.

---

## 1. Product north star

### 1.1 One-sentence definition

**Tracewise is a beginner-focused electronics workspace where students can open or create a supported circuit, modify its components and Arduino code, compare what changed, investigate failures, and prepare a physical build.**

### 1.2 Signature user journey

**Open → Build → Modify → Check → Compare → Explain → Fix → Save / Share**

For the first demo, a student opens an Arduino Uno traffic-light starter, forks it into an independent version, adds a pedestrian-button idea, makes a supported change, sees the version differences, runs an honest validation check, and gets a helpful explanation of a known issue.

### 1.3 Why this product exists

- **Dheeraj's problem:** Tutorials did not eliminate coding difficulties or uncertainty about physical-circuit testing.
- **Jeevan's problem:** Beginners need a way to practise and learn through small working projects.
- **Koushik's problem:** Project discussions and context get lost when shared only through general messaging groups.

These are three observed needs, not proof that Tracewise is already better than any competitor. The strongest initial hypothesis is **change-aware learning and debugging**: helping a beginner understand precisely how their edits affect a project.

### 1.4 What Tracewise is *not*

- Not merely an AI chatbot with a circuit-themed homepage.
- Not a claim to be the first circuit simulator or the first application with project forks.
- Not a universal electrical simulator in the first release.
- Not a realistic 3D robotics physics engine in the first release.
- Not a public social network or unrestricted messaging app for students.
- Not a promise that passing a virtual check guarantees a safe or working physical circuit.

### 1.5 Product voice and positioning

**Product name:** Tracewise  
**Short positioning:** *Build it. Change it. Understand it.*  
**Homepage primary copy option:** *From a rough idea to a working circuit.*  
**Supporting line:** *Design a project, change its wiring and code, and learn from every version.*  
**Voice:** Simple, curious, practical, student-friendly; no empty claims like “revolutionizing engineering forever.”

---

## 2. Final visual direction — brand identity

### 2.1 Look and feel

**Theme:** Skybound engineering — a precise electronics studio framed by airy blue nature imagery and selective liquid-glass controls.

What users should feel: open space, confidence to experiment, curiosity, visual delight, and engineering clarity. The world-facing site may be atmospheric; the editor must be readable and predictable.

**Inspiration, not imitation:** The shared Dribbble-style images contribute wide landscapes, confident layouts, soft atmosphere, and glass interfaces. Do not reproduce the exact navigation, typography arrangements, hero illustration, or card compositions of those references.

**Signature recurring motif:** A **circuit trace** with two or three terminal nodes. It appears as a subtle decoration in the hero, an actual editable wire inside the studio, and a highlighted difference in the compare screen. This gives the aesthetic a product-specific meaning.

### 2.2 Color philosophy

The uploaded Tracewise logo uses deep navy-to-cobalt letterforms, electric-blue/cyan layers, ice-white light and a curving circuit trace. The brand palette below is a **deliberately normalized design interpretation** of that image, not a pixel-perfect sampling of every glow color.

- **Primary:** midnight navy and cobalt blue.
- **Support:** sky blue, electric cyan, pale ice.
- **Neutral:** cloud white, neutral charcoal, slate.
- **Semantic only:** green for verified success, amber for warnings, red for errors.
- **Do not** bring back lime-green or saturated green as the brand color.
- **Do not** rely on the landscape alone to create text contrast.

### 2.3 Locked palette

| Token | Hex / value | Role | Rules |
|---|---|---|---|
| `navy-950` | `#071831` | Deepest dark surface, dark hero overlay | Not default body background |
| `navy-900` | `#0B2348` | Main dark panels, footer | Use off-white text |
| `navy-800` | `#12365C` | Secondary dark panels | Accessible light text |
| `blue-700` | `#1748B8` | Strong interactive state | Accessible white text |
| `blue-600` | `#1E3FD8` | Signature cobalt / CTA | Primary interactive brand color |
| `blue-500` | `#1976DD` | Secondary actions, links | Verify contrast on white |
| `blue-400` | `#4AA7F2` | Atmospheric sky accent | **Never** small white text on this |
| `cyan-400` | `#2DC5E9` | Circuit signal, halo, decorative light | Visual accent; not body-text color |
| `cyan-200` | `#A5DFFF` | Background bloom / glass highlights | Decorative |
| `ice-100` | `#EBF6FF` | Light tinted section | Large surfaces |
| `ice-50` | `#F5F9FD` | Main application background | Default canvas outside engineering editor |
| `cloud-0` | `#FFFFFF` | Cards, controls, readable panels | Primary light surface |
| `ink-950` | `#10233D` | Main text on light surfaces | Default light-mode text |
| `ink-700` | `#354A65` | Secondary headings / labels | Readable secondary text |
| `slate-500` | `#65778D` | Subdued details and metadata | Check small-text contrast |
| `line-200` | `#D5E4F0` | Standard light borders and dividers | Do not over-border everything |
| `success-700` | `#187A57` | Verified successful test | Never imply simulated test passed |
| `warning-700` | `#9D6418` | Warnings, unsupported setup | With text label |
| `danger-700` | `#BD3546` | Failed validation | With text label |
| `focus-500` | `#2563EB` | Keyboard focus outline | Visible on dark and light |

**Use of logo cyan:** Do not make all buttons cyan. Cyan should highlight active electronic signals and artwork; cobalt is the primary action color.

### 2.4 Semantic color tokens and gradients

```css
:root {
  --tw-brand: #1E3FD8;
  --tw-brand-strong: #1748B8;
  --tw-brand-soft: #EBF6FF;
  --tw-cyan: #2DC5E9;
  --tw-sky: #4AA7F2;
  --tw-bg: #F5F9FD;
  --tw-surface: #FFFFFF;
  --tw-surface-alt: #EBF6FF;
  --tw-text: #10233D;
  --tw-text-secondary: #354A65;
  --tw-text-muted: #65778D;
  --tw-border: #D5E4F0;
  --tw-dark: #071831;
  --tw-dark-surface: #0B2348;
  --tw-on-dark: #F6FAFF;
  --tw-success: #187A57;
  --tw-warning: #9D6418;
  --tw-error: #BD3546;
  --tw-focus: #2563EB;

  --tw-brand-gradient: linear-gradient(115deg, #12365C 0%, #1E3FD8 52%, #2DC5E9 100%);
  --tw-sky-wash: linear-gradient(180deg, #D7EEFF 0%, #F5F9FD 100%);
  --tw-hero-shade: linear-gradient(90deg, rgba(7,24,49,.72) 0%, rgba(7,24,49,.22) 58%, transparent 100%);
  --tw-signal-glow: 0 0 22px rgba(45,197,233,.22);
}

[data-theme="dark"] {
  --tw-bg: #071831;
  --tw-surface: #0B2348;
  --tw-surface-alt: #12365C;
  --tw-text: #F6FAFF;
  --tw-text-secondary: #C8DFF0;
  --tw-text-muted: #9CB8CF;
  --tw-border: rgba(214,236,255,.18);
}
```

**Background constraints:** Nature images occupy designated sections, never the engineering canvas. A navy overlay or an opaque content panel must secure text legibility. Avoid a high-saturation blue overlay over already-blue mountain photographs.

### 2.5 Glass materials — where to use them

**Marketing glass:** translucent nav, CTA cluster, small floating labels, featured project gallery cards. Typical visual target:

```css
.glass-light {
  background: rgba(255,255,255,.26);
  border: 1px solid rgba(255,255,255,.48);
  box-shadow: 0 12px 34px rgba(15,54,99,.12);
  backdrop-filter: blur(18px) saturate(1.12);
  -webkit-backdrop-filter: blur(18px) saturate(1.12);
}
```

**Operational panels:** mostly opaque white/ice or navy. Text editors, validation logs, inspectors, breadboard outlines, and buttons handling precise engineering actions **must not** inherit full liquid-glass distortion.

**ReactDrops Bubble UI:** reserved for selected high-impact actions and controls where it is installed and performs well. Preserve its actual component source and built-in keyboard/reduced-motion/CSS fallbacks; don't fake the shader with basic blur. On light theme use the approved **Light glass** preset, on dark theme use **Rainbow glass**. Avoid using a different preset unless explicitly selected.

### 2.6 Rounded corners, spacing, depth, grid

- Spacing system: `4, 8, 12, 16, 24, 32, 48, 64, 96 px`.
- Layout max width: `1240–1320px`; content gutters `24px` desktop, `16px` mobile.
- Marketing cards radius `20–28px`; buttons `14–22px` or true pills; editor panels `12–16px`.
- Shadow system: mostly soft cool shadows; strong glow only on one key interactive element at a time.
- Section vertical padding desktop `88–120px`, mobile `52–72px`.
- Engineering workspace uses a consistent 3-column grid, compact spacing and stronger dividers.
- Use 8px grid internally for alignment; no random offsets, no floating cards without a meaningful visual reason.

### 2.7 Theme distribution across pages

| Section / page | Palette and imagery | Purpose |
|---|---|---|
| Home hero | Blue Himalayan sky + controlled navy readability overlay | Emotional first impression + obvious CTA |
| How it works | Cloud white / ice | Explain workflow with animated circuit traces |
| Feature / debug story | White + navy comparison panel | Show differentiator and real product |
| Project showcase | Green valley / wide landscape **only here** + glass gallery | Make discovery inviting |
| Engineering Studio | Mostly ice-white with navy code editor; no nature photo | Accurate, uninterrupted work |
| Compare & Debug | White / navy structured diff + semantic highlights | Clarity over spectacle |
| Physical build guide | Warm white / ice | Readable instructions and checklist |
| Community preview | White with blue accents | Private-by-default, curated, calm |
| Footer | Navy-to-sky wash | Distinct closing state |

---

## 3. Typography — approved font system

### 3.1 Fonts to use

| Font | Usage | Design rule |
|---|---|---|
| **Montserrat** | Hero, marketing display headlines, important section titles | Bold/semi-bold with controlled negative letter spacing; never all uppercase paragraphs |
| **Google Sans Flex** | Body, navigation, buttons, workspace chrome, cards, labels, onboarding | Main UI family, highly legible and modern |
| **JetBrains Mono** | Arduino code, pin IDs (`D2`, `GND`), version IDs, diagnostic logs | Use only where technical alignment matters |

**Why not more fonts?** Three *purposeful roles* are already sufficient. Random font mixing makes a site feel template-generated. If Montserrat display looks too heavy in a particular section, adjust its weight/size before introducing another typeface.

Google Sans Flex was released as an open-source typeface; verify the installed font's license and load it from an authorized package such as `@fontsource/google-sans-flex` or a supported Google Fonts endpoint. Montserrat and JetBrains Mono also need normal font-license compliance. **Do not distribute font files separately to reviewers.**

### 3.2 Type scale

| Element | Desktop | Mobile | Weight / family |
|---|---|---|---|
| Hero title | `clamp(3.5rem, 5.4vw, 5.8rem)` | `clamp(2.5rem, 9vw, 3.6rem)` | Montserrat 700–800; tracking `-0.055em` |
| Section heading | `clamp(2.4rem, 4vw, 4.4rem)` | `2.2–2.8rem` | Montserrat 650–750; tracking `-0.045em` |
| Feature headline | `1.5–2rem` | `1.3–1.6rem` | Montserrat 650–700 |
| Body lead | `1.15–1.25rem` | `1.05–1.15rem` | Google Sans Flex 400–500; line-height `1.5` |
| Body | `1rem` | `0.98rem` | Google Sans Flex 400–500; line-height `1.55–1.65` |
| UI label | `.875–1rem` | `.875rem` | Google Sans Flex 500–650 |
| Code | `.8125–.95rem` | `.8125rem` | JetBrains Mono 400–500; line-height `1.55` |

### 3.3 Baseline CSS

```css
:root {
  --font-display: 'Montserrat', 'Google Sans Flex', system-ui, sans-serif;
  --font-ui: 'Google Sans Flex', 'Montserrat', system-ui, sans-serif;
  --font-code: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
}
body { font-family: var(--font-ui); color: var(--tw-text); }
h1,h2,h3,.display { font-family: var(--font-display); }
code,pre,.pin-label,.diagnostic { font-family: var(--font-code); }
```

Use `font-display: swap`, preload only fonts actually needed for the first viewport, and test fallback metrics to avoid layout shifts. Do not bake headings into nature images.

---

## 4. Assets — logo, imagery and product visuals

### 4.1 Approved source assets

Treat these as **reference/asset files** to be provided with this Markdown guide; the project should not guess they exist online:

| File | Use | Important note |
|---|---|---|
| `tracewise_glass_circuit_logo.png` | Official proposed Tracewise wordmark | Transparent RGBA; optimize/crop blank transparent margins before use; maintain aspect ratio |
| `tracewise_from_ideas_to_circuits.png` | Hero visual direction / reference | May contain mock product UI, **not** a genuine working app screenshot |
| `tracewise_projects_in_a_dreamy_valley.png` | Project gallery mood reference | Do not show generated claims/test results as real |
| `tracewise_electronics_copilot_in_the_mountains.png` | Engineering/AI section mood reference | Reference composition, not the final editor |
| User-generated Google Flow Himalayan landscape | Actual hero background candidate | Must contain **no** text/UI; include safe alt handling |
| User-generated Google Flow green valley landscape | Gallery background candidate | Use only in appropriate public-facing section |
| User-provided Dribbble screenshots | Mood/interaction references | Do not clone branded assets, logos, layouts, or testimonials |

**Logo handling:** Create a transparent PNG optimized for the navigation and a small icon-only crop from the existing mark; a true SVG recreation may be made later **only if it faithfully represents the approved mark**. Provide an alternate white/navy treatment if contrast requires it, without inventing a different logo.

**Images in finished product:** If a concept image depicts interface controls, do not use it as a substitute for clickable controls. Real text, real controls, real states must be HTML/React elements layered separately.

**Motion:** background remains a subtle scene, not continuously swirling UI wallpaper. Parallax is optional and very subtle; no scroll hijacking.

### 4.2 Electronic component art rules

- The **real editor** uses consistent 2D component illustrations with accurate named pins, a stable coordinate system and clear connection nodes.
- Use SVG for board outlines, LEDs, resistors, buttons and wires. Use recognizable Arduino Uno labeling and mechanical form.
- A photorealistic 3D decorative hero object may exist, but it must not be confused with the working editor or actual simulation.
- Avoid generic fake Arduino brand graphics and invented pinouts. Where a board/pin detail matters, verify with technical reference data.
- 3D orbiting is a **later enhancement**. Do not ship a CSS-rotated flat image advertised as a working 3D engineering view.

---

## 5. Information architecture and routes

The initial implementation is one React **web** application with separate routes. We do **not** need React Native for the current desktop-focused web MVP.

| Route | Page | Main purpose | Launch tier |
|---|---|---|---|
| `/` | Marketing Home | Purpose, demo story, CTA, product differentiator | **MVP** |
| `/app` | Project Dashboard | Create/open project, local recent work, starters | **MVP** |
| `/app/studio/:projectId` | Engineering Studio | Edit components/wires/code; save; propose changes | **MVP** |
| `/app/compare/:projectId` | Compare & Debug | Show version changes; identify known check failures | **MVP** |
| `/app/build/:projectId` | Build Guide | Bill of materials, connection reference, checklist | **MVP basic** |
| `/projects` | Explore Projects | Curated starter gallery + fork action | **MVP basic** |
| `/learn` | Practice Lab | Beginner challenges with progression | **Post-MVP or one demo exercise** |
| `/community` | Community Preview | Curated projects; no public chat | **Post-MVP** |
| `/settings` | Preferences | Motion, theme, local storage/export options | **Optional MVP** |
| `/about` or `/faq` | About / Help | Honest capabilities, safety, FAQ | **MVP** |
| `*` | Not Found | Return-home link | **MVP** |

For the first launch, routes can use `react-router-dom`. No fake signup form or authentication gates if user accounts are not implemented.

### 5.1 Global navigation

**Public:** Logo · Product · How it Works · Projects · FAQ · **Open Studio**.  
**Inside application:** Logo · My Projects · Explore · Studio · (Practice if available) · Settings.  
**Studio toolbar:** Project name/version · Fork · Save · Undo/Redo · Compare · Validate · Build Guide.

Every visible navigation item must go somewhere meaningful. Planned features may be clearly labeled **Coming later** and not displayed as a functional action.

### 5.2 Public homepage storyboard

1. **Hero — imagine:** Himalayan sky; Tracewise logo, bold headline, concise copy, project-entry composer, primary CTA, stylized but honest Arduino preview. Motion: restrained headline reveal, one signal path draws in.
2. **Three entry paths:** Create using a supported AI demo, start manually, remix a starter. Use clear states and entry points.
3. **Edit the real circuit:** Large *actual* studio preview or recording linked to workspace. Explain component placement, wires, and Arduino code.
4. **Change-aware debugging:** Original and remix; highlight wiring/code deltas and known test results. This section needs the strongest product storytelling.
5. **Virtual to physical:** Component list and guide overview; caveat that digital checks cannot guarantee physical behavior.
6. **Explore projects:** Green-valley scene with curated project thumbnails in Fan Gallery; links open actual starter previews.
7. **FAQ and closing CTA:** Honest limitations and direct route to the studio.

**No fake customer logos, stats, investor names, testimonials, safety guarantees, or claims such as “150K engineers” unless validated.**

---

## 6. Workspaces — precise UX and functional contracts

### 6.1 Project Dashboard (`/app`)

**Layout:** Full-width light page, simple title block, primary Create button, project list/grid, curated starters. No giant scenery taking attention away from saved projects.

**Features:**
- Create blank Arduino Uno project.
- Open sample Traffic Light project.
- Reopen projects from browser storage.
- Duplicate/fork project; rename and delete with confirmation.
- Display `Last modified`, component count, and version label from real project data.
- Project search, at least title-based.
- Import/export project JSON for portability (recommended MVP).

**Empty state:** Show a single starter card and a clear “Create a project” action. **Do not** show fake saved projects as if created by the user.

### 6.2 Engineering Studio (`/app/studio/:projectId`)

**Desktop layout:**

```
┌───────────────────────────────────────────────────────────────────┐
│ Tracewise | Project ▼ | Fork | Compare | Undo | Save | Validate  │
├────────────────┬────────────────────────┬─────────────────────────┤
│ COMPONENT      │ CIRCUIT CANVAS         │ RIGHT PANEL             │
│ LIBRARY        │                        │ Tabs: Code / Assistant  │
│ Search         │ [Arduino Uno]          │ / Inspector             │
│ Uno            │     wires              │                         │
│ Breadboard     │ [LED R Y G] [Button]   │ Arduino C++             │
│ LEDs           │                        │ selected part data      │
│ Resistor       │ Move/Connect/Zoom      │ reviewable proposal     │
│ Push Button    │                        │                         │
├────────────────┴────────────────────────┴─────────────────────────┤
│ Problems / Checks / Version Notes / Result log                   │
└───────────────────────────────────────────────────────────────────┘
```

**Canonical representation:** One structured `Project` state drives the canvas, code editor, versions and test/check results. UI cards must not each own incompatible versions of the circuit.

**Studio interactions — must be real:**
- Select and move components; update `x,y` positions in state.
- Create/remove wires between supported actual pins; selection and endpoint hover.
- Search library and add an allowed component.
- Edit code and persist changes in project state.
- Undo/redo changes with predictable history and limits.
- Fork: new project ID and parent reference; original must remain unchanged.
- Save and restore (localStorage/IndexedDB); notify when storage fails.
- View a component's properties and attached pin connections.
- Change project name and inspect version label.
- Validate: run **honestly defined** circuit-structure rules.
- Keyboard: select, delete selected wire, escape current tool, focus visible panels.

**Not yet supported:** Arbitrary electronics, electrical SPICE simulation, real waveform behavior, physical safety guarantee, unsupported parts, and unvalidated AI code generation.

**Responsive:** On mobile use view tabs (Components / Canvas / Code / Checks). The desktop editor is primary; do not make the canvas unusably small just to preserve all three columns.

### 6.3 Version Compare & Debug (`/app/compare/:projectId`)

**Purpose:** Make the product's differentiator concrete, not a generic side-by-side image.

- Pick **Original/Baseline** and **Current/Fork** project versions.
- Show changed components: `added`, `removed`, `edited`.
- Show changed wires: `connection created`, `connection removed`, `endpoint changed`.
- Show readable Arduino code diff, with line additions/removals.
- Show change count and timestamp from saved data.
- Show validation result from actual supported checks, with exact scope and limitations.
- Highlight an issue tied to a detectable project-state difference (not invented AI certainty).
- Offer `Return to Studio`, `Undo this change`, `Save as version`.

**Demo problem:** Traffic-light project fork adds a pedestrian button, but a mismatched button pin is introduced. The comparison identifies the changed pin/wire or code reference, and a **deterministic** rule flags the mismatch where supported. This is not an electrical simulation.

**AI enhancement:** Later, an assistant may formulate a beginner-friendly explanation using the diff and validated test data. AI suggestions must be labeled as proposals and reviewable.

### 6.4 Physical Build Guide (`/app/build/:projectId`)

- Read-only component list from the actual project state.
- Read-only connection map, grouped by component.
- Beginner-level guided checklist for supported low-voltage circuits with appropriate supervision.
- Print/export a short connection reference if feasible.
- Clearly state that digital validation does not guarantee the real setup will behave identically.
- If the student lacks a supported component, say so; do not invent replacement instructions.
- No high-voltage, mains, or hazardous experimentation workflows.

### 6.5 Explore / Starter Gallery (`/projects`)

- Five or fewer high-quality **real starter records**; begin with Uno traffic light, LED blink, button-controlled LED; add more only if their data and demo are actually present.
- Fan Gallery is a visual discovery element using **project thumbnail images**, not generic art or fake product screenshots.
- Each starter has a description, skill level, component list, open/fork action, and verified support label.
- Distinguish `Starter`, `Demo`, `Coming soon`, and `Community` types.
- On `Fork`, create independent local project and open it in the Studio.

### 6.6 Practice Lab (`/learn`) — optional at launch

- Beginner challenge cards: identify a component; change a blink interval; find one bad connection; compare changed code.
- Educational feedback should explain **why** something changed, not merely say “wrong.”
- Only one practice exercise needs to be functional for the first showcase.
- Avoid invented personalized performance metrics if completion tracking is not implemented.

### 6.7 Community Workspace (`/community`) — controlled future scope

The longer-term user need: Koushik and peers want to discuss projects **with relevant circuit/code context**, not in a scattered WhatsApp chat.

Potential features:
- Curated, school-safe project showcase with attribution and explicit sharing choice.
- Fork lineage and versions.
- Comments or questions **attached to a component, version or code change**, not unrestricted chat; requires moderation and appropriate permissions.
- Report/block/moderate functions, restricted profile visibility, no public personal contact details.
- Private by default for student accounts, and no open direct messaging between minors.

**At first launch:** show curated starters only, or mark community features clearly as planned. Do not ship an unsafe unmoderated feed to fulfill a visual requirement.

### 6.8 Future Robotics Studio and 3D Inspector

Keep these on the roadmap; do not build them during the short YIIC launch sprint.

- **Robotics:** line-following track, supported motion model, sensor readings, code-to-motion interaction, scenario replay.
- **3D inspector:** actual orbit, pan, zoom, component selection, and a one-to-one mapping to the exact 2D project graph.
- **Photo review:** evidence-based, uncertain where wires are obscured; must not claim to certify hardware safety.

---

## 7. Feature inventory and release priorities

**Legend:** `MVP` = must work for showcase; `MVP-Lite` = small honest demonstration; `Next` = after showcase; `Later` = longer-term.

| Area | Feature | Tier | Definition of acceptance |
|---|---|---|---|
| Brand | Logo, nature hero, structured landing page | MVP | Responsive, text readable, CTA functional |
| Design | Montserrat / Google Sans Flex / code font system | MVP | Fonts loaded with fallbacks, predictable hierarchy |
| Navigation | Multi-route experience | MVP | All visible links work; no dead buttons |
| Gallery | Fan Gallery with real project images | MVP-Lite | Cards open real starter records, keyboard usable |
| Motion | AnimatedContent and minimal bespoke circuit motion | MVP | Smooth entrance + reduced-motion fallback |
| Dashboard | New/open/rename/fork project | MVP | Persisted across refresh |
| Workspace | Uno, breadboard, LEDs, resistors, button, wires | MVP | Real editable state with pin endpoints |
| Workspace | Arduino C++ editor | MVP | User edits persist, code readable |
| Workspace | Save, undo/redo, JSON export | MVP | No silent data loss in tested paths |
| Versions | Fork and snapshots | MVP | Original preserved, edits isolated |
| Compare | Component/wire/code diff | MVP | Generated from saved project state |
| Testing | Connection/pin rule checks | MVP | Honest status; no false simulation claims |
| Debug | Known traffic-light/pedestrian error explanation | MVP-Lite | Based on actual diff + check results |
| AI | Conversational model-connected copilot | Next | Server-side API, schema validation, reviewable actions |
| AI | Structured project generation via second model | Next | Generates actual project data and handles invalid output |
| Compile | Arduino CLI integration | Next | Real tool output with stderr and version details |
| Simulation | Real limited circuit behavior | Next | Deterministic supported model with tests |
| Build | BOM and connection checklist | MVP-Lite | Derived from project state; no unsafe claims |
| Discover | Curated starter cards | MVP | No fake user-generated community |
| Community | Version-context discussion, moderated sharing | Later | Student privacy and moderation implemented |
| 3D | Orbitable hardware inspection | Later | Genuine 3D controls; matches project state |
| Robotics | Line follower physics/sensor simulation | Later | Tested simulation model |
| Accounts | Auth/cloud sync | Next | Verified access and permissions; no public secrets |

**Schedule:** The combined-session transcript mentions a Saturday 7:00 p.m. assignment deadline and the last session on 21 November; confirm the actual deadline in the YIIC dashboard rather than treating the transcript as an unchangeable schedule.

**Launch-defining promise:** A user can **open a real editable starter → change it → save a fork → inspect the diff → run an honest check → understand an issue**. This is more valuable than seven polished pages with buttons that do nothing.

---

## 8. Technical architecture — web first

### 8.1 Stack decisions

- **App framework:** React + Vite; JavaScript ES modules and plain CSS initially. Fits the user's JS-CSS component preferences and quick feedback loop.
- **Routing:** `react-router-dom`.
- **State:** One authoritative project model in a small Zustand store or equivalent; avoid fragmented state.
- **Circuit drawing:** SVG-based board/pin/components with a canvas coordinate system; React Flow may help only if it respects precise pin endpoints and data model.
- **Code editor:** Monaco when feasible; a smaller editor/textarea can ship first, then swap in Monaco without changing project state.
- **Motion:** GSAP used sparingly; React Bits `AnimatedContent` for deliberate reveal patterns.
- **Gallery:** ReactDrops `FanGallery` using documented props.
- **Liquid glass:** ReactDrops `soap-bubble` selectively, if installable and performant.
- **Persistence MVP:** LocalStorage or IndexedDB + JSON export/import; schema versioning required.
- **Backend (next):** Node.js API service; validation and AI routing server-side.
- **Cloud storage (next):** One supported database service with explicit user access rules; do not add Firebase merely as decoration.
- **Deployment:** GitHub repository → Vercel for the React app. Backend hosting only when actually implemented.
- **No React Native** now: this is a web application with mobile-responsive marketing and desktop-first editor.

**Rationale:** The user's requested Fan Gallery/AnimatedContent/Soap Bubble components are React components; merely making a static single `.html` artifact and dropping JSX into it will fail. **A single-page experience can still use React routes/components.** Build the *real web app* with React from day one; a standalone HTML export may be a showcase-only artifact, not the source project.

### 8.2 Suggested folder tree

```text
tracewise/
├── README.md
├── TRACEWISE_IMPLEMENTATION_GUIDE.md
├── package.json
├── index.html
├── public/
│   └── assets/
│       ├── brand/
│       │   ├── tracewise-logo.png
│       │   └── tracewise-mark.png
│       ├── backgrounds/
│       │   ├── himalayan-hero.webp
│       │   └── green-valley.webp
│       ├── starters/
│       │   ├── traffic-light.webp
│       │   ├── led-blink.webp
│       │   └── button-led.webp
│       └── previews/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── routes/
│   │   ├── HomePage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── StudioPage.jsx
│   │   ├── ComparePage.jsx
│   │   ├── BuildGuidePage.jsx
│   │   ├── ProjectsPage.jsx
│   │   ├── LearnPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── components/
│   │   ├── brand/
│   │   ├── layout/
│   │   ├── landing/
│   │   ├── studio/
│   │   │   ├── CircuitCanvas.jsx
│   │   │   ├── ComponentLibrary.jsx
│   │   │   ├── ComponentInspector.jsx
│   │   │   ├── WireLayer.jsx
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── ValidationPanel.jsx
│   │   │   └── ProposedChangeReview.jsx
│   │   ├── compare/
│   │   ├── ui/
│   │   ├── fan-gallery/     # official installed vendor code
│   │   └── soap-bubble/     # official installed vendor code, if used
│   ├── animations/
│   │   └── AnimatedContent.jsx
│   ├── design/
│   │   ├── tokens.css
│   │   ├── typography.css
│   │   ├── globals.css
│   │   └── motion.css
│   ├── data/
│   │   ├── starterProjects.js
│   │   └── componentCatalog.js
│   ├── domain/
│   │   ├── projectSchema.js
│   │   ├── circuitRules.js
│   │   ├── compareVersions.js
│   │   └── projectActions.js
│   ├── store/
│   │   └── useProjectStore.js
│   ├── services/
│   │   ├── projectStorage.js
│   │   ├── aiService.js
│   │   ├── validationService.js
│   │   └── simulationService.js
│   └── tests/
└── docs/
    ├── architecture.md
    └── QA_CHECKLIST.md
```

### 8.3 Source-of-truth project schema

Example **conceptual** shape; adjust exact implementation with versioned migrations, but preserve relationships:

```js
const project = {
  schemaVersion: 1,
  id: 'project-001',
  title: 'Arduino Traffic Light',
  boardId: 'uno-1',
  components: [
    { id: 'uno-1', type: 'arduino-uno', x: 120, y: 180, props: {} },
    { id: 'led-red', type: 'led', x: 420, y: 180, props: { color: 'red' } }
  ],
  connections: [
    { id: 'wire-001', from: { componentId: 'uno-1', pinId: 'D2' }, to: { componentId: 'led-red', pinId: 'anode' } }
  ],
  firmware: { language: 'arduino-cpp', files: [{ path: 'main.ino', content: '// Editable source code' }] },
  version: { id: 'v1', parentId: null, savedAt: null, label: 'Baseline' },
  history: [],
  validationResults: [],
  visibility: 'private'
};
```

**Validation invariants:** `boardId` identifies an existing board component; every connection references existing component IDs and pins; component IDs unique; no invalid dangling edges after delete; snapshot/fork IDs new; user-entered code never silently overwritten; current project and saved version are separate; no AI-suggested edits apply without explicit review.

### 8.4 Versioning and comparison

- Save immutable snapshots with `snapshotId`, `parentSnapshotId`, `projectId`, timestamp and optional label.
- Fork creates **new project ID**, records source project/version, copies snapshot, and leaves the source untouched.
- Diff components by stable IDs/type/props; diff wires by stable endpoints; diff firmware by content (line-level algorithm).
- Display both the human-readable diff and structured machine diff.
- An error explanation cites only checks actually performed; uncertain issues use “possible cause.”

### 8.5 Distinguish checks from simulation and compilation

A useful explicit status model:

| Status | Meaning |
|---|---|
| `not_run` | No check performed |
| `structurally_valid` | Component/pin/wire references pass defined rules only |
| `structurally_invalid` | One or more defined reference/wiring rules fail |
| `compile_passed` | Actual board-targeted compilation succeeded |
| `compile_failed` | Actual compiler produced errors |
| `simulation_passed` | Supported behavior was executed and the test assertions passed |
| `simulation_failed` | Supported behavior ran and failed one or more assertions |
| `unsupported` | This project/test is not supported; cannot claim pass or fail |

**Never label a visual animation, wiring heuristic or LLM answer as `simulation_passed`.** Keep the origin (`static_check`, `arduino_cli`, `simulator`, `demo`) in every result.

### 8.6 AI contracts for later integration

- Separate **student conversation** from **engineering action proposals**.
- The model outputs structured proposals: `addComponent`, `removeComponent`, `connectPins`, `disconnectPins`, `updateCode`, `explainFailure`.
- Validate any AI output against project schema, supported catalog and current project version.
- Show changes as a reviewable diff; Apply / Reject / Undo.
- Backend mediates secrets, access, rate limits and validation; never embed API keys in frontend.
- Use appropriately authorized providers whose terms permit the target student audience; do not route minors to a provider contrary to its terms.
- Use deterministic tools for compilation and supported simulation, not model confidence.
- The mock copilot must have visible **Demo assistant** labeling until a working integration exists.

### 8.7 Privacy and community boundaries

- New projects **private by default**.
- No required real name, school name, email, phone, or personal location for the MVP.
- Don't publish contact details or user projects without a clear action and permission.
- No open direct messaging for school-age users in the early community.
- Don't accept executable untrusted code into the backend without appropriate isolation.
- Never commit `.env` files or provider keys to a repository.
- Document storage location, export/delete behavior, and any moderation restrictions.

---

## 9. Motion and interactive component specification

### 9.1 Motion principles

**Engineering-motivated movement:** connect, route, assemble, split, highlight, compare, settle.  
**No:** floating AI orbs everywhere, exaggerated bounce, continuous parallax, flashing LEDs on unrelated sections, fake computer terminals or long intro delays.

- Hero headline: small staggered rise + fade, approximately `500–800ms`.
- Nav: `180–300ms` introduction.
- CTA/controls: hover `150–220ms`.
- Section entrance: `500–750ms`, triggered once as visible.
- Circuit trace: draw a short path, `700–1200ms`, only where useful.
- Respect `prefers-reduced-motion: reduce`; essential content must remain visible with animations disabled.
- Avoid performing heavy WebGL shading inside the editable canvas while wires are dragged.

### 9.2 React Bits AnimatedContent

Use the **JavaScript + CSS** variant with GSAP for purposeful reveals (not every text block). Source: https://www.reactbits.dev/animations/animated-content . The user supplied the complete JSX source in the project conversation; preserve its cleanup, ScrollTrigger, and reduced-motion logic. Prefer vendor source over reimplementing the algorithm.

```jsx
import AnimatedContent from './animations/AnimatedContent';

<AnimatedContent
  distance={64}
  direction="vertical"
  duration={0.75}
  ease="power3.out"
  blur={0}
  stagger={0.08}
  threshold={0.1}
  trigger="scroll"
  once
>
  <h2>Every change tells a story.</h2>
  <p>See what changed, test what matters, and understand why.</p>
</AnimatedContent>
```

### 9.3 ReactDrops Fan Gallery

Official source: https://reactdrops.dev/components/gallery/fan-gallery  
Registry installation:

```bash
npx shadcn@latest add https://reactdrops.dev/r/fan-gallery.json
```

Use **actual Tracewise starter project thumbnails**, not the vendor demo's art-file paths. Preferred configuration, derived from the user's selected settings:

```jsx
import { FanGallery } from './components/fan-gallery';

<FanGallery
  items={projectItems}
  cardWidth={162}
  aspectRatio={0.8}
  spacing={0.69}
  curve={0.14}
  tilt={14.5}
  lift={42}
  spread={0.2}
  stackFrom="left"
  speed={0.7}
  stagger={0.09}
  bounce={0.35}
  hoverSpeed={0.28}
  radius={18}
  entrance="stack"
  trigger="scroll"
  viewportStart={75}
  once
  showTitle={false}
/>
```

Make each card have a distinct actual title/alt and an Open/Fork destination; preserve focus/tap behavior and responsive fitting. If no usable project thumbnails exist, use temporary clearly marked starter illustrations with correct project names, **not** generated false screenshots of verified tests.

### 9.4 ReactDrops Soap Bubble UI (selective)

Install only in the React app and keep actual vendor implementation:

```bash
npx shadcn@latest add https://reactdrops.dev/r/soap-bubble.json
```

Use the user's approved settings stored in the project conversation. The key preset behavior is:

- Light pages: **Light glass**.
- Dark pages: **Rainbow glass**.
- Preserve explicitly configured oil-film, drainage, reflection, refraction and other material parameters, including zero values.
- Keep shared WebGL context/backdrop capture, responsive controls, pointer feedback, keyboard and reduced-motion fallbacks.
- Candidate placements: one primary CTA, small public nav controls, project gallery control. Studio interactions should prioritize crisp, stable native controls.
- If shader performance or install issues block launch, ship accessible CSS buttons **clearly as a temporary fallback** and document the deviation; don't falsely claim Soap Bubble was installed.

### 9.5 No animation/library overload

Do not combine React Bits GradientASCII, Fan Gallery, multiple full-screen WebGL liquid-glass materials and 3D board rendering on the same viewport. The user previously explored GradientASCII, but in this **nature-first palette** its placement is **optional and not required for launch**. Fan Gallery + AnimatedContent are the first two requested effects; Bubble UI may follow selectively.

---

## 10. Launch-ready copy and sample project data

### 10.1 Page copy baseline

- **Hero:** *From a rough idea to a working circuit.*
- **Subheading:** *Build electronics projects, change the wiring or code, and understand your next step.*
- **Primary CTA:** *Open Studio*
- **Secondary CTA:** *Explore Projects*
- **Main product section:** *The circuit, the code, and every change — together.*
- **Signature debugging section:** *It worked before. What changed?*
- **Version comparison CTA:** *Compare Versions*
- **Guide title:** *From digital design to a physical build.*
- **Footer note:** *Tracewise is an early educational prototype. Supported checks are not a physical safety certification.*

### 10.2 First canonical demo

**Project:** Arduino Uno Traffic Light.  
**Supported elements:** Uno, LEDs (red/amber/green), current-limiting resistors, virtual wires, optional push button for a remix.  
**Baseline:** known project graph and Arduino sketch.  
**Change task:** fork, introduce a pedestrian-button change, deliberately create one detectable connection/code mismatch.  
**Expected experience:** inspect changed wire or pin reference → show which rule failed → explain the issue → review correction → recheck.  
**Do not claim:** that any animated LED model is a full real-time hardware simulator unless actual validated behavior is executed.

### 10.3 Starter project policy

Every published starter record needs: title, short description, board type, valid component graph, editable sketch, test support level, image source, version, and functional Open/Fork action. The visual gallery cannot invent project functionality.

---

## 11. Implementation sequence — deliver in small, testable stages

This follows the mentors' Sessions 2–3 emphasis: **role/context/task/constraints/format/examples**, review AI-generated output, build frontend first, test it, then connect backend and data, version via GitHub, deploy, and test with real users.

### Stage 0 — freeze specification and prepare assets

- Keep this Markdown guide at repository root.
- Copy approved logo/backgrounds to `public/assets`; optimize image weight and size; preserve originals separately.
- Set palette and font tokens first; avoid visually improvising after coding begins.
- Confirm one authentic starter project and its intended supported checks.
- Initialize Git repo with `.gitignore`; backup earlier prototype and assets.

**Done when:** design tokens, font roles, assets and repo exist; the site builds.

### Stage 1 — functional marketing shell

- Create Vite React app, routes, public nav and footer.
- Implement hero, storytelling sections and CTA buttons.
- Integrate one Himalayan hero image and one valley gallery section.
- Add AnimatedContent on headline + one or two sections; add Fan Gallery with usable linked starter records.
- Bubble UI only where technically stable and helpful.
- Responsive layout + correct empty states.

**Done when:** each visible marketing link opens a real page/starter and no UI claims unavailable functionality.

### Stage 2 — first real workspace

- Establish project schema, catalog, store and local persistence.
- Implement Uno + LED + resistor + button components and actual pin-driven wires.
- Implement component inspector, code editor, save, rename, fork.
- Import/export JSON for resilience; test save/reload.

**Done when:** a user can edit a circuit and Arduino sketch, reload and keep the changes.

### Stage 3 — compare and check

- Save baseline snapshot; implement new fork and diff.
- Build Compare view with component, wire and code changes.
- Implement deterministic structural checks for the canonical traffic-light demo.
- Explain results with explicit scope. Add a brief physical-build guide.

**Done when:** the traffic-light modification error is detected through reproducible logic and the project can be fixed in the editor.

### Stage 4 — quality, release and evidence

- Test with at least one independent beginner, ideally five.
- Fix critical bugs and confusing UI before adding more animations.
- Run build checks and responsive/browser tests.
- Push to GitHub and deploy the actual React app to Vercel.
- Collect working URL, GitHub repo, honest limitations, tester notes and a short recorded demo for final presentation.

**Done when:** a mentor can open a public URL, follow the demo without assistance, and see working persistence, fork, comparison and checks.

### Stage 5 — only after the core is stable

- Add server-side AI action generation with review and schema validation.
- Add real compilation, then selected simulation models.
- Consider auth, cloud sync and moderated project sharing.
- Consider 3D inspection and robotics separately from marketing visuals.

---

## 12. Acceptance tests — what must actually work

### 12.1 Main journey

1. Visit `/` at desktop size. Hero text readable over the mountain image; CTA visible.
2. Click `Open Studio` → project dashboard/studio opens.
3. Open Traffic Light starter → real components and wires appear from project data.
4. Move a supported component → project state updates.
5. Edit code → save → reload → code persists.
6. Fork project → new project ID appears; original remains unmodified.
7. Add/change a wire or pin reference → Compare view displays correct diff.
8. Run available check → result reflects actual rule checks and labels its limitations.
9. Correct issue → rerun → result updates.
10. Open build guide → component list reflects the selected version.
11. Open Explore → Fan Gallery renders project thumbnails and a card opens an actual starter.

### 12.2 Visual QA

- Hero and gallery background crops correct at `1440×900`, `1280×720`, `390×844`.
- Text and buttons have readable contrast; backgrounds never swallow text.
- Fonts consistently follow assigned roles; headings not rasterized into images.
- Nav is usable, keyboard focus visible, mobile menu reachable.
- Glass effects do not hide disabled/selected/error states.
- The studio remains usable without any background imagery or animation.
- Reduced-motion mode shows all essential content immediately.
- No unnecessary horizontal scrolling, flash of invisible content, or broken card overlaps.

### 12.3 Technical QA

- No critical browser console errors or unhandled React exceptions.
- `npm run build` succeeds.
- No exposed provider credentials or personal data in assets and source.
- External components installed from official source and compatible with framework.
- Images sized/compressed; lazy-load below-the-fold images.
- Local storage failures handled with a visible message.
- Version changes tested against multiple sequential edits.
- If a feature is mocked, its visible label says `Demo` or `Planned`, not `Live`.

---

## 13. Known constraints and explicit non-goals

1. **Time:** An imminent YIIC presentation requires limiting the prototype to one persuasive journey; don't spend most of the sprint refining background blur.
2. **Third-party libraries:** ReactDrops / React Bits may have installation, performance, and licensing considerations. Use official source and record the actual component version; no unsupported code substitutions disguised as vendor originals.
3. **Current visual references:** AI-generated concept images are inspiration, not proof the product UI works.
4. **AI reliability:** Models may produce incorrect pin choices, code, or explanations; validation must remain independent.
5. **Simulation:** No full circuit-physics claim until real engine integration and repeatable test cases exist.
6. **Physical electronics:** Virtual guidance is not a safety guarantee; support supervised beginner-level, low-voltage learning.
7. **Community:** No unmoderated real-time chat or public sharing by default for under-18 users.
8. **Mobile:** Marketing fully responsive; workspace may show a tabbed compact view but desktop is priority.
9. **3D:** Decorative 3D assets may showcase the theme, but functioning 3D electronics/robotics is post-MVP.
10. **Frontend + backend:** Do not build everything in a single giant prompt; implement and test each stage.

---

## 14. Agent handoff instructions — how to use this file with Claude

Provide the following **together** to the coding agent:

1. **This** `TRACEWISE_IMPLEMENTATION_GUIDE.md`.
2. `tracewise_glass_circuit_logo.png`.
3. The approved Himalayan and green-valley background images generated separately (or available reference visuals until final backgrounds are selected).
4. The three Tracewise concept images if useful as **inspiration only**.
5. Prior HTML prototypes only as a **source of potentially reusable functionality**, never as the mandatory visual layout.
6. Any actual starter-project wiring/code assets you want it to preserve.

**Role:** Senior React product engineer and distinctive visual/UI designer.  
**Context:** Tracewise is a **student-friendly educational electronics editor**, not a travel site and not a generic AI SaaS site.  
**Task:** Implement the stages of this guide sequentially in a maintainable React repository.  
**Constraints:** No fake simulation, fake testimonials, fake links, dead controls, or random color/font changes. Do not add backend/3D/robotics now.  
**Format:** Deliver runnable source, screenshot(s) if browser available, run commands, test results, limitations, and next-stage recommendations.  
**Example:** Traffic-light starter → independent fork → modify → compare → check → fix.

### Required agent behavior

- Read this entire file before coding; identify contradictions with current code before touching files.
- Make a brief implementation plan but **do the work**.
- Preserve existing working behavior only if verified; remove broken visual clutter.
- Favor a real functional UX over decorative mockups.
- Keep the color tokens and typography frozen unless a documented contrast issue demands a local adjustment.
- Do not invent real user data or user feedback.
- End each stage with a checklist of genuinely tested interactions.
- Make a recoverable Git commit at each meaningful milestone.

---

## 15. Decision log — frozen for first build

| Decision | Approved choice | Reason |
|---|---|---|
| Brand identity | Logo-led navy, cobalt, cyan, ice-white | Matches approved Tracewise logo |
| Public backgrounds | Himalayan hero; valley gallery only | Premium atmosphere without travel-site feel |
| Brand fonts | Montserrat display; Google Sans Flex UI; JetBrains Mono code | Distinct hierarchy with good engineering readability |
| Main app | React + Vite + JS + CSS | Compatible with requested React component variants |
| Navigation | Distinct pages/routes | Homepage and studio have different UX needs |
| Fancy UI | AnimatedContent, Fan Gallery; selective Soap Bubble | Limit visual effects to places with clear purpose |
| Editor | 2D SVG component/pin canvas first | Stable, testable engineering interaction |
| Core differentiation | Fork → Modify → Compare → Check → Explain → Fix | Strong, beginner-focused value proposition |
| Data | One canonical project model + local persistence | Enables meaningful versions and diff |
| Launch | One traffic-light remix/debugging workflow | Achievable, demoable and honest |
| AI | Mock clearly labeled for MVP; real server integration next | Avoid false claims and protect API secrets |
| Community | Curated/controlled; full collaboration later | Privacy and moderation for student audience |
| Real 3D / robotics | Later | Too much scope for first launch |

**Change-management rule:** If a later prompt says “make it more creative,” do not change the approved colors or add unrelated pages. Improve composition, spacing, typography, motion and genuine interaction **inside** this design system. If a fundamental change is requested, update the decision log explicitly.

---

## 16. Final delivery checklist

- [ ] Correct approved Tracewise logo and nature backgrounds, optimized for web
- [ ] Montserrat / Google Sans Flex / JetBrains Mono roles applied
- [ ] All brand colors centralized in CSS tokens
- [ ] Beautiful, responsive, original hero; clear `Open Studio` CTA
- [ ] React routes working; nav and footer links not decorative
- [ ] Fan Gallery installed and linked to real starter records
- [ ] AnimatedContent implemented with reduced-motion fallback
- [ ] Bubble UI used selectively (or limitation documented honestly)
- [ ] Editable Arduino Uno starter circuit and source code
- [ ] Stable pin connections, component movement, save/reload
- [ ] Independent fork + baseline version
- [ ] Accurate component/wire/code comparison
- [ ] Defined checks with truthful status and error scope
- [ ] Build guide derived from actual project state
- [ ] No invented testimonials, user counts or simulation results
- [ ] Mobile marketing QA + desktop studio QA
- [ ] GitHub repository with no exposed secrets
- [ ] Public Vercel deployment
- [ ] Short successful demonstration of the core workflow
- [ ] Honest limitations and future roadmap available to mentors

**Ultimate test:** A beginner should be able to open Tracewise, modify a known working electronics project, see exactly what changed, and understand a detected issue — without mistaking an AI mock or visual animation for a verified simulation.
