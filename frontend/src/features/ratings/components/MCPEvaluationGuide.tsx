/**
 * MCP評価ガイドコンポーネント
 */
"use client";

interface Props {
	compact?: boolean; // コンパクト表示モード
}

export function MCPEvaluationGuide({ compact = false }: Props) {
	if (compact) {
		return (
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
				<div className="flex items-center gap-2 text-blue-700">
					<span className="text-sm font-medium">
						📝 評価はClaude (MCP) で実行
					</span>
				</div>
				<p className="text-xs text-blue-600 mt-1">
					Claude Desktopで記事URLを指定し、評価ツールを使用してください
				</p>
			</div>
		);
	}

	return (
		<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
			<div className="flex items-center gap-2 mb-4">
				<span className="text-2xl">📝</span>
				<h3 className="text-lg font-semibold text-blue-900">
					記事評価について
				</h3>
			</div>

			<div className="space-y-4 text-blue-800">
				<p className="text-sm">
					記事の評価は <strong>Claude (MCP)</strong>{" "}
					を通じて行います。このUIは評価結果の閲覧・分析専用です。
				</p>

				<div className="bg-white rounded-lg p-4 border border-blue-100">
					<h4 className="font-semibold text-blue-900 mb-2">評価手順:</h4>
					<ol className="list-decimal list-inside space-y-1 text-sm">
						<li>Claude Desktop で記事URLを指定</li>
						<li>
							<code className="bg-blue-100 px-1 rounded text-xs">
								rateArticleWithContent
							</code>{" "}
							ツールで記事内容を取得
						</li>
						<li>
							5軸評価を実行し、
							<code className="bg-blue-100 px-1 rounded text-xs">
								rateArticle
							</code>{" "}
							で保存
						</li>
					</ol>
				</div>

				<div className="bg-white rounded-lg p-4 border border-blue-100">
					<h4 className="font-semibold text-blue-900 mb-2">評価軸:</h4>
					<ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
						<li className="flex items-center gap-2">
							<span className="w-2 h-2 bg-green-400 rounded-full" />
							実用性 (1-10)
						</li>
						<li className="flex items-center gap-2">
							<span className="w-2 h-2 bg-blue-400 rounded-full" />
							技術深度 (1-10)
						</li>
						<li className="flex items-center gap-2">
							<span className="w-2 h-2 bg-purple-400 rounded-full" />
							理解度 (1-10)
						</li>
						<li className="flex items-center gap-2">
							<span className="w-2 h-2 bg-yellow-400 rounded-full" />
							新規性 (1-10)
						</li>
						<li className="flex items-center gap-2">
							<span className="w-2 h-2 bg-red-400 rounded-full" />
							重要度 (1-10)
						</li>
					</ul>
				</div>

				<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
					<h4 className="font-semibold text-gray-900 mb-2">評価例:</h4>
					<pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
						<code>
							{`Claude上で：
「この記事を評価してください: https://example.com/article」

→ 記事内容取得・分析
→ 5軸評価実行
→ APIに自動保存`}
						</code>
					</pre>
				</div>

				<div className="flex items-center gap-2 text-xs text-blue-600">
					<span>💡</span>
					<span>評価後、このページで結果を確認・分析できます</span>
				</div>
			</div>
		</div>
	);
}
