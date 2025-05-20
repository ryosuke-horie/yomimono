import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { articleLabels } from "../db/schema";
export class ArticleLabelRepository {
	db;
	constructor(db) {
		this.db = drizzle(db);
	}
	async findByArticleId(articleId) {
		return await this.db
			.select()
			.from(articleLabels)
			.where(eq(articleLabels.articleId, articleId))
			.get();
	}
	async create(data) {
		const now = new Date();
		const result = await this.db
			.insert(articleLabels)
			.values({
				articleId: data.articleId,
				labelId: data.labelId,
				createdAt: now,
			})
			.returning()
			.get();
		return result;
	}
	async createMany(data) {
		const now = new Date();
		const values = data.map(({ articleId, labelId }) => ({
			articleId,
			labelId,
			createdAt: now,
		}));
		const results = await this.db
			.insert(articleLabels)
			.values(values)
			.returning()
			.all();
		return results;
	}
	async findExistingArticleIds(articleIds) {
		const existingLabels = await this.db
			.select({ articleId: articleLabels.articleId })
			.from(articleLabels)
			.where(inArray(articleLabels.articleId, articleIds))
			.all();
		return new Set(existingLabels.map((label) => label.articleId));
	}
}
