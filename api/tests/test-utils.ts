import { vi } from "vitest";

const defaultFetchResponse = {
	text: () => Promise.resolve("<title>Example Title</title>"),
};

export const mockFetch = vi.fn().mockResolvedValue(defaultFetchResponse);

// SQLiteクエリビルダー用のモック
const mockInsert = vi.fn().mockReturnValue({
	values: vi.fn().mockResolvedValue(undefined),
});

interface RequestBody {
	urls?: string[];
	[key: string]: unknown;
}

// D1データベースのモック
export const mockD1Database = {
	insert: mockInsert,
	select: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				all: vi.fn().mockResolvedValue([]),
			}),
		}),
	}),
	delete: vi.fn(),
	update: vi.fn(),
	batch: vi.fn(),
	resultKind: "dom",
	_: {},
	query: vi.fn(),
	prepare: vi.fn(),
	dump: vi.fn(),
	exec: vi.fn(),
};
