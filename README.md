# Mobile Login Test Automation (Practice Project)

A small, self-contained project that shows how I design, automate and review tests for a mobile login screen. It uses a sample login app with realistic rules (error messages, attempts-left warning, account lockout, password reset, offline handling) and **Playwright** tests running in an iPhone 13 mobile-Safari profile.

The tests were drafted with AI assistance and then reviewed, corrected and extended by me. The goal is to practise an "AI writes, engineer reviews and approves" workflow on a safe, non-work codebase.

## What is tested

The full list is in [`login-test-cases.md`](login-test-cases.md): 29 cases with steps, expected results and status, grouped as core login, lockout, empty input, input limits, behavior (offline, double-tap, keyboard), session handling and visual checks.

Automated so far (11 tests):

| Test case | What it checks |
|-----------|----------------|
| LG-01 | Valid login lands on the home page |
| LG-03 | Wrong password shows a generic error (no hint about which field was wrong) |
| LG-05 / LG-06 | Account locks after 5 failed attempts and stays locked even with the correct password |
| LG-07 | The "reset your password" link in the lockout message works and unlocks the account |
| LG-08 | Empty fields show "Email is required" and "Password is required" |
| LG-16 | Double-tapping Log in sends only one request |
| LG-17 / LG-18 | Offline login shows a message and Retry succeeds after reconnecting |
| LG-20 | Forgot password opens the reset screen and back returns to login |
| LG-26 | Each failed attempt shows how many attempts are left |
| LG-27 | Show/Hide password toggle reveals and masks the typed password |
| LG-29 | Brand logo is shown on the login screen |

## Sample app rules

- Wrong credentials: "Incorrect email or password. N attempts left." (generic on purpose, for security)
- 5 failed attempts lock the account for 15 minutes; the lockout message links to password reset
- Format errors appear after leaving the field, not on every keystroke
- Email up to 254 characters, trimmed; password 8-64 characters, spaces kept
- Eye icon on the password field shows or hides what was typed
- No network: message with a Retry button, email stays filled

Test account: `user@example.com` / `CorrectPass123`

## Project structure

```
sample-app/server.js            Sample login app (Node, no dependencies)
tests/login.playwright.spec.js  Playwright tests
playwright.config.js            Config: iPhone 13 profile, starts the sample app
login-test-cases.md             Test case list with expected results
```

## Run it

```
npm install
npx playwright install webkit
npx playwright test
```

To watch the tests run with a timeline and screenshots of each step:

```
npx playwright test --ui
```

To explore the app by hand, run `node sample-app/server.js` and open `http://localhost:3100/login` in Safari on the Xcode iOS Simulator.

## Changes driven by testing

- **Attempts-left warning:** added after the first version of the tests. It broke the original wrong-password test, which expected the exact old message. The fix followed the usual order: update the requirement and test case list, update the test, then change the app.
- **Found while exploring on the iOS Simulator:** the Forgot password link looked like plain text, users could not check what they typed, the "reset your password" text in the lockout message was not a link, and the screen looked bare. Each became a requirement and a test case (LG-07, LG-27, LG-28, LG-29).
- **Locator lesson:** adding the "Show password" button made the old `getByLabel('Password')` match two elements and fail. The tests now use exact label matching.

## Roadmap

- Appium tests for the native iOS and Android versions, run on the Xcode iOS Simulator and Android Studio emulator
- More cases from the list: password length limits, special characters, keyboard behavior
- CI run on every push
