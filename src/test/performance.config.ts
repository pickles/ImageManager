import { defineConfig } from 'vitest/config';

// パフォーマンステスト用の設定
export const performanceTestConfig = {
  // テストタイムアウトを長めに設定
  testTimeout: 10000,
  
  // パフォーマンステスト用の閾値
  thresholds: {
    // ファイルサイズ別の処理時間上限（ミリ秒）
    fileProcessing: {
      small: 500,    // 1-5MB
      medium: 1500,  // 5-15MB
      large: 3000,   // 15-25MB
      xlarge: 5000,  // 25-50MB
    },
    
    // 解像度別の処理時間上限（ミリ秒）
    resolutionProcessing: {
      hd: 200,       // 1920x1080
      '2k': 400,     // 2560x1440
      '4k': 800,     // 3840x2160
      '8k': 1500,    // 7680x4320
    },
    
    // UI応答性の上限（ミリ秒）
    uiResponsiveness: {
      initialRender: 100,
      stateChange: 200,
      errorRecovery: 1000,
    },
    
    // メモリ使用量の上限（バイト）
    memoryUsage: {
      maxIncrease: 50 * 1024 * 1024, // 50MB
      leakDetection: 10 * 1024 * 1024, // 10MB
    },
  },
  
  // パフォーマンステスト用のヘルパー関数
  helpers: {
    // 実行時間測定
    measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
      const start = performance.now();
      const result = await fn();
      const end = performance.now();
      return { result, duration: end - start };
    },
    
    // メモリ使用量測定
    measureMemory: (): number => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    },
    
    // テストファイル作成
    createTestFile: (sizeInMB: number, type: string = 'image/jpeg'): File => {
      const sizeInBytes = sizeInMB * 1024 * 1024;
      const buffer = new ArrayBuffer(sizeInBytes);
      const blob = new Blob([buffer], { type });
      return new File([blob], `test-${sizeInMB}MB.jpg`, { type });
    },
    
    // パフォーマンス統計計算
    calculateStats: (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    },
  },
};

export default performanceTestConfig;