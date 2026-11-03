import BasePage from './BasePage.js';
import { forgot as F } from '../locators/forgot.locators.js';

class ForgotPasswordPage extends BasePage {
  constructor() {
    super('/forgot');
  }

  get heading() { return $(F.heading); }
  get emailInput() { return $(F.emailInput); }
  get newPasswordInput() { return $(F.newPasswordInput); }
  get confirmPasswordInput() { return $(F.confirmPasswordInput); }
  get emailError() { return $(F.emailError); }
  get newPasswordError() { return $(F.newPasswordError); }
  get confirmPasswordError() { return $(F.confirmPasswordError); }
  get resetButton() { return $(F.resetButton); }
  get status() { return $(F.status); }
  get backToLoginLink() { return $(F.backToLoginLink); }

  // Fill in the email and the new password (twice), then tap Reset password.
  async resetPassword(email, newPassword, confirmPassword = newPassword) {
    await this.emailInput.setValue(email);
    await this.newPasswordInput.setValue(newPassword);
    await this.confirmPasswordInput.setValue(confirmPassword);
    await this.resetButton.click();
  }

  async tapBackToLogin() {
    await this.backToLoginLink.click();
  }

  async waitUntilLoaded() {
    await this.waitForUrlToContain('/forgot');
  }
}

export default new ForgotPasswordPage();
