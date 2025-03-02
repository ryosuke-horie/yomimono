export interface ApiResponse<T> {
	success: boolean;
	bookmarks?: T[];
	message?: string;
}
