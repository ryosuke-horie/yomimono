/**
 * スター評価表示コンポーネント
 */
"use client";

interface Props {
	score: number; // 0-10の数値
	size?: "sm" | "md" | "lg";
	showNumber?: boolean; // スコア数値も表示するか
}

export function StarRating({ score, size = "md", showNumber = false }: Props) {
	// 0-10を0-5に変換（星の数）
	const starScore = score / 2;
	const fullStars = Math.floor(starScore);
	const hasHalfStar = starScore % 1 >= 0.5;
	const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6",
	};

	const starSize = sizeClasses[size];

	const StarIcon = ({ filled = false, half = false }) => (
		<svg
			className={`${starSize} ${
				filled || half ? "text-yellow-400" : "text-gray-300"
			}`}
			fill="currentColor"
			viewBox="0 0 20 20"
			xmlns="http://www.w3.org/2000/svg"
		>
			{half ? (
				<defs>
					<linearGradient id="half">
						<stop offset="50%" stopColor="currentColor" />
						<stop offset="50%" stopColor="#d1d5db" />
					</linearGradient>
				</defs>
			) : null}
			<path
				d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
				fill={half ? "url(#half)" : "currentColor"}
			/>
		</svg>
	);

	return (
		<div className="flex items-center gap-1">
			<div className="flex" title={`評価: ${score.toFixed(1)}/10`}>
				{/* 満点の星 */}
				{Array.from({ length: fullStars }).map((_, i) => (
					<StarIcon key={`full-${i}`} filled />
				))}
				{/* 半分の星 */}
				{hasHalfStar && <StarIcon half />}
				{/* 空の星 */}
				{Array.from({ length: emptyStars }).map((_, i) => (
					<StarIcon key={`empty-${i}`} />
				))}
			</div>
			{showNumber && (
				<span className="text-sm text-gray-600 ml-1">
					{score.toFixed(1)}/10
				</span>
			)}
		</div>
	);
}
