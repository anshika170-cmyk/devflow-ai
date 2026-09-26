const fs = require('fs');
const path = require('path');

const IGNORE = new Set(['node_modules', '.git', 'dist', 'build']);

function walk(dir, root) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes = [];

  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(root, fullPath);

    if (entry.isDirectory()) {
      nodes.push({
        type: 'dir',
        name: entry.name,
        path: relPath,
        children: walk(fullPath, root)
      });
    } else {
      const stat = fs.statSync(fullPath);
      nodes.push({
        type: 'file',
        name: entry.name,
        path: relPath,
        sizeBytes: stat.size
      });
    }
  }

  // directories first, then alphabetical
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function analyzeProject(projectRoot) {
  const tree = walk(projectRoot, projectRoot);

  let fileCount = 0;
  let dirCount = 0;
  const languages = {};

  function count(nodes) {
    for (const n of nodes) {
      if (n.type === 'dir') {
        dirCount++;
        count(n.children);
      } else {
        fileCount++;
        const ext = path.extname(n.name) || '(no ext)';
        languages[ext] = (languages[ext] || 0) + 1;
      }
    }
  }
  count(tree);

  return {
    root: projectRoot,
    tree,
    summary: { fileCount, dirCount, languages }
  };
}

function readFile(projectRoot, relPath) {
  return fs.readFileSync(path.join(projectRoot, relPath), 'utf-8');
}

module.exports = { analyzeProject, readFile };
