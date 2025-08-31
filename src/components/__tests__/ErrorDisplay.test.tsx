import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorDisplay from '../ErrorDisplay';

describe('ErrorDisplay', () => {
  describe('基本的な表示', () => {
    it('エラーがnullの場合は何も表示しない', () => {
      const { container } = render(<ErrorDisplay error={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('エラーがある場合はエラー表示を表示する', () => {
      render(<ErrorDisplay error="テストエラー" />);
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('role="alert"が設定されている', () => {
      render(<ErrorDisplay error="テストエラー" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('エラーメッセージの変換', () => {
    it('ファイル形式エラーの場合は適切なメッセージを表示する', () => {
      render(<ErrorDisplay error="unsupported format" />);
      expect(screen.getByText(/サポートされていないファイル形式です/)).toBeInTheDocument();
    });

    it('ファイルが見つからないエラーの場合は適切なメッセージを表示する', () => {
      render(<ErrorDisplay error="file not found" />);
      expect(screen.getByText(/ファイルが見つかりません/)).toBeInTheDocument();
    });

    it('ファイルサイズエラーの場合は適切なメッセージを表示する', () => {
      render(<ErrorDisplay error="file too large" />);
      expect(screen.getByText(/ファイルサイズが大きすぎます/)).toBeInTheDocument();
    });

    it('破損ファイルエラーの場合は適切なメッセージを表示する', () => {
      render(<ErrorDisplay error="corrupt file" />);
      expect(screen.getByText(/画像ファイルが破損している可能性があります/)).toBeInTheDocument();
    });

    it('権限エラーの場合は適切なメッセージを表示する', () => {
      render(<ErrorDisplay error="permission denied" />);
      expect(screen.getByText(/ファイルにアクセスできません/)).toBeInTheDocument();
    });

    it('不明なエラーの場合はデフォルトメッセージを表示する', () => {
      render(<ErrorDisplay error="unknown error" />);
      expect(screen.getByText(/画像の読み込み中にエラーが発生しました/)).toBeInTheDocument();
    });
  });

  describe('再試行ボタン', () => {
    it('デフォルトで再試行ボタンが表示される', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay error="テストエラー" onRetry={onRetry} />);
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('showRetry=falseの場合は再試行ボタンが表示されない', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay error="テストエラー" onRetry={onRetry} showRetry={false} />);
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });

    it('onRetryが未定義の場合は再試行ボタンが表示されない', () => {
      render(<ErrorDisplay error="テストエラー" />);
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });

    it('再試行ボタンをクリックするとonRetryが呼ばれる', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay error="テストエラー" onRetry={onRetry} />);
      
      fireEvent.click(screen.getByTestId('retry-button'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('クリアボタン', () => {
    it('デフォルトでクリアボタンが表示される', () => {
      const onClear = vi.fn();
      render(<ErrorDisplay error="テストエラー" onClear={onClear} />);
      expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    });

    it('showClear=falseの場合はクリアボタンが表示されない', () => {
      const onClear = vi.fn();
      render(<ErrorDisplay error="テストエラー" onClear={onClear} showClear={false} />);
      expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
    });

    it('onClearが未定義の場合はクリアボタンが表示されない', () => {
      render(<ErrorDisplay error="テストエラー" />);
      expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
    });

    it('クリアボタンをクリックするとonClearが呼ばれる', () => {
      const onClear = vi.fn();
      render(<ErrorDisplay error="テストエラー" onClear={onClear} />);
      
      fireEvent.click(screen.getByTestId('clear-button'));
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('複数のボタンの組み合わせ', () => {
    it('両方のボタンが表示される', () => {
      const onRetry = vi.fn();
      const onClear = vi.fn();
      render(<ErrorDisplay error="テストエラー" onRetry={onRetry} onClear={onClear} />);
      
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    });

    it('両方のボタンが非表示になる', () => {
      const onRetry = vi.fn();
      const onClear = vi.fn();
      render(
        <ErrorDisplay 
          error="テストエラー" 
          onRetry={onRetry} 
          onClear={onClear} 
          showRetry={false} 
          showClear={false} 
        />
      );
      
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('エラーメッセージが適切にマークアップされている', () => {
      render(<ErrorDisplay error="テストエラー" />);
      const errorDisplay = screen.getByTestId('error-display');
      expect(errorDisplay).toHaveAttribute('role', 'alert');
    });

    it('ボタンがキーボードでアクセス可能', () => {
      const onRetry = vi.fn();
      const onClear = vi.fn();
      render(<ErrorDisplay error="テストエラー" onRetry={onRetry} onClear={onClear} />);
      
      const retryButton = screen.getByTestId('retry-button');
      const clearButton = screen.getByTestId('clear-button');
      
      expect(retryButton).toHaveAttribute('type', 'button');
      expect(clearButton).toHaveAttribute('type', 'button');
    });
  });

  describe('エッジケース', () => {
    it('空文字列のエラーの場合は何も表示しない', () => {
      const { container } = render(<ErrorDisplay error="" />);
      expect(container.firstChild).toBeNull();
    });

    it('非常に長いエラーメッセージでも適切に表示される', () => {
      const longError = 'a'.repeat(1000);
      render(<ErrorDisplay error={longError} />);
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('特殊文字を含むエラーメッセージでも適切に表示される', () => {
      const specialError = '<script>alert("test")</script>';
      render(<ErrorDisplay error={specialError} />);
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });
});