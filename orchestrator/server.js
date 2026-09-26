const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { analyzeProject } = require('./lib/projectAnalyzer');
const { listBugs, getBug } = require('./lib/bugCatalog');
const { applyFix } = require('./lib/fixApplier');
const { orchestrateAnalysis, estimateManualMinutes } = require('./agents/orchestratorAgent');
const { runTestingAgent } = require('./agents/testingAgent');
const { runDocumentationAgent } = require('./agents/documentationAgent');

const PROJECT_ROOT = path.join(__dirname, '..');
const SAMPLE_ROOT = path.join(PROJECT_ROOT, 'sample-project');
const PRISTINE_BACKUP = path.join(__dirname, 'data', 'pristine-sample-project');

// Preserve the original buggy state once, on first boot, so the demo
// can be reset and re-run repeatedly.
if (!fs.existsSync(PRISTINE_BACKUP)) {
  fs.cpSync(SAMPLE_ROOT, PRISTINE_BACKUP, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());
const DASHBOARD_DIST = path.join(PROJECT_ROOT, 'dashboard', 'dist');

app.use(express.static(DASHBOARD_DIST));
// In-memory session log — powers the productivity metrics in the final report.
// Cleared on server restart; this is a demo/prototype, not a persistence layer.
let session = {
  bugId: null,
  startedAt: null,
  events: [], // { step, timestampMs }
  analysis: null,
  fixResult: null,
  testBefore: null,
  testAfter: null
};

function logEvent(step) {
  session.events.push({ step, timestampMs: Date.now() });
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 1. Project structure
app.get('/api/project', (req, res) => {
  res.json(analyzeProject(SAMPLE_ROOT));
});

// 2. Known bugs (for "select or enter a known bug")
app.get('/api/bugs', (req, res) => {
  res.json(listBugs(PROJECT_ROOT));
});

// 3. Start AI analysis (parallel agents: debugging + testing baseline + quality)
app.post('/api/analyze', async (req, res) => {
  const { bugId } = req.body;
  const bug = getBug(bugId);
  if (!bug) return res.status(404).json({ error: `Unknown bug id "${bugId}"` });

  session = { bugId, startedAt: Date.now(), events: [], analysis: null, fixResult: null, testBefore: null, testAfter: null };
  logEvent('analysis-started');

  try {
    const result = await orchestrateAnalysis(PROJECT_ROOT, bugId);
    session.analysis = result;
    session.testBefore = result.testingBaseline;
    logEvent('analysis-complete');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Apply the suggested fix (real file edit)
app.post('/api/apply-fix', (req, res) => {
  const { bugId } = req.body;
  const bug = getBug(bugId);
  if (!bug) return res.status(404).json({ error: `Unknown bug id "${bugId}"` });

  try {
    const result = applyFix(PROJECT_ROOT, bugId);
    session.fixResult = result;
    logEvent('fix-applied');
    res.json({ applied: true, ...result });
  } catch (err) {
    res.status(409).json({ applied: false, error: err.message });
  }
});

// 5. Run tests (real Jest run against the sample backend)
app.post('/api/run-tests', async (req, res) => {
  logEvent('tests-started');
  const result = await runTestingAgent(PROJECT_ROOT);
  logEvent('tests-complete');

  if (!session.testBefore) {
    session.testBefore = result;
  } else {
    session.testAfter = result;
  }

  res.json(result);
});

// 6. Verify: current bug status + before/after
app.get('/api/verify/:bugId', (req, res) => {
  const bug = getBug(req.params.bugId);
  if (!bug) return res.status(404).json({ error: 'Unknown bug id' });
  res.json({ bugId: bug.id, resolved: !bug.detect(PROJECT_ROOT) });
});

// 7. Final report + productivity metrics
app.post('/api/report', async (req, res) => {
  const { bugId } = req.body;
  const bug = getBug(bugId || session.bugId);
  if (!bug) return res.status(400).json({ error: 'No bug analyzed yet in this session.' });

  logEvent('report-requested');

  const doc = await runDocumentationAgent({
    bug,
    debugResult: session.analysis ? session.analysis.debugging : { rootCause: 'n/a' },
    testBefore: session.testBefore,
    testAfter: session.testAfter,
    fixApplied: session.fixResult
  });

  const totalMs = session.events.length
    ? session.events[session.events.length - 1].timestampMs - session.startedAt
    : 0;

  const manualMinutesEstimate = estimateManualMinutes(bug);
  const aiMinutes = +(totalMs / 60000).toFixed(2);
  const timeSavedMinutes = +(manualMinutesEstimate - aiMinutes).toFixed(2);
  const timeSavedPercent = manualMinutesEstimate > 0
    ? Math.max(0, Math.round((timeSavedMinutes / manualMinutesEstimate) * 100))
    : 0;

  res.json({
    bug: { id: bug.id, title: bug.title, severity: bug.severity },
    resolved: !bug.detect(PROJECT_ROOT),
    changelog: doc.changelogEntry,
    testBefore: session.testBefore,
    testAfter: session.testAfter,
    timeline: session.events,
    productivityMetrics: {
      manualEffortEstimateMinutes: manualMinutesEstimate,
      devflowElapsedMinutes: aiMinutes,
      estimatedTimeSavedMinutes: Math.max(0, timeSavedMinutes),
      estimatedTimeSavedPercent: timeSavedPercent,
      note: 'Manual effort figure is an editable baseline estimate for comparison, not measured data.'
    }
  });
});

// 8. Reset the sample project back to its original buggy state (for repeat demos)
app.post('/api/reset', (req, res) => {
  fs.rmSync(SAMPLE_ROOT, { recursive: true, force: true });
  fs.cpSync(PRISTINE_BACKUP, SAMPLE_ROOT, { recursive: true });
  session = { bugId: null, startedAt: null, events: [], analysis: null, fixResult: null, testBefore: null, testAfter: null };
  res.json({ reset: true });
});
app.get('*', (req, res) => {
  res.sendFile(path.join(DASHBOARD_DIST, 'index.html'));
});
if (require.main === module) {
  const PORT = process.env.PORT || 4100;
  app.listen(PORT, () => console.log(`DevFlow AI orchestrator running on :${PORT}`));
}

module.exports = app;
