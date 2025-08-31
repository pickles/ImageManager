/**
 * DirectoryBrowser - メインコンテナコンポーネント
 * 左ペイン全体の管理と子コンポーネントの統合を担当
 * 要件: 1.1, 2.1, 2.5, 3.1, 3.3, 3.4, 4.1, 6.5
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DirectoryBrowserProps, ImageFileInfo, SortOption, SortOrder } from './types';
import { DirectoryService, DirectoryServiceError } from '../../services/DirectoryService';
import DirectorySelector from './DirectorySelector';
import ImageFileList from './ImageFileList';
import CollapsiblePanel from './CollapsiblePanel';
import './DirectoryBrowser.css';

const DirectoryBrowser: React.FC<DirectoryBrowserProps> = ({
  onFileSelect,
  selectedFile,
  isCollapsed,
  onToggleCollapse,
  className = ''
}) => {
  // 状態管理（要件1.1, 2.1）
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<ImageFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.CREATED_DATE);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);

  // DirectoryService インスタンス
  const [directoryService] = useState(() => new DirectoryService());

  // ディレクトリ選択ハンドラー（要件1.1）
  const handleDirectorySelect = useCallback(async (directoryPath: string) => {
    setSelectedDirectory(directoryPath);
    setIsLoading(true);
    setError(null);
    setImageFiles([]);

    try {
      // 現在のディレクトリハンドルを取得
      const directoryHandle = directoryService.getCurrentDirectoryHandle();
      if (!directoryHandle) {
        throw new Error('ディレクトリハンドルが取得できませんでした。');
      }

      // 画像ファイルを取得（要件2.1, 2.2）
      const files = await directoryService.getImageFiles(directoryHandle);
      setImageFiles(files);

      // エラーをクリア
      setError(null);
    } catch (err) {
      if (err instanceof DirectoryServiceError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('ディレクトリの読み込み中に予期しないエラーが発生しました。');
      }
      setImageFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [directoryService]);

  // ソート状態変更ハンドラー（要件6.5）
  const handleSortChange = useCallback((newSortBy: SortOption, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  // ファイル選択ハンドラー（要件3.1, 3.3, 3.4）
  const handleFileSelect = useCallback((file: File) => {
    onFileSelect(file);
  }, [onFileSelect]);

  // ソートされたファイル一覧を計算（要件2.5, 6.5）
  const sortedFiles = useMemo(() => {
    if (imageFiles.length === 0) return [];

    const sorted = [...imageFiles].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case SortOption.NAME:
          comparison = a.name.localeCompare(b.name, 'ja-JP');
          break;
        case SortOption.CREATED_DATE:
          comparison = a.createdDate.getTime() - b.createdDate.getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === SortOrder.ASC ? comparison : -comparison;
    });

    return sorted;
  }, [imageFiles, sortBy, sortOrder]);

  // エラーをクリアする関数
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 折りたたみ状態が変更された時の処理（要件4.1）
  useEffect(() => {
    // 折りたたみ状態の変更時に特別な処理が必要な場合はここに実装
    // 現在は特に処理なし
  }, [isCollapsed]);

  return (
    <CollapsiblePanel
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      title="ディレクトリブラウザ"
      className={`directory-browser ${className}`}
      collapseDirection="left"
    >
      <div className="directory-browser__content">
        {/* ディレクトリ選択セクション */}
        <div className="directory-browser__selector-section">
          <DirectorySelector
            onDirectorySelect={handleDirectorySelect}
            selectedDirectory={selectedDirectory}
            disabled={isLoading}
          />
        </div>

        {/* ファイル一覧セクション */}
        <div className="directory-browser__file-list-section">
          <ImageFileList
            files={sortedFiles}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
            error={error}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        {/* エラー表示（グローバルエラー用） */}
        {error && !isLoading && (
          <div className="directory-browser__error" role="alert">
            <div className="directory-browser__error-content">
              <span className="directory-browser__error-icon" aria-hidden="true">
                ⚠️
              </span>
              <span className="directory-browser__error-message">
                {error}
              </span>
              <button
                className="directory-browser__error-close"
                onClick={clearError}
                aria-label="エラーを閉じる"
                type="button"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
};

export default DirectoryBrowser;