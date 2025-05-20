import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { articleLabels, labels } from "../db/schema";
export class LabelRepository {
	db;
	constructor(db) {
		this.db = drizzle(db);
	}
	async findAllWithArticleCount() {
		const results = await this.db
			.select({
				id: labels.id,
				name: labels.name,
				description: labels.description,
				createdAt: labels.createdAt,
				updatedAt: labels.updatedAt,
				articleCount: count(articleLabels.id),
			})
			.from(labels)
			.leftJoin(articleLabels, eq(labels.id, articleLabels.labelId))
			.groupBy(labels.id)
			.orderBy(labels.name)
			.all();
		// Drizzleのcountはstringを返すことがあるためnumberに変換
		return results.map((r) => ({
			...r,
			articleCount: Number(r.articleCount),
		}));
	}
	async findByName(name) {
		return await this.db
			.select()
			.from(labels)
			.where(eq(labels.name, name))
			.get();
	}
	async findById(id) {
		return await this.db.select().from(labels).where(eq(labels.id, id)).get();
	}
	async create(data) {
		const now = new Date();
		const result = await this.db
			.insert(labels)
			.values({
				name: data.name,
				description: data.description,
				createdAt: now,
				updatedAt: now,
			})
			.returning()
			.get();
		return result;
	}
	async deleteById(id) {
		const result = await this.db
			.delete(labels)
			.where(eq(labels.id, id))
			.returning()
			.all();
		return result.length > 0;
	}
	async updateDescription(id, description) {
		const now = new Date();
		try {
			const result = await this.db
				.update(labels)
				.set({
					description,
					updatedAt: now,
				})
				.where(eq(labels.id, id))
				.returning()
				.get();
			return result;
		} catch (error) {
			console.error("Failed to update label description:", error);
			return undefined;
		}
	}
}
