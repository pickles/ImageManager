import { describe, it, expect } from 'vitest';
import {
  validateImageMetadata,
  validateImageDisplayState,
  validateFileName,
  validateFileSize,
  validateImageDimensions,
  validateFileType,
  validateDate,
  createValidatedImageMetadata,
  createValidatedImageDisplayState
} from '../validation';
import { ImageMetadata, ImageDisplayState } from '../../types/image';

describe('validation', () => {
  describe('validateImageMetadata', () => {
    it('should validate correct ImageMetadata', () => {
      const validMetadata: ImageMetadata = {
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date()
      };

      expect(validateImageMetadata(validMetadata)).toBe(true);
    });

    it('should reject invalid fileName', () => {
      const invalidMetadata = {
        fileName: '',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date()
      };

      expect(validateImageMetadata(invalidMetadata)).toBe(false);
    });

    it('should reject negative fileSize', () => {
      const invalidMetadata = {
        fileName: 'test.jpg',
        fileSize: -1,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date()
      };

      expect(validateImageMetadata(invalidMetadata)).toBe(false);
    });

    it('should reject zero or negative dimensions', () => {
      const invalidMetadata = {
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 0,
        height: 600,
        lastModified: new Date()
      };

      expect(validateImageMetadata(invalidMetadata)).toBe(false);
    });

    it('should reject invalid date', () => {
      const invalidMetadata = {
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date('invalid')
      };

      expect(validateImageMetadata(invalidMetadata)).toBe(false);
    });
  });

  describe('validateImageDisplayState', () => {
    it('should validate correct ImageDisplayState', () => {
      const validState: ImageDisplayState = {
        selectedFile: null,
        imageUrl: null,
        metadata: null,
        isLoading: false,
        error: null
      };

      expect(validateImageDisplayState(validState)).toBe(true);
    });

    it('should validate state with valid metadata', () => {
      const validMetadata: ImageMetadata = {
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date()
      };

      const validState: ImageDisplayState = {
        selectedFile: new File([''], 'test.jpg'),
        imageUrl: 'blob:test',
        metadata: validMetadata,
        isLoading: true,
        error: 'Test error'
      };

      expect(validateImageDisplayState(validState)).toBe(true);
    });

    it('should reject state with invalid metadata', () => {
      const invalidState = {
        selectedFile: null,
        imageUrl: null,
        metadata: { fileName: '' }, // invalid metadata
        isLoading: false,
        error: null
      };

      expect(validateImageDisplayState(invalidState)).toBe(false);
    });
  });

  describe('validateFileName', () => {
    it('should accept valid file names', () => {
      expect(validateFileName('test.jpg')).toBe(true);
      expect(validateFileName('image_001.png')).toBe(true);
      expect(validateFileName('photo-2023.gif')).toBe(true);
    });

    it('should reject empty or invalid file names', () => {
      expect(validateFileName('')).toBe(false);
      expect(validateFileName('test<>.jpg')).toBe(false);
      expect(validateFileName('test|file.png')).toBe(false);
      expect(validateFileName('test/file.jpg')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept valid file sizes', () => {
      expect(validateFileSize(1024)).toBe(true);
      expect(validateFileSize(0)).toBe(true);
      expect(validateFileSize(50 * 1024 * 1024)).toBe(true); // 50MB
    });

    it('should reject invalid file sizes', () => {
      expect(validateFileSize(-1)).toBe(false);
      expect(validateFileSize(51 * 1024 * 1024)).toBe(false); // > 50MB
    });

    it('should respect custom max size', () => {
      expect(validateFileSize(2048, 1024)).toBe(false);
      expect(validateFileSize(512, 1024)).toBe(true);
    });
  });

  describe('validateImageDimensions', () => {
    it('should accept valid dimensions', () => {
      expect(validateImageDimensions(800, 600)).toBe(true);
      expect(validateImageDimensions(1920, 1080)).toBe(true);
      expect(validateImageDimensions(7680, 4320)).toBe(true); // 8K
    });

    it('should reject invalid dimensions', () => {
      expect(validateImageDimensions(0, 600)).toBe(false);
      expect(validateImageDimensions(800, 0)).toBe(false);
      expect(validateImageDimensions(-800, 600)).toBe(false);
      expect(validateImageDimensions(8000, 4320)).toBe(false); // > 8K width
    });

    it('should respect custom max dimensions', () => {
      expect(validateImageDimensions(2000, 1000, 1920, 1080)).toBe(false);
      expect(validateImageDimensions(1800, 900, 1920, 1080)).toBe(true);
    });
  });

  describe('validateFileType', () => {
    it('should validate supported file types', () => {
      expect(validateFileType('image/jpeg')).toEqual({ isValid: true, isSupported: true });
      expect(validateFileType('image/png')).toEqual({ isValid: true, isSupported: true });
      expect(validateFileType('image/gif')).toEqual({ isValid: true, isSupported: true });
      expect(validateFileType('image/webp')).toEqual({ isValid: true, isSupported: true });
    });

    it('should handle unsupported but valid file types', () => {
      expect(validateFileType('image/bmp')).toEqual({ isValid: true, isSupported: false });
      expect(validateFileType('image/tiff')).toEqual({ isValid: true, isSupported: false });
    });

    it('should reject invalid file types', () => {
      expect(validateFileType('')).toEqual({ isValid: false, isSupported: false });
      expect(validateFileType('not-a-mime-type')).toEqual({ isValid: true, isSupported: false });
    });
  });

  describe('validateDate', () => {
    it('should accept valid dates', () => {
      expect(validateDate(new Date())).toBe(true);
      expect(validateDate(new Date('2023-01-01'))).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate(new Date('invalid'))).toBe(false);
    });
  });

  describe('createValidatedImageMetadata', () => {
    it('should create valid metadata', () => {
      const data: ImageMetadata = {
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date()
      };

      const result = createValidatedImageMetadata(data);
      expect(result).toEqual(data);
    });

    it('should return null for invalid metadata', () => {
      const invalidData = {
        fileName: '',
        fileSize: 1024,
        fileType: 'image/jpeg',
        width: 800,
        height: 600,
        lastModified: new Date()
      };

      const result = createValidatedImageMetadata(invalidData);
      expect(result).toBeNull();
    });
  });

  describe('createValidatedImageDisplayState', () => {
    it('should create valid state', () => {
      const data: ImageDisplayState = {
        selectedFile: null,
        imageUrl: null,
        metadata: null,
        isLoading: false,
        error: null
      };

      const result = createValidatedImageDisplayState(data);
      expect(result).toEqual(data);
    });

    it('should return null for invalid state', () => {
      const invalidData = {
        selectedFile: null,
        imageUrl: null,
        metadata: { fileName: '' }, // invalid metadata
        isLoading: false,
        error: null
      };

      const result = createValidatedImageDisplayState(invalidData);
      expect(result).toBeNull();
    });
  });
});