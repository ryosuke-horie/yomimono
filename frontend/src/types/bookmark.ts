export interface Bookmark {
	id: number;
	url: string;
	title: string | null;
	isRead: boolean;
	createdAt: string;
	updatedAt: string;
}
