// Sample login app for practising Playwright tests.
// No dependencies: Node only. Run with:  node sample-app/server.js
//
// Rules it follows (same as login-test-cases.md):
// - Wrong credentials: generic error "Incorrect email or password. N attempts left." shown after Log in
// - 5 failed attempts locks the account for 15 minutes (tracked per browser session)
// - The lockout message contains a working "reset your password" link
// - Forgot password screen: enter email, tap Reset password -> account is unlocked (simplified
//   simulation: a real app would email a reset link first)
// - Empty fields: "Email is required" / "Password is required" in red under the field
// - Email: max 254 chars, spaces trimmed, printable ASCII only (emoji rejected)
// - Password: 8-64 chars, spaces kept, Show/Hide toggle (eye icon) reveals what was typed
// - Forgot password is a button-style link with a lock icon
// - Brand header with logo and decorative background
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
const RESET_MSG = 'If an account exists for that email, it has been reset. You can log in now.';

// Lockout is tracked per browser session (cookie), so each Playwright test,
// which starts with a fresh browser context, gets a clean counter.
const sessions = new Map(); // sid -> { fails, lockedUntil }

function getSid(req) {
  const m = /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.cookie || '');
  return m ? m[1] : null;
}

// Returns this visitor's session record, plus a Set-Cookie header if they are new.
function session(req) {
  let sid = getSid(req);
  const headers = {};
  if (!sid) {
    sid = crypto.randomBytes(8).toString('hex');
    headers['Set-Cookie'] = `sid=${sid}; Path=/; HttpOnly`;
  }
  const s = sessions.get(sid) || { fails: 0, lockedUntil: 0 };
  sessions.set(sid, s);
  return { s, headers };
}

const ICONS = {
  logo: '<svg role="img" aria-label="Sample App logo" width="44" height="44" viewBox="0 0 44 44">' +
        '<circle cx="22" cy="22" r="22" fill="#fff"/>' +
        '<rect x="14" y="9" width="16" height="26" rx="4" fill="none" stroke="#0b5fff" stroke-width="2.5"/>' +
        '<path d="M18.5 22.5l2.8 2.8 5.2-5.6" fill="none" stroke="#0b5fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
       '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
       '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>' +
       '<path class="slash" d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
        '<rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
         '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const PAGE_STYLE = `
  [hidden] { display: none !important; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; background: #f2f6ff; color: #111; }
  .hero { background: linear-gradient(135deg, #0b5fff 0%, #5b8cff 55%, #9bc0ff 100%);
          padding: 36px 24px 72px; position: relative; overflow: hidden; color: #fff; }
  .hero::before, .hero::after { content: ""; position: absolute; border-radius: 50%; background: rgba(255,255,255,.14); }
  .hero::before { width: 220px; height: 220px; right: -60px; top: -80px; }
  .hero::after { width: 170px; height: 170px; left: -60px; bottom: -90px; }
  .brand { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
  .brand span { font-size: 22px; font-weight: 700; }
  .card { background: #fff; border-radius: 16px; margin: -40px auto 24px; width: calc(100% - 32px);
          max-width: 420px; padding: 22px 20px 24px; box-shadow: 0 6px 24px rgba(10,40,120,.14); position: relative; }
  h1 { font-size: 24px; margin: 0; }
  .sub { color: #555; margin: 4px 0 8px; }
  label { display: block; margin-top: 16px; font-weight: 600; }
  input { width: 100%; padding: 12px; font-size: 16px; margin-top: 6px; border: 1px solid #999; border-radius: 8px; }
  .pw-wrap { position: relative; }
  .pw-wrap input { padding-right: 48px; }
  .icon-btn { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); margin: 3px 0 0;
              width: 40px; height: 40px; border: 0; background: transparent; color: #444; border-radius: 8px;
              display: flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; }
  .icon-btn .slash { display: none; }
  .icon-btn[data-visible="true"] .slash { display: inline; }
  .err { color: #c00; font-size: 14px; min-height: 18px; margin-top: 4px; }
  .alert { color: #c00; background: #fee; border: 1px solid #c00; border-radius: 8px; padding: 10px; margin-top: 12px; }
  .alert a { color: #900; font-weight: 600; }
  .ok { color: #0a6b2d; background: #eafaf0; border: 1px solid #0a6b2d; border-radius: 8px; padding: 10px; margin-top: 12px; }
  .btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
         margin-top: 16px; padding: 13px 16px; font-size: 16px; font-weight: 600; border-radius: 10px;
         border: 2px solid #0b5fff; text-decoration: none; cursor: pointer; }
  .btn.primary { background: #0b5fff; color: #fff; }
  .btn.secondary { background: #fff; color: #0b5fff; }
  .btn:disabled { background: #9ab; border-color: #9ab; }
`;

function head(title) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><style>${PAGE_STYLE}</style></head>`;
}

const HERO = `<header class="hero"><div class="brand">${ICONS.logo}<span>Sample App</span></div></header>`;

const LOGIN_PAGE = `${head('Sample App - Sign in')}
<body>
  ${HERO}
  <main class="card">
    <h1>Welcome back</h1>
    <p class="sub">Sign in to continue</p>
    <form id="login-form" novalidate>
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="username" maxlength="254">
      <div class="err" id="email-err"></div>

      <label for="password">Password</label>
      <div class="pw-wrap">
        <input id="password" name="password" type="password" autocomplete="current-password" maxlength="64">
        <button type="button" id="toggle-password" class="icon-btn" aria-label="Show password" data-visible="false">${ICONS.eye}</button>
      </div>
      <div class="err" id="password-err"></div>

      <div id="form-alert" class="alert" role="alert" hidden></div>
      <button type="submit" id="login-button" class="btn primary"><span>Log in</span>${ICONS.arrow}</button>
      <button type="button" id="retry-button" class="btn secondary" hidden>Retry</button>
    </form>
    <a href="/forgot" id="forgot-link" class="btn secondary">${ICONS.lock}<span>Forgot password?</span></a>
  </main>

<script>
  const form = document.getElementById('login-form');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const toggle = document.getElementById('toggle-password');
  const loginBtn = document.getElementById('login-button');
  const retryBtn = document.getElementById('retry-button');
  const alertBox = document.getElementById('form-alert');

  function setErr(field, msg) { document.getElementById(field + '-err').textContent = msg || ''; }

  // Shows a message in the red alert box. For the lockout message, "reset your password"
  // becomes a working link to the forgot-password screen.
  function showAlert(msg, withResetLink) {
    alertBox.textContent = '';
    const marker = 'reset your password';
    const i = msg.indexOf(marker);
    if (withResetLink && i >= 0) {
      alertBox.append(msg.slice(0, i));
      const a = document.createElement('a');
      a.href = '/forgot';
      a.textContent = marker;
      alertBox.append(a);
      alertBox.append(msg.slice(i + marker.length));
    } else {
      alertBox.textContent = msg;
    }
    alertBox.hidden = false;
  }

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

  // Show / hide the typed password.
  toggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    toggle.setAttribute('data-visible', show ? 'true' : 'false');
  });

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
      showAlert(data.message, res.status === 423);
    } catch (err) {
      loginBtn.disabled = false;
      showAlert('No internet connection. Check your connection and try again.', false);
      retryBtn.hidden = false;
    }
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  retryBtn.addEventListener('click', submit);
</script>
</body></html>`;

const HOME_PAGE = `${head('Sample App - Home')}
<body>
  ${HERO}
  <main class="card">
    <h1>Welcome home</h1>
    <p class="sub">You are logged in.</p>
    <a href="/login" class="btn secondary"><span>Log out</span></a>
  </main>
</body></html>`;

const FORGOT_PAGE = `${head('Sample App - Reset password')}
<body>
  ${HERO}
  <main class="card">
    <h1>Reset your password</h1>
    <p class="sub">Enter your account email to reset your password.</p>
    <form id="reset-form" novalidate>
      <label for="forgot-email">Email</label>
      <input id="forgot-email" name="email" type="email" autocomplete="username" maxlength="254">
      <div class="err" id="forgot-err"></div>
      <div id="reset-status" class="ok" role="status" hidden></div>
      <button type="submit" id="reset-button" class="btn primary"><span>Reset password</span></button>
    </form>
    <a href="/login" id="back-link" class="btn secondary"><span>Back to log in</span></a>
  </main>

<script>
  const form = document.getElementById('reset-form');
  const input = document.getElementById('forgot-email');
  const err = document.getElementById('forgot-err');
  const status = document.getElementById('reset-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.hidden = true;
    err.textContent = '';
    const v = input.value.trim();
    if (!v) { err.textContent = 'Email is required'; return; }
    if (!/^[\\x21-\\x7E]+@[\\x21-\\x7E]+\\.[\\x21-\\x7E]+$/.test(v)) { err.textContent = 'Enter a valid email'; return; }
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: v })
      });
      const data = await res.json();
      status.textContent = data.message;
      status.hidden = false;
    } catch (x) {
      err.textContent = 'No internet connection. Check your connection and try again.';
    }
  });
</script>
</body></html>`;

function sendHtml(res, html, headers = {}) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(html);
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

function readJson(req, cb) {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    let body = {};
    try { body = JSON.parse(raw || '{}'); } catch (e) { /* ignore */ }
    cb(body);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (req.method === 'GET' && (url === '/' || url === '/login')) {
    return sendHtml(res, LOGIN_PAGE, session(req).headers);
  }
  if (req.method === 'GET' && url === '/home') return sendHtml(res, HOME_PAGE);
  if (req.method === 'GET' && url === '/forgot') return sendHtml(res, FORGOT_PAGE, session(req).headers);

  if (req.method === 'POST' && url === '/api/login') {
    return readJson(req, (body) => {
      const { s, headers } = session(req);

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
  }

  if (req.method === 'POST' && url === '/api/reset') {
    return readJson(req, (body) => {
      const { s, headers } = session(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return sendJson(res, 400, { message: 'Email is required' }, headers);

      // Simplified simulation: a real app would email a reset link first.
      // Same answer for every email, so the page never reveals which accounts exist.
      if (email === VALID.email) { s.fails = 0; s.lockedUntil = 0; }
      return sendJson(res, 200, { message: RESET_MSG }, headers);
    });
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => console.log(`Sample app running at http://localhost:${PORT}/login`));
