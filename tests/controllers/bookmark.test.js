const Request = require('../../src/router/Request');
const JsonResponse = require('../../src/router/JsonResponse');
const Post = require('../../src/models/Post');
const Comment = require('../../src/models/Comment');
const PostController = require('../../src/controllers/PostController');
const CommentController = require('../../src/controllers/CommentController');
const UserController = require('../../src/controllers/UserController');
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
} = require('./ControllerTestHelper');

let session;
let username;
let email;
let password;
let user;

beforeEach(async () => {
	await truncateDatabase();

	session = getSession();

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);
});

test('PostController bookmarked a post successfully.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/bookmark`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was bookmarked successfully!');

	request = new Request('GET', `/user/${user.getId()}/postbookmarks`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's post bookmarks were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(1);
	expect(response.getPayload()[0]).toBeInstanceOf(Post);
	expect(response.getPayload()[0].getId()).toBe(post.getId());
});

test('PostController unbookmarked a post successfully.', async () => {
	const post = await generatePost();

	await post.bookmark(user.getId());

	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/unbookmark`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was unbookmarked successfully!');

	request = new Request('GET', `/user/${user.getId()}/postbookmarks`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's post bookmarks were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(0);
});

test('PostController threw an exception handling a bookmark request while not logged in.', async () => {
	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}/bookmark`);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot bookmark Post: You must be logged in.',
	});
});

test('PostController threw an exception handling an unbookmark request while not logged in.', async () => {
	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}/unbookmark`);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot unbookmark Post: You must be logged in.',
	});
});

test('CommentController bookmarked a comment successfully.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/bookmark`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was bookmarked successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentbookmarks`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's comment bookmarks were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(1);
	expect(response.getPayload()[0]).toBeInstanceOf(Comment);
	expect(response.getPayload()[0].getId()).toBe(comment.getId());
});

test('CommentController unbookmarked a comment successfully.', async () => {
	const comment = await generateComment();

	await comment.bookmark(user.getId());

	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/unbookmark`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was unbookmarked successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentbookmarks`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's comment bookmarks were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(0);
});

test('CommentController threw an exception handling a bookmark request while not logged in.', async () => {
	const comment = await generateComment();
	const request = new Request('GET', `/comment/${comment.getId()}/bookmark`);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot bookmark Comment: You must be logged in.',
	});
});

test('CommentController threw an exception handling an unbookmark request while not logged in.', async () => {
	const comment = await generateComment();
	const request = new Request('GET', `/comment/${comment.getId()}/unbookmark`);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot unbookmark Comment: You must be logged in.',
	});
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
