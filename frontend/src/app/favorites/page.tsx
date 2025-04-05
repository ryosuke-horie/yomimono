"use client";

import { BookmarksList } from "@/components/BookmarksList";
export default function FavoritesPage() {
	return (
		<main className="container mx-auto px-4 py-8">
			<BookmarksList mode="favorites" />
		</main>
	);
}
