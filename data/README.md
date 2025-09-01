name: "CollisionOS: Autobody Shop Management with BMS/EMS Import, Workflow, Parts & Mitchell Links"
description: |

Purpose

Build a desktop-first autobody shop management system (Electron + React UI, Node/Express API, SQLite→Postgres DB) that:

Imports BMS/EMS files and maps 100% of relevant data (Jobs/RO, Claims, Customer, Vehicle, Estimate Lines, Parts, Taxes) into normalized tables.

Tracks the full repair workflow (stage, status, ETA, blockers), books customers, manages parts & POs, drafts invoices (GST/PST logic), and provides one-click Mitchell deep links.

Ships with a CLI, watcher import, and Playwright E2E (including MCP in Cursor) for repeatable validation.

Core Principles

Context is King: Include BMS/EMS structure notes, DB schema, stage logic, tax rules, sample files, and examples.

Validation Loops: Unit tests for parsers, integration tests for import→UI→invoice, lint/type checks, and deterministic seeds.

Information Dense: Use explicit field names (RO, Claim, VIN, gst_payable, line_type, vendor_id, stage/status).

Progressive Success: Start with import + job list + Kanban; add parts, booking, billing; refine guardrails and UX.

Goal

Deliver a production-ready CollisionOS app where staff can drop a BMS/EMS file and instantly see a populated job (vehicle, customer, estimate lines, parts), move it across a Kanban production board, manage parts/POs, book appointments, and generate a tax-correct draft invoice—with Mitchell link shortcuts available from the job header.

Why

Business value: Reduce manual data entry, increase throughput/visibility, and standardize high-end shop operations.

Integration: Works with existing estimating systems via BMS/EMS, preserves Mitchell/CCC identifiers for deep linking.

Problems solved: Data duplication, lost parts, unclear repair stage, inconsistent taxes, and slow onboarding.

What

A desktop app (Electron) + local API (Node) + DB (SQLite dev, Postgres prod) with:

Importer: Watcher + CLI to parse BMS XML / EMS pipe-delimited; idempotent upserts by (RO, Claim, VIN).

Production Board: Kanban for stages; filter by insurer, tech, promise date; guardrails for stage transitions.

Parts: Vendor catalogs, POs, received/backordered, variance vs estimate, unblock logic.

Booking/Calendar: Intake/delivery/calibration scheduling with reminders.

Billing: Draft invoice, deductible, insurer/customer split; apply GST only when flagged in BMS and line is taxable.

Mitchell/CCC Links: Template-driven deep-links saved per job/insurer.

Success Criteria

BMS/EMS files import without data loss; unknown tags logged (no crash)

Upsert logic prevents duplicates; re-import updates existing records

Production board shows stage, status, ETA; drag-drop with guardrails

Parts flow supports PO→received/backordered; “waiting on parts” clears correctly

GST/PST logic correct for BC; GST only when BMS indicates payable

Mitchell deep links available via one-click in job view

CLI import + watcher work; E2E tests (Playwright MCP) pass

Lint/type checks clean; >80% unit coverage on parsers/mappers

All Needed Context
Documentation & References

# MUST READ - include these in your context window

- url: https://www.electronjs.org/docs/latest
  why: Desktop shell, security guidelines, auto-update patterns

- url: https://expressjs.com/
  why: API routes & middleware patterns for Node backend

- url: https://github.com/NaturalIntelligence/fast-xml-parser
  why: Robust XML parsing for BMS (attributes, namespaces, arrays)

- url: https://playwright.dev/docs/api/class-electron
  why: E2E desktop testing approach for Electron apps

- url: https://kysely.dev/ # or Prisma if preferred
  why: Type-safe SQL schema & migrations

- url: https://stripe.com/docs/payments
  why: Optional card capture for invoices

- file: examples/parsers/bms_parser.spec.ts
  why: Parser contract, edge cases (namespaces, missing attrs)

- file: examples/cli/import_bms.ts
  why: CLI signature, result summary, exit codes

- file: examples/ui/production_board.tsx
  why: Kanban pattern, optimistic updates, guardrails

- file: examples/urls/mitchell_link_templates.md
  why: How to register and resolve deep-link templates

Current Codebase tree
.
├── apps/
│ ├── desktop/ # Electron + React (renderer/main)
│ └── server/ # Node/Express API
├── examples/
├── tests/
├── .claude/
│ └── INITIAL.md
└── package.json

Desired Codebase tree with files to be added
.
├── apps/
│ ├── desktop/
│ │ ├── src/
│ │ │ ├── main/ # Electron main process
│ │ │ ├── renderer/ # React UI
│ │ │ │ ├── pages/
│ │ │ │ │ ├── JobsBoard.tsx
│ │ │ │ │ ├── JobDetail.tsx
│ │ │ │ │ └── Calendar.tsx
│ │ │ │ ├── components/
│ │ │ │ └── state/
│ │ │ └── mcp/ # MCP client bindings (filesystem, git, playwright)
│ │ └── package.json
│ └── server/
│ ├── src/
│ │ ├── api/
│ │ │ ├── jobs.ts
│ │ │ ├── parts.ts
│ │ │ ├── invoices.ts
│ │ │ ├── calendar.ts
│ │ │ └── import.ts
│ │ ├── services/
│ │ │ ├── import/bms_parser.ts
│ │ │ ├── import/ems_parser.ts
│ │ │ ├── import/normalizers.ts
│ │ │ ├── jobs/index.ts
│ │ │ ├── parts/index.ts
│ │ │ ├── billing/tax.ts
│ │ │ └── links/templates.ts
│ │ ├── db/
│ │ │ ├── schema.ts
│ │ │ └── migrations/
│ │ └── lib/
│ └── package.json
├── cli/
│ └── import-bms.ts
├── examples/
│ ├── parsers/bms_parser.spec.ts
│ ├── cli/import_bms.ts
│ ├── ui/production_board.tsx
│ └── urls/mitchell_link_templates.md
├── tests/
│ ├── unit/
│ │ ├── bms_parser.test.ts
│ │ ├── ems_parser.test.ts
│ │ ├── tax_rules.test.ts
│ │ └── links_templates.test.ts
│ └── e2e/
│ └── desktop_flow.spec.ts # Playwright (Electron)
├── .env.example
├── README.md
├── turbo.json # optional monorepo runner
└── credentials/.gitkeep # if needed for 3rd-party API keys

Known Gotchas & Library Quirks
// CRITICAL: BMS XML uses namespaces & attributes — configure fast-xml-parser:
// removeNSPrefix: true, ignoreAttributes: false, attributeNamePrefix: "@\_", trimValues: true

// CRITICAL: Idempotency — upsert by (ro_number, claim_number, vin). Never create duplicates on re-import.

// CRITICAL: Do NOT overwrite user-chosen stage/status on re-import; only update parsed fields & add lines/parts deltas.

// CRITICAL: GST logic — apply ONLY when BMS indicates gst_payable (from the correct section) AND line is taxable.
// PST configurable; keep province defaults (BC: 5% GST, 7% PST).

// CRITICAL: Decimal math — use decimal.js or DB numeric types; avoid JS float rounding in financials.

// CRITICAL: Electron security — disable nodeIntegration in renderer, enable contextIsolation, validate IPC.

// CRITICAL: Watcher — handle partial copies (e.g., file still copying). Use temp/lock strategy or checksum+retry.

// CRITICAL: Windows paths — normalize separators; long path issues; ensure watcher works on network shares.

// CRITICAL: Playwright with Electron — build stable selectors; avoid brittle text selectors.

// CRITICAL: Data residency — support local-only mode; avoid sending PII to third parties by default.

Implementation Blueprint
Data models and structure
// schema.ts (Kysely/Prisma shape idea)
// jobs: id, ro_number, claim_number, insurer_id, customer_id, vehicle_id, loss_date, loss_desc,
// stage, status, eta, promise_date, source_system, created_at, updated_at

type Stage =
| "Estimate" | "Intake/Check-in" | "Tear-down & Blueprint" | "Supplement Pending"
| "Supplement Approved" | "Parts Ordering" | "Parts Receiving" | "Body/Structure"
| "Mechanical/Sublet" | "Paint Prep" | "Paint Booth" | "Reassembly"
| "Calibrations/Alignment" | "Post-Scan, QC & Road Test" | "Detail/Final Clean" | "Ready for Pickup";

// customers: gst_payable:boolean must map from BMS only when present in the correct section
// estimate_lines: line_type ('labor'|'part'|'sublet'|'paint'|'material'), hours, rate, qty, price, tax_code
// parts: status ('ordered'|'partial'|'received'|'backordered'|'cancelled'), variance
// links: url_template, external_id, label

List of tasks to be completed
Task 1: Project Config & Env
CREATE .env.example:

- DATABASE_URL (sqlite dev / postgres prod)
- IMPORT_WATCH_DIR, IMPORT_ARCHIVE_DIR
- DEFAULT_TAX_GST=0.05, DEFAULT_TAX_PST=0.07, APP_REGION=CA-BC
- FEATURE_STRIPE=false, FEATURE_AUTO_UPDATE=false
  CREATE server/src/db/schema.ts + migrations:
- Define jobs, customers, vehicles, estimate_lines, parts, vendors, invoices, links, audit_logs, calendar_events

Task 2: Importers
CREATE server/src/services/import/bms_parser.ts:

- fast-xml-parser config; map all entities; collect unknown tags in logs
  CREATE server/src/services/import/ems_parser.ts:
- parse pipe-delimited EMS; map minimal viable entities
  CREATE server/src/services/import/normalizers.ts:
- upsert rules (ro_number, claim_number, vin), tax mapping, line normalization
  CREATE cli/import-bms.ts:
- `--path`, prints summary, non-zero exit on validation errors

Task 3: API Routes
CREATE jobs.ts, parts.ts, invoices.ts, calendar.ts, import.ts:

- CRUD + list endpoints; pagination, filters; safe input validation

Task 4: UI (Electron + React)
CREATE JobsBoard.tsx:

- Kanban with filters, drag-drop, guardrails (no Paint before critical parts received)
  CREATE JobDetail.tsx:
- Job header (RO/Claim/VIN), customer/vehicle, estimate lines, parts tab, Mitchell links
  CREATE Calendar.tsx:
- Intake/delivery/calibration events; reminders

Task 5: Billing & Taxes
CREATE billing/tax.ts:

- compute invoice totals; GST applies only if gst_payable AND line taxable; PST configurable
  CREATE invoices API + PDF export (minimal)

Task 6: Parts & POs
CREATE parts service:

- Vendor CRUD, PO create, received/backordered, variance calc; unblock job when critical parts received

Task 7: E2E & Unit Tests
UNIT: parsers (BMS, EMS), tax rules, link templates
E2E: import file → job visible → drag stage → mark part received → draft invoice totals
Integrate Playwright MCP in Cursor for desktop automation

Task 8: Docs & Seeds
README quickstart, screenshots
Seed vendors/jobs; samples in /samples (BMS variants)

Per task pseudocode
// server/src/services/import/bms*parser.ts
export async function parseBMS(xml: string): Promise<NormalizedPayload> {
const parser = new XMLParser({ ignoreAttributes:false, removeNSPrefix:true, attributeNamePrefix:"@*", trimValues:true });
const doc = parser.parse(xml);

// Extract core identities
const ro = g(doc, "Mitchell.RepairOrder.RONumber"); // helper g(obj, path)
const claim = g(doc, "Mitchell.Claims.ClaimNumber");
const vin = g(doc, "Mitchell.Vehicle.VIN");

// Customer + gst flag (ONLY if present in the correct section)
const gstPayable = !!g(doc, "Mitchell.Billing.Customer.GSTPayable"); // example path

// Vehicle
const vehicle = {
vin, year: g(doc,"Mitchell.Vehicle.Year"), make: g(doc,"Mitchell.Vehicle.Make"),
model: g(doc,"Mitchell.Vehicle.Model"), trim: g(doc,"Mitchell.Vehicle.Trim"),
color: g(doc,"Mitchell.Vehicle.Color")
};

// Estimate lines (parts/labor/materials/sublet)
const lines = extractLines(doc); // return normalized typed lines with tax_code, qty, hours, rate, price

// Parts (from lines where line_type==='part')
const parts = lines.filter(l => l.line_type==='part').map(toPartRecord);

return { identities: { ro, claim, vin }, customer:{ gst_payable: gstPayable, ...extractCustomer(doc) },
vehicle, lines, parts, meta:{ source_system:"mitchell" } };
}

// normalizers.ts
export async function upsertAll(db, payload) {
const jobId = await upsertJob(db, payload.identities, payload.meta, payload.jobFields);
await upsertCustomerVehicle(db, jobId, payload.customer, payload.vehicle);
await upsertLines(db, jobId, payload.lines);
await upsertParts(db, jobId, payload.parts);
await logImport(db, payload);
}

// billing/tax.ts
export function computeTotals(lines, gstPayable:boolean, rates) {
const taxable = (line) => line.tax_code === "TAXABLE";
const gst = gstPayable ? sum(lines.filter(taxable).map(x => x.ext_price _ rates.gst)) : 0;
const pst = sum(lines.filter(l => l.pst_applicable).map(x => x.ext_price _ rates.pst));
return { subtotal: sum(lines.map(x=>x.ext_price)), gst, pst, total: subtotal + gst + pst };
}

Integration Points
ENVIRONMENT:

- Add to .env:

  # App

  NODE_ENV=development
  PORT=5173
  APP_REGION=CA-BC

  # Database

  DATABASE_URL=file:./dev.sqlite

  # DATABASE_URL=postgres://USER:PASS@HOST:5432/collisionos

  # Files

  IMPORT_WATCH_DIR=./import
  IMPORT_ARCHIVE_DIR=./import_archive

  # Taxes (province defaults; can be overridden per insurer/job)

  DEFAULT_TAX_GST=0.05
  DEFAULT_TAX_PST=0.07

  # Features

  FEATURE_STRIPE=false
  FEATURE_AUTO_UPDATE=false

CONFIG:

- Stage guardrails configurable (JSON) to block transitions until conditions met
- Mitchell link templates stored per insurer/system in DB; rendered with job context

DEPENDENCIES (add to package.json):

- fast-xml-parser, zod (or yup), decimal.js, express, cors, kysely (or prisma), better-sqlite3/pg
- electron, react, react-router, @tanstack/react-query
- playwright, @playwright/test, ts-node, typescript, eslint, prettier

Validation Loop
Level 1: Syntax & Style

# Root

pnpm i
pnpm run lint # eslint
pnpm run typecheck # tsc --noEmit

Level 2: Unit Tests
pnpm run test:unit # vitest/jest; covers bms_parser, ems_parser, tax_rules, link_templates

Example tests

// bms_parser.test.ts
it("parses BMS with namespaces and maps gst_payable correctly", async () => {
const xml = readFileSync("samples/bms/gst_true.xml","utf8");
const p = await parseBMS(xml);
expect(p.customer.gst_payable).toBe(true);
expect(p.lines.length).toBeGreaterThan(0);
});

// tax_rules.test.ts
it("applies GST only when gst_payable and line is taxable", () => {
const { total, gst } = computeTotals(linesFixture, true, { gst:0.05, pst:0.07 });
expect(gst).toBeCloseTo(expectedGst, 2);
});

Level 3: Integration / E2E (Electron + Playwright MCP)
pnpm run dev # starts server + desktop
pnpm run test:e2e # playwright: import → job on board → stage move → part receive → invoice totals

Final Validation Checklist

Importer handles BMS/EMS variants; logs unknown tags

Re-import updates existing jobs (no duplicates)

Production board reflects stage/status/ETA and respects guardrails

Parts received/backordered states update job blockers

GST/PST applied per rules; invoice totals correct and exported

Mitchell links resolve correctly from templates

CLI import & watcher operate reliably (retry/archive)

E2E green on fresh checkout; unit coverage ≥80%

No PII in logs; Electron security best practices enabled

README quickstart + screenshots present

Anti-Patterns to Avoid

❌ Overwriting user-set stage/status/ETA on re-import

❌ Assuming GST for all customers/lines or ignoring tax_code

❌ Using JS floats for money (use decimal/NUMERIC)

❌ Relying on file names for identity (use RO/Claim/VIN from payload)

❌ Logging raw PII or credentials

❌ Running renderer with nodeIntegration=true

Confidence Score: 9/10

High confidence due to well-known stack, stable parsing libraries, and clear data contracts. Remaining risk: BMS flavor differences across estimators—mitigated via sample set + strict unit tests.
