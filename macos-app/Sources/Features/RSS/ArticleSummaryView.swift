/**
 * CLI連携による記事概要生成ビュー
 * ローカルにインストールされた claude / gemini CLI を使って記事URLの概要を生成する
 */
import SwiftUI

struct ArticleSummaryView: View {
    let url: String
    let title: String

    @State private var summary = ""
    @State private var isGenerating = false
    @State private var errorMessage: String?
    @AppStorage("selectedCLI") private var selectedCLI = "claude"

    private let cliOptions = ["claude", "gemini"]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // ヘッダー
            HStack {
                Text(title)
                    .font(.headline)
                    .lineLimit(2)
                Spacer()
                Picker("CLI", selection: $selectedCLI) {
                    ForEach(cliOptions, id: \.self) { option in
                        Text(option).tag(option)
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

            // 概要生成エリア
            if isGenerating {
                HStack(spacing: 8) {
                    ProgressView()
                        .controlSize(.small)
                    Text("\(selectedCLI) で概要を生成中...")
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
        errorMessage = nil
        summary = ""

        let prompt = "以下のURLの記事を読んで、技術的なポイントを日本語で3〜5行で要約してください。URL: \(url)"

        do {
            let output: String
            switch selectedCLI {
            case "claude":
                output = try await CLIRunner.shared.run(command: "claude", arguments: ["-p", prompt])
            case "gemini":
                output = try await CLIRunner.shared.run(command: "gemini", arguments: [prompt])
            default:
                output = try await CLIRunner.shared.run(command: selectedCLI, arguments: ["-p", prompt])
            }
            summary = output.trimmingCharacters(in: .whitespacesAndNewlines)
        } catch {
            errorMessage = error.localizedDescription
        }

        isGenerating = false
    }
}
