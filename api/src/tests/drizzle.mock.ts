import { vi } from "vitest";

type DrizzleMockFunction = ReturnType<typeof vi.fn>;

const createChainableMock = (): DrizzleMockFunction => vi.fn().mockReturnThis();

export type DrizzleClientMock = {
	select: DrizzleMockFunction;
	from: DrizzleMockFunction;
	where: DrizzleMockFunction;
	leftJoin: DrizzleMockFunction;
	innerJoin: DrizzleMockFunction;
	insert: DrizzleMockFunction;
	values: DrizzleMockFunction;
	returning: DrizzleMockFunction;
	update: DrizzleMockFunction;
	delete: DrizzleMockFunction;
	set: DrizzleMockFunction;
	groupBy: DrizzleMockFunction;
	orderBy: DrizzleMockFunction;
	limit: DrizzleMockFunction;
	offset: DrizzleMockFunction;
	run: DrizzleMockFunction;
	get: DrizzleMockFunction;
	all: DrizzleMockFunction;
};

export const createDrizzleMock = () => {
	const client: DrizzleClientMock = {
		select: createChainableMock(),
		from: createChainableMock(),
		where: createChainableMock(),
		leftJoin: createChainableMock(),
		innerJoin: createChainableMock(),
		insert: createChainableMock(),
		values: createChainableMock(),
		returning: createChainableMock(),
		update: createChainableMock(),
		delete: createChainableMock(),
		set: createChainableMock(),
		groupBy: createChainableMock(),
		orderBy: createChainableMock(),
		limit: createChainableMock(),
		offset: createChainableMock(),
		run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
		get: vi.fn(),
		all: vi.fn(),
	};

	const drizzleMock = vi.fn(() => client);

	return { client, drizzleMock };
};

const resetChainableMock = (mockFn: DrizzleMockFunction) => {
	mockFn.mockReset();
	mockFn.mockReturnThis();
};

export const resetDrizzleMock = (client: DrizzleClientMock): void => {
	resetChainableMock(client.select);
	resetChainableMock(client.from);
	resetChainableMock(client.where);
	resetChainableMock(client.leftJoin);
	resetChainableMock(client.innerJoin);
	resetChainableMock(client.insert);
	resetChainableMock(client.values);
	resetChainableMock(client.returning);
	resetChainableMock(client.update);
	resetChainableMock(client.delete);
	resetChainableMock(client.set);
	resetChainableMock(client.groupBy);
	resetChainableMock(client.orderBy);
	resetChainableMock(client.limit);
	resetChainableMock(client.offset);
	client.run.mockReset();
	client.run.mockResolvedValue({ meta: { changes: 1 } });
	client.get.mockReset();
	client.all.mockReset();
};
