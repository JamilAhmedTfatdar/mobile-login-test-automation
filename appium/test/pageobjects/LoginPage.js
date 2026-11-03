import BasePage from './BasePage.js';
import { login as L } from '../locators/login.locators.js';

class LoginPage extends BasePage {
  constructor() {
    super('/login');
  }

  // Elements
  get logo() { return $(L.logo); }
  get emailInput() { return $(L.emailInput); }
  get passwordInput() { return $(L.passwordInput); }
  get togglePasswordButton() { return $(L.togglePasswordButton); }
  get loginButton() { return $(L.loginButton); }
  get retryButton() { return $(L.retryButton); }
  get forgotPasswordLink() { return $(L.forgotPasswordLink); }
  get emailError() { return $(L.emailError); }
  get passwordError() { return $(L.passwordError); }
  get alert() { return $(L.alert); }
  get resetPasswordButton() { return $(L.resetPasswordButton); }

  // Actions
  async enterEmail(email) {
    await this.emailInput.setValue(email);
  }

  async enterPassword(password) {
    await this.passwordInput.setValue(password);
  }

  async tapLogin() {
    await this.loginButton.click();
  }

  async login(email, password) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.tapLogin();
  }

  // The Log in button is disabled while a login request is in flight.
  async waitForLoginToFinish() {
    await browser.waitUntil(async () => this.loginButton.isEnabled(), {
      timeout: 10000,
      timeoutMsg: 'Log in button never became enabled again',
    });
  }

  // Submit wrong passwords one after another, waiting for each answer.
  async failLogins(email, passwords) {
    for (const password of passwords) {
      await this.login(email, password);
      await this.waitForLoginToFinish();
      await this.alert.waitForDisplayed();
    }
  }

  async tapResetPassword() {
    await this.resetPasswordButton.click();
  }

  async tapForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async togglePassword() {
    await this.togglePasswordButton.click();
  }

  async getPasswordFieldType() {
    return this.passwordInput.getAttribute('type');
  }
}

export default new LoginPage();
