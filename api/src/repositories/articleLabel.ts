import { eq, inArray } from "drizzle-orm";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import {
	type ArticleLabel,
	type InsertArticleLabel,
	articleLabels,
} from "../db/schema";
import type { IArticleLabelRepository } from "../interfaces/repository/articleLabel";

export class ArticleLabelRepository implements IArticleLabelRepository {
	private readonly db: DrizzleD1Database;

	constructor(db: D1Database) {
		this.db = drizzle(db);
	}

	async findByArticleId(articleId: number): Promise<ArticleLabel | undefined> {
		return await this.db
			.select()
			.from(articleLabels)
			.where(eq(articleLabels.articleId, articleId))
			.get();
	}

	async create(
		data: Pick<InsertArticleLabel, "articleId" | "labelId">,
	): Promise<ArticleLabel> {
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

	async createMany(
		data: Array<Pick<InsertArticleLabel, "articleId" | "labelId">>,
	): Promise<ArticleLabel[]> {
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

	async findExistingArticleIds(articleIds: number[]): Promise<Set<number>> {
		const existingLabels = await this.db
			.select({ articleId: articleLabels.articleId })
			.from(articleLabels)
			.where(inArray(articleLabels.articleId, articleIds))
			.all();

		return new Set(existingLabels.map((label) => label.articleId));
	}
}
