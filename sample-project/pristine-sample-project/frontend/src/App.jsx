import React, { useEffect, useState } from 'react';
import { login, fetchTasks, createTask, updateTask, deleteTask } from './api.js';

export default function App() {
  const [username, setUsername] = useState('');
  const [loggedInAs, setLoggedInAs] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (loggedInAs) loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInAs, search]);

  async function loadTasks() {
    const data = await fetchTasks(search);
    setTasks(data);
  }

  async function handleLogin(e) {
    e.preventDefault();
    const name = await login(username);
    setLoggedInAs(name); // will render "Welcome, undefined" until Bug #1 is fixed
  }

  async function handleCreate(e) {
    e.preventDefault();
    await createTask(newTitle);
    setNewTitle('');
    loadTasks();
  }

  if (!loggedInAs) {
    return (
      <div style={{ fontFamily: 'sans-serif', maxWidth: 360, margin: '80px auto' }}>
        <h2>TaskFlow Login</h2>
        <form onSubmit={handleLogin}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
          <button type="submit">Log in</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 480, margin: '40px auto' }}>
      <h2>Welcome, {loggedInAs}</h2>

      <input
        placeholder="search tasks..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: 12 }}
      />

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="new task title" />
        <button type="submit">Add</button>
      </form>

      <ul>
        {tasks.map(t => (
          <li key={t.id}>
            <label>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => updateTask(t.id, { done: !t.done }).then(loadTasks)}
              />
              {t.title}
            </label>
            <button onClick={() => deleteTask(t.id).then(loadTasks)}>delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
