import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';

// パフォーマンステスト用のヘルパー関数
const createTestImageFile = (sizeInMB: number, width: number = 1920, height: number = 1080): File => {
  const sizeInBytes = sizeInMB * 1024 * 1024;
  const buffer = new ArrayBuffer(sizeInBytes);
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  return new File([blob], `test-image-${sizeInMB}MB.jpg`, { 
    type: 'image/jpeg',
    lastModified: Date.now()
  });
};

const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const startTime = performance.now();
  renderFn();
  await waitFor(() => {
    // DOM更新の完了を待つ
  }, { timeout: 5000 });
  const endTime = performance.now();
  return endTime - startTime;
};

const simulateFileSelection = async (file: File, container: HTMLElement) => {
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  
  // FileListをモック
  const fileList = {
    0: file,
    length: 1,
    item: (index: number) => index === 0 ? file : null,
    [Symbol.iterator]: function* () {
      yield file;
    }
  } as FileList;
  
  Object.defineProperty(fileInput, 'files', {
    value: fileList,
    writable: false,
  });
  
  fireEvent.change(fileInput);
};

describe('コンポーネントパフォーマンステスト', () => {
  let mockCreateObjectURL: any;
  let mockRevokeObjectURL: any;
  let createdUrls: string[] = [];

  beforeEach(() => {
    createdUrls = [];
    
    mockCreateObjectURL = vi.fn().mockImplementation(() => {
      const url = `blob:mock-url-${Date.now()}-${Math.random()}`;
      createdUrls.push(url);
      return url;
    });
    
    mockRevokeObjectURL = vi.fn().mockImplementation((url: string) => {
      const index = createdUrls.indexOf(url);
      if (index > -1) {
        createdUrls.splice(index, 1);
      }
    });
    
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    
    // Image コンストラクタのモック（高解像度対応）
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';
      width: number = 0;
      height: number = 0;

      constructor() {
        setTimeout(() => {
          // ファイル名から解像度を推測
          if (this.src.includes('4K')) {
            this.width = 3840;
            this.height = 2160;
          } else if (this.src.includes('8K')) {
            this.width = 7680;
            this.height = 4320;
          } else if (this.src.includes('large')) {
            this.width = 2560;
            this.height = 1440;
          } else {
            this.width = 1920;
            this.height = 1080;
          }
          
          if (this.onload) {
            this.onload();
          }
        }, 50); // より現実的な読み込み時間
      }
    } as any;
  });

  afterEach(() => {
    createdUrls.forEach(url => URL.revokeObjectURL(url));
    createdUrls = [];
    vi.restoreAllMocks();
  });

  describe('大きな画像ファイルでの描画パフォーマンス', () => {
    it('10MBの画像ファイルを適切な時間内で描画できる', async () => {
      const largeFile = createTestImageFile(10);
      
      const renderTime = await measureRenderTime(() => {
        render(<App />);
      });
      
      // 初期描画は500ms以内に完了すべき
      expect(renderTime).toBeLessThan(500);
      
      const container = screen.getByTestId('app-container');
      
      const startTime = performance.now();
      await simulateFileSelection(largeFile, container);
      
      // 画像が表示されるまで待機
      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // 10MBファイルの処理は2秒以内に完了すべき
      expect(processingTime).toBeLessThan(2000);
    });

    it('25MBの画像ファイルを適切な時間内で処理できる', async () => {
      const largeFile = createTestImageFile(25);
      
      render(<App />);
      const container = screen.getByTestId('app-container');
      
      const startTime = performance.now();
      await simulateFileSelection(largeFile, container);
      
      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // 25MBファイルの処理は3秒以内に完了すべき
      expect(processingTime).toBeLessThan(3000);
    });

    it('複数の大きなファイルを連続で処理できる', async () => {
      const files = [
        createTestImageFile(5),
        createTestImageFile(10),
        createTestImageFile(15),
      ];
      
      render(<App />);
      const container = screen.getByTestId('app-container');
      
      const processingTimes: number[] = [];
      
      for (const file of files) {
        const startTime = performance.now();
        await simulateFileSelection(file, container);
        
        await waitFor(() => {
          expect(screen.getByTestId('image-display')).toBeInTheDocument();
        }, { timeout: 3000 });
        
        const endTime = performance.now();
        processingTimes.push(endTime - startTime);
        
        // 次のファイル処理前に少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 各ファイルの処理時間が適切であることを確認
      processingTimes.forEach((time, index) => {
        const expectedMaxTime = (index + 1) * 1000; // 5MB: 1s, 10MB: 2s, 15MB: 3s
        expect(time).toBeLessThan(expectedMaxTime);
      });
      
      // 処理時間が大幅に増加していないことを確認
      const firstTime = processingTimes[0];
      const lastTime = processingTimes[processingTimes.length - 1];
      expect(lastTime).toBeLessThan(firstTime * 2);
    });
  });

  describe('高解像度画像での描画パフォーマンス', () => {
    it('4K解像度の画像を適切に描画できる', async () => {
      const highResFile = new File(
        [new Blob(['4K-content'], { type: 'image/jpeg' })],
        '4K-image.jpg',
        { type: 'image/jpeg' }
      );
      
      render(<App />);
      const container = screen.getByTestId('app-container');
      
      const startTime = performance.now();
      await simulateFileSelection(highResFile, container);
      
      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // 4K画像の処理は1.5秒以内に完了すべき
      expect(processingTime).toBeLessThan(1500);
      
      // 画像情報に正しい解像度が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/3840.*2160/)).toBeInTheDocument();
      });
    });

    it('8K解像度の画像を適切に処理できる', async () => {
      const ultraHighResFile = new File(
        [new Blob(['8K-content'], { type: 'image/jpeg' })],
        '8K-image.jpg',
        { type: 'image/jpeg' }
      );
      
      render(<App />);
      const container = screen.getByTestId('app-container');
      
      const startTime = performance.now();
      await simulateFileSelection(ultraHighResFile, container);
      
      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // 8K画像の処理は2.5秒以内に完了すべき
      expect(processingTime).toBeLessThan(2500);
      
      // 画像情報に正しい解像度が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/7680.*4320/)).toBeInTheDocument();
      });
    });
  });

  describe('メモリリーク検出テスト', () => {
    it('画像の切り替え時にURLが適切に解放される', async () => {
      const file1 = createTestImageFile(5);
      const file2 = createTestImageFile(5);
      
      render(<App />);
      const container = screen.getByTestId('app-container');
      
      // 最初の画像を選択
      await simulateFileSelection(file1, container);
      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      });
      
      expect(createdUrls).toHaveLength(1);
      const firstUrl = createdUrls[0];
      
      // 2番目の画像を選択
      await simulateFileSelection(file2, container);
      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      });
      
      // 古いURLが解放され、新しいURLが作成されることを確認
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(firstUrl);
      expect(createdUrls).toHaveLength(1);
      expect(createdUrls[0]).not.toBe(firstUrl);
    });

    it('大量の画像切り替えでメモリリークが発生しない', async () => {
      const files = Array.from({ length: 10 }, (_, i) => 
        createTestImageFile(1, 800 + i * 100, 600 + i * 100)
      );
      
      render(<App />);
      const container = screen.getByTestId('app-container');
      
      for (let i = 0; i < files.length; i++) {
        await simulateFileSelection(files[i], container);
        await waitFor(() => {
          expect(screen.getByTestId('image-display')).toBeInTheDocument();
        });
        
        // 常に1つのURLのみが保持されていることを確認
        expect(createdUrls).toHaveLength(1);
      }
      
      // 最終的にrevokeObjectURLが適切に呼ばれていることを確認
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(files.length - 1);
    });
  });

  describe('UI応答性テスト', () => {
    it('大きなファイル処理中もUIが応答性を保つ', async () => {
      const largeFile = createTestImageFile(20);
      
      render(<App />);
      const container = screen.getByTestId('app-container');
      
      // ファイル選択を開始
      await simulateFileSelection(largeFile, container);
      
      // ローディング状態が表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });
      
      // ローディング中でもUIが操作可能であることを確認
      const fileSelector = screen.getByTestId('file-selector');
      expect(fileSelector).toBeInTheDocument();
      
      // 処理完了まで待機
      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // ローディング状態が解除されることを確認
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    it('エラー状態から正常状態への復帰が高速', async () => {
      const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });
      const validFile = createTestImageFile(5);
      
      render(<App />);
      const container = screen.getByTestId('app-container');
      
      // 無効なファイルを選択してエラー状態にする
      await simulateFileSelection(invalidFile, container);
      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });
      
      // 有効なファイルを選択して復帰
      const startTime = performance.now();
      await simulateFileSelection(validFile, container);
      
      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
        expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const recoveryTime = endTime - startTime;
      
      // エラーからの復帰は1秒以内に完了すべき
      expect(recoveryTime).toBeLessThan(1000);
    });
  });

  describe('レンダリングパフォーマンス', () => {
    it('初期レンダリングが高速', () => {
      const startTime = performance.now();
      render(<App />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      
      // 初期レンダリングは100ms以内に完了すべき
      expect(renderTime).toBeLessThan(100);
    });

    it('状態変更時の再レンダリングが効率的', async () => {
      const file = createTestImageFile(5);
      
      render(<App />);
      const container = screen.getByTestId('app-container');
      
      // 複数回の状態変更を測定
      const renderTimes: number[] = [];
      
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();
        
        await simulateFileSelection(file, container);
        await waitFor(() => {
          expect(screen.getByTestId('image-display')).toBeInTheDocument();
        });
        
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
        
        // 次の測定のために少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 再レンダリング時間が安定していることを確認
      const avgTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      renderTimes.forEach(time => {
        expect(Math.abs(time - avgTime)).toBeLessThan(avgTime * 0.5); // 平均の50%以内
      });
    });
  });
});