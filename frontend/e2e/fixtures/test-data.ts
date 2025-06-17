/**
 * E2Eテスト用のテストデータとフィクスチャ
 * モックデータやテスト用のサンプルデータを提供
 */

/**
 * テスト用のブックマークデータ
 */
export const testBookmarks = [
	{
		id: 1,
		title: "React 19の新機能について",
		url: "https://example.com/react-19",
		isRead: false,
		isFavorite: false,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 2,
		title: "TypeScriptの型安全性を向上させる方法",
		url: "https://example.com/typescript-safety",
		isRead: true,
		isFavorite: true,
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
	{
		id: 3,
		title: "Next.js 15の新機能",
		url: "https://example.com/nextjs-15",
		isRead: false,
		isFavorite: true,
		createdAt: "2024-01-03T00:00:00Z",
		updatedAt: "2024-01-03T00:00:00Z",
	},
];

/**
 * テスト用のラベルデータ
 */
export const testLabels = [
	{
		id: 1,
		name: "React",
		description: "React関連の記事",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 2,
		name: "TypeScript",
		description: "TypeScript関連の記事",
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
	{
		id: 3,
		name: "Next.js",
		description: "Next.js関連の記事",
		createdAt: "2024-01-03T00:00:00Z",
		updatedAt: "2024-01-03T00:00:00Z",
	},
];

/**
 * APIレスポンスのモック
 */
export const mockApiResponses = {
	bookmarks: {
		list: {
			data: testBookmarks,
			message: "ブックマーク一覧を取得しました",
		},
		create: {
			data: testBookmarks[0],
			message: "ブックマークを作成しました",
		},
		update: {
			data: { ...testBookmarks[0], isRead: true },
			message: "ブックマークを更新しました",
		},
	},
	labels: {
		list: {
			data: testLabels,
			message: "ラベル一覧を取得しました",
		},
		create: {
			data: testLabels[0],
			message: "ラベルを作成しました",
		},
	},
};

/**
 * ユーザー操作のテストケース
 */
export const userInteractions = {
	createBookmark: {
		title: "テスト記事",
		url: "https://example.com/test-article",
	},
	createLabel: {
		name: "テストラベル",
		description: "テスト用のラベル",
	},
	search: {
		query: "React",
		expectedResults: 2,
	},
};

/**
 * エラーケースのテストデータ
 */
export const errorCases = {
	invalidBookmark: {
		title: "",
		url: "invalid-url",
	},
	invalidLabel: {
		name: "",
		description: "",
	},
	networkError: {
		status: 500,
		message: "Internal Server Error",
	},
};
