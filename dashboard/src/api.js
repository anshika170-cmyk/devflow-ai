 const BASE_URL = '/api';

async function jsonFetch(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const getProject = () => jsonFetch(`${BASE_URL}/project`);
export const getBugs = () => jsonFetch(`${BASE_URL}/bugs`);
export const analyzeBug = (bugId) =>
  jsonFetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bugId })
  });
const BASE_URL = '/api';

export async function applyFix(bugId) {
  const response = await fetch(`${BASE_URL}/apply-fix`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bugId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to apply fix');
  }

  return data;
}
export const runTests = () => jsonFetch(`${BASE_URL}/run-tests`, { method: 'POST' });
export const verifyBug = (bugId) => jsonFetch(`${BASE_URL}/verify/${bugId}`);
export const getReport = (bugId) =>
  jsonFetch(`${BASE_URL}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bugId })
  });
export const resetProject = () => jsonFetch(`${BASE_URL}/reset`, { method: 'POST' });
