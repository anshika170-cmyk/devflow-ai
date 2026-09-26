const { readFile } = require('./projectAnalyzer');

/**
 * Each entry describes one known bug in the sample-project. `detect()`
 * re-reads the ACTUAL current file on disk and checks whether the
 * buggy pattern is still present, so status reflects reality (e.g.
 * after a fix is applied, detect() correctly reports it as resolved).
 */
const BUGS = [
  {
    id: 'bug-1-api-mismatch',
    title: 'API response field mismatch (login)',
    category: 'Integration Bug',
    severity: 'high',
    file: 'sample-project/backend/routes/auth.js',
    relatedFiles: [
      'sample-project/backend/routes/auth.js',
      'sample-project/frontend/src/api.js'
    ],
    detect(projectRoot) {
      const src = readFile(projectRoot, 'sample-project/backend/routes/auth.js');
      return /name:\s*username,\s*\/\/ <-- BUG/.test(src);
    },
    rootCause:
      'POST /api/login responds with the field "name", but the frontend client ' +
      '(frontend/src/api.js → login()) reads response.username. The contract ' +
      'between backend and frontend disagrees on the field name, so the UI ' +
      'always renders "Welcome, undefined".',
    suggestedFix: {
      description: 'Rename the response field from "name" to "username" in the login handler so it matches what the frontend reads.',
      file: 'sample-project/backend/routes/auth.js',
      diff:
`- res.json({
-   name: username,      // <-- BUG: frontend expects "username"
-   token: 'demo-token-123'
- });
+ res.json({
+   username,
+   token: 'demo-token-123'
+ });`
    },
    confidence: 0.97
  },
  {
    id: 'bug-2-search-filter',
    title: 'Incorrect task search filtering',
    category: 'Logic Bug',
    severity: 'medium',
    file: 'sample-project/backend/routes/tasks.js',
    relatedFiles: ['sample-project/backend/routes/tasks.js'],
    detect(projectRoot) {
      const src = readFile(projectRoot, 'sample-project/backend/routes/tasks.js');
      return /t\.title\.startsWith\(search\)/.test(src);
    },
    rootCause:
      'GET /api/tasks?search= filters with title.startsWith(search), a ' +
      'case-sensitive, prefix-only match. Any search term that appears in ' +
      'the middle of a title (e.g. "bar" in "Fix search bar styling"), or ' +
      'that differs in case, incorrectly returns zero results.',
    suggestedFix: {
      description: 'Use a case-insensitive "contains" check instead of a case-sensitive prefix check.',
      file: 'sample-project/backend/routes/tasks.js',
      diff:
`- const filtered = tasks.filter(t => t.title.startsWith(search)); // <-- BUG
+ const filtered = tasks.filter(t =>
+   t.title.toLowerCase().includes(search.toLowerCase())
+ );`
    },
    confidence: 0.95
  },
  {
    id: 'bug-3-error-handling',
    title: 'Missing error handling on API failure',
    category: 'Reliability Bug',
    severity: 'medium',
    file: 'sample-project/frontend/src/api.js',
    relatedFiles: ['sample-project/frontend/src/api.js', 'sample-project/frontend/src/App.jsx'],
    detect(projectRoot) {
      const src = readFile(projectRoot, 'sample-project/frontend/src/api.js');
      return /BUG #3 \(missing error handling\)/.test(src) && !/res\.ok/.test(src);
    },
    rootCause:
      'fetchTasks() calls fetch() and immediately res.json()s the result with ' +
      'no try/catch and no res.ok check. If the backend is unreachable or ' +
      'returns a non-2xx status, the promise rejects (or returns an error ' +
      'payload) uncaught inside a React event handler, crashing the UI to a ' +
      'blank screen instead of showing a message.',
    suggestedFix: {
      description: 'Wrap the request in try/catch, check res.ok, and surface a typed error the UI can render gracefully.',
      file: 'sample-project/frontend/src/api.js',
      diff:
`- const res = await fetch(url);
- const data = await res.json();
- return data;
+ try {
+   const res = await fetch(url);
+   if (!res.ok) {
+     throw new Error(\`Failed to load tasks (\${res.status})\`);
+   }
+   return await res.json();
+ } catch (err) {
+   throw new Error(\`Could not reach TaskFlow API: \${err.message}\`);
+ }`
    },
    confidence: 0.9
  },
  {
    id: 'bug-4-validation',
    title: 'Missing input validation on task creation',
    category: 'Validation Bug',
    severity: 'low',
    file: 'sample-project/backend/routes/tasks.js',
    relatedFiles: ['sample-project/backend/routes/tasks.js'],
    detect(projectRoot) {
      const src = readFile(projectRoot, 'sample-project/backend/routes/tasks.js');
      return /title,\s*\/\/ <-- BUG: no validation/.test(src);
    },
    rootCause:
      'POST /api/tasks accepts any value for `title`, including empty or ' +
      'whitespace-only strings, because there is no validation before the ' +
      'task is written to storage.',
    suggestedFix: {
      description: 'Reject the request with 400 when title is missing or blank before creating the task.',
      file: 'sample-project/backend/routes/tasks.js',
      diff:
`  const { title } = req.body;
+ if (!title || !title.trim()) {
+   return res.status(400).json({ error: 'title is required and cannot be empty' });
+ }
  const tasks = readTasks();`
    },
    confidence: 0.93
  }
];

function listBugs(projectRoot) {
  return BUGS.map(b => ({
    id: b.id,
    title: b.title,
    category: b.category,
    severity: b.severity,
    file: b.file,
    resolved: !b.detect(projectRoot)
  }));
}

function getBug(id) {
  return BUGS.find(b => b.id === id);
}

module.exports = { BUGS, listBugs, getBug };
