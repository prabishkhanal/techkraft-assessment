const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('./server');

let server;
let base;
before(async () => {
  server = createServer({ persist: false });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}
async function login(username) {
  return (await request('/auth/login', { method: 'POST', body: { username } })).body;
}
const complete = {
  businessName: 'Fictional Test Shop',
  businessType: 'Retail',
  registrationNumber: 'DEMO-TEST',
  contactName: 'Demo Contact',
  contactEmail: 'demo@example.test',
  contactPhone: '+1 202 555 0100',
  taxId: '900000001',
  bankAccountNumber: '000000001234',
  estimatedMonthlyVolume: 1000,
};

test('requires bearer auth and rejects fabricated tokens', async () => {
  assert.equal((await request('/applications')).status, 401);
  assert.equal((await request('/applications', { token: 'made-up' })).status, 401);
});
test('sales list is filtered before server-side pagination', async () => {
  const user = await login('sales-user');
  const result = await request('/applications?page=1&pageSize=2&search=Demo', {
    token: user.accessToken,
  });
  assert.equal(result.body.data.length, 2);
  assert.ok(result.body.total > 2);
  assert.ok(result.body.data.every((app) => app.createdBy === 'sales-user'));
});

test('draft monthly volume accepts numeric presets/custom amounts and rejects invalid types or ranges', async () => {
  const user = await login('sales-user');
  const draft = await request('/applications', {
    token: user.accessToken,
    method: 'POST',
    body: {},
  });
  for (const volume of [1000000, 13750.5, 1, 1000000000]) {
    const saved = await request(`/applications/${draft.body.id}`, {
      token: user.accessToken,
      method: 'PATCH',
      body: { estimatedMonthlyVolume: volume },
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.estimatedMonthlyVolume, volume);
  }
  for (const volume of ['1000000', -1, 1000000001, null]) {
    assert.equal(
      (
        await request(`/applications/${draft.body.id}`, {
          token: user.accessToken,
          method: 'PATCH',
          body: { estimatedMonthlyVolume: volume },
        })
      ).status,
      400,
    );
  }
});
test('direct object access cannot bypass sales ownership or reviewer assignment', async () => {
  const sales = await login('sales-user');
  const reviewer = await login('other-reviewer');
  assert.equal((await request('/applications/app-1', { token: sales.accessToken })).status, 404);
  assert.equal((await request('/applications/app-2', { token: reviewer.accessToken })).status, 404);
  assert.equal(
    (await request('/applications/app-2/history', { token: reviewer.accessToken })).status,
    404,
  );
});
test('raw sensitive values require a permitted reviewer or admin', async () => {
  const sales = await login('sales-user');
  const reviewer = await login('reviewer-user');
  const normal = await request('/applications/app-2', { token: sales.accessToken });
  assert.ok(normal.body.taxId.startsWith('••••'));
  assert.ok(normal.body.bankAccountNumber.startsWith('••••'));
  assert.equal(
    (await request('/applications/app-2/sensitive', { token: sales.accessToken })).status,
    403,
  );
  assert.equal(
    (await request('/applications/app-2/sensitive', { token: reviewer.accessToken })).body.taxId,
    '900000001',
  );
});
test('refresh rotates its token and cannot be replayed', async () => {
  const started = Date.now();
  const session = await login('sales-user');
  assert.ok(session.accessTokenExpiresAt >= started + 45000);
  assert.ok(session.accessTokenExpiresAt <= Date.now() + 45000);
  const refreshed = await request('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: session.refreshToken },
  });
  assert.equal(refreshed.status, 200);
  assert.notEqual(refreshed.body.accessToken, session.accessToken);
  assert.ok(refreshed.body.accessTokenExpiresAt >= session.accessTokenExpiresAt);
  assert.ok(refreshed.body.accessTokenExpiresAt <= Date.now() + 45000);
  assert.equal(
    (
      await request('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
      })
    ).status,
    401,
  );
});
test('draft → edit → submit → assign → review, with server-side validation and immutable ownership', async () => {
  const sales = await login('sales-user');
  const reviewer = await login('reviewer-user');
  const admin = await login('admin-user');
  const draft = await request('/applications', {
    token: sales.accessToken,
    method: 'POST',
    body: {},
  });
  assert.equal(draft.status, 201);
  const id = draft.body.id;
  assert.equal(
    (
      await request(`/applications/${id}/submit`, {
        token: sales.accessToken,
        method: 'POST',
        body: {},
      })
    ).status,
    400,
  );
  const saved = await request(`/applications/${id}`, {
    token: sales.accessToken,
    method: 'PATCH',
    body: {
      ...complete,
      createdBy: 'other-sales',
      status: 'APPROVED',
      assignedTo: 'reviewer-user',
    },
  });
  assert.equal(saved.body.createdBy, 'sales-user');
  assert.equal(saved.body.status, 'DRAFT');
  assert.equal(saved.body.assignedTo, null);
  assert.equal(
    (
      await request(`/applications/${id}`, {
        token: admin.accessToken,
        method: 'PATCH',
        body: { businessName: 'Bypass' },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`/applications/${id}/assignment`, {
        token: sales.accessToken,
        method: 'POST',
        body: { assignedTo: 'reviewer-user' },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`/applications/${id}/submit`, {
        token: sales.accessToken,
        method: 'POST',
        body: {},
      })
    ).body.status,
    'SUBMITTED',
  );
  assert.equal(
    (
      await request(`/applications/${id}`, {
        token: sales.accessToken,
        method: 'PATCH',
        body: { businessName: 'Locked' },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`/applications/${id}/assignment`, {
        token: admin.accessToken,
        method: 'POST',
        body: { assignedTo: 'sales-user' },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/applications/${id}/assignment`, {
        token: admin.accessToken,
        method: 'POST',
        body: { assignedTo: 'reviewer-user' },
      })
    ).body.status,
    'UNDER_REVIEW',
  );
  assert.equal(
    (
      await request(`/applications/${id}/decision`, {
        token: admin.accessToken,
        method: 'POST',
        body: { decision: 'APPROVED', comment: 'Invalid admin decision' },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`/applications/${id}/decision`, {
        token: reviewer.accessToken,
        method: 'POST',
        body: { decision: 'APPROVED', comment: 'short' },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/applications/${id}/decision`, {
        token: reviewer.accessToken,
        method: 'POST',
        body: { decision: 'APPROVED', comment: 'Fictional review completed.' },
      })
    ).body.status,
    'APPROVED',
  );
  assert.equal(
    (await request(`/applications/${id}/history`, { token: sales.accessToken })).body.length,
    1,
  );
  assert.equal(
    (
      await request(`/applications/${id}/decision`, {
        token: reviewer.accessToken,
        method: 'POST',
        body: { decision: 'REJECTED', comment: 'Duplicate decision attempt.' },
      })
    ).status,
    409,
  );
});
test('reviewers cannot create applications or change assignments', async () => {
  const user = await login('reviewer-user');
  assert.equal(
    (await request('/applications', { token: user.accessToken, method: 'POST', body: complete }))
      .status,
    403,
  );
  assert.equal(
    (
      await request('/applications/app-2/assignment', {
        token: user.accessToken,
        method: 'POST',
        body: { assignedTo: null },
      })
    ).status,
    403,
  );
});
