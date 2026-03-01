/**
 * 外部CLI（claude / gemini 等）をサブプロセスとして呼び出すサービス
 * Foundation.Process を使用して非同期にコマンドを実行する
 */
import Foundation

// サポートする CLI ツールのホワイトリスト
enum SupportedCLI: String, CaseIterable {
    case claude
    case gemini

    // CLIごとの引数フォーマット
    func arguments(for prompt: String) -> [String] {
        switch self {
        case .claude:
            return ["-p", prompt]
        case .gemini:
            return [prompt]
        }
    }
}

enum CLIRunnerError: LocalizedError {
    case commandNotFound(String)
    case launchFailed(Error)
    case executionFailed(Int32, String)

    var errorDescription: String? {
        switch self {
        case .commandNotFound(let cmd):
            return "コマンドが見つかりません: \(cmd)"
        case .launchFailed(let error):
            return "起動失敗: \(error.localizedDescription)"
        case .executionFailed(let code, let stderr):
            let detail = stderr.isEmpty ? "詳細なし" : stderr
            return "実行失敗 (exit \(code)): \(detail)"
        }
    }
}

actor CLIRunner {
    static let shared = CLIRunner()

    private init() {}

    // コマンドを実行して標準出力を返す
    func run(cli: SupportedCLI, prompt: String) async throws -> String {
        guard let executableURL = findExecutable(cli.rawValue) else {
            throw CLIRunnerError.commandNotFound(cli.rawValue)
        }

        return try await withCheckedThrowingContinuation { continuation in
            let process = Process()
            process.executableURL = executableURL
            process.arguments = cli.arguments(for: prompt)

            // 環境変数を引き継ぐ（PATH を含む）
            var env = ProcessInfo.processInfo.environment
            if env["PATH"] == nil {
                env["PATH"] = "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
            }
            process.environment = env

            let outPipe = Pipe()
            let errPipe = Pipe()
            process.standardOutput = outPipe
            process.standardError = errPipe

            do {
                try process.run()
            } catch {
                continuation.resume(throwing: CLIRunnerError.launchFailed(error))
                return
            }

            // readDataToEndOfFile() + waitUntilExit() はブロッキングのため
            // cooperative thread pool を占有しないよう DispatchQueue で実行する
            DispatchQueue.global(qos: .userInitiated).async {
                let outData = outPipe.fileHandleForReading.readDataToEndOfFile()
                let errData = errPipe.fileHandleForReading.readDataToEndOfFile()
                process.waitUntilExit()

                let out = String(data: outData, encoding: .utf8) ?? ""
                let err = String(data: errData, encoding: .utf8) ?? ""

                if process.terminationStatus == 0 {
                    continuation.resume(returning: out)
                } else {
                    continuation.resume(throwing: CLIRunnerError.executionFailed(
                        process.terminationStatus, err))
                }
            }
        }
    }

    // コマンドのフルパスを探索する（PATH + 既知の一般的な場所）
    private func findExecutable(_ command: String) -> URL? {
        let pathEnv = ProcessInfo.processInfo.environment["PATH"] ?? ""
        let searchPaths = pathEnv.split(separator: ":").map(String.init)
        let fallbackPaths = ["/usr/local/bin", "/opt/homebrew/bin", "/usr/bin", "/bin",
                             "\(NSHomeDirectory())/.local/bin",
                             "\(NSHomeDirectory())/.npm-global/bin"]

        for dir in searchPaths + fallbackPaths {
            let url = URL(fileURLWithPath: "\(dir)/\(command)")
            if FileManager.default.isExecutableFile(atPath: url.path) { return url }
        }
        return nil
    }
}
