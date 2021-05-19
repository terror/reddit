const { chromium } = require('playwright-chromium');
const Url = require('../../src/helpers/Url');
const Category = require('../../src/models/Category');
const {
	generateUser,
	generateUserData,
	generateCategory,
	generateCategoryData,
	generateRandomId,
	truncateDatabase,
	logIn,
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

test('Category created successfully.', async () => {
	const { title, description } = await generateCategoryData();

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.waitForSelector('form#new-category-form');
	await page.fill('form#new-category-form input[name="title"]', title);
	await page.fill('form#new-category-form input[name="description"]', description);
	await page.click('form#new-category-form button');
	await page.waitForSelector('table#categories');

	const category = await Category.findByTitle(title);
	const categoryRowElement = await page.$(`table#categories tr[category-id="${category.getId()}"]`);

	expect(await categoryRowElement.innerText()).toMatch(category.getTitle());
	expect(await categoryRowElement.innerText()).toMatch(category.getCreatedAt().toString());
	expect(await categoryRowElement.innerText()).toMatch(category.getUser().getUsername());
	expect(await categoryRowElement.innerText()).toMatch('No');
});

test('Many categories created successfully.', async () => {
	await logIn(email, password, page);

	for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
		const { title, description } = await generateCategoryData();

		await page.goto(Url.base());
		await page.waitForSelector('form#new-category-form');
		await page.fill('form#new-category-form input[name="title"]', title);
		await page.fill('form#new-category-form input[name="description"]', description);
		await page.click('form#new-category-form button');
		await page.waitForSelector('table#categories');

		const category = await Category.findByTitle(title);
		const categoryRowElement = await page.$(`table#categories tr[category-id="${category.getId()}"]`);

		expect(await categoryRowElement.innerText()).toMatch(category.getTitle());
		expect(await categoryRowElement.innerText()).toMatch(category.getCreatedAt().toString());
		expect(await categoryRowElement.innerText()).toMatch(category.getUser().getUsername());
		expect(await categoryRowElement.innerText()).toMatch('No');
	}
});

test('Unauthenticated user should have no create interface.', async () => {
	await page.goto(Url.base());

	const newCategoryFormElement = await page.$('form#new-category-form');

	expect(newCategoryFormElement).toBeNull();
});

test('Category not created with blank title.', async () => {
	const { description } = await generateCategoryData();

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.waitForSelector('form#new-category-form');
	await page.fill('form#new-category-form input[name="description"]', description);
	await page.click('form#new-category-form button');
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch('Cannot create Category: Missing title.');
});

test('Category not created with blank description.', async () => {
	const { title } = await generateCategoryData();

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.waitForSelector('form#new-category-form');
	await page.fill('form#new-category-form input[name="title"]', title);
	await page.click('form#new-category-form button');
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch('Cannot create Category: Missing description.');
});

test('Category found by ID.', async () => {
	const category = await generateCategory();

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector('#category-title');

	const titleElement = await page.$('#category-title');
	const descriptionElement = await page.$('#category-description');

	expect(await titleElement.innerText()).toBe(category.getTitle());
	expect(await descriptionElement.innerText()).toBe(category.getDescription());
});

test('Category not found by wrong ID.', async () => {
	const randomCategoryId = await generateRandomId();

	await page.goto(Url.path('category/{id}', randomCategoryId));
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch(`Cannot retrieve Category: Category does not exist with ID ${randomCategoryId}.`);
});

test('Category updated successfully.', async () => {
	const category = await generateCategory(user);
	const { title, description } = await generateCategoryData();

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('category/{id}/edit', category.getId())}"]`);
	await page.click(`a[href="${Url.path('category/{id}/edit', category.getId())}"]`);
	await page.waitForSelector('form#edit-category-form');
	await page.fill('form#edit-category-form input[name="title"]', title);
	await page.fill('form#edit-category-form input[name="description"]', description);
	await page.click('form#edit-category-form button');
	await page.waitForSelector('#category-title');

	expect(await page.title()).toBe(title);
	expect(await page.url()).toBe(Url.path(`category/${category.getId()}`));

	const titleElement = await page.$('#category-title');
	const descriptionElement = await page.$('#category-description');

	expect(await titleElement.innerText()).toBe(title);
	expect(await descriptionElement.innerText()).toBe(description);
});

test('Category not updated with empty form.', async () => {
	const category = await generateCategory(user);

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('category/{id}/edit', category.getId())}"]`);
	await page.click(`a[href="${Url.path('category/{id}/edit', category.getId())}"]`);
	await page.waitForSelector('form#edit-category-form button');
	await page.click('form#edit-category-form button');
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch('Cannot update Category: No update parameters were provided.');
});

test('Unauthenticated user should have no update interface.', async () => {
	const category = await generateCategory();

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector('#category-title');

	const titleElement = await page.$('#category-title');
	const descriptionElement = await page.$('#category-description');
	const editCategoryLink = await page.$(`a[href="${Url.path('category/{id}/edit', category.getId())}"]`);

	expect(await titleElement.innerText()).toBe(category.getTitle());
	expect(await descriptionElement.innerText()).toBe(category.getDescription());
	expect(editCategoryLink).toBeNull();
});

test('Category deleted successfully.', async () => {
	const category = await generateCategory(user);

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector('form#delete-category-form button');
	await page.click('form#delete-category-form button');
	await page.waitForSelector('table#categories');

	const categoryRowElement = await page.$(`table#categories tr[category-id="${category.getId()}"]`);

	expect(await categoryRowElement.innerText()).toMatch(category.getTitle());
	expect(await categoryRowElement.innerText()).toMatch(category.getUser().getUsername());
	expect(await categoryRowElement.innerText()).toMatch('Yes');
});

test('Unauthenticated user should have no delete interface.', async () => {
	const category = await generateCategory();

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector('#category-title');

	const titleElement = await page.$('#category-title');
	const descriptionElement = await page.$('#category-description');
	const deleteCategoryFormElement = await page.$('form#delete-category-form');

	expect(await titleElement.innerText()).toBe(category.getTitle());
	expect(await descriptionElement.innerText()).toBe(category.getDescription());
	expect(deleteCategoryFormElement).toBeNull();
});

test('Deleted category should be read-only.', async () => {
	const category = await generateCategory(user);

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector('form#delete-category-form button');
	await page.click('form#delete-category-form button');

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector('#category-title');

	expect(await page.$('form#edit-category-form')).toBeNull();
	expect(await page.$('form#delete-category-form')).toBeNull();
	expect(await page.$('form#new-post-form')).toBeNull();
});
