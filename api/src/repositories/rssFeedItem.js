import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { rssFeedItems } from "../db/schema";
export class RssFeedItemRepository {
	db;
	rssFeedItemsTable = rssFeedItems;
	constructor(d1Database) {
		this.db = drizzle(d1Database);
	}
	async create(item) {
		const result = await this.db
			.insert(rssFeedItems)
			.values(item)
			.returning()
			.all();
		return result[0];
	}
	async findByFeedIdAndGuid(feedId, guid) {
		return await this.db
			.select()
			.from(rssFeedItems)
			.where(and(eq(rssFeedItems.feedId, feedId), eq(rssFeedItems.guid, guid)))
			.get();
	}
	async findByFeedId(feedId) {
		return await this.db
			.select()
			.from(rssFeedItems)
			.where(eq(rssFeedItems.feedId, feedId))
			.orderBy(desc(rssFeedItems.publishedAt))
			.all();
	}
	async findWithPagination({ feedId, limit, offset }) {
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
	async getTotalCount(feedId) {
		const query = this.db.select({ count: sql`count(*)` }).from(rssFeedItems);
		// フィードIDが指定されている場合はフィルタリング
		if (feedId !== undefined) {
			query.where(eq(rssFeedItems.feedId, feedId));
		}
		const result = await query.get();
		return result?.count || 0;
	}
	async createMany(items) {
		const result = await this.db.insert(rssFeedItems).values(items).all();
		return items.length;
	}
}
