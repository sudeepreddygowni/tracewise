# Tracewise — Student-Focused AI-Assisted Electronics Engineering Platform

> **Build it. Change it. Understand it.**  
> *From a rough idea to a working circuit.*

Tracewise is an educational electronics engineering platform that helps students and beginners design supported circuits visually, write and edit Arduino C++ firmware, create independent project remixes, compare versions, and investigate the exact changes that caused problems.

---

## 1. Primary Differentiation: Change-Aware Debugging

The central question Tracewise answers is:

> **"My project was working before. What did I change that caused the problem?"**

Instead of guessing or getting ungrounded chatbot explanations, Tracewise:
1. **Preserves baseline versions** when students create forks and remixes.
2. **Computes deterministic diffs** across placed components, jumper wires, and Arduino C++ lines.
3. **Runs structural validation** against pin catalogs to detect pin conflicts, unprotected LEDs, and disconnected pins.
4. **Pinpoints regressions** and provides reviewable, one-click fixes.

---

## 2. Approved Design System: Skybound Engineering

### 2.1 Colors
- **Brand Cobalt:** `#1E3FD8`
- **Brand Strong:** `#1748B8`
- **Brand Soft:** `#EBF6FF`
- **Cyan Signal:** `#2DC5E9`
- **Sky Blue:** `#4AA7F2`
- **Application Background:** `#F5F9FD`
- **Surface:** `#FFFFFF`
- **Dark Deep Surface:** `#071831`
- **Dark Panel:** `#0B2348`
- **Text Primary:** `#10233D`
- **Text Secondary:** `#354A65`
- **Text Muted:** `#65778D`
- **Border:** `#D5E4F0`
- **Success:** `#187A57`
- **Warning:** `#9D6418`
- **Error:** `#BD3546`

### 2.2 Typography
- **Display & Headlines:** Montserrat (`font-weight: 700-800`, `letter-spacing: -0.055em`)
- **UI & Body:** Google Sans Flex / Plus Jakarta Sans
- **Firmware & Diagnostics:** JetBrains Mono

### 2.3 Nature Assets
- **Himalayan Mountain Landscape:** `public/assets/backgrounds/himalayan-hero.jpg` (Hero section)
- **Green Valley Landscape:** `public/assets/backgrounds/green-valley.jpg` (Explore Projects / Fan Gallery)
- **Official Tracewise Wordmark & Mark:** `public/assets/brand/tracewise-logo.png`, `public/assets/brand/tracewise-mark.png`

---

## 3. Installed Components & Paths

### 3.1 ReactDrops Fan Gallery
- **Source Path:** `src/components/fan-gallery/`
  - `fan-gallery.tsx`
  - `fan-playback.ts`
  - `fan-motion.ts`
  - `fan-layout.ts`
  - `fan-gallery.css`
  - `viewport-playback.ts`
- **Wrapper & Configuration:** `src/components/landing/TracewiseProjectGallery.jsx`
- **Configuration Values:**
  - `cardWidth: 162`, `aspectRatio: 0.8`, `spacing: 0.69`, `curve: 0.14`, `tilt: 14.5`, `lift: 42`, `spread: 0.2`, `stackFrom: "left"`, `speed: 0.7`, `stagger: 0.09`, `bounce: 0.35`, `hoverSpeed: 0.28`, `radius: 18`, `entrance: "stack"`, `trigger: "scroll"`, `viewportStart: 75`, `once: true`, `showTitle: false`

### 3.2 React Bits AnimatedContent
- **Source Path:** `src/animations/AnimatedContent.jsx`
- **Dependencies:** GSAP (`gsap`, `ScrollTrigger`)
- **Features:** Scroll-triggered reveals, mount animation, direction, distance, stagger, blur, scale, and `prefers-reduced-motion` compliance.

### 3.3 ReactDrops Soap Bubble UI
- **Source Path:** `src/components/soap-bubble/`
  - `index.ts`
  - `soap-bubble-system.tsx`
  - `use-soap-bubble.tsx`
  - `soap-bubble-renderer.ts`
  - `soap-bubble-motion.ts`
  - `soap-bubble-gl.ts`
  - `soap-bubble-shaders.ts`
  - `soap-bubble.css`
- **Wrapper & Controller:** `src/components/ui/BubbleActions.jsx`
- **Theme Presets:** Light glass preset for light surfaces, Rainbow glass preset for dark surfaces, with graceful WebGL fallback.

### 3.4 React Bits GradientASCII
- **Source Path:** `src/components/gradient-ascii/`
  - `GradientASCII.jsx`
  - `GradientASCII.css`
- **Configuration:** Horizon shape, exact colors (`['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']`), characters `" =+xX0S8#@"`, cellSize `18`, density `0.8` in contained technical transition panel.

---

## 4. Application Architecture & Folder Tree

```text
TraceWise/
├── public/
│   └── assets/
│       ├── brand/          # Tracewise official logo and icon mark
│       ├── backgrounds/    # Himalayan hero and green valley landscapes
│       └── starters/       # 5 Starter thumbnails for Fan Gallery
├── src/
│   ├── animations/
│   │   └── AnimatedContent.jsx
│   ├── components/
│   │   ├── navigation/     # Glass Navbar with responsive drawer
│   │   ├── landing/        # TracewiseProjectGallery with FanGallery
│   │   ├── studio/         # CircuitCanvas, ComponentLibrary, CodeEditor, Inspector, Toolbar, Validation
│   │   │   └── svg/        # Vector ArduinoUnoSvg, BreadboardSvg, LedSvg, ResistorSvg, PushButtonSvg, WireSvg
│   │   ├── fan-gallery/    # Official ReactDrops Fan Gallery component
│   │   ├── soap-bubble/    # Official ReactDrops Soap Bubble UI material
│   │   ├── gradient-ascii/ # Official React Bits GradientASCII background
│   │   └── ui/             # BubbleActions & theme wrappers
│   ├── design/
│   │   ├── tokens.css      # Approved brand colors and gradients
│   │   ├── typography.css  # Montserrat, Google Sans Flex, JetBrains Mono
│   │   ├── globals.css     # Base styles and glass materials
│   │   └── motion.css      # Animations, circuit trace, reduced motion
│   ├── data/
│   │   ├── starterProjects.js   # 5 real starter project records
│   │   └── componentCatalog.js  # Pin specifications and dimensional data
│   ├── domain/
│   │   ├── projectSchema.js     # Canonical Project model & fork helpers
│   │   ├── circuitRules.js      # Structural validation & pin conflict rules
│   │   └── compareVersions.js   # Deterministic circuit/code diff engine
│   ├── store/
│   │   └── useProjectStore.jsx  # React state management with undo/redo
│   ├── services/
│   │   └── projectStorage.js    # LocalStorage persistence, export/import
│   ├── pages/
│   │   ├── HomePage.jsx         # Himalayan hero, studio walkthrough, gallery, FAQ
│   │   ├── DashboardPage.jsx    # Projects list, search, fork, create
│   │   ├── StudioPage.jsx       # 3-column interactive engineering workspace
│   │   ├── ComparePage.jsx      # Version comparison, diffs, one-click fix
│   │   ├── BuildGuidePage.jsx   # Bill of materials, assembly checklist, wire map
│   │   ├── ProjectsPage.jsx     # Curated showcase with Fan Gallery
│   │   ├── LearnPage.jsx        # Interactive Practice Lab exercises
│   │   ├── SettingsPage.jsx     # Preferences, theme, reduced motion, storage
│   │   └── NotFoundPage.jsx     # 404 router fallback
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## 5. Running the Application

### 5.1 Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5.2 Production Build
```bash
npm run build
npm run preview
```

---

## 6. Functional Routes

| Route | Purpose | Features |
|---|---|---|
| `/` | Marketing Homepage | Himalayan hero, project composer, 3-column preview, Fan Gallery, FAQ |
| `/app` | Project Dashboard | Project search, Create, Fork, Open, Export/Import JSON |
| `/app/studio/:projectId` | Engineering Studio | Interactive SVG canvas, component drag, pin wiring, C++ editor, validation drawer |
| `/app/compare/:projectId` | Compare & Debug | Version comparison, circuit & code diff, detected pin conflict, one-click fix |
| `/app/build/:projectId` | Physical Build Guide | Dynamic Bill of Materials (BOM), step-by-step checklist, wiring map |
| `/projects` | Explore Projects | ReactDrops Fan Gallery on green valley backdrop, starter filters, open/fork |
| `/learn` | Practice Lab | Beginner electronics challenges with immediate feedback |
| `/settings` | Preferences | Light/Dark theme, Reduced Motion, browser storage export and reset |

---

## 7. The Signature User Workflow

1. **Open:** Open the working Traffic Light starter (`/app/studio/starter-traffic-light`).
2. **Fork:** Click **Fork Remix** to spawn an independent copy (`v1.1-remix`).
3. **Modify:** Add a pedestrian push button and connect wire to Arduino Pin D7.
4. **Compare:** Navigate to **Compare & Debug** (`/app/compare/:projectId`).
5. **Check:** The system runs deterministic structural checks and flags the pin conflict (code declares `BUTTON_PIN = 2` while wire is on D7).
6. **Understand:** Read the beginner-readable explanation of why D2 cannot drive the red LED and read button input simultaneously.
7. **Fix:** Click **Apply One-Click Fix** or update the code to `BUTTON_PIN = 7`.
8. **Save:** Save the verified project.
