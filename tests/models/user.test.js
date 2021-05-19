const faker = require('faker');
const User = require('../../src/models/User');
const {
	generateUserData,
	generateUser,
	generateUsers,
	generateRandomId,
	truncateDatabase,
} = require('../TestHelper');

let initialUserId;

beforeEach(async () => {
	initialUserId = await generateRandomId();
	await truncateDatabase(['user'], initialUserId);
});

test('User created successfully.', async () => {
	const { username, email, password } = generateUserData();
	const user = await generateUser(username, email, password);

	expect(user).toBeInstanceOf(User);
	expect(user.getId()).toBe(initialUserId);
	expect(user.getUsername()).toBe(username);
	expect(user.getEmail()).toBe(email);
});

test('User not created with blank username.', async () => {
	await expect(generateUser('')).rejects.toMatchObject({
		name: 'UserException',
		message: 'Cannot create User: Missing username.',
	});
});

test('User not created with blank email.', async () => {
	await expect(generateUser(null, '')).rejects.toMatchObject({
		name: 'UserException',
		message: 'Cannot create User: Missing email.',
	});
});

test('User not created with blank password.', async () => {
	await expect(generateUser(null, null, '')).rejects.toMatchObject({
		name: 'UserException',
		message: 'Cannot create User: Missing password.',
	});
});

test('User not created with duplicate username.', async () => {
	const { username } = generateUserData();

	await generateUser(username);

	await expect(generateUser(username)).rejects.toMatchObject({
		name: 'UserException',
		message: 'Cannot create User: Duplicate username.',
	});
});

test('User not created with duplicate email.', async () => {
	const { email } = generateUserData();

	await generateUser(null, email);

	await expect(generateUser(null, email)).rejects.toMatchObject({
		name: 'UserException',
		message: 'Cannot create User: Duplicate email.',
	});
});

test('All users found.', async () => {
	const users = await generateUsers();
	const retrievedUsers = await User.findAll();

	retrievedUsers.forEach((user, index) => {
		expect(Object.keys(user).includes('id')).toBe(true);
		expect(Object.keys(user).includes('username')).toBe(true);
		expect(Object.keys(user).includes('email')).toBe(true);
		expect(user.getId()).toBe(users[index].getId());
		expect(user.getUsername()).toBe(users[index].getUsername());
		expect(user.getEmail()).toBe(users[index].getEmail());
		expect(user.getUsername()).toMatch(users[index].getUsername());
		expect(user.getCreatedAt()).toBeInstanceOf(Date);
		expect(user.getEditedAt()).toBeNull();
		expect(user.getDeletedAt()).toBeNull();
	});
});

test('User found by ID.', async () => {
	const newUser = await generateUser();
	const retrievedUser = await User.findById(newUser.getId());

	expect(retrievedUser.getUsername()).toMatch(newUser.getUsername());
	expect(retrievedUser.getCreatedAt()).toBeInstanceOf(Date);
	expect(retrievedUser.getEditedAt()).toBeNull();
	expect(retrievedUser.getDeletedAt()).toBeNull();
});

test('User not found by wrong ID.', async () => {
	const newUser = await generateUser();
	const retrievedUser = await User.findById(newUser.getId() + 1);

	expect(retrievedUser).toBeNull();
});

test('User found by email.', async () => {
	const newUser = await generateUser();
	const retrievedUser = await User.findByEmail(newUser.getEmail());

	expect(retrievedUser.getUsername()).toMatch(newUser.getUsername());
});

test('User not found by wrong email.', async () => {
	const newUser = await generateUser();
	const retrievedUser = await User.findByEmail(`${newUser.getEmail()}.wrong`);

	expect(retrievedUser).toBeNull();
});

test('User updated successfully.', async () => {
	const { username } = generateUserData();
	const newUser = await generateUser(username);
	const { username: newUsername } = generateUserData();

	newUser.setUsername(newUsername);
	expect(newUser.getEditedAt()).toBeNull();

	const wasUpdated = await newUser.save();

	expect(wasUpdated).toBe(true);

	const retrievedUser = await User.findById(newUser.getId());

	expect(retrievedUser.getUsername()).toMatch(newUsername);
	expect(retrievedUser.getUsername()).not.toMatch(username);
	expect(retrievedUser.getCreatedAt()).toBeInstanceOf(Date);
	expect(retrievedUser.getEditedAt()).toBeInstanceOf(Date);
	expect(retrievedUser.getDeletedAt()).toBeNull();
});

test('User avatar updated successfully.', async () => {
	const newUser = await generateUser();
	const newAvatar = faker.image.image();

	newUser.setAvatar(newAvatar);
	expect(newUser.getEditedAt()).toBeNull();

	const wasUpdated = await newUser.save();

	expect(wasUpdated).toBe(true);

	const retrievedUser = await User.findById(newUser.getId());

	expect(retrievedUser.getAvatar()).toMatch(newAvatar);
	expect(retrievedUser.getCreatedAt()).toBeInstanceOf(Date);
	expect(retrievedUser.getEditedAt()).toBeInstanceOf(Date);
	expect(retrievedUser.getDeletedAt()).toBeNull();
});

test('User not updated with blank username.', async () => {
	const user = await generateUser();

	user.setUsername('');

	await expect(user.save()).rejects.toMatchObject({
		name: 'UserException',
		message: 'Cannot update User: Missing username.',
	});
});

test('User not updated with blank email.', async () => {
	const user = await generateUser();

	user.setEmail('');

	await expect(user.save()).rejects.toMatchObject({
		name: 'UserException',
		message: 'Cannot update User: Missing email.',
	});
});

test('User deleted successfully.', async () => {
	const user = await generateUser();

	expect(user.getDeletedAt()).toBeNull();

	const wasDeleted = await user.remove();

	expect(wasDeleted).toBe(true);

	const retrievedUser = await User.findById(user.getId());

	expect(retrievedUser.getCreatedAt()).toBeInstanceOf(Date);
	expect(retrievedUser.getEditedAt()).toBeNull();
	expect(retrievedUser.getDeletedAt()).toBeInstanceOf(Date);
});

afterAll(async () => {
	await truncateDatabase();
});
