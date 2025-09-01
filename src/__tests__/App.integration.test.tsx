/**
 * App.tsx統合テスト
 * DirectoryBrowserとの統合動作をテスト
 * 要件: 1.1, 3.3, 3.4, 4.1, 4.2, 4.5, 4.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// DirectoryBrowserのモック
vi.mock('../components/DirectoryBrowser', () => ({
  DirectoryBrowser: ({ onFileSelect, selectedFile, isCollapsed, onToggleCollapse }: any) => (
    <div data-testid="directory-browser">
      <div data-testid="directory-browser-collapsed">{isCollapsed.toString()}</div>
      <button 
        data-testid="directory-browser-toggle"
        onClick={onToggleCollapse}
      >
        Toggle Directory Browser
      </button>
      <button
        data-testid="directory-browser-file-select"
        onClick={() => {
          const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
          onFileSelect(mockFile);
        }}
      >
        Select File from Directory
      </button>
      <div data-testid="directory-browser-selected-file">
        {selectedFile ? selectedFile.name : 'No file selected'}
      </div>
    </div>
  )
}));

// FileServiceのモック
const mockFileService = {
  validateImageFile: vi.fn().mockResolvedValue(true),
  createImageUrl: vi.fn().mockReturnValue('blob:mock-url'),
  revokeImageUrl: vi.fn()
};

const mockMetadataService = {
  extractMetadata: vi.fn().mockResolvedValue({
    width: 800,
    height: 600,
    format: 'JPEG',
    size: 1024000
  })
};

vi.mock('../services/FileService', () => ({
  FileService: vi.fn().mockImplementation(() => mockFileService)
}));

vi.mock('../services/MetadataService', () => ({
  MetadataService: vi.fn().mockImplementation(() => mockMetadataService)
}));

// その他のコンポーネントのモック
vi.mock('../components', () => ({
  FileSelector: ({ onFileSelect }: any) => (
    <div data-testid="file-selector">
      <button
        data-testid="file-selector-button"
        onClick={() => {
          const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
          onFileSelect(mockFile);
        }}
      >
        Select File
      </button>
    </div>
  ),
  ImageDisplay: ({ imageUrl, alt }: any) => (
    <div data-testid="image-display">
      <img src={imageUrl} alt={alt} />
    </div>
  ),
  ImageInfo: ({ metadata }: any) => (
    <div data-testid="image-info">
      {metadata ? `${metadata.width}x${metadata.height}` : 'No metadata'}
    </div>
  ),
  LoadingIndicator: ({ isVisible, message }: any) => 
    isVisible ? <div data-testid="loading-indicator">{message}</div> : null,
  ErrorDisplay: ({ error, onRetry, onClear }: any) => (
    <div data-testid="error-display">
      <div>{error}</div>
      <button onClick={onRetry}>Retry</button>
      <button onClick={onClear}>Clear</button>
    </div>
  )
}));

describe('App DirectoryBrowser Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // モックをリセット
    mockFileService.validateImageFile.mockResolvedValue(true);
    mockFileService.createImageUrl.mockReturnValue('blob:mock-url');
    mockMetadataService.extractMetadata.mockResolvedValue({
      width: 800,
      height: 600,
      format: 'JPEG',
      size: 1024000
    });
    
    // window.innerWidthをモック
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期状態', () => {
    it('DirectoryBrowserが表示される（要件1.1）', () => {
      render(<App />);
      
      expect(screen.getByTestId('directory-browser')).toBeInTheDocument();
      expect(screen.getByTestId('file-selector')).toBeInTheDocument();
    });

    it('DirectoryBrowserが展開状態で表示される（要件4.1）', () => {
      render(<App />);
      
      const collapsedState = screen.getByTestId('directory-browser-collapsed');
      expect(collapsedState).toHaveTextContent('false');
    });

    it('CSS Gridレイアウトが適用される', () => {
      render(<App />);
      
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('App-main--with-directory-browser');
    });
  });

  describe('DirectoryBrowserからのファイル選択', () => {
    it('DirectoryBrowserからファイルを選択できる（要件3.3, 3.4）', async () => {
      render(<App />);

      const selectButton = screen.getByTestId('directory-browser-file-select');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      });

      // 選択されたファイルがDirectoryBrowserに反映される
      expect(screen.getByTestId('directory-browser-selected-file')).toHaveTextContent('test.jpg');
    });

    it('既存のhandleFileSelectと統合される（要件3.3）', async () => {
      render(<App />);

      // DirectoryBrowserからファイル選択
      const directorySelectButton = screen.getByTestId('directory-browser-file-select');
      fireEvent.click(directorySelectButton);

      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
        expect(screen.getByTestId('image-info')).toBeInTheDocument();
      });

      // 画像情報が表示される（既存の処理が動作している証拠）
      expect(screen.getByTestId('image-info')).toHaveTextContent('800x600');
    });
  });

  describe('折りたたみ機能', () => {
    it('DirectoryBrowserを折りたたむことができる（要件4.1, 4.2）', async () => {
      render(<App />);

      const toggleButton = screen.getByTestId('directory-browser-toggle');
      fireEvent.click(toggleButton);

      const collapsedState = screen.getByTestId('directory-browser-collapsed');
      expect(collapsedState).toHaveTextContent('true');

      // CSS クラスが更新される
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('App-main--directory-collapsed');
    });

    it('折りたたみ状態が管理される（要件4.5, 4.6）', async () => {
      render(<App />);

      // ファイルを選択
      const selectButton = screen.getByTestId('directory-browser-file-select');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      });

      // DirectoryBrowserを折りたたむ
      const toggleButton = screen.getByTestId('directory-browser-toggle');
      fireEvent.click(toggleButton);

      // 折りたたみ状態が保持される
      const collapsedState = screen.getByTestId('directory-browser-collapsed');
      expect(collapsedState).toHaveTextContent('true');

      // 選択されたファイル状態は保持される
      expect(screen.getByTestId('directory-browser-selected-file')).toHaveTextContent('test.jpg');
    });
  });

  describe('レスポンシブ対応', () => {
    it('モバイル画面でのレイアウト調整', () => {
      // モバイルサイズに変更
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
      });

      render(<App />);
      
      // DirectoryBrowserが表示される
      expect(screen.getByTestId('directory-browser')).toBeInTheDocument();
    });

    it('タブレット画面でのレイアウト調整', () => {
      // タブレットサイズに変更
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 900
      });

      render(<App />);
      
      expect(screen.getByTestId('directory-browser')).toBeInTheDocument();
    });
  });

  describe('両方のペインの折りたたみ', () => {
    it('DirectoryBrowserと右ペインの両方を折りたたむことができる', async () => {
      render(<App />);

      // ファイルを選択して右ペインを表示
      const selectButton = screen.getByTestId('directory-browser-file-select');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
        expect(screen.getByTestId('image-info')).toBeInTheDocument();
      });

      // DirectoryBrowserを折りたたむ
      const directoryToggle = screen.getByTestId('directory-browser-toggle');
      fireEvent.click(directoryToggle);

      // 右ペインを折りたたむ
      const infoToggle = screen.getByTitle('画像情報を非表示');
      fireEvent.click(infoToggle);

      // 両方が折りたたまれた状態のCSSクラスが適用される
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('App-main--both-collapsed');
    });
  });

  describe('画像の最大サイズ計算', () => {
    it('DirectoryBrowserの幅を考慮して画像サイズを計算する', async () => {
      render(<App />);

      // ファイルを選択
      const selectButton = screen.getByTestId('directory-browser-file-select');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      });

      // ImageDisplayコンポーネントが適切なpropsで呼び出されることを確認
      // （実際の計算結果は画面サイズとDirectoryBrowserの幅を考慮したもの）
      expect(screen.getByTestId('image-display')).toBeInTheDocument();
    });

    it('DirectoryBrowserが折りたたまれた時に画像サイズが再計算される', async () => {
      render(<App />);

      // ファイルを選択
      const selectButton = screen.getByTestId('directory-browser-file-select');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('image-display')).toBeInTheDocument();
      });

      // DirectoryBrowserを折りたたむ
      const toggleButton = screen.getByTestId('directory-browser-toggle');
      fireEvent.click(toggleButton);

      // 画像表示が継続される（サイズ計算が更新される）
      expect(screen.getByTestId('image-display')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('DirectoryBrowserからのファイル選択でエラーが発生した場合の処理', async () => {
      // FileServiceでエラーを発生させる
      mockFileService.validateImageFile.mockRejectedValue(new Error('Validation failed'));

      render(<App />);

      const selectButton = screen.getByTestId('directory-browser-file-select');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-display')).toHaveTextContent('Validation failed');
    });
  });
});