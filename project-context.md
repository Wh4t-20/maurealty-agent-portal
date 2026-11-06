# MauRealty Agent Portal — Project Context

> **What this file is:** the single reference for how the Maureal Realty and Brokerage (MRB) web portal works today: its features, the processes behind them, and where each piece of logic lives in the code. It is written for AI assistants and for the dev team.
>
> **Last verified against the code:** 2026-11-06 · branch `fix/smoke-test-follow-ups` (sales keep their upline and incentives as recorded (setup step 13), login email follows email edits (`sync-login-email`, step 2 redeploy), developer images removed with the developer / when replaced, Genealogy loads shared (24 → 7 requests), live refresh stops on sign-out, Esc closes the listing overlay, office hours without seconds; on top of `31dd0a2`; checked in the browser against the live project) · `vue-tsc --build` passes with **0 errors** · `npm run build` passes. Earlier the same day: `test/rls-handling-smoke-test` (RLS hardening smoke test run against the live project and passed; `Holiday` office hours: `day_enum` migration, setup step 12, and `updateDeveloper` keeps the old hours when a save is refused; on top of `600c308`) · `vue-tsc --build` passes with **0 errors** · `npm run build` passes. Earlier the same day: `fix/storage-upload-limits` (upload limits on the `images` / `fact_sheets` buckets, setup step 11; on top of `c0c3cf4`) and `fix/dependency-cleanup` (unused dependencies removed, `dompurify` 3.4.17, `npm audit fix`, `VITE_MAPBOX_TOKEN` in `.env.example`; on top of `41004ac`). On 2026-11-05 (`fix/code-cleanup-and-optimizations`) every page was opened in headless Chrome against a mock Supabase (light / dark, desktop / phone, admin / agent, skeleton and loaded states) with no Vue warnings, see 1.6. (Earlier, on `fix/bug-catches-and-rls-fixes`: the RLS hardening migration was checked on a local PostgreSQL 18 with 159 role-by-role tests.)
>
> **Supabase changes need manual steps.** Agent accounts (2026-11-04) need a migration, an Edge Function deploy and some dashboard settings. IT support tickets (2026-11-04) need one more migration, run after the agent accounts one. **RLS hardening (2026-11-05)** needs one more migration: deploy the frontend first, then run it (3.3 step 10). **Holiday office hours (2026-11-06)** need one small migration (3.3 step 12). See [3.3 Supabase project setup](#33-supabase-project-setup-manual-steps). The team confirmed on 2026-11-05 that the migrations up to step 10 have been run (the `support_tickets` table exists); on 2026-11-06 the RLS smoke test passed on the live project and steps 11, 12 and 13 were run there, and the `agent-account` function was redeployed (step 2) with `sync-login-email`. The skeleton / speed / cleanup branch changes **no** database objects.
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
| A full page | `src/views/<Name>.vue` + a **lazy** route in `src/router/index.ts` (a `() => import(...)` loader, `meta: { requiresAuth: true }`, and the loader in `PORTAL_PAGES` so it is prefetched) + an entry in `topItems` in `src/components/Sidebar.vue` | Both the desktop sidebar and the phone bottom bar read `topItems` (keyed by `path`). Never import a view statically in the router: it would go back into the entry bundle (5.2). |
| A loading state for a page or list | Skeleton placeholders in the same component, shaped like the real content (5.8) | A separate `<Name>Skeleton.vue` beside the real component when the markup is large (`developer/DeveloperCardSkeleton.vue`); inline rows / cards next to the real ones for tables. |
| A heavy component that opens on demand (map, PDF, chart libraries) | `defineAsyncComponent(() => import(...))` in the page that opens it | So the page's first render doesn't wait for the library (example: `PropertyDetails` in Listings and the Developer List, 5.2). |
| A reusable or page-specific component | `src/components/<page-folder>/<Name>.vue` | One folder per page (`listings/`, `sales/`, `commissions/`, ...). |
| A modal / popup / lightbox | `src/components/<page-folder>/<Name>Modal.vue` | **Never inline in a view** (team convention). The view keeps the open/close state (`v-if`), any `<transition>` around it, and the actions; the modal gets props and emits `close` (+ its actions). Examples: `sales/SaleDetailsModal.vue`, `dashboard/MetricDetailsModal.vue`, `developer/PromoPosterModal.vue`, `listings/MapPickerModal.vue`. |
| A DB schema change | a new file in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql` | See 1.5. |
| Server-side code that needs the service-role key (creating/deleting Auth users, anything an admin-only check must guard) | a Supabase Edge Function: `supabase/functions/<name>/index.ts` (Deno, `npm:@supabase/supabase-js@2`) | Called from a service with `supabase.functions.invoke('<name>', { body })`. Check the caller inside the function. Document it in 9.8 and the deploy step in 3.3. Not part of `vue-tsc` (Deno code). |
| Form input cleaning (trim, length caps, email/phone/date checks) | `src/utils/sanitize.ts` | Use it in every form that writes to the DB or Supabase Auth. Never trim or alter passwords. Markdown fields use `cleanMarkdownText`; storage paths use `safeFileExtension` / `safeFileName`, never `file.name`. |

### 1.3 Coding conventions (match the existing code)

- **Vue 3** with the Composition API and `<script setup lang="ts">`. (The original PDF says "Vue 4"; `package.json` pins `vue ^3.5`.)
- Import with the `@/` alias (`@/services/...`, `@/utils/...`).
- Style with **Tailwind 4** utility classes. Use the theme tokens from `src/style.css` (`maurealty-blue`, `maurealty-green`, `background-gray`, `background-dark-gray`, `maurealty-light-blue`, `sidebar-hover`) and add `dark:` variants, since the app has a dark mode.
- Icons come from `lucide-vue-next`. Dropdowns use `@headlessui/vue` `Listbox`.
- Services are exported as object literals (`export const fooService = { async getX() {...} }`) and log errors with `console.error(...)` before re-throwing or returning a fallback.
- After any `update` or `delete`, chain `.select()` and treat **zero returned rows as a failure** (`return { success: false }`). With RLS this is the only way to notice a silently blocked write. Every existing service does this.
- Comments are short and plain: they say *why*, not *what*. Match the density of the file you are in. **Every view, component and service opens with a short header comment** (what it is, where it is used, anything non-obvious), and long templates mark their parts (`<!-- HEADER -->`, `<!-- TABLE -->`, ...). Put template comments *inside* a component's root element, not before it (a root-level comment makes a dev-mode fragment). Keep existing comments.
- **No `console.log` in committed code.** Failures are reported with `console.error` / `console.warn` (services log before re-throwing or returning a fallback); debug output is removed before committing (2026-11-05 cleanup removed 57 of them, one printed every developer's contact details).
- **Who is signed in:** `getSessionUser()` (`authService.ts`) reads the user from the stored session (`supabase.auth.getSession()`, no network unless the token needs refreshing). Use it, or `authService.getCurrentAgent()`, rather than `supabase.auth.getUser()`, which asks the auth server every time. Exception: code that builds a storage path from the uid on a write (`ticketService.createTicket`) keeps `getUser()`.
- Money is stored in **PHP**; areas are stored in **square metres**. Convert only for display (see 5.5).
- Dates are plain `YYYY-MM-DD` strings. Compare them as strings and do month math with `src/utils/paySchedule.ts`, so there are no timezone shifts. When you must build a `Date` from a date-only string, append `T00:00:00`.
- **Input cleaning / SQL injection:** never build SQL or PostgREST filter strings from user text. supabase-js sends values as JSON and PostgREST binds them as parameters; SQL functions must not use `EXECUTE`/`format()` with user input. On top of that, clean form values with `src/utils/sanitize.ts` (`cleanText`, `cleanMultilineText` for long answers that keep line breaks, `cleanMarkdownText` for Markdown (keeps indentation), `normalizeEmail`, `isValidEmail`, `isValidPhone`, `isIsoDate`, `digitsOnly`, `finiteNumber`) before sending them, and re-validate on the server when an Edge Function is involved. Search boxes filter loaded rows in the browser; they never become a query. The one `.or()` filter string left (`listingsService.getListings`) only takes known status words and a whole-number id.
- **Storage paths** are built from ids plus `safeFileExtension(file.name)` / `safeFileName(file.name)`: the storage policies check the `<folder>/<id>-...` shape (5.4), and a raw name such as `photo./x` would add a folder.
- **Untrusted text in HTML APIs:** anything from the database or an external API (e.g. Mapbox place names) goes into the DOM with `textContent` / `setDOMContent`, never `setHTML` / `innerHTML` (see `MapHolder.popupContent`).
- **CSV exports** prefix text cells that start with `= + - @` with `'` (`SalesReport.csvCell`), so spreadsheets don't run them as formulas.
- **User-written text is shown with `{{ }}`** (Vue escapes it), with `whitespace-pre-line` when line breaks matter. Only Markdown that went through `compileMarkdown()` (DOMPurify) may use `v-html`.

### 1.4 Guardrails

- **Do not change commission formulas, rank rates, override percentages or hierarchy rules** (Section 8) without explicit confirmation from the team. They are business rules from the client, not implementation details.
- Keep `commissions.claimed`, `claimed_at` and `admin_approved` in step with `commissions.status`. Older queries still read them.
- **Role checks happen in the app *and* on the server.** Since 2026-11-05 (`20261105120000_harden_rls.sql`) every table has real RLS: signed-out visitors (`anon`) get **no** table access (the shared listing page uses `get_shared_listing()`), a login without an agents row sees nothing, and agents / admins get exactly what the app lets them do (Section 6, 9.7). Guard triggers enforce the column rules a policy can't (`agents_guard`, `main_listings_guard`, `commissions_guard`, `support_tickets_guard`). Any new action must be gated in the UI **and** allowed by a policy, and services keep checking the expected previous status (`commissionService._advance`) and 0 affected rows. **Never add an open policy** (`using (true)`) or a policy for `anon` / `public`: policies are OR-ed, so one open policy undoes the rest. Server-side code that must bypass RLS uses the service role in an Edge Function (`agent-account`, 9.8).
- **Passwords:** never store, log or send a password anywhere except Supabase Auth. The only copy the app keeps is the **encrypted initial password** in `agent_credentials` (deleted as soon as the agent changes it). Don't add RLS policies to `agent_credentials`, don't select it from the browser, and don't print `agent_password_key` from Vault.
- Some features are hidden by being **commented out on purpose**: Net Commission input, Voucher Series input, the Recent Activity panel. Do not delete them, and do not restore them unless asked.
- Do not commit, push or create branches unless the user asks. The main branch is `mainer`. The branch naming rule is `<feat/fix>/<frontend/backend>/<featureName>`.
- Never put real keys in `.env.example`, and never print the contents of `.env.local`.

### 1.5 Database changes

1. Write an **idempotent** migration (`add column if not exists`, `create table if not exists`, `drop policy if exists`, and `do $$ ... $$` blocks for constraints). The team re-runs migrations by hand in the Supabase SQL editor.
2. Quote mixed-case identifiers (`"agent_ID"`, `"listing_ID"`). Lower-case column names stay unquoted.
3. New tables get RLS enabled, `revoke all on table ... from anon`, and **real policies `to authenticated`** (who may read/write which rows), using `public.current_agent_id()` and `public.current_agent_is_admin()` wrapped in `(select ...)`; follow `20261105120000_harden_rls.sql` (reads: `current_agent_id() is not null`; admin-only writes: `current_agent_is_admin()`; owner rules: `"agent_ID" = current_agent_id()` or a helper such as `can_manage_listing(id)`). Rules about *columns* (who may change which field) go in a `before update` guard trigger. **Never** the old open dev policy (`using (true) with check (true)`). **Exception:** a table holding secrets gets RLS with **no** policies plus `revoke all ... from anon, authenticated`, and is reached only through `SECURITY DEFINER` functions with `set search_path = ''` (see `20261104120000_agent_accounts.sql`). Revoke `execute` on such functions from `public, anon` and grant only the roles that need them. Something signed-out visitors must see goes through a narrow `SECURITY DEFINER` function granted to `anon` (pattern: `get_shared_listing`), never through table access.
4. If a page should refresh live from the new table, add it to the `supabase_realtime` publication (see section 5d of the same migration) and to that page's `useLiveRefresh([...])` list.
5. End the migration with `notify pgrst, 'reload schema';`.
6. Update Section 9 of this file, and 3.3 if the team has to do anything by hand in the Supabase dashboard.
7. **Every Supabase change is documented here**: migrations (9.6), SQL functions and triggers (9.7), Edge Functions (9.8), Vault secrets, Auth settings and email templates (3.3).

### 1.6 Verifying your work

- `npx vue-tsc --build` must stay at 0 errors (it was clean on 2026-11-05).
- `npm run build` runs the type-check and `vite build`.
- There are no automated tests. For logic-heavy code (commission math, hierarchy rules), past sessions checked behaviour with small stubbed Node scripts (Node 22 runs the `.ts` utils directly with `--experimental-strip-types`). For a refactor, compare the old and new logic on random data (how `blockedBy` and the sale numbering were checked on 2026-11-05, 13,000+ checks).
- **UI checks without real credentials** (how the 2026-11-05 skeletons, lazy routes and cleanup were checked): run Vite with `VITE_SUPABASE_URL=http://localhost:<port>` (environment variables override `.env.local`) pointing at a small local mock that answers the REST calls (`/rest/v1/<table>`, with a configurable delay to hold the skeleton on screen), put a fake session in `localStorage['sb-localhost-auth-token']` (`access_token`, `refresh_token`, far-future `expires_at`, `user.id`), and drive headless Chrome over its DevTools protocol (screenshots, console errors, clicks). Use `vite preview` on a build made with the same variables to test the real chunk loading. Mapbox calls fail with a fake token; that is expected.
- **RLS / SQL changes:** test them on a local PostgreSQL (18 is installed on the dev machine) with stub `auth` (`auth.users`, `auth.uid()` reading `request.jwt.claims`), `storage` (`buckets`, `objects`, `foldername`, `filename`), `vault` and the `anon` / `authenticated` / `service_role` (bypassrls) roles; build the schema from the migrations, recreate the live policies, run the migration twice, then act as each role with `set_config('role', ...)` + `set_config('request.jwt.claims', ...)` and check every allowed and refused action (how the 2026-11-04 and 2026-11-05 migrations were checked).

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

**Admins** are agents with `agents.admin_access = true`. They approve listings, sales and commissions, release commission payments with proof, manage agents, ranks and promotion thresholds, manage developers (office hours, promo posters), and act as **IT support** (review and resolve everyone's tickets). These rules are enforced by the database too (row level security since 2026-11-05), not only by the screens. **Adding an agent also creates their login** (Supabase Auth user + generated initial password); agents change that password themselves with a code sent by email.

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

### 3.1 Environment variables (`.env.local`, git-ignored)

| Variable | Used in | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/supabaseClient.ts` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `src/supabaseClient.ts` | Supabase anon key |
| `VITE_MAPBOX_TOKEN` | `MapHolder.vue`, `MapInteractive.vue`, `poiService.ts` | Mapbox access token. |

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
| 2 | Edge Functions → **Deploy a new function → Via editor** | Name it exactly **`agent-account`**, paste `supabase/functions/agent-account/index.ts`, Deploy. (CLI alternative: `supabase functions deploy agent-account --project-ref <ref>`.) Leave **Verify JWT** on; if calls fail with 401 *Invalid JWT* (projects on the new JWT signing keys), turn it off for this function: the function still checks the caller itself. | Creates logins with the service-role key (9.8). Until it is deployed, Add Agent shows "The agent-account Edge Function is not deployed yet". **Redeploy after 2026-11-06** (adds `sync-login-email`); until then an email edit saves but says the function needs to be redeployed. Redeployed on the dev project on 2026-11-06 (version 2). |
| 3 | Authentication → Emails → **Templates → Reset password** | Make the email contain the code `{{ .Token }}` (template below). Remove `{{ .ConfirmationURL }}` so nobody signs in through a link without changing their password. | The change-password modal asks for the **code**; the default template only has a link. |
| 4 | Authentication → **Sign In / Providers → Email** | Optional: *Email OTP Expiration* (default 3600 s) and *Email OTP Length* (the modal accepts 6–10 digits). | Code lifetime and length. |
| 5 | Authentication → Emails → **SMTP Settings**, then **Rate Limits** | Set up a custom SMTP sender (company mail, Resend, SendGrid, ...) and raise *emails per hour*. | Supabase's built-in sender only delivers to members of the Supabase team and allows only a few emails per hour, so agents would not receive their codes. |
| 6 | Authentication → **Sign In / Providers** | Turn **off** *Allow new users to sign up*. | Logins are created only by admins (through the Edge Function, which isn't affected). Since step 10 a self-made login without an agents row reads nothing, but it still shouldn't exist. |
| 7 | App: Genealogy → Edit Agent | For agents with **no login**, tick *Create a login with this email when I save*. Logins linked by hand earlier keep working (their password can't be shown). | Older agents have `user_id = null`. |
| 8 | SQL Editor | **IT support tickets:** run `supabase/migrations/20261104160000_support_tickets.sql` (safe to re-run; needs step 1 first, it stops with a clear message otherwise). Check: `select id, public from storage.buckets where id = 'support_attachments';` returns one row with `public = false`. | Creates `support_tickets` (real RLS + `support_tickets_guard` trigger), `current_agent_id()`, the private `support_attachments` bucket with its storage policies, and adds the table to realtime (7.21, 9.7). Until it runs, the IT Support page says the table is missing. |
| 9 | Storage → **Policies** (or SQL: `select policyname, cmd, qual from pg_policies where schemaname = 'storage' and tablename = 'objects';`) | Make sure every older policy on `storage.objects` is limited to its own bucket (`bucket_id = 'images'` / `'fact_sheets'`). (Step 10 replaces the `images` / `fact_sheets` ones; a policy with **no** bucket condition still has to be removed by hand.) | Policies are OR-ed: a policy with no `bucket_id` condition would also open the private ticket screenshots to other users. |
| 10 | **First deploy the frontend of 2026-11-05**, then SQL Editor | **RLS hardening:** run `supabase/migrations/20261105120000_harden_rls.sql` (safe to re-run, one transaction; needs step 1). It must not print any `WARNING` (a table without RLS, or a policy still open to anon). Checks: `select tablename, policyname, roles, cmd from pg_policies where schemaname in ('public','storage') order by 1, 2;` shows only `{authenticated}` policies; `select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;` returns no rows. | Replaces every open dev policy (9.7). The old frontend read `shared_listings` directly as a signed-out visitor, so running this before the new frontend is live breaks shared links until it is; the new frontend falls back to the old read while `get_shared_listing()` doesn't exist yet, so deploying it first is seamless. |
| 11 | SQL Editor | **Upload limits:** run `supabase/migrations/20261106120000_storage_upload_limits.sql` (safe to re-run). Its last query must show `images` with `file_size_limit = 10485760` and the 8 image types, and `fact_sheets` with `20971520`. | Public buckets serve files by URL to anyone: no SVG (it can carry script) and no huge files. Only new uploads are checked. **Applied to the dev project on 2026-11-06.** |
| 12 | SQL Editor | **Holiday office hours:** run `supabase/migrations/20261106130000_day_enum_holiday.sql` **on its own** (safe to re-run; any time, before or after the frontend). Check: `select enum_range(null::public.day_enum);` ends with `Holiday`. | The Add / Edit Developer office-hours picker offers Holiday, but `day_enum` had only Monday to Sunday. Until this runs, a slot with Holiday is refused ("invalid input value for enum day_enum") and the developer's other hours are kept. |
| 13 | SQL Editor | **Sales snapshot:** run `supabase/migrations/20261106150000_sales_snapshot.sql` (safe to re-run; any time). Its last query must show `sales_without_snapshot = 0` and `trigger_count = 1`. | Each sale keeps its listing incentives and the seller's upline as they were when it was recorded (`sales_snapshot` trigger); existing sales get today's values. Until it runs, the Sales Report falls back to reading both live, as before. **Applied to the dev project on 2026-11-06.** |

Reset password email template (step 3), subject e.g. *Your MauRealty password code*:

```html
<h2>Change your MauRealty password</h2>
<p>Enter this code in the portal to change your password:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>The code can be used once and expires soon. If you did not ask to change your password, you can ignore this email.</p>
```

**Smoke test after setup:** as an admin, add a test agent → the success screen shows the email and password; Authentication → Users lists the email; `agents.user_id` is filled; `select "agent_ID", password_changed_at from agent_credentials;` shows a row with `password_changed_at` null. Sign in as that agent → red reminder on the Dashboard → change the password with the emailed code → the reminder disappears and Edit Agent shows "Changed by the agent on ...". Delete the test agent → their user disappears from Authentication → Users.

**Smoke test for IT support tickets (step 8):** as an agent, open IT Support → Raise a Ticket → fill in a "Something isn't working" ticket with a screenshot → it appears as **Raised** in My Tickets, and Storage → `support_attachments` has a file under that user's uid folder. As another agent, the ticket is not listed. As an admin: All Tickets lists it → **Review** → **Resolve** (needs a note) → **Reopen**. Back as the agent: the ticket shows the admin's note, and a 4th open ticket is refused.

**Smoke test for the RLS hardening (step 10):** in a private browser window (signed out), open a fresh shared listing link → the page shows the photos, price, map (places chips work) and FAQ; an expired link says it expired. As an **agent**: create a listing (it is Pending), edit it, share an active listing, record a sale (a single listing becomes Sold), edit then delete that pending sale (the listing is Active again), request payment on an approved, due tab, save Settings and Profile; Developer List shows no Add / Edit / Delete; Team Insights shows thresholds as text and no Promote; another agent's pending listing is not in the grid. As an **admin**: approve the pending listing, approve a sale (tabs are generated), approve / release a tab, add / edit / delete a developer with office hours and a poster, set a promotion threshold, edit and delete an agent. In the browser console nothing should fail with `42501` / "row-level security".

**RLS smoke test result (2026-11-06): passed** on the live project, with the 2026-11-06 frontend run locally. Every step above was clicked through as a signed-out visitor, `test@agent.com` and `test@admin.com` (plus: the agent confirmed a released payment; the admin's Promote showed for eligible agents while agents saw "Eligible for ..."). The Supabase API logs had no 401 / 403 and no `42501` for the whole run. Every step was also replayed in SQL as the real users with RLS on, inside a transaction that was always rolled back (153 checks: signed out, login without an agents row, agent, another agent, admin). The test data was removed afterwards; deleting the test sale and developer left their payment-proof and developer-picture files in `images` (11.2, 11.4).

---

## 4. Project structure (file map)

```
/
├─ index.html                 App shell: favicon, Poppins font, mounts #app
├─ vite.config.ts             Plugins (tailwind, vue, devtools), '@' → src alias
├─ package.json               Scripts and deps ("#style" import alias → src/style.css)
├─ tsconfig*.json, env.d.ts   TypeScript config
├─ babel.config.js            Leftover from Vue CLI, unused by Vite
├─ .env.example               Env var names (all 3, no values)
├─ README.md                  Vue template readme + branch naming convention
├─ changelog.md               Early frontend notes (historical)
├─ documentation.md           Running change log (newest first). Read the latest entries.
├─ project-context.md         ← this file
├─ public/                    favicon.ico, profile.png (barely used)
├─ supabase/
│  ├─ config.toml             Supabase CLI local config
│  ├─ migrations/             Versioned schema changes (see 9.6), incl. 20261104160000_support_tickets.sql and
│  │                          20261105120000_harden_rls.sql (real RLS on every table, guard triggers, shared listing function)
│  │                          and 20261106130000_day_enum_holiday.sql (Holiday office hours)
│  └─ functions/              Edge Functions (Deno, deployed by hand, see 3.3 and 9.8)
│     └─ agent-account/index.ts  Creates/removes agent logins with the service-role key (admins only)
└─ src/
   ├─ main.ts                 createApp(App).use(router).mount('#app')
   ├─ App.vue                 Layout: Sidebar (once the first route is resolved, unless route.meta.hideSidebar) + RouterView; applies dark mode / no-animation classes
   ├─ style.css               Tailwind import, theme tokens, custom utilities, dark variant, vue-flow CSS (theme first, then base)
   ├─ supabaseClient.ts       The single Supabase client
   ├─ router/index.ts         Routes (every page lazy-loaded) + auth guard + background prefetch of the portal pages + reload on a stale chunk
   ├─ assets/
   │  ├─ classes/             Shared TS interfaces and constants
   │  │  ├─ agent.ts          AgentProfile, positionMap (id → title), getAge()
   │  │  ├─ commission.ts     PayUnit, DpDivision, CommissionChain, schedule/result types
   │  │  ├─ developers.ts     Developer, DeveloperProject, DeveloperPromo, OfficeHourSlot, days[]
   │  │  ├─ listings.ts       Property (+ Lot, HouseAndLot, Condominium, Memorial), Images, formattedPropertyType()
   │  │  └─ ticket.ts         SupportTicket, NewTicket, statuses, categories, areas, limits, ticket helpers
   │  ├─ images/              Logos (maureal.png 840 px, Maurealty.png 540 px wide), badges (MauBadgeLight/Dark.svg),
   │  │                       placeholders, login background (LoginFormBg.jpg, ~290 kB; the file name's case matters)
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
   │  ├─ sanitize.ts              Form input cleaning: cleanText, cleanMultilineText, cleanMarkdownText, normalizeEmail, isValidEmail/Phone,
   │  │                           isIsoDate, digitsOnly, finiteNumber, safeFileExtension / safeFileName (storage paths)
   │  ├─ saleStatus.ts            saleStatusClass(): sale status pill colours (Sales Report table + Sale Details popup)
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
      │           MetricDetailsModal.vue (a card's "Analysis" popup),
      │           AddListing.vue & Calculator.vue (unused placeholders)
      ├─ developer/developerCard.vue, addDeveloper.vue, PromoPosterModal.vue (poster lightbox),
      │            DeveloperCardSkeleton.vue (loading placeholder shaped like developerCard)
      ├─ genealogy/genealogymodal.vue (tree), AddAgentModal.vue (add/edit agent + login), PasswordReveal.vue
      │           (dots + eye / copy / regenerate), TeamInsights.vue
      ├─ listings/PropertyCard.vue, PropertyDetails.vue, ListingsFilter.vue, MapHolder.vue, MapInteractive.vue,
      │          MapPickerModal.vue (Property Management's location picker overlay)
      ├─ profile/ProfileCard.vue, ProfileEdit.vue
      ├─ sales/SalesUploadModal.vue       Sale create / confirm (Sold) / edit form
      │        SaleDetailsModal.vue       Sale Details popup of the Sales Report
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
SharedListing (signed out) ─► shareService.getSharedListing ─► rpc get_shared_listing(token) ─► listing's public details (no table access for anon)
TeamInsights / tree ─► genealogyService.getTeamInsights ─► rpc team_completed_sales() ─► completed-sales totals per agent
```

**Every query runs under RLS** (since 2026-11-05, 9.7): a refused read returns fewer rows, a refused write returns 0 rows (or `42501`). The guard triggers raise readable errors for column rules (e.g. "Only an admin can approve a listing ...").

There is **no global store** (no Pinia). Each page fetches what it needs on mount, including the current agent. To know who is signed in:

- `authService.getCurrentAgent()` returns `{ agent_ID, first_name, middle_name, last_name, admin_access }`. Use it for permission checks.
- `agentService.getCurrentAgentProfile()` returns the full `agents` row (Sidebar, Profile).
- `agentService.getCurrentAgentID()` returns just the id.
- `getSessionUser()` (exported from `authService.ts`) returns the Supabase Auth user (id, email) from the stored session (the Dashboard uses it for the login email).

All of them resolve the stored session (`getSessionUser()` → `supabase.auth.getSession()`) → `agents.user_id`. Since 2026-11-05 they no longer call `supabase.auth.getUser()`, which asked the auth server on every call (one extra round trip before every page's first query and on every live refresh). This is not a security change: the user id is only the lookup key; every query carries the access token, which PostgREST verifies, and RLS decides what it returns.

### 5.2 Routing and auth guard (`src/router/index.ts`)

| Path | Name | View | Auth | Sidebar |
|---|---|---|---|---|
| `/` | Landing | LoginForm | public | hidden |
| `/dashboard` | Dashboard | Dashboard | required | yes |
| `/listings` | Listing | Listings | required | yes |
| `/propertymanagement` | PropertyManagement | PropertyManagement | required | yes |
| `/shared/listing/:token` | SharedListing | SharedListing | **public** | hidden |
| `/sales` | SalesReport | SalesReport | required | yes |
| `/commissions` | Commission | Commission | required (since 2026-11-05) | yes |
| `/support` | Support | Support | required | yes |
| `/genealogy` | Genealogy | Genealogy-landingpage | required | yes |
| `/developerlist` | DeveloperList | developerlist | required | yes |
| `/accounting` | Accounting | Accounting | required | yes |
| `/profile` | Profile | Profile | required | yes |
| `/settings` | Settings | Settings | required | yes |

`router.beforeEach` calls `supabase.auth.getSession()` on every navigation. If the route needs auth and there is no session, it redirects to Landing. A signed-in user who opens Landing is redirected to **Listing** (`/listings`); a successful login itself pushes `/dashboard`.

**Every page is lazy-loaded (since 2026-11-05).** Each route uses a `() => import('@/views/...')` loader, so each view is its own chunk. Before, all pages and their libraries (Mapbox, Vue Flow, jsPDF) were one 3.4 MB bundle (985 kB gzipped) that even the login page waited for; the entry chunk is now about 320 kB (99 kB gzipped) and a portal page needs about 110–160 kB gzipped before it renders.
- **Prefetch:** after the first signed-in page renders (`router.afterEach`, `meta.requiresAuth`), `prefetchPortalPages()` waits 2 s, then fetches every loader in `PORTAL_PAGES` (the Sidebar pages + `PropertyDetails`) while the browser is idle. Later navigation is instant; signed-out visitors (login page, shared links) never download the portal. Add new pages to `PORTAL_PAGES`.
- **Stale chunks after a deploy:** `router.onError` catches "Failed to fetch dynamically imported module" (and the Safari / Firefox / CSS-preload variants) and loads the target page with a full reload, at most once every 10 s (`sessionStorage['mau_chunk_reload_at']`), so an outage can't loop.
- **Sidebar timing:** `App.vue` shows the Sidebar only after `router.isReady()` (`routerReady`), because the first route's `meta.hideSidebar` is unknown until its chunk loads; without this the Sidebar flashed on the login page and shared links.
- **Overlays loaded on demand:** `PropertyDetails` (Mapbox + jsPDF, about 640 kB gzipped) is a `defineAsyncComponent` in `Listings.vue` and `developerlist.vue`, so those pages render (and show their skeletons) without waiting for it; it is also in the prefetch list.

### 5.3 Supabase query conventions

- **Mixed-case column names** (`agent_ID`, `listing_ID`, `sale_ID`, `dev_ID`, `property_type_ID`, `recipient_agent_ID`, ...) are used exactly as written in supabase-js: `.eq('agent_ID', id)`. In raw SQL they must be double-quoted.
- **Embeds** (PostgREST joins) are used heavily, for example `agents (first_name, last_name)`, `main_listings (listing_title, developers (name))`. A 1:1 sub-table embed can come back as an object *or* an array, so code normalizes with `Array.isArray(x) ? x[0] : x`.
- **Ambiguous embed:** `commissions` has two foreign keys to `agents` (`recipient_agent_ID`, `released_by`), so it must be embedded as `agents!recipient_agent_ID (...)`. `support_tickets` has three (`agent_ID`, `reviewed_by`, `resolved_by`) and names their constraints: `raiser:agents!support_tickets_agent_ID_fkey (...)`, `reviewer:agents!support_tickets_reviewed_by_fkey (...)`, `resolver:agents!support_tickets_resolved_by_fkey (...)`. **A column hint only works if no other key uses that name on either side.** PostgREST matches the hint against the foreign key column *and* the column it points to, so `agents!agent_ID` matches all three keys (each points at `agents."agent_ID"`) and fails with PGRST201 "more than one relationship was found". When in doubt, use the constraint name; the PGRST201 error lists them.
- **Numeric columns** are wrapped with `Number(...)` before doing math (existing pattern).
- **Silent RLS blocks:** `.update(...).select()` / `.delete().select()` and check `data.length` (see 1.3).
- **RPC functions** are called with `supabase.rpc('name', { p_arg: value })`; arguments are bound parameters. A missing function returns error code `PGRST202` (usually: the migration wasn't run). `get_shared_listing` and `team_completed_sales` callers fall back to the old table reads on `PGRST202`, so the frontend can ship before 3.3 step 10.
- **Edge Functions** are called with `supabase.functions.invoke('name', { body })`; supabase-js adds the signed-in user's token. A non-2xx answer comes back as `FunctionsHttpError` whose `context` is the `Response`: read `await error.context.json()` for the function's `{ error }` message (see `functionErrorMessage` in `accountService.ts`).
- **Supabase calls outside services** (legacy): `Dashboard.vue` (`onMounted` agent lookup; the login email comes from `getSessionUser()`), `LoginForm.vue` (sign in + configs), `router/index.ts` (session check).

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

**Storage policies since 2026-11-05** (`20261105120000_harden_rls.sql`): both buckets stay **public**, so their files still open by URL for anyone (that is how the shared page shows photos), but uploads and deletes need a signed-in agent and the right path. `images`: `listings/<listing_ID>-...` by that listing's owner, `agents/<agent_ID>-...` by that agent, `developers/`, `developer_promos/`, `payment-proofs/` by admins; admins may manage any file (`can_manage_image`). `fact_sheets`: `<listing_ID>-...` by that listing's owner or an admin (`can_manage_fact_sheet`; insert + update + select, since uploads use upsert). Signed-out visitors can't upload, list or delete. Names are built with `safeFileExtension` / `safeFileName`, so they always match those shapes.

**Upload limits since 2026-11-06** (`20261106120000_storage_upload_limits.sql`): `images` takes only PNG, JPEG, WEBP, GIF, HEIC, HEIF and AVIF (no SVG), max 10 MB per file; `fact_sheets` keeps its pdf / doc / docx / md types, max 20 MB. Storage refuses anything else with `415 invalid_mime_type` or a size error, which the upload flows report as a failed upload. Files stored before the limits stay as they are.

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
3. Cleans up on unmount, and **stops on sign-out** (`SIGNED_OUT`, since 2026-11-06); a reload that is already queued checks for a session first. Logout signs out before it leaves the page, and a reload in that gap (the Logout click refocuses the window) used to run every query as a signed-out visitor: about 40 refused requests (401 / 42501) on the Genealogy page.

| Used by | Tables |
|---|---|
| `Dashboard.vue` | sales, commissions, main_listings, genealogy, agents |
| `Commission.vue` | commissions, sales |
| `Genealogy-landingpage.vue` | agents, genealogy |
| `genealogymodal.vue` (tree) | sales |
| `TeamInsights.vue` | sales, agents, genealogy, positions |
| `Support.vue` | support_tickets |

The realtime publication (migration section 5d) covers `sales`, `commissions`, `main_listings`, `genealogy`, `agents`, plus `support_tickets` (support tickets migration, section 6; realtime applies its RLS, so a non-admin only hears about their own tickets). `positions` is not in it, so polling covers that one. Realtime applies **every** table's RLS: since 2026-11-05 an agent only hears about sales and commission tabs they can read, so Team Insights / the tree pick up another agent's completed sale on the next focus or 60 s poll instead of instantly.

### 5.7 Markdown

Listing `description` and `faq` are written in Markdown. They are rendered with `compileMarkdown(raw)` (`marked.parse` → `DOMPurify.sanitize`) and shown with `v-html` inside the `markdownTypography` utility (Tailwind `prose` + `dark:prose-invert`).

### 5.8 UI and theme conventions

- Page header: a gradient bar `bg-linear-to-r from-[#A9D6FF70] dark:from-[#041d3070] to-[#FFFFFF] dark:to-black` with an uppercase title (Listings, Sales Report, Developers, Accounting, Profile).
- Modals: a fixed overlay `bg-[rgba(10,61,98,0.7)] backdrop-blur-sm`. The commission and agent modals use `<Teleport to="body">`. **Every modal is a component under `components/<page>/`** (1.2); since 2026-11-05 no view has an inline modal (`sales/SaleDetailsModal`, `dashboard/MetricDetailsModal`, `developer/PromoPosterModal`, `listings/MapPickerModal` were moved out unchanged).
- Confirmations: for an action that can't be undone, use `components/commissions/ConfirmActionModal.vue` (same look as the other modals, `z-60` so it can open on top of one). It moves keyboard focus into itself, keeps Tab inside, closes on Escape or a click outside, and can require a typed phrase (`requiredPhrase`). New code should use it instead of `confirm()`.
- **Loading skeletons** (Project Listings, Sales Report, Developer List, Commissions, IT Support): pulsing gray blocks shaped like the real content, so nothing jumps when the data arrives. Style: `animate-pulse` + `bg-gray-300 dark:bg-gray-700` blocks (`bg-gray-400 dark:bg-gray-600` for badges on PropertyCard), `rounded` / `rounded-full` like the element they stand for; a count inside a filter button uses `bg-current/30` so it follows the button's text colour. Rules used on those pages:
  - Tables keep their real header and show one page of skeleton rows (`<tbody v-if="loading">`); keep the skeleton cells in step with the real row's columns (role-dependent columns use the same `v-if="isAdmin"`).
  - Numbers that would flash `0` / `₱0.00` (summary strips, counts, meters) show a placeholder until the first load finishes; text that depends on the viewer's role (header labels, table titles, admin-only cards) waits on `agentResolved` (the agent lookup), not on the data.
  - Empty states and "no results" messages only show once loading has finished (`!loading && ...`).
  - Live / silent refreshes never bring the skeleton back; the Sales Report shows it again when it reloads after a save or delete (its table was hidden then before too). The Developer List shows skeleton cards only until the first load.
  - Accessibility: skeletons are `aria-hidden="true"`; the page adds an `sr-only` `role="status"` text ("Loading sales…") and `aria-busy` on the container.
  - The Commissions page has no dark mode, so its skeletons are light only (`bg-gray-300`), like its white cards.
- Feedback: small toasts (`Transition name="toast"`), `alert()` and `confirm()` in older code. Success toasts are top-right on Listings and Sales Report; the Commissions page toast is **bottom-right** (`bottom-20 md:bottom-6`, so it clears the phone bottom nav). The Listings result toast turns **red with "!"** for a failed action (`showConfirmedMessage(text, 'error')`, same look as the IT Support toast). Forms show save errors inline in red under the form (`text-red-600 dark:text-red-400`, `role="alert"`): Profile edit, Add/Edit Developer, Settings (green "Settings saved." / red error).
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

"Agent" means a signed-in user with `admin_access = false`. **Since 2026-11-05 every rule below is enforced in the UI and on the server** (RLS policies and guard triggers from `20261105120000_harden_rls.sql`, plus the earlier Edge Function, SQL functions and support ticket rules; 9.7). The **server** part of each row names what checks it. **Signed-out visitors** can only open a valid shared listing link (`get_shared_listing`) and see listing photos by URL; they can't read or change any table. A login that isn't linked to an agents row sees nothing.

| Action | Agent | Admin | Enforced in |
|---|---|---|---|
| See listings | active + sold + **own** pending / draft | everything (Pending Only toggle) | `Listings.loadProperties` → `listingsService.getListings` + **server**: RLS select (other agents' pending / draft listings are hidden, also in Developer List "Recent Projects") |
| Create listing | saved as `pending`, as themselves | saved as `active` | `PropertyManagement.saveProperty` + **server**: RLS insert (`agent_ID` = you; non-admins only `pending`) |
| Approve pending listing | ✗ | ✓ | `PropertyDetails` button (`isAdmin`) + **server**: `main_listings_guard` (no self-approval) |
| Reject pending listing | — | uses Delete | — |
| Edit listing | own listings only | own listings only (UI) | EDIT shown to the owner only + `Listings.handleEdit` owner check + **server**: `main_listings_guard` (non-owners can't change details; admins could through the API) |
| Delete listing | own listings | any listing | DELETE shown to the owner and admins + **server**: RLS delete (owner or admin) |
| Mark a listing sold / active again (a sale is recorded or deleted) | any active / sold listing | any | `SalesUploadModal`, `Listings.onSaleSaved`, `SalesReport.confirmDelete` + **server**: `main_listings_guard` (non-owners: status `active` ↔ `sold` and the places cache only) |
| Share listing | any active / sold listing | same | `PropertyDetails` (button hidden for pending) + **server**: RLS insert (live listing, link records the owner's id) |
| Open a shared link | anyone with a valid link, signed in or not | same | **server**: `get_shared_listing` (exists, not expired, listing not pending / draft; public details only) |
| Create sale | ✓ (seller = self) | ✓ (seller = self) | `SalesUploadModal.submit` + **server**: RLS insert (as yourself; `pending approval` unless admin) |
| See sales | own + the sales they earn an override on (shown on their commission cards) | all + Agent filter, Agent column, upline in details | `SalesReport.loadSales` + **server**: RLS select |
| Edit / delete sale | only while `pending approval` | always | `SalesReport.canEditSale` + **server**: RLS update / delete (and DP divisions: `can_edit_sale`) |
| Change sale status | ✗ (field disabled, status stripped from payload) | ✓ | `SalesUploadModal` + **server**: RLS (an agent's update must stay `pending approval`) |
| See commission tabs | own (as recipient) | all, with a "My Commissions" / "All Agents (Approval)" / "Other Agents" switch; own tabs carry a "You" badge in All Agents | `Commission.loadCommissions`, `scopedList`, `showOwnBadge` + **server**: RLS select |
| Generate / remove tabs (sale approved / cancelled) | ✗ | ✓ | `SalesUploadModal` (admin status change) + **server**: RLS insert / delete (admins) |
| Approve commission | ✗ | ✓ (any tab, including their own), after Yes in a confirmation popup | `Commission.askApprove` → `handleApprove` + status guard in `approveTab` + **server**: `commissions_guard` |
| Request payment | own tab, approved, due, earlier payments received | **own tabs only**, same rules (since 2026-11-03) | `canAgentAct` (= `isOwnTab`) + `canRequest` + `commissionService.requestPayment` order check + **server**: `commissions_guard` (only `approved` → `payment_requested`, earlier payments received, server time) |
| Release payment | ✗ | ✓ (any tab, including their own) | `Commission.vue` button + **server**: `commissions_guard` |
| Confirm received | own tab, `payment_released`, after typing "I have received payment" | **own tabs only**, same typed check (since 2026-11-03) | `canAgentAct` + `ProofModal.askReceived` + **server**: `commissions_guard` (only `payment_released` → `received`) |
| Dashboard scope | own data | "My Stats" / "All Agents" (default All) | `Dashboard.vue` |
| Personal payout alerts and reminders | ✓ | ✗ (admins can act on their own tabs from the Commissions page, but the Dashboard gives them approval alerts only) | `dashboardService.buildDashboard` |
| Add agent (creates the login + initial password) | ✗ (button hidden on Genealogy and Dashboard) | ✓ | `Genealogy-landingpage.vue` / `Dashboard.vue` (`isAdmin`) + **server**: `agent-account` Edge Function |
| Edit / delete agents | ✗ (buttons hidden) | ✓; can't delete **their own** record | `Genealogy-landingpage.vue` (`isAdmin`, `currentAgentId`) + **server**: RLS (update own row or admin; delete admin, not yourself) |
| Change admin access, position or hire date | ✗ (not even their own) | ✓ | **server**: `agents_guard` |
| Link a login to an agent (`agents.user_id`) | ✗ | ✗ from the browser | **server**: `agents_guard`; only the `agent-account` Edge Function (service role) |
| Create a login for an agent without one | ✗ | ✓ (Edit Agent) | **server**: `agent-account` (`create-login`) |
| Reveal an agent's initial password (eye icon) | ✗ | ✓ any agent, admins included, until that agent changes it | **server**: `admin_get_agent_login` (`current_agent_is_admin()`) |
| Remove a deleted agent's login | ✗ | ✓ (automatic on delete); never their own, never a login an agent still uses | **server**: `agent-account` (`delete-login`) |
| Change own password (email code) | ✓ | ✓ | Supabase Auth (the code proves the email) |
| "Initial password" reminder | ✓ | ✓ | `dashboardService.buildDashboard` (`needsPasswordChange`) |
| Promote, edit thresholds | ✗ (thresholds read-only, "Eligible for ..." label) | ✓ | `TeamInsights` (`isAdmin`) + **server**: RLS (positions / agents / genealogy updates are admin-only) |
| Add / edit / delete developers, office hours and promos | ✗ (buttons hidden) | ✓ | `developerlist.vue` / `developerCard` (`isAdmin`, `canManage`) + **server**: RLS (admins) + storage policies |
| Raise an IT support ticket | ✓ as themselves, max **3 open** (Raised + In Review) | ✓ same limit for their own tickets | `Support.canRaise`, `RaiseTicketModal` + **server**: RLS insert policy, `support_tickets_guard` (raiser forced, limit, status) |
| See tickets | own only | all (own ones carry a "You" pill) + "Your Tickets" list | `Support.load` → `ticketService.getTickets` + **server**: RLS select policy |
| Start review / Resolve (note required) / Reopen | ✗ (no buttons) | ✓ any ticket, including their own | `Support.vue` / `TicketDetailsModal` (`isAdmin`) + **server**: RLS update policy (admins), trigger (flow, stamps, note) |
| Edit or delete a ticket after raising it | ✗ | ✗ (only the status changes) | **server**: trigger locks the details; no delete grant or policy |
| Open ticket screenshots | own tickets | all | **server**: storage policies on `support_attachments` + signed URLs |
| Upload / delete listing photos, profile pictures, fact sheets | own listings, own picture | any | **server**: storage policies (`can_manage_image`, `can_manage_fact_sheet`, 5.4) |
| Profile, Settings | own | own | **server**: RLS (own row) + `agents_guard` |

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
- **Rules and edge cases:** "Remember Email" and "Data Privacy Act" are UI only. There is no public sign-up (turn it off in Supabase too, 3.3 step 6). The background photo is `assets/images/LoginFormBg.jpg` (~290 kB; it was a 2.4 MB PNG, and the CSS asked for `LoginFormBG.png`, which only resolved on case-insensitive Windows, fixed 2026-11-05); the logo `maureal.png` is 840 px wide (2× its largest display size).

### 7.2 App shell and navigation
- **Route / entry point:** every page except `/` and `/shared/listing/:token` (`meta.hideSidebar`).
- **Flow:** `App.vue` renders `Sidebar` + `RouterView` (the Sidebar only once the router's first navigation has finished, 5.2). The Sidebar loads the agent profile and shows the logo, the profile picture (links to `/profile`), the name, an admin badge (`MauBadgeLight.svg`) and the position from `positionMap`. Links come from `topItems`: Dashboard, Project Listing, Accounting, Sales Report, Developer List, Property Management, Genealogy, Commissions, IT Support (`LifeBuoy` icon); Settings and Logout sit at the bottom. On desktop the bar expands on hover; on phones it becomes a scrollable bottom bar. Both lists are keyed by `path` (Sales Report and Genealogy shared `id: 9` until 2026-11-05).
- **Code:** `src/App.vue`, `src/components/Sidebar.vue`, `agentService.getCurrentAgentProfile()`.

### 7.3 Dashboard
- **Route / entry point:** `/dashboard`.
- **Who:** everyone. Admins get a **My Stats / All Agents** switch (defaults to All Agents).
- **When it is used:** the landing page after login, to see sales, commissions, alerts and team at a glance.
- **Flow:**
  1. On mount: load the agent (`agents` by `user_id`), set the month filter to the current month, then run `loadDashboardStats()` and `loadTeam()`.
  2. `getDashboardData(agentId?)` loads sales, listings and commission tabs (for one agent, or everyone when an admin picks All Agents).
  3. `buildDashboard(data, { month, agentId, isAdmin })` returns alerts, metrics, commission metrics, history, performance, activities and reminders. Definitions are in 8.6.
  4. Clicking a card with a `link` navigates (Total Sales → `/sales`); other cards open an "Analysis" popup listing the records behind the number (10 per page; `components/dashboard/MetricDetailsModal.vue`).
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
- **Header buttons:** "+ Add Listing" → `/propertymanagement?edit=0` (create mode; since 2026-11-05 a missing flag is create mode too). **"+ Add Agent" is admins only** and opens the Genealogy page's `AddAgentModal` (same login creation, 7.19); saving refreshes the Genealogy card. (The old placeholder `components/dashboard/AddAgent.vue` was deleted on 2026-11-04.)
- **Data:** R `sales`, `main_listings`, `commissions` (+ joins), `genealogy`, `agents`, `positions`; RPC `current_agent_needs_password_change`.
- **Code:** `src/views/Dashboard.vue` (`openAddAgent`, `onAgentSaved`, `openReminder`, `onPasswordChanged`, `loginEmail`), `components/dashboard/MetricDetailsModal.vue`, `src/services/dashboardService.ts` (`getDashboardData`, `buildDashboard` with `needsPasswordChange`), `components/dashboard/*`, `components/genealogy/AddAgentModal.vue`, `components/auth/ChangePasswordModal.vue`, `genealogyService.getUplineChain(id, 20)`, `genealogyService.getDownline(id, 20)`.

### 7.4 Project Listings (browse, filter, details)
- **Route / entry point:** `/listings`.
- **Who:** everyone (visibility rules in Section 6).
- **When it is used:** finding a property to show a client, opening its details, sharing it, or recording a sale.
- **Flow:**
  1. On mount: resolve `isAdmin` and the agent id first, then call `getListings(20, ['active','pending'])` for admins or `getListings(20, ['active'], agentId)` for agents, load the developer names for the filter, and show a "saved" toast if `?saved=created|updated|pending`.
  2. Client-side filters (the `filteredProperties` computed): Pending Only (admin), Type, search (title, location or developer), Developer, price min/max (typed in the current currency and converted to PHP). Pending listings are sorted first, then newest first.
  3. Grid of `PropertyCard`s with 2/3/4 columns and 3 rows per page; skeleton cards while loading.
  4. Clicking a card opens the `PropertyDetails` overlay.
- **`PropertyDetails` overlay** (`components/listings/PropertyDetails.vue`; a `defineAsyncComponent` since 2026-11-05, downloaded on first open or by the background prefetch, because it holds Mapbox and jsPDF):
  - Loads the full row with `getListingById(id, typeId)`, including the sub-table, images, agent and developer.
  - Shows an image carousel, the price (a min–max range for bulk listings), type, location, a `MapHolder` map with POI chips, agent, created date, developer, type-specific features (single listings only), the Markdown description and FAQ.
  - Buttons (since 2026-11-05 only the ones the viewer may use are shown; props `isAdmin`, `currentAgentId`, `readOnly`):
    - **EDIT** (the listing's owner only): emits `edit`. Listings checks again that the current agent owns the listing, then goes to `/propertymanagement?edit=1&id=..&type=..`.
    - **DELETE** (owner or admin): confirmation toast → `listingsService.deleteListing` (hard delete). A refused delete or a listing still used by a sale / share link shows a red toast.
    - **SHARE**: hidden for pending listings; 5 s cooldown (7.7).
    - **CALCULATOR**: opens `CalculatorPanel` prefilled with the price.
    - **SOLD**: **active** bulk listings only (not pending). Confirmation toast → opens `SalesUploadModal` in Confirm Sale mode (7.10). After the sale is saved, the listing is set to `sold` and removed from the grid.
    - **APPROVE**: admin, pending listing → `updateListingStatus(id, 'active')`; a refused approval shows a red toast.
    - **readOnly** (Developer List): EDIT, DELETE, SOLD and APPROVE are hidden (that page doesn't handle them).
    - **FACT SHEET**: downloads the file as a blob, stripping the `{id}-{ts}-` prefix from its name; falls back to opening it in a new tab.
  - **Esc** (since 2026-11-06) closes the top layer: the fullscreen map first (`MapHolder`), then the calculator popup, then the overlay (`onKeydown`).
- **Also reused by:** `developerlist.vue`, which opens the same overlay read-only from a developer's "Recent Projects".
- **Data:** R `main_listings` + `property_type`, `agents`, `developers`, `listing_images`, sub-tables. W `main_listings.status`, deletes.
- **Code:** `src/views/Listings.vue`, `components/listings/{PropertyCard,PropertyDetails,ListingsFilter,MapHolder}.vue`, `listingsService.getListings/getListingById/getAgentFromListing/updateListingStatus/deleteListing`, `developerService.getDeveloperNames`.
- **Rules and edge cases:** only the 20 most recent listings are fetched (11.1). The Rooms, Bedrooms, Bathrooms, Lot Area, Class and Memorial Type filters are UI only. The Currency and Units dropdowns change the session values of `currentCurrency` / `currentUnit`.

### 7.5 Listing approval (pending queue)
- **When it is used:** a non-admin agent publishes a listing and an admin reviews it.
- **Flow:**
  1. A non-admin saves a new listing → `status = 'pending'` → redirected with `?saved=pending` ("submitted for admin approval").
  2. The agent sees their own pending listings in the grid (orange PENDING badge, sorted first). Other agents don't see them.
  3. An admin sees every pending listing, with a count badge and a "Pending Only" toggle, and presses **APPROVE** → `active`. To reject, the admin deletes the listing.
  4. Pending listings can't be shared: the button is hidden, the database refuses the link, and `get_shared_listing` says "not yet available".
  5. **Server rules (2026-11-05):** a non-admin's new listing must be `pending` (RLS insert), only an admin can move it to `active` (`main_listings_guard`), and other agents can't read it (RLS select).
- **Data:** the `listing_status` enum gained `pending` (migration `20260906120000`).
- **Code:** `PropertyManagement.saveProperty` (status choice), `listingsService.getListings` (`ownPendingAgentId` builds an `or(...)` filter), `Listings.handleApprove`, `PropertyCard` / `PropertyDetails` badges.

### 7.6 Property Management (create and edit a listing)
- **Route / entry point:** `/propertymanagement?edit=0` (create, from Listings "Add Listing" and the Dashboard) or `/propertymanagement?edit=1&id={listing_ID}&type={property_type_ID}` (edit, from the details overlay). Edit mode needs `edit=1` **and** an id; anything else (the Sidebar link has no query) is create mode (`isEditMode`).
- **Who:** any agent. In edit mode, only the listing's owner gets here through the UI.
- **When it is used:** adding a developer's project or unit to the portal, or correcting one.
- **Form fields:**
  - Title.
  - Photos (multiple; removing an existing photo is deferred until Save).
  - Description (Markdown with Preview).
  - Agent Incentive and Realty Incentive (free text, shown later in the Sales Report).
  - Price, plus Max Price when Bulk, in the current currency.
  - Location: text, or the map picker overlay (`components/listings/MapPickerModal.vue` around `MapInteractive`: geocoder search, or a pin-toggle and click with reverse geocoding). The picker emits `picked` and the page writes `lng`, `lat` and `location`.
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
- **Before saving (both modes):** text is cleaned (`cleanText` for title and location, `cleanMarkdownText` for description and FAQ, `cleanMultilineText` for the incentives); the price must be a number of 0 or more, and a bulk max price can't be below the min price (`priceProblem`).
- **Flow when creating:**
  1. Map the type label to an id (1–6) and build the `main_listings` payload. Price is converted to PHP. Status is `isAdmin ? 'active' : 'pending'`.
  2. Build the sub-table payload, translating UI names to DB names (11.5).
  3. `listingsService.createListing(main, sub, typeId)` inserts the main row, then the sub-table row; if the sub-table insert fails, the main row is deleted again.
  4. `uploadPropertyImages(newId, files)`, then `uploadFactSheet(newId, file)` (an alert if the fact sheet fails; the listing is saved).
  5. Redirect to `/listings?saved=created|pending`.
- **Flow when editing:**
  1. `loadProperties()` prefills the form from `getListingById`. Price and areas are converted to the display currency and unit, and the highest saved photo order is remembered.
  2. On Save: the type map has all 6 types; price and areas are converted back to PHP / sqm; **status is not sent** (editing never changes it). `updateListing(id, main, sub, typeId)` (0 rows = an alert, nothing else runs), then `deleteListingImages(removedUrls)` (storage and rows), then upload new images after the saved ones (`startOrder`) and the fact sheet.
  3. Redirect to `?saved=updated`.
- **Data:** W `main_listings`, `house_and_lot` / `lot_only` / `condominium` / `memorial`, `listing_images`; storage `images/listings/`, `fact_sheets`.
- **Code:** `src/views/PropertyManagement.vue` (`isEditMode`, `cleanedText`, `priceProblem`, `lastImageOrder`), `components/listings/{MapPickerModal,MapInteractive}.vue`, `listingsService.createListing/updateListing/uploadPropertyImages/deleteListingImages/uploadFactSheet/getListingById`, `developerService.getDevelopers`, `src/assets/questions.json`, `utils/conversion.ts`, `utils/sanitize.ts`.
- **Rules and edge cases:** Clubshare and Golfshare have no sub-table. Bulk listings still write a sub-table row filled with the form's default values. `master_bedroom_area` is saved as typed (sqm) in both modes. On the server only the owner (or an admin) can change the listing, its sub-table row, photos and fact sheet (RLS + storage policies, 9.7).

### 7.7 Listing sharing (temporary public link)
- **Route / entry point:** SHARE button in `PropertyDetails` → public page `/shared/listing/:token`.
- **Who:** an agent creates the link; anyone with it can view it without logging in.
- **When it is used:** sending a property to a client.
- **Flow:**
  1. `generateShareLink(listingId, agentId, 1)` first deletes every expired `shared_listings` row (fire-and-forget; RLS lets any agent delete expired links), then inserts a row with `expires_at = now + 1 day`.
  2. `handleShare` also refreshes the listing's nearby places cache (`poiService.getNearbyPois`, Mapbox only if the cache is missing or older than 30 days), because the client's page can read the cache but not write it.
  3. The URL `${origin}/shared/listing/${share_id}` is copied to the clipboard and an `alert` confirms it.
  4. `SharedListing.vue` calls `getSharedListing(token)`: a token that isn't a uuid is refused at once ("This shared link is invalid."), otherwise it calls the SQL function **`get_shared_listing(token)`** (since 2026-11-05). The function checks the link exists, hasn't expired and the listing isn't pending / draft, and returns `{ share_id, expires_at, main_listings: { listing fields, house_and_lot, lot_only, condominium, memorial, listing_images, agents (first/last name), developers (name), nearby_pois } }`, the same shape as the old embed. Its error messages ("expired", "not yet available", "invalid or has been removed") are shown on the page.
  5. The page shows the gallery, price, type, location, a map with POIs, the agent, the developer, the features, the description and the FAQ. **The commission, incentives, fact sheet and the agent's contact details are never returned** (not just hidden).
  6. The map gets the places from the listing (`:cached-pois`, `read-only-cache`): it calls Mapbox only if that cache is stale and never writes to the database.
  7. It follows the `PropertyDetails` overlay: bulk listings show the **min – max price range** (`is_bulk && max_price`), type features are shown for **single listings only**, photos are ordered by `listing_images.display_order`, and the `dark:` classes are the overlay's.
- **Data:** W/R `shared_listings` (uuid `share_id` is the token; signed-out visitors can't read the table), RPC `get_shared_listing` (callable by `anon`).
- **Code:** `src/services/shareService.ts` (`getSharedListing`, `TOKEN_PATTERN`, fallback `getSharedListingFromTables` while the function is missing), `PropertyDetails.handleShare`, `src/views/SharedListing.vue`, `poiService.getNearbyPois({ cached, persist })`.
- **Rules and edge cases:** the `agent_ID` saved on the link is the **listing owner's** id (`details.agent_ID`), not the id of the agent who shared it (the insert policy checks this). Dark mode follows the viewer's saved settings (`App.vue`), so a client normally sees the light page. If you change how the overlay shows a listing, change `SharedListing.vue` **and `get_shared_listing`** the same way (a new field must be added to the function's JSON).

### 7.8 Maps and nearby points of interest
- **Where:** `MapHolder.vue` (read-only map in the listing overlay and the public page) and `MapInteractive.vue` (location picker in Property Management).
- **Flow (POIs):**
  1. The map shows chips for Hospitals, Schools, Police, Pharmacies, Fire Stations and Supermarkets.
  2. The first time a chip is toggled on, `poiService.getNearbyPois(listingId, lng, lat)` runs. It returns the cached `main_listings.nearby_pois` if that is under 30 days old (and has the right shape, `isNearbyPois`); otherwise it calls the Mapbox Search Box category API once per category (up to 5 results each, one call after another), saves the result to the cache, and returns it. The shared page passes `{ cached, persist: false }` instead (7.7).
  3. The markers' popups show the name and the distance (`haversineKm`). They are built with DOM nodes and `textContent` (`popupContent`, `setDOMContent`), never an HTML string, so a place name can't run script; places without finite coordinates are skipped.
  4. "Expand Map" toggles a full-screen view; **Esc** leaves it (since 2026-11-06; handled in the capture phase and stopped, so the listing overlay underneath stays open).
- **Defaults:** if a listing has no coordinates, the map falls back to Fuente Osmeña, Cebu (`123.8931, 10.3099`). The style is `streets-v12`.
- **Data:** R/W `main_listings.nearby_pois` (jsonb `{ fetched_at, categories: { [id]: [{ name, lng, lat }] } }`).
- **Code:** `src/services/poiService.ts` (`POI_CATEGORIES`, `haversineKm`, `getNearbyPois`), `components/listings/MapHolder.vue`, `components/listings/MapInteractive.vue`.

### 7.9 Sales Report
- **Route / entry point:** `/sales`; also the Dashboard "Total Sales" card.
- **Who:** agents see their own sales; admins see everyone's.
- **When it is used:** recording sales, checking their status, exporting a report, and (for admins) approving or completing sales by changing their status.
- **Flow:**
  1. `loadSales()`: an admin gets `salesService.getSales()`; an agent gets `getSales({ agentId })`; someone without an agent record gets an empty list.
  2. `getSales` fills blank agent names (`fillMissingAgentNames`, falling back to "Agent #id") and numbers the sales (`applySaleNumbers`): per agent for an agent's own list, across every sale for the admin list. These numbers are computed for display; `agent_sale_seq` is not written. The numbering order (`fetchSaleOrder`) is fetched in parallel with the sales (since 2026-11-05; it used to wait for them).
  3. Client-side search (client, project, voucher; max 100 characters), date range on the reservation date, and an Agent filter for admins.
  - **Loading (since 2026-11-05):** the table keeps its header and shows 12 skeleton rows during every load (first load, and the reload after a save or delete); the summary strip shows placeholders until the first load finishes; the "All agents / Your sales" label waits for `agentResolved`. The four summary cards are one `v-for` over `summaryCards`.
  4. A summary strip shows the count, total contract price, gross and net commission of the filtered rows.
  5. Sortable table (reservation date, client, contract price, gross), 12 per page. ⚠ marks rows with no gross commission. Edit and delete icons appear on hover when `canEditSale` (admin, or status `pending approval`).
  6. **Sale Details** popup (`components/sales/SaleDetailsModal.vue`; props `sale`, `isAdmin`, `canEdit`; emits `close`, `edit`, `delete`; it loads its own data):
     - client, developer, project, agent and upline chain (admin, 2 levels), reservation date, contract price, commissionable amount, financing, payment scheme, commission rate, DP figures and divisions, sale number, status, gross/net commission, remarks, incentives;
     - **since 2026-11-06** the upline ("· when the sale was recorded") and the incentives are the ones saved with the sale (`sales.upline_snapshot`, `agent_incentive`, `realty_incentive`, filled by the `sales_snapshot` trigger, 9.7), so later genealogy moves or listing edits no longer rewrite past sales or the CSV export. Before setup step 13 has run, both are read live as before (`getSales` falls back when the columns are missing);
     - **Property Details**: from `sales.unit_details` for bulk sales, otherwise from the listing's sub-table (normalized), with a property-type badge.
  7. **Export**: CSV of the filtered, sorted rows (`sales-report-YYYY-MM-DD.csv`); text cells starting with `= + - @` get a leading `'` so spreadsheets don't run them as formulas.
  8. **Delete**: `confirm()` → `salesService.deleteSale` (this cascades, see 11.2) → then set the listing back to `active`. (Since 2026-11-05 the sale is deleted first, so a refused delete changes nothing; if the listing can't be reactivated the toast says so.)
- **Data:** R `sales` + `agents`, `main_listings` (title, incentives, developer), `sale_dp_divisions`, `genealogy`, listing sub-tables. W `sales` (delete), `main_listings.status`.
- **Code:** `src/views/SalesReport.vue` (`canEditSale`, `confirmDelete`, `csvCell`), `components/sales/SaleDetailsModal.vue` (`uplineFromSnapshot`), `utils/saleStatus.ts` (`saleStatusClass`), `salesService.getSales/getDpDivisions/deleteSale` (`SALE_SELECT`, fallback `SALE_SELECT_LIVE_INCENTIVES`), `listingsService.getListingPropertyType/getListingById/updateListingStatus`, `genealogyService.getUplineChain` (only without a snapshot).

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
    - Spot-Cash and Deferred-Cash show an info box instead (no divisions, no financing). It says the payment is due "one month after an admin approves the sale" (the tabs' real first due date, 7.11); since 2026-11-05 it no longer previews a reservation-based date.
  - **Commissionable Amount:** starts equal to the contract price until the user types a value; it can differ because of taxes and policies.
  - **Commission Rate %:** prefilled from `main_listings.commission`; **5%** when the listing has none. Editable per sale.
  - **Gross Commission** (read-only) = Commissionable Amount × Commission Rate ÷ 100.
  - **Sale Status** (Edit mode only; editable by admins only): `pending approval`, `awaiting payment`, `complete`, `cancelled`.
  - Remarks (placeholder hint by type: "Floor 12, Unit 1205" for condos, "Block 5, Lot 12, Phase 2" for house/lot).
  - Listing Incentives (read-only): in Create / Confirm, the listing's current ones (the sale keeps them when it is recorded); in **Edit**, since 2026-11-06, the ones saved with the sale ("Incentives (when the sale was recorded)", `shownIncentives`), not whatever the listing says today.
  - **Specific Unit Details (bulk sale):** the per-type unit fields, including block/lot/phase for house and lot and **Floor** for condos. They are prefilled from the listing and saved to `sales.unit_details` (jsonb). In Confirm (Sold) and Edit mode the form loads its one listing (`listingsService.getListingSummary`) so this section, its prefill (Sold) and the incentives box work; an edit keeps the sale's saved `unit_details` (it used to save `null`).
  - Hidden (commented out): Net Commission, Voucher Series.
- **Field checks (`validateSaleFields`, before the scheme check):** a project is chosen, the client name isn't empty after `cleanText`, a valid reservation date, a contract price above 0, no negative commissionable amount, a commission rate from 0 to 100%. Client name, remarks and voucher series are saved through `cleanText`.
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
- **Code:** `SalesUploadModal.vue` (`validateSaleFields`, `validatePaymentScheme`, `submit`), `salesService.createSale/updateSale/saveDpDivisions/getDpDivisions/calculateDownpaymentMetrics/getListingDeveloperName/generateCommissionTabs`, `listingsService.getListingSummary`, `commissionService.removeUnclaimedForSale`, `utils/paySchedule.ts`, `utils/sanitize.ts`.
- **Server rules (2026-11-05):** the seller can only create the sale as themselves with `pending approval`, and edit / delete it (and its DP divisions) while it is still pending; only admins change the status and generate or remove tabs (RLS, 9.7).

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
  5. Sort order: not received first, then due date (compared as `YYYY-MM-DD` strings), then developer name.
  6. **Loading (since 2026-11-05):** on the first load the list shows 4 skeleton cards on the same grid as a real card, and the receivables amounts, the status tab counts and the "(n Items)" count show placeholders (light colours only; live refreshes stay silent).
- **Actions** (state machine in 8.3). "Recipient" = the signed-in person is `recipient_agent_ID` (`canAgentAct`), a non-admin or an admin on their own tab:

  | Status | Admin sees (someone else's tab) | Recipient sees (own tab, admin or not) |
  |---|---|---|
  | `pending_approval` | **Approve commission** → confirmation popup "Are you sure you want to approve this commission?" (No / Yes, with a summary) → `approveTab` → toast "Commission approved." (bottom right) | (waiting); an admin on their own tab sees Approve too |
  | `approved` | "Waiting for the agent to request payment" | **Request payment**: enabled when due (due date reached or sale complete) and every earlier payment of the same sale for the same person is received (`blockedBy`, which looks up the computed `firstOpenPayment` map: the lowest payment not yet received per sale and recipient). Opens `PaymentRequestModal`. |
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
- **Rules and edge cases:** admins can request and receive payment **on their own tabs only** (since 2026-11-03; before that these steps were agent-only and an admin's own tab stopped at Approved). The Dashboard still gives admins no personal payout alerts. Request and release toasts are not implemented; those steps still confirm with `alert()`. The route requires sign-in (since 2026-11-05).
- **Server rules (2026-11-05):** agents read only the tabs they receive (and the sales those tabs belong to); `commissions_guard` lets a non-admin recipient only move `approved → payment_requested` (earlier payments of the sale received; `requested_at` set by the server) and `payment_released → received` (`claimed`, `claimed_at` set by the server); amounts, recipients and every other column stay as generated. Admins approve, release, generate and remove tabs. The request details popup cleans its editable fields with `cleanText` before saving them in `request_details`.

### 7.13 Genealogy (team tree and agent management)
- **Route / entry point:** `/genealogy`.
- **Who:** everyone can view. **Add, Edit and Delete agent, Promote and thresholds are admin-only** (Add / Edit / Delete since 2026-11-04, Promote and thresholds since 2026-11-05: buttons hidden for agents, handlers check `isAdmin`, and RLS / `agents_guard` refuse agents on the server).
- **When it is used:** seeing who is in whose team, adding or onboarding an agent (which now also creates their login), changing someone's upline or position, removing an agent.
- **Page sections:**
  1. Header: search (filters the Teams, Recently Added and Manage Agents lists) and **Add Agent** (admins). The static profile picture that sat beside it was removed on 2026-11-04.
  2. Stats (`getStats`):
     - Total Agents.
     - Team Leaders: agents with at least one downline.
     - Active Teams: root agents, meaning agents with no upline.
     - New This Month: `hire_date` in the current month.
  3. **Teams:** one entry per root agent with its subtree size.
  4. **Recently Added:** 5 agents, newest `hire_date` first (since 2026-11-06 built from the shared graph, no query of its own).
  - **Loading (since 2026-11-06):** the stats, Teams, Recently Added, the tree and Team Insights all start at once; calls that start while one is running share it (`fetchGraph`, `team_completed_sales`, `authService.getCurrentAgent`). The page went from about 24 requests to 7 (agents + genealogy + positions once, the totals RPC once, `getAgents`, the signed-in agent); requests that were queued behind the duplicates finish in about 0.2 s instead of 1.5–2.2 s. Nothing is cached after a load finishes, so live refreshes read fresh data. After an add, edit or delete the page also reloads Team Insights (`insights.reload()`), which used to keep the old roster until the next realtime event or 60 s poll.
  5. **Manage Agents** (Edit / Delete buttons for admins only): Edit opens `AddAgentModal` in edit mode. Delete (hidden on the admin's own row) calls `deleteAgent`, which is **blocked** if the agent has sales, listings or share links; otherwise their direct downlines move up to the deleted agent's upline (or become roots), the edges are removed, the agent row is deleted (`.select()` check), and **their login is removed** (`accountService.deleteLogin` → Edge Function).
  6. **Roles, Overrides and Promotion** (`TeamInsights`, 7.14).
  7. **Tree** (`genealogymodal.vue`, titled "Agent Genealogy"): Vue Flow with a top-to-bottom dagre layout. Each node shows the name, position, commission rate %, accumulated sales and "% to next" rank. It redraws on sales changes and is remounted (`reloadKey`) after edits.
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
- **Who:** everyone sees the panel; **admins** edit thresholds and promote (agents see the thresholds as text and an "Eligible for ..." label instead of Promote).
- **Flow:**
  1. **Thresholds:** for Supervisor, Investment Manager and Partner Broker, the accumulated sales needed to be promoted *into* that rank. Saved to `positions.promotion_sales_threshold` with `setPromotionThreshold` (0 or more, or empty = "not set"; a save that changes 0 rows is an error, so "Threshold saved." only shows when it really saved).
  2. **Per agent** (`getTeamInsights`): rank, rate, direct and total downline counts, **accumulated sales** (the contract prices of their own `complete` sales plus those of everyone below them, at any depth), progress to the next rank's threshold, and `eligible` once accumulated ≥ threshold. The per-agent completed-sales totals come from the SQL function `team_completed_sales()` (agents can't read other agents' sales rows since 2026-11-05; it falls back to reading `sales` while the function is missing).
  3. **Promote** (admins, shown when eligible, with a `confirm()`): `promoteAgent` checks eligibility again, then `updateAgentAndUpline(id, { position_ID: next }, currentUpline)`. Promotion is never automatic. It may detach the agent from their upline.
  4. Clicking a name expands the **override split**: the percentage of each payment's company commission that the agent keeps and that each upline earns (`allocatePayouts(100, ...)`).
- **Code:** `components/genealogy/TeamInsights.vue` (`isAdmin`), `genealogyService.getTeamInsights/getRankPositions/setPromotionThreshold/promoteAgent` (+ module-private `completedSalesByAgent`), RPC `team_completed_sales`.

### 7.15 Developer list (developers, office hours, promo posters)
- **Route / entry point:** `/developerlist`.
- **Who:** everyone can view. Adding, editing and deleting developers, office hours and promos is **admin-only** (since 2026-11-05: Add Developer and the cards' Edit / Delete are hidden for agents, and RLS / storage policies refuse them).
- **When it is used:** looking up a developer's contact details, office hours, recent projects and current promos; maintaining that data.
- **Flow:**
  1. `developerService.getDevelopers()` makes one query that embeds `opening_days`, `main_listings` and `developer_promos`.
     - Office hours: one `opening_days` row per day, grouped into slots of consecutive days with the same open and close times.
     - Projects: the 3 newest listings that are not drafts.
     - Promos: newest first.
  2. **Search** (header): filters the loaded developers in the browser by name, location, email or phone.
  - **Loading (since 2026-11-05):** 4 skeleton cards (`components/developer/DeveloperCardSkeleton.vue`, mirrors the card) until the first load finishes; reloads after a save or delete keep the current cards. Loaded with no developers and no search typed: "No developers to show." (it used to stay blank); "No developers match your search." waits for the first load.
  3. **Card:** picture, name, a static "Active" badge, phone, email, location, office hours, Recent Projects chips (click → `PropertyDetails` overlay, read-only, loaded on first open), Promotions thumbnails (click → lightbox `components/developer/PromoPosterModal.vue`; shows "Expired" or "Until" based on `valid_until`), Delete and Edit (admins, `canManage`) and Contact. The picture and the posters use `loading="lazy"` (cards below the screen don't download their images up front).
  4. **Add / Edit modal (`addDeveloper.vue`):** name, location, phone, email, office-hour slots (a multi-select of Monday to Sunday plus Holiday (Holiday needs 3.3 step 12), and open/close time or "Unavailable"), profile picture, and promo posters (new posters are staged with an optional title and valid-until date; saved posters can be removed). The form edits **copies** of the developer (the card doesn't change until it is saved). Fields are cleaned and required (name, location, a valid phone and email; poster titles cleaned, dates checked); errors show above Save.
     - **Add:** `addDeveloper` (inserts the developer and its `opening_days` rows; throws if either fails) → `uploadImage` → `updateDeveloper` with the image URL (rewrites `opening_days`) → `persistPromos` (upload and insert new posters, delete removed ones; throws if a poster fails).
     - **Edit:** a newly chosen picture is uploaded first (a removed one is saved as removed) → `updateDeveloper` (update with a 0-rows check, then upsert the new `opening_days` rows on `(id, day)` and delete the days no longer picked) → `persistPromos`. Since 2026-11-06 a refused office-hours save (e.g. Holiday before 3.3 step 12) keeps the developer's old hours and says so; before, the old hours were deleted first and lost. Also since 2026-11-06: once the edit is saved, the **previous picture's file is removed** when it was replaced or removed (`removeReplacedImage`); a picture uploaded for a save that then fails is removed again (`discardUploadedImage`); a removed poster's row is deleted first and its file only after that (`deletePromo`, 0 rows = kept).
     - Then the modal emits **`saved`**: the page closes it and reloads the list.
     - **Office hours** (`officeHourRows`): one row per day; slots without days, marked Unavailable or missing a time are skipped (the columns are NOT NULL `time`), and a day picked twice keeps the first slot.
  5. **Delete** (admins, after a `confirm()`): `deleteDeveloper` refuses a developer that listings still use, deletes `opening_days`, then the developer row (0 rows = error); promos cascade. Since 2026-11-06 the developer's picture and poster **files** are then removed from the `images` bucket too (best effort, logged; they used to stay, reachable by URL). The page waits for it, then reloads; failures show above the cards.
  - **Office hours display:** the card shows `8:00 AM - 5:00 PM` (`formatClockTime`, `src/utils/clockTime.ts`, since 2026-11-06); it used to print the raw `08:00:00`.
- **Data:** R/W `developers`, `opening_days` (`id` = `dev_ID`), `developer_promos`; R `main_listings`; storage `images/developers/`, `images/developer_promos/`.
- **Code:** `src/views/developerlist.vue` (`isAdmin`, `searchQuery`, `filteredDevelopers`, `onDeveloperSaved`, `handleDeleteDeveloper`), `components/developer/{developerCard,addDeveloper,PromoPosterModal}.vue`, `src/services/developerService.ts`, `src/assets/classes/developers.ts` (`days` list).
- **Rules and edge cases:** a few rough edges remain (11.4).

### 7.16 Accounting (calculators)
- **Route / entry point:** `/accounting`; the same panel opens from the listing overlay's CALCULATOR button with the price prefilled.
- **Modes (`CalculatorPanel.vue`, Loan is the default):**
  - **Loan:** monthly payment `P × r(1+r)^n / ((1+r)^n − 1)` with `r = annual% / 12` and `n = years × 12` (term capped at 20 years; `P / n` when the rate is 0). "View Amortization Schedule" opens `amortSched.vue`.
  - **Sales:** Net Commission = Gross Profit × Net Commission Rate% − (that × Commission Tax%).
  - **Property Tax:** Property Value × Tax Rate%.
- **Amortization schedule (`amortSched.vue`):** monthly rows starting one month from **today**, on the same day of the month and clamped to the last day of shorter months (Jan 31 → Feb 28/29 → Mar 31; since 2026-11-05, before that dates rolled over and skipped a month). Interest uses actual days ÷ 365 (`balance × annualRate × days/365`) and the last row absorbs any rounding. Page size 12, 24, 36 or All. **Export PDF** uses jsPDF + autotable and saves `Amortization_Schedule.pdf`.
- **Data:** none (pure frontend).
- **Code:** `src/views/Accounting.vue`, `components/calculator/CalculatorPanel.vue`, `components/accounting/amortSched.vue`.

### 7.17 Profile
- **Route / entry point:** `/profile` (click the Sidebar avatar).
- **Flow:**
  1. `getCurrentAgentProfile()` → `ProfileCard` shows the name (+ admin badge), sex, age (computed from the birth date), birth date, address, contact, email, agent ID, position and hire date.
  2. **EDIT** → `ProfileEdit`: first/middle/last name, sex (Male, Female, Non-Binary, Other), birth date, address, contact number, email, and the profile picture (Upload/Change, Delete, Revert).
  3. Save: every field is cleaned and checked like Add Agent (`cleanForm`: names, address, contact number, email, a real date of birth not in the future; errors show under the form). If a new picture was chosen, `uploadProfileImage` (to `images/agents/<own id>-...`); then `updateProfile` with all fields **including `home_address`** (it was never saved before 2026-11-05) and `age` recomputed; only after a successful save is the old picture deleted (a removed picture is saved as `null`); a failed save removes the newly uploaded picture again → `router.go(0)` (full reload).
- **Rules:** position, hire date and admin access can't be edited here; they are edited from Genealogy → Manage Agents. Since 2026-11-06 a new email is also the new **login email**: after the profile is saved, `accountService.syncLoginEmail(own id)` → `agent-account` `sync-login-email` (a note under the field says so; if that step fails the form says the profile was saved but the sign-in email was not, and doesn't reload). Passwords are changed from the Login page or the Dashboard reminder (7.20), not here.
- **Code:** `src/views/Profile.vue`, `components/profile/{ProfileCard,ProfileEdit}.vue`, `agentService.*`.

### 7.18 Settings
- **Route / entry point:** `/settings` (Sidebar, bottom).
- **Options:** Default Currency (PHP, USD, CAD, CNY, JPY), Default Unit (Metric = sqm, English = sqft), Disable Animations, Enable Dark Mode.
- **Flow:** every change calls `updateSetting()` (localStorage) and takes effect immediately for the theme and animations. **SAVE SETTINGS** writes the configs to `agents.configs` (`agentService.updateConfigs`) and shows "Settings saved." or a red error (it stops if the login has no agent record). CANCEL goes back in history but does not undo changes already applied. Unreadable saved settings in localStorage fall back to the defaults instead of breaking the app.
- **Code:** `src/views/Settings.vue` (`saveCurrentSettings`, `showSaveMessage`), `components/settings/{configDropdown,configToggleSlider}.vue`, `src/utils/useSettings.ts`, `App.vue`.
- **Rules and edge cases:** see 11.6 (the default currency only applies after a reload).

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
  - If the email field no longer matches the login email, a note says saving also changes the login email. **Since 2026-11-06** the save does: after the fields are saved, `accountService.syncLoginEmail(id)` → Edge Function `sync-login-email` sets the login email to the saved `email_address` (`email_confirm`, no email sent; refused with 409 if another login uses it). A failure says the changes were saved but the login email was not.
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
  6. **Loading (since 2026-11-05):** on the first load the table keeps its header and shows 10 skeleton rows, and the open-ticket meter and status counts show placeholders. The header label, the table title and the left card ("Your Tickets" for admins, "How tickets move" for agents) show a placeholder until `agentResolved`, so an admin no longer sees the agent version first; the admin's "Your Tickets" list has its own placeholder rows.
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

**On the server** (`main_listings_guard` + RLS, 2026-11-05): a non-admin creates listings as themselves with `pending`; only an admin moves `pending`/`draft` to another status; a non-admin (owner or not) only switches `active` ↔ `sold`; someone who doesn't own the listing may change nothing but the status and `nearby_pois`; nobody but an admin changes `agent_ID`. Pending and draft listings are only readable by their owner and admins.

### 8.2 Sale status (`sales.status`, enum `sales_status`)

```
'pending approval' ──admin──► 'awaiting payment' ──admin──► 'complete'      (completed_at = now)
        │                           │
        └──────── admin ────────────┴──► 'cancelled'   (tabs not yet received are deleted)
```

- Only `pending approval` lets non-admins edit or delete the sale (and its DP divisions). **Server:** RLS (`sales update / delete own pending or admin`, `can_edit_sale`); an agent's update must leave the status at `pending approval`, so only admins change it.
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

Each step goes through `_advance(id, from, patch)`, which updates `.eq('status', from)` and returns `false` if 0 rows changed (the status had already moved, or RLS blocked it). **On the server** (`commissions_guard`, 2026-11-05) a recipient who isn't an admin can only make the two recipient steps (`requestPayment`, `confirmReceived`), in order and without touching any other column; the server stamps `requested_at` / `claimed_at`. Every other change needs an admin. **Only `received` counts as received money** in receivables and dashboard totals. Labels: `STATUS_LABEL` uses "Pending Approval" while the filter tab says "Awaiting Approval"; both mean `pending_approval`.

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

Every table has RLS on with real policies for `authenticated` only (9.7); `anon` has no table privileges (shared links go through `get_shared_listing`).

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
              day day_enum NN /* Monday..Sunday, Holiday (Holiday since 20261106130000) */,
              open_hours time NN, close_hours time NN,
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
       completed_at timestamptz, created_at timestamptz default now(),
       agent_incentive text, realty_incentive text /* the listing's, when the sale was recorded */,
       upline_snapshot jsonb /* seller's upline chain then, nearest first, 2 levels; all three set by
                                the sales_snapshot trigger on insert and kept on update (9.7) */)
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
| `opening_days.day` (`day_enum`) | `Monday` … `Sunday`, `Holiday` (`Holiday` added by `20261106130000_day_enum_holiday.sql`, 3.3 step 12; the live enum didn't have it before) |
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
| `20260617120000_create_sales.sql` | `sales` table, indexes, open RLS policy (replaced by `20261105120000_harden_rls.sql`; the older files' open policies are all dropped there) |
| `20260629120000_create_genealogy.sql` | `genealogy` table (backfill only; it already existed on the remote) |
| `20260629130000_add_nearby_pois.sql` | `main_listings.nearby_pois` |
| `20260720120000_add_listing_incentives.sql` | `main_listings.agent_incentive`, `realty_incentive` |
| `20260720120100_create_developer_promos.sql` | `developer_promos` table |
| `20260906120000_add_pending_listing_status.sql` | `pending` value on `listing_status` |
| `20261014140000_sales_payment_scheme_and_commissions.sql` | Combined and idempotent: sales financing, scheme and DP columns, `completed_at`, `sale_dp_divisions`, `commissions` (+ approval, balance, rank, role check), positions rates and thresholds, `Partner Broker` row, `sales.commission_rate`, Deferred-Cash, realtime publication, commission payment-flow columns, `sales.commissionable_amount`. **Re-run the whole file, then `notify pgrst, 'reload schema';`.** |
| `20261104120000_agent_accounts.sql` | Idempotent: `pgcrypto` (schema `extensions`), Vault secret `agent_password_key` (created once, never replaced), table `agent_credentials` (locked), functions `current_agent_is_admin`, `store_agent_initial_password`, `admin_get_agent_login`, `current_agent_needs_password_change`, `handle_agent_password_change` + trigger `on_agent_password_changed` on `auth.users`. No changes to existing tables. Ends with `notify pgrst`. **Part of 3.3 step 1.** |
| `20261104160000_support_tickets.sql` | Idempotent (check constraints dropped and re-added, `drop ... if exists` for policies and the trigger). Stops early if `current_agent_is_admin()` is missing. Function `current_agent_id()`; table `support_tickets` + check constraints + indexes; trigger `support_tickets_guard`; **real RLS** policies; `revoke all` from `anon`, `select/insert/update` for `authenticated`; private bucket `support_attachments` (5 MB, images only) + 3 storage policies; `support_tickets` added to `supabase_realtime`. No changes to existing tables. Ends with `notify pgrst`. **3.3 step 8.** |
| `20261105120000_harden_rls.sql` | **RLS hardening.** One transaction, idempotent. Stops early if `current_agent_is_admin()` is missing. Helper functions `current_agent_id` (re-created), `can_manage_listing`, `can_edit_sale`, `can_manage_image`, `can_manage_fact_sheet`; guard triggers `agents_guard`, `main_listings_guard`, `commissions_guard`; drops **every** policy on the 19 app tables (whatever their names), enables RLS, `revoke all` from `anon`, grants `authenticated`, creates the real policies (9.7); drops the old open storage policies of `images` / `fact_sheets` (by name, plus any other policy mentioning those buckets) and creates new ones; functions `get_shared_listing(token)` (anon) and `team_completed_sales()`; ends with warnings for any public table without RLS or policy open to anon / public, and `notify pgrst`. No columns or tables change. Doesn't touch `support_tickets`, `support_attachments` or `agent_credentials`. **3.3 step 10** (deploy the frontend first). |
| `20261106120000_storage_upload_limits.sql` | Idempotent. `images` bucket: allowed types PNG / JPEG / WEBP / GIF / HEIC / HEIF / AVIF (no SVG), 10 MB limit; `fact_sheets`: 20 MB limit. No tables, policies or existing files change. **3.3 step 11.** |
| `20261106130000_day_enum_holiday.sql` | `Holiday` value on `day_enum` (after `Sunday`), for the developer office-hours picker. `ADD VALUE IF NOT EXISTS`, safe to re-run; run it on its own (a new enum value can't be used in the transaction that adds it). **3.3 step 12.** |
| `20261106150000_sales_snapshot.sql` | Idempotent. `sales.agent_incentive`, `realty_incentive` (text) and `upline_snapshot` (jsonb); function `sale_upline_snapshot(agent_id)` (2-level chain, executable by no API role); backfill of existing sales with today's values (before the trigger exists); function + trigger `sales_snapshot` (9.7). Ends with `notify pgrst` and a check query. **3.3 step 13.** |

Tables that existed before migrations were introduced (`agents`, `main_listings`, the sub-tables, `developers`, ...) have no migration file. Their shape is the PDF schema.

### 9.7 SQL functions, triggers, Vault and policies (agent accounts, support tickets, RLS hardening)

All the functions are `SECURITY DEFINER` with `set search_path = ''` and use no dynamic SQL. The agent account ones are defined in `20261104120000_agent_accounts.sql`; `current_agent_id` and `support_tickets_guard` in `20261104160000_support_tickets.sql`; the helpers, guards, `get_shared_listing`, `team_completed_sales` and every table policy except the support ticket ones in `20261105120000_harden_rls.sql`. In all guards, `auth.uid() is null` means the SQL editor or the service role (the `agent-account` Edge Function), which may do anything.

| Object | Callable by | Does | Called from |
|---|---|---|---|
| `current_agent_is_admin()` → boolean | authenticated, service_role | `agents.admin_access` of the row whose `user_id = auth.uid()` (false if none) | the functions and policies below |
| `store_agent_initial_password(p_agent_id, p_user_id, p_password, p_created_by)` → void | **service_role only** | Checks 8–72 characters, encrypts with `pgp_sym_encrypt` and the Vault key, upserts `agent_credentials` (resets `password_changed_at`) | `agent-account` Edge Function |
| `admin_get_agent_login(p_agent_id, p_reveal = false)` → one row (`has_login`, `login_email`, `has_initial_password`, `initial_password`, `password_changed_at`, `login_created_at`) | authenticated; **raises 42501 unless admin** | Login status; with `p_reveal` also decrypts the initial password if it is still stored | `accountService.getAgentLogin` |
| `current_agent_needs_password_change()` → boolean | authenticated | True if the caller has an `agent_credentials` row with `password_changed_at is null` | `accountService.needsPasswordChange` |
| `handle_agent_password_change()` + trigger `on_agent_password_changed` (`after update of encrypted_password on auth.users`, only when the hash changes) | trigger only | Sets `password_changed_at = now()` and `initial_password_enc = null` for that user | Supabase Auth password updates |
| Vault secret `agent_password_key` | Postgres only (read through `vault.decrypted_secrets` inside the functions) | 32 random bytes (hex) that encrypt the initial passwords | — |
| `current_agent_id()` → integer | authenticated, service_role | `agents."agent_ID"` of the row whose `user_id = auth.uid()` (NULL if none) | almost every policy, the guards |
| `support_tickets_guard()` + trigger `support_tickets_guard` (`before insert or update on support_tickets`) | trigger only | Insert: raiser = signed-in agent, status `raised`, stamps cleared, 3-open-ticket limit (advisory lock), screenshot path check. Update: details locked, only the allowed status moves, stamps and note set here (8.8) | every write to `support_tickets` |
| RLS on `support_tickets` | — | `read own or admin` (select: `"agent_ID" = current_agent_id()` or admin), `raise as yourself` (insert), `admins update` (update). No delete policy | ticketService |
| Storage policies on `storage.objects` (bucket `support_attachments`) | authenticated | `read own or admin` (folder = `auth.uid()` or admin), `upload own` (into your folder), `delete own unused` (your file, used by no ticket) | ticketService |
| `can_manage_listing(p_listing_id bigint)` → boolean | authenticated | Admin, or the listing's owner (`main_listings."agent_ID" = current_agent_id()`) | sub-table and `listing_images` write policies |
| `can_edit_sale(p_sale_id bigint)` → boolean | authenticated | Admin, or the seller while the sale is `pending approval` | `sale_dp_divisions` write policies |
| `can_manage_image(p_name text)` → boolean | authenticated | `images` bucket: admin (any file); else `listings/<id>-...` of a listing you own or `agents/<your agent_ID>-...`; nothing else (developers, promos, payment proofs are admin-only) | `images` storage policies |
| `can_manage_fact_sheet(p_name text)` → boolean | authenticated | `fact_sheets` bucket: admin, or `<id>-...` of a listing you own | `fact_sheets` storage policies |
| `agents_guard()` + trigger `agents_guard` (`before insert or update on agents`) | trigger only | Signed-in users never set or change `user_id` (logins are linked by the Edge Function) or `agent_ID`; non-admins can't change `admin_access`, `position_ID`, `hire_date` (not even on their own row) | every write to `agents` |
| `main_listings_guard()` + trigger `main_listings_guard` (`before update on main_listings`) | trigger only | Non-admins: no `agent_ID` change; status only `active` ↔ `sold` (no self-approval); someone who doesn't own the listing may change only `status` and `nearby_pois` (compared as `to_jsonb(new) - ...`) | every update of `main_listings` |
| `commissions_guard()` + trigger `commissions_guard` (`before update on commissions`) | trigger only | Non-admins (the recipient, per RLS) only `approved → payment_requested` (+ `request_details`; earlier payments of the sale for that person must be `received`; `requested_at = now()`) and `payment_released → received` (`claimed = true`, `claimed_at = now()`); nothing else | every update of `commissions` |
| `get_shared_listing(p_token uuid)` → jsonb | **anon**, authenticated | The listing behind a valid, unexpired share link that isn't pending / draft: public listing fields, sub-table rows, photos (by `display_order`), agent first / last name, developer name, `nearby_pois`. Never commission, incentives, fact sheet, ids of the owner / developer or contact details. Raises "invalid or has been removed" / "expired" / "not yet available" | `shareService.getSharedListing` |
| `team_completed_sales()` → table (`agent_ID`, `completed_sales`) | authenticated (agents) | Sum of `total_contract_price` of each agent's `complete` sales (totals only) | `genealogyService.getTeamInsights` |
| `sale_upline_snapshot(p_agent_id integer)` → jsonb | **none** of the API roles (owner only) | The agent's upline chain, nearest first, 2 levels: `[{ agent_ID, first_name, middle_name, last_name, position_ID, position }]`, cycle-guarded | `sales_snapshot`, the migration's backfill (`20261106150000_sales_snapshot.sql`) |
| `sales_snapshot()` + trigger `sales_snapshot` (`before insert or update on sales`) | trigger only | Insert: `agent_incentive` / `realty_incentive` from the listing and `upline_snapshot` from the genealogy, replacing whatever the browser sent. Update: keeps the three columns as they were (edits, admins included, can't change them). Commission tabs are unaffected (still from the chain at approval, 7.11) | every write to `sales` |

**Table policies** (all `to authenticated`; "agents" = a signed-in user with an agents row, `current_agent_id() is not null`; "admin" = `current_agent_is_admin()`; `anon` has no table privileges):

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `agents` | agents | — (Edge Function only) | own row or admin, + `agents_guard` | admin, not yourself |
| `positions` | agents | — | admin | — |
| `genealogy` | agents | admin | admin | admin |
| `property_type`, `lot_class`, `condo_class` | agents | — | — | — |
| `main_listings` | agents; pending / draft only owner or admin | as yourself; non-admins `pending` | any listing you can read, + `main_listings_guard` | owner or admin |
| `house_and_lot`, `lot_only`, `condominium`, `memorial`, `listing_images` | with their listing (its read rule) | `can_manage_listing` | `can_manage_listing` | `can_manage_listing` |
| `shared_listings` | agents | agents, for a live listing, with the listing owner's `agent_ID` | — | expired links (any agent), or admin |
| `developers`, `opening_days`, `developer_promos` | agents | admin | admin | admin |
| `sales` | own, sales you have a commission tab on, or admin | as yourself; non-admins `pending approval` | admin, or own while `pending approval` (must stay pending) | admin, or own while `pending approval` |
| `sale_dp_divisions` | with their sale | `can_edit_sale` | `can_edit_sale` | `can_edit_sale` |
| `commissions` | recipient or admin | admin | recipient or admin, + `commissions_guard` | admin |
| `support_tickets` | own or admin | as yourself (+ guard) | admin (+ guard) | — |
| `agent_credentials` | — (no policies, functions only) | — | — | — |

**Storage policies:** `images` (public bucket): read = agents, upload / delete = `can_manage_image(name)`, no update. `fact_sheets` (public bucket): read = agents, upload and update (upsert) = `can_manage_fact_sheet(name)`. `support_attachments` (private): see above. Files in the two public buckets still open by URL for anyone.

⚠ **Do not delete or rotate `agent_password_key`.** Stored initial passwords would become unreadable (agents can still sign in; admins just can't reveal them).

### 9.8 Edge Functions (`supabase/functions/`)

| Function | Auth | Actions (POST JSON `{ action, ... }`) | Writes | Called from |
|---|---|---|---|---|
| `agent-account` (`index.ts`, Deno, `npm:@supabase/supabase-js@2`, service-role client) | Bearer token of a signed-in agent (checked with `auth.getUser(token)` + `agents`, `requireAgent`); `create`, `create-login` and `delete-login` also need `admin_access = true` (`requireAdmin`); otherwise 401/403. CORS allows any origin (the token is the protection). | `create` `{ agent, uplineId, password }` → `{ agent_ID, user_id, email }`; `create-login` `{ agentId, password }` → same; `delete-login` `{ userId }` → `{ deleted }`; **`sync-login-email` `{ agentId }` → `{ changed, email }`** (since 2026-11-06; admins for any agent, an agent only for themselves (403 otherwise); sets the login email to the agent's **saved** `email_address` with `email_confirm`, so no email is sent; 409 if another login uses it; `changed: false` when they match or the agent has no login) | `auth.users` (admin API), `agents` (whitelisted columns only: names, sex, dates, contact, email, address, position, admin flag, configs; `age` derived on the server), `genealogy`, `agent_credentials` (via RPC) | `accountService.createAgentWithLogin/createLoginForAgent/deleteLogin/syncLoginEmail` |

- **Errors** come back as `{ error: "<message for the admin>" }` with 400/401/403/404/409/500; `accountService` shows that message, and maps 404 (not deployed) and network failures to setup hints.
- **Rollback:** `create` deletes the edge, agent and auth user if a later step fails; `create-login` unlinks `user_id` and deletes the auth user.
- **Hierarchy rules are not re-checked** in the function (they live in `genealogyService.checkPlacement`, which runs first in the browser).
- **RLS:** the service-role client bypasses RLS, and the guard triggers let it through (`auth.uid()` is null for it), so creating agents, linking `user_id` and the rollbacks keep working after the RLS hardening. It is the only place `agents.user_id` can be set.
- **Deploying:** 3.3 step 2. The file is not covered by `vue-tsc` (Deno); check it by deploying or with `deno check` (without Deno: `tsc --noEmit` with a small `Deno` declaration and `npm:@supabase/supabase-js@2` mapped to `node_modules/@supabase/supabase-js` through `paths`, how the 2026-11-06 change was checked). Version 2 (with `sync-login-email`) was deployed to the dev project on 2026-11-06 with **Verify JWT** on; a changed email no longer trips `on_agent_password_changed` (it fires on the password hash only).

---

## 10. Function index (where things are stored)

"Used by" lists the files outside the service that call the function.

### 10.1 Services

**`src/services/authService.ts`** (`authService`, `getSessionUser`)

| Function | Purpose | Used by |
|---|---|---|
| `getSessionUser()` | Exported function (not on `authService`): the Supabase Auth user from the stored session (`auth.getSession()`; network only to refresh an expired token) or null | authService, agentService, Dashboard |
| `getCurrentAgent()` | Signed-in agent: `agent_ID`, first/middle/last name, `admin_access` (or null). One `agents` query (the user comes from `getSessionUser`); calls that start while one is running share it (module-private `loadCurrentAgent`, since 2026-11-06; callers only read the result) | Listings, PropertyManagement, SalesReport, Commission, SalesUploadModal, Genealogy page, Support, developerlist |
| `logoutUser()` | `auth.signOut()` → `{ success, error? }` | Sidebar, ChangePasswordModal (login page) |

**`src/services/accountService.ts`** (`accountService`; types `NewAgentAccount`, `AgentLogin`). Logins and passwords; see 7.19, 7.20, 9.7, 9.8.

| Function | Purpose | Used by |
|---|---|---|
| `createAgentWithLogin(agent, uplineId, password)` | Edge Function `create`: login + agent + edge + stored initial password → `{ agent_ID, user_id, email }` | genealogyService.addAgent |
| `createLoginForAgent(agentId, password)` | Edge Function `create-login` for an agent without a login | AddAgentModal (edit) |
| `deleteLogin(userId)` | Edge Function `delete-login` (only logins no agent uses) | genealogyService.deleteAgent |
| `syncLoginEmail(agentId)` | Edge Function `sync-login-email`: login email = the agent's saved `email_address` → `{ changed, email }`; explains an old deployed function ("Unknown action.") | AddAgentModal (edit), ProfileEdit |
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
| `getListings(limit=20, statuses=['active'], ownPendingAgentId?)` | Newest listings with agent, type, developer and thumbnail, mapped to `Property`. The `or()` filter only takes known statuses and a whole-number id | Listings, SalesUploadModal (`limit` 100) |
| `getListingSummary(listingId)` | One listing as a card (`LISTING_CARD_FIELDS`, any status) or null | SalesUploadModal (Sold / Edit) |
| `mapToProperty(row)` | DB row → `Property` (lowest `display_order` image = thumbnail) | internal |
| `getListingPropertyType(listingId)` | `{ typeId, typeName }` | SalesReport, SalesUploadModal |
| `getListingById(id, propertyTypeId)` | Full row + agent, developer, images, matching sub-table | PropertyDetails, PropertyManagement, SalesReport, SalesUploadModal |
| `getAgentFromListing(listingId)` | Owner `agent_ID` (edit check) | Listings |
| `createListing(main, sub, typeId)` | Insert main + sub-table row; deletes the main row if the sub-table insert fails | PropertyManagement |
| `updateListing(id, main, sub, typeId)` | Update main + sub-table | PropertyManagement |
| `uploadPropertyImages(listingId, files, startOrder=1)` | Upload to `images/listings/<id>-...` (`safeFileExtension`) + insert `listing_images` with `display_order` from `startOrder` | PropertyManagement |
| `deleteListingImages(urls)` | Remove from storage + delete `listing_images` rows | PropertyManagement |
| `uploadFactSheet(listingId, file)` | Upload to the `fact_sheets` bucket (`<id>-<ts>-<safeFileName>`) + set `main_listings.fact_sheet`; throws if 0 rows were updated | PropertyManagement |
| `updateListingStatus(id, status)` | Set `main_listings.status` | Listings, SalesReport, SalesUploadModal |
| `deleteListing(id)` | Hard delete | Listings |
| `compileMarkdown(raw)` | Markdown → sanitized HTML | PropertyDetails, PropertyManagement, SharedListing |

**`src/services/shareService.ts`**

| Function | Purpose | Used by |
|---|---|---|
| `generateShareLink(listingId, agentId, daysValid=1)` | Clean up expired links, insert a new `shared_listings` row, return it | PropertyDetails |
| `getSharedListing(token)` | Refuses a non-uuid token, then RPC `get_shared_listing(token)` (public details only); throws its message if invalid, expired or pending. Falls back to `getSharedListingFromTables` (module-private, old table read with only the shown columns) on `PGRST202` | SharedListing |

**`src/services/poiService.ts`** (`poiService`, `POI_CATEGORIES`, `haversineKm`)

| Function | Purpose | Used by |
|---|---|---|
| `getNearbyPois(listingId, lng, lat, { force?, cached?, persist? })` | Cached (30 days, shape-checked) or live Mapbox category search. `cached` = use this cache instead of reading `main_listings`; `persist: false` = don't write it back (shared page) | MapHolder, PropertyDetails (share) |
| `haversineKm(aLng, aLat, bLng, bLat)` | Distance in km | MapHolder |

**`src/services/salesService.ts`** (`salesService`; types `Sale`, `SaleUpline`, `Financing`, `PaymentScheme`)

| Function | Purpose | Used by |
|---|---|---|
| `getSales({ agentId? })` | Sales (newest reservation first) with names filled in and sale numbers; the numbering order loads in parallel (`Promise.all`). Since 2026-11-06 the incentives and `upline_snapshot` come from the sale (`SALE_SELECT`); if those columns are missing (42703, setup step 13 not run) it reads the incentives live from the listing (`SALE_SELECT_LIVE_INCENTIVES`). (The unused `search` option, which built an `or()` filter from text, was removed on 2026-11-05.) | SalesReport |
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
| `fetchSaleOrder()`, `applySaleNumbers(sales, order, perAgent)`, `fillMissingAgentNames()`, `mapToSale()` | Module-private helpers. `fetchSaleOrder` = every sale's id / seller / creation time, oldest first; `applySaleNumbers` is pure (takes that order; keeps `agent_sale_seq` if the order couldn't be read) | internal |

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
| `getRecentAgents(limit=5)` | Newest by `hire_date` (no hire date last), from the shared graph (since 2026-11-06; it ran its own query) | Genealogy page |
| `addAgent(data, uplineId, initialPassword)` | Check hierarchy rules, then `accountService.createAgentWithLogin` (login + agent + edge in the Edge Function) → `{ success, agent_ID, user_id, email }` | AddAgentModal |
| `getAgentById(id)` | Full editable record | Genealogy page |
| `updateAgent(id, patch)` | Patch fields only (no rule checks); throws if 0 rows changed (RLS) | internal |
| `setUpline(downlineId, uplineId)` | Check rules and loops, replace edge | unused (prefer `updateAgentAndUpline`) |
| `replaceUplineEdge(downlineId, uplineId)` | Delete and insert the edge, no checks | internal |
| `updateAgentAndUpline(id, patch, uplineId)` | Save fields + upline with rules; returns `{ detached }` | AddAgentModal |
| `getTeamInsights()` | Per agent: rank, accumulated sales (completed-sales totals from RPC `team_completed_sales`, via module-private `completedSalesByAgent`, which falls back to reading `sales` on `PGRST202`), progress, override split | TeamInsights, tree |
| `promoteAgent(agentId)` | Admin-confirmed promotion to the next rank | TeamInsights |
| `getRankPositions()` | The 4 ranks with rate and threshold | TeamInsights |
| `setPromotionThreshold(positionId, value)` | Save a threshold (0 or more, or null); throws if 0 rows changed (not an admin) | TeamInsights |
| `getAgentReferences(id)` | Counts of sales, listings, share links | internal |
| `deleteAgent(id)` | Blocked delete with downline re-parenting; `.select()` check on the agent delete; then removes the login (`accountService.deleteLogin`) | Genealogy page |
| `fetchGraph()`, `checkPlacement()`, `toAgent()` | Module-private helpers. `fetchGraph` (agents + genealogy + positions, via `loadGraph`) and `completedSalesByAgent` share a load that is already running (since 2026-11-06), so the Genealogy page fetches the three tables once instead of six times; nothing is kept after a load finishes, and callers only read the result | internal |

**`src/services/developerService.ts`** (`developerService`, `reformatHours`; module-private `imagesPathFromUrl`, `removeImageFiles` (best-effort removal from the `images` bucket, logged))

| Function | Purpose | Used by |
|---|---|---|
| `getDevelopers()` | Developers with office hours (grouped), 3 recent projects, promos | developerlist, PropertyManagement |
| `getDeveloperNames()` | Sorted names | Listings, SalesUploadModal |
| `addDeveloper(dev)` | Insert developer + `opening_days` (`officeHourRows`); returns `dev_ID`; throws a readable error if either fails | addDeveloper |
| `updateDeveloper(dev, oldHours)` | Update (throws if 0 rows), then upsert the new `opening_days` rows on `(id, day)` and delete the days no longer picked (`not.in` over names from the fixed `days` list). A refused upsert changes nothing, so the old hours stay; throws a readable error either way. `oldHours` is unused | addDeveloper |
| `uploadImage(devId, file)` | `images/developers/` → URL (`''` on error) | addDeveloper |
| `deleteDeveloper(dev)` | Refuses (throws) if listings use the developer; deletes `opening_days`, then the developer (throws if 0 rows); then removes its picture and poster files (since 2026-11-06) | developerlist |
| `removeReplacedImage(oldUrl, newUrl)` | After an edit: removes the old picture's file when it was replaced or removed | addDeveloper |
| `discardUploadedImage(url)` | Removes a picture uploaded for a save that failed | addDeveloper |
| `officeHourRows(devId, slots)` | Module-private: one `opening_days` row per day; skips slots without days / times or marked Unavailable; first slot wins for a repeated day | internal |
| `uploadPromoImage(devId, file)` | `images/developer_promos/` → URL | addDeveloper |
| `addPromo(devId, promo)` | Insert a promo row → `promo_ID` | addDeveloper |
| `deletePromo(promo)` | Delete the row (checked: 0 rows = stop), then its file (since 2026-11-06; it used to remove the file first) | addDeveloper |
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
| `utils/liveRefresh.ts` | `useLiveRefresh(reload, tables, opts)` (stops on `SIGNED_OUT`, skips a reload without a session; 5.6) | Dashboard, Commission, Genealogy page, tree, TeamInsights, Support |
| `utils/clockTime.ts` | `formatClockTime(time)`: `"08:00:00"` → `"8:00 AM"` (seconds dropped; non-times returned as they are). Replaces the unused private `formatHours` of developerService | developerCard |
| `utils/sanitize.ts` | `cleanText(value, max)`, `cleanMultilineText(value, max=2000)` (keeps line breaks; drops control characters and invisible direction overrides, trims each line, max one blank line), `cleanMarkdownText(value, max=20000)` (keeps every line as typed: indentation, two-space line breaks; drops control characters and direction overrides, trims the ends), `normalizeEmail`, `isValidEmail`, `isValidPhone`, `isIsoDate`, `digitsOnly`, `finiteNumber(value, fallback)`, `safeFileExtension(name, fallback='bin')`, `safeFileName(name, max=100)`, `EMAIL_PATTERN`, `PHONE_PATTERN` | AddAgentModal, LoginForm, ChangePasswordModal (the Edge Function repeats the same rules); ticketService, TicketDetailsModal (`cleanMultilineText`); PropertyManagement, SalesUploadModal, PaymentRequestModal, ProfileEdit, addDeveloper; the upload services (`safeFileExtension` / `safeFileName`) |
| `utils/saleStatus.ts` | `saleStatusClass(status)`: sale status pill colours | SalesReport, SaleDetailsModal |
| `utils/deviceInfo.ts` | `describeDevice()` → e.g. "Chrome 130 · Windows · window 1536×730 · screen 1920×1080 · dark mode" | RaiseTicketModal |
| `utils/password.ts` | `INITIAL_PASSWORD_LENGTH` (14), `MIN_PASSWORD_LENGTH` (8), `MAX_PASSWORD_LENGTH` (72), `agentInitials`, `generatePasswordTail`, `buildInitialPassword`, `passwordRules`, `isStrongPassword`, type `PasswordRule` | AddAgentModal, PasswordReveal, ChangePasswordModal |

### 10.3 Classes and constants (`src/assets/classes/`)

| File | Exports |
|---|---|
| `agent.ts` | `AgentProfile`, `positionMap`, `getAge(birthDate)` |
| `commission.ts` | `PayUnit`, `DpDivision`, `CommissionPaymentScheme`, `CommissionChain`, `CalculateCommissionPayload`, `CommissionScheduleItem`, `CommissionSummary`, `CommissionCalculationResult` |
| `developers.ts` | `DeveloperProject`, `DeveloperPromo`, `Developer`, `DayOption`, `days`, `OfficeHourSlot` |
| `listings.ts` | `Property`, `Lot`, `HouseAndLot`, `Condominium`, `Memorial`, `Images`, `formattedPropertyType(type)` |
| `ticket.ts` | `TicketStatus`, `TICKET_STATUS_LABEL`, `TicketCategory`, `TICKET_CATEGORIES` (label, hint, title example, `isIssue`), `TicketFrequency`, `TICKET_FREQUENCIES`, `TICKET_AREAS`, `MAX_OPEN_TICKETS` (3), `MAX_TICKET_IMAGES` (3), `MAX_TICKET_IMAGE_MB` (5), `MIN_TICKET_STEPS` (2), `TICKET_IMAGE_TYPES`, `TICKET_TEXT_LIMITS`, `NewTicket`, `SupportTicket`, `ticketNumber`, `categoryOption`, `categoryLabel`, `isIssueCategory`, `frequencyLabel`, `charCount`, `countSteps`, `imageProblem`. **Keep the limits in step with the migration.** |

### 10.4 Components (props → emits)

| Component | Props | Emits | Used in |
|---|---|---|---|
| `Sidebar` | — | — | App |
| `listings/PropertyCard` | `details?: Property`, `isLoading?` | — | Listings |
| `listings/PropertyDetails` | `prop_id`, `prop_type`, `isAdmin?`, `currentAgentId?` (owner check for EDIT / DELETE), `readOnly?` (hides edit / delete / sold / approve) | `close-details`, `edit`, `delete`, `sold`, `approve`, `share` | Listings, developerlist (read-only); both through `defineAsyncComponent` (loaded on first open) |
| `listings/ListingsFilter` | `choices`, `modelValue` | `update:modelValue` | Listings |
| `listings/MapHolder` | `targetLocation?`, `listingId?`, `cachedPois?`, `readOnlyCache?` (shared page: use `cachedPois`, never write the cache) | — | PropertyDetails, SharedListing |
| `listings/MapInteractive` | `targetLocation?` (`lng`, `lat`, `loc`) | `update:targetLocation` (`lng`, `lat`, `name`) | MapPickerModal |
| `listings/MapPickerModal` | `location` (`lng`, `lat`, `loc`) | `close`, `picked` (`lng`, `lat`, `name`) | PropertyManagement |
| `sales/SalesUploadModal` | `lockedListing?`, `editSale?` | `close`, `saved` | SalesReport, Listings |
| `sales/SaleDetailsModal` | `sale`, `isAdmin`, `canEdit` | `close`, `edit` (sale), `delete` (sale) | SalesReport |
| `commissions/PaymentRequestModal` | `tab`, `agent` | `close`, `submitted` | Commission |
| `commissions/ReleasePaymentModal` | `tab`, `adminAgentId` | `close`, `released` | Commission |
| `commissions/ProofModal` | `tab`, `canConfirm` | `close`, `received` | Commission |
| `commissions/ConfirmActionModal` | `title`, `message`, `confirmLabel?` ('Yes'), `cancelLabel?` ('No'), `busyLabel?`, `tone?` ('blue' \| 'green'), `busy?`, `error?`, `requiredPhrase?`; default slot = summary box | `confirm`, `cancel` | Commission (approve), ProofModal (received), RaiseTicketModal (discard), TicketDetailsModal (resolve, reopen) |
| `dashboard/DashboardStatCard` | `stat: Metric` | `click` | Dashboard |
| `dashboard/MetricDetailsModal` | `metric: Metric` | `close` | Dashboard |
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
| `developer/developerCard` | `dev: Developer`, `canManage?` (shows Edit / Delete) | `delete-developer`, `edit-developer`, `contact-developer`, `open-listing`, `open-promo` | developerlist |
| `developer/DeveloperCardSkeleton` | — (layout only; mirrors developerCard) | — | developerlist (first load) |
| `developer/addDeveloper` | `dev?: Developer` | `close-add-developer`, `saved` | developerlist |
| `developer/PromoPosterModal` | `promo: DeveloperPromo` | `close` | developerlist |
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

Verified by reading the code on 2026-10-28 and again on 2026-11-05 (full read for the RLS hardening and bug pass). Line numbers are approximate. **Remove an item once it is fixed** (see 1.7).

### 11.1 Listings and Property Management
- **Only 20 listings load.** `Listings.vue` calls `getListings(20, ...)`, so the grid, search and filters only ever see the 20 newest listings. (The limit came with the "ListingsLag" fix, so raising it needs paging or a server-side search, not just a bigger number.)
- The Listings filters Rooms, Bedrooms, Bathrooms, Lot Area, Class and Memorial Type are not applied.
- `Listings.vue` binds `@edit` / `@delete` on `PropertyCard`, but the card never emits them.
- Clubshare and Golfshare have no sub-table. Bulk listings still write a sub-table row with the form's default values.
- Admins can only edit their own listings in the UI (owner check), although RLS would let them edit any listing.
- Replaced or removed listing photos, profile pictures and (since 2026-11-06) developer pictures and posters are deleted from storage by their own flows; payment-proof files are not (11.2).

### 11.2 Sales and commissions
- **Deleting a sale deletes its commission history.** `commissions` and `sale_dp_divisions` cascade, so received commissions are deleted too. It also sets the listing back to `active` (after the delete since 2026-11-05).
- Tabs are not regenerated when a sale is edited after approval (by design; see 7.11).
- Proof-of-payment images are public URLs (the `images` bucket is public; the storage policies only control who uploads and deletes).
- Deleting a sale (or cancelling it) leaves its proof-of-payment files in `images/payment-proofs/`; nothing in the app deletes them (found in the 2026-11-06 smoke test). Remove them in Storage by hand if needed.
- An agent's Team Insights / tree hears about another agent's completed sale on the next focus or 60 s poll, not instantly (realtime applies RLS, 5.6).

### 11.3 Genealogy and agent accounts
- A login email that **already differed** from `agents.email_address` before 2026-11-06 is only brought in line by the next email edit of that agent (the sync runs when the email changes). Another login already using the new email is refused (409): the agent's row keeps the new email and the save says the login email was not changed.
- **Nothing works until the Supabase setup is done** (3.3): without the migration, Edit Agent says to run it; without the Edge Function, Add Agent says it is not deployed; without the `{{ .Token }}` email template and SMTP, password codes don't arrive. Without step 10 the old open policies stay in place.
- **The recovery code is also a sign-in.** After the code is verified, the user has a session. On the Login page the modal ends it when finished or closed, but reloading the page mid-flow leaves the user signed in without having changed the password (the Dashboard reminder still shows for an initial password).
- The Edge Function doesn't re-check the hierarchy rules; it trusts `genealogyService.checkPlacement`, which runs first in the browser.

### 11.4 Developers
- The Contact button's event isn't handled (what it should do, email or call, isn't decided).
- `developers.available_days`, `open_hours` and `close_hours` are unused (office hours live in `opening_days`). `reformatHours` is unused.
- An office-hours slot marked "Unavailable" is not stored (the `opening_days` times are NOT NULL), so the day simply doesn't appear on the card. Showing "Unavailable" would need nullable times (a migration) and a mapping in `getDevelopers`.

### 11.5 Data-shape traps
- UI and DB field names differ (9.5), and the lookup ids are hard-coded in many files (9.4).
- Sub-table embeds may come back as an array or as an object; normalize them.
- `sales.agent_sale_seq` is never written; the sale numbers are computed in `applySaleNumbers`.
- Commission role labels (`Upline 1/2/3`) are not ranks. Read `recipient_rank` for the rank.
- `get_shared_listing` returns a hand-picked set of listing fields: a new field the shared page needs must be added to the function too (7.7).

### 11.6 Settings and UI
- `currentCurrency` and `currentUnit` are set once, at module load. Changing the default in Settings only applies after a reload; the Listings dropdowns change them for the session only.
- Logout doesn't clear `localStorage['app_user_settings']`.
- The Commissions page and its request/release/proof modals have no dark-mode styling. (`ConfirmActionModal` and the Commissions toast have it, so they turn dark over a light page when dark mode is on. `AddAgentModal` got dark mode on 2026-11-04.)
- The Commissions page still uses `alert()` after a payment request, a release and a receipt; only Approve uses the toast.
- **Lazy-loaded pages (2026-11-05):** a page opened before the background prefetch has fetched it (in the first ~2 s after sign-in, or on a slow connection) downloads its chunk first, so the click waits a moment. A tab left open across a deploy reloads the page once when it next navigates (5.2). The shared listing page still waits for Mapbox before it renders (its map is part of the page).

### 11.7 Security (pre-launch)
- **RLS is real on every table since 2026-11-05** (9.7) once 3.3 step 10 is run. What it doesn't cover:
  - **Agents read every agent's row**, personal details included (address, birth date, phone, email). The app needs everyone's names for the tree, listings and sales; RLS works on rows, not columns. Hiding the personal columns would need a narrower view or function for "team" reads.
  - Files in the public `images` and `fact_sheets` buckets (listing photos, profile and developer pictures, promo posters, payment proofs, fact sheets) open by URL for anyone who has the URL. Only uploads and deletes are restricted.
  - Realtime DELETE events aren't filtered by RLS (a subscriber can learn that a row id was deleted, not its contents).
- **Public sign-ups** must be turned off in Supabase (3.3 step 6). With step 10 a login without an agents row reads nothing, but it shouldn't exist.
- Admins can read an agent's **initial** password until it is changed (by design, 7.19). It is encrypted at rest with a Vault key and only decrypted by `admin_get_agent_login` for an admin.
- Admins are trusted: RLS lets them change most columns of any row (the UI still follows the business rules).

### 11.8 Dead code and unused dependencies
- Unrouted or unused files: `views/DashboardPrevious.vue`, `components/test.vue`, `components/modal.vue`, `components/dashboard/AddListing.vue`, `components/dashboard/Calculator.vue` (both now say so in a comment), `services/lookupService.ts`, `babel.config.js`, and the images `src/assets/images/profile.png`, `sample-house.jpg`, `public/profile.png` (not imported, so not bundled).
- Unused functions: `salesService.getSaleById`, `getTotalSales`, `generateSchedulePreview`, `calculateCommissionableAmount`; `genealogyService.setUpline`; `reformatHours` in `developerService.ts` (its unused private `formatHours` became `utils/clockTime.ts` on 2026-11-06).
- Intentionally kept "unused" imports: the Sidebar's `Ticket` / `Mail` / `Trophy` icons (commented-out links) and Support's `raiseBlockedReason` (commented-out header button); both are labelled in the code. Unused imports elsewhere were removed on 2026-11-05.
- `npm audit` (2026-11-06): 2 moderate left, `postcss-selector-parser` through `@tailwindcss/typography` (build time only, nothing reaches the browser). npm's only offered fix downgrades `@tailwindcss/typography` to 0.5.4, so it was left alone.

### 11.9 IT support tickets
- **No notifications.** Nobody is told when a ticket is raised or changes status: no email and no Dashboard alert or reminder. Admins have to open IT Support, and users have to check their tickets. (Possible next step: an admin reminder "n tickets waiting for review" and an agent alert "your ticket was resolved" in `dashboardService.buildDashboard`.)
- **No conversation.** There is one resolution note per resolution; users can't reply on a ticket. A user whose problem came back asks IT to reopen it, or raises a new ticket that mentions the number (the 3-open limit still applies).
- **Orphan uploads.** Screenshots are uploaded before the ticket row is inserted. If the browser closes between the two steps, the files stay in the user's folder of `support_attachments` without a ticket (only readable by that user and admins). Clean up by hand if needed.
- **Storage policies are OR-ed.** An older `storage.objects` policy without a `bucket_id` condition would widen access to the private screenshots (3.3 step 9; the RLS hardening only removes the `images` / `fact_sheets` ones).
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
| **RLS (row level security)** | Postgres rules (policies) deciding which rows each signed-in user may read and write. Since 2026-11-05 every table has real policies; signed-out visitors (`anon`) get none. |
| **Guard trigger** | A `before insert / update` trigger that enforces what a policy can't, such as which columns a non-admin may change (`agents_guard`, `main_listings_guard`, `commissions_guard`, `support_tickets_guard`). |
| **Share token** | The random uuid (`shared_listings.share_id`) in a shared listing link; `get_shared_listing(token)` opens it for clients who aren't signed in. |

---

## 13. Recent changes and doc discrepancies

### 13.1 What `documentation.md` added, mapped to this file

| `documentation.md` entry | Summary | See |
|---|---|---|
| 2026-11-06: Smoke-test follow-ups | Sales keep their upline and incentives as recorded (`sales_snapshot`, step 13); login email follows email edits (`sync-login-email`, step 2 redeploy); developer picture / poster files removed with the developer or when replaced; Genealogy loads shared (24 → 7 requests) and Team Insights reloads after agent changes; live refresh stops on sign-out; Esc closes the listing overlay and fullscreen map; office hours without seconds | Header, 3.3, 5.6, 7.4, 7.8, 7.9, 7.10, 7.13, 7.15, 7.17, 7.19, 9.2, 9.6, 9.7, 9.8, 10.1, 10.2, 11.1, 11.3, 11.4, 11.8 |
| 2026-11-06: RLS hardening smoke test, Holiday office hours | RLS smoke test (3.3 step 10) passed on the live project (browser + 153 rolled-back SQL checks); migration `20261106130000_day_enum_holiday.sql` (3.3 step 12); `updateDeveloper` saves office hours before removing dropped days, so a refused save keeps the old hours; leftover proof / developer picture files noted | Header, 3.3, 4, 7.15, 9.2, 9.3, 9.6, 10.1, 11.2, 11.4, 13.2 |
| 2026-11-06: Upload limits for the public storage buckets | `images` accepts only raster images (no SVG) up to 10 MB; `fact_sheets` up to 20 MB; setup step 11; applied to the dev project | 3.3, 5.4, 9.6, 11.7 |
| 2026-11-06: Dependency cleanup and security updates | Unused dependencies removed, `dompurify` 3.4.17, `npm audit fix` (13 → 2 build-time moderates), `VITE_MAPBOX_TOKEN` in `.env.example`. No code or database changes | 3, 3.1, 4, 11.8, 13.2 |
| 2026-11-05: Skeleton loading, faster page loads, code cleanup | Skeletons on Sales Report, Developer List (`DeveloperCardSkeleton.vue`), Commissions, IT Support; every page lazy-loaded + background prefetch + stale-chunk reload; `PropertyDetails` loaded on first open; session read locally (`getSessionUser`); parallel sale numbering; `firstOpenPayment` map; lazy developer images; smaller login background and logos; font preconnect; login background path case fix; unique sidebar keys; debug logs, unused imports and duplicates removed; header comments everywhere. No database changes | 1.2, 1.3, 1.6, 4, 5.1, 5.2, 5.8, 7.1, 7.2, 7.4, 7.9, 7.12, 7.15, 7.21, 10, 11 |
| 2026-11-05: RLS hardening, bug fixes, modal components | Real RLS on every table + guard triggers + storage policies (`20261105120000_harden_rls.sql`), `get_shared_listing` for signed-out clients, `team_completed_sales`; POI popup XSS fix; admin-only developers / thresholds / promote in the UI; owner/admin listing actions; Property Management, sale form (bulk unit details), Sales Report, Profile (address), developer list, Settings, amortization fixes; input cleaning everywhere (`cleanMarkdownText`, file names); four inline modals moved into components | 1.2–1.6, 3.3, 4, 5.1–5.8, 6, 7.3–7.18, 8.1–8.3, 9.1, 9.6–9.8, 10, 11, 12 |
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
| `.env.example` lists 2 variables | 3 are required (`VITE_MAPBOX_TOKEN` too); `.env.example` lists all 3 since 2026-11-06 |
| This file (9.2, 9.3, before 2026-11-06): `day_enum` includes `Holiday` | The live enum had only `Monday` … `Sunday`, so a Holiday slot failed to save (and wiped the developer's hours). `20261106130000_day_enum_holiday.sql` adds it (3.3 step 12) |

---

## 14. Changelog of this file

Add one line per update, newest first: `YYYY-MM-DD: what changed (sections)`.

- **2026-11-06:** Smoke-test follow-ups: sales snapshot (`sales.agent_incentive` / `realty_incentive` / `upline_snapshot`, `sales_snapshot` trigger, `sale_upline_snapshot`, migration `20261106150000_sales_snapshot.sql`, setup step 13); `agent-account` `sync-login-email` (+ `requireAgent` / per-action admin check, `accountService.syncLoginEmail`, Edit Agent and Profile); developer image files removed on delete / replace / failed save, poster row deleted before its file; Genealogy shared loads and Team Insights reload; live refresh stops on sign-out; Esc on the listing overlay and fullscreen map; `utils/clockTime.ts` for office hours; known issues 11.1, 11.3, 11.4, 11.8 updated (header, 3.3, 5.6, 7.4, 7.8, 7.9, 7.10, 7.13, 7.15, 7.17, 7.19, 9.2, 9.6, 9.7, 9.8, 10.1, 10.2, 11, 13.1).

- **2026-11-06:** RLS hardening smoke test passed on the live project (result under 3.3); `Holiday` office hours: migration `20261106130000_day_enum_holiday.sql` (new setup step 12, run on the live project the same day) and `updateDeveloper` upserts the new hours before deleting dropped days (a refused save keeps the old hours); corrected the `day_enum` values; leftover payment-proof and developer-picture files listed as known issues (header, 3.3, 4, 7.15, 9.2, 9.3, 9.6, 10.1, 11.2, 11.4, 13.1, 13.2).

- **2026-11-06:** Upload limits on the public buckets (migration `20261106120000_storage_upload_limits.sql`: `images` raster types only, no SVG, 10 MB; `fact_sheets` 20 MB), setup step 11, applied to the dev project (header, 3.3, 5.4, 9.6, 11.7, 13.1).

- **2026-11-06:** Removed unused dependencies (`chart.js`, `@types/chart.js`, `lucide`, `next`, `dagre`, `@types/dagre`, `@vue-flow/background`); `dompurify` raised to `^3.4.17` (security fixes); `npm audit fix` (13 advisories down to 2 build-time moderates); `VITE_MAPBOX_TOKEN` added to `.env.example` (header, 3, 3.1, 4, 11.8, 13.2).

- **2026-11-05:** Skeleton loading on the Sales Report, Developer List, Commissions and IT Support pages (+ the skeleton convention); lazy-loaded pages with background prefetch, stale-chunk reload and the Sidebar's `routerReady`; `PropertyDetails` as an async component; `getSessionUser()` instead of `auth.getUser()`; parallel sale numbering; `firstOpenPayment`; lazy developer images; compressed login background and logos (and the `LoginFormBG.png` case fix); unique sidebar keys; debug logs and unused imports removed; header-comment and no-`console.log` conventions; UI testing with a mock Supabase; team confirmed the migrations (incl. `support_tickets`) are applied (header, 1.2, 1.3, 1.6, 4, 5.1, 5.2, 5.8, 7.1, 7.2, 7.4, 7.9, 7.12, 7.15, 7.21, 10.1, 10.3, 10.4, 11.4, 11.6, 11.8, 13.1).

- **2026-11-05:** RLS hardening (migration `20261105120000_harden_rls.sql`: real policies on every table and the `images` / `fact_sheets` buckets, `agents_guard` / `main_listings_guard` / `commissions_guard`, helpers, `get_shared_listing`, `team_completed_sales`, setup step 10, verification and smoke test); shared page through the function with a read-only POI cache; POI popup XSS fix; admin-only developer management, thresholds and promotion in the UI; owner/admin listing buttons; bug fixes in Property Management, the sale form, Sales Report, Listings, Profile, developers, Settings, amortization, `/commissions` guard; input cleaning helpers and file-name cleaning; Sale Details, Dashboard metric, promo poster and map picker modals moved into components; known issues re-checked (header, 1.2, 1.3, 1.4, 1.5, 1.6, 3.3, 4, 5.1, 5.3, 5.4, 5.6, 5.8, 6, 7.3–7.8, 7.9, 7.10, 7.12–7.18, 8.1, 8.2, 8.3, 9.1, 9.6, 9.7, 9.8, 10.1, 10.2, 10.4, 11, 12, 13.1).

- **2026-11-04:** IT support tickets: `/support` page, Raise a Ticket form, ticket popup with admin review / resolve / reopen, `ticketService`, `ticket.ts`, `cleanMultilineText`, `deviceInfo.ts`, migration `20261104160000_support_tickets.sql` (`support_tickets` with real RLS, `support_tickets_guard`, `current_agent_id`, private `support_attachments` bucket, realtime), new setup steps 8–9 (header, 1.3, 1.4, 1.5, 2, 3.3, 4, 5.1, 5.2, 5.3, 5.4, 5.6, 5.8, 6, 7.2, 7.21, 8.8, 9.1, 9.2, 9.3, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 11.7, 11.9, 12, 13.1).

- **2026-11-04:** Agent accounts: login creation through the `agent-account` Edge Function, `agent_credentials` + Vault + SQL functions + `auth.users` trigger, initial-password reveal, create login for older agents, login removal on delete, admin-only Add/Edit/Delete agent, Dashboard Add Agent uses the Genealogy modal (placeholder deleted), red initial-password reminder, change password with an email code, `sanitize.ts` / `password.ts`, new Supabase setup section (header, 1.2–1.5, 2, 3, 3.3, 4, 5.1, 5.3, 5.8, 6, 7.1, 7.3, 7.13, 7.19, 7.20, 8.6, 8.7, 9.1, 9.2, 9.6, 9.7, 9.8, 10.1, 10.2, 10.4, 11.3, 11.6, 11.7, 12, 13.1).

- **2026-11-03:** Commissions: admin "Other Agents" view, "You" badge, Approve confirmation popup + bottom-right toast, admins can request/receive payment on their own tabs, typed "I have received payment" check, new `ConfirmActionModal` (2.1, 4, 5.8, 6, 7.12, 8.3, 10.4, 11.6). Shared listing: bulk price range, single-only type features, photo order, dark mode (5.8, 7.7, 10.1, 11.6).
- **2026-11-03:** Sale form fills DP division dates automatically (7.10).
- **2026-11-03:** Commission pool is now the gross commission itself (extra 5% removed); sale form defaults the Commission Rate to 5% when the listing has none (7.10, 8.4).
- **2026-10-28:** Recorded team answers: the 5% formula stays unconfirmed (8.4); the approval date is the correct due-date anchor, so the sale form's wording is the bug (11.2, 13.2); agent and developer management is meant to be admin-only (6, 7.13, 7.15, 11.3, 11.4).
- **2026-10-28:** Created from a full read of the codebase (branch `feature/sales-report-v2` @ `859ea5d`), the project PDF and `documentation.md`. Type-check verified clean.
