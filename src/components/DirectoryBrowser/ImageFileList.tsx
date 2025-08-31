/**
 * ImageFileList - 画像ファイル一覧コンポーネント
 * 要件2.2, 2.4, 2.5, 2.7, 3.1, 3.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6に対応
 */

import React from 'react';
import { ImageFileListProps } from './types';

const ImageFileList: React.FC<ImageFileListProps> = ({
  files: _files,
  selectedFile: _selectedFile,
  onFileSelect: _onFileSelect,
  isLoading: _isLoading,
  error: _error,
  sortBy: _sortBy,
  sortOrder: _sortOrder,
  onSortChange: _onSortChange
}) => {
  return (
    <div className="image-file-list">
      {/* 実装は後のタスクで行う */}
      <div>ImageFileList - 実装予定</div>
    </div>
  );
};

export default ImageFileList;