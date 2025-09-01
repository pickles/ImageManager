import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

// DirectoryBrowserのモック
vi.mock('../../components/DirectoryBrowser', () => ({
  DirectoryBrowser: () => (
    <div data-testid="directory-browser">Directory Browser</div>
  )
}));

describe('App', () => {
  describe('初期状態（画像未選択）', () => {
    it('ファイル選択画面が表示される', () => {
      render(<App />);
      
      // FileSelector コンポーネントが表示される
      expect(screen.getByText('画像ファイルを選択')).toBeInTheDocument();
      
      // DirectoryBrowser も表示される
      expect(screen.getByTestId('directory-browser')).toBeInTheDocument();
      
      // メインコンテナが適切なクラスを持つ（DirectoryBrowser統合レイアウト）
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('App-main--with-directory-browser');
    });

    it('画像表示や情報コンポーネントは表示されない', () => {
      render(<App />);
      
      // ImageDisplay や ImageInfo は表示されない（画像未選択時）
      expect(screen.queryByText('画像を選択してください')).not.toBeInTheDocument();
      expect(screen.queryByText('画像が選択されていません')).not.toBeInTheDocument();
      expect(screen.queryByText('新しい画像を選択')).not.toBeInTheDocument();
    });

    it('ローディングやエラー状態ではない', () => {
      render(<App />);
      
      // ローディング状態ではない
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      
      // エラー状態ではない
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });
  });

  describe('アプリケーションレイアウト', () => {
    it('適切なCSSクラスが適用されている', () => {
      render(<App />);
      
      // メインコンテナ
      const appContainer = document.querySelector('.App');
      expect(appContainer).toBeInTheDocument();
      
      // メインコンテンツエリア（DirectoryBrowser統合レイアウト）
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('App-main');
      expect(mainElement).toHaveClass('App-main--with-directory-browser');
    });

    it('フルスクリーンアプリケーションレイアウトになっている', () => {
      render(<App />);
      
      const appContainer = document.querySelector('.App');
      expect(appContainer).toBeInTheDocument();
      
      // ヘッダーが存在しない（アプリケーションライクなデザイン）
      expect(screen.queryByText('Image Manager')).not.toBeInTheDocument();
    });
  });

  describe('状態管理', () => {
    it('初期状態が正しく設定されている', () => {
      render(<App />);
      
      // ファイル選択状態
      expect(screen.getByText('画像ファイルを選択')).toBeInTheDocument();
      
      // 他の状態は表示されない
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });
  });
});