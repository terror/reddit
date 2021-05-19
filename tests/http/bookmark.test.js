const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	generateComment,
	generatePost,
	makeHttpRequest,
	truncateDatabase,
	logIn,
	clearCookieJar,
} = require('./HttpTestHelper');

let username;
let email;
let password;
let user;
let post;
let comment;

beforeEach(async () => {
	await truncateDatabase();

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);
	post = await generatePost();
	comment = await generateComment();

	clearCookieJar();
});

test('Post bookmarked successfully.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/bookmark`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post was bookmarked successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/postbookmarks`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's post bookmarks were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(1);
	expect(response.payload[0].id).toBe(post.getId());
});

test('Post unbookmarked successfully.', async () => {
	await post.bookmark(user.getId());
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unbookmark`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post was unbookmarked successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/postbookmarks`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's post bookmarks were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(0);
});

test('Post not bookmarked while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/bookmark`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot bookmark Post: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Post not unbookmarked while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unbookmark`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot unbookmark Post: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Post was not bookmarked twice by the same user.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/bookmark`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/bookmark`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot bookmark Post: Post has already been bookmarked.');
	expect(response.payload).toMatchObject({});
});

test('Post was not unbookmarked twice by the same user.', async () => {
	await post.bookmark(user.getId());
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unbookmark`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unbookmark`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot unbookmark Post: Post has not been bookmarked.');
	expect(response.payload).toMatchObject({});
});

test('Post was not unbookmarked before being bookmarked.', async () => {
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unbookmark`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot unbookmark Post: Post has not been bookmarked.');
	expect(response.payload).toMatchObject({});
});

test('Comment bookmarked successfully.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/bookmark`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment was bookmarked successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/commentbookmarks`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's comment bookmarks were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(1);
	expect(response.payload[0].id).toBe(comment.getId());
});

test('Comment unbookmarked successfully.', async () => {
	await comment.bookmark(user.getId());
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unbookmark`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment was unbookmarked successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/commentbookmarks`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's comment bookmarks were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(0);
});

test('Comment not bookmarked while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/bookmark`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot bookmark Comment: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Comment not unbookmarked while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unbookmark`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot unbookmark Comment: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Comment was not bookmarked twice by the same user.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/bookmark`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/bookmark`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot bookmark Comment: Comment has already been bookmarked.');
	expect(response.payload).toMatchObject({});
});

test('Comment was not unbookmarked twice by the same user.', async () => {
	await comment.bookmark(user.getId());
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unbookmark`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unbookmark`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot unbookmark Comment: Comment has not been bookmarked.');
	expect(response.payload).toMatchObject({});
});

test('Comment was not unbookmarked before being bookmarked.', async () => {
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unbookmark`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot unbookmark Comment: Comment has not been bookmarked.');
	expect(response.payload).toMatchObject({});
});

afterAll(async () => {
	await truncateDatabase();
});
