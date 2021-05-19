const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	generateCategory,
	generateCategories,
	generateCategoryData,
	generateRandomId,
	makeHttpRequest,
	truncateDatabase,
	logIn,
	clearCookieJar,
} = require('./HttpTestHelper');

let initialCategoryId;
let username;
let email;
let password;
let user;

beforeEach(async () => {
	initialCategoryId = await generateRandomId();
	await truncateDatabase(['category'], initialCategoryId);

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);

	clearCookieJar();
});

test('Category created successfully.', async () => {
	await logIn(email, password);

	const categoryData = await generateCategoryData(user);
	const [statusCode, response] = await makeHttpRequest('POST', '/category', categoryData);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Category created successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('title')).toBe(true);
	expect(Object.keys(response.payload).includes('description')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(response.payload.id).toBe(initialCategoryId);
	expect(response.payload.title).toBe(categoryData.title);
	expect(response.payload.description).toBe(categoryData.description);
	expect(response.payload.user.id).toBe(categoryData.userId);
	expect(response.payload.createdAt).toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('Category not created while not logged in.', async () => {
	const categoryData = await generateCategoryData();
	const [statusCode, response] = await makeHttpRequest('POST', '/category', categoryData);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot create Category: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Category not created with blank title.', async () => {
	await logIn(email, password);

	const categoryData = await generateCategoryData(user, '');
	const [statusCode, response] = await makeHttpRequest('POST', '/category', categoryData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create Category: Missing title.');
	expect(response.payload).toMatchObject({});
});

test('Category not created with duplicate title.', async () => {
	await logIn(email, password);

	const category = await generateCategory();
	const categoryData = await generateCategoryData(user, category.getTitle());
	const [statusCode, response] = await makeHttpRequest('POST', '/category', categoryData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot create Category: Duplicate title.');
	expect(response.payload).toMatchObject({});
});

test('All categories found.', async () => {
	const categories = await generateCategories();
	const [statusCode, response] = await makeHttpRequest('GET', '/category');

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Categories retrieved successfully!');
	expect(Array.isArray(response.payload)).toBe(true);
	expect(response.payload.length).toBe(categories.length);

	response.payload.forEach((category, index) => {
		expect(Object.keys(category).includes('id')).toBe(true);
		expect(Object.keys(category).includes('title')).toBe(true);
		expect(Object.keys(category).includes('description')).toBe(true);
		expect(Object.keys(category).includes('user')).toBe(true);
		expect(category.id).toBe(categories[index].getId());
		expect(category.title).toBe(categories[index].getTitle());
		expect(category.description).toBe(categories[index].getDescription());
		expect(category.user.id).toBe(categories[index].getUser().getId());
		expect(category.createdAt).not.toBeNull();
		expect(category.editedAt).toBeNull();
		expect(category.deletedAt).toBeNull();
	});
});

test('Category found by ID.', async () => {
	const category = await generateCategory();
	const [statusCode, response] = await makeHttpRequest('GET', `/category/${category.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Category retrieved successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('title')).toBe(true);
	expect(Object.keys(response.payload).includes('description')).toBe(true);
	expect(Object.keys(response.payload).includes('user')).toBe(true);
	expect(response.payload.id).toBe(category.getId());
	expect(response.payload.title).toBe(category.getTitle());
	expect(response.payload.description).toBe(category.getDescription());
	expect(response.payload.user.id).toBe(category.getUser().getId());
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('Category not found by wrong ID.', async () => {
	const categoryId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('GET', `/category/${categoryId}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot retrieve Category: Category does not exist with ID ${categoryId}.`);
	expect(response.payload).toMatchObject({});
});

test('Category edit form was retrieved.', async () => {
	await logIn(email, password);

	const category = await generateCategory(user);
	const [statusCode, response] = await makeHttpRequest('GET', `/category/${category.getId()}/edit`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload.id).toBe(category.getId());
});

test('Category edit form was not retrieved while not logged in.', async () => {
	const category = await generateCategory();
	const [statusCode, response] = await makeHttpRequest('GET', `/category/${category.getId()}/edit`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload).toMatchObject({});
});

test('Category edit form was not retrieved with non-existant ID.', async () => {
	await logIn(email, password);

	const categoryId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('GET', `/category/${categoryId}/edit`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload).toMatchObject({});
});

test('Category edit form was not retrieved by another user.', async () => {
	await logIn(email, password);

	const category = await generateCategory();
	const [statusCode, response] = await makeHttpRequest('GET', `/category/${category.getId()}/edit`);

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.payload).toMatchObject({});
});

test('Category updated successfully.', async () => {
	await logIn(email, password);

	const category = await generateCategory(user);
	const newCategoryData = await generateCategoryData();
	let [statusCode, response] = await makeHttpRequest('PUT', `/category/${category.getId()}`, newCategoryData);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Category updated successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('title')).toBe(true);
	expect(Object.keys(response.payload).includes('description')).toBe(true);
	expect(response.payload.id).toBe(category.getId());
	expect(response.payload.title).toBe(newCategoryData.title);
	expect(response.payload.description).toBe(newCategoryData.description);
	expect(response.payload.title).not.toBe(category.getTitle());
	expect(response.payload.description).not.toBe(category.getDescription());

	[statusCode, response] = await makeHttpRequest('GET', `/category/${category.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.payload.title).toBe(newCategoryData.title);
	expect(response.payload.description).toBe(newCategoryData.description);
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).not.toBeNull();
	expect(response.payload.deletedAt).toBeNull();
});

test('Category not updated while not logged in.', async () => {
	const categoryId = await generateRandomId();
	const { title: newCategoryTitle, description: newCategoryDescription } = await generateCategoryData();
	const [statusCode, response] = await makeHttpRequest('PUT', `/category/${categoryId}`, {
		title: newCategoryTitle,
		description: newCategoryDescription,
	});

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot update Category: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Category not updated with non-existant ID.', async () => {
	await logIn(email, password);

	const categoryId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('PUT', `/category/${categoryId}`, { title: 'Pokemon' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe(`Cannot update Category: Category does not exist with ID ${categoryId}.`);
	expect(response.payload).toMatchObject({});
});

test('Category not updated by another user.', async () => {
	await logIn(email, password);

	const category = await generateCategory();
	const { title: newCategoryTitle, description: newCategoryDescription } = await generateCategoryData();
	const [statusCode, response] = await makeHttpRequest('PUT', `/category/${category.getId()}`, {
		title: newCategoryTitle,
		description: newCategoryDescription,
	});

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.message).toBe('Cannot update Category: You cannot update a category created by someone other than yourself.');
	expect(response.payload).toMatchObject({});
});

test('Category not updated with blank title.', async () => {
	await logIn(email, password);

	const category = await generateCategory(user);
	const [statusCode, response] = await makeHttpRequest('PUT', `/category/${category.getId()}`, { title: '' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot update Category: No update parameters were provided.');
	expect(response.payload).toMatchObject({});
});

test('Category not updated with blank description.', async () => {
	await logIn(email, password);

	const category = await generateCategory(user);
	const [statusCode, response] = await makeHttpRequest('PUT', `/category/${category.getId()}`, { description: '' });

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Cannot update Category: No update parameters were provided.');
	expect(response.payload).toMatchObject({});
});

test('Category deleted successfully.', async () => {
	await logIn(email, password);

	const category = await generateCategory(user);
	let [statusCode, response] = await makeHttpRequest('DELETE', `/category/${category.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(Object.keys(response).includes('message')).toBe(true);
	expect(Object.keys(response).includes('payload')).toBe(true);
	expect(response.message).toBe('Category deleted successfully!');
	expect(Object.keys(response.payload).includes('id')).toBe(true);
	expect(Object.keys(response.payload).includes('title')).toBe(true);
	expect(Object.keys(response.payload).includes('description')).toBe(true);
	expect(response.payload.id).toBe(category.getId());
	expect(response.payload.title).toBe(category.getTitle());
	expect(response.payload.description).toBe(category.getDescription());

	[statusCode, response] = await makeHttpRequest('GET', `/category/${category.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.OK);
	expect(response.payload.title).toBe(category.getTitle());
	expect(response.payload.description).toBe(category.getDescription());
	expect(response.payload.createdAt).not.toBeNull();
	expect(response.payload.editedAt).toBeNull();
	expect(response.payload.deletedAt).not.toBeNull();
});

test('Category not deleted while not logged in.', async () => {
	const categoryId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('DELETE', `/category/${categoryId}`);

	expect(statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
	expect(response.message).toBe('Cannot delete Category: You must be logged in.');
	expect(response.payload).toMatchObject({});
});

test('Category not deleted with non-existant ID.', async () => {
	await logIn(email, password);

	const categoryId = await generateRandomId();
	const [statusCode, response] = await makeHttpRequest('DELETE', `/category/${categoryId}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe(`Cannot delete Category: Category does not exist with ID ${categoryId}.`);
	expect(response.payload).toMatchObject({});
});

test('Category not deleted by another user.', async () => {
	await logIn(email, password);

	const category = await generateCategory();
	const [statusCode, response] = await makeHttpRequest('DELETE', `/category/${category.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.FORBIDDEN);
	expect(response.message).toBe('Cannot delete Category: You cannot delete a category created by someone other than yourself.');
	expect(response.payload).toMatchObject({});
});

test('Deleted category not updated.', async () => {
	await logIn(email, password);

	const category = await generateCategory(user);

	await makeHttpRequest('DELETE', `/category/${category.getId()}`);

	const newCategoryData = await generateCategoryData();
	const [statusCode, response] = await makeHttpRequest('PUT', `/category/${category.getId()}`, newCategoryData);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot update Category: You cannot update a category that has been deleted.');
	expect(response.payload).toMatchObject({});
});

test('Deleted category not deleted.', async () => {
	await logIn(email, password);

	const category = await generateCategory(user);

	await makeHttpRequest('DELETE', `/category/${category.getId()}`);

	const [statusCode, response] = await makeHttpRequest('DELETE', `/category/${category.getId()}`);

	expect(statusCode).toBe(HttpStatusCode.BAD_REQUEST);
	expect(response.message).toBe('Cannot delete Category: You cannot delete a category that has been deleted.');
	expect(response.payload).toMatchObject({});
});

afterAll(async () => {
	await truncateDatabase();
});
