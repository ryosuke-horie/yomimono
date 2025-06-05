import { and, desc, eq } from "drizzle-orm";
import { type AnyD1Database, drizzle } from "drizzle-orm/d1";
import {
	type InsertRssFeedItem,
	type RssFeedItem,
	rssFeedItems,
} from "../db/schema";

export class RssFeedItemRepository {
	private db;
	public rssFeedItemsTable = rssFeedItems;

	constructor(d1Database: D1Database) {
		this.db = drizzle(d1Database);
	}

	async create(item: InsertRssFeedItem): Promise<RssFeedItem> {
		const result = await this.db
			.insert(rssFeedItems)
			.values(item)
			.returning()
			.all();

		return result[0];
	}

	async findByFeedIdAndGuid(
		feedId: number,
		guid: string,
	): Promise<RssFeedItem | undefined> {
		return await this.db
			.select()
			.from(rssFeedItems)
			.where(and(eq(rssFeedItems.feedId, feedId), eq(rssFeedItems.guid, guid)))
			.get();
	}

	async findByFeedId(feedId: number): Promise<RssFeedItem[]> {
		return await this.db
			.select()
			.from(rssFeedItems)
			.where(eq(rssFeedItems.feedId, feedId))
			.orderBy(desc(rssFeedItems.publishedAt))
			.all();
	}

	async createMany(items: InsertRssFeedItem[]): Promise<number> {
		const result = await this.db.insert(rssFeedItems).values(items).all();

		return items.length;
	}
}
