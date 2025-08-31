import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileService } from '../services/FileService';
import { ImageService } from '../services/ImageService';
import { MetadataService } from '../services/MetadataService';

// パフォーマンステスト用のヘルパー関数
const createLargeImageFile = (sizeInMB: number, format: string = 'image/jpeg'): File => {
  // 大きなファイルをシミュレートするためのダミーデータ
  const sizeInBytes = sizeInMB * 1024 * 1024;
  const buffer = new ArrayBuffer(sizeInBytes);
  const blob = new Blob([buffer], { type: format });
  return new File([blob], `large-image-${sizeInMB}MB.jpg`, { type: format });
};

const createHighResolutionImageFile = (width: number, height: number): File => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 簡単なパターンを描画
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, width / 2, height / 2);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(width / 2, 0, width / 2, height / 2);
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, height / 2, width / 2, height / 2);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(width / 2, height / 2, width / 2, height / 2);
  }
  
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `high-res-${width}x${height}.png`, { type: 'image/png' }));
      }
    }, 'image/png');
  }) as any;
};

const measureExecutionTime = async (fn: () => Promise<any>): Promise<{ result: any; duration: number }> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  return { result, duration: endTime - startTime };
};

const measureMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

describe('パフォーマンステスト', () => {
  let fileService: FileService;
  let imageService: ImageService;
  let metadataService: MetadataService;
  let createdUrls: string[] = [];

  beforeEach(() => {
    fileService = new FileService();
    imageService = new ImageService();
    metadataService = new MetadataService();
    createdUrls = [];
    
    // URL.createObjectURL のモックを設定
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      const url = `blob:mock-url-${Date.now()}-${Math.random()}`;
      createdUrls.push(url);
      return url;
    });
    
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => {
      const index = createdUrls.indexOf(url);
      if (index > -1) {
        createdUrls.splice(index, 1);
      }
    });
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    createdUrls.forEach(url => URL.revokeObjectURL(url));
    createdUrls = [];
    vi.restoreAllMocks();
  });

  describe('大きな画像ファイルでの動作テスト', () => {
    it('10MBの画像ファイルを適切な時間内で処理できる', async () => {
      const largeFile = createLargeImageFile(10);
      
      const { duration: validationDuration } = await measureExecutionTime(async () => {
        return await fileService.validateImageFile(largeFile);
      });
      
      // バリデーションは1秒以内に完了すべき
      expect(validationDuration).toBeLessThan(1000);
    });

    it('25MBの画像ファイルを適切な時間内で処理できる', async () => {
      const largeFile = createLargeImageFile(25);
      
      const { duration: validationDuration } = await measureExecutionTime(async () => {
        return await fileService.validateImageFile(largeFile);
      });
      
      // 大きなファイルでも2秒以内に完了すべき
      expect(validationDuration).toBeLessThan(2000);
    });

    it('50MB（上限）の画像ファイルを処理できる', async () => {
      const maxSizeFile = createLargeImageFile(50);
      
      const { result: isValid, duration } = await measureExecutionTime(async () => {
        return await fileService.validateImageFile(maxSizeFile);
      });
      
      expect(isValid).toBe(true);
      // 最大サイズでも3秒以内に完了すべき
      expect(duration).toBeLessThan(3000);
    });

    it('上限を超える画像ファイルを適切に拒否する', async () => {
      const oversizeFile = createLargeImageFile(60);
      
      const { result: isValid, duration } = await measureExecutionTime(async () => {
        return await fileService.validateImageFile(oversizeFile);
      });
      
      expect(isValid).toBe(false);
      // 拒否処理は高速であるべき
      expect(duration).toBeLessThan(500);
    });

    it('複数の大きなファイルを連続で処理できる', async () => {
      const files = [
        createLargeImageFile(5),
        createLargeImageFile(10),
        createLargeImageFile(15),
        createLargeImageFile(20),
      ];
      
      const { duration } = await measureExecutionTime(async () => {
        const results = await Promise.all(
          files.map(file => fileService.validateImageFile(file))
        );
        return results;
      });
      
      // 4つのファイルを並行処理で5秒以内に完了すべき
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('高解像度画像での動作テスト', () => {
    it('4K解像度の画像を適切に処理できる', async () => {
      const { duration } = await measureExecutionTime(async () => {
        return imageService.calculateDisplaySize(3840, 2160, 800, 600);
      });
      
      // 計算処理は非常に高速であるべき
      expect(duration).toBeLessThan(10);
    });

    it('8K解像度（上限）の画像を適切に処理できる', async () => {
      const { duration } = await measureExecutionTime(async () => {
        return imageService.calculateDisplaySize(7680, 4320, 800, 600);
      });
      
      expect(duration).toBeLessThan(10);
    });

    it('上限を超える解像度を適切に検出する', async () => {
      const { result: isTooHigh, duration } = await measureExecutionTime(async () => {
        return imageService.isResolutionTooHigh(8000, 5000);
      });
      
      expect(isTooHigh).toBe(true);
      expect(duration).toBeLessThan(5);
    });

    it('複数の高解像度画像のスケーリング計算を高速処理できる', async () => {
      const resolutions = [
        [1920, 1080],
        [2560, 1440],
        [3840, 2160],
        [5120, 2880],
        [7680, 4320],
      ];
      
      const { duration } = await measureExecutionTime(async () => {
        return resolutions.map(([width, height]) => 
          imageService.calculateDisplaySize(width, height, 800, 600)
        );
      });
      
      // 5つの計算を50ms以内に完了すべき
      expect(duration).toBeLessThan(50);
    });
  });

  describe('メモリリーク検出テスト', () => {
    it('URL作成と解放が適切に行われる', () => {
      const file = createLargeImageFile(5);
      
      // URL作成
      const url1 = fileService.createImageUrl(file);
      const url2 = fileService.createImageUrl(file);
      const url3 = fileService.createImageUrl(file);
      
      expect(createdUrls).toHaveLength(3);
      
      // URL解放
      fileService.revokeImageUrl(url1);
      fileService.revokeImageUrl(url2);
      fileService.revokeImageUrl(url3);
      
      expect(createdUrls).toHaveLength(0);
    });

    it('大量のURL作成と解放でメモリリークが発生しない', () => {
      const file = createLargeImageFile(1);
      const urls: string[] = [];
      
      // 100個のURLを作成
      for (let i = 0; i < 100; i++) {
        urls.push(fileService.createImageUrl(file));
      }
      
      expect(createdUrls).toHaveLength(100);
      
      // すべてのURLを解放
      urls.forEach(url => fileService.revokeImageUrl(url));
      
      expect(createdUrls).toHaveLength(0);
    });

    it('未解放のURLを検出できる', () => {
      const file = createLargeImageFile(1);
      
      // URLを作成するが解放しない
      fileService.createImageUrl(file);
      fileService.createImageUrl(file);
      
      expect(createdUrls).toHaveLength(2);
      
      // テスト終了時にafterEachでクリーンアップされることを確認
    });

    it('メタデータ抽出でメモリリークが発生しない', async () => {
      const file = createLargeImageFile(5);
      const initialMemory = measureMemoryUsage();
      
      // 複数回メタデータを抽出
      for (let i = 0; i < 10; i++) {
        await metadataService.extractMetadata(file);
      }
      
      const finalMemory = measureMemoryUsage();
      
      // メモリ使用量の大幅な増加がないことを確認（テスト環境では正確な測定は困難）
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        // 10MB以上の増加がないことを確認
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });
  });

  describe('レスポンス時間の測定テスト', () => {
    it('ファイルバリデーションのレスポンス時間が適切', async () => {
      const testFiles = [
        createLargeImageFile(1, 'image/jpeg'),
        createLargeImageFile(5, 'image/png'),
        createLargeImageFile(10, 'image/webp'),
      ];
      
      const results = await Promise.all(
        testFiles.map(async (file) => {
          return await measureExecutionTime(async () => {
            return await fileService.validateImageFile(file);
          });
        })
      );
      
      results.forEach(({ duration }, index) => {
        // ファイルサイズに応じた適切なレスポンス時間
        const expectedMaxTime = (index + 1) * 500; // 1MB: 500ms, 5MB: 1000ms, 10MB: 1500ms
        expect(duration).toBeLessThan(expectedMaxTime);
      });
    });

    it('メタデータ抽出のレスポンス時間が適切', async () => {
      const file = createLargeImageFile(10);
      
      const { duration } = await measureExecutionTime(async () => {
        return await metadataService.extractMetadata(file);
      });
      
      // メタデータ抽出は1秒以内に完了すべき
      expect(duration).toBeLessThan(1000);
    });

    it('画像スケーリング計算のレスポンス時間が適切', async () => {
      const testCases = [
        [800, 600, 400, 300],
        [1920, 1080, 800, 600],
        [3840, 2160, 1200, 800],
        [7680, 4320, 1600, 900],
      ];
      
      for (const [width, height, maxWidth, maxHeight] of testCases) {
        const { duration } = await measureExecutionTime(async () => {
          return imageService.calculateDisplaySize(width, height, maxWidth, maxHeight);
        });
        
        // スケーリング計算は5ms以内に完了すべき
        expect(duration).toBeLessThan(5);
      }
    });

    it('並行処理でのレスポンス時間が適切', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        createLargeImageFile(2 + i, 'image/jpeg')
      );
      
      const { duration: parallelDuration } = await measureExecutionTime(async () => {
        return await Promise.all(
          files.map(file => fileService.validateImageFile(file))
        );
      });
      
      const { duration: sequentialDuration } = await measureExecutionTime(async () => {
        const results = [];
        for (const file of files) {
          results.push(await fileService.validateImageFile(file));
        }
        return results;
      });
      
      // 並行処理が逐次処理より高速であることを確認
      expect(parallelDuration).toBeLessThan(sequentialDuration);
    });

    it('エラー処理のレスポンス時間が適切', async () => {
      // 無効なファイル形式
      const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });
      
      const { result: isValid, duration } = await measureExecutionTime(async () => {
        return await fileService.validateImageFile(invalidFile);
      });
      
      expect(isValid).toBe(false);
      // エラー処理は高速であるべき
      expect(duration).toBeLessThan(100);
    });

    it('複数のサービスを組み合わせた処理のレスポンス時間', async () => {
      const file = createLargeImageFile(5);
      
      const { duration } = await measureExecutionTime(async () => {
        // 実際のワークフローをシミュレート
        const isValid = await fileService.validateImageFile(file);
        if (isValid) {
          const url = fileService.createImageUrl(file);
          const metadata = await metadataService.extractMetadata(file);
          const displaySize = imageService.calculateDisplaySize(
            metadata.width,
            metadata.height,
            800,
            600
          );
          fileService.revokeImageUrl(url);
          return { metadata, displaySize };
        }
        return null;
      });
      
      // 全体のワークフローは2秒以内に完了すべき
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('ストレステスト', () => {
    it('大量のファイル処理でパフォーマンスが劣化しない', async () => {
      const files = Array.from({ length: 20 }, (_, i) => 
        createLargeImageFile(1, 'image/jpeg')
      );
      
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
      }
      
      const batchTimes: number[] = [];
      
      for (const batch of batches) {
        const { duration } = await measureExecutionTime(async () => {
          return await Promise.all(
            batch.map(file => fileService.validateImageFile(file))
          );
        });
        batchTimes.push(duration);
      }
      
      // 後のバッチが最初のバッチより大幅に遅くならないことを確認
      const firstBatchTime = batchTimes[0];
      const lastBatchTime = batchTimes[batchTimes.length - 1];
      
      // 最後のバッチが最初のバッチの2倍以上遅くならないことを確認
      expect(lastBatchTime).toBeLessThan(firstBatchTime * 2);
    });

    it('長時間の連続処理でメモリ使用量が安定している', async () => {
      const file = createLargeImageFile(2);
      const iterations = 20; // Reduced iterations for faster test
      const memorySnapshots: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        await fileService.validateImageFile(file);
        const url = fileService.createImageUrl(file);
        await metadataService.extractMetadata(file);
        fileService.revokeImageUrl(url);
        
        // 5回ごとにメモリ使用量を記録
        if (i % 5 === 0) {
          const memory = measureMemoryUsage();
          if (memory > 0) {
            memorySnapshots.push(memory);
          }
        }
      }
      
      // メモリ使用量が安定していることを確認
      if (memorySnapshots.length > 2) {
        const firstSnapshot = memorySnapshots[0];
        const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
        const memoryIncrease = lastSnapshot - firstSnapshot;
        
        // 20MB以上の増加がないことを確認
        expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
      }
    }, 10000); // 10 second timeout
  });
});