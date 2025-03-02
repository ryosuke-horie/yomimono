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
			console.log("Invalid bookmark ID:", params.id);
			return NextResponse.json(
				{ success: false, message: "Invalid bookmark ID" },
				{ status: 400 },
			);
		}

		console.log("Config API_BASE_URL:", API_BASE_URL);
		const url = `${API_BASE_URL}/bookmarks/${id}/read`;
		const options = {
			method: "PATCH",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		} as const;

		console.log("Sending request to backend:", {
			url,
			method: options.method,
			headers: options.headers,
		});

		const response = await fetch(url, options);

		console.log("Backend response status:", {
			status: response.status,
			statusText: response.statusText,
		});

		const responseText = await response.text();
		console.log("Backend response body:", responseText);

		if (!response.ok) {
			console.error("Backend request failed:", {
				status: response.status,
				statusText: response.statusText,
				body: responseText,
			});
			throw new Error(`Backend request failed: ${response.status}`);
		}

		let data: ApiResponse<void>;
		try {
			data = JSON.parse(responseText) as ApiResponse<void>;
		} catch (e) {
			console.error("Failed to parse backend response:", {
				error: e,
				responseText,
			});
			throw new Error("Invalid JSON response from backend");
		}

		if (!data.success) {
			console.warn("Backend reported failure:", {
				message: data.message,
				status: response.status,
			});
			return NextResponse.json(
				{ success: false, message: data.message || "API request failed" },
				{ status: 400 },
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("Fatal API error:", {
			error,
			params,
			API_BASE_URL,
		});
		return NextResponse.json(
			{
				success: false,
				message: "ブックマークの更新に失敗しました",
			},
			{ status: 500 },
		);
	}
}
