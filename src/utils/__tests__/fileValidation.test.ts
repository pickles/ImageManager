import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateImageFormat,
  validateFileSize,
  validateFileName,
  validateImageDimensions,
  validateImageFile,
  validateMultipleImageFiles,
  isSupportedImageFormat,
  getMimeTypeFromExtension,
  formatFileSize,
  MAX_FILE_SIZE,
  MAX_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT
} from '../fileValidation';
import { ImageErrorType } from '../../types/image';

// Mock Image constructor for testing
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  
  set src(value: string) {
    // Simulate async loading
    setTimeout(() => {
      if (value.includes('valid')) {
        this.naturalWidth = 800;
        this.naturalHeight = 600;
        this.onload?.();
      } else if (value.includes('large')) {
        this.naturalWidth = 8000;
        this.naturalHeight = 5000;
        this.onload?.();
      } else if (value.includes('error')) {
        this.onerror?.();
      } else {
        this.naturalWidth = 800;
        this.naturalHeight = 600;
        this.onload?.();
      }
    }, 10);
  }
}

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  // @ts-ignore
  global.Image = MockImage;
  global.URL = {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
  } as any;
  
  mockCreateObjectURL.mockImplementation((file: File) => {
    if (file.name.includes('error')) return 'blob:error';
    if (file.name.includes('large')) return 'blob:large';
    return 'blob:valid';
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('fileValidation', () => {
  describe('validateImageFormat', () => {
    it('should accept supported image formats', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });

      expect(validateImageFormat(jpegFile)).toEqual({ isValid: true });
      expect(validateImageFormat(pngFile)).toEqual({ isValid: true });
      expect(validateImageFormat(gifFile)).toEqual({ isValid: true });
      expect(validateImageFormat(webpFile)).toEqual({ isValid: true });
    });

    it('should reject unsupported formats', () => {
      const bmpFile = new File([''], 'test.bmp', { type: 'image/bmp' });
      const result = validateImageFormat(bmpFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.UNSUPPORTED_FORMAT);
      expect(result.errorMessage).toContain('サポートされていない形式');
    });

    it('should reject files without type', () => {
      const noTypeFile = new File([''], 'test.unknown', { type: '' });
      const result = validateImageFormat(noTypeFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.UNSUPPORTED_FORMAT);
      expect(result.errorMessage).toContain('ファイル形式を特定できません');
    });
  });

  describe('validateFileSize', () => {
    it('should accept valid file sizes', () => {
      const smallFile = new File(['x'.repeat(1024)], 'small.jpg', { type: 'image/jpeg' });
      const mediumFile = new File(['x'.repeat(1024 * 1024)], 'medium.jpg', { type: 'image/jpeg' });

      expect(validateFileSize(smallFile)).toEqual({ isValid: true });
      expect(validateFileSize(mediumFile)).toEqual({ isValid: true });
    });

    it('should reject empty files', () => {
      const emptyFile = new File([''], 'empty.jpg', { type: 'image/jpeg' });
      const result = validateFileSize(emptyFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.FILE_NOT_FOUND);
      expect(result.errorMessage).toContain('ファイルが空です');
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(MAX_FILE_SIZE + 1)], 'large.jpg', { type: 'image/jpeg' });
      const result = validateFileSize(largeFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.MEMORY_ERROR);
      expect(result.errorMessage).toContain('ファイルサイズが大きすぎます');
    });

    it('should respect custom max size', () => {
      const file = new File(['x'.repeat(2048)], 'test.jpg', { type: 'image/jpeg' });
      
      expect(validateFileSize(file, 1024).isValid).toBe(false);
      expect(validateFileSize(file, 4096).isValid).toBe(true);
    });
  });

  describe('validateFileName', () => {
    it('should accept valid file names', () => {
      const validFile = new File([''], 'test-image_001.jpg', { type: 'image/jpeg' });
      expect(validateFileName(validFile)).toEqual({ isValid: true });
    });

    it('should reject empty file names', () => {
      const emptyNameFile = new File([''], '', { type: 'image/jpeg' });
      const result = validateFileName(emptyNameFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.FILE_NOT_FOUND);
    });

    it('should reject file names with invalid characters', () => {
      const invalidFile = new File([''], 'test<>file.jpg', { type: 'image/jpeg' });
      const result = validateFileName(invalidFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.PROCESSING_ERROR);
      expect(result.errorMessage).toContain('使用できない文字');
    });
  });

  describe('validateImageDimensions', () => {
    it('should accept valid image dimensions', async () => {
      const validFile = new File([''], 'valid.jpg', { type: 'image/jpeg' });
      const result = await validateImageDimensions(validFile);

      expect(result.isValid).toBe(true);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(validFile);
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should reject images that are too large', async () => {
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      const result = await validateImageDimensions(largeFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.MEMORY_ERROR);
      expect(result.errorMessage).toContain('画像解像度が大きすぎます');
    });

    it('should handle image load errors', async () => {
      const errorFile = new File([''], 'error.jpg', { type: 'image/jpeg' });
      const result = await validateImageDimensions(errorFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.LOAD_FAILED);
      expect(result.errorMessage).toContain('破損しているか、読み込めません');
    });
  });

  describe('validateImageFile', () => {
    it('should perform comprehensive validation', async () => {
      const validFile = new File(['x'.repeat(1024)], 'valid.jpg', { type: 'image/jpeg' });
      const result = await validateImageFile(validFile);

      expect(result.isValid).toBe(true);
    });

    it('should fail on first validation error', async () => {
      const invalidFile = new File([''], '', { type: 'image/jpeg' });
      const result = await validateImageFile(invalidFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.FILE_NOT_FOUND);
    });

    it('should validate all aspects in sequence', async () => {
      const largeFile = new File(['x'.repeat(1024)], 'large.jpg', { type: 'image/jpeg' });
      const result = await validateImageFile(largeFile);

      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe(ImageErrorType.MEMORY_ERROR);
    });
  });

  describe('validateMultipleImageFiles', () => {
    it('should validate multiple files', async () => {
      const file1 = new File(['x'.repeat(1024)], 'valid1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['x'.repeat(1024)], 'valid2.png', { type: 'image/png' });
      
      const results = await validateMultipleImageFiles([file1, file2]);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
    });

    it('should handle mixed valid and invalid files', async () => {
      const validFile = new File(['x'.repeat(1024)], 'valid.jpg', { type: 'image/jpeg' });
      const invalidFile = new File([''], 'invalid.bmp', { type: 'image/bmp' });
      
      const results = await validateMultipleImageFiles([validFile, invalidFile]);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });
  });

  describe('isSupportedImageFormat', () => {
    it('should identify supported formats', () => {
      expect(isSupportedImageFormat('image/jpeg')).toBe(true);
      expect(isSupportedImageFormat('image/png')).toBe(true);
      expect(isSupportedImageFormat('image/gif')).toBe(true);
      expect(isSupportedImageFormat('image/webp')).toBe(true);
    });

    it('should reject unsupported formats', () => {
      expect(isSupportedImageFormat('image/bmp')).toBe(false);
      expect(isSupportedImageFormat('image/tiff')).toBe(false);
      expect(isSupportedImageFormat('text/plain')).toBe(false);
    });
  });

  describe('getMimeTypeFromExtension', () => {
    it('should return correct MIME types for supported extensions', () => {
      expect(getMimeTypeFromExtension('test.jpg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('test.jpeg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('test.png')).toBe('image/png');
      expect(getMimeTypeFromExtension('test.gif')).toBe('image/gif');
      expect(getMimeTypeFromExtension('test.webp')).toBe('image/webp');
    });

    it('should handle case insensitive extensions', () => {
      expect(getMimeTypeFromExtension('test.JPG')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('test.PNG')).toBe('image/png');
    });

    it('should return null for unsupported extensions', () => {
      expect(getMimeTypeFromExtension('test.bmp')).toBeNull();
      expect(getMimeTypeFromExtension('test.txt')).toBeNull();
      expect(getMimeTypeFromExtension('test')).toBeNull();
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });
  });
});