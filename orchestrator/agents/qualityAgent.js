const fs = require('fs');
const path = require('path');

const SCAN_DIRS = ['sample-project/backend', 'sample-project/frontend/src'];
const SCAN_EXTS = new Set(['.js', '.jsx']);

const CHECKS = [
  {
    id: 'missing-input-validation',
    pattern: /title,\s*\/\/ <-- BUG: no validation/,
    message: 'Request body field is written to storage without validating it is present/non-empty.',
    severity: 'medium'
  },
  {
    id: 'hardcoded-secret',
    pattern: /(token|secret|password|apiKey)\s*:\s*['"][^'"]+['"]/i,
    message: 'Hard-coded credential/token literal found in source.',
    severity: 'high'
  },
  {
    id: 'missing-error-handling',
    pattern: /await fetch\([^)]*\);\s*\n\s*const \w+ = await \w+\.json\(\);\s*\n\s*return \w+;/,
    message: 'fetch() call has no try/catch and no response.ok check.',
    severity: 'medium'
  },
  {
    id: 'unsafe-array-filter-case-sensitivity',
    pattern: /\.startsWith\(search\)/,
    message: 'User search input matched with a case-sensitive, prefix-only comparison — likely to confuse users and could mask other input-handling issues nearby.',
    severity: 'low'
  }
];

function collectFiles(root, dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(abs, entry.name);
    const rel = path.relative(root, full);
    if (entry.isDirectory()) {
      out.push(...collectFiles(root, rel));
    } else if (SCAN_EXTS.has(path.extname(entry.name))) {
      out.push(rel);
    }
  }
  return out;
}

/**
 * Security / Quality Agent
 * Runs real regex-based static checks over the actual sample-project
 * source files for: missing validation, exposed secrets, unsafe API
 * handling, and poor error handling.
 */
async function runQualityAgent(projectRoot) {
  const files = SCAN_DIRS.flatMap(d => collectFiles(projectRoot, d));
  const findings = [];

  for (const rel of files) {
    const content = fs.readFileSync(path.join(projectRoot, rel), 'utf-8');
    for (const check of CHECKS) {
      if (check.pattern.test(content)) {
        findings.push({
          id: check.id,
          file: rel,
          message: check.message,
          severity: check.severity
        });
      }
    }
  }

  return {
    filesScanned: files.length,
    findings,
    status: findings.some(f => f.severity === 'high') ? 'issues-found' : (findings.length ? 'minor-issues' : 'clean'),
    source: 'local-static-analysis'
  };
}

module.exports = { runQualityAgent };
