const { getBug } = require('../lib/bugCatalog');
const { isBobConfigured, callBob, BobNotConfiguredError } = require('../lib/aiProvider');

/**
 * Debugging Agent
 * Responsibilities: analyze the error, inspect the relevant source
 * files, identify root cause + affected files, and propose a fix.
 * Only returns concise conclusions and evidence — no chain-of-thought.
 */
async function runDebuggingAgent(projectRoot, bugId) {
  const bug = getBug(bugId);
  if (!bug) throw new Error(`Unknown bug id: ${bugId}`);

  const stillPresent = bug.detect(projectRoot);

  if (isBobConfigured()) {
    try {
      const bobResult = await callBob({
        task: 'debug-analysis',
        payload: { bugId, file: bug.file }
      });
      return { ...bobResult, source: 'bob' };
    } catch (err) {
      if (!(err instanceof BobNotConfiguredError)) throw err;
      // fall through to local mode
    }
  }

  return {
    bug: bug.title,
    category: bug.category,
    rootCause: bug.rootCause,
    affectedFiles: bug.relatedFiles,
    severity: bug.severity,
    suggestedFix: bug.suggestedFix,
    confidence: bug.confidence,
    status: stillPresent ? 'unresolved' : 'already-resolved',
    source: 'local-static-analysis'
  };
}

module.exports = { runDebuggingAgent };
