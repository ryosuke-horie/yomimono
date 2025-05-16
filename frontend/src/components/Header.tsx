"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
	const pathname = usePathname();

	const isActive = (path: string) => {
		return pathname === path
			? "text-blue-600 border-b-2 border-blue-600"
			: "text-gray-600 hover:text-blue-500";
	};

	return (
		<header className="fixed top-0 left-0 right-0 w-full z-50 bg-white shadow-sm">
			<div className="container mx-auto px-4">
				<div className="flex justify-between items-center h-16">
					<div className="flex-shrink-0">
						<Link href="/" className="text-xl font-bold text-green-400">
							Yomimono
						</Link>
					</div>

					<nav className="flex space-x-8">
						<Link
							href="/"
							className={`inline-flex items-center px-1 pt-1 ${isActive("/")}`}
						>
							未読一覧
						</Link>
						<Link
							href="/favorites"
							className={`inline-flex items-center px-1 pt-1 ${isActive("/favorites")}`}
						>
							お気に入り
						</Link>
						<Link
							href="/recent"
							className={`inline-flex items-center px-1 pt-1 ${isActive("/recent")}`}
						>
							最近読んだ記事
						</Link>
						<Link
							href="/labels"
							className={`inline-flex items-center px-1 pt-1 ${isActive("/labels")}`}
						>
							ラベル設定
						</Link>
					</nav>
				</div>
			</div>
		</header>
	);
}
