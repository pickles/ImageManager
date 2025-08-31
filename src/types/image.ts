/**
 * 画像メタデータの型定義
 * 要件 4.1, 4.2, 4.3, 4.4 に対応
 */
export interface ImageMetadata {
  /** ファイル名 */
  fileName: string;
  /** ファイルサイズ（バイト） */
  fileSize: number;
  /** ファイル形式 */
  fileType: string;
  /** 画像の幅（ピクセル） */
  width: number;
  /** 画像の高さ（ピクセル） */
  height: number;
  /** 最終更新日時 */
  lastModified: Date;
}

/**
 * 画像表示状態の型定義
 * アプリケーション全体の状態管理に使用
 */
export interface ImageDisplayState {
  /** 選択されたファイル */
  selectedFile: File | null;
  /** 画像URL（表示用） */
  imageUrl: string | null;
  /** 画像メタデータ */
  metadata: ImageMetadata | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * サポートされる画像形式
 * 要件 2.1, 2.2, 2.3, 2.4 に対応
 */
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
] as const;

export type SupportedImageFormat = typeof SUPPORTED_IMAGE_FORMATS[number];

/**
 * 画像表示サイズの計算結果
 * 要件 3.1, 3.2, 3.3 に対応
 */
export interface DisplaySize {
  width: number;
  height: number;
}

/**
 * エラータイプの定義
 * 要件 1.2, 1.3, 5.3 に対応
 */
export enum ImageErrorType {
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  LOAD_FAILED = 'LOAD_FAILED',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR'
}

/**
 * 画像エラーの詳細情報
 */
export interface ImageError {
  type: ImageErrorType;
  message: string;
  originalError?: Error;
}