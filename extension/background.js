// URLをAPIに送信する関数
async function sendUrlsToApi(urlData) {
	const API_ENDPOINT =
		"https://effective-yomimono-api.ryosuke-horie37.workers.dev/api/bookmarks/bulk";
	try {
		const response = await fetch(API_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				bookmarks: urlData.map((data) => ({
					url: data.url,
					title: data.title || "",
				})),
			}),
		});

		if (!response.ok) {
			const errorData = await response.text();
			throw new Error(`APIリクエストエラー (${response.status}): ${errorData}`);
		}

		return await response.json();
	} catch (error) {
		console.error("APIリクエストに失敗:", error);
		throw error;
	}
}

// メッセージリスナーの設定
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
	if (request.action === "collectAndSendUrls") {
		// 選択されたタブの情報を使用
		sendUrlsToApi(request.tabs)
			.then((result) => {
				sendResponse({ success: true, data: result });
			})
			.catch((error) => {
				sendResponse({
					success: false,
					error: error.message,
					details: error.stack,
				});
			});
		return true;
	}
});
