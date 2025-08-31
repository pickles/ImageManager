import React from 'react';
import { ImageFileListProps, SortOption, SortOrder, ImageFileInfo } from './types';
import './ImageFileList.css';

/**
 * ImageFileList コンポーネント
 * 画像ファイル一覧の表示と選択機能を提供
 * 要件: 2.2, 2.4, 2.5, 2.7, 3.1, 3.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export const ImageFileList: React.FC<ImageFileListProps> = ({
  files,
  selectedFile,
  onFileSelect,
  isLoading,
  error,
  sortBy,
  sortOrder,
  onSortChange
}) => {
  // ソートボタンのクリックハンドラー（要件6.2, 6.3）
  const handleSortClick = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      // 同じソートオプションの場合は順序を反転（要件6.3）
      const newSortOrder = sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
      onSortChange(newSortBy, newSortOrder);
    } else {
      // 異なるソートオプションの場合は昇順から開始
      onSortChange(newSortBy, SortOrder.ASC);
    }
  };

  // ファイル選択ハンドラー（要件3.1）
  const handleFileClick = (fileInfo: ImageFileInfo) => {
    onFileSelect(fileInfo.file);
  };

  // ファイルが選択されているかチェック（要件3.1）
  const isFileSelected = (fileInfo: ImageFileInfo): boolean => {
    return selectedFile !== null && selectedFile.name === fileInfo.file.name;
  };

  // ソートアイコンの取得（要件6.6）
  const getSortIcon = (option: SortOption): string => {
    if (sortBy !== option) return '↕️'; // ソートなし
    return sortOrder === SortOrder.ASC ? '↑' : '↓';
  };

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 日付のフォーマット（要件2.4）
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // エラー状態の表示（要件2.7）
  if (error) {
    return (
      <div className="image-file-list">
        <div className="image-file-list__error">
          <div className="image-file-list__error-icon">⚠️</div>
          <div className="image-file-list__error-message">{error}</div>
        </div>
      </div>
    );
  }

  // ローディング状態の表示（要件2.7）
  if (isLoading) {
    return (
      <div className="image-file-list">
        <div className="image-file-list__loading">
          <div className="image-file-list__loading-spinner"></div>
          <div className="image-file-list__loading-message">ファイルを読み込み中...</div>
        </div>
      </div>
    );
  }

  // ファイルが存在しない場合（要件2.7）
  if (files.length === 0) {
    return (
      <div className="image-file-list">
        <div className="image-file-list__empty">
          <div className="image-file-list__empty-icon">📁</div>
          <div className="image-file-list__empty-message">画像ファイルが見つかりません</div>
        </div>
      </div>
    );
  }

  return (
    <div className="image-file-list">
      {/* ソートヘッダー（要件6.1, 6.6） */}
      <div className="image-file-list__header">
        <button
          className={`image-file-list__sort-button ${
            sortBy === SortOption.NAME ? 'image-file-list__sort-button--active' : ''
          }`}
          onClick={() => handleSortClick(SortOption.NAME)}
          aria-label={`ファイル名でソート ${getSortIcon(SortOption.NAME)}`}
        >
          ファイル名 {getSortIcon(SortOption.NAME)}
        </button>
        <button
          className={`image-file-list__sort-button ${
            sortBy === SortOption.CREATED_DATE ? 'image-file-list__sort-button--active' : ''
          }`}
          onClick={() => handleSortClick(SortOption.CREATED_DATE)}
          aria-label={`作成日でソート ${getSortIcon(SortOption.CREATED_DATE)}`}
        >
          作成日 {getSortIcon(SortOption.CREATED_DATE)}
        </button>
      </div>

      {/* ファイル一覧（要件2.2, 2.4, 2.5, 3.1, 3.2） */}
      <div className="image-file-list__content">
        <ul 
          className="image-file-list__list"
          role="listbox"
          aria-label="画像ファイル一覧"
        >
          {files.map((fileInfo, index) => (
            <li
              key={`${fileInfo.name}-${index}`}
              className={`image-file-list__item ${
                isFileSelected(fileInfo) ? 'image-file-list__item--selected' : ''
              }`}
              role="option"
              aria-selected={isFileSelected(fileInfo)}
              onClick={() => handleFileClick(fileInfo)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFileClick(fileInfo);
                }
              }}
            >
              <div className="image-file-list__item-content">
                <div className="image-file-list__item-name" title={fileInfo.name}>
                  {fileInfo.name}
                </div>
                <div className="image-file-list__item-details">
                  <div className="image-file-list__item-date">
                    {formatDate(fileInfo.createdDate)}
                  </div>
                  <div className="image-file-list__item-size">
                    {formatFileSize(fileInfo.size)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ImageFileList;