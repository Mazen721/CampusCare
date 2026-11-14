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

CampusCare completes its role-portal visual migration (`PRODUCT.md`) under the MNU portal surface system documented here (`.mnu-portal-surface` in `src/index.css`), spanning the sign-in screen (`src/features/auth/LoginPage.tsx`), the `STUDENT_EMPLOYEE` self-service portal, the `LOST_FOUND_OFFICER` triage portal, the `TECHNICIAN` field workbench, the `MAINTENANCE_MANAGER` triage portal, and the `SUPER_ADMIN` whole-system tracking portal (`AppShell.tsx`, `Sidebar.tsx`, `BrandMark.tsx`, `navigation.ts`, `DashboardPage.tsx`, `PortalSummaryGrid.tsx`, `PortalLedgerCard.tsx`, `PortalLedgerRow.tsx`, `StudentDashboard.tsx`, `StudentSummaryGrid.tsx`, `studentHelpers.ts`, `OfficerDashboard.tsx`, `OfficerSummaryGrid.tsx`, `OfficerTriageLedgers.tsx`, `OfficerCharts.tsx`, `TechnicianDashboard.tsx`, `TechnicianSummaryGrid.tsx`, `TechnicianDispatchLedgers.tsx`, `technicianHelpers.ts`, `ManagerDashboard.tsx`, `ManagerSummaryGrid.tsx`, `ManagerTriageLedgers.tsx`, `ManagerCharts.tsx`, `AdminDashboard.tsx`, `AdminSummaryGrid.tsx`, `AdminGovernanceLedgers.tsx`, `AdminCharts.tsx`, `InsightsPanel.tsx`, `InsightSections.tsx`).

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
- **Destructive Crimson** (`#B0251C`) and **Crimson Alert Tint** (`rgba(176, 37, 28, 0.10)`): Semantic error text, `CRITICAL` priority fill, `REJECTED` / `OVERDUE` status badge text, `aria-invalid="true"` input stroke, and `role="alert"` banner fill (paired with `rgba(176, 37, 28, 0.25)` border).
- **Emerald Positive Signal** (`#059669` / `bg-emerald-500/10 text-emerald-700`): Restrained completion and health accent used for `COMPLETED` / `APPROVED` / `CONFIRMED` / `RETURNED` status badges, healthy SLA indicators, completed shift counters, and step-3 tracker completion bars.

### Named Rules
**The Crest Gold Restraint Rule.** MNU Crest Gold (`#F9B301`) is reserved strictly for keyboard `focus-visible` rings, `3px` sidebar active indicators, top KPI accent bars, active hover/semantic border accents, and translucent text selection (`32%` opacity), never large button fills or body copy; small icons on light surfaces step down to Burnished Gold Ink (`#966703`) and `HIGH` warning badges step down to Warm Gold Tint (`#FEF6E2`) with `#04153E` / `#92400E` text to preserve legibility.

**The Restrained 4-Tone Semantic Accent Rule.** All dashboard cards stay pure white (`#FFFFFF`) over cool paper (`#F5F7FA`) with crisp neutral borders (`#CAD1E2`)—never colored card backgrounds or rainbow gradients. Color is applied strictly as a purposeful signal on `3px` top accent lines, `40×40px` / `44×44px` soft icon chips, progress bars, and status pills across four tones: **MNU Deep Navy** (brand anchor & active work), **Warm Gold** (pending review & verification), **Emerald** (completed, approved, & healthy SLA), and **Destructive Crimson** (reserved exclusively for `Overdue > 0`, `Critical` priority, `Rejected`, or error states).

**The Scrim Anchor Rule.** Photographic campus backdrops sit behind a three-stop vertical navy scrim (`36%` to `44%` to `60%` of `#04153E`) so floating dark glass controls and the centered translucent threshold card maintain stable contrast while preserving visible frosted-glass depth.

## Typography

**Display & UI Font (English / LTR):** Inter (`ui-sans-serif, system-ui, sans-serif` fallback)
**Primary Font (Arabic / RTL):** IBM Plex Sans Arabic (`Inter, sans-serif` fallback)
**Configured Unused Display Token:** Instrument Serif (`tailwind.config.ts` `font-display`, overridden to `IBM Plex Sans Arabic` / `Inter` inside `.mnu-portal-surface`)

**Character:** Clean institutional neo-grotesque pairing tuned for crisp bilingual parity across Arabic RTL and English LTR workflows, giving greetings, tabular KPI figures, ledger titles, credentials, and status pills high scan clarity without ornamental serif flourishes.

### Hierarchy
- **Headline** (`700`, `1.65rem` mobile / `1.75rem` at `640px+`, `1.25` line-height, `-0.02em` letter-spacing): Login portal wordmark (`CampusCare`) and workspace greeting (`Good afternoon, {firstName}` with no eyebrow kicker).
- **KPI Value** (`700`, `1.75rem`, `1.0` line-height, `-0.02em` letter-spacing, `tabular-nums`): Four-column portal summary counter and duration figures (`PortalSummaryGrid` across `OfficerSummaryGrid` and `ManagerSummaryGrid`, plus metric/shift tiles in `AdminSummaryGrid` and `TechnicianSummaryGrid`).
- **Section Heading** (`600`, `1rem` / `16px`, `1.375` line-height, `-0.01em` letter-spacing): Status ledger, tracker, chart, and intelligence card titles (`Track my requests & claims`, `Recent updates`, `Claims & matches triage`, `Recovery pipeline`, `Your Current Priority Task`, `Your Simple Shift Summary`, `Remaining Tasks Queue`, `Triage & Escalation Queue`, `SLA Health & Resolution`, `Requests by status`, `Technician workload`, `Campus Building Cross-System Load Matrix`, `Role Governance & Cross-Module Volume`, `Live Cross-System Audit Trail`, `Account Directory & Status`, `Maintenance Operational Intelligence`, `Platform-Wide Executive AI Intelligence`).
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
- **Collapsible Navigation Frame:** Fixed `288px` (`w-72`) start-edge Deep Navy sidebar visible at `1024px+` (`lg:block`, content offset `lg:ps-72`), collapsing below `lg` into a left/start Sheet drawer (`86%` width, `max-w-xs` / `320px`). On desktop (`lg+`), a toggle persisted in `localStorage` (`cc-sidebar-collapsed`) collapses `<aside>`, transitions the content offset to `lg:ps-0`, and expands the workspace canvas.
- **Top Header Bar:** Sticky `64px` (`min-h-16`) white frosted bar (`bg-card/95 backdrop-blur`) with `1px` bottom border. Mobile (`< lg`) fits a `shrink-0` `40px` menu button, compact `BrandMark` (tagline hidden below `640px`), `LanguageToggle`, `NotificationBell`, and compact `UserMenu` inside `px-3`. Desktop (`lg+`) shows a sidebar collapse/expand button (`PanelLeftClose` / `PanelLeftOpen`), either the `CampusCare / {title}` breadcrumb (when sidebar is expanded) or `DesktopFastNav` horizontal `<NavLink>` fast-navigation pills for `getNavigation(user.role)` (when sidebar is collapsed), plus the date pill (`xl+` / `2xl+`), `LanguageToggle`, `NotificationBell`, and `UserMenu`.
- **Main Canvas (`#main-content`) & Role-Tailored Architectures:** Centered `1440px` max-width container (`px-4 py-6 sm:px-6 lg:px-8 lg:py-8`, `space-y-7`) starting with a clean, breathable border-bottom header (`pb-6`, greeting + subtle role badge, on-demand **"AI Insights"** drawer toggle for `MAINTENANCE_MANAGER` and `SUPER_ADMIN`, `DashboardPeriodSelect` hidden on `TECHNICIAN` and `STUDENT_EMPLOYEE`, and primary role CTA):
  - **Super Admin (`SUPER_ADMIN` — Whole-System Tracking Architecture):**
    - *Row 1 (`AdminSummaryGrid`, `lg:grid-cols-3 gap-5`):* 3 executive subsystem domain monitors (`Identity & Campus Infrastructure`, `Maintenance Operations Pipeline`, `Lost & Found & Claims Pipeline`) with `3px` top accents (`navy`, `emerald`, `gold`), dual metric blocks, semantic status pills, and direct action links.
    - *Row 2 (`AdminCharts`, `lg:grid-cols-12 gap-6`):* 7-col `Campus Building Cross-System Load Matrix` table (Maintenance vs. Lost & Found volume with dual-segment load bars and `Top load` badge) paired with a 5-col `Role Governance & Cross-Module Volume` panel.
    - *Row 3 (`AdminGovernanceLedgers`, `lg:grid-cols-12 gap-6`):* 8-col `Live Cross-System Audit Trail` with interactive module filter tabs (`All`, `Maintenance`, `Lost & Found`, `Governance`) paired with a 4-col `Account Directory & Status` rail.
  - **Maintenance Manager (`MAINTENANCE_MANAGER` — 8/4 Triage Bento):**
    - *Row 1 (`ManagerSummaryGrid`, `sm:grid-cols-2 xl:grid-cols-4 gap-5`):* 4 restrained top-accent KPI cards (`Pending review`, `Active work orders`, `Overdue`, `Avg. resolution`).
    - *Row 2 (`ManagerTriageLedgers`, `lg:grid-cols-12 gap-6`):* 8-col tabbed `Triage & Escalation Queue` (`Unassigned Queue` / `Overdue Escalations`) paired with a 4-col `SLA Health & Resolution` progress rail.
    - *Row 3 (`ManagerCharts`, `lg:grid-cols-2 gap-6`):* Calm 2-column analytics row (`Requests by status` SVG Donut + `Technician workload` horizontal bars).
  - **Lost & Found Officer (`LOST_FOUND_OFFICER` — 8/4 Triage Bento):**
    - *Row 1 (`OfficerSummaryGrid`, `sm:grid-cols-2 xl:grid-cols-4 gap-5`):* 4 restrained top-accent KPI cards (`Pending claims`, `Suggested matches`, `Open reports`, `Returned items`).
    - *Row 2 (`OfficerTriageLedgers`, `lg:grid-cols-12 gap-6`):* 8-col tabbed `Claims & matches triage` (`Active claims queue` / `AI suggested matches`) paired with a 4-col `Recovery pipeline` progress rail.
    - *Row 3 (`OfficerCharts`, `lg:grid-cols-2 gap-6`):* Calm 2-column analytics row (`Items by status` SVG Donut + `Top item categories` lost-vs-found horizontal bars).
  - **Technician (`TECHNICIAN` — Relaxed Field Workbench):**
    - *Row 1 (`TechnicianSummaryGrid`, `lg:grid-cols-12 gap-6`):* 7-col `Current Priority Task` spotlight card (with `Building | Floor · Room | Category` location strip and one-click `Start Work` / `Complete Task` triggers) paired with a 5-col `Simple Shift Summary` card (3-pill counter grid for `In Progress`, `Assigned`, `Completed` plus average resolution & rating footer).
    - *Row 2 (`TechnicianDispatchLedgers`, `md:grid-cols-3 gap-4`):* Spacious 3-column `Remaining Tasks Queue` cards (`rounded-2xl p-5`) with structured location boxes and direct inline `Start Work` / `Mark Complete` controls.
  - **Student / Employee (`STUDENT_EMPLOYEE` — Relaxed Self-Service Portal):**
    - *Row 1 (`StudentSummaryGrid`, `lg:grid-cols-3 gap-5`):* 3 spacious self-service action cards (`rounded-2xl p-6`) for `Report a maintenance issue` (soft navy chip, active requests pill, primary CTA to `/maintenance/requests/new`), `Report a lost or found item` (soft gold chip, submitted reports pill, CTA to `/lost-found/report`), and `Browse found items & claims` (soft emerald chip, claims count pill, CTA to `/lost-found`).
    - *Row 2 (`StudentDashboard`, `lg:grid-cols-12 gap-6`):* 8-col `Track my requests & claims` panel switching via tabs between `My Maintenance Requests` and `Lost & Found / Claims`, rendering each entry with code, title, status pill, and a calm 3-step visual progress bar (`Submitted` → `In progress / Under review` → `Completed / Approved`), paired with a 4-col `Recent updates` notification card rail with unread indicators and a campus facilities helpdesk footer note.

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
- **Priority & Status Badges (`StatusBadge`, `PriorityBadge`):** `HIGH` priority uses `--badge-warn-*` (`#FEF6E2` fill, `60%` `#F9B301` border, `#04153E` label, `#966703` icon); `CRITICAL` uses `#B0251C` (`--destructive`) with white text; `StatusBadge` maps statuses across the restrained 4-tone semantic system (`EMERALD_STYLE` for `COMPLETED`/`APPROVED`/`APPROVED_FOR_HANDOVER`/`MATCH_CONFIRMED`/`RETURNED`/`CONFIRMED`; `GOLD_STYLE` for `UNDER_REVIEW`/`IN_PROGRESS`/`REOPENED`/`PENDING_ASSIGNMENT`/`CLAIM_UNDER_REVIEW`/`PENDING_REVIEW`/`UNDER_VERIFICATION`/`SUGGESTED`; `NAVY_STYLE` for `SUBMITTED`/`ASSIGNED`/`OPEN`; `CRIMSON_STYLE` for `REJECTED`/`OVERDUE`; and `MUTED_STYLE` for `CLOSED`/`CANCELLED`/`DISMISSED`).
- **Unread Counters:** Ledger unread pills use `border-amber-500/35 bg-amber-500/[0.12] text-amber-800`; `NotificationBell` unread badge uses `bg-primary text-primary-foreground` (`#04153E` / `#FFFFFF`) with a `2px` `#FFFFFF` ring.

### Cards / Containers
Translucent threshold card on entry; flat crisp-bordered cards inside the workspace.
- **Threshold Card (`LoginPage`):** `440px` max width, `16px` radius (`rounded-2xl`), frosted white gradient (`0.82 → 0.72 → 0.68`) with `12px` backdrop blur, `150%` saturation, deep navy drop shadow, and `24px`/`28px` padding.
- **Top-Accent KPI & Domain Monitor Cards (`PortalSummaryGrid`, `ManagerSummaryGrid`, `OfficerSummaryGrid`, `AdminSummaryGrid`):** Clickable `Link` cards (`PortalSummaryGrid`: `rounded-xl`, `1px` `#CAD1E2` border, `#FFFFFF` fill, `p-5`) or domain monitors (`AdminSummaryGrid`: `lg:grid-cols-3`) featuring a `3px` top accent line (`navy`, `gold`, `emerald`, or `danger`), `40×40px` soft icon chip, `28px` bold `tabular-nums` metric, hint line, and `h-1` progress bar.
- **Relaxed Self-Service & Field Workbench Cards (`StudentSummaryGrid`, `StudentDashboard`, `TechnicianSummaryGrid`, `TechnicianDispatchLedgers`):** Spacious `16px` radius (`rounded-2xl`), `1px` border, `#FFFFFF` fill, and `p-5` / `p-6` padding supporting 3-step visual progress bars (student tracker) and location-first field job cards (technician workbench).
- **8/4 Bento Triage & Governance Containers (`ManagerTriageLedgers`, `OfficerTriageLedgers`, `AdminGovernanceLedgers`, `StudentDashboard`):** `rounded-xl` / `rounded-2xl` 12-column grids pairing an 8-col tabbed ledger (`role="tablist"`) with a 4-col secondary status/updates rail (`SLA Health & Resolution`, `Recovery Pipeline`, `Account Directory & Status`, `Recent Updates`).
- **Analytics Panels (`OfficerCharts`, `ManagerCharts`, `AdminCharts`):** 2-column calm SVG Donut + horizontal progress bar panels (`OfficerCharts`, `ManagerCharts`) and the 7/5 `Campus Building Cross-System Load Matrix` + `Role Governance & Cross-Module Volume` pair (`AdminCharts`), ensuring crisp bilingual RTL/LTR alignment without chart label overlap.
- **Operational Intelligence (`InsightsPanel`, `InsightSections`):** On-demand collapsible drawer toggled from the `DashboardPage` header (`MAINTENANCE_MANAGER` and `SUPER_ADMIN`), featuring a `3px` gold top bar, period switcher (`7d` / `30d`), `ExecutivePulseStrip` tiles, `--badge-warn-*` unavailable banner, and flat `bg-secondary/35` insight blocks with `ltr:`-guarded uppercase headings.

### Inputs / Fields
Crisp inputs anchored against frosted or cool-paper surfaces with gold focus rings.
- **Style:** `44px` height (`h-11`) in login forms (`40px` base, `h-10 sm:h-9` on `DashboardPeriodSelect`), `10px` radius (`rounded-md`), `rgba(255, 255, 255, 0.85)` or `#FFFFFF` fill, `1px` `#BFC6D9` border, `#04153E` text/caret, and `#2E3C61` placeholder. Password inputs lock to `dir="ltr"` with `pe-10`, `rtl:placeholder:text-right`, and an inset `32px × 32px` eye toggle (`hover:bg-[#FEF6E2]`).
- **Focus & Error:** Valid fields shift border to `#04153E` with a `2px` `#F9B301` ring (`1px` offset); `aria-invalid="true"` applies `#B0251C` border with a `12px` crimson hint below.

### Navigation
Single floating bilingual pill on entry; job-grouped Deep Navy sidebar and unified top bar inside the portal.
- **Floating Language Pill (`LoginPage`):** Fixed `end-4 top-4 sm:end-6 sm:top-6`, `36px` height, `9999px` pill radius, `rgba(4, 21, 62, 0.78)` glass with `12px` blur and `1px` `25%` white border (`hover:bg-[#04153E]/92 hover:border-[#F9B301]/85`).
- **MNU Job-Grouped Collapsible Sidebar (`Sidebar`, `AppShell`):** `#04153E` ground, `40px` white-rimmed circular MNU emblem + `CampusCare` wordmark, sidebar header collapse button (`PanelLeftClose`), compact role badge (`Student / Employee`, `Lost & Found Officer`, `Technician`, `Maintenance Manager`, or `Super Admin`) with `#F9B301` status dot, and role-specific workflow groups with no duplicate footer user bar. Active links show `rgba(255, 255, 255, 0.11)` fill, `1px` inset `10%` white ring, `#F9B301` `16px` icon, and a `3px` `#F9B301` start-edge indicator bar. Collapsing the desktop sidebar hides `<aside>` and switches `AppShell` to `DesktopFastNav` horizontal `<NavLink>` pills (`bg-primary text-primary-foreground` with `#F9B301` icon when active) in the top header bar.
- **Workspace Top Bar (`AppShell`):** Sticky `64px` white header featuring the desktop sidebar toggle button + breadcrumb/fast-navigation pills, `xl+`/`2xl+` date chip, `LanguageToggle`, `NotificationBell`, single unified `UserMenu` pill (`Profile` + `Sign out`), and on mobile a `shrink-0` `40px` drawer trigger beside the compact `BrandMark`.

## Do's and Don'ts

### Do:
- **Do** wrap newly redesigned MNU portal surfaces with `.mnu-portal-surface` so `--primary`, `--ring`, `--muted-foreground`, `--accent`, `--sidebar*`, and `--badge-warn-*` switch atomically from legacy green to MNU navy and gold.
- **Do** use Burnished Gold Ink (`#966703`) for icons on light cards and `#FEF6E2` + `#04153E` text for warning badges, reserving bright MNU Crest Gold (`#F9B301`) for `2px` focus rings, `3px` sidebar active bars, hover border accents, and `32%` selection highlights.
- **Do** author layouts with CSS logical properties (`start`/`end`, `ps-72`, `pe-10`, `rtl:rotate-180`), apply `dir="auto"` + `text-start` to mixed-script ledger titles, and lock credential inputs to `dir="ltr"`.
- **Do** keep workspace cards flat (`shadow-none`, `1px` `#CAD1E2` border) with full-row clickable ledger links (`min-h-8` on secondary header links, `shrink-0` on `40px` mobile header triggers) and `text-pretty` on notification descriptions.

### Don't:
- **Don't** mix legacy `:root` forest-green tokens (`#145C49`, `#0F241C`, `#12372c`, `shadow-panel`) or warm `stone-*` badge classes into newly migrated MNU surfaces.
- **Don't** render bright MNU Crest Gold (`#F9B301`) or yellow `amber-400` as solid badge/button fills or body text against light surfaces.
- **Don't** place nested card boxes inside ledger cards (`rounded-lg bg-secondary/65` inside `divide-y` inside `PortalLedgerCard`) or duplicate user/sign-out panels in both the top bar and sidebar footer.
- **Don't** apply `uppercase` or positive `letter-spacing` (`tracking-wide`) unconditionally across Arabic RTL strings; guard letter-spaced uppercase with `ltr:`.
