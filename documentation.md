# Documentation

Running record of changes and additions, one entry per session (newest first).
Rules: log only what changed or was added; no repeats of earlier entries; no restating unchanged code.

---

## 2026-10-15 - Dashboard cards, genealogy card, commissions page updates
- **Changed:** Dashboard cards. Row 1: Total Sales (approved sales = awaiting payment or complete, by reservation date; opening it goes to the Sales Report), Total Received Commission, Listings. Row 2 (one row): Receivables (commission not yet received), Ready to Request, Awaiting Approval. The old Gross, Properties Sold and per-sale Receivables cards are gone. `Metric` gains an optional `link`.
- **Changed:** Sales Performance shows approved sales per month (live from `sales`, 7 months ending at the selected month, by reservation date) and the average contract price of the selected month.
- **Changed:** Genealogy card: upline is the whole chain above (direct upline first); downline is everyone below at any depth with their rank, so a Supervisor or Investment Manager sees every Specialist under them.
- **Hidden:** Recent Activity is commented out in `Dashboard.vue` (template block and import), not removed; `activities` is still built by `dashboardService`.
- **Changed:** Commissions page: every card uses one grid so columns line up whatever the status (2 columns on phones, 3 on tablets); a payment index (1/12, 2/12 ...) sits on the left. A payment can't be requested until the earlier payments of that sale (same person) are received (button disabled with a note; also checked in `commissionService.requestPayment`).
- **Changed:** Request Payment popup: **Edit details** lets the agent correct names, client, project, developer and reservation date (**Reset** restores them). Contract price, role/rank, payment number, due date and commission amount are locked.
- **Already in place (changed in parallel, not by this entry):** Financing only for DP, no Sale # input with automatic numbering, Commissionable Amount + editable Commission Rate, Voucher Series commented out, Remarks hint by property type. The migration's section 7 adds `sales.commissionable_amount`.
- **Changed:** Sale numbers (`applySaleNumbers`): an agent's own list numbers only their sales (Sale 1..n by creation date); the admin's all-agents list numbers across every sale.
- **Notes:** `vue-tsc` shows only the existing `PropertyDetails.vue` error.

---

## 2026-10-14 - Commission payment flow (approve, request, release, receive)
- **Changed:** "Claim" is replaced by a status flow on every commission: `pending_approval` (Awaiting Approval) -> `approved` -> `payment_requested` -> `payment_released` -> `received`. Only `received` sets `claimed` / `claimed_at`, so it is the only status counted in received commissions and receivables.
- **Flow:** (1) Admin approves; the agent gets a Dashboard alert. (2) The agent presses **Request payment** (once the due date is reached or the sale is complete): a popup shows first / optional middle / last name (from their account) and the sale details, all filled in automatically; **Submit details** sends them to the admin. (3) The admin presses **Release payment**: a popup shows the request and requires at least one image (attach several, or paste with Ctrl+V); **Send proof of payment** stays disabled until one is attached. (4) The agent is alerted, opens the tab to see the images, and presses **Received payment**.
- **Added:** `src/components/commissions/PaymentRequestModal.vue`, `ReleasePaymentModal.vue`, `ProofModal.vue`.
- **Changed:** `commissionService`: `CommissionStatus` + `STATUS_LABEL`, tabs carry status, request details, release time and `proof_urls`; `requestPayment`, `releasePayment` (uploads to the existing `images` bucket under `payment-proofs/`), `confirmReceived` replace `claimTab`. Each step only moves a tab from the expected previous status.
- **Changed:** `Commission.vue`: filters per status (Awaiting Approval, Approved, Payment Requested, Payment Released, Received), per-status buttons by role, copy now says "received". `authService.getCurrentAgent` also returns `middle_name`.
- **Changed:** Dashboard: alert banner (agent: commission approved, proof of payment sent; admin: payment requests to release, approvals waiting); cards renamed Receivables Received, Commissions Received, Ready to Request; Commission History uses the new statuses.
- **Migration (re-run, then `notify pgrst, 'reload schema'`):** `commissions.status` (with check), `requested_at`, `request_details`, `released_at`, `released_by`, `proof_urls`; existing claimed tabs become `received`, approved ones `approved`.
- **Roles:** Request payment and Received payment are agent-only (an admin account never sees them, even on their own tabs, and gets no personal payout alerts); Approve and Release payment are admin-only. Name fields in the request popup are aligned on one row.
- **Fixed:** `commissions.released_by` added a second link to `agents`, so the tab query's `agents` embed became ambiguous; it now names `agents!recipient_agent_ID`.
- **Notes:** Proof images are public links in the `images` bucket (same as profile pictures). Who may do each step is enforced in the app, not by RLS (still the open dev policy). Cancelling a sale still removes tabs that are not yet received. `vue-tsc` shows only the existing `PropertyDetails.vue` error.

---

## 2026-10-14 - Roles, role-based commissions, sale form, live dashboard
- **Added:** Ranks (`src/utils/ranks.ts`): Specialist, Supervisor, Investment Manager, Partner Broker, read from the `positions` table (id fallback 1-4; `positionMap` gains 4 = Partner Broker).
- **Added:** `src/utils/commissionAllocation.ts`, the split of one payment: Agent = raw x 3/4 x (position rate / 5) (3% 3/5, 3.5% 7/10, 4% 4/5, 4.5% 9/10). Overrides = raw x 3/4 x %, paid to the first ancestor of each higher rank: Specialist seller (Supervisor 10%, IM 10% or 20% if the IM is the direct upline, Broker 10%), Supervisor seller (IM 10%, Broker 10%), IM seller (Broker 10%), Broker seller (none). Specialists never earn overrides. Labels: Upline 1 / Upline 2 (Supervisor, IM, nearest first), Upline 3 = Partner Broker; the rank is stored separately.
- **Changed:** `commissionService.calculateSchedule` returns per-payment `payouts` (no fixed agent/upline fields), supports `Deferred-Cash` (12 equal monthly payments) and takes `firstDueDate` + `chain`. `salesService.generateCommissionTabs` uses `genealogyService.getRoleChain` (whole upline chain with ranks), Spot-Cash due 1 month after the reservation, Deferred-Cash first due 1 month after, and saves `recipient_rank`.
- **Added:** `commissionService.summarizeTabs`; tabs carry `rank` and `payment_total`.
- **Changed:** Sale form: Commission Rate (%) (prefilled from the listing, admin-only edit, new `sales.commission_rate`) drives a read-only Gross Commission = contract price x rate. Spot-Cash clears and disables Financing (not required, saved as null). New payment scheme "Deferred Cash". Bulk House & Lot form gains Block / Lot / Phase; bulk Condo gains Floor. Sales Report property details show block/lot/phase, unit no. and floor; details also show the commission rate and Deferred Cash.
- **Changed:** `Commission.vue`: receivables header (claimed of total, pending, bar; admin "All Agents" adds a per-agent claimed / total list), per-sale filter showing collected vs yet to collect, Rank under Role, "Payment n of N".
- **Changed:** Dashboard: new "Receivables Claimed" card (claimed / total, linked to the Commissions data), new Commission History panel (`CommissionHistory.vue`, sale + status filters, "Payment n of N"), and the popups list the payment number.
- **Added:** `src/utils/liveRefresh.ts` (`useLiveRefresh`): Supabase realtime on the listed tables, debounced, plus reload on focus and every 60 s. Used by Dashboard, Commissions, Genealogy page and tree.
- **Added:** Genealogy rules in `genealogyService` (add, edit, `setUpline`): Partner Broker has no upline; an Investment Manager can only report to a Partner Broker; one Supervisor per team (team = everything below the topmost non-broker); promotion to IM detaches from a non-broker upline (to Broker: from any). The Add/Edit Agent upline list is filtered by the chosen position.
- **Added:** `TeamInsights.vue` on the Genealogy page: accumulated sales (own + all below completed sales), progress to the next rank, admin-confirmed Promote button, editable thresholds, and the commission split on each agent's sales. Tree nodes show accumulated sales and progress.
- **Migration (re-run, then `notify pgrst, 'reload schema'`):** `positions.promotion_sales_threshold`, ranks and rates (Partner Broker 4.5), `sales.commission_rate`, `payment_scheme` allows `Deferred-Cash`, `commissions.role` allows `Upline 3`, `commissions.recipient_rank`, realtime publication for sales, commissions, main_listings, genealogy, agents.
- **Notes:** Promotion thresholds start empty (set them on the Genealogy page). Tabs generated before this change keep old roles; clear with `delete from public.commissions;` and re-save the sale as Awaiting Payment. Allocation and hierarchy rules were checked with stubbed node tests; `vue-tsc` shows only the existing `PropertyDetails.vue` event-name error.

---

## 2026-10-14 - Dashboard connected to sales, commissions, listings, genealogy
- **Added:** `src/services/dashboardService.ts`: `getDashboardData` loads sales, listings and commission tabs; `buildDashboard` turns them into the cards, chart, activity and reminders. Month filter, previous-month trends and the admin scope all use it.
- **Added:** `sales.completed_at` (in the combined migration, with a backfill). The sale form stamps it when an admin moves a sale to Complete and clears it otherwise. Properties Sold and Gross count a sale in the month it was completed (older completed sales fall back to their created date).
- **Changed:** `Dashboard.vue`: Gross now uses Gross Commission (Net Commission input is commented out); Receivables = gross commission of sales awaiting payment; new commission row: Commissions Claimed, Ready to Claim, Awaiting Approval (same rules as the Commissions page). Admins get a My Stats / All Agents switch (default All Agents).
- **Changed:** The hidden panels are on and real: Sales Performance (properties sold per month, avg deal), Recent Activity (sales and claimed commissions), Reminders (approvals, claimable and upcoming commissions), Genealogy (real upline and 2-generation team). Cards link to Sales, Commissions and Genealogy. The stat popup lists the records behind each number.
- **Added:** `commissionService.getTabs` returns `claimed_at`; `genealogyService.getDownline(agentId, levels)`.
- **Notes:** Re-run the combined migration for `completed_at`. `vue-tsc` shows no new errors.

---

## 2026-10-14 - Sales report: agent names and access
- **Changed:** `salesService.getSales` fills in any blank agent name by looking it up directly, and shows "Agent #id" if it still can't be read (admins see the Agent column in the table, detail popup and export).
- **Fixed:** A non-admin whose agent record couldn't be found used to load every sale; they now see none. Agents otherwise only load their own sales.
- **Changed:** Sale status is visible to everyone but only an admin can change it (the edit-form field is disabled for agents, and an agent's edit never sends a status change).
- **Notes:** These limits are enforced in the app, not by database RLS (still the open dev policy). `vue-tsc` shows no new errors.

---

## 2026-10-14 - Commission approval, balance tab, cancel/complete
- **Changed:** `Commission.vue`: Agent (recipient's name) and Role (Agent / Upline 1 / Upline 2) are now separate fields. Agents and uplines see only their own tabs. Admins get a switch: "My Commissions" (own tabs, claimable) and "All Agents (Approval)" (everyone's tabs, approve only).
- **Changed:** Each tab needs a manual admin approval (`commissions.admin_approved`) before its recipient can claim it; claiming also needs the due date. Only the recipient can claim (admins too). An admin can approve any tab, including their own.
- **Added:** Remaining-balance tab: `calculateSchedule` adds one extra payment at (100% - DP rate), due one month after the last division's end date (`commissions.is_balance`). Not added when DP is 100% or for Spot-Cash.
- **Changed:** Cancelling a sale removes its unclaimed tabs (claimed ones are kept). A completed sale lifts the due-date wait on all its tabs; approval is still required.
- **Changed:** Combined migration gains `admin_approved`, `approved_at`, `is_balance` on `commissions` (idempotent, re-run it). Tabs already generated before this change have no balance tab; delete them (`delete from public.commissions;`) and re-save the sale as Awaiting Payment to regenerate.
- **Notes:** `getTabs` now falls back to "Agent #id" if a recipient's name can't be read. `vue-tsc` shows no new errors.

---

## 2026-10-14 - Pay units and commission tabs
- **Added:** `supabase/migrations/20261014140000_sales_payment_scheme_and_commissions.sql` replaces the two earlier drafts (deleted) and is idempotent. `sale_dp_divisions` uses `payable_count` + `payable_unit` (months/quarters/years); new `commissions` table (one row per payment per recipient: Agent, Upline 1, Upline 2).
- **Added:** `src/utils/paySchedule.ts` (unit steps, month-end-safe due dates).
- **Added:** `commissionService`: `saveTabs`, `countForSale`, `getTabs`, `claimTab`; `calculateSchedule` now returns `dueDate` per payment (Spot-Cash uses the reservation date).
- **Added:** `salesService.generateCommissionTabs(saleId)`: on approval, builds the tabs from `calculateSchedule` and the upline chain from genealogy. Skips if the sale has no payment scheme or already has tabs.
- **Changed:** `DpDivision` uses `count` + `unit` instead of `months`. Sale form has a Months/Quarters/Years selector; end date follows start, count and unit, and the last payment may not fall after it.
- **Changed:** Saving a sale as Awaiting Payment or Complete (admin status field) triggers tab generation.
- **Changed:** `Commission.vue` reads real tabs (admin: all; agent: own), claim is saved, mock data and the test "Toggle Admin" button removed. Admin approval now follows the sale status.
- **Changed:** Commissionable Amount is the sale's Gross Commission (admin-entered); tab generation errors if it is empty. Per-pay formulas in `calculateSchedule` confirmed unchanged: raw = (rate / payments) x 5% x amount; agent x 3/4 x 3/5; each upline x 3/4 x 1/10.
- **Changed:** Net Commission input in the sale form is commented out (not removed).
- **Notes:** Approved tabs are not regenerated if a sale is edited later. `vue-tsc` shows no new errors.

---

## 2026-10-14 - Sales report: financing, payment scheme, DP divisions
- **Added:** migration (now merged into `20261014140000_...`): `sales` gets `financing`, `payment_scheme`, `dp_rate`, `dp_amount`, `remaining_balance`; new table `sale_dp_divisions` (rate, payable_months, due_date_start, due_date_end).
- **Added:** `SalesUploadModal.vue` inputs: Developer (filters/auto-follows Project), Financing, Payment Scheme, DP Rate with auto DP Amount and Remaining Balance, and DP Divisions as tabs with "+ Add division". Spot-Cash shows the contract price and no divisions. Save is blocked unless division rates equal the DP rate exactly.
- **Added:** `salesService.ts`: `getDpDivisions`, `saveDpDivisions`, `getListingDeveloperName`; `Sale` carries the new fields plus `developer_name`.
- **Changed:** "Property" field relabeled "Project". `validateDpDivisions` is now an exact match (was within 0.01).
- **Changed:** `SalesReport.vue` Sale Details shows developer, financing, scheme, DP figures and divisions.
- **Notes:** Developer and Project are not stored on `sales`; they come from the sale's listing. `vue-tsc` shows no new errors (existing ones remain in `PropertyDetails.vue` and `Dashboard.vue`).

---

## Baseline (2026-10-14)

Starting point for all future entries. Everything below is the state as of this date.

**Stack:** Vue 3 + TypeScript + Vite 7, Tailwind 4, Supabase (auth + DB), Mapbox GL, Chart.js, Vue Flow/dagre (genealogy tree), jsPDF.

**Git:** commit `f8d82fb` (merge of PR #117, commissions page frontend).

**Uncommitted at baseline:** `commission.ts`, `Sidebar.vue`, `SalesUploadModal.vue`, `router/index.ts`, `commissionService.ts`, `listingsServices.ts`, `salesService.ts`, `Commission.vue`, `Dashboard.vue`, `SalesReport.vue`.

**Structure (`src/`):**
- `views/`: Dashboard, Listings, PropertyManagement, SalesReport, Commission, Accounting, Genealogy-landingpage, developerlist, Profile, Settings, SharedListing (public), LoginForm
- `components/`: accounting, calculator, dashboard, developer, genealogy, listings, profile, sales, settings, Sidebar, modal
- `services/`: agent, auth, commission, developer, genealogy, listings, poi, sales, share (`lookupService.ts` is empty)
- `assets/classes/`: agent, commission, developers, listings
- `router/index.ts`: auth-guarded routes; `/` (login) and `/shared/listing/:token` hide the sidebar and are public

**Database:** `supabase/migrations/` covers sales, genealogy, nearby POIs, listing incentives, developer promos.

**Known issues:** `npm run build` fails on type errors in `SalesUploadModal.vue` and `Listings.vue` (`soldListing` / `onSaleSaved`); `npx vite build` passes. Commission page runs on mock data.

---

<!-- New session entries go above the Baseline section, format:

## YYYY-MM-DD
- **Added:** ...
- **Changed:** ...
- **Fixed:** ...
-->
