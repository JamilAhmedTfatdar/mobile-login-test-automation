// Login screen tests. Test case IDs match login-test-cases.md in the project root.
// Specs only describe WHAT is tested. Locators live in test/locators, steps live in
// test/pageobjects, and emails, passwords and messages live in test/data.

import LoginPage from '../pageobjects/LoginPage.js';
import HomePage from '../pageobjects/HomePage.js';
import ForgotPasswordPage from '../pageobjects/ForgotPasswordPage.js';
import { users, wrongPasswords, newPassword, messages } from '../data/testData.js';

describe('Login screen', () => {
  beforeEach(async () => {
    await LoginPage.openFresh();
  });

  it('LG-01 logs in with valid credentials', async () => {
    await LoginPage.login(users.valid.email, users.valid.password);
    await HomePage.waitUntilLoaded();
    await expect(HomePage.heading).toHaveText(messages.homeHeading);
  });

  it('LG-03 shows a generic error for a wrong password', async () => {
    await LoginPage.login(users.valid.email, wrongPasswords[0]);
    await expect(LoginPage.alert).toBeDisplayed();
    await expect(LoginPage.alert).toHaveText(expect.stringContaining(messages.wrongPassword));
  });

  it('LG-08 shows required messages when both fields are empty', async () => {
    await LoginPage.tapLogin();
    await expect(LoginPage.emailError).toHaveText(messages.emailRequired);
    await expect(LoginPage.passwordError).toHaveText(messages.passwordRequired);
  });

  it('LG-26 shows how many attempts are left after each wrong password', async () => {
    for (let i = 0; i < messages.attemptsLeft.length; i++) {
      await LoginPage.login(users.valid.email, wrongPasswords[i]);
      await expect(LoginPage.alert).toHaveText(messages.attemptsLeft[i]);
      await LoginPage.waitForLoginToFinish();
    }
  });

  it('LG-05 and LG-06 lock the account after 5 failed attempts, even for the right password', async () => {
    await LoginPage.failLogins(users.valid.email, wrongPasswords);
    await expect(LoginPage.alert).toHaveText(expect.stringContaining(messages.accountLocked));

    await LoginPage.login(users.valid.email, users.valid.password);
    await expect(LoginPage.alert).toHaveText(expect.stringContaining(messages.accountLocked));
    await expect(HomePage.heading).not.toHaveText(messages.homeHeading);
  });

  it('LG-07 locked account: reset the password, log in with the new one, log out', async () => {
    await LoginPage.failLogins(users.valid.email, wrongPasswords);
    await expect(LoginPage.alert).toHaveText(expect.stringContaining(messages.accountLocked));

    await expect(LoginPage.resetPasswordButton).toBeDisplayed();
    await LoginPage.tapResetPassword();
    await ForgotPasswordPage.waitUntilLoaded();
    await expect(ForgotPasswordPage.heading).toHaveText(messages.resetHeading);

    await ForgotPasswordPage.resetPassword(users.valid.email, newPassword);
    await expect(ForgotPasswordPage.status).toHaveText(expect.stringContaining(messages.resetDone));

    await ForgotPasswordPage.tapBackToLogin();
    await LoginPage.waitForUrlToContain('/login');
    await LoginPage.login(users.valid.email, newPassword);
    await HomePage.waitUntilLoaded();
    await expect(HomePage.heading).toHaveText(messages.homeHeading);

    await HomePage.tapLogOut();
    await LoginPage.waitForUrlToContain('/login');
  });

  it('LG-32 the old password stops working after a reset', async () => {
    await LoginPage.tapForgotPassword();
    await ForgotPasswordPage.waitUntilLoaded();
    await ForgotPasswordPage.resetPassword(users.valid.email, newPassword);
    await expect(ForgotPasswordPage.status).toHaveText(expect.stringContaining(messages.resetDone));

    await ForgotPasswordPage.tapBackToLogin();
    await LoginPage.login(users.valid.email, users.valid.password);
    await expect(LoginPage.alert).toHaveText(expect.stringContaining(messages.wrongPassword));
  });

  it('LG-33 the reset form rejects a short or mismatched password', async () => {
    await LoginPage.tapForgotPassword();
    await ForgotPasswordPage.waitUntilLoaded();
    await ForgotPasswordPage.resetPassword(users.valid.email, 'short', 'different1');
    await expect(ForgotPasswordPage.newPasswordError).toHaveText(messages.passwordLength);
    await expect(ForgotPasswordPage.confirmPasswordError).toHaveText(messages.passwordMismatch);
  });

  it('LG-20 opens the reset screen from Forgot password and goes back', async () => {
    await LoginPage.tapForgotPassword();
    await ForgotPasswordPage.waitUntilLoaded();
    await expect(ForgotPasswordPage.heading).toHaveText(messages.resetHeading);

    await ForgotPasswordPage.tapBackToLogin();
    await LoginPage.waitForUrlToContain('/login');
  });

  it('LG-27 shows and hides the typed password with the eye icon', async () => {
    await LoginPage.enterPassword(users.valid.password);
    await expect(LoginPage.passwordInput).toHaveAttribute('type', 'password');

    await LoginPage.togglePassword();
    await expect(LoginPage.passwordInput).toHaveAttribute('type', 'text');

    await LoginPage.togglePassword();
    await expect(LoginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  it('LG-29 shows the brand logo', async () => {
    await expect(LoginPage.logo).toBeDisplayed();
  });
});
