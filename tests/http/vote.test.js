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

test('Post was up voted successfully.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/upvote`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post was up voted successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/postvotes`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's post votes were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(1);
	expect(response.payload[0].id).toBe(post.getId());
	expect(response.payload[0].upvotes).toBe(1);
	expect(response.payload[0].downvotes).toBe(0);
});

test('Post was down voted successfully.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/downvote`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post was down voted successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/postvotes`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's post votes were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(1);
	expect(response.payload[0].id).toBe(post.getId());
	expect(response.payload[0].upvotes).toBe(0);
	expect(response.payload[0].downvotes).toBe(1);
});

test('Post was unvoted successfully.', async () => {
	await post.upVote(user.getId());
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unvote`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post was unvoted successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/postvotes`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's post votes were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(0);
});

test('Post was not upvoted while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/upvote`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot up vote Post: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Post was not downvoted while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/downvote`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot down vote Post: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Post was not unvoted while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unvote`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot unvote Post: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Post was up voted then down voted.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/upvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post retrieved successfully!');
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.upvotes).toBe(1);
	expect(response.payload.downvotes).toBe(0);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/downvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post retrieved successfully!');
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(1);
});

test('Post was down voted then up voted.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/downvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post retrieved successfully!');
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(1);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/upvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post retrieved successfully!');
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.upvotes).toBe(1);
	expect(response.payload.downvotes).toBe(0);
});

test('Post was up voted then unvoted.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/upvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post retrieved successfully!');
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.upvotes).toBe(1);
	expect(response.payload.downvotes).toBe(0);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post retrieved successfully!');
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(0);
});

test('Post was down voted then unvoted.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/downvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post retrieved successfully!');
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(1);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Post retrieved successfully!');
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(0);
});

test('Post was not up voted twice by the same user.', async () => {
	await post.upVote(user.getId());
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/upvote`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot up vote Post: Post has already been up voted.');
	expect(response.payload).toMatchObject({});
});

test('Post was not down voted twice by the same user.', async () => {
	await post.downVote(user.getId());
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/downvote`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot down vote Post: Post has already been down voted.');
	expect(response.payload).toMatchObject({});
});

test('Post was not unvoted twice by the same user.', async () => {
	await post.downVote(user.getId());
	await post.unvote(user.getId());
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unvote`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot unvote Post: Post must first be up or down voted.');
	expect(response.payload).toMatchObject({});
});

test('Post was not unvoted before being voted on.', async () => {
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/unvote`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot unvote Post: Post must first be up or down voted.');
	expect(response.payload).toMatchObject({});
});

test('Comment was up voted successfully.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/upvote`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment was up voted successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/commentvotes`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's comment votes were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(1);
	expect(response.payload[0].id).toBe(comment.getId());
	expect(response.payload[0].upvotes).toBe(1);
	expect(response.payload[0].downvotes).toBe(0);
});

test('Comment was down voted successfully.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/downvote`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment was down voted successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/commentvotes`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's comment votes were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(1);
	expect(response.payload[0].id).toBe(comment.getId());
	expect(response.payload[0].upvotes).toBe(0);
	expect(response.payload[0].downvotes).toBe(1);
});

test('Comment was unvoted successfully.', async () => {
	await comment.upVote(user.getId());
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unvote`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment was unvoted successfully!');

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}/commentvotes`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe("User's comment votes were retrieved successfully!");
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(0);
});

test('Comment was not upvoted while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/upvote`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot up vote Comment: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Comment was not downvoted while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/downvote`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot down vote Comment: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Comment was not unvoted while not logged in.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unvote`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot unvote Comment: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Comment was up voted then down voted.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/upvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment retrieved successfully!');
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.upvotes).toBe(1);
	expect(response.payload.downvotes).toBe(0);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/downvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment retrieved successfully!');
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(1);
});

test('Comment was down voted then up voted.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/downvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment retrieved successfully!');
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(1);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/upvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment retrieved successfully!');
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.upvotes).toBe(1);
	expect(response.payload.downvotes).toBe(0);
});

test('Comment was up voted then unvoted.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/upvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment retrieved successfully!');
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.upvotes).toBe(1);
	expect(response.payload.downvotes).toBe(0);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment retrieved successfully!');
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(0);
});

test('Comment was down voted then unvoted.', async () => {
	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/downvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment retrieved successfully!');
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(1);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unvote`);

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Comment retrieved successfully!');
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.upvotes).toBe(0);
	expect(response.payload.downvotes).toBe(0);
});

test('Comment was not up voted twice by the same user.', async () => {
	await comment.upVote(user.getId());
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/upvote`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot up vote Comment: Comment has already been up voted.');
	expect(response.payload).toMatchObject({});
});

test('Comment was not down voted twice by the same user.', async () => {
	await comment.downVote(user.getId());
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/downvote`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot down vote Comment: Comment has already been down voted.');
	expect(response.payload).toMatchObject({});
});

test('Comment was not unvoted twice by the same user.', async () => {
	await comment.downVote(user.getId());
	await comment.unvote(user.getId());
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unvote`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot unvote Comment: Comment must first be up or down voted.');
	expect(response.payload).toMatchObject({});
});

test('Comment was not unvoted before being voted on.', async () => {
	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/unvote`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot unvote Comment: Comment must first be up or down voted.');
	expect(response.payload).toMatchObject({});
});

afterAll(async () => {
	await truncateDatabase();
});
