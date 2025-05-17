import type { Label } from "../labels/types";

export interface Bookmark {
	id: number;
	url: string;
	title: string | null;
	isRead: boolean;
	isFavorite: boolean;
	createdAt: string;
	updatedAt: string;
	summary: string | null;
	summaryCreatedAt: string | null;
	summaryUpdatedAt: string | null;
}

export interface BookmarkWithLabel extends Bookmark {
	label: Label | null;
}
