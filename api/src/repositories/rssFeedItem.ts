import { and, desc, eq, sql } from "drizzle-orm";
import { type D1Database, drizzle } from "drizzle-orm/d1";
import {
	type InsertRssFeedItem,
	type RssFeedItem,
	rssFeedItems,
} from "../db/schema";
import type { FindWithPaginationParams } from "../interfaces/repository/rssFeedItem";

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

	async findWithPagination({
		feedId,
		limit,
		offset,
	}: FindWithPaginationParams): Promise<RssFeedItem[]> {
		const query = this.db
			.select()
			.from(rssFeedItems)
			.orderBy(desc(rssFeedItems.publishedAt))
			.limit(limit)
			.offset(offset);

		// フィードIDが指定されている場合はフィルタリング
		if (feedId !== undefined) {
			query.where(eq(rssFeedItems.feedId, feedId));
		}

		return await query.all();
	}

	async getTotalCount(feedId?: number): Promise<number> {
		const query = this.db
			.select({ count: sql<number>`count(*)` })
			.from(rssFeedItems);

		// フィードIDが指定されている場合はフィルタリング
		if (feedId !== undefined) {
			query.where(eq(rssFeedItems.feedId, feedId));
		}

		const result = await query.get();
		return result?.count || 0;
	}

	async createMany(items: InsertRssFeedItem[]): Promise<number> {
		const result = await this.db.insert(rssFeedItems).values(items).all();

		return items.length;
	}
}
