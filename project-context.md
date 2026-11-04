# MauRealty Agent Portal — Project Context

> **What this file is:** the single reference for how the Maureal Realty and Brokerage (MRB) web portal works today: its features, the processes behind them, and where each piece of logic lives in the code. It is written for AI assistants and for the dev team.
>
> **Last verified against the code:** 2026-11-04 · branch `feature/ticketing-system` (IT support tickets, on top of `9e0d396`) · `npx vue-tsc --build --force` passes with **0 errors** · `npx vite build` passes · the Edge Function type-checks against a Deno shim · the support tickets migration was run (twice) and its RLS/trigger rules tested on a local PostgreSQL 18 with stubbed `auth`/`storage` schemas.
>
> **Supabase changes need manual steps.** Agent accounts (2026-11-04) need a migration, an Edge Function deploy and some dashboard settings. IT support tickets (2026-11-04) need one more migration, run after the agent accounts one. See [3.3 Supabase project setup](#33-supabase-project-setup-manual-steps).
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
| Server-side code that needs the service-role key (creating/deleting Auth users, anything an admin-only check must guard) | a Supabase Edge Function: `supabase/functions/<name>/index.ts` (Deno, `npm:@supabase/supabase-js@2`) | Called from a service with `supabase.functions.invoke('<name>', { body })`. Check the caller inside the function. Document it in 9.8 and the deploy step in 3.3. Not part of `vue-tsc` (Deno code). |
| Form input cleaning (trim, length caps, email/phone/date checks) | `src/utils/sanitize.ts` | Use it in every form that writes to the DB or Supabase Auth. Never trim or alter passwords. |

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
- **Input cleaning / SQL injection:** never build SQL or PostgREST filter strings from user text. supabase-js sends values as JSON and PostgREST binds them as parameters; SQL functions must not use `EXECUTE`/`format()` with user input. On top of that, clean form values with `src/utils/sanitize.ts` (`cleanText`, `cleanMultilineText` for long answers that keep line breaks, `normalizeEmail`, `isValidEmail`, `isValidPhone`, `isIsoDate`, `digitsOnly`) before sending them, and re-validate on the server when an Edge Function is involved. Search boxes filter loaded rows in the browser; they never become a query.
- **User-written text is shown with `{{ }}`** (Vue escapes it), with `whitespace-pre-line` when line breaks matter. Only Markdown that went through `compileMarkdown()` (DOMPurify) may use `v-html`.

### 1.4 Guardrails

- **Do not change commission formulas, rank rates, override percentages or hierarchy rules** (Section 8) without explicit confirmation from the team. They are business rules from the client, not implementation details.
- Keep `commissions.claimed`, `claimed_at` and `admin_approved` in step with `commissions.status`. Older queries still read them.
- **Role checks happen mostly in the app.** RLS is the open dev policy on every table except `agent_credentials` and `support_tickets`. Any new admin-only action must be gated in the UI *and*, where possible, guarded in the service (for example by checking the expected previous status, as `commissionService._advance` does). **Exceptions (checked on the server):** the `agent-account` Edge Function, the SQL functions `admin_get_agent_login` / `store_agent_initial_password` (see 9.7, 9.8), and **support tickets** (real RLS + the `support_tickets_guard` trigger + storage policies on the private `support_attachments` bucket, see 7.21 and 9.7). Don't replace the support ticket policies with the open dev policy.
- **Passwords:** never store, log or send a password anywhere except Supabase Auth. The only copy the app keeps is the **encrypted initial password** in `agent_credentials` (deleted as soon as the agent changes it). Don't add RLS policies to `agent_credentials`, don't select it from the browser, and don't print `agent_password_key` from Vault.
- Some features are hidden by being **commented out on purpose**: Net Commission input, Voucher Series input, the Recent Activity panel. Do not delete them, and do not restore them unless asked.
- Do not commit, push or create branches unless the user asks. The main branch is `mainer`. The branch naming rule is `<feat/fix>/<frontend/backend>/<featureName>`.
- Never put real keys in `.env.example`, and never print the contents of `.env.local`.

### 1.5 Database changes

1. Write an **idempotent** migration (`add column if not exists`, `create table if not exists`, `drop policy if exists`, and `do $$ ... $$` blocks for constraints). The team re-runs migrations by hand in the Supabase SQL editor.
2. Quote mixed-case identifiers (`"agent_ID"`, `"listing_ID"`). Lower-case column names stay unquoted.
3. New tables get RLS enabled plus the same open dev policy as the others (see `20261014140000_...sql`, section 4). **Exception:** a table holding secrets gets RLS with **no** policies plus `revoke all ... from anon, authenticated`, and is reached only through `SECURITY DEFINER` functions with `set search_path = ''` (see `20261104120000_agent_accounts.sql`). Revoke `execute` on such functions from `public, anon` and grant only the roles that need them. **Real per-user rules** (who may read/write which rows) use `public.current_agent_id()` and `public.current_agent_is_admin()` wrapped in `(select ...)`, as `20261104160000_support_tickets.sql` does.
4. If a page should refresh live from the new table, add it to the `supabase_realtime` publication (see section 5d of the same migration) and to that page's `useLiveRefresh([...])` list.
5. End the migration with `notify pgrst, 'reload schema';`.
6. Update Section 9 of this file, and 3.3 if the team has to do anything by hand in the Supabase dashboard.
7. **Every Supabase change is documented here**: migrations (9.6), SQL functions and triggers (9.7), Edge Functions (9.8), Vault secrets, Auth settings and email templates (3.3).

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
- browse the **developers** the company works with, including their promo posters,
- raise **IT support tickets** (problems, requests, feedback) with optional screenshots and follow them until they are resolved.

**Admins** are agents with `agents.admin_access = true`. They approve listings, sales and commissions, release commission payments with proof, manage agents, ranks and promotion thresholds, and act as **IT support** (review and resolve everyone's tickets). **Adding an agent also creates their login** (Supabase Auth user + generated initial password); agents change that password themselves with a code sent by email.

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
   pending_approval ─admin approves (Yes/No popup)─► approved ─recipient requests─► payment_requested
        ─admin releases with proof images─► payment_released ─recipient types the phrase─► received
   (the recipient is the agent the tab pays: a non-admin, or an admin on their own tab)
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
| Backend | Supabase (`@supabase/supabase-js ^2`) | Auth (email/password + email one-time codes for password changes), Postgres through PostgREST (tables and RPC functions), Storage, Realtime, **Edge Functions** (Deno; `supabase/functions/`), **Vault** + `pgcrypto` (encrypted initial passwords). Client in `src/supabaseClient.ts`. |
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

The `agent-account` Edge Function reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which Supabase provides to every Edge Function automatically. **Never put the service-role key in `.env.local` or any `VITE_` variable**: anything starting with `VITE_` ends up in the browser bundle.

### 3.2 Scripts

| Command | Does |
|---|---|
| `npm install` | Install dependencies (Node `^20.19.0` or `>=22.12.0`) |
| `npm run dev` | Vite dev server |
| `npm run build` | `vue-tsc --build` and `vite build` in parallel |
| `npm run type-check` | `vue-tsc --build` |
| `npm run preview` | Preview the production build |

`supabase/config.toml` is the Supabase CLI local config (mostly defaults). The team applies migrations by hand in the Supabase SQL editor rather than through the CLI.

### 3.3 Supabase project setup (manual steps)

Things that live in the Supabase project, not in the frontend build. Do them once per project (dev and production), in this order. Redo step 2 whenever `supabase/functions/agent-account/index.ts` changes.

| # | Where (Supabase dashboard) | What | Why |
|---|---|---|---|
| 1 | SQL Editor | Run `supabase/migrations/20261104120000_agent_accounts.sql` (safe to re-run). If it fails with *schema "vault" does not exist*, enable **Integrations → Vault** and run it again. Check: `select name from vault.secrets where name = 'agent_password_key';` returns one row. | Creates `agent_credentials`, the Vault key, the SQL functions and the `auth.users` trigger (9.7). |
| 2 | Edge Functions → **Deploy a new function → Via editor** | Name it exactly **`agent-account`**, paste `supabase/functions/agent-account/index.ts`, Deploy. (CLI alternative: `supabase functions deploy agent-account --project-ref <ref>`.) Leave **Verify JWT** on; if calls fail with 401 *Invalid JWT* (projects on the new JWT signing keys), turn it off for this function: the function still checks the caller itself. | Creates logins with the service-role key (9.8). Until it is deployed, Add Agent shows "The agent-account Edge Function is not deployed yet". |
| 3 | Authentication → Emails → **Templates → Reset password** | Make the email contain the code `{{ .Token }}` (template below). Remove `{{ .ConfirmationURL }}` so nobody signs in through a link without changing their password. | The change-password modal asks for the **code**; the default template only has a link. |
| 4 | Authentication → **Sign In / Providers → Email** | Optional: *Email OTP Expiration* (default 3600 s) and *Email OTP Length* (the modal accepts 6–10 digits). | Code lifetime and length. |
| 5 | Authentication → Emails → **SMTP Settings**, then **Rate Limits** | Set up a custom SMTP sender (company mail, Resend, SendGrid, ...) and raise *emails per hour*. | Supabase's built-in sender only delivers to members of the Supabase team and allows only a few emails per hour, so agents would not receive their codes. |
| 6 | Authentication → **Sign In / Providers** | Turn **off** *Allow new users to sign up*. | Logins are created only by admins (through the Edge Function, which isn't affected). With sign-ups on, anyone holding the anon key could make a login and, with the open dev RLS, read the data. |
| 7 | App: Genealogy → Edit Agent | For agents with **no login**, tick *Create a login with this email when I save*. Logins linked by hand earlier keep working (their password can't be shown). | Older agents have `user_id = null`. |
| 8 | SQL Editor | **IT support tickets:** run `supabase/migrations/20261104160000_support_tickets.sql` (safe to re-run; needs step 1 first, it stops with a clear message otherwise). Check: `select id, public from storage.buckets where id = 'support_attachments';` returns one row with `public = false`. | Creates `support_tickets` (real RLS + `support_tickets_guard` trigger), `current_agent_id()`, the private `support_attachments` bucket with its storage policies, and adds the table to realtime (7.21, 9.7). Until it runs, the IT Support page says the table is missing. |
| 9 | Storage → **Policies** (or SQL: `select policyname, cmd, qual from pg_policies where schemaname = 'storage' and tablename = 'objects';`) | Make sure every older policy on `storage.objects` is limited to its own bucket (`bucket_id = 'images'` / `'fact_sheets'`). | Policies are OR-ed: a policy with no `bucket_id` condition would also open the private ticket screenshots to other users. |

Reset password email template (step 3), subject e.g. *Your MauRealty password code*:

```html
<h2>Change your MauRealty password</h2>
<p>Enter this code in the portal to change your password:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>The code can be used once and expires soon. If you did not ask to change your password, you can ignore this email.</p>
```

**Smoke test after setup:** as an admin, add a test agent → the success screen shows the email and password; Authentication → Users lists the email; `agents.user_id` is filled; `select "agent_ID", password_changed_at from agent_credentials;` shows a row with `password_changed_at` null. Sign in as that agent → red reminder on the Dashboard → change the password with the emailed code → the reminder disappears and Edit Agent shows "Changed by the agent on ...". Delete the test agent → their user disappears from Authentication → Users.

**Smoke test for IT support tickets (step 8):** as an agent, open IT Support → Raise a Ticket → fill in a "Something isn't working" ticket with a screenshot → it appears as **Raised** in My Tickets, and Storage → `support_attachments` has a file under that user's uid folder. As another agent, the ticket is not listed. As an admin: All Tickets lists it → **Review** → **Resolve** (needs a note) → **Reopen**. Back as the agent: the ticket shows the admin's note, and a 4th open ticket is refused.

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
│  ├─ migrations/             Versioned schema changes (see 9.6), incl. 20261104160000_support_tickets.sql
│  └─ functions/              Edge Functions (Deno, deployed by hand, see 3.3 and 9.8)
│     └─ agent-account/index.ts  Creates/removes agent logins with the service-role key (admins only)
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
   │  │  ├─ listings.ts       Property (+ Lot, HouseAndLot, Condominium, Memorial), Images, formattedPropertyType()
   │  │  └─ ticket.ts         SupportTicket, NewTicket, statuses, categories, areas, limits, ticket helpers
   │  ├─ images/              Logos, badges (MauBadgeLight/Dark.svg), placeholders, login background
   │  ├─ defaultSettings.json Default user configs (currency, unit, animations, dark mode)
   │  └─ questions.json       Suggested FAQ questions per property type (Property Management)
   ├─ services/               Everything that talks to Supabase or external APIs (Section 10)
   │  ├─ authService.ts       Current agent (id, names, admin_access), logout
   │  ├─ accountService.ts    Agent logins (Edge Function), initial-password reveal, password reminder, email-code password change
   │  ├─ agentService.ts      Full profile, profile/config updates, profile image upload/delete
   │  ├─ listingsServices.ts  Listings CRUD, images, fact sheets, status, compileMarkdown()   (note the plural file name)
   │  ├─ shareService.ts      Temporary public share links
   │  ├─ poiService.ts        Nearby points of interest (Mapbox) with a per-listing cache
   │  ├─ salesService.ts      Sales CRUD, DP divisions, sale numbering, commission tab generation
   │  ├─ commissionService.ts Commission schedule math, tabs, payment status flow
   │  ├─ dashboardService.ts  Loads and builds every Dashboard number
   │  ├─ genealogyService.ts  Hierarchy tree, chains, hierarchy rules, agent CRUD, team insights, promotion
   │  ├─ developerService.ts  Developers, office hours, promo posters
   │  ├─ ticketService.ts     IT support tickets: list, raise (+ private screenshots), review / resolve / reopen
   │  └─ lookupService.ts     Empty placeholder
   ├─ utils/                  Frontend-only helpers
   │  ├─ commissionAllocation.ts  Splits one payment between seller and uplines (allocatePayouts)
   │  ├─ ranks.ts                 Rank type, labels, default rates, rankOf(), allowedUplineRanks()
   │  ├─ paySchedule.ts           Month/quarter/year due-date math (month-end safe)
   │  ├─ conversion.ts            Currency and area conversion/formatting (global refs)
   │  ├─ useSettings.ts           Reactive user settings backed by localStorage
   │  ├─ liveRefresh.ts           useLiveRefresh(): realtime + focus + polling reloads
   │  ├─ sanitize.ts              Form input cleaning: cleanText, cleanMultilineText, normalizeEmail, isValidEmail/Phone, isIsoDate, digitsOnly
   │  ├─ password.ts              Initial password (<initials><random>, 14 chars) + password rules checklist
   │  └─ deviceInfo.ts            describeDevice(): browser, OS, window/screen size (attached to support tickets)
   ├─ views/                  Pages (one per route)
   │  ├─ LoginForm.vue        /                     Login + "Forgot or change password?"
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
   │  ├─ Support.vue          /support              IT support tickets: raise, track; admins review and resolve
   │  └─ DashboardPrevious.vue (unrouted legacy mock-up, keep only for reference)
   └─ components/
      ├─ Sidebar.vue          Desktop hover sidebar + phone bottom nav
      ├─ auth/ChangePasswordModal.vue     Email → one-time code → new password (Login page, Dashboard reminder)
      ├─ accounting/amortSched.vue        Amortization schedule modal + PDF export
      ├─ calculator/CalculatorPanel.vue   Loan / Sales / Property Tax calculator (reused in listing popup)
      ├─ commissions/PaymentRequestModal.vue, ReleasePaymentModal.vue, ProofModal.vue,
      │             ConfirmActionModal.vue (Yes/No or typed-phrase confirm popup)
      ├─ dashboard/DashboardStatCard.vue, SalesPerfromance.vue (sic), CommissionHistory.vue,
      │           GenealogyCard.vue, Reminders.vue, RecentActivity.vue (hidden),
      │           AddListing.vue & Calculator.vue (unused placeholders)
      ├─ developer/developerCard.vue, addDeveloper.vue
      ├─ genealogy/genealogymodal.vue (tree), AddAgentModal.vue (add/edit agent + login), PasswordReveal.vue
      │           (dots + eye / copy / regenerate), TeamInsights.vue
      ├─ listings/PropertyCard.vue, PropertyDetails.vue, ListingsFilter.vue, MapHolder.vue, MapInteractive.vue
      ├─ profile/ProfileCard.vue, ProfileEdit.vue
      ├─ sales/SalesUploadModal.vue       Sale create / confirm (Sold) / edit form
      ├─ settings/configDropdown.vue, configToggleSlider.vue
      ├─ support/RaiseTicketModal.vue     Guided ticket form + live checklist + screenshots
      │          TicketDetailsModal.vue   Ticket, progress, screenshots, admin review / resolve / reopen
      │          TicketStatusBadge.vue    Raised / In Review / Resolved pill
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

**Logins go through the server.** Creating or deleting a Supabase Auth user needs the service-role key, so `accountService` calls the `agent-account` Edge Function (`supabase.functions.invoke`), which checks the caller is an admin and then writes `auth.users`, `agents`, `genealogy` and `agent_credentials`. Reading login status or revealing an initial password calls a `SECURITY DEFINER` SQL function (`supabase.rpc('admin_get_agent_login', ...)`):

```
AddAgentModal ─► genealogyService.addAgent (hierarchy rules) ─► accountService ─► Edge Function agent-account ─► Auth admin API + agents + genealogy + agent_credentials
AddAgentModal (edit) ─► accountService.getAgentLogin ─► rpc admin_get_agent_login ─► agents + auth.users + agent_credentials (decrypts with the Vault key)
ChangePasswordModal ─► accountService ─► supabase.auth (resetPasswordForEmail → verifyOtp 'recovery' → updateUser) ─► trigger on auth.users updates agent_credentials
RaiseTicketModal ─► ticketService.createTicket ─► storage support_attachments (<uid>/<uuid>.<ext>) ─► insert support_tickets ─► trigger support_tickets_guard + RLS
TicketDetailsModal ─► ticketService.startReview/resolveTicket/reopenTicket ─► update support_tickets (RLS: admins only; trigger: flow + stamps)
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
| `/support` | Support | Support (lazy import) | required | yes |
| `/genealogy` | Genealogy | Genealogy-landingpage | required | yes |
| `/developerlist` | DeveloperList | developerlist | required | yes |
| `/accounting` | Accounting | Accounting | required | yes |
| `/profile` | Profile | Profile | required | yes |
| `/settings` | Settings | Settings | required | yes |

`router.beforeEach` calls `supabase.auth.getSession()` on every navigation. If the route needs auth and there is no session, it redirects to Landing. A signed-in user who opens Landing is redirected to **Listing** (`/listings`); a successful login itself pushes `/dashboard`.

### 5.3 Supabase query conventions

- **Mixed-case column names** (`agent_ID`, `listing_ID`, `sale_ID`, `dev_ID`, `property_type_ID`, `recipient_agent_ID`, ...) are used exactly as written in supabase-js: `.eq('agent_ID', id)`. In raw SQL they must be double-quoted.
- **Embeds** (PostgREST joins) are used heavily, for example `agents (first_name, last_name)`, `main_listings (listing_title, developers (name))`. A 1:1 sub-table embed can come back as an object *or* an array, so code normalizes with `Array.isArray(x) ? x[0] : x`.
- **Ambiguous embed:** `commissions` has two foreign keys to `agents` (`recipient_agent_ID`, `released_by`), so it must be embedded as `agents!recipient_agent_ID (...)`. `support_tickets` has three (`agent_ID`, `reviewed_by`, `resolved_by`) and names their constraints: `raiser:agents!support_tickets_agent_ID_fkey (...)`, `reviewer:agents!support_tickets_reviewed_by_fkey (...)`, `resolver:agents!support_tickets_resolved_by_fkey (...)`. **A column hint only works if no other key uses that name on either side.** PostgREST matches the hint against the foreign key column *and* the column it points to, so `agents!agent_ID` matches all three keys (each points at `agents."agent_ID"`) and fails with PGRST201 "more than one relationship was found". When in doubt, use the constraint name; the PGRST201 error lists them.
- **Numeric columns** are wrapped with `Number(...)` before doing math (existing pattern).
- **Silent RLS blocks:** `.update(...).select()` / `.delete().select()` and check `data.length` (see 1.3).
- **RPC functions** are called with `supabase.rpc('name', { p_arg: value })`; arguments are bound parameters. A missing function returns error code `PGRST202` (usually: the migration wasn't run).
- **Edge Functions** are called with `supabase.functions.invoke('name', { body })`; supabase-js adds the signed-in user's token. A non-2xx answer comes back as `FunctionsHttpError` whose `context` is the `Response`: read `await error.context.json()` for the function's `{ error }` message (see `functionErrorMessage` in `accountService.ts`).
- **Supabase calls outside services** (legacy): `Dashboard.vue` (`onMounted` agent lookup, also reads the login email), `LoginForm.vue` (sign in + configs), `router/index.ts` (session check).

### 5.4 Storage buckets

| Bucket | Path pattern | Written by | Saved to |
|---|---|---|---|
| `images` | `listings/{listingId}-{ts}-{i}.{ext}` | `listingsService.uploadPropertyImages` | `listing_images.image_url` (+ `display_order`) |
| `images` | `agents/{agentId}-{ts}.{ext}` | `agentService.uploadProfileImage` | `agents.profile_url` |
| `images` | `developers/{devId}-{ts}.{ext}` | `developerService.uploadImage` | `developers.profile_url` |
| `images` | `developer_promos/{devId}-{ts}.{ext}` | `developerService.uploadPromoImage` | `developer_promos.image_url` |
| `images` | `payment-proofs/{commissionId}-{ts}-{i}.{ext}` | `commissionService.releasePayment` | `commissions.proof_urls[]` |
| `fact_sheets` | `{listingId}-{ts}-{fileName}` (upsert) | `listingsService.uploadFactSheet` | `main_listings.fact_sheet` |
| `support_attachments` (**private**) | `{auth uid}/{uuid}.{png\|jpg\|webp\|gif}` | `ticketService.createTicket` | `support_tickets.attachment_paths[]` (paths, not URLs) |

The `images` and `fact_sheets` files are served through **public URLs** (`getPublicUrl`). Deletes recover the storage path by splitting the URL on `/object/public/images/` (or `/images/` for profile pictures).

**`support_attachments` is private** (created by `20261104160000_support_tickets.sql`, 5 MB limit, PNG/JPEG/WEBP/GIF only). Storage policies: upload only into your own `{auth uid}/` folder; read your own files, admins read all; delete only your own files that no ticket uses (cleanup after a failed save). The app shows them with `createSignedUrls` (valid 1 hour), never with public URLs.

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
| `Support.vue` | support_tickets |

The realtime publication (migration section 5d) covers `sales`, `commissions`, `main_listings`, `genealogy`, `agents`, plus `support_tickets` (support tickets migration, section 6; realtime applies its RLS, so a non-admin only hears about their own tickets). `positions` is not in it, so polling covers that one.

### 5.7 Markdown

Listing `description` and `faq` are written in Markdown. They are rendered with `compileMarkdown(raw)` (`marked.parse` → `DOMPurify.sanitize`) and shown with `v-html` inside the `markdownTypography` utility (Tailwind `prose` + `dark:prose-invert`).

### 5.8 UI and theme conventions

- Page header: a gradient bar `bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black` with an uppercase title (Listings, Sales Report, Developers, Accounting, Profile).
- Modals: a fixed overlay `bg-[rgba(10,61,98,0.7)] backdrop-blur-sm`. The commission and agent modals use `<Teleport to="body">`.
- Confirmations: for an action that can't be undone, use `components/commissions/ConfirmActionModal.vue` (same look as the other modals, `z-60` so it can open on top of one). It moves keyboard focus into itself, keeps Tab inside, closes on Escape or a click outside, and can require a typed phrase (`requiredPhrase`). New code should use it instead of `confirm()`.
- Feedback: small toasts (`Transition name="toast"`), `alert()` and `confirm()` in older code. Success toasts are top-right on Listings and Sales Report; the Commissions page toast is **bottom-right** (`bottom-20 md:bottom-6`, so it clears the phone bottom nav).
- Responsive: Sidebar is `hidden md:flex`; phones get a bottom nav (`App.vue` adds `pb-16`). Grids and tables are built mobile-first.
- `Commission.vue` and its three original modals (`PaymentRequestModal`, `ReleasePaymentModal`, `ProofModal`) have **no dark-mode classes** yet. `ConfirmActionModal.vue`, the Commissions toast, `AddAgentModal.vue` (since 2026-11-04), `PasswordReveal.vue` and `ChangePasswordModal.vue` do. `SharedListing.vue` has had them since 2026-11-03 (copied from `PropertyDetails.vue`).
- **Important fields** (a login email, a password): an amber box (`border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700`) titled with a `TriangleAlert` icon, a red `CircleAlert` icon before each label, and a 2px amber border on the input. See the "Login account · Important" section of `AddAgentModal.vue`.
- **Secrets on screen**: show dots until an eye button is pressed (`PasswordReveal.vue`); fetch the secret only when it is revealed.
- **Critical reminder**: solid red (`bg-red-600 text-white`, `ShieldAlert` icon, "Important · Account security" label, call to action) for account-security items; normal urgent reminders stay light red. See `Reminders.vue`.
- **Cards and tables** (Sales Report, IT Support): `bg-white dark:bg-black rounded-xl border border-[#A9D6FF]/40 dark:border-[#A9D6FF]/20 shadow-[0_4px_6px_rgba(0,0,0,0.05)]`; table head `bg-maurealty-blue dark:bg-[#072339] text-white`; status filter pills like the Commissions page (`bg-maurealty-blue text-white` active, `bg-background-gray text-sidebar-hover` otherwise).
- **Status pills**: `px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border` + a colour pair (blue = waiting, yellow = in progress, green = done, red = cancelled). `support/TicketStatusBadge.vue` and `SalesReport.getStatusClass` use it.
- **Guided forms** (`support/RaiseTicketModal.vue`): numbered sections, a live checklist beside the form that unlocks the submit button (like the password checklist in `ChangePasswordModal`), and a `ConfirmActionModal` "Discard?" before closing a form with typed content.
- The IT Support page and its modals have full dark-mode classes.

---

## 6. Roles and permissions

"Agent" means a signed-in user with `admin_access = false`. **Most rules below are enforced only in the frontend.** All tables use an open RLS policy (`using (true) with check (true)` for `anon` and `authenticated`), except `agent_credentials` (no policies at all) and `support_tickets` (real per-user policies). The rules marked **server** are also checked by the `agent-account` Edge Function, a SQL function, or RLS / a trigger.

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
| See commission tabs | own (as recipient) | all, with a "My Commissions" / "All Agents (Approval)" / "Other Agents" switch; own tabs carry a "You" badge in All Agents | `Commission.loadCommissions`, `scopedList`, `showOwnBadge` |
| Approve commission | ✗ | ✓ (any tab, including their own), after Yes in a confirmation popup | `Commission.askApprove` → `handleApprove` + status guard in `approveTab` |
| Request payment | own tab, approved, due, earlier payments received | **own tabs only**, same rules (since 2026-11-03) | `canAgentAct` (= `isOwnTab`) + `canRequest` + `commissionService.requestPayment` order check |
| Release payment | ✗ | ✓ (any tab, including their own) | `Commission.vue` button |
| Confirm received | own tab, `payment_released`, after typing "I have received payment" | **own tabs only**, same typed check (since 2026-11-03) | `canAgentAct` + `ProofModal.askReceived` |
| Dashboard scope | own data | "My Stats" / "All Agents" (default All) | `Dashboard.vue` |
| Personal payout alerts and reminders | ✓ | ✗ (admins can act on their own tabs from the Commissions page, but the Dashboard gives them approval alerts only) | `dashboardService.buildDashboard` |
| Add agent (creates the login + initial password) | ✗ (button hidden on Genealogy and Dashboard) | ✓ | `Genealogy-landingpage.vue` / `Dashboard.vue` (`isAdmin`) + **server**: `agent-account` Edge Function |
| Edit / delete agents | ✗ (buttons hidden) | ✓; can't delete **their own** record | `Genealogy-landingpage.vue` (`isAdmin`, `currentAgentId`) |
| Create a login for an agent without one | ✗ | ✓ (Edit Agent) | **server**: `agent-account` (`create-login`) |
| Reveal an agent's initial password (eye icon) | ✗ | ✓ any agent, admins included, until that agent changes it | **server**: `admin_get_agent_login` (`current_agent_is_admin()`) |
| Remove a deleted agent's login | ✗ | ✓ (automatic on delete); never their own, never a login an agent still uses | **server**: `agent-account` (`delete-login`) |
| Change own password (email code) | ✓ | ✓ | Supabase Auth (the code proves the email) |
| "Initial password" reminder | ✓ | ✓ | `dashboardService.buildDashboard` (`needsPasswordChange`) |
| Promote, edit thresholds | ✗ intended, but ⚠ currently visible to everyone | ✓ | **no gating yet** (admin-only confirmed by the team, 2026-10-28) |
| Add / edit / delete developers and promos | ✗ intended, but ⚠ currently visible to everyone | ✓ | **no gating yet** (admin-only confirmed by the team, 2026-10-28) |
| Raise an IT support ticket | ✓ as themselves, max **3 open** (Raised + In Review) | ✓ same limit for their own tickets | `Support.canRaise`, `RaiseTicketModal` + **server**: RLS insert policy, `support_tickets_guard` (raiser forced, limit, status) |
| See tickets | own only | all (own ones carry a "You" pill) + "Your Tickets" list | `Support.load` → `ticketService.getTickets` + **server**: RLS select policy |
| Start review / Resolve (note required) / Reopen | ✗ (no buttons) | ✓ any ticket, including their own | `Support.vue` / `TicketDetailsModal` (`isAdmin`) + **server**: RLS update policy (admins), trigger (flow, stamps, note) |
| Edit or delete a ticket after raising it | ✗ | ✗ (only the status changes) | **server**: trigger locks the details; no delete grant or policy |
| Open ticket screenshots | own tickets | all | **server**: storage policies on `support_attachments` + signed URLs |
| Profile, Settings | own | own | — |

---

## 7. Features

### 7.1 Authentication and login
- **Route / entry point:** `/` (`LoginForm.vue`); logout from the Sidebar.
- **Who:** everyone with an account. Accounts are Supabase Auth users linked to an `agents` row through `agents.user_id`. Since 2026-11-04 an admin creates them from Add Agent (7.19); nobody links a UID by hand anymore.
- **When it is used:** starting a session.
- **Flow:**
  1. The email is cleaned (`normalizeEmail` + `isValidEmail`); the password is sent exactly as typed. `supabase.auth.signInWithPassword({ email, password })`.
  2. Read `agents.configs` for that `user_id`, merge it over `defaultSettings.configs`, and save the result to `localStorage['app_user_settings']`.
  3. `router.push('/dashboard')`.
  4. Logout: `authService.logoutUser()` → `supabase.auth.signOut()` → `router.push('/')`.
  5. **"Forgot or change password?"** (next to Remember Email) opens `ChangePasswordModal` with `signOutWhenDone` (7.20). When done, the email is filled in and a green "Password changed. Sign in with your new password." shows.
- **Data:** R `agents.configs`.
- **Code:** `src/views/LoginForm.vue`, `src/router/index.ts` (guard), `authService.logoutUser()`, `src/components/Sidebar.vue` (`handleLogout`), `components/auth/ChangePasswordModal.vue`.
- **Rules and edge cases:** "Remember Email" and "Data Privacy Act" are UI only. There is no public sign-up (turn it off in Supabase too, 3.3 step 6).

### 7.2 App shell and navigation
- **Route / entry point:** every page except `/` and `/shared/listing/:token` (`meta.hideSidebar`).
- **Flow:** `App.vue` renders `Sidebar` + `RouterView`. The Sidebar loads the agent profile and shows the logo, the profile picture (links to `/profile`), the name, an admin badge (`MauBadgeLight.svg`) and the position from `positionMap`. Links come from `topItems`: Dashboard, Project Listing, Accounting, Sales Report, Developer List, Property Management, Genealogy, Commissions, IT Support (`LifeBuoy` icon); Settings and Logout sit at the bottom. On desktop the bar expands on hover; on phones it becomes a scrollable bottom bar.
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
  - **Reminders:** clickable, collapsible after 3. **Initial password reminder** (since 2026-11-04): while the signed-in user (agent or admin) still uses the initial password an admin gave them (`accountService.needsPasswordChange()` → `current_agent_needs_password_change()`), a **solid red** reminder sits first ("Important · Account security", "Change password →") and the count badge turns red. Clicking it opens `ChangePasswordModal` locked to the user's login email (`lockEmail`); after the change the Dashboard reloads and the reminder is gone.
  - **Recent Activity:** hidden (commented out in the template and import). `activities` is still computed.
- **Header buttons:** "+ Add Listing" → `/propertymanagement` (⚠ without `?edit=0`, see 11.1). **"+ Add Agent" is admins only** and opens the Genealogy page's `AddAgentModal` (same login creation, 7.19); saving refreshes the Genealogy card. (The old placeholder `components/dashboard/AddAgent.vue` was deleted on 2026-11-04.)
- **Data:** R `sales`, `main_listings`, `commissions` (+ joins), `genealogy`, `agents`, `positions`; RPC `current_agent_needs_password_change`.
- **Code:** `src/views/Dashboard.vue` (`openAddAgent`, `onAgentSaved`, `openReminder`, `onPasswordChanged`, `loginEmail`), `src/services/dashboardService.ts` (`getDashboardData`, `buildDashboard` with `needsPasswordChange`), `components/dashboard/*`, `components/genealogy/AddAgentModal.vue`, `components/auth/ChangePasswordModal.vue`, `genealogyService.getUplineChain(id, 20)`, `genealogyService.getDownline(id, 20)`.

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
  5. It follows the `PropertyDetails` overlay: bulk listings show the **min – max price range** (`is_bulk && max_price`), type features are shown for **single listings only**, photos are ordered by `listing_images.display_order`, and the `dark:` classes are the overlay's.
- **Data:** W/R `shared_listings` (uuid `share_id` is the token).
- **Code:** `src/services/shareService.ts`, `PropertyDetails.handleShare`, `src/views/SharedListing.vue`.
- **Rules and edge cases:** the `agent_ID` saved on the link is the **listing owner's** id (`details.agent_ID`), not the id of the agent who shared it. Dark mode follows the viewer's saved settings (`App.vue`), so a client normally sees the light page. If you change how the overlay shows a listing, change `SharedListing.vue` the same way.

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
    - **DP Divisions** (DP only): tabs with "+ Add division". Each division has a Rate %, "Payable in" count + unit (months, quarters or years), Due Date Start, and Due Date End. The dates are filled automatically: Division 1 starts one month after the reservation date; each later division starts one step (month, quarter or year, following the **previous** division's unit) after the previous end date; the end date is `lastDueDate(start, unit, count)`. All of them can be edited, but the end date can't be before the last payment, and editing a division shifts the ones after it (`startFollowing`). A live status shows "x% of y% allocated".
    - Spot-Cash and Deferred-Cash show an info box instead (no divisions, no financing).
  - **Commissionable Amount:** starts equal to the contract price until the user types a value; it can differ because of taxes and policies.
  - **Commission Rate %:** prefilled from `main_listings.commission`; **5%** when the listing has none. Editable per sale.
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
- **Who:** agents see the tabs where they are the recipient (as seller or upline). Admins get a three-way switch (`scope`): **All Agents (Approval)** (every tab, the default), **My Commissions** (only their own), **Other Agents** (every tab except their own).
- **When it is used:** tracking receivables and moving each payout through the payment process.
- **Layout:**
  1. **Receivables header:** received of total, number of payouts received, "yet to collect", and a progress bar. In the admin All Agents and Other Agents views, the label names the view and a per-agent received/total list is shown.
  2. **Filter by sale:** collected, yet to collect, sale total.
  3. **Status filter tabs with counts:** All, Awaiting Approval, Approved, Payment Requested, Payment Released, Received.
  4. **Cards** in one shared grid: Payment `n/N`, project/developer, agent, role (+ rank), amount (+ "Remaining balance"), due date with a badge (Due Date Reached, Pending Date or Sale Complete), status, and a hint ("Receive payment k first" or "Request opens on the due date").
     - **"You" badge:** in the admin All Agents view, a blue `YOU` pill sits right of the agent name on the admin's own tabs (`showOwnBadge`). It is not shown in My Commissions (all theirs) or Other Agents (none).
  5. Sort order: not received first, then due date, then developer name.
- **Actions** (state machine in 8.3). "Recipient" = the signed-in person is `recipient_agent_ID` (`canAgentAct`), a non-admin or an admin on their own tab:

  | Status | Admin sees (someone else's tab) | Recipient sees (own tab, admin or not) |
  |---|---|---|
  | `pending_approval` | **Approve commission** → confirmation popup "Are you sure you want to approve this commission?" (No / Yes, with a summary) → `approveTab` → toast "Commission approved." (bottom right) | (waiting); an admin on their own tab sees Approve too |
  | `approved` | "Waiting for the agent to request payment" | **Request payment**: enabled when due (due date reached or sale complete) and every earlier payment of the same sale for the same person is received. Opens `PaymentRequestModal`. |
  | `payment_requested` | **Release payment** → `ReleasePaymentModal` | "Request sent..." (an admin on their own tab sees Release payment instead) |
  | `payment_released` | View proof of payment | **View proof / Confirm** → `ProofModal` → **Received payment** → typed confirmation popup |
  | `received` | ✓ Received + date, View proof | same |

- **Modals:**
  - `PaymentRequestModal`: prefilled with the first/middle/last name (from the account) and the sale details. **Edit details** unlocks the names, client, project, developer and reservation date; **Reset** restores them. The contract price, role/rank, payment number, due date and amount stay locked. Submits `PaymentRequestDetails` into `commissions.request_details`.
  - `ReleasePaymentModal`: shows the request. The admin must attach at least one image (file picker or **Ctrl+V paste**). Uploads go to `images/payment-proofs/`.
  - `ProofModal`: an image gallery; the recipient can confirm receipt, which cannot be undone. **Received payment** opens a `ConfirmActionModal` that requires typing **"I have received payment"** (letter case and extra spaces ignored) before **Confirm** is enabled; only then does `confirmReceived` run.
  - `ConfirmActionModal`: the shared confirm popup (see 5.8). Used for Approve (`Commission.vue`) and Received payment (`ProofModal`). Save errors show inside it.
- **Data:** R/W `commissions` (+ `agents!recipient_agent_ID`, `sales`, `main_listings`, `developers`); storage `images/payment-proofs/`.
- **Code:** `src/views/Commission.vue` (`scope`, `scopedList`, `showOwnBadge`, `canAgentAct`, `askApprove`, `handleApprove`, `showToast`), `components/commissions/*`, `commissionService.getTabs/approveTab/requestPayment/releasePayment/confirmReceived/summarizeTabs/STATUS_LABEL`.
- **Rules and edge cases:** admins can request and receive payment **on their own tabs only** (since 2026-11-03; before that these steps were agent-only and an admin's own tab stopped at Approved). The Dashboard still gives admins no personal payout alerts. Request and release toasts are not implemented; those steps still confirm with `alert()`.

### 7.13 Genealogy (team tree and agent management)
- **Route / entry point:** `/genealogy`.
- **Who:** everyone can view. **Add, Edit and Delete agent are admin-only** (since 2026-11-04: buttons hidden for agents, handlers check `isAdmin`; logins and passwords are also checked on the server). Promote and thresholds are meant to be admin-only too but are not gated yet (11.3).
- **When it is used:** seeing who is in whose team, adding or onboarding an agent (which now also creates their login), changing someone's upline or position, removing an agent.
- **Page sections:**
  1. Header: search (filters the Teams, Recently Added and Manage Agents lists) and **Add Agent** (admins). The static profile picture that sat beside it was removed on 2026-11-04.
  2. Stats (`getStats`):
     - Total Agents.
     - Team Leaders: agents with at least one downline.
     - Active Teams: root agents, meaning agents with no upline.
     - New This Month: `hire_date` in the current month.
  3. **Teams:** one entry per root agent with its subtree size.
  4. **Recently Added:** 5 agents, newest `hire_date` first.
  5. **Manage Agents** (Edit / Delete buttons for admins only): Edit opens `AddAgentModal` in edit mode. Delete (hidden on the admin's own row) calls `deleteAgent`, which is **blocked** if the agent has sales, listings or share links; otherwise their direct downlines move up to the deleted agent's upline (or become roots), the edges are removed, the agent row is deleted (`.select()` check), and **their login is removed** (`accountService.deleteLogin` → Edge Function).
  6. **Roles, Overrides and Promotion** (`TeamInsights`, 7.14).
  7. **Tree** (`genealogymodal.vue`): Vue Flow with a top-to-bottom dagre layout. Each node shows the name, position, commission rate %, accumulated sales and "% to next" rank. It redraws on sales changes and is remounted (`reloadKey`) after edits.
- **`AddAgentModal`** (also opened from the Dashboard; has dark mode):
  - **Login account · Important** box at the top (amber, red `CircleAlert` icons): the **email** (the login) and, in add mode, the generated **initial password** (`PasswordReveal`: dots, eye, copy, regenerate). See 7.19.
  - Fields: first/middle/last name, sex (Male, Female, Non-Binary, Other, same as ProfileEdit), birth and hire dates, contact, position (from `positionMap`), home address, upline, and "Grant admin access".
  - Every value is cleaned and validated before saving (`cleanForm`: `cleanText`, `normalizeEmail`, `isValidEmail`, `isValidPhone`, `isIsoDate`, birth date not in the future).
  - The upline list is filtered by `allowedUplineRanks(selected rank)`; it is disabled for Partner Brokers.
  - Add: `genealogyService.addAgent(payload, uplineId, initialPassword)`. The hierarchy rules are checked first; the Edge Function then creates the login, the agent row (`user_id` linked), the edge and the stored password. `configs` gets the defaults; `age` is derived again on the server. The modal then shows **"Login Created"** with the email and password (+ "Copy login details").
  - Edit: `updateAgentAndUpline(id, patch, uplineId)`. If a promotion makes the current upline invalid, the agent is **detached** and an alert explains it. The login box shows the login status (7.19) and can create a login for an agent without one.
- **Hierarchy rules:** see 8.5.
- **Data:** R/W `agents`, `genealogy`; R `positions`, `sales`, `main_listings`, `shared_listings` (delete checks); through the Edge Function / RPC: `auth.users`, `agent_credentials`.
- **Code:** `src/views/Genealogy-landingpage.vue` (`isAdmin`, `currentAgentId`, `loadCurrentAgent`), `components/genealogy/{genealogymodal,AddAgentModal,PasswordReveal,TeamInsights}.vue`, `src/services/genealogyService.ts`, `src/services/accountService.ts`, `src/utils/ranks.ts`.

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
- **Rules:** position, hire date and admin access can't be edited here; they are edited from Genealogy → Manage Agents. Changing the email here doesn't change the Supabase Auth login email (11.3). Passwords are changed from the Login page or the Dashboard reminder (7.20), not here.
- **Code:** `src/views/Profile.vue`, `components/profile/{ProfileCard,ProfileEdit}.vue`, `agentService.*`.

### 7.18 Settings
- **Route / entry point:** `/settings` (Sidebar, bottom).
- **Options:** Default Currency (PHP, USD, CAD, CNY, JPY), Default Unit (Metric = sqm, English = sqft), Disable Animations, Enable Dark Mode.
- **Flow:** every change calls `updateSetting()` (localStorage) and takes effect immediately for the theme and animations. **SAVE SETTINGS** writes the configs to `agents.configs` (`agentService.updateConfigs`). CANCEL goes back in history but does not undo changes already applied.
- **Code:** `src/views/Settings.vue`, `components/settings/{configDropdown,configToggleSlider}.vue`, `src/utils/useSettings.ts`, `App.vue`.
- **Rules and edge cases:** see 11.6 (the default currency only applies after a reload; Save shows no feedback).

### 7.19 Agent accounts (logins and initial passwords)
- **Route / entry point:** Genealogy → **Add Agent** / **Edit** (Manage Agents); Dashboard → **+ Add Agent**. All open `AddAgentModal`.
- **Who:** admins only (UI gating + server checks in the Edge Function and SQL functions).
- **When it is used:** onboarding a new agent (they get a working login immediately), giving an older agent a login, or looking up the initial password for an agent who hasn't changed it yet.
- **Flow (add):**
  1. The modal builds the **initial password** with `src/utils/password.ts`: the agent's initials (first letter of first, middle and last name, accents dropped) followed by random characters, **14 characters in total** (e.g. `JSDk7#Pm2xQ9vR`). Secure random (`crypto.getRandomValues`), no look-alike characters, always an upper-case letter, lower-case letter, digit and symbol. The random part stays while the name is typed; "regenerate" makes a new one.
  2. Email and password sit in the amber **Login account · Important** box. The password is dots until the eye is pressed; copy and regenerate buttons sit beside it.
  3. Save → `cleanForm()` → `genealogyService.addAgent(payload, uplineId, password)` → `checkPlacement` (hierarchy rules) → `accountService.createAgentWithLogin` → Edge Function `agent-account` (`create`): validates and whitelists the fields, `auth.admin.createUser({ email, password, email_confirm: true })`, inserts `agents` with `user_id`, inserts the `genealogy` edge, `store_agent_initial_password(...)` (pgcrypto + Vault key). Any failure undoes the earlier steps (edge, agent, auth user).
  4. The modal switches to **Login Created** (email + password, "Copy login details"). Closing it reloads the page that opened it.
- **Flow (edit), login box states** (`accountService.getAgentLogin(id)` → `admin_get_agent_login(id, false)`):
  - **Initial password not changed:** dots + eye. Pressing the eye calls `admin_get_agent_login(id, true)` and shows the password (copy button). Works for any agent, admins included.
  - **Changed by the agent:** "Changed by the agent on <date>"; the stored copy was deleted, nothing to reveal.
  - **Login linked by hand** before this feature (no `agent_credentials` row): "can't be shown"; the agent can use "Forgot or change password?".
  - **No login:** "Create a login with this email when I save" → after the fields are saved, `accountService.createLoginForAgent(id, password)` → Edge Function `create-login` (uses the saved `agents.email_address`, links `user_id` only if still null). Then the Login Created screen.
  - If the email field no longer matches the login email, a note says the login email does not change (11.3).
- **Flow (delete):** `genealogyService.deleteAgent` → after the agent row is gone, `accountService.deleteLogin(user_id)` → Edge Function `delete-login` (refuses the caller's own login and any login an agent still uses). `agent_credentials` goes with the agent (cascade).
- **Data:** W `auth.users` (Edge Function), `agents`, `genealogy`, `agent_credentials`; R the same through `admin_get_agent_login`. Vault secret `agent_password_key`.
- **Code:** `components/genealogy/AddAgentModal.vue` (`initialPassword`, `regeneratePassword`, `cleanForm`, `loadLogin`, `revealPassword`, `createLogin`, `created`), `components/genealogy/PasswordReveal.vue`, `accountService.*`, `genealogyService.addAgent/deleteAgent`, `src/utils/password.ts`, `src/utils/sanitize.ts`, `supabase/functions/agent-account/index.ts`, `supabase/migrations/20261104120000_agent_accounts.sql`.
- **Rules and edge cases:** only the **initial** password can ever be revealed (decided with the team on 2026-11-04); passwords agents choose are never readable. Logins are created with `email_confirm: true`, so no confirmation email is sent and the agent can sign in at once. The admin hands the credentials over themselves; the app sends no welcome email.

### 7.20 Change password (email one-time code)
- **Route / entry point:** Login page → **Forgot or change password?**; Dashboard → red **initial password** reminder.
- **Who:** anyone with a login (signed out on the Login page, signed in from the Dashboard).
- **When it is used:** a new agent replacing the initial password, or anyone who forgot theirs.
- **Flow (`components/auth/ChangePasswordModal.vue`):**
  1. **Email:** cleaned and validated → `accountService.sendPasswordCode(email)` → `supabase.auth.resetPasswordForEmail(email)`. Supabase answers the same way whether or not the email has a login (no account discovery). From the Dashboard the email is locked to the user's own login email.
  2. **Code:** digits only (`digitsOnly`, 6–10 digits) → `verifyPasswordCode` → `supabase.auth.verifyOtp({ email, token, type: 'recovery' })`, which starts a session for that user. "Resend code" waits 60 seconds.
  3. **New password:** new + confirm (eye toggles) with a live checklist from `passwordRules` (8–72 characters, upper case, lower case, number, no spaces, both match) → `changePassword` → `supabase.auth.updateUser({ password })`. The password fields are cleared afterwards.
  4. The `on_agent_password_changed` trigger on `auth.users` sets `agent_credentials.password_changed_at` and deletes the stored initial password, so the reminder ends and admins can no longer reveal it.
  5. Login page (`signOutWhenDone`): the code's session is ended when the flow finishes **or** the modal is closed halfway; the user then signs in with the new password. Dashboard: the user stays signed in and the Dashboard reloads.
- **Data:** Supabase Auth only (+ the trigger's update of `agent_credentials`).
- **Code:** `components/auth/ChangePasswordModal.vue`, `accountService.sendPasswordCode/verifyPasswordCode/changePassword`, `src/views/LoginForm.vue`, `src/views/Dashboard.vue`.
- **Rules and edge cases:** needs the **Reset password** email template to contain `{{ .Token }}` and a working SMTP sender (3.3 steps 3–5). Supabase error codes are reworded in `authErrorMessage` (rate limit, expired code, same password, weak password). The project's own Auth password rules (if any are set in Supabase) apply on top of the checklist.

### 7.21 IT support tickets
- **Route / entry point:** `/support` (Sidebar and phone bottom bar → **IT Support**).
- **Who:** everyone raises tickets and sees **their own**; admins act as IT support, see **every** ticket and change statuses. Enforced in the UI **and** on the server (RLS + trigger + storage policies, 9.7).
- **When it is used:** reporting something broken, slow, wrong or confusing in the portal, or sending a feature request or feedback, in a form detailed enough for IT to recreate the problem.
- **Page layout (`Support.vue`):**
  1. Header (gradient bar, "IT SUPPORT") with **Raise a Ticket**.
  2. Left: **Raise a Ticket** card (open-ticket meter "n of 3 used", amber when full; "A good ticket has" tips; button). Below it, admins get **Your Tickets** (their 5 newest) and agents get **How tickets move** (status guide).
  3. Right: **All Tickets (Admin)** / **My Tickets** table: ID (`#T-<id>`, a button), Ticket (title, category · page, paperclip + screenshot count), Raised By (admins, "You" pill on their own), Submitted ("5 minutes ago", full date on hover), Status pill, Actions. Status filter pills with counts (All / Raised / In Review / Resolved) and a search box (number, title, category, page, raiser; in the browser only). Open tickets first (newest first), then resolved ones (latest resolved first). 10 per page.
  4. Table actions: admins get the next step (**Review** on Raised starts the review and opens the ticket; **Resolve** on In Review opens it with the cursor in the note; **Reopen** on Resolved opens it with the reopen confirmation); agents get **View**. Clicking a row opens the ticket.
  5. Bottom-right toast (green, or red for errors). `useLiveRefresh(['support_tickets'])`.
- **Raise a Ticket form (`RaiseTicketModal.vue`):** built to make tickets specific and reproducible.
  1. **What is it about?** Category (Problems: *Something isn't working*, *Login or account*, *Slow or not loading*, *Wrong or missing data*; Requests: *Feature request*, *Feedback*, *Other*) with a hint, the page/feature (`TICKET_AREAS`), and a one-line title (8–120 characters, example placeholder per category).
  2. **Problems** (`isIssue`): **steps to recreate it** (at least 2; the box starts with "1. " and Enter adds the next number, Enter on an empty number ends the list), **what you expected**, **what happened instead** (20+ characters), **how often** (Every time / Sometimes / Only once) and optionally **when it happened** (not in the future). **Requests:** one detailed answer (20+ characters).
  3. **Screenshots** (optional, up to 3, 5 MB each, PNG/JPG/WEBP/GIF): file picker, drag and drop, or Ctrl+V paste; previews with remove. The browser, OS, window/screen size and dark mode are added automatically (`describeDevice()`, shown to the user).
  4. A **live checklist** beside the form ("4 of 7 done", progress bar, optional "makes it faster" items); **Raise Ticket** stays disabled until every required item is done and `ticketProblems()` is empty. Closing with typed content asks "Discard this ticket?" (`ConfirmActionModal`).
  5. Save: `ticketService.createTicket(agentId, draft, files)` cleans and checks everything again, uploads the screenshots to `support_attachments/<uid>/<uuid>.<ext>`, inserts the row, and removes the uploads if the insert fails.
- **Ticket popup (`TicketDetailsModal.vue`):** number, status pill, "Reopened ×n"; a Raised → In Review → Resolved strip with who and when; facts (raised by, category, page, how often, when, device); the user's text as plain text (`whitespace-pre-line`); screenshots through signed links (1 hour); the resolution note (green when resolved, grey "Last resolution" while a reopened ticket is back in review). Admins: **Start review** (Raised); a **required resolution note** (10–2000 characters) + **Resolve ticket** with a confirmation (In Review); **Reopen** with a confirmation (Resolved). Agents see a short "what happens next" note.
- **Data:** R/W `support_tickets` (+ `agents` embeds); storage `support_attachments` (private).
- **Code:** `src/views/Support.vue`, `components/support/{RaiseTicketModal,TicketDetailsModal,TicketStatusBadge}.vue`, `ticketService.getTickets/createTicket/startReview/resolveTicket/reopenTicket/getAttachmentUrls`, `cleanTicket`, `ticketProblems`, `src/assets/classes/ticket.ts`, `utils/sanitize.ts` (`cleanMultilineText`), `utils/deviceInfo.ts`, `supabase/migrations/20261104160000_support_tickets.sql`.
- **Rules and edge cases:** status flow and stamps in 8.8. A ticket's text, category, page and screenshots can't be edited or deleted after it is raised (by anyone, admins included); only the status moves. Admins can review and resolve their own tickets. Reopening can leave a user with more than 3 open tickets (the limit only blocks raising new ones). A ticket raised by an agent who is later deleted stays, with "Removed agent" as the raiser. No email or Dashboard notifications yet (11.9).

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
pending_approval ──admin approveTab──► approved ──recipient requestPayment──► payment_requested
      ──admin releasePayment (≥1 proof image)──► payment_released ──recipient confirmReceived──► received
```

The recipient is whoever the tab pays (`recipient_agent_ID`): a non-admin agent, or an admin on their own tab.

| Step | Sets | Guard |
|---|---|---|
| `approveTab` | `admin_approved=true`, `approved_at` | only from `pending_approval`; UI asks for Yes in a confirmation popup first |
| `requestPayment` | `requested_at`, `request_details` | from `approved`; every earlier `payment_no` of the same sale for the same recipient is `received`; UI also requires due (`due_date <= today` or sale `complete`) |
| `releasePayment` | `released_at`, `released_by`, `proof_urls` | from `payment_requested`; at least one file |
| `confirmReceived` | `claimed=true`, `claimed_at` | from `payment_released`; UI requires typing "I have received payment" first |

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

**2. Raw company commission per slot:** `raw = (slotPct / 100) × grossCommission`. Across all slots the total raw equals the gross commission. No extra percentage is applied on top of it.
> **Changed 2026-11-03 (requested by the project owner).** The engine used to multiply the gross commission by another 5%, which applied the rate twice. The gross commission (Commissionable Amount × Commission Rate) is now the pool. Tabs generated before this date keep their old amounts.

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

**Worked example (Spot-Cash):** contract price ₱5,000,000; commissionable amount ₱5,000,000; rate 5% → gross ₱250,000 → raw = 1.00 × 250,000 = **₱250,000**. The seller is a Specialist (3%) with a Supervisor, then an IM, then a Broker above them:

| Recipient | Role | Amount |
|---|---|---|
| Seller (Specialist) | Agent | 250,000 × 0.75 × 0.6 = ₱112,500.00 |
| Supervisor | Upline 1 | 250,000 × 0.75 × 0.10 = ₱18,750.00 |
| Investment Manager | Upline 2 | ₱18,750.00 (would be ₱37,500.00 if the IM were the direct upline) |
| Partner Broker | Upline 3 | ₱18,750.00 |

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
| Reminders | Everyone: **initial password still in use** (critical, first; `needsPasswordChange`). Admin: sales pending approval, commissions awaiting approval. Agent: tabs ready to request, approved tabs due within 7 days. |
| Alerts | Agent: payment released (check proof and confirm), commissions approved. Admin: payment requests to release, commissions waiting for approval. |

### 8.7 Accounts and passwords

| Rule | Value | Where |
|---|---|---|
| Who creates logins | Admins only, from Add Agent / Edit Agent | `agent-account` Edge Function (`requireAdmin`) |
| Login email | `agents.email_address`, trimmed and lower-cased; must be unique in Supabase Auth | `normalizeEmail`, Edge Function `cleanEmail` |
| Initial password | `<initials><random>`, **14 characters in total**. Initials = first letter of first, middle and last name (max 3). Random part from `crypto.getRandomValues`, alphabet without `0 O 1 l I`, always an upper-case letter, a lower-case letter, a digit and a symbol (`!@#$%&*?`) | `src/utils/password.ts` (`INITIAL_PASSWORD_LENGTH`, `agentInitials`, `generatePasswordTail`, `buildInitialPassword`) |
| Server check of any initial password | 8–72 characters, no spaces | Edge Function `cleanPassword`, SQL `store_agent_initial_password` |
| Password an agent chooses | 8–72 characters, upper case, lower case, number, no spaces (+ any rules set in Supabase Auth) | `passwordRules`, `isStrongPassword` |
| Who can reveal a password | Admins; **initial password only**, and only until the agent changes it | `admin_get_agent_login` |
| "Changed" | Any update of `auth.users.encrypted_password` (the app's modal or a reset in the Supabase dashboard) | trigger `on_agent_password_changed` |
| Reminder | Shown while `agent_credentials.password_changed_at is null` for the signed-in user | `current_agent_needs_password_change()` |
| Deleting an agent | Deletes their login too; an admin can't delete their own record or login | `genealogyService.deleteAgent`, Edge Function `delete-login`, Genealogy page |

### 8.8 IT support ticket status (`support_tickets.status`, text with a check constraint)

```
raised ──admin startReview──► in_review ──admin resolveTicket (note ≥ 10 chars)──► resolved
                                  ▲                                                  │
                                  └──────────────── admin reopenTicket ──────────────┘
```

| Step | The server sets (trigger `support_tickets_guard`) | Guard |
|---|---|---|
| raise (insert) | `agent_ID` = the signed-in agent, `status = 'raised'`, every stamp empty, `created_at` | RLS insert as yourself; **max 3 open** (not `resolved`) tickets per agent, with an advisory lock; screenshot paths must be `<own auth uid>/<uuid>.<png\|jpg\|webp\|gif>`; check constraints (below) |
| `startReview` | `reviewed_by` = the admin, `reviewed_at` | only from `raised`; RLS update = admins only |
| `resolveTicket` | `resolved_by`, `resolved_at`, keeps the note | only from `in_review`; note required (trigger + check constraint) |
| `reopenTicket` | `reopen_count + 1`, `reopened_at`, `reviewed_by`/`reviewed_at` = this admin, clears `resolved_by`/`resolved_at`; **keeps the last note** | only from `resolved` |
| anything else | — | raised → resolved, resolved → raised, editing the text/category/page/screenshots/raiser, or editing a stamp or the note without a status change all raise an error |

The app also passes the expected previous status (`ticketService._advance(id, from, patch)` → `.eq('status', from)`), so two admins can't move the same ticket twice; zero rows = "not changed".

| Field | Rule (app and database) |
|---|---|
| Category | `bug`, `login_account`, `performance`, `data` (**issues**: steps, expected result and frequency required) · `feature_request`, `feedback`, `other` (requests) |
| Title | 8–120 characters |
| Page / area | 2–60 characters; the app only offers `TICKET_AREAS` |
| Description | 20–2000 (issues: "what happened instead"; requests: the details) |
| Steps | 10–2000 characters; the app also wants **2+ steps** (`countSteps`) |
| Expected result | 5–1000 |
| Frequency | `every_time`, `sometimes`, `once` |
| Device info | up to 300 (filled in by the app) |
| Screenshots | up to 3 per ticket, 5 MB each, PNG/JPEG/WEBP/GIF (bucket limits + check constraint) |
| Resolution note | 10–2000, required to resolve |

Characters are counted like Postgres counts them (`charCount`: an emoji is one).

---

## 9. Database reference

### 9.1 Tables at a glance

| Table | Purpose | Written by | Read by |
|---|---|---|---|
| `agents` | Agent accounts, profile, rank, admin flag, settings (`configs`); `user_id` = the Supabase Auth login | Genealogy (edit/delete), `agent-account` Edge Function (add, link login), Profile, Settings | almost everything |
| `agent_credentials` | **Locked** (RLS on, no policies). One row per login the app created: encrypted initial password, when the agent changed it, who created it | Edge Function (through `store_agent_initial_password`), trigger on `auth.users` | `admin_get_agent_login`, `current_agent_needs_password_change` only |
| `auth.users` (Supabase Auth) | Logins (bcrypt password hashes). Not a public table | `agent-account` Edge Function, Supabase Auth (password changes) | Supabase Auth, `admin_get_agent_login` (email) |
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
| `support_tickets` | **Real RLS** (own rows; admins all; admins update; no delete). IT support tickets: what the user wrote, screenshot paths, status and who/when stamps | IT Support page (raise; admin status changes), trigger `support_tickets_guard` (stamps) | IT Support page |
| `storage.objects` in bucket `support_attachments` | Private ticket screenshots | `ticketService.createTicket` | `ticketService.getAttachmentUrls` (signed URLs) |

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
        user_id uuid → auth.users(id) /* the login; set by the agent-account Edge Function. NULL = no login (older agents) */, profile_url text UNIQUE,
        configs jsonb /* user settings; the app always sets it */)
genealogy (relationship_ID bigint PK identity, upline_agent_ID int NN → agents,
           downline_agent_ID int NN UNIQUE → agents, created_at timestamptz default now())
agent_credentials ("agent_ID" int PK → agents ON DELETE CASCADE, user_id uuid NN UNIQUE → auth.users ON DELETE CASCADE,
                   initial_password_enc bytea /* pgp_sym_encrypt(initial password, Vault 'agent_password_key'); NULL once changed */,
                   password_changed_at timestamptz /* NULL = still on the initial password */,
                   created_by int → agents ON DELETE SET NULL /* admin who created the login */,
                   created_at timestamptz NN default now())
                  -- RLS enabled, NO policies; revoke all from anon, authenticated (migration 20261104120000)

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

-- IT support (migration 20261104160000; RLS: own rows / admins all / admins update / no delete)
support_tickets (ticket_ID bigint PK identity /* shown as #T-<id> */,
                 agent_ID int → agents ON DELETE SET NULL /* who raised it */,
                 category text NN CHECK IN ('bug','login_account','performance','data','feature_request','feedback','other'),
                 title text NN /* 8-120 */, area text NN /* 2-60, page or feature */,
                 frequency text CHECK IN ('every_time','sometimes','once') /* issues only */,
                 description text NN /* 20-2000 */, steps_to_reproduce text /* 10-2000, issues only */,
                 expected_result text /* 5-1000, issues only */, occurred_at timestamptz, device_info text /* <= 300 */,
                 attachment_paths text[] NN default '{}' /* <= 3 paths in bucket support_attachments */,
                 status text NN default 'raised' CHECK IN ('raised','in_review','resolved'),
                 resolution_note text /* <= 2000; >= 10 when resolved */,
                 reviewed_by int → agents ON DELETE SET NULL, reviewed_at timestamptz,
                 resolved_by int → agents ON DELETE SET NULL, resolved_at timestamptz,
                 reopen_count int NN default 0, reopened_at timestamptz,
                 created_at timestamptz NN default now(), updated_at timestamptz NN default now())
                 -- CHECK: issue categories need steps_to_reproduce, expected_result and frequency
                 -- trigger support_tickets_guard (before insert or update), see 9.7
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
| `support_tickets.status` | `raised`, `in_review`, `resolved` (labels Raised / In Review / Resolved, `TICKET_STATUS_LABEL`) |
| `support_tickets.category` | `bug`, `login_account`, `performance`, `data`, `feature_request`, `feedback`, `other` (labels in `TICKET_CATEGORIES`) |
| `support_tickets.frequency` | `every_time`, `sometimes`, `once` |

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
| `20261104120000_agent_accounts.sql` | Idempotent: `pgcrypto` (schema `extensions`), Vault secret `agent_password_key` (created once, never replaced), table `agent_credentials` (locked), functions `current_agent_is_admin`, `store_agent_initial_password`, `admin_get_agent_login`, `current_agent_needs_password_change`, `handle_agent_password_change` + trigger `on_agent_password_changed` on `auth.users`. No changes to existing tables. Ends with `notify pgrst`. **Part of 3.3 step 1.** |
| `20261104160000_support_tickets.sql` | Idempotent (check constraints dropped and re-added, `drop ... if exists` for policies and the trigger). Stops early if `current_agent_is_admin()` is missing. Function `current_agent_id()`; table `support_tickets` + check constraints + indexes; trigger `support_tickets_guard`; **real RLS** policies; `revoke all` from `anon`, `select/insert/update` for `authenticated`; private bucket `support_attachments` (5 MB, images only) + 3 storage policies; `support_tickets` added to `supabase_realtime`. No changes to existing tables. Ends with `notify pgrst`. **3.3 step 8.** |

Tables that existed before migrations were introduced (`agents`, `main_listings`, the sub-tables, `developers`, ...) have no migration file. Their shape is the PDF schema.

### 9.7 SQL functions, triggers, Vault and policies (agent accounts, support tickets)

All the functions are `SECURITY DEFINER` with `set search_path = ''` and use no dynamic SQL. The agent account ones are defined in `20261104120000_agent_accounts.sql`; `current_agent_id` and `support_tickets_guard` in `20261104160000_support_tickets.sql`.

| Object | Callable by | Does | Called from |
|---|---|---|---|
| `current_agent_is_admin()` → boolean | authenticated, service_role | `agents.admin_access` of the row whose `user_id = auth.uid()` (false if none) | the functions below |
| `store_agent_initial_password(p_agent_id, p_user_id, p_password, p_created_by)` → void | **service_role only** | Checks 8–72 characters, encrypts with `pgp_sym_encrypt` and the Vault key, upserts `agent_credentials` (resets `password_changed_at`) | `agent-account` Edge Function |
| `admin_get_agent_login(p_agent_id, p_reveal = false)` → one row (`has_login`, `login_email`, `has_initial_password`, `initial_password`, `password_changed_at`, `login_created_at`) | authenticated; **raises 42501 unless admin** | Login status; with `p_reveal` also decrypts the initial password if it is still stored | `accountService.getAgentLogin` |
| `current_agent_needs_password_change()` → boolean | authenticated | True if the caller has an `agent_credentials` row with `password_changed_at is null` | `accountService.needsPasswordChange` |
| `handle_agent_password_change()` + trigger `on_agent_password_changed` (`after update of encrypted_password on auth.users`, only when the hash changes) | trigger only | Sets `password_changed_at = now()` and `initial_password_enc = null` for that user | Supabase Auth password updates |
| Vault secret `agent_password_key` | Postgres only (read through `vault.decrypted_secrets` inside the functions) | 32 random bytes (hex) that encrypt the initial passwords | — |
| `current_agent_id()` → integer | authenticated, service_role | `agents."agent_ID"` of the row whose `user_id = auth.uid()` (NULL if none) | support ticket policies and trigger |
| `support_tickets_guard()` + trigger `support_tickets_guard` (`before insert or update on support_tickets`) | trigger only | Insert: raiser = signed-in agent, status `raised`, stamps cleared, 3-open-ticket limit (advisory lock), screenshot path check. Update: details locked, only the allowed status moves, stamps and note set here (8.8) | every write to `support_tickets` |
| RLS on `support_tickets` | — | `read own or admin` (select: `"agent_ID" = current_agent_id()` or admin), `raise as yourself` (insert), `admins update` (update). No delete policy | ticketService |
| Storage policies on `storage.objects` (bucket `support_attachments`) | authenticated | `read own or admin` (folder = `auth.uid()` or admin), `upload own` (into your folder), `delete own unused` (your file, used by no ticket) | ticketService |

⚠ **Do not delete or rotate `agent_password_key`.** Stored initial passwords would become unreadable (agents can still sign in; admins just can't reveal them).

### 9.8 Edge Functions (`supabase/functions/`)

| Function | Auth | Actions (POST JSON `{ action, ... }`) | Writes | Called from |
|---|---|---|---|---|
| `agent-account` (`index.ts`, Deno, `npm:@supabase/supabase-js@2`, service-role client) | Bearer token of a signed-in agent with `admin_access = true` (checked with `auth.getUser(token)` + `agents`); otherwise 401/403. CORS allows any origin (the token is the protection). | `create` `{ agent, uplineId, password }` → `{ agent_ID, user_id, email }`; `create-login` `{ agentId, password }` → same; `delete-login` `{ userId }` → `{ deleted }` | `auth.users` (admin API), `agents` (whitelisted columns only: names, sex, dates, contact, email, address, position, admin flag, configs; `age` derived on the server), `genealogy`, `agent_credentials` (via RPC) | `accountService.createAgentWithLogin/createLoginForAgent/deleteLogin` |

- **Errors** come back as `{ error: "<message for the admin>" }` with 400/401/403/404/409/500; `accountService` shows that message, and maps 404 (not deployed) and network failures to setup hints.
- **Rollback:** `create` deletes the edge, agent and auth user if a later step fails; `create-login` unlinks `user_id` and deletes the auth user.
- **Hierarchy rules are not re-checked** in the function (they live in `genealogyService.checkPlacement`, which runs first in the browser).
- **Deploying:** 3.3 step 2. The file is not covered by `vue-tsc` (Deno); check it by deploying or with `deno check`.

---

## 10. Function index (where things are stored)

"Used by" lists the files outside the service that call the function.

### 10.1 Services

**`src/services/authService.ts`** (`authService`)

| Function | Purpose | Used by |
|---|---|---|
| `getCurrentAgent()` | Signed-in agent: `agent_ID`, first/middle/last name, `admin_access` (or null) | Listings, PropertyManagement, SalesReport, Commission, SalesUploadModal, Genealogy page, Support |
| `logoutUser()` | `auth.signOut()` → `{ success, error? }` | Sidebar, ChangePasswordModal (login page) |

**`src/services/accountService.ts`** (`accountService`; types `NewAgentAccount`, `AgentLogin`). Logins and passwords; see 7.19, 7.20, 9.7, 9.8.

| Function | Purpose | Used by |
|---|---|---|
| `createAgentWithLogin(agent, uplineId, password)` | Edge Function `create`: login + agent + edge + stored initial password → `{ agent_ID, user_id, email }` | genealogyService.addAgent |
| `createLoginForAgent(agentId, password)` | Edge Function `create-login` for an agent without a login | AddAgentModal (edit) |
| `deleteLogin(userId)` | Edge Function `delete-login` (only logins no agent uses) | genealogyService.deleteAgent |
| `getAgentLogin(agentId, reveal=false)` | RPC `admin_get_agent_login` → `AgentLogin` (status; password only when `reveal`) | AddAgentModal (edit) |
| `needsPasswordChange()` | RPC `current_agent_needs_password_change` (never throws; false on error) | Dashboard |
| `sendPasswordCode(email)` | `auth.resetPasswordForEmail` (emails the one-time code) | ChangePasswordModal |
| `verifyPasswordCode(email, code)` | `auth.verifyOtp({ type: 'recovery' })` (starts a session) | ChangePasswordModal |
| `changePassword(newPassword)` | `auth.updateUser({ password })` | ChangePasswordModal |
| `functionErrorMessage()`, `callAccountFunction()`, `authErrorMessage()` | Module-private: Edge Function call + readable errors | internal |

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
| `getSharedListing(token)` | Load the listing for a token (images with `display_order`); throws if expired or pending | SharedListing |

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
| `buildDashboard(data, { month, agentId, isAdmin, now?, needsPasswordChange? })` | Pure builder → `DashboardView` (alerts, metrics, commissionMetrics, history, performance, activities, reminders). `Reminder` has optional `critical` and `action: 'change-password'` | Dashboard |

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
| `addAgent(data, uplineId, initialPassword)` | Check hierarchy rules, then `accountService.createAgentWithLogin` (login + agent + edge in the Edge Function) → `{ success, agent_ID, user_id, email }` | AddAgentModal |
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
| `deleteAgent(id)` | Blocked delete with downline re-parenting; `.select()` check on the agent delete; then removes the login (`accountService.deleteLogin`) | Genealogy page |
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

**`src/services/ticketService.ts`** (`ticketService`, `cleanTicket`, `ticketProblems`). IT support tickets; see 7.21, 8.8, 9.7.

| Function | Purpose | Used by |
|---|---|---|
| `getTickets(agentId?)` | Tickets newest first with raiser/reviewer/resolver names, mapped to `SupportTicket` (RLS already limits non-admins to their own) | Support |
| `createTicket(agentId, input, files)` | Clean + check (`cleanTicket`, `ticketProblems`, `imageProblem`), upload screenshots to `support_attachments/<uid>/<uuid>.<ext>`, insert; removes the uploads if the insert fails → `ticket_ID` | RaiseTicketModal |
| `startReview(id)` | `raised → in_review` → updated ticket or null | Support (table Review), TicketDetailsModal |
| `resolveTicket(id, note)` | Cleans the note (10–2000); `in_review → resolved` | TicketDetailsModal |
| `reopenTicket(id)` | `resolved → in_review` | TicketDetailsModal |
| `getAttachmentUrls(paths)` | Signed URLs (1 hour), same order, null where a file can't be opened | TicketDetailsModal |
| `cleanTicket(input)` | Exported pure helper: trims, removes control characters, caps lengths, drops issue-only answers from requests, `occurred_at` → ISO | RaiseTicketModal, createTicket |
| `ticketProblems(ticket)` | Exported pure helper: list of what is missing or wrong (empty = ready) | RaiseTicketModal, createTicket |
| `_advance(id, from, patch)` | Guarded status update with `.select()` (0 rows → null) | internal |
| `toTicket()`, `ticketErrorMessage()`, `randomFileId()` | Module-private: row mapping, readable errors (missing migration/bucket, limit, permissions, size, type), uuid with a fallback | internal |

**`src/services/lookupService.ts`**: empty placeholder.

### 10.2 Utils

| File | Exports | Used by |
|---|---|---|
| `utils/commissionAllocation.ts` | `allocatePayouts(raw, seller, ancestors)`, `agentFactor(rank, rate)`, types `ChainMember`, `PayoutRole`, `CommissionPayout` | commissionService, genealogyService |
| `utils/ranks.ts` | `Rank`, `RANK_LABEL`, `DEFAULT_RANK_RATE`, `rankOf(name, id)`, `rankLabel(rank)`, `allowedUplineRanks(rank)` | genealogyService, commissionAllocation, AddAgentModal |
| `utils/paySchedule.ts` | `UNIT_MONTHS`, `addMonthsClamped`, `dueDateAt`, `lastDueDate` | commissionService, salesService, SalesUploadModal |
| `utils/conversion.ts` | `currentCurrency`, `currentUnit` (refs), `currencySymbols`, `areaUnits`, `SQM_TO_SQFT`, `convertPrice`, `formatPrice`, `convertArea`, `formatArea`, `convertPriceToPHP`, `convertAreaToSqm` | Listings, PropertyManagement, PropertyCard, PropertyDetails, SalesReport, SharedListing, Settings |
| `utils/useSettings.ts` | `useSettings()` → `{ configs, updateSetting, loadSettings }` | App, Settings, conversion, ProfileCard, genealogy tree |
| `utils/liveRefresh.ts` | `useLiveRefresh(reload, tables, opts)` | Dashboard, Commission, Genealogy page, tree, TeamInsights, Support |
| `utils/sanitize.ts` | `cleanText(value, max)`, `cleanMultilineText(value, max=2000)` (keeps line breaks; drops control characters and invisible direction overrides, trims each line, max one blank line), `normalizeEmail`, `isValidEmail`, `isValidPhone`, `isIsoDate`, `digitsOnly`, `EMAIL_PATTERN`, `PHONE_PATTERN` | AddAgentModal, LoginForm, ChangePasswordModal (the Edge Function repeats the same rules); ticketService, TicketDetailsModal (`cleanMultilineText`) |
| `utils/deviceInfo.ts` | `describeDevice()` → e.g. "Chrome 130 · Windows · window 1536×730 · screen 1920×1080 · dark mode" | RaiseTicketModal |
| `utils/password.ts` | `INITIAL_PASSWORD_LENGTH` (14), `MIN_PASSWORD_LENGTH` (8), `MAX_PASSWORD_LENGTH` (72), `agentInitials`, `generatePasswordTail`, `buildInitialPassword`, `passwordRules`, `isStrongPassword`, type `PasswordRule` | AddAgentModal, PasswordReveal, ChangePasswordModal |

### 10.3 Classes and constants (`src/assets/classes/`)

| File | Exports |
|---|---|
| `agent.ts` | `AgentProfile`, `positionMap`, `getAge(birthDate)` |
| `commission.ts` | `PayUnit`, `DpDivision`, `CommissionPaymentScheme`, `CommissionChain`, `CalculateCommissionPayload`, `CommissionScheduleItem`, `CommissionSummary`, `CommissionCalculationResult` |
| `developers.ts` | `DeveloperProject` (declared twice, harmless), `DeveloperPromo`, `Developer`, `DayOption`, `days`, `OfficeHourSlot` |
| `listings.ts` | `Property`, `Lot`, `HouseAndLot`, `Condominium`, `Memorial`, `Images`, `formattedPropertyType(type)` |
| `ticket.ts` | `TicketStatus`, `TICKET_STATUS_LABEL`, `TicketCategory`, `TICKET_CATEGORIES` (label, hint, title example, `isIssue`), `TicketFrequency`, `TICKET_FREQUENCIES`, `TICKET_AREAS`, `MAX_OPEN_TICKETS` (3), `MAX_TICKET_IMAGES` (3), `MAX_TICKET_IMAGE_MB` (5), `MIN_TICKET_STEPS` (2), `TICKET_IMAGE_TYPES`, `TICKET_TEXT_LIMITS`, `NewTicket`, `SupportTicket`, `ticketNumber`, `categoryOption`, `categoryLabel`, `isIssueCategory`, `frequencyLabel`, `charCount`, `countSteps`, `imageProblem`. **Keep the limits in step with the migration.** |

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
| `commissions/ConfirmActionModal` | `title`, `message`, `confirmLabel?` ('Yes'), `cancelLabel?` ('No'), `busyLabel?`, `tone?` ('blue' \| 'green'), `busy?`, `error?`, `requiredPhrase?`; default slot = summary box | `confirm`, `cancel` | Commission (approve), ProofModal (received), RaiseTicketModal (discard), TicketDetailsModal (resolve, reopen) |
| `dashboard/DashboardStatCard` | `stat: Metric` | `click` | Dashboard |
| `dashboard/SalesPerfromance` | `bars`, `sold`, `avgDeal` | `open-details` | Dashboard |
| `dashboard/CommissionHistory` | `history: HistoryItem[]` | — | Dashboard |
| `dashboard/GenealogyCard` | `upline`, `downline` (`{ name, meta }[]`) | `view-full` | Dashboard |
| `dashboard/Reminders` | `reminders: Reminder[]` (critical ones render solid red) | `open` (`Reminder`) | Dashboard |
| `dashboard/RecentActivity` | `activities` | `view-item`, `view-all` | (hidden) |
| `genealogy/genealogymodal` | — | — | Genealogy page |
| `genealogy/AddAgentModal` | `agent?: AgentDetail` (edit mode) | `close`, `saved` (also on close after a save or a created login) | Genealogy page, Dashboard |
| `genealogy/PasswordReveal` | `value: string \| null` (null = not loaded), `loading?`, `regenerable?` | `reveal` (eye pressed while `value` is null), `regenerate` | AddAgentModal |
| `auth/ChangePasswordModal` | `email?`, `lockEmail?`, `signOutWhenDone?` | `close`, `changed` (email) | LoginForm, Dashboard |
| `genealogy/TeamInsights` | — | `changed` | Genealogy page |
| `developer/developerCard` | `dev: Developer` | `delete-developer`, `edit-developer`, `contact-developer`, `open-listing`, `open-promo` | developerlist |
| `developer/addDeveloper` | `dev?: Developer` | `close-add-developer` | developerlist |
| `calculator/CalculatorPanel` | `prefillPrice?` | — | Accounting, PropertyDetails |
| `accounting/amortSched` | `principal`, `years`, `interest` | `close` | CalculatorPanel |
| `profile/ProfileCard` | `agent` | — | Profile |
| `profile/ProfileEdit` | `agent` | `cancel` | Profile |
| `settings/configDropdown` | `choices`, `modelValue` | `update:modelValue` | Settings |
| `settings/configToggleSlider` | `modelValue: boolean` | `update:modelValue` | Settings |
| `support/RaiseTicketModal` | `agentId: number`, `openCount: number` | `close`, `created` (ticket id) | Support |
| `support/TicketDetailsModal` | `ticket: SupportTicket`, `isAdmin`, `currentAgentId`, `intent?: 'resolve' \| 'reopen' \| null` | `close`, `changed` (updated ticket, toast message) | Support |
| `support/TicketStatusBadge` | `status: TicketStatus` | — | Support, TicketDetailsModal |

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

### 11.3 Genealogy and agent accounts
- **Missing admin gating (partly fixed 2026-11-04).** Add, Edit and Delete agent are now admin-only. **Promote and threshold editing** in `TeamInsights.vue` are still visible to **all** users; gate them with `authService.getCurrentAgent().admin_access`.
- **The login email doesn't follow email edits.** Editing `agents.email_address` (Edit Agent or Profile) doesn't change the Supabase Auth email. Edit Agent shows a note when they differ. To change a login email today: Authentication → Users in Supabase. (A possible fix: an `update-email` action in the `agent-account` Edge Function.)
- **Nothing works until the Supabase setup is done** (3.3): without the migration, Edit Agent says to run it; without the Edge Function, Add Agent says it is not deployed; without the `{{ .Token }}` email template and SMTP, password codes don't arrive.
- **The recovery code is also a sign-in.** After the code is verified, the user has a session. On the Login page the modal ends it when finished or closed, but reloading the page mid-flow leaves the user signed in without having changed the password (the Dashboard reminder still shows for an initial password).
- The Edge Function doesn't re-check the hierarchy rules; it trusts `genealogyService.checkPlacement`, which runs first in the browser.
- The tree's heading says "Developer Genealogy"; it shows agents.

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
- The Commissions page and its request/release/proof modals have no dark-mode styling. (`ConfirmActionModal` and the Commissions toast have it, so they turn dark over a light page when dark mode is on. `AddAgentModal` got dark mode on 2026-11-04.)
- The Commissions page still uses `alert()` after a payment request, a release and a receipt; only Approve uses the toast.
- `bg-maurealty-red` (Listings confirmation toast) isn't a defined theme color.

### 11.7 Security (pre-launch)
- RLS is wide open on every table (dev policy) except `agent_credentials` (locked) and `support_tickets` (real per-user rules, the pattern to copy when hardening the others). Most role rules are frontend-only; creating/removing logins, revealing passwords and every support ticket rule are checked on the server (9.7, 9.8). Hardening (admins see everything, agents see their own) is planned "before go-live" according to the migration comments. When it happens, the Edge Function keeps working (it uses the service role).
- **Public sign-ups** must be turned off in Supabase (3.3 step 6). Otherwise anyone with the anon key can create a login and read the open tables.
- Admins can read an agent's **initial** password until it is changed (by design, 7.19). It is encrypted at rest with a Vault key and only decrypted by `admin_get_agent_login` for an admin.

### 11.8 Dead code and unused dependencies
- Unrouted or unused files: `views/DashboardPrevious.vue`, `components/test.vue`, `components/modal.vue`, `components/dashboard/AddListing.vue`, `components/dashboard/Calculator.vue`, `services/lookupService.ts`, `babel.config.js`.
- Unused functions: `salesService.getSaleById`, `getTotalSales`, `generateSchedulePreview`, `calculateCommissionableAmount`; `genealogyService.setUpline`; `reformatHours`.
- Unused dependencies: `chart.js`, `@types/chart.js`, `lucide`, `next`, `dagre`, `@types/dagre`, `@vue-flow/background`.
- `.env.example` is missing `VITE_MAPBOX_TOKEN`.

### 11.9 IT support tickets
- **No notifications.** Nobody is told when a ticket is raised or changes status: no email and no Dashboard alert or reminder. Admins have to open IT Support, and users have to check their tickets. (Possible next step: an admin reminder "n tickets waiting for review" and an agent alert "your ticket was resolved" in `dashboardService.buildDashboard`.)
- **No conversation.** There is one resolution note per resolution; users can't reply on a ticket. A user whose problem came back asks IT to reopen it, or raises a new ticket that mentions the number (the 3-open limit still applies).
- **Orphan uploads.** Screenshots are uploaded before the ticket row is inserted. If the browser closes between the two steps, the files stay in the user's folder of `support_attachments` without a ticket (only readable by that user and admins). Clean up by hand if needed.
- **Storage policies are OR-ed.** An older `storage.objects` policy without a `bucket_id` condition would widen access to the private screenshots (3.3 step 9).
- `TICKET_AREAS` exists only in the app (the database only checks the length), so a new page needs a new entry there.
- Signed screenshot links expire after an hour; an admin who keeps a ticket open longer gets broken images and has to open it again.

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **Agent** | A user of the portal (a row in `agents`). Admins are agents with `admin_access`. |
| **Login** | The Supabase Auth user an agent signs in with (`auth.users`), linked by `agents.user_id`. |
| **Initial password** | The 14-character `<initials><random>` password an admin's Add Agent generates. Admins can reveal it until the agent changes it. |
| **One-time code (OTP)** | The numeric code Supabase emails for a password change (recovery OTP, `{{ .Token }}` in the Reset password template). |
| **Edge Function** | Server-side Deno code hosted by Supabase (`supabase/functions/`). `agent-account` holds the service-role key for creating logins. |
| **Vault** | Supabase's encrypted secret store; holds `agent_password_key`. |
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
| **IT support** | The admins, when they handle tickets on the IT Support page. |
| **Ticket** | One IT support request (`support_tickets`), numbered `#T-<id>`. Raised → In Review → Resolved; a resolved ticket can be reopened. |
| **Issue vs request (ticket)** | Issue categories (something isn't working, login, slow, wrong data) must give steps, expected result and frequency so IT can recreate them; requests (feature request, feedback, other) only need details. |
| **Open ticket** | A ticket that is not resolved (Raised or In Review). Each person may have 3 when raising a new one. |
| **Resolution note** | IT support's answer on a ticket, required to resolve it and shown to the person who raised it. |

---

## 13. Recent changes and doc discrepancies

### 13.1 What `documentation.md` added, mapped to this file

| `documentation.md` entry | Summary | See |
|---|---|---|
| 2026-11-04: IT support tickets | New `/support` page; guided Raise a Ticket form with checklist, auto-numbered steps, screenshots (private bucket), device details; admin review / resolve (required note) / reopen; 3 open tickets per person; `support_tickets` with real RLS + guard trigger; `cleanMultilineText`, `describeDevice` | 3.3, 5.4, 5.6, 5.8, 6, 7.21, 8.8, 9, 10, 11.9 |
| 2026-11-04: Agent accounts and password changes | Add Agent creates the Supabase login (Edge Function `agent-account`), encrypted initial password that admins can reveal until it is changed, create login for older agents, login removed on delete, admin-only agent management, Dashboard Add Agent = Genealogy modal, red initial-password reminder, change password with an email code on the Login page, input cleaning helpers | 3.3, 5.1, 5.8, 6, 7.1, 7.3, 7.13, 7.19, 7.20, 8.7, 9.7, 9.8, 10 |
| 2026-11-03: Commission confirmations, admin filter, shared listing | Other Agents switch, "You" badge, Approve popup + toast, admins request/receive on own tabs, typed "I have received payment", `ConfirmActionModal`; shared page shows bulk price range, hides bulk features, orders photos, dark mode | 5.8, 6, 7.7, 7.12, 8.3, 10.4 |
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

- **2026-11-04:** IT support tickets: `/support` page, Raise a Ticket form, ticket popup with admin review / resolve / reopen, `ticketService`, `ticket.ts`, `cleanMultilineText`, `deviceInfo.ts`, migration `20261104160000_support_tickets.sql` (`support_tickets` with real RLS, `support_tickets_guard`, `current_agent_id`, private `support_attachments` bucket, realtime), new setup steps 8–9 (header, 1.3, 1.4, 1.5, 2, 3.3, 4, 5.1, 5.2, 5.3, 5.4, 5.6, 5.8, 6, 7.2, 7.21, 8.8, 9.1, 9.2, 9.3, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 11.7, 11.9, 12, 13.1).

- **2026-11-04:** Agent accounts: login creation through the `agent-account` Edge Function, `agent_credentials` + Vault + SQL functions + `auth.users` trigger, initial-password reveal, create login for older agents, login removal on delete, admin-only Add/Edit/Delete agent, Dashboard Add Agent uses the Genealogy modal (placeholder deleted), red initial-password reminder, change password with an email code, `sanitize.ts` / `password.ts`, new Supabase setup section (header, 1.2–1.5, 2, 3, 3.3, 4, 5.1, 5.3, 5.8, 6, 7.1, 7.3, 7.13, 7.19, 7.20, 8.6, 8.7, 9.1, 9.2, 9.6, 9.7, 9.8, 10.1, 10.2, 10.4, 11.3, 11.6, 11.7, 12, 13.1).

- **2026-11-03:** Commissions: admin "Other Agents" view, "You" badge, Approve confirmation popup + bottom-right toast, admins can request/receive payment on their own tabs, typed "I have received payment" check, new `ConfirmActionModal` (2.1, 4, 5.8, 6, 7.12, 8.3, 10.4, 11.6). Shared listing: bulk price range, single-only type features, photo order, dark mode (5.8, 7.7, 10.1, 11.6).
- **2026-11-03:** Sale form fills DP division dates automatically (7.10).
- **2026-11-03:** Commission pool is now the gross commission itself (extra 5% removed); sale form defaults the Commission Rate to 5% when the listing has none (7.10, 8.4).
- **2026-10-28:** Recorded team answers: the 5% formula stays unconfirmed (8.4); the approval date is the correct due-date anchor, so the sale form's wording is the bug (11.2, 13.2); agent and developer management is meant to be admin-only (6, 7.13, 7.15, 11.3, 11.4).
- **2026-10-28:** Created from a full read of the codebase (branch `feature/sales-report-v2` @ `859ea5d`), the project PDF and `documentation.md`. Type-check verified clean.
