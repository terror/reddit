const Request = require('../../src/router/Request');
const Router = require('../../src/router/Router');
const JsonResponse = require('../../src/router/JsonResponse');
const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	getSession,
	stopSession,
	truncateDatabase,
} = require('./RouterTestHelper');

let session;
let username;
let email;
let password;
let user;

beforeEach(async () => {
	session = getSession();

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);
});

test('AuthController set session on login.', async () => {
	const request = new Request('POST', '/auth/login', { email, password });
	const router = new Router(request, new JsonResponse(), session);

	await router.dispatch();

	expect(getSession(session.getId()).exists('user_id')).toBe(true);
	expect(getSession(session.getId()).get('user_id')).toBe(user.getId());
});

test('AuthController threw exception logging in with blank email.', async () => {
	const request = new Request('POST', '/auth/login', { email: '', password });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot log in: Missing email.');
	expect(response.getPayload()).toMatchObject({});
	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

test('AuthController threw exception logging in with blank password.', async () => {
	const request = new Request('POST', '/auth/login', { email, password: '' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot log in: Missing password.');
	expect(response.getPayload()).toMatchObject({});
	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

test('AuthController threw exception logging in with wrong email.', async () => {
	const request = new Request('POST', '/auth/login', { email: `${email}.com`, password });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot log in: Invalid credentials.');
	expect(response.getPayload()).toMatchObject({});
	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

test('AuthController threw exception logging in with wrong password.', async () => {
	const request = new Request('POST', '/auth/login', { email, password: `${password}123` });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot log in: Invalid credentials.');
	expect(response.getPayload()).toMatchObject({});
	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

test('AuthController destroyed session on logout.', async () => {
	let request = new Request('POST', '/auth/login', { email, password });
	let router = new Router(request, new JsonResponse(), session);

	await router.dispatch();

	expect(getSession(session.getId()).exists('user_id')).toBe(true);
	expect(getSession(session.getId()).get('user_id')).toBe(user.getId());

	request = new Request('GET', '/auth/logout');
	router = new Router(request, new JsonResponse(), session);

	await router.dispatch();

	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
