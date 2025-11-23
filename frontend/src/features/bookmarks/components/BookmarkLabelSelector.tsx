import { useEffect, useRef, useState } from "react";
import { LabelDisplay } from "@/features/labels/components/LabelDisplay";
import type { Label } from "@/features/labels/types";

interface Props {
	label: Label;
	availableLabels: Label[];
	onSelect: (label: Label) => void;
	disabled?: boolean;
	isUpdating?: boolean;
}

export function BookmarkLabelSelector({
	label,
	availableLabels,
	onSelect,
	disabled = false,
	isUpdating = false,
}: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const hasOptions = availableLabels.length > 0;
	const isSelectorDisabled = disabled || !hasOptions || isUpdating;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleToggle = () => {
		if (isSelectorDisabled) return;
		setIsOpen((prev) => !prev);
	};

	const handleSelect = (nextLabel: Label) => {
		onSelect(nextLabel);
		setIsOpen(false);
	};

	return (
		<div className="relative inline-block" ref={containerRef}>
			<div className="flex items-center gap-2">
				<LabelDisplay
					label={label}
					onClick={isSelectorDisabled ? undefined : handleToggle}
				/>
				{isUpdating && (
					<span
						role="status"
						aria-label="ラベル更新中"
						className="h-4 w-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"
					/>
				)}
			</div>

			{isOpen && (
				<div className="absolute left-0 z-20 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg">
					<div className="border-b px-3 py-2 text-xs text-gray-500">
						登録済みのラベルから選択
					</div>
					<div className="max-h-64 overflow-y-auto p-1">
						{availableLabels.map((candidate) => {
							const isActive = candidate.id === label.id;
							return (
								<button
									key={candidate.id}
									type="button"
									onClick={() => handleSelect(candidate)}
									disabled={isUpdating}
									className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition ${
										isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"
									} ${isUpdating ? "opacity-60 cursor-not-allowed" : ""}`}
								>
									<span>{candidate.name}</span>
									{isActive && (
										<span className="text-xs font-medium text-blue-600">
											選択中
										</span>
									)}
								</button>
							);
						})}
						{!hasOptions && (
							<p className="px-3 py-2 text-xs text-gray-500">
								選択できるラベルがありません
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
