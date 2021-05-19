const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUsers,
	generateUserData,
	generateRandomId,
	makeHttpRequest,
	truncateDatabase,
	logIn,
	clearCookieJar,
} = require('./HttpTestHelper');

let initialUserId;

beforeEach(async () => {
	initialUserId = await generateRandomId();
	await truncateDatabase(['user'], initialUserId);
	clearCookieJar();
});

test('Homepage was retrieved successfully.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', '/');

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Homepage!');
	expect(response.payload).toMatchObject({});
});

test('Invalid path returned error.', async () => {
	const [statusCode, response] = await makeHttpRequest('GET', '/userr');

	expect(statusCode).toBe(HttpStatusCode.NOT_FOUND);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Invalid request path!');
	expect(response.payload).toMatchObject({});
});

test('Invalid request method returned error.', async () => {
	const [statusCode, response] = await makeHttpRequest('PATCH', '/user');

	expect(statusCode).toBe(HttpStatusCode.METHOD_NOT_ALLOWED);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Invalid request method!');
	expect(response.payload).toMatchObject({});
});

test('User created successfully.', async () => {
	const userData = generateUserData();
	const [statusCode, response] = await makeHttpRequest('POST', '/user', userData);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('User created successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('username')).toBe(true);
	expect(Object.keys(response.payload).includes('email')).toBe(true);
	expect(response.payload.id).toBe(initialUserId);
	expect(response.payload.username).toBe(userData.username);
	expect(response.payload.email).toBe(userData.email);
	expect(response.payload.createdAt).toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('User not created with blank username.', async () => {
	const userData = await generateUserData('');
	const [statusCode, response] = await makeHttpRequest('POST', '/user', userData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create User: Missing username.');
	expect(response.payload).toMatchObject({});
});

test('User not created with blank email.', async () => {
	const userData = await generateUserData(null, '');
	const [statusCode, response] = await makeHttpRequest('POST', '/user', userData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create User: Missing email.');
	expect(response.payload).toMatchObject({});
});

test('User not created with blank password.', async () => {
	const userData = await generateUserData(null, null, '');
	const [statusCode, response] = await makeHttpRequest('POST', '/user', userData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create User: Missing password.');
	expect(response.payload).toMatchObject({});
});

test('User not created with duplicate username.', async () => {
	const user = await generateUser();
	const userData = await generateUserData(user.getUsername());
	const [statusCode, response] = await makeHttpRequest('POST', '/user', userData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create User: Duplicate username.');
	expect(response.payload).toMatchObject({});
});

test('User not created with duplicate email.', async () => {
	const user = await generateUser();
	const userData = await generateUserData(null, user.getEmail());
	const [statusCode, response] = await makeHttpRequest('POST', '/user', userData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create User: Duplicate email.');
	expect(response.payload).toMatchObject({});
});

test('All users found.', async () => {
	const users = await generateUsers();
	const [statusCode, response] = await makeHttpRequest('GET', '/user');

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Users retrieved successfully!');
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(users.length);

	response.payload.forEach((user, index) => {
		expect(Object.keys(user).includes('id')).toBe(true);
		expect(Object.keys(user).includes('username')).toBe(true);
		expect(Object.keys(user).includes('email')).toBe(true);
		expect(user.id).toBe(users[index].getId());
		expect(user.username).toBe(users[index].getUsername());
		expect(user.email).toBe(users[index].getEmail());
		expect(user.createdAt).not.toBeNull();
		expect(user.editedAt).toBeNull();
		expect(user.deletedAt).toBeNull();
	});
});

test('User found by ID.', async () => {
	const user = await generateUser();
	const [statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('User retrieved successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('username')).toBe(true);
	expect(Object.keys(response.payload).includes('email')).toBe(true);
	expect(response.payload.id).toBe(user.getId());
	expect(response.payload.username).toBe(user.getUsername());
	expect(response.payload.email).toBe(user.getEmail());
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('User not found by wrong ID.', async () => {
	const userId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('GET', `/user/${userId}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot retrieve User: User does not exist with ID ${userId}.`);
	expect(response.payload).toMatchObject({});
});

test('User updated successfully.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);
	const newUserData = generateUserData();

	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('PUT', `/user/${user.getId()}`, newUserData);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('User updated successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('username')).toBe(true);
	expect(Object.keys(response.payload).includes('email')).toBe(true);
	expect(response.payload.id).toBe(user.getId());
	expect(response.payload.username).toBe(newUserData.username);
	expect(response.payload.email).toBe(newUserData.email);
	expect(response.payload.username).not.toBe(user.getUsername());
	expect(response.payload.email).not.toBe(user.getEmail());

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.payload.username).toBe(newUserData.username);
	expect(response.payload.email).toBe(newUserData.email);
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).not.toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('User not updated while not logged in.', async () => {
	const userId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('PUT', `/user/${userId}`, { username: 'NewUsername' });

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot update User: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('User not updated by another user.', async () => {
	const userA = await generateUser();
	const userDataB = generateUserData();
	await generateUser(userDataB.username, userDataB.email, userDataB.password);
	const newUserData = generateUserData();

	await logIn(userDataB.email, userDataB.password);

	const [statusCode, response] = await makeHttpRequest('PUT', `/user/${userA.getId()}`, newUserData);

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot update User: You cannot update a user other than yourself.');
	expect(response.payload).toMatchObject({});
});

test('User not updated with blank username.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('PUT', `/user/${user.getId()}`, { username: '' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot update User: No update parameters were provided.');
	expect(response.payload).toMatchObject({});
});

test('User not updated with blank email.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	await logIn(email, password);

	const [statusCode, response] = await makeHttpRequest('PUT', `/user/${user.getId()}`, { email: '' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot update User: No update parameters were provided.');
	expect(response.payload).toMatchObject({});
});

test('User deleted successfully.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	await logIn(email, password);

	let [statusCode, response] = await makeHttpRequest('DELETE', `/user/${user.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('User deleted successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('username')).toBe(true);
	expect(Object.keys(response.payload).includes('email')).toBe(true);
	expect(response.payload.id).toBe(user.getId());
	expect(response.payload.username).toBe(user.getUsername());
	expect(response.payload.email).toBe(user.getEmail());

	[statusCode, response] = await makeHttpRequest('GET', `/user/${user.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.payload.username).toBe(user.getUsername());
	expect(response.payload.email).toBe(user.getEmail());
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).not.toBeNull();
});

test('User not deleted while not logged in.', async () => {
	const user = await generateUser();

	const [statusCode, response] = await makeHttpRequest('DELETE', `/user/${user.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot delete User: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('User not deleted by another user.', async () => {
	const userA = await generateUser();
	const userDataB = generateUserData();
	await generateUser(userDataB.username, userDataB.email, userDataB.password);

	await logIn(userDataB.email, userDataB.password);

	const [statusCode, response] = await makeHttpRequest('DELETE', `/user/${userA.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.message).toBe('Cannot delete User: You cannot delete a user other than yourself.');
	expect(response.payload).toMatchObject({});
});

afterAll(async () => {
	await truncateDatabase();
});
