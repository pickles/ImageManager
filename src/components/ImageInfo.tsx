import React, { useState } from 'react';
import { ImageMetadata } from '../types/image';
import './ImageInfo.css';

/**
 * ImageInfoコンポーネントのProps
 * 要件 4.1, 4.2, 4.3, 4.4 に対応
 */
export interface ImageInfoProps {
  /** 画像メタデータ（nullの場合は情報なし状態を表示） */
  metadata: ImageMetadata | null;
}

/**
 * 画像メタデータ表示コンポーネント
 * 
 * 要件:
 * - 4.1: ファイル名の表示
 * - 4.2: ファイルサイズの表示
 * - 4.3: 画像解像度（幅×高さ）の表示
 * - 4.4: ファイル形式の表示
 */
export const ImageInfo: React.FC<ImageInfoProps> = ({ metadata }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  /**
   * ファイルサイズを人間が読みやすい形式に変換
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * ファイル形式を表示用に変換
   */
  const formatFileType = (mimeType: string): string => {
    const typeMap: Record<string, string> = {
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/webp': 'WebP'
    };
    
    return typeMap[mimeType] || mimeType.replace('image/', '').toUpperCase();
  };

  /**
   * 日付を表示用に変換
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // メタデータがない場合の表示
  if (!metadata) {
    return (
      <div className="image-info" data-testid="image-info">
        <div className="image-info__header">
          <button
            className="image-info__toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            aria-controls="image-info-content"
          >
            <span className={`image-info__toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
            <h3>画像情報</h3>
          </button>
        </div>
        {!isCollapsed && (
          <div className="image-info__content" id="image-info-content">
            <p className="image-info__no-data">画像が選択されていません</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="image-info" data-testid="image-info">
      <div className="image-info__header">
        <button
          className="image-info__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          aria-controls="image-info-content"
        >
          <span className={`image-info__toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
          <h3>画像情報</h3>
        </button>
      </div>
      {!isCollapsed && (
        <div className="image-info__content" id="image-info-content">
          <div className="image-info__item">
            <span className="image-info__label">ファイル名:</span>
            <span className="image-info__value" data-testid="file-name">
              {metadata.fileName}
            </span>
          </div>
          
          <div className="image-info__item">
            <span className="image-info__label">ファイルサイズ:</span>
            <span className="image-info__value" data-testid="file-size">
              {formatFileSize(metadata.fileSize)}
            </span>
          </div>
          
          <div className="image-info__item">
            <span className="image-info__label">解像度:</span>
            <span className="image-info__value" data-testid="resolution">
              {metadata.width} × {metadata.height} px
            </span>
          </div>
          
          <div className="image-info__item">
            <span className="image-info__label">形式:</span>
            <span className="image-info__value" data-testid="file-type">
              {formatFileType(metadata.fileType)}
            </span>
          </div>
          
          <div className="image-info__item">
            <span className="image-info__label">更新日時:</span>
            <span className="image-info__value" data-testid="last-modified">
              {formatDate(metadata.lastModified)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageInfo;