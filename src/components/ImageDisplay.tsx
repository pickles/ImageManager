import React, { useState, useEffect } from 'react';
import './ImageDisplay.css';
import { ImageService } from '../services/ImageService';
import { DisplaySize } from '../types/image';

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
  /** 画像の元の幅（ImageServiceでの計算用） */
  originalWidth?: number;
  /** 画像の元の高さ（ImageServiceでの計算用） */
  originalHeight?: number;
}

/**
 * 画像表示コンポーネント
 * ImageServiceを使用した実際の画像スケーリングとフィット機能の統合
 * 
 * 機能:
 * - 画像の表示（要件 1.1）
 * - ImageServiceを使用した適切なスケーリング（要件 3.1, 3.2）
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
  alt = '選択された画像',
  originalWidth,
  originalHeight
}) => {
  const [displaySize, setDisplaySize] = useState<DisplaySize | null>(null);
  const [imageService] = useState(() => new ImageService());

  // ImageServiceを使用して最適な表示サイズを計算
  useEffect(() => {
    if (originalWidth && originalHeight && maxWidth && maxHeight) {
      try {
        const calculatedSize = imageService.calculateDisplaySize(
          originalWidth,
          originalHeight,
          maxWidth - 64, // パディングとボーダー分を考慮
          maxHeight - 64
        );
        setDisplaySize(calculatedSize);
      } catch (error) {
        console.error('表示サイズの計算に失敗しました:', error);
        // フォールバック: 元のサイズを使用
        setDisplaySize({
          width: Math.min(originalWidth, maxWidth - 64),
          height: Math.min(originalHeight, maxHeight - 64)
        });
      }
    } else {
      setDisplaySize(null);
    }
  }, [originalWidth, originalHeight, maxWidth, maxHeight, imageService]);

  const containerStyle = {
    width: '100%',
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

  // 画像の表示（ImageServiceで計算されたサイズを使用）
  return (
    <div className="image-display" style={containerStyle}>
      <img
        src={imageUrl}
        alt={alt}
        className="image-display__image"
        style={{
          // ImageServiceで計算されたサイズを使用、フォールバックとして従来の方法を使用
          width: displaySize ? `${displaySize.width}px` : 'auto',
          height: displaySize ? `${displaySize.height}px` : 'auto',
          maxWidth: displaySize ? undefined : `${Math.max(100, maxWidth - 64)}px`,
          maxHeight: displaySize ? undefined : `${Math.max(100, maxHeight - 64)}px`,
        }}
        onError={(e) => {
          console.error('画像の読み込みに失敗しました:', e);
        }}
      />
    </div>
  );
};

export default ImageDisplay;