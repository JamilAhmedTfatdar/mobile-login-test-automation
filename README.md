# Mobile Login Test Automation (Practice Project)

[![Playwright tests](https://github.com/JamilAhmedTfatdar/mobile-login-test-automation/actions/workflows/playwright.yml/badge.svg)](https://github.com/JamilAhmedTfatdar/mobile-login-test-automation/actions/workflows/playwright.yml)

A small, self-contained project that shows how I design, automate and review tests for a mobile login screen. It uses a sample login app with realistic rules (error messages, attempts-left warning, account lockout, password reset, offline handling) and two automated suites:

- **Playwright**: fast tests in an iPhone 13 mobile-Safari profile (13 tests).
- **Appium + WebdriverIO**: the same flows driven on a real iOS Simulator (Safari), written as a page-object framework with separate locators and test data (11 tests).

The tests were drafted with AI assistance and then reviewed, corrected and extended by me. The goal is to practise an "AI writes, engineer reviews and approves" workflow on a safe, non-work codebase.

## What is tested

The full list is in [`login-test-cases.md`](login-test-cases.md): 36 cases with steps, expected results and status (Auto or Manual), grouped as core login, lockout, empty input, input limits, behavior (offline, double-tap, keyboard), session handling and visual checks.

| Test case | What it checks |
|-----------|----------------|
| LG-01 | Valid login lands on the home page |
| LG-03 | Wrong password shows a generic error (no hint about which field was wrong) |
| LG-05 / LG-06 | Account locks after 5 failed attempts and stays locked even with the correct password |
| LG-07 | Full recovery flow: locked, Reset password button, new password, log in with it, log out |
| LG-08 | Empty fields show "Email is required" and "Password is required" |
| LG-16 | Double-tapping Log in sends only one request (Playwright) |
| LG-17 / LG-18 | Offline login shows a message and Retry succeeds after reconnecting (Playwright) |
| LG-20 | Forgot password opens the reset screen and back returns to login |
| LG-26 | Each failed attempt shows how many attempts are left |
| LG-27 | Show/Hide password toggle reveals and masks the typed password |
| LG-29 | Brand logo is shown on the login screen |
| LG-32 | The old password stops working after a reset |
| LG-33 | The reset form rejects a short or mismatched password |

## Sample app rules

- Wrong credentials: "Incorrect email or password. N attempts left." (generic on purpose, for security)
- 5 failed attempts lock the account for 15 minutes; a **Reset password** button appears under the message, and the lock ends by itself after 15 minutes
- Reset screen: email, new password (8-64 characters) and confirmation; success message, then back to log in
- Format errors appear after leaving the field, not on every keystroke
- Email up to 254 characters, trimmed; password 8-64 characters, spaces kept
- Eye icon on the password field shows or hides what was typed
- No network: message with a Retry button, email stays filled
- On a phone, the layout compacts while the keyboard is open so the buttons stay visible

Test account: `user@example.com` / `CorrectPass123`

## Project structure

```
sample-app/server.js            Sample login app (Node, no dependencies)
tests/login.playwright.spec.js  Playwright tests
playwright.config.js            Playwright config: iPhone 13 profile, starts the sample app
appium/                         Appium + WebdriverIO framework (see appium/README.md)
  test/specs/                   WHAT is tested
  test/pageobjects/             HOW to do it
  test/locators/                WHERE things are
  test/data/users.json          Test data and expected messages
login-test-cases.md             Test case list with expected results
```

## Run it

Playwright:

```
npm install
npx playwright install webkit
npx playwright test
```

Add `--ui` to watch the run with a timeline and screenshots of each step.

Appium on the iOS Simulator (macOS with Xcode):

```
cd appium
npm install
npm run setup:driver
npm test
```

The Simulator opens by itself and the script taps and types. `SLOW_MS=3000 npm test` slows it down so you can watch. More detail is in [`appium/README.md`](appium/README.md).

To explore the app by hand, run `node sample-app/server.js` and open `http://localhost:3100/login` in Safari on the iOS Simulator.

## Changes driven by testing

- **Attempts-left warning:** added after the first version of the tests. It broke the original wrong-password test, which expected the exact old message. The fix followed the usual order: update the requirement and test case list, update the test, then change the app.
- **Found while exploring on the iOS Simulator:** the Forgot password link looked like plain text, users could not check what they typed, the "reset your password" text in the lockout message was not a link, and the screen looked bare. Each became a requirement and a test case.
- **Found while watching Appium run:** the keyboard covered the buttons, then the first fix left too much blank space and kept moving the page. It now measures the real keyboard height and uses a compact layout (LG-30, LG-31).
- **Found while reviewing the lockout flow:** the reset text sat inside the error box, the reset screen only unlocked the account instead of setting a new password, the attempts-left message wrapped onto two lines, and the counter did not restart after the lock ran out (LG-07, LG-32 to LG-35).
- **Locator lesson:** adding the "Show password" button made the old `getByLabel('Password')` match two elements and fail. The tests now use exact label matching.
- **Tool lesson:** the newest Appium iOS driver needs Appium 4 (beta), so the framework pins that version.

## Roadmap

- Appium tests for a native iOS app (accessibility-ID locators) and an Android emulator
- Automate the remaining Manual cases where practical
- CI run on every push (GitHub Actions)
