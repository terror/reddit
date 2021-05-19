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

test('Post was up voted successfully.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/upvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was up voted successfully!');

	request = new Request('GET', `/user/${user.getId()}/postvotes`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

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

test('Post was down voted successfully.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/downvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was down voted successfully!');

	request = new Request('GET', `/user/${user.getId()}/postvotes`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

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

test('Post was unvoted successfully.', async () => {
	await post.upVote(user.getId());
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/unvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post was unvoted successfully!');

	request = new Request('GET', `/user/${user.getId()}/postvotes`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's post votes were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(0);
});

test('Post was not upvoted while not logged in.', async () => {
	const request = new Request('GET', `/post/${post.getId()}/upvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot up vote Post: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post was not downvoted while not logged in.', async () => {
	const request = new Request('GET', `/post/${post.getId()}/downvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot down vote Post: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post was not unvoted while not logged in.', async () => {
	const request = new Request('GET', `/post/${post.getId()}/unvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot unvote Post: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post was up voted then down voted.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/upvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);

	request = new Request('GET', `/post/${post.getId()}/downvote`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);
});

test('Post was down voted then up voted.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/downvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);

	request = new Request('GET', `/post/${post.getId()}/upvote`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('Post was up voted then unvoted.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/upvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);

	request = new Request('GET', `/post/${post.getId()}/unvote`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('Post was down voted then unvoted.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/post/${post.getId()}/downvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);

	request = new Request('GET', `/post/${post.getId()}/unvote`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	request = new Request('GET', `/post/${post.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Post retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Post);
	expect(response.getPayload().getId()).toBe(post.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('Post was not up voted twice by the same user.', async () => {
	await post.upVote(user.getId());
	await logIn(email, password, session);

	const request = new Request('GET', `/post/${post.getId()}/upvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot up vote Post: Post has already been up voted.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post was not down voted twice by the same user.', async () => {
	await post.downVote(user.getId());
	await logIn(email, password, session);

	const request = new Request('GET', `/post/${post.getId()}/downvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot down vote Post: Post has already been down voted.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post was not unvoted twice by the same user.', async () => {
	await post.downVote(user.getId());
	await post.unvote(user.getId());
	await logIn(email, password, session);

	const request = new Request('GET', `/post/${post.getId()}/unvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot unvote Post: Post must first be up or down voted.');
	expect(response.getPayload()).toMatchObject({});
});

test('Post was not unvoted before being voted on.', async () => {
	await logIn(email, password, session);

	const request = new Request('GET', `/post/${post.getId()}/unvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot unvote Post: Post must first be up or down voted.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was up voted successfully.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was up voted successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentvotes`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

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

test('Comment was down voted successfully.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was down voted successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentvotes`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

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

test('Comment was unvoted successfully.', async () => {
	await comment.upVote(user.getId());
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment was unvoted successfully!');

	request = new Request('GET', `/user/${user.getId()}/commentvotes`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe("User's comment votes were retrieved successfully!");
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(0);
});

test('Comment was not upvoted while not logged in.', async () => {
	const request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot up vote Comment: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was not downvoted while not logged in.', async () => {
	const request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot down vote Comment: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was not unvoted while not logged in.', async () => {
	const request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot unvote Comment: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was up voted then down voted.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);

	request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);
});

test('Comment was down voted then up voted.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);

	request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('Comment was up voted then unvoted.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(1);
	expect(response.getPayload().getDownvotes()).toBe(0);

	request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('Comment was down voted then unvoted.', async () => {
	await logIn(email, password, session);

	let request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(1);

	request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	request = new Request('GET', `/comment/${comment.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Comment retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Comment);
	expect(response.getPayload().getId()).toBe(comment.getId());
	expect(response.getPayload().getUpvotes()).toBe(0);
	expect(response.getPayload().getDownvotes()).toBe(0);
});

test('Comment was not up voted twice by the same user.', async () => {
	await comment.upVote(user.getId());
	await logIn(email, password, session);

	const request = new Request('GET', `/comment/${comment.getId()}/upvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot up vote Comment: Comment has already been up voted.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was not down voted twice by the same user.', async () => {
	await comment.downVote(user.getId());
	await logIn(email, password, session);

	const request = new Request('GET', `/comment/${comment.getId()}/downvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot down vote Comment: Comment has already been down voted.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was not unvoted twice by the same user.', async () => {
	await comment.downVote(user.getId());
	await comment.unvote(user.getId());
	await logIn(email, password, session);

	const request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot unvote Comment: Comment must first be up or down voted.');
	expect(response.getPayload()).toMatchObject({});
});

test('Comment was not unvoted before being voted on.', async () => {
	await logIn(email, password, session);

	const request = new Request('GET', `/comment/${comment.getId()}/unvote`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot unvote Comment: Comment must first be up or down voted.');
	expect(response.getPayload()).toMatchObject({});
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
