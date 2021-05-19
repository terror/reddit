const Router = require('../../src/router/Router');
const Request = require('../../src/router/Request');
const JsonResponse = require('../../src/router/JsonResponse');
const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUsers,
	generateUserData,
	generateRandomId,
	truncateDatabase,
	logIn,
	getSession,
	stopSession,
} = require('./RouterTestHelper');

let initialUserId;
let session;

beforeEach(async () => {
	initialUserId = await generateRandomId();
	await truncateDatabase(['user'], initialUserId);

	session = getSession();
});

test('Homepage was retrieved successfully.', async () => {
	const request = new Request('GET', '/');
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Homepage!');
	expect(response.getPayload()).toMatchObject({});
});

test('Invalid path returned error.', async () => {
	const request = new Request('GET', '/userr');
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.NOT_FOUND);
	expect(response.getMessage()).toBe('Invalid request path!');
	expect(response.getPayload()).toMatchObject({});
});

test('Invalid request method returned error.', async () => {
	const request = new Request('PATCH', '/user');
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.METHOD_NOT_ALLOWED);
	expect(response.getMessage()).toBe('Invalid request method!');
	expect(response.getPayload()).toMatchObject({});
});

test('User created successfully.', async () => {
	const userData = generateUserData();
	const request = new Request('POST', '/user', userData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('User created successfully!');
	expect(response.getPayload().getId()).toBe(initialUserId);
	expect(response.getPayload().getUsername()).toBe(userData.username);
	expect(response.getPayload().getEmail()).toBe(userData.email);
	expect(response.getPayload().getCreatedAt()).toBeNull();
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('User not created with blank username.', async () => {
	const userData = await generateUserData('');
	const request = new Request('POST', '/user', userData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot create User: Missing username.');
	expect(response.getPayload()).toMatchObject({});
});

test('User not created with blank email.', async () => {
	const userData = await generateUserData(null, '');
	const request = new Request('POST', '/user', userData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot create User: Missing email.');
	expect(response.getPayload()).toMatchObject({});
});

test('User not created with blank password.', async () => {
	const userData = await generateUserData(null, null, '');
	const request = new Request('POST', '/user', userData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot create User: Missing password.');
	expect(response.getPayload()).toMatchObject({});
});

test('User not created with duplicate username.', async () => {
	const user = await generateUser();
	const userData = await generateUserData(user.getUsername());
	const request = new Request('POST', '/user', userData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot create User: Duplicate username.');
	expect(response.getPayload()).toMatchObject({});
});

test('User not created with duplicate email.', async () => {
	const user = await generateUser();
	const userData = await generateUserData(null, user.getEmail());
	const request = new Request('POST', '/user', userData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot create User: Duplicate email.');
	expect(response.getPayload()).toMatchObject({});
});

test('All users found.', async () => {
	const users = await generateUsers();
	const request = new Request('GET', '/user');
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Users retrieved successfully!');
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(users.length);

	response.getPayload().forEach((user, index) => {
		expect(user.getId()).toBe(users[index].getId());
		expect(user.getUsername()).toBe(users[index].getUsername());
		expect(user.getEmail()).toBe(users[index].getEmail());
		expect(user.getCreatedAt()).not.toBeNull();
		expect(user.getEditedAt()).toBeNull();
		expect(user.getDeletedAt()).toBeNull();
	});
});

test('User found by ID.', async () => {
	const user = await generateUser();
	const request = new Request('GET', `/user/${user.getId()}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('User retrieved successfully!');
	expect(Object.keys(response.getPayload()).includes('id')).toBe(true);
	expect(Object.keys(response.getPayload()).includes('username')).toBe(true);
	expect(Object.keys(response.getPayload()).includes('email')).toBe(true);
	expect(response.getPayload().getId()).toBe(user.getId());
	expect(response.getPayload().getUsername()).toBe(user.getUsername());
	expect(response.getPayload().getEmail()).toBe(user.getEmail());
	expect(response.getPayload().getCreatedAt()).not.toBeNull();
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('User not found by wrong ID.', async () => {
	const userId = await generateRandomId();
	const request = new Request('GET', `/user/${userId}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe(`Cannot retrieve User: User does not exist with ID ${userId}.`);
	expect(response.getPayload()).toMatchObject({});
});

test('User updated successfully.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);
	const newUserData = generateUserData();

	await logIn(email, password, session);

	let request = new Request('PUT', `/user/${user.getId()}`, newUserData);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('User updated successfully!');
	expect(response.getPayload().getId()).toBe(user.getId());
	expect(response.getPayload().getUsername()).toBe(newUserData.username);
	expect(response.getPayload().getEmail()).toBe(newUserData.email);
	expect(response.getPayload().getUsername()).not.toBe(user.username);
	expect(response.getPayload().getEmail()).not.toBe(user.email);

	request = new Request('GET', `/user/${user.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getUsername()).toBe(newUserData.username);
	expect(response.getPayload().getEmail()).toBe(newUserData.email);
	expect(response.getPayload().getCreatedAt()).not.toBeNull();
	expect(response.getPayload().getEditedAt()).not.toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('User not updated while not logged in.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);
	const newUserData = generateUserData();
	const request = new Request('PUT', `/user/${user.getId()}`, newUserData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot update User: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('User not updated by another user.', async () => {
	const userA = await generateUser();
	const userDataB = generateUserData();
	await generateUser(userDataB.username, userDataB.email, userDataB.password);
	const newUserData = generateUserData();

	await logIn(userDataB.email, userDataB.password, session);

	const request = new Request('PUT', `/user/${userA.getId()}`, newUserData);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.getMessage()).toBe('Cannot update User: You cannot update a user other than yourself.');
	expect(response.getPayload()).toMatchObject({});
});

test('User not updated with blank username.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	await logIn(email, password, session);

	const request = new Request('PUT', `/user/${user.getId()}`, { username: '' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot update User: No update parameters were provided.');
	expect(response.getPayload()).toMatchObject({});
});

test('User not updated with blank email.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	await logIn(email, password, session);

	const request = new Request('PUT', `/user/${user.getId()}`, { email: '' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot update User: No update parameters were provided.');
	expect(response.getPayload()).toMatchObject({});
});

test('User not updated with blank password.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	await logIn(email, password, session);

	const request = new Request('PUT', `/user/${user.getId()}`, { password: '' });
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.getMessage()).toBe('Cannot update User: No update parameters were provided.');
	expect(response.getPayload()).toMatchObject({});
});

test('User deleted successfully.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	await logIn(email, password, session);

	let request = new Request('DELETE', `/user/${user.getId()}`);
	let router = new Router(request, new JsonResponse(), session);
	let response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('User deleted successfully!');
	expect(Object.keys(response.getPayload()).includes('id')).toBe(true);
	expect(Object.keys(response.getPayload()).includes('username')).toBe(true);
	expect(Object.keys(response.getPayload()).includes('email')).toBe(true);
	expect(response.getPayload().getId()).toBe(user.getId());
	expect(response.getPayload().getUsername()).toBe(user.getUsername());
	expect(response.getPayload().getEmail()).toBe(user.getEmail());
	expect(getSession(session.getId()).exists('user_id')).toBe(false);

	request = new Request('GET', `/user/${user.getId()}`);
	router = new Router(request, new JsonResponse(), session);
	response = await router.dispatch();

	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getUsername()).toBe(user.getUsername());
	expect(response.getPayload().getEmail()).toBe(user.getEmail());
	expect(response.getPayload().getCreatedAt()).not.toBeNull();
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).not.toBeNull();
});

test('User not deleted while not logged in.', async () => {
	const user = await generateUser();

	const request = new Request('DELETE', `/user/${user.getId()}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.getMessage()).toBe('Cannot delete User: You must be logged in.');
	expect(response.getPayload()).toMatchObject({});
});

test('User not deleted by another user.', async () => {
	const userA = await generateUser();
	const userDataB = generateUserData();
	await generateUser(userDataB.username, userDataB.email, userDataB.password);

	await logIn(userDataB.email, userDataB.password, session);

	const request = new Request('DELETE', `/user/${userA.getId()}`);
	const router = new Router(request, new JsonResponse(), session);
	const response = await router.dispatch();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.getMessage()).toBe('Cannot delete User: You cannot delete a user other than yourself.');
	expect(response.getPayload()).toMatchObject({});
});

afterEach(async () => {
	await truncateDatabase();
	stopSession();
});
