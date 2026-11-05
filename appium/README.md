# Appium + WebdriverIO tests (iOS Simulator)

Runs the login tests in Safari on an iOS Simulator. You watch the phone while the
script taps and types. Nothing is clicked by hand.

## Structure

```
appium/
  wdio.conf.js                 device, Appium, and sample app startup
  test/
    specs/login.spec.js        WHAT is tested (11 tests, IDs match login-test-cases.md)
    pageobjects/               HOW to do it (BasePage, LoginPage, ForgotPasswordPage, HomePage)
    locators/                  WHERE things are (one file per screen)
    data/users.json            emails, passwords, expected messages
    data/testData.js           loads the JSON for the specs
```

## Run it

From the project root, in Terminal:

```
cd appium
npm install
npm run setup:driver      # one time: installs the iOS driver
npm test
```

The Simulator opens by itself. The first run builds a helper app (WebDriverAgent)
and can take a few minutes. After that it is much faster.

## Watch it in slow motion

The script pauses before every tap, keystroke and page load so you can follow it.

```
SLOW_MS=3000 npm test    # slower
SLOW_MS=0 npm test       # full speed
```

## Pick a different device

```
xcrun simctl list devices available
DEVICE_NAME="iPhone 17" PLATFORM_VERSION="27.0" npm test
```

## Adding a test

1. New element? Add its selector in `test/locators/`.
2. New step? Add a method in the page object.
3. New email, password or message? Add it to `test/data/users.json`.
4. Write the test in `test/specs/` using only page object methods.

## Notes

- The sample app starts automatically. If it is already running, it is reused.
- Each test starts with cleared cookies because lockout is tracked per session.
- Native apps: change locators to accessibility IDs such as `~login-button`.
