import type { Label } from "../types";

interface Props {
	labels: Label[];
	selectedLabelName?: string; // 選択中のラベル名 (undefined の場合は「すべて」)
	onLabelSelect: (labelName: string | undefined) => void;
}

export function LabelFilter({
	labels,
	selectedLabelName,
	onLabelSelect,
}: Props) {
	return (
		<div className="flex flex-wrap gap-2 mb-4">
			<button
				type="button"
				onClick={() => onLabelSelect(undefined)}
				className={`${
					!selectedLabelName
						? "bg-blue-500 text-white hover:bg-blue-600" // 選択中のスタイル
						: "bg-gray-100 text-gray-700 hover:bg-gray-200" // 非選択中のスタイル
				} px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ease-in-out`}
			>
				すべて
			</button>
			{labels.map((label) => (
				<button
					key={label.id}
					type="button"
					onClick={() => onLabelSelect(label.name)}
					className={`${
						selectedLabelName === label.name
							? "bg-blue-500 text-white hover:bg-blue-600" // 選択中のスタイル
							: "bg-gray-100 text-gray-700 hover:bg-gray-200" // 非選択中のスタイル
					} px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ease-in-out`}
				>
					{label.name}
					{/* APIがarticleCountを返すようになったらコメント解除 */}
					{/* {label.articleCount !== undefined && (
            <span className="ml-1 text-xs opacity-75">({label.articleCount})</span>
          )} */}
				</button>
			))}
		</div>
	);
}
