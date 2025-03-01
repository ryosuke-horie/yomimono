document.addEventListener('DOMContentLoaded', () => {
    const collectButton = document.getElementById('collectButton');
    const statusElement = document.getElementById('status');
    const resultElement = document.getElementById('result');

    function updateStatus(message, isError = false) {
        statusElement.textContent = message;
        statusElement.className = `status ${isError ? 'error' : ''}`;
    }

    function updateResult(data) {
        resultElement.textContent = JSON.stringify(data, null, 2);
        resultElement.className = 'result success';
    }

    collectButton.addEventListener('click', async () => {
        try {
            // ボタンを無効化
            collectButton.disabled = true;
            updateStatus('URLを収集中...');
            resultElement.textContent = '';

            // background.jsにメッセージを送信
            const response = await chrome.runtime.sendMessage({
                action: 'collectAndSendUrls'
            });

            if (response.success) {
                updateStatus('URLの送信が完了しました');
                updateResult(response.data);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            updateStatus(`エラーが発生しました: ${error.message}`, true);
            console.error('処理エラー:', error);
        } finally {
            // ボタンを再度有効化
            collectButton.disabled = false;
        }
    });
});