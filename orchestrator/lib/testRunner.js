const { spawn } = require('child_process');
const path = require('path');

/**
 * Runs the real Jest test suite from the sample backend.
 *
 * Returns structured results for the Testing Agent:
 * {
 *   ranSuccessfully,
 *   testsRun,
 *   passed,
 *   failed,
 *   failures,
 *   status
 * }
 */
function runTests(projectRoot) {
  return new Promise((resolve) => {
    const cwd = path.join(
      projectRoot,
      'sample-project',
      'backend'
    );

    // Use the locally installed Jest executable.
    // This avoids npx/shell differences between Windows and Railway.
    const jestCommand =
      process.platform === 'win32'
        ? path.join('node_modules', '.bin', 'jest.cmd')
        : path.join('node_modules', '.bin', 'jest');

    const child = spawn(
      jestCommand,
      ['--json', '--silent', '--runInBand'],
      {
        cwd,
        shell: false
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
        error:
          `Could not start Jest: ${err.message}. ` +
          `Make sure Jest is installed in sample-project/backend.`,
        raw: stderr || stdout
      });
    });

    child.on('close', (exitCode) => {
      /*
       * Jest --json normally puts the JSON result in stdout.
       *
       * Instead of assuming the first character is JSON,
       * locate the JSON object safely.
       */
      const jsonStart = stdout.indexOf('{');
      const jsonEnd = stdout.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
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

      /*
       * Jest's JSON format contains testResults for each test suite.
       */
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

      /*
       * Prefer Jest's summary counters.
       *
       * Convert everything to numbers so the frontend
       * never receives undefined/null and displays 0/0.
       */
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

        status:
          failed === 0
            ? 'passed'
            : 'failed',

        source: 'real-jest-run',

        exitCode
      });
    });
  });
}

module.exports = {
  runTests
};
