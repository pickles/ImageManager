#!/usr/bin/env node

/**
 * パフォーマンステスト実行スクリプト
 * 
 * 使用方法:
 * npm run test:performance
 * node scripts/run-performance-tests.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// パフォーマンステストの設定
const config = {
  testFiles: [
    'src/test/performance.test.ts',
    'src/components/__tests__/performance.test.tsx',
  ],
  outputDir: 'test-results/performance',
  reportFile: 'performance-report.json',
  thresholds: {
    maxDuration: 30000, // 30秒
    maxMemoryIncrease: 100 * 1024 * 1024, // 100MB
  },
};

// 出力ディレクトリの作成
function ensureOutputDir() {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
}

// パフォーマンステストの実行
function runPerformanceTests() {
  console.log('🚀 パフォーマンステストを開始します...\n');
  
  const startTime = Date.now();
  const initialMemory = process.memoryUsage();
  
  try {
    // Vitestでパフォーマンステストを実行
    const testCommand = [
      'npx vitest run',
      '--config vite.config.ts',
      '--reporter=verbose',
      '--reporter=json',
      `--outputFile=${config.outputDir}/test-results.json`,
      config.testFiles.join(' '),
    ].join(' ');
    
    console.log(`実行コマンド: ${testCommand}\n`);
    
    const output = execSync(testCommand, {
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    console.log(output);
    
    const endTime = Date.now();
    const finalMemory = process.memoryUsage();
    
    // パフォーマンス結果の分析
    const results = analyzeResults({
      duration: endTime - startTime,
      memoryUsage: {
        initial: initialMemory,
        final: finalMemory,
        increase: finalMemory.heapUsed - initialMemory.heapUsed,
      },
    });
    
    // レポートの生成
    generateReport(results);
    
    console.log('\n✅ パフォーマンステストが完了しました!');
    console.log(`📊 レポート: ${path.join(config.outputDir, config.reportFile)}`);
    
    // 閾値チェック
    checkThresholds(results);
    
  } catch (error) {
    console.error('❌ パフォーマンステストでエラーが発生しました:');
    console.error(error.message);
    
    if (error.stdout) {
      console.log('\n--- 標準出力 ---');
      console.log(error.stdout);
    }
    
    if (error.stderr) {
      console.log('\n--- エラー出力 ---');
      console.log(error.stderr);
    }
    
    process.exit(1);
  }
}

// 結果の分析
function analyzeResults(rawResults) {
  const results = {
    timestamp: new Date().toISOString(),
    duration: rawResults.duration,
    memoryUsage: rawResults.memoryUsage,
    status: 'completed',
    warnings: [],
    recommendations: [],
  };
  
  // 実行時間の分析
  if (results.duration > config.thresholds.maxDuration) {
    results.warnings.push(`実行時間が閾値を超過: ${results.duration}ms > ${config.thresholds.maxDuration}ms`);
    results.recommendations.push('テストの並列実行やテストケースの最適化を検討してください');
  }
  
  // メモリ使用量の分析
  if (results.memoryUsage.increase > config.thresholds.maxMemoryIncrease) {
    results.warnings.push(`メモリ使用量の増加が閾値を超過: ${formatBytes(results.memoryUsage.increase)} > ${formatBytes(config.thresholds.maxMemoryIncrease)}`);
    results.recommendations.push('メモリリークの可能性があります。オブジェクトの適切な解放を確認してください');
  }
  
  // テスト結果ファイルの読み込み（存在する場合）
  const testResultsPath = path.join(config.outputDir, 'test-results.json');
  if (fs.existsSync(testResultsPath)) {
    try {
      const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
      results.testResults = testResults;
      
      // テスト失敗の分析
      if (testResults.numFailedTests > 0) {
        results.warnings.push(`${testResults.numFailedTests}個のテストが失敗しました`);
        results.status = 'failed';
      }
      
      // テスト実行時間の分析
      if (testResults.testResults) {
        const slowTests = testResults.testResults
          .filter(test => test.duration > 5000) // 5秒以上
          .map(test => ({ name: test.name, duration: test.duration }));
        
        if (slowTests.length > 0) {
          results.warnings.push(`実行時間の長いテスト: ${slowTests.length}個`);
          results.slowTests = slowTests;
        }
      }
    } catch (error) {
      console.warn('テスト結果ファイルの解析に失敗しました:', error.message);
    }
  }
  
  return results;
}

// レポートの生成
function generateReport(results) {
  const reportPath = path.join(config.outputDir, config.reportFile);
  
  const report = {
    ...results,
    summary: {
      totalDuration: `${results.duration}ms`,
      memoryIncrease: formatBytes(results.memoryUsage.increase),
      status: results.status,
      warningCount: results.warnings.length,
      recommendationCount: results.recommendations.length,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: require('os').cpus().length,
      totalMemory: formatBytes(require('os').totalmem()),
    },
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // コンソールサマリーの表示
  console.log('\n📈 パフォーマンステスト結果サマリー');
  console.log('=====================================');
  console.log(`実行時間: ${report.summary.totalDuration}`);
  console.log(`メモリ増加: ${report.summary.memoryIncrease}`);
  console.log(`ステータス: ${report.summary.status}`);
  console.log(`警告: ${report.summary.warningCount}件`);
  console.log(`推奨事項: ${report.summary.recommendationCount}件`);
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  警告:');
    results.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 推奨事項:');
    results.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  if (results.slowTests && results.slowTests.length > 0) {
    console.log('\n🐌 実行時間の長いテスト:');
    results.slowTests.forEach(test => {
      console.log(`  - ${test.name}: ${test.duration}ms`);
    });
  }
}

// 閾値チェック
function checkThresholds(results) {
  let hasIssues = false;
  
  if (results.warnings.length > 0) {
    hasIssues = true;
  }
  
  if (results.status === 'failed') {
    hasIssues = true;
  }
  
  if (hasIssues) {
    console.log('\n❌ パフォーマンステストで問題が検出されました');
    process.exit(1);
  } else {
    console.log('\n✅ すべてのパフォーマンステストが正常に完了しました');
  }
}

// バイト数のフォーマット
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// メイン実行
if (require.main === module) {
  ensureOutputDir();
  runPerformanceTests();
}

module.exports = {
  runPerformanceTests,
  analyzeResults,
  generateReport,
};