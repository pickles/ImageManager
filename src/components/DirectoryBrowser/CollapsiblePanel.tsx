/**
 * CollapsiblePanel - 汎用折りたたみコンポーネント
 * 要件4.1, 4.2, 4.5, 4.6, 5.5に対応
 */

import React from 'react';
import { CollapsiblePanelProps } from './types';

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  isCollapsed: _isCollapsed,
  onToggle: _onToggle,
  children,
  title: _title,
  className = '',
  collapseDirection: _collapseDirection = 'left'
}) => {
  return (
    <div className={`collapsible-panel ${className}`}>
      {/* 実装は後のタスクで行う */}
      <div>CollapsiblePanel - 実装予定</div>
      {children}
    </div>
  );
};

export default CollapsiblePanel;