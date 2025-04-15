import { count, eq } from "drizzle-orm";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import {
	type InsertLabel,
	type Label,
	articleLabels,
	labels,
} from "../db/schema";
import type { ILabelRepository } from "../interfaces/repository/label";

export class LabelRepository implements ILabelRepository {
	private readonly db: DrizzleD1Database;

	constructor(db: D1Database) {
		this.db = drizzle(db);
	}

	async findAllWithArticleCount(): Promise<
		(Label & { articleCount: number })[]
	> {
		const results = await this.db
			.select({
				id: labels.id,
				name: labels.name,
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

	async findByName(name: string): Promise<Label | undefined> {
		return await this.db
			.select()
			.from(labels)
			.where(eq(labels.name, name))
			.get();
	}

	async create(data: Pick<InsertLabel, "name">): Promise<Label> {
		const now = new Date();
		const result = await this.db
			.insert(labels)
			.values({
				name: data.name,
				createdAt: now,
				updatedAt: now,
			})
			.returning()
			.get();
		return result;
	}

	async deleteById(id: number): Promise<boolean> {
		const result = await this.db
			.delete(labels)
			.where(eq(labels.id, id))
			.returning()
			.all();

		return result.length > 0;
	}
}
