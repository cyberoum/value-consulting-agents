# UNIFIED DESIGN SYSTEM — Backbase Value Consulting
# ═══════════════════════════════════════════════════════════════════════════════
# SINGLE SOURCE OF TRUTH for ALL visual outputs across ALL engagement types
# (Ignite Assess, Ignite Inspire, hybrid engagements, any future products)
#
# AUTHORITY: This file overrides any agent-level design rules.
# All agents generating HTML, interactive dashboards, decks, or any visual
# output MUST reference this file.
#
# LAYOUT SOURCE: templates/presentations/assessment-dashboard-template.html
# COLOR SOURCE: ENGAGE Americas 2026 Keynote (Jouk Pleiter + Deepak Pandey)
# Last Updated: 2026-04-13
# ═══════════════════════════════════════════════════════════════════════════════

---

## IMPORTANT RULES

1. **ALL visual outputs** (HTML dashboards, interactive reports, workshop decks, prototypes, engagement plans) MUST follow this design system.
2. **Colors** are from the official Backbase brand palette — no approximations.
3. **Layout patterns** (bento grids, dark feature sections, sidebar nav, glass morphism, SVG journey maps, heatmaps) are from the assessment dashboard template — the most sophisticated layout system available.
4. **Card accents**: Use top accent gradients. NEVER use `border-left` ribbons.
5. **Self-contained**: All HTML outputs must be self-contained with zero external CDN dependencies (no React CDN, no Tailwind CDN). Google Fonts for Libre Franklin is the ONLY acceptable external resource.
6. **Dark accents on light base**: Body background is ALWAYS light (`#FFFFFF`). Dark colors are used for sidebar, dark-feature sections, metric cards, journey swimlanes, and waterfall containers only.

---

## 1. COLOR PALETTE — Official Backbase Brand (ENGAGE 2026)

**Source:** ENGAGE Americas 2026 Keynote — the ONLY permitted color palette. No other colors may be used.

### Primary Colors

| Token | CSS Variable | Hex | Usage |
|-------|-------------|-----|-------|
| **Primary Dark** | `--bb-dark` | `#0F172A` | Dark backgrounds, sidebar, dark-feature sections, primary text on light, Banking OS platform blocks |
| **Primary Blue** | `--bb-blue` | `#3366FF` | Primary accent, CTAs, links, active states, headings on dark, section numbers, integration bars |
| **White** | `--bb-white` | `#FFFFFF` | Light backgrounds, text on dark, card backgrounds |
| **Black** | `--bb-black` | `#000000` | Platform matrix grids, Banking OS blocks (used sparingly) |

### Accent Colors

| Token | CSS Variable | Hex | Usage |
|-------|-------------|-----|-------|
| **Coral** | `--bb-coral` | `#FF6B5E` | Alerts, negative indicators, pain points, "messy middle" friction |
| **Sage Green** | `--bb-green` | `#93C47D` | Positive, success, growth indicators, decorative orbs |
| **Gold** | `--bb-gold` | `#E8B931` | Warning, caution, pending items, decorative orbs |

### Supporting Colors

| Token | CSS Variable | Hex | Usage |
|-------|-------------|-----|-------|
| **Muted Blue-Grey** | `--bb-muted` | `#334155` | Card fills on dark, secondary backgrounds, muted text |
| **Light Blue Tint** | `--bb-light-blue` | `#EDF2FF` | Light accent fills, table alternation, subtle card backgrounds |
| **Light Grey** | `--bb-light-grey` | `#F8FAFC` | Content area backgrounds (near-white) |
| **Mid Blue** | `--bb-mid-blue` | `#7D9DFF` | Secondary blue, hover states, lighter blue layer fills |
| **Pale Blue** | `--bb-pale-blue` | `#B8CDFF` | Lightest blue tier (architecture layer fills, lifecycle wheel lighter segments) |

### Maturity / RAG Scale (Data Visualization)

Uses only brand palette colors — no off-brand hues.

| Level | CSS Variable | Hex | Meaning |
|-------|-------------|-----|---------|
| L0 | `--L0` | `#FF6B5E` | Non-Existent / Critical (brand coral) |
| L1 | `--L1` | `#E8B931` | Ad-Hoc / High Risk (brand gold) |
| L2 | `--L2` | `#7D9DFF` | Developing / Moderate (brand mid-blue) |
| L3 | `--L3` | `#93C47D` | Defined / Good (brand sage green) |
| L4 | `--L4` | `#3366FF` | Optimized / Excellent (brand blue) |

### Alpha Color References (for rgba usage)

When using brand colors in transparent/alpha contexts:
- `rgba(51,102,255, ...)` — derived from `#3366FF` (primary blue)
- `rgba(15,23,42, ...)` — derived from `#0F172A` (primary dark)
- `rgba(255,107,94, ...)` — derived from `#FF6B5E` (coral)
- `rgba(147,196,125, ...)` — derived from `#93C47D` (sage green)
- `rgba(232,185,49, ...)` — derived from `#E8B931` (gold)

**NEVER use old palette values.** See Section 2 (Deprecated Colors) for the full replacement map.

---

## 2. DEPRECATED COLORS — DO NOT USE

**ALL colors not listed in Section 1 are banned.** This includes the previous design system palette and any ad-hoc colors. If a color is not in Section 1, it must not appear in any output.

### Previous Design System → ENGAGE 2026 Migration

| Deprecated | Replacement | Notes |
|-----------|-------------|-------|
| `#091C35` | `#0F172A` | Old primary dark → ENGAGE 2026 primary dark |
| `#3366FF` | `#3366FF` | Old primary blue → ENGAGE 2026 primary blue |
| `#FF7262` | `#FF6B5E` | Old red → ENGAGE 2026 coral |
| `#26BC71` | `#93C47D` | Old vibrant green → ENGAGE 2026 sage green |
| `#FFAC09` | `#E8B931` | Old amber → ENGAGE 2026 gold |
| `#69FEFF` | **REMOVED** | Cyan — not in ENGAGE 2026 palette. Use `#3366FF` (blue) or `#93C47D` (sage) instead |
| `#7B2FFF` | **REMOVED** | Purple — not in ENGAGE 2026 palette. Use `#3366FF` (blue) for gradient endpoints |
| `#181E41` | `#0F172A` | Old navy heading → primary dark |
| `#3A495D` | `#334155` | Old muted → updated muted blue-grey |
| `#E5EBFF` | `#EDF2FF` | Old light blue → softer light blue tint |
| `#F5FAFF` | `#FFFFFF` | Old off-white → pure white (ENGAGE 2026 uses white backgrounds) |
| `#F3F6F9` | `#F8FAFC` | Old light grey → updated light grey |
| `#7D9DFF` | `#7D9DFF` | Old mid-blue → updated mid-blue |
| `#F8FAFC` | `#FFFFFF` | Old semantic bg → pure white |

### Historical Deprecated (from pre-2026 outputs)

| Deprecated | Replacement | Notes |
|-----------|-------------|-------|
| `#1A56FF` | `#3366FF` | Old approximate blue → ENGAGE 2026 blue |
| `#1A1F36` | `#0F172A` | Old approximate dark → ENGAGE 2026 dark |
| `#0B0F1A` | `#0F172A` | Old dark feature bg → ENGAGE 2026 dark |
| `#141929` | `#0F172A` | Old navy → ENGAGE 2026 dark |
| `#1C2238` | `#334155` | Old navy-2 → muted blue-grey |
| `#3B6BF5` | `#3366FF` | Old blue → ENGAGE 2026 blue |
| `#5A8AFF` | `#7D9DFF` | Old blue-light → ENGAGE 2026 mid-blue |
| `rgba(51,102,255,...)` | `rgba(51,102,255,...)` | Old blue alpha → ENGAGE 2026 blue alpha |
| `rgba(9,28,53,...)` | `rgba(15,23,42,...)` | Old dark alpha → ENGAGE 2026 dark alpha |
| `rgba(123,47,255,...)` | **REMOVED** | Purple alpha — not in palette |

---

## 3. TYPOGRAPHY

### Primary Font: Inter (ENGAGE 2026)

| Weight | CSS | Usage |
|--------|-----|-------|
| **Black (900)** | `font-weight: 900` | Major headings, hero titles, stat values |
| **Bold (700)** | `font-weight: 700` | Sub-headings, card titles, bold emphasis |
| **SemiBold (600)** | `font-weight: 600` | Labels, overlines, uppercase tracking |
| **Regular (400)** | `font-weight: 400` | Body text, descriptions |
| **Light (300)** | `font-weight: 300` | Subtitles, secondary text, large display numbers |

### Fallback Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Import (only external dependency allowed)
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');
```

### Size Scale for Interactive Dashboards

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Hero H1 | 5.5rem | 900 | Main dashboard title |
| Section H2 | 2.2rem | 900 | Panel headers |
| Dark Feature H3 | 2.8rem | 900 | Immersive section titles |
| Card H3 | 1.2rem | 700 | Card titles |
| Body | 0.9rem | 400 | Content text |
| Overline | 0.62rem | 700, uppercase, 3px tracking | Section labels |
| Caption | 0.65rem | 600, uppercase | Small labels, meta |

### Typography Rules
- **Negative letter-spacing** on display text: -4px (hero), -2px (dark feature), -1px (section headers, stats)
- **Positive letter-spacing** on overlines/labels: +2-3px
- **Line height**: 1.6 for body, 1.7 for paragraphs, 0.92 for hero titles
- **Gradient text**: Use `background: linear-gradient(90deg, #3366FF, #7D9DFF); -webkit-background-clip: text; -webkit-text-fill-color: transparent;` for overlines and accent text (blue-to-lighter-blue, no purple)

---

## 4. CSS CUSTOM PROPERTIES — Master Token Set

```css
:root {
  /* ── Backbase Brand (ENGAGE 2026) ── */
  --bb-dark: #0F172A;
  --bb-blue: #3366FF;
  --bb-white: #FFFFFF;
  --bb-black: #000000;
  --bb-coral: #FF6B5E;
  --bb-green: #93C47D;
  --bb-gold: #E8B931;
  --bb-muted: #334155;
  --bb-light-blue: #EDF2FF;
  --bb-light-grey: #F8FAFC;
  --bb-mid-blue: #7D9DFF;
  --bb-pale-blue: #B8CDFF;

  /* ── Semantic Tokens (Dashboard) ── */
  --bg: #FFFFFF;
  --card: #FFFFFF;
  --border: #E2E8F0;
  --text: #0F172A;
  --muted: #64748B;
  --dim: #94A3B8;
  --accent: #3366FF;
  --accent-light: #EDF2FF;

  /* ── Maturity Scale (brand colors only) ── */
  --L0: #FF6B5E;
  --L1: #E8B931;
  --L2: #7D9DFF;
  --L3: #93C47D;
  --L4: #3366FF;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 25px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04);

  /* ── Spacing & Shape ── */
  --radius: 12px;
  --radius-lg: 16px;
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* ── Font ── */
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## 5. LAYOUT PATTERNS (from Assessment Dashboard Template)

The assessment-dashboard-template.html (`templates/presentations/`) is the LAYOUT source of truth. All interactive outputs must use these patterns:

### Page Structure
- **Fixed sidebar** (250px, dark `#0F172A`) with numbered tab navigation
- **Scrollable content area** with max-width 1360px
- **Hero section** with 2-column grid (text + visual)
- **Panel switching** via JavaScript (tab-based SPA)

### Grid Systems
| Pattern | CSS | Usage |
|---------|-----|-------|
| **Bento Grid** | `grid: repeat(4, 1fr) / auto-rows 180px` | Executive summary, overview sections |
| **Card Grid** | `repeat(2-4, 1fr)` | Standard content grids |
| **Heatmap** | `auto-fill minmax(140px, 1fr)` | Capability maps |
| **Timeline** | `repeat(4, 1fr)` with gradient connector | Roadmap phases |
| **Swimlane** | Dynamic columns with 1px gap | Journey before/after |
| **Proto Grid** | `repeat(3, 1fr)` | Phone frame prototypes |
| **ROI Grid** | `repeat(4, 1fr)` | Benefits dashboard |

### Component Library
| Component | Key Features |
|-----------|-------------|
| **Card** | 20px radius, top gradient accent on hover (scaleX animation), lift on hover |
| **Metric Card** | Dark bg (`#0F172A`), centered stat, scale on hover |
| **Dark Feature Section** | Immersive `#0F172A` bg, radial gradient orbs, gradient text fills |
| **Persona Card** | Avatar + expandable body, click to reveal |
| **Expandable** | Accordion with animated max-height, glow border on open |
| **Heatmap Cell** | Interactive selection with detail panel |
| **Phone Frame** | 280x580 with notch, status bar, embedded screens |
| **Friction Callout** | Severity-based top gradient (coral/gold/blue) |
| **Journey Experience Map** | SVG emotion curve with clickable stage markers |
| **Value Waterfall** | Dark bg, gradient bar segments showing leakage |
| **Score Badge** | Maturity-colored circle with hover scale |
| **Backbase Layer Tags** | Color-coded tags for engagement/orchestration/intelligence/integration |

### Dark Feature Section Pattern
```css
.dark-feature {
  background: #0F172A;
  border-radius: 28px;
  padding: 72px 56px;
  position: relative;
  overflow: hidden;
}
.dark-feature::before {
  /* Top-right ambient blue orb */
  background: radial-gradient(circle, rgba(51,102,255,0.12) 0%, transparent 70%);
}
.dark-feature::after {
  /* Bottom-left ambient blue-light orb (no purple — use lighter blue) */
  background: radial-gradient(circle, rgba(51,102,255,0.06) 0%, transparent 70%);
}
```

### Card Accent Pattern (NEVER use border-left ribbons)
```css
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3366FF, #7D9DFF, #3366FF);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}
.card:hover::before { transform: scaleX(1); }
```

### Glass Morphism (Hero floating cards)
```css
.hero-float {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 14px;
}
```

---

## 6. VISUAL EFFECTS

### Micro-interactions
- Card hover: `translateY(-3px)` + shadow expansion + top accent reveal
- Stat values: `scale(1.08)` on hover
- Heatmap scores: `scale(1.15)` on hover
- Phase dots: `scale(1.3)` on hover
- Glass cards: `translateY(-4px) scale(1.03)` on hover

### Animations
- `fadeSlideIn`: opacity + translateY(10px)
- `floatParticle`: 4-keyframe ambient float (20s cycle)
- `jxSlide`: Panel entrance (opacity + translateY 12px)
- Scroll reveal: IntersectionObserver with `0.8s cubic-bezier(0.16,1,0.3,1)`

### Ambient Particles
6 floating background particles with brand-tinted colors at 0.04 opacity, 15-30s animation duration.

### Custom Scrollbar
```css
::-webkit-scrollbar-thumb { background: rgba(51,102,255,0.15); }
::selection { background: rgba(51,102,255,0.12); }
```

---

## 7. RESPONSIVE BREAKPOINTS

| Breakpoint | Sidebar | Grid | Hero |
|------------|---------|------|------|
| > 1100px | 250px full | 4-col bento | 2-col (1fr + 520px) |
| 900-1100px | 200px | 3-col bento | 2-col (1fr + 360px) |
| 600-900px | 60px icon-only | 2-col bento | 1-col |
| < 600px | Hidden | 1-col | 1-col, reduced type |

---

## 8. OUTPUT REQUIREMENTS

### Self-Contained HTML
- ALL CSS inline in `<style>` tags
- ALL JavaScript inline in `<script>` tags
- Only external resource: Google Fonts for Libre Franklin
- Print stylesheet included (`@media print`)
- Target file size: 50-400 KB depending on content density

### Accessibility
- Minimum contrast: `rgba(255,255,255,0.55)` for sub-labels on dark backgrounds
- Never use `rgba(255,255,255,0.3)` or lower for readable text on dark
- Blue text on dark navy (`#0F172A`): `#3366FF` passes WCAG AA (contrast ratio 4.8:1)
- Sage green text on dark navy: use `#A3D48D` (lightened sage) for WCAG AA compliance
- Gold text on dark navy: `#E8B931` passes WCAG AA (contrast ratio 6.2:1)

---

## 9. ENGAGEMENT TYPE ROUTING

This design system applies to ALL engagement types:

| Engagement Type | Output Format | Design System |
|----------------|---------------|---------------|
| **Ignite Assess** | Interactive HTML dashboard (sidebar + panels) | This file |
| **Ignite Inspire** | Interactive HTML dashboard (sidebar + panels) | This file |
| **Hybrid (Assess + Inspire)** | Single interactive HTML dashboard | This file |
| **Workshop Decks** | Slide-format HTML | This file (colors only; layout follows slide conventions) |
| **Prototypes** | Phone/browser frame HTML | This file (colors + component patterns) |

For slide-format outputs (workshop decks), use the brand colors from this file but adapt the layout to the slide structure defined in `knowledge/Ignite Inspire/design-system.md` (Section 4: Slide Layouts).

---

*End of Unified Design System*
