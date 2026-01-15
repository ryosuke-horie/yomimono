import { eq } from "drizzle-orm";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import {
	type ArticleLabel,
	articleLabels,
	type InsertArticleLabel,
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

	async deleteByArticleId(articleId: number): Promise<void> {
		await this.db
			.delete(articleLabels)
			.where(eq(articleLabels.articleId, articleId))
			.run();
	}
}
