# IBM Bob 2.0 — DevFlow AI Demo Guide

This document describes how IBM Bob 2.0 is used as the core AI engine inside
DevFlow AI, and provides a step-by-step demo script for showcasing Bob's
agent mode, parallel subagent tasks, testing, code review, documentation, and
workflow automation capabilities.

---

## Why IBM Bob 2.0?

DevFlow AI is built around the premise that IBM Bob 2.0's **agent mode** can
drive an entire developer debugging workflow — not just answer one-off questions,
but orchestrate multiple specialized sub-agents in parallel, understand real
project files, generate and run tests, propose fixes, review code, and produce
a structured final report.

The platform uses Bob as the "brain" of each agent:
- When `BOB_API_URL` is configured, every agent calls Bob's agent runtime for
  real AI-powered analysis.
- When not configured (the default offline/demo mode), agents fall back to
  deterministic local static analysis — the workflow is identical, only the
  analysis source changes (`source: "bob"` vs `source: "local-static-analysis"`).

---

## Architecture: Bob's Role

```
DevFlow AI Dashboard (React)
        │
        │ HTTP
        ▼
DevFlow AI Orchestrator (Express)
        │
        ├── Parallel Promise.all ──────────────────────┐
        │                                              │
        ├──▶ Debugging Agent ──▶ [callBob / local]    │
        ├──▶ Testing Agent   ──▶ [Jest + callBob]     │  IBM Bob 2.0
        └──▶ Quality Agent   ──▶ [static + callBob]   │  Agent Runtime
                                                       │
        ├──▶ Review Stage    ──▶ [callBob / local]    │
        └──▶ Documentation Agent ──▶ [callBob / local]│
                                                       │
        └──────────────────────────────────────────────┘
```

The AI abstraction is contained entirely in `orchestrator/lib/aiProvider.js`.
Adding a live Bob endpoint requires only setting two environment variables —
no application code changes needed.

---

## Demo Steps: Showcasing IBM Bob Features

### Step 1 — Project Understanding (Bob reads and understands a real project)

**Bob capability demonstrated:** Document & code understanding

1. Open the DevFlow AI dashboard at `http://localhost:5174`
2. The dashboard auto-loads the sample project structure via `GET /api/project`
3. Bob (or local analyzer) reads `sample-project/backend/` and `sample-project/frontend/`
   to build the project tree, count files/directories, and map API routes
4. **Narration:** "Bob has scanned the project and found 4 bugs across 3 files
   before a single manual investigation step."

**Files involved:**
- `orchestrator/lib/projectAnalyzer.js` — walks the real project tree
- `orchestrator/lib/bugCatalog.js` — `detect()` re-reads actual source files

---

### Step 2 — Parallel Agent Execution (Bob runs 3 subagents at once)

**Bob capability demonstrated:** Parallel subagent tasks

1. Select any bug from the "Known Issues" list (e.g. Bug #1 — API mismatch)
2. Click **"Start AI Analysis"**
3. The dashboard shows 3 agent cards animating simultaneously:
   - **Debugging Agent** — root cause, affected files, severity, fix proposal
   - **Testing Agent** — baseline test run (real Jest execution)
   - **Security/Quality Agent** — static analysis for hardcoded secrets, missing validation, etc.
4. Results arrive together via `Promise.all`

**Files involved:**
- `orchestrator/agents/orchestratorAgent.js` — `Promise.all([debug, test, quality])`
- `orchestrator/agents/debuggingAgent.js`
- `orchestrator/agents/testingAgent.js`
- `orchestrator/agents/qualityAgent.js`

**Key line to show:**
```js
// orchestratorAgent.js — three agents run in parallel, not sequentially
const [debugResult, baselineTestResult, qualityResult] = await Promise.all([
  runDebuggingAgent(projectRoot, bugId),
  runTestingAgent(projectRoot),
  runQualityAgent(projectRoot)
]);
```

---

### Step 3 — Debugging (Bob analyzes root cause and proposes a fix)

**Bob capability demonstrated:** Code debugging and fix recommendation

After analysis completes:
1. The dashboard shows the **Root Cause** panel with:
   - Bug title and category
   - Severity and confidence
   - Affected files list
   - Full root cause explanation
   - A syntax-highlighted diff of the suggested fix
2. Click **"Apply Fix"** — DevFlow AI actually edits the file on disk
3. `bugCatalog.js`'s `detect()` function re-reads the file and confirms the fix

**Narration for Bug #1 (API mismatch):**
> "The Debugging Agent identified that the backend `POST /api/login` handler
> returns `{ name: username }` but the frontend reads `response.username`.
> Bob traces this to a field name mismatch at the API boundary, proposes a
> one-line fix, and applies it automatically."

---

### Step 4 — Testing (Bob discovers and runs existing tests)

**Bob capability demonstrated:** Test execution and failure analysis

1. After the fix is applied, click **"Run Tests"**
2. DevFlow AI spawns a real `jest --json` process against `sample-project/backend`
3. The dashboard shows:
   - Tests before the fix (should show failures for Bug #1, #2, or #4)
   - Tests after the fix (should show all passing)
4. A verification check confirms the bug is resolved

**Key flow:**
```
Run Tests → spawn jest --json → parse results → compare before/after
```

**Files involved:**
- `orchestrator/lib/testRunner.js` — real `child_process.spawn` Jest run
- `orchestrator/agents/testingAgent.js` — wraps testRunner, maps output
- `sample-project/backend/tests/tasks.test.js` — actual test suite

---

### Step 5 — Code Review (Bob reviews the combined changes)

**Bob capability demonstrated:** Code review with structured findings

The quality agent (`runQualityAgent`) performs static code review across all
changed files, checking for:
- Missing input validation (found in `POST /api/tasks`)
- Hard-coded credentials (checks for token/secret literals)
- Unsafe `fetch()` calls without `res.ok` check
- Case-sensitive string comparisons (search filter bug)

Each finding includes severity, file path, and a plain-language recommendation.

**To demonstrate:**
```bash
curl http://localhost:4100/api/analyze \
  -X POST -H "Content-Type: application/json" \
  -d '{"bugId":"bug-4-validation"}'
```
Response includes `quality.findings` array with severity-tagged items.

---

### Step 6 — Documentation (Bob generates a changelog entry)

**Bob capability demonstrated:** Automated documentation generation

1. After verification passes, click **"Generate Final Report"**
2. The Documentation Agent produces a structured changelog entry:
   - Fix title and category
   - Root cause summary
   - Files changed
   - Diff applied
   - Test verification (before → after counts)
3. The report also shows **productivity metrics**: manual baseline estimate
   vs actual DevFlow AI elapsed time, with time-saved calculation

**Files involved:**
- `orchestrator/agents/documentationAgent.js`
- `orchestrator/server.js` — in-memory session timeline

---

### Step 7 — Final Verification (Bob confirms end-to-end correctness)

**Bob capability demonstrated:** End-to-end workflow validation

1. The final report shows the complete workflow timeline:
   - `analysis-started` → `analysis-complete` → `fix-applied` → `tests-started`
   → `tests-complete` → `report-requested`
2. Each event has a real timestamp (not simulated)
3. The `GET /api/verify/:bugId` endpoint re-reads the actual file to confirm
   the bug is gone — this is a real check, not a scripted pass

---

## Enabling Live IBM Bob 2.0 (Post-Demo)

To replace local static analysis with real Bob AI calls:

```bash
# In orchestrator/.env (create from .env.example)
BOB_API_URL=https://your-bob-instance.example.com
BOB_API_KEY=your-api-key-here
```

Then restart the orchestrator (`npm start`). Every agent will now:
1. Check `isBobConfigured()` → true
2. Call `callBob({ task: 'debug-analysis', payload: { bugId, file } })`
3. Return real Bob-powered analysis with `source: "bob"`

No other code changes needed. The fallback to local analysis is still there
for graceful degradation if the Bob endpoint is unreachable.

---

## Full Workflow API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/project` | Project tree + summary |
| GET | `/api/bugs` | List all known bugs with live status |
| POST | `/api/analyze` | Run parallel agents (debug + test + quality) |
| POST | `/api/apply-fix` | Apply suggested fix to disk |
| POST | `/api/run-tests` | Run Jest suite, return structured results |
| GET | `/api/verify/:bugId` | Confirm bug is resolved (re-reads file) |
| POST | `/api/report` | Generate final changelog + productivity metrics |
| POST | `/api/reset` | Restore sample project to original buggy state |

---

## Suggested Next Bob Tasks (Post-Hackathon)

1. **Connect live Bob endpoint** — set `BOB_API_URL` and run the full workflow
   with real AI analysis instead of local static analysis
2. **Add more bugs** — extend `bugCatalog.js` with additional real-world patterns
   (N+1 queries, missing auth middleware, incorrect status codes)
3. **Multi-project support** — let DevFlow AI scan any Git repo URL instead of
   the fixed sample project
4. **CI/CD integration** — trigger DevFlow AI analysis on every PR via a GitHub
   Actions webhook calling `POST /api/analyze`
5. **Bob-powered code review** — pipe the `quality.findings` into Bob's chat
   interface for interactive discussion and inline fix suggestions
