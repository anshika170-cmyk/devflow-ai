# DevFlow AI

**AI-Powered Developer Workflow Automation Platform**  
IBM Bob 2.0 Hackathon Prototype

---

## Problem Statement

Developers spend significant unplanned time on tasks that are repetitive,
context-heavy, and interruptive: debugging unfamiliar code, writing tests for
existing features, understanding what the existing tests cover, reviewing diffs,
and documenting what was changed. These tasks typically happen sequentially and
in isolation — each one pulls focus from the work that actually shipped features.

## Solution

DevFlow AI is an orchestrated multi-agent pipeline with a developer-facing
dashboard that automates the full debugging workflow:

**Project Scan → Parallel Analysis → Findings → Fix Recommendation → Testing → Code Review → Final Report**

Instead of a chat interface, it runs a deterministic sequence of specialized
agents against a real (intentionally buggy) project, showing every step actually
happening. IBM Bob 2.0 is the AI engine behind each agent; when Bob is not
configured, deterministic local static analysis runs instead — the workflow is
identical either way.

---

## Architecture

```
devflow-ai/
├── sample-project/          Intentionally buggy Express + React demo target
│   ├── backend/              Node/Express API — Bugs #1, #2, #4 + failing tests
│   └── frontend/             React + Vite UI — Bug #3
│
├── orchestrator/            DevFlow AI's brain (Express API on :4100)
│   ├── agents/
│   │   ├── orchestratorAgent.js   Promise.all parallel dispatch
│   │   ├── debuggingAgent.js      Root cause + fix proposal
│   │   ├── testingAgent.js        Jest runner + result parsing
│   │   ├── qualityAgent.js        Static security/quality checks
│   │   └── documentationAgent.js  Changelog generation
│   ├── lib/
│   │   ├── aiProvider.js          IBM Bob 2.0 abstraction (callBob / fallback)
│   │   ├── bugCatalog.js          Bug definitions + live detect() checks
│   │   ├── fixApplier.js          Real file edits on disk
│   │   ├── projectAnalyzer.js     Project tree walker
│   │   └── testRunner.js          child_process Jest executor
│   ├── tests/
│   │   └── orchestrator.test.js   API integration tests
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── dashboard/               React + Vite developer UI (Vite dev server on :5174)
│   └── src/
│       ├── App.jsx                Full workflow UI (10-step pipeline)
│       ├── api.js                 Typed fetch wrappers for orchestrator API
│       └── components/
│           ├── AgentGrid.jsx      Parallel agent status cards
│           ├── DiffView.jsx       Syntax-highlighted diff renderer
│           └── ProjectTree.jsx    File tree display
│
├── README.md
└── IBM_BOB_DEMO.md          Bob 2.0 demo script and integration guide
```

---

## Workflow

```
1. Project Scan         → Walk real project files, count, categorize
2. Select Bug           → Choose from 4 seeded real bugs (live detect())
3. Parallel Analysis    → 3 agents run simultaneously via Promise.all:
   ├── Debugging Agent  → Root cause, affected files, severity, fix diff
   ├── Testing Agent    → Run Jest suite, parse actual results
   └── Quality Agent    → Static checks: validation, secrets, error handling
4. Apply Fix            → Real targeted string replacement on disk
5. Run Tests            → Post-fix Jest run, before/after comparison
6. Verify               → Re-read source file to confirm bug is gone
7. Final Report         → Changelog entry + productivity metrics
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend UI | React 18, Vite 5, plain CSS |
| Backend Orchestrator | Node.js, Express 4 |
| Testing | Jest 29, Supertest |
| AI Integration | IBM Bob 2.0 (via `aiProvider.js` abstraction) |
| Icons | lucide-react |

No MongoDB. No Docker. No authentication. No paid API keys required for MVP.

---

## Seeded Bugs in the Sample Project

| # | Bug | File | Type |
|---|-----|------|------|
| 1 | Login response returns `name` but frontend reads `username` | `backend/routes/auth.js` | API contract mismatch |
| 2 | Search uses `startsWith` instead of case-insensitive `includes` | `backend/routes/tasks.js` | Logic bug |
| 3 | `fetchTasks()` has no `try/catch` or `res.ok` check | `frontend/src/api.js` | Missing error handling |
| 4 | `POST /tasks` accepts empty/blank titles without validation | `backend/routes/tasks.js` | Missing validation |
| 5 | Jest test that fails until Bug #2 is fixed | `backend/tests/tasks.test.js` | Failing test |

All bugs are detected live: `bugCatalog.js`'s `detect()` functions re-read the
actual files on disk, so the dashboard badges and diffs always reflect the real
current state of the project.

---

## Installation & Running

Each of the three apps needs its own `npm install`.

```bash
# Terminal 1 — Sample buggy backend (optional but enables real test runs)
cd devflow-ai/sample-project/backend
npm install
npm start            # http://localhost:4000

# Terminal 2 — DevFlow AI orchestrator (required)
cd devflow-ai/orchestrator
npm install
npm start            # http://localhost:4100

# Terminal 3 — DevFlow AI dashboard (required)
cd devflow-ai/dashboard
npm install
npm run dev          # http://localhost:5174
```

Open **http://localhost:5174** and click through the workflow.

---

## Running Tests

### Sample project tests (the intentionally buggy suite)

```bash
cd devflow-ai/sample-project/backend
npm install
npm test
```

Expected output: **3 tests fail** (Bugs #1, #2, #4). After DevFlow AI applies
fixes, all tests pass. This before/after is shown in the dashboard.

### Orchestrator API tests

```bash
cd devflow-ai/orchestrator
npm install
npm test
```

Tests cover: health endpoint, project structure endpoint, bugs list endpoint,
analyze endpoint (valid + invalid inputs), and verify endpoint.

---

## Demo Mode

The application is fully functional **without any AI API key**.

When `BOB_API_URL` is not set in the orchestrator environment:
- `aiProvider.js` throws `BobNotConfiguredError` instead of making a fake call
- Each agent catches that specific error and falls back to **local static analysis**
- Real project files are read from disk; real Jest tests are executed
- Every agent response is labeled `source: "local-static-analysis"` (not `"bob"`)

To enable live IBM Bob 2.0 analysis:
```bash
# orchestrator/.env  (copy from .env.example)
BOB_API_URL=https://your-bob-instance.example.com
BOB_API_KEY=your-api-key-here
```

No other code changes are needed.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/project` | Project tree + file/directory summary |
| `GET` | `/api/bugs` | List all bugs with live resolved status |
| `POST` | `/api/analyze` | Run parallel agents `{ bugId }` |
| `POST` | `/api/apply-fix` | Apply fix to disk `{ bugId }` |
| `POST` | `/api/run-tests` | Execute Jest suite, return structured results |
| `GET` | `/api/verify/:bugId` | Re-read file and confirm bug is resolved |
| `POST` | `/api/report` | Generate changelog + productivity metrics `{ bugId }` |
| `POST` | `/api/reset` | Restore sample project to original buggy state |

---

## Sample Workflow (curl)

```bash
# 1. Scan the project
curl http://localhost:4100/api/project

# 2. List known bugs
curl http://localhost:4100/api/bugs

# 3. Run parallel analysis on bug #1
curl -X POST http://localhost:4100/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"bugId":"bug-1-api-mismatch"}'

# 4. Apply the fix
curl -X POST http://localhost:4100/api/apply-fix \
  -H "Content-Type: application/json" \
  -d '{"bugId":"bug-1-api-mismatch"}'

# 5. Run tests and verify
curl -X POST http://localhost:4100/api/run-tests
curl http://localhost:4100/api/verify/bug-1-api-mismatch

# 6. Generate the final report
curl -X POST http://localhost:4100/api/report \
  -H "Content-Type: application/json" \
  -d '{"bugId":"bug-1-api-mismatch"}'

# 7. Reset for next demo
curl -X POST http://localhost:4100/api/reset
```

---

## Known Limitations

- **In-memory session** — the orchestrator session (timeline, test results) is
  reset on server restart. This is intentional for a demo prototype.
- **Single project** — the sample project path is hard-coded. Multi-project
  support would require adding a project registry.
- **No persistence** — there is no database. All state is on disk (sample project
  files) or in memory (session).
- **Manual effort estimate** — the productivity metrics compare against an
  editable baseline (45/30/15 minutes by severity), not measured developer time.
  The report labels this clearly.
- **Node 18+** — the orchestrator uses `fetch` (built-in since Node 18). Run
  `node --version` and upgrade if needed.

---

## Recommended Next Bob Task

With the MVP running, the natural next step is:
1. Set `BOB_API_URL` + `BOB_API_KEY` and run the workflow with a live Bob endpoint
2. Use Bob's **agent mode** interactively to extend `bugCatalog.js` with new bugs
3. Connect a GitHub webhook to trigger `POST /api/analyze` on every pull request

See `IBM_BOB_DEMO.md` for a complete demo script and integration guide.

---

## Future Improvements

- Multi-repo support (accept a Git URL or local path at runtime)
- Persistent session storage (SQLite or JSON file)
- Streaming agent results via SSE for real-time dashboard updates
- PR/GitHub Actions integration for CI-triggered analysis
- Bob-powered interactive code review in the dashboard
