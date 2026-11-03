// Locators for the login screen, in one place.
// If the app's HTML changes, fix it here and no test needs to change.
// (For a native app these become accessibility IDs such as '~login-button'.)

export const login = {
  logo: 'svg[aria-label="Sample App logo"]',
  heading: 'h1',
  emailInput: '#email',
  passwordInput: '#password',
  togglePasswordButton: '#toggle-password',
  loginButton: '#login-button',
  retryButton: '#retry-button',
  forgotPasswordLink: '#forgot-link',
  emailError: '#email-err',
  passwordError: '#password-err',
  alert: '#form-alert',
  resetPasswordButton: '#reset-account-link',
};
