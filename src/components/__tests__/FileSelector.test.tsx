// import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSelector } from '../FileSelector';
// import { SUPPORTED_IMAGE_FORMATS } from '../../types/image';

// モックファイルの作成ヘルパー
const createMockFile = (
  name: string,
  type: string,
  size: number = 1024
): File => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileSelector', () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
  });

  describe('基本的な描画', () => {
    it('正常に描画される', () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      expect(screen.getByText('画像ファイルを選択')).toBeInTheDocument();
      expect(screen.getByText('クリックして選択するか、ここにドラッグ&ドロップ')).toBeInTheDocument();
      expect(screen.getByText(/対応形式: JPEG, PNG, GIF, WebP/)).toBeInTheDocument();
    });

    it('ファイル入力要素が存在する', () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const fileInput = screen.getByRole('button', { hidden: true });
      expect(fileInput).toBeInTheDocument();
    });

    it('アクセシビリティ属性が正しく設定されている', () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveAttribute('aria-label', '画像ファイルを選択またはドラッグ&ドロップ');
      expect(dropZone).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('ファイル選択機能', () => {
    it('有効なJPEGファイルが選択されたときにコールバックが呼ばれる', async () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const file = createMockFile('test.jpg', 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it('有効なPNGファイルが選択されたときにコールバックが呼ばれる', async () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const file = createMockFile('test.png', 'image/png');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it('サポートされていないファイル形式でエラーが表示される', async () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const file = createMockFile('test.txt', 'text/plain');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText(/サポートされていないファイル形式です/)).toBeInTheDocument();
        expect(mockOnFileSelect).not.toHaveBeenCalled();
      });
    });

    it('ファイルサイズが大きすぎる場合にエラーが表示される', async () => {
      const maxSize = 1024; // 1KB
      render(<FileSelector onFileSelect={mockOnFileSelect} maxFileSize={maxSize} />);
      
      const file = createMockFile('large.jpg', 'image/jpeg', 2048); // 2KB
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText(/ファイルサイズが大きすぎます/)).toBeInTheDocument();
        expect(mockOnFileSelect).not.toHaveBeenCalled();
      });
    });
  });

  describe('ドラッグ&ドロップ機能', () => {
    it('ドラッグオーバー時にスタイルが変更される', () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const dropZone = screen.getByRole('button');
      
      fireEvent.dragOver(dropZone);
      
      expect(dropZone).toHaveClass('file-selector__drop-zone--drag-over');
      expect(screen.getByText('ファイルをドロップしてください')).toBeInTheDocument();
    });

    it('ドラッグリーブ時にスタイルが元に戻る', () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const dropZone = screen.getByRole('button');
      
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);
      
      expect(dropZone).not.toHaveClass('file-selector__drop-zone--drag-over');
      expect(screen.getByText('画像ファイルを選択')).toBeInTheDocument();
    });

    it('有効なファイルがドロップされたときにコールバックが呼ばれる', async () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const file = createMockFile('dropped.jpg', 'image/jpeg');
      const dropZone = screen.getByRole('button');
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it('無効なファイルがドロップされたときにエラーが表示される', async () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const file = createMockFile('invalid.txt', 'text/plain');
      const dropZone = screen.getByRole('button');
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/サポートされていないファイル形式です/)).toBeInTheDocument();
        expect(mockOnFileSelect).not.toHaveBeenCalled();
      });
    });
  });

  describe('無効状態', () => {
    it('disabled=trueの時に適切なスタイルが適用される', () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} disabled={true} />);
      
      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveClass('file-selector__drop-zone--disabled');
      expect(dropZone).toHaveAttribute('tabIndex', '-1');
    });

    it('disabled=trueの時にドラッグオーバーが無効になる', () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} disabled={true} />);
      
      const dropZone = screen.getByRole('button');
      
      fireEvent.dragOver(dropZone);
      
      expect(dropZone).not.toHaveClass('file-selector__drop-zone--drag-over');
    });

    it('disabled=trueの時にファイルドロップが無効になる', async () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} disabled={true} />);
      
      const file = createMockFile('test.jpg', 'image/jpeg');
      const dropZone = screen.getByRole('button');
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(mockOnFileSelect).not.toHaveBeenCalled();
      });
    });
  });

  describe('カスタムプロパティ', () => {
    it('カスタムacceptedFormatsが適用される', async () => {
      const customFormats = ['image/jpeg'];
      render(
        <FileSelector 
          onFileSelect={mockOnFileSelect} 
          acceptedFormats={customFormats}
        />
      );
      
      const pngFile = createMockFile('test.png', 'image/png');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [pngFile] } });
      
      await waitFor(() => {
        expect(screen.getByText(/サポートされていないファイル形式です/)).toBeInTheDocument();
        expect(mockOnFileSelect).not.toHaveBeenCalled();
      });
    });

    it('カスタムmaxFileSizeが適用される', () => {
      const customMaxSize = 2 * 1024 * 1024; // 2MB
      render(
        <FileSelector 
          onFileSelect={mockOnFileSelect} 
          maxFileSize={customMaxSize}
        />
      );
      
      const formatText = document.querySelector('.file-selector__format-text');
      expect(formatText?.textContent).toContain('最大2MB');
    });
  });

  describe('エラーハンドリング', () => {
    it('エラーメッセージが適切なrole属性を持つ', async () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const file = createMockFile('test.txt', 'text/plain');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent(/サポートされていないファイル形式です/);
      });
    });

    it('新しいファイルが選択されるとエラーがクリアされる', async () => {
      render(<FileSelector onFileSelect={mockOnFileSelect} />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // 無効なファイルを選択してエラーを表示
      const invalidFile = createMockFile('test.txt', 'text/plain');
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(screen.getByText(/サポートされていないファイル形式です/)).toBeInTheDocument();
      });
      
      // 有効なファイルを選択してエラーをクリア
      const validFile = createMockFile('test.jpg', 'image/jpeg');
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(screen.queryByText(/サポートされていないファイル形式です/)).not.toBeInTheDocument();
        expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);
      });
    });
  });
});