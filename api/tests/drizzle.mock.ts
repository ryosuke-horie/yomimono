import { vi } from "vitest";

type ChainableMethod =
	| "select"
	| "from"
	| "where"
	| "leftJoin"
	| "innerJoin"
	| "groupBy"
	| "orderBy"
	| "limit"
	| "offset"
	| "insert"
	| "update"
	| "set"
	| "values"
	| "returning"
	| "delete"
	| "prepare"
	| "bind";

const chainableMethods: ChainableMethod[] = [
	"select",
	"from",
	"where",
	"leftJoin",
	"innerJoin",
	"groupBy",
	"orderBy",
	"limit",
	"offset",
	"insert",
	"update",
	"set",
	"values",
	"returning",
	"delete",
	"prepare",
	"bind",
];

export const drizzleMock = vi.fn();

vi.mock("drizzle-orm/d1", () => ({
	drizzle: (...args: unknown[]) => drizzleMock(...args),
}));

export type DrizzleClientMock = ReturnType<typeof createDrizzleClientMock>;

export const createDrizzleClientMock = () => {
	const mockDb = Object.fromEntries(
		chainableMethods.map((method) => [method, vi.fn().mockReturnThis()]),
	) as Record<ChainableMethod, ReturnType<typeof vi.fn>> & {
		all: ReturnType<typeof vi.fn>;
		get: ReturnType<typeof vi.fn>;
		run: ReturnType<typeof vi.fn>;
	};

	mockDb.all = vi.fn();
	mockDb.get = vi.fn();
	mockDb.run = vi.fn().mockResolvedValue({ meta: { changes: 1 } });

	return mockDb;
};

export const resetDrizzleClientMock = (mockDb: DrizzleClientMock) => {
	chainableMethods.forEach((method) => {
		mockDb[method].mockReset();
		mockDb[method].mockReturnThis();
	});
	mockDb.all.mockReset();
	mockDb.get.mockReset();
	mockDb.run.mockReset();
	mockDb.run.mockResolvedValue({ meta: { changes: 1 } });
	drizzleMock.mockReset();
	drizzleMock.mockImplementation(() => mockDb);
};

export const setupDrizzleClientMock = () => {
	const mockDb = createDrizzleClientMock();
	drizzleMock.mockImplementation(() => mockDb);

	return { mockDb, drizzleMock };
};
