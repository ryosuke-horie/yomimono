import { API_BASE_URL } from "@/lib/api/config";
import type { ApiResponse } from "@/types/api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
	_request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const id = Number.parseInt(params.id, 10);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ success: false, message: "Invalid bookmark ID" },
				{ status: 400 },
			);
		}

		const response = await fetch(`${API_BASE_URL}/api/bookmarks/${id}/read`, {
			method: "PATCH",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = (await response.json()) as ApiResponse<void>;

		if (!data.success) {
			return NextResponse.json(
				{ success: false, message: data.message || "API request failed" },
				{ status: 400 },
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("API error:", error);
		return NextResponse.json(
			{
				success: false,
				message: "ブックマークの更新に失敗しました",
			},
			{ status: 500 },
		);
	}
}
