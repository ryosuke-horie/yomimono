#!/usr/bin/env node
/**
 * E2Eテスト用のサーバー起動スクリプト
 * フロントエンドとAPIサーバーを並行起動し、起動完了を検知
 */

const { spawn } = require('child_process');
const http = require('http');

let frontendProcess = null;
let apiProcess = null;

// サーバーの起動確認
async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(res);
        });
        req.on('error', reject);
        req.setTimeout(1000);
      });
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// プロセスのクリーンアップ
function cleanup() {
  console.log('\n🛑 サーバーを停止中...');
  if (frontendProcess) {
    frontendProcess.kill('SIGTERM');
  }
  if (apiProcess) {
    apiProcess.kill('SIGTERM');
  }
  process.exit(0);
}

// シグナルハンドラー
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function startServers() {
  console.log('🚀 E2Eテスト用サーバーを起動中...');
  
  // フロントエンドサーバー起動
  console.log('📱 フロントエンドサーバーを起動中...');
  frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // APIサーバー起動
  console.log('🔌 APIサーバーを起動中...');
  apiProcess = spawn('npm', ['run', 'dev'], {
    cwd: '../api',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // フロントエンドの起動を待機
  console.log('⏳ フロントエンドサーバーの起動を待機中...');
  const frontendReady = await waitForServer('http://localhost:3000');
  if (!frontendReady) {
    console.error('❌ フロントエンドサーバーの起動に失敗しました');
    cleanup();
    return;
  }
  console.log('✅ フロントエンドサーバーが起動しました (localhost:3000)');

  // APIの起動を待機
  console.log('⏳ APIサーバーの起動を待機中...');
  const apiReady = await waitForServer('http://localhost:8787/health');
  if (!apiReady) {
    console.error('❌ APIサーバーの起動に失敗しました');
    cleanup();
    return;
  }
  console.log('✅ APIサーバーが起動しました (localhost:8787)');

  console.log('\n🎉 全てのサーバーが正常に起動しました！');
  console.log('📝 E2Eテストを実行してください: npx playwright test');
  console.log('🛑 終了するにはCtrl+Cを押してください');

  // プロセスを維持
  process.stdin.resume();
}

startServers().catch(console.error);