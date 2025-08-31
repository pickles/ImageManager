/**
 * DirectorySelector - ディレクトリ選択コンポーネント
 * 要件1.1, 1.3, 1.4に対応
 */

import React from 'react';
import { DirectorySelectorProps } from './types';

const DirectorySelector: React.FC<DirectorySelectorProps> = ({
  onDirectorySelect: _onDirectorySelect,
  selectedDirectory: _selectedDirectory,
  disabled: _disabled = false
}) => {
  return (
    <div className="directory-selector">
      {/* 実装は後のタスクで行う */}
      <div>DirectorySelector - 実装予定</div>
    </div>
  );
};

export default DirectorySelector;