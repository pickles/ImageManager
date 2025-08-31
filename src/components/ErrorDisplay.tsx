import React from 'react';
import './ErrorDisplay.css';

export interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onClear?: () => void;
  showRetry?: boolean;
  showClear?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onClear,
  showRetry = true,
  showClear = true
}) => {
  if (!error) {
    return null;
  }

  const getErrorMessage = (errorText: string): string => {
    // ユーザーフレンドリーなエラーメッセージに変換
    if (errorText.includes('format') || errorText.includes('type')) {
      return 'サポートされていないファイル形式です。JPEG、PNG、GIF、WebP形式の画像ファイルを選択してください。';
    }
    if (errorText.includes('not found') || errorText.includes('exist')) {
      return 'ファイルが見つかりません。ファイルが存在することを確認してください。';
    }
    if (errorText.includes('size') || errorText.includes('large')) {
      return 'ファイルサイズが大きすぎます。50MB以下の画像ファイルを選択してください。';
    }
    if (errorText.includes('corrupt') || errorText.includes('invalid')) {
      return '画像ファイルが破損している可能性があります。別のファイルを選択してください。';
    }
    if (errorText.includes('permission') || errorText.includes('access')) {
      return 'ファイルにアクセスできません。ファイルの権限を確認してください。';
    }
    
    // デフォルトのエラーメッセージ
    return '画像の読み込み中にエラーが発生しました。もう一度お試しください。';
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="error-display" data-testid="error-display" role="alert">
      <div className="error-display__icon" data-testid="error-icon">
        ⚠️
      </div>
      <div className="error-display__content">
        <div className="error-display__message" data-testid="error-message">
          {getErrorMessage(error)}
        </div>
        <div className="error-display__actions">
          {showRetry && onRetry && (
            <button
              type="button"
              className="error-display__button error-display__button--retry"
              onClick={handleRetry}
              data-testid="retry-button"
            >
              再試行
            </button>
          )}
          {showClear && onClear && (
            <button
              type="button"
              className="error-display__button error-display__button--clear"
              onClick={handleClear}
              data-testid="clear-button"
            >
              クリア
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;