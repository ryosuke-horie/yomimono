import { eq } from "drizzle-orm";
import { type AnyD1Database, drizzle } from "drizzle-orm/d1";
import { type InsertRssFeed, type RssFeed, rssFeeds } from "../db/schema";
import type { RssFeedRepository as IRssFeedRepository } from "../interfaces/repository/rssFeed";

export class RssFeedRepository implements IRssFeedRepository {
	private db;
	public rssFeedsTable = rssFeeds;

	constructor(d1Database: AnyD1Database) {
		this.db = drizzle(d1Database);
	}

	async findAll(): Promise<RssFeed[]> {
		return await this.db.select().from(rssFeeds).all();
	}

	async findById(id: number): Promise<RssFeed | null> {
		const result = await this.db
			.select()
			.from(rssFeeds)
			.where(eq(rssFeeds.id, id))
			.get();
		return result || null;
	}

	async create(feed: InsertRssFeed): Promise<RssFeed> {
		const result = await this.db
			.insert(rssFeeds)
			.values(feed)
			.returning()
			.all();

		return result[0];
	}

	async update(
		id: number,
		data: Partial<InsertRssFeed>,
	): Promise<RssFeed | null> {
		const result = await this.db
			.update(rssFeeds)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(rssFeeds.id, id))
			.returning()
			.all();

		return result[0] || null;
	}

	async delete(id: number): Promise<boolean> {
		try {
			const result = await this.db
				.delete(rssFeeds)
				.where(eq(rssFeeds.id, id))
				.get();
			return true;
		} catch (error) {
			return false;
		}
	}

	// 既存の便利メソッドも保持
	async findByUrl(url: string): Promise<RssFeed | undefined> {
		return await this.db
			.select()
			.from(rssFeeds)
			.where(eq(rssFeeds.url, url))
			.get();
	}

	async findAllActive(): Promise<RssFeed[]> {
		return await this.db
			.select()
			.from(rssFeeds)
			.where(eq(rssFeeds.isActive, true))
			.all();
	}
}
