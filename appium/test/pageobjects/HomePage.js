import BasePage from './BasePage.js';
import { home as H } from '../locators/home.locators.js';

class HomePage extends BasePage {
  constructor() {
    super('/home');
  }

  get heading() { return $(H.heading); }
  get logOutButton() { return $(H.logOutButton); }

  async tapLogOut() {
    await this.logOutButton.click();
  }

  async waitUntilLoaded() {
    await this.waitForUrlToContain('/home');
  }
}

export default new HomePage();
