import { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
	createErrorResponse,
	createErrorResponseBody,
} from "../exceptions";
import type { Env } from "../index";
import { ArticleLabelRepository } from "../repositories/articleLabel";
import { DrizzleBookmarkRepository } from "../repositories/bookmark";
import { LabelRepository } from "../repositories/label";
import { LabelService } from "../services/label";
import {
	validateId,
	validateOptionalString,
	validateRequestBody,
	validateRequiredString,
} from "../utils/validation";

const labels = new Hono<{ Bindings: Env }>();

labels.get("/", async (c) => {
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
		const result = await labelService.getLabels();
		return c.json({ success: true, labels: result });
	} catch (error) {
		console.error("Failed to get labels:", error);
		const errorResponse = createErrorResponse(error);
		return c.json(
			createErrorResponseBody(error),
			errorResponse.statusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500,
		);
	}
});

labels.post("/", async (c) => {
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
		const body = validateRequestBody<{ name?: string; description?: string }>(
			await c.req.json(),
		);
		const labelName = validateRequiredString(body.name, "name");
		const description = validateOptionalString(body.description, "description");

		const newLabel = await labelService.createLabel(labelName, description);
		return c.json({ success: true, label: newLabel }, 201);
	} catch (error) {
		if (error instanceof Error && !(error instanceof BadRequestError)) {
			if (error.message.includes("already exists")) {
				throw new ConflictError(error.message);
			}
			if (error.message.includes("cannot be empty")) {
				throw new BadRequestError(error.message);
			}
		}
		console.error("Failed to create label:", error);
		const errorResponse = createErrorResponse(error);
		return c.json(
			createErrorResponseBody(error),
			errorResponse.statusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500,
		);
	}
});

// ラベル取得（ID指定）
labels.get("/:id", async (c) => {
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
		const id = validateId(c.req.param("id"), "label ID");

		const label = await labelService.getLabelById(id);
		return c.json({ success: true, label });
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("not found") &&
			!(error instanceof BadRequestError)
		) {
			throw new NotFoundError("Label not found");
		}
		console.error("Failed to get label:", error);
		const errorResponse = createErrorResponse(error);
		return c.json(
			createErrorResponseBody(error),
			errorResponse.statusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500,
		);
	}
});

// ラベル説明文更新
labels.patch("/:id", async (c) => {
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
		const id = validateId(c.req.param("id"), "label ID");
		const body = validateRequestBody<{ description?: string | null }>(
			await c.req.json(),
		);

		// descriptionがundefinedの場合は更新しない
		if (body.description === undefined) {
			throw new BadRequestError("description is required");
		}

		// descriptionの型チェック（null許可の特殊ケース）
		if (body.description !== null && typeof body.description !== "string") {
			throw new BadRequestError("description must be a string or null");
		}

		const updatedLabel = await labelService.updateLabelDescription(
			id,
			body.description,
		);
		return c.json({ success: true, label: updatedLabel });
	} catch (error) {
		if (error instanceof Error && !(error instanceof BadRequestError)) {
			if (error.message.includes("not found")) {
				throw new NotFoundError("Label not found");
			}
			if (error.message.includes("Failed to update")) {
				throw new InternalServerError(error.message);
			}
		}
		console.error("Failed to update label description:", error);
		const errorResponse = createErrorResponse(error);
		return c.json(
			createErrorResponseBody(error),
			errorResponse.statusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500,
		);
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
		const id = validateId(c.req.param("id"), "label ID");

		await labelService.deleteLabel(id);
		return c.json({ success: true, message: "Label deleted successfully" });
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("not found") &&
			!(error instanceof BadRequestError)
		) {
			throw new NotFoundError("Label not found");
		}
		console.error("Failed to delete label:", error);
		const errorResponse = createErrorResponse(error);
		return c.json(
			createErrorResponseBody(error),
			errorResponse.statusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500,
		);
	}
});

export default labels;
