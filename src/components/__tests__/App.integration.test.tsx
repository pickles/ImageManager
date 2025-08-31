import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Image constructor
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

describe('App Integration Tests', () => {
  describe('画像選択フロー', () => {
    it('画像選択後に画像表示画面に切り替わる', async () => {
      render(<App />);
      
      // 初期状態：ファイル選択画面
      expect(screen.getByText('画像ファイルを選択')).toBeInTheDocument();
      expect(screen.queryByText('新しい画像を選択')).not.toBeInTheDocument();
      
      // ファイルを選択
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // ローディング状態の確認
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });
      
      // 画像表示画面への切り替えを確認
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // ファイル選択画面が非表示になることを確認
      expect(screen.queryByText('画像ファイルを選択')).not.toBeInTheDocument();
    });

    it('新しい画像を選択ボタンでファイル選択画面に戻る', async () => {
      render(<App />);
      
      // ファイルを選択して画像表示画面に移動
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面になるまで待機
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
  });

  describe('レスポンシブレイアウト', () => {
    it('画像表示時に適切なレイアウトクラスが適用される', async () => {
      render(<App />);
      
      // ファイルを選択
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面のレイアウトクラスを確認
      await waitFor(() => {
        const mainElement = screen.getByRole('main');
        expect(mainElement).toHaveClass('App-main--image-view');
      }, { timeout: 2000 });
      
      // 画像コンテナの存在を確認
      const imageContainer = document.querySelector('.App-image-container');
      expect(imageContainer).toBeInTheDocument();
    });

    it('ウィンドウリサイズに画像サイズが追従する', async () => {
      render(<App />);
      
      // ファイルを選択して画像表示画面に移動
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // 初期の画像要素を取得
      const imageElement = document.querySelector('.image-display__image') as HTMLImageElement;
      expect(imageElement).toBeInTheDocument();
      
      // 初期のmaxWidthを記録
      const initialMaxWidth = imageElement.style.maxWidth;
      
      // ウィンドウサイズを変更
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      // リサイズイベントを発火
      fireEvent(window, new Event('resize'));
      
      // デバウンス時間を待つ
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 画像サイズが変更されることを確認
      await waitFor(() => {
        const updatedImageElement = document.querySelector('.image-display__image') as HTMLImageElement;
        expect(updatedImageElement.style.maxWidth).not.toBe(initialMaxWidth);
      }, { timeout: 1000 });
    });
  });

  describe('情報パネル折りたたみ機能', () => {
    it('情報パネルを折りたたむことができる', async () => {
      render(<App />);
      
      // ファイルを選択して画像表示画面に移動
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // 情報パネルが表示されていることを確認
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
      
      // 折りたたみボタンをクリック
      const toggleButton = screen.getByTitle('画像情報を非表示');
      fireEvent.click(toggleButton);
      
      // 情報パネルが非表示になることを確認
      expect(screen.queryByTestId('image-info')).not.toBeInTheDocument();
      
      // ボタンのテキストが変わることを確認
      expect(screen.getByTitle('画像情報を表示')).toBeInTheDocument();
    });

    it('折りたたまれた情報パネルを再表示できる', async () => {
      render(<App />);
      
      // ファイルを選択して画像表示画面に移動
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // 情報パネルを折りたたむ
      const toggleButton = screen.getByTitle('画像情報を非表示');
      fireEvent.click(toggleButton);
      
      // 情報パネルが非表示になることを確認
      expect(screen.queryByTestId('image-info')).not.toBeInTheDocument();
      
      // 再表示ボタンをクリック
      const showButton = screen.getByTitle('画像情報を表示');
      fireEvent.click(showButton);
      
      // 情報パネルが再表示されることを確認
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
    });

    it('折りたたみ時にコンテナに適切なクラスが適用される', async () => {
      render(<App />);
      
      // ファイルを選択して画像表示画面に移動
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      const container = document.querySelector('.App-image-container');
      
      // 初期状態では折りたたみクラスが適用されていない
      expect(container).not.toHaveClass('App-image-container--collapsed');
      
      // 折りたたみボタンをクリック
      const toggleButton = screen.getByTitle('画像情報を非表示');
      fireEvent.click(toggleButton);
      
      // 折りたたみクラスが適用される
      expect(container).toHaveClass('App-image-container--collapsed');
    });
  });

  describe('ドラッグアンドドロップ機能', () => {
    it('画像表示中にファイルをドラッグオーバーするとオーバーレイが表示される', async () => {
      render(<App />);
      
      // ファイルを選択して画像表示画面に移動
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // ドラッグオーバーイベントを発火
      const appElement = document.querySelector('.App') as HTMLElement;
      fireEvent.dragOver(appElement, {
        dataTransfer: {
          files: [new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })]
        }
      });
      
      // オーバーレイが表示されることを確認
      expect(screen.getByText('画像ファイルをドロップしてください')).toBeInTheDocument();
      expect(screen.getByText('JPEG, PNG, GIF, WebP形式に対応')).toBeInTheDocument();
    });

    it('画像表示中にファイルをドロップすると新しい画像が読み込まれる', async () => {
      render(<App />);
      
      // 最初のファイルを選択
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file1],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // 新しいファイルをドロップ
      const file2 = new File(['test2'], 'test2.png', { type: 'image/png' });
      const appElement = document.querySelector('.App') as HTMLElement;
      
      fireEvent.drop(appElement, {
        dataTransfer: {
          files: [file2]
        }
      });
      
      // ローディング状態になることを確認
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });
      
      // 新しい画像が読み込まれることを確認
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('ドラッグオーバー状態が正しく管理される', async () => {
      render(<App />);
      
      // ファイルを選択して画像表示画面に移動
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      const appElement = document.querySelector('.App') as HTMLElement;
      
      // 初期状態ではオーバーレイが表示されていない
      expect(screen.queryByText('画像ファイルをドロップしてください')).not.toBeInTheDocument();
      
      // ドラッグオーバーでオーバーレイを表示
      fireEvent.dragOver(appElement);
      expect(screen.getByText('画像ファイルをドロップしてください')).toBeInTheDocument();
      
      // ドロップでオーバーレイが非表示になる
      fireEvent.drop(appElement, {
        dataTransfer: {
          files: [new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })]
        }
      });
      
      expect(screen.queryByText('画像ファイルをドロップしてください')).not.toBeInTheDocument();
    });

    it('画像以外のファイルをドロップしても何も起こらない', async () => {
      render(<App />);
      
      // ファイルを選択して画像表示画面に移動
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(hiddenInput);
      
      // 画像表示画面になるまで待機
      await waitFor(() => {
        expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // テキストファイルをドロップ
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const appElement = document.querySelector('.App') as HTMLElement;
      
      fireEvent.drop(appElement, {
        dataTransfer: {
          files: [textFile]
        }
      });
      
      // ローディング状態にならないことを確認
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      
      // 元の画像表示が維持されることを確認
      expect(screen.getByText('新しい画像を選択')).toBeInTheDocument();
    });
  });
});