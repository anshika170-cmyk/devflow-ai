 const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
}

// --------------------------------------------------
// Project
// --------------------------------------------------

export async function getProject() {
  return request('/project');
}

// --------------------------------------------------
// Bugs
// --------------------------------------------------

export async function getBugs() {
  return request('/bugs');
}

// --------------------------------------------------
// Analyze bug
// --------------------------------------------------

export async function analyzeBug(bugId) {
  return request('/analyze', {
    method: 'POST',
    body: JSON.stringify({
      bugId
    })
  });
}

// --------------------------------------------------
// Apply fix
// --------------------------------------------------

export async function applyFix(bugId) {
  return request('/apply-fix', {
    method: 'POST',
    body: JSON.stringify({
      bugId
    })
  });
}

// --------------------------------------------------
// Run tests
// --------------------------------------------------

export async function runTests() {
  return request('/run-tests', {
    method: 'POST'
  });
}

// --------------------------------------------------
// Verify bug
// --------------------------------------------------

export async function verifyBug(bugId) {
  return request(`/verify/${encodeURIComponent(bugId)}`);
}

// --------------------------------------------------
// Generate final report
// --------------------------------------------------

export async function getReport(bugId) {
  return request('/report', {
    method: 'POST',
    body: JSON.stringify({
      bugId
    })
  });
}

// --------------------------------------------------
// Reset project
// --------------------------------------------------

export async function resetProject() {
  return request('/reset', {
    method: 'POST'
  });
}

// --------------------------------------------------
// Health check
// --------------------------------------------------

export async function getHealth() {
  return request('/health');
}