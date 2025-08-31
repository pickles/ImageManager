/**
 * DirectoryService のテスト
 * 要件1.3, 2.1, 2.2, 2.3に対応
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DirectoryService, DirectoryServiceError, IDirectoryService } from '../DirectoryService';
import { DirectoryBrowserErrorType, ImageFileInfo } from '../../components/DirectoryBrowser/types';

// File System Access API のモック
const mockDirectoryHandle = {
  name: 'test-directory',
  kind: 'directory' as const,
  entries: vi.fn(),
  getFileHandle: vi.fn(),
  getDirectoryHandle: vi.fn(),
  removeEntry: vi.fn(),
  resolve: vi.fn(),
  isSameEntry: vi.fn()
};

const mockFileHandle = {
  name: 'test-image.jpg',
  kind: 'file' as const,
  getFile: vi.fn(),
  createWritable: vi.fn(),
  isSameEntry: vi.fn()
};

const mockFile = new File(['test content'], 'test-image.jpg', {
  type: 'image/jpeg',
  lastModified: Date.now()
});

// グローバルなshowDirectoryPickerのモック
const mockShowDirectoryPicker = vi.fn();

describe('DirectoryService', () => {
  let directoryService: IDirectoryService;

  beforeEach(() => {
    directoryService = new DirectoryService();
    
    // window.showDirectoryPickerをモック
    Object.defineProperty(window, 'showDirectoryPicker', {
      value: mockShowDirectoryPicker,
      writable: true,
      configurable: true
    });

    // モックをリセット
    vi.clearAllMocks();
  });

  afterEach(() => {
    // showDirectoryPickerを削除
    delete (window as any).showDirectoryPicker;
  });

  describe('isSupported', () => {
    it('File System Access APIがサポートされている場合はtrueを返す', () => {
      // showDirectoryPickerが存在する場合
      expect(directoryService.isSupported()).toBe(true);
    });

    it('File System Access APIがサポートされていない場合はfalseを返す', () => {
      // showDirectoryPickerを削除
      delete (window as any).showDirectoryPicker;
      
      expect(directoryService.isSupported()).toBe(false);
    });
  });

  describe('selectDirectory', () => {
    it('ディレクトリが正常に選択された場合、ディレクトリ名を返す', async () => {
      // モックの設定
      mockShowDirectoryPicker.mockResolvedValue(mockDirectoryHandle);

      const result = await directoryService.selectDirectory();

      expect(result).toBe('test-directory');
      expect(mockShowDirectoryPicker).toHaveBeenCalledOnce();
    });

    it('ユーザーがキャンセルした場合、nullを返す', async () => {
      // AbortErrorをスロー
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      mockShowDirectoryPicker.mockRejectedValue(abortError);

      const result = await directoryService.selectDirectory();

      expect(result).toBeNull();
    });

    it('権限が拒否された場合、適切なエラーをスローする', async () => {
      // NotAllowedErrorをスロー
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      mockShowDirectoryPicker.mockRejectedValue(permissionError);

      await expect(directoryService.selectDirectory()).rejects.toThrow(DirectoryServiceError);
      
      try {
        await directoryService.selectDirectory();
      } catch (error) {
        expect(error).toBeInstanceOf(DirectoryServiceError);
        expect((error as DirectoryServiceError).type).toBe(DirectoryBrowserErrorType.PERMISSION_DENIED);
      }
    });

    it('File System Access APIがサポートされていない場合、適切なエラーをスローする', async () => {
      // showDirectoryPickerを削除してから新しいサービスを作成
      delete (window as any).showDirectoryPicker;
      const unsupportedService = new DirectoryService();

      await expect(unsupportedService.selectDirectory()).rejects.toThrow(DirectoryServiceError);
      
      try {
        await unsupportedService.selectDirectory();
      } catch (error) {
        expect(error).toBeInstanceOf(DirectoryServiceError);
        expect((error as DirectoryServiceError).type).toBe(DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED);
      }
    });

    it('その他のエラーが発生した場合、適切なエラーをスローする', async () => {
      // 一般的なエラーをスロー
      const genericError = new Error('Generic error');
      mockShowDirectoryPicker.mockRejectedValue(genericError);

      await expect(directoryService.selectDirectory()).rejects.toThrow(DirectoryServiceError);
      
      try {
        await directoryService.selectDirectory();
      } catch (error) {
        expect(error).toBeInstanceOf(DirectoryServiceError);
        expect((error as DirectoryServiceError).type).toBe(DirectoryBrowserErrorType.DIRECTORY_ACCESS_DENIED);
      }
    });
  });

  describe('getImageFiles', () => {
    beforeEach(() => {
      // mockFileHandleのgetFileメソッドを設定
      mockFileHandle.getFile.mockResolvedValue(mockFile);
    });

    it('画像ファイルが正常に取得される', async () => {
      // ディレクトリエントリのモック（画像ファイル1つ）
      const entries = [
        ['test-image.jpg', mockFileHandle]
      ];
      mockDirectoryHandle.entries.mockReturnValue(entries[Symbol.iterator]());

      const result = await directoryService.getImageFiles(mockDirectoryHandle);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'test-image.jpg',
        size: mockFile.size,
        path: 'test-image.jpg'
      });
      expect(result[0].file).toBe(mockFile);
    });

    it('サポートされていないファイル形式は除外される', async () => {
      // 画像ファイルと非画像ファイルのエントリ
      const textFileHandle = { ...mockFileHandle, name: 'document.txt' };
      const entries = [
        ['test-image.jpg', mockFileHandle],
        ['document.txt', textFileHandle]
      ];
      mockDirectoryHandle.entries.mockReturnValue(entries[Symbol.iterator]());

      const result = await directoryService.getImageFiles(mockDirectoryHandle);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-image.jpg');
    });

    it('複数の画像形式がサポートされる', async () => {
      // 異なる形式の画像ファイル
      const pngFile = new File(['png content'], 'image.png', { type: 'image/png' });
      const gifFile = new File(['gif content'], 'image.gif', { type: 'image/gif' });
      const webpFile = new File(['webp content'], 'image.webp', { type: 'image/webp' });

      const pngHandle = { ...mockFileHandle, name: 'image.png', getFile: vi.fn().mockResolvedValue(pngFile) };
      const gifHandle = { ...mockFileHandle, name: 'image.gif', getFile: vi.fn().mockResolvedValue(gifFile) };
      const webpHandle = { ...mockFileHandle, name: 'image.webp', getFile: vi.fn().mockResolvedValue(webpFile) };

      const entries = [
        ['test-image.jpg', mockFileHandle],
        ['image.png', pngHandle],
        ['image.gif', gifHandle],
        ['image.webp', webpHandle]
      ];
      mockDirectoryHandle.entries.mockReturnValue(entries[Symbol.iterator]());

      const result = await directoryService.getImageFiles(mockDirectoryHandle);

      expect(result).toHaveLength(4);
      expect(result.map(f => f.name)).toContain('test-image.jpg');
      expect(result.map(f => f.name)).toContain('image.png');
      expect(result.map(f => f.name)).toContain('image.gif');
      expect(result.map(f => f.name)).toContain('image.webp');
    });

    it('ファイルが作成日降順でソートされる', async () => {
      // 異なる作成日のファイル
      const oldFile = new File(['old'], 'old.jpg', { lastModified: 1000 });
      const newFile = new File(['new'], 'new.jpg', { lastModified: 2000 });

      const oldHandle = { ...mockFileHandle, name: 'old.jpg', getFile: vi.fn().mockResolvedValue(oldFile) };
      const newHandle = { ...mockFileHandle, name: 'new.jpg', getFile: vi.fn().mockResolvedValue(newFile) };

      const entries = [
        ['old.jpg', oldHandle],
        ['new.jpg', newHandle]
      ];
      mockDirectoryHandle.entries.mockReturnValue(entries[Symbol.iterator]());

      const result = await directoryService.getImageFiles(mockDirectoryHandle);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('new.jpg'); // 新しいファイルが最初
      expect(result[1].name).toBe('old.jpg'); // 古いファイルが後
    });

    it('サブディレクトリも再帰的にスキャンされる', async () => {
      // サブディレクトリのモック
      const subDirHandle = {
        ...mockDirectoryHandle,
        name: 'subdir',
        entries: vi.fn().mockReturnValue([
          ['sub-image.jpg', mockFileHandle]
        ][Symbol.iterator]())
      };

      const entries = [
        ['test-image.jpg', mockFileHandle],
        ['subdir', subDirHandle]
      ];
      mockDirectoryHandle.entries.mockReturnValue(entries[Symbol.iterator]());

      const result = await directoryService.getImageFiles(mockDirectoryHandle);

      expect(result).toHaveLength(2);
      expect(result.map(f => f.path)).toContain('test-image.jpg');
      expect(result.map(f => f.path)).toContain('subdir/sub-image.jpg');
    });

    it('ファイルアクセスエラーが発生した場合、適切なエラーをスローする', async () => {
      // ディレクトリエントリの取得でエラー
      mockDirectoryHandle.entries.mockImplementation(async function* () {
        throw new Error('Access denied');
      });

      await expect(directoryService.getImageFiles(mockDirectoryHandle)).rejects.toThrow(DirectoryServiceError);
      
      try {
        await directoryService.getImageFiles(mockDirectoryHandle);
      } catch (error) {
        expect(error).toBeInstanceOf(DirectoryServiceError);
        expect((error as DirectoryServiceError).type).toBe(DirectoryBrowserErrorType.FILE_SCAN_FAILED);
      }
    });

    it('個別ファイルのエラーはスキップして続行する', async () => {
      // 1つのファイルでエラー、もう1つは正常
      const errorHandle = { ...mockFileHandle, name: 'error.jpg', getFile: vi.fn().mockRejectedValue(new Error('File error')) };
      
      const entries = [
        ['test-image.jpg', mockFileHandle],
        ['error.jpg', errorHandle]
      ];
      mockDirectoryHandle.entries.mockReturnValue(entries[Symbol.iterator]());

      const result = await directoryService.getImageFiles(mockDirectoryHandle);

      // エラーファイルはスキップされ、正常なファイルのみ返される
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-image.jpg');
    });
  });

  describe('watchDirectory', () => {
    it('現在はサポートされていないエラーをスローする', () => {
      const callback = vi.fn();
      
      expect(() => {
        directoryService.watchDirectory('/test/path', callback);
      }).toThrow(DirectoryServiceError);
      
      try {
        directoryService.watchDirectory('/test/path', callback);
      } catch (error) {
        expect(error).toBeInstanceOf(DirectoryServiceError);
        expect((error as DirectoryServiceError).type).toBe(DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED);
      }
    });
  });

  describe('unwatchDirectory', () => {
    it('現在はサポートされていないエラーをスローする', () => {
      expect(() => {
        directoryService.unwatchDirectory('/test/path');
      }).toThrow(DirectoryServiceError);
      
      try {
        directoryService.unwatchDirectory('/test/path');
      } catch (error) {
        expect(error).toBeInstanceOf(DirectoryServiceError);
        expect((error as DirectoryServiceError).type).toBe(DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED);
      }
    });
  });

  describe('getCurrentDirectoryHandle', () => {
    it('ディレクトリが選択されていない場合はnullを返す', () => {
      const service = new DirectoryService();
      expect(service.getCurrentDirectoryHandle()).toBeNull();
    });

    it('ディレクトリが選択された後はハンドルを返す', async () => {
      mockShowDirectoryPicker.mockResolvedValue(mockDirectoryHandle);
      
      await directoryService.selectDirectory();
      
      const service = directoryService as DirectoryService;
      expect(service.getCurrentDirectoryHandle()).toBe(mockDirectoryHandle);
    });
  });
});

describe('DirectoryServiceError', () => {
  it('適切なプロパティでエラーが作成される', () => {
    const originalError = new Error('Original error');
    const error = new DirectoryServiceError(
      DirectoryBrowserErrorType.PERMISSION_DENIED,
      'Test error message',
      originalError
    );

    expect(error.name).toBe('DirectoryServiceError');
    expect(error.message).toBe('Test error message');
    expect(error.type).toBe(DirectoryBrowserErrorType.PERMISSION_DENIED);
    expect(error.originalError).toBe(originalError);
  });

  it('originalErrorなしでもエラーが作成される', () => {
    const error = new DirectoryServiceError(
      DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED,
      'Test error message'
    );

    expect(error.name).toBe('DirectoryServiceError');
    expect(error.message).toBe('Test error message');
    expect(error.type).toBe(DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED);
    expect(error.originalError).toBeUndefined();
  });
});