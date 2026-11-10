---
name: CampusCare — MNU Portal Design System
description: Navy-and-gold institutional portal design system for CampusCare at Mansoura National University, spanning the frosted sign-in threshold and all five role operational workspaces (student/employee, lost-and-found officer, technician, maintenance manager, and super admin).
colors:
  mnu-navy: "#04153E"
  mnu-navy-hover: "#0A2361"
  mnu-navy-active: "#031030"
  mnu-gold: "#F9B301"
  mnu-gold-ink: "#966703"
  mnu-gold-tint: "#FEF6E2"
  portal-paper: "#F5F7FA"
  surface-white: "#FFFFFF"
  surface-frosted: "rgba(255, 255, 255, 0.72)"
  surface-input: "rgba(255, 255, 255, 0.85)"
  surface-chip: "rgba(255, 255, 255, 0.65)"
  secondary-slate: "#EBEEF4"
  muted-slate: "#E9EBF2"
  navy-muted-ink: "#2E3C61"
  hairline-border: "#CAD1E2"
  input-stroke: "#BFC6D9"
  sidebar-foreground: "#F8F9FC"
  sidebar-muted: "#AFBAD4"
  sidebar-active: "#102456"
  sidebar-border: "#223159"
  destructive-crimson: "#B0251C"
  destructive-tint: "rgba(176, 37, 28, 0.10)"
  scrim-navy: "rgba(4, 21, 62, 0.44)"
  pill-navy-glass: "rgba(4, 21, 62, 0.78)"
  pill-navy-hover: "rgba(4, 21, 62, 0.92)"
typography:
  headline:
    fontFamily: 'Inter, "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  headline-compact:
    fontFamily: 'Inter, "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.65rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  kpi-value:
    fontFamily: 'Inter, "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  section-heading:
    fontFamily: 'Inter, "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  body:
    fontFamily: 'Inter, "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  action:
    fontFamily: 'Inter, "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: "0em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  label:
    fontFamily: 'Inter, "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  caption:
    fontFamily: 'Inter, "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  chip-label:
    fontFamily: 'Inter, "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif'
    fontSize: "11.5px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  "2xl": "16px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "24px"
  "2xl": "28px"
components:
  button-primary:
    backgroundColor: "{colors.mnu-navy}"
    textColor: "{colors.surface-white}"
    typography: "{typography.action}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "44px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.mnu-navy-hover}"
  button-primary-active:
    backgroundColor: "{colors.mnu-navy-active}"
  button-action-compact:
    backgroundColor: "{colors.mnu-navy}"
    textColor: "{colors.surface-white}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-outline-action:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.mnu-navy}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-role-chip:
    backgroundColor: "{colors.surface-chip}"
    textColor: "{colors.mnu-navy}"
    typography: "{typography.chip-label}"
    rounded: "{rounded.lg}"
    padding: "0 8px"
    height: "32px"
  button-role-chip-hover:
    backgroundColor: "{colors.mnu-gold-tint}"
    textColor: "{colors.mnu-navy}"
  button-language-pill:
    backgroundColor: "{colors.pill-navy-glass}"
    textColor: "{colors.surface-white}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  button-language-pill-hover:
    backgroundColor: "{colors.pill-navy-hover}"
    textColor: "{colors.surface-white}"
  input-field:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.mnu-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "44px"
    width: "100%"
  card-threshold:
    backgroundColor: "{colors.surface-frosted}"
    textColor: "{colors.mnu-navy}"
    rounded: "{rounded.2xl}"
    padding: "24px"
    width: "440px"
  card-workspace-kpi:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.mnu-navy}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-workspace-ledger:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.mnu-navy}"
    rounded: "{rounded.lg}"
    padding: "24px"
  sidebar-nav-active:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.sidebar-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  badge-warning:
    backgroundColor: "{colors.mnu-gold-tint}"
    textColor: "{colors.mnu-navy}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  alert-error:
    backgroundColor: "{colors.destructive-tint}"
    textColor: "{colors.destructive-crimson}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
---

# Design System: CampusCare — MNU Portal Design System

## Overview

**Creative North Star: "University Portal Glass Threshold"**

CampusCare translates institutional university operations—campus maintenance triage and dispatch, technician field execution, lost-and-found recovery, and platform-wide governance—into an authoritative, calm portal anchored in Mansoura National University's deep navy and crest gold palette. On entry, the sign-in screen presents a single translucent white glass threshold suspended over a full-viewport campus entrance backdrop darkened by a directional navy scrim; inside the workspace, all five role portals transition onto cool navy-tinted paper framed by a deep navy workflow-grouped sidebar and crisp single-border status ledgers.

CampusCare completes its role-portal visual migration (`PRODUCT.md`) under the MNU portal surface system documented here (`.mnu-portal-surface` in `src/index.css`), spanning the sign-in screen (`src/features/auth/LoginPage.tsx`), the `STUDENT_EMPLOYEE` portal, the `LOST_FOUND_OFFICER` portal, the `TECHNICIAN` portal, the `MAINTENANCE_MANAGER` portal, and the `SUPER_ADMIN` portal (`AppShell.tsx`, `Sidebar.tsx`, `BrandMark.tsx`, `navigation.ts`, `DashboardPage.tsx`, `PortalSummaryGrid.tsx`, `PortalLedgerCard.tsx`, `PortalLedgerRow.tsx`, `StudentDashboard.tsx`, `StudentSummaryGrid.tsx`, `StudentLedgerCard.tsx`, `OfficerDashboard.tsx`, `OfficerSummaryGrid.tsx`, `OfficerTriageLedgers.tsx`, `OfficerCharts.tsx`, `TechnicianDashboard.tsx`, `TechnicianSummaryGrid.tsx`, `TechnicianDispatchLedgers.tsx`, `TechnicianWorkOrderRow.tsx`, `ManagerDashboard.tsx`, `ManagerSummaryGrid.tsx`, `ManagerTriageLedgers.tsx`, `ManagerCharts.tsx`, `AdminDashboard.tsx`, `AdminSummaryGrid.tsx`, `AdminGovernanceLedgers.tsx`, `AdminCharts.tsx`, `InsightsPanel.tsx`, `InsightSections.tsx`).

**Key Characteristics:**
- High-contrast MNU Deep Navy (`#04153E`) typography, primary CTAs, and job-grouped sidebar framing paired with disciplined MNU Crest Gold (`#F9B301`) focus rings, active start-edge indicator bars, and hover highlights.
- Frosted translucent white threshold glass (`linear-gradient(to bottom, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.68))` with `12px` backdrop blur) on sign-in, handing off to flat `#FFFFFF` single-border (`#CAD1E2`) ledger cards over `#F5F7FA` cool paper inside the workspace.
- Bilingual Arabic-default (`dir="rtl"`) and English (`dir="ltr"`) typography with `IBM Plex Sans Arabic` and `Inter` parity, logical spacing, `dir="auto"` mixed-script ledger wrapping, and LTR-locked credential inputs.
- Tactile, accessible interactive states using `150ms` color transitions, crisp `1px` navy-tinted borders, full-row ledger link targets, and `2px` gold `focus-visible` rings.

## Colors

A disciplined institutional palette drawn from the Mansoura National University emblem: authoritative deep navy anchors ink, sidebar framing, and primary CTAs, crest gold signals keyboard focus and active navigation markers, and cool navy-tinted neutrals replace generic or warm stone gray.

### Primary
- **MNU Deep Navy** (`#04153E`): Primary brand ink, headline and label foreground (`--foreground`), caret color, sidebar ground (`--sidebar`), mobile `<meta name="theme-color">`, bell unread counter fill, and solid primary action button fill (`--primary`).
- **MNU Hover Navy** (`#0A2361`): Elevated navy fill applied on `:hover` for primary submit and header action buttons (`--mnu-navy-hover`).
- **MNU Active Navy** (`#031030`): Deepened pressed-state fill applied on `:active` for primary buttons (`--mnu-navy-active`).

### Secondary
- **MNU Crest Gold** (`#F9B301`): Global `focus-visible` ring (`--ring`), `3px` sidebar active start-edge bar, role badge status dot, hover/semantic border highlight (`--badge-warn-border`), and `32%`-opacity text selection background (`--mnu-gold`).
- **Burnished Gold Ink** (`#966703`): Darkened, high-contrast gold reserved for `14px–16px` icons on light cards, outlined header action icons, KPI icon accents, and `HIGH` priority warning icons (`--mnu-gold-ink`, `--badge-warn-icon`).
- **Warm Gold Tint** (`#FEF6E2`): Soft warm wash (`--accent`, `--mnu-gold-tint`, `--badge-warn-bg`) applied on chip/button hover, active KPI icon containers, unread badge pills, and `HIGH` priority badges.

### Neutral & Semantic
- **Pure White** (`#FFFFFF`): Primary button foreground text (`--primary-foreground`), sticky workspace top bar (`rgba(255, 255, 255, 0.95)`), KPI/ledger card surfaces (`--card`), and circular emblem backing ring.
- **Frosted Portal Glass** (`rgba(255, 255, 255, 0.72)` mid-stop): Translucent gradient threshold card surface (`0.82` top → `0.72` mid → `0.68` bottom) paired with `12px` backdrop blur and `150%` saturation over campus photography.
- **Translucent Input Fill** (`rgba(255, 255, 255, 0.85)`): Resting fill for credential inputs sitting inside the frosted card.
- **Translucent Chip Surface** (`rgba(255, 255, 255, 0.65)`): Resting fill for subordinate quick-demo role buttons nested inside the frosted card.
- **Cool Navy Paper** (`#F5F7FA`): Semantic workspace canvas background token inside `.mnu-portal-surface` (`--background`).
- **Pale Slate-Navy** (`#EBEEF4`): Secondary surface token (`--secondary`) for low-emphasis buttons, `SUBMITTED` neutral status pills, `MEDIUM` priority badges, date pill backing (`bg-secondary/60`), and full-row ledger hover washes (`hover:bg-secondary/45`).
- **Muted Slate-Navy** (`#E9EBF2`): Subtle muted container fill (`--muted`) and `CLOSED` neutral status pills.
- **Navy-Tinted Slate Ink** (`#2E3C61`): Secondary body copy, subtitles, input placeholders, ledger metadata timestamps, and legal/admin notices (`--muted-foreground`).
- **Soft Navy Hairline** (`#CAD1E2`): Card borders, section dividers, ledger `divide-y` rules (`divide-border/75`), and resting outline chip/badge borders (`--border`).
- **Input Stroke** (`#BFC6D9`): Resting `1px` border around text, password, and period select inputs (`--input`).
- **Sidebar Light Ink** (`#F8F9FC`), **Sidebar Muted Ink** (`#AFBAD4`), **Sidebar Active Wash** (`#102456` / `rgba(255, 255, 255, 0.11)`), and **Sidebar Hairline** (`#223159`): Typography, resting links, active link panel, and section borders over `#04153E`.
- **Directional Navy Scrim** (`rgba(4, 21, 62, 0.44)` mid-stop): Three-stop vertical gradient overlay (`0.36` top, `0.44` middle, `0.60` bottom) anchoring the full-bleed campus photograph while letting architectural silhouettes diffuse through the frosted glass.
- **Floating Navy Glass Pill** (`rgba(4, 21, 62, 0.78)` resting / `rgba(4, 21, 62, 0.92)` hover): Translucent dark pill background for top-end viewport controls over photography.
- **Destructive Crimson** (`#B0251C`) and **Crimson Alert Tint** (`rgba(176, 37, 28, 0.10)`): Semantic error text, `CRITICAL` priority fill, `REJECTED` status badge text, `aria-invalid="true"` input stroke, and `role="alert"` banner fill (paired with `rgba(176, 37, 28, 0.25)` border).

### Named Rules
**The Crest Gold Restraint Rule.** MNU Crest Gold (`#F9B301`) is reserved strictly for keyboard `focus-visible` rings, `3px` sidebar active indicators, active hover/semantic border accents, and translucent text selection (`32%` opacity), never large button fills or body copy; small icons on light surfaces step down to Burnished Gold Ink (`#966703`) and `HIGH` warning badges step down to Warm Gold Tint (`#FEF6E2`) with `#04153E` text to preserve legibility.

**The Scrim Anchor Rule.** Photographic campus backdrops sit behind a three-stop vertical navy scrim (`36%` to `44%` to `60%` of `#04153E`) so floating dark glass controls and the centered translucent threshold card maintain stable contrast while preserving visible frosted-glass depth.

## Typography

**Display & UI Font (English / LTR):** Inter (`ui-sans-serif, system-ui, sans-serif` fallback)
**Primary Font (Arabic / RTL):** IBM Plex Sans Arabic (`Inter, sans-serif` fallback)
**Configured Unused Display Token:** Instrument Serif (`tailwind.config.ts` `font-display`, overridden to `IBM Plex Sans Arabic` / `Inter` inside `.mnu-portal-surface`)

**Character:** Clean institutional neo-grotesque pairing tuned for crisp bilingual parity across Arabic RTL and English LTR workflows, giving greetings, tabular KPI figures, ledger titles, credentials, and status pills high scan clarity without ornamental serif flourishes.

### Hierarchy
- **Headline** (`700`, `1.65rem` mobile / `1.75rem` at `640px+`, `1.25` line-height, `-0.02em` letter-spacing): Login portal wordmark (`CampusCare`) and workspace greeting (`Good afternoon, {firstName}` with no eyebrow kicker).
- **KPI Value** (`700`, `1.75rem`, `1.0` line-height, `-0.02em` letter-spacing, `tabular-nums`): Four-column portal summary counter and duration figures (`PortalSummaryGrid` across `StudentSummaryGrid`, `OfficerSummaryGrid`, `TechnicianSummaryGrid`, `ManagerSummaryGrid`, and `AdminSummaryGrid`).
- **Section Heading** (`600`, `1rem` / `16px`, `1.375` line-height, `-0.01em` letter-spacing): Status ledger, chart, and intelligence card titles (`Recent maintenance requests`, `Notifications`, `Recent claims`, `Recent lost & found reports`, `Claims & handover triage`, `Suggested item matches`, `Items by category`, `Pending request queue`, `Work order dispatch watch`, `Request breakdown`, `Technician workload`, `Building hotspots & rating`, `Recent activity log`, `Accounts & role directory`, `Activity by building`, `Users by role`, `Cross-module activity`, `Maintenance Operational Intelligence`, `Platform-Wide Executive AI Intelligence`).
- **Body** (`400–500`, `0.875rem` / `14px`, `1.625` line-height for subtitles; `1.43` line-height inside inputs, sidebar items, and alerts): Scope subtitles, ledger item titles (`500` with `dir="auto"`), field values, and sidebar navigation labels.
- **Action** (`600`, `0.875rem` / `14px`, `1.43` line-height; `0.75rem` / `12px` in compact `h-9` / `h-10` dashboard header CTAs): Primary submit and workspace action labels.
- **Label** (`500`, `0.8125rem` / `13px`, `1.0` line-height): Form field labels (`Email`, `Password`).
- **Caption** (`400–600`, `0.75rem` / `12px`, `1.625` line-height on notices and `text-pretty` notification messages; `11.5px` on compact timestamps and demo chips): Account notices, sidebar group headers (`ltr:uppercase ltr:tracking-[0.12em]`), metadata codes (`font-mono tabular-nums`), role pills, and floating language pill text.

### Named Rules
**The Bilingual Reset Rule.** English surfaces enable Inter stylistic alternates (`'cv02', 'cv03', 'cv04', 'cv11'`) and scope uppercase tracking to `ltr:` (`ltr:uppercase ltr:tracking-wide`), whereas `html[lang='ar']` switches `body` to `'IBM Plex Sans Arabic', 'Inter', sans-serif` and resets `font-feature-settings` to `normal` so Arabic glyphs and ligatures render cleanly.

**The Mixed-Script Ledger Rule.** User-authored maintenance and lost-and-found titles inside ledger rows render with `dir="auto"` and `text-start` (plus `line-clamp-2` below `640px`, `sm:truncate` above), preventing RTL ellipsis from clipping the start of English titles while staying flush to the reading edge.

## Layout

**Login Threshold (`LoginPage.tsx`):** Centered full-viewport single-column shell (`min-h-screen`, `flex-col items-center justify-center`, `overflow-x-hidden`). Mobile applies `16px` horizontal padding and `64px` top padding (`pt-16 pb-8`) to clear the fixed top-end language pill; `640px+` balances to `24px` horizontal and `32px` vertical padding around a `440px` max-width frosted card.

**Migrated Portal Workspaces (`AppShell.tsx`, `DashboardPage.tsx`, `StudentDashboard.tsx`, `OfficerDashboard.tsx`, `TechnicianDashboard.tsx`, `ManagerDashboard.tsx`, `AdminDashboard.tsx`):**
- **Navigation Frame:** Fixed `288px` (`w-72`) start-edge Deep Navy sidebar visible at `1024px+` (`lg:block`, content offset `lg:ps-72`), collapsing below `lg` into a left/start Sheet drawer (`86%` width, `max-w-xs` / `320px`).
- **Top Header Bar:** Sticky `64px` (`h-16`) white frosted bar (`bg-card/95 backdrop-blur`) with `1px` bottom border. Mobile (`< lg`) fits a `shrink-0` `40px` menu button, compact `BrandMark` (tagline hidden below `640px`), `LanguageToggle`, `NotificationBell`, and compact `UserMenu` inside `px-3`; desktop (`lg+`) shows `CampusCare / Dashboard` breadcrumb, date pill (`xl+`), `LanguageToggle`, `NotificationBell`, and full `UserMenu`.
- **Main Canvas (`#main-content`):** Centered `1440px` max-width container (`px-4 py-6 sm:px-6 lg:px-8 lg:py-8`, `space-y-6`) starting with a border-bottom workspace header (`pb-6`, `Period` select + equal-width 2-column `h-10` CTA row below `640px`, single inline `h-9` row at `sm+`), followed by a 4-column clickable KPI row (`gap-4 sm:grid-cols-2 xl:grid-cols-4`). Below the KPI row, `StudentDashboard` renders a 2×2 status ledger grid (`gap-5 lg:grid-cols-2`); `OfficerDashboard` pairs a 2-column live triage ledger row (`Claims & handover triage` + `Suggested item matches` with symmetric inline status strips) above a 3-column MNU-calibrated analytics row (`OfficerCharts`, `gap-4 xl:grid-cols-3`); `TechnicianDashboard` operates as a pure field-dispatch board pairing 4 status KPIs (with Destructive Crimson overdue emphasis when `> 0`) above two live work-order dispatch queues (`Active & overdue dispatch` + `Assigned & upcoming schedule`, folding average resolution and feedback rating into inline summary strips with inline `Start` / `Complete` row controls and no bottom charts); `ManagerDashboard` pairs 4 triage KPIs (`Pending review`, `Active work orders`, `Overdue`, `Avg. resolution`) above 2 live queues (`Pending request queue` + `Work order dispatch watch`), a 3-column MNU analytics row (`ManagerCharts`, `gap-4 xl:grid-cols-3`), and the streamlined `InsightsPanel` below; and `AdminDashboard` pairs 4 clickable governance pillars (`Users & Accounts`, `Locations and Facilities`, `Maintenance`, `Lost & Found`) above 2 live governance ledgers (`Recent activity log` + `Accounts & role directory` with single-line inline summary strips and read-only audit posture), a 3-column MNU analytics row (`AdminCharts`, `gap-4 xl:grid-cols-3`), and the full-width `InsightsPanel` (`scope="admin"`) below.

Directionality relies on CSS logical properties (`start`/`end`, `ps-72`, `pe-10`, `border-e`, `rtl:rotate-180`) so Arabic RTL (`<html lang="ar" dir="rtl">`) and English LTR mirror cleanly without layout rewrites, while email and password inputs enforce `dir="ltr"`.

## Elevation & Depth

On the unauthenticated threshold, the portal builds atmospheric depth through a frosted translucent plane suspended over dark-scrimmed campus photography (`shadow-[0_24px_60px_-14px_rgba(4,21,62,0.52)]` + inset `75%` white ring). Inside all migrated workspaces (`STUDENT_EMPLOYEE`, `LOST_FOUND_OFFICER`, `TECHNICIAN`, `MAINTENANCE_MANAGER`, and `SUPER_ADMIN`), surfaces flatten to single-elevation structural contrast: `#FFFFFF` cards with crisp `1px` `#CAD1E2` borders (`shadow-none`) resting directly on `#F5F7FA` cool paper, with zero nested inner cards inside ledgers or analytics summaries (`InsightsPanel` uses a `1px` hairline-divided cool-paper cell strip rather than nested card boxes).

On initial mount of `LoginPage`, the threshold card plays a subtle entrance settle (`mnu-threshold-card`: `360ms cubic-bezier(0.16, 1, 0.3, 1)` from `opacity: 0.94` and `translateY(8px)` to rest), automatically disabled when `prefers-reduced-motion: reduce` is active.

### Shadow Vocabulary
- **Threshold Card Float** (`box-shadow: 0 24px 60px -14px rgba(4, 21, 62, 0.52), inset 0 0 0 1px rgba(255, 255, 255, 0.75)`): Elevation for the centered frosted glass card over the scrimmed campus backdrop.
- **Interactive Control Lift** (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`): Subtle `shadow-sm` depth on buttons, inputs, period select, `UserMenu` trigger, and floating language pill.
- **Flat Workspace Surface** (`box-shadow: none`): Workspace KPI and ledger cards declare depth through `1px` `#CAD1E2` borders over `#F5F7FA` rather than drop shadows.

### Named Rules
**The Single-Elevation Ledger Rule.** Workspace cards declare elevation once via a crisp `1px` `#CAD1E2` border with `shadow-none`, and list rows inside them remain flat (`divide-y divide-border/75`, transparent at rest, `#EBEEF4` wash only on `:hover`), banning nested card boxes inside cards.

## Shapes

Corner geometry steps proportionally from nested controls to framing containers using the `0.75rem` (`12px`) `--radius` base: `8px` (`rounded-lg` inside `Sidebar` `rounded-lg` / `rounded-md` nav items, `10px` `rounded-md` for inputs, select, and CTA buttons), `12px` (`rounded-xl` for workspace KPI & ledger cards, `rounded-lg` for ledger hover rows, alert banners, and demo chips), `16px` (`rounded-2xl` for the threshold card), and `9999px` (`rounded-full` for the circular university emblem, role badge, status/priority pills, bell badge, `UserMenu`, and floating language pill).

Borders remain uniformly `1px` across resting controls and dividers (`#BFC6D9` on inputs, `#CAD1E2` on cards, outline buttons, neutral badges, and dividers, `rgba(176, 37, 28, 0.25)` on alert banners, `rgba(255, 255, 255, 0.25)` on the floating glass pill), stepping up to `2px` `#F9B301` rings on `:focus-visible`.

## Components

### Buttons
Tactile navy authority for primary submissions balanced by crisp white-outlined secondary actions and pill utilities.
- **Shape:** `10px` (`rounded-md`) across base `Button` primitives (`h-10` default, `h-9` sm, `h-11` lg, `40px × 40px` icon).
- **Primary:** Solid `#04153E` fill with `#FFFFFF` semibold label (`44px` full-width on `LoginPage`; `40px` mobile / `36px` `sm+` in `DashboardPage` `+ New request`), shifting to `#0A2361` on hover and `#031030` on active press; `focus-visible` renders a `2px` `#F9B301` ring with `2px` offset.
- **Workspace Outlined Action (`+ Report item`):** `#FFFFFF` fill, `1px` `#CAD1E2` border, `#04153E` semibold label, and `16px` Burnished Gold Ink (`#966703`) icon; hover shifts border to `#F9B301` and fill to `#FEF6E2`.

### Chips & Badges
Subordinate role triggers and restrained MNU-calibrated status/priority pills.
- **Demo Role Chips (`LoginPage`):** `32px` height (`h-8`), `12px` radius (`rounded-lg`), `rgba(255, 255, 255, 0.65)` fill, `1px` `rgba(4, 21, 62, 0.16)` border, `11.5px` medium `#04153E` label, and `14px` `#966703` icon (`hover:border-[#F9B301] hover:bg-[#FEF6E2]/92`).
- **Priority & Status Badges:** `HIGH` priority uses `--badge-warn-*` (`#FEF6E2` fill, `60%` `#F9B301` border, `#04153E` label, `#966703` icon); `CRITICAL` uses `#B0251C` (`--destructive`) with white text; neutral statuses (`SUBMITTED`, `CLOSED`, `CANCELLED`, `DISMISSED`) and `MEDIUM`/`LOW` priorities pull `--secondary`, `--muted`, and `--border` so they adapt automatically to cool navy-tinted slates inside `.mnu-portal-surface`.
- **Unread Counters:** Ledger `8 unread` pill uses `#FEF6E2` fill with `60%` `#F9B301` border and `#04153E` semibold text; `NotificationBell` unread badge uses `bg-primary text-primary-foreground` (`#04153E` / `#FFFFFF`) with a `2px` `#FFFFFF` ring.

### Cards / Containers
Translucent threshold card on entry; flat crisp-bordered cards inside the workspace.
- **Threshold Card (`LoginPage`):** `440px` max width, `16px` radius (`rounded-2xl`), frosted white gradient (`0.82 → 0.72 → 0.68`) with `12px` backdrop blur, `150%` saturation, deep navy drop shadow, and `24px`/`28px` padding.
- **KPI Metric Cards (`PortalSummaryGrid`, `StudentSummaryGrid`, `OfficerSummaryGrid`, `TechnicianSummaryGrid`, `ManagerSummaryGrid`, `AdminSummaryGrid`):** Clickable `Link` cards (`12px` radius `rounded-xl`, `1px` `#CAD1E2` border, `#FFFFFF` fill, `20px` padding) with `12px` label, `28px` bold `tabular-nums` metric, hint caption, and `36px × 36px` icon chip (`#FEF6E2`/`#966703` when attention-bearing or active, `rgba(176, 37, 28, 0.10)`/`#B0251C` with crimson hairline when overdue `> 0`, `8%` `#04153E` otherwise); hover shifts border to `38%` `#04153E` (or `#B0251C` on danger cards).
- **Status Ledger Cards (`PortalLedgerCard`, `StudentDashboard`, `OfficerTriageLedgers`, `TechnicianDispatchLedgers`, `ManagerTriageLedgers`, `AdminGovernanceLedgers`):** `12px` radius (`rounded-xl`), `1px` `#CAD1E2` border, `#FFFFFF` fill, `shadow-none`, `16px` semibold header with `View all` link (`min-h-8` hit target) or unread pill, optional inline triage/dispatch/governance summary strip (`border-b border-border/75 pb-3`) without nested card boxes (`AdminGovernanceLedgers` pairs `logged events` + `Read-only audit trail` with `active accounts` + active/technician summary, and styles audit actions with semantic navy/gold/crimson pills alongside initials-avatar user rows), `flex-1` empty/loading/error states filling remaining vertical space, and flat `divide-y divide-border/75` rows wrapped either in full-row interactive `Link` containers (`PortalLedgerRow`, `AdminGovernanceLedgers`, `hover:bg-secondary/45`) or sibling title-link + action-button rows (`TechnicianWorkOrderRow`) with no nested interactive controls.
- **Analytics Charts (`OfficerCharts`, `ManagerCharts`, `AdminCharts`):** Three `12px` single-border cards aligned via `flex h-full flex-col` and `mt-auto` chart bodies using MNU Deep Navy (`#04153E`), Burnished Gold Ink (`#966703`), and Navy-Tinted Slate (`#2E3C61`) series inside `<div dir="ltr">` Recharts frames (`ManagerCharts` pairs a `By status` / `By category` segmented pill toggle with stacked technician workload and building/rating progress bars; `AdminCharts` renders all three analytics views—building demand at `142px` Y-axis width, user distribution by role at `126px`, and localized cross-module activity at `118px`—as horizontal `layout="vertical"` bar charts to keep long bilingual Arabic and English labels legible without diagonal rotation or collision).
- **Operational Intelligence (`InsightsPanel`, `InsightSections`):** Single-border `12px` card (`shadow-none`) featuring a `1px` hairline-divided `#F5F7FA` (`bg-background` inside `bg-border/75`) summary cell strip (`col-span-2 sm:col-span-1` on the trailing cell at mobile breakpoints), `--badge-warn-*` unavailable status banner, `min-w-0` constrained `AdminOperationalSnapshot` cards preventing mobile truncation overflow, and flat `bg-secondary/35` insight blocks with `ltr:`-guarded uppercase headings.

### Inputs / Fields
Crisp inputs anchored against frosted or cool-paper surfaces with gold focus rings.
- **Style:** `44px` height (`h-11`) in login forms (`40px` base, `h-10 sm:h-9` on `DashboardPeriodSelect`), `10px` radius (`rounded-md`), `rgba(255, 255, 255, 0.85)` or `#FFFFFF` fill, `1px` `#BFC6D9` border, `#04153E` text/caret, and `#2E3C61` placeholder. Password inputs lock to `dir="ltr"` with `pe-10`, `rtl:placeholder:text-right`, and an inset `32px × 32px` eye toggle (`hover:bg-[#FEF6E2]`).
- **Focus & Error:** Valid fields shift border to `#04153E` with a `2px` `#F9B301` ring (`1px` offset); `aria-invalid="true"` applies `#B0251C` border with a `12px` crimson hint below.

### Navigation
Single floating bilingual pill on entry; job-grouped Deep Navy sidebar and unified top bar inside the portal.
- **Floating Language Pill (`LoginPage`):** Fixed `end-4 top-4 sm:end-6 sm:top-6`, `36px` height, `9999px` pill radius, `rgba(4, 21, 62, 0.78)` glass with `12px` blur and `1px` `25%` white border (`hover:bg-[#04153E]/92 hover:border-[#F9B301]/85`).
- **MNU Job-Grouped Sidebar (`Sidebar`):** `#04153E` ground, `40px` white-rimmed circular MNU emblem + `CampusCare` wordmark, compact role badge (`Student / Employee`, `Lost & Found Officer`, `Technician`, `Maintenance Manager`, or `Super Admin`) with `#F9B301` status dot, and role-specific workflow groups (`Overview`, `Maintenance`, `Lost & Found` for students/employees; `Overview`, `Triage & Verification`, `Item Registry` for officers; `Overview`, `Field Operations` for technicians; `Overview`, `Triage & Dispatch`, `Planning & Quality` for maintenance managers; `Overview`, `Governance & Directory`, `Campus Oversight` for super admins) with no duplicate footer user bar. Active links show `rgba(255, 255, 255, 0.11)` fill, `1px` inset `10%` white ring, `#F9B301` `16px` icon, and a `3px` `#F9B301` start-edge indicator bar.
- **Workspace Top Bar (`AppShell`):** Sticky `64px` white header featuring a single unified `UserMenu` pill (`Profile` + `Sign out`), `NotificationBell`, `LanguageToggle`, `xl+` date chip, and on mobile a `shrink-0` `40px` drawer trigger beside the compact `BrandMark`.

## Do's and Don'ts

### Do:
- **Do** wrap newly redesigned MNU portal surfaces with `.mnu-portal-surface` so `--primary`, `--ring`, `--muted-foreground`, `--accent`, `--sidebar*`, and `--badge-warn-*` switch atomically from legacy green to MNU navy and gold.
- **Do** use Burnished Gold Ink (`#966703`) for icons on light cards and `#FEF6E2` + `#04153E` text for warning badges, reserving bright MNU Crest Gold (`#F9B301`) for `2px` focus rings, `3px` sidebar active bars, hover border accents, and `32%` selection highlights.
- **Do** author layouts with CSS logical properties (`start`/`end`, `ps-72`, `pe-10`, `rtl:rotate-180`), apply `dir="auto"` + `text-start` to mixed-script ledger titles, and lock credential inputs to `dir="ltr"`.
- **Do** keep workspace cards flat (`shadow-none`, `1px` `#CAD1E2` border) with full-row clickable ledger links (`min-h-8` on secondary header links, `shrink-0` on `40px` mobile header triggers) and `text-pretty` on notification descriptions.

### Don't:
- **Don't** mix legacy `:root` forest-green tokens (`#145C49`, `#0F241C`, `#12372c`, `shadow-panel`) or warm `stone-*` badge classes into newly migrated MNU surfaces.
- **Don't** render bright MNU Crest Gold (`#F9B301`) or yellow `amber-400` as solid badge/button fills or body text against light surfaces.
- **Don't** place nested card boxes inside ledger cards (`rounded-lg bg-secondary/65` inside `divide-y` inside `StudentLedgerCard`) or duplicate user/sign-out panels in both the top bar and sidebar footer.
- **Don't** apply `uppercase` or positive `letter-spacing` (`tracking-wide`) unconditionally across Arabic RTL strings; guard letter-spaced uppercase with `ltr:`.
