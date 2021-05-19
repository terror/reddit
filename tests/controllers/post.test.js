const Request = require('../../src/router/Request');
const JsonResponse = require('../../src/router/JsonResponse');
const HtmlResponse = require('../../src/router/HtmlResponse');
const User = require('../../src/models/User');
const Category = require('../../src/models/Category');
const Post = require('../../src/models/Post');
const PostController = require('../../src/controllers/PostController');
const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	generateCategory,
	generatePost,
	generatePostData,
	generateRandomId,
	truncateDatabase,
	logIn,
	getSession,
	stopSession,
} = require('./ControllerTestHelper');

let initialPostId;
let session;
let username;
let email;
let password;
let user;
let category;

beforeEach(async () => {
	initialPostId = await generateRandomId();
	await truncateDatabase(['post'], initialPostId);

	session = getSession();

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);
	category = await generateCategory(user);
});

test('PostController handled a POST request.', async () => {
	const postData = await generatePostData(null, user, category);

	await logIn(email, password, session);

	const request = new Request('POST', '/post', postData);
	const controller = new PostController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post created successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(initialPostId);
	expect(response.getPayload().getTitle()).toBe(postData.title);
	expect(response.getPayload().getContent()).toBe(postData.content);
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(user.getId());
	expect(response.getPayload().getCategory()).toBeInstanceOf(Category);
	expect(response.getPayload().getCategory().getId()).toBe(category.getId());
});

test('PostController threw an exception handling a POST request while not logged in.', async () => {
	const postData = await generatePostData();
	const request = new Request('POST', '/post', postData);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot create Post: You must be logged in.',
	});
});

test('PostController handled a GET request.', async () => {
	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}`);
	const controller = new PostController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getTitle()).toBe(post.getTitle());
	expect(response.getPayload().getContent()).toBe(post.getContent());
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(post.getUser().getId());
	expect(response.getPayload().getCategory()).toBeInstanceOf(Category);
	expect(response.getPayload().getCategory().getId()).toBe(post.getCategory().getId());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('PostController threw an exception handling a GET request with non-existant ID.', async () => {
	const postId = await generateRandomId();
	const request = new Request('GET', `/post/${postId}`);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot retrieve Post: Post does not exist with ID ${postId}.`,
	});
});

test('PostController handled a GET edit form request.', async () => {
	const post = await generatePost({ user });

	await logIn(email, password, session);

	const request = new Request('GET', `/post/${post.getId()}/edit`);
	const controller = new PostController(request, new HtmlResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
});

test('PostController threw an exception handling a GET edit form request while not logged in.', async () => {
	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}/edit`);
	const controller = new PostController(request, new HtmlResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot update Post: You must be logged in.',
	});
});

test('PostController threw an exception handling a GET edit form request with non-existant ID.', async () => {
	const postId = await generateRandomId();

	await logIn(email, password, session);
	const request = new Request('GET', `/post/${postId}/edit`);
	const controller = new PostController(request, new HtmlResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot update Post: Post does not exist with ID ${postId}.`,
	});
});

test('PostController threw an exception handling a GET edit form request from another user.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	const request = new Request('GET', `/post/${post.getId()}/edit`);
	const controller = new PostController(request, new HtmlResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot update Post: You cannot update a post created by someone other than yourself.',
	});
});

test('PostController handled a PUT request.', async () => {
	const post = await generatePost({ user, type: 'Text' });
	const { content: newPostContent } = await generatePostData();

	await logIn(email, password, session);

	let request = new Request('PUT', `/post/${post.getId()}`, { content: newPostContent });
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post updated successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getContent()).toBe(newPostContent);
	expect(response.getPayload().getContent()).not.toBe(post.getContent());
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(post.getUser().getId());
	expect(response.getPayload().getCategory()).toBeInstanceOf(Category);
	expect(response.getPayload().getCategory().getId()).toBe(post.getCategory().getId());

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getTitle()).toBe(post.getTitle());
	expect(response.getPayload().getContent()).toBe(newPostContent);
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(post.getUser().getId());
	expect(response.getPayload().getCategory()).toBeInstanceOf(Category);
	expect(response.getPayload().getCategory().getId()).toBe(post.getCategory().getId());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('PostController threw an exception handling a PUT request while not logged in.', async () => {
	const post = await generatePost();
	const { content: newPostContent } = await generatePostData();
	const request = new Request('PUT', `/post/${post.getId()}`, { content: newPostContent });
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot update Post: You must be logged in.',
	});
});

test('PostController threw an exception handling a PUT request with non-existant ID.', async () => {
	const postId = await generateRandomId();

	await logIn(email, password, session);

	const request = new Request('PUT', `/post/${postId}`, { content: 'New Content' });
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot update Post: Post does not exist with ID ${postId}.`,
	});
});

test('PostController threw an exception handling a PUT request from another user.', async () => {
	const post = await generatePost();
	const { content: newPostContent } = await generatePostData();

	await logIn(email, password, session);

	const request = new Request('PUT', `/post/${post.getId()}`, { content: newPostContent });
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot update Post: You cannot update a post created by someone other than yourself.',
	});
});

test('PostController threw an exception handling a PUT request with no update fields.', async () => {
	const post = await generatePost({ user, type: 'Text' });

	await logIn(email, password, session);

	const request = new Request('PUT', `/post/${post.getId()}`, { content: '' });
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: 'Cannot update Post: No update parameters were provided.',
	});
});

test('PostController handled a DELETE request.', async () => {
	const post = await generatePost({ user });

	await logIn(email, password, session);

	let request = new Request('DELETE', `/post/${post.getId()}`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post deleted successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getTitle()).toBe(post.getTitle());
	expect(response.getPayload().getContent()).toBe(post.getContent());
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(post.getUser().getId());
	expect(response.getPayload().getCategory()).toBeInstanceOf(Category);
	expect(response.getPayload().getCategory().getId()).toBe(post.getCategory().getId());

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getTitle()).toBe(post.getTitle());
	expect(response.getPayload().getContent()).toBe(post.getContent());
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(post.getUser().getId());
	expect(response.getPayload().getCategory()).toBeInstanceOf(Category);
	expect(response.getPayload().getCategory().getId()).toBe(post.getCategory().getId());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeInstanceOf(Date);
});

test('PostController threw an exception handling a DELETE request while not logged in.', async () => {
	const postId = await generateRandomId();
	const request = new Request('DELETE', `/post/${postId}`);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot delete Post: You must be logged in.',
	});
});

test('PostController threw an exception handling a DELETE request with non-existant ID.', async () => {
	const postId = await generateRandomId();

	await logIn(email, password, session);

	const request = new Request('DELETE', `/post/${postId}`);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot delete Post: Post does not exist with ID ${postId}.`,
	});
});

test('PostController threw an exception handling a DELETE request from another user.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	const request = new Request('DELETE', `/post/${post.getId()}`);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot delete Post: You cannot delete a post created by someone other than yourself.',
	});
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
