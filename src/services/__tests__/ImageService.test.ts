import { describe, it, expect, beforeEach } from 'vitest';
import { ImageService } from '../ImageService';

describe('ImageService', () => {
  let imageService: ImageService;

  beforeEach(() => {
    imageService = new ImageService();
  });

  describe('calculateDisplaySize', () => {
    it('元の画像が最大サイズ内に収まる場合はそのまま返す', () => {
      const result = imageService.calculateDisplaySize(400, 300, 800, 600);
      expect(result).toEqual({ width: 400, height: 300 });
    });

    it('幅が大きすぎる場合は幅に合わせてスケールダウンする', () => {
      const result = imageService.calculateDisplaySize(1600, 900, 800, 600);
      expect(result).toEqual({ width: 800, height: 450 });
    });

    it('高さが大きすぎる場合は高さに合わせてスケールダウンする', () => {
      const result = imageService.calculateDisplaySize(800, 1200, 800, 600);
      expect(result).toEqual({ width: 400, height: 600 });
    });

    it('幅と高さの両方が大きすぎる場合は適切にスケールダウンする', () => {
      const result = imageService.calculateDisplaySize(1600, 1200, 800, 600);
      expect(result).toEqual({ width: 800, height: 600 });
    });

    it('正方形の画像を正しく処理する', () => {
      const result = imageService.calculateDisplaySize(1000, 1000, 500, 600);
      expect(result).toEqual({ width: 500, height: 500 });
    });

    it('縦長の画像を正しく処理する', () => {
      const result = imageService.calculateDisplaySize(600, 1200, 800, 600);
      expect(result).toEqual({ width: 300, height: 600 });
    });

    it('無効な元のサイズでエラーを投げる', () => {
      expect(() => imageService.calculateDisplaySize(0, 300, 800, 600)).toThrow('画像の幅と高さは正の値である必要があります');
      expect(() => imageService.calculateDisplaySize(400, -1, 800, 600)).toThrow('画像の幅と高さは正の値である必要があります');
    });

    it('無効な最大サイズでエラーを投げる', () => {
      expect(() => imageService.calculateDisplaySize(400, 300, 0, 600)).toThrow('最大幅と最大高さは正の値である必要があります');
      expect(() => imageService.calculateDisplaySize(400, 300, 800, -1)).toThrow('最大幅と最大高さは正の値である必要があります');
    });
  });

  describe('calculateAspectRatio', () => {
    it('アスペクト比を正しく計算する', () => {
      expect(imageService.calculateAspectRatio(800, 600)).toBeCloseTo(1.333, 3);
      expect(imageService.calculateAspectRatio(1920, 1080)).toBeCloseTo(1.778, 3);
      expect(imageService.calculateAspectRatio(1000, 1000)).toBe(1);
    });

    it('高さが0の場合はエラーを投げる', () => {
      expect(() => imageService.calculateAspectRatio(800, 0)).toThrow('高さは0にできません');
    });
  });

  describe('isImageTooLarge', () => {
    it('画像が大きすぎる場合を正しく判定する', () => {
      expect(imageService.isImageTooLarge(1000, 600, 800, 600)).toBe(true);
      expect(imageService.isImageTooLarge(800, 800, 800, 600)).toBe(true);
      expect(imageService.isImageTooLarge(800, 600, 800, 600)).toBe(false);
      expect(imageService.isImageTooLarge(400, 300, 800, 600)).toBe(false);
    });
  });

  describe('isResolutionTooHigh', () => {
    it('解像度が高すぎる場合を正しく判定する', () => {
      expect(imageService.isResolutionTooHigh(8000, 4000)).toBe(true);
      expect(imageService.isResolutionTooHigh(7000, 5000)).toBe(true);
      expect(imageService.isResolutionTooHigh(7680, 4320)).toBe(false);
      expect(imageService.isResolutionTooHigh(1920, 1080)).toBe(false);
    });
  });

  describe('calculateScaleRatio', () => {
    it('スケール比を正しく計算する', () => {
      expect(imageService.calculateScaleRatio(1600, 1200, 800, 600)).toBe(0.5);
      expect(imageService.calculateScaleRatio(800, 600, 400, 300)).toBe(0.5);
      expect(imageService.calculateScaleRatio(400, 300, 800, 600)).toBe(2);
    });

    it('異なるアスペクト比で適切なスケール比を計算する', () => {
      // 16:9 → 4:3 の場合、幅に制限される（0.5）
      expect(imageService.calculateScaleRatio(1600, 900, 800, 600)).toBe(0.5);
      // 4:3 → 16:9 の場合、高さに制限される
      expect(imageService.calculateScaleRatio(800, 600, 1600, 900)).toBe(1.5);
    });
  });

  describe('getImageOrientation', () => {
    it('画像の向きを正しく判定する', () => {
      expect(imageService.getImageOrientation(800, 600)).toBe('landscape');
      expect(imageService.getImageOrientation(600, 800)).toBe('portrait');
      expect(imageService.getImageOrientation(500, 500)).toBe('square');
    });
  });

  describe('isAspectRatioClose', () => {
    it('アスペクト比の近似を正しく判定する', () => {
      // 16:9 ≈ 1.778
      expect(imageService.isAspectRatioClose(1920, 1080, 16/9, 0.1)).toBe(true);
      expect(imageService.isAspectRatioClose(1600, 900, 16/9, 0.1)).toBe(true);
      
      // 4:3 ≈ 1.333
      expect(imageService.isAspectRatioClose(800, 600, 4/3, 0.1)).toBe(true);
      expect(imageService.isAspectRatioClose(1920, 1080, 4/3, 0.1)).toBe(false);
    });

    it('カスタム許容誤差で正しく判定する', () => {
      expect(imageService.isAspectRatioClose(800, 600, 4/3, 0.01)).toBe(true);
      expect(imageService.isAspectRatioClose(800, 590, 4/3, 0.01)).toBe(false);
      expect(imageService.isAspectRatioClose(800, 590, 4/3, 0.1)).toBe(true);
    });
  });

  describe('getCommonAspectRatio', () => {
    it('一般的なアスペクト比を正しく識別する', () => {
      expect(imageService.getCommonAspectRatio(1000, 1000)).toBe('1:1 (正方形)');
      expect(imageService.getCommonAspectRatio(800, 600)).toBe('4:3');
      expect(imageService.getCommonAspectRatio(1500, 1000)).toBe('3:2');
      expect(imageService.getCommonAspectRatio(1920, 1080)).toBe('16:9');
      expect(imageService.getCommonAspectRatio(2560, 1080)).toBe('21:9 (ウルトラワイド)');
    });

    it('カスタムアスペクト比を正しく処理する', () => {
      const result = imageService.getCommonAspectRatio(1000, 700);
      expect(result).toMatch(/1\.43:1 \(カスタム\)/);
    });
  });

  describe('calculateOptimalDisplaySize', () => {
    it('基本的な制約条件で最適なサイズを計算する', () => {
      const result = imageService.calculateOptimalDisplaySize(1600, 1200, {
        maxWidth: 800,
        maxHeight: 600,
      });
      expect(result).toEqual({ width: 800, height: 600 });
    });

    it('最小幅の制約を適用する', () => {
      const result = imageService.calculateOptimalDisplaySize(400, 300, {
        maxWidth: 800,
        maxHeight: 600,
        minWidth: 500,
      });
      expect(result).toEqual({ width: 500, height: 375 });
    });

    it('最小高さの制約を適用する', () => {
      const result = imageService.calculateOptimalDisplaySize(400, 300, {
        maxWidth: 800,
        maxHeight: 600,
        minHeight: 400,
      });
      expect(result).toEqual({ width: 533, height: 400 });
    });

    it('複数の制約条件を同時に処理する', () => {
      const result = imageService.calculateOptimalDisplaySize(1600, 1200, {
        maxWidth: 800,
        maxHeight: 600,
        minWidth: 400,
        minHeight: 300,
      });
      expect(result).toEqual({ width: 800, height: 600 });
    });
  });
});