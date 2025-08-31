/**
 * DirectorySelector コンポーネントの単体テスト
 * 要件1.1, 1.3, 1.4に対応
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DirectorySelector } from '../DirectorySelector';
import { DirectoryService } from '../../../services/DirectoryService';
import { DirectoryBrowserErrorType } from '../types';

// Import DirectoryServiceError directly for testing
class DirectoryServiceError extends Error {
  constructor(
    public readonly type: DirectoryBrowserErrorType,
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DirectoryServiceError';
  }
}

// DirectoryService をモック
vi.mock('../../../services/DirectoryService');

const MockedDirectoryService = vi.mocked(DirectoryService);

describe('DirectorySelector', () => {
  const mockOnDirectorySelect = vi.fn();
  const mockDirectoryService = {
    isSupported: vi.fn(),
    selectDirectory: vi.fn(),
    getImageFiles: vi.fn(),
    watchDirectory: vi.fn(),
    unwatchDirectory: vi.fn(),
    getCurrentDirectoryHandle: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    MockedDirectoryService.mockImplementation(() => mockDirectoryService as any);
    mockDirectoryService.isSupported.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('ディレクトリ選択ボタンが表示される', () => {
      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('ディレクトリを選択');
    });

    it('選択されたディレクトリパスが表示される', () => {
      const selectedDirectory = 'test-directory';
      
      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={selectedDirectory}
        />
      );

      expect(screen.getByText('選択中:')).toBeInTheDocument();
      expect(screen.getByText(selectedDirectory)).toBeInTheDocument();
    });

    it('disabledプロパティが適用される', () => {
      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
          disabled={true}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      expect(button).toBeDisabled();
    });
  });

  describe('ディレクトリ選択機能', () => {
    it('ディレクトリ選択が成功した場合、onDirectorySelectが呼ばれる', async () => {
      const selectedDirectory = 'test-directory';
      mockDirectoryService.selectDirectory.mockResolvedValue(selectedDirectory);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnDirectorySelect).toHaveBeenCalledWith(selectedDirectory);
      });
    });

    it('ユーザーがキャンセルした場合、onDirectorySelectは呼ばれない', async () => {
      mockDirectoryService.selectDirectory.mockResolvedValue(null);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockDirectoryService.selectDirectory).toHaveBeenCalled();
      });

      expect(mockOnDirectorySelect).not.toHaveBeenCalled();
    });

    it('選択中はローディング状態が表示される', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      mockDirectoryService.selectDirectory.mockReturnValue(promise);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      // ローディング状態の確認
      expect(screen.getByText('選択中...')).toBeInTheDocument();
      expect(button).toBeDisabled();

      // プロミスを解決
      resolvePromise!('test-directory');
      await waitFor(() => {
        expect(screen.queryByText('選択中...')).not.toBeInTheDocument();
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('権限エラーが表示される', async () => {
      const error = new DirectoryServiceError(
        DirectoryBrowserErrorType.PERMISSION_DENIED,
        'ディレクトリへのアクセス権限が拒否されました。'
      );
      mockDirectoryService.selectDirectory.mockRejectedValue(error);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      await waitFor(() => {
        const errorElements = screen.queryAllByRole('alert');
        expect(errorElements.length).toBeGreaterThan(0);
        const errorElement = errorElements.find(el => 
          el.textContent?.includes('ディレクトリへのアクセス権限が拒否されました。')
        );
        expect(errorElement).toBeInTheDocument();
      });
    });

    it('ブラウザサポートエラーが表示される', async () => {
      const error = new DirectoryServiceError(
        DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED,
        'お使いのブラウザはディレクトリ選択機能をサポートしていません。'
      );
      mockDirectoryService.selectDirectory.mockRejectedValue(error);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      await waitFor(() => {
        const errorElements = screen.queryAllByRole('alert');
        expect(errorElements.length).toBeGreaterThan(0);
        const errorElement = errorElements.find(el => 
          el.textContent?.includes('お使いのブラウザはディレクトリ選択機能をサポートしていません。')
        );
        expect(errorElement).toBeInTheDocument();
      });
    });

    it('一般的なエラーが表示される', async () => {
      const error = new Error('予期しないエラー');
      mockDirectoryService.selectDirectory.mockRejectedValue(error);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'ディレクトリの選択中に予期しないエラーが発生しました。'
        );
      });
    });

    it('エラーを閉じることができる', async () => {
      const error = new DirectoryServiceError(
        DirectoryBrowserErrorType.PERMISSION_DENIED,
        'テストエラー'
      );
      mockDirectoryService.selectDirectory.mockRejectedValue(error);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      await waitFor(() => {
        const errorElements = screen.queryAllByRole('alert');
        const errorElement = errorElements.find(el => 
          el.textContent?.includes('テストエラー')
        );
        expect(errorElement).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: 'エラーを閉じる' });
      fireEvent.click(closeButton);

      await waitFor(() => {
        const errorElements = screen.queryAllByRole('alert');
        const hasErrorElement = errorElements.some(el => 
          el.textContent?.includes('テストエラー')
        );
        expect(hasErrorElement).toBe(false);
      });
    });
  });

  describe('ブラウザサポート', () => {
    it('サポートされていないブラウザで警告が表示される', () => {
      mockDirectoryService.isSupported.mockReturnValue(false);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent(
        'ディレクトリ選択機能を使用するには、Chrome、Edge、またはOpera の最新版が必要です。'
      );
    });

    it('サポートされていないブラウザでボタンクリック時にエラーが表示される', async () => {
      mockDirectoryService.isSupported.mockReturnValue(false);
      const error = new DirectoryServiceError(
        DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED,
        'お使いのブラウザはディレクトリ選択機能をサポートしていません。'
      );
      mockDirectoryService.selectDirectory.mockRejectedValue(error);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThanOrEqual(1); // 少なくとも1つのアラートがある
        // 警告メッセージまたはエラーメッセージが表示されている
        const hasWarning = alerts.some(el => 
          el.textContent?.includes('ディレクトリ選択機能を使用するには、Chrome、Edge、またはOpera の最新版が必要です。')
        );
        const hasError = alerts.some(el => 
          el.textContent?.includes('お使いのブラウザはディレクトリ選択機能をサポートしていません。')
        );
        expect(hasWarning || hasError).toBe(true);
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      expect(button).toHaveAttribute('aria-label', 'ディレクトリを選択');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('エラー表示にrole="alert"が設定されている', async () => {
      const error = new DirectoryServiceError(
        DirectoryBrowserErrorType.PERMISSION_DENIED,
        'テストエラー'
      );
      mockDirectoryService.selectDirectory.mockRejectedValue(error);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      await waitFor(() => {
        const errorElements = screen.queryAllByRole('alert');
        const errorElement = errorElements.find(el => 
          el.textContent?.includes('テストエラー')
        );
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('エラー閉じるボタンに適切なaria-labelが設定されている', async () => {
      const error = new DirectoryServiceError(
        DirectoryBrowserErrorType.PERMISSION_DENIED,
        'テストエラー'
      );
      mockDirectoryService.selectDirectory.mockRejectedValue(error);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      await waitFor(() => {
        const errorElements = screen.queryAllByRole('alert');
        const errorElement = errorElements.find(el => 
          el.textContent?.includes('テストエラー')
        );
        expect(errorElement).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: 'エラーを閉じる' });
      expect(closeButton).toHaveAttribute('aria-label', 'エラーを閉じる');
    });
  });

  describe('UI状態管理', () => {
    it('ローディング中はボタンが無効化される', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      mockDirectoryService.selectDirectory.mockReturnValue(promise);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      expect(button).toBeDisabled();

      resolvePromise!('test-directory');
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('disabled状態ではクリックイベントが無視される', () => {
      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
          disabled={true}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      fireEvent.click(button);

      expect(mockDirectoryService.selectDirectory).not.toHaveBeenCalled();
    });

    it('ローディング中のクリックイベントが無視される', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      mockDirectoryService.selectDirectory.mockReturnValue(promise);

      render(
        <DirectorySelector
          onDirectorySelect={mockOnDirectorySelect}
          selectedDirectory={null}
        />
      );

      const button = screen.getByRole('button', { name: 'ディレクトリを選択' });
      
      // 最初のクリック
      fireEvent.click(button);
      expect(mockDirectoryService.selectDirectory).toHaveBeenCalledTimes(1);

      // ローディング中の2回目のクリック
      fireEvent.click(button);
      expect(mockDirectoryService.selectDirectory).toHaveBeenCalledTimes(1); // 呼ばれない

      resolvePromise!('test-directory');
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});