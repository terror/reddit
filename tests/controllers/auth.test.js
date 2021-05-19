const Request = require('../../src/router/Request');
const JsonResponse = require('../../src/router/JsonResponse');
const AuthController = require('../../src/controllers/AuthController');
const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	getSession,
	stopSession,
	truncateDatabase,
} = require('./ControllerTestHelper');

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
	const controller = new AuthController(request, new JsonResponse(), session);

	await controller.doAction();

	expect(getSession(session.getId()).exists('user_id')).toBe(true);
	expect(getSession(session.getId()).get('user_id')).toBe(user.getId());
});

test('AuthController threw exception logging in with blank email.', async () => {
	const request = new Request('POST', '/auth/login', { email: '', password });
	const controller = new AuthController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'AuthException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: 'Cannot log in: Missing email.',
	});
	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

test('AuthController threw exception logging in with blank password.', async () => {
	const request = new Request('POST', '/auth/login', { email, password: '' });
	const controller = new AuthController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'AuthException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: 'Cannot log in: Missing password.',
	});
	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

test('AuthController threw exception logging in with wrong email.', async () => {
	const request = new Request('POST', '/auth/login', { email: `${email}.com`, password });
	const controller = new AuthController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'AuthException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: 'Cannot log in: Invalid credentials.',
	});
	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

test('AuthController threw exception logging in with wrong password.', async () => {
	const request = new Request('POST', '/auth/login', { email, password: `${password}123` });
	const controller = new AuthController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'AuthException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: 'Cannot log in: Invalid credentials.',
	});
	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

test('AuthController destroyed session on logout.', async () => {
	let request = new Request('POST', '/auth/login', { email, password });
	let controller = new AuthController(request, new JsonResponse(), session);

	await controller.doAction();

	expect(getSession(session.getId()).exists('user_id')).toBe(true);
	expect(getSession(session.getId()).get('user_id')).toBe(user.getId());

	request = new Request('GET', '/auth/logout');
	controller = new AuthController(request, new JsonResponse(), session);

	await controller.doAction();

	expect(getSession(session.getId()).exists('user_id')).toBe(false);
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
