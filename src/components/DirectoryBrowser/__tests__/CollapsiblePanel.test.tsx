/**
 * CollapsiblePanel コンポーネントの単体テスト
 * 要件4.1, 4.2, 4.5, 4.6, 5.5に対応
 */

// React is imported automatically by the testing environment
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CollapsiblePanel from '../CollapsiblePanel';
import { CollapsiblePanelProps } from '../types';

// テスト用のデフォルトProps
const defaultProps: CollapsiblePanelProps = {
  isCollapsed: false,
  onToggle: vi.fn(),
  children: <div data-testid="panel-content">Test Content</div>,
};

describe('CollapsiblePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('基本的な構造が正しくレンダリングされる', () => {
      render(<CollapsiblePanel {...defaultProps} />);
      
      // パネル要素の存在確認（最初のregion要素を取得）
      const panels = screen.getAllByRole('region');
      const panel = panels[0]; // メインパネル
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveClass('collapsible-panel');
      expect(panel).toHaveClass('collapsible-panel--left'); // デフォルト方向
      expect(panel).toHaveClass('collapsible-panel--expanded'); // デフォルト状態
      
      // トグルボタンの存在確認
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveClass('collapsible-panel__toggle');
      
      // コンテンツの存在確認
      const content = screen.getByTestId('panel-content');
      expect(content).toBeInTheDocument();
    });

    it('タイトルが提供された場合、正しく表示される', () => {
      const title = 'Test Panel Title';
      render(<CollapsiblePanel {...defaultProps} title={title} />);
      
      const titleElement = screen.getByText(title);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('collapsible-panel__title');
    });

    it('カスタムクラス名が適用される', () => {
      const customClass = 'custom-panel-class';
      render(<CollapsiblePanel {...defaultProps} className={customClass} />);
      
      const panels = screen.getAllByRole('region');
      const panel = panels[0]; // メインパネル
      expect(panel).toHaveClass(customClass);
    });

    it('右側折りたたみ方向が正しく適用される', () => {
      render(<CollapsiblePanel {...defaultProps} collapseDirection="right" />);
      
      const panels = screen.getAllByRole('region');
      const panel = panels[0]; // メインパネル
      expect(panel).toHaveClass('collapsible-panel--right');
      expect(panel).not.toHaveClass('collapsible-panel--left');
    });
  });

  describe('折りたたみ状態の管理', () => {
    it('展開状態が正しく表示される', () => {
      render(<CollapsiblePanel {...defaultProps} isCollapsed={false} />);
      
      const panels = screen.getAllByRole('region');
      const panel = panels[0]; // メインパネル
      expect(panel).toHaveClass('collapsible-panel--expanded');
      expect(panel).not.toHaveClass('collapsible-panel--collapsed');
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('折りたたみ状態が正しく表示される', () => {
      render(<CollapsiblePanel {...defaultProps} isCollapsed={true} />);
      
      const panel = screen.getByRole('region');
      expect(panel).toHaveClass('collapsible-panel--collapsed');
      expect(panel).not.toHaveClass('collapsible-panel--expanded');
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('折りたたみ状態に応じてアイコンが変更される', () => {
      const { rerender } = render(<CollapsiblePanel {...defaultProps} isCollapsed={false} />);
      
      // 展開状態のアイコン
      let icon = screen.getByText('◀');
      expect(icon).toBeInTheDocument();
      
      // 折りたたみ状態に変更
      rerender(<CollapsiblePanel {...defaultProps} isCollapsed={true} />);
      icon = screen.getByText('▶');
      expect(icon).toBeInTheDocument();
    });

    it('右側折りたたみの場合、アイコンが逆向きになる', () => {
      const { rerender } = render(
        <CollapsiblePanel {...defaultProps} collapseDirection="right" isCollapsed={false} />
      );
      
      // 展開状態のアイコン（右側）
      let icon = screen.getByText('▶');
      expect(icon).toBeInTheDocument();
      
      // 折りたたみ状態に変更
      rerender(
        <CollapsiblePanel {...defaultProps} collapseDirection="right" isCollapsed={true} />
      );
      icon = screen.getByText('◀');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('トグルボタンクリックでonToggleが呼ばれる', () => {
      const mockOnToggle = vi.fn();
      render(<CollapsiblePanel {...defaultProps} onToggle={mockOnToggle} />);
      
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('Enterキーでトグルが動作する', () => {
      const mockOnToggle = vi.fn();
      render(<CollapsiblePanel {...defaultProps} onToggle={mockOnToggle} />);
      
      const toggleButton = screen.getByRole('button');
      fireEvent.keyDown(toggleButton, { key: 'Enter' });
      
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('スペースキーでトグルが動作する', () => {
      const mockOnToggle = vi.fn();
      render(<CollapsiblePanel {...defaultProps} onToggle={mockOnToggle} />);
      
      const toggleButton = screen.getByRole('button');
      fireEvent.keyDown(toggleButton, { key: ' ' });
      
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('その他のキーではトグルが動作しない', () => {
      const mockOnToggle = vi.fn();
      render(<CollapsiblePanel {...defaultProps} onToggle={mockOnToggle} />);
      
      const toggleButton = screen.getByRole('button');
      fireEvent.keyDown(toggleButton, { key: 'Tab' });
      fireEvent.keyDown(toggleButton, { key: 'Escape' });
      
      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定される', () => {
      const title = 'Test Panel';
      render(<CollapsiblePanel {...defaultProps} title={title} />);
      
      const panels = screen.getAllByRole('region');
      const panel = panels[0]; // メインパネル
      const toggleButton = screen.getByRole('button');
      const content = panels[1]; // コンテンツ領域
      
      // パネルのARIA属性
      expect(panel).toHaveAttribute('aria-labelledby');
      
      // トグルボタンのARIA属性
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      expect(toggleButton).toHaveAttribute('aria-controls');
      expect(toggleButton).toHaveAttribute('aria-label');
      
      // コンテンツのARIA属性
      expect(content).toHaveAttribute('aria-hidden', 'false');
      expect(content).toHaveAttribute('aria-labelledby');
    });

    it('折りたたみ状態でaria-hiddenが正しく設定される', () => {
      render(<CollapsiblePanel {...defaultProps} isCollapsed={true} />);
      
      // クラス名で直接コンテンツ要素を取得
      const contentElement = document.querySelector('.collapsible-panel__content');
      
      // React では boolean の aria-hidden は文字列として出力される
      expect(contentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('適切なaria-labelが設定される', () => {
      const title = 'Directory Browser';
      const { rerender } = render(
        <CollapsiblePanel {...defaultProps} title={title} isCollapsed={false} />
      );
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute('aria-label', `${title}を折りたたみ`);
      
      // 折りたたみ状態に変更
      rerender(<CollapsiblePanel {...defaultProps} title={title} isCollapsed={true} />);
      expect(toggleButton).toHaveAttribute('aria-label', `${title}を展開`);
    });

    it('タイトルがない場合のaria-labelが設定される', () => {
      const { rerender } = render(<CollapsiblePanel {...defaultProps} isCollapsed={false} />);
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute('aria-label', 'パネルを折りたたみ');
      
      // 折りたたみ状態に変更
      rerender(<CollapsiblePanel {...defaultProps} isCollapsed={true} />);
      expect(toggleButton).toHaveAttribute('aria-label', 'パネルを展開');
    });

    it('アイコンにaria-hidden属性が設定される', () => {
      render(<CollapsiblePanel {...defaultProps} />);
      
      const icon = screen.getByText('◀');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('フォーカス管理', () => {
    it('折りたたみ時にトグルボタンにフォーカスが移動する', async () => {
      const { rerender } = render(<CollapsiblePanel {...defaultProps} isCollapsed={false} />);
      
      // 折りたたみ状態に変更
      rerender(<CollapsiblePanel {...defaultProps} isCollapsed={true} />);
      
      const toggleButton = screen.getByRole('button');
      await waitFor(() => {
        expect(toggleButton).toHaveFocus();
      });
    });
  });

  describe('コンテンツの表示', () => {
    it('子要素が正しく表示される', () => {
      const testContent = 'Test Panel Content';
      render(
        <CollapsiblePanel {...defaultProps}>
          <div data-testid="custom-content">{testContent}</div>
        </CollapsiblePanel>
      );
      
      const content = screen.getByTestId('custom-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent(testContent);
    });

    it('複数の子要素が正しく表示される', () => {
      render(
        <CollapsiblePanel {...defaultProps}>
          <div data-testid="content-1">Content 1</div>
          <div data-testid="content-2">Content 2</div>
          <button data-testid="content-button">Button</button>
        </CollapsiblePanel>
      );
      
      expect(screen.getByTestId('content-1')).toBeInTheDocument();
      expect(screen.getByTestId('content-2')).toBeInTheDocument();
      expect(screen.getByTestId('content-button')).toBeInTheDocument();
    });
  });

  describe('CSS クラスの適用', () => {
    it('状態に応じたCSSクラスが適用される', () => {
      const { rerender } = render(<CollapsiblePanel {...defaultProps} isCollapsed={false} />);
      
      let panels = screen.getAllByRole('region');
      let panel = panels[0]; // メインパネル
      expect(panel).toHaveClass('collapsible-panel--expanded');
      expect(panel).not.toHaveClass('collapsible-panel--collapsed');
      
      // 折りたたみ状態に変更
      rerender(<CollapsiblePanel {...defaultProps} isCollapsed={true} />);
      panels = screen.getAllByRole('region');
      panel = panels[0]; // メインパネル
      expect(panel).toHaveClass('collapsible-panel--collapsed');
      expect(panel).not.toHaveClass('collapsible-panel--expanded');
    });

    it('方向に応じたCSSクラスが適用される', () => {
      const { rerender } = render(
        <CollapsiblePanel {...defaultProps} collapseDirection="left" />
      );
      
      let panels = screen.getAllByRole('region');
      let panel = panels[0]; // メインパネル
      expect(panel).toHaveClass('collapsible-panel--left');
      expect(panel).not.toHaveClass('collapsible-panel--right');
      
      // 右側に変更
      rerender(<CollapsiblePanel {...defaultProps} collapseDirection="right" />);
      panels = screen.getAllByRole('region');
      panel = panels[0]; // メインパネル
      expect(panel).toHaveClass('collapsible-panel--right');
      expect(panel).not.toHaveClass('collapsible-panel--left');
    });
  });

  describe('エラーハンドリング', () => {
    it('onToggleが未定義でもエラーが発生しない', () => {
      // onToggleを未定義にしてテスト
      const propsWithoutToggle = { ...defaultProps };
      delete (propsWithoutToggle as any).onToggle;
      
      expect(() => {
        render(<CollapsiblePanel {...propsWithoutToggle} />);
      }).not.toThrow();
    });

    it('childrenが未定義でもエラーが発生しない', () => {
      const propsWithoutChildren = { ...defaultProps };
      delete (propsWithoutChildren as any).children;
      
      expect(() => {
        render(<CollapsiblePanel {...propsWithoutChildren} />);
      }).not.toThrow();
    });
  });
});