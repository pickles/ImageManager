import '@testing-library/jest-dom';
import { vi } from 'vitest';

// グローバルなテスト設定
// File APIのモック
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Image コンストラクタのモック
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 0;
  height: number = 0;

  constructor() {
    setTimeout(() => {
      this.width = 800;
      this.height = 600;
      if (this.onload) {
        this.onload();
      }
    }, 100);
  }
} as any;