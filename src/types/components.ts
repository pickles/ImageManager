import { ImageMetadata, ImageError } from './image';

/**
 * FileSelectorコンポーネントのProps
 * 要件 1.1 に対応
 */
export interface FileSelectorProps {
  /** ファイル選択時のコールバック */
  onFileSelect: (file: File) => void;
  /** 受け入れ可能なファイル形式 */
  acceptedFormats: string[];
  /** 無効化状態 */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * ImageDisplayコンポーネントのProps
 * 要件 1.1, 3.1, 3.2, 3.3 に対応
 */
export interface ImageDisplayProps {
  /** 表示する画像のURL */
  imageUrl: string | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー情報 */
  error: ImageError | null;
  /** 最大幅（ピクセル） */
  maxWidth?: number;
  /** 最大高さ（ピクセル） */
  maxHeight?: number;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * ImageInfoコンポーネントのProps
 * 要件 4.1, 4.2, 4.3, 4.4 に対応
 */
export interface ImageInfoProps {
  /** 表示する画像メタデータ */
  metadata: ImageMetadata | null;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * LoadingIndicatorコンポーネントのProps
 * 要件 5.1, 5.2 に対応
 */
export interface LoadingIndicatorProps {
  /** ローディング状態の表示/非表示 */
  isVisible: boolean;
  /** ローディングメッセージ */
  message?: string;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * ErrorDisplayコンポーネントのProps
 * 要件 1.2, 1.3, 5.3 に対応
 */
export interface ErrorDisplayProps {
  /** 表示するエラー情報 */
  error: ImageError | null;
  /** エラー解決のためのアクション */
  onRetry?: () => void;
  /** エラーをクリアするアクション */
  onClear?: () => void;
  /** カスタムクラス名 */
  className?: string;
}