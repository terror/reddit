const Request = require('../../src/router/Request');
const Router = require('../../src/router/Router');
const JsonResponse = require('../../src/router/JsonResponse');
const Post = require('../../src/models/Post');
const Comment = require('../../src/models/Comment');
const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	generatePost,
	generateComment,
	truncateDatabase,
	logIn,
	getSession,
	stopSession,
} = require('./RouterTestHelper');

let session;
let username;
let email;
let password;
let user;
let post;
let comment;

beforeEach(async () => {
	await truncateDatabase();

	session = getSession();

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);
	post = await generatePost();
	comment = await generateComment();
});

test('Post bookmarked successfully.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/bookmark`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was bookmarked successfully!');

	request = new Request('GET', `/user/${user.getId()}/postbookmarks`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's post bookmarks were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(1);
	expect(response.getPayload()[0]).toBeInstanceOf(Post);
	expect(response.getPayload()[0].getId()).toBe(post.getId());
});

test('Post unbookmarked successfully.', async () => {
	await post.bookmark(user.getId());
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/unbookmark`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was unbookmarked successfully!');

	request = new Request('GET', `/user/${user.getId()}/postbookmarks`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's post bookmarks were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(0);
});

test('Post not bookmarked while not logged in.', async () => {
	const request = new Request('GET', `/post/${post.getId()}/bookmark`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot bookmark Post: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post not unbookmarked while not logged in.', async () => {
	const request = new Request('GET', `/post/${post.getId()}/unbookmark`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot unbookmark Post: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post was not bookmarked twice by the same user.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/bookmark`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}/bookmark`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot bookmark Post: Post has already been bookmarked.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post was not unbookmarked twice by the same user.', async () => {
	await post.bookmark(user.getId());
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/unbookmark`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}/unbookmark`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot unbookmark Post: Post has not been bookmarked.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post was not unbookmarked before being bookmarked.', async () => {
	await logIn(email, password, session);

	const request = new Request('GET', `/post/${post.getId()}/unbookmark`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot unbookmark Post: Post has not been bookmarked.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment bookmarked successfully.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/bookmark`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was bookmarked successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentbookmarks`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's comment bookmarks were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(1);
	expect(response.getPayload()[0]).toBeInstanceOf(Comment);
	expect(response.getPayload()[0].getId()).toBe(comment.getId());
});

test('Comment unbookmarked successfully.', async () => {
	await comment.bookmark(user.getId());
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/unbookmark`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was unbookmarked successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentbookmarks`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's comment bookmarks were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(0);
});

test('Comment not bookmarked while not logged in.', async () => {
	const request = new Request('GET', `/comment/${comment.getId()}/bookmark`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot bookmark Comment: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment not unbookmarked while not logged in.', async () => {
	const request = new Request('GET', `/comment/${comment.getId()}/unbookmark`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot unbookmark Comment: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was not bookmarked twice by the same user.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/bookmark`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}/bookmark`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot bookmark Comment: Comment has already been bookmarked.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was not unbookmarked twice by the same user.', async () => {
	await comment.bookmark(user.getId());
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/unbookmark`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}/unbookmark`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot unbookmark Comment: Comment has not been bookmarked.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was not unbookmarked before being bookmarked.', async () => {
	await logIn(email, password, session);

	const request = new Request('GET', `/comment/${comment.getId()}/unbookmark`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot unbookmark Comment: Comment has not been bookmarked.');
	expect(response.getPayload()).toMatchObject({});
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
