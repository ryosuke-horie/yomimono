import { Hono } from "hono";
import type { Env } from "../index";
import { ArticleLabelRepository } from "../repositories/articleLabel";
import { DrizzleBookmarkRepository } from "../repositories/bookmark";
import { LabelRepository } from "../repositories/label";
import { LabelService } from "../services/label";

const labels = new Hono<{ Bindings: Env }>();

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

labels.post("/", async (c) => {
	// c.envから直接DBを取得
	const db = c.env.DB;
	const labelRepository = new LabelRepository(db);
	const articleLabelRepository = new ArticleLabelRepository(db);
	const bookmarkRepository = new DrizzleBookmarkRepository(db);
	const labelService = new LabelService(
		labelRepository,
		articleLabelRepository,
		bookmarkRepository,
	);

	try {
		const body = await c.req.json<{ name?: string }>();
		const labelName = body?.name;

		if (
			!labelName ||
			typeof labelName !== "string" ||
			labelName.trim() === ""
		) {
			return c.json(
				{
					success: false,
					message: "name is required and must be a non-empty string",
				},
				400,
			);
		}

		const newLabel = await labelService.createLabel(labelName);
		return c.json({ success: true, label: newLabel }, 201); // 201 Created
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("already exists")) {
				return c.json({ success: false, message: error.message }, 409); // 409 Conflict
			}
			if (error.message.includes("cannot be empty")) {
				return c.json({ success: false, message: error.message }, 400); // 400 Bad Request
			}
		}
		console.error("Failed to create label:", error);
		return c.json({ success: false, message: "Failed to create label" }, 500);
	}
});

// ラベル削除
labels.delete("/:id", async (c) => {
	const db = c.env.DB;
	const labelRepository = new LabelRepository(db);
	const articleLabelRepository = new ArticleLabelRepository(db);
	const bookmarkRepository = new DrizzleBookmarkRepository(db);
	const labelService = new LabelService(
		labelRepository,
		articleLabelRepository,
		bookmarkRepository,
	);

	try {
		const id = Number.parseInt(c.req.param("id"));
		if (Number.isNaN(id)) {
			return c.json({ success: false, message: "Invalid label ID" }, 400);
		}

		await labelService.deleteLabel(id);
		return c.json({ success: true, message: "Label deleted successfully" });
	} catch (error) {
		if (error instanceof Error && error.message.includes("not found")) {
			return c.json({ success: false, message: "Label not found" }, 404);
		}
		console.error("Failed to delete label:", error);
		return c.json({ success: false, message: "Failed to delete label" }, 500);
	}
});

export default labels;
