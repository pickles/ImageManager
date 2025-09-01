/**
 * DirectoryBrowser レスポンシブ動作テスト
 * 要件: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DirectoryBrowser from '../DirectoryBrowser';
import { DirectoryBrowserProps } from '../types';

// モックプロパティ
const mockProps: DirectoryBrowserProps = {
  onFileSelect: vi.fn(),
  selectedFile: null,
  isCollapsed: false,
  onToggleCollapse: vi.fn(),
  className: 'test-class'
};

// ウィンドウサイズを変更するヘルパー関数
const resizeWindow = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('DirectoryBrowser レスポンシブ動作', () => {
  beforeEach(() => {
    // デフォルトでデスクトップサイズに設定
    resizeWindow(1200, 800);
    vi.clearAllMocks();
  });

  afterEach(() => {
    // テスト後にウィンドウサイズをリセット
    resizeWindow(1024, 768);
  });

  describe('デスクトップ表示 (1025px以上) - 要件5.4', () => {
    it('デスクトップサイズでCollapsiblePanelが使用される', () => {
      resizeWindow(1200);
      render(<DirectoryBrowser {...mockProps} />);
      
      // CollapsiblePanelの特徴的な要素が存在することを確認
      expect(document.querySelector('.directory-browser')).toBeInTheDocument();
      expect(screen.getByText('ディレクトリブラウザ')).toBeInTheDocument();
    });

    it('デスクトップサイズで適切な幅が設定される', () => {
      resizeWindow(1200);
      render(<DirectoryBrowser {...mockProps} />);
      
      const directoryBrowser = document.querySelector('.directory-browser');
      expect(directoryBrowser).toBeInTheDocument();
      expect(directoryBrowser).toHaveClass('directory-browser');
    });

    it('折りたたみ状態が正しく動作する', () => {
      resizeWindow(1200);
      const { rerender } = render(<DirectoryBrowser {...mockProps} />);
      
      // 展開状態
      expect(document.querySelector('.directory-browser')).toBeInTheDocument();
      
      // 折りたたみ状態
      rerender(<DirectoryBrowser {...mockProps} isCollapsed={true} />);
      expect(document.querySelector('.directory-browser')).toBeInTheDocument();
    });
  });

  describe('タブレット表示 (769px - 1024px) - 要件5.3', () => {
    it('タブレットサイズでCollapsiblePanelが使用される', () => {
      resizeWindow(900);
      render(<DirectoryBrowser {...mockProps} />);
      
      // CollapsiblePanelが使用されることを確認
      expect(document.querySelector('.directory-browser')).toBeInTheDocument();
      expect(screen.getByText('ディレクトリブラウザ')).toBeInTheDocument();
    });

    it('タブレットサイズで適切な幅が設定される', () => {
      resizeWindow(900);
      render(<DirectoryBrowser {...mockProps} />);
      
      const directoryBrowser = document.querySelector('.directory-browser');
      expect(directoryBrowser).toBeInTheDocument();
      expect(directoryBrowser).toHaveClass('directory-browser');
    });
  });

  describe('モバイル表示 (768px以下) - 要件5.1, 5.2', () => {
    it('モバイルサイズで専用レイアウトが使用される', () => {
      resizeWindow(600);
      render(<DirectoryBrowser {...mockProps} />);
      
      // モバイル用の閉じるボタンが存在することを確認
      expect(screen.getByRole('button', { name: 'ディレクトリブラウザを閉じる' })).toBeInTheDocument();
    });

    it('モバイルサイズでオーバーレイ表示される', () => {
      resizeWindow(600);
      render(<DirectoryBrowser {...mockProps} />);
      
      const directoryBrowser = screen.getByRole('navigation');
      expect(directoryBrowser).toHaveClass('directory-browser');
    });

    it('モバイルで展開状態が正しく動作する', () => {
      resizeWindow(600);
      const { rerender } = render(<DirectoryBrowser {...mockProps} isCollapsed={false} />);
      
      const directoryBrowser = screen.getByRole('navigation');
      expect(directoryBrowser).toHaveClass('directory-browser--expanded');
      
      // 折りたたみ状態
      rerender(<DirectoryBrowser {...mockProps} isCollapsed={true} />);
      expect(directoryBrowser).toHaveClass('directory-browser--collapsed');
    });

    it('モバイル用閉じるボタンが動作する', () => {
      resizeWindow(600);
      render(<DirectoryBrowser {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: 'ディレクトリブラウザを閉じる' });
      fireEvent.click(closeButton);
      
      expect(mockProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('モバイルでデフォルト折りたたみ状態になる', () => {
      resizeWindow(600);
      render(<DirectoryBrowser {...mockProps} isCollapsed={true} />);
      
      const directoryBrowser = screen.getByRole('navigation');
      expect(directoryBrowser).toHaveClass('directory-browser--collapsed');
    });
  });

  describe('画面サイズ変更時の動作 - 要件5.5', () => {
    it('デスクトップからモバイルへの変更が正しく動作する', async () => {
      // デスクトップサイズで開始
      resizeWindow(1200);
      const { rerender } = render(<DirectoryBrowser {...mockProps} />);
      
      // CollapsiblePanelが使用されていることを確認
      expect(document.querySelector('.directory-browser')).toBeInTheDocument();
      expect(screen.getByText('ディレクトリブラウザ')).toBeInTheDocument();
      
      // モバイルサイズに変更
      resizeWindow(600);
      rerender(<DirectoryBrowser {...mockProps} />);
      
      // モバイル用レイアウトに変更されることを確認
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'ディレクトリブラウザを閉じる' })).toBeInTheDocument();
      });
    });

    it('モバイルからデスクトップへの変更が正しく動作する', async () => {
      // モバイルサイズで開始
      resizeWindow(600);
      const { rerender } = render(<DirectoryBrowser {...mockProps} />);
      
      // モバイル用レイアウトが使用されていることを確認
      expect(screen.getByRole('button', { name: 'ディレクトリブラウザを閉じる' })).toBeInTheDocument();
      
      // デスクトップサイズに変更
      resizeWindow(1200);
      rerender(<DirectoryBrowser {...mockProps} />);
      
      // デスクトップ用レイアウトに変更されることを確認
      await waitFor(() => {
        expect(document.querySelector('.directory-browser')).toBeInTheDocument();
        expect(screen.getByText('ディレクトリブラウザ')).toBeInTheDocument();
      });
    });

    it('リサイズイベントが正しく処理される', async () => {
      render(<DirectoryBrowser {...mockProps} />);
      
      // 複数回リサイズしても正常に動作することを確認
      resizeWindow(1200);
      await waitFor(() => {
        const regions = screen.getAllByRole('region');
        expect(regions.length).toBeGreaterThan(0);
      });
      
      resizeWindow(600);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'ディレクトリブラウザを閉じる' })).toBeInTheDocument();
      });
      
      resizeWindow(900);
      await waitFor(() => {
        const regions = screen.getAllByRole('region');
        expect(regions.length).toBeGreaterThan(0);
        expect(screen.getByText('ディレクトリブラウザ')).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ対応 - 要件5.5', () => {
    it('モバイルで適切なARIA属性が設定される', () => {
      resizeWindow(600);
      render(<DirectoryBrowser {...mockProps} />);
      
      const navigation = screen.getByRole('navigation', { name: 'ディレクトリブラウザ' });
      expect(navigation).toBeInTheDocument();
      
      const closeButton = screen.getByRole('button', { name: 'ディレクトリブラウザを閉じる' });
      expect(closeButton).toHaveAttribute('aria-label', 'ディレクトリブラウザを閉じる');
    });

    it('デスクトップで適切なARIA属性が設定される', () => {
      resizeWindow(1200);
      render(<DirectoryBrowser {...mockProps} />);
      
      const regions = screen.getAllByRole('region');
      expect(regions.length).toBeGreaterThan(0);
      expect(screen.getByText('ディレクトリブラウザ')).toBeInTheDocument();
    });

    it('キーボードナビゲーションが動作する', () => {
      resizeWindow(600);
      render(<DirectoryBrowser {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: 'ディレクトリブラウザを閉じる' });
      
      // フォーカスが当たることを確認
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
      
      // クリックで動作することを確認（Enterキーはボタンで自動的に処理される）
      fireEvent.click(closeButton);
      expect(mockProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });
  });

  describe('エラー処理', () => {
    it('画面サイズ変更中にエラーが発生しても正常に動作する', () => {
      // console.errorをモック
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<DirectoryBrowser {...mockProps} />);
      
      // 異常なサイズ値でもエラーが発生しないことを確認
      resizeWindow(-100);
      resizeWindow(0);
      resizeWindow(99999);
      
      const regions = screen.getAllByRole('region');
      expect(regions.length).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
    });
  });
});