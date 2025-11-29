/**
 * タイムゾーン処理のユーティリティ関数群
 * 国際化対応と設定可能なタイムゾーン処理を提供
 */
import { TIMEZONE_CONFIG } from "../config/timezone";

/**
 * 指定されたタイムゾーンで日付をフォーマット
 */
export function formatToTimezone(
	date: Date,
	timezone: string = TIMEZONE_CONFIG.default,
): string {
	try {
		return new Intl.DateTimeFormat("ja-JP", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
	} catch (error) {
		console.warn(`Invalid timezone: ${timezone}, using default`, error);
		return new Intl.DateTimeFormat("ja-JP", {
			timeZone: TIMEZONE_CONFIG.default,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
	}
}

/**
 * 指定されたタイムゾーンでISO形式の日付文字列を取得（YYYY-MM-DD）
 */
export function formatToISODate(
	date: Date,
	timezone: string = TIMEZONE_CONFIG.default,
): string {
	try {
		// Intl.DateTimeFormatの結果をISO形式に変換
		const formatter = new Intl.DateTimeFormat("sv-SE", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		return formatter.format(date);
	} catch (error) {
		console.warn(`Invalid timezone: ${timezone}, using default`, error);
		const formatter = new Intl.DateTimeFormat("sv-SE", {
			timeZone: TIMEZONE_CONFIG.default,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		return formatter.format(date);
	}
}

/**
 * 配列のアイテムを日付でグループ化
 */
export function groupByDate<T extends { updatedAt: Date }>(
	items: T[],
	timezone?: string,
): { [dateStr: string]: T[] } {
	const grouped: { [dateStr: string]: T[] } = {};

	for (const item of items) {
		if (
			!(item.updatedAt instanceof Date) ||
			Number.isNaN(item.updatedAt.getTime())
		) {
			console.warn("Invalid updatedAt value found:", item.updatedAt);
			continue;
		}

		const dateStr = formatToISODate(item.updatedAt, timezone);

		if (!grouped[dateStr]) {
			grouped[dateStr] = [];
		}
		grouped[dateStr].push(item);
	}

	return grouped;
}

/**
 * タイムゾーンが有効かどうかを検証
 */
export function isValidTimezone(timezone: string): boolean {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: timezone });
		return true;
	} catch {
		return false;
	}
}
