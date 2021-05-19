const { chromium } = require('playwright-chromium');
const Url = require('../../src/helpers/Url');
const Post = require('../../src/models/Post');
const {
	generateUser,
	generateUserData,
	generatePost,
	generatePostData,
	generateCategory,
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
let category;

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
	category = await generateCategory(user);
	page = await browser.newPage();
});

afterEach(async () => {
	await page.close();
	await truncateDatabase();
});

test('Post created successfully.', async () => {
	const postData = await generatePostData();

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', postData.categoryId)}"]`);
	await page.waitForSelector('form#new-post-form');
	await page.fill('form#new-post-form input[name="title"]', postData.title);
	await page.selectOption('form#new-post-form select', postData.type);
	await page.fill('form#new-post-form textarea[name="content"]', postData.content);
	await page.click('form#new-post-form button');
	await page.waitForSelector('table#posts');

	expect(await page.url()).toBe(Url.path('category/{id}', postData.categoryId));

	const post = (await Post.findByCategory(postData.categoryId))[0];
	const postRowElement = await page.$(`table#posts tr[post-id="${post.getId()}"]`);
	const postRowElementText = await postRowElement.innerText();

	expect(postRowElementText).toMatch(post.getTitle());
	expect(postRowElementText).toMatch(post.getCreatedAt().toString());
	expect(postRowElementText).toMatch(post.getUser().getUsername());
	expect(postRowElementText).toMatch('No');
});

test('Many posts created successfully.', async () => {
	await logIn(email, password, page);

	const posts = [];

	for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
		const postData = await generatePostData();

		await page.goto(Url.base());
		await page.click(`a[href="${Url.path('category/{id}', postData.categoryId)}"]`);
		await page.waitForSelector('form#new-post-form');
		await page.fill('form#new-post-form input[name="title"]', postData.title);
		await page.selectOption('form#new-post-form select', postData.type);
		await page.fill('form#new-post-form textarea[name="content"]', postData.content);
		await page.click('form#new-post-form button');
		await page.waitForSelector('table#posts');

		expect(await page.url()).toBe(Url.path('category/{id}', postData.categoryId));

		const post = (await Post.findByCategory(postData.categoryId))[0];
		const postRowElement = await page.$(`table#posts tr[post-id="${post.getId()}"]`);
		const postRowElementText = await postRowElement.innerText();

		expect(postRowElementText).toMatch(post.getTitle());
		expect(postRowElementText).toMatch(post.getCreatedAt().toString());
		expect(postRowElementText).toMatch(post.getUser().getUsername());
		expect(postRowElementText).toMatch('No');

		posts.push(post);
	}

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-posts-button');
	await page.waitForSelector('table#user-posts tbody');

	const postBookmarksTableRows = await page.$$('table#user-posts tbody tr');

	for (let i = 0; i < posts.length; i++) {
		const postBookmarksTableRowText = await postBookmarksTableRows[i].innerText();

		expect(postBookmarksTableRowText).toMatch(posts[i].getTitle());
		expect(postBookmarksTableRowText).toMatch(posts[i].getCreatedAt().toString());
	}
});

test.each`
	title             | type      | content       | message
	${''}             | ${'Text'} | ${'Magikarp'} | ${'Missing title.'}
	${'Best Pokemon'} | ${''}     | ${'Rattata'}  | ${'Missing type.'}
	${'Best Pokemon'} | ${'Text'} | ${''}         | ${'Missing content.'}
`('Post not created with $message.', async ({
	title, type, content, message,
}) => {
	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector('form#new-post-form');
	await page.fill('form#new-post-form input[name="title"]', title);
	await page.selectOption('form#new-post-form select', type);
	await page.fill('form#new-post-form textarea[name="content"]', content);
	await page.click('form#new-post-form button');
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch(`Cannot create Post: ${message}`);
});

test('Unauthenticated user should have no create interface.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', category.getId())}"]`);
	await page.waitForSelector('#category-title');

	const newPostFormElement = await page.$('form#new-post-form');

	expect(newPostFormElement).toBeNull();
});

test('Post found by ID.', async () => {
	const post = await generatePost();

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector('#post-title');

	const titleElement = await page.$('#post-title');
	const contentElement = await page.$('#post-content');

	expect(await titleElement.innerText()).toBe(post.getTitle());
	expect(await contentElement.innerText()).toBe(post.getContent());
});

test('Post not found by wrong ID.', async () => {
	const randomPostId = await generateRandomId();

	await page.goto(Url.path('post/{id}', randomPostId));
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch(`Cannot retrieve Post: Post does not exist with ID ${randomPostId}.`);
});

test('Post updated successfully.', async () => {
	const post = await generatePost({ user, type: 'Text' });
	const { content } = await generatePostData('Text');

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}/edit', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}/edit', post.getId())}"]`);
	await page.waitForSelector('form#edit-post-form textarea[name="content"]');

	let contentElement = await page.$('form#edit-post-form textarea[name="content"]');
	const contentElementValue = await page.$eval('form#edit-post-form textarea[name="content"]', (el) => el.value);

	expect(contentElementValue).toBe(post.getContent());

	await contentElement.selectText();
	await page.keyboard.press('Backspace');
	await page.fill('form#edit-post-form textarea[name="content"]', content);
	await page.click('form#edit-post-form button');
	await page.waitForSelector('#post-title');

	const titleElement = await page.$('#post-title');
	contentElement = await page.$('#post-content');

	expect(await titleElement.innerText()).toBe(post.getTitle());
	expect(await contentElement.innerText()).toBe(content);
});

test('Post not updated with empty form.', async () => {
	const post = await generatePost({ user, type: 'Text' });

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}/edit', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}/edit', post.getId())}"]`);
	await page.waitForSelector('form#edit-post-form textarea[name="content"]');

	const contentElement = await page.$('form#edit-post-form textarea[name="content"]');
	const contentElementValue = await page.$eval('form#edit-post-form textarea[name="content"]', (el) => el.value);

	expect(contentElementValue).toBe(post.getContent());

	await contentElement.selectText();
	await page.keyboard.press('Backspace');
	await page.click('form#edit-post-form button');
	await page.waitForSelector('h1');

	const h1 = await page.$('h1');
	const body = await page.$('body');

	expect(await h1.innerText()).toMatch('Error');
	expect(await body.innerText()).toMatch('Cannot update Post: No update parameters were provided.');
});

test('URL post should have no update interface.', async () => {
	const post = await generatePost({ user, type: 'URL' });

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector('#post-title');

	expect(await page.$(`a[href="${Url.path('post/{id}/edit', post.getId())}"]`)).toBeNull();
});

test('Unauthenticated user should have no update interface.', async () => {
	const post = await generatePost();

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector('#post-title');

	const titleElement = await page.$('#post-title');
	const contentElement = await page.$('#post-content');
	const editPostLink = await page.$(`a[href="${Url.path('post/{id}/edit', post.getId())}"]`);

	expect(await titleElement.innerText()).toBe(post.getTitle());
	expect(await contentElement.innerText()).toBe(post.getContent());
	expect(editPostLink).toBeNull();
});

test('Post deleted successfully.', async () => {
	const post = await generatePost({ user });

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector('form#delete-post-form button');
	await page.click('form#delete-post-form button');

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector('table#posts');

	const postRowElement = await page.$(`table#posts tr[post-id="${post.getId()}"]`);

	expect(await postRowElement.innerText()).toMatch(post.getTitle());
	expect(await postRowElement.innerText()).toMatch(post.getUser().getUsername());
	expect(await postRowElement.innerText()).toMatch('Yes');
});

test('Unauthenticated user should have no delete interface.', async () => {
	const post = await generatePost();

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector('#post-title');

	const titleElement = await page.$('#post-title');
	const contentElement = await page.$('#post-content');
	const deleteCategoryFormElement = await page.$('form#delete-post-form');

	expect(await titleElement.innerText()).toBe(post.getTitle());
	expect(await contentElement.innerText()).toBe(post.getContent());
	expect(deleteCategoryFormElement).toBeNull();
});

test('Deleted post should be read-only.', async () => {
	const post = await generatePost({ user });

	await logIn(email, password, page);

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector('form#delete-post-form button');
	await page.click('form#delete-post-form button');

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector('#post-title');

	expect(await page.$('form#edit-post-form')).toBeNull();
	expect(await page.$('form#delete-post-form')).toBeNull();
	expect(await page.$('form#new-comment-form')).toBeNull();
});
