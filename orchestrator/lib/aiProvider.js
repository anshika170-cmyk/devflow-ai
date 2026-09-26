/**
 * AI Provider Abstraction Layer
 * ------------------------------------------------------------------
 * DevFlow AI's agents are designed around IBM Bob 2.0's agent-mode
 * capabilities (agent mode, parallel subagent tasks, document
 * understanding). This module is the ONLY place that talks to an
 * external AI runtime, so every agent stays provider-agnostic.
 *
 * IMPORTANT: this layer never fakes a successful external call.
 *   - If BOB_API_URL (and BOB_API_KEY, if required) are configured in
 *     the environment, callBob() performs a real HTTP request to the
 *     configured IBM Bob 2.0 endpoint and returns its real response.
 *   - If no endpoint is configured (the default in this local/offline
 *     environment), callBob() throws a clearly-labelled
 *     "BobNotConfiguredError" instead of returning invented content.
 *
 * Every agent in this project catches that specific error and falls
 * back to LOCAL analysis mode: real static analysis over the actual
 * project files on disk (see projectAnalyzer.js / bugCatalog.js),
 * not randomly generated or scripted text. The orchestrator always
 * reports which mode produced a given result (`source: "bob" |
 * "local-static-analysis"`) so the workflow is never misrepresented
 * as a live model call when it wasn't one.
 * ------------------------------------------------------------------
 */

class BobNotConfiguredError extends Error {
  constructor() {
    super('IBM Bob 2.0 endpoint is not configured in this environment (BOB_API_URL unset).');
    this.name = 'BobNotConfiguredError';
  }
}

async function callBob({ task, payload }) {
  const endpoint = process.env.BOB_API_URL;

  if (!endpoint) {
    throw new BobNotConfiguredError();
  }

  const res = await fetch(`${endpoint}/agent-tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.BOB_API_KEY ? { Authorization: `Bearer ${process.env.BOB_API_KEY}` } : {})
    },
    body: JSON.stringify({ task, payload })
  });

  if (!res.ok) {
    throw new Error(`IBM Bob 2.0 request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function isBobConfigured() {
  return Boolean(process.env.BOB_API_URL);
}

module.exports = { callBob, isBobConfigured, BobNotConfiguredError };
