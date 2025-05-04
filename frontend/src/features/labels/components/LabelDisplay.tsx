import { useState } from "react";
import type { Label } from "../types";

interface Props {
	label: Label;
	onClick?: (labelName: string) => void; // クリック時にラベル名を渡すように変更
	showDescription?: boolean; // 説明文を表示するかどうか
}

export function LabelDisplay({
	label,
	onClick,
	showDescription = false,
}: Props) {
	const [isTooltipVisible, setIsTooltipVisible] = useState(false);

	const handleClick = () => {
		if (onClick) {
			onClick(label.name);
		}
	};

	// 説明文を表示するかどうかの判定
	const hasDescription = !!label.description;
	const canShowTooltip = showDescription && hasDescription;

	return (
		<div className="relative inline-block">
			<button
				type="button" // button のデフォルト type は submit なので明示的に button を指定
				onClick={handleClick}
				className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!onClick} // onClick が渡されない場合は非活性にする
				onMouseEnter={
					canShowTooltip ? () => setIsTooltipVisible(true) : undefined
				}
				onMouseLeave={
					canShowTooltip ? () => setIsTooltipVisible(false) : undefined
				}
				onFocus={canShowTooltip ? () => setIsTooltipVisible(true) : undefined}
				onBlur={canShowTooltip ? () => setIsTooltipVisible(false) : undefined}
				aria-describedby={
					canShowTooltip ? `label-tooltip-${label.id}` : undefined
				}
			>
				{label.name}
				{canShowTooltip && (
					<span className="ml-1 inline-flex items-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							className="w-3 h-3 text-blue-600"
						>
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
								clipRule="evenodd"
							/>
						</svg>
					</span>
				)}
			</button>

			{/* ツールチップ */}
			{canShowTooltip && isTooltipVisible && (
				<div
					id={`label-tooltip-${label.id}`}
					role="tooltip"
					className="absolute z-10 w-64 p-2 mt-2 text-sm text-left text-white bg-gray-700 rounded-md shadow-lg left-0 top-full"
				>
					<div className="text-xs font-medium mb-1">説明:</div>
					<p className="text-xs whitespace-pre-wrap">{label.description}</p>
					<div className="absolute w-3 h-3 -mt-1 rotate-45 bg-gray-700 top-0 left-3" />
				</div>
			)}
		</div>
	);
}
