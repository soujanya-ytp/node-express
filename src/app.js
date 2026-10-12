const express = require('express');
const { randomUUID } = require('node:crypto');

function createApp() {
  const app = express();
  const tasks = new Map();
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/tasks', (_req, res) => res.json([...tasks.values()]));

  app.post('/api/tasks', (req, res) => {
    const { title, description = '' } = req.body ?? {};
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required and must not be blank' });
    }
    if (title.trim().length > 200 || typeof description !== 'string' || description.length > 2000) {
      return res.status(400).json({ error: 'title or description exceeds allowed limits' });
    }
    const task = { id: randomUUID(), title: title.trim(), description, completed: false, created_at: new Date().toISOString() };
    tasks.set(task.id, task);
    return res.status(201).json(task);
  });

  app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.get(req.params.id);
    return task ? res.json(task) : res.status(404).json({ error: 'Task not found' });
  });

  app.patch('/api/tasks/:id', (req, res) => {
    const current = tasks.get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Task not found' });
    const body = req.body ?? {};
    const allowed = ['title', 'description', 'completed'];
    if (Object.keys(body).some((key) => !allowed.includes(key))) {
      return res.status(400).json({ error: 'Unknown update field' });
    }
    if ('title' in body && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200)) {
      return res.status(400).json({ error: 'title must be a non-blank string of at most 200 characters' });
    }
    if ('description' in body && (typeof body.description !== 'string' || body.description.length > 2000)) {
      return res.status(400).json({ error: 'description must be a string of at most 2000 characters' });
    }
    if ('completed' in body && typeof body.completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }
    const updated = { ...current, ...body };
    if (typeof updated.title === 'string') updated.title = updated.title.trim();
    tasks.set(updated.id, updated);
    return res.json(updated);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    if (!tasks.has(req.params.id)) return res.status(404).json({ error: 'Task not found' });
    tasks.delete(req.params.id);
    return res.status(204).end();
  });

  app.use((err, _req, res, _next) => {
    if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Invalid JSON body' });
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

module.exports = { createApp };
