import type { Label } from "../types";

interface Props {
	label: Label;
	onClick?: (labelName: string) => void; // クリック時にラベル名を渡すように変更
}

export function LabelDisplay({ label, onClick }: Props) {
	const handleClick = () => {
		if (onClick) {
			onClick(label.name);
		}
	};

	return (
		<button
			type="button" // button のデフォルト type は submit なので明示的に button を指定
			onClick={handleClick}
			className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={!onClick} // onClick が渡されない場合は非活性にする
		>
			{label.name}
		</button>
	);
}
