import { Hono } from "hono";
import {
	BadRequestError,
	ConflictError,
	createErrorResponse,
	createErrorResponseBody,
	InternalServerError,
	NotFoundError,
	toContentfulStatusCode,
} from "../exceptions";
import type { ILabelService } from "../interfaces/service/label";
import {
	validateId,
	validateOptionalString,
	validateRequestBody,
	validateRequiredString,
} from "../utils/validation";

export const createLabelsRouter = (labelService: ILabelService) => {
	const app = new Hono();

	app.get("/", async (c) => {
		try {
			const result = await labelService.getLabels();
			return c.json({ success: true, labels: result });
		} catch (error) {
			console.error("Failed to get labels:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	app.post("/", async (c) => {
		try {
			const body = validateRequestBody<{ name?: string; description?: string }>(
				await c.req.json(),
			);
			const labelName = validateRequiredString(body.name, "name");
			const description = validateOptionalString(
				body.description,
				"description",
			);

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
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// 未使用ラベル一括削除（これを/:idより前に定義する必要がある）
	app.delete("/cleanup", async (c) => {
		try {
			const result = await labelService.cleanupUnusedLabels();
			return c.json({
				success: true,
				message: `Successfully cleaned up ${result.deletedCount} unused labels`,
				deletedCount: result.deletedCount,
				deletedLabels: result.deletedLabels,
			});
		} catch (error) {
			console.error("Failed to cleanup unused labels:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// ラベル説明文更新
	app.patch("/:id", async (c) => {
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
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// ラベル削除
	app.delete("/:id", async (c) => {
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
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	return app;
};
