document.addEventListener("DOMContentLoaded", async () => {
	const tabList = document.getElementById("tabList");
	const selectAllButton = document.getElementById("selectAllButton");
	const deselectAllButton = document.getElementById("deselectAllButton");
	const collectButton = document.getElementById("collectButton");
	const statusElement = document.getElementById("status");
	const resultElement = document.getElementById("result");

	function updateStatus(message, isError = false) {
		statusElement.textContent = message;
		statusElement.className = `status ${isError ? "error" : ""}`;
	}

	function updateResult(data) {
		resultElement.textContent = JSON.stringify(data, null, 2);
		resultElement.className = "result success";
	}

	// タブ一覧を表示
	async function displayTabs() {
		const tabs = await chrome.tabs.query({ currentWindow: true });
		tabList.innerHTML = "";

		for (const tab of tabs) {
			const tabItem = document.createElement("div");
			tabItem.className = "tab-item";

			const label = document.createElement("label");
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.dataset.tabId = tab.id;
			checkbox.dataset.url = tab.url;
			checkbox.dataset.title = tab.title || "";

			const title = document.createElement("span");
			title.className = "tab-title";
			title.textContent = tab.title || tab.url;

			label.appendChild(checkbox);
			label.appendChild(title);
			tabItem.appendChild(label);
			tabList.appendChild(tabItem);
		}
	}

	// 全選択/解除の処理
	function toggleAllCheckboxes(checked) {
		const checkboxes = tabList.querySelectorAll('input[type="checkbox"]');
		for (const checkbox of checkboxes) {
			checkbox.checked = checked;
		}
	}

	// 選択されたタブの情報を取得
	function getSelectedTabs() {
		const checkboxes = tabList.querySelectorAll(
			'input[type="checkbox"]:checked',
		);
		return Array.from(checkboxes).map((checkbox) => ({
			url: checkbox.dataset.url,
			title: checkbox.dataset.title,
		}));
	}

	// イベントリスナーの設定
	selectAllButton.addEventListener("click", () => toggleAllCheckboxes(true));
	deselectAllButton.addEventListener("click", () => toggleAllCheckboxes(false));

	collectButton.addEventListener("click", async () => {
		try {
			const selectedTabs = getSelectedTabs();

			if (selectedTabs.length === 0) {
				updateStatus("タブが選択されていません", true);
				return;
			}

			collectButton.disabled = true;
			updateStatus("選択したURLを送信中...");
			resultElement.textContent = "";

			// デバッグ用：選択されたタブの情報を表示
			console.log("選択されたタブ:", selectedTabs);
			updateStatus(`送信するタブ数: ${selectedTabs.length}`);

			const response = await chrome.runtime.sendMessage({
				action: "collectAndSendUrls",
				tabs: selectedTabs,
			});

			if (response.success) {
				updateStatus("URLの送信が完了しました");
				updateResult(response.data);
			} else {
				throw new Error(response.error);
			}
		} catch (error) {
			updateStatus(`エラーが発生しました: ${error.message}`, true);
			console.error("処理エラー:", error);
		} finally {
			collectButton.disabled = false;
		}
	});

	// 初期表示
	await displayTabs();
});
