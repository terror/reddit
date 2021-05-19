const { chromium } = require('playwright-chromium');
const Url = require('../../src/helpers/Url');
const {
	generateUser,
	generateUserData,
	truncateDatabase,
} = require('./BrowserTestHelper');

let browser;
let page;
let username;
let email;
let password;
let user;

beforeAll(async () => {
	browser = await chromium.launch({
		headless: false,
		// slowMo: 500,
	});
});

afterAll(async () => {
	await browser.close();
});

beforeEach(async () => {
	({ username, email, password } = generateUserData());
	user = await generateUser(username, email, password);
	page = await browser.newPage();
});

afterEach(async () => {
	await page.close();
	await truncateDatabase();
});

test('User logged in successfully.', async () => {
	await page.goto(Url.base());

	let loginLink = await page.$(`nav a[href="${Url.path('auth/login')}"]`);
	let registerLink = await page.$(`nav a[href="${Url.path('auth/register')}"]`);
	let logoutLink = await page.$(`nav a[href="${Url.path('auth/logout')}"]`);

	expect(loginLink).not.toBeNull();
	expect(registerLink).not.toBeNull();
	expect(logoutLink).toBeNull();

	await page.click(`a[href="${Url.path('auth/login')}"]`);
	await page.waitForSelector('form#login-form');

	await page.fill('form#login-form input[name="email"]', email);
	await page.fill('form#login-form input[name="password"]', password);
	await page.click('form#login-form button');
	await page.waitForSelector('#username');

	const usernameElement = await page.$('#username');
	const emailElement = await page.$('#email');

	expect(await usernameElement.innerText()).toBe(user.getUsername());
	expect(await emailElement.innerText()).toBe(user.getEmail());

	loginLink = await page.$(`nav a[href="${Url.path('auth/login')}"]`);
	registerLink = await page.$(`nav a[href="${Url.path('auth/register')}"]`);
	logoutLink = await page.$(`nav a[href="${Url.path('auth/logout')}"]`);

	expect(loginLink).toBeNull();
	expect(registerLink).toBeNull();
	expect(logoutLink).not.toBeNull();
});

test('User not logged in with blank email.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('auth/login')}"]`);
	await page.waitForSelector('form#login-form');
	await page.fill('form#login-form input[name="password"]', password);
	await page.click('form#login-form button');
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch('Cannot log in: Missing email.');
});

test('User not logged in with blank password.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('auth/login')}"]`);
	await page.waitForSelector('form#login-form');
	await page.fill('form#login-form input[name="email"]', email);
	await page.click('form#login-form button');
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch('Cannot log in: Missing password.');
});

test('User not logged in with wrong email.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('auth/login')}"]`);
	await page.waitForSelector('form#login-form');
	await page.fill('form#login-form input[name="email"]', `${email}.com`);
	await page.fill('form#login-form input[name="password"]', password);
	await page.click('form#login-form button');
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch('Cannot log in: Invalid credentials.');
});

test('User not logged in with wrong password.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('auth/login')}"]`);
	await page.waitForSelector('form#login-form');
	await page.fill('form#login-form input[name="email"]', email);
	await page.fill('form#login-form input[name="password"]', `${password}123`);
	await page.click('form#login-form button');
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch('Cannot log in: Invalid credentials.');
});

test('User logged out successfully.', async () => {
	await page.goto(Url.base());

	let loginLink = await page.$(`nav a[href="${Url.path('auth/login')}"]`);
	let registerLink = await page.$(`nav a[href="${Url.path('auth/register')}"]`);
	let logoutLink = await page.$(`nav a[href="${Url.path('auth/logout')}"]`);

	expect(loginLink).not.toBeNull();
	expect(registerLink).not.toBeNull();
	expect(logoutLink).toBeNull();

	await page.click(`a[href="${Url.path('auth/login')}"]`);
	await page.waitForSelector('form#login-form');
	await page.fill('form#login-form input[name="email"]', email);
	await page.fill('form#login-form input[name="password"]', password);
	await page.click('form#login-form button');
	await page.waitForSelector('#username');

	const usernameElement = await page.$('#username');
	const emailElement = await page.$('#email');

	expect(await usernameElement.innerText()).toBe(user.getUsername());
	expect(await emailElement.innerText()).toBe(user.getEmail());

	loginLink = await page.$(`nav a[href="${Url.path('auth/login')}"]`);
	registerLink = await page.$(`nav a[href="${Url.path('auth/register')}"]`);
	logoutLink = await page.$(`nav a[href="${Url.path('auth/logout')}"]`);

	expect(loginLink).toBeNull();
	expect(registerLink).toBeNull();
	expect(logoutLink).not.toBeNull();

	await page.click(`a[href="${Url.path('auth/logout')}"]`);
	await page.waitForSelector('nav');

	loginLink = await page.$(`nav a[href="${Url.path('auth/login')}"]`);
	registerLink = await page.$(`nav a[href="${Url.path('auth/register')}"]`);
	logoutLink = await page.$(`nav a[href="${Url.path('auth/logout')}"]`);

	expect(loginLink).not.toBeNull();
	expect(registerLink).not.toBeNull();
	expect(logoutLink).toBeNull();
});

/**
 * This one is a little sneaky. It's the same concept as the language setting from
 * E4.1, only this time with a checkbox instead of a select menu. To figure this one
 * out, you'll have to really understand how the framework is handling cookies. Dig
 * around to see how cookies are being received from the request and also how they are
 * being set in the response.
 */
test('Username remembered successfully.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('auth/login')}"]`);
	await page.waitForSelector('form#login-form');

	let emailElementValue = await page.$eval('form#login-form input[name="email"]', (element) => element.value);

	expect(emailElementValue).toMatch('');

	await page.fill('form#login-form input[name="email"]', email);
	await page.fill('form#login-form input[name="password"]', password);
	await page.check('form#login-form input[name="remember"][type="checkbox"]');
	await page.click('form#login-form button');
	await page.waitForSelector('nav');

	await page.click(`a[href="${Url.path('auth/logout')}"]`);
	await page.waitForSelector('nav');

	await page.click(`a[href="${Url.path('auth/login')}"]`);
	await page.waitForSelector('nav');

	emailElementValue = await page.$eval('form#login-form input[name="email"]', (element) => element.value);

	expect(emailElementValue).toMatch(email); // Textbox should have the email pre-populated.
	expect(await page.isChecked('form#login-form input[name="remember"][type="checkbox"]')).toBeTruthy(); // The checkbox should already be checked.
});
