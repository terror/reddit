const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	generatePost,
	generateComment,
	generateCommentData,
	generateRandomId,
	makeHttpRequest,
	truncateDatabase,
	logIn,
	clearCookieJar,
} = require('./HttpTestHelper');

let initialCommentId;
let username;
let email;
let password;
let user;
let post;

beforeEach(async () => {
	initialCommentId = await generateRandomId();
	await truncateDatabase(['comment'], initialCommentId);

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);
	post = await generatePost(user);

	clearCookieJar();
});

test('Comment created successfully.', async () => {
	await logIn(email, password);

	const commentData = await generateCommentData(user, post);
	const [statusCode, response] = await makeHttpRequest('POST', '/comment', commentData);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Comment created successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('content')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(Object.keys(response.payload).includes('post')).toBe(true);
	expect(response.payload.id).toBe(initialCommentId);
	expect(response.payload.content).toBe(commentData.content);
	expect(response.payload.user.id).toBe(commentData.userId);
	expect(response.payload.post.id).toBe(commentData.postId);
	expect(response.payload.createdAt).toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('Comment not created while not logged in.', async () => {
	const commentData = await generateCommentData();
	const [statusCode, response] = await makeHttpRequest('POST', '/comment', commentData);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot create Comment: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Comment not created with non-existant post.', async () => {
	await logIn(email, password);

	const commentData = await generateCommentData();
	commentData.postId = await generateRandomId('post');
	const [statusCode, response] = await makeHttpRequest('POST', '/comment', commentData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot create Comment: Post does not exist with ID ${commentData.postId}.`);
	expect(response.payload).toMatchObject({});
});

test('Comment not created with blank content.', async () => {
	await logIn(email, password);

	const commentData = await generateCommentData(null, null, '');
	const [statusCode, response] = await makeHttpRequest('POST', '/comment', commentData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create Comment: Missing content.');
	expect(response.payload).toMatchObject({});
});

test('Comment found by ID.', async () => {
	const comment = await generateComment();
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Comment retrieved successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('content')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(Object.keys(response.payload).includes('post')).toBe(true);
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.content).toBe(comment.getContent());
	expect(response.payload.user.id).toBe(comment.getUser().getId());
	expect(response.payload.post.id).toBe(comment.getPost().getId());
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('Comment not found by wrong ID.', async () => {
	const commentId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${commentId}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot retrieve Comment: Comment does not exist with ID ${commentId}.`);
	expect(response.payload).toMatchObject({});
});

test('Comment edit form was retrieved.', async () => {
	await logIn(email, password);

	const comment = await generateComment({ user });
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/edit`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload.id).toBe(comment.getId());
});

test('Comment edit form was not retrieved while not logged in.', async () => {
	const comment = await generateComment();
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/edit`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload).toMatchObject({});
});

test('Comment edit form was not retrieved with non-existant ID.', async () => {
	await logIn(email, password);

	const commentId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${commentId}/edit`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload).toMatchObject({});
});

test('Comment edit form was not retrieved by another user.', async () => {
	await logIn(email, password);

	const comment = await generateComment();
	const [statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}/edit`);

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload).toMatchObject({});
});

test('Comment updated successfully.', async () => {
	await logIn(email, password);

	const comment = await generateComment({ user });
	const { content: newCommentContent } = await generateCommentData();
	let [statusCode, response] = await makeHttpRequest('PUT', `/comment/${comment.getId()}`, { content: newCommentContent });

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Comment updated successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('content')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(Object.keys(response.payload).includes('post')).toBe(true);
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.content).toBe(newCommentContent);
	expect(response.payload.content).not.toBe(comment.getContent());
	expect(response.payload.user.id).toBe(comment.getUser().getId());
	expect(response.payload.post.id).toBe(comment.getPost().getId());

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.payload.content).toBe(newCommentContent);
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).not.toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('Comment not updated while not logged in.', async () => {
	const commentId = await generateRandomId();
	const { content: newCommentContent } = await generateCommentData();
	const [statusCode, response] = await makeHttpRequest('PUT', `/comment/${commentId}`, { content: newCommentContent });

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot update Comment: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Comment not updated with non-existant ID.', async () => {
	await logIn(email, password);

	const commentId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('PUT', `/comment/${commentId}`, { content: 'New content!' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot update Comment: Comment does not exist with ID ${commentId}.`);
	expect(response.payload).toMatchObject({});
});

test('Comment not updated by another user.', async () => {
	await logIn(email, password);

	const comment = await generateComment();
	const { content: newCommentContent } = await generateCommentData();
	const [statusCode, response] = await makeHttpRequest('PUT', `/comment/${comment.getId()}`, { content: newCommentContent });

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.message).toBe('Cannot update Comment: You cannot update a comment created by someone other than yourself.');
	expect(response.payload).toMatchObject({});
});

test('Comment not updated with blank content.', async () => {
	await logIn(email, password);

	const comment = await generateComment({ user });
	const [statusCode, response] = await makeHttpRequest('PUT', `/comment/${comment.getId()}`, { content: '' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot update Comment: No update parameters were provided.');
	expect(response.payload).toMatchObject({});
});

test('Comment deleted successfully.', async () => {
	await logIn(email, password);

	const comment = await generateComment({ user });
	let [statusCode, response] = await makeHttpRequest('DELETE', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Comment deleted successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('content')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(Object.keys(response.payload).includes('post')).toBe(true);
	expect(response.payload.id).toBe(comment.getId());
	expect(response.payload.content).toBe(comment.getContent());
	expect(response.payload.user.id).toBe(comment.getUser().getId());
	expect(response.payload.post.id).toBe(comment.getPost().getId());

	[statusCode, response] = await makeHttpRequest('GET', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.payload.content).toBe(comment.getContent());
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).not.toBeNull();
});

test('Comment not deleted while not logged in.', async () => {
	const commentId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('DELETE', `/comment/${commentId}`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot delete Comment: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Comment not deleted with non-existant ID.', async () => {
	await logIn(email, password);

	const commentId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('DELETE', `/comment/${commentId}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot delete Comment: Comment does not exist with ID ${commentId}.`);
	expect(response.payload).toMatchObject({});
});

test('Comment not deleted by another user.', async () => {
	await logIn(email, password);

	const comment = await generateComment();
	const [statusCode, response] = await makeHttpRequest('DELETE', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.message).toBe('Cannot delete Comment: You cannot delete a comment created by someone other than yourself.');
	expect(response.payload).toMatchObject({});
});

test('Deleted comment not updated.', async () => {
	await logIn(email, password);

	const comment = await generateComment({ user });

	await makeHttpRequest('DELETE', `/comment/${comment.getId()}`);

	const newCommentData = await generateCommentData();
	const [statusCode, response] = await makeHttpRequest('PUT', `/comment/${comment.getId()}`, newCommentData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot update Comment: You cannot update a comment that has been deleted.');
	expect(response.payload).toMatchObject({});
});

test('Deleted comment not deleted.', async () => {
	await logIn(email, password);

	const comment = await generateComment({ user });

	await makeHttpRequest('DELETE', `/comment/${comment.getId()}`);

	const [statusCode, response] = await makeHttpRequest('DELETE', `/comment/${comment.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot delete Comment: You cannot delete a comment that has been deleted.');
	expect(response.payload).toMatchObject({});
});

afterAll(async () => {
	await truncateDatabase();
});
