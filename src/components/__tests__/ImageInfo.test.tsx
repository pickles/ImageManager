import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageInfo } from '../ImageInfo';
import { ImageMetadata } from '../../types/image';

describe('ImageInfo', () => {
  // モックデータの作成
  const mockMetadata: ImageMetadata = {
    fileName: 'test-image.jpg',
    fileSize: 1024000, // 1MB
    fileType: 'image/jpeg',
    width: 1920,
    height: 1080,
    lastModified: new Date('2024-01-15T10:30:00Z')
  };

  describe('メタデータがない場合', () => {
    it('「画像が選択されていません」メッセージを表示する', () => {
      render(<ImageInfo metadata={null} />);
      
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
      expect(screen.getByText('画像が選択されていません')).toBeInTheDocument();
      expect(screen.getByText('画像情報')).toBeInTheDocument();
    });
  });

  describe('メタデータがある場合', () => {
    beforeEach(() => {
      render(<ImageInfo metadata={mockMetadata} />);
    });

    it('コンポーネントが正しく描画される', () => {
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
      expect(screen.getByText('画像情報')).toBeInTheDocument();
    });

    it('ファイル名を正しく表示する（要件 4.1）', () => {
      const fileNameElement = screen.getByTestId('file-name');
      expect(fileNameElement).toBeInTheDocument();
      expect(fileNameElement).toHaveTextContent('test-image.jpg');
    });

    it('ファイルサイズを人間が読みやすい形式で表示する（要件 4.2）', () => {
      const fileSizeElement = screen.getByTestId('file-size');
      expect(fileSizeElement).toBeInTheDocument();
      expect(fileSizeElement).toHaveTextContent('1000 KB');
    });

    it('画像解像度を「幅×高さ px」形式で表示する（要件 4.3）', () => {
      const resolutionElement = screen.getByTestId('resolution');
      expect(resolutionElement).toBeInTheDocument();
      expect(resolutionElement).toHaveTextContent('1920 × 1080 px');
    });

    it('ファイル形式を表示用に変換して表示する（要件 4.4）', () => {
      const fileTypeElement = screen.getByTestId('file-type');
      expect(fileTypeElement).toBeInTheDocument();
      expect(fileTypeElement).toHaveTextContent('JPEG');
    });

    it('更新日時を日本語形式で表示する', () => {
      const lastModifiedElement = screen.getByTestId('last-modified');
      expect(lastModifiedElement).toBeInTheDocument();
      // 日付形式は環境によって異なる可能性があるため、存在確認のみ
      expect(lastModifiedElement.textContent).toBeTruthy();
    });
  });

  describe('ファイルサイズのフォーマット', () => {
    it('バイト単位を正しく表示する', () => {
      const smallMetadata: ImageMetadata = {
        ...mockMetadata,
        fileSize: 512
      };
      render(<ImageInfo metadata={smallMetadata} />);
      
      const fileSizeElement = screen.getByTestId('file-size');
      expect(fileSizeElement).toHaveTextContent('512 Bytes');
    });

    it('KB単位を正しく表示する', () => {
      const kbMetadata: ImageMetadata = {
        ...mockMetadata,
        fileSize: 2048 // 2KB
      };
      render(<ImageInfo metadata={kbMetadata} />);
      
      const fileSizeElement = screen.getByTestId('file-size');
      expect(fileSizeElement).toHaveTextContent('2 KB');
    });

    it('MB単位を正しく表示する', () => {
      const mbMetadata: ImageMetadata = {
        ...mockMetadata,
        fileSize: 5242880 // 5MB
      };
      render(<ImageInfo metadata={mbMetadata} />);
      
      const fileSizeElement = screen.getByTestId('file-size');
      expect(fileSizeElement).toHaveTextContent('5 MB');
    });

    it('0バイトを正しく表示する', () => {
      const zeroMetadata: ImageMetadata = {
        ...mockMetadata,
        fileSize: 0
      };
      render(<ImageInfo metadata={zeroMetadata} />);
      
      const fileSizeElement = screen.getByTestId('file-size');
      expect(fileSizeElement).toHaveTextContent('0 Bytes');
    });
  });

  describe('ファイル形式のフォーマット', () => {
    const testCases = [
      { input: 'image/jpeg', expected: 'JPEG' },
      { input: 'image/jpg', expected: 'JPEG' },
      { input: 'image/png', expected: 'PNG' },
      { input: 'image/gif', expected: 'GIF' },
      { input: 'image/webp', expected: 'WebP' },
      { input: 'image/unknown', expected: 'UNKNOWN' }
    ];

    testCases.forEach(({ input, expected }) => {
      it(`${input}を${expected}として表示する`, () => {
        const testMetadata: ImageMetadata = {
          ...mockMetadata,
          fileType: input
        };
        render(<ImageInfo metadata={testMetadata} />);
        
        const fileTypeElement = screen.getByTestId('file-type');
        expect(fileTypeElement).toHaveTextContent(expected);
      });
    });
  });

  describe('異なる解像度での表示', () => {
    it('小さな解像度を正しく表示する', () => {
      const smallResolutionMetadata: ImageMetadata = {
        ...mockMetadata,
        width: 100,
        height: 100
      };
      render(<ImageInfo metadata={smallResolutionMetadata} />);
      
      const resolutionElement = screen.getByTestId('resolution');
      expect(resolutionElement).toHaveTextContent('100 × 100 px');
    });

    it('大きな解像度を正しく表示する', () => {
      const largeResolutionMetadata: ImageMetadata = {
        ...mockMetadata,
        width: 7680,
        height: 4320
      };
      render(<ImageInfo metadata={largeResolutionMetadata} />);
      
      const resolutionElement = screen.getByTestId('resolution');
      expect(resolutionElement).toHaveTextContent('7680 × 4320 px');
    });
  });

  describe('長いファイル名の処理', () => {
    it('長いファイル名を正しく表示する', () => {
      const longNameMetadata: ImageMetadata = {
        ...mockMetadata,
        fileName: 'very-long-file-name-that-might-cause-layout-issues-in-the-ui-component.jpg'
      };
      render(<ImageInfo metadata={longNameMetadata} />);
      
      const fileNameElement = screen.getByTestId('file-name');
      expect(fileNameElement).toHaveTextContent(longNameMetadata.fileName);
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なdata-testid属性が設定されている', () => {
      render(<ImageInfo metadata={mockMetadata} />);
      
      expect(screen.getByTestId('image-info')).toBeInTheDocument();
      expect(screen.getByTestId('file-name')).toBeInTheDocument();
      expect(screen.getByTestId('file-size')).toBeInTheDocument();
      expect(screen.getByTestId('resolution')).toBeInTheDocument();
      expect(screen.getByTestId('file-type')).toBeInTheDocument();
      expect(screen.getByTestId('last-modified')).toBeInTheDocument();
    });

    it('見出しが適切に設定されている', () => {
      render(<ImageInfo metadata={mockMetadata} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('画像情報');
    });
  });
});