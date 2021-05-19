const Request = require('../../src/router/Request');
const JsonResponse = require('../../src/router/JsonResponse');
const HtmlResponse = require('../../src/router/HtmlResponse');
const User = require('../../src/models/User');
const Category = require('../../src/models/Category');
const CategoryController = require('../../src/controllers/CategoryController');
const HttpStatusCode = require('../../src/helpers/HttpStatusCode');
const {
	generateUser,
	generateUserData,
	generateCategory,
	generateCategoryData,
	generateRandomId,
	truncateDatabase,
	logIn,
	getSession,
	stopSession,
} = require('./ControllerTestHelper');

let initialCategoryId;
let session;
let username;
let email;
let password;
let user;

beforeEach(async () => {
	initialCategoryId = await generateRandomId();
	await truncateDatabase(['category'], initialCategoryId);

	session = getSession();

	({ username, email, password } = generateUserData());
	user = await generateUser(
		username,
		email,
		password,
	);
});

test('CategoryController handled a POST request.', async () => {
	const categoryData = await generateCategoryData();

	await logIn(email, password, session);

	const request = new Request('POST', '/category', categoryData);
	const controller = new CategoryController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Category created successfully!');
	expect(response.getPayload()).toBeInstanceOf(Category);
	expect(response.getPayload().getId()).toBe(initialCategoryId);
	expect(response.getPayload().getTitle()).toBe(categoryData.title);
	expect(response.getPayload().getDescription()).toBe(categoryData.description);
	expect(response.getPayload().getUser()).toBeInstanceOf(User);
	expect(response.getPayload().getUser().getId()).toBe(user.getId());
});

test('CategoryController threw an exception handling a POST request while not logged in.', async () => {
	const categoryData = await generateCategoryData();
	const request = new Request('POST', '/category', categoryData);
	const controller = new CategoryController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot create Category: You must be logged in.',
	});
});

test('CategoryController handled a GET (all) request with no categories in database.', async () => {
	const request = new Request('GET', '/category');
	const controller = new CategoryController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Categories retrieved successfully!');
	expect(Array.isArray(response.getPayload()));
	expect(response.getPayload().length).toBe(0);
});

test('CategoryController handled a GET (all) request with 3 categories in database.', async () => {
	await generateCategory();
	await generateCategory();
	await generateCategory();

	const request = new Request('GET', '/category');
	const controller = new CategoryController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Categories retrieved successfully!');
	expect(Array.isArray(response.getPayload())).toBe(true);
	expect(response.getPayload().length).toBe(3);
	expect(response.getPayload()[0]).toBeInstanceOf(Category);
	expect(response.getPayload()[1]).toBeInstanceOf(Category);
	expect(response.getPayload()[2]).toBeInstanceOf(Category);
});

test('CategoryController handled a GET (one) request.', async () => {
	const category = await generateCategory();
	const request = new Request('GET', `/category/${category.getId()}`);
	const controller = new CategoryController(request, new JsonResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Category retrieved successfully!');
	expect(response.getPayload()).toBeInstanceOf(Category);
	expect(response.getPayload().getId()).toBe(category.getId());
	expect(response.getPayload().getTitle()).toBe(category.getTitle());
	expect(response.getPayload().getDescription()).toBe(category.getDescription());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('CategoryController threw an exception handling a GET request with non-existant ID.', async () => {
	const categoryId = await generateRandomId();
	const request = new Request('GET', `/category/${categoryId}`);
	const controller = new CategoryController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot retrieve Category: Category does not exist with ID ${categoryId}.`,
	});
});

test('CategoryController handled a GET edit form request.', async () => {
	const category = await generateCategory(user);

	await logIn(email, password, session);

	const request = new Request('GET', `/category/${category.getId()}/edit`);
	const controller = new CategoryController(request, new HtmlResponse(), session);
	const response = await controller.doAction();

	expect(response).toBeInstanceOf(HtmlResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
});

test('CategoryController threw an exception handling a GET edit form request while not logged in.', async () => {
	const category = await generateCategory();
	const request = new Request('GET', `/category/${category.getId()}/edit`);
	const controller = new CategoryController(request, new HtmlResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot update Category: You must be logged in.',
	});
});

test('CategoryController threw an exception handling a GET edit form request with non-existant ID.', async () => {
	const categoryId = await generateRandomId();

	await logIn(email, password, session);
	const request = new Request('GET', `/category/${categoryId}/edit`);
	const controller = new CategoryController(request, new HtmlResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot update Category: Category does not exist with ID ${categoryId}.`,
	});
});

test('CategoryController threw an exception handling a GET edit form request from another user.', async () => {
	const category = await generateCategory();

	await logIn(email, password, session);

	const request = new Request('GET', `/category/${category.getId()}/edit`);
	const controller = new CategoryController(request, new HtmlResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot update Category: You cannot update a category created by someone other than yourself.',
	});
});

test('CategoryController handled a PUT request.', async () => {
	const category = await generateCategory(user);
	const { title: newCategoryTitle, description: newCategoryDescription } = await generateCategoryData();

	await logIn(email, password, session);

	let request = new Request('PUT', `/category/${category.getId()}`, {
		title: newCategoryTitle,
		description: newCategoryDescription,
	});
	let controller = new CategoryController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Category updated successfully!');
	expect(response.getPayload()).toBeInstanceOf(Category);
	expect(response.getPayload().getId()).toBe(category.getId());
	expect(response.getPayload().getTitle()).toBe(newCategoryTitle);
	expect(response.getPayload().getDescription()).toBe(newCategoryDescription);
	expect(response.getPayload().getTitle()).not.toBe(category.getTitle());
	expect(response.getPayload().getDescription()).not.toBe(category.getDescription());

	request = new Request('GET', `/category/${category.getId()}`);
	controller = new CategoryController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getTitle()).toBe(newCategoryTitle);
	expect(response.getPayload().getDescription()).toBe(newCategoryDescription);
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getDeletedAt()).toBeNull();
});

test('CategoryController threw an exception handling a PUT request while not logged in.', async () => {
	const category = await generateCategory();
	const { title: newCategoryTitle, description: newCategoryDescription } = await generateCategoryData();
	const request = new Request('PUT', `/category/${category.getId()}`, {
		title: newCategoryTitle,
		description: newCategoryDescription,
	});
	const controller = new CategoryController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot update Category: You must be logged in.',
	});
});

test('CategoryController threw an exception handling a PUT request with non-existant ID.', async () => {
	const categoryId = await generateRandomId();

	await logIn(email, password, session);

	const request = new Request('PUT', `/category/${categoryId}`, { title: 'New Title' });
	const controller = new CategoryController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot update Category: Category does not exist with ID ${categoryId}.`,
	});
});

test('CategoryController threw an exception handling a PUT request from another user.', async () => {
	const category = await generateCategory();
	const { title: newCategoryTitle, description: newCategoryDescription } = await generateCategoryData();

	await logIn(email, password, session);

	const request = new Request('PUT', `/category/${category.getId()}`, {
		title: newCategoryTitle,
		description: newCategoryDescription,
	});
	const controller = new CategoryController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot update Category: You cannot update a category created by someone other than yourself.',
	});
});

test('CategoryController threw an exception handling a PUT request with no update fields.', async () => {
	const category = await generateCategory(user);

	await logIn(email, password, session);

	const request = new Request('PUT', `/category/${category.getId()}`, {
		title: '',
		description: '',
	});
	const controller = new CategoryController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: 'Cannot update Category: No update parameters were provided.',
	});
});

test('CategoryController handled a DELETE request.', async () => {
	const category = await generateCategory(user);

	await logIn(email, password, session);

	let request = new Request('DELETE', `/category/${category.getId()}`);
	let controller = new CategoryController(request, new JsonResponse(), session);
	let response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getMessage()).toBe('Category deleted successfully!');
	expect(response.getPayload()).toBeInstanceOf(Category);
	expect(response.getPayload().getId()).toBe(category.getId());
	expect(response.getPayload().getTitle()).toBe(category.getTitle());
	expect(response.getPayload().getDescription()).toBe(category.getDescription());

	request = new Request('GET', `/category/${category.getId()}`);
	controller = new CategoryController(request, new JsonResponse(), session);
	response = await controller.doAction();

	expect(response).toBeInstanceOf(JsonResponse);
	expect(response.getStatusCode()).toBe(HttpStatusCode.OK);
	expect(response.getPayload().getTitle()).toBe(category.getTitle());
	expect(response.getPayload().getDescription()).toBe(category.getDescription());
	expect(response.getPayload().getCreatedAt()).toBeInstanceOf(Date);
	expect(response.getPayload().getEditedAt()).toBeNull();
	expect(response.getPayload().getDeletedAt()).toBeInstanceOf(Date);
});

test('CategoryController threw an exception handling a DELETE request while not logged in.', async () => {
	const categoryId = await generateRandomId();
	const request = new Request('DELETE', `/category/${categoryId}`);
	const controller = new CategoryController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.UNAUTHORIZED,
		message: 'Cannot delete Category: You must be logged in.',
	});
});

test('CategoryController threw an exception handling a DELETE request with non-existant ID.', async () => {
	const categoryId = await generateRandomId();

	await logIn(email, password, session);

	const request = new Request('DELETE', `/category/${categoryId}`);
	const controller = new CategoryController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.BAD_REQUEST,
		message: `Cannot delete Category: Category does not exist with ID ${categoryId}.`,
	});
});

test('CategoryController threw an exception handling a DELETE request from another user.', async () => {
	const category = await generateCategory();

	await logIn(email, password, session);

	const request = new Request('DELETE', `/category/${category.getId()}`);
	const controller = new CategoryController(request, new JsonResponse(), session);

	await expect(controller.doAction()).rejects.toMatchObject({
		name: 'CategoryException',
		statusCode: HttpStatusCode.FORBIDDEN,
		message: 'Cannot delete Category: You cannot delete a category created by someone other than yourself.',
	});
});

afterAll(async () => {
	await truncateDatabase();
	stopSession();
});
