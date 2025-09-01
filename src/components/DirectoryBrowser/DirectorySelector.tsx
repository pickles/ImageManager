/**
 * DirectorySelector コンポーネント
 * ディレクトリ選択機能を提供
 * 要件1.1, 1.3, 1.4に対応
 */

import React, { useState, useCallback } from 'react';
import { DirectorySelectorProps, DirectoryBrowserErrorType } from './types';
import { DirectoryService, DirectoryServiceError } from '../../services/DirectoryService';
import './DirectorySelector.css';

export const DirectorySelector: React.FC<DirectorySelectorProps> = ({
  onDirectorySelect,
  selectedDirectory,
  disabled = false
}) => {
  // デバッグ用ログ
  console.log('DirectorySelector rendered with props:', {
    selectedDirectory,
    disabled
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directoryService] = useState(() => new DirectoryService());

  // ディレクトリ選択ハンドラー
  const handleDirectorySelect = useCallback(async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // ディレクトリ選択ダイアログを表示
      const directoryPath = await directoryService.selectDirectory();
      
      if (directoryPath) {
        const directoryHandle = directoryService.getCurrentDirectoryHandle();
        if (directoryHandle) {
          onDirectorySelect(directoryPath, directoryHandle);
        }
      }
    } catch (err) {
      if (err instanceof DirectoryServiceError) {
        setError(err.message);
      } else if (err instanceof Error && err.name === 'DirectoryServiceError') {
        setError(err.message);
      } else {
        setError('ディレクトリの選択中に予期しないエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  }, [directoryService, onDirectorySelect, disabled, isLoading]);

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="directory-selector">
      {/* ディレクトリ選択ボタン */}
      <button
        className={`directory-selector__button ${isLoading ? 'directory-selector__button--loading' : ''}`}
        onClick={handleDirectorySelect}
        disabled={disabled || isLoading}
        aria-label="ディレクトリを選択"
        type="button"
      >
        {isLoading ? (
          <>
            <span className="directory-selector__loading-icon" aria-hidden="true">
              ⟳
            </span>
            選択中...
          </>
        ) : (
          <>
            <span className="directory-selector__folder-icon" aria-hidden="true">
              📁
            </span>
            ディレクトリを選択
          </>
        )}
      </button>

      {/* 選択されたディレクトリパスの表示 */}
      {selectedDirectory && (
        <div className="directory-selector__selected">
          <span className="directory-selector__selected-label">選択中:</span>
          <span 
            className="directory-selector__selected-path"
            title={selectedDirectory}
          >
            {selectedDirectory}
          </span>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="directory-selector__error" role="alert">
          <span className="directory-selector__error-icon" aria-hidden="true">
            ⚠️
          </span>
          <span className="directory-selector__error-message">
            {error}
          </span>
          <button
            className="directory-selector__error-close"
            onClick={clearError}
            aria-label="エラーを閉じる"
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {/* ブラウザサポート情報 */}
      {!directoryService.isSupported() && !import.meta.env.DEV && (
        <div className="directory-selector__unsupported" role="alert">
          <span className="directory-selector__warning-icon" aria-hidden="true">
            ℹ️
          </span>
          <span className="directory-selector__unsupported-message">
            ディレクトリ選択機能を使用するには、Chrome、Edge、またはOpera の最新版が必要です。
            また、localhost以外からアクセスする場合はHTTPS接続が必要です。
          </span>
        </div>
      )}

      {/* 開発環境での情報表示 */}
      {import.meta.env.DEV && (
        <div className="directory-selector__dev-info">
          <span className="directory-selector__info-icon" aria-hidden="true">
            🔧
          </span>
          <span className="directory-selector__dev-message">
            開発環境: 固定ディレクトリを使用中
          </span>
        </div>
      )}
    </div>
  );
};

export default DirectorySelector;