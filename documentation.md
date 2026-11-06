# Documentation

Running record of changes and additions, one entry per session (newest first).
Rules: log only what changed or was added; no repeats of earlier entries; no restating unchanged code.

---

## 2026-11-06 - RLS hardening smoke test, Holiday office hours
- **Checked:** The RLS hardening smoke test (project-context.md 3.3) **passed** on the live Supabase project, with this frontend run locally. Clicked through as a signed-out visitor (fresh shared link: photos, price, map with working places chips, FAQ; expired link says it expired), as `test@agent.com` (pending listing created and edited, listing shared, sale recorded / edited / deleted with the listing going Sold and back to Active, payment requested on an approved due tab and confirmed received, Settings and Profile saved, read-only Developer List and Team Insights, another agent's pending listing hidden) and as `test@admin.com` (listing approved, sale approved and tabs generated, tab approved and released with a proof image, developer added / edited / deleted with office hours and a poster, threshold set and cleared, agent created / edited / deleted with its login). No `42501` in the console and no 401 / 403 in the API logs. Every step was also replayed in SQL as the real users with RLS on, in a transaction that was always rolled back (153 checks, all passed). All test rows were removed and the thresholds restored.
- **Added:** Migration `20261106130000_day_enum_holiday.sql`: adds `Holiday` to `day_enum` (after Sunday). The office-hours picker has always offered Holiday, but the live enum didn't have it, so saving a Holiday slot failed with "invalid input value for enum day_enum".
- **Fixed:** Editing a developer deleted all of its office hours before inserting the new ones, so any refused insert (such as a Holiday slot) left the developer with **no** hours. `developerService.updateDeveloper` now upserts the new rows on `(id, day)` first and then deletes only the days no longer picked; a refused save keeps the old hours and the error says so.
- **Supabase setup (manual, project-context.md 3.3 step 12):** run `20261106130000_day_enum_holiday.sql` in the SQL editor on its own (safe to re-run, any time). Until then a Holiday slot is refused and the other hours are kept.
- **Notes:** The smoke test showed that deleting a sale leaves its proof-of-payment files in `images/payment-proofs/`, and deleting a developer (or removing its picture) leaves the picture in `images/developers/` (project-context.md 11.2, 11.4); two such files from this test are still in the bucket. The hours fix was checked in the browser against the live project: a Holiday save was refused with Monday and Tuesday kept, and a normal edit updated Monday and removed Tuesday. The migration was dry-run in a rolled-back transaction (adds Holiday after Sunday; a re-run changes nothing), then run on the live project the same day (the step 12 check passes); a test developer with Monday + Holiday hours then saved and re-saved without errors and was deleted. `vue-tsc --build` shows 0 errors and `npm run build` passes.

---

## 2026-11-06 - Upload limits for the public storage buckets
- **Added:** Migration `20261106120000_storage_upload_limits.sql` (idempotent). The public `images` bucket (listing photos, profile and developer pictures, promo posters, payment proofs) now accepts only PNG, JPEG, WEBP, GIF, HEIC, HEIF and AVIF, max 10 MB per file; SVG is refused because it can carry script and these files open by URL for anyone. `fact_sheets` keeps its document types and gets a 20 MB limit. Before this, both buckets took any size and `images` any type (project-context.md 11.7).
- **Supabase setup (manual, project-context.md 3.3 step 11):** run the file in the SQL editor. **Already applied to the dev project on 2026-11-06.**
- **Notes:** No code, table or policy changes; files already stored are untouched (the largest is a 9.2 MB PNG). Checked live: a signed-out SVG upload is refused with `415 invalid_mime_type`, while a PNG passes the type check and is then refused by RLS as before. Normal photo uploads from `accept="image/*"` inputs are unaffected.

---

## 2026-11-06 - Dependency cleanup and security updates
- **Removed:** Unused dependencies `chart.js`, `@types/chart.js`, `lucide` (the app uses `lucide-vue-next`), `next`, `dagre` (the tree uses `@dagrejs/dagre`), `@types/dagre` and `@vue-flow/background`. None was imported anywhere in `src/`, so nothing in the bundle changes; `npm install` pulls 24 fewer packages. `next` alone carried 2 critical and several high advisories.
- **Changed (security):** `dompurify` raised to `^3.4.17` (fixes GHSA-cg2g-xh64-v4q7 and related advisories up to 3.4.16; `compileMarkdown()` uses the default `sanitize()` call, which those advisories don't target, but it is the one library that cleans user HTML before `v-html`). `npm audit fix` updated transitive packages within their ranges (`vue` / `@vue/server-renderer`, `vite`, `postcss`, `nanoid`, `esbuild`, `source-map-js`, ...): 13 advisories down to 2 moderates (`postcss-selector-parser` through `@tailwindcss/typography`, build time only; npm's fix would downgrade the plugin, so left alone).
- **Fixed:** `.env.example` lists `VITE_MAPBOX_TOKEN` (the maps, location picker and nearby places need it).
- **Notes:** No code, database or Supabase changes. `vue-tsc --build --force` shows 0 errors and `npm run build` passes.

---

## 2026-11-05 - Skeleton loading, faster page loads, code cleanup
- **Added:** Skeleton loading (pulsing gray placeholders shaped like the real content, same style as the Project Listings cards) on four pages. **Sales Report:** the table keeps its header and shows a page of placeholder rows instead of "Loading sales…"; the summary strip shows placeholders instead of 0 / ₱0.00 until the first load; the "All agents / Your sales" label waits until the viewer's role is known. **Developer List:** new `components/developer/DeveloperCardSkeleton.vue` (mirrors `developerCard`), four of them until the first load; "No developers to show." when nothing loads (the page used to stay blank). **Commissions:** placeholder cards on the real card grid, and placeholders for the receivables amounts, status counts and item count (light colours only, like the page). **IT Support:** placeholder rows, open-ticket meter and counts; the header label, table title and left card wait for the role, so admins no longer see the agent card first. Screen readers hear a "Loading …" status; containers are `aria-busy` while loading.
- **Changed (speed):** Every page is lazy-loaded (`src/router/index.ts`): the first download went from 3.4 MB (985 kB gzipped, Mapbox / Vue Flow / jsPDF included, even on the login page) to a 320 kB entry chunk (99 kB gzipped); a portal page needs about 110–160 kB gzipped before it renders. After the first signed-in page, the other pages are prefetched while the browser is idle; a tab open across a deploy reloads the page once instead of failing; `App.vue` waits for the first route so the Sidebar doesn't flash on the login page or shared links. The listing details overlay (`PropertyDetails`, with Mapbox and jsPDF) loads on first open in Listings and the Developer List, so their grids and skeletons appear without waiting for it.
- **Changed (speed):** The signed-in user comes from the stored session (new `getSessionUser()` in `authService.ts`) instead of `supabase.auth.getUser()`, which called the auth server before every page's first query, twice with the Sidebar, and on every live refresh (no permission change: queries still carry the token, RLS decides). `salesService.getSales` fetches the sale-numbering order in parallel with the sales. Commissions computes the "earlier payment still open" check once per list (`firstOpenPayment`) instead of scanning every tab for every card. Developer pictures and promo posters lazy-load. Login background 2.4 MB PNG → 290 kB JPEG; login logo 869 → 182 kB and Sidebar logo 217 → 68 kB (resized to 2× their display size, same look). `index.html` preconnects to Google Fonts and says `lang="en"`.
- **Fixed:** The login page asked for `LoginFormBG.png` but the file is `LoginFormBg.png`: it worked on Windows only, a Linux build lost the background. Sales Report and Genealogy shared sidebar `id: 9` (duplicate v-for key); both sidebar lists are keyed by path now.
- **Changed (code cleanup):** Removed 57 leftover `console.log` calls (data dumps, UI-toggle narration, "[DEBUG]" steps; `developerCard` printed every developer's phone, email and address), with the empty branches they left; errors still go to `console.error`. Removed unused imports, the duplicate `DeveloperProject` interface, a duplicate Vue Flow CSS import (the copy that decided the styles is kept) and duplicate classes. Every page, component and service now opens with a header comment (what it is, where it's used); Listings and Dashboard templates got section markers; the two unused dashboard placeholders say so. The Sales Report and Listings search boxes are capped at 100 characters like the others.
- **Notes:** No database changes and no Supabase steps. The tickets table question from the task was a mix-up: `support_tickets` already exists and the migrations were run (confirmed by the team), so the migration is unchanged. Checked again that no query or filter string is built from user text (the one `.or()` filter takes known statuses and an integer id; searches filter loaded rows in the browser). `vue-tsc --build --force` shows 0 errors and `npm run build` passes. Every page was opened in headless Chrome against a mock Supabase (light and dark mode, desktop and phone, admin and agent, skeleton and loaded states, the listing overlay, sale details, Add Sale, approve popup, ticket popup, Add Developer): no Vue warnings or errors from the app. The Commissions and sale-numbering refactors matched the old logic in a stubbed Node test (13,095 checks). Not clicked through against the live project.

---

## 2026-11-05 - RLS hardening, bug fixes, modal components
- **Added:** Migration `20261105120000_harden_rls.sql` (one transaction, idempotent; needs the agent accounts migration). Drops every policy on the 19 app tables and the old open `images` / `fact_sheets` storage policies, enables RLS, revokes all table access from `anon`, and creates real policies for signed-in agents: listings / sub-tables / photos by owner or admin (pending and draft listings hidden from other agents), sales and DP divisions by the seller while pending approval or by admins, commission tabs by recipient or admin, developers / office hours / promos / genealogy / thresholds by admins, share links for live listings, storage uploads and deletes by path owner (`listings/<id>-`, `agents/<id>-`, `<id>-` fact sheets) or admin. Guard triggers: `agents_guard` (only admins change admin access, position, hire date; logins linked by the Edge Function only), `main_listings_guard` (no self-approval; non-owners only toggle active/sold and the places cache), `commissions_guard` (recipients only request payment in order and confirm receipt; server times). Helpers `can_manage_listing`, `can_edit_sale`, `can_manage_image`, `can_manage_fact_sheet`. Functions `get_shared_listing(token)` (anon: a valid, unexpired link's public listing details only) and `team_completed_sales()` (totals for Team Insights). Ends with warnings for any table without RLS or policy open to anon.
- **Changed:** The shared listing page loads through `get_shared_listing` (token checked to be a uuid first; falls back to the old read while the function is missing). Its map uses the places cache that comes with the listing and never writes; sharing a listing refreshes that cache (`poiService.getNearbyPois` options `cached` / `persist`). Team Insights totals come from `team_completed_sales`.
- **Fixed (security):** Map POI popups inserted place names into `setHTML()` unescaped (stored XSS through the `nearby_pois` cache, which anyone could write); now DOM + `textContent`. The sales service built an `or()` filter from search text (unused, removed); the listings `or()` filter only takes known statuses and an integer id. Storage paths use `safeFileExtension` / `safeFileName`. CSV export guards against formula injection. `/commissions` now requires sign-in.
- **Changed:** Admin-only in the UI (matching RLS): Add / Edit / Delete developer, threshold editing and Promote (agents see thresholds as text and "Eligible for ..."). Listing details show EDIT to the owner, DELETE to the owner or admins, SOLD only on active bulk listings; the Developer List opens it read-only (its EDIT / DELETE / SOLD / APPROVE did nothing there).
- **Fixed:** Property Management: new listings' fact sheet went to listing -1; edit mode saved price and areas without converting to PHP / sqm; edit turned Clubshare / Golfshare into House and Lot; the page without `?edit=0` (Sidebar, Dashboard) ran a broken edit mode; edit re-sent the loaded status (could undo an approval); edit failures were silent; new photos restarted the display order. Inputs are cleaned (`cleanMarkdownText` keeps Markdown indentation) and prices checked.
- **Fixed:** Sale form: editing a bulk sale (even an admin only changing its status) saved `unit_details` as null, and the Sold flow never showed or prefilled the unit details: the form now loads its listing (`listingsService.getListingSummary`). Field checks (project, client, date, price, rate) and cleaning. Spot-Cash / Deferred-Cash info now says due one month after approval (the team-confirmed rule) instead of after the reservation.
- **Fixed:** Sales Report deleted the sale after reactivating its listing (a refused delete left a sold listing on sale); the upline was fetched twice; the toast had no dark-mode text colour. Listings: delete showed "Success!" in its catch block, and refused delete / approve / sold updates were reported as success (red toast now). Profile edit never saved the address, deleted the old picture before the save, and could clash on `''` (UNIQUE): fixed, with validation. Developer list: Save left the form open (a second Save duplicated the developer), edit ignored a new picture, the form edited the card's object, "Unavailable" hours failed the whole office-hours insert, delete didn't ask or wait, search did nothing. Settings save gives feedback and stops without an agent id. Threshold, agent and fact sheet updates now report 0 affected rows (the threshold "saved" message showed while nothing saved). Condo bedroom / balcony labels used the carpark count. Amortization due dates skipped months after the 30th / 31st. Unreadable saved settings no longer blank the app. Tree heading reads "Agent Genealogy".
- **Changed (code structure):** Inline modals moved into components with the same look and behaviour: `components/sales/SaleDetailsModal.vue` (Sales Report), `components/dashboard/MetricDetailsModal.vue` (Dashboard), `components/developer/PromoPosterModal.vue` (Developer List), `components/listings/MapPickerModal.vue` (Property Management). New `src/utils/saleStatus.ts`; `sanitize.ts` gains `cleanMarkdownText`, `safeFileExtension`, `safeFileName`, `finiteNumber`.
- **Supabase setup (manual, project-context.md 3.3 step 10):** deploy this frontend first, then run `20261105120000_harden_rls.sql` in the SQL editor; it must print no warnings. Turn off public sign-ups if not done (step 6).
- **Notes:** The ticket table asked about already exists (`support_tickets`, migration `20261104160000`, live per the policy export), so no new ticket schema was added. `vue-tsc --build --force` shows 0 errors and `npm run build` passes. The migration was built on a local PostgreSQL 18 from every migration plus the exported live policies, run twice, and passed 159 checks as signed-out visitor, login without agent, agent, upline, admin and service role. The new sanitize helpers passed a stubbed Node test. Not clicked through against the live project (needs step 10).

---

## 2026-11-04 - IT support tickets (new IT Support page)
- **Added:** `/support` page (`src/views/Support.vue`, Sidebar and phone bar → **IT Support**, `LifeBuoy` icon). Everyone can raise tickets. Agents see only their own tickets; admins act as IT support, see everyone's (own ones marked "You") and also get a "Your Tickets" list. Left column: Raise a Ticket card with an open-ticket meter ("n of 3 used") and tips. Right: tickets table (ID, title, category · page, raised by, "5 minutes ago", status pill, next-step action) with status filter pills and counts, search, pagination, live refresh and a bottom-right toast.
- **Added:** `src/components/support/RaiseTicketModal.vue`, a guided form built to get reproducible tickets: category (problems vs requests), page/feature, one-line title, and for problems the **steps to recreate it** (auto-numbered on Enter, at least 2), expected result, what happened instead, how often and (optional) when. Up to 3 optional screenshots (picker, drag and drop, Ctrl+V; 5 MB, PNG/JPG/WEBP/GIF). Browser/OS/window size/dark mode are added automatically. A live checklist unlocks **Raise Ticket**; closing a filled form asks "Discard this ticket?".
- **Added:** `src/components/support/TicketDetailsModal.vue` (progress strip Raised → In Review → Resolved with who and when, the ticket's facts and text, screenshots through signed links, the resolution note) and `TicketStatusBadge.vue`. Admins: **Start review**, **Resolve ticket** (a resolution note the user reads is required, then a confirmation) and **Reopen** (confirmation; back to In Review, the last note stays visible).
- **Added:** `src/services/ticketService.ts` (`getTickets`, `createTicket`, `startReview`, `resolveTicket`, `reopenTicket`, `getAttachmentUrls`, exported `cleanTicket` / `ticketProblems`), `src/assets/classes/ticket.ts` (types, categories, pages, limits, helpers), `src/utils/deviceInfo.ts` (`describeDevice`), and `cleanMultilineText` in `src/utils/sanitize.ts` (keeps line breaks; drops control characters and invisible direction overrides).
- **Added:** Migration `20261104160000_support_tickets.sql` (idempotent; needs the agent accounts migration first): `current_agent_id()`; table `support_tickets` with check constraints; trigger `support_tickets_guard` (raiser forced to the signed-in agent, status starts at `raised`, the flow raised → in_review → resolved (+ reopen) only, reviewer/resolver stamps set on the server, resolution note required, **3 open tickets per person**, screenshot paths must be in the user's own folder, ticket details locked after raising); **real RLS** (read own or admin, insert as yourself, update admins only, no delete, nothing for `anon`); private storage bucket `support_attachments` (5 MB, images only) with read-own-or-admin / upload-own / delete-own-unused policies; table added to realtime.
- **Fixed:** All Tickets showed "Could not embed because more than one relationship was found for 'support_tickets' and 'agents'" (PGRST201). The raiser embed used the column hint `agents!agent_ID`, which PostgREST also matches against `agents."agent_ID"`, the column all three ticket keys point to. `ticketService` now names the constraints (`agents!support_tickets_agent_ID_fkey`, `..._reviewed_by_fkey`, `..._resolved_by_fkey`); checked against the live REST API. No schema change.
- **Supabase setup (manual, see project-context.md 3.3 steps 8-9):** run `20261104160000_support_tickets.sql` in the SQL editor; check that older `storage.objects` policies are limited to their own bucket.
- **Notes:** First table with real per-user RLS instead of the open dev policy; the role rules hold even with the anon key. No email or Dashboard notifications for tickets yet (project-context.md 11.9). Inputs are cleaned and length-checked in the app and again by check constraints; values reach the database only as bound parameters (no SQL or filter strings built from text), and ticket text is shown with Vue's escaping, never `v-html`. `vue-tsc --build --force` shows 0 errors and `vite build` passes. The migration was run twice on a local PostgreSQL 18 with stubbed `auth`/`storage`, and its RLS, trigger, limit and storage rules were tested (own vs others' tickets, admin flow, refused skips, locked details, agent deletion, folder rules). The cleaning, validation and device helpers passed a stubbed Node test (34 checks). Not clicked through against the live Supabase project (needs the migration above).

---

## 2026-11-04 - Agent accounts, initial passwords, change password with an email code
- **Added:** Supabase Edge Function `supabase/functions/agent-account/index.ts` (Deno, service-role key, admin callers only). `create` makes the Supabase Auth user (`email_confirm: true`), the `agents` row with `user_id` already linked, the upline edge, and the encrypted initial password, and undoes everything if a step fails. `create-login` gives an existing agent a login. `delete-login` removes a deleted agent's login, but only one that no agent uses and never the caller's own. Agent fields are whitelisted and validated on the server; `age` is derived there.
- **Added:** Migration `20261104120000_agent_accounts.sql` (idempotent): Vault secret `agent_password_key`; table `agent_credentials` (RLS on with **no** policies: encrypted initial password, `password_changed_at`, `created_by`); functions `current_agent_is_admin`, `store_agent_initial_password` (service role only), `admin_get_agent_login(agent, reveal)` (admins only), `current_agent_needs_password_change`; trigger `on_agent_password_changed` on `auth.users`, which marks the password changed and deletes the stored copy on any password change.
- **Added:** `src/services/accountService.ts` (Edge Function calls with readable errors, login status/reveal RPC, password reminder RPC, email-code password change), `src/utils/sanitize.ts` (input cleaning), `src/utils/password.ts` (14-character `<initials><random>` initial password from `crypto.getRandomValues`, password rules), `src/components/genealogy/PasswordReveal.vue` (dots + eye / copy / regenerate), `src/components/auth/ChangePasswordModal.vue` (email → one-time code → new password with a checklist).
- **Changed:** Add Agent creates the login. `genealogyService.addAgent(data, uplineId, initialPassword)` checks the hierarchy rules, then calls the Edge Function; nobody links a UID by hand anymore. `AddAgentModal` has a "Login account · Important" box (amber, red exclamation icons) with the email and the generated password, cleans and validates every field, shows a "Login Created" screen with "Copy login details", gains dark mode, and offers Non-Binary and Other for Sex (same as ProfileEdit).
- **Changed:** Edit Agent shows the login: initial password as dots with an eye that reveals it (fetched only on click; any agent, admins included), "Changed by the agent on <date>" once changed, "can't be shown" for logins linked by hand, and "Create a login with this email when I save" for agents without one. A note appears when the email typed differs from the login email.
- **Changed:** `genealogyService.deleteAgent` also removes the agent's login, and checks the agent delete with `.select()`.
- **Changed:** Genealogy: Add Agent, Edit and Delete are admin-only; an admin can't delete their own record. The static profile picture beside Add Agent is removed.
- **Changed:** Dashboard: "+ Add Agent" is hidden for non-admins and opens the Genealogy `AddAgentModal` for admins. A user still on the initial password gets a **solid red** first reminder ("Important · Account security", "Change password →", red count badge) that opens the change-password modal locked to their login email. `Reminder` gains `critical` and `action`; `buildDashboard` takes `needsPasswordChange`.
- **Changed:** Login page: "Forgot or change password?" opens the change-password modal (email code → new password). The code's session is ended afterwards, the email is filled in and a green message asks the user to sign in. Sign in cleans the email first.
- **Removed:** `src/components/dashboard/AddAgent.vue` (placeholder "Invite New Agent" that saved nothing).
- **Supabase setup (manual, see project-context.md 3.3):** run the migration; deploy the `agent-account` Edge Function; put `{{ .Token }}` in the Reset password email template; set up custom SMTP and raise the email rate limit; turn off public sign-ups; create logins for older agents from Edit Agent.
- **Notes:** Only the **initial** password can be revealed (team decision); a password the agent chooses is never readable. The login email still doesn't follow later email edits (11.3). Inputs reach the database only as bound parameters (supabase-js / PostgREST, no dynamic SQL in the functions), and every form cleans them first. `vue-tsc --build --force` shows 0 errors, `vite build` passes, the Edge Function type-checks against a Deno shim, and the password and sanitize helpers passed a stubbed Node test (20,000 generated passwords). Not clicked through against a live project (needs the Supabase setup above).

---

## 2026-11-03 - Commission confirmations, admin filter, shared listing price range
- **Added:** `src/components/commissions/ConfirmActionModal.vue`, a small confirm popup in the commission-modal style (blurred blue overlay, `z-60` so it can open on top of another popup). Keyboard focus moves into it, Tab stays inside, Escape or a click outside closes it, and focus goes back to the opening button. Optional `requiredPhrase` keeps Confirm disabled until the phrase is typed (letter case and extra spaces ignored). Has dark-mode classes.
- **Added:** Commissions, admin switch gains **Other Agents** (every agent's tabs except the admin's own), beside My Commissions and All Agents (Approval). The receivables label and the per-agent list follow the view.
- **Added:** Commissions, in the admin All Agents view a blue **YOU** pill sits right of the agent name on the admin's own tabs (`showOwnBadge`).
- **Changed:** Commissions, **Approve commission** opens "Are you sure you want to approve this commission?" (No / Yes, with agent, role, project, payment and amount). Yes runs `approveTab`; success closes the popup and shows a **"Commission approved."** toast at the bottom right (raised above the phone bottom nav). Errors stay in the popup instead of `alert()`.
- **Changed:** Commissions, admins can now **request and receive payment on their own tabs** (`canAgentAct` = the signed-in person is the recipient). Before, these steps were agent-only and an admin's own tab stopped at Approved. Admins still can't act on someone else's tab, and the Dashboard still gives them no personal payout alerts.
- **Changed:** Proof of payment, **Received payment** asks the recipient (any rank, admin or not) to type **"I have received payment"** before `confirmReceived` runs.
- **Fixed:** Shared listing page shows the **min - max price range** for bulk listings (it showed only the minimum price), with the same markup as the listing details overlay.
- **Changed:** Shared listing page matches the overlay: type features show for single listings only (a bulk listing's sub-table holds placeholder values), photos follow `listing_images.display_order` (`getSharedListing` now selects it), and it has the overlay's dark-mode classes. Without them, an agent with dark mode on saw the description in light text on a white card.
- **Notes:** No database changes. Payment request, release and receipt still confirm with `alert()`; only Approve uses the toast. `vue-tsc --build --force` shows 0 errors and `vite build` passes. Not clicked through against live data (needs a signed-in admin and agent).

---

## 2026-11-03 - Automatic DP division dates
- **Changed:** `SalesUploadModal.vue`: DP division dates fill themselves. Division 1 starts one month after the reservation date (also refreshed when the reservation date changes). Each later division starts one step after the previous division's end date, where the step is one month, quarter or year following the previous division's unit. End dates still come from `lastDueDate`. Dates stay editable; changing a division's count, unit, start or end shifts the divisions after it. New helpers: `startFollowing`, `onDivisionChange`, `restartDivisionDates`; `addDivision` pre-fills the start.

---

## 2026-11-03 - Commission pool uses the gross commission as is
- **Fixed:** `commissionService.calculateSchedule` no longer multiplies the gross commission by another 5%. The rate was applied twice (once in the sale form, again in the engine). Each payment's company commission is now its share of the gross commission (Commissionable Amount x Commission Rate).
- **Changed:** `SalesUploadModal.vue`: the Commission Rate defaults to 5% when the listing has no commission rate; a listing's own rate is still used.
- **Notes:** Tabs already generated keep their old amounts. To regenerate, delete that sale's rows from `commissions` and save the sale as Awaiting Payment again. Property Management has no commission field, so listings only get their own rate if `main_listings.commission` is set in the database.

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
