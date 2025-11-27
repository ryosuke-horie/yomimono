import { vi } from "vitest";

export type DrizzleClientMock = ReturnType<typeof createDrizzleClientMock>;

export const createDrizzleClientMock = () => ({
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	leftJoin: vi.fn().mockReturnThis(),
	innerJoin: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
	groupBy: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	offset: vi.fn().mockReturnThis(),
	insert: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	delete: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	returning: vi.fn().mockReturnThis(),
	prepare: vi.fn().mockReturnThis(),
	bind: vi.fn().mockReturnThis(),
	run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
	get: vi.fn(),
	all: vi.fn(),
});

export const createDrizzleD1ModuleMock = (mockDb: DrizzleClientMock) => ({
	drizzle: vi.fn(() => mockDb),
});
