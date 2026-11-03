// Shared behavior for every page object.

export default class BasePage {
  constructor(path) {
    this.path = path;
  }

  async open() {
    await browser.url(this.path);
  }

  // Open the page with a clean session. Safari keeps cookies between tests, and the
  // sample app tracks failed logins per session, so without this a lockout in one
  // test would leak into the next.
  async openFresh() {
    await browser.url(this.path);
    await browser.deleteAllCookies();
    await browser.url(this.path);
  }

  async waitForUrlToContain(fragment, timeout = 10000) {
    await browser.waitUntil(async () => (await browser.getUrl()).includes(fragment), {
      timeout,
      timeoutMsg: `URL never contained "${fragment}"`,
    });
  }
}
