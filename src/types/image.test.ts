import { describe, it, expect } from 'vitest';
import { SUPPORTED_IMAGE_FORMATS, ImageErrorType } from './image';

describe('Image Types', () => {
  it('should have correct supported image formats', () => {
    expect(SUPPORTED_IMAGE_FORMATS).toContain('image/jpeg');
    expect(SUPPORTED_IMAGE_FORMATS).toContain('image/png');
    expect(SUPPORTED_IMAGE_FORMATS).toContain('image/gif');
    expect(SUPPORTED_IMAGE_FORMATS).toContain('image/webp');
  });

  it('should have all required error types', () => {
    expect(ImageErrorType.UNSUPPORTED_FORMAT).toBe('UNSUPPORTED_FORMAT');
    expect(ImageErrorType.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
    expect(ImageErrorType.LOAD_FAILED).toBe('LOAD_FAILED');
    expect(ImageErrorType.PROCESSING_ERROR).toBe('PROCESSING_ERROR');
    expect(ImageErrorType.MEMORY_ERROR).toBe('MEMORY_ERROR');
  });
});