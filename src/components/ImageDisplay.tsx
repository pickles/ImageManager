import React from 'react';
import './ImageDisplay.css';

/**
 * ImageDisplayコンポーネントのProps
 * 要件 1.1, 3.1, 3.2, 3.3 に対応
 */
export interface ImageDisplayProps {
  /** 表示する画像のURL */
  imageUrl: string | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** 最大幅（ピクセル） */
  maxWidth?: number;
  /** 最大高さ（ピクセル） */
  maxHeight?: number;
  /** 代替テキスト */
  alt?: string;
}

/**
 * 画像表示コンポーネント
 * 
 * 機能:
 * - 画像の表示（要件 1.1）
 * - 適切なスケーリング（要件 3.1, 3.2）
 * - アスペクト比の維持（要件 3.3）
 * - ローディング状態の表示（要件 5.1）
 * - エラー状態の表示（要件 5.3）
 */
export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  isLoading,
  error,
  maxWidth = 800,
  maxHeight = 600,
  alt = '選択された画像'
}) => {
  const containerStyle = {
    maxWidth: `${maxWidth}px`,
    maxHeight: `${maxHeight}px`
  };

  // エラー状態の表示
  if (error) {
    return (
      <div className="image-display" style={containerStyle}>
        <div className="image-display__error">
          <div className="image-display__error-icon">⚠️</div>
          <div className="image-display__error-message">{error}</div>
        </div>
      </div>
    );
  }

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className="image-display" style={containerStyle}>
        <div className="image-display__loading">
          <div className="image-display__loading-spinner"></div>
          <div className="image-display__loading-text">画像を読み込み中...</div>
        </div>
      </div>
    );
  }

  // 画像が選択されていない場合のプレースホルダー
  if (!imageUrl) {
    return (
      <div className="image-display" style={containerStyle}>
        <div className="image-display__placeholder">
          <div className="image-display__placeholder-icon">🖼️</div>
          <div className="image-display__placeholder-text">
            画像を選択してください
          </div>
        </div>
      </div>
    );
  }

  // 画像の表示
  return (
    <div className="image-display" style={containerStyle}>
      <img
        src={imageUrl}
        alt={alt}
        className="image-display__image"
        onError={(e) => {
          console.error('画像の読み込みに失敗しました:', e);
        }}
      />
    </div>
  );
};

export default ImageDisplay;