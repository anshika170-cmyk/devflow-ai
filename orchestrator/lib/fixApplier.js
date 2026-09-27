const fs = require('fs');
const path = require('path');

function readAbs(projectRoot, rel) {
  return fs.readFileSync(
    path.join(projectRoot, rel),
    'utf-8'
  );
}

function writeAbs(projectRoot, rel, content) {
  fs.writeFileSync(
    path.join(projectRoot, rel),
    content,
    'utf-8'
  );
}

const FIXERS = {
  // --------------------------------------------------
  // Bug 1: API response field mismatch
  // --------------------------------------------------
  'bug-1-api-mismatch': (projectRoot) => {
    const rel = 'sample-project/backend/routes/auth.js';
    const before = readAbs(projectRoot, rel);

    const pattern = /(\bres\.json\s*\(\s*\{\s*)name\s*:\s*username\b/;

    if (!pattern.test(before)) {
      throw new Error(
        'Bug 1 fix pattern not found. The API response may already be fixed.'
      );
    }

    const after = before.replace(
      pattern,
      '$1username'
    );

    writeAbs(projectRoot, rel, after);

    return {
      file: rel,
      before,
      after
    };
  },

  // --------------------------------------------------
  // Bug 2: Incorrect search filtering
  // --------------------------------------------------
  'bug-2-search-filter': (projectRoot) => {
    const rel = 'sample-project/backend/routes/tasks.js';
    const before = readAbs(projectRoot, rel);

    const pattern =
      /const\s+filtered\s*=\s*tasks\.filter\s*\(\s*t\s*=>\s*t\.title\.startsWith\s*\(\s*search\s*\)\s*\)\s*;?/;

    if (!pattern.test(before)) {
      throw new Error(
        'Bug 2 fix pattern not found. The search filter may already be fixed.'
      );
    }

    const after = before.replace(
      pattern,
      `const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );`
    );

    writeAbs(projectRoot, rel, after);

    return {
      file: rel,
      before,
      after
    };
  },

  // --------------------------------------------------
  // Bug 3: Missing error handling
  // --------------------------------------------------
  'bug-3-error-handling': (projectRoot) => {
    const rel = 'sample-project/frontend/src/api.js';
    const before = readAbs(projectRoot, rel);

    const pattern =
      /const\s+res\s*=\s*await\s+fetch\s*\(\s*url\s*\)\s*;\s*const\s+data\s*=\s*await\s+res\.json\s*\(\s*\)\s*;\s*return\s+data\s*;/;

    if (!pattern.test(before)) {
      throw new Error(
        'Bug 3 fix pattern not found. Error handling may already be fixed.'
      );
    }

    const after = before.replace(
      pattern,
      `try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(\`Failed to load tasks (\${res.status})\`);
    }

    return await res.json();
  } catch (err) {
    throw new Error(\`Could not reach TaskFlow API: \${err.message}\`);
  }`
    );

    writeAbs(projectRoot, rel, after);

    return {
      file: rel,
      before,
      after
    };
  },

  // --------------------------------------------------
  // Bug 4: Missing title validation
  // --------------------------------------------------
  'bug-4-validation': (projectRoot) => {
    const rel = 'sample-project/backend/routes/tasks.js';
    const before = readAbs(projectRoot, rel);

    const pattern =
      /const\s*\{\s*title\s*\}\s*=\s*req\.body\s*;\s*const\s+tasks\s*=\s*readTasks\s*\(\s*\)\s*;/;

    if (!pattern.test(before)) {
      throw new Error(
        'Bug 4 fix pattern not found. Validation may already be present.'
      );
    }

    const after = before.replace(
      pattern,
      `const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      error: 'title is required and cannot be empty'
    });
  }

  const tasks = readTasks();`
    );

    writeAbs(projectRoot, rel, after);

    return {
      file: rel,
      before,
      after
    };
  }
};

function applyFix(projectRoot, bugId) {
  const fixer = FIXERS[bugId];

  if (!fixer) {
    throw new Error(
      `No fixer registered for bug id "${bugId}"`
    );
  }

  return fixer(projectRoot);
}

module.exports = {
  applyFix
};