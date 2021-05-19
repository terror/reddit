const Request = require('../../src/router/Request');
const Router = require('../../src/router/Router');
const JsonResponse = require('../../src/router/JsonResponse');
const HtmlResponse = require('../../src/router/HtmlResponse');
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
} = require('./RouterTestHelper');

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

test('Post created successfully.', async () => {
	await logIn(email, password, session);

	const postData = await generatePostData(null, user, category);
	const request = new Request('POST', '/post', postData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post created successfully!');
	expect(response.getPayload().getId()).toBe(initialPostId);
	expect(response.getPayload().getTitle()).toBe(postData.title);
	expect(response.getPayload().getContent()).toBe(postData.content);
	expect(response.getPayload().getUser().getId()).toBe(postData.userId);
	expect(response.getPayload().getCategory().getId()).toBe(postData.categoryId);
	expect(response.getPayload().getCreatedAt()).toBeNull();
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('Post not created while not logged in.', async () => {
	const postData = await generatePostData();
	const request = new Request('POST', '/post', postData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot create Post: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post not created with non-existant category.', async () => {
	await logIn(email, password, session);

	const postData = await generatePostData();
	postData.categoryId = await generateRandomId('category');
	const request = new Request('POST', '/post', postData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot create Post: Category does not exist with ID ${postData.categoryId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('Post not created with blank title.', async () => {
	await logIn(email, password, session);

	const postData = await generatePostData(null, user, category, '');
	const request = new Request('POST', '/post', postData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot create Post: Missing title.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post not created with blank type.', async () => {
	await logIn(email, password, session);

	const postData = await generatePostData('', user, category);
	const request = new Request('POST', '/post', postData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot create Post: Missing type.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post not created with blank content.', async () => {
	await logIn(email, password, session);

	const postData = await generatePostData(null, user, category, null, '');
	const request = new Request('POST', '/post', postData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot create Post: Missing content.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post found by ID.', async () => {
	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getTitle()).toBe(post.getTitle());
	expect(response.getPayload().getContent()).toBe(post.getContent());
	expect(response.getPayload().getUser().getId()).toBe(post.getUser().getId());
	expect(response.getPayload().getCategory().getId()).toBe(post.getCategory().getId());
	expect(response.getPayload().getCreatedAt()).not.toBeNull();
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('Post not found by wrong ID.', async () => {
	const postId = await generateRandomId();
	const request = new Request('GET', `/post/${postId}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot retrieve Post: Post does not exist with ID ${postId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('Post edit form was retrieved.', async () => {
	await logIn(email, password, session);

	const post = await generatePost({ user });
	const request = new Request('GET', `/post/${post.getId()}/edit`);
	const router = new Router(request, new HtmlResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
});

test('Post edit form was not retrieved while not logged in.', async () => {
	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}/edit`);
	const router = new Router(request, new HtmlResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
});

test('Post edit form was not retrieved with non-existant ID.', async () => {
	await logIn(email, password, session);

	const postId = await generateRandomId();

	const request = new Request('GET', `/post/${postId}/edit`);
	const router = new Router(request, new HtmlResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
});

test('Post edit form was not retrieved by another user.', async () => {
	await logIn(email, password, session);

	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}/edit`);
	const router = new Router(request, new HtmlResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.FORBIDDEN);
});

test('Post (Text) content updated successfully.', async () => {
	await logIn(email, password, session);

	const post = await generatePost({ user, type: 'Text' });
	const { content: newPostContent } = await generatePostData();

	let request = new Request('PUT', `/post/${post.getId()}`, { content: newPostContent });
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post updated successfully!');
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getContent()).toBe(newPostContent);
	expect(response.getPayload().getContent()).not.toBe(post.getContent());
	expect(response.getPayload().getUser().getId()).toBe(post.getUser().getId());
	expect(response.getPayload().getCategory().getId()).toBe(post.getCategory().getId());

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getContent()).toBe(newPostContent);
	expect(response.getPayload().getCreatedAt()).not.toBeNull();
	expect(response.getPayload().getEditedAt()).not.toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('Post not updated while not logged in.', async () => {
	const post = await generatePost();
	const { content: newPostContent } = await generatePostData();
	const request = new Request('PUT', `/post/${post.getId()}`, { content: newPostContent });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot update Post: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post not updated with non-existant ID.', async () => {
	await logIn(email, password, session);

	const postId = await generateRandomId();

	const request = new Request('PUT', `/post/${postId}`, { content: 'New Content' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot update Post: Post does not exist with ID ${postId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('Post not updated by another user.', async () => {
	await logIn(email, password, session);

	const post = await generatePost();
	const { content: newPostContent } = await generatePostData();

	const request = new Request('PUT', `/post/${post.getId()}`, { content: newPostContent });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.getMessage()).toBe('Cannot update Post: You cannot update a post created by someone other than yourself.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post (Text) not updated with non-existant ID.', async () => {
	await logIn(email, password, session);

	const postId = await generateRandomId();
	const request = new Request('PUT', `/post/${postId}`, { content: 'New content!' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot update Post: Post does not exist with ID ${postId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('Post (Text) not updated with blank content.', async () => {
	await logIn(email, password, session);

	const post = await generatePost({ user, type: 'Text' });
	const request = new Request('PUT', `/post/${post.getId()}`, { content: '' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot update Post: No update parameters were provided.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post (URL) not updated.', async () => {
	await logIn(email, password, session);

	const post = await generatePost({ user, type: 'URL' });
	const request = new Request('PUT', `/post/${post.getId()}`, { content: 'https://pokemon.com' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot update Post: Only text posts are editable.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post deleted successfully.', async () => {
	const post = await generatePost({ user });

	await logIn(email, password, session);

	let request = new Request('DELETE', `/post/${post.getId()}`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post deleted successfully!');
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getTitle()).toBe(post.getTitle());
	expect(response.getPayload().getContent()).toBe(post.getContent());
	expect(response.getPayload().getUser().getId()).toBe(post.getUser().getId());
	expect(response.getPayload().getCategory().getId()).toBe(post.getCategory().getId());

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getTitle()).toBe(post.getTitle());
	expect(response.getPayload().getContent()).toBe(post.getContent());
	expect(response.getPayload().getCreatedAt()).not.toBeNull();
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).not.toBeNull();
});

test('Post not deleted while not logged in.', async () => {
	const postId = await generateRandomId();
	const request = new Request('DELETE', `/post/${postId}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot delete Post: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post not deleted with non-existant ID.', async () => {
	const postId = await generateRandomId();

	await logIn(email, password, session);

	const request = new Request('DELETE', `/post/${postId}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot delete Post: Post does not exist with ID ${postId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('Post not deleted by another user.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	const request = new Request('DELETE', `/post/${post.getId()}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.getMessage()).toBe('Cannot delete Post: You cannot delete a post created by someone other than yourself.');
	expect(response.getPayload()).toMatchObject({});
});

afterEach(async () => {
	await truncateDatabase();
	stopSession();
});
