// Playwright - mobile-web login page
// Assumes baseURL is set in playwright.config.js and the page has labels
// "Email" and "Password", a "Log in" button, and role="alert" error messages.

import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

const VALID = { email: 'user@example.com', pass: 'CorrectPass123' };

async function login(page, email, pass) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(pass);
  await page.getByRole('button', { name: 'Log in' }).click();
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
  for (let i = 0; i < 5; i++) {
    await login(page, VALID.email, `Wrong${i}Pass123`);
    await expect(page.getByRole('alert')).toBeVisible();
  }
  await expect(page.getByRole('alert')).toContainText('Account locked');

  // Correct password is still blocked while locked
  await login(page, VALID.email, VALID.pass);
  await expect(page.getByRole('alert')).toContainText('Account locked');
  await expect(page).not.toHaveURL(/home/);
});

// LG-17 / LG-18: offline login, then retry after reconnect
test('shows an offline message and recovers on retry', async ({ page, context }) => {
  await page.getByLabel('Email').fill(VALID.email);
  await page.getByLabel('Password').fill(VALID.pass);

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByRole('alert')).toContainText('No internet connection');
  await expect(page.getByLabel('Email')).toHaveValue(VALID.email); // still filled

  await context.setOffline(false);
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page).toHaveURL(/home/);
});

// LG-16: double-tap sends only one request
test('double-tapping Log in sends one login request', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/login', (route) => {
    requests += 1;
    route.continue();
  });

  await page.getByLabel('Email').fill(VALID.email);
  await page.getByLabel('Password').fill(VALID.pass);
  await page.getByRole('button', { name: 'Log in' }).dblclick();

  await expect(page).toHaveURL(/home/);
  expect(requests).toBe(1);
});

// LG-08: both fields empty
test('empty fields show required messages', async ({ page }) => {
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Email is required')).toBeVisible();
  await expect(page.getByText('Password is required')).toBeVisible();
  await expect(page).not.toHaveURL(/home/);
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
