import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Store original Image constructor
const originalImage = global.Image;

// Mock Image constructor
const createSuccessfulImageMock = () => {
  global.Image = class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src: string = '';
    width: number = 800;
    height: number = 600;

    constructor() {
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 100);
    }
  } as any;
};

describe('App Event Handling Tests', () => {
  beforeEach(() => {
    // Reset to successful Image mock before each test
    createSuccessfulImageMock();
  });
  describe('ファイル選択イベントの処理（モック）', () => {
    it('ファイル選択時に適切な状態変更が発生する', async () => {
      render(<App />);
      
      // 初期状態の確認
      expect(screen.getByText('画像ファイルを選択')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      
      // ファイル選択イベントをシミュレート
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // ローディング状態への変更を確認
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });
      
      // 最終的な画像表示状態への変更を確認
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('サポートされていないファイル形式でエラー状態に変更される', async () => {
      render(<App />);
      
      // サポートされていないファイル形式を選択
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // App レベルでのエラー状態への変更を確認
      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
        expect(screen.getByText(/画像の読み込み中にエラーが発生しました/)).toBeInTheDocument();
      });
      
      // ローディング状態にならないことを確認
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    it('画像読み込みエラー時にエラー状態に変更される', async () => {
      // Image のエラーケースをモック
      const originalImage = global.Image;
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';
        width: number = 800;
        height: number = 600;

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 100);
        }
      } as any;

      render(<App />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // ローディング状態になることを確認
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });
      
      // エラー状態への変更を確認
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
        expect(screen.getByText(/画像の読み込み中にエラーが発生しました/)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Image モックを元に戻す
      global.Image = originalImage;
    });
  });

  describe('状態変更の視覚的フィードバック', () => {
    it('ドラッグオーバー時に視覚的フィードバックが表示される', () => {
      render(<App />);
      
      const appElement = document.querySelector('.App') as HTMLElement;
      
      // 初期状態ではドラッグオーバーレイが表示されていない
      expect(screen.queryByText('画像ファイルをドロップしてください')).not.toBeInTheDocument();
      expect(appElement).not.toHaveClass('App--drag-over');
      
      // ドラッグオーバーイベント
      fireEvent.dragOver(appElement);
      
      // 視覚的フィードバックの確認
      expect(screen.getByText('画像ファイルをドロップしてください')).toBeInTheDocument();
      expect(screen.getByText('JPEG, PNG, GIF, WebP形式に対応')).toBeInTheDocument();
      expect(appElement).toHaveClass('App--drag-over');
    });

    it('ドラッグリーブ時に視覚的フィードバックが非表示になる', () => {
      render(<App />);
      
      const appElement = document.querySelector('.App') as HTMLElement;
      
      // ドラッグオーバー状態にする
      fireEvent.dragOver(appElement);
      expect(screen.getByText('画像ファイルをドロップしてください')).toBeInTheDocument();
      
      // ドロップイベントで視覚的フィードバックが非表示になることを確認
      fireEvent.drop(appElement, {
        dataTransfer: {
          files: []
        }
      });
      
      // 視覚的フィードバックが非表示になることを確認
      expect(screen.queryByText('画像ファイルをドロップしてください')).not.toBeInTheDocument();
      expect(appElement).not.toHaveClass('App--drag-over');
    });

    it('ローディング状態の視覚的フィードバックが正しく表示される', async () => {
      render(<App />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // ローディング状態の視覚的フィードバック
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
        expect(screen.getByText('画像を読み込み中...')).toBeInTheDocument();
        
        // メインコンテナのクラス変更
        const mainElement = screen.getByRole('main');
        expect(mainElement).toHaveClass('App-main--loading');
      });
    });

    it('エラー状態の視覚的フィードバックが正しく表示される', async () => {
      render(<App />);
      
      // サポートされていないファイル形式でエラーを発生させる
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // エラー状態の視覚的フィードバック
      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
        expect(screen.getByText(/画像の読み込み中にエラーが発生しました/)).toBeInTheDocument();
        
        // メインコンテナのクラス変更
        const mainElement = screen.getByRole('main');
        expect(mainElement).toHaveClass('App-main--error');
      });
    });
  });

  describe('コンポーネント間の基本的な連携', () => {
    it('FileSelectorからAppへのファイル選択イベントが正しく伝播される', async () => {
      render(<App />);
      
      // FileSelector内のファイル入力を使用
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // Appコンポーネントの状態変更を確認
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });
      
      // ImageDisplayコンポーネントへの連携を確認
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('エラー状態でのコンポーネント間連携が正しく動作する', async () => {
      render(<App />);
      
      // エラーを発生させる
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // ErrorDisplayコンポーネントが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });
      
      // エラークリアボタンの動作確認
      const clearButton = screen.getByTestId('clear-button');
      fireEvent.click(clearButton);
      
      // ファイル選択画面に戻ることを確認
      expect(screen.getByText('画像ファイルを選択')).toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });

    it('画像表示後の新しい画像選択ボタンが正しく動作する', async () => {
      render(<App />);
      
      // 画像を選択して表示状態にする
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示状態になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // 新しい画像を選択ボタンをクリック
      const newImageButton = screen.getByText('新しい画像を選択');
      fireEvent.click(newImageButton);
      
      // ファイル選択画面に戻ることを確認
      expect(screen.getByText('画像ファイルを選択')).toBeInTheDocument();
      expect(screen.queryByText('新しい画像を選択')).not.toBeInTheDocument();
    });

    it('情報パネル折りたたみボタンの連携が正しく動作する', async () => {
      render(<App />);
      
      // 画像を選択して表示状態にする
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示状態になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // 情報パネルが表示されていることを確認
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
      
      // 折りたたみボタンをクリック
      const toggleButton = screen.getByTitle('画像情報を非表示');
      fireEvent.click(toggleButton);
      
      // ImageInfoコンポーネントが非表示になることを確認
      expect(screen.queryByTestId('image-info')).not.toBeInTheDocument();
      
      // 画像コンテナのクラスが変更されることを確認
      const imageContainer = document.querySelector('.App-image-container');
      expect(imageContainer).toHaveClass('App-image-container--collapsed');
    });

    it('ドラッグアンドドロップでの画像切り替えが正しく動作する', async () => {
      render(<App />);
      
      // 最初の画像を選択
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file1],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示状態になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // 新しい画像をドラッグアンドドロップ
      const file2 = new File(['test2'], 'test2.png', { type: 'image/png' });
      const appElement = document.querySelector('.App') as HTMLElement;
      
      fireEvent.drop(appElement, {
        dataTransfer: {
          files: [file2]
        }
      });
      
      // 新しい画像の読み込みが開始されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });
      
      // 新しい画像が表示されることを確認
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('キーボードアクセシビリティ', () => {
    it('ファイル選択エリアがキーボードでアクセス可能', () => {
      render(<App />);
      
      const dropZone = document.querySelector('.file-selector__drop-zone') as HTMLElement;
      expect(dropZone).toHaveAttribute('tabIndex', '0');
      expect(dropZone).toHaveAttribute('role', 'button');
    });

    it('情報パネル折りたたみボタンが適切なaria属性を持つ', async () => {
      render(<App />);
      
      // 画像を選択して表示状態にする
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示状態になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // 折りたたみボタンのaria属性を確認
      const toggleButton = screen.getByTitle('画像情報を非表示');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      expect(toggleButton).toHaveAttribute('aria-controls', 'image-info-panel');
      
      // ボタンをクリックして状態変更
      fireEvent.click(toggleButton);
      
      // aria-expandedが更新されることを確認
      const collapsedButton = screen.getByTitle('画像情報を表示');
      expect(collapsedButton).toHaveAttribute('aria-expanded', 'false');
    });
  });
});