/**
 * 本棚機能の型定義
 */

export type BookStatus = "unread" | "reading" | "completed";

export interface Book {
	id: string;
	title: string;
	author?: string;
	coverUrl?: string;
	status: BookStatus;
	type: "book" | "pdf" | "repository";
	createdAt: string;
	updatedAt: string;
	notes?: string;
	progress?: number; // 読書進捗率（0-100）
}

export interface BookshelfApiResponse {
	books: Book[];
	totalCount: number;
}

export interface CreateBookRequest {
	title: string;
	author?: string;
	coverUrl?: string;
	status: BookStatus;
	type: "book" | "pdf" | "repository";
	notes?: string;
}

export interface UpdateBookStatusRequest {
	status: BookStatus;
	progress?: number;
}
