/**
 * 設定ファイルのセットアップスクリプト
 * サンプル設定ファイルから実際の設定ファイルを作成します
 */

const fs = require('fs');
const path = require('path');

const sampleConfigPath = path.join(__dirname, '../server/config/directories.sample.ts');
const configPath = path.join(__dirname, '../server/config/directories.ts');

function setupConfig() {
  // 既に設定ファイルが存在する場合はスキップ
  if (fs.existsSync(configPath)) {
    console.log('✅ 設定ファイルは既に存在します: server/config/directories.ts');
    return;
  }

  // サンプルファイルが存在するかチェック
  if (!fs.existsSync(sampleConfigPath)) {
    console.error('❌ サンプル設定ファイルが見つかりません: server/config/directories.sample.ts');
    process.exit(1);
  }

  try {
    // サンプルファイルをコピー
    fs.copyFileSync(sampleConfigPath, configPath);
    console.log('✅ 設定ファイルを作成しました: server/config/directories.ts');
    console.log('');
    console.log('📝 次の手順:');
    console.log('1. server/config/directories.ts を開く');
    console.log('2. candidateDirs の配列を実際の画像ディレクトリパスに変更する');
    console.log('3. または環境変数 IMAGE_DIRS を設定する');
    console.log('');
    console.log('例: IMAGE_DIRS="C:\\MyImages;D:\\Photos;./test-data/images"');
  } catch (error) {
    console.error('❌ 設定ファイルの作成に失敗しました:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupConfig();
}

module.exports = { setupConfig };