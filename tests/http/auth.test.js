const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	truncateDatabase,
	makeHttpRequest,
	clearCookieJar,
} = require('./HttpTestHelper');

let username;
let email;
let password;

beforeEach(async () => {
	({ username, email, password } = generateUserData());
	await generateUser(username, email, password);
	clearCookieJar();
});

test('AuthController set session on login.', async () => {
	const [statusCode, response] = await makeHttpRequest('POST', '/auth/login', { email, password });

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Logged in successfully!');
	expect(response.payload).toMatchObject({});
});

test('AuthController threw exception logging in with blank email.', async () => {
	const [statusCode, response] = await makeHttpRequest('POST', '/auth/login', { email: '', password });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot log in: Missing email.');
	expect(response.payload).toMatchObject({});
});

test('AuthController threw exception logging in with blank password.', async () => {
	const [statusCode, response] = await makeHttpRequest('POST', '/auth/login', { email, password: '' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot log in: Missing password.');
	expect(response.payload).toMatchObject({});
});

test('AuthController threw exception logging in with wrong email.', async () => {
	const [statusCode, response] = await makeHttpRequest('POST', '/auth/login', { email: `${email}.com`, password });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot log in: Invalid credentials.');
	expect(response.payload).toMatchObject({});
});

test('AuthController threw exception logging in with wrong password.', async () => {
	const [statusCode, response] = await makeHttpRequest('POST', '/auth/login', { email, password: `${password}123` });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot log in: Invalid credentials.');
	expect(response.payload).toMatchObject({});
});

test('AuthController destroyed session on logout.', async () => {
	let [statusCode, response] = await makeHttpRequest('POST', '/auth/login', { email, password });

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Logged in successfully!');
	expect(response.payload).toMatchObject({});

	[statusCode, response] = await makeHttpRequest('GET', '/auth/logout');

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.message).toBe('Logged out successfully!');
	expect(response.payload).toMatchObject({});
});

afterAll(async () => {
	await truncateDatabase();
});
