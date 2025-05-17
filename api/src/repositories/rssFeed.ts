import { type SQL, eq } from "drizzle-orm";
import { type D1Database, drizzle } from "drizzle-orm/d1";
import { type InsertRssFeed, type RssFeed, rssFeeds } from "../db/schema";

export class RssFeedRepository {
	private db;
	public rssFeedsTable = rssFeeds;

	constructor(d1Database: D1Database) {
		this.db = drizzle(d1Database);
	}

	async create(feed: InsertRssFeed): Promise<RssFeed> {
		const result = await this.db
			.insert(rssFeeds)
			.values(feed)
			.returning()
			.all();

		return result[0];
	}

	async findById(id: number): Promise<RssFeed | undefined> {
		return await this.db
			.select()
			.from(rssFeeds)
			.where(eq(rssFeeds.id, id))
			.get();
	}

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

	async update(id: number, data: Partial<InsertRssFeed>): Promise<RssFeed> {
		const result = await this.db
			.update(rssFeeds)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(rssFeeds.id, id))
			.returning()
			.all();

		return result[0];
	}
}
