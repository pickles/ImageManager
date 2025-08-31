import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetadataService } from '../MetadataService';
import { ImageMetadata } from '../../types/image';

// URL.createObjectURL と URL.revokeObjectURL のモック
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

// Image のモック
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth: number = 800;
  naturalHeight: number = 600;
  src: string = '';

  constructor() {
    // srcが設定されたときの動作をシミュレート
    Object.defineProperty(this, 'src', {
      set: (value: string) => {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      },
      get: () => this.src,
    });
  }
}

Object.defineProperty(global, 'Image', {
  value: MockImage,
  writable: true,
});

describe('MetadataService', () => {
  let metadataService: MetadataService;

  beforeEach(() => {
    metadataService = new MetadataService();
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('extractMetadata', () => {
    it('画像ファイルからメタデータを正しく抽出する', async () => {
      const file = new File(['test'], 'test.jpg', { 
        type: 'image/jpeg',
        lastModified: 1640995200000 // 2022-01-01 00:00:00 UTC
      });

      const metadata = await metadataService.extractMetadata(file);

      expect(metadata).toEqual({
        fileName: 'test.jpg',
        fileSize: 4, // 'test' の文字数
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date(1640995200000),
      });
    });

    it('画像読み込みエラーを適切に処理する', async () => {
      // エラーを発生させるためのモック設定
      class MockImageError {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        naturalWidth: number = 800;
        naturalHeight: number = 600;
        src: string = '';

        constructor() {
          // srcが設定されたときにエラーを発生させる
          Object.defineProperty(this, 'src', {
            set: (value: string) => {
              setTimeout(() => {
                if (this.onerror) {
                  this.onerror();
                }
              }, 0);
            },
            get: () => this.src,
          });
        }
      }

      const originalImage = global.Image;
      Object.defineProperty(global, 'Image', {
        value: MockImageError,
        writable: true,
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(metadataService.extractMetadata(file)).rejects.toThrow('画像メタデータの抽出に失敗しました');

      // 元のモックに戻す
      Object.defineProperty(global, 'Image', {
        value: originalImage,
        writable: true,
      });
    });
  });

  describe('formatFileSize', () => {
    it('バイト数を正しくフォーマットする', () => {
      expect(metadataService.formatFileSize(0)).toBe('0 B');
      expect(metadataService.formatFileSize(512)).toBe('512 B');
      expect(metadataService.formatFileSize(1024)).toBe('1 KB');
      expect(metadataService.formatFileSize(1536)).toBe('1.5 KB');
      expect(metadataService.formatFileSize(1048576)).toBe('1 MB');
      expect(metadataService.formatFileSize(1073741824)).toBe('1 GB');
      expect(metadataService.formatFileSize(1099511627776)).toBe('1 TB');
    });

    it('小数点以下を適切に処理する', () => {
      expect(metadataService.formatFileSize(1536)).toBe('1.5 KB');
      expect(metadataService.formatFileSize(2560)).toBe('2.5 KB');
      expect(metadataService.formatFileSize(1572864)).toBe('1.5 MB');
    });
  });

  describe('getImageDimensions', () => {
    it('画像の解像度を正しく取得する', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const dimensions = await metadataService.getImageDimensions(file);

      expect(dimensions).toEqual({
        width: 800,
        height: 600,
      });
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('画像読み込みエラーを処理する', async () => {
      // エラーを発生させるためのモック設定
      class MockImageError {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        naturalWidth: number = 800;
        naturalHeight: number = 600;
        src: string = '';

        constructor() {
          // srcが設定されたときにエラーを発生させる
          Object.defineProperty(this, 'src', {
            set: (value: string) => {
              setTimeout(() => {
                if (this.onerror) {
                  this.onerror();
                }
              }, 0);
            },
            get: () => this.src,
          });
        }
      }

      const originalImage = global.Image;
      Object.defineProperty(global, 'Image', {
        value: MockImageError,
        writable: true,
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(metadataService.getImageDimensions(file)).rejects.toThrow('画像の読み込みに失敗しました');

      // 元のモックに戻す
      Object.defineProperty(global, 'Image', {
        value: originalImage,
        writable: true,
      });
    });
  });

  describe('getBasicFileInfo', () => {
    it('ファイルの基本情報を正しく取得する', () => {
      const file = new File(['test'], 'test.jpg', { 
        type: 'image/jpeg',
        lastModified: 1640995200000
      });

      const basicInfo = metadataService.getBasicFileInfo(file);

      expect(basicInfo).toEqual({
        fileName: 'test.jpg',
        fileSize: 4,
        fileType: 'image/jpeg',
        lastModified: new Date(1640995200000),
      });
    });
  });

  describe('getFileExtension', () => {
    it('ファイル拡張子を正しく取得する', () => {
      expect(metadataService.getFileExtension('test.jpg')).toBe('jpg');
      expect(metadataService.getFileExtension('image.png')).toBe('png');
      expect(metadataService.getFileExtension('photo.JPEG')).toBe('jpeg');
      expect(metadataService.getFileExtension('file.with.dots.gif')).toBe('gif');
    });

    it('拡張子がない場合を処理する', () => {
      expect(metadataService.getFileExtension('filename')).toBe('');
      expect(metadataService.getFileExtension('')).toBe('');
    });
  });

  describe('calculateAspectRatio', () => {
    it('アスペクト比を正しく計算する', () => {
      expect(metadataService.calculateAspectRatio(800, 600)).toBeCloseTo(1.333, 3);
      expect(metadataService.calculateAspectRatio(1920, 1080)).toBeCloseTo(1.778, 3);
      expect(metadataService.calculateAspectRatio(1000, 1000)).toBe(1);
    });

    it('高さが0の場合を処理する', () => {
      expect(metadataService.calculateAspectRatio(800, 0)).toBe(0);
    });
  });

  describe('getImageOrientation', () => {
    it('画像の向きを正しく判定する', () => {
      expect(metadataService.getImageOrientation(800, 600)).toBe('landscape');
      expect(metadataService.getImageOrientation(600, 800)).toBe('portrait');
      expect(metadataService.getImageOrientation(500, 500)).toBe('square');
    });
  });

  describe('validateMetadata', () => {
    it('有効なメタデータを正しく検証する', () => {
      const validMetadata: ImageMetadata = {
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date(),
      };

      expect(metadataService.validateMetadata(validMetadata)).toBe(true);
    });

    it('無効なメタデータを正しく検証する', () => {
      const invalidMetadata1: ImageMetadata = {
        fileName: '',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date(),
      };

      const invalidMetadata2: ImageMetadata = {
        fileName: 'test.jpg',
        fileSize: -1,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date(),
      };

      const invalidMetadata3: ImageMetadata = {
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'text/plain',
        width: 800,
        height: 600,
        lastModified: new Date(),
      };

      expect(metadataService.validateMetadata(invalidMetadata1)).toBe(false);
      expect(metadataService.validateMetadata(invalidMetadata2)).toBe(false);
      expect(metadataService.validateMetadata(invalidMetadata3)).toBe(false);
    });

    it('無効な日付を検証する', () => {
      const invalidMetadata: ImageMetadata = {
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date('invalid'),
      };

      expect(metadataService.validateMetadata(invalidMetadata)).toBe(false);
    });
  });
});