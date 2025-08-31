/**
 * CollapsiblePanel - 汎用折りたたみコンポーネント
 * 要件4.1, 4.2, 4.5, 4.6, 5.5に対応
 */

import React, { useRef, useEffect } from 'react';
import { CollapsiblePanelProps } from './types';
import './CollapsiblePanel.css';

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  isCollapsed,
  onToggle,
  children,
  title,
  className = '',
  collapseDirection = 'left'
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // キーボードナビゲーション対応
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  // 折りたたみ状態が変更された時のフォーカス管理
  useEffect(() => {
    if (isCollapsed && toggleButtonRef.current) {
      // 折りたたまれた時は、トグルボタンにフォーカスを移動
      toggleButtonRef.current.focus();
    }
  }, [isCollapsed]);

  const panelId = `collapsible-panel-${Math.random().toString(36).substr(2, 9)}`;
  const contentId = `${panelId}-content`;
  const toggleId = `${panelId}-toggle`;

  return (
    <div 
      className={`collapsible-panel collapsible-panel--${collapseDirection} ${
        isCollapsed ? 'collapsible-panel--collapsed' : 'collapsible-panel--expanded'
      } ${className}`}
      role="region"
      aria-labelledby={title ? toggleId : undefined}
    >
      {/* 折りたたみトグルボタン */}
      <button
        ref={toggleButtonRef}
        id={toggleId}
        className="collapsible-panel__toggle"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={!isCollapsed}
        aria-controls={contentId}
        aria-label={
          title 
            ? `${title}を${isCollapsed ? '展開' : '折りたたみ'}` 
            : `パネルを${isCollapsed ? '展開' : '折りたたみ'}`
        }
        type="button"
      >
        <span className="collapsible-panel__toggle-icon" aria-hidden="true">
          {collapseDirection === 'left' ? (
            isCollapsed ? '▶' : '◀'
          ) : (
            isCollapsed ? '◀' : '▶'
          )}
        </span>
        {title && (
          <span className="collapsible-panel__title">
            {title}
          </span>
        )}
      </button>

      {/* コンテンツエリア */}
      <div
        ref={contentRef}
        id={contentId}
        className="collapsible-panel__content"
        aria-hidden={isCollapsed}
        role="region"
        aria-labelledby={title ? toggleId : undefined}
      >
        <div className="collapsible-panel__content-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsiblePanel;