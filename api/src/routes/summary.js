import { Hono } from "hono";
export const createSummaryRouter = (summaryService) => {
	const app = new Hono();
	// 要約なしブックマーク取得エンドポイント
	app.get("/bookmarks/without-summary", async (c) => {
		try {
			const limit = c.req.query("limit");
			const orderBy = c.req.query("orderBy");
			const bookmarks = await summaryService.getBookmarksWithoutSummary(
				limit ? Number.parseInt(limit, 10) : undefined,
				orderBy === "createdAt" || orderBy === "readAt" ? orderBy : undefined,
			);
			return c.json({
				success: true,
				bookmarks,
			});
		} catch (error) {
			console.error("Failed to get bookmarks without summary:", error);
			return c.json(
				{
					success: false,
					error: "Failed to get bookmarks without summary",
				},
				500,
			);
		}
	});
	// ブックマークID取得エンドポイント
	app.get("/bookmarks/:id", async (c) => {
		try {
			const bookmarkId = Number.parseInt(c.req.param("id"), 10);
			if (Number.isNaN(bookmarkId)) {
				return c.json(
					{
						success: false,
						error: "Invalid bookmark ID",
					},
					400,
				);
			}
			const bookmark = await summaryService.getBookmarkById(bookmarkId);
			return c.json({
				success: true,
				bookmark,
			});
		} catch (error) {
			console.error("Failed to get bookmark:", error);
			const message =
				error instanceof Error ? error.message : "Failed to get bookmark";
			const statusCode = message.includes("not found") ? 404 : 500;
			return c.json(
				{
					success: false,
					error: message,
				},
				statusCode,
			);
		}
	});
	// 要約保存エンドポイント
	app.post("/bookmarks/:id/summary", async (c) => {
		try {
			const bookmarkId = Number.parseInt(c.req.param("id"), 10);
			if (Number.isNaN(bookmarkId)) {
				return c.json(
					{
						success: false,
						error: "Invalid bookmark ID",
					},
					400,
				);
			}
			const body = await c.req.json();
			const { summary } = body;
			if (!summary || typeof summary !== "string") {
				return c.json(
					{
						success: false,
						error: "Summary is required",
					},
					400,
				);
			}
			const bookmark = await summaryService.saveSummary({
				bookmarkId,
				summary,
			});
			return c.json({
				success: true,
				bookmark,
			});
		} catch (error) {
			console.error("Failed to save summary:", error);
			const message =
				error instanceof Error ? error.message : "Failed to save summary";
			const statusCode = message.includes("not found") ? 404 : 500;
			return c.json(
				{
					success: false,
					error: message,
				},
				statusCode,
			);
		}
	});
	// 要約更新エンドポイント
	app.put("/bookmarks/:id/summary", async (c) => {
		try {
			const bookmarkId = Number.parseInt(c.req.param("id"), 10);
			if (Number.isNaN(bookmarkId)) {
				return c.json(
					{
						success: false,
						error: "Invalid bookmark ID",
					},
					400,
				);
			}
			const body = await c.req.json();
			const { summary } = body;
			if (!summary || typeof summary !== "string") {
				return c.json(
					{
						success: false,
						error: "Summary is required",
					},
					400,
				);
			}
			const bookmark = await summaryService.updateSummary({
				bookmarkId,
				summary,
			});
			return c.json({
				success: true,
				bookmark,
			});
		} catch (error) {
			console.error("Failed to update summary:", error);
			const message =
				error instanceof Error ? error.message : "Failed to update summary";
			const statusCode = message.includes("not found") ? 404 : 500;
			return c.json(
				{
					success: false,
					error: message,
				},
				statusCode,
			);
		}
	});
	return app;
};
