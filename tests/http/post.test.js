const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	generateCategory,
	generatePost,
	generatePostData,
	generateRandomId,
	makeHttpRequest,
	truncateDatabase,
	logIn,
	clearCookieJar,
} = require('./HttpTestHelper');

let initialPostId;
let username;
let email;
let password;
let user;
let category;

beforeEach(async () => {
	initialPostId = await generateRandomId();
	await truncateDatabase(['post'], initialPostId);

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);
	category = await generateCategory(user);

	clearCookieJar();
});

test('Post created successfully.', async () => {
	await logIn(email, password);

	const postData = await generatePostData(null, user, category);
	const [statusCode, response] = await makeHttpRequest('POST', '/post', postData);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Post created successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('title')).toBe(true);
	expect(Object.keys(response.payload).includes('content')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(Object.keys(response.payload).includes('category')).toBe(true);
	expect(response.payload.id).toBe(initialPostId);
	expect(response.payload.title).toBe(postData.title);
	expect(response.payload.content).toBe(postData.content);
	expect(response.payload.user.id).toBe(postData.userId);
	expect(response.payload.category.id).toBe(postData.categoryId);
	expect(response.payload.createdAt).toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('Post not created while not logged in.', async () => {
	const postData = await generatePostData();
	const [statusCode, response] = await makeHttpRequest('POST', '/post', postData);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot create Post: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Post not created with non-existant category.', async () => {
	await logIn(email, password);

	const postData = await generatePostData();
	postData.categoryId = await generateRandomId('category');
	const [statusCode, response] = await makeHttpRequest('POST', '/post', postData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot create Post: Category does not exist with ID ${postData.categoryId}.`);
	expect(response.payload).toMatchObject({});
});

test('Post not created with blank title.', async () => {
	await logIn(email, password);

	const postData = await generatePostData(null, user, category, '');
	const [statusCode, response] = await makeHttpRequest('POST', '/post', postData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create Post: Missing title.');
	expect(response.payload).toMatchObject({});
});

test('Post not created with blank type.', async () => {
	await logIn(email, password);

	const postData = await generatePostData('', user, category);
	const [statusCode, response] = await makeHttpRequest('POST', '/post', postData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create Post: Missing type.');
	expect(response.payload).toMatchObject({});
});

test('Post not created with blank content.', async () => {
	await logIn(email, password);

	const postData = await generatePostData(null, user, category, null, '');
	const [statusCode, response] = await makeHttpRequest('POST', '/post', postData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create Post: Missing content.');
	expect(response.payload).toMatchObject({});
});

test('Post found by ID.', async () => {
	const post = await generatePost();
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Post retrieved successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('title')).toBe(true);
	expect(Object.keys(response.payload).includes('content')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(Object.keys(response.payload).includes('category')).toBe(true);
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.title).toBe(post.getTitle());
	expect(response.payload.content).toBe(post.getContent());
	expect(response.payload.user.id).toBe(post.getUser().getId());
	expect(response.payload.category.id).toBe(post.getCategory().getId());
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('Post not found by wrong ID.', async () => {
	const postId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${postId}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot retrieve Post: Post does not exist with ID ${postId}.`);
	expect(response.payload).toMatchObject({});
});

test('Post edit form was retrieved.', async () => {
	await logIn(email, password);

	const post = await generatePost({ user });
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/edit`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload.id).toBe(post.getId());
});

test('Post edit form was not retrieved while not logged in.', async () => {
	const post = await generatePost();
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/edit`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload).toMatchObject({});
});

test('Post edit form was not retrieved with non-existant ID.', async () => {
	await logIn(email, password);

	const postId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${postId}/edit`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload).toMatchObject({});
});

test('Post edit form was not retrieved by another user.', async () => {
	await logIn(email, password);

	const post = await generatePost();
	const [statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}/edit`);

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload).toMatchObject({});
});

test('Post (Text) content updated successfully.', async () => {
	await logIn(email, password);

	const post = await generatePost({ user, type: 'Text' });
	const { content: newPostContent } = await generatePostData();
	let [statusCode, response] = await makeHttpRequest('PUT', `/post/${post.getId()}`, { content: newPostContent });

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Post updated successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('title')).toBe(true);
	expect(Object.keys(response.payload).includes('content')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(Object.keys(response.payload).includes('category')).toBe(true);
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.content).toBe(newPostContent);
	expect(response.payload.content).not.toBe(post.getContent());
	expect(response.payload.user.id).toBe(post.getUser().getId());
	expect(response.payload.category.id).toBe(post.getCategory().getId());

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.payload.content).toBe(newPostContent);
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).not.toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('Post not updated while not logged in.', async () => {
	const post = await generatePost();
	const { content: newPostContent } = await generatePostData();
	const [statusCode, response] = await makeHttpRequest('PUT', `/post/${post.getId()}`, { content: newPostContent });

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot update Post: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Post (Text) not updated with non-existant ID.', async () => {
	await logIn(email, password);

	const postId = await generateRandomId();
	const { content: newPostContent } = await generatePostData();
	const [statusCode, response] = await makeHttpRequest('PUT', `/post/${postId}`, { content: newPostContent });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot update Post: Post does not exist with ID ${postId}.`);
	expect(response.payload).toMatchObject({});
});

test('Post (Text) not updated with blank content.', async () => {
	await logIn(email, password);

	const post = await generatePost({ user, type: 'Text' });
	const [statusCode, response] = await makeHttpRequest('PUT', `/post/${post.getId()}`, { content: '' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot update Post: No update parameters were provided.');
	expect(response.payload).toMatchObject({});
});

test('Post (URL) not updated.', async () => {
	await logIn(email, password);

	const post = await generatePost({ user, type: 'URL' });
	const [statusCode, response] = await makeHttpRequest('PUT', `/post/${post.getId()}`, { content: 'https://pokemon.com' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot update Post: Only text posts are editable.');
	expect(response.payload).toMatchObject({});
});

test('Post deleted successfully.', async () => {
	await logIn(email, password);

	const post = await generatePost({ user });
	let [statusCode, response] = await makeHttpRequest('DELETE', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Post deleted successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('title')).toBe(true);
	expect(Object.keys(response.payload).includes('content')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(Object.keys(response.payload).includes('category')).toBe(true);
	expect(response.payload.id).toBe(post.getId());
	expect(response.payload.title).toBe(post.getTitle());
	expect(response.payload.content).toBe(post.getContent());
	expect(response.payload.user.id).toBe(post.getUser().getId());
	expect(response.payload.category.id).toBe(post.getCategory().getId());

	[statusCode, response] = await makeHttpRequest('GET', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.payload.title).toBe(post.getTitle());
	expect(response.payload.content).toBe(post.getContent());
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).not.toBeNull();
});

test('Post not deleted while not logged in.', async () => {
	const postId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('DELETE', `/post/${postId}`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot delete Post: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Post not deleted with non-existant ID.', async () => {
	await logIn(email, password);

	const postId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('DELETE', `/post/${postId}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe(`Cannot delete Post: Post does not exist with ID ${postId}.`);
	expect(response.payload).toMatchObject({});
});

test('Post not deleted by another user.', async () => {
	await logIn(email, password);

	const post = await generatePost();
	const [statusCode, response] = await makeHttpRequest('DELETE', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.message).toBe('Cannot delete Post: You cannot delete a post created by someone other than yourself.');
	expect(response.payload).toMatchObject({});
});

test('Deleted post not updated.', async () => {
	await logIn(email, password);

	const post = await generatePost({ user, type: 'Text' });

	await makeHttpRequest('DELETE', `/post/${post.getId()}`);

	const newPostData = await generatePostData();
	const [statusCode, response] = await makeHttpRequest('PUT', `/post/${post.getId()}`, newPostData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot update Post: You cannot update a post that has been deleted.');
	expect(response.payload).toMatchObject({});
});

test('Deleted post not deleted.', async () => {
	await logIn(email, password);

	const post = await generatePost({ user });

	await makeHttpRequest('DELETE', `/post/${post.getId()}`);

	const [statusCode, response] = await makeHttpRequest('DELETE', `/post/${post.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot delete Post: You cannot delete a post that has been deleted.');
	expect(response.payload).toMatchObject({});
});

afterAll(async () => {
	await truncateDatabase();
});
