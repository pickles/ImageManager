import { IMetadataService } from '../types/services';
import { ImageMetadata } from '../types/image';

/**
 * 画像メタデータの抽出を担当するサービス
 * 要件 4.1, 4.2, 4.3, 4.4 に対応
 */
export class MetadataService implements IMetadataService {
  /**
   * 画像メタデータの抽出
   * @param file 画像ファイル
   * @returns 抽出されたメタデータ
   */
  async extractMetadata(file: File): Promise<ImageMetadata> {
    try {
      const dimensions = await this.getImageDimensions(file);
      
      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        width: dimensions.width,
        height: dimensions.height,
        lastModified: new Date(file.lastModified),
      };
    } catch (error) {
      console.error('メタデータ抽出エラー:', error);
      throw new Error('画像メタデータの抽出に失敗しました');
    }
  }

  /**
   * ファイルサイズの人間が読みやすい形式への変換
   * @param bytes バイト数
   * @returns フォーマットされたサイズ文字列
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const decimals = 2;
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));
    
    return `${size} ${units[i]}`;
  }

  /**
   * 画像の解像度情報の取得
   * @param file 画像ファイル
   * @returns 解像度情報
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('画像の読み込みに失敗しました'));
      };

      img.src = url;
    });
  }

  /**
   * 画像の基本情報を取得（メタデータの一部）
   * @param file 画像ファイル
   * @returns 基本情報
   */
  getBasicFileInfo(file: File): Pick<ImageMetadata, 'fileName' | 'fileSize' | 'fileType' | 'lastModified'> {
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified),
    };
  }

  /**
   * ファイル拡張子の取得
   * @param fileName ファイル名
   * @returns ファイル拡張子
   */
  getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
  }

  /**
   * 画像のアスペクト比を計算
   * @param width 幅
   * @param height 高さ
   * @returns アスペクト比（幅/高さ）
   */
  calculateAspectRatio(width: number, height: number): number {
    if (height === 0) return 0;
    return width / height;
  }

  /**
   * 画像の向きを判定
   * @param width 幅
   * @param height 高さ
   * @returns 向き（'landscape' | 'portrait' | 'square'）
   */
  getImageOrientation(width: number, height: number): 'landscape' | 'portrait' | 'square' {
    if (width > height) return 'landscape';
    if (width < height) return 'portrait';
    return 'square';
  }

  /**
   * メタデータの妥当性を検証
   * @param metadata 検証するメタデータ
   * @returns 妥当性
   */
  validateMetadata(metadata: ImageMetadata): boolean {
    return (
      typeof metadata.fileName === 'string' &&
      metadata.fileName.length > 0 &&
      typeof metadata.fileSize === 'number' &&
      metadata.fileSize >= 0 &&
      typeof metadata.fileType === 'string' &&
      metadata.fileType.startsWith('image/') &&
      typeof metadata.width === 'number' &&
      metadata.width > 0 &&
      typeof metadata.height === 'number' &&
      metadata.height > 0 &&
      metadata.lastModified instanceof Date &&
      !isNaN(metadata.lastModified.getTime())
    );
  }
}