const BASE_URL = 'http://localhost:4000/api';

export async function login(username) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  const data = await res.json();
  // BUG #1 (consumer side): backend currently returns `name`, not
  // `username`, so `data.username` is undefined here.
  return data.username;
}

export async function fetchTasks(search = '') {
  const url = search
    ? `${BASE_URL}/tasks?search=${encodeURIComponent(search)}`
    : `${BASE_URL}/tasks`;

  // BUG #3 (missing error handling): no try/catch and no res.ok check.
  // If the backend is down or returns a non-2xx status, this throws
  // inside a React event handler with no boundary, and the UI crashes
  // to a blank white screen instead of showing a message.
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load tasks (${res.status})`);
    }
    return await res.json();
  } catch (err) {
    throw new Error(`Could not reach TaskFlow API: ${err.message}`);
  }
}

export async function createTask(title) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  return res.json();
}

export async function updateTask(id, updates) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteTask(id) {
  await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
}
