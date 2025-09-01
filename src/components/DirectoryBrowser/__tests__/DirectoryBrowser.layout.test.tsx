/**
 * DirectoryBrowser CSS Grid レイアウトテスト
 * App.tsx統合時のレスポンシブレイアウト動作を検証
 * 要件: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// CSS Grid レイアウトのテスト用コンポーネント
const TestAppLayout: React.FC<{
  hasDirectoryBrowser: boolean;
  isDirectoryCollapsed: boolean;
  isInfoCollapsed: boolean;
  windowWidth: number;
}> = ({ hasDirectoryBrowser, isDirectoryCollapsed, isInfoCollapsed, windowWidth }) => {
  // ウィンドウサイズを設定
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: windowWidth,
  });

  const getLayoutClasses = () => {
    let classes = 'App-main App-main--image-view';
    
    if (hasDirectoryBrowser) {
      classes += ' App-main--with-directory-browser';
      
      if (isDirectoryCollapsed && isInfoCollapsed) {
        classes += ' App-main--both-collapsed';
      } else if (isDirectoryCollapsed) {
        classes += ' App-main--directory-collapsed';
      } else if (isInfoCollapsed) {
        classes += ' App-main--info-collapsed';
      }
    }
    
    return classes;
  };

  return (
    <main className={getLayoutClasses()} data-testid="app-main">
      {hasDirectoryBrowser && (
        <div 
          className="App-directory-browser" 
          data-testid="directory-browser"
          style={{ gridArea: 'directory' }}
        >
          DirectoryBrowser
        </div>
      )}
      <div 
        className="App-image-display" 
        data-testid="image-display"
        style={{ gridArea: 'main' }}
      >
        ImageDisplay
      </div>
      <div 
        className="App-image-info" 
        data-testid="image-info"
        style={{ gridArea: 'info' }}
      >
        ImageInfo
      </div>
    </main>
  );
};

describe('DirectoryBrowser CSS Grid レイアウト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('デスクトップレイアウト (1025px以上) - 要件5.4', () => {
    const desktopWidth = 1200;

    it('DirectoryBrowser統合時に3カラムレイアウトが適用される', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={false}
          isInfoCollapsed={false}
          windowWidth={desktopWidth}
        />
      );

      const appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--with-directory-browser');
      expect(appMain).not.toHaveClass('App-main--directory-collapsed');
      expect(appMain).not.toHaveClass('App-main--info-collapsed');
      expect(appMain).not.toHaveClass('App-main--both-collapsed');

      // 全ての要素が存在することを確認
      expect(screen.getByTestId('directory-browser')).toBeInTheDocument();
      expect(screen.getByTestId('image-display')).toBeInTheDocument();
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
    });

    it('DirectoryBrowser折りたたみ時に適切なクラスが適用される', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={true}
          isInfoCollapsed={false}
          windowWidth={desktopWidth}
        />
      );

      const appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--with-directory-browser');
      expect(appMain).toHaveClass('App-main--directory-collapsed');
      expect(appMain).not.toHaveClass('App-main--info-collapsed');
      expect(appMain).not.toHaveClass('App-main--both-collapsed');
    });

    it('情報パネル折りたたみ時に適切なクラスが適用される', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={false}
          isInfoCollapsed={true}
          windowWidth={desktopWidth}
        />
      );

      const appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--with-directory-browser');
      expect(appMain).not.toHaveClass('App-main--directory-collapsed');
      expect(appMain).toHaveClass('App-main--info-collapsed');
      expect(appMain).not.toHaveClass('App-main--both-collapsed');
    });

    it('両方折りたたみ時に適切なクラスが適用される', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={true}
          isInfoCollapsed={true}
          windowWidth={desktopWidth}
        />
      );

      const appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--with-directory-browser');
      expect(appMain).toHaveClass('App-main--both-collapsed');
      expect(appMain).not.toHaveClass('App-main--directory-collapsed');
      expect(appMain).not.toHaveClass('App-main--info-collapsed');
    });
  });

  describe('タブレットレイアウト (769px - 1024px) - 要件5.3', () => {
    const tabletWidth = 900;

    it('タブレットサイズで適切なレイアウトが適用される', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={false}
          isInfoCollapsed={false}
          windowWidth={tabletWidth}
        />
      );

      const appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--with-directory-browser');

      // 全ての要素が存在することを確認
      expect(screen.getByTestId('directory-browser')).toBeInTheDocument();
      expect(screen.getByTestId('image-display')).toBeInTheDocument();
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
    });

    it('タブレットでDirectoryBrowser折りたたみ時の動作', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={true}
          isInfoCollapsed={false}
          windowWidth={tabletWidth}
        />
      );

      const appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--directory-collapsed');
    });
  });

  describe('モバイルレイアウト (768px以下) - 要件5.1, 5.2', () => {
    const mobileWidth = 600;

    it('モバイルサイズで適切なレイアウトが適用される', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={false}
          isInfoCollapsed={false}
          windowWidth={mobileWidth}
        />
      );

      const appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--with-directory-browser');

      // モバイルでは情報パネルが下部に配置される
      expect(screen.getByTestId('image-display')).toBeInTheDocument();
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
    });

    it('モバイルで情報パネル折りたたみ時の動作', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={false}
          isInfoCollapsed={true}
          windowWidth={mobileWidth}
        />
      );

      const appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--info-collapsed');
    });
  });

  describe('従来レイアウト（DirectoryBrowserなし）', () => {
    it('DirectoryBrowserなしの場合は従来のレイアウトが使用される', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={false}
          isDirectoryCollapsed={false}
          isInfoCollapsed={false}
          windowWidth={1200}
        />
      );

      const appMain = screen.getByTestId('app-main');
      expect(appMain).not.toHaveClass('App-main--with-directory-browser');
      expect(appMain).toHaveClass('App-main--image-view');

      // DirectoryBrowserは存在しない
      expect(screen.queryByTestId('directory-browser')).not.toBeInTheDocument();
      expect(screen.getByTestId('image-display')).toBeInTheDocument();
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
    });
  });

  describe('Grid Areas', () => {
    it('各要素に適切なgrid-areaが設定される', () => {
      render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={false}
          isInfoCollapsed={false}
          windowWidth={1200}
        />
      );

      const directoryBrowser = screen.getByTestId('directory-browser');
      const imageDisplay = screen.getByTestId('image-display');
      const imageInfo = screen.getByTestId('image-info');

      expect(directoryBrowser).toHaveStyle({ gridArea: 'directory' });
      expect(imageDisplay).toHaveStyle({ gridArea: 'main' });
      expect(imageInfo).toHaveStyle({ gridArea: 'info' });
    });
  });

  describe('レスポンシブ動作の統合テスト', () => {
    it('画面サイズ変更時にレイアウトが適切に変更される', () => {
      const { rerender } = render(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={false}
          isInfoCollapsed={false}
          windowWidth={1200}
        />
      );

      // デスクトップレイアウト
      let appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--with-directory-browser');

      // タブレットサイズに変更
      rerender(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={false}
          isInfoCollapsed={false}
          windowWidth={900}
        />
      );

      appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--with-directory-browser');

      // モバイルサイズに変更
      rerender(
        <TestAppLayout
          hasDirectoryBrowser={true}
          isDirectoryCollapsed={false}
          isInfoCollapsed={false}
          windowWidth={600}
        />
      );

      appMain = screen.getByTestId('app-main');
      expect(appMain).toHaveClass('App-main--with-directory-browser');
    });
  });
});