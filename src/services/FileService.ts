import { IFileService } from '../types/services';
import { SUPPORTED_IMAGE_FORMATS, SupportedImageFormat, ImageErrorType } from '../types/image';

/**
 * ファイル操作とバリデーションを担当するサービス
 * 要件 1.1, 1.2, 1.3 に対応
 */
export class FileService implements IFileService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * 画像ファイルのバリデーション
   * @param file 検証するファイル
   * @returns バリデーション結果
   */
  async validateImageFile(file: File): Promise<boolean> {
    try {
      // ファイルの存在チェック
      if (!file) {
        throw new Error('ファイルが選択されていません');
      }

      // ファイルサイズチェック
      if (file.size > FileService.MAX_FILE_SIZE) {
        throw new Error(`ファイルサイズが大きすぎます。最大${FileService.MAX_FILE_SIZE / (1024 * 1024)}MBまでです`);
      }

      // ファイル形式チェック
      if (!this.isSupportedFormat(file.type)) {
        throw new Error(`サポートされていないファイル形式です: ${file.type}`);
      }

      // ファイルが実際に画像かどうかをチェック
      const isValidImage = await this.verifyImageFile(file);
      if (!isValidImage) {
        throw new Error('有効な画像ファイルではありません');
      }

      return true;
    } catch (error) {
      console.error('ファイルバリデーションエラー:', error);
      return false;
    }
  }

  /**
   * 画像URLの作成
   * @param file 画像ファイル
   * @returns 作成されたURL
   */
  createImageUrl(file: File): string {
    try {
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('画像URL作成エラー:', error);
      throw new Error('画像URLの作成に失敗しました');
    }
  }

  /**
   * 画像URLの解放
   * @param url 解放するURL
   */
  revokeImageUrl(url: string): void {
    try {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('画像URL解放エラー:', error);
    }
  }

  /**
   * サポートされている形式かチェック
   * @param fileType ファイルタイプ
   * @returns サポート状況
   */
  isSupportedFormat(fileType: string): fileType is SupportedImageFormat {
    return SUPPORTED_IMAGE_FORMATS.includes(fileType as SupportedImageFormat);
  }

  /**
   * ファイルが実際に有効な画像かどうかを検証
   * @param file 検証するファイル
   * @returns 有効な画像の場合true
   */
  private async verifyImageFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };

      img.src = url;
    });
  }

  /**
   * エラータイプの判定
   * @param error エラーオブジェクト
   * @param file ファイル
   * @returns エラータイプ
   */
  static getErrorType(error: Error, file?: File): ImageErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('サポートされていない') || message.includes('形式')) {
      return ImageErrorType.UNSUPPORTED_FORMAT;
    }
    
    if (message.includes('存在') || message.includes('見つかりません')) {
      return ImageErrorType.FILE_NOT_FOUND;
    }
    
    if (message.includes('サイズ') || message.includes('メモリ')) {
      return ImageErrorType.MEMORY_ERROR;
    }
    
    if (message.includes('読み込み') || message.includes('ロード')) {
      return ImageErrorType.LOAD_FAILED;
    }
    
    return ImageErrorType.PROCESSING_ERROR;
  }
}