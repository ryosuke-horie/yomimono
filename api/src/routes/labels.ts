import { Hono } from "hono";
// Envの直接インポートは不要になる
import { LabelService } from "../services/label";
import { LabelRepository } from "../repositories/label";
import { ArticleLabelRepository } from "../repositories/articleLabel";
import { DrizzleBookmarkRepository } from "../repositories/bookmark"; // BookmarkRepositoryも必要
import type { Env } from "../index"; // Env型はHonoのジェネリクスで使用

const labels = new Hono<{ Bindings: Env }>(); // HonoのジェネリクスでBindingsを指定

labels.get("/", async (c) => {
	// c.envから直接DBを取得
	const db = c.env.DB;
	const labelRepository = new LabelRepository(db);
	const articleLabelRepository = new ArticleLabelRepository(db);
	// LabelServiceはBookmarkRepositoryにも依存するためインスタンス化
	const bookmarkRepository = new DrizzleBookmarkRepository(db);
	const labelService = new LabelService(
		labelRepository,
		articleLabelRepository,
		bookmarkRepository,
	);

	try {
		const result = await labelService.getLabels();
		return c.json({ success: true, labels: result });
	} catch (error) {
		console.error("Failed to get labels:", error);
		return c.json({ success: false, message: "Failed to fetch labels" }, 500);
	}
});

export default labels;
