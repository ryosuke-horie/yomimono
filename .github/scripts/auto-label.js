#!/usr/bin/env node

/**
 * 自動ラベル付けスクリプト
 * MCP APIを直接呼び出してラベル付けを実行する
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://effective-yomimono-api.ryosuke-horie37.workers.dev';
const DRY_RUN = process.env.DRY_RUN === 'true';
const MAX_ARTICLES = process.env.MAX_ARTICLES ? parseInt(process.env.MAX_ARTICLES) : null;

// ラベル判定ルール
const LABEL_RULES = {
  'ai': ['AI', 'MCP', 'LLM', 'Claude', 'GPT', 'Copilot', '機械学習', 'ディープラーニング'],
  'frontend': ['React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'フロントエンド', 'CSS', 'HTML'],
  'backend': ['Node.js', 'Express', 'Django', 'Rails', 'Spring', 'API', 'サーバー', 'バックエンド'],
  'typescript': ['TypeScript', 'TS', '型システム', 'type', 'interface'],
  'react': ['React', 'Hook', 'useState', 'useEffect', 'Redux', 'Context'],
  'データベース': ['データベース', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'DB'],
  'インフラ・devops': ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'DevOps'],
  'セキュリティ': ['セキュリティ', '認証', '認可', 'OAuth', 'JWT', '脆弱性', 'XSS', 'CSRF'],
  'テスト': ['テスト', 'test', 'testing', 'jest', 'vitest', 'TDD', 'E2E'],
  'アーキテクチャ': ['アーキテクチャ', '設計', 'DDD', 'マイクロサービス', 'レイヤード'],
  'パフォーマンス': ['パフォーマンス', '最適化', 'チューニング', '高速化', 'キャッシュ']
};

async function fetchFromAPI(endpoint, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: AbortSignal.timeout(10000) // 10秒タイムアウト
      });
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.warn(`  ⚠️ APIリクエスト失敗 (試行 ${i + 1}/${retries}): ${error.message}`);
      if (i === retries - 1) throw error;
      // リトライ前に待機
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

async function putToAPI(endpoint, data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000) // 10秒タイムアウト
      });
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.warn(`  ⚠️ PUTリクエスト失敗 (試行 ${i + 1}/${retries}): ${error.message}`);
      if (i === retries - 1) throw error;
      // リトライ前に待機
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

function determineLabel(article) {
  const text = (article.title || '').toLowerCase();
  
  for (const [label, keywords] of Object.entries(LABEL_RULES)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return label;
      }
    }
  }
  
  // デフォルトラベル
  return 'quick-read';
}

async function main() {
  console.log('=== 自動ラベル付け処理開始 (フォールバックスクリプト) ===');
  console.log(`設定: DRY_RUN=${DRY_RUN}, MAX_ARTICLES=${MAX_ARTICLES || '制限なし'}`);
  console.log(`API URL: ${API_BASE_URL}`);
  
  // APIヘルスチェック
  console.log('API接続チェック中...');
  try {
    const healthCheck = await fetch(`${API_BASE_URL}/api/labels`, {
      signal: AbortSignal.timeout(5000)
    });
    if (healthCheck.ok) {
      console.log('✅ API接続正常');
    } else {
      console.warn(`⚠️ API応答: ${healthCheck.status}`);
    }
  } catch (error) {
    console.error('❌ API接続エラー:', error.message);
    console.log('続行します...');
  }
  
  try {
    // 既存のラベル一覧を取得
    console.log('既存のラベル一覧を取得中...');
    let labels = [];
    try {
      const labelsResponse = await fetchFromAPI('/api/labels');
      labels = labelsResponse.labels || labelsResponse || [];
      console.log(`✅ ${labels.length}個のラベルを取得しました`);
    } catch (error) {
      console.error('❌ ラベル取得失敗:', error.message);
      console.log('デフォルトラベルを使用して続行します');
    }
    
    // ラベル付けされていない記事を取得
    console.log('未ラベル記事を取得中...');
    let unlabeledArticles = [];
    try {
      const articlesResponse = await fetchFromAPI('/api/bookmarks/unlabeled');
      unlabeledArticles = articlesResponse.bookmarks || articlesResponse || [];
      console.log(`✅ ${unlabeledArticles.length}個の未ラベル記事を取得しました`);
    } catch (error) {
      console.error('❌ 未ラベル記事取得失敗:', error.message);
      throw error; // ここは重要なのでエラーを上げる
    }
    
    if (!Array.isArray(unlabeledArticles) || unlabeledArticles.length === 0) {
      console.log('ℹ️ ラベル付けが必要な記事はありません');
      return;
    }
    
    // 処理対象を制限
    const articlesToProcess = MAX_ARTICLES 
      ? unlabeledArticles.slice(0, MAX_ARTICLES)
      : unlabeledArticles;
    
    console.log(`${articlesToProcess.length}件の記事を処理します`);
    
    const results = {
      success: 0,
      failed: 0,
      labelCounts: {}
    };
    
    // 各記事にラベルを付ける
    for (const article of articlesToProcess) {
      const label = determineLabel(article);
      console.log(`- [${article.id}] "${article.title}" → ${label}`);
      
      if (!DRY_RUN) {
        try {
          await putToAPI(`/api/bookmarks/${article.id}/label`, {
            labelName: label
          });
          results.success++;
          results.labelCounts[label] = (results.labelCounts[label] || 0) + 1;
        } catch (error) {
          console.error(`  ❌ ラベル付け失敗: ${error.message}`);
          results.failed++;
        }
      } else {
        console.log('  (DRY RUNのため実際のラベル付けはスキップ)');
        results.success++;
        results.labelCounts[label] = (results.labelCounts[label] || 0) + 1;
      }
    }
    
    // 結果サマリー
    console.log('\n=== 処理結果サマリー ===');
    console.log(`処理対象: ${articlesToProcess.length}件`);
    console.log(`処理完了: ${results.success}件`);
    console.log(`処理失敗: ${results.failed}件`);
    console.log('\nラベル内訳:');
    for (const [label, count] of Object.entries(results.labelCounts)) {
      console.log(`  - ${label}: ${count}件`);
    }
    
    if (DRY_RUN) {
      console.log('\n⚠️ DRY RUNモードで実行されました。実際のラベル付けは行われていません。');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});