const User = require('../../src/models/User');
const {
	generateUserData,
	generateUser,
	generateRandomId,
	truncateDatabase,
} = require('../TestHelper');

let initialUserId;

beforeEach(async () => {
	initialUserId = await generateRandomId();
	await truncateDatabase(['user'], initialUserId);
});

test('User logged in successfully.', async () => {
	const { username, email, password } = generateUserData();
	await generateUser(username, email, password);
	const user = await User.logIn(email, password);

	expect(user).toBeInstanceOf(User);
	expect(user.getId()).toBe(initialUserId);
	expect(user.getUsername()).toBe(username);
	expect(user.getEmail()).toBe(email);
});

test('User not logged in with blank email.', async () => {
	const { password } = generateUserData();

	await expect(User.logIn('', password)).rejects.toMatchObject({
		name: 'AuthException',
		message: 'Cannot log in: Missing email.',
	});
});

test('User not logged in with blank password.', async () => {
	const { email } = generateUserData();

	await expect(User.logIn(email, '')).rejects.toMatchObject({
		name: 'AuthException',
		message: 'Cannot log in: Missing password.',
	});
});

test('User not logged in with wrong email.', async () => {
	const { username, email, password } = generateUserData();
	await generateUser(username, email, password);
	const user = await User.logIn(`${email}.com`, password);

	expect(user).toBeNull();
});

test('User not logged in with wrong password.', async () => {
	const { username, email, password } = generateUserData();
	await generateUser(username, email, password);
	const user = await User.logIn(email, `${password}123`);

	expect(user).toBeNull();
});

afterAll(async () => {
	await truncateDatabase();
});
