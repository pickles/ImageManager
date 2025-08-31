import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ImageDisplay } from '../ImageDisplay';
import type { ImageDisplayProps } from '../ImageDisplay';

// モック用のテストデータ
const mockImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('ImageDisplay', () => {
  const defaultProps: ImageDisplayProps = {
    imageUrl: null,
    isLoading: false,
    error: null,
    maxWidth: 800,
    maxHeight: 600,
    alt: 'テスト画像'
  };

  describe('プレースホルダー表示', () => {
    it('画像URLがnullの場合、プレースホルダーを表示する', () => {
      render(<ImageDisplay {...defaultProps} />);
      
      expect(screen.getByText('画像を選択してください')).toBeInTheDocument();
      expect(screen.getByText('🖼️')).toBeInTheDocument();
    });

    it('プレースホルダーに適切なクラス名が設定される', () => {
      render(<ImageDisplay {...defaultProps} />);
      
      const placeholder = screen.getByText('画像を選択してください').parentElement;
      expect(placeholder).toHaveClass('image-display__placeholder');
    });
  });

  describe('ローディング状態', () => {
    it('isLoadingがtrueの場合、ローディングインジケーターを表示する（要件 5.1）', () => {
      render(<ImageDisplay {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('画像を読み込み中...')).toBeInTheDocument();
      expect(document.querySelector('.image-display__loading-spinner')).toBeInTheDocument();
    });

    it('ローディング中は画像やプレースホルダーを表示しない', () => {
      render(<ImageDisplay {...defaultProps} isLoading={true} imageUrl={mockImageUrl} />);
      
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.queryByText('画像を選択してください')).not.toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラーがある場合、エラーメッセージを表示する（要件 5.3）', () => {
      const errorMessage = 'ファイルの読み込みに失敗しました';
      render(<ImageDisplay {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('エラー状態では画像やローディングを表示しない', () => {
      render(<ImageDisplay 
        {...defaultProps} 
        error="エラーメッセージ" 
        isLoading={true} 
        imageUrl={mockImageUrl} 
      />);
      
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.queryByText('画像を読み込み中...')).not.toBeInTheDocument();
    });

    it('エラー表示に適切なクラス名が設定される', () => {
      render(<ImageDisplay {...defaultProps} error="テストエラー" />);
      
      const errorContainer = screen.getByText('テストエラー').parentElement;
      expect(errorContainer).toHaveClass('image-display__error');
    });
  });

  describe('画像表示', () => {
    it('imageUrlが提供された場合、画像を表示する（要件 1.1）', () => {
      render(<ImageDisplay {...defaultProps} imageUrl={mockImageUrl} />);
      
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockImageUrl);
    });

    it('画像に適切なalt属性が設定される', () => {
      const altText = 'カスタム代替テキスト';
      render(<ImageDisplay {...defaultProps} imageUrl={mockImageUrl} alt={altText} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', altText);
    });

    it('デフォルトのalt属性が設定される', () => {
      render(<ImageDisplay {...defaultProps} imageUrl={mockImageUrl} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'テスト画像');
    });

    it('画像に適切なクラス名が設定される', () => {
      render(<ImageDisplay {...defaultProps} imageUrl={mockImageUrl} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveClass('image-display__image');
    });
  });

  describe('コンテナのスタイリング', () => {
    it('maxWidthとmaxHeightが適切に設定される（要件 3.1, 3.2）', () => {
      const maxWidth = 1000;
      const maxHeight = 800;
      
      render(<ImageDisplay 
        {...defaultProps} 
        maxWidth={maxWidth} 
        maxHeight={maxHeight} 
      />);
      
      const container = document.querySelector('.image-display');
      expect(container).toHaveStyle({
        maxWidth: `${maxWidth}px`,
        maxHeight: `${maxHeight}px`
      });
    });

    it('デフォルトのmaxWidthとmaxHeightが設定される', () => {
      render(<ImageDisplay {...defaultProps} />);
      
      const container = document.querySelector('.image-display');
      expect(container).toHaveStyle({
        maxWidth: '800px',
        maxHeight: '600px'
      });
    });

    it('コンテナに適切なクラス名が設定される', () => {
      render(<ImageDisplay {...defaultProps} />);
      
      const container = document.querySelector('.image-display');
      expect(container).toHaveClass('image-display');
    });
  });

  describe('エラーハンドリング', () => {
    it('画像の読み込みエラー時にコンソールエラーが出力される', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ImageDisplay {...defaultProps} imageUrl={mockImageUrl} />);
      
      const image = screen.getByRole('img');
      const errorEvent = new Event('error');
      image.dispatchEvent(errorEvent);
      
      expect(consoleSpy).toHaveBeenCalledWith('画像の読み込みに失敗しました:', expect.any(Object));
      
      consoleSpy.mockRestore();
    });
  });

  describe('状態の優先順位', () => {
    it('エラー状態が最優先で表示される', () => {
      render(<ImageDisplay 
        {...defaultProps} 
        error="エラーメッセージ"
        isLoading={true}
        imageUrl={mockImageUrl}
      />);
      
      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
      expect(screen.queryByText('画像を読み込み中...')).not.toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('ローディング状態が画像表示より優先される', () => {
      render(<ImageDisplay 
        {...defaultProps} 
        isLoading={true}
        imageUrl={mockImageUrl}
      />);
      
      expect(screen.getByText('画像を読み込み中...')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('画像にrole="img"が適切に設定される', () => {
      render(<ImageDisplay {...defaultProps} imageUrl={mockImageUrl} />);
      
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('エラーメッセージが適切に表示される', () => {
      const errorMessage = 'アクセシビリティテスト用エラー';
      render(<ImageDisplay {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});