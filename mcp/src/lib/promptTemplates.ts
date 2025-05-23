/**
 * エンジニア向け技術記事要約生成のプロンプトテンプレート
 */

export interface SummaryPromptOptions {
	url: string;
	title: string;
	bookmarkId: number;
	maxLength: number;
	includeKeyPoints: boolean;
}

/**
 * エンジニア向け技術記事要約生成のための詳細なプロンプトテンプレート
 */
export function generateEngineerSummaryPrompt(
	options: SummaryPromptOptions,
): string {
	const { url, title, bookmarkId, maxLength, includeKeyPoints } = options;

	return `以下のURLの技術記事を読み込んで、エンジニア向けの高品質な要約を生成してください。

URL: ${url}
タイトル: ${title || "タイトルなし"}
ブックマークID: ${bookmarkId}

## 要約生成の詳細指針

### 1. 基本要件
- 日本語で${maxLength}文字以内（目安として${Math.floor(maxLength * 0.8)}-${maxLength}文字）
- エンジニアが実際の開発で活用できる情報に焦点
- 技術的な正確性を最優先
- 後で見返した時に記事の価値がすぐに理解できる構成

### 2. 要約フォーマット
${
	includeKeyPoints
		? `
【概要】
記事の主題と解決する問題を1-2文で簡潔に説明

【学習ポイント】
・記事で紹介される新しい技術概念、パターン、手法
・従来手法との違いや改善点
・エンジニアとして押さえておくべき重要な考え方
・業界のトレンドや今後の方向性に関する洞察

【実装に役立つ情報】
・具体的なコード例、設定ファイル、コマンド
・ライブラリやツールの使用方法
・パフォーマンス最適化のテクニック
・セキュリティやベストプラクティスの考慮点
・トラブルシューティングのヒント

【関連技術・エコシステム】
・記事で言及される関連ライブラリ、フレームワーク、ツール
・代替技術や競合ソリューション
・前提となる技術知識や依存関係
・統合可能な他の技術スタック
`
		: `
【技術要約】
記事の技術的な内容を要点を絞って説明
・主要な技術概念と実装のポイント
・エンジニアが知っておくべき重要な情報
・実際の開発で活用できる知識
`
}

### 3. 記事解析のポイント
- **コードブロック**: 重要なコード例は具体的に言及し、何を実現しているかを説明
- **技術用語**: 正確な技術用語を使用し、必要に応じて簡潔な説明を付加
- **実装手順**: ステップバイステップの手順がある場合は要点を整理
- **性能・効果**: ベンチマーク結果や改善効果があれば数値とともに記載
- **制約・注意点**: 技術的な制約、互換性、注意すべき点を明記

### 4. 品質基準
- **具体性**: 抽象的な表現ではなく、具体的で実用的な情報
- **実用性**: 読者が実際に試せる、応用できる内容
- **正確性**: 技術的な誤解を招かない正確な表現
- **簡潔性**: 冗長にならず、要点を効率的に伝える

## 作業手順
1. 記事全体を精読し、技術的な核心を理解
2. エンジニアにとって最も価値のある情報を特定
3. 上記フォーマットに従って要約を生成
4. saveSummary ツールを使って要約を保存 (bookmarkId: ${bookmarkId})

## 特別な考慮事項
- **アクセス不可の場合**: 記事にアクセスできない理由を具体的に説明
- **技術レベル**: 中級エンジニア向けの詳細度で説明
- **コンテキスト**: 記事の公開時期や技術の成熟度も考慮
- **実践性**: 理論だけでなく、実際のプロジェクトで使える情報を重視

記事を読み込んで、上記の指針に従ってエンジニア向けの価値ある要約を生成してください。`;
}

/**
 * シンプルな要約用のプロンプトテンプレート（includeKeyPoints: false の場合）
 */
export function generateSimpleSummaryPrompt(
	options: SummaryPromptOptions,
): string {
	const { url, title, bookmarkId, maxLength } = options;

	return `以下のURLの技術記事を読み込んで、エンジニア向けの簡潔な要約を生成してください。

URL: ${url}
タイトル: ${title || "タイトルなし"}
ブックマークID: ${bookmarkId}

## 要求事項
- 日本語で${maxLength}文字以内
- 技術的な正確性を重視
- エンジニアが記事の価値を判断できる内容

## フォーマット
【技術要約】
・記事の主要な技術内容
・実装のポイントや重要な概念
・エンジニアにとっての学習価値

記事を読み込んで要約を生成し、saveSummary ツールで保存してください (bookmarkId: ${bookmarkId})。`;
}

/**
 * プロンプトテンプレートのメタデータ
 */
export const PROMPT_TEMPLATE_VERSION = "1.0.0";
export const PROMPT_TEMPLATE_LAST_UPDATED = "2024-01-01";

/**
 * 使用するプロンプトテンプレートを選択
 */
export function getSummaryPrompt(options: SummaryPromptOptions): string {
	return options.includeKeyPoints
		? generateEngineerSummaryPrompt(options)
		: generateSimpleSummaryPrompt(options);
}
