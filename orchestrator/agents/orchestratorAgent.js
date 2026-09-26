const { getBug } = require('../lib/bugCatalog');
const { runDebuggingAgent } = require('./debuggingAgent');
const { runTestingAgent } = require('./testingAgent');
const { runQualityAgent } = require('./qualityAgent');

// Rough manual-effort baselines (minutes) used for the productivity
// comparison in the final report. These are editable estimates, not
// measured data — the report clearly labels them as such.
const MANUAL_BASELINE_MINUTES = {
  high: 45,
  medium: 30,
  low: 15
};

/**
 * Main Orchestrator Agent
 * Receives the developer's request (a bugId), delegates to the
 * Debugging, Testing, and Security/Quality subagents IN PARALLEL
 * (Promise.all — this is the "parallel subagents" step of the
 * workflow), collects their results, and decides the next step.
 */
async function orchestrateAnalysis(projectRoot, bugId) {
  const bug = getBug(bugId);
  if (!bug) throw new Error(`Unknown bug id: ${bugId}`);

  const startedAt = Date.now();

  // Parallel subagent execution
  const [debugResult, baselineTestResult, qualityResult] = await Promise.all([
    runDebuggingAgent(projectRoot, bugId),
    runTestingAgent(projectRoot),
    runQualityAgent(projectRoot)
  ]);

  const durationMs = Date.now() - startedAt;

  return {
    bugId,
    bug: { title: bug.title, category: bug.category, severity: bug.severity, file: bug.file },
    debugging: debugResult,
    testingBaseline: baselineTestResult,
    quality: qualityResult,
    orchestration: {
      agentsRun: ['debugging', 'testing', 'quality'],
      executionMode: 'parallel',
      durationMs
    }
  };
}

function estimateManualMinutes(bug) {
  return MANUAL_BASELINE_MINUTES[bug.severity] || 30;
}

module.exports = { orchestrateAnalysis, estimateManualMinutes, MANUAL_BASELINE_MINUTES };
