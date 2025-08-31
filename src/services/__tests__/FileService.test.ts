import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileService } from '../FileService';
import { ImageErrorType } from '../../types/image';

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

describe('FileService', () => {
  let fileService: FileService;

  beforeEach(() => {
    fileService = new FileService();
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateImageFile', () => {
    it('有効なJPEGファイルを受け入れる', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await fileService.validateImageFile(file);
      expect(result).toBe(true);
    });

    it('有効なPNGファイルを受け入れる', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const result = await fileService.validateImageFile(file);
      expect(result).toBe(true);
    });

    it('有効なGIFファイルを受け入れる', async () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      const result = await fileService.validateImageFile(file);
      expect(result).toBe(true);
    });

    it('有効なWebPファイルを受け入れる', async () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      const result = await fileService.validateImageFile(file);
      expect(result).toBe(true);
    });

    it('サポートされていない形式を拒否する', async () => {
      const file = new File(['test'], 'test.bmp', { type: 'image/bmp' });
      const result = await fileService.validateImageFile(file);
      expect(result).toBe(false);
    });

    it('ファイルが存在しない場合を処理する', async () => {
      const result = await fileService.validateImageFile(null as any);
      expect(result).toBe(false);
    });

    it('大きすぎるファイルを拒否する', async () => {
      const largeContent = new Array(51 * 1024 * 1024).fill('a').join(''); // 51MB
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = await fileService.validateImageFile(file);
      expect(result).toBe(false);
    });
  });

  describe('createImageUrl', () => {
    it('ファイルからURLを作成する', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const url = fileService.createImageUrl(file);
      
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(url).toBe('blob:mock-url');
    });

    it('URL作成エラーを処理する', () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('URL creation failed');
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      expect(() => fileService.createImageUrl(file)).toThrow('画像URLの作成に失敗しました');
    });
  });

  describe('revokeImageUrl', () => {
    it('有効なblobURLを解放する', () => {
      const url = 'blob:mock-url';
      fileService.revokeImageUrl(url);
      
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(url);
    });

    it('blob以外のURLは解放しない', () => {
      const url = 'http://example.com/image.jpg';
      fileService.revokeImageUrl(url);
      
      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });

    it('空のURLを安全に処理する', () => {
      fileService.revokeImageUrl('');
      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });

    it('URL解放エラーを安全に処理する', () => {
      mockRevokeObjectURL.mockImplementation(() => {
        throw new Error('Revoke failed');
      });

      expect(() => fileService.revokeImageUrl('blob:mock-url')).not.toThrow();
    });
  });

  describe('isSupportedFormat', () => {
    it('サポートされている形式を正しく識別する', () => {
      expect(fileService.isSupportedFormat('image/jpeg')).toBe(true);
      expect(fileService.isSupportedFormat('image/jpg')).toBe(true);
      expect(fileService.isSupportedFormat('image/png')).toBe(true);
      expect(fileService.isSupportedFormat('image/gif')).toBe(true);
      expect(fileService.isSupportedFormat('image/webp')).toBe(true);
    });

    it('サポートされていない形式を正しく識別する', () => {
      expect(fileService.isSupportedFormat('image/bmp')).toBe(false);
      expect(fileService.isSupportedFormat('image/tiff')).toBe(false);
      expect(fileService.isSupportedFormat('text/plain')).toBe(false);
      expect(fileService.isSupportedFormat('application/pdf')).toBe(false);
    });
  });

  describe('getErrorType', () => {
    it('サポートされていない形式エラーを識別する', () => {
      const error = new Error('サポートされていないファイル形式です');
      const errorType = FileService.getErrorType(error);
      expect(errorType).toBe(ImageErrorType.UNSUPPORTED_FORMAT);
    });

    it('ファイル未発見エラーを識別する', () => {
      const error = new Error('ファイルが存在しません');
      const errorType = FileService.getErrorType(error);
      expect(errorType).toBe(ImageErrorType.FILE_NOT_FOUND);
    });

    it('メモリエラーを識別する', () => {
      const error = new Error('ファイルサイズが大きすぎます');
      const errorType = FileService.getErrorType(error);
      expect(errorType).toBe(ImageErrorType.MEMORY_ERROR);
    });

    it('読み込みエラーを識別する', () => {
      const error = new Error('画像の読み込みに失敗しました');
      const errorType = FileService.getErrorType(error);
      expect(errorType).toBe(ImageErrorType.LOAD_FAILED);
    });

    it('一般的な処理エラーを識別する', () => {
      const error = new Error('予期しないエラーが発生しました');
      const errorType = FileService.getErrorType(error);
      expect(errorType).toBe(ImageErrorType.PROCESSING_ERROR);
    });
  });
});