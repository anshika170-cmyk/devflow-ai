import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  FolderTree,
  PlayCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

import * as api from './api.js';
import ProjectTree from './components/ProjectTree.jsx';
import AgentGrid from './components/AgentGrid.jsx';
import DiffView from './components/DiffView.jsx';

const STEPS = [
  'Select Project',
  'View Structure',
  'Select Bug',
  'Run Agents',
  'Root Cause',
  'Suggested Fix',
  'Apply Fix',
  'Run Tests',
  'Verify',
  'Final Report'
];

export default function App() {
  const [project, setProject] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [selectedBugId, setSelectedBugId] = useState(null);

  const [agentStatuses, setAgentStatuses] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [fixResult, setFixResult] = useState(null);
  const [applyingFix, setApplyingFix] = useState(false);

  const [testResult, setTestResult] = useState(null);
  const [testingBusy, setTestingBusy] = useState(false);

  const [verified, setVerified] = useState(null);

  const [report, setReport] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);

  const [error, setError] = useState(null);

  // --------------------------------------------------
  // Initial loading
  // --------------------------------------------------

  useEffect(() => {
    loadProject();
    loadBugs();
  }, []);

  async function loadProject() {
    try {
      setProject(await api.getProject());
    } catch (e) {
      setError(
        `Could not reach the orchestrator API at :4100 — is it running? (${e.message})`
      );
    }
  }

  async function loadBugs() {
    try {
      setBugs(await api.getBugs());
    } catch (e) {
      setError(e.message);
    }
  }

  // --------------------------------------------------
  // Workflow progress
  // --------------------------------------------------

  function currentStepIndex() {
    if (report) return 9;
    if (verified) return 8;
    if (testResult) return 7;
    if (fixResult) return 6;
    if (analysis) return 5;
    if (analyzing) return 3;
    if (selectedBugId) return 2;

    return 0;
  }

  // --------------------------------------------------
  // Select bug
  // --------------------------------------------------

  function handleSelectBug(bugId) {
    setSelectedBugId(bugId);

    setAnalysis(null);
    setFixResult(null);
    setTestResult(null);
    setVerified(null);
    setReport(null);

    setAgentStatuses({});
    setError(null);
  }

  // --------------------------------------------------
  // AI analysis
  // --------------------------------------------------

  async function handleAnalyze() {
    if (!selectedBugId) return;

    setError(null);
    setAnalyzing(true);

    setAgentStatuses({
      debugging: 'running',
      testing: 'running',
      quality: 'running',
      documentation: 'idle'
    });

    try {
      const result = await api.analyzeBug(selectedBugId);

      setAnalysis(result);

      setAgentStatuses({
        debugging: 'done',
        testing: 'done',
        quality: 'done',
        documentation: 'idle'
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  // --------------------------------------------------
  // Apply fix
  // --------------------------------------------------

  async function handleApplyFix() {
    if (!selectedBugId) return;

    setError(null);
    setApplyingFix(true);

    try {
      const result = await api.applyFix(selectedBugId);

      setFixResult(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setApplyingFix(false);
    }
  }

  // --------------------------------------------------
  // Run tests + verification
  // --------------------------------------------------

  async function handleRunTests() {
    if (!selectedBugId) return;

    setError(null);
    setTestingBusy(true);

    setAgentStatuses((s) => ({
      ...s,
      testing: 'running'
    }));

    try {
      const result = await api.runTests();

      setTestResult(result);

      setAgentStatuses((s) => ({
        ...s,
        testing: 'done'
      }));

      const v = await api.verifyBug(selectedBugId);

      setVerified(v);
    } catch (e) {
      setError(e.message);
    } finally {
      setTestingBusy(false);
    }
  }

  // --------------------------------------------------
  // Generate final report
  // --------------------------------------------------

  async function handleGenerateReport() {
    if (!selectedBugId) return;

    setError(null);
    setReportBusy(true);

    setAgentStatuses((s) => ({
      ...s,
      documentation: 'running'
    }));

    try {
      const result = await api.getReport(selectedBugId);

      setReport(result);

      setAgentStatuses((s) => ({
        ...s,
        documentation: 'done'
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setReportBusy(false);
    }
  }

  // --------------------------------------------------
  // Reset demo
  // --------------------------------------------------

  async function handleReset() {
    try {
      setError(null);

      await api.resetProject();

      setSelectedBugId(null);
      setAnalysis(null);
      setFixResult(null);
      setTestResult(null);
      setVerified(null);
      setReport(null);

      setAgentStatuses({});

      await loadProject();
      await loadBugs();
    } catch (e) {
      setError(e.message);
    }
  }

  const activeIdx = currentStepIndex();

  return (
    <div className="app">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="header">
        <div className="brand">
          <Sparkles size={20} color="#7c6bf0" />

          DevFlow AI

          <span className="tag">
            AI-Powered Debugging & Testing Workflow
          </span>
        </div>

        <button
          className="reset-btn"
          onClick={handleReset}
        >
          <RotateCcw
            size={13}
            style={{
              marginRight: 6,
              verticalAlign: -2
            }}
          />

          Reset demo project
        </button>
      </div>

      {/* ==================================================
          WORKFLOW STEPS
      ================================================== */}

      <div className="steps">
        {STEPS.map((step, index) => (
          <span
            key={step}
            className={`step-pill ${
              index === activeIdx
                ? 'active'
                : index < activeIdx
                  ? 'done'
                  : ''
            }`}
          >
            {index + 1}. {step}
          </span>
        ))}
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div
          className="card"
          style={{
            borderColor: '#f26a6a55'
          }}
        >
          <strong style={{ color: 'var(--bad)' }}>
            ⚠ {error}
          </strong>
        </div>
      )}

      {/* ==================================================
          STEP 1-2: PROJECT STRUCTURE
      ================================================== */}

      <div className="card">
        <h2>
          <FolderTree
            size={16}
            style={{
              verticalAlign: -3,
              marginRight: 6
            }}
          />

          Sample Project: TaskFlow
        </h2>

        <div className="sub">
          {project
            ? `${project.summary.fileCount} files across ${project.summary.dirCount} directories — React + Express task manager (intentionally buggy demo target)`
            : 'Loading project structure…'}
        </div>

        {project && (
          <div
            style={{
              maxHeight: 220,
              overflowY: 'auto'
            }}
          >
            <ProjectTree tree={project.tree} />
          </div>
        )}
      </div>

      {/* ==================================================
          STEP 3: SELECT BUG
      ================================================== */}

      <div className="card">
        <h2>Known Issues</h2>

        <div className="sub">
          Select a bug to investigate — or point DevFlow AI
          at any of the four seeded issues.
        </div>

        <div className="bug-list">
          {bugs.map((bug) => (
            <div
              key={bug.id}
              className={`bug-item ${
                selectedBugId === bug.id
                  ? 'selected'
                  : ''
              }`}
              onClick={() =>
                handleSelectBug(bug.id)
              }
            >
              <div>
                <strong>{bug.title}</strong>

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-dim)'
                  }}
                >
                  {bug.file}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center'
                }}
              >
                {bug.resolved && (
                  <span className="badge resolved">
                    resolved
                  </span>
                )}

                <span
                  className={`badge ${bug.severity}`}
                >
                  {bug.severity}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            className="btn"
            disabled={
              !selectedBugId || analyzing
            }
            onClick={handleAnalyze}
          >
            <PlayCircle
              size={15}
              style={{
                verticalAlign: -3,
                marginRight: 6
              }}
            />

            {analyzing
              ? 'Running agents…'
              : 'Start AI Analysis'}
          </button>
        </div>
      </div>

      {/* ==================================================
          STEP 4: PARALLEL AGENTS
      ================================================== */}

      {(analyzing || analysis) && (
        <div className="card">
          <h2>Agents Working</h2>

          <div className="sub">
            Orchestrator runs Debugging, Testing
            (baseline), and Security/Quality agents
            in parallel.
          </div>

          <AgentGrid statuses={agentStatuses} />
        </div>
      )}

      {/* ==================================================
          STEP 5-6: ROOT CAUSE + SUGGESTED FIX
      ================================================== */}

      {analysis && (
        <div className="card">
          <h2>Root Cause Analysis</h2>

          <div className="grid-2">

            {/* Left side */}
            <div>
              <p>
                <strong>Bug:</strong>{' '}
                {analysis.debugging.bug}
              </p>

              <p>
                <strong>Severity:</strong>{' '}
                {analysis.debugging.severity}
              </p>

              <p>
                <strong>Confidence:</strong>{' '}
                {(
                  analysis.debugging.confidence *
                  100
                ).toFixed(0)}
                %
              </p>

              <p>
                <strong>
                  Affected files:
                </strong>
              </p>

              <ul>
                {analysis.debugging.affectedFiles.map(
                  (file) => (
                    <li
                      key={file}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 13
                      }}
                    >
                      {file}
                    </li>
                  )
                )}
              </ul>

              <p
                style={{
                  color: 'var(--text-dim)',
                  fontSize: 13
                }}
              >
                Source:{' '}
                {analysis.debugging.source}
              </p>
            </div>

            {/* Right side */}
            <div>
              <p>
                <strong>Root cause</strong>
              </p>

              <p
                style={{
                  color: 'var(--text-dim)',
                  fontSize: 14,
                  lineHeight: 1.6
                }}
              >
                {analysis.debugging.rootCause}
              </p>
            </div>
          </div>

          {/* Quality / security findings */}

          {analysis.quality.findings.length > 0 && (
            <>
              <p style={{ marginTop: 10 }}>
                <strong>
                  Quality/Security findings (
                  {analysis.quality.findings.length}
                  )
                </strong>
              </p>

              <ul>
                {analysis.quality.findings.map(
                  (finding, index) => (
                    <li
                      key={index}
                      style={{
                        fontSize: 13,
                        color: 'var(--text-dim)'
                      }}
                    >
                      <span
                        className={`badge ${finding.severity}`}
                        style={{
                          marginRight: 6
                        }}
                      >
                        {finding.severity}
                      </span>

                      {finding.message}

                      {' — '}

                      <span
                        style={{
                          fontFamily: 'monospace'
                        }}
                      >
                        {finding.file}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </>
          )}

          {/* Suggested fix */}

          <p style={{ marginTop: 14 }}>
            <strong>Suggested Fix</strong>
          </p>

          <p
            className="sub"
            style={{
              marginBottom: 8
            }}
          >
            {
              analysis.debugging
                .suggestedFix.description
            }
          </p>

          <DiffView
            diff={
              analysis.debugging
                .suggestedFix.diff
            }
          />

          {/* Apply fix */}

          <div style={{ marginTop: 14 }}>
            <button
              className="btn"
              disabled={
                applyingFix || fixResult
              }
              onClick={handleApplyFix}
            >
              {fixResult
                ? 'Fix applied ✓'
                : applyingFix
                  ? 'Applying…'
                  : 'Apply Fix'}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          STEP 7-9: TESTS + VERIFICATION
      ================================================== */}

      {fixResult && (
        <div className="card">
          <h2>Run Tests</h2>

          <div className="sub">
            Executes the real Jest suite against
            the sample backend.
          </div>

          <button
            className="btn secondary"
            disabled={testingBusy}
            onClick={handleRunTests}
          >
            {testingBusy
              ? 'Running tests…'
              : 'Run Tests'}
          </button>

          {testResult && (
            <div style={{ marginTop: 16 }}>

              <div className="grid-2">

                {/* Before fix */}

                <div className="agent-card">
                  <div className="title">
                    Before fix
                  </div>

                  {analysis?.testingBaseline
                    ?.status === 'error' ? (
                    <p className="sub">
                      {
                        analysis
                          .testingBaseline
                          .error
                      }
                    </p>
                  ) : (
                    <p>
                      <span
                        className={
                          analysis?.testingBaseline
                            ?.failed === 0
                            ? 'pass'
                            : 'fail'
                        }
                      >
                        {
                          analysis
                            ?.testingBaseline
                            ?.passed
                        }
                        /
                        {
                          analysis
                            ?.testingBaseline
                            ?.testsRun
                        }{' '}
                        passing
                      </span>
                    </p>
                  )}
                </div>

                {/* After fix */}

                <div className="agent-card">
                  <div className="title">
                    After fix
                  </div>

                  {testResult.status ===
                  'error' ? (
                    <p className="sub">
                      {testResult.error}
                    </p>
                  ) : (
                    <p>
                      <span
                        className={
                          testResult.failed === 0
                            ? 'pass'
                            : 'fail'
                        }
                      >
                        {testResult.passed}/
                        {testResult.testsRun}{' '}
                        passing
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Remaining failures */}

              {testResult.failures?.length >
                0 && (
                <ul
                  style={{
                    marginTop: 10
                  }}
                >
                  {testResult.failures.map(
                    (failure, index) => (
                      <li
                        key={index}
                        style={{
                          fontSize: 13,
                          color: 'var(--bad)'
                        }}
                      >
                        {failure.test} —{' '}
                        {failure.message}
                      </li>
                    )
                  )}
                </ul>
              )}

              {/* Verification result */}

              {verified && (
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {verified.resolved ? (
                    <>
                      <CheckCircle2
                        size={16}
                        color="var(--good)"
                      />

                      <strong className="pass">
                        Bug verified as resolved
                      </strong>
                    </>
                  ) : (
                    <>
                      <XCircle
                        size={16}
                        color="var(--bad)"
                      />

                      <strong className="fail">
                        Bug still present — iterate
                        on the fix
                      </strong>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          STEP 10: FINAL REPORT
          
          IMPORTANT:
          Use verified instead of verified?.resolved
          so the Final Report button appears after
          verification has completed.
      ================================================== */}

      {verified && (
        <div className="card">
          <h2>Final Report</h2>

          <button
            className="btn"
            disabled={reportBusy}
            onClick={handleGenerateReport}
          >
            {reportBusy
              ? 'Generating…'
              : report
                ? 'Regenerate Report'
                : 'Generate Final Report'}
          </button>

          {/* Report contents */}

          {report && (
            <div style={{ marginTop: 16 }}>

              {/* Productivity metrics */}

              <div className="metric-grid">

                <div className="metric">
                  <div className="value">
                    {
                      report
                        .productivityMetrics
                        .manualEffortEstimateMinutes
                    }
                    m
                  </div>

                  <div className="label">
                    Manual baseline
                  </div>
                </div>

                <div className="metric">
                  <div className="value">
                    {
                      report
                        .productivityMetrics
                        .devflowElapsedMinutes
                    }
                    m
                  </div>

                  <div className="label">
                    DevFlow AI elapsed
                  </div>
                </div>

                <div className="metric">
                  <div className="value">
                    {
                      report
                        .productivityMetrics
                        .estimatedTimeSavedMinutes
                    }
                    m
                  </div>

                  <div className="label">
                    Time saved
                  </div>
                </div>

                <div className="metric">
                  <div className="value">
                    {
                      report
                        .productivityMetrics
                        .estimatedTimeSavedPercent
                    }
                    %
                  </div>

                  <div className="label">
                    Faster
                  </div>
                </div>

              </div>

              {/* Report note */}

              <p
                className="sub"
                style={{
                  marginTop: 8
                }}
              >
                {
                  report
                    .productivityMetrics
                    .note
                }
              </p>

              {/* Changelog */}

              <p
                style={{
                  marginTop: 14
                }}
              >
                <strong>
                  Changelog
                </strong>
              </p>

              <pre
                className="code"
                style={{
                  whiteSpace: 'pre-wrap'
                }}
              >
                {report.changelog}
              </pre>

              {/* Workflow timeline */}

              <p
                style={{
                  marginTop: 14
                }}
              >
                <strong>
                  Workflow timeline
                </strong>
              </p>

              <div>
                {report.timeline.map(
                  (event, index) => (
                    <div
                      className="timeline-item"
                      key={index}
                    >
                      <span className="dot" />

                      {event.step} —{' '}
                      {new Date(
                        event.timestampMs
                      ).toLocaleTimeString()}
                    </div>
                  )
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}