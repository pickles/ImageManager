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

      // APIファイルの場合は、ファイル名の拡張子でも検証
      if ((file as any)._isApiFile) {
        const fileName = file.name.toLowerCase();
        const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
          throw new Error(`サポートされていないファイル拡張子です: ${file.name}`);
        }
        
        // APIファイルの場合は拡張子チェックで十分とする
        return true;
      }

      // 通常のファイルの場合は画像として読み込めるかチェック
      const isValidImage = await this.verifyImageFile(file);
      if (!isValidImage) {
        throw new Error('有効な画像ファイルではありません');
      }

      return true;
    } catch (error) {
      console.error('ファイルバリデーションエラー:', error);
      throw error; // エラーを再スローして呼び出し元で処理
    }
  }

  /**
   * 画像URLの作成
   * @param file 画像ファイル
   * @returns 作成されたURL
   */
  createImageUrl(file: File): string {
    try {
      // APIファイルの場合は直接URLを返す
      if ((file as any)._isApiFile && (file as any)._apiUrl) {
        console.log('APIファイルのURL使用:', (file as any)._apiUrl);
        return (file as any)._apiUrl;
      }
      
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
      // APIファイルのURLは解放しない
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
      let url: string;

      // APIファイルの場合は直接URLを使用
      if ((file as any)._isApiFile && (file as any)._apiUrl) {
        url = (file as any)._apiUrl;
      } else {
        url = URL.createObjectURL(file);
      }

      img.onload = () => {
        // APIファイルでない場合のみURLを解放
        if (!(file as any)._isApiFile) {
          URL.revokeObjectURL(url);
        }
        resolve(true);
      };

      img.onerror = () => {
        // APIファイルでない場合のみURLを解放
        if (!(file as any)._isApiFile) {
          URL.revokeObjectURL(url);
        }
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