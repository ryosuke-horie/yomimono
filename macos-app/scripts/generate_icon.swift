#!/usr/bin/env swift
/**
 * yomimono アプリアイコン生成スクリプト
 * 開いた本のシルエットを CoreGraphics で描画し PNG として出力する
 */
import AppKit
import CoreGraphics

let size: CGFloat = 1024
let outputPath = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "icon_1024.png"

// ビットマップコンテキストを作成
guard let ctx = CGContext(
    data: nil,
    width: Int(size), height: Int(size),
    bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else {
    fputs("Failed to create CGContext\n", stderr)
    exit(1)
}

// 座標系を SwiftUI/UIKit 方式（左上原点）に統一
ctx.translateBy(x: 0, y: size)
ctx.scaleBy(x: 1, y: -1)

let rect = CGRect(x: 0, y: 0, width: size, height: size)

// --- 背景: 丸角正方形（インディゴ系グラデーション） ---
let cornerRadius: CGFloat = size * 0.22
let bgPath = CGPath(
    roundedRect: rect,
    cornerWidth: cornerRadius, cornerHeight: cornerRadius,
    transform: nil
)
ctx.addPath(bgPath)
ctx.clip()

// グラデーション（深い紺→少し明るい紺青）
let gradColors = [
    CGColor(red: 0.08, green: 0.11, blue: 0.28, alpha: 1.0),
    CGColor(red: 0.14, green: 0.22, blue: 0.45, alpha: 1.0),
] as CFArray
let gradLocations: [CGFloat] = [0.0, 1.0]
guard let grad = CGGradient(
    colorsSpace: CGColorSpaceCreateDeviceRGB(),
    colors: gradColors,
    locations: gradLocations
) else { exit(1) }

ctx.drawLinearGradient(
    grad,
    start: CGPoint(x: size * 0.2, y: 0),
    end: CGPoint(x: size * 0.8, y: size),
    options: []
)

// --- 本体: 開いた本 ---
// 本の中心・サイズを定義
let bookCX: CGFloat = size * 0.5
let bookCY: CGFloat = size * 0.52
let bookW: CGFloat  = size * 0.62
let bookH: CGFloat  = size * 0.48

// 左ページ
let leftPage = CGMutablePath()
leftPage.move(to: CGPoint(x: bookCX - bookW * 0.02, y: bookCY - bookH * 0.5))
leftPage.addLine(to: CGPoint(x: bookCX - bookW * 0.5, y: bookCY - bookH * 0.44))
leftPage.addCurve(
    to: CGPoint(x: bookCX - bookW * 0.5, y: bookCY + bookH * 0.5),
    control1: CGPoint(x: bookCX - bookW * 0.52, y: bookCY),
    control2: CGPoint(x: bookCX - bookW * 0.52, y: bookCY + bookH * 0.3)
)
leftPage.addLine(to: CGPoint(x: bookCX - bookW * 0.02, y: bookCY + bookH * 0.5))
leftPage.closeSubpath()

// 右ページ
let rightPage = CGMutablePath()
rightPage.move(to: CGPoint(x: bookCX + bookW * 0.02, y: bookCY - bookH * 0.5))
rightPage.addLine(to: CGPoint(x: bookCX + bookW * 0.5, y: bookCY - bookH * 0.44))
rightPage.addCurve(
    to: CGPoint(x: bookCX + bookW * 0.5, y: bookCY + bookH * 0.5),
    control1: CGPoint(x: bookCX + bookW * 0.52, y: bookCY),
    control2: CGPoint(x: bookCX + bookW * 0.52, y: bookCY + bookH * 0.3)
)
rightPage.addLine(to: CGPoint(x: bookCX + bookW * 0.02, y: bookCY + bookH * 0.5))
rightPage.closeSubpath()

// ページ（白 80% 不透明）を塗る
ctx.setFillColor(CGColor(red: 0.98, green: 0.97, blue: 0.95, alpha: 0.88))
ctx.addPath(leftPage)
ctx.fillPath()
ctx.addPath(rightPage)
ctx.fillPath()

// 見開き中央の影（縦の折り目）
let spineGrad = [
    CGColor(red: 0.1, green: 0.15, blue: 0.35, alpha: 0.6),
    CGColor(red: 0.1, green: 0.15, blue: 0.35, alpha: 0.0),
] as CFArray
guard let spineG = CGGradient(
    colorsSpace: CGColorSpaceCreateDeviceRGB(),
    colors: spineGrad,
    locations: [0.0, 1.0]
) else { exit(1) }

// 左側の折り目シャドウ
ctx.saveGState()
ctx.addPath(leftPage)
ctx.clip()
ctx.drawLinearGradient(
    spineG,
    start: CGPoint(x: bookCX - bookW * 0.02, y: bookCY),
    end: CGPoint(x: bookCX - bookW * 0.12, y: bookCY),
    options: []
)
ctx.restoreGState()

// 右側の折り目シャドウ
ctx.saveGState()
ctx.addPath(rightPage)
ctx.clip()
ctx.drawLinearGradient(
    spineG,
    start: CGPoint(x: bookCX + bookW * 0.02, y: bookCY),
    end: CGPoint(x: bookCX + bookW * 0.12, y: bookCY),
    options: []
)
ctx.restoreGState()

// ページ上のテキスト行（装飾）
ctx.setFillColor(CGColor(red: 0.5, green: 0.55, blue: 0.72, alpha: 0.45))
let lineStartY: CGFloat = bookCY - bookH * 0.28
let lineH: CGFloat = bookH * 0.055
let lineGap: CGFloat = bookH * 0.1
for i in 0..<4 {
    let y = lineStartY + CGFloat(i) * lineGap
    // 左ページの行
    let lw: CGFloat = i == 2 ? bookW * 0.28 : bookW * 0.35
    let lRect = CGRect(
        x: bookCX - bookW * 0.44,
        y: y,
        width: lw,
        height: lineH
    )
    ctx.fill(lRect.insetBy(dx: 0, dy: lineH * 0.1))
    // 右ページの行
    let rw: CGFloat = i == 3 ? bookW * 0.25 : bookW * 0.35
    let rRect = CGRect(
        x: bookCX + bookW * 0.07,
        y: y,
        width: rw,
        height: lineH
    )
    ctx.fill(rRect.insetBy(dx: 0, dy: lineH * 0.1))
}

// --- ブックマークリボン（右ページ上部） ---
let bmX: CGFloat = bookCX + bookW * 0.32
let bmTop: CGFloat = bookCY - bookH * 0.5
let bmW: CGFloat  = bookW * 0.085
let bmH: CGFloat  = bookH * 0.38
let bmNotchY: CGFloat = bmTop + bmH

let ribbon = CGMutablePath()
ribbon.move(to: CGPoint(x: bmX, y: bmTop))
ribbon.addLine(to: CGPoint(x: bmX + bmW, y: bmTop))
ribbon.addLine(to: CGPoint(x: bmX + bmW, y: bmNotchY))
ribbon.addLine(to: CGPoint(x: bmX + bmW * 0.5, y: bmNotchY - bmW * 0.55))
ribbon.addLine(to: CGPoint(x: bmX, y: bmNotchY))
ribbon.closeSubpath()

ctx.setFillColor(CGColor(red: 0.98, green: 0.55, blue: 0.25, alpha: 0.92))
ctx.addPath(ribbon)
ctx.fillPath()

// --- スパークル（AI概要機能のアクセント） ---
func drawSparkle(ctx: CGContext, cx: CGFloat, cy: CGFloat, r: CGFloat, color: CGColor) {
    ctx.setFillColor(color)
    let arms = 4
    let innerR = r * 0.32
    var pts: [CGPoint] = []
    for i in 0..<(arms * 2) {
        let angle = CGFloat(i) * .pi / CGFloat(arms) - .pi / 2
        let rad = i % 2 == 0 ? r : innerR
        pts.append(CGPoint(x: cx + cos(angle) * rad, y: cy + sin(angle) * rad))
    }
    let path = CGMutablePath()
    path.move(to: pts[0])
    for p in pts.dropFirst() { path.addLine(to: p) }
    path.closeSubpath()
    ctx.addPath(path)
    ctx.fillPath()
}

let sparkleColor = CGColor(red: 0.92, green: 0.82, blue: 0.98, alpha: 0.9)
drawSparkle(ctx: ctx, cx: size * 0.18, cy: size * 0.22, r: size * 0.045, color: sparkleColor)
drawSparkle(ctx: ctx, cx: size * 0.82, cy: size * 0.78, r: size * 0.03, color: sparkleColor)
drawSparkle(ctx: ctx, cx: size * 0.78, cy: size * 0.18, r: size * 0.022, color: sparkleColor)

// --- 本の下部シャドウ ---
ctx.setFillColor(CGColor(red: 0.0, green: 0.0, blue: 0.0, alpha: 0.18))
let shadowEllipse = CGRect(
    x: bookCX - bookW * 0.44,
    y: bookCY + bookH * 0.52,
    width: bookW * 0.88,
    height: bookH * 0.08
)
ctx.fillEllipse(in: shadowEllipse)

// --- PNG として書き出す ---
guard let cgImage = ctx.makeImage() else {
    fputs("Failed to create CGImage\n", stderr)
    exit(1)
}

let nsImage = NSImage(cgImage: cgImage, size: NSSize(width: size, height: size))
guard let tiffData = nsImage.tiffRepresentation,
      let bitmapRep = NSBitmapImageRep(data: tiffData),
      let pngData = bitmapRep.representation(using: .png, properties: [:])
else {
    fputs("Failed to encode PNG\n", stderr)
    exit(1)
}

let url = URL(fileURLWithPath: outputPath)
do {
    try pngData.write(to: url)
    print("Saved: \(outputPath)")
} catch {
    fputs("Write error: \(error)\n", stderr)
    exit(1)
}
