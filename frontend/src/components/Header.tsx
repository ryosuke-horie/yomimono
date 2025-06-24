"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface Props {
	title?: string;
}

export function Header({ title: _title }: Props = {}) {
	const pathname = usePathname();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const isActive = (path: string) => {
		return pathname === path
			? "text-blue-600 border-b-2 border-blue-600"
			: "text-gray-600 hover:text-blue-500";
	};

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const menuItems = [
		{ href: "/", label: "未読一覧" },
		{ href: "/favorites", label: "お気に入り" },
		{ href: "/recent", label: "最近読んだ記事" },
		{ href: "/labels", label: "ラベル設定" },
	];

	return (
		<header className="fixed top-0 left-0 right-0 w-full z-50 bg-white shadow-sm">
			<div className="container mx-auto px-4">
				<div className="flex justify-between items-center h-16">
					<div className="flex-shrink-0">
						<Link href="/" className="text-xl font-bold text-green-400">
							Yomimono
						</Link>
					</div>

					{/* デスクトップ用メニュー */}
					<nav className="hidden md:flex space-x-8">
						{menuItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`inline-flex items-center px-1 pt-1 ${isActive(item.href)}`}
							>
								{item.label}
							</Link>
						))}
					</nav>

					{/* モバイル用ハンバーガーメニューボタン */}
					<div className="md:hidden">
						<button
							type="button"
							onClick={toggleMenu}
							className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
						>
							<span className="sr-only">メニューを開く</span>
							{isMenuOpen ? (
								<svg
									className="block h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							) : (
								<svg
									className="block h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
							)}
						</button>
					</div>
				</div>

				{/* モバイル用ドロップダウンメニュー */}
				{isMenuOpen && (
					<div className="md:hidden">
						<div className="px-2 pt-2 pb-3 space-y-1">
							{menuItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={`block px-3 py-2 rounded-md text-base font-medium ${
										pathname === item.href
											? "text-blue-600 bg-blue-50"
											: "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
									}`}
									onClick={() => setIsMenuOpen(false)}
								>
									{item.label}
								</Link>
							))}
						</div>
					</div>
				)}
			</div>
		</header>
	);
}
