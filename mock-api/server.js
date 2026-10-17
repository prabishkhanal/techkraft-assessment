// Local assessment API. All identities and merchant records are fictional.
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const users = [
  { username: 'sales-user', role: 'SALES' },
  { username: 'other-sales', role: 'SALES' },
  { username: 'reviewer-user', role: 'REVIEWER' },
  { username: 'other-reviewer', role: 'REVIEWER' },
  { username: 'admin-user', role: 'ADMIN' },
];
const fields = [
  'businessName',
  'businessType',
  'registrationNumber',
  'contactName',
  'contactEmail',
  'contactPhone',
  'taxId',
  'bankAccountNumber',
  'estimatedMonthlyVolume',
];
const editable = (app) => app.status === 'DRAFT';
const visible = (user, app) =>
  user.role === 'ADMIN' ||
  (user.role === 'SALES' ? app.createdBy === user.username : app.assignedTo === user.username);
const mask = (value) => (value ? `••••${value.slice(-4)}` : '');
const publicApp = (app) => ({
  ...app,
  taxId: mask(app.taxId),
  bankAccountNumber: mask(app.bankAccountNumber),
});

function seed() {
  return {
    applications: Array.from({ length: 18 }, (_, i) => ({
      id: `app-${i + 1}`,
      createdBy: i % 3 === 0 ? 'other-sales' : 'sales-user',
      assignedTo: i % 4 === 0 ? null : i % 3 === 0 ? 'other-reviewer' : 'reviewer-user',
      status: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'][i % 3],
      businessName: `Demo ${['Market', 'Bakery', 'Crafts', 'Books', 'Studio', 'Cafe'][i % 6]} ${i + 1}`,
      businessType: 'Retail',
      registrationNumber: `DEMO-${1000 + i}`,
      contactName: `Demo Contact ${i + 1}`,
      contactEmail: `merchant${i + 1}@example.test`,
      contactPhone: '+1 202 555 0100',
      taxId: `900000${String(i).padStart(3, '0')}`,
      bankAccountNumber: `00000000${String(i).padStart(4, '0')}`,
      estimatedMonthlyVolume: (i + 1) * 1000,
      createdAt: new Date(Date.UTC(2026, 9, 1, i)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 9, 1, i)).toISOString(),
    })),
    history: [],
  };
}

function validate(data, complete) {
  for (const field of fields.filter((f) => f !== 'estimatedMonthlyVolume')) {
    if (typeof data[field] !== 'string' || data[field].length > 160) return `${field} is invalid.`;
    if (complete && !data[field].trim()) return `${field} is required.`;
  }
  if (
    !Number.isFinite(data.estimatedMonthlyVolume) ||
    data.estimatedMonthlyVolume < 0 ||
    data.estimatedMonthlyVolume > 1e9
  )
    return 'Monthly volume must be between 0 and 1,000,000,000.';
  if (!complete) return null; // Drafts may be incomplete; submission enforces every field.
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail))
    return 'Enter a valid email.';
  if (data.contactPhone && !/^\+?[\d ()-]{7,20}$/.test(data.contactPhone))
    return 'Enter a valid phone number.';
  if (data.taxId && !/^\d{9}$/.test(data.taxId)) return 'Tax ID must contain 9 digits.';
  if (data.bankAccountNumber && !/^\d{8,18}$/.test(data.bankAccountNumber))
    return 'Account number must contain 8–18 digits.';
  if (complete && !['Retail', 'Services', 'Hospitality', 'Other'].includes(data.businessType))
    return 'Select a business type.';
  if (complete && data.estimatedMonthlyVolume <= 0)
    return 'Monthly volume must be greater than zero.';
  return null;
}

function createServer({ persist = true, dataFile = path.join(__dirname, 'data.local.json') } = {}) {
  let db =
    persist && fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : seed();
  const access = new Map();
  const refresh = new Map();
  const save = () => {
    if (persist) fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
  };
  function tokens(user) {
    const accessToken = randomUUID();
    const refreshToken = randomUUID();
    const accessTokenExpiresAt = Date.now() + 45000;
    access.set(accessToken, { user, expires: accessTokenExpiresAt });
    refresh.set(refreshToken, { user, expires: Date.now() + 3600000 });
    return { ...user, accessToken, refreshToken, accessTokenExpiresAt };
  }
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      const route = url.pathname.replace(/^\/api/, '');
      let body = {};
      if (['POST', 'PATCH'].includes(req.method)) {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 16000) return send(413, { message: 'Request too large.' });
        }
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          return send(400, { message: 'Invalid JSON.' });
        }
        if (!body || typeof body !== 'object' || Array.isArray(body))
          return send(400, { message: 'Invalid request.' });
      }
      if (route === '/auth/login' && req.method === 'POST') {
        const user = users.find((u) => u.username === body.username);
        return user ? send(200, tokens(user)) : send(400, { message: 'Choose a demo user.' });
      }
      if (route === '/auth/refresh' && req.method === 'POST') {
        const session = refresh.get(body.refreshToken);
        if (!session || session.expires < Date.now())
          return send(401, { message: 'Session expired.' });
        refresh.delete(body.refreshToken);
        // A small delay makes simultaneous 401 responses reproducible in the demo.
        await new Promise((resolve) => setTimeout(resolve, 100));
        return send(200, tokens(session.user));
      }
      const session = access.get((req.headers.authorization || '').replace(/^Bearer /, ''));
      if (!session || session.expires < Date.now())
        return send(401, { message: 'Please sign in.' });
      const user = session.user;
      if (route === '/reviewers' && req.method === 'GET') {
        return user.role === 'ADMIN'
          ? send(
              200,
              users.filter((u) => u.role === 'REVIEWER'),
            )
          : send(403, { message: 'Admin access required.' });
      }
      if (route === '/applications' && req.method === 'GET') {
        const search = (url.searchParams.get('search') || '').toLowerCase();
        const status = url.searchParams.get('status');
        const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
        const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize')) || 5));
        const rows = db.applications
          .filter(
            (app) =>
              visible(user, app) &&
              (!status || app.status === status) &&
              app.businessName.toLowerCase().includes(search),
          )
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        return send(200, {
          data: rows.slice((page - 1) * pageSize, page * pageSize).map(publicApp),
          total: rows.length,
          page,
          pageSize,
        });
      }
      if (route === '/applications' && req.method === 'POST') {
        if (user.role !== 'SALES')
          return send(403, { message: 'Only sales can create applications.' });
        const data = Object.fromEntries(
          fields.map((f) => [f, f === 'estimatedMonthlyVolume' ? (body[f] ?? 0) : (body[f] ?? '')]),
        );
        const error = validate(data, false);
        if (error) return send(400, { message: error });
        const app = {
          ...data,
          id: randomUUID(),
          createdBy: user.username,
          assignedTo: null,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.applications.push(app);
        save();
        return send(201, publicApp(app));
      }
      const match = route.match(
        /^\/applications\/([^/]+)(?:\/(history|sensitive|submit|decision|assignment))?$/,
      );
      if (!match) return send(404, { message: 'Endpoint not found.' });
      const app = db.applications.find((a) => a.id === match[1]);
      if (!app || !visible(user, app))
        return send(404, { message: 'Application not found or access denied.' });
      const action = match[2];
      if (req.method === 'GET') {
        if (action === 'history')
          return send(
            200,
            db.history.filter((h) => h.applicationId === app.id),
          );
        if (action === 'sensitive') {
          if (
            user.role !== 'ADMIN' &&
            !(user.role === 'REVIEWER' && app.assignedTo === user.username)
          )
            return send(403, { message: 'Reveal not permitted.' });
          return send(200, { taxId: app.taxId, bankAccountNumber: app.bankAccountNumber });
        }
        if (!action) return send(200, publicApp(app));
      }
      if (req.method === 'PATCH' && !action) {
        if (user.role !== 'SALES' || app.createdBy !== user.username || !editable(app))
          return send(403, { message: 'Only your own draft can be edited.' });
        const changes = Object.fromEntries(
          fields.filter((f) => Object.hasOwn(body, f)).map((f) => [f, body[f]]),
        );
        const error = validate({ ...app, ...changes }, false);
        if (error) return send(400, { message: error });
        Object.assign(app, changes);
      } else if (req.method === 'POST' && action === 'submit') {
        if (user.role !== 'SALES' || app.createdBy !== user.username || !editable(app))
          return send(403, { message: 'Only your own draft can be submitted.' });
        const error = validate(app, true);
        if (error) return send(400, { message: error });
        app.status = app.assignedTo ? 'UNDER_REVIEW' : 'SUBMITTED';
      } else if (req.method === 'POST' && action === 'decision') {
        if (user.role !== 'REVIEWER' || app.assignedTo !== user.username)
          return send(403, { message: 'Assigned reviewer access required.' });
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(app.status))
          return send(409, { message: 'Application is not awaiting review.' });
        if (
          !['APPROVED', 'REJECTED'].includes(body.decision) ||
          typeof body.comment !== 'string' ||
          body.comment.trim().length < 10 ||
          body.comment.length > 1000
        )
          return send(400, {
            message: 'Choose a decision and enter a reason (10–1,000 characters).',
          });
        db.history.push({
          id: randomUUID(),
          applicationId: app.id,
          reviewerUsername: user.username,
          decision: body.decision,
          comment: body.comment.trim(),
          createdAt: new Date().toISOString(),
        });
        app.status = body.decision;
      } else if (req.method === 'POST' && action === 'assignment') {
        if (user.role !== 'ADMIN') return send(403, { message: 'Admin access required.' });
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(app.status))
          return send(409, { message: 'Only pending applications can be assigned.' });
        if (
          body.assignedTo !== null &&
          !users.some((u) => u.username === body.assignedTo && u.role === 'REVIEWER')
        )
          return send(400, { message: 'Choose a reviewer.' });
        app.assignedTo = body.assignedTo;
        app.status = app.assignedTo ? 'UNDER_REVIEW' : 'SUBMITTED';
      } else return send(405, { message: 'Method not allowed.' });
      app.updatedAt = new Date().toISOString();
      save();
      return send(200, publicApp(app));
    } catch (error) {
      console.error('Mock API request failed:', error.message);
      if (!res.headersSent) send(500, { message: 'Mock API error. Try again.' });
    }
  });
}
if (require.main === module)
  createServer().listen(3000, '127.0.0.1', () =>
    console.log('Mock API: http://127.0.0.1:3000/api'),
  );
module.exports = { createServer };
