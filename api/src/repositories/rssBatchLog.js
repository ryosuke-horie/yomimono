import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { rssBatchLogs } from "../db/schema";
export class RssBatchLogRepository {
	db;
	rssBatchLogsTable = rssBatchLogs;
	constructor(d1Database) {
		this.db = drizzle(d1Database);
	}
	async create(log) {
		const result = await this.db
			.insert(rssBatchLogs)
			.values(log)
			.returning()
			.all();
		return result[0];
	}
	async update(id, data) {
		const result = await this.db
			.update(rssBatchLogs)
			.set(data)
			.where(eq(rssBatchLogs.id, id))
			.returning()
			.all();
		return result[0];
	}
	async findByFeedId(feedId) {
		return await this.db
			.select()
			.from(rssBatchLogs)
			.where(eq(rssBatchLogs.feedId, feedId))
			.orderBy(desc(rssBatchLogs.createdAt))
			.all();
	}
	async findLatestByFeedId(feedId) {
		return await this.db
			.select()
			.from(rssBatchLogs)
			.where(eq(rssBatchLogs.feedId, feedId))
			.orderBy(desc(rssBatchLogs.createdAt))
			.get();
	}
}
