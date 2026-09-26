const { spawn } = require('child_process');
const path = require('path');

/**
 * Actually runs the sample project's real Jest test suite (no simulated
 * or hard-coded pass/fail results) and returns structured output the
 * Testing Agent can reason over.
 */
function runTests(projectRoot) {
  return new Promise((resolve) => {
    const cwd = path.join(projectRoot, 'sample-project', 'backend');
    const child = spawn('npx', ['jest', '--json', '--silent'], { cwd, shell: true });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('error', (err) => {
      resolve({
        ranSuccessfully: false,
        error: `Could not start test process: ${err.message}. Did you run "npm install" in sample-project/backend?`,
        raw: stderr
      });
    });

    child.on('close', () => {
      try {
        const jsonStart = stdout.indexOf('{');
        const parsed = JSON.parse(stdout.slice(jsonStart));
        const failures = [];

        for (const suite of parsed.testResults || []) {
          for (const t of suite.testResults || []) {
            if (t.status === 'failed') {
              failures.push({
                test: t.fullName || t.title,
                file: path.relative(cwd, suite.name),
                message: (t.failureMessages && t.failureMessages[0] || '').split('\n')[0]
              });
            }
          }
        }

        resolve({
          ranSuccessfully: true,
          testsRun: parsed.numTotalTests,
          passed: parsed.numPassedTests,
          failed: parsed.numFailedTests,
          status: parsed.numFailedTests === 0 ? 'passed' : 'failed',
          failures
        });
      } catch (e) {
        resolve({
          ranSuccessfully: false,
          error: `Could not parse test output: ${e.message}. Is Jest installed in sample-project/backend (npm install)?`,
          raw: stdout || stderr
        });
      }
    });
  });
}

module.exports = { runTests };
