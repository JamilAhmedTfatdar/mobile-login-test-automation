// Sample login app for practising Playwright tests.
// No dependencies: Node only. Run with:  node sample-app/server.js
//
// Rules it follows (same as login-test-cases.md):
// - Wrong credentials: generic error "Incorrect email or password. N attempts left." shown after Log in
// - 5 failed attempts locks the account for 15 minutes (tracked per browser session)
// - Empty fields: "Email is required" / "Password is required" in red under the field
// - Email: max 254 chars, spaces trimmed, printable ASCII only (emoji rejected)
// - Password: 8-64 chars, spaces kept
// - No network: "No internet connection..." message with a Retry button; email stays filled
//
// Valid test account: user@example.com / CorrectPass123

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3100;
const VALID = { email: 'user@example.com', password: 'CorrectPass123' };
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const LOCK_MSG = 'Account locked. Try again in 15 minutes or reset your password.';

// Lockout is tracked per browser session (cookie), so each Playwright test,
// which starts with a fresh browser context, gets a clean counter.
const sessions = new Map(); // sid -> { fails, lockedUntil }

function getSid(req) {
  const m = /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.cookie || '');
  return m ? m[1] : null;
}

const PAGE_STYLE = `
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 24px; max-width: 420px; }
  h1 { font-size: 24px; }
  label { display: block; margin-top: 16px; font-weight: 600; }
  input { width: 100%; box-sizing: border-box; padding: 12px; font-size: 16px; margin-top: 6px;
          border: 1px solid #999; border-radius: 6px; }
  .err { color: #c00; font-size: 14px; min-height: 18px; margin-top: 4px; }
  .alert { color: #c00; background: #fee; border: 1px solid #c00; border-radius: 6px;
           padding: 10px; margin-top: 16px; }
  button { margin-top: 16px; padding: 12px 16px; font-size: 16px; border-radius: 6px; border: 0;
           background: #0b5fff; color: #fff; width: 100%; }
  button:disabled { background: #9ab; }
  a { display: inline-block; margin-top: 16px; }
`;

const LOGIN_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sample App - Sign in</title><style>${PAGE_STYLE}</style></head>
<body>
  <h1>Welcome back</h1>
  <form id="login-form" novalidate>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="username" maxlength="254">
    <div class="err" id="email-err"></div>

    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" maxlength="64">
    <div class="err" id="password-err"></div>

    <div id="form-alert" class="alert" role="alert" hidden></div>
    <button type="submit" id="login-button">Log in</button>
    <button type="button" id="retry-button" hidden>Retry</button>
  </form>
  <a href="/forgot">Forgot password?</a>

<script>
  const form = document.getElementById('login-form');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const loginBtn = document.getElementById('login-button');
  const retryBtn = document.getElementById('retry-button');
  const alertBox = document.getElementById('form-alert');

  function setErr(field, msg) { document.getElementById(field + '-err').textContent = msg || ''; }
  function showAlert(msg) { alertBox.textContent = msg; alertBox.hidden = false; }

  function validateEmail() {
    const e = email.value.trim();
    if (!e) { setErr('email', 'Email is required'); return false; }
    if (e.length > 254 || !/^[\\x21-\\x7E]+@[\\x21-\\x7E]+\\.[\\x21-\\x7E]+$/.test(e)) {
      setErr('email', 'Enter a valid email'); return false;
    }
    setErr('email', ''); return true;
  }
  function validatePassword() {
    const p = password.value;
    if (!p) { setErr('password', 'Password is required'); return false; }
    if (p.length < 8 || p.length > 64) { setErr('password', 'Password must be 8-64 characters'); return false; }
    setErr('password', ''); return true;
  }

  // Format errors show after the user leaves the field, not on every keystroke.
  email.addEventListener('blur', () => { if (email.value) validateEmail(); });

  async function submit() {
    if (loginBtn.disabled) return;
    alertBox.hidden = true;
    retryBtn.hidden = true;
    const okEmail = validateEmail();
    const okPass = validatePassword();
    if (!okEmail || !okPass) return;

    loginBtn.disabled = true;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), password: password.value })
      });
      const data = await res.json();
      if (res.ok) { window.location.href = '/home'; return; }
      loginBtn.disabled = false;
      showAlert(data.message);
    } catch (err) {
      loginBtn.disabled = false;
      showAlert('No internet connection. Check your connection and try again.');
      retryBtn.hidden = false;
    }
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  retryBtn.addEventListener('click', submit);
</script>
</body></html>`;

const HOME_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sample App - Home</title><style>${PAGE_STYLE}</style></head>
<body><h1>Welcome home</h1><p>You are logged in.</p><a href="/login">Log out</a></body></html>`;

const FORGOT_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sample App - Reset password</title><style>${PAGE_STYLE}</style></head>
<body><h1>Reset your password</h1><p>Reset screen (placeholder).</p><a href="/login">Back to login</a></body></html>`;

function sendHtml(res, html, headers = {}) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(html);
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (req.method === 'GET' && (url === '/' || url === '/login')) {
    const headers = {};
    if (!getSid(req)) headers['Set-Cookie'] = `sid=${crypto.randomBytes(8).toString('hex')}; Path=/; HttpOnly`;
    return sendHtml(res, LOGIN_PAGE, headers);
  }
  if (req.method === 'GET' && url === '/home') return sendHtml(res, HOME_PAGE);
  if (req.method === 'GET' && url === '/forgot') return sendHtml(res, FORGOT_PAGE);

  if (req.method === 'POST' && url === '/api/login') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      let body = {};
      try { body = JSON.parse(raw || '{}'); } catch (e) { /* ignore */ }

      let sid = getSid(req);
      const headers = {};
      if (!sid) {
        sid = crypto.randomBytes(8).toString('hex');
        headers['Set-Cookie'] = `sid=${sid}; Path=/; HttpOnly`;
      }
      const s = sessions.get(sid) || { fails: 0, lockedUntil: 0 };
      sessions.set(sid, s);

      if (s.lockedUntil > Date.now()) return sendJson(res, 423, { message: LOCK_MSG }, headers);

      const email = String(body.email || '').trim().toLowerCase();
      if (email === VALID.email && body.password === VALID.password) {
        s.fails = 0;
        return sendJson(res, 200, { ok: true }, headers);
      }

      s.fails += 1;
      if (s.fails >= MAX_FAILS) {
        s.lockedUntil = Date.now() + LOCK_MS;
        return sendJson(res, 423, { message: LOCK_MSG }, headers);
      }
      const left = MAX_FAILS - s.fails;
      return sendJson(res, 401, {
        message: `Incorrect email or password. ${left} attempt${left === 1 ? '' : 's'} left.`
      }, headers);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => console.log(`Sample app running at http://localhost:${PORT}/login`));
