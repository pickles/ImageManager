/**
 * App.tsx統合テスト（簡易版）
 * DirectoryBrowserとの統合動作をテスト
 * 要件: 1.1, 3.3, 3.4, 4.1, 4.2, 4.5, 4.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
      <div data-testid="directory-browser-selected-file">
        {selectedFile ? selectedFile.name : 'No file selected'}
      </div>
    </div>
  )
}));

// その他のコンポーネントのモック
vi.mock('../components', () => ({
  FileSelector: () => (
    <div data-testid="file-selector">File Selector</div>
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
  ErrorDisplay: ({ error }: any) => (
    <div data-testid="error-display">{error}</div>
  )
}));

// サービスのモック（エラーを発生させない）
vi.mock('../services/FileService', () => ({
  FileService: vi.fn().mockImplementation(() => ({
    validateImageFile: vi.fn().mockResolvedValue(true),
    createImageUrl: vi.fn().mockReturnValue('blob:mock-url'),
    revokeImageUrl: vi.fn()
  }))
}));

vi.mock('../services/MetadataService', () => ({
  MetadataService: vi.fn().mockImplementation(() => ({
    extractMetadata: vi.fn().mockResolvedValue({
      width: 800,
      height: 600,
      format: 'JPEG',
      size: 1024000
    })
  }))
}));

describe('App DirectoryBrowser Integration (Simple)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('初期状態とレイアウト', () => {
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

  describe('折りたたみ機能', () => {
    it('DirectoryBrowserを折りたたむことができる（要件4.1, 4.2）', () => {
      render(<App />);

      const toggleButton = screen.getByTestId('directory-browser-toggle');
      fireEvent.click(toggleButton);

      const collapsedState = screen.getByTestId('directory-browser-collapsed');
      expect(collapsedState).toHaveTextContent('true');

      // CSS クラスが更新される
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('App-main--directory-collapsed');
    });

    it('折りたたみ状態が管理される（要件4.5, 4.6）', () => {
      render(<App />);

      // DirectoryBrowserを折りたたむ
      const toggleButton = screen.getByTestId('directory-browser-toggle');
      fireEvent.click(toggleButton);

      // 折りたたみ状態が保持される
      const collapsedState = screen.getByTestId('directory-browser-collapsed');
      expect(collapsedState).toHaveTextContent('true');

      // 再度クリックして展開
      fireEvent.click(toggleButton);
      expect(collapsedState).toHaveTextContent('false');

      // CSS クラスが更新される
      const mainElement = screen.getByRole('main');
      expect(mainElement).not.toHaveClass('App-main--directory-collapsed');
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

  describe('統合状態の確認', () => {
    it('DirectoryBrowserとFileSelector が同時に表示される', () => {
      render(<App />);
      
      // 両方のコンポーネントが表示される
      expect(screen.getByTestId('directory-browser')).toBeInTheDocument();
      expect(screen.getByTestId('file-selector')).toBeInTheDocument();
      
      // メインレイアウトが適用される
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('App-main--with-directory-browser');
    });

    it('右ペインの折りたたみボタンが存在しない（画像未選択時）', () => {
      render(<App />);
      
      // 画像が選択されていない状態では右ペインの折りたたみボタンは表示されない
      expect(screen.queryByTitle('画像情報を表示')).not.toBeInTheDocument();
      expect(screen.queryByTitle('画像情報を非表示')).not.toBeInTheDocument();
    });

    it('DirectoryBrowserの状態が正しく管理される', () => {
      render(<App />);
      
      // 初期状態の確認
      expect(screen.getByTestId('directory-browser-selected-file')).toHaveTextContent('No file selected');
      expect(screen.getByTestId('directory-browser-collapsed')).toHaveTextContent('false');
      
      // 折りたたみ状態の変更
      const toggleButton = screen.getByTestId('directory-browser-toggle');
      fireEvent.click(toggleButton);
      
      expect(screen.getByTestId('directory-browser-collapsed')).toHaveTextContent('true');
    });
  });

  describe('CSS クラスの動的変更', () => {
    it('DirectoryBrowser折りたたみ時のCSSクラス変更', () => {
      render(<App />);
      
      const mainElement = screen.getByRole('main');
      
      // 初期状態
      expect(mainElement).toHaveClass('App-main--with-directory-browser');
      expect(mainElement).not.toHaveClass('App-main--directory-collapsed');
      
      // DirectoryBrowserを折りたたむ
      const toggleButton = screen.getByTestId('directory-browser-toggle');
      fireEvent.click(toggleButton);
      
      // 折りたたみ状態のクラスが追加される
      expect(mainElement).toHaveClass('App-main--directory-collapsed');
      expect(mainElement).toHaveClass('App-main--with-directory-browser');
    });

    it('複数の状態クラスが正しく管理される', () => {
      render(<App />);
      
      const mainElement = screen.getByRole('main');
      
      // 初期状態では基本クラスのみ
      expect(mainElement.className).toContain('App-main--with-directory-browser');
      expect(mainElement.className).not.toContain('App-main--directory-collapsed');
      expect(mainElement.className).not.toContain('App-main--info-collapsed');
      expect(mainElement.className).not.toContain('App-main--both-collapsed');
    });
  });
});