const TestHelper = require('../TestHelper');
const Url = require('../../src/helpers/Url');

class BrowserTestHelper extends TestHelper {
	static async logIn(email, password, page) {
		await page.goto(Url.base());
		await page.click(`a[href="${Url.path('auth/login')}"]`);
		await page.waitForSelector('form#login-form');

		await page.fill('form#login-form input[name="email"]', email);
		await page.fill('form#login-form input[name="password"]', password);
		await page.click('form#login-form button');
		await page.waitForSelector('h1');
	}

	static async logOut(page) {
		await page.goto(Url.base());
		await page.click(`a[href="${Url.path('auth/logout')}"]`);
		await page.waitForSelector('h1');
	}
}

module.exports = BrowserTestHelper;
