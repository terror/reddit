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

test('Post up voted on category page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);

	/**
	 * Clicking on the upvote button should trigger a JS fetch request.
	 * Playwright by default waits a small amount of time for a page "refresh"
	 * when clicking on a link or submitting a form. Since we're doing neither
	 * in this scenario, we have to manually tell Playwright to wait until the
	 * element (in this case, the element that contains the post votes) changes.
	 */
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("1")`);

	expect(await postVotesElement.innerText()).toMatch('1');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-post-votes-button');
	await page.waitForSelector('table#user-post-votes');

	const postVotesTableRows = await page.$$('table#user-post-votes tbody tr');
	const postVotesTableRowText = await postVotesTableRows[0].innerText();
	const retrievedPost = await Post.findById(post.getId());

	expect(postVotesTableRowText).toMatch(retrievedPost.getTitle());
	expect(postVotesTableRowText).toMatch(retrievedPost.getCreatedAt().toString());
});

test('Post up voted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("1")`);

	expect(await postVotesElement.innerText()).toMatch('1');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-post-votes-button');
	await page.waitForSelector('table#user-post-votes');

	const postVotesTableRows = await page.$$('table#user-post-votes tbody tr');
	const postVotesTableRowText = await postVotesTableRows[0].innerText();
	const retrievedPost = await Post.findById(post.getId());

	expect(postVotesTableRowText).toMatch(retrievedPost.getTitle());
	expect(postVotesTableRowText).toMatch(retrievedPost.getCreatedAt().toString());
});

test('Post down voted on category page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("-1")`);

	expect(await postVotesElement.innerText()).toMatch('-1');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-post-votes-button');
	await page.waitForSelector('table#user-post-votes');

	const postVotesTableRows = await page.$$('table#user-post-votes tbody tr');
	const postVotesTableRowText = await postVotesTableRows[0].innerText();
	const retrievedPost = await Post.findById(post.getId());

	expect(postVotesTableRowText).toMatch(retrievedPost.getTitle());
	expect(postVotesTableRowText).toMatch(retrievedPost.getCreatedAt().toString());
});

test('Post down voted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("-1")`);

	expect(await postVotesElement.innerText()).toMatch('-1');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-post-votes-button');
	await page.waitForSelector('table#user-post-votes');

	const postVotesTableRows = await page.$$('table#user-post-votes tbody tr');
	const postVotesTableRowText = await postVotesTableRows[0].innerText();
	const retrievedPost = await Post.findById(post.getId());

	expect(postVotesTableRowText).toMatch(retrievedPost.getTitle());
	expect(postVotesTableRowText).toMatch(retrievedPost.getCreatedAt().toString());
});

test('Post vote interface not visible on category page when not logged in.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);

	const postUpvoteButton = await page.$('.post-upvote-button');
	const postDownvoteButton = await page.$('.post-downvote-button');

	expect(postUpvoteButton).toBeNull();
	expect(postDownvoteButton).toBeNull();
});

test('Post vote interface not visible on post page when not logged in.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);

	const postUpvoteButton = await page.$('.post-upvote-button');
	const postDownvoteButton = await page.$('.post-downvote-button');

	expect(postUpvoteButton).toBeNull();
	expect(postDownvoteButton).toBeNull();
});

test('Post up voted then down voted on category page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("1")`);

	expect(await postVotesElement.innerText()).toMatch('1');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("-1")`);

	expect(await postVotesElement.innerText()).toMatch('-1');
});

test('Post up voted then down voted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("1")`);

	expect(await postVotesElement.innerText()).toMatch('1');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("-1")`);

	expect(await postVotesElement.innerText()).toMatch('-1');
});

test('Post down voted then up voted on category page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("-1")`);

	expect(await postVotesElement.innerText()).toMatch('-1');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("1")`);

	expect(await postVotesElement.innerText()).toMatch('1');
});

test('Post down voted then up voted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("-1")`);

	expect(await postVotesElement.innerText()).toMatch('-1');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("1")`);

	expect(await postVotesElement.innerText()).toMatch('1');
});

test('Post up voted then unvoted on category page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("1")`);

	expect(await postVotesElement.innerText()).toMatch('1');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("0")`);

	expect(await postVotesElement.innerText()).toMatch('0');
});

test('Post up voted then unvoted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("1")`);

	expect(await postVotesElement.innerText()).toMatch('1');

	await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("0")`);

	expect(await postVotesElement.innerText()).toMatch('0');
});

test('Post down voted then unvoted on category page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("-1")`);

	expect(await postVotesElement.innerText()).toMatch('-1');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("0")`);

	expect(await postVotesElement.innerText()).toMatch('0');
});

test('Post down voted then unvoted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	const postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);

	expect(await postVotesElement.innerText()).toMatch('0');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("-1")`);

	expect(await postVotesElement.innerText()).toMatch('-1');

	await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]:text-matches("0")`);

	expect(await postVotesElement.innerText()).toMatch('0');
});

test('Post voted on by multiple users.', async () => {
	const numberOfUsers = Math.floor(Math.random() * 5) + 2;
	let upvotes = 0;
	let downvotes = 0;

	for (let i = 0; i < numberOfUsers; i++) {
		const { username, email, password } = generateUserData();
		await generateUser(username, email, password);

		await logIn(email, password, page);
		await page.goto(Url.base());
		await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);

		if (Math.random() < 0.5) {
			await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
		}

		if (Math.random() < 0.5) {
			await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
			upvotes++;

			if (Math.random() < 0.25) {
				await page.click(`.post-upvote-button[post-id="${post.getId()}"]`);
				upvotes--;
			}
		}
		else {
			await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
			downvotes++;

			if (Math.random() < 0.25) {
				await page.click(`.post-downvote-button[post-id="${post.getId()}"]`);
				downvotes--;
			}
		}

		await logOut(page);
	}

	const totalVotes = upvotes - downvotes;

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', post.getCategory().getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	let postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);
	expect(await postVotesElement.innerText()).toMatch(totalVotes.toString());

	await page.click(`a[href="${Url.path('post/{id}', post.getId())}"]`);
	await page.waitForSelector(`.post-votes[post-id="${post.getId()}"]`);

	postVotesElement = await page.$(`.post-votes[post-id="${post.getId()}"]`);
	expect(await postVotesElement.innerText()).toMatch(totalVotes.toString());
});

test('Comment up voted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);

	/**
	 * Clicking on the upvote button should trigger a JS fetch request.
	 * Playwright by default waits a small amount of time for a page "refresh"
	 * when clicking on a link or submitting a form. Since we're doing neither
	 * in this scenario, we have to manually tell Playwright to wait until the
	 * element (in this case, the element that contains the comment votes) changes.
	 */
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("1")`);

	expect(await commentVotesElement.innerText()).toMatch('1');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-comment-votes-button');
	await page.waitForSelector('table#user-comment-votes');

	const commentVotesTableRows = await page.$$('table#user-comment-votes tbody tr');
	const commentVotesTableRowText = await commentVotesTableRows[0].innerText();
	const retrievedComment = await Comment.findById(comment.getId());

	expect(commentVotesTableRowText).toMatch(retrievedComment.getContent());
	expect(commentVotesTableRowText).toMatch(retrievedComment.getCreatedAt().toString());
});

test('Comment up voted on comment page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.click(`a[href="${Url.path('comment/{id}', comment.getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("1")`);

	expect(await commentVotesElement.innerText()).toMatch('1');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-comment-votes-button');
	await page.waitForSelector('table#user-comment-votes');

	const commentVotesTableRows = await page.$$('table#user-comment-votes tbody tr');
	const commentVotesTableRowText = await commentVotesTableRows[0].innerText();
	const retrievedComment = await Comment.findById(comment.getId());

	expect(commentVotesTableRowText).toMatch(retrievedComment.getContent());
	expect(commentVotesTableRowText).toMatch(retrievedComment.getCreatedAt().toString());
});

test('Comment down voted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("-1")`);

	expect(await commentVotesElement.innerText()).toMatch('-1');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-comment-votes-button');
	await page.waitForSelector('table#user-comment-votes');

	const commentVotesTableRows = await page.$$('table#user-comment-votes tbody tr');
	const commentVotesTableRowText = await commentVotesTableRows[0].innerText();
	const retrievedComment = await Comment.findById(comment.getId());

	expect(commentVotesTableRowText).toMatch(retrievedComment.getContent());
	expect(commentVotesTableRowText).toMatch(retrievedComment.getCreatedAt().toString());
});

test('Comment down voted on comment page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.click(`a[href="${Url.path('comment/{id}', comment.getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("-1")`);

	expect(await commentVotesElement.innerText()).toMatch('-1');

	await page.click(`a[href="${Url.path('user/{id}', user.getId())}"]`);
	await page.click('#show-user-comment-votes-button');
	await page.waitForSelector('table#user-comment-votes');

	const commentVotesTableRows = await page.$$('table#user-comment-votes tbody tr');
	const commentVotesTableRowText = await commentVotesTableRows[0].innerText();
	const retrievedComment = await Comment.findById(comment.getId());

	expect(commentVotesTableRowText).toMatch(retrievedComment.getContent());
	expect(commentVotesTableRowText).toMatch(retrievedComment.getCreatedAt().toString());
});

test('Comment vote interface not visible on post page when not logged in.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);

	const commentUpvoteButton = await page.$('.comment-upvote-button');
	const commentDownvoteButton = await page.$('.comment-downvote-button');

	expect(commentUpvoteButton).toBeNull();
	expect(commentDownvoteButton).toBeNull();
});

test('Comment vote interface not visible on comment page when not logged in.', async () => {
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.click(`a[href="${Url.path('comment/{id}', comment.getId())}"]`);

	const commentUpvoteButton = await page.$('.comment-upvote-button');
	const commentDownvoteButton = await page.$('.comment-downvote-button');

	expect(commentUpvoteButton).toBeNull();
	expect(commentDownvoteButton).toBeNull();
});

test('Comment up voted then down voted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("1")`);

	expect(await commentVotesElement.innerText()).toMatch('1');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("-1")`);

	expect(await commentVotesElement.innerText()).toMatch('-1');
});

test('Comment up voted then down voted on comment page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.click(`a[href="${Url.path('comment/{id}', comment.getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("1")`);

	expect(await commentVotesElement.innerText()).toMatch('1');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("-1")`);

	expect(await commentVotesElement.innerText()).toMatch('-1');
});

test('Comment down voted then up voted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("-1")`);

	expect(await commentVotesElement.innerText()).toMatch('-1');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("1")`);

	expect(await commentVotesElement.innerText()).toMatch('1');
});

test('Comment down voted then up voted on comment page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.click(`a[href="${Url.path('comment/{id}', comment.getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("-1")`);

	expect(await commentVotesElement.innerText()).toMatch('-1');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("1")`);

	expect(await commentVotesElement.innerText()).toMatch('1');
});

test('Comment up voted then unvoted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("1")`);

	expect(await commentVotesElement.innerText()).toMatch('1');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("0")`);

	expect(await commentVotesElement.innerText()).toMatch('0');
});

test('Comment up voted then unvoted on comment page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.click(`a[href="${Url.path('comment/{id}', comment.getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("1")`);

	expect(await commentVotesElement.innerText()).toMatch('1');

	await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("0")`);

	expect(await commentVotesElement.innerText()).toMatch('0');
});

test('Comment down voted then unvoted on post page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("-1")`);

	expect(await commentVotesElement.innerText()).toMatch('-1');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("0")`);

	expect(await commentVotesElement.innerText()).toMatch('0');
});

test('Comment down voted then unvoted on comment page.', async () => {
	await logIn(email, password, page);
	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.click(`a[href="${Url.path('comment/{id}', comment.getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	const commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);

	expect(await commentVotesElement.innerText()).toMatch('0');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("-1")`);

	expect(await commentVotesElement.innerText()).toMatch('-1');

	await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]:text-matches("0")`);

	expect(await commentVotesElement.innerText()).toMatch('0');
});

test('Comment voted on by multiple users.', async () => {
	const numberOfUsers = Math.floor(Math.random() * 5) + 2;
	let upvotes = 0;
	let downvotes = 0;

	for (let i = 0; i < numberOfUsers; i++) {
		const { username, email, password } = generateUserData();
		await generateUser(username, email, password);

		await logIn(email, password, page);
		await page.goto(Url.base());
		await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
		await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);

		if (Math.random() < 0.5) {
			await page.click(`a[href="${Url.path('comment/{id}', comment.getId())}"]`);
		}

		if (Math.random() < 0.5) {
			await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
			upvotes++;

			if (Math.random() < 0.25) {
				await page.click(`.comment-upvote-button[comment-id="${comment.getId()}"]`);
				upvotes--;
			}
		}
		else {
			await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
			downvotes++;

			if (Math.random() < 0.25) {
				await page.click(`.comment-downvote-button[comment-id="${comment.getId()}"]`);
				downvotes--;
			}
		}

		await logOut(page);
	}

	const totalVotes = upvotes - downvotes;

	await page.goto(Url.base());
	await page.click(`a[href="${Url.path('category/{id}', comment.getPost().getCategory().getId())}"]`);
	await page.click(`a[href="${Url.path('post/{id}', comment.getPost().getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	let commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);
	expect(await commentVotesElement.innerText()).toMatch(totalVotes.toString());

	await page.click(`a[href="${Url.path('comment/{id}', comment.getId())}"]`);
	await page.waitForSelector(`.comment-votes[comment-id="${comment.getId()}"]`);

	commentVotesElement = await page.$(`.comment-votes[comment-id="${comment.getId()}"]`);
	expect(await commentVotesElement.innerText()).toMatch(totalVotes.toString());
});
