const request = require('supertest');
const app = require('../server');

// -----------------------------------------------------------------------
// Orchestrator API tests
// These tests exercise the DevFlow AI orchestrator server endpoints.
// Note: /api/analyze, /api/run-tests, /api/report depend on the
// sample-project being installed (npm install in sample-project/backend).
// The health, project, and bugs endpoints run deterministically without
// any external services.
// -----------------------------------------------------------------------

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/project', () => {
  it('returns project tree with file and directory counts', async () => {
    const res = await request(app).get('/api/project');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tree');
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary).toHaveProperty('fileCount');
    expect(res.body.summary).toHaveProperty('dirCount');
    expect(res.body.summary.fileCount).toBeGreaterThan(0);
  });
});

describe('GET /api/bugs', () => {
  it('returns an array of known bugs', async () => {
    const res = await request(app).get('/api/bugs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  it('each bug has required fields: id, title, severity, file', async () => {
    const res = await request(app).get('/api/bugs');
    for (const bug of res.body) {
      expect(bug).toHaveProperty('id');
      expect(bug).toHaveProperty('title');
      expect(bug).toHaveProperty('severity');
      expect(bug).toHaveProperty('file');
      expect(['high', 'medium', 'low']).toContain(bug.severity);
    }
  });

  it('includes the four seeded bugs by id', async () => {
    const res = await request(app).get('/api/bugs');
    const ids = res.body.map(b => b.id);
    expect(ids).toContain('bug-1-api-mismatch');
    expect(ids).toContain('bug-2-search-filter');
    expect(ids).toContain('bug-3-error-handling');
    expect(ids).toContain('bug-4-validation');
  });
});

describe('POST /api/analyze', () => {
  it('returns 404 for an unknown bug id', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ bugId: 'does-not-exist' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns structured analysis for a valid bug id', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ bugId: 'bug-1-api-mismatch' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('debugging');
    expect(res.body).toHaveProperty('testingBaseline');
    expect(res.body).toHaveProperty('quality');
    expect(res.body).toHaveProperty('orchestration');
    expect(res.body.orchestration.executionMode).toBe('parallel');
    expect(res.body.orchestration.agentsRun).toEqual(
      expect.arrayContaining(['debugging', 'testing', 'quality'])
    );
  }, 30000);

  it('debugging result has required fields', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ bugId: 'bug-2-search-filter' });
    expect(res.status).toBe(200);
    const dbg = res.body.debugging;
    expect(dbg).toHaveProperty('bug');
    expect(dbg).toHaveProperty('rootCause');
    expect(dbg).toHaveProperty('affectedFiles');
    expect(dbg).toHaveProperty('severity');
    expect(dbg).toHaveProperty('suggestedFix');
    expect(dbg).toHaveProperty('confidence');
    expect(dbg).toHaveProperty('source');
  }, 30000);
});

describe('POST /api/verify/:bugId', () => {
  it('returns 404 for unknown bug id', async () => {
    const res = await request(app).get('/api/verify/unknown-bug');
    expect(res.status).toBe(404);
  });

  it('returns resolved status for a known bug', async () => {
    const res = await request(app).get('/api/verify/bug-1-api-mismatch');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('bugId');
    expect(res.body).toHaveProperty('resolved');
    expect(typeof res.body.resolved).toBe('boolean');
  });
});
