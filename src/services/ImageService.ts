import { IImageService } from '../types/services';
import { DisplaySize } from '../types/image';

/**
 * 画像スケーリングとサイズ計算を担当するサービス
 * 要件 3.1, 3.2, 3.3 に対応
 */
export class ImageService implements IImageService {
  private static readonly MAX_RESOLUTION_WIDTH = 7680; // 8K width
  private static readonly MAX_RESOLUTION_HEIGHT = 4320; // 8K height

  /**
   * 表示サイズの計算
   * アスペクト比を維持しながら、指定された最大サイズ内に収まるようにスケーリング
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
  ): DisplaySize {
    // 入力値の検証
    if (originalWidth <= 0 || originalHeight <= 0) {
      throw new Error('画像の幅と高さは正の値である必要があります');
    }

    if (maxWidth <= 0 || maxHeight <= 0) {
      throw new Error('最大幅と最大高さは正の値である必要があります');
    }

    // 元の画像が最大サイズ内に収まる場合はそのまま返す
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return {
        width: originalWidth,
        height: originalHeight,
      };
    }

    // アスペクト比を計算
    const aspectRatio = this.calculateAspectRatio(originalWidth, originalHeight);

    // 幅と高さのスケール比を計算
    const widthScale = maxWidth / originalWidth;
    const heightScale = maxHeight / originalHeight;

    // より小さいスケール比を使用してアスペクト比を維持
    const scale = Math.min(widthScale, heightScale);

    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
    };
  }

  /**
   * アスペクト比の計算
   * @param width 幅
   * @param height 高さ
   * @returns アスペクト比
   */
  calculateAspectRatio(width: number, height: number): number {
    if (height === 0) {
      throw new Error('高さは0にできません');
    }
    return width / height;
  }

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
  ): boolean {
    return width > maxWidth || height > maxHeight;
  }

  /**
   * 画像が最大解像度を超えているかチェック
   * @param width 幅
   * @param height 高さ
   * @returns 最大解像度を超えている場合true
   */
  isResolutionTooHigh(width: number, height: number): boolean {
    return (
      width > ImageService.MAX_RESOLUTION_WIDTH ||
      height > ImageService.MAX_RESOLUTION_HEIGHT
    );
  }

  /**
   * スケール比の計算
   * @param originalWidth 元の幅
   * @param originalHeight 元の高さ
   * @param targetWidth 目標幅
   * @param targetHeight 目標高さ
   * @returns スケール比
   */
  calculateScaleRatio(
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
    targetHeight: number
  ): number {
    const widthScale = targetWidth / originalWidth;
    const heightScale = targetHeight / originalHeight;
    return Math.min(widthScale, heightScale);
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
   * 画像が指定されたアスペクト比に近いかチェック
   * @param width 幅
   * @param height 高さ
   * @param targetAspectRatio 目標アスペクト比
   * @param tolerance 許容誤差（デフォルト: 0.1）
   * @returns 近い場合true
   */
  isAspectRatioClose(
    width: number,
    height: number,
    targetAspectRatio: number,
    tolerance: number = 0.1
  ): boolean {
    const currentAspectRatio = this.calculateAspectRatio(width, height);
    return Math.abs(currentAspectRatio - targetAspectRatio) <= tolerance;
  }

  /**
   * 一般的なアスペクト比の判定
   * @param width 幅
   * @param height 高さ
   * @returns アスペクト比の名前
   */
  getCommonAspectRatio(width: number, height: number): string {
    const aspectRatio = this.calculateAspectRatio(width, height);
    
    // 一般的なアスペクト比との比較（許容誤差0.05）
    const commonRatios = [
      { ratio: 1, name: '1:1 (正方形)' },
      { ratio: 4/3, name: '4:3' },
      { ratio: 3/2, name: '3:2' },
      { ratio: 16/9, name: '16:9' },
      { ratio: 21/9, name: '21:9 (ウルトラワイド)' },
    ];

    for (const common of commonRatios) {
      if (Math.abs(aspectRatio - common.ratio) <= 0.05) {
        return common.name;
      }
    }

    return `${aspectRatio.toFixed(2)}:1 (カスタム)`;
  }

  /**
   * 最適な表示サイズを複数の制約条件で計算
   * @param originalWidth 元の幅
   * @param originalHeight 元の高さ
   * @param constraints 制約条件
   * @returns 最適な表示サイズ
   */
  calculateOptimalDisplaySize(
    originalWidth: number,
    originalHeight: number,
    constraints: {
      maxWidth: number;
      maxHeight: number;
      minWidth?: number;
      minHeight?: number;
      preferredAspectRatio?: number;
    }
  ): DisplaySize {
    let displaySize = this.calculateDisplaySize(
      originalWidth,
      originalHeight,
      constraints.maxWidth,
      constraints.maxHeight
    );

    // 最小サイズの制約をチェック
    if (constraints.minWidth && displaySize.width < constraints.minWidth) {
      const scale = constraints.minWidth / displaySize.width;
      displaySize = {
        width: constraints.minWidth,
        height: Math.round(displaySize.height * scale),
      };
    }

    if (constraints.minHeight && displaySize.height < constraints.minHeight) {
      const scale = constraints.minHeight / displaySize.height;
      displaySize = {
        width: Math.round(displaySize.width * scale),
        height: constraints.minHeight,
      };
    }

    return displaySize;
  }
}