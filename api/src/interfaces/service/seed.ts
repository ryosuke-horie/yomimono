/**
 * シードデータ管理サービスのインターフェース
 * 開発環境でのテストデータ生成・管理機能を提供
 */

/**
 * シードデータ生成のオプション設定
 */
export interface SeedDataOptions {
	/** 生成するブックマーク数 (デフォルト: 25) */
	bookmarkCount?: number;
	/** 生成するラベル数 (デフォルト: 6) */
	labelCount?: number;
	/** お気に入り率 0-1 (デフォルト: 0.3) */
	favoriteRatio?: number;
	/** 本番環境でも実行を強制するか (デフォルト: false) */
	forceRun?: boolean;
}

/**
 * データベースの現在の状態情報
 */
export interface DatabaseStatus {
	/** ブックマーク総数 */
	bookmarkCount: number;
	/** ラベル総数 */
	labelCount: number;
	/** 記事-ラベル関連付け総数 */
	articleLabelCount: number;
	/** お気に入り総数 */
	favoriteCount: number;
	/** 未読ブックマーク数 */
	unreadCount: number;
	/** 既読ブックマーク数 */
	readCount: number;
	/** 最後にデータが更新された時刻 */
	lastUpdatedAt: string | null;
}

/**
 * シードデータ実行結果
 */
export interface SeedDataResult {
	/** 実行成功フラグ */
	success: boolean;
	/** 実行メッセージ */
	message: string;
	/** 生成されたデータの詳細 */
	generated: {
		bookmarks: number;
		labels: number;
		articleLabels: number;
		favorites: number;
	};
	/** 実行時間（ミリ秒） */
	executionTimeMs: number;
}

/**
 * シードデータ管理サービスのインターフェース
 */
export interface ISeedService {
	/**
	 * シードデータを生成・挿入する
	 * @param options シードデータ生成のオプション
	 * @returns 実行結果
	 */
	generateSeedData(options?: SeedDataOptions): Promise<SeedDataResult>;

	/**
	 * データベースの全データをクリアする
	 * @returns 実行結果（クリアされたレコード数を含む）
	 */
	clearAllData(): Promise<SeedDataResult>;

	/**
	 * データベースの現在の状態を取得する
	 * @returns データベース状態情報
	 */
	getDatabaseStatus(): Promise<DatabaseStatus>;

	/**
	 * 環境チェックを実行する
	 * 本番環境での実行を防ぐためのセーフティチェック
	 * @param forceRun 本番環境でも強制実行するか
	 * @returns 実行可能かどうか
	 */
	validateEnvironment(forceRun?: boolean): Promise<boolean>;
}
