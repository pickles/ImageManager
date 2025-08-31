import { ImageMetadata, ImageDisplayState, SUPPORTED_IMAGE_FORMATS, SupportedImageFormat } from '../types/image';

/**
 * ImageMetadataのバリデーション関数
 * データ整合性を確保するための検証ロジック
 * 要件 4.1, 4.2, 4.3, 4.4 に対応
 */

/**
 * ImageMetadataオブジェクトの妥当性を検証
 * @param metadata 検証するメタデータ
 * @returns 妥当性の結果
 */
export function validateImageMetadata(metadata: Partial<ImageMetadata>): metadata is ImageMetadata {
  return (
    typeof metadata.fileName === 'string' &&
    metadata.fileName.length > 0 &&
    typeof metadata.fileSize === 'number' &&
    metadata.fileSize >= 0 &&
    typeof metadata.fileType === 'string' &&
    metadata.fileType.length > 0 &&
    typeof metadata.width === 'number' &&
    metadata.width > 0 &&
    typeof metadata.height === 'number' &&
    metadata.height > 0 &&
    metadata.lastModified instanceof Date &&
    !isNaN(metadata.lastModified.getTime())
  );
}

/**
 * ImageDisplayStateオブジェクトの妥当性を検証
 * @param state 検証する状態オブジェクト
 * @returns 妥当性の結果
 */
export function validateImageDisplayState(state: Partial<ImageDisplayState>): state is ImageDisplayState {
  return (
    (state.selectedFile === null || state.selectedFile instanceof File) &&
    (state.imageUrl === null || typeof state.imageUrl === 'string') &&
    (state.metadata === null || validateImageMetadata(state.metadata)) &&
    typeof state.isLoading === 'boolean' &&
    (state.error === null || typeof state.error === 'string')
  );
}

/**
 * ファイル名の妥当性を検証
 * @param fileName ファイル名
 * @returns 妥当性の結果
 */
export function validateFileName(fileName: string): boolean {
  if (typeof fileName !== 'string' || fileName.length === 0) {
    return false;
  }
  
  // 不正な文字をチェック
  const invalidChars = /[<>:"/\\|?*]/;
  return !invalidChars.test(fileName);
}

/**
 * ファイルサイズの妥当性を検証
 * @param fileSize ファイルサイズ（バイト）
 * @param maxSize 最大サイズ（バイト、デフォルト50MB）
 * @returns 妥当性の結果
 */
export function validateFileSize(fileSize: number, maxSize: number = 50 * 1024 * 1024): boolean {
  return typeof fileSize === 'number' && fileSize >= 0 && fileSize <= maxSize;
}

/**
 * 画像の解像度の妥当性を検証
 * @param width 幅
 * @param height 高さ
 * @param maxWidth 最大幅（デフォルト7680px）
 * @param maxHeight 最大高さ（デフォルト4320px）
 * @returns 妥当性の結果
 */
export function validateImageDimensions(
  width: number, 
  height: number, 
  maxWidth: number = 7680, 
  maxHeight: number = 4320
): boolean {
  return (
    typeof width === 'number' &&
    typeof height === 'number' &&
    width > 0 &&
    height > 0 &&
    width <= maxWidth &&
    height <= maxHeight
  );
}

/**
 * ファイル形式の妥当性を検証
 * @param fileType ファイル形式
 * @returns 妥当性の結果とサポート状況
 */
export function validateFileType(fileType: string): { isValid: boolean; isSupported: boolean } {
  const isValid = typeof fileType === 'string' && fileType.length > 0;
  const isSupported = SUPPORTED_IMAGE_FORMATS.includes(fileType as SupportedImageFormat);
  
  return { isValid, isSupported };
}

/**
 * 日付の妥当性を検証
 * @param date 検証する日付
 * @returns 妥当性の結果
 */
export function validateDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * ImageMetadataオブジェクトを作成し、バリデーションを実行
 * @param data 部分的なメタデータ
 * @returns 検証済みのメタデータまたはnull
 */
export function createValidatedImageMetadata(data: Partial<ImageMetadata>): ImageMetadata | null {
  if (!validateImageMetadata(data)) {
    return null;
  }
  return data;
}

/**
 * ImageDisplayStateオブジェクトを作成し、バリデーションを実行
 * @param data 部分的な状態データ
 * @returns 検証済みの状態オブジェクトまたはnull
 */
export function createValidatedImageDisplayState(data: Partial<ImageDisplayState>): ImageDisplayState | null {
  if (!validateImageDisplayState(data)) {
    return null;
  }
  return data;
}