const { chromium } = require('playwright-chromium');
const Url = require('../../src/helpers/Url');
const Post = require('../../src/models/Post');
const Comment = require('../../src/models/Comment');
const {
	generateUser,
	generateUserData,
	generatePost,
	generateComment,
	truncateDatabase,
	logIn,
	logOut,
} = require('./BrowserTestHelper');

let browser;
let page;
let username;
let email;
let password;
let user;
let post;
let comment;

beforeAll(async () => {
	browser = await chromium.launch({
		headless: false,
		// slowMo: 500,
	});
});

afterAll(async () => {
	await browser.close();
	await truncateDatabase();
});

beforeEach(async () => {
	({ username, email, password } = generateUserData());
	user = await generateUser(username, email, password);
	post = await generatePost();
	comment = await generateComment();
	page = await browser.newPage();
});

afterEach(async () => {
	await page.close();
	await truncateDatabase();
});

test('Post bookmarked successfully.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector('#post-bookmark-button');

	const bookmarkButton = await page.$('#post-bookmark-button');

	expect(await bookmarkButton.innerText()).toMatch('Bookmark Post');

	await bookmarkButton.click();

	/**
	 * Clicking on the bookmark button should trigger a JS fetch request.
	 * Playwright by default waits a small amount of time for a page "refresh"
	 * when clicking on a link or submitting a form. Since we're doing neither
	 * in this scenario, we have to manually tell Playwright to wait until the
	 * element (in this case, the element that contains the bookmark button text) changes.
	 */
	await page.waitForSelector('#post-bookmark-button:text-matches("Unbookmark Post")');

	expect(await bookmarkButton.innerText()).toMatch('Unbookmark Post');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-post-bookmarks-button');
	await page.waitForSelector('table#user-post-bookmarks');

	const postBookmarksTableRows = await page.$$('table#user-post-bookmarks tbody tr');
	const postBookmarksTableRowText = await postBookmarksTableRows[0].innerText();
	const retrievedPost = await Post.findById(post.getId());

	expect(postBookmarksTableRowText).toMatch(retrievedPost.getTitle());
	expect(postBookmarksTableRowText).toMatch(retrievedPost.getCreatedAt().toString());
	expect(postBookmarksTableRowText).toMatch(retrievedPost.getUser().getUsername());
});

test('Post unbookmarked successfully.', async () => {
	await post.bookmark(user.getId());

	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector('#post-bookmark-button');

	const bookmarkButton = await page.$('#post-bookmark-button');

	expect(await bookmarkButton.innerText()).toMatch('Unbookmark Post');

	await bookmarkButton.click();
	await page.waitForSelector('#post-bookmark-button:text-matches("Bookmark Post")');

	expect(await bookmarkButton.innerText()).toMatch('Bookmark Post');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-post-bookmarks-button');
	await page.waitForSelector('table#user-post-bookmarks');

	const postBookmarksTableRows = await page.$$('table#user-post-bookmarks tbody tr');

	expect(postBookmarksTableRows.length).toBe(0);
});

test('Post bookmark interface not visible when not logged in.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);

	const bookmarkButton = await page.$('#post-bookmark-button');

	expect(bookmarkButton).toBeNull();
});

test('Post bookmarked by multiple users.', async () => {
	const numberOfUsers = Math.floor(Math.random() * 5) + 2;
	const users = [];
	const postIsBookmarked = [];

	for (let i = 0; i < numberOfUsers; i++) {
		const { username, email, password } = generateUserData();
		await generateUser(username, email, password);

		users.push({ email, password });
		postIsBookmarked[i] = false;

		await logIn(email, password, page);
		await page.goto(Url.base());
		await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
		await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
		await page.waitForSelector('#post-bookmark-button');

		const bookmarkButton = await page.$('#post-bookmark-button');

		expect(await bookmarkButton.innerText()).toMatch('Bookmark Post');

		if (Math.random() < 0.5) {
			await bookmarkButton.click();
			await page.waitForSelector('#post-bookmark-button:text-matches("Unbookmark Post")');
			postIsBookmarked[i] = true;

			if (Math.random() < 0.25) {
				await bookmarkButton.click();
				await page.waitForSelector('#post-bookmark-button:text-matches("Bookmark Post")');
				postIsBookmarked[i] = false;
			}
		}

		await logOut(page);
	}

	for (let i = 0; i < numberOfUsers; i++) {
		await logIn(users[i].email, users[i].password, page);
		await page.waitForSelector('#show-user-post-bookmarks-button');
		await page.click('#show-user-post-bookmarks-button');
		await page.waitForSelector('table#user-post-bookmarks');

		const postBookmarksTableRows = await page.$$('table#user-post-bookmarks tbody tr');

		if (postIsBookmarked[i]) {
			const postBookmarksTableRowText = await postBookmarksTableRows[0].innerText();
			const retrievedPost = await Post.findById(post.getId());

			expect(postBookmarksTableRowText).toMatch(retrievedPost.getTitle());
			expect(postBookmarksTableRowText).toMatch(retrievedPost.getCreatedAt().toString());
			expect(postBookmarksTableRowText).toMatch(retrievedPost.getUser().getUsername());
		}
		else {
			expect(postBookmarksTableRows.length).toBe(0);
		}

		await logOut(page);
	}
});

test('Comment bookmarked successfully.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.waitForSelector(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button`);

	const bookmarkButton = await page.$(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button`);

	expect(await bookmarkButton.innerText()).toMatch('Bookmark Comment');

	await bookmarkButton.click();
	await page.waitForSelector(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button:text-matches("Unbookmark Comment")`);

	expect(await bookmarkButton.innerText()).toMatch('Unbookmark Comment');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-comment-bookmarks-button');
	await page.waitForSelector('table#user-comment-bookmarks');

	const commentBookmarksTableRows = await page.$$('table#user-comment-bookmarks tbody tr');
	const commentBookmarksTableRowText = await commentBookmarksTableRows[0].innerText();
	const retrievedComment = await Comment.findById(comment.getId());

	expect(commentBookmarksTableRowText).toMatch(retrievedComment.getContent());
	expect(commentBookmarksTableRowText).toMatch(retrievedComment.getPost().getTitle());
	expect(commentBookmarksTableRowText).toMatch(retrievedComment.getCreatedAt().toString());
	expect(commentBookmarksTableRowText).toMatch(retrievedComment.getUser().getUsername());
});

test('Comment unbookmarked successfully.', async () => {
	await comment.bookmark(user.getId());

	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.waitForSelector(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button`);

	const bookmarkButton = await page.$(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button`);

	expect(await bookmarkButton.innerText()).toMatch('Unbookmark Comment');

	await bookmarkButton.click();
	await page.waitForSelector(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button:text-matches("Bookmark Comment")`);

	expect(await bookmarkButton.innerText()).toMatch('Bookmark Comment');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-comment-bookmarks-button');
	await page.waitForSelector('table#user-comment-bookmarks');

	const commentBookmarksTableRows = await page.$$('table#user-comment-bookmarks tbody tr');

	expect(commentBookmarksTableRows.length).toBe(0);
});

test('Comment bookmark interface not visible when not logged in.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);

	const bookmarkButton = await page.$(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button`);

	expect(bookmarkButton).toBeNull();
});

test('Comment bookmarked by multiple users.', async () => {
	const numberOfUsers = Math.floor(Math.random() * 5) + 2;
	const users = [];
	const commentIsBookmarked = [];

	for (let i = 0; i < numberOfUsers; i++) {
		const { username, email, password } = generateUserData();
		await generateUser(username, email, password);

		users.push({ email, password });
		commentIsBookmarked[i] = false;

		await logIn(email, password, page);
		await page.goto(Url.base());
		await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
		await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
		await page.waitForSelector(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button`);

		const bookmarkButton = await page.$(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button`);

		expect(await bookmarkButton.innerText()).toMatch('Bookmark Comment');

		if (Math.random() < 0.5) {
			await bookmarkButton.click();
			await page.waitForSelector(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button:text-matches("Unbookmark Comment")`);
			commentIsBookmarked[i] = true;

			if (Math.random() < 0.25) {
				await bookmarkButton.click();
				await page.waitForSelector(`.comment[comment-id="${comment.getId()}"] .comment-bookmark-button:text-matches("Bookmark Comment")`);
				commentIsBookmarked[i] = false;
			}
		}

		await logOut(page);
	}

	for (let i = 0; i < numberOfUsers; i++) {
		await logIn(users[i].email, users[i].password, page);
		await page.waitForSelector('#show-user-comment-bookmarks-button');
		await page.click('#show-user-comment-bookmarks-button');
		await page.waitForSelector('table#user-comment-bookmarks');

		const commentBookmarksTableRows = await page.$$('table#user-comment-bookmarks tbody tr');

		if (commentIsBookmarked[i]) {
			const commentBookmarksTableRowText = await commentBookmarksTableRows[0].innerText();
			const retrievedComment = await Comment.findById(comment.getId());

			expect(commentBookmarksTableRowText).toMatch(retrievedComment.getContent());
			expect(commentBookmarksTableRowText).toMatch(retrievedComment.getPost().getTitle());
			expect(commentBookmarksTableRowText).toMatch(retrievedComment.getCreatedAt().toString());
			expect(commentBookmarksTableRowText).toMatch(retrievedComment.getUser().getUsername());
		}
		else {
			expect(commentBookmarksTableRows.length).toBe(0);
		}

		await logOut(page);
	}
});
