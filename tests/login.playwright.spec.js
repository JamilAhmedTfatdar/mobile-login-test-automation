// Playwright - mobile-web login page
// Assumes baseURL is set in playwright.config.js and the sample app is running
// (the config starts it automatically).

import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

const VALID = { email: 'user@example.com', pass: 'CorrectPass123' };

// exact: true matters. The password field has a "Show password" button, and a
// non-exact label search for "Password" would match both and fail.
const emailField = (page) => page.getByLabel('Email', { exact: true });
const passwordField = (page) => page.getByLabel('Password', { exact: true });

async function login(page, email, pass) {
  await emailField(page).fill(email);
  await passwordField(page).fill(pass);
  await page.getByRole('button', { name: 'Log in' }).click();
}

async function lockAccount(page) {
  for (let i = 0; i < 5; i++) {
    await login(page, VALID.email, `Wrong${i}Pass123`);
    await expect(page.getByRole('alert')).toBeVisible();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

// LG-01
test('valid login', async ({ page }) => {
  await login(page, VALID.email, VALID.pass);
  await expect(page).toHaveURL(/home/);
});

// LG-03
test('wrong password shows a generic error', async ({ page }) => {
  await login(page, VALID.email, 'WrongPass123');
  await expect(page.getByRole('alert')).toContainText('Incorrect email or password.');
});

// LG-05 / LG-06: lockout after 5 failed attempts
test('locks the account after 5 failed attempts', async ({ page }) => {
  await lockAccount(page);
  await expect(page.getByRole('alert')).toContainText('Account locked');

  // Correct password is still blocked while locked
  await login(page, VALID.email, VALID.pass);
  await expect(page.getByRole('alert')).toContainText('Account locked');
  await expect(page).not.toHaveURL(/home/);
});

// LG-07: the "reset your password" link in the lockout message works and unlocks the account
test('reset password link unlocks a locked account', async ({ page }) => {
  await lockAccount(page);
  await expect(page.getByRole('alert')).toContainText('Account locked');

  await page.getByRole('alert').getByRole('link', { name: 'reset your password' }).click();
  await expect(page).toHaveURL(/forgot/);
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();

  await emailField(page).fill(VALID.email);
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByRole('status')).toContainText('You can log in now');

  await page.getByRole('link', { name: 'Back to log in' }).click();
  await login(page, VALID.email, VALID.pass);
  await expect(page).toHaveURL(/home/);
});

// LG-08: both fields empty
test('empty fields show required messages', async ({ page }) => {
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Email is required')).toBeVisible();
  await expect(page.getByText('Password is required')).toBeVisible();
  await expect(page).not.toHaveURL(/home/);
});

// LG-16: double-tap sends only one request
test('double-tapping Log in sends one login request', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/login', (route) => {
    requests += 1;
    route.continue();
  });

  await emailField(page).fill(VALID.email);
  await passwordField(page).fill(VALID.pass);
  await page.getByRole('button', { name: 'Log in' }).dblclick();

  await expect(page).toHaveURL(/home/);
  expect(requests).toBe(1);
});

// LG-17 / LG-18: offline login, then retry after reconnect
test('shows an offline message and recovers on retry', async ({ page, context }) => {
  await emailField(page).fill(VALID.email);
  await passwordField(page).fill(VALID.pass);

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByRole('alert')).toContainText('No internet connection');
  await expect(emailField(page)).toHaveValue(VALID.email); // still filled

  await context.setOffline(false);
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page).toHaveURL(/home/);
});

// LG-20: Forgot password link opens the reset screen, and back returns to login
test('forgot password opens the reset screen and back returns to login', async ({ page }) => {
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page).toHaveURL(/forgot/);
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();

  await page.getByRole('link', { name: 'Back to log in' }).click();
  await expect(page).toHaveURL(/login/);
});

// LG-26: attempts-left warning after each wrong password
test('wrong password shows how many attempts are left', async ({ page }) => {
  const expected = [
    'Incorrect email or password. 4 attempts left.',
    'Incorrect email or password. 3 attempts left.',
    'Incorrect email or password. 2 attempts left.',
    'Incorrect email or password. 1 attempt left.',
  ];
  for (let i = 0; i < expected.length; i++) {
    await login(page, VALID.email, `Wrong${i}Pass123`);
    await expect(page.getByRole('alert')).toHaveText(expected[i]);
  }
});

// LG-27: Show / Hide password toggle
test('show and hide password toggle reveals the typed password', async ({ page }) => {
  const pw = passwordField(page);
  await pw.fill(VALID.pass);
  await expect(pw).toHaveAttribute('type', 'password');

  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(pw).toHaveAttribute('type', 'text');
  await expect(pw).toHaveValue(VALID.pass);

  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(pw).toHaveAttribute('type', 'password');
});

// LG-29: brand header with logo is shown
test('brand logo is shown on the login screen', async ({ page }) => {
  await expect(page.getByRole('img', { name: 'Sample App logo' })).toBeVisible();
});
