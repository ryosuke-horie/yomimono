export interface Label {
	id: number;
	name: string;
	articleCount?: number; // LabelFilter で記事数を表示するために追加 (API側で対応が必要な場合あり)
}
