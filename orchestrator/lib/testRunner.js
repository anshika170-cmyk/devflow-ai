const { spawn } = require('child_process');
const path = require('path');

/**
 * Runs the real Jest test suite from the sample backend.
 */
function runTests(projectRoot) {
  return new Promise((resolve) => {
    const cwd = path.join(
      projectRoot,
      'sample-project',
      'backend'
    );

    // Windows needs the shell for npx/npm command execution.
    const child = spawn(
      'npx',
      ['jest', '--json', '--silent', '--runInBand'],
      {
        cwd,
        shell: true
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      resolve({
        ranSuccessfully: false,
        testsRun: 0,
        passed: 0,
        failed: 0,
        failures: [],
        status: 'error',
        error: `Could not start Jest: ${err.message}`,
        raw: stderr || stdout
      });
    });

    child.on('close', (exitCode) => {
      const jsonStart = stdout.indexOf('{');
      const jsonEnd = stdout.lastIndexOf('}');

      if (
        jsonStart === -1 ||
        jsonEnd === -1 ||
        jsonEnd <= jsonStart
      ) {
        resolve({
          ranSuccessfully: false,
          testsRun: 0,
          passed: 0,
          failed: 0,
          failures: [],
          status: 'error',
          error:
            'Jest completed but no JSON test report could be found.',
          raw: stdout || stderr,
          exitCode
        });

        return;
      }

      const jsonText = stdout.slice(
        jsonStart,
        jsonEnd + 1
      );

      let parsed;

      try {
        parsed = JSON.parse(jsonText);
      } catch (error) {
        resolve({
          ranSuccessfully: false,
          testsRun: 0,
          passed: 0,
          failed: 0,
          failures: [],
          status: 'error',
          error:
            `Could not parse Jest JSON output: ${error.message}`,
          raw: stdout || stderr,
          exitCode
        });

        return;
      }

      const failures = [];

      for (const suite of parsed.testResults || []) {
        for (const test of suite.testResults || []) {
          if (test.status === 'failed') {
            failures.push({
              test:
                test.fullName ||
                test.title ||
                'Unnamed test',

              file: suite.name
                ? path.relative(cwd, suite.name)
                : 'unknown',

              message:
                Array.isArray(test.failureMessages) &&
                test.failureMessages.length > 0
                  ? test.failureMessages[0]
                      .split('\n')[0]
                      .trim()
                  : 'Test failed'
            });
          }
        }
      }

      const testsRun = Number(
        parsed.numTotalTests || 0
      );

      const passed = Number(
        parsed.numPassedTests || 0
      );

      const failed = Number(
        parsed.numFailedTests || 0
      );

      resolve({
        ranSuccessfully: true,
        testsRun,
        passed,
        failed,
        failures,
        status: failed === 0 ? 'passed' : 'failed',
        source: 'real-jest-run',
        exitCode
      });
    });
  });
}

module.exports = {
  runTests
};