const { runTests } = require('../lib/testRunner');

/**
 * Testing Agent
 * Responsibilities: discover & run the relevant test suite, identify
 * failures, map them to affected code, and verify fixes.
 */
async function runTestingAgent(projectRoot) {
  const result = await runTests(projectRoot);

  if (!result.ranSuccessfully) {
    return {
      testsRun: 0,
      passed: 0,
      failed: 0,
      failures: [],
      status: 'error',
      error: result.error,
      source: 'real-jest-run'
    };
  }

  return {
    testsRun: result.testsRun,
    passed: result.passed,
    failed: result.failed,
    failures: result.failures,
    status: result.status,
    source: 'real-jest-run'
  };
}

module.exports = { runTestingAgent };
