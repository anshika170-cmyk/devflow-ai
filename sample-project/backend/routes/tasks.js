const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

function readTasks() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// GET /api/tasks?search=term
// --------------------------------------------------------------------
// BUG #2 (incorrect task filtering):
// Uses startsWith() instead of a case-insensitive "contains" check, so
// searching "bar" for "Fix search bar styling" returns nothing unless
// the term matches the very beginning of the title.
// --------------------------------------------------------------------
router.get('/', (req, res) => {
  const { search } = req.query;
  const tasks = readTasks();

  if (!search) {
    return res.json(tasks);
  }

  // Intentional bug: should be case-insensitive `includes`, not `startsWith`.
  const filtered = tasks.filter(t => t.title.startsWith(search));

  res.json(filtered);
});

// POST /api/tasks
// --------------------------------------------------------------------
// BUG #4 (validation problem):
// No check that `title` is a non-empty string, so empty/whitespace-only
// tasks can be created.
// --------------------------------------------------------------------
router.post('/', (req, res) => {

const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      error: 'title is required and cannot be empty'
    });
  }
const tasks = readTasks();
  // Intentional bug: missing validation for empty/blank title.
  const newTask = {
    id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title,               // <-- BUG: no validation that title is non-empty
    done: false
  };

  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks[idx] = { ...tasks[idx], ...req.body };
  writeTasks(tasks);
  res.json(tasks[idx]);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  let tasks = readTasks();
  const exists = tasks.some(t => t.id === id);

  if (!exists) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks = tasks.filter(t => t.id !== id);
  writeTasks(tasks);
  res.status(204).end();
});

module.exports = router;
