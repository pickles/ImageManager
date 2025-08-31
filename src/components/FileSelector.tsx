import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { SUPPORTED_IMAGE_FORMATS } from '../types/image';
import './FileSelector.css';

/**
 * FileSelectorコンポーネントのProps
 * 要件 1.1 に対応
 */
export interface FileSelectorProps {
  /** ファイル選択時のコールバック */
  onFileSelect: (file: File) => void;
  /** 受け入れ可能なファイル形式 */
  acceptedFormats?: string[];
  /** 無効状態 */
  disabled?: boolean;
  /** 最大ファイルサイズ（バイト） */
  maxFileSize?: number;
}

/**
 * ファイル選択コンポーネント
 * ドラッグ&ドロップとファイル入力の両方をサポート
 * 要件 1.1 に対応
 */
export const FileSelector: React.FC<FileSelectorProps> = ({
  onFileSelect,
  acceptedFormats = SUPPORTED_IMAGE_FORMATS,
  disabled = false,
  maxFileSize = 50 * 1024 * 1024 // 50MB
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイルのバリデーション
   */
  const validateFile = (file: File): boolean => {
    setError(null);

    // ファイル形式チェック
    if (!acceptedFormats.includes(file.type as any)) {
      setError(`サポートされていないファイル形式です: ${file.type}`);
      return false;
    }

    // ファイルサイズチェック
    if (file.size > maxFileSize) {
      setError(`ファイルサイズが大きすぎます。最大${Math.round(maxFileSize / (1024 * 1024))}MBまでです。`);
      return false;
    }

    return true;
  };

  /**
   * ファイル選択処理
   */
  const handleFileSelect = (file: File) => {
    // App レベルでのバリデーションに委ねるため、常にファイルを渡す
    onFileSelect(file);
  };

  /**
   * ドラッグオーバーイベントハンドラー
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  /**
   * ドラッグリーブイベントハンドラー
   */
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  /**
   * ドロップイベントハンドラー
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]); // 最初のファイルのみ処理
    }
  };

  /**
   * ファイル入力変更イベントハンドラー
   */
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * ファイル選択ダイアログを開く
   */
  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="file-selector">
      <div
        className={`file-selector__drop-zone ${
          isDragOver ? 'file-selector__drop-zone--drag-over' : ''
        } ${disabled ? 'file-selector__drop-zone--disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="画像ファイルを選択またはドラッグ&ドロップ"
      >
        <div className="file-selector__content">
          <div className="file-selector__icon">
            📁
          </div>
          <div className="file-selector__text">
            <p className="file-selector__primary-text">
              {isDragOver ? 'ファイルをドロップしてください' : '画像ファイルを選択'}
            </p>
            <p className="file-selector__secondary-text">
              クリックして選択するか、ここにドラッグ&ドロップ
            </p>
            <p className="file-selector__format-text">
              対応形式: JPEG, PNG, GIF, WebP (最大{Math.round(maxFileSize / (1024 * 1024))}MB)
            </p>
          </div>
        </div>
      </div>

      {/* エラー表示は App レベルで処理されるため、ここでは表示しない */}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="file-selector__input"
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  );
};