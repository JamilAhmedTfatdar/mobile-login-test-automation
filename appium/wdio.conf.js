// WebdriverIO + Appium config: runs the tests in Safari on the iOS Simulator.
//
// Everything starts by itself when you run `npm test`:
//   - the sample login app (../sample-app/server.js), if it is not already running
//   - the Appium server (started by the appium service below)
//   - the iOS Simulator (Appium boots the device named below)
//
// Change the device without editing this file:
//   DEVICE_NAME="iPhone 17" PLATFORM_VERSION="27.0" npm test
// List the devices you have with:  xcrun simctl list devices available

import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
const APPIUM_PORT = Number(process.env.APPIUM_PORT || 4723);
const SLOW_MS = Number(process.env.SLOW_MS ?? 1500);

let sampleApp; // child process, only set when this run started the app

function isUp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

export const config = {
  runner: 'local',
  specs: ['./test/specs/**/*.spec.js'],
  maxInstances: 1,

  // One real Safari on one iOS Simulator device.
  capabilities: [
    {
      platformName: 'iOS',
      browserName: 'Safari',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': process.env.DEVICE_NAME || 'iPhone 17',
      'appium:platformVersion': process.env.PLATFORM_VERSION || '27.0',
      'appium:newCommandTimeout': 240,
      // The first run builds a helper app (WebDriverAgent) and can take a few minutes.
      'appium:wdaLaunchTimeout': 300000,
      'appium:wdaConnectionTimeout': 300000,
    },
  ],

  hostname: '127.0.0.1',
  port: APPIUM_PORT,
  path: '/',
  services: [['appium', { args: { address: '127.0.0.1', port: APPIUM_PORT } }]],

  baseUrl: BASE_URL,
  logLevel: 'warn',
  waitforTimeout: 10000,
  connectionRetryTimeout: 300000,
  connectionRetryCount: 1,

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { ui: 'bdd', timeout: 300000 },

  // Start the sample app unless it is already running.
  onPrepare: async () => {
    if (await isUp(`${BASE_URL}/login`)) return;
    sampleApp = spawn('node', [path.join(here, '..', 'sample-app', 'server.js')], { stdio: 'ignore' });
    for (let i = 0; i < 40; i++) {
      if (await isUp(`${BASE_URL}/login`)) return;
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error('The sample app did not start. Try: node ../sample-app/server.js');
  },

  // Slow motion so you can watch the phone. Pause before every tap, typing and page load.
  // Change the speed:  SLOW_MS=2000 npm test   (turn off:  SLOW_MS=0 npm test)
  beforeCommand: async (commandName) => {
    if (SLOW_MS > 0 && ['click', 'setValue', 'url'].includes(commandName)) {
      await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
    }
  },

  onComplete: () => {
    if (sampleApp) sampleApp.kill();
  },
};
