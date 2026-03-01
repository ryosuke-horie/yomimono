/**
 * CLI連携による記事概要生成ビュー
 * ローカルにインストールされた claude / gemini CLI を使って記事URLの概要を生成する
 * CLI コマンドは SupportedCLI のホワイトリストに限定する
 */
import SwiftUI

struct ArticleSummaryView: View {
    let url: String
    let title: String

    @State private var summary = ""
    @State private var isGenerating = false
    @State private var errorMessage: String?
    @State private var selectedCLI = SupportedCLI.claude

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title)
                    .font(.headline)
                    .lineLimit(2)
                Spacer()
                Picker("CLI", selection: $selectedCLI) {
                    ForEach(SupportedCLI.allCases, id: \.self) { option in
                        Text(option.rawValue).tag(option)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 160)
            }

            Text(url)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .truncationMode(.middle)

            Divider()

            if isGenerating {
                HStack(spacing: 8) {
                    ProgressView()
                        .controlSize(.small)
                    Text("\(selectedCLI.rawValue) で概要を生成中...")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } else if !summary.isEmpty {
                ScrollView {
                    Text(summary)
                        .font(.body)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(maxHeight: 300)
            } else if let error = errorMessage {
                VStack(alignment: .leading, spacing: 4) {
                    Text("エラー")
                        .font(.caption)
                        .foregroundStyle(.red)
                    Text(error)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            } else {
                Text("「概要を生成」ボタンを押してください")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Button("概要を生成") {
                Task { await generateSummary() }
            }
            .disabled(isGenerating)
            .buttonStyle(.borderedProminent)
            .frame(maxWidth: .infinity)
        }
        .padding(16)
        .frame(width: 480, height: 400)
    }

    private func generateSummary() async {
        isGenerating = true
        defer { isGenerating = false }
        errorMessage = nil
        summary = ""

        // URL のスキームを検証（http/https のみ許可）
        guard let parsedURL = URL(string: url),
              let scheme = parsedURL.scheme,
              ["http", "https"].contains(scheme) else {
            errorMessage = "有効なURLではないため概要を生成できません"
            return
        }

        let prompt = "以下のURLの記事を読んで、技術的なポイントを日本語で3〜5行で要約してください。URL: \(parsedURL.absoluteString)"

        do {
            let output = try await CLIRunner.shared.run(cli: selectedCLI, prompt: prompt)
            let trimmed = output.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty {
                errorMessage = "CLIからの出力が空でした。コマンドが正常に動作しているか確認してください。"
            } else {
                summary = trimmed
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
