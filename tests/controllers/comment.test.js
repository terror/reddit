const Request = require('../../src/router/Request');
const JsonResponse = require('../../src/router/JsonResponse');
const HtmlResponse = require('../../src/router/HtmlResponse');
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const Comment = require('../../src/models/Comment');
const CommentController = require('../../src/controllers/CommentController');
const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	generatePost,
	generateCommentData,
	generateComment,
	generateRandomId,
	truncateDatabase,
	logIn,
	getSession,
	stopSession,
} = require('./ControllerTestHelper');

let initialCommentId;
let session;
let username;
let email;
let password;
let user;
let post;

beforeEach(async () => {
	initialCommentId = await generateRandomId();
	await truncateDatabase(['comment'], initialCommentId);

	session = getSession();

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);
	post = await generatePost(user);
});

test('CommentController handled a POST request.', async () => {
	const commentData = await generateCommentData(user, post);

	await logIn(email, password, session);

	const request = new Request('POST', '/comment', commentData);
	const controller = new CommentController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment created successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(initialCommentId);
	expect(response.getPayload().getContent()).toBe(commentData.content);
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(user.getId());
	expect(response.getPayload().getPost()).toBeInstanceOf(Post);
	expect(response.getPayload().getPost().getId()).toBe(post.getId());
});

test('CommentController threw an exception handling a POST request while not logged in.', async () => {
	const commentData = await generateCommentData();
	const request = new Request('POST', '/comment', commentData);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot create Comment: You must be logged in.',
	});
});

test('CommentController handled a GET request.', async () => {
	const comment = await generateComment();
	const request = new Request('GET', `/comment/${comment.getId()}`);
	const controller = new CommentController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getContent()).toBe(comment.getContent());
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(comment.getUser().getId());
	expect(response.getPayload().getPost()).toBeInstanceOf(Post);
	expect(response.getPayload().getPost().getId()).toBe(comment.getPost().getId());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('CommentController threw an exception handling a GET request with non-existant ID.', async () => {
	const commentId = await generateRandomId();
	const request = new Request('GET', `/comment/${commentId}`);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot retrieve Comment: Comment does not exist with ID ${commentId}.`,
	});
});

test('CommentController handled a GET edit form request.', async () => {
	const comment = await generateComment({ user });

	await logIn(email, password, session);

	const request = new Request('GET', `/comment/${comment.getId()}/edit`);
	const controller = new CommentController(request, new HtmlResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
});

test('CommentController threw an exception handling a GET edit form request while not logged in.', async () => {
	const comment = await generateComment();
	const request = new Request('GET', `/comment/${comment.getId()}/edit`);
	const controller = new CommentController(request, new HtmlResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot update Comment: You must be logged in.',
	});
});

test('CommentController threw an exception handling a GET edit form request with non-existant ID.', async () => {
	const commentId = await generateRandomId();

	await logIn(email, password, session);
	const request = new Request('GET', `/comment/${commentId}/edit`);
	const controller = new CommentController(request, new HtmlResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot update Comment: Comment does not exist with ID ${commentId}.`,
	});
});

test('CommentController threw an exception handling a GET edit form request from another user.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	const request = new Request('GET', `/comment/${comment.getId()}/edit`);
	const controller = new CommentController(request, new HtmlResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot update Comment: You cannot update a comment created by someone other than yourself.',
	});
});

test('CommentController handled a PUT request.', async () => {
	const comment = await generateComment({ user });
	const { content: newCommentContent } = await generateCommentData();

	await logIn(email, password, session);

	let request = new Request('PUT', `/comment/${comment.getId()}`, { content: newCommentContent });
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment updated successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getContent()).toBe(newCommentContent);
	expect(response.getPayload().getContent()).not.toBe(comment.getContent());
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(comment.getUser().getId());
	expect(response.getPayload().getPost()).toBeInstanceOf(Post);
	expect(response.getPayload().getPost().getId()).toBe(comment.getPost().getId());

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getContent()).toBe(newCommentContent);
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(comment.getUser().getId());
	expect(response.getPayload().getPost()).toBeInstanceOf(Post);
	expect(response.getPayload().getPost().getId()).toBe(comment.getPost().getId());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('CommentController threw an exception handling a PUT request while not logged in.', async () => {
	const comment = await generateComment();
	const { content: newCommentContent } = await generateCommentData();
	const request = new Request('PUT', `/comment/${comment.getId()}`, { content: newCommentContent });
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot update Comment: You must be logged in.',
	});
});

test('CommentController threw an exception handling a PUT request with non-existant ID.', async () => {
	const commentId = await generateRandomId();

	await logIn(email, password, session);

	const request = new Request('PUT', `/comment/${commentId}`, { content: 'New Content' });
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot update Comment: Comment does not exist with ID ${commentId}.`,
	});
});

test('CommentController threw an exception handling a PUT request from another user.', async () => {
	const comment = await generateComment();
	const { content: newCommentContent } = await generateCommentData();

	await logIn(email, password, session);

	const request = new Request('PUT', `/comment/${comment.getId()}`, { content: newCommentContent });
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot update Comment: You cannot update a comment created by someone other than yourself.',
	});
});

test('CommentController threw an exception handling a PUT request with no update fields.', async () => {
	const comment = await generateComment({ user, type: 'Text' });

	await logIn(email, password, session);

	const request = new Request('PUT', `/comment/${comment.getId()}`, { content: '' });
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: 'Cannot update Comment: No update parameters were provided.',
	});
});

test('Comment Controller handled a DELETE request.', async () => {
	const comment = await generateComment({ user });

	await logIn(email, password, session);

	let request = new Request('DELETE', `/comment/${comment.getId()}`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment deleted successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getContent()).toBe(comment.getContent());
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(comment.getUser().getId());
	expect(response.getPayload().getPost()).toBeInstanceOf(Post);
	expect(response.getPayload().getPost().getId()).toBe(comment.getPost().getId());

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getContent()).toBe(comment.getContent());
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(comment.getUser().getId());
	expect(response.getPayload().getPost()).toBeInstanceOf(Post);
	expect(response.getPayload().getPost().getId()).toBe(comment.getPost().getId());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeInstanceOf(Date);
});

test('CommentController threw an exception handling a DELETE request while not logged in.', async () => {
	const commentId = await generateRandomId();
	const request = new Request('DELETE', `/comment/${commentId}`);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot delete Comment: You must be logged in.',
	});
});

test('CommentController threw an exception handling a DELETE request with non-existant ID.', async () => {
	const commentId = await generateRandomId();

	await logIn(email, password, session);

	const request = new Request('DELETE', `/comment/${commentId}`);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot delete Comment: Comment does not exist with ID ${commentId}.`,
	});
});

test('CommentController threw an exception handling a DELETE request from another user.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	const request = new Request('DELETE', `/comment/${comment.getId()}`);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot delete Comment: You cannot delete a comment created by someone other than yourself.',
	});
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
