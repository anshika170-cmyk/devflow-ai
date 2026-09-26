const fs = require('fs');
const path = require('path');

function readAbs(projectRoot, rel) {
  return fs.readFileSync(path.join(projectRoot, rel), 'utf-8');
}
function writeAbs(projectRoot, rel, content) {
  fs.writeFileSync(path.join(projectRoot, rel), content, 'utf-8');
}

/**
 * Each fixer performs a real, targeted string replacement against the
 * actual file on disk (equivalent to what the Debugging Agent proposed
 * in bugCatalog.js's suggestedFix.diff) and returns the before/after
 * snippet so the UI can show a real diff, not a canned one.
 */
const FIXERS = {
  'bug-1-api-mismatch': (projectRoot) => {
    const rel = 'sample-project/backend/routes/auth.js';
    const before = readAbs(projectRoot, rel);
    const after = before.replace(
      `  res.json({
    name: username,      // <-- BUG: frontend expects "username"
    token: 'demo-token-123'
  });`,
      `  res.json({
    username,
    token: 'demo-token-123'
  });`
    );
    if (after === before) throw new Error('Fix pattern not found (already applied or file changed).');
    writeAbs(projectRoot, rel, after);
    return { file: rel, before, after };
  },

  'bug-2-search-filter': (projectRoot) => {
    const rel = 'sample-project/backend/routes/tasks.js';
    const before = readAbs(projectRoot, rel);
    const after = before.replace(
      `  const filtered = tasks.filter(t => t.title.startsWith(search)); // <-- BUG`,
      `  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );`
    );
    if (after === before) throw new Error('Fix pattern not found (already applied or file changed).');
    writeAbs(projectRoot, rel, after);
    return { file: rel, before, after };
  },

  'bug-3-error-handling': (projectRoot) => {
    const rel = 'sample-project/frontend/src/api.js';
    const before = readAbs(projectRoot, rel);
    const after = before.replace(
      `  const res = await fetch(url);
  const data = await res.json();
  return data;`,
      `  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(\`Failed to load tasks (\${res.status})\`);
    }
    return await res.json();
  } catch (err) {
    throw new Error(\`Could not reach TaskFlow API: \${err.message}\`);
  }`
    );
    if (after === before) throw new Error('Fix pattern not found (already applied or file changed).');
    writeAbs(projectRoot, rel, after);
    return { file: rel, before, after };
  },

  'bug-4-validation': (projectRoot) => {
    const rel = 'sample-project/backend/routes/tasks.js';
    const before = readAbs(projectRoot, rel);
    const after = before.replace(
      `  const { title } = req.body;
  const tasks = readTasks();`,
      `  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required and cannot be empty' });
  }
  const tasks = readTasks();`
    );
    if (after === before) throw new Error('Fix pattern not found (already applied or file changed).');
    writeAbs(projectRoot, rel, after);
    return { file: rel, before, after };
  }
};

function applyFix(projectRoot, bugId) {
  const fixer = FIXERS[bugId];
  if (!fixer) throw new Error(`No fixer registered for bug id "${bugId}"`);
  return fixer(projectRoot);
}

module.exports = { applyFix };
