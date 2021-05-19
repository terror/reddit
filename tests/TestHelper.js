const faker = require('faker');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');
const Database = require('../src/database/Database');
const DatabaseException = require('../src/exceptions/DatabaseException');

require('../src/helpers/Logger').toggleConsoleLog(false);

class TestHelper {
	static generateUserData(username = null, email = null, password = null) {
		return {
			username: username ?? faker.internet.userName(),
			email: email ?? faker.internet.email(),
			password: password ?? faker.internet.password(),
		};
	}

	static async generateUser(username = null, email = null, password = null) {
		const userData = TestHelper.generateUserData(username, email, password);
		const user = await User.create(
			userData.username,
			userData.email,
			userData.password,
		);

		return user;
	}

	static async generateUsers() {
		let users = [];
		const numberOfUsers = Math.floor(Math.random() * 10) + 1;

		for (let i = 0; i < numberOfUsers; i++) {
			users.push(TestHelper.generateUser());
		}

		users = await Promise.all(users);

		users.sort((userA, userB) => userA.getId() - userB.getId());

		return users;
	}

	static async generateCategoryData(user = null, title = null, description = null) {
		const categoryUser = user ?? await TestHelper.generateUser();
		const categoryTitle = title ?? faker.lorem.words(5);
		const categoryDescription = description ?? faker.lorem.sentence();

		return {
			userId: categoryUser.getId(),
			title: categoryTitle,
			description: categoryDescription,
		};
	}

	static async generateCategory(user = null, title = null, description = null) {
		const categoryData = await TestHelper.generateCategoryData(user, title, description);
		const category = await Category.create(
			categoryData.userId,
			categoryData.title,
			categoryData.description,
		);

		return category;
	}

	static async generateCategories() {
		let categories = [];
		const numberOfCategories = Math.floor(Math.random() * 10) + 1;

		for (let i = 0; i < numberOfCategories; i++) {
			categories.push(TestHelper.generateCategory());
		}

		categories = await Promise.all(categories);

		categories.sort((categoryA, categoryB) => categoryA.getId() - categoryB.getId());

		return categories;
	}

	static async generatePostData(type = null, user = null, category = null, title = null, content = null) {
		const postType = type ?? (Math.random() < 0.5 ? 'Text' : 'URL');
		const postUser = user ?? await TestHelper.generateUser();
		const postCategory = category ?? await TestHelper.generateCategory();
		const postTitle = title ?? faker.lorem.words(Math.floor(Math.random() * 5) + 1);
		const postContent = content ?? (postType === 'Text' ? faker.lorem.sentences() : faker.internet.url());

		return {
			type: postType,
			userId: postUser.getId(),
			categoryId: postCategory.getId(),
			title: postTitle,
			content: postContent,
		};
	}

	static async generatePost({
		type = null, user = null, category = null, title = null, content = null,
	} = {}) {
		const postData = await TestHelper.generatePostData(type, user, category, title, content);
		const post = await Post.create(
			postData.userId,
			postData.categoryId,
			postData.title,
			postData.type,
			postData.content,
		);

		return post;
	}

	static async generateCommentData(user = null, post = null, content = null, replyId = null) {
		const commentUser = user ?? await TestHelper.generateUser();
		const commentPost = post ?? await TestHelper.generatePost();
		const commentContent = content ?? faker.lorem.paragraph();

		return {
			userId: commentUser.getId(),
			postId: commentPost.getId(),
			replyId,
			content: commentContent,
		};
	}

	static async generateComment({
		user = null, post = null, content = null, replyId = null,
	} = {}) {
		const commentData = await TestHelper.generateCommentData(user, post, content, replyId);
		const comment = await Comment.create(
			commentData.userId,
			commentData.postId,
			commentData.content,
			commentData.replyId,
		);

		return comment;
	}

	static async generateRandomId(table = null) {
		if (!table) {
			return Math.floor(Math.random() * 100) + 1;
		}

		let results;
		let id;

		do {
			id = Math.floor(Math.random() * 100) + 1;
			const connection = await Database.connect();

			try {
				const sql = `SELECT * FROM \`${table}\` WHERE \`id\` = ?`;
				[results] = await connection.execute(sql, [id]);
			}
			catch (exception) {
				throw new DatabaseException(exception);
			}
			finally {
				await connection.end();
			}
		}
		while (results.length > 0);

		return id;
	}

	static async truncateDatabase(tables = [], autoIncrementStart = 1) {
		if (tables.length === 0) {
			await Database.truncate([
				'comment',
				'post',
				'category',
				'user',
				'post_vote',
				'comment_vote',
				'bookmarked_post',
				'bookmarked_comment',
			]);

			return;
		}

		await Database.truncate(tables, autoIncrementStart);
	}
}

module.exports = TestHelper;
