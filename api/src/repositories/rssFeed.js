import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { rssFeeds } from "../db/schema";
export class RssFeedRepository {
	db;
	rssFeedsTable = rssFeeds;
	constructor(d1Database) {
		this.db = drizzle(d1Database);
	}
	async findAll() {
		return await this.db.select().from(rssFeeds).all();
	}
	async findById(id) {
		const result = await this.db
			.select()
			.from(rssFeeds)
			.where(eq(rssFeeds.id, id))
			.get();
		return result || null;
	}
	async findByIds(ids) {
		if (ids.length === 0) {
			return [];
		}
		return await this.db
			.select()
			.from(rssFeeds)
			.where(inArray(rssFeeds.id, ids))
			.all();
	}
	async create(feed) {
		const result = await this.db
			.insert(rssFeeds)
			.values(feed)
			.returning()
			.all();
		return result[0];
	}
	async update(id, data) {
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
	async delete(id) {
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
	async findByUrl(url) {
		return await this.db
			.select()
			.from(rssFeeds)
			.where(eq(rssFeeds.url, url))
			.get();
	}
	async findAllActive() {
		return await this.db
			.select()
			.from(rssFeeds)
			.where(eq(rssFeeds.isActive, true))
			.all();
	}
}
