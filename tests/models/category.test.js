const User = require('../../src/models/User');
const Category = require('../../src/models/Category');
const {
	generateUser,
	generateCategoryData,
	generateCategory,
	generateCategories,
	generateRandomId,
	truncateDatabase,
} = require('../TestHelper');

let user;
let initialCategoryId;

beforeEach(async () => {
	initialCategoryId = await generateRandomId();
	await truncateDatabase(['category'], initialCategoryId);

	user = await generateUser();
});

test('Category created successfully.', async () => {
	const { title, description } = await generateCategoryData();
	const category = await generateCategory(user, title, description);

	expect(category).toBeInstanceOf(Category);
	expect(category.getId()).toBe(initialCategoryId);
	expect(category.getTitle()).toBe(title);
	expect(category.getDescription()).toBe(description);
	expect(category.getUser()).toBeInstanceOf(User);
	expect(category.getUser().getId()).toBe(user.getId());
});

test('Category not created with non-existant user.', async () => {
	const wrongId = await generateRandomId('user');

	user.setId(wrongId);

	await expect(generateCategory(user)).rejects.toMatchObject({
		name: 'CategoryException',
		message: `Cannot create Category: User does not exist with ID ${wrongId}.`,
	});
});

test('Category not created with blank title.', async () => {
	await expect(generateCategory(user, '')).rejects.toMatchObject({
		name: 'CategoryException',
		message: 'Cannot create Category: Missing title.',
	});
});

test('Category not created with duplicate title.', async () => {
	const { title } = await generateCategoryData();

	await generateCategory(user, title);

	await expect(generateCategory(user, title)).rejects.toMatchObject({
		name: 'CategoryException',
		message: 'Cannot create Category: Duplicate title.',
	});
});

test('All categories found.', async () => {
	const categories = await generateCategories();
	const retrievedCategories = await Category.findAll();

	retrievedCategories.forEach((category, index) => {
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
	const newCategory = await generateCategory(user);
	const retrievedCategory = await Category.findById(newCategory.getId());

	expect(retrievedCategory).toBeInstanceOf(Category);
	expect(retrievedCategory.getId()).toBe(retrievedCategory.getId());
	expect(retrievedCategory.getTitle()).toMatch(newCategory.getTitle());
	expect(retrievedCategory.getDescription()).toMatch(newCategory.getDescription());
	expect(retrievedCategory.getCreatedAt()).toBeInstanceOf(Date);
	expect(retrievedCategory.getEditedAt()).toBeNull();
	expect(retrievedCategory.getDeletedAt()).toBeNull();
});

test('Category not found by wrong ID.', async () => {
	const newCategory = await generateCategory(user);
	const retrievedCategory = await Category.findById(newCategory.getId() + 1);

	expect(retrievedCategory).toBeNull();
});

test('Category found by title.', async () => {
	const newCategory = await generateCategory(user);
	const retrievedCategory = await Category.findByTitle(newCategory.getTitle());

	expect(retrievedCategory.getTitle()).toMatch(newCategory.getTitle());
});

test('Category not found by wrong title.', async () => {
	const newCategory = await generateCategory(user);
	const retrievedCategory = await Category.findByTitle(`${newCategory.getTitle()}.wrong`);

	expect(retrievedCategory).toBeNull();
});

test('Category updated successfully.', async () => {
	const { title, description } = await generateCategoryData();
	const category = await generateCategory(user);
	const { title: newCategoryTitle, description: newCategoryDescription } = await generateCategoryData();

	category.setTitle(newCategoryTitle);

	expect(category.getEditedAt()).toBeNull();
	expect(await category.save()).toBe(true);

	category.setDescription(newCategoryDescription);

	expect(category.getEditedAt()).toBeNull();
	expect(await category.save()).toBe(true);

	const retrievedCategory = await Category.findById(category.getId());

	expect(retrievedCategory).toBeInstanceOf(Category);
	expect(retrievedCategory.getTitle()).toMatch(newCategoryTitle);
	expect(retrievedCategory.getDescription()).toMatch(newCategoryDescription);
	expect(retrievedCategory.getTitle()).not.toMatch(title);
	expect(retrievedCategory.getDescription()).not.toMatch(description);
	expect(retrievedCategory.getCreatedAt()).toBeInstanceOf(Date);
	expect(retrievedCategory.getEditedAt()).toBeInstanceOf(Date);
	expect(retrievedCategory.getDeletedAt()).toBeNull();
});

test('Category not updated with blank title.', async () => {
	const category = await generateCategory(user);

	category.setTitle('');

	await expect(category.save()).rejects.toMatchObject({
		name: 'CategoryException',
		message: 'Cannot update Category: Missing title.',
	});
});

test('Category deleted successfully.', async () => {
	const category = await generateCategory(user);

	expect(category.getDeletedAt()).toBeNull();

	const wasDeleted = await category.remove();

	expect(wasDeleted).toBe(true);

	const retrievedCategory = await Category.findById(category.getId());

	expect(retrievedCategory.getTitle()).toBe(category.getTitle());
	expect(retrievedCategory.getDescription()).toBe(category.getDescription());
	expect(retrievedCategory.getCreatedAt()).toBeInstanceOf(Date);
	expect(retrievedCategory.getEditedAt()).toBeNull();
	expect(retrievedCategory.getDeletedAt()).toBeInstanceOf(Date);
});

afterAll(async () => {
	await truncateDatabase();
});
