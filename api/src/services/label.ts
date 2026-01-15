import type { Label } from "../db/schema";
import {
	ConflictError,
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../exceptions";
import type { IArticleLabelRepository } from "../interfaces/repository/articleLabel";
import type { IBookmarkRepository } from "../interfaces/repository/bookmark";
import type { ILabelRepository } from "../interfaces/repository/label";
import type { ILabelService } from "../interfaces/service/label";

/**
 * ラベル名を正規化する関数
 * - 前後の空白を除去
 * - 小文字に統一
 * - 全角英数字記号を半角に変換
 * @param name 正規化前のラベル名
 * @returns 正規化後のラベル名
 */
function normalizeLabelName(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)); // 全角 -> 半角
}

export class LabelService implements ILabelService {
	constructor(
		private readonly labelRepository: ILabelRepository,
		private readonly articleLabelRepository: IArticleLabelRepository,
		private readonly bookmarkRepository: IBookmarkRepository, // BookmarkRepositoryも必要
	) {}

	async getLabels(): Promise<(Label & { articleCount: number })[]> {
		return this.labelRepository.findAllWithArticleCount();
	}

	async assignLabel(
		articleId: number,
		labelName: string,
		description?: string,
	): Promise<Label> {
		// 1. ブックマークが存在するか確認
		const bookmark = await this.bookmarkRepository.findById(articleId);
		if (!bookmark) {
			throw new NotFoundError(`Bookmark with id ${articleId} not found`);
		}

		// 2. ラベル名を正規化
		const normalizedName = normalizeLabelName(labelName);
		if (!normalizedName) {
			throw new ValidationError(
				"Label name cannot be empty after normalization",
			);
		}

		// 3. 正規化された名前でラベルを検索
		let label = await this.labelRepository.findByName(normalizedName);

		// 4. ラベルが存在しなければ新規作成
		if (!label) {
			label = await this.labelRepository.create({
				name: normalizedName,
				description: description,
			});
		}

		// 5. 同じラベルが既に付与されていないか確認
		const existingArticleLabel =
			await this.articleLabelRepository.findByArticleId(articleId);

		if (existingArticleLabel) {
			if (existingArticleLabel.labelId === label.id) {
				throw new ConflictError(
					`Label "${normalizedName}" is already assigned to article ${articleId}`,
				);
			}
			// 既存の紐付けを削除して差し替える
			await this.articleLabelRepository.deleteByArticleId(articleId);
		}

		// 6. 記事とラベルを紐付け
		await this.articleLabelRepository.create({
			articleId: bookmark.id,
			labelId: label.id,
		});

		return label;
	}

	async createLabel(name: string, description?: string): Promise<Label> {
		// 1. ラベル名を正規化
		const normalizedName = normalizeLabelName(name);
		if (!normalizedName) {
			throw new ValidationError(
				"Label name cannot be empty after normalization",
			);
		}

		// 2. 正規化された名前でラベルを検索（重複チェック）
		const existingLabel = await this.labelRepository.findByName(normalizedName);
		if (existingLabel) {
			throw new ConflictError(`Label "${normalizedName}" already exists`);
		}

		// 3. 新しいラベルを作成
		const newLabel = await this.labelRepository.create({
			name: normalizedName,
			description: description,
		});
		return newLabel;
	}

	async deleteLabel(id: number): Promise<void> {
		// 1. ラベルを削除し、削除されたかどうかを確認
		const wasDeleted = await this.labelRepository.deleteById(id);
		if (!wasDeleted) {
			throw new NotFoundError(`Label with id ${id} not found`);
		}
		// 2. article_labelsテーブルの関連レコードは外部キー制約(onDelete: cascade)により自動的に削除される
	}

	async updateLabelDescription(
		id: number,
		description: string | null,
	): Promise<Label> {
		// 1. ラベルが存在するか確認
		const label = await this.labelRepository.findById(id);
		if (!label) {
			throw new NotFoundError(`Label with id ${id} not found`);
		}

		// 2. 説明文を更新
		const updatedLabel = await this.labelRepository.updateDescription(
			id,
			description,
		);
		if (!updatedLabel) {
			throw new InternalServerError(
				`Failed to update description for label with id ${id}`,
			);
		}

		return updatedLabel;
	}

	async cleanupUnusedLabels(): Promise<{
		deletedCount: number;
		deletedLabels: Array<{ id: number; name: string }>;
	}> {
		// 1. 全てのラベルと記事数を取得
		const labelsWithCount =
			await this.labelRepository.findAllWithArticleCount();

		// 2. 記事数が0のラベルを特定
		const unusedLabels = labelsWithCount.filter(
			(label) => label.articleCount === 0,
		);

		if (unusedLabels.length === 0) {
			return {
				deletedCount: 0,
				deletedLabels: [],
			};
		}

		// 3. 未使用ラベルのIDを抽出
		const unusedLabelIds = unusedLabels.map((label) => label.id);

		// 4. 一括削除を実行
		const deletedLabels = await this.labelRepository.deleteMany(unusedLabelIds);

		// 5. 結果を返す
		return {
			deletedCount: deletedLabels.length,
			deletedLabels: deletedLabels.map((label) => ({
				id: label.id,
				name: label.name,
			})),
		};
	}
}
