# MauRealty Agent Portal — Project Context

> **What this file is:** the single reference for how the Maureal Realty and Brokerage (MRB) web portal works today: its features, the processes behind them, and where each piece of logic lives in the code. It is written for AI assistants and for the dev team.
>
> **Last verified against the code:** 2026-10-28 · branch `feature/sales-report-v2` · commit `859ea5d` · `npx vue-tsc --build --force` passes with **0 errors**.
>
> **Related docs:** `documentation.md` (running log of changes, newest first) · `changelog.md` (early frontend notes, Dec 2025 to Jan 2026, historical only) · `README.md` (setup and branch naming).

---

## Table of contents

1. [Instructions for AI assistants](#1-instructions-for-ai-assistants)
2. [Project overview](#2-project-overview)
3. [Tech stack and setup](#3-tech-stack-and-setup)
4. [Project structure (file map)](#4-project-structure-file-map)
5. [Architecture and cross-cutting patterns](#5-architecture-and-cross-cutting-patterns)
6. [Roles and permissions](#6-roles-and-permissions)
7. [Features](#7-features)
8. [Business rules reference](#8-business-rules-reference)
9. [Database reference](#9-database-reference)
10. [Function index (where things are stored)](#10-function-index-where-things-are-stored)
11. [Known issues, gotchas and tech debt](#11-known-issues-gotchas-and-tech-debt)
12. [Glossary](#12-glossary)
13. [Recent changes and doc discrepancies](#13-recent-changes-and-doc-discrepancies)
14. [Changelog of this file](#14-changelog-of-this-file)

---

## 1. Instructions for AI assistants

Read this section before writing any code for this project.

### 1.1 How to use this file

1. Read this file first, then the newest entries of `documentation.md`, then the specific service and view files your task touches.
2. **Source-of-truth order when things disagree:** the code → `supabase/migrations/*.sql` → this file → `documentation.md` → the original project PDF. If you find a disagreement, trust the code, tell the user about it, and fix this file.
3. Use Section 10 (Function index) to find where something lives before creating anything new. Reuse existing services, utils and components instead of duplicating them.
4. Section 11 lists known bugs and traps. Check it before "fixing" something that looks wrong, because some odd behaviour is deliberate (see 1.4).

### 1.2 Where new code goes

| You are adding... | Put it in | Notes |
|---|---|---|
| A Supabase query, insert, update, delete, upload | `src/services/<domain>Service.ts` | Views and components call services; they should not call `supabase` directly. (`Dashboard.vue` and `LoginForm.vue` still do; don't add more.) |
| A TypeScript interface for DB data | `src/assets/classes/<domain>.ts` | Service-specific shapes may be exported from the service (existing practice: `Sale` in `salesService.ts`, `CommissionTab` in `commissionService.ts`). |
| A pure frontend helper (formatting, math, dates) | `src/utils/` | No Supabase calls, except `liveRefresh.ts`, which subscribes to realtime. |
| A full page | `src/views/<Name>.vue` + a route in `src/router/index.ts` (with `meta: { requiresAuth: true }`) + an entry in `topItems` in `src/components/Sidebar.vue` | Both the desktop sidebar and the phone bottom bar read `topItems`. |
| A reusable or page-specific component | `src/components/<page-folder>/<Name>.vue` | One folder per page (`listings/`, `sales/`, `commissions/`, ...). |
| A DB schema change | a new file in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql` | See 1.5. |

### 1.3 Coding conventions (match the existing code)

- **Vue 3** with the Composition API and `<script setup lang="ts">`. (The original PDF says "Vue 4"; `package.json` pins `vue ^3.5`.)
- Import with the `@/` alias (`@/services/...`, `@/utils/...`).
- Style with **Tailwind 4** utility classes. Use the theme tokens from `src/style.css` (`maurealty-blue`, `maurealty-green`, `background-gray`, `background-dark-gray`, `maurealty-light-blue`, `sidebar-hover`) and add `dark:` variants, since the app has a dark mode.
- Icons come from `lucide-vue-next`. Dropdowns use `@headlessui/vue` `Listbox`.
- Services are exported as object literals (`export const fooService = { async getX() {...} }`) and log errors with `console.error(...)` before re-throwing or returning a fallback.
- After any `update` or `delete`, chain `.select()` and treat **zero returned rows as a failure** (`return { success: false }`). With RLS this is the only way to notice a silently blocked write. Every existing service does this.
- Comments are short and plain: they say *why*, not *what*. Match the density of the file you are in.
- Money is stored in **PHP**; areas are stored in **square metres**. Convert only for display (see 5.5).
- Dates are plain `YYYY-MM-DD` strings. Compare them as strings and do month math with `src/utils/paySchedule.ts`, so there are no timezone shifts. When you must build a `Date` from a date-only string, append `T00:00:00`.

### 1.4 Guardrails

- **Do not change commission formulas, rank rates, override percentages or hierarchy rules** (Section 8) without explicit confirmation from the team. They are business rules from the client, not implementation details.
- Keep `commissions.claimed`, `claimed_at` and `admin_approved` in step with `commissions.status`. Older queries still read them.
- **Role checks happen only in the app.** RLS is the open dev policy on every table. Any new admin-only action must be gated in the UI *and*, where possible, guarded in the service (for example by checking the expected previous status, as `commissionService._advance` does).
- Some features are hidden by being **commented out on purpose**: Net Commission input, Voucher Series input, the Recent Activity panel. Do not delete them, and do not restore them unless asked.
- Do not commit, push or create branches unless the user asks. The main branch is `mainer`. The branch naming rule is `<feat/fix>/<frontend/backend>/<featureName>`.
- Never put real keys in `.env.example`, and never print the contents of `.env.local`.

### 1.5 Database changes

1. Write an **idempotent** migration (`add column if not exists`, `create table if not exists`, `drop policy if exists`, and `do $$ ... $$` blocks for constraints). The team re-runs migrations by hand in the Supabase SQL editor.
2. Quote mixed-case identifiers (`"agent_ID"`, `"listing_ID"`). Lower-case column names stay unquoted.
3. New tables get RLS enabled plus the same open dev policy as the others (see `20261014140000_...sql`, section 4).
4. If a page should refresh live from the new table, add it to the `supabase_realtime` publication (see section 5d of the same migration) and to that page's `useLiveRefresh([...])` list.
5. End the migration with `notify pgrst, 'reload schema';`.
6. Update Section 9 of this file.

### 1.6 Verifying your work

- `npx vue-tsc --build` must stay at 0 errors (it was clean on 2026-10-28).
- `npm run build` runs the type-check and `vite build`.
- There are no automated tests. For logic-heavy code (commission math, hierarchy rules), past sessions checked behaviour with small stubbed Node scripts.

### 1.7 Keeping this file up to date (mandatory)

This file only stays useful if every change is reflected in it. **Whenever you add, change or remove a feature, page, route, service function, util, component, table, column, business rule or permission, or fix an item in Section 11:**

1. Update every affected section: the feature in Section 7, the function in Section 10, the schema in Section 9, the roles table in Section 6, and the item in Section 11 (remove it once fixed).
2. Update the "Last verified" line at the top and add a dated line to [Section 14](#14-changelog-of-this-file).
3. Add a session entry to `documentation.md` in its existing format (newest first, only what changed, no repeats).
4. **If you cannot edit files** (chat-only, read-only, or the user asked for code only), end your answer with a block titled **"Suggested update to project-context.md"** containing the exact text to add or replace and the section it belongs in.
5. Keep the style: tables and short bullets, repo-relative paths in backticks, function names as `service.function()`.

Use this template for a new feature in Section 7:

```markdown
### 7.N Feature name
- **Route / entry point:** `/path` (or which button opens it)
- **Who:** agents / admins / public
- **When it is used:** what the user is trying to do
- **Flow:** 1. ... 2. ... 3. ...
- **Data:** tables read (R) and written (W), storage buckets
- **Code:** `src/views/X.vue`, `src/components/x/Y.vue`, `xService.fn()`
- **Rules and edge cases:** ...
```

---

## 2. Project overview

**MauRealty Agent Portal** (Maureal Realty and Brokerage) is a web portal and listings site for MRB's real-estate agents in the Philippines. Agents use it to:

- publish property listings from developers and share them with clients through temporary public links,
- record a **sale** from a listing and track its status,
- see the **commissions** they will receive (their own and overrides from their downline) and go through the payment process for each payout,
- see their **genealogy** (upline and downline team),
- use **calculators** (loan amortization, net commission, property tax),
- browse the **developers** the company works with, including their promo posters.

**Admins** are agents with `agents.admin_access = true`. They approve listings, sales and commissions, release commission payments with proof, and manage agents, ranks and promotion thresholds.

### 2.1 Core lifecycle at a glance

```
Listing (Property Management)
   │ agent creates → status 'pending' → admin approves → 'active'   (admin-created listings start 'active')
   ▼
Sale (Sales Report / "Sold" button)
   │ created as 'pending approval' (agent can still edit)
   │ admin sets 'awaiting payment' or 'complete'  ──►  commission tabs generated (one per payment per recipient)
   │ admin sets 'cancelled'                       ──►  tabs not yet received are deleted
   ▼
Commission tab (Commissions page)
   pending_approval ─admin approves─► approved ─agent requests─► payment_requested
        ─admin releases with proof images─► payment_released ─agent confirms─► received
```

### 2.2 Team ranks

| position_ID | Rank (DB `positions.position`) | Internal key (`ranks.ts`) | Commission rate |
|---|---|---|---|
| 1 | Property Sales Specialist | `specialist` | 3% |
| 2 | Property Sales Supervisor | `supervisor` | 3.5% |
| 3 | Investment Manager | `investment_manager` | 4% |
| 4 | Partner Broker | `broker` | 4.5% |

The rank titles are marked *provisional pending client confirmation* in `src/assets/classes/agent.ts`.

---

## 3. Tech stack and setup

| Area | Technology | Notes |
|---|---|---|
| Framework | Vue `^3.5` + TypeScript `~5.9`, Vite `^7` | `<script setup>` everywhere. Vue DevTools plugin enabled in `vite.config.ts`. |
| Routing | vue-router `^4.6` | `src/router/index.ts`, HTML5 history. |
| Styling | Tailwind CSS `^4` (`@tailwindcss/vite`), `@tailwindcss/typography` | Theme tokens and utilities in `src/style.css`. Font: Poppins (Google Fonts, `index.html`). |
| Backend | Supabase (`@supabase/supabase-js ^2`) | Auth (email/password), Postgres through PostgREST, Storage, Realtime. Client in `src/supabaseClient.ts`. |
| Maps | `mapbox-gl ^3`, `@mapbox/mapbox-gl-geocoder` | Map display, location picker, reverse geocoding, nearby-POI search. |
| Genealogy tree | `@vue-flow/core` (+ controls, minimap), `@dagrejs/dagre` | Auto-layout of the org chart. |
| UI helpers | `@headlessui/vue` (Listbox), `lucide-vue-next` (icons) | |
| Markdown | `marked` + `dompurify` | Listing descriptions and FAQs: `compileMarkdown()` in `listingsServices.ts`. |
| PDF | `jspdf` + `jspdf-autotable` | Amortization schedule export. |
| Installed but unused | `chart.js`, `@types/chart.js`, `lucide`, `next`, `dagre`, `@types/dagre`, `@vue-flow/background` | Candidates for removal. |

### 3.1 Environment variables (`.env.local`, git-ignored)

| Variable | Used in | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/supabaseClient.ts` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `src/supabaseClient.ts` | Supabase anon key |
| `VITE_MAPBOX_TOKEN` | `MapHolder.vue`, `MapInteractive.vue`, `poiService.ts` | Mapbox access token. **Missing from `.env.example`.** |

### 3.2 Scripts

| Command | Does |
|---|---|
| `npm install` | Install dependencies (Node `^20.19.0` or `>=22.12.0`) |
| `npm run dev` | Vite dev server |
| `npm run build` | `vue-tsc --build` and `vite build` in parallel |
| `npm run type-check` | `vue-tsc --build` |
| `npm run preview` | Preview the production build |

`supabase/config.toml` is the Supabase CLI local config (mostly defaults). The team applies migrations by hand in the Supabase SQL editor rather than through the CLI.

---

## 4. Project structure (file map)

```
/
├─ index.html                 App shell: favicon, Poppins font, mounts #app
├─ vite.config.ts             Plugins (tailwind, vue, devtools), '@' → src alias
├─ package.json               Scripts and deps ("#style" import alias → src/style.css)
├─ tsconfig*.json, env.d.ts   TypeScript config
├─ babel.config.js            Leftover from Vue CLI, unused by Vite
├─ .env.example               Env var names (missing VITE_MAPBOX_TOKEN)
├─ README.md                  Vue template readme + branch naming convention
├─ changelog.md               Early frontend notes (historical)
├─ documentation.md           Running change log (newest first). Read the latest entries.
├─ project-context.md         ← this file
├─ public/                    favicon.ico, profile.png (barely used)
├─ supabase/
│  ├─ config.toml             Supabase CLI local config
│  └─ migrations/             Versioned schema changes (see 9.6)
└─ src/
   ├─ main.ts                 createApp(App).use(router).mount('#app')
   ├─ App.vue                 Layout: Sidebar (unless route.meta.hideSidebar) + RouterView; applies dark mode / no-animation classes
   ├─ style.css               Tailwind import, theme tokens, custom utilities, dark variant, vue-flow CSS
   ├─ supabaseClient.ts       The single Supabase client
   ├─ router/index.ts         Routes + auth guard
   ├─ assets/
   │  ├─ classes/             Shared TS interfaces and constants
   │  │  ├─ agent.ts          AgentProfile, positionMap (id → title), getAge()
   │  │  ├─ commission.ts     PayUnit, DpDivision, CommissionChain, schedule/result types
   │  │  ├─ developers.ts     Developer, DeveloperProject, DeveloperPromo, OfficeHourSlot, days[]
   │  │  └─ listings.ts       Property (+ Lot, HouseAndLot, Condominium, Memorial), Images, formattedPropertyType()
   │  ├─ images/              Logos, badges (MauBadgeLight/Dark.svg), placeholders, login background
   │  ├─ defaultSettings.json Default user configs (currency, unit, animations, dark mode)
   │  └─ questions.json       Suggested FAQ questions per property type (Property Management)
   ├─ services/               Everything that talks to Supabase or external APIs (Section 10)
   │  ├─ authService.ts       Current agent (id, names, admin_access), logout
   │  ├─ agentService.ts      Full profile, profile/config updates, profile image upload/delete
   │  ├─ listingsServices.ts  Listings CRUD, images, fact sheets, status, compileMarkdown()   (note the plural file name)
   │  ├─ shareService.ts      Temporary public share links
   │  ├─ poiService.ts        Nearby points of interest (Mapbox) with a per-listing cache
   │  ├─ salesService.ts      Sales CRUD, DP divisions, sale numbering, commission tab generation
   │  ├─ commissionService.ts Commission schedule math, tabs, payment status flow
   │  ├─ dashboardService.ts  Loads and builds every Dashboard number
   │  ├─ genealogyService.ts  Hierarchy tree, chains, hierarchy rules, agent CRUD, team insights, promotion
   │  ├─ developerService.ts  Developers, office hours, promo posters
   │  └─ lookupService.ts     Empty placeholder
   ├─ utils/                  Frontend-only helpers
   │  ├─ commissionAllocation.ts  Splits one payment between seller and uplines (allocatePayouts)
   │  ├─ ranks.ts                 Rank type, labels, default rates, rankOf(), allowedUplineRanks()
   │  ├─ paySchedule.ts           Month/quarter/year due-date math (month-end safe)
   │  ├─ conversion.ts            Currency and area conversion/formatting (global refs)
   │  ├─ useSettings.ts           Reactive user settings backed by localStorage
   │  └─ liveRefresh.ts           useLiveRefresh(): realtime + focus + polling reloads
   ├─ views/                  Pages (one per route)
   │  ├─ LoginForm.vue        /                     Login
   │  ├─ Dashboard.vue        /dashboard            KPIs, alerts, charts, history, genealogy card, reminders
   │  ├─ Listings.vue         /listings             Listing grid, filters, details overlay, approve/delete/sold
   │  ├─ PropertyManagement.vue /propertymanagement Create/edit a listing
   │  ├─ SharedListing.vue    /shared/listing/:token Public listing page (no login)
   │  ├─ SalesReport.vue      /sales                Sales table, filters, export, sale details
   │  ├─ Commission.vue       /commissions          Commission tabs and payment flow
   │  ├─ Genealogy-landingpage.vue /genealogy       Team stats, manage agents, insights, tree
   │  ├─ developerlist.vue    /developerlist        Developer cards, add/edit, promos
   │  ├─ Accounting.vue       /accounting           Calculators
   │  ├─ Profile.vue          /profile              View/edit own profile
   │  ├─ Settings.vue         /settings             User defaults and graphics
   │  └─ DashboardPrevious.vue (unrouted legacy mock-up, keep only for reference)
   └─ components/
      ├─ Sidebar.vue          Desktop hover sidebar + phone bottom nav
      ├─ accounting/amortSched.vue        Amortization schedule modal + PDF export
      ├─ calculator/CalculatorPanel.vue   Loan / Sales / Property Tax calculator (reused in listing popup)
      ├─ commissions/PaymentRequestModal.vue, ReleasePaymentModal.vue, ProofModal.vue
      ├─ dashboard/DashboardStatCard.vue, SalesPerfromance.vue (sic), CommissionHistory.vue,
      │           GenealogyCard.vue, Reminders.vue, RecentActivity.vue (hidden),
      │           AddAgent.vue (placeholder), AddListing.vue & Calculator.vue (unused placeholders)
      ├─ developer/developerCard.vue, addDeveloper.vue
      ├─ genealogy/genealogymodal.vue (tree), AddAgentModal.vue, TeamInsights.vue
      ├─ listings/PropertyCard.vue, PropertyDetails.vue, ListingsFilter.vue, MapHolder.vue, MapInteractive.vue
      ├─ profile/ProfileCard.vue, ProfileEdit.vue
      ├─ sales/SalesUploadModal.vue       Sale create / confirm (Sold) / edit form
      ├─ settings/configDropdown.vue, configToggleSlider.vue
      ├─ modal.vue (empty), test.vue (static mock-up), shims-vue.d.ts
```

---

## 5. Architecture and cross-cutting patterns

### 5.1 Data flow

```
View (src/views)  ──calls──►  Service (src/services)  ──supabase-js──►  Supabase (Postgres / Storage / Realtime)
   │                               │
   └─uses──► Components            └─uses──► Utils (pure math/format) + Classes (types)
```

There is **no global store** (no Pinia). Each page fetches what it needs on mount, including the current agent. To know who is signed in:

- `authService.getCurrentAgent()` returns `{ agent_ID, first_name, middle_name, last_name, admin_access }`. Use it for permission checks.
- `agentService.getCurrentAgentProfile()` returns the full `agents` row (Sidebar, Profile).
- `agentService.getCurrentAgentID()` returns just the id.

All of them resolve `supabase.auth.getUser()` → `agents.user_id`.

### 5.2 Routing and auth guard (`src/router/index.ts`)

| Path | Name | View | Auth | Sidebar |
|---|---|---|---|---|
| `/` | Landing | LoginForm | public | hidden |
| `/dashboard` | Dashboard | Dashboard | required | yes |
| `/listings` | Listing | Listings | required | yes |
| `/propertymanagement` | PropertyManagement | PropertyManagement | required | yes |
| `/shared/listing/:token` | SharedListing | SharedListing | **public** | hidden |
| `/sales` | SalesReport | SalesReport | required | yes |
| `/commissions` | Commission | Commission (lazy import) | **no `meta` set** ⚠ | yes |
| `/genealogy` | Genealogy | Genealogy-landingpage | required | yes |
| `/developerlist` | DeveloperList | developerlist | required | yes |
| `/accounting` | Accounting | Accounting | required | yes |
| `/profile` | Profile | Profile | required | yes |
| `/settings` | Settings | Settings | required | yes |

`router.beforeEach` calls `supabase.auth.getSession()` on every navigation. If the route needs auth and there is no session, it redirects to Landing. A signed-in user who opens Landing is redirected to **Listing** (`/listings`); a successful login itself pushes `/dashboard`.

### 5.3 Supabase query conventions

- **Mixed-case column names** (`agent_ID`, `listing_ID`, `sale_ID`, `dev_ID`, `property_type_ID`, `recipient_agent_ID`, ...) are used exactly as written in supabase-js: `.eq('agent_ID', id)`. In raw SQL they must be double-quoted.
- **Embeds** (PostgREST joins) are used heavily, for example `agents (first_name, last_name)`, `main_listings (listing_title, developers (name))`. A 1:1 sub-table embed can come back as an object *or* an array, so code normalizes with `Array.isArray(x) ? x[0] : x`.
- **Ambiguous embed:** `commissions` has two foreign keys to `agents` (`recipient_agent_ID`, `released_by`), so it must be embedded as `agents!recipient_agent_ID (...)`.
- **Numeric columns** are wrapped with `Number(...)` before doing math (existing pattern).
- **Silent RLS blocks:** `.update(...).select()` / `.delete().select()` and check `data.length` (see 1.3).
- **Supabase calls outside services** (legacy): `Dashboard.vue` (`onMounted` agent lookup), `LoginForm.vue` (sign in + configs), `router/index.ts` (session check).

### 5.4 Storage buckets

| Bucket | Path pattern | Written by | Saved to |
|---|---|---|---|
| `images` | `listings/{listingId}-{ts}-{i}.{ext}` | `listingsService.uploadPropertyImages` | `listing_images.image_url` (+ `display_order`) |
| `images` | `agents/{agentId}-{ts}.{ext}` | `agentService.uploadProfileImage` | `agents.profile_url` |
| `images` | `developers/{devId}-{ts}.{ext}` | `developerService.uploadImage` | `developers.profile_url` |
| `images` | `developer_promos/{devId}-{ts}.{ext}` | `developerService.uploadPromoImage` | `developer_promos.image_url` |
| `images` | `payment-proofs/{commissionId}-{ts}-{i}.{ext}` | `commissionService.releasePayment` | `commissions.proof_urls[]` |
| `fact_sheets` | `{listingId}-{ts}-{fileName}` (upsert) | `listingsService.uploadFactSheet` | `main_listings.fact_sheet` |

All files are served through **public URLs** (`getPublicUrl`). Deletes recover the storage path by splitting the URL on `/object/public/images/` (or `/images/` for profile pictures).

### 5.5 Settings, currency and units

- **Defaults:** `src/assets/defaultSettings.json` → `{ userDefaultCurrency: 'PHP', userDefaultAreaUnit: 'Metric', disableAnimations: false, darkThemeEnabled: false }`.
- **State:** `src/utils/useSettings.ts` holds a module-level `reactive` object loaded from `localStorage['app_user_settings']`. `updateSetting(key, value)` writes it back to localStorage.
- **At login** (`LoginForm.vue`), `agents.configs` is merged over the defaults and written to localStorage.
- **Settings page "Save"** persists the configs to `agents.configs` through `agentService.updateConfigs`.
- **`App.vue`** has a `watchEffect` that toggles `html.dark` (dark mode, also sets `localStorage.theme`) and `body.disable-animations`.
- **Conversion (`src/utils/conversion.ts`):** global refs `currentCurrency` and `currentUnit` are initialized from the settings once, at module load. Exchange rates are hard-coded relative to PHP (`USD 0.017`, `CAD 0.023`, `CNY 0.123`, `JPY 2.65`); 1 sqm = 10.7639 sqft.
  - Display: `formatPrice(php)`, `formatArea(sqm)`, `convertPrice`, `convertArea`.
  - Saving forms: `convertPriceToPHP(displayed)`, `convertAreaToSqm(displayed)`.
  - Only **listings** use these converters. Sales, commissions and the dashboard always show ₱ through local `Intl.NumberFormat` / `toLocaleString('en-PH')` helpers.

### 5.6 Live refresh (`src/utils/liveRefresh.ts`)

`useLiveRefresh(reload, tables, { debounceMs = 600, pollMs = 60000 })`, called from a component's setup:

1. Subscribes to Supabase realtime `postgres_changes` on each listed table and calls a debounced `reload`.
2. Also reloads when the window regains focus or the tab becomes visible, and every 60 s while visible. This covers tables that are not in the realtime publication.
3. Cleans up on unmount.

| Used by | Tables |
|---|---|
| `Dashboard.vue` | sales, commissions, main_listings, genealogy, agents |
| `Commission.vue` | commissions, sales |
| `Genealogy-landingpage.vue` | agents, genealogy |
| `genealogymodal.vue` (tree) | sales |
| `TeamInsights.vue` | sales, agents, genealogy, positions |

The realtime publication (migration section 5d) covers `sales`, `commissions`, `main_listings`, `genealogy`, `agents`. `positions` is not in it, so polling covers that one.

### 5.7 Markdown

Listing `description` and `faq` are written in Markdown. They are rendered with `compileMarkdown(raw)` (`marked.parse` → `DOMPurify.sanitize`) and shown with `v-html` inside the `markdownTypography` utility (Tailwind `prose` + `dark:prose-invert`).

### 5.8 UI and theme conventions

- Page header: a gradient bar `bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black` with an uppercase title (Listings, Sales Report, Developers, Accounting, Profile).
- Modals: a fixed overlay `bg-[rgba(10,61,98,0.7)] backdrop-blur-sm`. The commission and agent modals use `<Teleport to="body">`.
- Feedback: small toasts (`Transition name="toast"`), `alert()` and `confirm()` in older code.
- Responsive: Sidebar is `hidden md:flex`; phones get a bottom nav (`App.vue` adds `pb-16`). Grids and tables are built mobile-first.
- `Commission.vue`, its three modals, `AddAgentModal.vue` and `SharedListing.vue` have **no dark-mode classes** yet.

---

## 6. Roles and permissions

"Agent" means a signed-in user with `admin_access = false`. **Every rule below is enforced only in the frontend.** All tables use an open RLS policy (`using (true) with check (true)` for `anon` and `authenticated`).

| Action | Agent | Admin | Enforced in |
|---|---|---|---|
| See listings | active + **own** pending | active + all pending (Pending Only toggle) | `Listings.loadProperties` → `listingsService.getListings` |
| Create listing | saved as `pending` | saved as `active` | `PropertyManagement.saveProperty` |
| Approve pending listing | ✗ | ✓ | `PropertyDetails` button (`isAdmin`) |
| Reject pending listing | — | uses Delete | — |
| Edit listing | own listings only | own listings only | `Listings.handleEdit` (owner check, applies to admins too) |
| Delete listing | ⚠ anyone | anyone | no check |
| Share listing | any non-pending | any non-pending | `PropertyDetails` (button hidden) + `shareService.getSharedListing` |
| Create sale | ✓ (seller = self) | ✓ (seller = self) | `SalesUploadModal.submit` |
| See sales | own only | all + Agent filter, Agent column, upline in details | `SalesReport.loadSales` |
| Edit / delete sale | only while `pending approval` | always | `SalesReport.canEditSale` |
| Change sale status | ✗ (field disabled, status stripped from payload) | ✓ | `SalesUploadModal` |
| See commission tabs | own (as recipient) | all, with "My Commissions" / "All Agents (Approval)" switch | `Commission.loadCommissions` |
| Approve commission | ✗ | ✓ (any tab, including their own) | `Commission.vue` button + status guard in `approveTab` |
| Request payment | own tab, approved, due, earlier payments received | ✗ never, not even on their own tabs | `canAgentAct` + `canRequest` + `commissionService.requestPayment` order check |
| Release payment | ✗ | ✓ | `Commission.vue` button |
| Confirm received | own tab, `payment_released` | ✗ | `canAgentAct` |
| Dashboard scope | own data | "My Stats" / "All Agents" (default All) | `Dashboard.vue` |
| Personal payout alerts and reminders | ✓ | ✗ (admins don't request or receive payouts in the app) | `dashboardService.buildDashboard` |
| Add / edit / delete agents, promote, edit thresholds | ✗ intended, but ⚠ currently visible to everyone | ✓ | **no gating yet** (admin-only confirmed by the team, 2026-10-28) |
| Add / edit / delete developers and promos | ✗ intended, but ⚠ currently visible to everyone | ✓ | **no gating yet** (admin-only confirmed by the team, 2026-10-28) |
| Profile, Settings | own | own | — |

---

## 7. Features

### 7.1 Authentication and login
- **Route / entry point:** `/` (`LoginForm.vue`); logout from the Sidebar.
- **Who:** everyone with an account. Accounts are Supabase Auth users linked to an `agents` row through `agents.user_id`.
- **When it is used:** starting a session.
- **Flow:**
  1. `supabase.auth.signInWithPassword({ email, password })`.
  2. Read `agents.configs` for that `user_id`, merge it over `defaultSettings.configs`, and save the result to `localStorage['app_user_settings']`.
  3. `router.push('/dashboard')`.
  4. Logout: `authService.logoutUser()` → `supabase.auth.signOut()` → `router.push('/')`.
- **Data:** R `agents.configs`.
- **Code:** `src/views/LoginForm.vue`, `src/router/index.ts` (guard), `authService.logoutUser()`, `src/components/Sidebar.vue` (`handleLogout`).
- **Rules and edge cases:** "Remember Email" and "Data Privacy Act" are UI only. There is no sign-up or password reset. Agents created from the Genealogy page have no login (`user_id = null`) until someone creates the Supabase Auth user and links `user_id` by hand.

### 7.2 App shell and navigation
- **Route / entry point:** every page except `/` and `/shared/listing/:token` (`meta.hideSidebar`).
- **Flow:** `App.vue` renders `Sidebar` + `RouterView`. The Sidebar loads the agent profile and shows the logo, the profile picture (links to `/profile`), the name, an admin badge (`MauBadgeLight.svg`) and the position from `positionMap`. Links come from `topItems`: Dashboard, Project Listing, Accounting, Sales Report, Developer List, Property Management, Genealogy, Commissions; Settings and Logout sit at the bottom. On desktop the bar expands on hover; on phones it becomes a scrollable bottom bar.
- **Code:** `src/App.vue`, `src/components/Sidebar.vue`, `agentService.getCurrentAgentProfile()`.

### 7.3 Dashboard
- **Route / entry point:** `/dashboard`.
- **Who:** everyone. Admins get a **My Stats / All Agents** switch (defaults to All Agents).
- **When it is used:** the landing page after login, to see sales, commissions, alerts and team at a glance.
- **Flow:**
  1. On mount: load the agent (`agents` by `user_id`), set the month filter to the current month, then run `loadDashboardStats()` and `loadTeam()`.
  2. `getDashboardData(agentId?)` loads sales, listings and commission tabs (for one agent, or everyone when an admin picks All Agents).
  3. `buildDashboard(data, { month, agentId, isAdmin })` returns alerts, metrics, commission metrics, history, performance, activities and reminders. Definitions are in 8.6.
  4. Clicking a card with a `link` navigates (Total Sales → `/sales`); other cards open an "Analysis" popup listing the records behind the number (10 per page).
  5. `useLiveRefresh` reloads everything when sales, commissions, listings, genealogy or agents change, and refreshes an open popup.
- **Panels:**
  - **Alerts banner** (amber = action, blue = info), each with a link.
  - **Row 1:** Total Sales, Total Received Commission, Listings, all filtered by the selected month with a trend against the previous month. Clearing the month shows all time.
  - **Row 2:** Receivables, Ready to Request, Awaiting Approval. These ignore the month filter.
  - **Sales Performance:** approved sales per month for the 7 months ending at the selected month, plus the average deal. Click → `/sales`.
  - **Commission History:** every tab in view, filterable by sale and status, 6 per page, "Payment n of N".
  - **Genealogy card:** the whole upline chain (direct upline first, top 3 shown) and the downline at any depth (top 4 shown). Click → `/genealogy`.
  - **Reminders:** clickable, collapsible after 3.
  - **Recent Activity:** hidden (commented out in the template and import). `activities` is still computed.
- **Header buttons:** "+ Add Listing" → `/propertymanagement` (⚠ without `?edit=0`, see 11.1). "+ Add Agent" opens the **placeholder** `components/dashboard/AddAgent.vue`, which does nothing. The real Add Agent is on the Genealogy page.
- **Data:** R `sales`, `main_listings`, `commissions` (+ joins), `genealogy`, `agents`, `positions`.
- **Code:** `src/views/Dashboard.vue`, `src/services/dashboardService.ts` (`getDashboardData`, `buildDashboard`), `components/dashboard/*`, `genealogyService.getUplineChain(id, 20)`, `genealogyService.getDownline(id, 20)`.

### 7.4 Project Listings (browse, filter, details)
- **Route / entry point:** `/listings`.
- **Who:** everyone (visibility rules in Section 6).
- **When it is used:** finding a property to show a client, opening its details, sharing it, or recording a sale.
- **Flow:**
  1. On mount: resolve `isAdmin` and the agent id first, then call `getListings(20, ['active','pending'])` for admins or `getListings(20, ['active'], agentId)` for agents, load the developer names for the filter, and show a "saved" toast if `?saved=created|updated|pending`.
  2. Client-side filters (the `filteredProperties` computed): Pending Only (admin), Type, search (title, location or developer), Developer, price min/max (typed in the current currency and converted to PHP). Pending listings are sorted first, then newest first.
  3. Grid of `PropertyCard`s with 2/3/4 columns and 3 rows per page; skeleton cards while loading.
  4. Clicking a card opens the `PropertyDetails` overlay.
- **`PropertyDetails` overlay** (`components/listings/PropertyDetails.vue`):
  - Loads the full row with `getListingById(id, typeId)`, including the sub-table, images, agent and developer.
  - Shows an image carousel, the price (a min–max range for bulk listings), type, location, a `MapHolder` map with POI chips, agent, created date, developer, type-specific features (single listings only), the Markdown description and FAQ.
  - Buttons:
    - **EDIT**: emits `edit`. Listings checks that the current agent owns the listing, then goes to `/propertymanagement?edit=1&id=..&type=..`.
    - **DELETE**: confirmation toast → `listingsService.deleteListing` (hard delete).
    - **SHARE**: hidden for pending listings; 5 s cooldown (7.7).
    - **CALCULATOR**: opens `CalculatorPanel` prefilled with the price.
    - **SOLD**: bulk listings that are not sold yet. Confirmation toast → opens `SalesUploadModal` in Confirm Sale mode (7.10). After the sale is saved, the listing is set to `sold` and removed from the grid.
    - **APPROVE**: admin, pending listing → `updateListingStatus(id, 'active')`.
    - **FACT SHEET**: downloads the file as a blob, stripping the `{id}-{ts}-` prefix from its name; falls back to opening it in a new tab.
- **Also reused by:** `developerlist.vue`, which opens the same overlay from a developer's "Recent Projects".
- **Data:** R `main_listings` + `property_type`, `agents`, `developers`, `listing_images`, sub-tables. W `main_listings.status`, deletes.
- **Code:** `src/views/Listings.vue`, `components/listings/{PropertyCard,PropertyDetails,ListingsFilter,MapHolder}.vue`, `listingsService.getListings/getListingById/getAgentFromListing/updateListingStatus/deleteListing`, `developerService.getDeveloperNames`.
- **Rules and edge cases:** only the 20 most recent listings are fetched (11.1). The Rooms, Bedrooms, Bathrooms, Lot Area, Class and Memorial Type filters are UI only. The Currency and Units dropdowns change the session values of `currentCurrency` / `currentUnit`.

### 7.5 Listing approval (pending queue)
- **When it is used:** a non-admin agent publishes a listing and an admin reviews it.
- **Flow:**
  1. A non-admin saves a new listing → `status = 'pending'` → redirected with `?saved=pending` ("submitted for admin approval").
  2. The agent sees their own pending listings in the grid (orange PENDING badge, sorted first). Other agents don't see them.
  3. An admin sees every pending listing, with a count badge and a "Pending Only" toggle, and presses **APPROVE** → `active`. To reject, the admin deletes the listing.
  4. Pending listings can't be shared: the button is hidden, and `getSharedListing` throws "not yet available".
- **Data:** the `listing_status` enum gained `pending` (migration `20260906120000`).
- **Code:** `PropertyManagement.saveProperty` (status choice), `listingsService.getListings` (`ownPendingAgentId` builds an `or(...)` filter), `Listings.handleApprove`, `PropertyCard` / `PropertyDetails` badges.

### 7.6 Property Management (create and edit a listing)
- **Route / entry point:** `/propertymanagement?edit=0` (create, from Listings "Add Listing") or `/propertymanagement?edit=1&id={listing_ID}&type={property_type_ID}` (edit, from the details overlay).
- **Who:** any agent. In edit mode, only the listing's owner gets here through the UI.
- **When it is used:** adding a developer's project or unit to the portal, or correcting one.
- **Form fields:**
  - Title.
  - Photos (multiple; removing an existing photo is deferred until Save).
  - Description (Markdown with Preview).
  - Agent Incentive and Realty Incentive (free text, shown later in the Sales Report).
  - Price, plus Max Price when Bulk, in the current currency.
  - Location: text, or the map picker `MapInteractive` (geocoder search, or a pin-toggle and click with reverse geocoding). The picker writes `lng`, `lat` and `location`.
  - Developer (Listbox from `getDevelopers`).
  - Quantity Type: Single or Bulk.
  - Property Type: House And Lot, Lot Only, Condominium, Memorial, Clubshare, Golfshare.
  - **Type-specific fields, shown only for Single:**
    - House and Lot: lot/floor area, rooms, toilets, master bedroom area, helper/driver rooms, carpark, and the features one storey, two storey, loft, townhome, rowhouse.
    - Lot Only: block, lot and phase numbers, area, lot class.
    - Condominium: unit number, bedrooms, balconies, carpark, master bedroom area, condo class, and an exclusive type (Studio, BR Unit, Villa, Garden Villa, Penthouse).
    - Memorial: an exclusive type (Urn, Vault, Garden, Estate, Family Estate, Pet Memorial).
  - FAQ (Markdown with Preview). "View Questions" inserts `### question\n- ` from `questions.json`.
  - Fact sheet upload (doc, docx, md, pdf).
- **Flow when creating:**
  1. Map the type label to an id (1–6) and build the `main_listings` payload. Price is converted to PHP. Status is `isAdmin ? 'active' : 'pending'`.
  2. Build the sub-table payload, translating UI names to DB names (11.5).
  3. `listingsService.createListing(main, sub, typeId)` inserts the main row, then the sub-table row; if the sub-table insert fails, the main row is deleted again.
  4. `uploadPropertyImages(newId, files)`, then `uploadFactSheet(...)` (⚠ uses the wrong id, see 11.1).
  5. Redirect to `/listings?saved=created|pending`.
- **Flow when editing:**
  1. `loadProperties()` prefills the form from `getListingById`. Price and areas are converted to the display currency and unit.
  2. On Save: `updateListing(id, main, sub, typeId)`, then `deleteListingImages(removedUrls)` (storage and rows), then upload new images and the fact sheet.
  3. Redirect to `?saved=updated`.
- **Data:** W `main_listings`, `house_and_lot` / `lot_only` / `condominium` / `memorial`, `listing_images`; storage `images/listings/`, `fact_sheets`.
- **Code:** `src/views/PropertyManagement.vue`, `components/listings/MapInteractive.vue`, `listingsService.createListing/updateListing/uploadPropertyImages/deleteListingImages/uploadFactSheet/getListingById`, `developerService.getDevelopers`, `src/assets/questions.json`, `utils/conversion.ts`.
- **Rules and edge cases:** the create and edit paths are not symmetric (11.1). Clubshare and Golfshare have no sub-table. Bulk listings still write a sub-table row filled with the form's default values.

### 7.7 Listing sharing (temporary public link)
- **Route / entry point:** SHARE button in `PropertyDetails` → public page `/shared/listing/:token`.
- **Who:** an agent creates the link; anyone with it can view it without logging in.
- **When it is used:** sending a property to a client.
- **Flow:**
  1. `generateShareLink(listingId, agentId, 1)` first deletes every expired `shared_listings` row (fire-and-forget), then inserts a row with `expires_at = now + 1 day`.
  2. The URL `${origin}/shared/listing/${share_id}` is copied to the clipboard and an `alert` confirms it.
  3. `SharedListing.vue` calls `getSharedListing(token)`. This joins the listing, its sub-tables, images, agent and developer, and throws if the link expired or the listing is pending.
  4. The page shows the gallery, price, type, location, a map with POIs, the agent, the developer, the features, the description and the FAQ. **The commission and incentives are never shown.**
- **Data:** W/R `shared_listings` (uuid `share_id` is the token).
- **Code:** `src/services/shareService.ts`, `PropertyDetails.handleShare`, `src/views/SharedListing.vue`.
- **Rules and edge cases:** the `agent_ID` saved on the link is the **listing owner's** id (`details.agent_ID`), not the id of the agent who shared it. A bulk listing's price range is not shown on the public page (only `price`).

### 7.8 Maps and nearby points of interest
- **Where:** `MapHolder.vue` (read-only map in the listing overlay and the public page) and `MapInteractive.vue` (location picker in Property Management).
- **Flow (POIs):**
  1. The map shows chips for Hospitals, Schools, Police, Pharmacies, Fire Stations and Supermarkets.
  2. The first time a chip is toggled on, `poiService.getNearbyPois(listingId, lng, lat)` runs. It returns the cached `main_listings.nearby_pois` if that is under 30 days old; otherwise it calls the Mapbox Search Box category API once per category (up to 5 results each, one call after another), saves the result to the cache, and returns it.
  3. The markers' popups show the distance (`haversineKm`).
  4. "Expand Map" toggles a full-screen view.
- **Defaults:** if a listing has no coordinates, the map falls back to Fuente Osmeña, Cebu (`123.8931, 10.3099`). The style is `streets-v12`.
- **Data:** R/W `main_listings.nearby_pois` (jsonb `{ fetched_at, categories: { [id]: [{ name, lng, lat }] } }`).
- **Code:** `src/services/poiService.ts` (`POI_CATEGORIES`, `haversineKm`, `getNearbyPois`), `components/listings/MapHolder.vue`, `components/listings/MapInteractive.vue`.

### 7.9 Sales Report
- **Route / entry point:** `/sales`; also the Dashboard "Total Sales" card.
- **Who:** agents see their own sales; admins see everyone's.
- **When it is used:** recording sales, checking their status, exporting a report, and (for admins) approving or completing sales by changing their status.
- **Flow:**
  1. `loadSales()`: an admin gets `salesService.getSales()`; an agent gets `getSales({ agentId })`; someone without an agent record gets an empty list.
  2. `getSales` fills blank agent names (`fillMissingAgentNames`, falling back to "Agent #id") and numbers the sales (`applySaleNumbers`): per agent for an agent's own list, across every sale for the admin list. These numbers are computed for display; `agent_sale_seq` is not written.
  3. Client-side search (client, project, voucher), date range on the reservation date, and an Agent filter for admins.
  4. A summary strip shows the count, total contract price, gross and net commission of the filtered rows.
  5. Sortable table (reservation date, client, contract price, gross), 12 per page. ⚠ marks rows with no gross commission. Edit and delete icons appear on hover when `canEditSale` (admin, or status `pending approval`).
  6. **Sale Details** popup:
     - client, developer, project, agent and upline chain (admin, 2 levels), reservation date, contract price, commissionable amount, financing, payment scheme, commission rate, DP figures and divisions, sale number, status, gross/net commission, remarks, incentives;
     - **Property Details**: from `sales.unit_details` for bulk sales, otherwise from the listing's sub-table (normalized), with a property-type badge.
  7. **Export**: CSV of the filtered, sorted rows (`sales-report-YYYY-MM-DD.csv`).
  8. **Delete**: `confirm()` → set the listing back to `active` → `salesService.deleteSale` (this cascades, see 11.2).
- **Data:** R `sales` + `agents`, `main_listings` (title, incentives, developer), `sale_dp_divisions`, `genealogy`, listing sub-tables. W `sales` (delete), `main_listings.status`.
- **Code:** `src/views/SalesReport.vue`, `salesService.getSales/getDpDivisions/deleteSale`, `listingsService.getListingPropertyType/getListingById/updateListingStatus`, `genealogyService.getUplineChain`.

### 7.10 Sale form: create, confirm (Sold) and edit
- **Component:** `src/components/sales/SalesUploadModal.vue`, used in three modes:

  | Mode | Opened from | Props | Title |
  |---|---|---|---|
  | Create | Sales Report "Add Sale" | none | Upload Sale |
  | Confirm (Sold) | Listings, SOLD button on a bulk listing | `lockedListing { id, title, price, commission }` | Confirm Sale |
  | Edit | Sales Report edit icon or details "Edit" | `editSale: Sale` | Edit Sale |

- **Fields:**
  - Developer (narrows the project list; set automatically from the chosen project).
  - Project (a listing; up to 100 active listings; read-only in Confirm and Edit).
  - Client (Buyer), Reservation Date, Total Contract Price (prefilled from the listing price).
  - **Payment Scheme:** `DP`, `Spot-Cash` or `Deferred-Cash` (12 monthly installments).
    - **Financing** (DP only, required): `Pag-ibig`, `Banking`, `In-House with Interest`.
    - **DP only:** DP Rate %; DP Amount and Remaining Balance are computed (`calculateDownpaymentMetrics`).
    - **DP Divisions** (DP only): tabs with "+ Add division". Each division has a Rate %, "Payable in" count + unit (months, quarters or years), Due Date Start, and Due Date End. The end date is filled automatically with `lastDueDate(start, unit, count)` and can be edited, but not to a date before the last payment. A live status shows "x% of y% allocated".
    - Spot-Cash and Deferred-Cash show an info box instead (no divisions, no financing).
  - **Commissionable Amount:** starts equal to the contract price until the user types a value; it can differ because of taxes and policies.
  - **Commission Rate %:** prefilled from `main_listings.commission`.
  - **Gross Commission** (read-only) = Commissionable Amount × Commission Rate ÷ 100.
  - **Sale Status** (Edit mode only; editable by admins only): `pending approval`, `awaiting payment`, `complete`, `cancelled`.
  - Remarks (placeholder hint by type: "Floor 12, Unit 1205" for condos, "Block 5, Lot 12, Phase 2" for house/lot).
  - Listing Incentives (read-only, from the listing).
  - **Specific Unit Details (bulk sale):** the per-type unit fields, including block/lot/phase for house and lot and **Floor** for condos. They are prefilled from the listing and saved to `sales.unit_details` (jsonb).
  - Hidden (commented out): Net Commission, Voucher Series.
- **Validation (`validatePaymentScheme`):** for DP, financing is required; the DP rate must be above 0 and at most 100; there must be at least one division; each division needs a rate above 0, a count of at least 1, both dates, end ≥ start, and end ≥ the last payment date; and the division rates must add up **exactly** to the DP rate (compared in hundredths of a percent). `salesService.saveDpDivisions` checks the sum again.
- **Submit, Create / Confirm:**
  1. `createSale({ agent_ID: currentAgent, ...payload })`. Status is `pending approval`.
  2. `saveDpDivisions(saleId, dpRate, divisions)` (deletes then inserts).
  3. If the listing is **single** (not bulk), it is set to `sold`. In the Sold flow, `Listings.onSaleSaved` sets the bulk listing to `sold`.
- **Submit, Edit:**
  1. Non-admins: `status` is removed from the payload. Admins changing the status: `completed_at` is set to now for `complete`, otherwise cleared.
  2. `updateSale(...)`, then `saveDpDivisions(...)`.
  3. New status `cancelled` → `commissionService.removeUnclaimedForSale(saleId)`.
  4. New status `awaiting payment` or `complete` → `salesService.generateCommissionTabs(saleId)` (7.11). If this fails, the modal shows "Sale saved, but commission tabs were not created: ...".
- **Data:** W `sales`, `sale_dp_divisions`, `main_listings.status`, `commissions`.
- **Code:** `SalesUploadModal.vue`, `salesService.createSale/updateSale/saveDpDivisions/getDpDivisions/calculateDownpaymentMetrics/getListingDeveloperName/generateCommissionTabs`, `commissionService.removeUnclaimedForSale`, `utils/paySchedule.ts`.

### 7.11 Commission engine (tab generation and allocation)
- **When it runs:** when an admin saves a sale as `awaiting payment` or `complete` (Edit mode of the sale form).
- **Flow (`salesService.generateCommissionTabs(saleId)`):**
  1. Load the sale. Stop with 0 tabs if it is not approved, has no `payment_scheme` (older sales), or already has tabs (`commissionService.countForSale > 0`).
  2. `commissionableAmount = sales.gross_commission`. If it is 0 or missing, throw "Enter the Gross Commission...".
  3. For DP, load the divisions.
  4. `firstDueDate = today + 1 month` (the approval moment, not the reservation date; see 11.2).
  5. `chain = genealogyService.getRoleChain(agentId)`: the seller and **every** ancestor, each with rank and rate.
  6. `commissionService.calculateSchedule({ commissionableAmount, overallDpRate, paymentScheme, dpDivisions, firstDueDate, chain })` builds the payment **slots** and calls `allocatePayouts(raw, seller, ancestors)` for each one (formulas in 8.4).
  7. Write one row per slot per payout (`sale_ID, payment_no, due_date, is_balance, recipient_agent_ID, role, recipient_rank, amount`) with `commissionService.saveTabs(rows)`, an upsert on `(sale_ID, role, payment_no)` with `ignoreDuplicates`.
- **Other entry points:** `TeamInsights` uses `allocatePayouts(100, ...)` to show each agent's split as percentages. `salesService.generateSchedulePreview()` exists but nothing calls it.
- **Rules:**
  - Tabs are never regenerated automatically after a sale is edited. To regenerate, delete that sale's rows from `commissions` and save the sale as Awaiting Payment again.
  - A completed sale makes every remaining tab due immediately, but each tab still needs approval.
  - Cancelling a sale deletes the tabs that are not yet received.
- **Code:** `src/services/salesService.ts`, `src/services/commissionService.ts`, `src/utils/commissionAllocation.ts`, `src/utils/ranks.ts`, `src/utils/paySchedule.ts`, `genealogyService.getRoleChain`.

### 7.12 Commissions page (payment flow)
- **Route / entry point:** `/commissions`; also the Dashboard alerts and reminders.
- **Who:** agents see the tabs where they are the recipient (as seller or upline). Admins see every tab ("All Agents (Approval)", the default) or only their own ("My Commissions").
- **When it is used:** tracking receivables and moving each payout through the payment process.
- **Layout:**
  1. **Receivables header:** received of total, number of payouts received, "yet to collect", and a progress bar. In the admin All Agents view, a per-agent received/total list.
  2. **Filter by sale:** collected, yet to collect, sale total.
  3. **Status filter tabs with counts:** All, Awaiting Approval, Approved, Payment Requested, Payment Released, Received.
  4. **Cards** in one shared grid: Payment `n/N`, project/developer, agent, role (+ rank), amount (+ "Remaining balance"), due date with a badge (Due Date Reached, Pending Date or Sale Complete), status, and a hint ("Receive payment k first" or "Request opens on the due date").
  5. Sort order: not received first, then due date, then developer name.
- **Actions** (state machine in 8.3):

  | Status | Admin sees | Recipient agent sees |
  |---|---|---|
  | `pending_approval` | **Approve commission** → `approveTab` | (waiting) |
  | `approved` | "Waiting for the agent to request payment" | **Request payment**: enabled when due (due date reached or sale complete) and every earlier payment of the same sale for the same person is received. Opens `PaymentRequestModal`. |
  | `payment_requested` | **Release payment** → `ReleasePaymentModal` | "Request sent..." |
  | `payment_released` | View proof of payment | **View proof / Confirm** → `ProofModal` → **Received payment** |
  | `received` | ✓ Received + date, View proof | same |

- **Modals:**
  - `PaymentRequestModal`: prefilled with the first/middle/last name (from the account) and the sale details. **Edit details** unlocks the names, client, project, developer and reservation date; **Reset** restores them. The contract price, role/rank, payment number, due date and amount stay locked. Submits `PaymentRequestDetails` into `commissions.request_details`.
  - `ReleasePaymentModal`: shows the request. The admin must attach at least one image (file picker or **Ctrl+V paste**). Uploads go to `images/payment-proofs/`.
  - `ProofModal`: an image gallery; the recipient can confirm receipt, which cannot be undone.
- **Data:** R/W `commissions` (+ `agents!recipient_agent_ID`, `sales`, `main_listings`, `developers`); storage `images/payment-proofs/`.
- **Code:** `src/views/Commission.vue`, `components/commissions/*`, `commissionService.getTabs/approveTab/requestPayment/releasePayment/confirmReceived/summarizeTabs/STATUS_LABEL`.

### 7.13 Genealogy (team tree and agent management)
- **Route / entry point:** `/genealogy`.
- **Who:** everyone can view. The management actions (add, edit, delete, promote, thresholds) are meant to be **admin-only**, but they are not gated yet (11.3).
- **When it is used:** seeing who is in whose team, adding or onboarding an agent, changing someone's upline or position, removing an agent.
- **Page sections:**
  1. Header: search (filters the Teams, Recently Added and Manage Agents lists) and **Add Agent**.
  2. Stats (`getStats`):
     - Total Agents.
     - Team Leaders: agents with at least one downline.
     - Active Teams: root agents, meaning agents with no upline.
     - New This Month: `hire_date` in the current month.
  3. **Teams:** one entry per root agent with its subtree size.
  4. **Recently Added:** 5 agents, newest `hire_date` first.
  5. **Manage Agents:** Edit opens `AddAgentModal` in edit mode. Delete calls `deleteAgent`, which is **blocked** if the agent has sales, listings or share links; otherwise their direct downlines move up to the deleted agent's upline (or become roots), the edges are removed, and the agent row is deleted.
  6. **Roles, Overrides and Promotion** (`TeamInsights`, 7.14).
  7. **Tree** (`genealogymodal.vue`): Vue Flow with a top-to-bottom dagre layout. Each node shows the name, position, commission rate %, accumulated sales and "% to next" rank. It redraws on sales changes and is remounted (`reloadKey`) after edits.
- **`AddAgentModal`:**
  - Fields: first/middle/last name, sex, birth and hire dates, contact, email, home address, position (from `positionMap`), upline, and "Grant admin access".
  - The upline list is filtered by `allowedUplineRanks(selected rank)`; it is disabled for Partner Brokers.
  - Add: `genealogyService.addAgent(payload, uplineId)`. `age` is derived from the birth date, `user_id` is null, `configs` gets the defaults. The hierarchy rules are checked before inserting.
  - Edit: `updateAgentAndUpline(id, patch, uplineId)`. If a promotion makes the current upline invalid, the agent is **detached** and an alert explains it.
- **Hierarchy rules:** see 8.5.
- **Data:** R/W `agents`, `genealogy`; R `positions`, `sales`, `main_listings`, `shared_listings` (delete checks).
- **Code:** `src/views/Genealogy-landingpage.vue`, `components/genealogy/{genealogymodal,AddAgentModal,TeamInsights}.vue`, `src/services/genealogyService.ts`, `src/utils/ranks.ts`.

### 7.14 Ranks, overrides and promotion (Team Insights)
- **Where:** the `TeamInsights.vue` panel on the Genealogy page.
- **Flow:**
  1. **Thresholds:** for Supervisor, Investment Manager and Partner Broker, the accumulated sales needed to be promoted *into* that rank. Saved to `positions.promotion_sales_threshold` with `setPromotionThreshold`. Empty means "not set".
  2. **Per agent** (`getTeamInsights`): rank, rate, direct and total downline counts, **accumulated sales** (the contract prices of their own `complete` sales plus those of everyone below them, at any depth), progress to the next rank's threshold, and `eligible` once accumulated ≥ threshold.
  3. **Promote** (shown when eligible, with a `confirm()`): `promoteAgent` checks eligibility again, then `updateAgentAndUpline(id, { position_ID: next }, currentUpline)`. Promotion is never automatic. It may detach the agent from their upline.
  4. Clicking a name expands the **override split**: the percentage of each payment's company commission that the agent keeps and that each upline earns (`allocatePayouts(100, ...)`).
- **Code:** `components/genealogy/TeamInsights.vue`, `genealogyService.getTeamInsights/getRankPositions/setPromotionThreshold/promoteAgent`.

### 7.15 Developer list (developers, office hours, promo posters)
- **Route / entry point:** `/developerlist`.
- **Who:** everyone can view. Adding, editing and deleting developers and promos is meant to be **admin-only**, but it is not gated yet (11.4).
- **When it is used:** looking up a developer's contact details, office hours, recent projects and current promos; maintaining that data.
- **Flow:**
  1. `developerService.getDevelopers()` makes one query that embeds `opening_days`, `main_listings` and `developer_promos`.
     - Office hours: one `opening_days` row per day, grouped into slots of consecutive days with the same open and close times.
     - Projects: the 3 newest listings that are not drafts.
     - Promos: newest first.
  2. **Card:** picture, name, a static "Active" badge, phone, email, location, office hours, Recent Projects chips (click → `PropertyDetails` overlay), Promotions thumbnails (click → lightbox; shows "Expired" or "Until" based on `valid_until`), and Delete, Edit, Contact buttons.
  3. **Add / Edit modal (`addDeveloper.vue`):** name, location, phone, email, office-hour slots (a multi-select of Monday to Sunday plus Holiday, and open/close time or "Unavailable"), profile picture, and promo posters (new posters are staged with an optional title and valid-until date; saved posters can be removed).
     - **Add:** `addDeveloper` (inserts the developer and its `opening_days` rows) → `uploadImage` → `updateDeveloper` with the image URL (rewrites `opening_days`) → `persistPromos` (upload and insert new posters, delete removed ones).
     - **Edit:** `updateDeveloper` (update, then delete and reinsert `opening_days`) → `persistPromos`.
  4. **Delete:** `deleteDeveloper` deletes `opening_days`, then the developer row. Promos cascade.
- **Data:** R/W `developers`, `opening_days` (`id` = `dev_ID`), `developer_promos`; R `main_listings`; storage `images/developers/`, `images/developer_promos/`.
- **Code:** `src/views/developerlist.vue`, `components/developer/{developerCard,addDeveloper}.vue`, `src/services/developerService.ts`, `src/assets/classes/developers.ts` (`days` list).
- **Rules and edge cases:** several rough edges (11.4).

### 7.16 Accounting (calculators)
- **Route / entry point:** `/accounting`; the same panel opens from the listing overlay's CALCULATOR button with the price prefilled.
- **Modes (`CalculatorPanel.vue`, Loan is the default):**
  - **Loan:** monthly payment `P × r(1+r)^n / ((1+r)^n − 1)` with `r = annual% / 12` and `n = years × 12` (term capped at 20 years; `P / n` when the rate is 0). "View Amortization Schedule" opens `amortSched.vue`.
  - **Sales:** Net Commission = Gross Profit × Net Commission Rate% − (that × Commission Tax%).
  - **Property Tax:** Property Value × Tax Rate%.
- **Amortization schedule (`amortSched.vue`):** monthly rows starting one month from **today**. Interest uses actual days ÷ 365 (`balance × annualRate × days/365`) and the last row absorbs any rounding. Page size 12, 24, 36 or All. **Export PDF** uses jsPDF + autotable and saves `Amortization_Schedule.pdf`.
- **Data:** none (pure frontend).
- **Code:** `src/views/Accounting.vue`, `components/calculator/CalculatorPanel.vue`, `components/accounting/amortSched.vue`.

### 7.17 Profile
- **Route / entry point:** `/profile` (click the Sidebar avatar).
- **Flow:**
  1. `getCurrentAgentProfile()` → `ProfileCard` shows the name (+ admin badge), sex, age (computed from the birth date), birth date, address, contact, email, agent ID, position and hire date.
  2. **EDIT** → `ProfileEdit`: first/middle/last name, sex (Male, Female, Non-Binary, Other), birth date, address, contact number, email, and the profile picture (Upload/Change, Delete, Revert).
  3. Save: if a new picture was chosen, `uploadProfileImage` (to `images/agents/`) and delete the old one; if the picture was removed, `deleteProfileImage`; then `updateProfile` (with `age` recomputed) → `router.go(0)` (full reload).
- **Rules:** position, hire date and admin access can't be edited here; they are edited from Genealogy → Manage Agents. Changing the email here doesn't change the Supabase Auth login email.
- **Code:** `src/views/Profile.vue`, `components/profile/{ProfileCard,ProfileEdit}.vue`, `agentService.*`.

### 7.18 Settings
- **Route / entry point:** `/settings` (Sidebar, bottom).
- **Options:** Default Currency (PHP, USD, CAD, CNY, JPY), Default Unit (Metric = sqm, English = sqft), Disable Animations, Enable Dark Mode.
- **Flow:** every change calls `updateSetting()` (localStorage) and takes effect immediately for the theme and animations. **SAVE SETTINGS** writes the configs to `agents.configs` (`agentService.updateConfigs`). CANCEL goes back in history but does not undo changes already applied.
- **Code:** `src/views/Settings.vue`, `components/settings/{configDropdown,configToggleSlider}.vue`, `src/utils/useSettings.ts`, `App.vue`.
- **Rules and edge cases:** see 11.6 (the default currency only applies after a reload; Save shows no feedback).

---

## 8. Business rules reference

### 8.1 Listing status (`main_listings.status`, enum `listing_status`)

```
(DB default 'draft')        not created by the UI; drafts are hidden from developer "Recent Projects"
'pending'  ──admin APPROVE──►  'active'  ──sale on a single listing / SOLD on bulk──►  'sold'
   │                              ▲
   └──admin DELETE (reject)       └── deleting the sale sets the listing back to 'active'
```

Values used by the app: `draft`, `pending`, `active`, `sold`. The listing grids only fetch `active` (and `pending` for admins and owners).

### 8.2 Sale status (`sales.status`, enum `sales_status`)

```
'pending approval' ──admin──► 'awaiting payment' ──admin──► 'complete'      (completed_at = now)
        │                           │
        └──────── admin ────────────┴──► 'cancelled'   (tabs not yet received are deleted)
```

- Only `pending approval` lets non-admins edit or delete the sale.
- Entering `awaiting payment` or `complete` generates the commission tabs (once per sale).
- "Approved" in the Dashboard means `awaiting payment` or `complete`.

### 8.3 Commission tab status (`commissions.status`, text with a check constraint)

```
pending_approval ──admin approveTab──► approved ──agent requestPayment──► payment_requested
      ──admin releasePayment (≥1 proof image)──► payment_released ──agent confirmReceived──► received
```

| Step | Sets | Guard |
|---|---|---|
| `approveTab` | `admin_approved=true`, `approved_at` | only from `pending_approval` |
| `requestPayment` | `requested_at`, `request_details` | from `approved`; every earlier `payment_no` of the same sale for the same recipient is `received`; UI also requires due (`due_date <= today` or sale `complete`) |
| `releasePayment` | `released_at`, `released_by`, `proof_urls` | from `payment_requested`; at least one file |
| `confirmReceived` | `claimed=true`, `claimed_at` | from `payment_released` |

Each step goes through `_advance(id, from, patch)`, which updates `.eq('status', from)` and returns `false` if 0 rows changed (the status had already moved, or RLS blocked it). **Only `received` counts as received money** in receivables and dashboard totals. Labels: `STATUS_LABEL` uses "Pending Approval" while the filter tab says "Awaiting Approval"; both mean `pending_approval`.

### 8.4 Commission math

Inputs: `commissionableAmount` = **`sales.gross_commission`** (which the form computes as Commissionable Amount × Commission Rate %), the payment scheme, the DP rate and the DP divisions.

**1. Build the payment slots** (`commissionService.calculateSchedule`):

| Scheme | Slots | Share of each slot | Due date |
|---|---|---|---|
| Spot-Cash | 1 | 100% | `firstDueDate` (approval date + 1 month) |
| Deferred-Cash | 12 | 100/12 % | `firstDueDate`, then monthly |
| DP | `count` per division | `divisionRate / count` % | `dueDateAt(start, unit, i)` (start date, then every month, quarter or year) |
| DP balance tab | 1 extra (`is_balance`), unless DP = 100% | `100 − dpRate` % | 1 month after the latest division end date |

**2. Raw company commission per slot:** `raw = (slotPct / 100) × 5% × commissionableAmount`. Across all slots the total raw is always 5% × gross commission.
> **Unconfirmed (as of 2026-10-28).** The extra 5% applied on top of the gross commission is what the code does, and `documentation.md` (2026-10-14) calls the per-pay formulas "confirmed unchanged", but the team has not confirmed it is intended. Do not change it, in either direction, without the team's confirmation. If a task touches this formula, ask first.

**3. Split each slot** (`allocatePayouts(raw, seller, ancestors)` in `src/utils/commissionAllocation.ts`):
- **Seller (role `Agent`):** `raw × 3/4 × (rate / 5)`. The rate is the position's `commission_rate`, falling back to `DEFAULT_RANK_RATE`. So 3% → 3/5, 3.5% → 7/10, 4% → 4/5, 4.5% → 9/10.
- **Overrides:** `raw × 3/4 × pct`, paid to the **first** ancestor (nearest first) of each target rank:

  | Seller rank | Override targets (pct) |
  |---|---|
  | Specialist | Supervisor 10%, Investment Manager 10% (**20%** if the IM is the seller's *direct* upline), Partner Broker 10% |
  | Supervisor | Investment Manager 10%, Partner Broker 10% |
  | Investment Manager | Partner Broker 10% |
  | Partner Broker | none |

- Specialists never earn overrides; a Specialist above another Specialist is skipped.
- **Role labels:** non-broker overrides are `Upline 1` and `Upline 2` (nearest first); the broker is always `Upline 3`. The recipient's rank label is stored separately in `recipient_rank`.
- Amounts are rounded to 2 decimals per payout.

**Worked example (Spot-Cash):** contract price ₱5,000,000; commissionable amount ₱5,000,000; rate 5% → gross ₱250,000 → raw = 1.00 × 0.05 × 250,000 = **₱12,500**. The seller is a Specialist (3%) with a Supervisor, then an IM, then a Broker above them:

| Recipient | Role | Amount |
|---|---|---|
| Seller (Specialist) | Agent | 12,500 × 0.75 × 0.6 = ₱5,625.00 |
| Supervisor | Upline 1 | 12,500 × 0.75 × 0.10 = ₱937.50 |
| Investment Manager | Upline 2 | ₱937.50 (would be ₱1,875.00 if the IM were the direct upline) |
| Partner Broker | Upline 3 | ₱937.50 |

**Due-date helpers (`src/utils/paySchedule.ts`):** `addMonthsClamped("2026-01-31", 1)` returns `"2026-02-28"`; `UNIT_MONTHS = { months: 1, quarters: 3, years: 12 }`; `lastDueDate(start, unit, count) = dueDateAt(start, unit, count − 1)`.

### 8.5 Hierarchy rules (`genealogyService`, `checkPlacement`)

- Each agent has at most one upline (`genealogy.downline_agent_ID` is UNIQUE). Root agents have no row as a downline.
- An agent can't be their own upline and can't be placed under one of their own descendants (no loops).
- **A Partner Broker has no upline.** **An Investment Manager can only report to a Partner Broker.** Specialists and Supervisors may report to any rank (`allowedUplineRanks`).
- **One Property Sales Supervisor per team.** A team is everything below the topmost non-broker agent, so each direct report of a Broker heads their own team.
- The agent's own downlines must still be valid under the agent's new rank.
- On an explicit upline choice, a rule violation throws an error. When only the rank changes (promotion or edit), an invalid existing upline is **dropped** (`detached: true`).
- The rank of an agent is `rankOf(positions.position, position_ID)`: it matches "broker", "investment", "supervisor" or "specialist" in the name, falls back to the position id (1–4), then to `specialist`.

### 8.6 Dashboard metric definitions (`dashboardService.buildDashboard`)

| Metric | Definition |
|---|---|
| TOTAL SALES (MONTH) | Number of approved sales (`awaiting payment` or `complete`) whose **reservation date** is in the month; sub-line shows the contract value. Links to `/sales`. |
| TOTAL RECEIVED COMMISSION (MONTH) | Sum of tabs with `claimed = true` whose `claimed_at` is in the month. |
| LISTINGS (MONTH) | Listings created in the month (any status), the agent's own or everyone's. |
| RECEIVABLES | `summarizeTabs`: total − received across all tabs in view; trend = number of payouts not received. |
| READY TO REQUEST | Tabs with `approved` status that are due (`today >= due_date` or sale `complete`). |
| AWAITING APPROVAL | Tabs with `pending_approval` status. |
| Trend | % change against the previous month when a month is selected; "-" and "All Time" otherwise. |
| Sales Performance | Approved sales per month by reservation date, 7 months ending at the selected month; Avg Deal = mean contract price of the selected month's approved sales. |
| Reminders | Admin: sales pending approval, commissions awaiting approval. Agent: tabs ready to request, approved tabs due within 7 days. |
| Alerts | Agent: payment released (check proof and confirm), commissions approved. Admin: payment requests to release, commissions waiting for approval. |

---

## 9. Database reference

### 9.1 Tables at a glance

| Table | Purpose | Written by | Read by |
|---|---|---|---|
| `agents` | Agent accounts, profile, rank, admin flag, settings (`configs`) | Genealogy (add/edit/delete), Profile, Settings | almost everything |
| `positions` | The 4 ranks, their rate and promotion threshold | TeamInsights (threshold) | genealogyService |
| `genealogy` | Upline → downline edges | genealogyService | Genealogy, Dashboard, sales tab generation |
| `main_listings` | Listing header (price, location, status, developer, incentives, POI cache) | PropertyManagement, Listings, sale form, poiService | Listings, Sales, Dashboard, Developers, Shared |
| `house_and_lot`, `lot_only`, `condominium`, `memorial` | 1:1 type-specific listing details (PK = `listing_ID`) | PropertyManagement | listing details, sale form prefill, Sales details, Shared |
| `property_type`, `lot_class`, `condo_class` | Lookups (the app hard-codes the ids, see 9.4) | — | listing embeds |
| `listing_images` | Listing photos (URL + `display_order`) | PropertyManagement | Listings, Shared |
| `shared_listings` | Temporary public share links | shareService | SharedListing |
| `developers` | Developer profiles | Developer list | Developers, PropertyManagement, sale form, embeds |
| `opening_days` | Developer office hours, one row per day (`id` = `dev_ID`) | developerService | Developers |
| `developer_promos` | Developer promo posters | developerService | Developers |
| `sales` | One row per sale (reservation) | Sale form, Sales Report | Sales, Dashboard, Commissions, TeamInsights |
| `sale_dp_divisions` | DP payment plan of a sale | Sale form | Sales details, tab generation |
| `commissions` | Commission tabs: one per payment per recipient, plus the payment-flow state | tab generation, Commissions page | Commissions, Dashboard |

### 9.2 Schema

The schema below follows the original project PDF, with the details added by `supabase/migrations/` (unique keys, cascades, check values). The PDF export notes that "table order and constraints may not be valid for execution", so treat this as reference, not something to run.

<details>
<summary>Full schema (click to expand)</summary>

```sql
-- Lookups
property_type (property_type_ID bigint PK identity, property_type text /* 'house_and_lot', 'lot_only', ... */, created_at timestamptz default now())
lot_class     (lot_class_ID bigint PK identity, lot_classification text)
condo_class   (condo_class_ID bigint PK identity, condo_classification text)

-- People
positions (position_ID int PK identity, position varchar, commission_rate float8 NOT NULL default 3,
           promotion_sales_threshold numeric)            -- accumulated sales needed to be promoted INTO this rank; NULL = not set
agents (agent_ID int PK identity, first_name varchar NN, middle_name varchar, last_name varchar NN,
        age smallint NN, sex varchar NN, birth_date date NN, home_address text NN, contact_number varchar NN,
        email_address varchar NN, hire_date date NN, position_ID int NN → positions, admin_access bool NN,
        user_id uuid → auth.users(id) /* NULL until a login is linked */, profile_url text UNIQUE,
        configs jsonb /* user settings; the app always sets it */)
genealogy (relationship_ID bigint PK identity, upline_agent_ID int NN → agents,
           downline_agent_ID int NN UNIQUE → agents, created_at timestamptz default now())

-- Developers
developers (dev_ID bigint PK identity, name varchar NN, contact_number varchar NN, contact_email varchar NN,
            profile_url text NN, available_days <enum>, open_hours time, close_hours time /* legacy, unused */,
            location text NN, website_url text)
opening_days (id bigint NN → developers(dev_ID) /* the developer id; the PDF lists it as an identity column */,
              day <day enum: Monday..Sunday, Holiday> NN, open_hours time NN, close_hours time NN,
              PRIMARY KEY (id, day))
developer_promos (promo_ID bigint PK, dev_ID bigint NN → developers ON DELETE CASCADE, image_url text, title text,
                  valid_until date /* NULL = no expiry */, created_at timestamptz default now())

-- Listings
main_listings (listing_ID bigint PK identity, agent_ID bigint NN → agents, listing_title text,
               property_type_ID bigint NN → property_type, price float8 NN /* PHP; min price when bulk */,
               max_price float8 /* bulk only */, commission float8 /* % used to prefill the sale form */,
               location text, longitude float8 NN, latitude float8 NN, description text /* markdown */,
               faq text /* markdown */, fact_sheet text /* public URL */, dev_ID bigint → developers,
               status listing_status NN default 'draft' /* draft | pending | active | sold */,
               is_bulk bool, agent_incentive text, realty_incentive text,
               nearby_pois jsonb /* {fetched_at, categories:{id:[{name,lng,lat}]}} */,
               created_at timestamptz default now())
listing_images (image_ID bigint PK identity, listing_ID bigint NN → main_listings, image_url text,
                display_order int, created_at timestamptz default now())
house_and_lot (listing_ID PK → main_listings, "1_storey" bool, with_loft bool, "2_storey" bool, townhomes bool,
               rowhouse bool, lot_area float8, floor_area float8 /* sqm */, rooms_count int, toilets_count int,
               helper_rooms_count int, driver_rooms_count int, carpark_count int, master_bedroom_area float8)
lot_only (listing_ID PK → main_listings, block_number text, lot_number text, phase_number text,
          lot_area float8 NN, lot_class_ID bigint NN → lot_class)
condominium (listing_ID PK → main_listings, condo_class_ID bigint NN → condo_class, unit_number int,
             carpark_count int, is_studio_type bool, is_BR_unit bool, is_villa bool, is_garden_villa bool,
             is_penthouse bool, balcony_count int, bedroom_count int, master_bedroom_area float8)
memorial (listing_ID PK → main_listings, is_urn bool, is_vault bool, is_garden bool, is_estate bool,
          is_family_estate bool, is_pet_memorial bool)
shared_listings (share_id uuid PK default gen_random_uuid() /* = URL token */, listing_ID bigint NN → main_listings,
                 agent_ID bigint NN → agents, expires_at timestamptz NN, created_at timestamptz default now())

-- Sales and commissions
sales (sale_ID bigint PK identity, agent_ID int NN → agents /* the seller */, listing_ID bigint NN → main_listings,
       client_name text NN, reservation_date date NN, total_contract_price numeric(14,2) NN,
       agent_sale_seq int /* not written; numbers are computed for display */,
       commissionable_amount numeric(14,2), commission_rate numeric(5,2),
       gross_commission numeric(14,2) /* = commissionable_amount x commission_rate / 100; base of the tabs */,
       net_commission numeric(14,2) /* input hidden */, remarks text, voucher_series text /* input hidden */,
       unit_details jsonb default '{}' /* bulk sale: the specific unit's fields */,
       status sales_status default 'pending approval' /* pending approval | awaiting payment | complete | cancelled */,
       financing text CHECK IN ('Pag-ibig','Banking','In-House with Interest') /* DP only */,
       payment_scheme text CHECK IN ('DP','Spot-Cash','Deferred-Cash'),
       dp_rate numeric(5,2) CHECK (>0 AND <=100), dp_amount numeric(14,2), remaining_balance numeric(14,2),
       completed_at timestamptz, created_at timestamptz default now())
sale_dp_divisions (division_ID bigint PK identity, sale_ID bigint NN → sales ON DELETE CASCADE, division_no int NN,
                   rate numeric(5,2) NN CHECK (>0 AND <=100), payable_count int NN CHECK (>0),
                   payable_unit text NN default 'months' CHECK IN ('months','quarters','years'),
                   due_date_start date NN, due_date_end date NN /* >= start */, created_at timestamptz,
                   UNIQUE (sale_ID, division_no))
commissions (commission_ID bigint PK identity, sale_ID bigint NN → sales ON DELETE CASCADE,
             recipient_agent_ID int NN → agents, role text NN CHECK IN ('Agent','Upline 1','Upline 2','Upline 3'),
             recipient_rank text, payment_no int NN, due_date date NN, amount numeric(14,2) NN,
             is_balance bool NN default false,
             status text NN default 'pending_approval'
               CHECK IN ('pending_approval','approved','payment_requested','payment_released','received'),
             admin_approved bool NN default false, approved_at timestamptz,
             requested_at timestamptz, request_details jsonb /* PaymentRequestDetails */,
             released_at timestamptz, released_by int → agents, proof_urls text[] NN default '{}',
             claimed bool NN default false, claimed_at timestamptz /* set only on 'received' */,
             created_at timestamptz default now(),
             UNIQUE (sale_ID, role, payment_no))
```

</details>

### 9.3 Enums and allowed values

| Column | Values |
|---|---|
| `main_listings.status` (`listing_status`) | `draft` (default), `pending`, `active`, `sold` (the ones the app uses) |
| `sales.status` (`sales_status`) | `pending approval`, `awaiting payment`, `complete`, `cancelled` (note the spaces) |
| `sales.payment_scheme` | `DP`, `Spot-Cash`, `Deferred-Cash` |
| `sales.financing` | `Pag-ibig`, `Banking`, `In-House with Interest` |
| `sale_dp_divisions.payable_unit` | `months`, `quarters`, `years` |
| `commissions.role` | `Agent`, `Upline 1`, `Upline 2`, `Upline 3` |
| `commissions.status` | `pending_approval`, `approved`, `payment_requested`, `payment_released`, `received` (underscores) |
| `opening_days.day` | `Monday` … `Sunday`, `Holiday` |

### 9.4 Hard-coded lookup ids

These maps are duplicated across several files. Keep them in sync if the DB changes.

| Lookup | Ids | Defined in |
|---|---|---|
| `property_type_ID` | 1 `house_and_lot`, 2 `lot_only`, 3 `condominium`, 4 `memorial`, 5 `clubshare`, 6 `golfshare` | `listingsServices.ts` (`SUB_TABLE_MAP`, 1–4 only), `Listings.vue`, `PropertyDetails.vue`, `PropertyManagement.vue`, `SalesUploadModal.vue`, `SalesReport.vue`, `SharedListing.vue` |
| `lot_class_ID` | 1 Residential, 2 Commercial, 3 Industrial, 4 Farm Lot | `PropertyManagement.vue`, `PropertyDetails.vue`, `SalesReport.vue`, `SharedListing.vue`, `SalesUploadModal.vue` (array index + 1) |
| `condo_class_ID` | 1 Residential, 2 Commercial, 3 Industrial, 4 Condotel, 5 Timeshare | same files |
| `position_ID` | 1 Specialist, 2 Supervisor, 3 Investment Manager, 4 Partner Broker | `assets/classes/agent.ts` (`positionMap`), `utils/ranks.ts` (`ID_FALLBACK`), `genealogyService.ts` (`FALLBACK_POSITION_ID`) |

Property type strings come in three forms: DB `house_and_lot`, form label `House And Lot`, display `House and Lot` (`formattedPropertyType()`). Code that compares them often accepts all three.

### 9.5 UI field names vs DB column names

| Form / UI field | DB column |
|---|---|
| `one_storey`, `two_storey` | `"1_storey"`, `"2_storey"` (quoted, start with a digit) |
| `townhome` | `townhomes` |
| `room_count`, `toilet_count` | `rooms_count`, `toilets_count` |
| Lot Only `area` | `lot_only.lot_area` |
| Lot or condo `class` (label) | `lot_class_ID` / `condo_class_ID` (id) |
| `lng`, `lat` | `longitude`, `latitude` |
| `listing_id` (`Property` interface) | `listing_ID` |
| Developer `image_url`, `phone`, `email` (`Developer` interface) | `profile_url`, `contact_number`, `contact_email` |
| Commission tab `id`, `commission_amount`, `rank`, `is_admin_approved` | `commission_ID`, `amount`, `recipient_rank`, `admin_approved` |
| `DpDivision.divisionRate`, `count`, `unit`, `startDate`, `endDate` | `rate`, `payable_count`, `payable_unit`, `due_date_start`, `due_date_end` |

### 9.6 Migrations (`supabase/migrations/`)

| File | Adds |
|---|---|
| `20260617120000_create_sales.sql` | `sales` table, indexes, open RLS policy |
| `20260629120000_create_genealogy.sql` | `genealogy` table (backfill only; it already existed on the remote) |
| `20260629130000_add_nearby_pois.sql` | `main_listings.nearby_pois` |
| `20260720120000_add_listing_incentives.sql` | `main_listings.agent_incentive`, `realty_incentive` |
| `20260720120100_create_developer_promos.sql` | `developer_promos` table |
| `20260906120000_add_pending_listing_status.sql` | `pending` value on `listing_status` |
| `20261014140000_sales_payment_scheme_and_commissions.sql` | Combined and idempotent: sales financing, scheme and DP columns, `completed_at`, `sale_dp_divisions`, `commissions` (+ approval, balance, rank, role check), positions rates and thresholds, `Partner Broker` row, `sales.commission_rate`, Deferred-Cash, realtime publication, commission payment-flow columns, `sales.commissionable_amount`. **Re-run the whole file, then `notify pgrst, 'reload schema';`.** |

Tables that existed before migrations were introduced (`agents`, `main_listings`, the sub-tables, `developers`, ...) have no migration file. Their shape is the PDF schema.

---

## 10. Function index (where things are stored)

"Used by" lists the files outside the service that call the function.

### 10.1 Services

**`src/services/authService.ts`** (`authService`)

| Function | Purpose | Used by |
|---|---|---|
| `getCurrentAgent()` | Signed-in agent: `agent_ID`, first/middle/last name, `admin_access` (or null) | Listings, PropertyManagement, SalesReport, Commission, SalesUploadModal |
| `logoutUser()` | `auth.signOut()` → `{ success, error? }` | Sidebar |

**`src/services/agentService.ts`** (`agentService`)

| Function | Purpose | Used by |
|---|---|---|
| `getCurrentAgentProfile()` | Full `agents` row of the signed-in user | Sidebar, Profile |
| `getCurrentAgentID()` | Just `agent_ID` | Listings, Settings |
| `updateProfile(agentId, data)` | Update the `agents` row (0 rows → `{success:false}`) | ProfileEdit |
| `uploadProfileImage(agentId, file)` | Upload to `images/agents/`, return the public URL | ProfileEdit |
| `deleteProfileImage(url)` | Remove a profile image from storage (never throws) | ProfileEdit |
| `updateConfigs(agentId, configs)` | Save `agents.configs` | Settings |

**`src/services/listingsServices.ts`** (`listingsService`, `compileMarkdown`)

| Function | Purpose | Used by |
|---|---|---|
| `getListings(limit=20, statuses=['active'], ownPendingAgentId?)` | Newest listings with agent, type, developer and thumbnail, mapped to `Property` | Listings, SalesUploadModal (`limit` 100) |
| `mapToProperty(row)` | DB row → `Property` (lowest `display_order` image = thumbnail) | internal |
| `getListingPropertyType(listingId)` | `{ typeId, typeName }` | SalesReport, SalesUploadModal |
| `getListingById(id, propertyTypeId)` | Full row + agent, developer, images, matching sub-table | PropertyDetails, PropertyManagement, SalesReport, SalesUploadModal |
| `getAgentFromListing(listingId)` | Owner `agent_ID` (edit check) | Listings |
| `createListing(main, sub, typeId)` | Insert main + sub-table row; deletes the main row if the sub-table insert fails | PropertyManagement |
| `updateListing(id, main, sub, typeId)` | Update main + sub-table | PropertyManagement |
| `uploadPropertyImages(listingId, files)` | Upload to `images/listings/` + insert `listing_images` | PropertyManagement |
| `deleteListingImages(urls)` | Remove from storage + delete `listing_images` rows | PropertyManagement |
| `uploadFactSheet(listingId, file)` | Upload to the `fact_sheets` bucket + set `main_listings.fact_sheet` | PropertyManagement |
| `updateListingStatus(id, status)` | Set `main_listings.status` | Listings, SalesReport, SalesUploadModal |
| `deleteListing(id)` | Hard delete | Listings |
| `compileMarkdown(raw)` | Markdown → sanitized HTML | PropertyDetails, PropertyManagement, SharedListing |

**`src/services/shareService.ts`**

| Function | Purpose | Used by |
|---|---|---|
| `generateShareLink(listingId, agentId, daysValid=1)` | Clean up expired links, insert a new `shared_listings` row, return it | PropertyDetails |
| `getSharedListing(token)` | Load the listing for a token; throws if expired or pending | SharedListing |

**`src/services/poiService.ts`** (`poiService`, `POI_CATEGORIES`, `haversineKm`)

| Function | Purpose | Used by |
|---|---|---|
| `getNearbyPois(listingId, lng, lat, { force? })` | Cached (30 days) or live Mapbox category search | MapHolder |
| `haversineKm(aLng, aLat, bLng, bLat)` | Distance in km | MapHolder |

**`src/services/salesService.ts`** (`salesService`; types `Sale`, `Financing`, `PaymentScheme`)

| Function | Purpose | Used by |
|---|---|---|
| `getSales({ agentId?, search? })` | Sales (newest reservation first) with names filled in and sale numbers | SalesReport |
| `getSaleById(id)` | One sale | unused |
| `createSale(payload)` | Insert, return `{ success, data: { sale_ID } }` | SalesUploadModal |
| `updateSale(id, payload)` | Update (0 rows → `{success:false}`) | SalesUploadModal |
| `deleteSale(id)` | Delete (cascades to divisions and commissions) | SalesReport |
| `getTotalSales(agentId?)` | `{ count, totalContractPrice, totalGrossCommission }` | unused |
| `calculateDownpaymentMetrics(tcp, dpRate)` | `{ dp_amount, remaining_balance }` | SalesUploadModal |
| `validateDpDivisions(dpRate, divisions)` | Exact sum check (hundredths) | internal |
| `getDpDivisions(saleId)` | Divisions → `DpDivision[]` | SalesReport, SalesUploadModal |
| `saveDpDivisions(saleId, dpRate, divisions)` | Validate, delete all, insert | SalesUploadModal |
| `generateCommissionTabs(saleId)` | Build and save commission tabs on approval (7.11) | SalesUploadModal |
| `getListingDeveloperName(listingId)` | Developer name of a listing | SalesUploadModal |
| `calculateCommissionableAmount(tcp, rate)`, `generateSchedulePreview(payload)` | Older preview helpers | unused |
| `applySaleNumbers()`, `fillMissingAgentNames()`, `mapToSale()` | Module-private helpers | internal |

**`src/services/commissionService.ts`** (`commissionService`, `summarizeTabs`, `STATUS_LABEL`; types `CommissionTab`, `CommissionTabRow`, `CommissionStatus`, `PaymentRequestDetails`, `ReceivablesSummary`)

| Function | Purpose | Used by |
|---|---|---|
| `calculateSchedule(payload)` | Slots → raw → payouts per slot + summary (8.4) | salesService |
| `saveTabs(rows)` | Upsert tabs (`onConflict` sale_ID, role, payment_no) | salesService |
| `countForSale(saleId)` | Number of existing tabs | salesService |
| `getTabs(agentId?)` | Tabs with recipient, sale and listing info, `payment_total` | Commission, dashboardService |
| `approveTab(id)` | `pending_approval → approved` | Commission |
| `removeUnclaimedForSale(saleId)` | Delete tabs with `claimed=false` (sale cancelled) | SalesUploadModal |
| `requestPayment(id, details)` | `approved → payment_requested` (checks earlier payments are received) | PaymentRequestModal |
| `releasePayment(id, releasedBy, files)` | Upload proofs; `payment_requested → payment_released` | ReleasePaymentModal |
| `confirmReceived(id)` | `payment_released → received` (sets `claimed`) | ProofModal |
| `_advance(id, from, patch)` | Guarded status update | internal |
| `summarizeTabs(tabs)` | `{ claimedAmount, totalAmount, claimedCount, totalCount, pendingAmount }` | Commission, dashboardService |
| `STATUS_LABEL` | Status → display label | Commission, dashboardService |

**`src/services/dashboardService.ts`**

| Function | Purpose | Used by |
|---|---|---|
| `getDashboardData(agentId?)` | Loads sales, listings and tabs (scoped, or all) | Dashboard |
| `buildDashboard(data, { month, agentId, isAdmin, now? })` | Pure builder → `DashboardView` (alerts, metrics, commissionMetrics, history, performance, activities, reminders) | Dashboard |

**`src/services/genealogyService.ts`** (`genealogyService`; types `GenealogyAgent`, `GenealogyNode`, `GenealogyStats`, `AgentDetail`, `TeamMember`, `RankPosition`, `OverrideLine`)

| Function | Purpose | Used by |
|---|---|---|
| `getTree()` | Forest of root nodes with nested `children` | Genealogy page, tree |
| `getUplineChain(agentId, levels=2)` | Upline list, nearest first | Dashboard (20), SalesReport (2), AddAgentModal (1) |
| `getRoleChain(agentId)` | `{ seller, ancestors[] }` with rank and rate, for the commission engine | salesService |
| `getDownline(agentId, levels=2)` | Breadth-first downline list | Dashboard (20) |
| `getStats()` | Total agents, team leaders, active teams, new this month | Genealogy page |
| `getAgents()` | Flat agent list (dropdowns) | Genealogy page, AddAgentModal |
| `getRecentAgents(limit=5)` | Newest by `hire_date` | Genealogy page |
| `addAgent(data, uplineId?)` | Check rules, insert agent and edge | AddAgentModal |
| `getAgentById(id)` | Full editable record | Genealogy page |
| `updateAgent(id, patch)` | Patch fields only (no rule checks) | internal |
| `setUpline(downlineId, uplineId)` | Check rules and loops, replace edge | unused (prefer `updateAgentAndUpline`) |
| `replaceUplineEdge(downlineId, uplineId)` | Delete and insert the edge, no checks | internal |
| `updateAgentAndUpline(id, patch, uplineId)` | Save fields + upline with rules; returns `{ detached }` | AddAgentModal |
| `getTeamInsights()` | Per agent: rank, accumulated sales, progress, override split | TeamInsights, tree |
| `promoteAgent(agentId)` | Admin-confirmed promotion to the next rank | TeamInsights |
| `getRankPositions()` | The 4 ranks with rate and threshold | TeamInsights |
| `setPromotionThreshold(positionId, value)` | Save a threshold | TeamInsights |
| `getAgentReferences(id)` | Counts of sales, listings, share links | internal |
| `deleteAgent(id)` | Blocked delete with downline re-parenting | Genealogy page |
| `fetchGraph()`, `checkPlacement()`, `toAgent()` | Module-private helpers | internal |

**`src/services/developerService.ts`** (`developerService`, `reformatHours`)

| Function | Purpose | Used by |
|---|---|---|
| `getDevelopers()` | Developers with office hours (grouped), 3 recent projects, promos | developerlist, PropertyManagement |
| `getDeveloperNames()` | Sorted names | Listings, SalesUploadModal |
| `addDeveloper(dev)` | Insert developer + `opening_days`; returns `dev_ID` | addDeveloper |
| `updateDeveloper(dev, oldHours)` | Update + replace `opening_days` (`oldHours` is unused) | addDeveloper |
| `uploadImage(devId, file)` | `images/developers/` → URL (`''` on error) | addDeveloper |
| `deleteDeveloper(dev)` | Delete `opening_days`, then the developer | developerlist |
| `uploadPromoImage(devId, file)` | `images/developer_promos/` → URL | addDeveloper |
| `addPromo(devId, promo)` | Insert a promo row → `promo_ID` | addDeveloper |
| `deletePromo(promo)` | Delete the storage file + row | addDeveloper |
| `reformatHours("9:00 AM - 5:00 PM")` | → `['09:00','17:00']` | imported, never called |

**`src/services/lookupService.ts`**: empty placeholder.

### 10.2 Utils

| File | Exports | Used by |
|---|---|---|
| `utils/commissionAllocation.ts` | `allocatePayouts(raw, seller, ancestors)`, `agentFactor(rank, rate)`, types `ChainMember`, `PayoutRole`, `CommissionPayout` | commissionService, genealogyService |
| `utils/ranks.ts` | `Rank`, `RANK_LABEL`, `DEFAULT_RANK_RATE`, `rankOf(name, id)`, `rankLabel(rank)`, `allowedUplineRanks(rank)` | genealogyService, commissionAllocation, AddAgentModal |
| `utils/paySchedule.ts` | `UNIT_MONTHS`, `addMonthsClamped`, `dueDateAt`, `lastDueDate` | commissionService, salesService, SalesUploadModal |
| `utils/conversion.ts` | `currentCurrency`, `currentUnit` (refs), `currencySymbols`, `areaUnits`, `SQM_TO_SQFT`, `convertPrice`, `formatPrice`, `convertArea`, `formatArea`, `convertPriceToPHP`, `convertAreaToSqm` | Listings, PropertyManagement, PropertyCard, PropertyDetails, SalesReport, SharedListing, Settings |
| `utils/useSettings.ts` | `useSettings()` → `{ configs, updateSetting, loadSettings }` | App, Settings, conversion, ProfileCard, genealogy tree |
| `utils/liveRefresh.ts` | `useLiveRefresh(reload, tables, opts)` | Dashboard, Commission, Genealogy page, tree, TeamInsights |

### 10.3 Classes and constants (`src/assets/classes/`)

| File | Exports |
|---|---|
| `agent.ts` | `AgentProfile`, `positionMap`, `getAge(birthDate)` |
| `commission.ts` | `PayUnit`, `DpDivision`, `CommissionPaymentScheme`, `CommissionChain`, `CalculateCommissionPayload`, `CommissionScheduleItem`, `CommissionSummary`, `CommissionCalculationResult` |
| `developers.ts` | `DeveloperProject` (declared twice, harmless), `DeveloperPromo`, `Developer`, `DayOption`, `days`, `OfficeHourSlot` |
| `listings.ts` | `Property`, `Lot`, `HouseAndLot`, `Condominium`, `Memorial`, `Images`, `formattedPropertyType(type)` |

### 10.4 Components (props → emits)

| Component | Props | Emits | Used in |
|---|---|---|---|
| `Sidebar` | — | — | App |
| `listings/PropertyCard` | `details?: Property`, `isLoading?` | — | Listings |
| `listings/PropertyDetails` | `prop_id`, `prop_type`, `isAdmin?` | `close-details`, `edit`, `delete`, `sold`, `approve`, `share` | Listings, developerlist |
| `listings/ListingsFilter` | `choices`, `modelValue` | `update:modelValue` | Listings |
| `listings/MapHolder` | `targetLocation?`, `listingId?` | — | PropertyDetails, SharedListing |
| `listings/MapInteractive` | `targetLocation?` (`lng`, `lat`, `loc`) | `update:targetLocation` (`lng`, `lat`, `name`) | PropertyManagement |
| `sales/SalesUploadModal` | `lockedListing?`, `editSale?` | `close`, `saved` | SalesReport, Listings |
| `commissions/PaymentRequestModal` | `tab`, `agent` | `close`, `submitted` | Commission |
| `commissions/ReleasePaymentModal` | `tab`, `adminAgentId` | `close`, `released` | Commission |
| `commissions/ProofModal` | `tab`, `canConfirm` | `close`, `received` | Commission |
| `dashboard/DashboardStatCard` | `stat: Metric` | `click` | Dashboard |
| `dashboard/SalesPerfromance` | `bars`, `sold`, `avgDeal` | `open-details` | Dashboard |
| `dashboard/CommissionHistory` | `history: HistoryItem[]` | — | Dashboard |
| `dashboard/GenealogyCard` | `upline`, `downline` (`{ name, meta }[]`) | `view-full` | Dashboard |
| `dashboard/Reminders` | `reminders` | `open` | Dashboard |
| `dashboard/RecentActivity` | `activities` | `view-item`, `view-all` | (hidden) |
| `genealogy/genealogymodal` | — | — | Genealogy page |
| `genealogy/AddAgentModal` | `agent?: AgentDetail` (edit mode) | `close`, `saved` | Genealogy page |
| `genealogy/TeamInsights` | — | `changed` | Genealogy page |
| `developer/developerCard` | `dev: Developer` | `delete-developer`, `edit-developer`, `contact-developer`, `open-listing`, `open-promo` | developerlist |
| `developer/addDeveloper` | `dev?: Developer` | `close-add-developer` | developerlist |
| `calculator/CalculatorPanel` | `prefillPrice?` | — | Accounting, PropertyDetails |
| `accounting/amortSched` | `principal`, `years`, `interest` | `close` | CalculatorPanel |
| `profile/ProfileCard` | `agent` | — | Profile |
| `profile/ProfileEdit` | `agent` | `cancel` | Profile |
| `settings/configDropdown` | `choices`, `modelValue` | `update:modelValue` | Settings |
| `settings/configToggleSlider` | `modelValue: boolean` | `update:modelValue` | Settings |

---

## 11. Known issues, gotchas and tech debt

Verified by reading the code on 2026-10-28. Line numbers are approximate. **Remove an item once it is fixed** (see 1.7).

### 11.1 Listings and Property Management
- **Only 20 listings load.** `Listings.vue` calls `getListings(20, ...)`, so the grid, search and filters only ever see the 20 newest listings.
- **New-listing fact sheet uses the wrong id.** Create mode calls `uploadFactSheet(propertyId, ...)`, and `propertyId` is `-1` in create mode. It should use `response.data.listing_ID` (`PropertyManagement.vue` ~line 1048).
- **Edit mode skips conversions.** `price` is saved without `convertPriceToPHP` (while `max_price` is converted), and lot area, floor area and area are saved without `convertAreaToSqm`. Values are wrong when the display currency or unit isn't PHP/Metric (~lines 1074–1110).
- **Edit mode loses Clubshare and Golfshare.** The edit-mode `typeMap` only has 4 types and falls back to `1`, so saving those listings changes them to House and Lot.
- **Property Management opened without `?edit=0`** (the Sidebar link, and Dashboard "+ Add Listing") runs in edit mode with id `-1`: loading fails quietly and Save calls `updateListing(-1)`, which saves nothing. Only Listings "Add Listing" passes `edit: 0`.
- **No delete check.** Any user can delete any listing. Edit is owner-only, even for admins.
- The Listings filters Rooms, Bedrooms, Bathrooms, Lot Area, Class and Memorial Type are not applied.
- `Listings.processDelete` shows "Success! The listing has been deleted." in its `catch` block too.
- `Listings.vue` binds `@edit` / `@delete` on `PropertyCard`, but the card never emits them.
- Clubshare and Golfshare have no sub-table. Bulk listings still write a sub-table row with the form's default values.

### 11.2 Sales and commissions
- **Wrong due-date wording in the sale form.** Spot-Cash and Deferred-Cash first due dates count from the **approval date** (`new Date()` in `generateCommissionTabs`). The team confirmed (2026-10-28) that this is correct. The sale form's info boxes still say "one month after the reservation" and preview a date computed from `reservation_date` (`firstDueDate` in `SalesUploadModal.vue`); that wording is what needs fixing.
- **Sold flow on bulk listings skips unit details.** In Confirm (Sold) mode the modal doesn't load `listings`, so `selectedListing` is undefined: the bulk "Specific Unit Details" section and the prefill never appear, and `unit_details` is saved as `null` (`SalesUploadModal.vue` `onMounted` returns early when `propertyLocked`).
- **Deleting a sale deletes its commission history.** `commissions` and `sale_dp_divisions` cascade, so received commissions are deleted too. It also sets the listing back to `active`.
- Tabs are not regenerated when a sale is edited after approval (by design; see 7.11).
- `SalesReport.vue` has three `watch(selectedSale)` handlers, so the upline is fetched twice.
- `/commissions` has no `meta.requiresAuth` (the data still needs a session).
- Proof-of-payment images are public URLs.

### 11.3 Genealogy
- **Missing admin gating.** Add, edit and delete agent, Promote, and threshold editing are visible to **all** users. The team confirmed they should be admin-only; gate them with `authService.getCurrentAgent().admin_access`.
- New agents have no login (`user_id` null). Linking a login is a manual step in Supabase.
- The tree's heading says "Developer Genealogy"; it shows agents.
- The Dashboard "+ Add Agent" button opens a placeholder (`components/dashboard/AddAgent.vue`).

### 11.4 Developers
- **Missing admin gating.** Add Developer, Edit, Delete and promo management are visible to all users. The team confirmed they should be admin-only.
- Edit mode never uploads a newly chosen profile picture; only add mode does.
- After saving, the modal stays open and the list doesn't reload. `handleDeleteDeveloper` doesn't await the delete before reloading.
- The search box isn't wired; the Contact button's event isn't handled.
- `developers.available_days`, `open_hours` and `close_hours` are unused (office hours live in `opening_days`). `reformatHours` is unused.

### 11.5 Data-shape traps
- UI and DB field names differ (9.5), and the lookup ids are hard-coded in many files (9.4).
- Sub-table embeds may come back as an array or as an object; normalize them.
- `sales.agent_sale_seq` is never written; the sale numbers are computed in `applySaleNumbers`.
- Commission role labels (`Upline 1/2/3`) are not ranks. Read `recipient_rank` for the rank.

### 11.6 Settings and UI
- `currentCurrency` and `currentUnit` are set once, at module load. Changing the default in Settings only applies after a reload; the Listings dropdowns change them for the session only.
- Settings Save shows no success or error message to the user. Logout doesn't clear `localStorage['app_user_settings']`.
- The Commissions page, its modals, `AddAgentModal` and `SharedListing` have no dark-mode styling.
- `bg-maurealty-red` (Listings confirmation toast) isn't a defined theme color.

### 11.7 Security (pre-launch)
- RLS is wide open on every table (dev policy). Every role rule is frontend-only. Hardening (admins see everything, agents see their own) is planned "before go-live" according to the migration comments.

### 11.8 Dead code and unused dependencies
- Unrouted or unused files: `views/DashboardPrevious.vue`, `components/test.vue`, `components/modal.vue`, `components/dashboard/AddListing.vue`, `components/dashboard/Calculator.vue`, `services/lookupService.ts`, `babel.config.js`.
- Unused functions: `salesService.getSaleById`, `getTotalSales`, `generateSchedulePreview`, `calculateCommissionableAmount`; `genealogyService.setUpline`; `reformatHours`.
- Unused dependencies: `chart.js`, `@types/chart.js`, `lucide`, `next`, `dagre`, `@types/dagre`, `@vue-flow/background`.
- `.env.example` is missing `VITE_MAPBOX_TOKEN`.

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **Agent** | A user of the portal (a row in `agents`). Admins are agents with `admin_access`. |
| **Rank / Position** | Specialist, Supervisor, Investment Manager or Partner Broker (`positions`). Sets the commission rate and the override rules. |
| **Upline / Downline** | The agent someone reports to, and the agents below them (`genealogy`). |
| **Team / Team root** | Everything below the topmost non-broker agent; a root is an agent with no upline. |
| **Accumulated sales** | An agent's own completed sales plus all completed sales below them; used for promotion. |
| **Listing** | A property or project published on the portal (`main_listings` + a type sub-table). |
| **Single vs Bulk** | A listing for one unit, or for many units (for example a condo building) with a price range; bulk sales record the specific unit in `sales.unit_details`. |
| **Pending listing** | A listing created by a non-admin and waiting for admin approval. |
| **Sale** | A reservation of a listing by a client (`sales`). |
| **TCP** | Total Contract Price (`sales.total_contract_price`). |
| **Reservation date** | The date the client reserved; the date the Dashboard and Sales Report use for a sale. |
| **Commissionable Amount** | The amount the commission rate is applied to; can differ from TCP because of taxes and policies. |
| **Gross Commission** | Commissionable Amount × Commission Rate; the base of the commission tabs. |
| **Net Commission** | A legacy, admin-entered field; its input is hidden for now. |
| **Payment scheme** | How the buyer pays: **DP** (down payment in divisions + a remaining balance), **Spot-Cash** (one full payment), **Deferred-Cash** (12 monthly installments). |
| **DP division** | One block of the down payment: a rate paid in N months, quarters or years (`sale_dp_divisions`). |
| **Balance tab** | The extra commission tab for the remaining (100% − DP%) of the price. |
| **Financing** | How a DP buyer finances the rest: Pag-ibig (the government housing fund), Banking, In-House with Interest. |
| **Commission tab / payout** | One row in `commissions`: what one person is paid for one payment of one sale. |
| **Raw company commission** | slot% × 5% × gross commission; the pool split between the seller and the uplines. |
| **Override** | An upline's share of a downline's sale. |
| **Receivables** | All of a person's commission tabs; "received" means status `received`. |
| **Voucher series** | Receipt or voucher number of a sale; the input is hidden for now. |
| **Fact sheet** | A downloadable document (pdf, doc, docx, md) attached to a listing. |
| **POI** | A nearby point of interest (hospital, school, ...) shown on the map. |

---

## 13. Recent changes and doc discrepancies

### 13.1 What `documentation.md` added, mapped to this file

| `documentation.md` entry | Summary | See |
|---|---|---|
| 2026-10-15: Dashboard cards, genealogy card, commissions page | New card rows, live Sales Performance, full upline and any-depth downline, Recent Activity hidden, single grid of commission cards with "n/N", ordered payment requests, editable request details, per-agent vs all sale numbering | 7.3, 7.12, 7.9 |
| 2026-10-14: Commission payment flow | `claimTab` replaced by the 5-status flow, request/release/proof modals, proof images, role restrictions, `agents!recipient_agent_ID` fix | 7.12, 8.3 |
| 2026-10-14: Roles, role-based commissions, sale form, live dashboard | `ranks.ts`, `commissionAllocation.ts`, Deferred-Cash, `getRoleChain`, `useLiveRefresh`, hierarchy rules, `TeamInsights`, block/lot/phase/floor on bulk sales | 7.10, 7.11, 7.13, 7.14, 8.4, 8.5, 5.6 |
| 2026-10-14: Dashboard connected | `dashboardService`, `completed_at`, admin scope, real panels | 7.3, 8.6 |
| 2026-10-14: Sales report names and access | Fallback agent names, non-admins see only their own sales, status admin-only | 7.9, 6 |
| 2026-10-14: Commission approval, balance tab, cancel/complete | Per-tab approval, balance tab, cancel removes tabs, complete lifts the due-date wait | 7.11, 8.3, 8.4 |
| 2026-10-14: Pay units and commission tabs | `paySchedule.ts`, months/quarters/years, `commissions` table, `generateCommissionTabs` | 7.10, 7.11 |
| 2026-10-14: Financing, payment scheme, DP divisions | Sale form fields, exact rate validation, DP details in the Sales Report | 7.10 |
| Migrations, 2026-06 to 2026-09 | Sales, genealogy, POIs, incentives, developer promos, pending listings | 9.6 |

### 13.2 Corrections to older docs (verified in code)

| Older source says | Code does |
|---|---|
| PDF: "Vue 4" | Vue `^3.5` |
| PDF: `supabase/` "no current use" | Holds `config.toml` and the versioned migrations |
| `documentation.md`: `vue-tsc` shows a `PropertyDetails.vue` error; Baseline: build fails on type errors | `vue-tsc --build --force` passes with 0 errors (2026-10-28). `vite build` was not re-run for this file. |
| `documentation.md` (2026-10-14) and the sale form: Spot-Cash due "1 month after the reservation" | 1 month after the date the tabs are generated (approval). The team confirmed the approval date is correct. |
| `documentation.md` (2026-10-14): commission rate "admin-only edit" | Editable by anyone (the 2026-10-15 entry calls it "editable Commission Rate") |
| PDF: commission status "Awaiting Approval" | DB value `pending_approval`; label "Pending Approval" on cards, "Awaiting Approval" on the filter tab |
| `.env.example` lists 2 variables | 3 are required (`VITE_MAPBOX_TOKEN` too) |

---

## 14. Changelog of this file

Add one line per update, newest first: `YYYY-MM-DD: what changed (sections)`.

- **2026-10-28:** Recorded team answers: the 5% formula stays unconfirmed (8.4); the approval date is the correct due-date anchor, so the sale form's wording is the bug (11.2, 13.2); agent and developer management is meant to be admin-only (6, 7.13, 7.15, 11.3, 11.4).
- **2026-10-28:** Created from a full read of the codebase (branch `feature/sales-report-v2` @ `859ea5d`), the project PDF and `documentation.md`. Type-check verified clean.
