import { describe, expect, it } from "vitest";
import { BFF_ERROR_CODES, BffError } from "@/lib/bff/errors";
import { parseLabelId } from "../route-utils";

describe("parseLabelId", () => {
	it("有効な数値文字列をパースできる", () => {
		expect(parseLabelId("123")).toBe(123);
		expect(parseLabelId("1")).toBe(1);
	});

	it("数値でない文字列の場合はBffErrorを投げる", () => {
		expect(() => parseLabelId("abc")).toThrow(BffError);
		expect(() => parseLabelId("abc")).toThrow(
			expect.objectContaining({
				code: BFF_ERROR_CODES.BAD_REQUEST,
			}),
		);
	});

	it("小数の場合はBffErrorを投げる", () => {
		expect(() => parseLabelId("1.5")).toThrow(BffError);
	});

	it("0以下の数値の場合はBffErrorを投げる", () => {
		expect(() => parseLabelId("0")).toThrow(BffError);
		expect(() => parseLabelId("-1")).toThrow(BffError);
	});

	it("undefinedの場合はBffErrorを投げる", () => {
		expect(() => parseLabelId(undefined)).toThrow(BffError);
	});
});
