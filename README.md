# FinSight AI — Conversational Data Analyst

A full-stack banking analytics workspace built with **React, Node.js, TypeScript, SQLite, Recharts**, and a **safe deterministic natural-language intent engine (mock AI)**. It turns supported natural-language business questions into **reviewed parameterized SQL templates** and renders live database results as text, tables, KPI summaries, bar charts, or line charts.

## Quick start

Requirements: Node.js 20+ and npm 10+. From the repository root:

```bash
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**. API is **http://localhost:4000**. The SQLite database and deterministic demo seed data are generated automatically on first server startup. On Windows PowerShell, use `Copy-Item .env.example .env`.

```bash
npm test
npm run build
```

If you want to reset demo data, stop the server, delete `server/banking.db` and restart.

## Architecture

```text
React + TypeScript (Vite) + Recharts
       | POST /api/chat, GET /api/overview
Express + TypeScript + Zod validation
       | intent classification + safe SQL template selection
better-sqlite3 (SQLite; seeded customers, branches, applications, transactions)
       | structured API {data:...} or {error:{code,message}}
UI result renderer: narrative / table / chart / CSV / clipboard / query inspection
```

- `client/src/App.tsx`: typed chat, KPI cards, responsive dashboard, chart/table switch, CSV export, copy, SQL inspection, graceful errors.
- `server/src/engine.ts`: natural-language intent matching, query plans, bound parameters, result transformation.
- `server/src/db.ts`: relational schema, FK relations, seeded banking demo data.
- `server/src/index.ts`: API routes, request validation, security middleware, structured errors.
- `server/tests/engine.test.ts`: meaningful automated tests for safety, parameterization, validation, real seeded query results.

## Supported questions

- Show monthly transaction trends
- Compare transaction volume by branch
- Show transaction volume by branch in West region
- Show transactions by type
- What is the total transaction amount?
- What is the application approval rate?
- Show application status breakdown
- Show applications by product
- Show monthly onboarding trends
- Show customers by segment
- Show customers by branch
- Show customers by region
- How many customers do we have?

Questions outside these supported patterns return a helpful `422` response rather than a fabricated answer. The SQL shown in the UI is the actual executed template. Dates are synthetic 2025–2026 dates; money is arbitrary demo units and should not be interpreted as real banking data.

## Security decisions

**No model-produced SQL is ever executed.** The mocked AI layer only chooses a fixed, audited, read-only query template. Region filters use SQL placeholders and bound parameters. The API uses Zod length validation, a small JSON body limit, Helmet headers, explicit CORS origin, and non-leaking server errors. No user-submitted SQL is accepted. Production should additionally use authentication, tenant-scoped row-level access, audit logs, rate limits, PII masking, query timeouts, database read-only credentials, and a controlled semantic layer.

## Completed functionality

- Chat-style question submission and conversation history (in memory)
- Automatic dataset identification and approved SQL construction
- Live relational queries, seeded customers/branches/applications/transactions
- Text responses, chart/table toggle, KPI/overview cards
- Clipboard answer copy, CSV export, visible executed SQL
- Mobile responsive interface, loading state, errors, suggestions
- Typed backend/frontend, automated tests, `.env.example`

## Assumptions and limitations

- This is a **demo**, not a production banking system; all data is synthetic.
- AI is **mocked and deterministic**, not an external LLM. This is explicitly permitted by the project brief.
- Language coverage is intentionally limited to defined business intents; no free-form joins, arbitrary filters, multi-turn context, or follow-up reasoning.
- No sign-in, role permissions, user isolation, chart image export, persisted chats, or real bank integration.
- SQLite is appropriate for a local demonstration; PostgreSQL is a stronger production choice.
- The UI's data volume is small and returns all grouped results. Pagination and result caps should be enforced for large real datasets.

## Productionisation plan

1. Add SSO/OIDC, RBAC/ABAC, bank-specific tenant and row-level policies, secrets management.
2. Move to PostgreSQL with migrations, connection pooling, indexes, replicas, read-only query role.
3. Add a semantic metrics catalog and constrained LLM planner that produces a validated **typed query AST**, never raw executable SQL; require table/column allowlists, query-cost limits, and parameterization.
4. Add PII masking, request rate limiting, query budgets, audit trails, retention controls, encrypted transport, observability and tracing.
5. Add integration/E2E tests, accessibility checks, query benchmarks, CI pipelines, staging, Docker and deployments.
6. Add authenticated conversation persistence, exportable chart images, pagination, richer time filters and clarifying questions.

## AI tool usage disclosure

This initial codebase was generated with **OpenAI ChatGPT** as a coding assistant. Architecture was selected to satisfy the user's brief: React/TypeScript frontend, Express/TypeScript backend, SQLite relational data, Recharts visualization, deterministic mock AI with preapproved SQL templates, and Zod validation. The requester/developer should review, test, and take ownership of these decisions before claiming personal implementation or submitting. No external LLM key is required.

## Commit history

This distributed ZIP contains source files, not a Git repository. After extracting, create an authentic history using your own reviewed changes:

```bash
git init
git add .
git commit -m "feat: initialize full-stack banking analytics demo"
# Make and review further improvements, then commit them separately.
```

Do not claim a commit history exists until you create it, and do not claim AI-assisted decisions were made independently.


## Blank-screen troubleshooting (updated build)

Run `npm install` and `npm run dev`, then open the **Local** URL printed by Vite. The frontend now displays a diagnostic error screen if React rendering fails instead of remaining blank. Open Chrome DevTools Console for further details. Verify the backend using `http://localhost:4000/api/health`.

This update also avoids depending on `scrollIntoView` support in embedded browsers, uses a fallback for unavailable `crypto.randomUUID`, handles malformed overview responses, and supports copying in browsers without the modern Clipboard API.


## November 2026 runtime fix

The original `useEffect(() => bottom.current?.scrollIntoView?.(...), ...)` implicitly returned the result of `scrollIntoView`. React could interpret a non-function result as a cleanup callback and raise `destroy is not a function`. The scroll effect now uses a block-bodied callback, guaranteeing a `void` return.

Also added **Copy table** (tab-separated output suitable for pasting into Excel). The **Copy answer**, **Export CSV**, **View query**, charts, dashboard and safe-query mock engine remain available.

### Smoke test

1. `npm install`
2. `npm run build`
3. `npm test`
4. `npm run dev`
5. Open the Vite Local URL and ask `Show monthly transaction trends`.

If a blank screen persists, inspect the browser Console for a separate error.
