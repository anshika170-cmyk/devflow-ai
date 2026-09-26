const request = require('supertest');
const app = require('../server');

describe('GET /api/tasks?search=', () => {
  it('returns tasks whose title contains the search term anywhere (case-insensitive)', async () => {
    // "bar" only appears in the middle of "Fix search bar styling", not at
    // the start, so this fails while the handler uses startsWith(). This
    // is the intentionally failing test (Bug #5) DevFlow AI should catch
    // and fix by correcting the filter in routes/tasks.js.
    const res = await request(app).get('/api/tasks').query({ search: 'bar' });

    expect(res.status).toBe(200);
    expect(res.body.some(t => t.title.toLowerCase().includes('bar'))).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns all tasks when no search term is given', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });
});

describe('POST /api/tasks', () => {
  it('rejects an empty task title (currently fails — Bug #4)', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/login', () => {
  it('returns a `username` field the frontend can read (currently fails — Bug #1)', async () => {
    const res = await request(app).post('/api/login').send({ username: 'Anshika' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('Anshika');
  });
});
