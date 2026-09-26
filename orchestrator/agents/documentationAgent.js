/**
 * Documentation Agent
 * Responsibilities: turn the debugging + testing agents' structured
 * output into a concise, human-readable changelog entry for the fix.
 */
async function runDocumentationAgent({ bug, debugResult, testBefore, testAfter, fixApplied }) {
  const lines = [];
  lines.push(`### Fix: ${bug.title}`);
  lines.push('');
  lines.push(`**Category:** ${bug.category}  `);
  lines.push(`**Severity:** ${bug.severity}  `);
  lines.push(`**Root cause:** ${debugResult.rootCause}`);
  lines.push('');
  lines.push(`**Files changed:** ${fixApplied ? fixApplied.file : bug.file}`);
  lines.push('');
  lines.push('**Change applied:**');
  lines.push('```diff');
  lines.push(bug.suggestedFix.diff);
  lines.push('```');
  if (testBefore && testAfter) {
    lines.push('');
    lines.push(
      `**Verification:** tests went from ${testBefore.passed}/${testBefore.testsRun} passing ` +
      `to ${testAfter.passed}/${testAfter.testsRun} passing after the fix.`
    );
  }

  return {
    changelogEntry: lines.join('\n'),
    source: 'local-template'
  };
}

module.exports = { runDocumentationAgent };
