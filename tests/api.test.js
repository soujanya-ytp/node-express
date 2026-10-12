const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const http = require('node:http');

async function withServer(run) {
  const server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run(base); } finally { await new Promise((resolve) => server.close(resolve)); }
}

test('health endpoint responds ok', async () => withServer(async (base) => {
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
}));

test('task create, update, delete and not-found flow', async () => withServer(async (base) => {
  let response = await fetch(`${base}/api/tasks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: '  Ship release ', description: 'v1' }) });
  assert.equal(response.status, 201);
  const task = await response.json();
  assert.equal(task.title, 'Ship release');
  response = await fetch(`${base}/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ completed: true }) });
  assert.equal((await response.json()).completed, true);
  response = await fetch(`${base}/api/tasks/${task.id}`, { method: 'DELETE' });
  assert.equal(response.status, 204);
  response = await fetch(`${base}/api/tasks/${task.id}`);
  assert.equal(response.status, 404);
}));

test('blank title is rejected', async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/tasks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: '  ' }) });
  assert.equal(response.status, 400);
}));
