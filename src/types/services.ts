import { ImageMetadata, DisplaySize, SupportedImageFormat } from './image';

/**
 * FileServiceのインターフェース
 * 要件 1.1, 1.2, 1.3 に対応
 */
export interface IFileService {
  /**
   * 画像ファイルのバリデーション
   * @param file 検証するファイル
   * @returns バリデーション結果
   */
  validateImageFile(file: File): Promise<boolean>;

  /**
   * 画像URLの作成
   * @param file 画像ファイル
   * @returns 作成されたURL
   */
  createImageUrl(file: File): string;

  /**
   * 画像URLの解放
   * @param url 解放するURL
   */
  revokeImageUrl(url: string): void;

  /**
   * サポートされている形式かチェック
   * @param fileType ファイルタイプ
   * @returns サポート状況
   */
  isSupportedFormat(fileType: string): fileType is SupportedImageFormat;
}

/**
 * ImageServiceのインターフェース
 * 要件 3.1, 3.2, 3.3 に対応
 */
export interface IImageService {
  /**
   * 表示サイズの計算
   * @param originalWidth 元の幅
   * @param originalHeight 元の高さ
   * @param maxWidth 最大幅
   * @param maxHeight 最大高さ
   * @returns 計算された表示サイズ
   */
  calculateDisplaySize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): DisplaySize;

  /**
   * アスペクト比の計算
   * @param width 幅
   * @param height 高さ
   * @returns アスペクト比
   */
  calculateAspectRatio(width: number, height: number): number;

  /**
   * 画像が大きすぎるかチェック
   * @param width 幅
   * @param height 高さ
   * @param maxWidth 最大幅
   * @param maxHeight 最大高さ
   * @returns 大きすぎる場合true
   */
  isImageTooLarge(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
  ): boolean;
}

/**
 * MetadataServiceのインターフェース
 * 要件 4.1, 4.2, 4.3, 4.4 に対応
 */
export interface IMetadataService {
  /**
   * 画像メタデータの抽出
   * @param file 画像ファイル
   * @returns 抽出されたメタデータ
   */
  extractMetadata(file: File): Promise<ImageMetadata>;

  /**
   * ファイルサイズの人間が読みやすい形式への変換
   * @param bytes バイト数
   * @returns フォーマットされたサイズ文字列
   */
  formatFileSize(bytes: number): string;

  /**
   * 画像の解像度情報の取得
   * @param file 画像ファイル
   * @returns 解像度情報
   */
  getImageDimensions(file: File): Promise<{ width: number; height: number }>;
}