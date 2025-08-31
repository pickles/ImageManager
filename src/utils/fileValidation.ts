import { SUPPORTED_IMAGE_FORMATS, SupportedImageFormat, ImageErrorType } from '../types/image';

/**
 * ファイルバリデーション機能
 * サポートされる画像形式の検証とファイルサイズ・タイプのチェック
 * 要件 1.2, 2.1, 2.2, 2.3, 2.4 に対応
 */

/**
 * 最大ファイルサイズ（50MB）
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * 最大画像解像度
 */
export const MAX_IMAGE_WIDTH = 7680; // 8K width
export const MAX_IMAGE_HEIGHT = 4320; // 8K height

/**
 * ファイルバリデーション結果
 */
export interface FileValidationResult {
  isValid: boolean;
  errorType?: ImageErrorType;
  errorMessage?: string;
}

/**
 * 画像ファイル形式の検証
 * @param file 検証するファイル
 * @returns バリデーション結果
 */
export function validateImageFormat(file: File): FileValidationResult {
  // ファイルタイプの基本チェック
  if (!file.type) {
    return {
      isValid: false,
      errorType: ImageErrorType.UNSUPPORTED_FORMAT,
      errorMessage: 'ファイル形式を特定できません'
    };
  }

  // サポートされている形式かチェック
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type as SupportedImageFormat)) {
    return {
      isValid: false,
      errorType: ImageErrorType.UNSUPPORTED_FORMAT,
      errorMessage: `サポートされていない形式です: ${file.type}。サポート形式: JPEG, PNG, GIF, WebP`
    };
  }

  return { isValid: true };
}

/**
 * ファイルサイズの検証
 * @param file 検証するファイル
 * @param maxSize 最大サイズ（バイト）
 * @returns バリデーション結果
 */
export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): FileValidationResult {
  if (file.size === 0) {
    return {
      isValid: false,
      errorType: ImageErrorType.FILE_NOT_FOUND,
      errorMessage: 'ファイルが空です'
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024) * 100) / 100;
    return {
      isValid: false,
      errorType: ImageErrorType.MEMORY_ERROR,
      errorMessage: `ファイルサイズが大きすぎます: ${fileSizeMB}MB（最大: ${maxSizeMB}MB）`
    };
  }

  return { isValid: true };
}

/**
 * ファイル名の検証
 * @param file 検証するファイル
 * @returns バリデーション結果
 */
export function validateFileName(file: File): FileValidationResult {
  if (!file.name || file.name.trim().length === 0) {
    return {
      isValid: false,
      errorType: ImageErrorType.FILE_NOT_FOUND,
      errorMessage: 'ファイル名が無効です'
    };
  }

  // 不正な文字のチェック
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(file.name)) {
    return {
      isValid: false,
      errorType: ImageErrorType.PROCESSING_ERROR,
      errorMessage: 'ファイル名に使用できない文字が含まれています'
    };
  }

  return { isValid: true };
}

/**
 * 画像ファイルの解像度検証
 * @param file 検証するファイル
 * @returns Promise<FileValidationResult>
 */
export function validateImageDimensions(file: File): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        resolve({
          isValid: false,
          errorType: ImageErrorType.PROCESSING_ERROR,
          errorMessage: '画像の解像度を取得できません'
        });
        return;
      }

      if (img.naturalWidth > MAX_IMAGE_WIDTH || img.naturalHeight > MAX_IMAGE_HEIGHT) {
        resolve({
          isValid: false,
          errorType: ImageErrorType.MEMORY_ERROR,
          errorMessage: `画像解像度が大きすぎます: ${img.naturalWidth}×${img.naturalHeight}（最大: ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT}）`
        });
        return;
      }

      resolve({ isValid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        errorType: ImageErrorType.LOAD_FAILED,
        errorMessage: '画像ファイルが破損しているか、読み込めません'
      });
    };

    img.src = url;
  });
}

/**
 * 包括的なファイルバリデーション
 * @param file 検証するファイル
 * @returns Promise<FileValidationResult>
 */
export async function validateImageFile(file: File): Promise<FileValidationResult> {
  // 基本的なファイル情報の検証
  const nameValidation = validateFileName(file);
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  const formatValidation = validateImageFormat(file);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  // 画像の解像度検証（非同期）
  const dimensionsValidation = await validateImageDimensions(file);
  if (!dimensionsValidation.isValid) {
    return dimensionsValidation;
  }

  return { isValid: true };
}

/**
 * 複数ファイルの一括バリデーション
 * @param files 検証するファイル配列
 * @returns Promise<FileValidationResult[]>
 */
export async function validateMultipleImageFiles(files: File[]): Promise<FileValidationResult[]> {
  const validationPromises = files.map(file => validateImageFile(file));
  return Promise.all(validationPromises);
}

/**
 * サポートされている形式かチェック
 * @param mimeType MIMEタイプ
 * @returns サポート状況
 */
export function isSupportedImageFormat(mimeType: string): mimeType is SupportedImageFormat {
  return SUPPORTED_IMAGE_FORMATS.includes(mimeType as SupportedImageFormat);
}

/**
 * ファイル拡張子からMIMEタイプを推測
 * @param fileName ファイル名
 * @returns 推測されたMIMEタイプ
 */
export function getMimeTypeFromExtension(fileName: string): string | null {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return null;
  }
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 * @param bytes バイト数
 * @returns フォーマットされたサイズ文字列
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}