/**
 * 外部CLI（claude / gemini 等）をサブプロセスとして呼び出すサービス
 * Foundation.Process を使用して非同期にコマンドを実行する
 */
import Foundation

enum CLIRunnerError: LocalizedError {
    case commandNotFound(String)
    case executionFailed(Int32, String)

    var errorDescription: String? {
        switch self {
        case .commandNotFound(let cmd):
            return "コマンドが見つかりません: \(cmd)"
        case .executionFailed(let code, let stderr):
            return "実行失敗 (exit \(code)): \(stderr)"
        }
    }
}

actor CLIRunner {
    static let shared = CLIRunner()

    private init() {}

    // コマンドを実行して標準出力を返す
    func run(command: String, arguments: [String]) async throws -> String {
        guard let executableURL = findExecutable(command) else {
            throw CLIRunnerError.commandNotFound(command)
        }

        return try await withCheckedThrowingContinuation { continuation in
            let process = Process()
            process.executableURL = executableURL
            process.arguments = arguments

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

            process.terminationHandler = { proc in
                let out = String(data: outPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
                let err = String(data: errPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""

                if proc.terminationStatus == 0 {
                    continuation.resume(returning: out)
                } else {
                    continuation.resume(throwing: CLIRunnerError.executionFailed(proc.terminationStatus, err))
                }
            }

            do {
                try process.run()
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    // コマンドのフルパスを探索する（PATH + 既知の一般的な場所）
    private func findExecutable(_ command: String) -> URL? {
        // 既にフルパスの場合
        if command.hasPrefix("/") {
            let url = URL(fileURLWithPath: command)
            if FileManager.default.isExecutableFile(atPath: url.path) { return url }
            return nil
        }

        // PATH 環境変数から探索
        let pathEnv = ProcessInfo.processInfo.environment["PATH"] ?? ""
        let searchPaths = pathEnv.split(separator: ":").map(String.init)
        let fallbackPaths = ["/usr/local/bin", "/opt/homebrew/bin", "/usr/bin", "/bin",
                             "\(NSHomeDirectory())/.local/bin",
                             "\(NSHomeDirectory())/.npm-global/bin"]
        let allPaths = searchPaths + fallbackPaths

        for dir in allPaths {
            let url = URL(fileURLWithPath: "\(dir)/\(command)")
            if FileManager.default.isExecutableFile(atPath: url.path) { return url }
        }

        return nil
    }
}
