const Request = require('../../src/router/Request');
const Router = require('../../src/router/Router');
const JsonResponse = require('../../src/router/JsonResponse');
const HtmlResponse = require('../../src/router/HtmlResponse');
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
} = require('./RouterTestHelper');

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

test('Comment created successfully.', async () => {
	await logIn(email, password, session);

	const commentData = await generateCommentData(user, post);
	const request = new Request('POST', '/comment', commentData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment created successfully!');
	expect(response.getPayload().getId()).toBe(initialCommentId);
	expect(response.getPayload().getContent()).toBe(commentData.content);
	expect(response.getPayload().getUser().getId()).toBe(commentData.userId);
	expect(response.getPayload().getPost().getId()).toBe(commentData.postId);
	expect(response.getPayload().getCreatedAt()).toBeNull();
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('Comment not created while not logged in.', async () => {
	const commentData = await generateCommentData();
	const request = new Request('POST', '/comment', commentData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot create Comment: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment not created with non-existant post.', async () => {
	await logIn(email, password, session);

	const commentData = await generateCommentData();
	commentData.postId = await generateRandomId('post');
	const request = new Request('POST', '/comment', commentData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot create Comment: Post does not exist with ID ${commentData.postId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('Comment not created with blank content.', async () => {
	await logIn(email, password, session);

	const commentData = await generateCommentData(null, null, '');
	const request = new Request('POST', '/comment', commentData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot create Comment: Missing content.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment found by ID.', async () => {
	const comment = await generateComment();
	const request = new Request('GET', `/comment/${comment.getId()}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getContent()).toBe(comment.getContent());
	expect(response.getPayload().getUser().getId()).toBe(comment.getUser().getId());
	expect(response.getPayload().getPost().getId()).toBe(comment.getPost().getId());
	expect(response.getPayload().getCreatedAt()).not.toBeNull();
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('Comment not found by wrong ID.', async () => {
	const commentId = await generateRandomId();
	const request = new Request('GET', `/comment/${commentId}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot retrieve Comment: Comment does not exist with ID ${commentId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('Comment edit form was retrieved.', async () => {
	await logIn(email, password, session);

	const comment = await generateComment({ user });
	const request = new Request('GET', `/comment/${comment.getId()}/edit`);
	const router = new Router(request, new HtmlResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
});

test('Comment edit form was not retrieved while not logged in.', async () => {
	const comment = await generateComment();
	const request = new Request('GET', `/comment/${comment.getId()}/edit`);
	const router = new Router(request, new HtmlResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
});

test('Comment edit form was not retrieved with non-existant ID.', async () => {
	const commentId = await generateRandomId();

	await logIn(email, password, session);
	const request = new Request('GET', `/comment/${commentId}/edit`);
	const router = new Router(request, new HtmlResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
});

test('Comment edit form was not retrieved by another user.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	const request = new Request('GET', `/comment/${comment.getId()}/edit`);
	const router = new Router(request, new HtmlResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.FORBIDDEN);
});

test('Comment updated successfully.', async () => {
	await logIn(email, password, session);

	const comment = await generateComment({ user });
	const { content: newCommentContent } = await generateCommentData();
	let request = new Request('PUT', `/comment/${comment.getId()}`, { content: newCommentContent });
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment updated successfully!');
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getContent()).toBe(newCommentContent);
	expect(response.getPayload().getContent()).not.toBe(comment.getContent());
	expect(response.getPayload().getUser().getId()).toBe(comment.getUser().getId());
	expect(response.getPayload().getPost().getId()).toBe(comment.getPost().getId());

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getContent()).toBe(newCommentContent);
	expect(response.getPayload().getCreatedAt()).not.toBeNull();
	expect(response.getPayload().getEditedAt()).not.toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('Comment not updated while not logged in.', async () => {
	const commentId = await generateRandomId();
	const { content: newCommentContent } = await generateCommentData();
	const request = new Request('PUT', `/comment/${commentId}`, { content: newCommentContent });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot update Comment: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment not updated with non-existant ID.', async () => {
	await logIn(email, password, session);

	const commentId = await generateRandomId();
	const request = new Request('PUT', `/comment/${commentId}`, { content: 'New Content' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot update Comment: Comment does not exist with ID ${commentId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('Comment not updated by another user.', async () => {
	await logIn(email, password, session);

	const comment = await generateComment();
	const { content: newCommentContent } = await generateCommentData();
	const request = new Request('PUT', `/comment/${comment.getId()}`, { content: newCommentContent });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.getMessage()).toBe('Cannot update Comment: You cannot update a comment created by someone other than yourself.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment not updated with blank content.', async () => {
	await logIn(email, password, session);

	const comment = await generateComment({ user });
	const request = new Request('PUT', `/comment/${comment.getId()}`, { content: '' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot update Comment: No update parameters were provided.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment deleted successfully.', async () => {
	await logIn(email, password, session);

	const comment = await generateComment({ user });
	let request = new Request('DELETE', `/comment/${comment.getId()}`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment deleted successfully!');
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getContent()).toBe(comment.getContent());
	expect(response.getPayload().getUser().getId()).toBe(comment.getUser().getId());
	expect(response.getPayload().getPost().getId()).toBe(comment.getPost().getId());

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getContent()).toBe(comment.getContent());
	expect(response.getPayload().getCreatedAt()).not.toBeNull();
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).not.toBeNull();
});

test('Comment not deleted while not logged in.', async () => {
	const commentId = await generateRandomId();
	const request = new Request('DELETE', `/comment/${commentId}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot delete Comment: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment not deleted with non-existant ID.', async () => {
	await logIn(email, password, session);

	const commentId = await generateRandomId();
	const request = new Request('DELETE', `/comment/${commentId}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot delete Comment: Comment does not exist with ID ${commentId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('Comment not deleted by another user.', async () => {
	await logIn(email, password, session);

	const comment = await generateComment();
	const request = new Request('DELETE', `/comment/${comment.getId()}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.getMessage()).toBe('Cannot delete Comment: You cannot delete a comment created by someone other than yourself.');
	expect(response.getPayload()).toMatchObject({});
});

afterEach(async () => {
	await truncateDatabase();
	stopSession();
});
