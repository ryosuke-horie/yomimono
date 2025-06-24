import { count, eq, inArray } from "drizzle-orm";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import {
	articleLabels,
	type InsertLabel,
	type Label,
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

	async findByName(name: string): Promise<Label | undefined> {
		return await this.db
			.select()
			.from(labels)
			.where(eq(labels.name, name))
			.get();
	}

	async findById(id: number): Promise<Label | undefined> {
		return await this.db.select().from(labels).where(eq(labels.id, id)).get();
	}

	async create(
		data: Pick<InsertLabel, "name" | "description">,
	): Promise<Label> {
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

	async deleteById(id: number): Promise<boolean> {
		const result = await this.db
			.delete(labels)
			.where(eq(labels.id, id))
			.returning()
			.all();

		return result.length > 0;
	}

	async updateDescription(
		id: number,
		description: string | null,
	): Promise<Label | undefined> {
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

	async deleteMany(ids: number[]): Promise<Label[]> {
		if (ids.length === 0) {
			return [];
		}

		const result = await this.db
			.delete(labels)
			.where(inArray(labels.id, ids))
			.returning()
			.all();

		return result;
	}
}
