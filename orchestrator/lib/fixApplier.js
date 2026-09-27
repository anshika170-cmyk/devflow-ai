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

    const alreadyFixed =
      /res\.json\s*\(\s*\{[\s\S]*?\busername\s*,\s*[\s\S]*?token\s*:/.test(
        before
      );

    if (alreadyFixed) {
      throw new Error(
        'Bug 1 is already fixed. The login API already returns username.'
      );
    }

    const pattern =
      /(\bres\.json\s*\(\s*\{\s*)name\s*:\s*username\b/;

    if (!pattern.test(before)) {
      throw new Error(
        'Bug 1 fix pattern not found. The login response structure may have changed.'
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
  // Bug 2: Incorrect task search filtering
  // --------------------------------------------------
  'bug-2-search-filter': (projectRoot) => {
    const rel = 'sample-project/backend/routes/tasks.js';
    const before = readAbs(projectRoot, rel);

    const alreadyFixed =
      /t\s*\.\s*title\s*\.\s*toLowerCase\s*\(\s*\)\s*\.\s*includes\s*\(\s*search\s*\.\s*toLowerCase\s*\(\s*\)\s*\)/.test(
        before
      );

    if (alreadyFixed) {
      throw new Error(
        'Bug 2 is already fixed. The search filter already uses case-insensitive includes.'
      );
    }

    const pattern =
      /const\s+filtered\s*=\s*tasks\.filter\s*\(\s*t\s*=>\s*t\s*\.\s*title\s*\.\s*startsWith\s*\(\s*search\s*\)\s*\)\s*;?/;

    if (!pattern.test(before)) {
      throw new Error(
        'Bug 2 fix pattern not found. The search filter structure may have changed.'
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
  // Bug 3: Missing API error handling
  // --------------------------------------------------
  'bug-3-error-handling': (projectRoot) => {
    const rel = 'sample-project/frontend/src/api.js';
    const before = readAbs(projectRoot, rel);

    const alreadyFixed =
      /try\s*\{[\s\S]*?const\s+res\s*=\s*await\s+fetch\s*\(\s*url\s*\)[\s\S]*?res\s*\.\s*ok[\s\S]*?catch\s*\(/.test(
        before
      );

    if (alreadyFixed) {
      throw new Error(
        'Bug 3 is already fixed. fetchTasks already contains error handling.'
      );
    }

    const pattern =
      /const\s+res\s*=\s*await\s+fetch\s*\(\s*url\s*\)\s*;\s*const\s+data\s*=\s*await\s+res\s*\.\s*json\s*\(\s*\)\s*;\s*return\s+data\s*;/;

    if (!pattern.test(before)) {
      throw new Error(
        'Bug 3 fix pattern not found. The fetchTasks implementation may have changed.'
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
  // Bug 4: Missing task-title validation
  // --------------------------------------------------
  'bug-4-validation': (projectRoot) => {
    const rel = 'sample-project/backend/routes/tasks.js';
    const before = readAbs(projectRoot, rel);

    const alreadyFixed =
      /if\s*\(\s*!title\s*\|\|\s*!title\s*\.\s*trim\s*\(\s*\)\s*\)/.test(
        before
      );

    if (alreadyFixed) {
      throw new Error(
        'Bug 4 is already fixed. Input validation is already present.'
      );
    }

    /*
     * Match only the title extraction line.
     * This deliberately does NOT require `const tasks = readTasks();`
     * to appear immediately afterward, so comments/blank lines/
     * formatting differences do not break the fix.
     */
    const titlePattern =
      /const\s*\{\s*title\s*\}\s*=\s*req\s*\.\s*body\s*;/;

    if (!titlePattern.test(before)) {
      throw new Error(
        'Bug 4 fix pattern not found: title extraction could not be located.'
      );
    }

    const after = before.replace(
      titlePattern,
      `const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      error: 'title is required and cannot be empty'
    });
  }`
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

  return fixer(projectRoot, bugId);
}

module.exports = {
  applyFix
};