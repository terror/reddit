const Request = require('../../src/router/Request');
const JsonResponse = require('../../src/router/JsonResponse');
const User = require('../../src/models/User');
const UserController = require('../../src/controllers/UserController');
const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	generateRandomId,
	truncateDatabase,
	logIn,
	getSession,
	stopSession,
} = require('./ControllerTestHelper');

let initialUserId;
let session;

beforeEach(async () => {
	initialUserId = await generateRandomId();
	await truncateDatabase(['user'], initialUserId);

	session = getSession();
});

test('UserController handled a POST request.', async () => {
	const userData = generateUserData();
	const request = new Request('POST', '/user', userData);
	const controller = new UserController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('User created successfully!');
	expect(response.getPayload()).toBeInstanceOf(User);
	expect(response.getPayload().getId()).toBe(initialUserId);
	expect(response.getPayload().getUsername()).toBe(userData.username);
	expect(response.getPayload().getEmail()).toBe(userData.email);
});

test('UserController handled a GET (all) request with no users in database.', async () => {
	const request = new Request('GET', '/user');
	const controller = new UserController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Users retrieved successfully!');
	expect(Array.isArray(response.getPayload()));
	expect(response.getPayload().length).toBe(0);
});

test('UserController handled a GET (all) request with 3 users in database.', async () => {
	await generateUser();
	await generateUser();
	await generateUser();

	const request = new Request('GET', '/user');
	const controller = new UserController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Users retrieved successfully!');
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(3);
	expect(response.getPayload()[0]).toBeInstanceOf(User);
	expect(response.getPayload()[1]).toBeInstanceOf(User);
	expect(response.getPayload()[2]).toBeInstanceOf(User);
});

test('UserController handled a GET (one) request.', async () => {
	const user = await generateUser();
	const request = new Request('GET', `/user/${user.getId()}`);
	const controller = new UserController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('User retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(User);
	expect(response.getPayload().getId()).toBe(user.getId());
	expect(response.getPayload().getUsername()).toBe(user.getUsername());
	expect(response.getPayload().getEmail()).toBe(user.getEmail());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('UserController threw an exception handling a GET request with non-existant ID.', async () => {
	const userId = await generateRandomId();
	const request = new Request('GET', `/user/${userId}`);
	const controller = new UserController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'UserException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot retrieve User: User does not exist with ID ${userId}.`,
	});
});

test('UserController handled a PUT request.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);
	const newUserData = generateUserData();

	await logIn(email, password, session);

	let request = new Request('PUT', `/user/${user.getId()}`, newUserData);
	let controller = new UserController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('User updated successfully!');
	expect(response.getPayload()).toBeInstanceOf(User);
	expect(response.getPayload().getId()).toBe(user.getId());
	expect(response.getPayload().getUsername()).toBe(newUserData.username);
	expect(response.getPayload().getEmail()).toBe(newUserData.email);
	expect(response.getPayload().getUsername()).not.toBe(user.getUsername());
	expect(response.getPayload().getEmail()).not.toBe(user.getEmail());

	request = new Request('GET', `/user/${user.getId()}`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getUsername()).toBe(newUserData.username);
	expect(response.getPayload().getEmail()).toBe(newUserData.email);
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('UserController threw an exception handling a PUT request while not logged in.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);
	const newUserData = generateUserData();
	const request = new Request('PUT', `/user/${user.getId()}`, newUserData);
	const controller = new UserController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'UserException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot update User: You must be logged in.',
	});
});

test('UserController threw an exception handling a PUT request from another user.', async () => {
	const userA = await generateUser();
	const userDataB = generateUserData();
	await generateUser(userDataB.username, userDataB.email, userDataB.password);
	const newUserData = generateUserData();

	await logIn(userDataB.email, userDataB.password, session);

	const request = new Request('PUT', `/user/${userA.getId()}`, newUserData);
	const controller = new UserController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'UserException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot update User: You cannot update a user other than yourself.',
	});
});

test('UserController threw an exception handling a PUT request with no update fields.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	await logIn(email, password, session);

	const request = new Request('PUT', `/user/${user.getId()}`, {
		username: '',
		email: '',
		password: '',
		avatar: '',
	});
	const controller = new UserController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'UserException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: 'Cannot update User: No update parameters were provided.',
	});
});

test('UserController handled a DELETE request.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	await logIn(email, password, session);

	let request = new Request('DELETE', `/user/${user.getId()}`);
	let controller = new UserController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('User deleted successfully!');
	expect(response.getPayload()).toBeInstanceOf(User);
	expect(response.getPayload().getId()).toBe(user.getId());
	expect(response.getPayload().getUsername()).toBe(user.getUsername());
	expect(response.getPayload().getEmail()).toBe(user.getEmail());

	request = new Request('GET', `/user/${user.getId()}`);
	controller = new UserController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getUsername()).toBe(user.getUsername());
	expect(response.getPayload().getEmail()).toBe(user.getEmail());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeInstanceOf(Date);
});

test('UserController threw an exception handling a DELETE request while not logged in.', async () => {
	const user = await generateUser();

	const request = new Request('DELETE', `/user/${user.getId()}`);
	const controller = new UserController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'UserException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot delete User: You must be logged in.',
	});
});

test('UserController threw an exception handling a DELETE request for another user.', async () => {
	const userA = await generateUser();
	const userDataB = generateUserData();
	await generateUser(userDataB.username, userDataB.email, userDataB.password);

	await logIn(userDataB.email, userDataB.password, session);

	const request = new Request('DELETE', `/user/${userA.getId()}`);
	const controller = new UserController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'UserException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot delete User: You cannot delete a user other than yourself.',
	});
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
