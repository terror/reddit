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

test('PostController up voted a post successfully.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/upvote`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was up voted successfully!');

	request = new Request('GET', `/user/${user.getId()}/postvotes`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's post votes were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(1);
	expect(response.getPayload()[0]).toBeInstanceOf(Post);
	expect(response.getPayload()[0].getId()).toBe(post.getId());
	expect(response.getPayload()[0].getUpvotes()).toBe(1);
	expect(response.getPayload()[0].getDownvotes()).toBe(0);
});

test('PostController down voted a post successfully.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/downvote`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was down voted successfully!');

	request = new Request('GET', `/user/${user.getId()}/postvotes`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's post votes were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(1);
	expect(response.getPayload()[0]).toBeInstanceOf(Post);
	expect(response.getPayload()[0].getId()).toBe(post.getId());
	expect(response.getPayload()[0].getUpvotes()).toBe(0);
	expect(response.getPayload()[0].getDownvotes()).toBe(1);
});

test('PostController unvoted a post successfully.', async () => {
	const post = await generatePost();

	await post.upVote(user.getId());

	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/unvote`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was unvoted successfully!');

	request = new Request('GET', `/user/${user.getId()}/postvotes`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's post votes were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(0);
});

test('PostController threw an exception handling an upvote request while not logged in.', async () => {
	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}/upvote`);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot up vote Post: You must be logged in.',
	});
});

test('PostController threw an exception handling a downvote request while not logged in.', async () => {
	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}/downvote`);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot down vote Post: You must be logged in.',
	});
});

test('PostController threw an exception handling an unvote request while not logged in.', async () => {
	const post = await generatePost();
	const request = new Request('GET', `/post/${post.getId()}/unvote`);
	const controller = new PostController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'PostException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot unvote Post: You must be logged in.',
	});
});

test('PostController up voted then down voted.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/upvote`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);

	request = new Request('GET', `/post/${post.getId()}/downvote`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);
});

test('PostController down voted then up voted.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/downvote`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);

	request = new Request('GET', `/post/${post.getId()}/upvote`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('PostController up voted then unvoted.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/upvote`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);

	request = new Request('GET', `/post/${post.getId()}/unvote`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('PostController down voted then unvoted.', async () => {
	const post = await generatePost();

	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/downvote`);
	let controller = new PostController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);

	request = new Request('GET', `/post/${post.getId()}/unvote`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	request = new Request('GET', `/post/${post.getId()}`);
	controller = new PostController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('CommentController up voted a post successfully.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was up voted successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentvotes`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's comment votes were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(1);
	expect(response.getPayload()[0]).toBeInstanceOf(Comment);
	expect(response.getPayload()[0].getId()).toBe(comment.getId());
	expect(response.getPayload()[0].getUpvotes()).toBe(1);
	expect(response.getPayload()[0].getDownvotes()).toBe(0);
});

test('CommentController down voted a comment successfully.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was down voted successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentvotes`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's comment votes were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(1);
	expect(response.getPayload()[0]).toBeInstanceOf(Comment);
	expect(response.getPayload()[0].getId()).toBe(comment.getId());
	expect(response.getPayload()[0].getUpvotes()).toBe(0);
	expect(response.getPayload()[0].getDownvotes()).toBe(1);
});

test('CommentController unvoted a comment successfully.', async () => {
	const comment = await generateComment();

	await comment.upVote(user.getId());

	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was unvoted successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentvotes`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's comment votes were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(0);
});

test('CommentController threw an exception handling an upvote request while not logged in.', async () => {
	const comment = await generateComment();
	const request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot up vote Comment: You must be logged in.',
	});
});

test('CommentController threw an exception handling a downvote request while not logged in.', async () => {
	const comment = await generateComment();
	const request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot down vote Comment: You must be logged in.',
	});
});

test('CommentController threw an exception handling an unvote request while not logged in.', async () => {
	const comment = await generateComment();
	const request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	const controller = new CommentController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CommentException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot unvote Comment: You must be logged in.',
	});
});

test('CommentController up voted then down voted.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);

	request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);
});

test('CommentController down voted then up voted.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);

	request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('CommentController up voted then unvoted.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);

	request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('CommentController down voted then unvoted.', async () => {
	const comment = await generateComment();

	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	let controller = new CommentController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);

	request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	request = new Request('GET', `/comment/${comment.getId()}`);
	controller = new CommentController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
