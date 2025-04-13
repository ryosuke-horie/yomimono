import type { Label } from "../db/schema";
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

	async assignLabel(articleId: number, labelName: string): Promise<Label> {
		// 1. ブックマークが存在するか確認
		const bookmark = await this.bookmarkRepository.findById(articleId);
		if (!bookmark) {
			throw new Error(`Bookmark with id ${articleId} not found`);
		}

		// 2. ラベル名を正規化
		const normalizedName = normalizeLabelName(labelName);
		if (!normalizedName) {
			throw new Error("Label name cannot be empty after normalization");
		}

		// 3. 正規化された名前でラベルを検索
		let label = await this.labelRepository.findByName(normalizedName);

		// 4. ラベルが存在しなければ新規作成
		if (!label) {
			label = await this.labelRepository.create({ name: normalizedName });
		}

		// 5. 同じラベルが既に付与されていないか確認
		const existingArticleLabel = await this.articleLabelRepository.findByArticleId(articleId);
		if (existingArticleLabel && existingArticleLabel.labelId === label.id) {
			throw new Error(`Label "${normalizedName}" is already assigned to article ${articleId}`);
		}

		// 6. 記事とラベルを紐付け
		await this.articleLabelRepository.create({
			articleId: bookmark.id,
			labelId: label.id,
		});

		return label;
	}
}
